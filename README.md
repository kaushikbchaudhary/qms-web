## Project setup (API + Web)

### 1) Backend (qms-api)
1. Copy env: `cp envfiles(FE&BE)/.env.api .env` and fill `MONGO_URI`, etc.
2. Install deps: `cd qms-api && npm install`.
3. Seed MRN configs (required before any new records): `npm run seed:mrn-configs`.
4. Regenerate identifiers to the new MRN patterns:
   - Fill blanks only: `npm run migrate:mrn-identifiers`
   - Rewrite all using created dates: `npm run migrate:mrn-identifiers -- --force`
     (if validation blocks on dirty data, temporarily fix offending records or skip validation in the script for that run).
5. Seed baseline data as needed:
   - Master data: `npm run seed:master`
   - Super admin user: `npm run seed:superadmin`
   - Test users (optional): `npm run seed:test-users`
5. Start API: `npm run dev` (or `npm run start` after `npm run build`).

### 2) Frontend (qms-web)
1. Install deps: `npm install`.
2. Copy env: `cp envfiles(FE&BE)/.env.web .env.local` (or similar) and set API base URL/ports.
3. Run dev server: `npm run dev` (defaults to http://localhost:3005).
4. Proxy (optional): `node proxy.js` if you need local API proxying.

## Getting Started (web)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
