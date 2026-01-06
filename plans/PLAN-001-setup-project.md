# PLAN-001: Initial Project Setup

## Status
- [x] Approved
- [x] Completed

## Metadata
| Field | Value |
|-------|-------|
| Author | AGENT_ARCHITECT |
| Created | 2024-12-30 |
| Type | setup |
| Priority | P0 |

---

## 1. Summary

Initialize the WYN Next.js project with all required dependencies, configuration, and project structure.

---

## 2. Goals

- Create Next.js 14 project with TypeScript
- Install all required dependencies
- Configure Tailwind and shadcn/ui
- Create directory structure
- Set up environment configuration

---

## 3. Non-Goals

- Implementing features (that's PLAN-002+)
- Setting up CI/CD (that's ops later)
- Creating test infrastructure (that's part of implementation)

---

## 4. Technical Design

### 4.1 Project Creation

```bash
pnpm create next-app@latest wyn \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

### 4.2 Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "lucide-react": "^0.x",
    "zustand": "^4.x"
  },
  "devDependencies": {
    "vitest": "^1.x",
    "@testing-library/react": "^14.x"
  }
}
```

### 4.3 shadcn/ui Setup

```bash
pnpm dlx shadcn@latest init
# Style: Default
# Base color: Slate
# CSS variables: Yes

pnpm dlx shadcn@latest add button input switch card label textarea
```

### 4.4 Directory Structure

```
wyn/
├── CLAUDE.md
├── plans/
│   └── README.md
├── agents/
│   ├── AGENT_ARCHITECT.md
│   ├── AGENT_IMPLEMENTER_BE.md
│   ├── AGENT_IMPLEMENTER_FE.md
│   ├── AGENT_REVIEWER.md
│   └── AGENT_OPS.md
├── commands/
│   └── README.md
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── chat/
│   │   └── page.tsx
│   ├── v/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── admin/
│   │   ├── page.tsx
│   │   └── dashboard/
│   │       └── page.tsx
│   └── api/
│       ├── chat/
│       │   └── route.ts
│       └── admin/
│           ├── login/
│           │   └── route.ts
│           └── wines/
│               └── route.ts
├── components/
│   ├── chat/
│   ├── admin/
│   └── ui/
├── hooks/
├── lib/
├── config/
├── types/
│   └── index.ts
└── public/
```

### 4.5 Environment Template

```env
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GROQ_API_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_NAME=WYN
```

---

## 5. Implementation Steps

1. [x] Create Next.js project
2. [x] Install dependencies
3. [x] Initialize shadcn/ui
4. [x] Add shadcn components
5. [x] Create directory structure
6. [x] Create .env.example
7. [x] Create placeholder files
8. [x] Verify dev server runs

---

## 6. Verification

```bash
# After setup
cd wyn
pnpm dev

# Verify
# - http://localhost:3000 loads
# - No console errors
# - TypeScript compiles
```

---

## 7. Next Steps

After PLAN-001 is complete:
- PLAN-002: Database schema and Supabase setup
- PLAN-003: Core types and lib functions
- PLAN-004: Chat feature implementation
- PLAN-005: Admin panel implementation
- PLAN-006: AI enrichment feature

---

**This plan establishes the foundation for all subsequent development.**
