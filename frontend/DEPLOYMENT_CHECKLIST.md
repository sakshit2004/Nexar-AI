# Vercel Deployment Checklist

## Recommended: Two Vercel projects (frontend + API)

With a single Vercel project, the Next.js app receives all traffic and the Python serverless functions at `/api/backend` or `/api/index` are **not** invoked (you get Next.js 500 for those paths). The reliable way to run everything on Vercel is **two projects**:

### Project 1 – Frontend (this repo, Next.js)

1. **Vercel project** from this repo.
2. **Root Directory**: repository root (empty or `.`).
3. **Build**: uses `vercel.json` (`npm run build`, `outputDirectory`: `frontend/.next`).
4. **Environment variable**: set **`NEXT_PUBLIC_API_URL`** to the **API project URL** (e.g. `https://nexar-api.vercel.app` — no trailing slash). The frontend will call that URL at `/api/index` with `X-Original-URL` for each API request.

### Project 2 – API (same repo, Python only)

1. **New Vercel project** from the **same** GitHub repo.
2. **Root Directory**: repository root (`.`).
3. **Build Command**: leave empty or set to `echo "API only"`.
4. **Output Directory**: leave empty.
5. **Environment variables** (Production): `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY`, and optionally `LLM_PROVIDER`, `ENVIRONMENT=production`.
6. This project only needs the `api/` and `backend/` folders; Vercel will deploy `api/index.py` (and `api/backend.py`) as serverless functions. The frontend calls `https://<api-project>/api/index` with header `X-Original-URL: https://<api-project>/api/v1/grants/recommended?q=...` etc., and the Python app routes correctly.

After both are deployed, set `NEXT_PUBLIC_API_URL` in the **frontend** project to the API project’s URL and redeploy the frontend.

---

## Single project (Next.js + Python, may not route to Python)

If you use one project only:

1. **Root Directory** must be the **repository root** (not `frontend`).
2. **Backend env vars**: `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` for Runtime.
3. **Frontend API URL**: leave **unset** to use same origin; the in-app proxy will try to call `/api/backend`, but on many deployments that request is still handled by Next.js and returns 500. If that happens, use the **two-project** setup above.

---

## Pre-deployment Steps

### 1. Dependencies
- [ ] All dependencies installed: `npm install`
- [ ] No security vulnerabilities: `npm audit`
- [ ] TypeScript compiles: `npm run type-check`
- [ ] ESLint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`

### 2. Environment Variables
- [ ] `.env.example` created with all required variables
- [ ] `.env.local` configured for local development
- [ ] Production environment variables ready for Vercel dashboard

### 3. Configuration Files
- [ ] `next.config.ts` optimized for production
- [ ] `vercel.json` configured for monorepo structure
- [ ] `package.json` has all necessary scripts
- [ ] `tsconfig.json` properly configured

## Deployment Steps

### 1. Initial Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login
```

### 2. Deploy from Project Root
```bash
# From the project root directory (not frontend/)
vercel --prod
```

### 3. Configure Environment Variables in Vercel Dashboard
- `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_VERSION` (optional)
- For all-on-Vercel: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (see “All-on-Vercel” above).  
  `NEXT_PUBLIC_API_URL` can be left unset so the app uses the same origin.

### 4. Verify Deployment
- [ ] Frontend loads correctly
- [ ] API routes work (if applicable)
- [ ] All pages render without errors
- [ ] Environment variables are accessible

## Post-deployment

### 1. Performance
- [ ] Check Core Web Vitals in Vercel dashboard
- [ ] Verify build size is reasonable
- [ ] Test loading speed

### 2. Functionality
- [ ] All routes work correctly
- [ ] API integration functions
- [ ] Authentication flow works
- [ ] Error pages display properly

### 3. Monitoring
- [ ] Set up error tracking (if needed)
- [ ] Monitor build times
- [ ] Check deployment logs

## Common Issues & Solutions

### Build Failures
- Check TypeScript errors: `npm run type-check`
- Verify all imports are correct
- Ensure all dependencies are in package.json

### Environment Variables Not Working
- Prefix client-side variables with `NEXT_PUBLIC_`
- Set variables in Vercel dashboard, not just locally
- Redeploy after adding new environment variables

### API Connection Issues
- Verify CORS settings on backend
- Check API URL format (include protocol)
- Ensure backend is deployed and accessible

### Routing Issues
- Verify Next.js App Router structure
- Check dynamic routes syntax
- Ensure all pages export default components