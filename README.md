<h1 align="center">
    ✨ Welcome to Nexar-AI ✨
</h1>

<div align="center">

![Badge](https://img.shields.io/badge/Tech_Stack-Next.js_+_Python-yellow) ![Badge](https://img.shields.io/badge/Version-0.1.0-green) ![Badge](https://img.shields.io/badge/License-MIT-blue) ![Badge](https://img.shields.io/badge/Type-Open_Source-orange) ![Badge](https://img.shields.io/badge/For-Nonprofits_&_Small_Business-red)

</div>

<p align="center">
  <em>Add your screenshot here: Create a <code>docs/nexar-screenshot.png</code> or use a raw GitHub URL</em>
</p>

<p align="center">
  <a href="#-about-nexar-ai">About</a> •
  <a href="#-key-features">Features</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a> •
  <a href="#-acknowledgements">Acknowledgements</a>
</p>

## 🚀 About Nexar-AI

Find federal grants in 5 minutes, not 5 hours. AI-powered discovery, plain-English summaries, and intelligent matching—all in seconds. 🚀

## 🌟 Key Features

- **AI Grant Discovery**: Real-time federal grant search using OpenAI and Anthropic LLMs with built-in web search—no third-party search providers needed.
- **Personalized Recommendations**: Get grant suggestions tailored to your organization's profile, focus areas, and keywords.
- **Plain-English Summaries**: AI-generated summaries that translate complex grant requirements into clear, actionable language.
- **Smart Search**: Natural language search with category and amount filters across federal grant opportunities.
- **Save & Track Grants**: Bookmark grants, mark favorites, and manage your list—stored locally for instant access.

## 🛠️ Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI">
  <img src="https://img.shields.io/badge/Anthropic-191919?style=for-the-badge&logo=anthropic&logoColor=white" alt="Anthropic">
  <img src="https://img.shields.io/badge/Zustand-764ABC?style=for-the-badge&logo=zustand&logoColor=white" alt="Zustand">
  <img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=tanstackquery&logoColor=white" alt="TanStack Query">
  <img src="https://img.shields.io/badge/Vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
  <img src="https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white" alt="Git">
  <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
</p>

### Detailed Breakdown:

<details>
<summary><b>Frontend</b></summary>

- **Next.js 15**: App Router, server-side rendering, and API routes
- **React 19**: Dynamic and responsive user interface
- **TypeScript**: Type-safe development
- **Tailwind CSS v4**: Rapid and customizable styling
- **Radix UI**: Accessible component primitives
- **Zustand**: Lightweight state management for auth and profile
- **TanStack React Query**: Server state and data fetching
</details>

<details>
<summary><b>Backend</b></summary>

- **FastAPI**: High-performance Python API framework
- **Python 3.11+**: Server-side logic and LLM integration
- **Uvicorn**: ASGI server for production
</details>

<details>
<summary><b>AI / LLM</b></summary>

- **OpenAI**: gpt-4o-search-preview with native web search
- **Anthropic**: Claude 3.5 Haiku with web_search_20250305 tool
- **Dual provider support**: Automatic fallback if one provider fails
</details>

<details>
<summary><b>State & Data</b></summary>

- **In-memory grant cache**: Server-side cache for discovered grants (Next.js)
- **Session storage**: Python backend session-based storage
- **localStorage**: Client-side saved grants, auth, and profile persistence
</details>

<details>
<summary><b>Hosting</b></summary>

- **Vercel**: Frontend and optional separate API project deployment
- **Docker**: PostgreSQL, Redis, and FastAPI for full local stack (optional)
</details>

<details>
<summary><b>Development Tools</b></summary>

- **VS Code**: Recommended code editor
- **Git / GitHub**: Source control and collaboration
</details>

## 🚀 Getting Started

These instructions will help you set up Nexar-AI on your local machine for development and testing.

### Prerequisites

- **Python 3.11+**
- **Node.js** and npm
- **OpenAI API key** or **Anthropic API key** (at least one required)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/Nexar-AI.git
   cd Nexar-AI
   ```

2. **Create and activate a Python virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables** — Create a `.env` file in the project root:
   ```
   APP_URL=http://localhost:8000
   ENVIRONMENT=development
   DEBUG=True
   LLM_PROVIDER=openai
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

5. **Run the backend** (optional — Next.js can run standalone with API routes):
   ```bash
   python -m backend.main
   ```
   The backend runs at `http://localhost:8000`.

6. **Set up and run the frontend** (new terminal):
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local if using external backend (NEXT_PUBLIC_API_URL)
   npm run dev
   ```

7. **Open your browser** and go to `http://localhost:3000`.

## Usage

Once the project is running:

1. **Sign in** — The app auto-logs in with a demo user for quick testing.
2. **Set your profile** — Add your organization name, type, focus areas, and grant preferences.
3. **Discover grants** — Use the dashboard for personalized recommendations or the search page for keyword search.
4. **View details** — Click any grant for descriptions, eligibility, and AI-generated summaries.
5. **Save grants** — Bookmark and favorite grants for later; they're stored in your browser.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- **OpenAI** and **Anthropic** for LLM APIs with native web search capabilities
- **Next.js** and **Vercel** for the modern frontend and deployment experience
- **Grants.gov** and federal agencies for making grant information publicly accessible
- All open-source libraries and tools that made this project possible

<div align="center">

[![Built with love](https://forthebadge.com/images/badges/built-by-developers.svg)](https://github.com)

</div>
