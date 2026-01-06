# PLAN-007: Frontend UI/UX Implementation

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
| Created | 2025-01-02 |
| Type | feature |
| Priority | P1 |
| Dependencies | PLAN-001 (setup) |

---

## 1. Summary

Implement the complete frontend UI/UX for WYN following the mockups provided in the `mockup/` folder. This plan covers the design system, layout, and all user-facing pages.

---

## 2. Design Reference

> **IMPORTANT:** All UI implementation MUST follow the mockups in `mockup/` folder.

| Mockup | File | Description |
|--------|------|-------------|
| Home/Chat | `mockup/home.png` | Main landing with chat interface |
| About | `mockup/about.png` | "Scopri WYN" feature showcase |
| Admin Login | `mockup/admin-login.png` | Authentication page |
| Admin Panel | `mockup/admin-paanel.png` | Wine management dashboard |
| Add Wine | `mockup/add-new-wine.png` | Wine creation modal |

---

## 3. Goals

- Implement dark theme matching mockups exactly
- Create responsive sidebar navigation
- Build chat interface with mode toggle (Chat/Venue)
- Build admin dashboard with wine cards
- Ensure mobile-first responsive design
- Follow Italian language UI as shown

---

## 4. Non-Goals

- Backend API implementation (covered in PLAN-003, PLAN-004, PLAN-005)
- Database integration (covered in PLAN-002)
- AI/LLM integration (covered in PLAN-004, PLAN-006)

---

## 5. Design System

### 5.1 Color Palette (from mockups)

```css
:root {
  /* Background */
  --bg-primary: #1a1a1a;       /* Main dark background */
  --bg-secondary: #242424;     /* Cards, sidebar */
  --bg-tertiary: #2d2d2d;      /* Input fields, hover states */

  /* Text */
  --text-primary: #ffffff;     /* Headings, important text */
  --text-secondary: #a0a0a0;   /* Body text, descriptions */
  --text-muted: #666666;       /* Placeholders, hints */

  /* Accent - Wine Red */
  --accent-primary: #8b2942;   /* Primary buttons, active states */
  --accent-hover: #a33350;     /* Button hover */
  --accent-light: #d4a5b0;     /* Wine glass icon, subtle accents */

  /* Semantic */
  --success: #22c55e;          /* Available toggle */
  --warning: #eab308;          /* Ratings */
  --error: #ef4444;            /* Errors */

  /* Borders */
  --border-subtle: #333333;    /* Card borders */
  --border-input: #404040;     /* Input borders */
}
```

### 5.2 Typography

```css
/* Headings */
--font-heading: 'Inter', sans-serif;
--heading-xl: 3rem;    /* WYN logo */
--heading-lg: 2rem;    /* Page titles */
--heading-md: 1.5rem;  /* Section titles */
--heading-sm: 1.125rem; /* Card titles */

/* Body */
--font-body: 'Inter', sans-serif;
--body-lg: 1rem;
--body-md: 0.875rem;
--body-sm: 0.75rem;
```

### 5.3 Component Patterns

| Component | Pattern | Reference |
|-----------|---------|-----------|
| Buttons | Wine-red primary, ghost secondary | `admin-login.png` |
| Inputs | Dark bg, subtle border, icon prefix | `admin-login.png` |
| Cards | Dark bg, subtle border, rounded-lg | `admin-paanel.png` |
| Badges | Colored bg (Rosso/Bianco/Spumante) | `admin-paanel.png` |
| Toggles | Green when on, gray when off | `admin-paanel.png` |
| Modals | Centered, dark overlay | `add-new-wine.png` |

---

## 6. Affected Areas

| Area | Impact |
|------|--------|
| `app/globals.css` | Update with dark theme variables |
| `tailwind.config.ts` | Extend with custom colors |
| `components/ui/*` | Update shadcn components for dark theme |
| `components/layout/Sidebar.tsx` | New - Main navigation |
| `components/layout/Header.tsx` | New - Admin header |
| `components/chat/ChatInput.tsx` | New - Chat input with mode toggle |
| `components/chat/ChatMessage.tsx` | New - Message bubbles |
| `components/chat/QuickSuggestions.tsx` | New - Suggestion chips |
| `components/admin/WineCard.tsx` | New - Wine display card |
| `components/admin/WineFilters.tsx` | New - Type filter tabs |
| `components/admin/WineModal.tsx` | New - Add/Edit wine modal |
| `components/admin/LoginForm.tsx` | New - Admin login form |
| `app/page.tsx` | Update - Home/Chat page |
| `app/chat/page.tsx` | Update - Chat interface |
| `app/admin/page.tsx` | Update - Login page |
| `app/admin/dashboard/page.tsx` | Update - Wine management |

