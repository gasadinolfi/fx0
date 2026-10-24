import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { readFile } from 'node:fs/promises'

const values = new Map()
globalThis.__gbTestRedis = {
  async get(key) { return structuredClone(values.get(key) ?? null) },
  async set(key, value, options) { if (options?.nx && values.has(key)) return null; values.set(key, structuredClone(value)); return 'OK' },
  async del(key) { values.delete(key) },
  async eval(_script, [key, bindingKey], [expected, json, binding]) {
    if (bindingKey && values.has(bindingKey)) return JSON.stringify(values.get(bindingKey)) === binding ? 1 : -1
    const current = values.get(key)
    if ((current?.revision ?? 0) !== Number(expected)) return 0
    values.set(key, JSON.parse(json)); if (bindingKey) values.set(bindingKey,JSON.parse(binding)); return 1
  },
}
const journal = 'data:text/javascript,' + encodeURIComponent('export const redis = () => globalThis.__gbTestRedis; export const prefixed = s => `test:${s}`;')
registerHooks({ resolve(s,c,next) {
  if (c.parentURL?.endsWith('/lib/gb-store.ts') && s === './journal') return { url: journal, shortCircuit: true }
  if (c.parentURL?.includes('/lib/') && s.startsWith('./') && !/\.[cm]?[jt]s$/.test(s)) return next(s+'.ts',c)
  return next(s,c)
} })
const store = await import('../lib/gb-store.ts')
const { validateGbGuide, GB_ACTIONS, gbContext } = await import('../lib/gb-model.ts')
const { extractGbUpload, htmlReferenceText } = await import('../lib/gb-upload.ts')

