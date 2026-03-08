# Vercel Deployment Checklist

## All-on-Vercel (one project: Next.js + Python API)

To run **everything on Vercel** (no separate backend host):

1. **Root Directory**  
   In Vercel → Project Settings → General → **Root Directory** must be the **repository root** (leave empty or `.`).  
   Do **not** set it to `frontend`, or the `api/` and `backend/` folders will not be deployed and `/api/v1/*` will 404.

2. **Build**  
   The root `vercel.json` runs `npm run build` (which builds the Next.js app in `frontend/`) and sets `outputDirectory` to `frontend/.next`. The Python serverless function is at `api/index.py` and handles `/api/v1/*` via rewrites.

3. **Backend env vars (in Vercel)**  
   Set these in Vercel → Project Settings → Environment Variables (for **Production** and optionally Preview):
   - `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` (for grant search/recommendations)
   - Optional: `LLM_PROVIDER` = `openai` or `anthropic`
   - Optional: `ENVIRONMENT` = `production`  
   Ensure each variable is enabled for **Runtime** (not only Build), so the serverless function can read it. If you still get 500 with keys set, check **Deployments → [your deployment] → Functions → Logs** for the Python error (timeout, API error, etc.).

4. **Frontend API URL**  
   You can leave `NEXT_PUBLIC_API_URL` **unset** in production. The app will use the same origin, and rewrites send `/api/v1/*` to the Python function.

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