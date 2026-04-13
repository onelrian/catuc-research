# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### resume-site (React + Vite, preview at `/`)
Ashley's professional resume website with two pages:
- `/` — Public resume page (shareable link, auto-logs views)
- `/dashboard` — Analytics overview (total views, views today/week/month, unique referrers, recent view feed)

Color palette: warm ochre/gold and slate — derived from business/management domain.
Has a "Copy Link" button for easy sharing.

### api-server (Express, preview at `/api`)
Backend API with endpoints:
- `GET /api/resume` — fetch resume data
- `PUT /api/resume` — update resume data
- `POST /api/views` — log a resume view
- `GET /api/dashboard/summary` — aggregated stats
- `GET /api/dashboard/recent-views` — last 20 views

## Database Schema

- `resume` — single row storing Ashley's resume (name, title, email, experience, education, skills, certifications etc.)
- `views` — tracks every time someone opens the resume (referrer, ip_hash, viewed_at)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
