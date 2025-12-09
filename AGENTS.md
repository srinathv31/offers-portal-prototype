# AGENTS.md - AI Agent Contribution Guide

## Project Overview

This is a **prototype to demo the future potential state** of a re-engineered (from the ground up) **Credit Card Offers Management Platform**. We use **mock data** to seed the database to demonstrate storylines and use cases. This application serves as the **orchestration UI layer** to connect all aspects of Offer Management from Campaign/Offer creation to Offer Fulfillment.

### Core Purpose

- Demo environment for stakeholders to visualize the future state
- End-to-end workflow demonstration: Campaign creation → Targeting → Testing → Publishing → Enrollment tracking
- Mock adapters simulate external systems (approvals, simulations, exports)

---

## Tech Stack

| Technology       | Version | Purpose                                     |
| ---------------- | ------- | ------------------------------------------- |
| **Next.js**      | 16.0.7  | App Router with React Server Components     |
| **React**        | 19.2.1  | UI framework with Server Components         |
| **TypeScript**   | 5.x     | Type safety across the application          |
| **Drizzle ORM**  | 0.44.7  | PostgreSQL database with relational queries |
| **PostgreSQL**   | -       | Primary database                            |
| **shadcn/ui**    | 3.5.0   | Component library built on Radix UI         |
| **Tailwind CSS** | 4.x     | Utility-first styling                       |
| **next-themes**  | 0.4.6   | Dark mode support                           |

---

## Architecture Principles

### 1. React Server Components (RSC) First

**Default to Server Components for all pages and components unless client interactivity is required.**

```typescript
// ✅ GOOD: Server Component (default)
// app/campaigns/[id]/page.tsx
export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<CampaignDetailSkeleton />}>
      <CampaignDetailContent id={id} />
    </Suspense>
  );
}
```

```typescript
// ✅ GOOD: Only use "use client" when needed
// app/accounts/page.tsx
"use client";

import { useState, useEffect } from "react";
// Client component for filters, forms, and interactive UI
```

**When to use "use client":**

- Forms with controlled inputs
- Event handlers (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- React hooks (useState, useEffect, useContext, etc.)
- Third-party libraries requiring browser environment

---

### 2. Data Fetching Strategy

#### Server-Side Data Fetching (Preferred)

**Always fetch data on the server in RSCs unless client input is needed.**

```typescript
// ✅ GOOD: Parallel data fetching in Server Component
async function CampaignDetailContent({ id }: { id: string }) {
  // Fetch multiple resources in parallel to avoid waterfalls
  const [campaign, enrollments] = await Promise.all([
    getCampaignWithRelations(id),
    getEnrollmentsByCampaign(id),
  ]);

  if (!campaign) {
    notFound();
  }

  return <div>{/* Render with resolved data */}</div>;
}
```

```typescript
// ❌ BAD: Sequential awaits create waterfalls
async function SlowComponent({ id }: { id: string }) {
  const campaign = await getCampaign(id); // Wait
  const enrollments = await getEnrollments(id); // Wait again
  const segments = await getSegments(id); // Wait again
  // This is slow!
}
```

#### Client-Side Data Fetching (When Needed)

**Use API routes when client input is required (filters, search, etc.)**

```typescript
// ✅ GOOD: Client component fetching from API route
"use client";

function AccountsContent() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAccounts = async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/accounts?${params.toString()}`);
      const data = await res.json();
      setAccounts(data);
    };

    fetchAccounts();
  }, [search]);
}
```

---

### 3. Suspense Boundaries & Streaming

**Never block render with `await` in parent page.tsx - let Suspense handle streaming.**

```typescript
// ✅ GOOD: Let Suspense handle the async component
// app/page.tsx
export default function Home() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent /> {/* Async component */}
      </Suspense>
    </div>
  );
}
```

```typescript
// ❌ BAD: Awaiting in parent blocks entire page render
export default async function Home() {
  const data = await getAllCampaigns(); // Blocks everything!
  return <div>{/* ... */}</div>;
}
```

**Create dedicated Skeleton components:**

```typescript
// ✅ GOOD: Skeleton matches the content structure
function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Skeleton className="h-12 w-full" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### 4. Passing Promises to Client Components

