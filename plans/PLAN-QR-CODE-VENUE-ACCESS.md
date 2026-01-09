# PLAN-QR-CODE-VENUE-ACCESS: Venue QR Code Generation

## Overview

| Field | Value |
|-------|-------|
| **Feature** | QR Code generation for instant venue chat access |
| **Priority** | Medium |
| **Effort** | 4-6 hours |
| **Branch** | `feature/venue-qr-code` |

---

## 1. Feasibility Analysis

### 1.1 Summary

**FEASIBLE: YES - Low complexity, non-invasive implementation**

The existing architecture already supports this feature:
- Venues have unique, immutable `slug` identifiers
- Route `/v/[slug]` already exists and redirects to `/chat?venue={slug}`
- Chat page handles the `venue` query param to load venue context
- Admin dashboard has access to venue data via `useAdminSession` hook

### 1.2 Key Findings

| Aspect | Finding | Impact |
|--------|---------|--------|
| URL Pattern | `/v/{slug}` already works | No routing changes needed |
| Venue Identification | Slug is deterministic and public | QR can be truly static |
| Authentication | Venue chat is public (no auth required) | No security tokens needed |
| Admin Access | Dashboard has `venue.slug` available | Easy integration |

### 1.3 Existing Flow (from CLAUDE.md)

```
Customer Journey:
QR Code --> /v/[slug] --> Load venue wines --> Chat with AI --> Get recommendations
```

This flow is already implemented. We only need to add QR code generation in the admin panel.

---

## 2. Technical Design

### 2.1 Architecture Decision

**Direct URL Approach (Recommended)**

```
QR Code Content: https://wyn.app/v/{venue-slug}
                        |
                        v
              /v/[slug]/page.tsx (Server)
                        |
                        v
              redirect(`/chat?venue={slug}`)
                        |
                        v
              /chat/page.tsx loads venue context
```

**Why Direct URL:**
- Simplest possible implementation (KISS principle)
- No tokens, no expiration, no backend changes
- Static QR code can be printed once and used forever
- URL is short and clean
- Already works with existing routing

**Alternatives Considered but Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Landing page with venue info | Adds friction, user wants chat immediately |
| Token-based URLs | Unnecessary complexity, no auth benefit for public chat |
| Short URL service | External dependency, adds latency |
| Dynamic QR generation API | Over-engineering for a static asset |

### 2.2 QR Code Library Selection

**Recommended: `qrcode.react`**

| Library | Size | React Support | SVG/Canvas | Recommendation |
|---------|------|---------------|------------|----------------|
| `qrcode.react` | 10KB | Native | Both | **Best choice** |
| `qrcode` | 30KB | Wrapper needed | Both | Heavier |
| `react-qr-code` | 8KB | Native | SVG only | Good alternative |

**Rationale for `qrcode.react`:**
- Maintained and popular (2M+ weekly downloads)
- Direct React component
- Supports both SVG (for print) and Canvas (for download)
- Customizable colors, size, error correction
- No external API calls

### 2.3 File Structure

```
components/
  admin/
    QrCodeDialog.tsx     # NEW - Modal with QR code display
    index.ts             # MODIFY - Export new component

lib/
  qr-utils.ts            # NEW - Download/print utilities

app/
  admin/
    dashboard/
      page.tsx           # MODIFY - Add QR button to header
```

### 2.4 Component Design

```typescript
// QrCodeDialog.tsx - Proposed interface
interface QrCodeDialogProps {
  isOpen: boolean
  onClose: () => void
  venue: {
    slug: string
    name: string
  }
}
```

**UI Elements:**
1. Modal dialog (consistent with existing CsvUploadDialog pattern)
2. Large QR code display (centered, minimum 256px)
3. Venue name and URL text below QR
4. Download button (PNG format)
5. Print button (opens print dialog)
6. Copy URL button (clipboard)

### 2.5 URL Construction

```typescript
// Deterministic URL generation
function getVenueUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wyn.app'
  return `${baseUrl}/v/${slug}`
}
```

**Environment Variable:**
Add `NEXT_PUBLIC_APP_URL` to support different environments:
- Development: `http://localhost:3000`
- Production: `https://wyn.app` (or actual domain)

