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
execFileSync(process.execPath,[fileURLToPath(new URL('../node_modules/typescript/bin/tsc',import.meta.url)),'--ignoreConfig','--outDir',output,'--strict','--types','node','--jsx','react-jsx','--target','esnext','--module','esnext','--moduleResolution','bundler','--skipLibCheck','--esModuleInterop','components/gb-workbench.tsx'],{cwd:root,stdio:'pipe'})
writeFileSync(join(output,'package.json'),'{"type":"module"}')
const outputUrl=pathToFileURL(`${output}/`).href
const hooks=registerHooks({resolve(s,c,next){
  if(!c.parentURL?.startsWith(outputUrl))return next(s,c)
  if(s.startsWith('.'))return next(`${s.replace(/\.ts$/, '')}.js`,c)
  return next(s,{...c,parentURL:projectUrl})
}})
after(()=>hooks.deregister())
const {default:Workbench}=await import(pathToFileURL(join(output,'components/gb-workbench.js')).href)
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
  assert.deepEqual(s.sent,GB_ACTIONS.map(a=>a.prompt))
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
