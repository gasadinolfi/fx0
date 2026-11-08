import { readFile } from 'node:fs/promises'
import path from 'node:path'

export async function GET() {
  const script = await readFile(path.join(process.cwd(), 'node_modules/mediabunny/dist/bundles/mediabunny.cjs'), 'utf8')
  return new Response(script, {
    headers: {
      'content-type': 'text/javascript; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}
