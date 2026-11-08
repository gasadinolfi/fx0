import { DESIGN_ARTIFACT_EMBEDDED_CSP, prepareDesignArtifactHtml } from '../lib/design-artifact'
import { validSocialSize, type SocialSize } from '../lib/social-formats'

export interface VideoExportOptions { size?: SocialSize; duration?: number; fps?: number }

export async function renderDesignVideo(html: string, options: VideoExportOptions = {}): Promise<Blob> {
  if (options.size && !validSocialSize(options.size)) throw new Error('Medidas de video inválidas.')
  const duration = options.duration ?? 8, fps = options.fps ?? 30
  if (!Number.isFinite(duration) || duration < 1 || duration > 30) throw new Error('La duración debe estar entre 1 y 30 segundos.')
  if (!Number.isInteger(fps) || fps < 12 || fps > 30) throw new Error('La velocidad debe estar entre 12 y 30 FPS.')
  if (typeof VideoEncoder === 'undefined') throw new Error('Este navegador no permite renderizar MP4. Usá una versión reciente de Chrome, Edge, Firefox o Safari.')

  const [imageResponse, videoResponse] = await Promise.all([fetch('/api/image-renderer'), fetch('/api/video-renderer')])
  if (!imageResponse.ok || !videoResponse.ok) throw new Error('No se pudo cargar el renderizador de video.')
  const [imageRenderer, videoRenderer] = await Promise.all([imageResponse.text(), videoResponse.text()])
  const frame = document.createElement('iframe')
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin')
  frame.referrerPolicy = 'no-referrer'
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = `position:fixed;left:-20000px;top:0;width:${options.size?.width ?? 1280}px;height:${options.size?.height ?? 720}px;border:0;pointer-events:none`
  const token = crypto.randomUUID()
  const script = `const module={exports:{}},exports=module.exports;
${videoRenderer.replace(/<\/script/gi, '<\\/script')}
const Mediabunny=module.exports;
${imageRenderer.replace(/<\/script/gi, '<\\/script')}
addEventListener('load',async()=>{
  const token=${JSON.stringify(token)},requestedSize=${JSON.stringify(options.size ?? null)},defaultDuration=${JSON.stringify(duration)},fps=${JSON.stringify(fps)};
  try {
    await document.fonts.ready;await Promise.all(Array.from(document.images,image=>image.decode().catch(()=>{})));
    const root=document.querySelector('[data-video-root]')||document.body,rawDuration=Number(root.getAttribute?.('data-video-duration'));
    const seconds=Number.isFinite(rawDuration)&&rawDuration>=1&&rawDuration<=30?rawDuration:defaultDuration;
    const markedWidth=Number(root.getAttribute?.('data-video-width')),markedHeight=Number(root.getAttribute?.('data-video-height'));
    const marked=Number.isSafeInteger(markedWidth)&&Number.isSafeInteger(markedHeight)&&markedWidth>=64&&markedHeight>=64&&markedWidth<=4096&&markedHeight<=4096&&markedWidth*markedHeight<=16000000?{width:markedWidth,height:markedHeight}:null;
    for(let element=root;element;element=element.parentElement){element.style.transform='none';element.style.zoom='1';}
    if(marked){root.style.width=marked.width+'px';root.style.height=marked.height+'px';root.style.maxWidth='none';root.style.maxHeight='none';root.style.boxSizing='border-box';}
    const box=root.getBoundingClientRect(),sourceWidth=Math.ceil(Math.max(box.width,root.scrollWidth)),sourceHeight=Math.ceil(Math.max(box.height,root.scrollHeight));
    if(sourceWidth<1||sourceHeight<1||sourceWidth>4096||sourceHeight>4096||sourceWidth*sourceHeight>16000000)throw new Error('La pieza es demasiado grande para renderizarla como video.');
    const requested=requestedSize||marked||{width:sourceWidth,height:sourceHeight},width=requested.width-(requested.width%2),height=requested.height-(requested.height%2);
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d',{alpha:false});if(!context)throw new Error('No se pudo preparar el video.');
    const target=new Mediabunny.BufferTarget(),output=new Mediabunny.Output({format:new Mediabunny.Mp4OutputFormat({fastStart:'in-memory'}),target});
    const source=new Mediabunny.CanvasSource(canvas,{codec:'avc',bitrate:new Mediabunny.Quality('high')});output.addVideoTrack(source,{frameRate:fps});
    const animations=document.getAnimations({subtree:true});for(const animation of animations)animation.pause();await output.start();
    const total=Math.ceil(seconds*fps),background=[getComputedStyle(root).backgroundColor,getComputedStyle(document.body).backgroundColor].find(color=>color&&color!=='transparent'&&color!=='rgba(0, 0, 0, 0)')||'#ffffff';
    for(let index=0;index<total;index++){
      const time=index/fps;for(const animation of animations)animation.currentTime=time*1000;
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const captured=await (html2canvas.default||html2canvas)(root,{width:sourceWidth,height:sourceHeight,scale:1,backgroundColor:background,logging:false,imageTimeout:10000});
      context.fillStyle=background;context.fillRect(0,0,width,height);const scale=Math.min(width/captured.width,height/captured.height),drawWidth=captured.width*scale,drawHeight=captured.height*scale;
      context.drawImage(captured,(width-drawWidth)/2,(height-drawHeight)/2,drawWidth,drawHeight);captured.width=captured.height=0;await source.add(time,1/fps);
    }
    await output.finalize();if(!target.buffer)throw new Error('No se pudo codificar el MP4.');
    parent.postMessage({type:'fx0-design-video',token,buffer:target.buffer},'*',[target.buffer]);
  }catch(error){parent.postMessage({type:'fx0-design-video',token,error:error instanceof Error?error.message:String(error)},'*');}
},{once:true});`
  const csp = DESIGN_ARTIFACT_EMBEDDED_CSP.replace("frame-src 'none'", 'frame-src about:')
  const prepared = prepareDesignArtifactHtml(`<!doctype html>${html.replace(/^\s*<!doctype\s+html\s*>/i, '')}`, csp)
  const source = `${prepared}<script>${script}</script>`
  return new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timeout); window.removeEventListener('message', receive); frame.remove() }
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || event.data?.type !== 'fx0-design-video' || event.data.token !== token) return
      cleanup()
      if (!(event.data.buffer instanceof ArrayBuffer) || event.data.buffer.byteLength === 0) reject(new Error(typeof event.data.error === 'string' ? event.data.error.slice(0, 240) : 'No se pudo renderizar el MP4.'))
      else resolve(new Blob([event.data.buffer], { type: 'video/mp4' }))
    }
    const timeout = setTimeout(() => { cleanup(); reject(new Error('La exportación tardó demasiado. Probá con una pieza o duración menor.')) }, 15 * 60_000)
    window.addEventListener('message', receive);frame.src = `data:text/html;charset=utf-8,${encodeURIComponent(source)}`;document.body.append(frame)
  })
}
