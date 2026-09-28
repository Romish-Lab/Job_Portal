import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [".pdf", ".doc", ".docx"];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF/DOC/DOCX resumes are allowed"));
  }
};

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [".png", ".jpg", ".jpeg", ".webp"];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG/JPG/WEBP images are allowed"));
  }
};

export const uploadLogo = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 2 * 1024 * 1024 } });
export const uploadResume = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
