const Notification = require("../models/Notification");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");

// @desc    List notifications for the logged-in user
// @route   GET /api/notifications?unread=true
// @access  Private
const getNotifications = catchAsync(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.unread === "true") filter.isRead = false;

  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

  res.status(200).json({ success: true, count: notifications.length, unreadCount, notifications });
});

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = catchAsync(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new ApiError(404, "Notification not found");

  notification.isRead = true;
  await notification.save();
  res.status(200).json({ success: true, notification });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: "All notifications marked as read" });
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
