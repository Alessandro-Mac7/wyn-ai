# PLAN-009: Venue Info Display, Wine Menu Panel, and Mobile Sidebar

## Status
- [x] Draft
- [ ] Under Review
- [ ] Approved
- [ ] In Progress
- [ ] Completed

## Metadata
| Field | Value |
|-------|-------|
| Author | AGENT_ARCHITECT |
| Created | 2025-01-08 |
| Type | feature |
| Priority | P1 |
| Dependencies | PLAN-007 (frontend UI), session-context |
| Branch | feature/venue-ui-enhancements |

---

## 1. Summary

This plan covers four interconnected features to enhance the venue mode experience in the chat interface:

1. **Venue Description Display** - Show venue information (name, description, address) when a venue is selected
2. **Wine Menu Slide-in Panel** - A right-side sliding panel displaying the venue's wine list with structured summaries
3. **Wine Summaries** - Structured display of wine information within the panel
4. **Mobile Sidebar Toggle** - Collapsible left navigation sidebar for mobile viewports

These features work together to provide users with comprehensive venue and wine information while chatting.

---

## 2. Goals

- Display venue context prominently when in venue mode
- Provide quick access to the venue's wine menu without leaving chat
- Show structured wine information (type, price, description, ratings)
- Improve mobile UX with collapsible navigation
- Maintain existing chat functionality and data flow
- Reuse existing patterns (WineSidebar animation, session context)

---

## 3. Non-Goals

- Modifying the existing chat API
- Adding wine ordering functionality
- Implementing wine search/filtering in the panel (future enhancement)
- Admin wine editing from the customer panel
- Changing the venue selection flow

---

## 4. Affected Areas

| Area | Impact | Type |
|------|--------|------|
| `components/chat/VenueHeader.tsx` | Extend with description toggle | Modify |
| `components/chat/VenueInfoCard.tsx` | New - venue description display | Create |
| `components/chat/WineMenuPanel.tsx` | New - slide-in wine list panel | Create |
| `components/chat/WineMenuItem.tsx` | New - individual wine card in panel | Create |
| `components/layout/Sidebar.tsx` | Add mobile toggle functionality | Modify |
| `components/layout/MobileSidebarToggle.tsx` | New - hamburger menu button | Create |
| `app/chat/page.tsx` | Integrate new components | Modify |
| `hooks/useVenue.ts` | Extend to expose wines array | Modify |
| `types/index.ts` | No changes needed (types exist) | None |
| `contexts/session-context.tsx` | No changes needed | None |

---

## 5. Technical Design

### 5.1 Architecture Overview

