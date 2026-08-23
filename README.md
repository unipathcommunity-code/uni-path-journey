# UniPath — Study-Abroad Consulting SaaS

UniPath is a multi-tenant SaaS platform for **study-abroad consulting agencies**. Every agency gets its own subdomain (`myagency.unipath.me`), a branded public site, and an admin workspace for applicants, documents, visas and payments.

## 🚀 Key Features

- **Multi-Tenant Domain Routing**: Isolated subdomains (e.g. `agency.unipath.me`) and custom domains.
- **Enterprise-Grade Identity Isolation**: Strict domain verification and cookie gating to prevent workspace bleed.
- **Applications Pipeline**: Lead → contact → documents → visa → enrolment, in one CRM board.
- **Student Dashboard**: Profile tracking, application steps, grants, housing and mentor communication.
- **UniAI Copilot**: Integrated AI assistant tailored to guide students in global university applications.
- **Rich Theme Engine**: Real-time injected HSL brand themes based on tenant preferences.

## 📦 Getting Started

### Prerequisites

Node.js and pnpm.

### Local Development

1. **Clone & Install Dependencies**
   ```sh
   git clone <YOUR_GIT_URL>
   cd uni-path-journey
   pnpm install
   ```

2. **Start Dev Server**
   ```sh
   pnpm dev
   ```

3. **Build & Preview**
   ```sh
   pnpm build
   pnpm preview
   ```

## 🛠 Tech Stack

- **Framework**: React & Vite (pnpm monorepo — `apps/unipath-core` + shared `packages/*`)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **Database / Auth**: Supabase
- **State Management**: Zustand & TanStack Query
