import multer from "multer";
import path from "path";
import fs from "fs";

// Logos are public (shown on job cards); resumes are private and only served
// through the authenticated GET /api/applications/:id/resume route.
export const UPLOADS_ROOT = path.join(__dirname, "..", "..", "uploads");
export const LOGO_DIR = path.join(UPLOADS_ROOT, "logos");
export const RESUME_DIR = path.join(UPLOADS_ROOT, "resumes");
// Applicant photos are personal data: private, served only via GET /api/applications/:id/photo
export const PHOTO_DIR = path.join(UPLOADS_ROOT, "photos");

[LOGO_DIR, RESUME_DIR, PHOTO_DIR].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

const makeStorage = (dir: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(
        null,
        `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`,
      );
    },
  });

const RESUME_TYPES: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

const IMAGE_TYPES: Record<string, string[]> = {
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".webp": ["image/webp"],
};

// Require BOTH a whitelisted extension and a matching MIME type
const makeFilter =
  (types: Record<string, string[]>, message: string) =>
  (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (types[ext]?.includes(file.mimetype)) cb(null, true);
    else cb(new Error(message));
  };

export const uploadLogo = multer({
  storage: makeStorage(LOGO_DIR),
  fileFilter: makeFilter(IMAGE_TYPES, "Only PNG/JPG/WEBP images are allowed"),
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const uploadResume = multer({
  storage: makeStorage(RESUME_DIR),
  fileFilter: makeFilter(RESUME_TYPES, "Only PDF/DOC/DOCX resumes are allowed"),
  limits: { fileSize: 5 * 1024 * 1024 },
});


// Job application: resume + applicant photo in a single multipart request
export const uploadApplicationFiles = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) =>
      cb(null, file.fieldname === "photo" ? PHOTO_DIR : RESUME_DIR),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(
        null,
        `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`,
      );
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "photo") {
      return makeFilter(IMAGE_TYPES, "Only PNG/JPG/WEBP images are allowed")(
        req,
        file,
        cb,
      );
    }
    if (file.fieldname === "resume") {
      return makeFilter(
        RESUME_TYPES,
        "Only PDF/DOC/DOCX resumes are allowed",
      )(req, file, cb);
    }
    cb(new Error("Only resume and photo files are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
}).fields([
  { name: "resume", maxCount: 1 },
  { name: "photo", maxCount: 1 },
]);