**If client components need resolved server data, pass down promises and resolve with `use()` hook (React 19).**

> **Note:** This pattern is not currently used in the codebase but is supported by React 19. The current pattern uses Suspense boundaries instead, which is recommended.

```typescript
// ✅ ALTERNATIVE: Current pattern - Suspense in Server Component
async function CampaignDetailContent({ id }: { id: string }) {
  const data = await getCampaignData(id);
  return <ClientComponent data={data} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <CampaignDetailContent id={params.id} />
    </Suspense>
  );
}
```

---

### 5. Server Actions & API Routes

**Use API Route handlers for all POST/mutating actions.**

```typescript
// ✅ GOOD: API Route with proper error handling
// app/api/campaigns/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, purpose } = body;

    if (!name || !purpose) {
      return NextResponse.json(
        { error: "Name and purpose are required" },
        { status: 400 }
      );
    }

    const [campaign] = await db
      .insert(campaigns)
      .values({ name, purpose, status: "DRAFT" })
      .returning();

    return NextResponse.json({
      campaignId: campaign.id,
      message: "Campaign created successfully",
    });
  } catch (error) {
    console.error("[Create Campaign API] Error:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
```

**Handle both JSON and form submissions:**

```typescript
// ✅ GOOD: Flexible API route
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type");
  const isFormSubmission = contentType?.includes(
    "application/x-www-form-urlencoded"
  );

  let campaignId: string;

  if (isFormSubmission) {
    const searchParams = request.nextUrl.searchParams;
    campaignId = searchParams.get("campaignId") || "";
  } else {
    const body = await request.json();
    campaignId = body.campaignId;
  }

  // Process...
}
```

---

## Database Patterns

### Schema Organization

**Location:** `lib/db/schema.ts`

The schema is organized into two main sections:

1. **Account-Level Tables:** Accounts, spending groups, enrollments, transactions
2. **Campaign & Offer Tables:** Campaigns, offers, segments, approvals, simulations

**Key patterns:**

- PostgreSQL enums for status fields (type-safe)
- JSONB fields for flexible metadata
- UUID primary keys
- Extensive use of relations for eager loading

```typescript
// ✅ GOOD: Using schema types
import type { CampaignStatus, AccountTier } from "@/lib/db/schema";

function StatusBadge({ status }: { status: CampaignStatus }) {
  // TypeScript ensures only valid statuses
}
```

### Database Helper Functions

**Location:** `lib/db/index.ts`

Always use the provided helper functions for common queries:

```typescript
// ✅ GOOD: Use existing helpers
import { getCampaignWithRelations, getAllAccounts } from "@/lib/db";

const campaign = await getCampaignWithRelations(campaignId);
const accounts = await getAllAccounts({ tier: "PLATINUM" });
```

**Helper functions include:**

- `getCampaignWithRelations(campaignId)` - Campaign with all related data
- `getAllCampaignsGrouped()` - Campaigns grouped by status
- `getAllAccounts(filters)` - Accounts with optional filtering
- `getAccountWithDetails(accountId)` - Account with enrollments and transactions
- `getEnrollmentsByCampaign(campaignId)` - All enrollments for a campaign

### Drizzle Query Patterns

**Use relational queries with `with` clauses:**

```typescript
// ✅ GOOD: Eager load relations
const campaign = await db.query.campaigns.findFirst({
  where: (campaigns, { eq }) => eq(campaigns.id, campaignId),
  with: {
    campaignOffers: {
      with: {
        offer: true,
      },
    },
    campaignSegments: {
      with: {
        segment: true,
      },
    },
    approvals: true,
    channelPlan: true,
  },
});
```

