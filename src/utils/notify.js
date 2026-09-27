const Notification = require("../models/Notification");
const emailService = require("../services/emailService");

/**
 * Fires a notification through every channel the app supports:
 *  1. An in-app Notification row (surfaced by GET /api/notifications and the
 *     bell in the header of every dashboard).
 *  2. A live Socket.io event ("notification:new") to the recipient's personal
 *     room, so the bell/toast updates immediately without a page refresh.
 *  3. A transactional email, when an `email` template is supplied.
 *
 * Every channel is best-effort and independent: a bad SMTP config or a
 * disconnected socket never breaks the caller's request, and a failure in
 * one channel doesn't stop the others from running.
 *
 * @param {object} opts
 * @param {import("socket.io").Server|null|undefined} opts.io - pass req.app.get("io"); omit/null to skip the socket emit (e.g. background jobs)
 * @param {object|string} opts.user - a User document (needs ._id, and .email if `email` is set) or a raw user id
 * @param {string} opts.title
 * @param {string} [opts.message]
 * @param {string} [opts.type] - one of the Notification model's enum values; defaults to "system"
 * @param {import("mongoose").Types.ObjectId|string} [opts.relatedId]
 * @param {object} [opts.email] - { template: keyof emailService, data: object, to?: string } - `to` defaults to opts.user.email
 */
const notify = async ({ io, user, title, message, type = "system", relatedId, email }) => {
  const userId = typeof user === "object" && user !== null ? user._id : user;
  let doc;

  try {
    doc = await Notification.create({ user: userId, title, message, type, relatedId });
  } catch (err) {
    console.error("[notify] Failed to save in-app notification:", err.message);
  }

  if (io && doc) {
    try {
      io.to(`user:${userId}`).emit("notification:new", doc);
    } catch (err) {
      console.error("[notify] Failed to emit socket notification:", err.message);
    }
  }

  if (email?.template) {
    const to = email.to || (typeof user === "object" ? user.email : undefined);
    const fn = emailService[email.template];
    if (!to) {
      console.error(`[notify] Skipped email (${email.template}): no recipient address`);
    } else if (typeof fn !== "function") {
      console.error(`[notify] Skipped email: unknown template "${email.template}"`);
    } else {
      try {
        const result = await fn.call(emailService, to, email.data || {});
        if (!result?.success) {
          console.error(`[notify] Email (${email.template}) to ${to} failed:`, result?.error);
        }
      } catch (err) {
        console.error(`[notify] Email (${email.template}) to ${to} threw:`, err.message);
      }
    }
  }

  return doc;
};

/**
 * Same as notify(), fanned out to several recipients in parallel. A failure
 * for one recipient (bad email, save error) never stops the others.
 * `emailData` may be a static object (same email content for everyone) or a
 * function `(user) => data` for per-recipient content (e.g. a greeting name).
 */
const notifyMany = async (users, { io, title, message, type, relatedId, emailTemplate, emailData }) =>
  Promise.all(
    (users || []).map((u) =>
      notify({
        io,
        user: u,
        title,
        message,
        type,
        relatedId,
        email: emailTemplate
          ? { template: emailTemplate, data: typeof emailData === "function" ? emailData(u) : emailData }
          : undefined,
      })
    )
  );

module.exports = { notify, notifyMany };
