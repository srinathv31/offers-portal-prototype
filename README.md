# Offers OS - Campaign Management Prototype

A comprehensive Next.js prototype for designing, simulating, governing, and launching credit card offers campaigns with AI-powered strategy suggestions.

## Features

### Core Capabilities
- **Campaign Dashboard**: View and manage campaigns grouped by status (Live, In Review, Ended)
- **AI-Powered Strategy**: Get intelligent campaign suggestions using hot-swappable AI providers (OpenAI/Anthropic)
- **Campaign Management**: Full campaign lifecycle from creation to publishing
- **Offer Lineage**: Track offers across campaigns with performance history
- **E2E Simulation**: Test campaigns with real-time progress tracking
- **Governance & Controls**: Automated control checklists and approval workflows
- **Audit Logging**: Complete audit trail for all campaign activities

### Technical Highlights
- **Hot-Swappable AI**: Switch between OpenAI and Anthropic providers via environment variable
- **AI SDK Integration**: Built on [ai-sdk.dev](https://ai-sdk.dev) for structured AI outputs
- **Real-time Polling**: Live simulation status updates
- **Modern UI**: Built with Next.js 16, React 19, and shadcn/ui components
- **Type-Safe Database**: Drizzle ORM with PostgreSQL
- **Server Components**: Leveraging React Server Components for optimal performance

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: AI SDK with OpenAI and Anthropic providers
- **UI**: Tailwind CSS with shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key (or Anthropic API key)

### Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

Create a `.env.local` file with the following:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/offers_portal

# AI Provider (choose one)
AI_PROVIDER=openai  # or "anthropic"
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

3. Set up the database:

```bash
# Generate and run migrations
pnpm db:push

# Seed the database with sample data
pnpm db:seed
```

4. Start the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                      # Next.js App Router pages
│   ├── api/                 # API routes
│   │   ├── ai/             # AI strategy endpoints
│   │   ├── campaigns/      # Campaign management
│   │   ├── simulate/       # Simulation endpoints
│   │   └── export-report/  # Report generation
│   ├── campaigns/[id]/     # Campaign detail page
│   ├── offers/[id]/        # Offer detail page
│   ├── create-campaign/    # Campaign creation wizard
│   └── testing/[runId]/    # Simulation test runner
├── components/              # React components
│   ├── ui/                 # shadcn/ui base components
│   ├── status-badge.tsx    # Status indicator atoms
│   ├── metric-kpi.tsx      # KPI display widgets
│   ├── progress-list.tsx   # Step progress tracker
│   ├── campaign-card.tsx   # Campaign cards
│   └── ...                 # Other components
├── lib/                     # Core libraries
│   ├── db/                 # Database layer
│   │   ├── schema.ts       # Drizzle schema
│   │   ├── index.ts        # DB client & helpers
│   │   └── seed.ts         # Seed data script
│   ├── ai/                 # AI integration
│   │   ├── types.ts        # Zod schemas
│   │   ├── config.ts       # Provider configuration
│   │   └── strategy.ts     # Strategy generation
│   └── adapters/           # Mock adapters
│       └── mock/
│           ├── simulation.ts  # Simulation engine
│           ├── approvals.ts   # Approval workflow
│           └── export.ts      # Report generation
└── drizzle/                 # Database migrations
```

## Key Features Explained

### AI-Powered Campaign Strategy

The system uses AI SDK's `generateObject` function with Zod schemas to generate structured campaign strategies:

- **Season-aware suggestions**: Provides contextual recommendations based on timing
- **Vendor recommendations**: Suggests appropriate partners (Amazon, Target, Nike, etc.)
- **Multi-channel strategies**: Recommends optimal channel mix (Email, Mobile, Web, SMS)
- **Hot-swappable providers**: Switch between OpenAI and Anthropic by setting `AI_PROVIDER` env variable

### Simulation Engine

End-to-end campaign simulations with 7 progressive steps:
1. Rules Compilation
2. Data Availability Check
3. Channel Distribution Mock
4. Offer Presentment Simulation
5. Disposition Processing
6. Fulfillment Simulation
7. Report Generation

Real-time progress tracking with polling every 2 seconds.

### Governance & Controls

Pre-publish automated controls:
- PII Minimization checks
- T&Cs consistency verification
- 7-year retention compliance
- Segregation of Duties (SoD)
- Data source availability

Multi-role approval workflow:
- Product Owner
- Risk & Compliance
- Marketing Ops

### Offer Lineage

Track offers across campaigns with:
- Usage history
- Performance metrics
- Campaign associations
- Vendor information
- Effective date ranges

## Database Schema

Key entities:
- **Campaigns**: Campaign metadata, status, metrics
- **Offers**: Offer definitions with parameters
- **Segments**: Customer segments (CDC, RAHONA, CUSTOM)
- **Eligibility Rules**: DSL-based targeting rules
- **Channel Plans**: Multi-channel distribution
- **Fulfillment Plans**: Reward delivery methods
- **Control Checklists**: Governance controls
- **Approvals**: Multi-role approval tracking
- **Simulation Runs**: Test execution history
- **Audit Logs**: Complete activity trail

## Seed Data

The database seeds with:
- 3 campaigns (Holiday Rewards Blitz - LIVE, Q1 Travel Perks - IN_REVIEW, Summer Cashback - ENDED)
- 8 diverse offers (Amazon 3× Points, Target 5% Weekend, Starbucks Bonus, etc.)
- 3 customer segments
- 2 eligibility rules with realistic DSL
- Sample channel plans, fulfillment configurations
- Control checklists and approvals

## API Endpoints

### AI Strategy
- `POST /api/ai/suggest` - Generate campaign strategy

### Simulation
- `POST /api/simulate` - Start simulation
- `GET /api/simulate/status?runId={id}` - Get simulation status

### Campaign Management
- `POST /api/campaigns/create` - Create campaign
- `POST /api/campaigns/[id]/publish` - Publish campaign

### Reports
- `GET /api/export-report?runId={id}` - Download simulation report

## Development Scripts

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Database
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema changes
pnpm db:seed      # Seed database
```

## POC Limitations

This is a **proof-of-concept** with the following limitations:

- Mock external systems (SFMC, TSYS/TLP, CDC/Rahona)
- Simulated identity and SSO
- Static creative previews
- Auto-approvals (no real workflow engine)
- No real-time event streaming
- Limited production integrations

## Future Enhancements

Potential roadmap items:
- Replace polling with Server-Sent Events (SSE)
- Wire real channel (email) and fulfillment path
- Import segments from CDC/Rahona
- Template library for seasonal campaigns
- Diff view between simulation runs
- Full approvals matrix with evidence attachment
- Enhanced security and audit capabilities

## License

Prototype for demonstration purposes only.

## Credits

Built with:
- [Next.js](https://nextjs.org/)
- [AI SDK](https://ai-sdk.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
