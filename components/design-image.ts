import { DESIGN_ARTIFACT_EMBEDDED_CSP, prepareDesignArtifactHtml } from '../lib/design-artifact'

export type ImageFormat = 'png' | 'jpg'

// Run both the design and the renderer in an opaque origin, never in the app DOM.
export async function renderDesignImage(html: string, format: ImageFormat): Promise<Blob> {
  const response = await fetch('/api/image-renderer')
  if (!response.ok) throw new Error('Unable to load image renderer')
  const renderer = await response.text()
  const frame = document.createElement('iframe')
  // A data URL keeps an opaque origin even with allow-same-origin. The renderer
  // needs that flag to access its own about:blank clone, never the parent app.
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin')
  frame.referrerPolicy = 'no-referrer'
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;left:-20000px;top:0;width:1080px;height:1080px;border:0;pointer-events:none'
  const token = crypto.randomUUID()
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
  const script = `${renderer.replace(/<\/script/gi, '<\\/script')}
;addEventListener('load',async()=>{
  try {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images,image=>image.decode().catch(()=>{})));
    await new Promise(resolve=>setTimeout(resolve,100));
    const root=document.body;
    const width=Math.max(root.scrollWidth,document.documentElement.scrollWidth);
    const height=Math.max(root.scrollHeight,document.documentElement.scrollHeight);
    if(width>8192||height>8192||width*height>32000000)throw new Error('Design is too large');
    const canvas=await (html2canvas.default||html2canvas)(root,{width,height,scale:1,backgroundColor:${format === 'jpg' ? "'#ffffff'" : 'null'},logging:false,imageTimeout:10000});
    canvas.toBlob(blob=>parent.postMessage({type:'fx0-design-image',token:${JSON.stringify(token)},blob},'*'),${JSON.stringify(mime)},0.95);
  } catch (error) { parent.postMessage({type:'fx0-design-image',token:${JSON.stringify(token)},error:String(error)},'*'); }
},{once:true});`
  // Prepend CSP even for documents without a doctype, before any model-written code.
  const csp = DESIGN_ARTIFACT_EMBEDDED_CSP.replace("frame-src 'none'", 'frame-src about:')
  const prepared = prepareDesignArtifactHtml(`<!doctype html>${html.replace(/^\s*<!doctype\s+html\s*>/i, '')}`, csp)
  const source = `${prepared}<script>${script}</script>`
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout)
      window.removeEventListener('message', receive)
      frame.remove()
    }
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || event.data?.type !== 'fx0-design-image' || event.data.token !== token) return
      const blob = event.data.blob
      cleanup()
      if (blob instanceof Blob && blob.size > 0 && blob.type === mime) resolve(blob)
      else reject(new Error(event.data.error || 'Unable to render design image'))
    }
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Image rendering timed out'))
    }, 30000)
    window.addEventListener('message', receive)
    frame.src = `data:text/html;charset=utf-8,${encodeURIComponent(source)}`
    document.body.append(frame)
  })
}
