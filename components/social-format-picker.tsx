'use client'

import { useId } from 'react'
import { SOCIAL_FORMATS, socialFormatLabel, validSocialSize, type SocialFormat } from '../lib/social-formats'

export default function SocialFormatPicker({ value, onChange, disabled = false, original = false }: {
  value: SocialFormat | null; onChange: (format: SocialFormat | null) => void; disabled?: boolean; original?: boolean
}) {
  const id = useId()
  const invalid = value !== null && !validSocialSize(value)
  const custom = value?.id === 'custom'
  const networks = [...new Set(SOCIAL_FORMATS.map(format => format.network))]
  return <fieldset data-invalid={invalid || undefined} disabled={disabled} className="flex min-w-0 flex-col gap-2">
    <label htmlFor={id} className="text-xs text-muted-foreground">Red y formato</label>
    <select id={id} value={value?.id ?? 'original'} onChange={event => {
      const selected = event.target.value
      if (selected === 'original') onChange(null)
      else if (selected === 'custom') onChange({ id: 'custom', network: 'Personalizado', label: 'Medidas propias', width: value?.width ?? 1080, height: value?.height ?? 1350 })
      else onChange(SOCIAL_FORMATS.find(format => format.id === selected)!)
    }} className="min-h-9 w-full min-w-0 border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {original && <option value="original">Original · cada placa en su tamaño</option>}
      {networks.map(network => <optgroup key={network} label={network}>{SOCIAL_FORMATS.filter(format => format.network === network).map(format => <option key={format.id} value={format.id}>{socialFormatLabel(format)}</option>)}</optgroup>)}
      <option value="custom">Otra red / medidas personalizadas</option>
    </select>
    {custom && <div className="grid grid-cols-2 gap-2">{(['width','height'] as const).map(dimension => <label key={dimension} htmlFor={`${id}-${dimension}`} className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">{dimension === 'width' ? 'Ancho (px)' : 'Alto (px)'}<input id={`${id}-${dimension}`} aria-invalid={invalid || undefined} type="number" min={64} max={4096} step={1} value={value[dimension] || ''} onChange={e => onChange({ ...value, [dimension]: Number(e.target.value) })} className="min-h-9 min-w-0 border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>)}</div>}
    {invalid && <p role="status" className="text-xs text-destructive">Usá entre 64 y 4096 px por lado, hasta 16 megapíxeles.</p>}
  </fieldset>
}