---

## 3. Security Considerations

### 3.1 Threat Analysis

| Threat | Risk Level | Mitigation |
|--------|------------|------------|
| URL guessing | Low | Slugs are not secret; venue chat is public |
| QR code tampering | N/A | Static image, not our responsibility |
| Venue impersonation | Low | Venue name shown in chat UI |
| Rate limiting | Medium | Existing API rate limits apply |

### 3.2 Conclusion

**No additional security measures needed** - the venue chat is intentionally public and the URL pattern is already exposed. QR code is just a convenient way to share an existing public URL.

---

## 4. Implementation Plan

### Phase 1: Library Setup (30 min)

**Assigned to: Implementer FE**

#### 1.1 Install dependency

```bash
pnpm add qrcode.react
```

#### 1.2 Add environment variable

File: `.env.example`
```env
# App URL for QR codes
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### Phase 2: Utility Functions (1 hour)

**Assigned to: Implementer FE**

#### 2.1 Create QR utilities

File: `lib/qr-utils.ts`

```typescript
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
 * Print QR code
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
```

---

### Phase 3: QR Dialog Component (2 hours)

**Assigned to: Implementer FE**

#### 3.1 Create QrCodeDialog component

File: `components/admin/QrCodeDialog.tsx`

```typescript
'use client'

import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Printer, Copy, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getVenueChatUrl,
  downloadQrCode,
  printQrCode,
  copyToClipboard,
} from '@/lib/qr-utils'

interface QrCodeDialogProps {
  isOpen: boolean
  onClose: () => void
  venue: {
    slug: string
    name: string
  }
}