---

## 7. Technical Design

### 7.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MAIN LAYOUT                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐  ┌────────────────────────────────────────────────┐  │
│  │          │  │                                                 │  │
│  │  SIDEBAR │  │                    CONTENT                      │  │
│  │          │  │                                                 │  │
│  │  - Logo  │  │  (Varies by route:                             │  │
│  │  - Chat  │  │   - Home: Chat interface                       │  │
│  │  - Venue │  │   - About: Feature cards                       │  │
│  │  - About │  │   - Admin: Dashboard)                          │  │
│  │  - More  │  │                                                 │  │
│  │          │  │                                                 │  │
│  └──────────┘  └────────────────────────────────────────────────┘  │
│                                                                      │
│  Width: 60px (collapsed) / 200px (expanded on hover)                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Sidebar Navigation (from `home.png`)

```typescript
interface NavItem {
  icon: LucideIcon
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: MessageCircle, label: 'Chat', href: '/chat' },
  { icon: MapPin, label: 'Venue', href: '/v' },
  { icon: Sparkles, label: 'Scopri WYN', href: '/about' },
]
```

### 7.3 Chat Interface (from `home.png`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CHAT PAGE                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                        🍷 WYN                                        │
│                   Il tuo sommelier AI personale                      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Chiedimi qualsiasi cosa sul vino...                      ↑   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│              [💬 Chat]  [📍 Venue]                                   │
│              Premi Invio per inviare                                │
│                                                                      │
│   [Rosso per la carne] [Vini sotto 30€] [Bollicine aperitivo]      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Components:**
- `ChatInput`: Text input with send button
- `ModeToggle`: Chat/Venue switch (Chat = general, Venue = requires slug)
- `QuickSuggestions`: Pre-defined prompt chips

