# CampusCart - College Marketplace Platform

## Overview

CampusCart is a full-stack web application that provides an exclusive marketplace for college students to buy and sell items on campus. The platform enables students to list textbooks, furniture, electronics, and other campus-related items, facilitating secure transactions within their university community.

The application features user authentication with role-based access (students and administrators), real-time messaging between buyers and sellers, product listings with image support, payment method management, and comprehensive administrative controls for platform oversight.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom design tokens
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation

**Design System:**
The application uses a "new-york" style variant from Shadcn/ui with custom theming. Design tokens are defined using CSS custom properties for colors (HSL format), typography (Inter for body text, Poppins for display), and spacing. The UI emphasizes modern, minimal aesthetics with rounded corners, subtle shadows, and elevation effects.

**Component Architecture:**
Components are organized into three categories:
- UI primitives (`client/src/components/ui/`) - Reusable atomic components
- Layout components - Navigation, page structure
- Feature components - Product cards, messaging interface, dashboards

**Protected Routes:**
Implements role-based route protection with separate guards for student and admin access. Uses React context for authentication state management, redirecting unauthorized users appropriately.

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon (serverless PostgreSQL with WebSocket support)
- **Session Management**: Express-session with in-memory or PostgreSQL session store
- **Authentication**: bcrypt for password hashing, session-based authentication
- **Build Tool**: esbuild for server bundling, Vite for client bundling

**API Design:**
RESTful API endpoints organized by domain:
- `/api/auth/*` - Registration, login, logout, session management
- `/api/products/*` - CRUD operations for product listings
- `/api/messages/*` - Messaging between users
- `/api/payments/*` - Payment method management
- `/api/reports/*` - Content moderation and reporting
- `/api/admin/*` - Administrative operations

**Server Configuration:**
Development uses Vite middleware mode for HMR (Hot Module Replacement) with custom HTML template injection. Production serves static files from the `dist/public` directory. The server selectively bundles high-frequency dependencies to reduce cold start times while externalizing others.

**Storage Layer:**
Implements a storage interface pattern (`server/storage.ts`) that abstracts database operations. This provides a clean separation between business logic and data access, making the codebase easier to test and maintain.

### Data Storage

**Database Schema:**
Uses PostgreSQL with the following core tables:

1. **users** - Stores student and admin accounts with email, hashed passwords, university affiliation, role designation, and verification status
2. **products** - Product listings with title, description, price, category, condition, location, status (active/sold/removed), and image URLs
3. **conversations** - Chat sessions between buyers and sellers
4. **messages** - Individual messages within conversations
5. **reports** - User-submitted reports for content moderation
6. **paymentMethods** - Stored payment method information for users

All tables use UUID primary keys generated via PostgreSQL's `gen_random_uuid()`. Timestamps track creation and updates. Foreign keys maintain referential integrity between users, products, conversations, and messages.

**Schema Validation:**
Drizzle-Zod generates runtime validation schemas from the database schema, ensuring type safety from database to API to frontend. The `shared/schema.ts` file serves as the single source of truth for data models.

**Database Connection:**
Neon's serverless PostgreSQL is configured with WebSocket support for optimal connection pooling. The connection uses an environment variable (`DATABASE_URL`) and throws early if not configured, preventing runtime failures.

### Authentication & Authorization

**Session-Based Authentication:**
Uses Express-session with configurable storage (memory for development, PostgreSQL for production via connect-pg-simple). Sessions persist for 7 days with HTTP-only cookies. In production, cookies are marked secure to enforce HTTPS transmission.

**Password Security:**
Passwords are hashed using bcrypt with 10 salt rounds before storage. Plain text passwords are never stored or logged.

**Role-Based Access Control:**
Two roles are supported: "student" (default) and "admin". Session data includes `userId` and `userRole` for authorization checks. Protected routes verify role requirements before granting access.

**Account Verification:**
Users have an `isVerified` boolean flag for email verification workflows, though the email sending mechanism is not yet implemented in the current codebase.

### External Dependencies

**UI Component Libraries:**
- **Radix UI**: Provides accessible, unstyled primitives for complex components (dialogs, dropdowns, popovers, tooltips, etc.)
- **Lucide React**: Icon library for consistent iconography
- **cmdk**: Command palette interface component

**Development Tools:**
- **Replit Plugins**: Custom Vite plugins for development banner, runtime error overlay, cartographer (code navigation), and meta image injection
- **TypeScript**: Strict mode enabled with path aliases for clean imports

**Build & Deployment:**
- **Vite**: Frontend build tool with custom configuration for HMR and production builds
- **esbuild**: Server-side bundling with selective dependency bundling for faster cold starts
- **Tailwind CSS**: Utility-first CSS with PostCSS processing and autoprefixer

**Data Validation:**
- **Zod**: Runtime schema validation for API inputs and form data
- **React Hook Form**: Client-side form state and validation with Zod resolver integration

**Database Tooling:**
- **Drizzle Kit**: Database migration generation and schema push commands
- **@neondatabase/serverless**: PostgreSQL client optimized for serverless and edge environments

**Asset Management:**
The application stores product images in the `attached_assets` directory, served statically via Express. The Vite configuration includes custom alias resolution for asset imports.

**Date Handling:**
Uses date-fns for consistent date formatting and manipulation across the application.

**Type Safety:**
The entire stack uses TypeScript with shared types between client and server via the `shared/` directory. Path aliases (`@/`, `@shared/`, `@assets/`) enable clean imports without relative path complexity.