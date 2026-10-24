import assert from 'node:assert/strict'
import test from 'node:test'
import { SOCIAL_FORMATS, validSocialSize, socialPrompt, socialChatPrompt } from '../lib/social-formats.ts'
import { crc32, imageZip } from '../lib/image-zip.ts'

test('social presets cover the selected networks and all fit the export limits',()=>{
  assert.deepEqual(new Set(SOCIAL_FORMATS.map(f=>f.network)),new Set(['Instagram','Facebook','LinkedIn','X','Threads','Bluesky','TikTok','Pinterest','YouTube','WhatsApp']))
  assert.equal(new Set(SOCIAL_FORMATS.map(f=>f.id)).size,SOCIAL_FORMATS.length)
  for(const format of SOCIAL_FORMATS)assert.ok(validSocialSize(format),format.id)
  for(const size of [null,{}, {width:0,height:1920},{width:1080.5,height:1920},{width:100000,height:2},{width:Infinity,height:1080},{width:4096,height:4096}])assert.equal(validSocialSize(size),false)
})
test('custom social dimensions reach the generation prompt with separate exportable slides',()=>{
  const prompt=socialPrompt('Crear publicación',{id:'custom',network:'Otra red',label:'Propio',width:900,height:1600})
  assert.match(prompt,/900 × 1600/)
  assert.match(prompt,/data-social-piece/)
  assert.match(prompt,/copy.*fuera de esas placas/)
  assert.throws(()=>socialPrompt('test',{width:0,height:1}),/Medidas inválidas/)
})
test('ZIP files preserve every image byte, name, CRC and directory offset',async()=>{
  assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926)
  const contents=[new Uint8Array([137,80,78,71,1,2,3]),new Uint8Array([255,216,255,4,5,6])]
  const zip=await imageZip(contents.map((data,i)=>({name:`placa-${i+1}.png`,blob:new Blob([data])})))
  assert.equal(zip.type,'application/zip')
  const buffer=await zip.arrayBuffer(),view=new DataView(buffer),bytes=new Uint8Array(buffer)
  const end=buffer.byteLength-22
  assert.equal(view.getUint32(end,true),0x06054b50)
  assert.equal(view.getUint16(end+10,true),2)
  let offset=0,central=view.getUint32(end+16,true)
  for(let i=0;i<2;i++){
    assert.equal(view.getUint32(offset,true),0x04034b50)
    const length=view.getUint16(offset+26,true),size=view.getUint32(offset+18,true)
    assert.equal(new TextDecoder().decode(bytes.slice(offset+30,offset+30+length)),`placa-${i+1}.png`)
    assert.deepEqual(bytes.slice(offset+30+length,offset+30+length+size),contents[i])
    assert.equal(view.getUint32(offset+14,true),crc32(contents[i]))
    assert.equal(view.getUint32(central,true),0x02014b50)
    assert.equal(view.getUint32(central+42,true),offset)
    central+=46+length;offset+=30+length+size
  }
  assert.equal(central,end)
  await assert.rejects(imageZip([]),/entre 1 y 20/)
  await assert.rejects(imageZip([{name:'../unsafe.png',blob:new Blob(['x'])}]),/Nombre/)
})

test('free-form chat keeps the selected format while preserving an explicit user override',()=>{
  const format=SOCIAL_FORMATS.find(f=>f.id==='instagram-story')
  const prompt=socialChatPrompt('Crear una placa',format)
  assert.match(prompt,/1080 × 1920/)
  assert.match(prompt,/priorizá ese pedido/)
  assert.equal(socialChatPrompt(prompt,format),prompt,'a retry does not append the same format twice')
})
