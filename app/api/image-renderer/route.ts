import { readFile } from 'node:fs/promises'
import path from 'node:path'

// Only the renderer's public code is served here; design HTML stays in its sandbox.
export async function GET() {
  const script = await readFile(path.join(process.cwd(), 'node_modules/html2canvas-pro/dist/html2canvas-pro.min.js'), 'utf8')
  return new Response(script, {
    headers: {
      'content-type': 'text/javascript; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      'x-content-type-options': 'nosniff',
    },
  })
}
