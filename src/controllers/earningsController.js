const Transaction = require("../models/Transaction");
const catchAsync = require("../utils/catchAsync");

// @desc    Get earnings summary for the logged-in doctor (this month vs last month, breakdown)
// @route   GET /api/earnings/summary
// @access  Private (doctor)
const getSummary = catchAsync(async (req, res) => {
  const doctorId = req.user._id;
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisMonth, lastMonth, breakdown] = await Promise.all([
    Transaction.aggregate([
      { $match: { doctor: doctorId, date: { $gte: startOfThisMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { doctor: doctorId, date: { $gte: startOfLastMonth, $lt: startOfThisMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { doctor: doctorId, date: { $gte: startOfThisMonth } } },
      { $group: { _id: "$type", amount: { $sum: "$amount" }, sessions: { $sum: 1 } } },
    ]),
  ]);

  const current = thisMonth[0]?.total || 0;
  const previous = lastMonth[0]?.total || 0;
  const growth = previous > 0 ? Number((((current - previous) / previous) * 100).toFixed(1)) : current > 0 ? 100 : 0;

  res.status(200).json({
    success: true,
    summary: {
      current,
      previous,
      growth,
      consultations: thisMonth[0]?.count || 0,
      avgPerConsultation: thisMonth[0]?.count ? Number((current / thisMonth[0].count).toFixed(2)) : 0,
      rating: req.user.rating,
    },
    breakdown: breakdown.map((b) => ({ type: b._id, amount: b.amount, sessions: b.sessions })),
  });
});

// @desc    List raw transactions for the logged-in doctor
// @route   GET /api/earnings/transactions
// @access  Private (doctor)
const getTransactions = catchAsync(async (req, res) => {
  const transactions = await Transaction.find({ doctor: req.user._id })
    .populate("patient", "firstName lastName")
    .populate("appointment")
    .sort({ date: -1 });

  res.status(200).json({ success: true, count: transactions.length, transactions });
});

module.exports = { getSummary, getTransactions };
