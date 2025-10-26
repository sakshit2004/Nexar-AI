# Nexar AI Frontend Redesign Plan
## Inspired by a16z & YC-backed Startups (Notion, Figma, Airtable, Linear)

## Design Principles

### Key Patterns Observed:
1. **Centered, minimal login/signup forms** (Notion, Figma, Airtable)
2. **Social authentication first** (Google, Apple, SSO)
3. **Clean typography** - Large, bold headlines with minimal decoration
4. **Generous whitespace** - Never cramped
5. **Subtle animations** - Smooth transitions, no jarring effects
6. **Simple color palette** - Mostly white/light gray backgrounds
7. **Clear visual hierarchy** - Bold text for primary actions
8. **Email-first flow** - Simple, one-step-at-a-time approach

---

## Page-by-Page Redesign

### 1. Login Page (`/login`)

**Current Issues:**
- Card-based layout feels dated
- Small icon at top
- Border-2 looks heavy

**New Design (Notion-inspired):**
- Full-height centered layout
- Logo at top left (small, minimal)
- Large headline: "Welcome back"
- Subdued subtext: "Sign in to your Nexar AI account"
- Email input ONLY (no password yet)
- Large "Continue" button
- Divider with "or"
- Social auth buttons (Google SSO style)
- "Don't have an account? Sign up" at bottom
- No card borders, just clean white background

**Layout:**
```
Logo (top-left)

        [Center of page]
        Welcome back
        Sign in to your Nexar AI account
        
        Email
        [Large input box]
        
        [Continue button - full width]
        
        ────── or ──────
        
        [Continue with Google]
        [Continue with SSO]
        
        Don't have an account? Sign up
```

---

### 2. Register Page (`/register`)

**Current Issues:**
- Too much in one form
- Checkmarks feel salesy
- Border-2 card

**New Design (Airtable-inspired):**
- Same layout as login
- Headline: "Get started with Nexar AI"
- Subtext: "Create your free account"
- Email input only (step 1)
- After email: name + password (step 2)
- Benefits moved to separate onboarding screen
- Social auth prominent
- "Already have an account? Sign in"

---

### 3. Dashboard Page (`/dashboard`)

**Current Issues:**
- Stats feel cramped
- Grant cards too small
- Not enough whitespace

**New Design (Linear-inspired):**
- Welcome header: "Welcome back, [Name]"
- Stats in 4-column grid with more spacing
- Each stat card:
  - Large number (4xl)
  - Label below
  - Icon top-right
  - Hover: subtle lift
- "Recommended for You" section:
  - Large section title
  - Grant cards in grid (not list)
  - Each card shows:
    - Agency badge (top-right)
    - Grant title (bold, larger)
    - Amount + Deadline (icons)
    - Match score bar
    - Hover: border highlight
- "Quick Actions" widget:
  - Search grants
  - View profile
  - Browse all grants
- Empty state when no profile:
  - Illustration
  - "Complete your profile"
  - CTA button

---

### 4. Search Page (`/search`)

**Current Issues:**
- Filters feel cramped
- Results layout basic
- Search bar small

**New Design (Airtable-inspired):**
- Large search bar at top
- Filters in sidebar (left)
- Results in main area (right)
- Each result card:
  - Larger, more spacious
  - Agency logo/badge
  - Title (bold, 18px)
  - Description (2 lines, truncated)
  - Amount + Deadline (prominent)
  - Match score (if logged in)
  - Arrow icon on hover
- Pagination at bottom
- Filter chips below search bar
- Empty state: "No grants found" with illustration

---

### 5. Profile Page (`/profile`)

**Current Issues:**
- Long form feels overwhelming
- No clear sections

**New Design (Notion-inspired):**
- Tabbed interface:
  - "Profile" tab
  - "Preferences" tab
  - "Billing" tab (future)
- Profile tab:
  - Avatar upload (top)
  - Name, Email (non-editable hint text)
  - Organization details section
  - Interests section
- Preferences tab:
  - Grant categories
  - Location
  - Funding range
  - Keywords
- Each section in clean card with title
- Save button sticky at bottom
- Success toast on save

---

### 6. Grant Details Page (`/grants/[id]`)

**Current Issues:**
- Layout cramped
- Actions buried
- Not enough whitespace

**New Design (Figma-inspired):**
- Breadcrumb at top: "Dashboard / Search / Grant Title"
- Two-column layout:
  - **Left (main content - 66%)**:
    - Grant title (huge, bold)
    - Agency + Category badges
    - Description (larger text, good line-height)
    - Eligibility section
    - Requirements section
    - Deadline prominently shown
  - **Right (sidebar - 33%)**:
    - Sticky position
    - Match score card (if logged in)
    - Amount card
    - Deadline card
    - Actions:
      - "View Official Page" (primary)
      - "Generate AI Summary" (secondary)
      - "Save Grant" (ghost)
- AI summary in expandable section
- Mobile: single column

---

## Component Library Updates

### Form Inputs
- Remove `border-2`, use `border` (1px)
- Increase padding: `py-3` instead of default
- Focus: blue ring (subtle)
- Icons: left-aligned, muted color

### Buttons
- Primary: Black background, white text, `h-11` or `h-12`
- Secondary: White background, black border, black text
- Ghost: Transparent, black text on hover
- Full-width for mobile, auto-width for desktop

### Cards
- Remove `border-2`, use `border` or no border
- Increase padding: `p-6` or `p-8`
- Subtle shadow on hover: `hover:shadow-md`
- Rounded corners: `rounded-xl` (12px)

### Typography
- Headlines: Font weight 700, tight tracking
- Body: Font weight 400, relaxed line-height (1.6)
- Labels: Font weight 500, smaller size
- Muted text: `text-muted-foreground`

### Spacing
- Sections: `py-12` or `py-16`
- Between elements: `gap-6` or `gap-8`
- Card grids: `gap-6`

---

## Implementation Order

1. ✅ Landing page (already done)
2. ⏳ Login page - Simplify, add social auth placeholders
3. ⏳ Register page - Simplify, match login style
4. ⏳ Dashboard - Improve stats, grant cards, layout
5. ⏳ Search page - Better filters, results layout
6. ⏳ Profile page - Tabbed interface
7. ⏳ Grant details - Two-column layout

---

## Technical Notes

### Social Auth (Future)
- Google OAuth button (placeholder for now)
- Apple Sign In (placeholder)
- SSO option (for enterprise)

### Animations
- Page transitions: fade-in
- Cards: hover lift (2-4px translate)
- Buttons: subtle scale on press
- Loading states: skeleton loaders

### Responsive
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Stack columns on mobile
- Hide sidebar on mobile, show as drawer

### Accessibility
- Focus states visible
- ARIA labels
- Keyboard navigation
- Color contrast AAA

---

## Color Palette

**Keep black & white theme:**
- Background: White (#FFFFFF)
- Foreground: Black (#000000)
- Muted: Gray-100 (#F5F5F5)
- Border: Gray-200 (#E5E5E5)
- Accent: Can add one brand color (optional)

---

## Key Takeaways from Research

1. **Less is more** - Remove unnecessary borders, reduce visual weight
2. **Center important content** - Login/signup should be centered
3. **Social auth first** - Modern apps lead with OAuth
4. **One thing at a time** - Don't overwhelm with options
5. **Generous spacing** - Whitespace makes it feel premium
6. **Clear hierarchy** - Bold for important, muted for secondary
7. **Smooth interactions** - Subtle hover effects, smooth transitions


