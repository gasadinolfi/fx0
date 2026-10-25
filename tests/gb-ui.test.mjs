import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test, { after } from 'node:test'
import * as React from 'react'
const root = new URL('../',import.meta.url)
const projectUrl = new URL('../package.json',import.meta.url).href
const output = realpathSync(mkdtempSync(join(tmpdir(),'fx0-gb-ui-')))
after(() => rmSync(output,{recursive:true,force:true}))
execFileSync(process.execPath,[fileURLToPath(new URL('../node_modules/typescript/bin/tsc',import.meta.url)),'--ignoreConfig','--outDir',output,'--strict','--types','node','--jsx','react-jsx','--target','esnext','--module','esnext','--moduleResolution','bundler','--skipLibCheck','--esModuleInterop','components/gb-workbench.tsx','components/gb-plan-panel.tsx'],{cwd:root,stdio:'pipe'})
writeFileSync(join(output,'package.json'),'{"type":"module"}')
const outputUrl=pathToFileURL(`${output}/`).href
const hooks=registerHooks({resolve(s,c,next){
  if(!c.parentURL?.startsWith(outputUrl))return next(s,c)
  if(s.startsWith('.'))return next(`${s.replace(/\.ts$/, '')}.js`,c)
  return next(s,{...c,parentURL:projectUrl})
}})
after(()=>hooks.deregister())
const {default:Workbench,GbEmptyPreview,GbBackgroundExamples}=await import(pathToFileURL(join(output,'components/gb-workbench.js')).href)
const {default:PlanPanel}=await import(pathToFileURL(join(output,'components/gb-plan-panel.js')).href)
const {socialPrompt,SOCIAL_FORMATS}=await import(pathToFileURL(join(output,'lib/social-formats.js')).href)
const {GB_SEED_CAMPAIGNS,GB_ACTIONS}=await import(pathToFileURL(join(output,'lib/gb-model.js')).href)
const tick=()=>new Promise(r=>setImmediate(r))
function setup(t,{sessionId='draft',binding=null,proposal=null}={}) {
  const state={revision:2,activeGuideId:'g2',guides:[{id:'g1',text:'# Primera guía',sourceIds:[],note:'Inicial'},{id:'g2',text:'# Segunda guía',sourceIds:[],note:'Actualizada'}],sources:[],campaigns:GB_SEED_CAMPAIGNS.map(c=>({...c,guideId:'g1',sessionIds:[]})),proposal}
  const sent=[],contexts=[],requests=[],navigations=[]
  const prev=globalThis.window
  globalThis.window={location:{href:`http://localhost/gb${sessionId==='draft'?'':`?s=${sessionId}`}`,search:''},history:{replaceState(_a,_b,url){window.location.href=String(url);window.location.search=new URL(url).search}}}
  t.after(()=>{if(prev===undefined)delete globalThis.window;else globalThis.window=prev})
  t.mock.method(globalThis,'fetch',async(url,init)=>{
    requests.push({url,init})
    if(!init?.method)return Response.json({state,campaignId:binding})
    const body=JSON.parse(init.body)
    if(body.action==='adopt')state.campaigns.find(c=>c.id===body.campaignId).guideId=state.activeGuideId
    if(body.action==='accept') {state.guides.push({id:'g3',text:body.text,sourceIds:[],note:'Aceptada'});state.activeGuideId='g3';state.proposal=null}
    if(body.action==='campaign')state.campaigns.push({...state.campaigns[0],...body,id:'custom',sessionIds:[]})
    state.revision++
    return Response.json({state})
  })
  const props={sessionId,busy:false,empty:true,enabled:true,onContext:x=>contexts.push(x),onNew:()=>navigations.push('new'),onSend:x=>sent.push(x)}
  const view=renderHooks(Workbench)
  t.after(()=>view.cleanup())
  return {state,sent,contexts,requests,navigations,props,view}
}
function text(node){if(typeof node==='string')return node;if(!node||typeof node!=='object')return '';return React.Children.toArray(node.props?.children).map(text).join('')}
function button(tree,label){return find(tree,n=>n.props?.onClick&&text(n)===label)}
function renderHooks(Component) {
  const slots = []
  let index = 0
  let effects = []
  const cleanups = []
  const dispatcher = {
    useState(initial) {
      const slot = index++
      if (!(slot in slots)) slots[slot] = typeof initial === 'function' ? initial() : initial
      return [slots[slot], (value) => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value }]
    },
    useRef(initial) { const slot = index++; return slots[slot] ??= { current: initial } },
    useCallback(callback) { index++; return callback },
    useMemo(factory) { index++; return factory() },
    useId() { return `test-${index++}` },
    useImperativeHandle(ref, create) { index++; if (ref) ref.current = create() },
    useEffect(callback, deps) {
      const slot = index++
      if (!slots[slot] || deps.some((value, i) => !Object.is(value, slots[slot][i]))) {
        slots[slot] = deps
        effects.push(() => { cleanups[slot]?.(); cleanups[slot] = callback() })
      }
    },    useLayoutEffect(callback, deps) { return dispatcher.useEffect(callback, deps) },
  }
  return {
    render(props) {
      index = 0
      const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
      const previous = internals.H
      internals.H = dispatcher
      try { return Component(props) } finally { internals.H = previous }
    },
    flush() { const pending = effects; effects = []; for (const effect of pending) effect() },
    cleanup() { for (const cleanup of cleanups) cleanup?.() },
  }
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return null
  if (predicate(node)) return node
  // A streamed region's Suspense fallback renders ChatApp's live state.
  for (const child of React.Children.toArray([node.props?.fallback, node.props?.children])) {
    const result = find(child, predicate)
    if (result) return result
  }
  return null
}

test('GB gates actions on loaded context, then each button sends its specific campaign task',async t=>{
  const s=setup(t)
  let tree=s.view.render(s.props)
  s.view.flush();await tick();tree=s.view.render(s.props)
  assert.equal(find(tree,n=>n.type==='h2').props.children,'Invertir empieza por entender')
  for(const action of GB_ACTIONS){const target=find(tree,n=>n.props?.onClick&&text(n).startsWith(action.label));assert.equal(target.props.disabled,false);target.props.onClick()}
  assert.deepEqual(s.sent,GB_ACTIONS.map((a,i)=>i<2?socialPrompt(a.prompt,SOCIAL_FORMATS[0]):a.prompt))
  assert.deepEqual(s.contexts.at(-1),{sessionId:'draft',campaignId:'entender'})
  tree=s.view.render({...s.props,busy:true})
  assert.equal(find(tree,n=>n.props?.onClick&&text(n).startsWith(GB_ACTIONS[0].label)).props.disabled,true)
})
test('reopening restores the saved campaign; switching starts a fresh chat and keeps the selection in the URL',async t=>{
  const s=setup(t,{sessionId:'saved',binding:'mundo'})
  s.view.render(s.props);s.view.flush();await tick()
  let tree=s.view.render(s.props)
  assert.equal(find(tree,n=>n.type==='select').props.value,'mundo')
  find(tree,n=>n.type==='select').props.onChange({target:{value:'equipo'}})
  tree=s.view.render({...s.props,sessionId:'draft'})
  assert.deepEqual(s.navigations,['new'])
  assert.deepEqual(s.contexts.at(-1),{sessionId:'draft',campaignId:'equipo'})
  assert.match(window.location.href,/c=equipo/)
})
test('adoption is explicit and acceptance keeps older campaigns pinned',async t=>{
  const s=setup(t,{proposal:{id:'p1',baseGuideId:'g2',text:'# Guía propuesta',sourceIds:[]}})
  s.view.render(s.props);s.view.flush();await tick()
  let tree=s.view.render(s.props)
  button(tree,'Adoptar guía vigente').props.onClick();await tick()
  tree=s.view.render(s.props)
  assert.equal(s.state.campaigns[0].guideId,'g2')
  assert.equal(s.state.campaigns[1].guideId,'g1')
  const accept=button(tree,'Aceptar nueva versión')
  assert.ok(accept);accept.props.onClick();await tick()
  tree=s.view.render(s.props)
  assert.equal(s.state.activeGuideId,'g3')
  assert.equal(s.state.campaigns[0].guideId,'g2')
  assert.equal(s.state.proposal,null)
})
test('a private workbench disappears when the account signs out',async t=>{
  const s=setup(t)
  s.view.render(s.props);s.view.flush();await tick()
  assert.equal(s.view.render({...s.props,enabled:false}),null)
  s.view.flush()
})

test('GB adapts the existing design to the chosen network without requesting a crop',async t=>{
  const s=setup(t)
  s.props.hasDesign=true
  s.view.render(s.props);s.view.flush();await tick()
  let tree=s.view.render(s.props)
  const picker=find(tree,n=>typeof n.type==='function'&&n.type.name==='SocialFormatPicker')
  assert.ok(picker)
  picker.props.onChange(SOCIAL_FORMATS.find(f=>f.id==='youtube-thumbnail'))
  tree=s.view.render(s.props)
  assert.equal(s.sent.length,1,'changing the preset starts adaptation without another click')
  assert.match(s.sent.at(-1),/1280 × 720/)
  assert.match(s.sent.at(-1),/Recomponé todas las placas/)
  assert.match(s.sent.at(-1),/data-social-piece/)
  assert.match(s.sent.at(-1),/No lo resuelvas recortando/)
})

