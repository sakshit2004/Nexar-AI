# Vercel Deployment Checklist

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
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_VERSION`

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