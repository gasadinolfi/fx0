import { GB_PALETTE } from '../lib/gb-palette'

export const GB_ATLAS_BACKGROUNDS = [
  { name: 'Azul oscuro', background: GB_PALETTE.text, foreground: GB_PALETTE.background, accent: GB_PALETTE.accent },
  { name: 'Celeste', background: GB_PALETTE.accent, foreground: GB_PALETTE.text, accent: GB_PALETTE.text },
  { name: 'Blanco', background: GB_PALETTE.background, foreground: GB_PALETTE.text, accent: GB_PALETTE.accent },
] as const

function titleLines(title: string) {
  const words = title.trim().split(/\s+/)
  if (words.length < 2) return [title]
  let split = 1, difference = Infinity
  for (let i = 1; i < words.length; i++) {
    const next = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length)
    if (next < difference) { difference = next; split = i }
  }
  return [words.slice(0, split).join(' '), words.slice(split).join(' ')]
}

// Atlas template 2, retaining its native type scale and wireframe geometry.
export default function GbAtlasPoster({ title = 'Invertir empieza por entender', variant = GB_ATLAS_BACKGROUNDS[2] }: {
  title?: string; variant?: (typeof GB_ATLAS_BACKGROUNDS)[number];
}) {
  const lines = titleLines(title)
  const size = Math.min(88, 914 / (Math.max(...lines.map(l => l.length)) * .58))
  const rows = [{ y: 622, n: 4, r: 108 }, { y: 797, n: 5, r: 96 }, { y: 940, n: 6, r: 82 }, { y: 1062, n: 7, r: 67 }, { y: 1166, n: 8, r: 54 }]
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" role="img" aria-label={`${title} · Atlas, esferas en progresión`} data-atlas-template="2" className="block h-auto w-full" style={{ backgroundColor: variant.background, color: variant.foreground }} fontFamily="Inter, Roboto, Arial, sans-serif">
    <rect width="1080" height="1350" fill={variant.background} />
    <g fill={variant.foreground}>
      {lines.map((line, i) => <text key={i} x="76" y={270 + i * size * 1.08} fontSize={size} fontWeight="760" letterSpacing="-1.5">{line}</text>)}
      <text x="76" y="445" fontSize="25" fontWeight="460"><tspan x="76">Tus objetivos, tus plazos y tus preguntas.</tspan><tspan x="76" dy="32">Un buen punto de partida para conversar.</tspan></text>
    </g>
    <text x="1006" y="375" fill={variant.accent} fontSize="55" fontWeight="760" textAnchor="end">01</text>
    {rows.map((row, ri) => {
      const step = Math.min(230, (936 - row.r * 2) / (row.n - 1))
      const left = 540 - (row.n - 1) * step / 2
      return <g key={row.y} fill="none" stroke={ri < 2 ? variant.accent : variant.foreground} opacity={Math.max(.22, .92 - ri * .16)}>{Array.from({ length: row.n }, (_, j) => <g key={j} data-atlas-sphere="" transform={`translate(${left + j * step} ${row.y})`}>
        <circle r={row.r} strokeWidth="1.45" />
        {[.89, .65, .35].map(z => <g key={z} strokeWidth="1.015" opacity=".82"><ellipse rx={row.r} ry={row.r * z} /><ellipse rx={row.r * z} ry={row.r} /></g>)}
      </g>)}</g>
    })}
  </svg>
}
