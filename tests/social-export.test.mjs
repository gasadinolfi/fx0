import assert from 'node:assert/strict'
import test from 'node:test'
import { SOCIAL_FORMATS, validSocialSize, socialPrompt, socialChatPrompt } from '../lib/social-formats.ts'
import { socialSafeArea, safeContentPlacement, safeAreaPrompt } from '../lib/social-safe-area.ts'
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


test('every social preset reserves a non-empty interior safe rectangle',()=>{
  for(const format of SOCIAL_FORMATS){
    const safe=socialSafeArea(format.id,format.width,format.height)
    assert.ok(safe.x>0&&safe.y>0&&safe.width>0&&safe.height>0,format.id)
    assert.ok(safe.x+safe.width<format.width&&safe.y+safe.height<format.height,format.id)
  }
  for(const id of ['instagram-story','tiktok-vertical','youtube-short']){
    const safe=socialSafeArea(id,1080,1920)
    assert.ok(safe.y>=420,'key content survives a central square preview crop')
    assert.ok(safe.y+safe.height<=1248,'persistent lower controls stay clear')
    assert.ok(safe.x+safe.width<=864,'right-hand controls stay clear')
  }
  const unusual=socialSafeArea('custom',64,4096)
  assert.ok(unusual.y>=2016&&unusual.y+unusual.height<=2080)
})

test('unsafe critical content is fully placed inside the target safe zone at every export size',()=>{
  const critical={x:25,y:20,width:1030,height:1850}
  for(const format of SOCIAL_FORMATS){
    const safe=socialSafeArea(format.id,format.width,format.height)
    const placed=safeContentPlacement(1080,1920,format.width,format.height,safe,critical)
    assert.ok(placed.x+critical.x*placed.scale>=safe.x-.001,format.id)
    assert.ok(placed.y+critical.y*placed.scale>=safe.y-.001,format.id)
    assert.ok(placed.x+(critical.x+critical.width)*placed.scale<=safe.x+safe.width+.001,format.id)
    assert.ok(placed.y+(critical.y+critical.height)*placed.scale<=safe.y+safe.height+.001,format.id)
  }
})

test('already safe designs keep their scale and position; unknown raster content stays entirely inside',()=>{
  const safe=socialSafeArea('instagram-story',1080,1920)
  const unchanged=safeContentPlacement(1080,1920,1080,1920,safe,{x:200,y:600,width:400,height:400})
  assert.deepEqual(unchanged,{x:0,y:0,width:1080,height:1920,scale:1})
  const raster=safeContentPlacement(1080,1920,1080,1920,safe,{x:0,y:0,width:1080,height:1920})
  assert.ok(raster.x>=safe.x&&raster.y>=safe.y)
  assert.ok(raster.x+raster.width<=safe.x+safe.width+.001)
  assert.ok(raster.y+raster.height<=safe.y+safe.height+.001)
})

test('creation, adaptation and free-form prompts all protect logos, CTAs and information',()=>{
  const format=SOCIAL_FORMATS.find(f=>f.id==='instagram-story')
  for(const prompt of [socialPrompt('Crear',format),socialPrompt('Adaptar',format,true),socialChatPrompt('Crear',format)]){
    assert.match(prompt,/Zona segura obligatoria/)
    assert.match(prompt,/data-social-safe/)
    assert.match(prompt,/data-social-critical/)
    assert.match(prompt,/CTA/)
    assert.match(prompt,/geometría decorativa sin información/)
  }
  assert.match(safeAreaPrompt('instagram-story',1080,1920),/data-social-format="instagram-story"/)
})
