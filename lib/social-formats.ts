// @ts-expect-error Node strip-types tests require the source extension.
import { safeAreaPrompt } from './social-safe-area.ts'

export interface SocialSize { width: number; height: number }
export interface SocialFormat extends SocialSize { id: string; network: string; label: string }
// Working canvases, not guarantees about a platform's upload rules or automatic cropping.
export const SOCIAL_FORMATS: readonly SocialFormat[] = [
  { id: 'instagram-portrait', network: 'Instagram', label: 'Publicación vertical', width: 1080, height: 1350 },
  { id: 'instagram-square', network: 'Instagram', label: 'Publicación cuadrada', width: 1080, height: 1080 },
  { id: 'instagram-story', network: 'Instagram', label: 'Historia / portada de reel', width: 1080, height: 1920 },
  { id: 'facebook-square', network: 'Facebook', label: 'Publicación cuadrada', width: 1080, height: 1080 },
  { id: 'facebook-landscape', network: 'Facebook', label: 'Publicación horizontal', width: 1200, height: 630 },
  { id: 'facebook-story', network: 'Facebook', label: 'Historia', width: 1080, height: 1920 },
  { id: 'linkedin-square', network: 'LinkedIn', label: 'Publicación / carrusel', width: 1080, height: 1080 },
  { id: 'linkedin-landscape', network: 'LinkedIn', label: 'Publicación horizontal', width: 1200, height: 628 },
  { id: 'linkedin-portrait', network: 'LinkedIn', label: 'Publicación vertical', width: 1080, height: 1350 },
  { id: 'x-landscape', network: 'X', label: 'Publicación horizontal', width: 1600, height: 900 },
  { id: 'x-square', network: 'X', label: 'Publicación cuadrada', width: 1080, height: 1080 },
  { id: 'threads-portrait', network: 'Threads', label: 'Publicación vertical', width: 1080, height: 1350 },
  { id: 'threads-square', network: 'Threads', label: 'Publicación cuadrada', width: 1080, height: 1080 },
  { id: 'bluesky-landscape', network: 'Bluesky', label: 'Publicación horizontal', width: 1600, height: 900 },
  { id: 'bluesky-square', network: 'Bluesky', label: 'Publicación cuadrada', width: 1080, height: 1080 },
  { id: 'tiktok-vertical', network: 'TikTok', label: 'Carrusel / portada vertical', width: 1080, height: 1920 },
  { id: 'pinterest-pin', network: 'Pinterest', label: 'Pin vertical', width: 1000, height: 1500 },
  { id: 'pinterest-square', network: 'Pinterest', label: 'Pin cuadrado', width: 1000, height: 1000 },
  { id: 'youtube-thumbnail', network: 'YouTube', label: 'Miniatura', width: 1280, height: 720 },
  { id: 'youtube-short', network: 'YouTube', label: 'Portada de short', width: 1080, height: 1920 },
  { id: 'youtube-community', network: 'YouTube', label: 'Publicación', width: 1080, height: 1080 },
  { id: 'whatsapp-status', network: 'WhatsApp', label: 'Estado', width: 1080, height: 1920 },
  { id: 'whatsapp-square', network: 'WhatsApp', label: 'Imagen cuadrada', width: 1080, height: 1080 },
]
export function validSocialSize(size: unknown): size is SocialSize {
  if (!size || typeof size !== 'object') return false
  const { width, height } = size as SocialSize
  return Number.isSafeInteger(width) && Number.isSafeInteger(height) && width >= 64 && height >= 64 && width <= 4096 && height <= 4096 && width * height <= 16_000_000
}
export function socialFormatLabel(format: SocialFormat): string { return `${format.network} · ${format.label} · ${format.width} × ${format.height}` }
export const SOCIAL_PIECE_INSTRUCTIONS = `Para piezas visuales, cada placa debe ser un elemento independiente con data-social-piece y sus medidas nativas en data-social-width y data-social-height. Usá esas medidas exactas en px en el elemento; no dependas del zoom de la vista previa. Separá las placas del carrusel como elementos hermanos. El copy, los controles y los rótulos de vista previa van fuera de esas placas. No anides data-social-piece. Diseñá cada placa para que se lea completa, sin texto cortado ni desbordamiento. En todas las piezas sociales, mantené toda información dentro de un contenedor data-social-safe; reservá los bordes para decoración sin texto y evitá controles, subtítulos y recortes de las redes. El logo y la firma también son información: no los pongas en el borde inferior. Marcá los objetos importantes con data-social-critical y los fondos sin información con data-social-decoration. Las fotos y las portadas siguen siendo imágenes estáticas; no generes video.`
export function socialPrompt(prompt: string, format: SocialFormat, adapt = false): string {
  if (!validSocialSize(format)) throw new Error('Medidas inválidas. Usá valores entre 64 y 4096 px, hasta 16 megapíxeles.')
  return `${prompt}\n\nFormato elegido: ${socialFormatLabel(format)}. ${adapt ? 'Recomponé todas las placas del diseño actual para estas medidas: redistribuí texto, geometría e imágenes, manteniendo el contenido y la identidad. No lo resuelvas recortando o deformando la pieza anterior.' : 'Si este pedido incluye una pieza visual, creala en estas medidas en lugar de cualquier tamaño anterior.'}\n${SOCIAL_PIECE_INSTRUCTIONS}\n${safeAreaPrompt(format.id, format.width, format.height)} No agregues fechas, contactos ni condiciones comerciales sin respaldo.`
}

export function socialChatPrompt(text: string, format: SocialFormat): string {
  if (!validSocialSize(format) || text.includes('Formato elegido:')) return text
  return `${text}\n\nFormato elegido: ${socialFormatLabel(format)} para las piezas visuales. Si mi pedido especifica otra medida o red, priorizá ese pedido. Si pedí texto o un guion, respondé en el chat.\n${safeAreaPrompt(format.id, format.width, format.height)}`
}