export function QrCodeDialog({ isOpen, onClose, venue }: QrCodeDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  const venueUrl = getVenueChatUrl(venue.slug)

  const handleDownload = () => {
    const canvas = document.querySelector('#qr-canvas') as HTMLCanvasElement
    if (canvas) {
      downloadQrCode(canvas, venue.slug)
    }
  }

  const handlePrint = () => {
    const canvas = document.querySelector('#qr-canvas') as HTMLCanvasElement
    if (canvas) {
      const imageData = canvas.toDataURL('image/png')
      printQrCode(imageData, venue.name, venueUrl)
    }
  }

  const handleCopy = async () => {
    const success = await copyToClipboard(venueUrl)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-full max-w-md',
              '-translate-x-1/2 -translate-y-1/2',
              'bg-card rounded-xl shadow-2xl border border-border',
              'overflow-hidden'
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">QR Code</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col items-center">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl">
                <QRCodeCanvas
                  id="qr-canvas"
                  value={venueUrl}
                  size={256}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              {/* Venue Info */}
              <div className="mt-4 text-center">
                <h3 className="font-medium text-lg">{venue.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 break-all">
                  {venueUrl}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 w-full">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                  Scarica
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Stampa
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? 'Copiato!' : 'Copia'}
                </Button>
              </div>
            </div>

            {/* Footer Tip */}
            <div className="px-6 pb-6">
              <p className="text-xs text-muted-foreground text-center">
                I clienti possono scansionare questo QR code per accedere
                direttamente alla chat con il sommelier AI.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

#### 3.2 Export from index

File: `components/admin/index.ts`

Add:
```typescript
export { QrCodeDialog } from './QrCodeDialog'
```

---

### Phase 4: Dashboard Integration (1 hour)

**Assigned to: Implementer FE**

#### 4.1 Add QR button to dashboard header

File: `app/admin/dashboard/page.tsx`

**Changes:**
1. Import `QrCodeDialog` and `QrCode` icon
2. Add state for dialog visibility
3. Add button next to "Importa CSV" button
4. Render `QrCodeDialog` component

**Location in existing code (around line 196-215):**

Add to imports:
```typescript
import { Plus, ArrowLeft, Search, Upload, QrCode } from 'lucide-react'
import { QrCodeDialog } from '@/components/admin'
```

Add state:
```typescript
const [showQrCode, setShowQrCode] = useState(false)
```

Add button in action buttons section:
```tsx
<div className="flex gap-2">
  <Button
    variant="outline"
    onClick={() => setShowQrCode(true)}
    className="gap-2"
  >
    <QrCode className="h-4 w-4" />
    QR Code
  </Button>
  <Button
    variant="outline"
    onClick={() => setShowCsvUpload(true)}
    className="gap-2"
  >
    <Upload className="h-4 w-4" />
    Importa CSV
  </Button>
  {/* ... existing Add Wine button ... */}
</div>
```

Add dialog at end of component:
```tsx
{/* QR Code Dialog */}
<QrCodeDialog
  isOpen={showQrCode}
  onClose={() => setShowQrCode(false)}
  venue={{ slug: venue.slug, name: venue.name }}
/>
```

---

### Phase 5: Environment Configuration (15 min)

**Assigned to: Implementer FE / Ops**

#### 5.1 Update .env.example

```env
# App URL (for QR code generation)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 5.2 Configure Vercel environment variable

Set `NEXT_PUBLIC_APP_URL` to production domain in Vercel dashboard.

---

## 5. Test Strategy

### 5.1 Manual Testing Checklist

- [ ] QR button visible in dashboard header
- [ ] Dialog opens on click
- [ ] QR code renders correctly
- [ ] Download produces valid PNG file
- [ ] Print opens print dialog with correct content
- [ ] Copy shows success feedback
- [ ] Scanning QR redirects to venue chat
- [ ] Works on mobile browsers
- [ ] Dialog closes with X button
- [ ] Dialog closes with backdrop click

### 5.2 Edge Cases

- [ ] Very long venue names (truncation)
- [ ] Venues with special characters in slug
- [ ] Offline behavior (should still generate QR)

---

## 6. Files Summary

| File | Action | Description |
|------|--------|-------------|
| `package.json` | MODIFY | Add `qrcode.react` dependency |
| `lib/qr-utils.ts` | CREATE | QR code utility functions |
| `components/admin/QrCodeDialog.tsx` | CREATE | QR code modal component |
| `components/admin/index.ts` | MODIFY | Export new component |
| `app/admin/dashboard/page.tsx` | MODIFY | Add QR button and dialog |
| `.env.example` | MODIFY | Add NEXT_PUBLIC_APP_URL |

---

## 7. Rollback Plan

This feature is additive and isolated:

1. **Immediate rollback:** Remove QR button from dashboard (single line)
2. **Full rollback:** Revert all files in this feature branch
3. **No database changes:** Nothing to migrate
4. **No API changes:** Nothing to deprecate

---

## 8. Non-Goals (Out of Scope)

| Feature | Reason |
|---------|--------|
| QR code analytics/tracking | Add complexity, privacy concerns |
| Custom QR code styling (logo) | MVP simplicity |
| Multiple QR formats | PNG sufficient for print |
| QR code in venue settings | Dashboard button is sufficient |
| Batch QR generation | Single venue per admin |

---

## 9. Future Enhancements (Post-MVP)

- Add WYN logo to center of QR code
- Generate printable table tent template
- Multiple size options for different use cases
- Track QR code scans (optional analytics)

---

## 10. Review Criteria

- [ ] QR code scans correctly on iOS and Android
- [ ] Downloaded PNG is print-quality (300+ DPI equivalent)
- [ ] UI consistent with existing admin panel style
- [ ] No console errors
- [ ] TypeScript types are correct
- [ ] Code follows project conventions (CLAUDE.md)

---

## 11. Agent Assignments

| Phase | Agent | Estimated Time |
|-------|-------|----------------|
| 1. Library Setup | Implementer FE | 30 min |
| 2. Utility Functions | Implementer FE | 1 hour |
| 3. QR Dialog Component | Implementer FE | 2 hours |
| 4. Dashboard Integration | Implementer FE | 1 hour |
| 5. Environment Config | Implementer FE / Ops | 15 min |
| Review | Reviewer | 1 hour |

**Total Estimated Time: 4-6 hours**

---

## Approval

- [x] Architect review (this document)
- [ ] UX review (dialog design)
- [ ] Ready for implementation
