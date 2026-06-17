# UniPath — Multi-Tenant Operating System

UniPath is a high-performance, modern, and beautiful multi-tenant operating system designed for educational consulting, CRM, ERP, and workspace management.

## 🚀 Key Features

- **Multi-Tenant Domain Routing**: Isolated subdomains (e.g. `tenant.unipath.me`) and custom domains.
- **Enterprise-Grade Identity Isolation**: Strict domain verification and cookie gating to prevent workspace bleed.
- **Student Dashboard**: Advanced profile tracking, application steps, and mentor communication.
- **UniAI Copilot**: Integrated AI assistant tailored to guide students in global university applications.
- **Rich Theme Engine**: Real-time injected HSL brand themes based on tenant preferences.

## 📦 Getting Started

### Prerequisites

Ensure you have Node.js and npm installed.

### Local Development

1. **Clone & Install Dependencies**
   ```sh
   git clone <YOUR_GIT_URL>
   cd uni-path-journey-main
   npm install
   ```

2. **Start Dev Server**
   ```sh
   npm run dev
   ```

3. **Build & Preview**
   ```sh
   npm run build
   npm run preview
   ```

## 🛠 Tech Stack

- **Framework**: React 19 & Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **Database / Auth**: Supabase
- **State Management**: Zustand & TanStack Query
