// Usage (put these in backend/.env first, or set them in your shell):
//   ADMIN_EMAIL=you@example.com
//   ADMIN_PASSWORD="a-long-password"   <- keep the quotes
//   ADMIN_NAME=Admin                   (optional)
// then run:  npm run seed:admin
//
// Creates the admin, or promotes the account that already uses that email.
// Prints which database it touched and re-reads the account at the end to prove it worked.
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/user.model";

dotenv.config();

(async () => {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      "Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in .env first.",
    );
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  // dotenv treats an unquoted # as the start of a comment, which silently cuts the password short.
  console.log(
    `ADMIN_PASSWORD was read as ${ADMIN_PASSWORD.length} characters. ` +
      `If you typed more than that, wrap it in quotes in .env: ADMIN_PASSWORD="..."`,
  );

  const conn = await mongoose.connect(MONGO_URI);
  // The server must connect to THIS SAME database, otherwise login will never see the admin.
  console.log(
    `Connected to database "${conn.connection.name}" on ${conn.connection.host}`,
  );

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const matches = await User.find({ email }).select("+password");

  if (matches.length > 1) {
    console.error(
      `Found ${matches.length} accounts with ${email}. Delete the duplicates, then run again.`,
    );
    process.exit(1);
  }

  const existing = matches[0];
  if (existing) {
    console.log(
      `Found an existing account for ${email} with role "${existing.role}".`,
    );
    existing.role = "admin";
    existing.password = ADMIN_PASSWORD; // hashed by the pre-save hook
    existing.isSuspended = false;
    existing.suspendedReason = undefined;
    existing.suspendedAt = undefined;
    await existing.save();
    console.log("Promoted it to admin and set the password to ADMIN_PASSWORD.");
  } else {
    await User.create({
      name: ADMIN_NAME || "Admin",
      email,
      password: ADMIN_PASSWORD,
      role: "admin",
    });
    console.log(
      "No account with that email existed, so a new admin was created.",
    );
  }

  // Read it back exactly the way /login does
  const check = await User.findOne({ email }).select("+password");
  const passwordOk = check
    ? await check.comparePassword(ADMIN_PASSWORD)
    : false;
  console.log(
    `Check: ${email} -> role="${check?.role}", ADMIN_PASSWORD works: ${passwordOk}`,
  );

  await mongoose.disconnect();
  if (check?.role !== "admin" || !passwordOk) process.exit(1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
