// A small JPEG of an attached image, stored with the message so a reload can show
// it whole. The original still goes to the model; this is display-only.
export async function imageThumbnail(src: string, maxSide = 320): Promise<string | null> {
  try {
    const image = new Image()
    image.src = src
    await image.decode()
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) return null
    // JPEG has no alpha; paint white under transparent images.
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const thumbnail = canvas.toDataURL('image/jpeg', 0.75)
    return thumbnail.length <= 96 * 1024 ? thumbnail : canvas.toDataURL('image/jpeg', 0.5)
  } catch {
    return null
  }
}

// A larger, bounded copy that the design agent may embed in the generated HTML.
// Keeping the complete asset under 360 KiB leaves room inside the 512 KiB artifact.
export async function imageDesignAsset(src: string, maxSide = 1920, maxLength = 360 * 1024): Promise<{ data: string; mimeType: string } | null> {
  try {
    const image = new Image()
    image.src = src
    await image.decode()
    let scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
    for (let attempt = 0; attempt < 8; attempt++) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(2, Math.round(image.naturalWidth * scale / 2) * 2)
      canvas.height = Math.max(2, Math.round(image.naturalHeight * scale / 2) * 2)
      const context = canvas.getContext('2d')
      if (!context) return null
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const url = canvas.toDataURL('image/webp', Math.max(0.5, 0.9 - attempt * 0.07))
      if (url.length <= maxLength) {
        return { mimeType: 'image/webp', data: url.slice(url.indexOf(',') + 1) }
      }
      scale *= 0.82
    }
    return null
  } catch {
    return null
  }
}
