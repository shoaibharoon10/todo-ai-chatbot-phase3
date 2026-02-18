---
name: Monorepo Bootstrap
description: Setup monorepo structure with Spec-Kit Plus.
trigger: bootstrap monorepo
---

# Monorepo Bootstrap Skill

## Purpose

Bootstrap a complete monorepo project structure following Spec-Kit Plus conventions. This skill creates the foundational folder hierarchy, configuration files, and CLAUDE.md instructions needed to start building a full-stack application using SDD (Spec-Driven Development).

## Instructions

When triggered, execute the following steps in order:

### Step 1: Create Core Folder Structure

Create the following directory tree:

```
<project-root>/
├── .spec-kit/                    # Spec-Kit Plus configuration
│   ├── templates/                # SDD templates (spec, plan, tasks, PHR)
│   └── scripts/                  # Automation scripts
├── .specify/
│   ├── memory/
│   │   └── constitution.md       # Project principles and standards
│   └── templates/                # Prompt templates
├── specs/
│   └── features/                 # Feature specifications (spec.md, plan.md, tasks.md)
├── api/                          # Backend API service
│   ├── src/
│   │   ├── routes/               # API route handlers
│   │   ├── models/               # Data models / schemas
│   │   ├── services/             # Business logic layer
│   │   ├── middleware/           # Auth, validation, error handling
│   │   └── utils/                # Shared utilities
│   ├── tests/                    # Backend tests
│   └── .env.example              # Environment variable template
├── database/                     # Database layer
│   ├── migrations/               # Schema migrations
│   ├── seeds/                    # Seed data
│   └── schema/                   # Schema definitions
├── ui/                           # Frontend application
│   ├── app/                      # Next.js App Router pages
│   ├── components/
│   │   ├── ui/                   # Reusable UI primitives
│   │   └── features/             # Feature-specific components
│   ├── lib/                      # Utilities, API client, actions
│   ├── types/                    # Shared TypeScript types
│   └── public/                   # Static assets
├── history/
│   ├── prompts/                  # Prompt History Records (PHR)
│   │   ├── constitution/
│   │   ├── general/
│   │   └── <feature-name>/       # Per-feature PHR folders (created as needed)
│   └── adr/                      # Architecture Decision Records
├── docs/                         # Project documentation
├── docker-compose.yml            # Local development orchestration
├── .gitignore
├── CLAUDE.md                     # Root-level Claude Code instructions
└── README.md
```

### Step 2: Write config.yaml

Create `.spec-kit/config.yaml` with the following content:

```yaml
project:
  name: phase2-web
  type: monorepo
  version: "1.0.0"

phases:
  - id: phase-1
    name: Foundation
    description: Project setup, authentication, database schema
    status: pending

  - id: phase-2
    name: Core Features
    description: Primary CRUD operations and business logic
    status: pending

  - id: phase-3
    name: UI & Integration
    description: Frontend pages, API integration, polishing
    status: pending

  - id: phase-4
    name: Testing & Deployment
    description: E2E tests, CI/CD, production readiness
    status: pending

structure:
  api: ./api
  ui: ./ui
  database: ./database
  specs: ./specs/features
  history: ./history
  adr: ./history/adr

conventions:
  language: TypeScript
  frontend: Next.js (App Router)
  backend: FastAPI / Node.js
  database: PostgreSQL
  styling: Tailwind CSS
  testing: Vitest / Pytest
```

### Step 3: Create CLAUDE.md Files

#### Root CLAUDE.md

Place at the project root. Contains global instructions covering:

- Project overview and monorepo structure
- SDD workflow: specify → plan → tasks → implement
- PHR and ADR requirements
- Cross-service conventions (naming, env vars, error handling)
- References to sub-project CLAUDE.md files

#### Frontend CLAUDE.md (`ui/CLAUDE.md`)

Contains frontend-specific instructions:

- Next.js App Router conventions (Server Components by default)
- Component organization (`ui/` vs `features/`)
- Data fetching patterns (server-side fetch, Server Actions)
- Styling with Tailwind CSS
- Use `next/image`, `next/font`, `next/link`
- TypeScript strict mode enforced
- API client patterns and JWT handling

#### Backend CLAUDE.md (`api/CLAUDE.md`)

Contains backend-specific instructions:

- API route structure and naming conventions
- Authentication middleware (JWT)
- Request validation and error taxonomy
- Database access patterns (repository/service layers)
- Environment variable management (never hardcode secrets)
- Testing expectations (unit + integration)

### Step 4: Create Reference Document Structure

Generate placeholder spec files to demonstrate the SDD workflow:

```
specs/features/
├── _template/
│   ├── spec.md       # Feature specification template
│   ├── plan.md       # Architecture plan template
│   └── tasks.md      # Task breakdown template
```

### Step 5: Create Essential Config Files

- `.gitignore` — Node modules, env files, build artifacts, OS files
- `.env.example` — Template for required environment variables
- `docker-compose.yml` — Services for API, UI, and database

## Output

After execution, report:

1. Total folders created
2. Total files generated
3. Full folder tree (visual)
4. Next steps for the user:
   - Run `/sp.specify <feature>` to create a feature spec
   - Run `/sp.plan` to generate the architecture plan
   - Run `/sp.tasks` to break down into implementable tasks
   - Run `/sp.implement` to begin coding

## Validation Checklist

- [ ] All directories exist and are non-empty (contain at least a `.gitkeep` or real file)
- [ ] `config.yaml` is valid YAML with all phases defined
- [ ] Root `CLAUDE.md` references the monorepo structure
- [ ] `ui/CLAUDE.md` contains Next.js-specific guidance
- [ ] `api/CLAUDE.md` contains backend-specific guidance
- [ ] `specs/features/_template/` contains spec, plan, and tasks templates
- [ ] `.gitignore` covers all standard exclusions
- [ ] `docker-compose.yml` defines at minimum API, UI, and DB services
