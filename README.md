# OfficeFlow - Modern Office Management System

OfficeFlow is a specialized CRM and office management platform designed for marketing agencies. It streamlines client management, task scheduling, billing, and reporting.

## 🚀 Technology Stack

### Frontend
- **Next.js 15 (App Router)**: Utilizing the latest features like Server Components, Server Actions, and optimized routing.
- **React 19**: Leveraging the newest React patterns and hooks for a responsive user interface.
- **TypeScript**: Ensuring type safety and better developer experience across the codebase.

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for rapid and consistent UI development.
- **ShadCN UI**: A collection of re-usable components built using **Radix UI** primitives and Tailwind CSS.
- **Lucide React**: A beautiful and consistent icon library used throughout the application.
- **Framer Motion**: (Where applicable) for smooth UI transitions and animations.

### Backend & Database
- **Firebase**:
  - **Firestore**: NoSQL document database used for real-time data synchronization of tasks, clients, and user profiles.
  - **Firebase Authentication**: Custom authentication flow managing user sessions via username/password and Firestore-backed profiles.
- **Genkit**: Framework used for AI-integrated flows, specifically for secure backend operations like user creation.

### Key Libraries & Tools
- **PDF Generation**:
  - `jspdf` & `jspdf-autotable`: For generating professional invoices and client reports directly in the browser.
  - `html2canvas`: Used to capture UI components as images for report bundles.
- **Form Management**:
  - `React Hook Form`: For high-performance, extensible forms with easy validation.
  - `Zod`: TypeScript-first schema declaration and validation library for both forms and API inputs.
- **Data Utilities**:
  - `date-fns`: Modern JavaScript date utility library for consistent formatting and manipulation.
  - `recharts`: For visualizing data through beautiful, responsive charts.
  - `JSZip` & `file-saver`: For bundling multiple reports into a single downloadable ZIP file.

## 🛡 Disaster Recovery & Backups

Hostinger backups **only** cover the website code. To protect your enterprise data (Clients, Tasks, Users), follow this Firebase-specific strategy:

### 1. Point-in-Time Recovery (PITR)
Enable PITR in the Google Cloud Console for Firestore. This allows you to roll back any collection to a specific second within the last 7 days.
`gcloud firestore databases update --pitr-retention-period=7d`

### 2. Automated GCS Exports
Use a Cloud Function to run a scheduled `exportDocuments` command daily. This saves your entire database as a snapshot in a Google Cloud Storage bucket.

### 3. Auth Backups
Firebase Auth users are not exported by default. Use the Firebase CLI or a script using `firebase-admin` to run `auth:export` weekly.

## 🏗 Project Structure
- `src/app`: Next.js App Router pages and layouts.
- `src/components`: UI components, organized into `ui` (shadcn) and feature-specific folders (dashboard, settings).
- `src/hooks`: Custom React hooks for global state management (auth, tasks, clients).
- `src/firebase`: Configuration and initialization of the Firebase SDK.
- `src/ai`: Genkit flows and AI-related logic.
- `src/lib`: Shared utility functions, types, and constants.