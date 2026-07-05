# AIML Interview Experience Platform

A modern, full-stack Next.js web application built for students to share, read, and manage interview experiences for placements and internships. Designed with a clean UI, a robust student submission workflow, and a powerful admin moderation dashboard.

## 🌟 Features

### For Students
- **Browse Experiences:** View interview experiences categorized by batches and companies.
- **Rich Details:** Read in-depth interview breakdowns including the selection status, CTC, offer type, and interview difficulty.
- **Submit Experiences:** A comprehensive submission form allowing students to share:
  - **Basic Metadata:** Company, role, duration, CTC, etc.
  - **Dynamic Interview Rounds:** A step-by-step timeline of rounds (Online Assessment, Technical, HR, etc.) with specific questions asked.
  - **Topics Covered:** Tag-based topic selection (DSA, ML, DBMS, System Design, etc.).
  - **Rich Text Editor:** A powerful Tiptap-based editor for the main content with pre-filled templates.
  - **Tips & Resources:** Share actionable advice and links to preparation materials.

### For Admins
- **Moderation Dashboard:** Review pending submissions before they go live to the public. Filter by status (Pending, Approved, Rejected, Needs Revision).
- **Admin Editor:** A fully-featured rich text editor capable of modifying any part of a student's submission (including rounds, topics, and resources) prior to approval.
- **Analytics & Management:** View total experiences, manage active batches, and manage the company database.
- **Content Formatting:** Native support for adding tables, images, headings, and code blocks directly into interview experiences.

## 🚀 Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Rich Text:** [Tiptap](https://tiptap.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js 18.x or higher
- A Supabase account

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
# or
npm install --legacy-peer-deps
```

### 3. Environment Variables
Create a `.env` or `.env.local` file in the root directory with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
You will need to set up the following tables in your Supabase project:
- `batches`: For tracking student batches (e.g., AIML-25, AIML-26).
- `companies`: For tracking companies visiting the campus.
- `experiences`: The main table for interview experiences.
- `experience_rounds`: A relational table linking to specific rounds within an experience.
- `experience_resources`: A relational table linking to external prep materials.

> Note: To enable the full student submission and moderation feature, you must execute the SQL migration script (typically found in your project artifacts or provided during setup) in your Supabase SQL Editor.

### 5. Run the Development Server
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔒 Admin Access
To access the admin features:
1. Navigate to `/login`.
2. Use the configured admin password (default setup uses a simple local authentication method for the admin panel, which can be configured in `lib/auth.ts`).
3. Once logged in, you can access the dashboard at `/admin`.
