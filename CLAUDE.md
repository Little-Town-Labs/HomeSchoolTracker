# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checks
npm run lint:fix     # Fix linting issues

# Environment setup
cp .env.example .env # Configure environment variables
npm install          # Install dependencies
```

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 15.2.1 (App Router) + TypeScript + Tailwind CSS + DaisyUI
- **Database**: Configurable MongoDB (Mongoose) OR Supabase via `config.ts`
- **Auth**: Clerk (@clerk/nextjs)
- **Payments**: Stripe Connect
- **Email**: SendGrid
- **Maps**: Google Maps API

### Core Architecture Patterns

**Vertical Slice Architecture (VSA)**: Features are built as end-to-end slices for specific state regulations

```typescript
enum StateRegulation {
  NY = "high", // New York (high regulation)
  PA = "high", // Pennsylvania (high regulation)
  CO = "moderate", // Colorado (moderate regulation)
  TX = "low", // Texas (low regulation)
  AK = "none", // Alaska (no regulation)
}
```

**Database Abstraction**: Models support both MongoDB and Supabase via conditional logic

```typescript
// Configure in config.ts
databaseType: "mongodb" | "supabase";
```

### Directory Structure

```
src/
├── app/                     # Next.js App Router
│   ├── (dashboard)/         # Protected routes with layout
│   ├── (policies)/          # Legal pages with layout
│   ├── api/                 # API routes
│   └── listings/            # Marketplace functionality
├── Components/
│   ├── LandingPage/         # Marketing site components
│   ├── DashboardComponents/ # Protected app UI
│   ├── MainComponents/      # Shared components
│   └── stripe-connect/      # Payment system
├── models/                  # Database models (dual MongoDB/Supabase)
└── exampleData/             # Development seed data
```

### Configuration Files

- **App Config**: `config.ts` (database type, services, domain settings)
- **Environment**: `.env` (see `.env.example` for required variables)
- **TypeScript**: Strict mode enabled, path aliases (`@/` for src)
- **Middleware**: Route protection in `src/middleware.ts`

### Key Architectural Decisions

**State-Driven Features**: The platform adapts UI and workflows based on homeschooling regulations by state. Features are progressively enabled:

- Phase 1: Low-regulation states (TX, AK) - basic lesson planning
- Phase 2: Moderate states (CA, AL) - notification generation
- Phase 3: Complex states (CO, NC) - attendance tracking
- Phase 4: High-regulation states (NY, PA) - full compliance suite

**Template Foundation**: Built from marketplace template requiring customization for homeschooling-specific features.

**AI-Ready Architecture**: Prepared for LangChain/LangGraph integration with Swarms orchestration (not yet implemented).

## Development Patterns

### Component Organization

- **Landing**: Marketing components in `Components/LandingPage/`
- **Dashboard**: App components in `Components/DashboardComponents/`
- **Shared**: Reusable components in `Components/MainComponents/`

### Route Structure

- **Public**: `/`, `/about`, `/listings`
- **Auth**: `/sign-in`, `/sign-up` (Clerk managed)
- **Protected**: `/dashboard/*` (middleware-protected)
- **API**: `/api/*` (REST endpoints)

### Database Models

All models in `src/models/` support both MongoDB and Supabase via conditional logic. Check `config.ts` for active database type.

### Styling Approach

- **Utility-First**: Tailwind CSS with custom brand palette
- **Component Library**: DaisyUI for consistent patterns
- **Custom Theme**: Colors defined in tailwind.config.ts (smoky-black, blue-munsell, citrine, etc.)

## Important Context

### Business Domain

AI-driven homeschooling platform for U.S. parents. Core value proposition is state-specific compliance assistance and resource marketplace.

### Current Implementation Status

- ✅ Core Next.js infrastructure, auth, database models, UI components
- ⏳ AI agent system, state compliance logic, production deployment

### Key Documentation

- `/memory-bank/projectbrief.md` - Business requirements and vision
- `/memory-bank/techContext.md` - Technical architecture details
- `/memory-bank/progress.md` - Current implementation status
- `/memory-bank/systemPatterns.md` - Design patterns and conventions

### Development Priorities

1. State-specific compliance workflows
2. AI agent integration (LangChain/LangGraph)
3. Vector database setup (Pinecone for regulation retrieval)
4. Testing suite implementation
5. Production deployment pipeline

When working on features, always consider the state regulation complexity and how it affects the user experience and compliance requirements.
