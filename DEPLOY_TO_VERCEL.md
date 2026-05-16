# Vercel Deployment Guide

## 1. Introduction

This guide explains how to deploy a website on Vercel and troubleshoot common deployment issues. It covers static sites, single-page applications (React/Vue/Svelte), Next.js applications (SSR/SSG/Edge), and serverless functions. The instructions include required configuration, environment variables, build settings, and verification commands.

## 2. Identify your site type

- Static site: plain HTML/CSS/JS or static-site generators (Gatsby, Hugo).
- SPA: React/Vue/Svelte built to static assets (Vite, Create React App).
- Framework app: Next.js (SSG/SSR/Edge Functions).
- Serverless APIs: functions under `api/` or app-route APIs in Next.js.

Choose the matching instructions below for a tailored deployment.

## 3. Step-by-step: Uploading your website

### A. Prepare the project

- Ensure a working `build` script in `package.json` (e.g., `next build`, `vite build`).
- Commit a lockfile (`package-lock.json` or `yarn.lock`) and source code to a Git provider (GitHub/GitLab/Bitbucket).
- Confirm the output directory: Next.js -> `.next`, Vite -> `dist`.

### B. Deploy via Vercel (Git integration)

1. Push your repository to GitHub/GitLab/Bitbucket.
2. In the Vercel dashboard click **New Project** → import your repository.
3. Select the Framework Preset if detected (Next.js, etc.).
4. Configure build settings if needed:
   - Build Command: `npm run build` or `next build`
   - Output Directory: `.next` (Next.js) or `dist` (Vite)
   - Install Command: `npm ci` (recommended in CI)
5. Add environment variables (see section 4).
6. Click **Deploy**; Vercel will run the build and provide a preview URL.

### C. Deploy via Vercel CLI (manual/quick)

```bash
npm i -g vercel
vercel login
# Link and deploy (interactive)
vercel
# Production deploy
vercel --prod
```

### D. Optional: `vercel.json` configuration

Use `vercel.json` for custom build settings and function limits:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "api/**/*.ts": { "memory": 512, "maxDuration": 10 }
  }
}
```

## 4. Environment variables and secrets

- Add environment variables in Vercel Dashboard → Project → Settings → Environment Variables.
- For Next.js client-side variables, prefix with `NEXT_PUBLIC_`.
- Common examples: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`.
- You can add vars via CLI: `vercel env add NAME production`.

## 5. Common errors and solutions

1. Failed to build / build step exits non-zero
   - Reproduce locally:
   ```bash
   npm ci
   npm run build
   ```
   - Fix missing dependencies, TypeScript errors, or syntax issues.

2. Missing environment variable at runtime
   - Ensure the variable is set in the correct environment (Preview/Production).
   - Use `NEXT_PUBLIC_` for client-exposed values in Next.js.

3. Edge Function references unsupported modules: `url`, `path`
   - Edge runtime does not include Node built-ins. Move Node-specific code to Node serverless functions or replace with Edge-safe alternatives.
   - Example alternatives:
     - Edge-safe `__dirname`: `const __dirname = new URL('.', import.meta.url).pathname;`
     - Node ESM `__dirname` (NOT Edge):
       ```ts
       import { fileURLToPath } from 'url';
       import { dirname } from 'path';
       const __filename = fileURLToPath(import.meta.url);
       const __dirname = dirname(__filename);
       ```

4. Module not found or missing packages
   - Ensure runtime packages are in `dependencies` (not `devDependencies`).
   - Commit `package-lock.json` to lock versions.

5. Function exceeded memory/time limits
   - Increase limits in `vercel.json` or optimize function code.

6. Authorization/403 when calling APIs (Supabase, external services)
   - Verify API keys, RLS policies, and correct environment variables.

7. TypeScript problems during build
   - Run `tsc --noEmit` locally and fix errors; ensure Vercel build does not silently skip type checks.

8. Runtime crashes due to missing config or thrown errors
   - Fail gracefully: use `console.warn` for missing optional config and avoid uncaught throws that terminate functions.

## 6. Verification and troubleshooting commands

- Local build and test:
```bash
npm ci
npm run build
npm start # if applicable
```

- Pull environment variables locally (after setting in Vercel):
```bash
vercel env pull .env.local
```

- Get Vercel build logs (dashboard) to inspect errors and function logs.

## 7. Best practices

- Test `npm run build` locally before deploying.
- Commit lockfile and use `npm ci` in CI for reproducible installs.
- Distinguish between public and private env vars (use `NEXT_PUBLIC_`).
- Keep secrets out of repository; use Vercel environment variables or secrets.
- Avoid Node-only modules inside Edge middleware/functions.
- Use database-backed storage for state in serverless (avoid in-memory persistence).
- Implement health checks and smoke tests post-deploy.
- Use staging/preview deployments for validation before production.

## 8. Follow-up steps (optional)

- If you share `package.json` and the specific build errors, I can provide targeted fixes.
- I can prepare a `vercel.json` tailored to your repository if you provide the framework and API needs.

---

This file implements the deployment plan and provides troubleshooting guidance for typical Vercel deployments.
