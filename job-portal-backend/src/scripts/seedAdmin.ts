// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long-password' npm run seed:admin
// Admins cannot self-register through the API; this is the only way to create one.
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/user.model";

dotenv.config();

(async () => {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD first.");
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = "admin";
    await existing.save();
    console.log(`Existing user ${email} promoted to admin.`);
  } else {
    await User.create({ name: ADMIN_NAME || "Admin", email, password: ADMIN_PASSWORD, role: "admin" });
    console.log(`Admin ${email} created.`);
  }
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});