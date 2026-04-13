# CATUC Bamenda Research Platform

A secure, professional academic research survey platform for the Catholic University of Cameroon, Bamenda (CATUC). Designed for the Department of Business and Management Sciences to collect validated student data and drive institutional research.

## 🚀 Key Features

- **Secure Research Environment**: Mandatory identification via Google OAuth2 ensuring data integrity.
- **Academic Dashboard**: High-fidelity dashboard for researchers (restricted to authorized personnel).
- **Survey Management**: Create, edit, and track active research studies.
- **Duplication Prevention**: Automatic linking of responses to verified user IDs to prevent multiple submissions.
- **Responsive Architecture**: Fully mobile-optimized interface for student accessibility.

## 🛠 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js (Express), Drizzle ORM.
- **Database**: PostgreSQL.
- **Authentication**: OpenID Connect (OIDC) via Google OAuth 2.0.
- **API Spec**: OpenAPI (Swagger) with automated TypeScript client generation.

## 📦 Project Structure

- `artifacts/resume-site`: The React frontend application.
- `artifacts/api-server`: The Express backend server.
- `lib/db`: Database schema and connection logic.
- `lib/auth-web`: Frontend authentication hook and state management.
- `lib/api-spec`: OpenAPI specifications and Orval configuration.

## ⚙️ Google OAuth Setup (Production Mode)

To use the platform without restricted "Test Users", follow these steps in the [Google Cloud Console](https://console.cloud.google.com/):

1. **OAuth Consent Screen**:
   - Set **User Type** to **External**.
   - Fill in **App Information** (Name, Email, Logo).
   - Add **Authorized Domains** (e.g., `netlify.app`).
2. **Publish App**:
   - Transitions the app from "Testing" to "Production" status.
   - For internal/academic use, you generally don't need Full Verification unless you want to remove the "Unverified App" warning for thousands of users.
3. **Credentials**:
   - Create an **OAuth 2.0 Client ID** (Web application).
   - Add **Authorized Redirect URIs**: `https://your-api-server.com/api/callback`.
   - Copy the `Client ID` and `Client Secret` to your server environment variables.

## 🌐 Deployment

### Netlify (Frontend)
The frontend is pre-configured for Netlify via `netlify.toml`.
1. Connect your GitHub repository to Netlify.
2. The build command is automated to build all monorepo dependencies.
3. **Environment Variables**:
   - Ensure `BASE_PATH` is set to `/`. (Already handled in build command).

### Replit (Backend)
The backend can be deployed on Replit for persistent hosting.
1. Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in "Secrets".
2. Set `DATABASE_URL` to your PostgreSQL instance.
3. Run `npm run dev` to start the server.

## 📝 License
Proprietary for CATUC Bamenda Research Team.
