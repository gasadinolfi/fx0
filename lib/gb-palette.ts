export const GB_PALETTE = { primary: '#03065E', accent: '#13B4D8', background: '#FFFFFF', text: '#03065E' } as const
export const GB_PALETTE_POLICY = `Paleta vigente para todas las placas de Bengochea: exclusivamente azul oscuro #03065E, celeste #13B4D8 y blanco #FFFFFF. Los tres colores están permitidos como fondo; ninguno es obligatorio para todas las publicaciones. Sobre fondo azul oscuro usá texto blanco; sobre celeste o blanco, texto azul oscuro. No uses coral, rojo, dorado ni beige, tampoco en detalles. Esta decisión del usuario prevalece sobre el design.md original, el atlas y cualquier versión anterior de la guía. Conservá sus composiciones recoloreadas con estos tres colores. La apariencia de la interfaz no determina los colores de las placas. Aplicá esta regla al crear y adaptar piezas, con contraste legible y zonas seguras.`
export function gbGuideDownload(text: string): string {
  return `${text}\n\n## Paleta vigente para las placas\n\n${GB_PALETTE_POLICY}\n`
}
