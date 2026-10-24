// A ZIP with stored entries needs no compression dependency for already-compressed PNG/JPEG.
export interface ImageZipEntry { name: string; blob: Blob }
const table = new Uint32Array(256).map((_, n) => {
  let crc = n
  for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
  return crc >>> 0
})
export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of data) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
export async function imageZip(entries: ImageZipEntry[]): Promise<Blob> {
  if (!entries.length || entries.length > 20) throw new Error('El ZIP debe contener entre 1 y 20 placas.')
  const parts: BlobPart[] = [], directory: BlobPart[] = []
  let offset = 0, directorySize = 0
  for (const entry of entries) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(entry.name)) throw new Error('Nombre de archivo inválido.')
    const name = new TextEncoder().encode(entry.name)
    const bytes = new Uint8Array(await entry.blob.arrayBuffer()), crc = crc32(bytes)
    if (bytes.length > 100 * 1024 * 1024) throw new Error('La placa es demasiado grande.')
    const header = new ArrayBuffer(30), local = new DataView(header)
    local.setUint32(0,0x04034b50,true); local.setUint16(4,20,true); local.setUint16(12,33,true)
    local.setUint32(14,crc,true); local.setUint32(18,bytes.length,true); local.setUint32(22,bytes.length,true); local.setUint16(26,name.length,true)
    parts.push(header, name, bytes)
    const central = new ArrayBuffer(46), record = new DataView(central)
    record.setUint32(0,0x02014b50,true); record.setUint16(4,20,true); record.setUint16(6,20,true); record.setUint16(14,33,true)
    record.setUint32(16,crc,true); record.setUint32(20,bytes.length,true); record.setUint32(24,bytes.length,true); record.setUint16(28,name.length,true); record.setUint32(42,offset,true)
    directory.push(central,name); directorySize += 46 + name.length
    offset += 30 + name.length + bytes.length
  }
  const end = new ArrayBuffer(22), endRecord = new DataView(end)
  endRecord.setUint32(0,0x06054b50,true); endRecord.setUint16(8,entries.length,true); endRecord.setUint16(10,entries.length,true)
  endRecord.setUint32(12,directorySize,true); endRecord.setUint32(16,offset,true)
  return new Blob([...parts,...directory,end],{type:'application/zip'})
}
