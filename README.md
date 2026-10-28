# Campus Connect 🎓

> A modern, responsive campus community and academic collaboration platform designed for university students to share notes, discover student clubs, track official notices, and manage campus event participation.

[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Oxlint](https://img.shields.io/badge/Linter-Oxlint-orange)](https://oxc.rs/)

---

## 📌 Problem Statement & Objectives

### The Problem
University campus communications are frequently fragmented across disparate bulletin boards, scattered departmental websites, unorganized group chats, and outdated portals. Students miss critical academic deadlines, struggle to discover extracurricular clubs, and lack an accessible, centralized digital space for peer study exchange.

### Project Objectives
- **Unified Campus Hub**: Centralize campus discussions, official announcements, club activities, and events into a single intuitive interface.
- **Responsive & Accessible Design**: Deliver a modern user experience with desktop sidebar navigation, mobile drawer and bottom navigation bars, and accessible WCAG-compliant contrasts.
- **Seamless Theming**: Provide comfortable viewing environments via a persistent light and dark theme with balanced slate and deep charcoal surfaces.
- **Instant Interactivity**: Offer fluid client-side feedback for post creation, likes, comments, event RSVPs, and notice tracking.

---

## ✨ Implemented Features

### 1. Central Campus Feed (`/`)
- **Post Composer**: Share study notes, midterm prep resources, hackathon calls, and general campus discussions with category tags (*Academics*, *Campus Life*, *Technology*, *Opportunities*) and hashtags.
- **Post Interactions**: Real-time like toggles and interactive threaded commenting.
- **Keyword & Category Filters**: Search discussions by author name, department, content, or topic tags with clearable active filters.
- **Dashboard Rail**: Quick-view widgets for upcoming events, trending communities, and university announcements.

### 2. Campus Events (`/events`)
- **Featured Showcase**: Hero banner spotlighting major upcoming college hackathons, fests, or tech symposiums.
- **Categorized Event Grid**: Filter events by *Technical*, *Cultural*, *Workshop*, *Sports*, or *General*.
- **Interactive Event Details Dialog**: Displays full event schedule, venue, organizer, live attendee count, and calendar actions.
- **Synchronized RSVPs**: Real-time RSVP toggles that stay in sync between the homepage right rail and the dedicated events directory.

### 3. Campus Notice Board (`/notice-board`)
- **Official Department Notices**: Fictional realistic announcements categorized by *Academics*, *Examinations*, *Placements*, *Scholarships*, and *Events*.
- **Pinned Notice Highlighting**: Prominent banners for urgent campus advisories and administrative deadlines.
- **Read / Unread State Tracking**: Clicking a notice opens the full announcement modal and automatically marks it as read. Includes single-notice read/unread toggles and a global "Mark all as read" button.

### 4. Discover Communities (`/communities`)
- **Student Circles**: Browse campus communities including Coding Club, AI & Machine Learning, Competitive Programming, Gaming Community, Entrepreneurship Club, Photography Society, Robotics Club, and Design Community.
- **Membership Management**: One-click Join / Leave functionality with dynamic member counters.
- **Category Filters & Search**: Search by circle name, lead coordinator, or interest tags.

### 5. Explore Campus Life & Club Registration (`/explore`)
- **Student Club Directory**: Comprehensive club profiles detailing meeting schedules, coordinators, focus areas, and recent announcements.
- **Club Details Dialog**: Deep dive into club initiatives with interactive membership toggling.
- **Club Registration Flow**: Dual-entry modal ("Register a Club" header button & bottom call-to-action) allowing students to propose and register new campus organizations with input validation.

### 6. Notifications Center (`/notifications`)
- **Multi-Tab Filtering**: View *All* or filter exclusively for *Unread* campus updates.
- **Chronological Grouping**: Organized by *Today*, *Yesterday*, and *Earlier*.
- **Reactive Badges**: Dynamic unread counter badges reflected across both the top header and navigation sidebar.

### 7. Student Profile & Customization (`/profile`)
- **Personalized Identity**: Displays academic details, verified student badge, enrolled semester courses, skills, and campus interests.
- **Custom Avatar & Banner Uploads**: Upload profile pictures and cover images with client-side canvas validation, center-cropping, and size compression.
- **Preset Gradients & Dynamic Fallbacks**: Selection of six gradient covers and deterministic initials avatars with accessible color palettes.
- **Profile Editor**: Modal to edit student name, handle, major, academic year, bio, skills, and interests.

### 8. Peer Network (`/network`)
- Discover and connect with peer tutors, study buddies, and project partners across departments.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | **React 19** (`react`, `react-dom`) | Modern component-driven UI library |
| **Language** | **TypeScript 7** | Static type checking and interface contracts |
| **Build Tooling** | **Vite 8** | High-performance dev server with fast HMR |
| **Styling** | **Tailwind CSS v4** (`@tailwindcss/vite`) | Utility-first CSS framework with native CSS variables |
| **Routing** | **React Router v7** (`react-router-dom`) | Declarative client-side routing |
| **Icons** | **Lucide React** (`lucide-react`) | Clean, accessible vector icons |
| **Linter** | **Oxlint** (`oxlint`) | High-speed Rust-based JavaScript/TypeScript linter |
| **Utilities** | `clsx`, `tailwind-merge`, `cva` | Dynamic class merging and component variants |

---

## 🎨 Theme & Design System

Campus Connect features a tailored dual-theme design system preserving the signature **Indigo** brand identity:

- **Light Mode**: Clean white and soft slate backgrounds (`#FFFFFF`, `#F8FAFC`) with subtle border dividers.
- **Dark Mode**: Eye-friendly deep charcoal and dark slate surfaces (`#111318` main, `#181B23` sidebar/elevated, `#1D212B` cards, `#2B303B` borders) with high-contrast text (`#F1F3F9`) and luminous indigo accents (`#818CF8`).
- **Persistence**: Theme selection is stored in `localStorage` and toggled directly on the root HTML document without flicker.

---

## 📁 Project Directory Structure

```text
campus-connect/
├── index.html                   # HTML entry point with meta tags & favicon
├── package.json                 # Project scripts and dependencies
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # Client TypeScript compilation settings
├── tsconfig.node.json           # Node/Vite build tooling configuration
├── vite.config.ts               # Vite configuration and path aliases
├── .oxlintrc.json               # Oxlint configuration
├── .gitignore                   # Excluded files for version control
├── public/                      # Static assets
└── src/
    ├── main.tsx                 # Application bootstrap entry
    ├── App.tsx                  # App shell wrapped with ThemeProvider and Router
    ├── index.css                # Global styles, fonts, and Tailwind directives
    ├── components/              # Modular UI components
    │   ├── common/              # Brand logo, PageHeader, EmptyState, StatCard, ThemeToggle
    │   ├── communities/         # Community cards and details dialog
    │   ├── events/              # Event cards, featured banner, and EventDetailsDialog
    │   ├── explore/             # ClubDetailsDialog and CreateClubDialog
    │   ├── feed/                # PostComposer, PostCard, RightSidebar, AnnouncementDialog
    │   ├── noticeboard/         # NoticeDetailsDialog
    │   ├── notifications/       # NotificationItem
    │   ├── profile/             # EditProfileDialog
    │   └── ui/                  # Primitives (Avatar, Badge, Button, Card, Input)
    ├── context/                 # React context providers (ThemeContext)
    ├── data/                    # Realistic mock datasets (posts, events, clubs, notices)
    ├── hooks/                   # Custom business logic & localStorage hooks
    │   ├── useCampusCommunities.ts
    │   ├── useCampusEvents.ts
    │   ├── useCampusNotices.ts
    │   ├── useCampusNotifications.ts
    │   ├── useCampusPosts.ts
    │   ├── useStudentProfile.ts
    │   ├── useTheme.ts
    │   └── useMediaQuery.ts
    ├── layouts/                 # Shell layouts (RootLayout, Header, Sidebar, MobileNav)
    ├── lib/                     # Image processing and styling helper utilities
    ├── pages/                   # Top-level view routes (HomePage, EventsPage, ProfilePage...)
    ├── router/                  # React Router configuration
    └── types/                   # TypeScript interfaces and domain models
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **Package Manager**: `npm` (v9+), `yarn`, or `pnpm`

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/campus-connect.git
   cd campus-connect
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Launches the local Vite development server with HMR. |
| `npm run build` | Runs TypeScript compilation (`tsc -b`) and generates an optimized production bundle in `dist/`. |
| `npm run lint` | Runs fast code linting via `oxlint`. |
| `npm run preview` | Locally serves the production build for smoke testing. |

---

## 📸 Screenshots

*(Screenshots can be added here following deployment or demo captures)*

| Campus Feed (Dashboard) | Event Details & Calendar |
|:---:|:---:|
| ![Campus Feed Placeholder](https://placehold.co/600x360/1e293b/ffffff?text=Campus+Feed+Dashboard) | ![Events Placeholder](https://placehold.co/600x360/1e293b/ffffff?text=Campus+Events+%26+RSVP) |

| Notice Board & Announcements | Student Profile (Dark Mode) |
|:---:|:---:|
| ![Notices Placeholder](https://placehold.co/600x360/1e293b/ffffff?text=Campus+Notice+Board) | ![Profile Placeholder](https://placehold.co/600x360/1e293b/ffffff?text=Student+Profile+%26+PFP) |

---

## ⚠️ Current Architecture & Limitations

Please note that this version is an interactive **frontend-first prototype**:
- **Mock Data**: Uses fictional sample data representing an Indian technical institute (NIT/IIT context).
- **Client-Side Persistence**: State modifications (profile updates, image uploads, post creation, comments, likes, club memberships, and notice read receipts) are persisted locally in the browser's `localStorage`.
- **No Active Backend**: There is no live backend server, database, or real identity provider connected in this prototype stage.

---

## 🗺️ Roadmap & Backend Integration Plans

The planned subsequent development phase will introduce a robust full-stack architecture:

- **Backend API**: Migration to a high-performance **FastAPI** (Python 3.12) backend with asynchronous endpoints and Pydantic validation.
- **Relational Database**: Persistent storage with **PostgreSQL**, managed through **SQLAlchemy 2.0** ORM and **Alembic** database migrations.
- **Authentication & Security**: Multi-factor authentication via JWT tokens, OAuth2, and university Single Sign-On (SSO) integration.
- **Cloud Media Storage**: Direct-to-bucket avatar and document uploads via **AWS S3** or **Cloudflare R2** with signed URLs.
- **Real-Time Collaboration**: **WebSockets** for live campus chat channels, real-time post notification broadcasts, and study room sync.
- **Automated Testing & CI/CD**: End-to-end integration testing with Playwright and automated GitHub Actions delivery workflows.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
