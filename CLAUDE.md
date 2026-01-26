# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Credit Card Offers Management Prototype - a demo application showcasing campaign lifecycle management with AI-powered strategy suggestions. Uses mock adapters to simulate external systems (approvals, simulations, exports).

## Development Commands

```bash
# Development
pnpm dev              # Start dev server on localhost:3000
pnpm build            # Production build
pnpm lint             # ESLint

# Database (PostgreSQL + Drizzle ORM)
pnpm db:push          # Push schema directly (dev)
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Apply migrations
pnpm db:seed          # Seed with mock data
```

## Environment Setup

Required in `.env.local`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/offers_portal
AI_PROVIDER=openai   # or "anthropic"
OPENAI_API_KEY=sk-...
```

## Architecture

**Stack**: Next.js 16, React 19, TypeScript, Drizzle ORM, PostgreSQL, shadcn/ui, Tailwind CSS 4

### Key Architectural Decisions

1. **React Server Components First** - Default to RSC, use "use client" only for forms, event handlers, hooks, and browser APIs

2. **Suspense Streaming Pattern** - Pages wrap async content components in Suspense with Skeleton fallbacks. Never await in parent page.tsx

3. **Next.js 16 Dynamic Params** - Must `await params` before using:
   ```typescript
   const { id } = await params;  // Required in Next.js 16
   ```

4. **Parallel Data Fetching** - Use `Promise.all()` to avoid waterfalls:
   ```typescript
   const [campaign, enrollments] = await Promise.all([
     getCampaignWithRelations(id),
     getEnrollmentsByCampaign(id),
   ]);
   ```

5. **Database Helpers** - Use functions in `lib/db/index.ts` (e.g., `getCampaignWithRelations`, `getAllCampaignsGrouped`, `getAllAccounts`)

6. **Type-Safe Enums** - Import from schema: `CampaignStatus`, `OfferType`, `AccountTier`, `EnrollmentStatus`

### Directory Structure

- `app/` - Next.js App Router pages and API routes
- `components/ui/` - shadcn/ui primitives
- `components/` - Domain components (campaign-card, status-badge, etc.)
- `lib/db/` - Drizzle schema, client, and query helpers
- `lib/db/seed-data/` - Modular seed data files
- `lib/ai/` - AI provider config and strategy generation
- `lib/adapters/mock/` - Mock simulation, approvals, export adapters

### Common Imports

```typescript
import { db, getCampaignWithRelations } from "@/lib/db";
import type { CampaignStatus } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

## Extended Documentation

See **AGENTS.md** for comprehensive architecture patterns including:
- RSC vs client component boundaries
- API route patterns with error handling
- Drizzle relational query examples
- Component composition patterns
- Styling conventions
- Common workflows for adding pages/routes
