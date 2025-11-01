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
- 🎯 **Intelligent Matching** - Get personalized grant recommendations
- 📊 **Dashboard** - View stats and recommended grants
- 👤 **Profile Management** - Manage organization profile
- 🌗 **Dark Mode** - Automatic dark mode support

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://127.0.0.1:8000`)

## Notes

- Make sure the backend is running on port 8000 before starting the frontend
- The app uses localStorage for authentication token storage
- Dark mode is automatic based on system preferences
