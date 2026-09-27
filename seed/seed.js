/**
 * Seeds the database with sample doctors, a sample patient, family members,
 * and a subscription - roughly mirroring the mock data in the frontend so
 * the UI has something to display immediately after connecting the backend.
 *
 * Usage: npm run seed
 */
require("dotenv").config();
const connectDB = require("../src/config/db");

const User = require("../src/models/User");
const FamilyMember = require("../src/models/FamilyMember");
const Subscription = require("../src/models/Subscription");
const bootstrapAdmins = require("../src/utils/bootstrapAdmins");

const doctors = [
  {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@telemed.test",
    password: "password123",
    role: "doctor",
    specialization: "Cardiologist",
    medicalLicenseNumber: "MD-10021",
    yearsOfExperience: 15,
    bio: "Experienced cardiologist with expertise in interventional cardiology and heart disease prevention.",
    consultationFee: { video: 12000, chat: 8000 },
    status: "online",
    rating: 4.9,
    ratingCount: 128,
    doctorApprovalStatus: "approved",
  },
  {
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@telemed.test",
    password: "password123",
    role: "doctor",
    specialization: "Dermatologist",
    medicalLicenseNumber: "MD-10022",
    yearsOfExperience: 12,
    bio: "Board-certified dermatologist specializing in skin conditions and cosmetic dermatology.",
    consultationFee: { video: 10000, chat: 6500 },
    status: "online",
    rating: 4.8,
    ratingCount: 94,
    doctorApprovalStatus: "approved",
  },
  {
    firstName: "Emily",
    lastName: "Davis",
    email: "emily.davis@telemed.test",
    password: "password123",
    role: "doctor",
    specialization: "General Practice",
    medicalLicenseNumber: "MD-10023",
    yearsOfExperience: 10,
    bio: "General practitioner focused on preventive care and family medicine.",
    consultationFee: { video: 7000, chat: 4500 },
    status: "offline",
    rating: 4.7,
    ratingCount: 61,
    doctorApprovalStatus: "approved",
  },
  {
    firstName: "James",
    lastName: "Wilson",
    email: "james.wilson@telemed.test",
    password: "password123",
    role: "doctor",
    specialization: "Psychiatrist",
    medicalLicenseNumber: "MD-10024",
    yearsOfExperience: 18,
    bio: "Psychiatrist with a focus on anxiety, depression, and stress management.",
    consultationFee: { video: 13000, chat: 9000 },
    status: "online",
    rating: 4.9,
    ratingCount: 152,
    doctorApprovalStatus: "approved",
  },
  {
    firstName: "Grace",
    lastName: "Okafor",
    email: "grace.okafor@telemed.test",
    password: "password123",
    role: "doctor",
    specialization: "Pediatrician",
    medicalLicenseNumber: "MD-10025",
    yearsOfExperience: 6,
    bio: "Pediatrician passionate about child wellness and preventive care.",
    consultationFee: { video: 6000, chat: 3500 },
    status: "offline",
    doctorApprovalStatus: "pending", // for testing the admin approval flow
  },
];

const seed = async () => {
  await connectDB();

  console.log("Clearing existing sample data...");
  await User.deleteMany({ email: { $regex: "@telemed.test$" } });

  console.log("Creating sample doctors...");
  const createdDoctors = await User.create(doctors);
  console.log(`Created ${createdDoctors.length} doctors.`);

  console.log("Creating sample patient...");
  const patient = await User.create({
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@telemed.test",
    password: "password123",
    role: "patient",
    phone: "+1-555-0100",
  });

  await Subscription.create({ patient: patient._id, plan: "free" });

  await FamilyMember.create([
    { owner: patient._id, name: "John Smith (You)", relationship: "self", age: 35, isSelf: true },
    { owner: patient._id, name: "Emma Smith", relationship: "daughter", age: 8 },
    { owner: patient._id, name: "Michael Smith", relationship: "son", age: 12 },
  ]);

  console.log("Creating admin accounts...");
  await User.create({
    firstName: "Ada",
    lastName: "Oversight",
    email: "admin@telemed.test",
    password: "password123",
    role: "admin", // can view everything, but cannot approve/reject doctors
  });
  await User.create({
    firstName: "Super",
    lastName: "Admin",
    email: "superadmin@telemed.test",
    password: "password123",
    role: "superadmin", // full oversight + doctor approval power
  });

  await bootstrapAdmins();

  console.log("\nSeed complete! Sample login credentials (password: password123):");
  console.log("  Patient:    john.smith@telemed.test");
  console.log("  Admin:      admin@telemed.test        (oversight only, can't approve doctors)");
  console.log("  Super Admin: superadmin@telemed.test   (oversight + doctor approval)");
  createdDoctors.forEach((d) =>
    console.log(`  Doctor (${d.specialization}, ${d.doctorApprovalStatus}): ${d.email}`)
  );

  process.exit(0);
};

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
