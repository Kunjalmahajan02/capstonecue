# CapstoneCue

CapstoneCue is a capstone demo-day preflight workspace. It helps a student organize review evidence, check that public GitHub and Vercel links respond, rehearse a three-minute demo, and prepare a short pitch and panel answers.

The product is an early hypothesis. No student interviews, product-market fit, or external signups are claimed in this repository.

## Features

- Supabase email/password sign-up and sign-in.
- Private project, requirement, and check-history data protected by row-level security.
- Live checklist change updates through Supabase Realtime.
- Editable criteria, status, and evidence URL; search and stage filters.
- Public GitHub repository and Vercel deployment reachability checks.
- Responsive capstone dashboard and readiness chart.
- Six-slide pitch page, editable PowerPoint download, three-minute rehearsal timer, panel Q&A, and first-user launch plan.
- Confirmed account count only; local sample data is labelled demo and is never counted as a user.

## Stack

React, TypeScript, Vite, Supabase Auth/Postgres/Realtime, a Vercel Node.js Function, and Vercel hosting.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

    npm install
    Copy-Item .env.example .env.local

Set the two values in .env.local:

    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-public-anon-key

Then start Vite:

    npm run dev

Apply supabase/schema.sql in the Supabase SQL Editor before signing up. The Supabase anon key is intended for browser use when row-level security is enabled. Never put a service-role key in VITE_* variables or commit secrets.

To exercise the /api/check-links function locally, use the Vercel CLI:

    npx vercel dev

Plain Vite does not run Vercel Functions.

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run supabase/schema.sql.
3. In Authentication URL Configuration, allow the local URL and the final Vercel deployment URL. Set the production Site URL after deployment.
4. Decide whether to require email confirmation. The app's public account metric counts confirmed accounts only.
5. Copy the project URL and public anon/publishable key into local variables and Vercel project environment variables.

The database policies scope every project, requirement, and check result to auth.uid(). The public RPC returns only a number of email-confirmed accounts; it does not expose emails or account identities.

## Deploy to Vercel

1. Push this complete project folder to a new GitHub repository.
2. Import that repository into a separate Vercel project.
3. Use the project root, Vite framework detection, build command npm run build, and output directory dist.
4. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Preview and Production environments.
5. Redeploy after adding the variables.
6. Add the deployed Vercel URL to the Supabase Auth redirect allowlist and Site URL.
7. Test signup confirmation, sign-in, create/edit/delete requirement, refresh persistence, link checking, and a second account's data isolation.

The app itself can render in demo mode without Supabase, but authentication, shared persistence, and signup counts are unavailable until the database is connected.

## Link-checker limits

The serverless checker accepts public github.com repository URLs and https Vercel deployment URLs. It is not a security audit, deployment quality check, or general URL fetch endpoint. A successful response proves reachability at that moment only.

## Demo-day materials

- Six-slide pitch: public/pitch.html
- Editable PowerPoint: public/CapstoneCue-Demo-Day-Pitch.pptx
- Timed three-minute run sheet and interactive rehearsal timer: Launch kit → 3-minute demo
- Panel question practice and launch plan: Launch kit

The pitch page is a draft. Replace its prompts with observed student interviews, actual deployment details, and verified account counts before presenting.

## Project notes

- Product and competitive scan: docs/product-brief.md
- Database schema and policies: supabase/schema.sql
- Demo-day runbook: docs/demo-day-runbook.md
- The supplied Project 5 rubric asks for an original idea, public product URL, functional database integration, a 5–7 slide pitch, a three-minute demo, real users, and an industry-panel review. The ten-user goal is an external distribution task; the app will not invent or seed real user counts.

