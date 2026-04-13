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

### resume-site (React + Vite, preview at `/`) — Research Survey Platform
Ashley's research questionnaire platform for Business and Management Sciences research.

Pages:
- `/` — Public home: lists all active surveys for participants
- `/survey/:surveyId` — Participant survey form (all question types: text, multiple_choice, rating, yes_no). Submits responses to backend.
- `/dashboard` — Researcher dashboard overview: stats (total surveys, active, total responses, responses today), recent activity chart, active studies list
- `/dashboard/surveys` — Survey management: create/edit/delete surveys, toggle active/inactive, add questions with a question builder
- `/dashboard/surveys/:surveyId/results` — Results & analysis: aggregated question results with charts (pie, bar, rating distribution), text answer feed, raw responses table

### api-server (Express, preview at `/api`)
Backend API endpoints:
- `GET /api/surveys` — list all surveys
- `POST /api/surveys` — create survey
- `GET /api/surveys/:id` — get survey with questions
- `PUT /api/surveys/:id` — update survey
- `DELETE /api/surveys/:id` — delete survey
- `POST /api/surveys/:id/responses` — submit a participant response
- `GET /api/surveys/:id/results` — get aggregated analysis results
- `GET /api/surveys/:id/responses/raw` — get all raw individual responses
- `GET /api/dashboard/overview` — cross-survey stats

## Database Schema

- `surveys` — survey title, description, isActive, timestamps
- `questions` — text, type (text/multiple_choice/rating/yes_no), options[], isRequired, orderIndex, FK to survey
- `responses` — FK to survey, submittedAt timestamp
- `answers` — FK to response + question, value (text), values[] (for multiple choice), question text snapshot

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
