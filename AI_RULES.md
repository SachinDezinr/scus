# AI Rules & Guidelines - Smart Student Utility System

This document outlines the tech stack, directory structure, and specific rules for developing and maintaining the Smart Student Utility System codebase.

---

## 🛠️ Tech Stack Overview

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript (`strict: true`)
- **Styling**: Tailwind CSS v4 with custom glassmorphism and gradient utilities (`globals.css`)
- **Animations**: Framer Motion (`framer-motion`) for smooth layout transitions and page entry animations
- **Component Primitives**: Shadcn UI & Radix UI primitives (`@radix-ui/*`)
- **Icons**: Lucide React (`lucide-react`)
- **Database & Storage**: Supabase (`@supabase/supabase-js`) for database tables & object storage uploads
- **Authentication**: Custom JWT authentication with `jsonwebtoken` and `bcryptjs` password hashing
- **Toast Notifications**: Sonner (`sonner`)
- **Forms & Validation**: React Hook Form (`react-hook-form`) paired with Zod (`zod`) and `@hookform/resolvers`

---

## 📐 Architecture & Directory Layout

- **`src/app/`**: Next.js App Router routes and API handlers.
  - `src/app/api/`: Server-side API route handlers (`route.ts`).
  - `src/app/dashboard/`: Protected student dashboard routes (`/complaints`, `/lost-found`, `/resources`, `/admin`, `/contact`, `/about`).
- **`src/components/`**: React components.
  - `src/components/ui/`: Prebuilt Shadcn / Radix UI components (Do not edit directly; extend or create wrapper components).
- **`src/lib/`**: Core utilities, auth helpers, and database clients.
  - `src/lib/auth-context.tsx`: Client-side React Auth context (`useAuth`).
  - `src/lib/auth.ts`: JWT verification and signing utilities.
  - `src/lib/supabase-server.ts`: Supabase admin client (`supabaseAdmin`) using service role key for API routes.
  - `src/lib/supabase.ts`: Supabase client (`supabase`) for public interactions.

---

## 📋 Library Usage Rules

### 1. Icons
- **Rule**: ALWAYS use `lucide-react` for UI icons.
- **Example**: `import { Search, Building2, BookOpen, Shield } from 'lucide-react';`

### 2. Notifications & Toasts
- **Rule**: ALWAYS use `sonner` for user notifications and alerts. Do not introduce alternative toast libraries.
- **Example**: `import { toast } from 'sonner';` -> `toast.success('Submitted!')` or `toast.error('Failed!')`

### 3. Animations
- **Rule**: Use `framer-motion` for animated popups, page transitions, list items, and modal overlays. Use `AnimatePresence` for unmounting transitions.

### 4. Database & File Uploads
- **Rule**: All database operations and bucket file uploads (complaint images, lost/found photos, resource PDFs) MUST go through API routes using `supabaseAdmin` in `src/app/api/*`.
- File uploads are handled via `formData` sending files to Supabase Storage `uploads` bucket.

### 5. Authentication & Authorization
- **Rule**: Client components must use `useAuth()` from `@/lib/auth-context`.
- Protected API routes MUST verify requests using `getTokenFromRequest(req)` from `@/lib/auth`.
- Admin-restricted routes or features must explicitly verify `user.role === 'admin'`.

### 6. Styling & UI Components
- **Rule**: Use Tailwind CSS for all component styling. Utilize custom utility classes defined in `globals.css`:
  - `.glass-card` / `.glass-card-hover` for card containers.
  - `.gradient-text` for headings.
  - `.mesh-bg` for page background mesh gradients.
- Prefer Shadcn UI primitives in `@/components/ui/*` for complex interactive widgets (dialogs, select, tabs, drawers).