**Parallel queries with Promise.all:**

```typescript
// ✅ GOOD: Fetch multiple resources in parallel
const [campaign, enrollments, spendingGroups] = await Promise.all([
  getCampaignWithRelations(id),
  getEnrollmentsByCampaign(id),
  getAllSpendingGroups(),
]);
```

---

## Component Patterns

### shadcn/ui Components

**Always use shadcn/ui components for consistency:**

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
```

**Common components:**

- `Button`, `Input`, `Label`, `Textarea` - Form elements
- `Card`, `Alert`, `Badge`, `Separator` - Layout & display
- `Select`, `Dropdown`, `Dialog`, `Tabs` - Interactive UI
- `Skeleton`, `Progress` - Loading states
- `Table`, `ScrollArea` - Data display

### Custom Components

**Location:** `components/`

Reusable domain-specific components:

- `campaign-card.tsx` - Campaign display card
- `account-list-item.tsx` - Account row in lists
- `status-badge.tsx` - Campaign status indicator
- `metric-kpi.tsx` - Metric display with formatting
- `enrollment-progress-card.tsx` - Enrollment tracking

**Pattern: Client components can be imported into Server Components:**

```typescript
// ✅ GOOD: Import client component in server component
import { CampaignCard } from "@/components/campaign-card"; // "use client"

async function DashboardContent() {
  const grouped = await getAllCampaignsGrouped();

  return (
    <div>
      {grouped.LIVE.map((campaign) => (
        <CampaignCard key={campaign.id} {...campaign} />
      ))}
    </div>
  );
}
```

---

## Styling Conventions

### Tailwind CSS

**Use utility classes with consistent patterns:**

```typescript
// ✅ GOOD: Consistent spacing and responsive design
<div className="container mx-auto px-4 py-8">
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {/* Content */}
  </div>
</div>
```

**Common patterns:**

- Container: `container mx-auto px-4`
- Spacing: `space-y-4`, `gap-4`, `py-8`
- Grid: `grid grid-cols-2 gap-4`
- Responsive: `md:grid-cols-2 lg:grid-cols-3`
- Text: `text-muted-foreground`, `text-sm`, `font-bold`

### Dark Mode

**Theme support via next-themes:**

```typescript
// ✅ GOOD: Dark mode aware colors
<div className="bg-muted/50 dark:bg-slate-900/20">
<Badge className="text-blue-600 dark:text-blue-400">
```

**Use semantic colors:**

- `text-foreground` / `text-background`
- `bg-card` / `bg-muted`
- `border-border`
- `text-muted-foreground`

---

## File Structure & Organization

```
offers-portal-prototype/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard (RSC)
│   ├── layout.tsx                # Root layout
│   ├── campaigns/
│   │   └── [id]/
│   │       └── page.tsx          # Campaign detail (RSC)
│   ├── accounts/
│   │   ├── page.tsx              # Account list (Client)
│   │   └── [id]/
│   │       └── page.tsx          # Account detail (RSC)
│   ├── api/                      # API Routes
│   │   ├── accounts/
│   │   │   └── route.ts          # GET /api/accounts
│   │   ├── campaigns/
│   │   │   └── create/
│   │   │       └── route.ts      # POST /api/campaigns/create
│   │   └── simulate/
│   │       └── route.ts          # POST /api/simulate
│   └── create-campaign/
│       └── page.tsx              # Campaign creation form (Client)
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui components
│   ├── campaign-card.tsx
│   ├── account-list-item.tsx
│   └── status-badge.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts              # Database connection & helpers
│   │   ├── schema.ts             # Drizzle schema definitions
│   │   └── seed.ts               # Mock data seeding
│   ├── adapters/
│   │   └── mock/                 # Mock external system adapters
│   │       ├── approvals.ts      # Mock approval workflow
│   │       ├── simulation.ts     # Mock E2E testing
│   │       └── export.ts         # Mock report generation
│   ├── ai/                       # AI strategy suggestions
│   └── utils.ts                  # Utility functions (cn, etc.)
└── drizzle/                      # Database migrations
```

---

## Key Gotchas & Best Practices

### 1. Next.js 16 Dynamic Route Params

**Always unwrap async `params` in dynamic routes:**

```typescript
// ✅ GOOD: Unwrap params (Next.js 16 requirement)
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params; // Must unwrap!

  return (
    <Suspense fallback={<Skeleton />}>
      <CampaignDetailContent id={id} />
    </Suspense>
  );
}
```

```typescript
// ❌ BAD: Using params directly (old pattern)
export default async function Page({ params }: { params: { id: string } }) {
  // This won't work in Next.js 16
}
```

### 2. Force Dynamic Rendering

**Use for pages with real-time data:**

```typescript
// ✅ GOOD: Force dynamic rendering
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  // This page will never be statically generated
}
```

### 3. Client vs Server Component Boundaries

**Client components CANNOT import Server Components:**

```typescript
// ❌ BAD: Client component importing Server Component
"use client";
import { ServerComponent } from "./server-component"; // Error!