```
+------------------------------------------------------------------+
|                         CHAT PAGE LAYOUT                          |
+------------------------------------------------------------------+
|                                                                    |
|  +--------+  +------------------------------------------+  +----+ |
|  |        |  |                                          |  |    | |
|  | LEFT   |  |           MAIN CONTENT                   |  |WINE| |
|  | SIDEBAR|  |                                          |  |MENU| |
|  |        |  |  +------------------------------------+  |  |PANEL|
|  | (nav)  |  |  |        VENUE HEADER                |  |  |    | |
|  |        |  |  | [Badge] Name    [Info] [Wine] [X]  |  |  |(slide|
|  |        |  |  +------------------------------------+  |  | in) | |
|  |        |  |                                          |  |    | |
|  | Mobile:|  |  +------------------------------------+  |  |    | |
|  | Toggle |  |  |     VENUE INFO CARD (collapsible)  |  |  |    | |
|  |  [=]   |  |  |     Description, Address, City     |  |  |    | |
|  |        |  |  +------------------------------------+  |  |    | |
|  |        |  |                                          |  |    | |
|  |        |  |           CHAT MESSAGES                  |  |    | |
|  |        |  |                                          |  |    | |
|  |        |  |           CHAT INPUT                     |  |    | |
|  +--------+  +------------------------------------------+  +----+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.2 Component Hierarchy

```
ChatPage (app/chat/page.tsx)
|
+-- MobileSidebarToggle (new)
|   +-- Hamburger icon
|   +-- onClick -> toggle sidebar visibility
|
+-- Sidebar (modified)
|   +-- Mobile: overlay mode with close button
|   +-- Desktop: always visible (unchanged)
|
+-- Main Content Area
|   |
|   +-- VenueHeader (modified)
|   |   +-- Venue badge + name (existing)
|   |   +-- Wine stats (existing)
|   |   +-- NEW: Info button (toggle VenueInfoCard)
|   |   +-- NEW: Wine menu button (toggle WineMenuPanel)
|   |   +-- Close button (existing)
|   |
|   +-- VenueInfoCard (new, collapsible)
|   |   +-- Venue description
|   |   +-- Address + City
|   |   +-- Optional: phone, hours (future)
|   |
|   +-- ChatMessages (unchanged)
|   |
|   +-- ChatInput (unchanged)
|
+-- WineMenuPanel (new, slide-in from right)
    +-- Header with title + close
    +-- Wine list (scrollable)
    |   +-- WineMenuItem (repeated)
    |       +-- Type badge
    |       +-- Name + Year
    |       +-- Producer + Region
    |       +-- Price (bottle/glass)
    |       +-- Ratings (if available)
    |       +-- Brief description
    +-- Footer with wine count
```

### 5.3 State Management

The features use a combination of:

1. **Session Context** (existing) - Venue data, filters
2. **useVenue hook** (existing, to extend) - Wines array, loading states
3. **Local component state** - Panel visibility, sidebar visibility

```typescript
// Chat page state additions
const [showVenueInfo, setShowVenueInfo] = useState(false)
const [showWinePanel, setShowWinePanel] = useState(false)
const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile only

// From useVenue (to extend)
const { venue, wines, wineStats, isLoading, error } = useVenue()
```

### 5.4 Data Flow

```
                    +----------------+
                    |  API: /api/    |
                    |  venue/[slug]  |
                    +-------+--------+
                            |
                            | { venue, wines }
                            v
                    +----------------+
                    |   useVenue     |
                    |   hook         |
                    +-------+--------+
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
+---------------+   +---------------+   +---------------+
| VenueHeader   |   | VenueInfoCard |   | WineMenuPanel |
| (name, stats) |   | (description) |   | (wines list)  |
+---------------+   +---------------+   +---------------+
```

**Key Points:**
- The `/api/venue/[slug]` endpoint already returns both `venue` and `wines`
- `useVenue` hook already fetches wines but only exposes `wineStats`
- Extend `useVenue` to expose the full `wines` array for the panel

### 5.5 New Component Specifications

#### 5.5.1 VenueInfoCard

```typescript
interface VenueInfoCardProps {
  venue: Venue
  isExpanded: boolean
  onToggle: () => void
}

// Features:
// - Collapsible/expandable with animation
// - Shows: description (multiline), address, city
// - Positioned below VenueHeader
// - Subtle background to differentiate from chat
```

#### 5.5.2 WineMenuPanel

```typescript
interface WineMenuPanelProps {
  isOpen: boolean
  onClose: () => void
  wines: WineWithRatings[]
  isLoading: boolean
}

// Features:
// - Slide-in from right (reuse WineSidebar animation)
// - Fixed position, full height
// - Width: max-w-md (same as WineSidebar)
// - Scrollable wine list
// - Shows total wine count in header
// - Backdrop overlay on mobile
```

#### 5.5.3 WineMenuItem

```typescript
interface WineMenuItemProps {
  wine: WineWithRatings
}

// Features:
// - Compact card design
// - Wine type badge (colored)
// - Name + Year
// - Producer, Region
// - Price (bottle), price_glass (if available)
// - Top rating (if ratings exist)
// - Truncated description (2 lines)
// - No edit/toggle (customer view only)
```

#### 5.5.4 MobileSidebarToggle

```typescript
interface MobileSidebarToggleProps {
  isOpen: boolean
  onToggle: () => void
}