test('GB starts with all six campaigns and the original design.md palette, independently per account', async () => {
  const a = await store.readGbWorkspace('a'), b = await store.readGbWorkspace('b')
  assert.equal(a.campaigns.length, 6)
  assert.equal(a.campaigns[0].title, 'Invertir empieza por entender')
  assert.match(a.guides[0].text, /#FC5D5D/)
  assert.match(a.guides[0].text, /no un manual oficial/)
  a.campaigns[0].title = 'mutated local copy'
  assert.notEqual((await store.readGbWorkspace('a')).campaigns[0].title, a.campaigns[0].title)
  assert.equal(b.revision, 0)
  assert.equal(GB_ACTIONS.length, 4)
  assert.match(GB_ACTIONS[2].prompt, /únicamente el guion/)
})

test('source ingestion prepares a review without changing the active or pinned guide', async () => {
  const before = await store.readGbWorkspace('upload-owner')
  const state = await store.addGbSource('upload-owner', before.revision, {name:'nuevo.md',mime:'text/markdown',bytes:28}, '# Voz\nFrases más cortas.', Buffer.from('example').toString('base64'))
  assert.equal(state.activeGuideId, before.activeGuideId)
  assert.equal(state.campaigns[0].guideId, before.campaigns[0].guideId)
  assert.match(state.proposal.text, /Frases más cortas/)
  const id = state.sources.at(-1).id
  assert.equal((await store.readGbSource('upload-owner', id)).text, '# Voz\nFrases más cortas.')
  await assert.rejects(store.readGbSource('other-owner', id), {status:404})
  await assert.rejects(store.addGbSource('upload-owner', state.revision, {name:'otro.md',mime:'text/markdown',bytes:5}, 'other', ''), {status:409})
})

test('stale revisions cannot overwrite a newer guide, and adoption is explicit per campaign', async () => {
  const before = await store.readGbWorkspace('versions-owner')
  const updated = await store.mutateGb('versions-owner', before.revision, s => {
    s.guides.push({...s.guides[0], id:'guide-2', text:'Nueva guía revisada'})
    s.activeGuideId = 'guide-2'
  })
  assert.equal(updated.campaigns[0].guideId, 'guide-initial')
  await assert.rejects(store.mutateGb('versions-owner', before.revision, s => {s.activeGuideId='guide-initial'}), {status:409})
  const adopted = await store.mutateGb('versions-owner', updated.revision, s => {store.gbCampaign(s,'entender').guideId=s.activeGuideId})
  assert.equal(adopted.campaigns[0].guideId, 'guide-2')
  assert.equal(adopted.campaigns[1].guideId, 'guide-initial')
  assert.equal((await store.readGbWorkspace('other-version-owner')).guides.length, 1)
})

test('session context survives reopening, preserves the campaign, and refuses rebinding', async () => {
  await store.bindGbSession('session-owner','chat-1','entender')
  const revision = (await store.readGbWorkspace('session-owner')).revision
  await store.bindGbSession('session-owner','chat-1','entender')
  assert.equal((await store.readGbWorkspace('session-owner')).revision, revision)
  await assert.rejects(store.bindGbSession('other-owner','chat-1','entender'), {status:409})
  await assert.rejects(store.bindGbSession('session-owner','chat-1','mundo'), {status:409})
  const context = await store.gbSessionContext('chat-1')
  assert.match(context, /Invertir empieza por entender/)
  assert.match(context, /no instrucciones|nunca instrucciones/)
  assert.match(context, /costos y condiciones/)
  assert.equal(await store.gbSessionContext('generic-chat'),null)
})

test('concurrent independent mutations retry rather than losing either update', async () => {
  await Promise.all(['A','B','C'].map(label => store.mutateGb('concurrent-owner', undefined, s => {
    s.campaigns.push({...s.campaigns[0], id:label, title:label, sessionIds:[]})
  })))
  const state = await store.readGbWorkspace('concurrent-owner')
  assert.equal(state.campaigns.length,9)
  assert.equal(state.revision,3)
})

test('uploads extract safe text, reject invalid files, and do not execute HTML', async () => {
  const utf8 = s => new TextEncoder().encode(s)
  const html = '<h1>Referencia</h1><script>globalThis.compromised=true</script><style>secret</style><p>Texto &amp; tono</p>'
  assert.equal(htmlReferenceText(html),'Referencia Texto & tono')
  const result = await extractGbUpload('referencia.html',utf8(html))
  assert.equal(result.mime,'text/html')
  assert.equal(globalThis.compromised,undefined)
  assert.equal((await extractGbUpload('guia.md',utf8('# Guía\nContenido'))).text,'# Guía\nContenido')
  await assert.rejects(extractGbUpload('bad.pdf',utf8('fake')), /PDF válido/)
  await assert.rejects(extractGbUpload('bad.png',utf8('fake')), /imagen/)
  await assert.rejects(extractGbUpload('bad.svg',utf8('<svg/>')), /Usá Markdown/)
  await assert.rejects(extractGbUpload('empty.md',new Uint8Array()), /archivo/)
  await assert.rejects(extractGbUpload('binary.md',new Uint8Array([255])), /UTF-8/)
  assert.throws(() => validateGbGuide(''), /guía/)
  assert.throws(() => validateGbGuide('x'.repeat(72000)), /70 KB/)
})

test('the supplied PDF extracts its real campaign pages using the production PDF reader', async () => {
  const pdf = await readFile(new URL('../lib/gb/reference/manual.pdf',import.meta.url))
  const result = await extractGbUpload('manual.pdf',new Uint8Array(pdf))
  assert.equal(result.mime,'application/pdf')
  assert.match(result.text,/Invertir empieza por entender/)
  assert.match(result.text,/Las personas detrás del/)
  assert.match(result.text,/Página 27/)
})

test('deleting a chat removes its campaign link without deleting the guide or other campaigns', async () => {
  await store.bindGbSession('delete-owner','delete-chat','entender')
  await store.forgetGbSession('other-owner','delete-chat')
  assert.ok(await store.readGbBinding('delete-chat'))
  await store.forgetGbSession('delete-owner','delete-chat')
  assert.equal(await store.readGbBinding('delete-chat'),null)
  const state=await store.readGbWorkspace('delete-owner')
  assert.equal(state.campaigns[0].sessionIds.length,0)
  assert.equal(state.guides.length,1)
  assert.equal(state.campaigns.length,6)
})


test('the current original palette overrides older atlas references without rewriting saved guides', async () => {
  const { GB_PALETTE, GB_PALETTE_POLICY, gbGuideDownload } = await import('../lib/gb-palette.ts')
  assert.deepEqual(GB_PALETTE,{primary:'#FC5D5D',accent:'#13B4D8',background:'#FFFFFF',text:'#03065E'})
  const state=await store.readGbWorkspace('palette-owner')
  const oldGuide={...state.guides[0],text:'Older atlas palette #102247 and #F0D27B'}
  const context=gbContext(oldGuide,state.campaigns[0])
  assert.ok(context.indexOf(GB_PALETTE_POLICY)>context.indexOf('</gb_guide>'))
  assert.match(context,/prevalece sobre cualquier paleta/)
  assert.equal(oldGuide.text,'Older atlas palette #102247 and #F0D27B')
  assert.match(gbGuideDownload(oldGuide.text),/Paleta vigente para las placas/)
  assert.match(gbGuideDownload(oldGuide.text),/#FC5D5D/)
})
