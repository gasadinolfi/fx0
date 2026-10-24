import { DESIGN_ARTIFACT_EMBEDDED_CSP, prepareDesignArtifactHtml } from '../../../lib/design-artifact'
import { readDesignArtifactAt } from '../../../lib/journal'
import { readGeneration } from '../../../lib/history'
import { withSessionRoute } from '../../../lib/route-auth'

export const maxDuration = 30

export const GET = withSessionRoute(async (request, { id: sessionId, user }) => {
  // Without a revision this is the live design in Redis; with one, a past version from Neon.
  const params = new URL(request.url).searchParams
  const revision = Number(params.get('revision'))
  const past = Number.isSafeInteger(revision) && revision > 0
  const live = past ? null : await readDesignArtifactAt(sessionId)
  const artifact = past ? await readGeneration(user.id, sessionId, revision) : live!.html
  // ?v= names the revision the page expects. When it is the one live, the browser may
  // keep this response but must revalidate it: this route checks the session first,
  // so a reload costs a 304 and a signed-out browser gets nothing from its cache.
  const version = Number(params.get('v'))
  const cacheable = live?.html != null && Number.isSafeInteger(version) && version > 0 && version === live.revision
  const etag = cacheable ? `"${sessionId}:${live.revision}:downloads-v1"` : null
  if (etag && request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { 'cache-control': 'private, no-cache', etag } })
  }
  const readyToken = crypto.randomUUID()
  const preparedArtifact = artifact == null
    ? `<!doctype html><html><head><meta charset="utf-8"><title>No design artifact</title></head><body><p>${
      past ? 'This version is not in the history.' : 'No design artifact has been published for this session.'
    }</p></body></html>`
    : prepareDesignArtifactHtml(artifact, DESIGN_ARTIFACT_EMBEDDED_CSP, readyToken)
  const artifactUrl = `data:text/html;base64,${Buffer.from(preparedArtifact, 'utf8').toString('base64')}`
  const csp = [
    "default-src 'none'",
    'frame-src data:',
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'self'",
  ].join('; ')
  const serializedArtifactUrl = JSON.stringify(artifactUrl)
  const serializedReadyToken = JSON.stringify(readyToken)
  // Download controls belong to the trusted wrapper, outside the artwork and exports.
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Design artifact preview</title>
<style>:root{color-scheme:light dark}:root{font:12px system-ui}html,body{width:100%;height:100%;margin:0;overflow:hidden}body{display:flex;flex-direction:column}#frame-root{position:relative;flex:1;min-height:0}iframe{width:100%;height:100%;border:0}#downloads[hidden]{display:none}#downloads{display:flex;justify-content:flex-end;gap:8px;padding:8px;background:Canvas;color:CanvasText;border-bottom:1px solid color-mix(in srgb,CanvasText 15%,transparent)}button,select{font:inherit;background:Canvas;color:CanvasText;border:1px solid color-mix(in srgb,CanvasText 25%,transparent);border-radius:6px;padding:6px 10px;cursor:pointer}button:disabled,select:disabled{opacity:.5;cursor:wait}#plate-controls{position:absolute;inset:0;pointer-events:none;overflow:hidden}.plate-download{position:absolute;display:flex;align-items:center;gap:4px;padding:4px;background:Canvas;color:CanvasText;border:1px solid color-mix(in srgb,CanvasText 20%,transparent);border-radius:8px;pointer-events:auto;box-shadow:0 2px 8px #0002}.plate-download span{padding:0 4px}</style>
</head>
<body>
<div id="downloads" hidden><select aria-label="Formato de descarga"><option value="png">PNG</option><option value="jpg">JPG</option></select><button type="button">Descargar todo</button></div>
<div id="frame-root"><div id="plate-controls"></div></div>
<script>
const artifact=${serializedArtifactUrl};
const token=${serializedReadyToken};
const frame=document.createElement('iframe');
const controls=document.querySelector('#plate-controls'),downloads=document.querySelector('#downloads');
let busy=false;
const requestDownload=(format,piece=null)=>{if(!busy)parent.postMessage({type:'fx0-social-download',format,piece},location.origin)};
downloads.querySelector('button').onclick=()=>requestDownload(downloads.querySelector('select').value);
const showPieces=pieces=>{
  if(!Array.isArray(pieces))return;
  controls.replaceChildren();
  downloads.hidden=false;
  for(const piece of pieces.slice(0,20)){
    if(!piece||typeof piece!=='object'||!Number.isInteger(piece.index)||piece.index<0||piece.index>=20||!['x','y','width','height'].every(key=>Number.isFinite(piece[key])&&Math.abs(piece[key])<1000000)||piece.width<=0||piece.height<=0)continue;
    if(piece.y+piece.height<=0||piece.y>=controls.clientHeight||piece.x+piece.width<=0||piece.x>=controls.clientWidth)continue;
    const group=document.createElement('div');group.className='plate-download';
    group.style.top=Math.max(4,piece.y+8)+'px';
    group.style.left=Math.max(4,Math.min(controls.clientWidth-210,piece.x+piece.width-210))+'px';
    const label=document.createElement('span');label.textContent='Placa '+(piece.index+1);group.append(label);
    for(const format of ['png','jpg']){const button=document.createElement('button');button.type='button';button.textContent=format.toUpperCase();button.setAttribute('aria-label','Descargar placa '+(piece.index+1)+' en '+format.toUpperCase());button.disabled=busy;button.onclick=()=>requestDownload(format,piece.index);group.append(button)}
    controls.append(group);
  }
};
frame.title='Interactive design artifact';
frame.setAttribute('sandbox','allow-scripts');
frame.referrerPolicy='no-referrer';
frame.setAttribute('credentialless','');
let readySignals=0;
let consumedSignals=0;
let lastHeartbeat=Date.now();
const restore=()=>{lastHeartbeat=Date.now();frame.src=artifact;};
addEventListener('message',event=>{
  if(event.source===parent&&event.origin===location.origin&&event.data?.type==='fx0-social-download-state'){
    busy=event.data.busy===true;document.querySelectorAll('button,select').forEach(el=>el.disabled=busy);return;
  }
  if(event.source!==frame.contentWindow||event.data?.token!==token)return;
  if(event.data.type==='social-pieces')showPieces(event.data.pieces);
  lastHeartbeat=Date.now();
  if(event.data.type==='ready')readySignals++;
  // The design paints in its own process, after this wrapper's load event; the app
  // swaps a new revision on screen only once it has.
  if(event.data.type==='painted')parent.postMessage({type:'fx0-artifact-painted'},location.origin);
  // The design cannot open popups itself; a clicked https link is opened here, without
  // an opener, and only during the click's user activation (it propagates to this frame).
  if(event.data.type==='open'&&typeof event.data.url==='string'&&navigator.userActivation?.isActive!==false){
    try{
      const url=new URL(event.data.url);
      if(url.protocol==='https:'&&!url.username&&!url.password)window.open(url.href,'_blank','noopener,noreferrer');
    }catch{}
  }
});
frame.addEventListener('load',()=>setTimeout(()=>{
  if(readySignals>consumedSignals){consumedSignals=readySignals;return;}
  restore();
},100));
setInterval(()=>{
  if(document.visibilityState==='visible'&&Date.now()-lastHeartbeat>3000)restore();
},500);
frame.src=artifact;
document.querySelector('#frame-root').prepend(frame);
</script>
</body>
</html>`
  return new Response(html, {
    status: artifact == null ? 404 : 200,
    headers: {
      'cache-control': etag ? 'private, no-cache' : 'private, no-store',
      ...(etag ? { etag } : {}),
      'content-security-policy': csp,
      'content-type': 'text/html; charset=utf-8',
      'permissions-policy':
        'accelerometer=(), camera=(), clipboard-read=(), clipboard-write=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=()',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
    },
  })
})
