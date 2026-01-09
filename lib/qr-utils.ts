/**
 * QR Code Utility Functions
 *
 * Provides utilities for generating venue chat URLs and handling QR code operations
 * (download, print, copy to clipboard).
 */

/**
 * Generate venue chat URL
 */
export function getVenueChatUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wyn.app'
  return `${baseUrl}/v/${slug}`
}

/**
 * Download QR code as PNG from canvas
 */
export function downloadQrCode(
  canvasRef: HTMLCanvasElement,
  fileName: string
): void {
  const url = canvasRef.toDataURL('image/png')
  const link = document.createElement('a')
  link.download = `${fileName}-qr.png`
  link.href = url
  link.click()
}

/**
 * Print QR code with venue information
 */
export function printQrCode(
  imageDataUrl: string,
  venueName: string,
  venueUrl: string
): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>QR Code - ${venueName}</title>
        <style>
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            font-family: system-ui, sans-serif;
          }
          img { width: 300px; height: 300px; }
          h1 { margin: 20px 0 10px; font-size: 24px; }
          p { margin: 0; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <img src="${imageDataUrl}" alt="QR Code" />
        <h1>${venueName}</h1>
        <p>${venueUrl}</p>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}

/**
 * Copy URL to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
