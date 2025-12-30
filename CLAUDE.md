# Jigged - Manufacturing ERP

## Project Overview

Jigged is a web-based ERP system designed for small-scale precision manufacturing shops. It centralizes work orders, inventory tracking, and shop-floor status with AI-driven insights and gamification for operators.

## Tech Stack

- **Frontend:** Next.js 16+ with TypeScript, Material-UI (MUI) v7+
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL on Supabase
- **Authentication:** Supabase Auth
- **Hosting:** Vercel

---

## AI Assistant Guidelines

**Context7 Usage:**
Always use Context7 when code generation, setup or configuration steps, or library/API documentation is needed. This means automatically using the Context7 MCP tools to resolve library IDs and get library docs without requiring explicit requests.

---

## Design System: Jigged Manufacturing ERP (Material-UI)

**Framework:** Material-UI (MUI) v7+ with Material Design 3 principles

### Brand Colors (User-Tested)

| Color | Hex | Usage |
|-------|-----|-------|
| Steel Blue | `#4682B4` | Primary actions, links, CTAs |
| Deep Indigo | `#111439` | Dark mode base |
| Neutral Gray | `#B0B3B8` | Secondary text, supporting elements |

### Status Colors

| Status | Hex | Usage |
|--------|-----|-------|
| Success | `#10b981` | Completed work orders, positive feedback |
| Warning | `#f59e0b` | Approaching deadlines, caution states |
| Error | `#ef4444` | Late jobs, critical issues, overdue |
| Info | `#3b82f6` | Active work, informational notices |

### Background Gradients

```css
/* Light Mode - Evokes machined metal surfaces */
linear-gradient(135deg, #f0f4f8 0%, #d4dce6 100%)

/* Dark Mode - Industrial machine shop aesthetic */
linear-gradient(135deg, #111439 0%, #1a1f4a 100%)
```

### MUI Theme Configuration

The design system uses MUI's `createTheme()` with custom palette and component overrides. Light/dark mode switches automatically based on system preference using MUI's `useMediaQuery` and `ThemeProvider`.

**Key Theme Settings:**
- Primary: Steel Blue (`#4682B4`) with light/dark variants for hover/pressed states
- Border Radius: 8px globally via `theme.shape.borderRadius`
- Buttons: `textTransform: 'none'` (no ALL CAPS)
- TextFields: `variant: 'outlined'` default
- Typography: System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)

### Design Principles

1. **Professional, Not Trendy** - Must appeal to 50-60 year old shop owners. Focus on clarity and function.
2. **Industrial Aesthetic** - Evoke machined metal and precision. Colors should feel substantial, not playful.
3. **Readable in Bright Environments** - Ensure sufficient contrast for use under bright fluorescent lighting on tablets.
4. **Automatic Theme Switching** - Respect user's system preference using `useMediaQuery('(prefers-color-scheme: dark)')`.
5. **Material Design Compliance** - Follow MD3 guidelines for consistency and accessibility.

### Component Guidelines

**Always use MUI components:**
- `Button`, `TextField`, `Card`, `Paper`, `Box`, `Typography`
- `List`, `ListItem`, `ListItemButton`, `ListItemText`
- `Alert`, `CircularProgress`, `Chip`
- `Container`, `Grid`, `Stack`

**Styling approach:**
- Use MUI's `sx` prop for component-level styles
- Use `theme.spacing(n)` where n * 8px for consistent spacing
- Use MUI's elevation system (`elevation={0-24}`) instead of custom shadows
- Never use external CSS files for MUI components
- Never use plain HTML elements when MUI equivalents exist

**Elevation Usage:**
- `0`: Flat surfaces
- `2`: Standard cards
- `3`: Auth cards, modals
- `4`: App bar
- `8`: Floating action buttons

**Typography Scale:**
- `h1`: 2.5rem (40px) - Page titles
- `h2`: 2rem (32px) - Section headers
- `h3`: 1.75rem (28px) - Subsection headers
- `h4`: 1.5rem (24px) - Card titles
- `h5`: 1.25rem (20px) - Small headers
- `h6`: 1rem (16px) - Labels
- `body1`: 1rem (16px) - Primary body text
- `body2`: 0.875rem (14px) - Secondary body text

### Mobile/Shop Floor Requirements

1. **Large Touch Targets:** Minimum 48px height for buttons/inputs
2. **Readable Text:** Minimum 16px font size for body text
3. **Simple Navigation:** Use bottom navigation for primary actions on mobile
4. **QR Code Scanning:** Design with large scanning area
5. **Landscape Support:** Ensure work order details are usable in landscape mode

### Accessibility (WCAG 2.1 Level A)

- Color contrast: Text on background minimum 4.5:1
- Large text (18pt+): Minimum 3:1
- All elements keyboard accessible with visible focus indicators
- Touch targets: Minimum 48px x 48px
- Use semantic HTML and proper ARIA labels

---

## Multi-Tenancy Model

Jigged is a multi-tenant SaaS application where each company's data is isolated, but a single user can have access to multiple companies.

### Database Schema

```sql
-- Companies table
companies (id, name, created_at, updated_at)

-- User-Company access junction table
user_company_access (id, user_id, company_id, role, created_at)

-- User preferences
user_preferences (id, user_id, last_company_id, created_at, updated_at)
```

### URL Structure

All app routes include a `companyId` to ensure data isolation:
- `/dashboard/{companyId}`
- `/work-orders/{companyId}`
- `/inventory/{companyId}`

### Auth Flow

1. User logs in
2. System checks companies user has access to
3. If 1 company: Direct to `/dashboard/{companyId}`
4. If multiple companies + has last_company_id: Direct to that dashboard
5. If multiple companies + no preference: Show company selector
6. If no companies: Show no-access page

---

## Project Structure

```
/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page (redirects)
│   ├── login/               # Login page
│   ├── signup/              # Sign up page
│   ├── select-company/      # Company selector
│   ├── no-access/           # No access page
│   └── dashboard/[companyId]/ # Dashboard (protected)
├── components/
│   ├── auth/                # Auth-related components
│   └── providers/           # Context providers
├── lib/
│   ├── theme.ts            # MUI theme configuration
│   └── supabase.ts         # Supabase client
├── utils/
│   └── companyAccess.ts    # Company access helpers
└── api/                     # FastAPI backend
    └── index.py
```

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Run frontend dev server
pnpm dev

# Run backend dev server (separate terminal)
cd api && python index.py

# Build for production
pnpm build
```
