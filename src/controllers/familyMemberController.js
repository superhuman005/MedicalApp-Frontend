const FamilyMember = require("../models/FamilyMember");
const Subscription = require("../models/Subscription");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");

// @desc    List the logged-in patient's family members (including self)
// @route   GET /api/patients
// @access  Private (patient)
const getFamilyMembers = catchAsync(async (req, res) => {
  const members = await FamilyMember.find({ owner: req.user._id }).sort({ isSelf: -1, createdAt: 1 });
  res.status(200).json({ success: true, count: members.length, patients: members });
});

// @desc    Add a family member
// @route   POST /api/patients
// @access  Private (patient)
const addFamilyMember = catchAsync(async (req, res) => {
  const { name, relationship, age, dateOfBirth, gender, avatar } = req.body;
  if (!name || !relationship) {
    throw new ApiError(400, "name and relationship are required");
  }

  const subscription = await Subscription.findOne({ patient: req.user._id });
  const limit = subscription ? subscription.getLimits().familyMemberLimit : 1;
  const currentCount = await FamilyMember.countDocuments({ owner: req.user._id });

  if (currentCount >= limit) {
    throw new ApiError(
      403,
      `Your current plan allows up to ${limit} patient profile(s). Upgrade your subscription to add more.`
    );
  }

  const member = await FamilyMember.create({
    owner: req.user._id,
    name,
    relationship,
    age,
    dateOfBirth,
    gender,
    avatar,
  });

  res.status(201).json({ success: true, patient: member });
});

// @desc    Update a family member
// @route   PATCH /api/patients/:id
// @access  Private (patient - owner only)
const updateFamilyMember = catchAsync(async (req, res) => {
  const member = await FamilyMember.findOne({ _id: req.params.id, owner: req.user._id });
  if (!member) throw new ApiError(404, "Patient profile not found");

  const editable = ["name", "relationship", "age", "dateOfBirth", "gender", "avatar"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) member[field] = req.body[field];
  });

  await member.save();
  res.status(200).json({ success: true, patient: member });
});

// @desc    Remove a family member (cannot remove "self")
// @route   DELETE /api/patients/:id
// @access  Private (patient - owner only)
const deleteFamilyMember = catchAsync(async (req, res) => {
  const member = await FamilyMember.findOne({ _id: req.params.id, owner: req.user._id });
  if (!member) throw new ApiError(404, "Patient profile not found");
  if (member.isSelf) throw new ApiError(400, "You cannot remove your own primary profile");

  await member.deleteOne();
  res.status(200).json({ success: true, message: "Patient profile removed" });
});

module.exports = { getFamilyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember };
