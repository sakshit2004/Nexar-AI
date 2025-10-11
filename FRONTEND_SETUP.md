# Frontend Setup & Testing Guide

## Quick Start

### 1. Start the Backend

In one terminal:

```bash
# Make sure you're in the project root and venv is activated
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

The backend should be running at http://127.0.0.1:8000

### 2. Start the Frontend

In another terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

The frontend will be running at http://localhost:3000

## Testing the Application

### 1. Landing Page
- Open http://localhost:3000
- You should see a beautiful hero section with:
  - Gradient text "Find Federal Grants in Minutes, Not Weeks"
  - Call-to-action buttons
  - Feature cards
  - Stats section
  - Premium CTA

### 2. Authentication Flow

**Register a New Account:**
1. Click "Get Started" or "Sign up"
2. Fill in:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Create account"
4. You should be redirected to the dashboard

**Login:**
1. Click "Login"
2. Enter credentials
3. You should see the dashboard

### 3. Dashboard
After logging in, you should see:
- Welcome message with your name
- Subscription tier badge
- Stats cards (Active Grants, Avg. Award, etc.)
- Quick action cards
- Recommended grants section

### 4. Grant Search
1. Click "Search Grants" in the navbar or dashboard
2. Use the search bar to find grants
3. Apply filters (category, amount range)
4. Click on any grant to see details

### 5. Grant Details
1. Click on a grant from search results
2. You should see:
   - Grant title, agency, and metadata
   - Description
   - "Generate AI Summary" button
   - Eligibility requirements
   - Quick actions sidebar
   - Key dates

3. Click "Analyze Fit" to get an AI match score

### 6. User Profile
1. Click "Profile" in the navbar
2. Fill in your organization details:
   - Organization Name
   - Organization Type
   - Focus Areas
3. Click "Save Changes"
4. You should see a success message

## Common Issues & Solutions

### Issue: "Failed to fetch" or "Network Error"

**Solution:** Make sure the backend is running on port 8000

```bash
# Check if backend is running
curl http://127.0.0.1:8000/health
```

### Issue: Login/Register not working

**Solution:** Check backend logs for errors. You may need to:

1. Add an LLM API key to `.env`:
   ```env
   OPENAI_API_KEY=sk-proj-...
   # OR
   ANTHROPIC_API_KEY=sk-ant-...
   ```

2. Restart the backend

### Issue: "Unauthorized" or token errors

**Solution:** Clear localStorage and login again:

1. Open browser DevTools (F12)
2. Go to Application > Local Storage
3. Clear `auth-storage` and `token`
4. Refresh and login again

### Issue: Dark mode not working

**Solution:** Dark mode follows system preferences. Change your OS theme to test.

## Features to Test

- [ ] Landing page loads with animations
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard displays user data
- [ ] Grant search and filtering works
- [ ] Grant details page loads
- [ ] AI summary generation works (if LLM key is set)
- [ ] Profile update works
- [ ] Logout works
- [ ] Navigation between pages works
- [ ] Responsive design (try mobile view)
- [ ] Dark mode (try both themes)

## Next Steps

Once everything works:

1. **Add your LLM API key** to enable AI features
2. **Customize the design** to match your brand
3. **Add more features** like:
   - Grant bookmarking
   - Email notifications
   - Application tracking
   - Payment integration (Stripe)
4. **Deploy** to Vercel (frontend) and your backend host

## Tech Stack

**Frontend:**
- Next.js 15 (React 19)
- TypeScript
- Tailwind CSS v4
- React Query
- Zustand
- Lucide Icons

**Backend:**
- FastAPI
- SQLAlchemy
- JWT Auth
- OpenAI/Anthropic

## Support

If you encounter issues, check:
1. Backend logs in the terminal
2. Frontend logs in browser DevTools Console
3. Network tab in DevTools for API errors

