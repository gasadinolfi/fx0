import { DESIGN_ARTIFACT_EMBEDDED_CSP, prepareDesignArtifactHtml } from '../lib/design-artifact'
import { validSocialSize, type SocialSize } from '../lib/social-formats'

export type ImageFormat = 'png' | 'jpg'
export interface DesignImage { blob: Blob; width: number; height: number }
export interface ImageExportOptions { size?: SocialSize }

// Render only inside an opaque origin. Brand HTML never runs in the application DOM.
export async function renderDesignImages(html: string, format: ImageFormat, options: ImageExportOptions = {}): Promise<DesignImage[]> {
  if (format !== 'png' && format !== 'jpg') throw new Error('Formato de imagen inválido.')
  if (options.size && !validSocialSize(options.size)) throw new Error('Medidas de exportación inválidas.')
  const response = await fetch('/api/image-renderer')
  if (!response.ok) throw new Error('No se pudo cargar el exportador de imágenes.')
  const renderer = await response.text()
  const frame = document.createElement('iframe')
  // The data URL stays opaque; allow-same-origin lets the renderer access its own clone.
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin')
  frame.referrerPolicy = 'no-referrer'
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = `position:fixed;left:-20000px;top:0;width:${options.size?.width ?? 1080}px;height:${options.size?.height ?? 1080}px;border:0;pointer-events:none`
  const token = crypto.randomUUID(), mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
  const script = `${renderer.replace(/<\/script/gi, '<\\/script')}
;addEventListener('load',async()=>{
  const token=${JSON.stringify(token)}, mime=${JSON.stringify(mime)}, target=${JSON.stringify(options.size ?? null)};
  try {
    const frozen=document.createElement('style');frozen.textContent='*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';document.head.append(frozen);
    await document.fonts.ready;
    await Promise.all(Array.from(document.images,image=>image.decode().catch(()=>{})));
    await new Promise(resolve=>setTimeout(resolve,100));
    const marked=Array.from(document.querySelectorAll('[data-social-piece]')).filter(el=>!el.parentElement?.closest('[data-social-piece]')&&el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0);
    const pieces=marked.length?marked:[document.body];
    if(pieces.length>20)throw new Error('Exportá hasta 20 placas por descarga.');
    const images=[];let pixels=0;
    for(const root of pieces){
      const isPiece=root.hasAttribute('data-social-piece');
      const nativeWidth=Number(root.getAttribute('data-social-width')),nativeHeight=Number(root.getAttribute('data-social-height'));
      const nativeSize=Number.isSafeInteger(nativeWidth)&&Number.isSafeInteger(nativeHeight)&&nativeWidth>=64&&nativeHeight>=64&&nativeWidth<=4096&&nativeHeight<=4096&&nativeWidth*nativeHeight<=16000000?{width:nativeWidth,height:nativeHeight}:null;
      if(isPiece){
        for(let element=root;element;element=element.parentElement){element.style.transform='none';element.style.zoom='1';element.style.overflow='visible';}
        if(nativeSize){root.style.width=nativeSize.width+'px';root.style.height=nativeSize.height+'px';root.style.boxSizing='border-box';root.style.maxWidth='none';root.style.maxHeight='none';root.style.flexShrink='0';}
      }
      const box=root.getBoundingClientRect();
      const width=Math.ceil(Math.max(box.width,root.scrollWidth)),height=Math.ceil(Math.max(box.height,root.scrollHeight));
      if(width<1||height<1||width>8192||height>8192||width*height>32000000)throw new Error('La pieza es demasiado grande. Adaptá su formato antes de descargar.');
      const output=target||nativeSize||{width,height};pixels+=output.width*output.height;
      if(pixels>64000000)throw new Error('El conjunto supera 64 megapíxeles. Usá una resolución menor.');
      const source=await (html2canvas.default||html2canvas)(root,{width,height,scale:1,backgroundColor:null,logging:false,imageTimeout:10000});
      const canvas=document.createElement('canvas');canvas.width=output.width;canvas.height=output.height;
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('No se pudo preparar la imagen.');
      const background=[getComputedStyle(root).backgroundColor,getComputedStyle(document.body).backgroundColor].find(c=>c&&c!=='transparent'&&c!=='rgba(0, 0, 0, 0)');
      if(background||mime==='image/jpeg'){ctx.fillStyle=background||'#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);}
      const scale=Math.min(canvas.width/source.width,canvas.height/source.height),w=source.width*scale,h=source.height*scale;
      ctx.drawImage(source,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo codificar la imagen.')),mime,.95));
      images.push({blob,width:canvas.width,height:canvas.height});
      source.width=source.height=canvas.width=canvas.height=0;
    }
    parent.postMessage({type:'fx0-design-images',token,images},'*');
  } catch(error){parent.postMessage({type:'fx0-design-images',token,error:String(error)},'*');}
},{once:true});`
  const csp = DESIGN_ARTIFACT_EMBEDDED_CSP.replace("frame-src 'none'", 'frame-src about:')
  const prepared = prepareDesignArtifactHtml(`<!doctype html>${html.replace(/^\s*<!doctype\s+html\s*>/i, '')}`, csp)
  const source = `${prepared}<script>${script}</script>`
  return new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timeout); window.removeEventListener('message', receive); frame.remove() }
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || event.data?.type !== 'fx0-design-images' || event.data.token !== token) return
      cleanup()
      const images: unknown = event.data.images
      if (!Array.isArray(images) || !images.length || images.length > 20 || !images.every(image => image.blob instanceof Blob && image.blob.size > 0 && image.blob.type === mime && Number.isSafeInteger(image.width) && Number.isSafeInteger(image.height))) {
        reject(new Error(typeof event.data.error === 'string' ? event.data.error.slice(0, 200) : 'No se pudieron exportar las placas.'))
      } else resolve(images as DesignImage[])
    }
    const timeout = setTimeout(() => { cleanup(); reject(new Error('La exportación tardó demasiado. Probá con menos placas.')) }, 60000)
    window.addEventListener('message', receive)
    frame.src = `data:text/html;charset=utf-8,${encodeURIComponent(source)}`
    document.body.append(frame)
  })
}

// Compatibility for callers exporting a single document.
export async function renderDesignImage(html: string, format: ImageFormat): Promise<Blob> {
  return (await renderDesignImages(html, format))[0].blob
}
