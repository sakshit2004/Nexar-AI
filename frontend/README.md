# GrantMatch Advisor - Frontend

Modern, beautiful Next.js 15 frontend for the GrantMatch Advisor application.

## Tech Stack

- **Next.js 15** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** components
- **React Query** for data fetching
- **Zustand** for state management
- **Axios** for API calls

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Update the API URL if needed (defaults to `http://127.0.0.1:8000`)

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── dashboard/         # Dashboard page
│   ├── search/            # Grant search page
│   ├── profile/           # User profile page
│   └── grants/[id]/       # Grant details page
├── components/            # React components
│   ├── ui/               # UI components (Button, Card, etc.)
│   └── Navbar.tsx        # Navigation component
├── lib/                   # Utility functions
│   ├── api.ts            # API client
│   ├── store.ts          # Zustand store
│   └── utils.ts          # Helper functions
└── public/               # Static assets
```

## Features

- 🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS
- 🔐 **Authentication** - Login/Register with JWT tokens
- 🔍 **Grant Search** - Search and filter federal grants
- 🤖 **AI Matching** - Get AI-powered grant recommendations
- 📊 **Dashboard** - View stats and recommended grants
- 👤 **Profile Management** - Manage organization profile
- 🌗 **Dark Mode** - Automatic dark mode support

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://127.0.0.1:8000`)

## Notes

- Make sure the backend is running on port 8000 before starting the frontend
- The app uses localStorage for authentication token storage
- Dark mode is automatic based on system preferences

## Deployment on Vercel

This frontend is configured for deployment on Vercel. Follow these steps:

### 1. Prerequisites
- Ensure you have a Vercel account
- Install Vercel CLI: `npm i -g vercel`

### 2. Deploy from Root Directory
```bash
# From the project root (not frontend directory)
vercel --prod
```

### 3. Environment Variables
Set these in your Vercel dashboard:
- `NEXT_PUBLIC_API_URL` - Your backend API URL
- `NEXT_PUBLIC_APP_NAME` - GrantMatch
- `NEXT_PUBLIC_APP_VERSION` - 1.0.0

### 4. Build Configuration
The project is configured with:
- Framework: Next.js
- Build Command: `cd frontend && npm run build`
- Output Directory: `frontend/.next`
- Install Command: `cd frontend && npm install`

### 5. Automatic Deployments
Connect your GitHub repository to Vercel for automatic deployments on push to main branch.

## Troubleshooting

### Build Issues
- Ensure all dependencies are installed: `npm install`
- Check TypeScript errors: `npm run type-check`
- Check linting: `npm run lint`

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Check CORS settings on backend
- Ensure backend is deployed and accessible