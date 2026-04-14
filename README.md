# CATUC Bamenda Research Survey Platform

An institutional research platform developed for the Catholic University of Cameroon, Bamenda (CATUC). This platform facilitates secure data collection for academic studies within the Department of Business and Management Sciences.

## Overview

The platform is built with **Next.js 15** and provides a professional environment for conducting academic research. It ensures data integrity through mandatory user identification (Google OAuth) and provides researchers with a high-fidelity dashboard for study management and data analysis.

## Technical Architecture

### Core Technologies
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Authentication**: [Auth.js v5](https://authjs.dev/) (NextAuth) with Google Provider
- **Database**: [PostgreSQL (Neon)](https://neon.tech/) with [Drizzle ORM](https://orm.drizzle.team/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## Deployment Specifications

The platform is designed specifically for deployment on **Vercel**.

### Production Environment Variables

Set these on the Vercel project before deploying:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (Neon recommended). |
| `AUTH_SECRET` | A random 32-character string for Auth.js session encryption. |
| `AUTH_GOOGLE_ID` | Google OAuth 2.0 Client ID. |
| `AUTH_GOOGLE_SECRET` | Google OAuth 2.0 Client Secret. |
| `NEXT_PUBLIC_APP_ORIGIN` | The canonical production site origin (e.g., `https://catuc-research-platform.vercel.app`). |

### Database Management

The project uses Drizzle ORM. Local development and production synchronization commands:

```bash
# Push schema changes to the database
pnpm run db:push

# Generate migration files
pnpm run db:generate

# Open Drizzle Studio to view data
pnpm run db:studio
```

## Security and Data Integrity

All survey responses are linked to verified participant identities. The system prevents duplicate submissions, ensuring research validity. Administrative access to the researcher dashboard is restricted via role-based access control (`isAdmin` flag in the `User` table).

## Development Setup

1. Install dependencies: `pnpm install`
2. Configure `.env` with the variables listed above.
3. Run the development server: `pnpm run dev`
4. Build for production: `pnpm run build`

---
© 2026 The Catholic University of Cameroon, Bamenda. Department of Business and Management Sciences.