// Features:
// - Hamburger icon (Menu from lucide)
// - Fixed position top-left (above sidebar z-index)
// - Only visible on mobile (hidden on sm: and up)
// - Transforms to X when open
```

### 5.6 Sidebar Modifications

Current sidebar (`components/layout/Sidebar.tsx`):
- Fixed position, always visible
- Width: 56px (mobile) / 64px (desktop)

Modified behavior:
- **Desktop (sm: and up):** Unchanged - always visible
- **Mobile (below sm:):**
  - Default: hidden (off-screen left)
  - When toggled: slides in as overlay
  - Backdrop behind sidebar
  - Close button or backdrop click to dismiss

```typescript
interface SidebarProps {
  onHomeClick?: () => void
  // NEW:
  isMobileOpen?: boolean
  onMobileClose?: () => void
}
```

### 5.7 VenueHeader Modifications

Add two new action buttons:

```typescript
interface VenueHeaderProps {
  venue: Venue
  wineStats?: { total: number; types: number }
  selectedTypes: WineType[]
  onFilterChange: (types: WineType[]) => void
  onClose: () => void
  // NEW:
  onInfoToggle: () => void
  onWineMenuToggle: () => void
  isInfoExpanded: boolean
  isWineMenuOpen: boolean
}
```

Button layout in header:
```
[MapPin Badge: Locale] [Venue Name]     [Stats] [Info] [Wine] [X]
                                                  ^       ^
                                            new buttons
```

### 5.8 useVenue Hook Extension

Current return:
```typescript
interface UseVenueReturn {
  venue: Venue | null
  isLoading: boolean
  error: string | null
  wineStats: { total: number; types: number } | null
  loadVenue: (slug: string) => Promise<void>
  clearVenue: () => void
}
```

Extended return:
```typescript
interface UseVenueReturn {
  venue: Venue | null
  wines: WineWithRatings[]  // NEW - expose wines array
  isLoading: boolean
  error: string | null
  wineStats: { total: number; types: number } | null
  loadVenue: (slug: string) => Promise<void>
  clearVenue: () => void
}
```

### 5.9 Animation Specifications

Reuse existing animation patterns from `WineSidebar`:

```typescript
// Wine panel slide-in (same as WineSidebar)
const panelVariants = {
  hidden: { x: '100%', opacity: 0.8 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  exit: {
    x: '100%',
    opacity: 0.8,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] }
  }
}

// Mobile sidebar slide-in (mirror of above, from left)
const mobileSidebarVariants = {
  hidden: { x: '-100%', opacity: 0.8 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  exit: {
    x: '-100%',
    opacity: 0.8,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] }
  }
}

