# CATUC Bamenda Research Survey Platform

An institutional research platform developed for the Catholic University of Cameroon, Bamenda (CATUC). This platform facilitates secure data collection for academic studies within the Department of Business and Management Sciences.

## Overview

The platform is designed to provide a professional and secure environment for conducting academic research. It ensures data integrity through mandatory user identification and provides researchers with a high-fidelity dashboard for study management and data analysis.

## Technical Architecture

### Core Technologies
- **Frontend**: React-based single-page application (SPA) utilizing Vite for build optimization.
- **Backend**: Node.js and Express.js RESTful API.
- **Database**: PostgreSQL with Drizzle ORM for type-safe database interactions.
- **Authentication**: Google OAuth 2.0 (OpenID Connect) for participant verification.
- **Styling**: Tailwind CSS with customized typography and academic color palettes.

### Project Structure
- `artifacts/resume-site`: Frontend application source code.
- `artifacts/api-server`: Backend server logic and API endpoints.
- `lib/db`: Database schema definitions and migration configurations.
- `lib/auth-web`: Shared authentication hooks and state management.
- `lib/api-spec`: OpenAPI 3.0 specifications and client generation configuration.

## Deployment Specifications

The platform is deployed on **Vercel** as a single monorepo project.

### Unified Deployment (Vercel)
The entire stack is deployed through Vercel:
- **Frontend**: Built from `artifacts/resume-site` and published as a static SPA.
- **API**: Served by the root `api/[...path].ts` function, which routes all `/api/*` requests into the existing Express app.
- **Database**: Uses the PostgreSQL connection supplied via `DATABASE_URL`.

#### Build Command
```bash
pnpm run build
```

#### Local Vercel Setup
Link the repository from the terminal with the Vercel CLI:
```bash
vercel link --yes --project catuc-research-platform-bamenda --scope onelrians-projects
```

#### Production Environment Variables
Set these on the Vercel project before production deploys:
- `ADMIN_EMAILS`: Comma-separated list of administrator email addresses.
- `DATABASE_URL`: PostgreSQL connection string.
- `GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID.
- `GOOGLE_CLIENT_SECRET`: Google OAuth 2.0 Client Secret.

Example CLI commands:
```bash
vercel env add ADMIN_EMAILS production --value "admin@example.com" --yes
vercel env add DATABASE_URL production --sensitive --value "postgresql://..." --yes
vercel env add GOOGLE_CLIENT_ID production --sensitive --value "..." --yes
vercel env add GOOGLE_CLIENT_SECRET production --sensitive --value "..." --yes
```

### Google Cloud Project Configuration
To enable authentication, configure your Google Cloud OAuth client with these URIs:
- **Authorized JavaScript Origin**: `https://<your-vercel-domain>`
- **Authorized Redirect URI**: `https://<your-vercel-domain>/api/callback`

## Security and Data Integrity

All survey responses are linked to verified participant identities. The system includes logic to prevent duplicate submissions, ensuring that research data remains valid and reliable. Administrative access to the research dashboard is restricted to authorized personnel via role-based access control.

## Administrative Access

Access to the researcher dashboard is restricted based on identity claims provided during the Google OAuth flow. Only accounts designated as administrative in `ADMIN_EMAILS` are permitted to view results or modify research instruments.

---
© 2026 The Catholic University of Cameroon, Bamenda. Department of Business and Management Sciences.
