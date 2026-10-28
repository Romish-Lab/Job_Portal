# Job Portal

A full-stack job portal built with React, TypeScript, Express, and MongoDB. Candidates can find and apply for jobs, employers can manage listings and applicants, and administrators can review activity and moderate the platform.

## Features

- Candidate and employer accounts with role-based access and secure cookie authentication
- Job search, filtering, details, company profiles, and paginated listings
- Employer job posting and management, applicant review, and dashboards
- Candidate applications with resume and photo uploads, plus application status tracking
- Saved jobs, job alerts, and interview scheduling for candidates and employers
- Paid job advertisements through Stripe, with admin approval and advertisement expiry handling
- Admin dashboards for users, jobs, messages, advertisement pricing, and audit logs
- Password reset, email notifications, contact form, and informational/blog pages
- Responsive frontend styling with shared design tokens and feature-specific stylesheets

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router, Axios |
| Styling | Plain CSS, shared CSS variables, responsive stylesheets |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB with Mongoose |
| Authentication | JWT in httpOnly cookies, bcryptjs, role-based middleware |
| Integrations | Stripe, Nodemailer |

## Project layout

```text
job-portal/
├── job-portal-frontend/
│   └── src/
│       ├── api/             # Axios client and API origin
│       ├── components/      # Shared and domain-specific UI
│       ├── context/         # Authentication and saved-jobs state
│       ├── hooks/           # Reusable feature state and actions
│       ├── pages/           # Route-level screens
│       ├── services/        # Feature-specific API operations
│       ├── styles/          # Shared and feature-specific CSS
│       ├── types/           # Frontend TypeScript models
│       └── utils/           # Formatting and other helpers
├── job-portal-backend/
│   └── src/
│       ├── config/          # Database connection
│       ├── controllers/     # Request handlers and business logic
│       ├── middleware/      # Authentication, authorization, uploads
│       ├── models/          # Mongoose schemas
│       ├── routes/          # API route definitions
│       ├── scripts/         # Admin seed and migration scripts
│       ├── types/           # Express type extensions
│       └── utils/           # Email, payments, alerts, and shared helpers
├── render.yaml              # Render deployment blueprint
└── package.json             # Monorepo scripts
```

## CSS implementation

The frontend uses regular CSS files organized by shared layout and feature. Vite bundles these styles with the React app.

- `src/styles/variables.css` defines the color and typography tokens used across the interface, including `--bg`, `--surface`, `--ink`, `--border`, and `--accent`, as well as success, danger, and pending state colors.
- `src/styles/styles-index.css` imports the shared foundation: layout, utilities, buttons, forms, navigation, hero, footer, job listings, dashboards, authentication, content pages, admin screens, and advertisements.
- Feature stylesheets such as `JobAlerts.css`, `SavedJobs.css`, `Interviews.css`, and `EmployerInterviews.css` keep feature-specific presentation close to the pages that use them. `Bookmark.css` styles bookmark controls.
- Shared tokens keep colors and typography consistent. Stylesheets include responsive rules for narrower screens, along with interaction states such as hover, focus, loading, empty, and status states.

To add a page style, create a stylesheet under `job-portal-frontend/src/styles/` and import it from the page or component that owns those styles. Use the existing CSS variables for shared colors and add responsive rules where the layout needs them.

## Modular design

The frontend separates screens, reusable interface elements, data access, and feature behavior:

- **Pages** compose route-level experiences such as job search, applications, interviews, and admin screens.
- **Components** provide reusable pieces such as job cards, navigation, status badges, modals, and empty states.
- **Services** keep API calls grouped by feature, including saved jobs, alerts, and interviews.
- **Hooks and context** hold reusable feature state and shared authentication or saved-job state.
- **Types and utilities** centralize TypeScript data shapes and formatting helpers.

The backend follows a request flow of **route -> middleware -> controller -> model -> MongoDB**. Routes define API endpoints, middleware handles authentication, role checks, uploads, and request controls, controllers implement application behavior, and Mongoose models define persisted data. Shared utilities handle concerns such as email, Stripe, alert matching, and scheduled advertisement expiry.

## Run locally

### Requirements

- Node.js and npm
- A MongoDB connection string

### Install dependencies

From the repository root:

```bash
npm run install:all
```

### Configure the backend

Copy `job-portal-backend/.env.example` to `job-portal-backend/.env` and set at least:

```dotenv
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=replace-with-a-long-random-secret
```

The example file lists the other supported settings. `PORT` defaults to `5000`; `CLIENT_URL` defaults to `http://localhost:5173`. Configure SMTP settings for email delivery and Stripe keys plus a webhook secret for paid advertisements. Cloudinary settings are available for deployments that use Cloudinary.

The frontend API client defaults to `http://localhost:5000`. To use a different backend origin locally, set `VITE_API_URL` in `job-portal-frontend/.env`.

### Start the development servers

Run each command in a separate terminal from the repository root:

```bash
npm run dev:backend
npm run dev:frontend
```

The frontend runs on `http://localhost:5173`; the backend runs on `http://localhost:5000`. The backend health endpoint is `http://localhost:5000/api/health`.

### Build and start

```bash
npm run build:backend
npm run build:frontend
npm start
```

For a one-command install and build, `npm run build` installs both app dependencies and builds the backend and frontend. In production, set `NODE_ENV=production`; the backend serves the built frontend from `job-portal-frontend/dist`.

## API groups

The Express API is mounted under `/api`:

| Prefix | Purpose |
| --- | --- |
| `/auth` | Registration, login, logout, current user, password reset |
| `/jobs` | Search, job details, employer job management, dashboards |
| `/applications` | Job applications, applicant review, status updates, protected file access |
| `/companies` | Company profiles |
| `/saved-jobs` | Save, remove, and check saved jobs |
| `/job-alerts` | Create and manage candidate alerts |
| `/interviews` | Schedule and manage interviews |
| `/payments` | Advertisement pricing and Stripe checkout |
| `/admin` and `/users` | Moderation, reports, user management, messages, audit logs |
| `/contact` | Public contact form |

## Further documentation

- [Modular architecture review](MODULAR_ARCHITECTURE.md)
- [CSS implementation review](CSS_IMPLEMENTATION_SUMMARY.md)

## Deployment

The repository includes a `render.yaml` blueprint for deploying the combined application on Render. Set the database, public client URL, email, Stripe, and other integration values in the deployment environment. In production, the Express server serves the Vite build and handles API requests from the same origin.