export function ClientComponent() {
  return <ServerComponent />; // Won't work
}
```

```typescript
// ✅ GOOD: Server Component composing both
import { ClientComponent } from "./client-component";
import { ServerComponent } from "./server-component";

export function ParentServerComponent() {
  return (
    <div>
      <ServerComponent />
      <ClientComponent />
    </div>
  );
}
```

```typescript
// ✅ GOOD: Pass Server Component as children
"use client";
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <div className="wrapper">{children}</div>;
}

// In Server Component:
<ClientWrapper>
  <ServerComponent />
</ClientWrapper>;
```

### 4. Avoid Waterfalls

**Bad: Sequential awaits**

```typescript
// ❌ BAD: Each await blocks the next
async function SlowPage() {
  const campaigns = await getCampaigns(); // Wait
  const accounts = await getAccounts(); // Wait
  const offers = await getOffers(); // Wait
  // Total time: Time1 + Time2 + Time3
}
```

**Good: Parallel Promise.all**

```typescript
// ✅ GOOD: All fetch in parallel
async function FastPage() {
  const [campaigns, accounts, offers] = await Promise.all([
    getCampaigns(),
    getAccounts(),
    getOffers(),
  ]);
  // Total time: max(Time1, Time2, Time3)
}
```

### 5. Type Safety

**Avoid using "any"**
**Always use schema-derived types:**

```typescript
// ✅ GOOD: Import types from schema
import type { CampaignStatus, AccountTier, OfferType } from "@/lib/db/schema";

function updateCampaign(status: CampaignStatus) {
  // TypeScript enforces valid values: "DRAFT" | "IN_REVIEW" | "TESTING" | "LIVE" | "ENDED"
}
```

### 6. Error Boundaries

**Use error.tsx for error handling:**

```typescript
// app/campaigns/[id]/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### 7. Loading States

**Use loading.tsx for automatic loading UI:**

```typescript
// app/campaigns/[id]/loading.tsx
export default function Loading() {
  return <CampaignDetailSkeleton />;
}
```

Or use Suspense boundaries for granular control (preferred in this codebase).

---

## Common Workflows

### Creating a New Page

1. **Determine if it needs client interactivity**

   - No → Server Component (default)
   - Yes → "use client" directive

2. **For Server Components:**

   ```typescript
   // app/new-page/page.tsx
   import { Suspense } from "react";

   async function PageContent() {
     const data = await fetchData();
     return <div>{/* render data */}</div>;
   }

   export default function Page() {
     return (
       <Suspense fallback={<Skeleton />}>
         <PageContent />
       </Suspense>
     );
   }
   ```