// Venue info expand/collapse
const infoCardVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' }
  }
}
```

### 5.10 Responsive Breakpoints

| Breakpoint | Sidebar | Wine Panel | Info Card |
|------------|---------|------------|-----------|
| < 640px (mobile) | Hidden (toggle) | Full-screen overlay | Full width |
| >= 640px (sm) | Always visible | Side panel (max-w-md) | Full width |
| >= 1024px (lg) | Always visible | Side panel (max-w-lg) | Inline |

---

## 6. API Contracts

No new API endpoints required. Existing endpoint provides all necessary data:

### GET /api/venue/[slug]

**Current Response (unchanged):**
```typescript
{
  venue: Venue,
  wines: WineWithRatings[]  // Already returned, just need to expose in hook
}
```

---

## 7. Implementation Steps

### Phase 1: Hook and Data Layer
- [ ] 1.1 Extend `useVenue` hook to return wines array
- [ ] 1.2 Add wines state to hook internals

### Phase 2: Venue Info Display
- [ ] 2.1 Create `VenueInfoCard` component
- [ ] 2.2 Modify `VenueHeader` to add info toggle button
- [ ] 2.3 Integrate into chat page with expand/collapse

### Phase 3: Wine Menu Panel
- [ ] 3.1 Create `WineMenuItem` component
- [ ] 3.2 Create `WineMenuPanel` component
- [ ] 3.3 Add wine menu button to `VenueHeader`
- [ ] 3.4 Integrate panel into chat page

### Phase 4: Mobile Sidebar
- [ ] 4.1 Create `MobileSidebarToggle` component
- [ ] 4.2 Modify `Sidebar` for mobile overlay mode
- [ ] 4.3 Add sidebar state to chat page
- [ ] 4.4 Add backdrop and close behavior

### Phase 5: Integration and Polish
- [ ] 5.1 Wire up all components in chat page
- [ ] 5.2 Test responsive behavior at all breakpoints
- [ ] 5.3 Ensure animations are smooth
- [ ] 5.4 Handle edge cases (no wines, loading states)

---

## 8. Test Strategy

### Unit Tests
- [ ] `VenueInfoCard` renders venue details correctly
- [ ] `WineMenuItem` displays wine information properly
- [ ] `WineMenuPanel` handles empty wines array
- [ ] `useVenue` hook returns wines array

### Integration Tests
- [ ] Info card expands/collapses on button click
- [ ] Wine panel opens/closes with animation
- [ ] Mobile sidebar toggles correctly
- [ ] All three features work together without conflicts

### Visual/Manual Tests
- [ ] Compare against design system colors
- [ ] Test on mobile viewport (375px width)
- [ ] Test on tablet viewport (768px width)
- [ ] Test on desktop viewport (1440px width)
- [ ] Verify animations are smooth (60fps)

---

## 9. Rollback Plan

All changes are additive UI components. Rollback strategy:

1. **Immediate:** Hide new buttons in VenueHeader (set display: none)
2. **Partial:** Remove individual components from chat page render
3. **Full:** Revert git commits for new component files

No database or API changes, so rollback is low-risk.

---

## 10. Review Criteria

- [ ] Venue info displays correctly with all venue fields
- [ ] Wine panel shows accurate wine data from venue
- [ ] Mobile sidebar functions without breaking desktop
- [ ] No TypeScript errors
- [ ] No console errors or warnings
- [ ] Animations match existing patterns (WineSidebar)
- [ ] Dark theme styling consistent
- [ ] Italian language labels used throughout
- [ ] Accessibility: keyboard navigation works, focus management correct

---

## 11. Open Questions

1. **Wine Panel Filtering:** Should the wine panel include filter chips like VenueHeader? (Recommend: defer to future enhancement)

2. **Panel Width on Large Screens:** Should the wine panel be wider on xl: screens? (Recommend: start with max-w-md, evaluate after implementation)

3. **Info Card Default State:** Should VenueInfoCard start expanded or collapsed? (Recommend: collapsed to prioritize chat space)

4. **Panel Coexistence:** Can VenueInfoCard and WineMenuPanel be open simultaneously? (Recommend: yes, they occupy different spaces)

---

## 12. File Structure Summary

```
components/
  chat/
    VenueInfoCard.tsx      # NEW - venue description display
    WineMenuPanel.tsx      # NEW - slide-in wine list
    WineMenuItem.tsx       # NEW - wine card in panel
    VenueHeader.tsx        # MODIFY - add toggle buttons
  layout/
    Sidebar.tsx            # MODIFY - mobile overlay mode
    MobileSidebarToggle.tsx # NEW - hamburger button

hooks/
  useVenue.ts              # MODIFY - expose wines array

app/
  chat/
    page.tsx               # MODIFY - integrate new components
```

---

## 13. Dependencies

This plan depends on:
- **PLAN-007** (completed): Frontend UI implementation
- **Session context** (implemented): Venue state management
- **useVenue hook** (implemented): Venue data fetching
- **/api/venue/[slug]** (implemented): Returns venue + wines

---

**This plan defines the architecture. Implementers should follow this design.**
