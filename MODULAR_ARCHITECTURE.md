# Modular Architecture Review

This document describes the current source layout and the main boundaries in the Job Portal. The frontend uses feature services and hooks for saved jobs, job alerts, and interviews, alongside shared components and state. The backend separates routes, middleware, controllers, models, and utilities.

## Source layout

### Frontend

```text
job-portal-frontend/src/
├── api/              # Shared API origin and Axios client
├── components/       # Shared UI, job, interview, and page components
│   ├── ui/
│   ├── jobs/
│   └── interviews/
├── context/          # Authentication and saved-job bookmark state
├── hooks/            # Feature state for bookmarks, saved jobs, alerts, interviews
├── pages/            # React Router screens
├── services/         # Saved-job, alert, and interview API operations
├── styles/           # Shared and feature-specific plain CSS
├── types/            # Frontend domain types
└── utils/            # API helper and formatting functions
```

The `components/` directory also contains shared elements such as navigation, pagination, job cards, applicant photos, and interview scheduling UI.

### Backend

```text
job-portal-backend/src/
├── config/           # MongoDB connection
├── controllers/      # Auth, jobs, applications, users, admin, payments, and more
├── middleware/       # Authentication, role checks, and upload handling
├── models/           # Mongoose data models
├── routes/           # API endpoints grouped by domain
├── scripts/          # Admin seeding and job migration
├── types/            # Express request type extensions
├── utils/            # JWT, email, Stripe, alerts, audit, and ad helpers
└── server.ts         # Middleware, route mounting, schedulers, and startup
```

## Request and feature flow

For frontend features that use the service layer, the flow is:

```text
Page or component -> hook or context -> service -> API client -> Express route
                                                              -> middleware
                                                              -> controller
                                                              -> Mongoose model
                                                              -> MongoDB
```

The service and hook pattern is currently used for saved jobs, job alerts, and interviews. Other pages may call the shared API client directly. On the backend, routes define endpoints, middleware enforces authentication and role access or handles uploads, controllers implement request behavior, and models describe persisted data.

## Main module responsibilities

### Frontend

- **Pages** compose route-level screens for candidates, employers, and administrators.
- **Components** provide reusable interface elements and domain displays.
- **Services** group API operations for saved jobs, alerts, and interviews.
- **Hooks** manage feature-level fetching, updates, loading, and error state.
- **Context** provides authentication and bookmark state across the app.
- **Types and utilities** hold shared data shapes and helpers such as date and salary formatting.

### Backend

- **Routes** map API paths to handlers and attach relevant middleware.
- **Middleware** protects routes, checks user roles, and validates/stores upload files.
- **Controllers** coordinate request validation, database operations, and responses.
- **Models** define MongoDB collections and relationships.
- **Utilities** contain reusable functions for email, payment, job-alert matching, audit logging, and scheduled advertisement expiry.

## Review notes

- There are two Axios entrypoints: `src/api/client.ts` configures the API base URL and credentials, while `src/utils/api.ts` creates another client. Feature services use the latter and include `/api` in their request paths; several other modules use the former. Consolidating these clients would reduce configuration drift.
- Saved-job state has two layers for different use cases: `SavedJobsContext` supplies bookmark state to shared controls, while `useSavedJobs` loads and manages the saved-jobs page list. Keep their responsibilities clear when extending the feature.
- TypeScript types are present across the app, but some feature hooks and service methods still use `any`. The earlier claim of complete type coverage was too broad.
- The route/controller/model structure is clear, while some controllers and pages still own substantial feature logic. Treat the layout as a modular monolith rather than claiming every feature follows an identical service pattern.

## Adding a feature


1. Add the backend model if the feature needs new persisted data.
2. Add a controller for its request behavior and a route for its API endpoints.
3. Attach authentication, role checks, and upload middleware where needed.
4. On the frontend, add types and a service for the API operations.
5. Add a hook or context only when state or behavior needs to be shared or reused.
6. Compose the route-level UI from existing components and add feature styles under `src/styles/`.