3. **For Client Components:**

   ```typescript
   // app/new-page/page.tsx
   "use client";

   import { useState, useEffect } from "react";

   export default function Page() {
     const [data, setData] = useState(null);

     useEffect(() => {
       fetch("/api/data")
         .then((res) => res.json())
         .then(setData);
     }, []);

     return <div>{/* render */}</div>;
   }
   ```

### Adding a New API Route

```typescript
// app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter");

    const results = await db.query.table.findMany({
      where: filter ? /* condition */ : undefined,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.required) {
      return NextResponse.json(
        { error: "Missing required field" },
        { status: 400 }
      );
    }

    // Process...
    const result = await db.insert(table).values(body).returning();

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
```

### Adding Database Queries

**Add helper functions to `lib/db/index.ts`:**

```typescript
// lib/db/index.ts
export async function getNewResourceWithRelations(id: string) {
  const resource = await db.query.resources.findFirst({
    where: (resources, { eq }) => eq(resources.id, id),
    with: {
      relatedItems: true,
      moreRelations: {
        with: {
          nestedRelation: true,
        },
      },
    },
  });

  return resource;
}
```

---

## Testing & Development

### Running the Development Server

```bash
pnpm dev
```

Server runs on `http://localhost:3000`

### Database Operations

```bash
# Generate migrations from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Push schema directly (development)
pnpm db:push

# Seed database with mock data
pnpm db:seed
```

### Environment Variables

Required in `.env` or `.env.local`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

---

## Mock Adapters

**Location:** `lib/adapters/mock/`

Mock external systems for demo purposes:

### Approvals (`approvals.ts`)

- Simulates multi-step approval workflows
- Returns approval status and mock actor data

### Simulation (`simulation.ts`)

- Mocks end-to-end campaign testing
- Progressive step execution with delays
- Updates projections (revenue, activations, error rates)

### Export (`export.ts`)

- Generates mock report data
- Simulates email delivery

**Pattern: Async functions with delays to simulate real systems**

```typescript
// Example from simulation.ts
await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
```

---

## AI Integration

**Location:** `lib/ai/`

AI-powered campaign strategy suggestions:

- `strategy.ts` - Generates campaign recommendations based on season/objective
- `types.ts` - TypeScript types for AI suggestions
- `config.ts` - AI provider configuration

**Used in:** `app/create-campaign/page.tsx` and `app/api/ai/suggest/route.ts`

---

## Quick Reference

### Import Patterns

```typescript
// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Database
import { db } from "@/lib/db";
import { getCampaignWithRelations } from "@/lib/db";
import type { CampaignStatus } from "@/lib/db/schema";

// Next.js
import { notFound, redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import Link from "next/link";

// React
import { Suspense } from "react";
```

### Useful Utilities

```typescript
// lib/utils.ts
import { cn } from "@/lib/utils";

// Merge Tailwind classes
<div className={cn("base-classes", conditional && "extra-classes")} />;
```

### Date Formatting

```typescript
import { format } from "date-fns";

format(new Date(date), "MMM d, yyyy");
```

---

## Summary Checklist

When creating new features, ensure:

- [ ] Server Components by default, "use client" only when needed
- [ ] Data fetching on the server when possible
- [ ] Use Promise.all for parallel data fetching
- [ ] Wrap async components in Suspense with Skeleton fallbacks
- [ ] Never await in parent page.tsx - let Suspense handle it
- [ ] Unwrap async params in Next.js 16 dynamic routes
- [ ] Use API routes for mutations (POST, PUT, DELETE)
- [ ] Use database helper functions from `lib/db/index.ts`
- [ ] Import types from schema for type safety
- [ ] Use shadcn/ui components for consistency
- [ ] Follow Tailwind patterns for styling
- [ ] Handle loading and error states appropriately
- [ ] Use `export const dynamic = "force-dynamic"` for real-time pages

---

## Additional Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Last Updated:** December 2025
**Next.js Version:** 16.0.7
**React Version:** 19.2.1
