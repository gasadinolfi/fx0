import { withBotId } from 'botid/next/config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ['libfx', 'pdfjs-dist'],
  turbopack: { root: import.meta.dirname },
  // The DESIGN.md catalog is read from disk when a new chat picks one.
  outputFileTracingIncludes: {
    '/api/prompt': ['./lib/design-md/*.md', './lib/gb/DESIGN.md', './lib/gb/reference/*'],
    '/api/gb': ['./lib/gb/DESIGN.md', './lib/gb/reference/*', './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'],
    '/api/image-renderer': ['./node_modules/html2canvas-pro/dist/html2canvas-pro.min.js'],
  },
  env: {
    NEXT_PUBLIC_FX0_FREE_PROMPTS: process.env.FX0_FREE_PROMPTS === '1' ? '1' : '0',
  },
}

export default withBotId(nextConfig)
