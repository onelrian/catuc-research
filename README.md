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

The platform is optimized for deployment on **Netlify** using a monorepo structure.

### Unified Deployment (Netlify)
The entire stack (Frontend + API) is deployed to Netlify:
- **Frontend**: Deployed as a static SPA.
- **API**: Deployed as a Netlify Function using `serverless-http` to wrap the Express app.
- **Database**: Integrated via Netlify's Neon PostgreSQL extension.

#### Build Command
```bash
npx pnpm install && npx pnpm run build
```

#### Environment Variables
The following variables must be configured in the Netlify UI:
- `GOOGLE_CLIENT_ID`: Your Google OAuth 2.0 Client ID.
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth 2.0 Client Secret.
- `DATABASE_URL`: Automatically provided by the Netlify Neon extension after initialization.

### Google Cloud Project Configuration
To enable authentication, configure your Google Cloud Project with these URIs:
- **Authorized JavaScript Origins**: `https://<your-site-name>.netlify.app`
- **Authorized Redirect URIs**: `https://<your-site-name>.netlify.app/api/callback`

## Security and Data Integrity

All survey responses are linked to verified participant identities. The system includes logic to prevent duplicate submissions, ensuring that research data remains valid and reliable. Administrative access to the research dashboard is restricted to authorized personnel via role-based access control.

## Administrative Access

Access to the researcher dashboard is restricted based on identity claims provided during the Google OAuth flow. Only accounts designated as administrative (e.g., "Ashley") are permitted to view results or modify research instruments.

---
© 2026 The Catholic University of Cameroon, Bamenda. Department of Business and Management Sciences.
