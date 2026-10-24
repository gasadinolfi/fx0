import { GB_MAX_FILE_BYTES } from './gb-model'

export function htmlReferenceText(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|iframe|object|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
}
export async function extractGbUpload(name: string, bytes: Uint8Array): Promise<{ text: string; mime: string }> {
  if (!bytes.length || bytes.length > GB_MAX_FILE_BYTES) throw new Error('El archivo debe tener entre 1 byte y 3 MB.')
  const extension = name.split('.').at(-1)?.toLowerCase()
  const head = Buffer.from(bytes.subarray(0, 16))
  if (['png', 'jpg', 'jpeg', 'webp'].includes(extension ?? '')) {
    const mime = head.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png'
      : head[0] === 255 && head[1] === 216 && head[2] === 255 ? 'image/jpeg'
      : head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP' ? 'image/webp' : null
    if (!mime) throw new Error('La imagen no es PNG, JPEG ni WebP válida.')
    if (bytes.length > 700 * 1024) throw new Error('La imagen debe ser menor de 700 KB para incorporarla al contexto visual.')
    return { text: '', mime }
  }
  if (extension === 'pdf') {
    if (head.toString('ascii', 0, 5) !== '%PDF-') throw new Error('El archivo no es un PDF válido.')
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const { createRequire } = await import('node:module')
    const { pathToFileURL } = await import('node:url')
    GlobalWorkerOptions.workerSrc = pathToFileURL(createRequire(import.meta.url).resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href
    const task = getDocument({ data: bytes, useSystemFonts: true, stopAtErrors: true })
    try {
      const doc = await task.promise
      if (doc.numPages > 60) throw new Error('El PDF debe tener hasta 60 páginas.')
      const pages: string[] = []
      for (let n = 1; n <= doc.numPages; n++) {
        const content = await (await doc.getPage(n)).getTextContent()
        pages.push(`Página ${n}\n` + content.items.map(i => 'str' in i ? i.str : '').join(' '))
      }
      const text = pages.join('\n\n')
      if (text.replace(/Página \d+/g, '').trim().length < 20) throw new Error('Este PDF no contiene texto extraíble. Subí una versión con texto o imágenes de referencia.')
      if (text.length > 120000) throw new Error('El PDF contiene demasiado texto; dividilo en documentos más pequeños.')
      return { text, mime: 'application/pdf' }
    } finally { await task.destroy() }
  }
  if (!['md', 'markdown', 'txt', 'html', 'htm'].includes(extension ?? '')) throw new Error('Usá Markdown, PDF, HTML, PNG, JPEG o WebP.')
  let text: string
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch { throw new Error('El documento debe estar codificado en UTF-8.') }
  if (text.includes('\0')) throw new Error('El documento debe ser texto.')
  if (['html', 'htm'].includes(extension!)) text = htmlReferenceText(text)
  if (!text.trim()) throw new Error('El documento no tiene contenido legible.')
  if (text.length > 120000) throw new Error('El documento contiene demasiado texto; dividilo en documentos más pequeños.')
  return { text, mime: ['html', 'htm'].includes(extension!) ? 'text/html' : 'text/markdown' }
}