test('changing format before creating a design does not start a generation',async t=>{
  const s=setup(t)
  s.view.render(s.props);s.view.flush();await tick()
  let tree=s.view.render(s.props)
  find(tree,n=>typeof n.type==='function'&&n.type.name==='SocialFormatPicker').props.onChange(SOCIAL_FORMATS.find(f=>f.id==='pinterest-pin'))
  tree=s.view.render(s.props)
  assert.equal(s.sent.length,0)
  const action=find(tree,n=>n.props?.onClick&&text(n).startsWith('Crear publicación'))
  action.props.onClick()
  assert.match(s.sent[0],/1000 × 1500/)
})
test('custom sizes adapt only on commit, deduplicate blur events and reject invalid measures',async t=>{
  const s=setup(t)
  s.props.hasDesign=true
  s.view.render(s.props);s.view.flush();await tick()
  const picker=()=>find(s.view.render(s.props),n=>typeof n.type==='function'&&n.type.name==='SocialFormatPicker')
  const custom={id:'custom',network:'Personalizado',label:'Propio',width:900,height:1600}
  picker().props.onChange(custom)
  assert.equal(s.sent.length,0)
  picker().props.onCommit(custom)
  picker().props.onCommit(custom)
  assert.equal(s.sent.length,1)
  assert.match(s.sent[0],/900 × 1600/)
  picker().props.onCommit({...custom,width:0})
  assert.equal(s.sent.length,1)
  s.props.busy=true
  picker().props.onChange(SOCIAL_FORMATS[1])
  assert.equal(s.sent.length,1)
})


test('the GB sample uses original brand colors inside the artwork',()=>{
  const tree=GbEmptyPreview({campaignId:'entender'})
  const poster=find(tree,n=>n.props?.className?.includes('gb-reference-poster'))
  assert.equal(poster.props.style.backgroundColor,'#FFFFFF')
  assert.equal(poster.props.style.color,'#03065E')
  assert.equal(find(tree,n=>n.type==='svg').props.style.color,'#03065E')
})

test('background comparison keeps the same artwork across all three permitted backgrounds', () => {
  const tree = GbBackgroundExamples()
  const figures = tree.props.children[1]
  assert.equal(figures.length, 3)
  assert.deepEqual(figures.map(f => f.props.children[0].props.style.backgroundColor), ['#03065E', '#13B4D8', '#FFFFFF'])
  assert.equal(new Set(figures.map(f => f.props.children[0].props.children[1].props.children)).size, 1)
  assert.equal(new Set(figures.map(f => f.props.children[0].props.className)).size, 1)
})

function panelSetup(t, {hasPlan=false}={}) {
  const s=setup(t)
  window.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}})
  window.location.assign=url=>s.navigations.push(url)
  t.mock.method(globalThis,'setTimeout',()=>1)
  t.mock.method(globalThis,'clearTimeout',()=>{})
  if(hasPlan)s.state.plan={id:'p',posts:Array.from({length:20},(_,i)=>({id:`p${i}`,week:Math.floor(i/5)+1,day:i%5+1,campaignId:'entender',title:`Título ${i}`,objective:'Objetivo',idea:'Idea',copy:'Copy',status:i===0?'ready':'pending',sessionId:i===0?'saved-plate':undefined,revision:i===0?3:undefined}))}
  const view=renderHooks(PlanPanel)
  t.after(()=>view.cleanup())
  const props={open:true,onOpenChange:value=>s.navigations.push(value),busy:false,format:SOCIAL_FORMATS[1],onGeneratePlan:value=>s.sent.push(value)}
  return {...s,view,props}
}

test('the plan panel opens, requests planning without artwork and closes independently',async t=>{
  const s=panelSetup(t)
  s.view.render(s.props);s.view.flush();await tick()
  let tree=s.view.render(s.props)
  assert.equal(tree.type,'aside')
  button(tree,'Generar plan').props.onClick()
  assert.match(s.sent[0],/save_gb_plan/)
  assert.match(s.sent[0],/no publiques diseños/)
  button(tree,'Cerrar').props.onClick()
  assert.equal(s.navigations.at(-1),false)
  assert.equal(s.view.render({...s.props,open:false}),null)
})

test('the plan panel displays four weeks, stable result links and starts only the chosen publication',async t=>{
  const s=panelSetup(t,{hasPlan:true})
  s.view.render(s.props);s.view.flush();await tick()
  const tree=s.view.render(s.props)
  assert.ok(find(tree,n=>n.props?.['aria-label']==='Semana 4'))
  assert.equal(find(tree,n=>n.type==='iframe').props.src,'/api/artifact-frame?session=saved-plate&revision=3')
  t.mock.method(globalThis,'fetch',async(url,init)=>{
    s.requests.push({url,init})
    return new Response('',{headers:{'x-fx0-session':'new-plate'}})
  })
  await button(tree,'Generar placa').props.onClick();await tick()
  const request=s.requests.at(-1)
  assert.equal(request.url,'/api/prompt?session=new')
  const body=JSON.parse(request.init.body)
  assert.equal(body.gb.postId,'p1')
  assert.deepEqual(body.gb.format,SOCIAL_FORMATS[1])
  assert.equal(s.navigations.at(-1),'/gb?s=new-plate&view=preview')
})

test('a failed plaque request remains visible after workspace refresh',async t=>{
  const s=panelSetup(t,{hasPlan:true})
  s.view.render(s.props);s.view.flush();await tick()
  t.mock.method(globalThis,'fetch',async(url,init)=>init?.method?Response.json({error:'Servicio no disponible'},{status:503}):Response.json({state:s.state}))
  button(s.view.render(s.props),'Generar placa').props.onClick();await tick();await tick()
  assert.match(text(s.view.render(s.props)),/Servicio no disponible/)
})
