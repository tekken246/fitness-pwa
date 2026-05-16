# Fit Track PWA

Production-grade mobile-first workout tracking PWA built with Next.js App Router, TypeScript, Tailwind CSS, Clerk, Neon Postgres, Drizzle ORM, and Vercel.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set Clerk keys and Neon `DATABASE_URL`.
3. Install dependencies with `npm install`.
4. Apply migrations with `npm run db:migrate`.
5. Start with `npm run dev`.

The seed template is implemented from the uploaded workout schedule reference: Monday through Sunday split plus Day 1 through Day 5 exercises and target rep schemes.
