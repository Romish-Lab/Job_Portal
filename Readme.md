# Job Portal — Backend (TypeScript + Express + MongoDB)

Built using the same architecture pattern as your e-commerce repo:

```
CLIENT / POSTMAN
       ↓
     ROUTES
       ↓
  CONTROLLERS
       ↓
    MODELS
       ↓
   MONGOOSE
       ↓
    MONGODB
```

With the same supporting layer:

```
┌── JWT Authentication (httpOnly cookie)
├── bcryptjs Password Hashing
├── Multer Resume Upload
├── Cloudinary (ready to wire in for resume/logo hosting)
└── Nodemailer (ready to wire in for notification emails)
```

## Folder structure

```
job-portal/
├── src/
│   ├── server.ts
│   ├── config/
│   │   └── db.ts
│   ├── models/
│   │   ├── user.model.ts          # candidate or employer
│   │   ├── job.model.ts
│   │   └── application.model.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── job.controller.ts
│   │   └── application.controller.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── job.routes.ts
│   │   └── application.routes.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts     # protect + authorize(role)
│   │   └── upload.middleware.ts   # multer for resumes
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── cloudinary.ts
│   │   └── sendEmail.ts
│   └── types/
│       └── express.d.ts          # adds req.user typing
├── uploads/
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

## Two roles, one flow

Every feature follows: **Route → Controller → Model → MongoDB**, exactly
like your e-commerce repo, just with two user roles instead of one:

```
CANDIDATE                                    EMPLOYER
    │                                            │
    ├── POST /api/auth/register (role=candidate) ├── POST /api/auth/register (role=employer)
    ├── GET  /api/jobs            (browse/search) ├── POST /api/jobs           (post a job)
    ├── POST /api/applications/:jobId/apply       ├── GET  /api/jobs/mine
    │        (uploads resume via multer)          ├── GET  /api/applications/job/:jobId
    └── GET  /api/applications/mine               └── PATCH /api/applications/:id/status
```

## Setup

```bash
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, etc.
npm run dev             # nodemon + ts-node, http://localhost:5000
```

Build for production:

```bash
npm run build
npm start
```

## API reference

### Auth (`/api/auth`)
| Method | Route | Access | Body |
|---|---|---|---|
| POST | `/register` | Public | `name, email, password, role (candidate\|employer), company?` |
| POST | `/login` | Public | `email, password` |
| POST | `/logout` | Public | – |
| GET | `/me` | Logged in | – |

### Jobs (`/api/jobs`)
| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/` | Public | Query: `search, location, type, page, limit` |
| GET | `/:id` | Public | Single job detail |
| GET | `/mine` | Employer | Jobs posted by the logged-in employer |
| POST | `/` | Employer | Create a job posting |
| PUT | `/:id` | Employer (owner) | Update a job |
| DELETE | `/:id` | Employer (owner) | Delete a job |

### Applications (`/api/applications`)
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/:jobId/apply` | Candidate | `multipart/form-data`: `resume` file + `coverLetter` |
| GET | `/mine` | Candidate | Candidate's own applications |
| GET | `/job/:jobId` | Employer (owner) | All applicants for one job |
| PATCH | `/:id/status` | Employer (owner) | Body: `status: pending\|reviewed\|accepted\|rejected` |

## Reusable template (for your next project)

Whatever domain you build next (Library, Gym, Student system), reuse the same skeleton:

```
Step 1  → create project
Step 2  → install packages
Step 3  → configure tsconfig.json
Step 4  → connect MongoDB (config/db.ts)
Step 5  → define model(s)
Step 6  → write controller(s)
Step 7  → wire up routes
Step 8  → add middleware (auth/upload)
Step 9  → assemble server.ts
Step 10 → test in Postman
```

## Suggested next steps for your certificate submission

1. Wire `resumeUrl`/logo uploads through `utils/cloudinary.ts` instead of local disk storage.
2. Add a React frontend (candidate job feed + employer dashboard) to complete the "MERN" stack.
3. Add email notifications via `utils/sendEmail.ts` when an application status changes.
4. Deploy: MongoDB Atlas + Render/Railway (backend) + Vercel (frontend).
