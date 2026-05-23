# SCT E-Voting Platform

Modern React, TypeScript, Tailwind CSS, and Vite e-voting portal for the School of Communication Technology.

## Features

- Role-based login for Admin and Student voters
- Student and aspirant registration with image uploads
- Admin approval queue, aspirant payment verification, candidate promotion, and audit logs
- Candidate, position, department, and election window management
- Election active/closed checks with one ballot per approved student
- Recharts analytics and PDF/CSV result exports
- Reactive `localStorage` mock backend for demo state

## Demo Login

- Admin identity: `SCT Election Administrator`
- Admin password: `admin123`
- Student matric number: `SCT/OTM/20/087`
- Student password: `password`

## Run

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Supabase

The app is configured to use Supabase when these Vite variables are present:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Database schema is tracked in `supabase/migrations/20260523183000_sct_evoting_schema.sql`.

Current Supabase project:

- Name: `sct-e-voting`
- Ref: `dzworbhbcqrsknmaxhar`
- URL: `https://dzworbhbcqrsknmaxhar.supabase.co`

## Note

The current app uses a Supabase-backed state store with localStorage fallback, plus normalized election tables for the next hardening pass. For production voting, move admin and voter flows to Supabase Auth with strict role-based RLS policies, server-side ballot validation, immutable audit storage, and database-level vote constraints.