### 7.4 Admin Login (from `admin-login.png`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LOGIN PAGE                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│              ┌────────────────────────────────────┐                 │
│              │           🍷                        │                 │
│              │        Bentornato                   │                 │
│              │  Accedi per gestire la carta...    │                 │
│              │                                     │                 │
│              │  Email                              │                 │
│              │  ┌─────────────────────────────┐   │                 │
│              │  │ ✉  admin@ristorante.com    │   │                 │
│              │  └─────────────────────────────┘   │                 │
│              │                                     │                 │
│              │  Password                           │                 │
│              │  ┌─────────────────────────────┐   │                 │
│              │  │ 🔒  ••••••••               │   │                 │
│              │  └─────────────────────────────┘   │                 │
│              │                                     │                 │
│              │  [      Accedi →      ]            │                 │
│              │                                     │                 │
│              │  Demo: Inserisci qualsiasi...      │                 │
│              └────────────────────────────────────┘                 │
│                                                                      │
│                     ← Torna alla home                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.5 Admin Dashboard (from `admin-paanel.png`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  🍷 WYN Admin                              ← Torna all'app          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Gestione Vini                              [+ Aggiungi Vino]       │
│  Osteria del Vino • 6 vini                                          │
│                                                                      │
│  ┌────────────────────────┐  [Tutti] [Rosso] [Bianco] [Spumante]   │
│  │ 🔍 Cerca vini...       │                                         │
│  └────────────────────────┘                                         │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ [Rosso] [⭐ 95]                                    [Toggle] │   │
│  │ Barolo Riserva 2018                                         │   │
│  │ 🍇 Cascina Francia  📍 Piemonte                             │   │
│  │ 🍷 Nebbiolo                                                 │   │
│  │ Nebbiolo corposo con note di catrame, rose e ciliegie...   │   │
│  │ € 85 /bottiglia                              €18/calice     │   │
│  │ Valutato da Wine Spectator                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [More wine cards...]                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Wine Card Elements:**
- Type badge (color-coded: Rosso=red, Bianco=amber, Spumante=purple)
- Rating badge with score
- Availability toggle
- Wine name + year
- Producer + Region
- Grape variety
- Tasting notes (truncated)
- Price (bottle + glass)
- Rating source

### 7.6 Add Wine Modal (from `add-new-wine.png`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    🍷 Aggiungi Vino                           [X]   │
├─────────────────────────────────────────────────────────────────────┤
│  Inserisci i dettagli del nuovo vino. I campi con * sono obblig.   │
│                                                                      │
│  Nome del vino *                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ es. Barolo Riserva 2018                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Tipologia *                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Seleziona tipologia                                    ▼    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Prezzo bottiglia (€) *          Prezzo calice (€)                  │
│  ┌────────────────────────┐      ┌────────────────────────┐        │
│  │ 45.00                  │      │ 12.00                  │        │
│  └────────────────────────┘      └────────────────────────┘        │
│                                                                      │
│  Produttore                       Regione                            │
│  ┌────────────────────────┐      ┌────────────────────────┐        │
│  │ es. Cascina Francia    │      │ es. Piemonte           │        │
│  └────────────────────────┘      └────────────────────────┘        │
│                                                                      │
│  Denominazione                    Vitigni                            │
│  ┌────────────────────────┐      ┌────────────────────────┐        │
│  │ es. Barolo DOCG        │      │ es. Nebbiolo, Barbera  │        │
│  └────────────────────────┘      └────────────────────────┘        │
│                                                                      │
│  Descrizione                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Descrivi il vino: note di degustazione, aromi, abbinamenti..│   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│            [Annulla]                    [🍷 Aggiungi Vino]          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Steps

### Phase 1: Design System Setup
1. [ ] Update `tailwind.config.ts` with custom colors
2. [ ] Update `app/globals.css` with CSS variables
3. [ ] Update shadcn components for dark theme
4. [ ] Create `components/icons/WineGlass.tsx` icon

### Phase 2: Layout Components
5. [ ] Create `components/layout/Sidebar.tsx`
6. [ ] Create `components/layout/MainLayout.tsx`
7. [ ] Create `components/layout/AdminHeader.tsx`
8. [ ] Update `app/layout.tsx` to use MainLayout

### Phase 3: Home/Chat Page
9. [ ] Create `components/chat/ChatInput.tsx`
10. [ ] Create `components/chat/ModeToggle.tsx`
11. [ ] Create `components/chat/QuickSuggestions.tsx`
12. [ ] Create `components/chat/ChatMessage.tsx`
13. [ ] Update `app/page.tsx` (Home with chat)
14. [ ] Update `app/chat/page.tsx`

### Phase 4: About Page
15. [ ] Create `components/about/FeatureCard.tsx`
16. [ ] Create `app/about/page.tsx`

### Phase 5: Admin Login
17. [ ] Create `components/admin/LoginForm.tsx`
18. [ ] Update `app/admin/page.tsx`

### Phase 6: Admin Dashboard
19. [ ] Create `components/admin/WineCard.tsx`
20. [ ] Create `components/admin/WineFilters.tsx`
21. [ ] Create `components/admin/WineSearch.tsx`
22. [ ] Create `components/admin/WineModal.tsx`
23. [ ] Update `app/admin/dashboard/page.tsx`

### Phase 7: Polish & Responsive
24. [ ] Add mobile responsive styles
25. [ ] Add loading states
26. [ ] Add error states
27. [ ] Test all pages on mobile viewport

---

## 9. Test Strategy

- **Visual:** Compare implemented UI against mockups
- **Responsive:** Test at 320px, 768px, 1024px, 1440px
- **Accessibility:** Keyboard navigation, color contrast
- **Component:** Storybook stories for all components (optional)

---

## 10. Review Checklist

- [ ] All mockups faithfully implemented
- [ ] Dark theme consistent across all pages
- [ ] Responsive on mobile devices
- [ ] Italian text matches mockups
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Animations smooth (60fps)

---

## 11. Dependencies

This plan depends on:
- **PLAN-001** (completed): Project setup
- **PLAN-002** (pending): Database for wine data
- **PLAN-004** (pending): Chat API for message handling
- **PLAN-005** (pending): Admin API for authentication

UI can be built with mock data first, then connected to APIs.

---

**Reference the `mockup/` folder throughout implementation.**
