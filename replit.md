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
- **UI**: React + Vite + Tailwind + shadcn/ui + framer-motion
- **Charts**: Recharts
- **Theme**: next-themes (dark/light mode toggle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### resume-site (React + Vite, preview at `/`) — CATUC Bamenda Research Survey Platform
Ashley's flagship academic research platform for Business and Management Sciences at CATUC Bamenda.

Design: Modern dark/light mode, deep navy + indigo accents, warm off-white in light mode, professional academic aesthetic.

Pages:
- `/` — Public home: hero section with CATUC branding, lists active surveys for participants
- `/survey/:surveyId` — Participant survey form with section-by-section navigation (4 sections), Likert horizontal segmented buttons, progress tracking, smooth framer-motion transitions
- `/dashboard` — Researcher dashboard: stats cards, recent data collection chart, Quick Access to results
- `/dashboard/surveys` — Survey management: create/edit/delete surveys, question builder with Likert template support
- `/dashboard/surveys/:surveyId/results` — Results analysis: section-grouped results, horizontal stacked bars for Likert distribution + mean scores, pie/donut for demographics, raw data table

### api-server (Express, preview at `/api`)
Backend API endpoints:
- `GET /api/surveys` — list all surveys
- `POST /api/surveys` — create survey
- `GET /api/surveys/:id` — get survey with questions
- `PUT /api/surveys/:id` — update survey
- `DELETE /api/surveys/:id` — delete survey
- `POST /api/surveys/:id/responses` — submit participant response
- `GET /api/surveys/:id/results` — aggregated analysis results
- `GET /api/surveys/:id/responses/raw` — all raw individual responses
- `GET /api/dashboard/overview` — cross-survey stats

## Database Schema

- `surveys` — title, description, isActive, timestamps
- `questions` — text, type (text/multiple_choice/rating/yes_no), options[], isRequired, orderIndex, **section** (optional), **sectionDescription** (optional), FK to survey
- `responses` — FK to survey, submittedAt timestamp
- `answers` — FK to response + question, value (text), values[] (for multiple choice), question text snapshot

## Current Live Survey (ID: 2)
"Financial Accessibility, Family Background, and Entrepreneurial Intentions"
40 questions across 4 sections:
- Section A (Q1–10): Demographic Information (multiple_choice + yes_no)
- Section B (Q11–20): Financial Accessibility (Likert 1-5: SD/D/N/A/SA)
- Section C (Q21–30): Family Background (Likert 1-5)
- Section D (Q31–40): Entrepreneurial Intentions (Likert 1-5)

Likert detection in frontend: `question.options?.[0] === "Strongly Disagree"`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
