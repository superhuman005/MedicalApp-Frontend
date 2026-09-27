const crypto = require("crypto");
const User = require("../models/User");

// Accounts that must always exist as admins. Extra addresses can be supplied
// (comma-separated) through the INITIAL_ADMIN_EMAILS environment variable.
const DEFAULT_ADMIN_EMAILS = ["sam.ola13@gmail.com"];

const nameFromEmail = (email) => {
  const local = email.split("@")[0].replace(/[0-9]+/g, "");
  const [first, ...rest] = local.split(/[._-]+/).filter(Boolean);
  const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : "");
  return { firstName: cap(first) || "Admin", lastName: cap(rest.join(" ")) || "User" };
};

/**
 * Makes sure every bootstrap admin account exists with the "admin" role.
 * Safe to run on every server start:
 *  - missing account  -> created (password from INITIAL_ADMIN_PASSWORD, or a
 *                        random one printed once to the server log)
 *  - existing account -> promoted to admin if it isn't one already
 *  - existing admin   -> left completely untouched (password is never reset)
 */
const bootstrapAdmins = async () => {
  const emails = [
    ...DEFAULT_ADMIN_EMAILS,
    ...(process.env.INITIAL_ADMIN_EMAILS || "").split(","),
  ]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  for (const email of [...new Set(emails)]) {
    const existing = await User.findOne({ email });

    if (!existing) {
      const password = process.env.INITIAL_ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
      const { firstName, lastName } = nameFromEmail(email);
      await User.create({ firstName, lastName, email, password, role: "admin", doctorApprovalStatus: "approved" });

      console.log(`[bootstrap] Created admin account for ${email}`);
      if (!process.env.INITIAL_ADMIN_PASSWORD) {
        console.log(`[bootstrap] Temporary password (shown once, change it after first login): ${password}`);
      }
    } else if (!["admin", "superadmin"].includes(existing.role)) {
      const previous = existing.role;
      existing.role = "admin";
      existing.isActive = true;
      await existing.save({ validateBeforeSave: false });
      console.log(`[bootstrap] Promoted existing ${previous} account ${email} to admin`);
    }
  }
};

module.exports = bootstrapAdmins;
