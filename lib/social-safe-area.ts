export interface SafeRect { x: number; y: number; width: number; height: number }
// Conservative house rules. These are not official or universal platform guarantees.
// Keep these functions self-contained: the isolated image renderer serializes them.
export function socialSafeArea(formatId: string, width: number, height: number): SafeRect {
  let left = Math.ceil(width * .06), right = left
  let top = Math.ceil(height * .06), bottom = top
  if (height / width >= 1.6) {
    // Protect the central square crop plus the persistent top/bottom/right controls.
    top = Math.max(Math.ceil(height * .16), Math.ceil((height - width) / 2 + width * .04))
    bottom = Math.max(Math.ceil(height * .35), top)
    left = Math.ceil(width * .08)
    right = Math.ceil(width * .20)
    if (formatId.startsWith('youtube-')) right = Math.ceil(width * .22)
    if (formatId.startsWith('whatsapp-')) { right = Math.ceil(width * .08); bottom = Math.max(Math.ceil(height * .20), top) }
  } else if (height > width) {
    // Feed/profile preview crops can be tighter than the full portrait image.
    top = bottom = Math.max(top, Math.ceil((height - width) / 2 + width * .04))
  }
  if (formatId.startsWith('pinterest-')) { right = Math.max(right, Math.ceil(width * .14)); bottom = Math.max(bottom, Math.ceil(height * .12)) }
  if (formatId === 'youtube-thumbnail') bottom = Math.max(bottom, Math.ceil(height * .18))
  return { x: left, y: top, width: Math.max(1, width - left - right), height: Math.max(1, height - top - bottom) }
}
export function safeContentPlacement(sourceWidth: number, sourceHeight: number, outputWidth: number, outputHeight: number, safe: SafeRect, critical: SafeRect) {
  const base = Math.min(outputWidth / sourceWidth, outputHeight / sourceHeight)
  const scale = Math.min(base, safe.width / Math.max(1, critical.width), safe.height / Math.max(1, critical.height))
  const minX = safe.x - critical.x * scale, maxX = safe.x + safe.width - (critical.x + critical.width) * scale
  const minY = safe.y - critical.y * scale, maxY = safe.y + safe.height - (critical.y + critical.height) * scale
  const x = Math.min(maxX, Math.max(minX, (outputWidth - sourceWidth * scale) / 2))
  const y = Math.min(maxY, Math.max(minY, (outputHeight - sourceHeight * scale) / 2))
  return { x, y, width: sourceWidth * scale, height: sourceHeight * scale, scale }
}
export function safeAreaPrompt(formatId: string, width: number, height: number): string {
  const safe = socialSafeArea(formatId, width, height)
  return `Zona segura obligatoria (${width} × ${height}): izquierda ${safe.x}px, arriba ${safe.y}px, ancho ${safe.width}px y alto ${safe.height}px. Todo texto informativo, título, dato, logo, firma, CTA, producto o rostro protagonista debe quedar íntegramente dentro de ese rectángulo. Quitá rótulos, códigos y pies secundarios que quedarían tapados por controles o recortes de las redes; no agregues información en esas franjas. En los bordes reservados solo pueden ir fondos, texturas o geometría decorativa sin información. En cada placa agregá data-social-format="${formatId}" y un contenedor data-social-safe con position:absolute; left:${safe.x}px; top:${safe.y}px; width:${safe.width}px; height:${safe.height}px; box-sizing:border-box. No ocultes desbordamientos para simular que cumple: redistribuí el contenido y mantené texto legible. Marcá imágenes, logos, gráficos y objetos importantes con data-social-critical. Solo fotos de fondo y adornos sin información pueden llevar data-social-decoration. No rasterices texto ni logos dentro de fondos CSS. La guía del área segura puede mostrarse fuera de las placas; no dibujes sus líneas en la imagen descargable. Si el pedido explícito cambia de red o dimensiones, recalculá el área segura para ese formato.`
}
