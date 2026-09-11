# Seat Booking — Multi-Tenant SaaS Restaurant Reservation Platform

Seat Booking is a modern, scalable, multi-tenant SaaS platform built for restaurants to manage table reservations, interactive 2D floor plans, guest CRM, staff operations, and business analytics in real time.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Models & Schema](#data-models--schema)
- [API Reference Catalog](#api-reference-catalog)
- [Frontend Routes & Permissions](#frontend-routes--permissions)
- [Environment Variables](#environment-variables)
- [Local Setup & Getting Started](#local-setup--getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Scripts Reference](#scripts-reference)

---

## Overview & Architecture

Seat Booking provides an end-to-end solution for restaurant operations:
- **Multi-Tenant Foundation**: Complete isolation across restaurants (`restaurantId`). Each restaurant configures its own opening hours, timezones, floors, tables, staff roles, and branding.
- **Guest Experience**: Responsive public reservation booking widget and email confirmation flow with one-click confirmation and cancellation.
- **Real-Time Synchronisation**: Server-Sent Events (SSE) push live table statuses and reservation updates to all connected staff terminals without polling.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for Owners, Managers, Hosts, and Servers.

---

## Key Features

### 1. Restaurant Management & Settings
- Customizable restaurant profile: logo, contact details, address, and operating hours (opening & closing times stored in minutes-from-midnight).
- Timezone awareness (e.g., `Europe/Copenhagen`) ensuring accurate scheduling across regions.

### 2. Interactive 2D Floor Plan Designer
- Built with **@xyflow/react** (ReactFlow).
- Drag-and-drop table placement, rotation, dimensions, and customizable shapes (`RECTANGLE`, `SQUARE`, `CIRCLE`).
- Multi-floor and section grouping (e.g., Main Floor, Terrace, Bar).
- Real-time visual table statuses: `AVAILABLE`, `RESERVED`, `OCCUPIED`, `MAINTENANCE`.

### 3. Reservation Engine & Lifecycle
- **Guest-Facing Public Booking**: Direct booking page (`/restaurant/:id/book`) with real-time slot and party size availability validation.
- **Confirmation Flow**: Tokenized email/SMS confirmation links with self-service cancellation (`/reservation/confirm?token=...`).
- **Staff Reservation Management**: Timeline, calendar grid (powered by FullCalendar), and list views.
- **Status Lifecycle**: `PENDING` &rarr; `CONFIRMED` &rarr; `SEATED` &rarr; `COMPLETED` (or `CANCELLED` / `NO_SHOW`).
- Conflict detection preventing double-bookings and party over-capacity.

### 4. Customer CRM
- Automatically tracks guest history, lifetime covers, and reservation frequency.
- Dietary requirements, VIP tagging, seating preferences, and custom staff notes.

### 5. Analytics & Business Intelligence
- Real-time KPI summaries (Total Reservations, Total Covers, Average Party Size, No-Show Rate) with period-over-period percentage trends.
- Visual charts using **Recharts**:
  - Daily reservations & covers trendline.
  - Reservation status breakdown (pie/bar).
  - Hourly demand and peak-hour heatmaps.
  - Per-table utilization analytics.
  - Weekday traffic distribution.

### 6. Notifications & Communication
- Multi-channel notification engine:
  - **Transactional Emails** via [Resend](https://resend.com) (welcome emails, booking confirmations, password resets).
  - **SMS Notifications** via [Twilio](https://twilio.com).
  - In-app notification center with read/unread tracking.

### 7. AI Chat Assistant & Operational Tools
- In-app AI assistant widget to answer operational queries.
- Screen saver mode for idle front-of-house tablets and terminals.
- PWA install support for iOS and Android tablets.

---

## Tech Stack

### Frontend
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 + `tw-animate-css`
- **UI Components**: shadcn/ui + Radix UI primitives
- **Icons**: Lucide React
- **Floor Plan Designer**: `@xyflow/react`
- **Calendar & Scheduling**: `@fullcalendar/react` (DayGrid, TimeGrid, Interaction, List)
- **Charts & Data Viz**: `recharts`
- **Routing**: `react-router-dom` v7
- **Internationalization**: `i18next` + `react-i18next`
- **Notifications**: `sonner` toast system

### Backend
- **Runtime & Framework**: Node.js + Express 5 + TypeScript (run with `tsx`)
- **Database ORM**: Prisma ORM v6
- **Database Engine**: PostgreSQL (tested with [Neon Serverless Postgres](https://neon.tech))
- **Authentication**: JWT (`jsonwebtoken`) + HTTP-only cookies + bcryptjs password hashing
- **Validation**: Zod schema validation
- **Security & Reliability**: Helmet, CORS origin whitelist, Express Rate Limit, Morgan logging
- **External Providers**: Resend (Email), Twilio (SMS)

---

## Project Structure

```
├── backend/
│   ├── prisma/
│   │   └── schema.prisma              # Database schema & relations
│   ├── src/
│   │   ├── config/                    # Environment & runtime config (env.ts)
│   │   ├── db/                        # Prisma client instance
│   │   ├── middlewares/               # Rate limiters, validation middlewares
│   │   ├── modules/
│   │   │   ├── analytics/             # Analytics aggregations & KPIs
│   │   │   ├── auth/                  # Auth, JWT, registration, password reset
│   │   │   ├── chat/                  # AI chat assistant
│   │   │   ├── customer/              # Customer CRM module
│   │   │   ├── notification/          # Notification system
│   │   │   ├── realtime/              # Server-Sent Events (SSE) stream
│   │   │   ├── reservation/           # Booking logic, status machine, validation
│   │   │   ├── restaurant/            # Restaurant profile & management
│   │   │   └── table/                 # Table layout, floors, floor-plan sync
│   │   ├── routes/
│   │   │   └── health.routes.ts       # Health check route
│   │   ├── utils/                     # Mailer (Resend), SMS (Twilio), slugify
│   │   ├── app.ts                     # Express application definition
│   │   └── server.ts                  # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/                # Shared layout, headers, modals, chat, PWA
│   │   │   ├── layout/                # Dashboard layout, sidebar, header
│   │   │   └── ui/                    # shadcn/ui components (buttons, dialogs, etc.)
│   │   ├── features/                  # Domain feature logic & API clients
│   │   │   ├── analytics/             # Analytics hooks & charts
│   │   │   ├── auth/                  # Auth state, login/signup API, guards
│   │   │   ├── customers/             # Customer CRM API & state
│   │   │   ├── floor-plan/            # 2D designer, table nodes, floor storage
│   │   │   ├── realtime/              # SSE listener & real-time context
│   │   │   ├── reservations/          # Reservation lists, modals, calendar
│   │   │   └── restaurant/            # Restaurant context & profile API
│   │   ├── lib/                       # API client (fetch wrapper), utils
│   │   ├── pages/                     # Routed page views
│   │   ├── App.tsx                    # Route definitions & top-level providers
│   │   └── main.tsx                   # Frontend entry point
│   ├── package.json
│   └── vite.config.ts
│
└── docs/                              # Architecture and design notes
```

---

## Data Models & Schema

Defined in [`backend/prisma/schema.prisma`](file:///Users/anurag/Desktop/projects/reservation%20system/backend/prisma/schema.prisma):

| Model | Description |
| :--- | :--- |
| `Restaurant` | Tenant entity. Holds name, slug, phone, email, address, logo, timezone, operating hours (`openingTime`, `closingTime`), and `isActive` flag. |
| `Role` | Tenant-scoped roles with custom permissions array (e.g. `Owner`, `Manager`, `Staff`). |
| `User` | Staff/owner accounts with password hash, role relation, and optional `restaurantId`. |
| `PasswordResetToken`| Secure hashed tokens for one-hour password reset links. |
| `Table` | Dining tables with capacity, floor, section, shape (`RECTANGLE`, `SQUARE`, `CIRCLE`), position (`x`, `y`, `rotation`, `width`, `height`), and current `TableStatus`. |
| `Customer` | CRM records associated with a restaurant, storing contact details, notes, and tags. |
| `Reservation` | Booking records linked to a restaurant, customer, and table, with party size, datetime, `ReservationStatus`, and confirmation token. |
| `Notification` | System and operational alerts (e.g. new reservation, cancellation). |

---

## API Reference Catalog

Base path: `/api`

### 1. System & Health
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Returns database connection status and server health. |

### 2. Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user & create a restaurant or join via staff invite. |
| `POST` | `/api/auth/login` | Public | Authenticate with email and password; returns JWT token & user. |
| `GET` | `/api/auth/me` | Bearer Token | Fetch currently authenticated user and restaurant profile. |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset email. |
| `POST` | `/api/auth/reset-password` | Public | Set new password using token. |

### 3. Restaurants (`/api/restaurants`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/restaurants` | Public | List all restaurants in the system. |
| `GET` | `/api/restaurants/:id` | Public | Fetch restaurant details by ID. |
| `GET` | `/api/restaurants/profile` | Bearer Token | Fetch profile of the logged-in user's restaurant. |
| `POST` | `/api/restaurants` | Bearer Token | Create a new restaurant record. |
| `PATCH` | `/api/restaurants/:id` | Bearer Token | Update restaurant information, hours, or status. |
| `DELETE` | `/api/restaurants/:id` | Bearer Token | Delete restaurant and cascade associated records. |

### 4. Tables & Floor Plan (`/api/tables`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tables` | Public/Bearer | List tables (supports `?restaurantId=...`, `?date=...`). |
| `GET` | `/api/tables/floors` | Public/Bearer | Get distinct list of floors for a restaurant. |
| `GET` | `/api/tables/:id` | Public | Get single table by ID. |
| `POST` | `/api/tables` | Bearer Token | Create an individual table. |
| `PATCH` | `/api/tables/:id` | Bearer Token | Update a table's details or status. |
| `PATCH` | `/api/tables/layout` | Bearer Token | Batch update table coordinates/rotations. |
| `PUT` | `/api/tables/floor-plan` | Bearer Token | Bulk sync/upsert entire floor plan designer canvas. |
| `DELETE` | `/api/tables/:id` | Bearer Token | Delete table. |

### 5. Reservations (`/api/reservations`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reservations/availability` | Public (Rate Limited) | Check slot availability for party size & datetime. |
| `POST` | `/api/reservations/public-book` | Public (Rate Limited) | Create a public guest reservation. |
| `GET` | `/api/reservations/confirmation` | Public (Rate Limited) | Fetch booking details by confirmation token. |
| `POST` | `/api/reservations/confirm` | Public (Rate Limited) | Confirm reservation via token. |
| `POST` | `/api/reservations/cancel-by-token`| Public (Rate Limited) | Cancel reservation via token. |
| `GET` | `/api/reservations` | Bearer Token | List all reservations for the tenant restaurant. |
| `GET` | `/api/reservations/:id` | Bearer Token | Get single reservation details. |
| `POST` | `/api/reservations` | Bearer Token | Staff create new reservation. |
| `PATCH` | `/api/reservations/:id` | Bearer Token | Update reservation details. |
| `PATCH` | `/api/reservations/:id/status` | Bearer Token | Transition reservation status (`CONFIRMED`, `SEATED`, etc.). |
| `POST` | `/api/reservations/:id/cancel` | Bearer Token | Staff cancellation. |
| `POST` | `/api/reservations/:id/resend-confirmation` | Bearer Token | Resend confirmation email to guest. |
| `DELETE` | `/api/reservations/:id` | Bearer Token | Remove reservation. |

### 6. Customers CRM (`/api/customers`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customers` | Bearer Token | List customers for the tenant restaurant. |
| `GET` | `/api/customers/:id` | Bearer Token | Get customer profile details. |
| `GET` | `/api/customers/:id/reservations` | Bearer Token | Get historical reservations for a customer. |
| `POST` | `/api/customers` | Bearer Token | Create customer record. |
| `PATCH` | `/api/customers/:id` | Bearer Token | Update customer notes, tags, or contact info. |
| `DELETE` | `/api/customers/:id` | Bearer Token | Delete customer record. |

### 7. Analytics (`/api/analytics`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/summary` | Bearer Token | Key metrics (covers, party size, no-show rate, trends). |
| `GET` | `/api/analytics/daily-reservations` | Bearer Token | Time-series daily counts & covers over `?days=30`. |
| `GET` | `/api/analytics/status-breakdown` | Bearer Token | Reservation counts grouped by current status. |
| `GET` | `/api/analytics/hourly-demand` | Bearer Token | Hourly distribution for peak times analysis. |
| `GET` | `/api/analytics/table-utilization` | Bearer Token | Per-table percentage utilization. |
| `GET` | `/api/analytics/weekday-traffic` | Bearer Token | Reservation volume by day of week. |

### 8. Realtime & Notifications
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/realtime/stream` | Bearer Token | Server-Sent Events (SSE) stream for live updates. |
| `GET` | `/api/notifications` | Bearer Token | List restaurant notifications. |
| `PATCH` | `/api/notifications/:id/read` | Bearer Token | Mark notification as read. |

---

## Frontend Routes & Permissions

| Route | View | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | Public | Marketing homepage with product highlights & CTA. |
| `/login` | `LoginPage` | Public (Unauthenticated) | Staff and owner login. |
| `/signup` | `SignupPage` | Public (Unauthenticated) | Restaurant registration & owner account creation. |
| `/forgot-password` | `ForgotPasswordPage` | Public | Self-service password reset request. |
| `/reset-password` | `ResetPasswordPage` | Public | Set new password with email token. |
| `/restaurant/:id/book` | `PublicBookingPage` | Public | Guest-facing booking widget. |
| `/reservation/confirm` | `ReservationConfirmPage` | Public | Guest confirmation & cancellation page. |
| `/dashboard` | `DashboardPage` | Authenticated (All Roles) | Today's covers, active tables, upcoming bookings. |
| `/reservations` | `ReservationsPage` | Authenticated (All Roles) | Calendar, timeline, and table reservation management. |
| `/customers` | `CustomersPage` | Authenticated (All Roles) | Customer CRM with booking history and notes. |
| `/profile` | `ProfilePage` | Authenticated (All Roles) | User personal profile and password management. |
| `/notifications` | `NotificationsPage` | Authenticated (All Roles) | Operational alerts and activity logs. |
| `/floor-plan` | `FloorPlanPage` | Manager / Owner | Interactive drag-and-drop table & floor plan editor. |
| `/analytics` | `AnalyticsPage` | Manager / Owner | Performance metrics, charts, and demand heatmaps. |
| `/settings` | `SettingsPage` | Manager / Owner | Restaurant operating hours, contact info, and branding. |

---

## Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode (`development` or `production`). | `development` |
| `PORT` | HTTP server port. | `4000` |
| `DATABASE_URL` | PostgreSQL connection string (Neon or standard Postgres). | `postgresql://...` |
| `JWT_SECRET` | Secret key for signing and verifying JSON Web Tokens. | `your_jwt_secret_key` |
| `JWT_EXPIRES_IN` | Duration of token validity. | `7d` |
| `APP_URL` | Frontend URL for links in emails and SMS. | `http://localhost:5173` |
| `CORS_ORIGIN` | Comma-delimited allowed origins. | `http://localhost:5173` |
| `RESEND_API_KEY` | Resend API key for transactional emails. | `re_...` |
| `EMAIL_FROM` | Verified email sender. | `Seat Booking <booking@yourdomain.com>` |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier for SMS dispatch. | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio auth token. | `...` |
| `TWILIO_PHONE_NUMBER` | Twilio sender phone number. | `+1...` |
| `SMS_DEFAULT_COUNTRY_CODE` | Default international country prefix if omitted. | `+45` |

### Frontend Configuration (`frontend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL pointing to the Express backend. | `http://localhost:4000/api` |
| `VITE_APP_URL` | Base URL of the client frontend application. | `http://localhost:5173` |
| `VITE_APP_NAME` | Brand title displayed across the app. | `Seat Booking` |
| `VITE_WHATSAPP_NUMBER` | Support WhatsApp number (E.164 without `+`). | `15557328266` |
| `VITE_WHATSAPP_DISPLAY_PHONE`| Formatted support phone number for UI display. | `+1 (555) 732-8266` |

---

## Local Setup & Getting Started

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **Package Manager**: `npm`
- **PostgreSQL**: A PostgreSQL instance (e.g., free serverless instance on [Neon](https://neon.tech))

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create your `.env` configuration:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and set your `DATABASE_URL` and `JWT_SECRET`.*

3. Install dependencies:
   ```bash
   npm install
   ```

4. Generate Prisma client & apply database schema:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will run on `http://localhost:4000`.*
   *Verify health via: `curl http://localhost:4000/api/health`.*

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Create your `.env` configuration:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`.*

---

## Scripts Reference

### Backend (`/backend`)
- `npm run dev`: Starts the server with live reloading via `tsx watch`.
- `npm run build`: Generates Prisma client, compiles TypeScript, and resolves path aliases (`tsc-alias`).
- `npm start`: Starts the compiled production server (`node dist/server.js`).
- `npm run prisma:generate`: Generates the Prisma Client types.
- `npm run prisma:migrate`: Runs migrations against the configured database.
- `npm run prisma:studio`: Opens visual GUI database browser at `http://localhost:5555`.

### Frontend (`/frontend`)
- `npm run dev`: Starts Vite local development server.
- `npm run build`: Type-checks and bundles the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs ESLint across frontend source files.

