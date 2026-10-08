import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardShell, type ShellNavItem } from "@/components/DashboardShell";
import {
  Users, Stethoscope, Calendar, DollarSign, AlertTriangle, LogOut, Loader2,
  CheckCircle2, XCircle, ClipboardList, Pill, UserPlus, Copy, Shield, Tag, Send,
  Search, Mail, Phone, UserRound, BadgeCheck, Briefcase, Cake,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "@/components/NotificationBell";
import AdminPlans from "@/components/AdminPlans";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/services/api";
import {
  getAdminOverview,
  getPendingDoctors,
  getAllDoctors,
  approveDoctor,
  rejectDoctor,
  createDoctor,
  getAllAppointments,
  getAdminDoctorReports,
  markDoctorReportReviewed,
  getUsers,
  getAllPayments,
  getAdminPrescriptions,
  updateAdminPrescriptionStatus,
  getAdmins,
  createAdmin,
} from "@/services/admin";
import { getSocket } from "@/services/socket";
import type { AdminOverview, User, UserRole, Appointment, DoctorReportItem, Payment, AdminPrescription } from "@/types";

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

type SectionKey = "doctors" | "reports" | "prescriptions" | "appointments" | "users" | "admins" | "plans" | "payments";

// Admin console emphasis color - sky blue, distinct from the patient app's
// teal and the doctor workspace's indigo.
const ACCENT = "#0ea5e9";

const SECTION_COPY: Record<SectionKey, { title: string; subtitle: string }> = {
  doctors: { title: "Doctors", subtitle: "Approvals and doctor accounts" },
  reports: { title: "Recommendations", subtitle: "Private notes doctors send after a consultation" },
  prescriptions: { title: "Prescriptions", subtitle: "Prescriptions sent to the admin team" },
  appointments: { title: "Appointments", subtitle: "All appointments platform-wide" },
  users: { title: "Users", subtitle: "Everyone registered on TeleMed" },
  admins: { title: "Admins", subtitle: "People with access to this dashboard" },
  plans: { title: "Plans", subtitle: "Subscription pricing - the only place prices are set in the app" },
  payments: { title: "Payments", subtitle: "Paystack subscription transactions" },
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SectionKey>("doctors");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [pendingDoctors, setPendingDoctors] = useState<User[]>([]);
  const [allDoctors, setAllDoctors] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<DoctorReportItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | UserRole>("all");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [prescriptions, setPrescriptions] = useState<AdminPrescription[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingOnId, setActingOnId] = useState<string | null>(null);

  // Reject-prescription dialog
  const [rejectingRx, setRejectingRx] = useState<AdminPrescription | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  // View application/account details dialog - full record (doctor or
  // patient) so admin can review everything submitted at signup, including
  // a doctor's bio, before approving/rejecting them.
  const [viewingApplicant, setViewingApplicant] = useState<User | null>(null);

  // Add-admin dialog
  const emptyAdminForm = { firstName: "", lastName: "", email: "", phone: "", password: "" };
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  // Add-doctor dialog - the only way to create a doctor account now
  const emptyDoctorForm = {
    firstName: "", lastName: "", email: "", phone: "",
    specialization: "", medicalLicenseNumber: "", yearsOfExperience: "", password: "",
    gender: "", dateOfBirth: "",
  };
  const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false);
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);
  const [isCreatingDoctor, setIsCreatingDoctor] = useState(false);
  const [createdDoctorCredentials, setCreatedDoctorCredentials] = useState<{ email: string; password: string } | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [
        overviewData, pendingData, doctorsData, appointmentsData, reportsData, usersData, paymentsData,
        prescriptionsData, adminsData,
      ] =
        await Promise.all([
          getAdminOverview(),
          getPendingDoctors(),
          getAllDoctors(),
          getAllAppointments(),
          getAdminDoctorReports(),
          getUsers(),
          getAllPayments(),
          getAdminPrescriptions(),
          getAdmins(),
        ]);
      setOverview(overviewData);
      setPendingDoctors(pendingData);
      setAllDoctors(doctorsData);
      setAppointments(appointmentsData);
      setReports(reportsData);
      setUsers(usersData);
      setPayments(paymentsData);
      setPrescriptions(prescriptionsData);
      setAdmins(adminsData);
    } catch (error) {
      toast({ title: "Couldn't load admin data", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Refresh the queue live when a doctor sends a new prescription
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () => {
      loadAll();
    };
    socket.on("prescription:new", refresh);
    return () => {
      socket.off("prescription:new", refresh);
    };
  }, [loadAll]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleApprove = async (doctorId: string) => {
    setActingOnId(doctorId);
    try {
      await approveDoctor(doctorId);
      toast({ title: "Doctor approved" });
      await loadAll();
    } catch (error) {
      toast({ title: "Couldn't approve doctor", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setActingOnId(null);
    }
  };

  const handleReject = async (doctorId: string) => {
    setActingOnId(doctorId);
    try {
      await rejectDoctor(doctorId);
      toast({ title: "Doctor rejected" });
      await loadAll();
    } catch (error) {
      toast({ title: "Couldn't reject doctor", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setActingOnId(null);
    }
  };

  const handleMarkReviewed = async (reportId: string) => {
    setActingOnId(reportId);
    try {
      await markDoctorReportReviewed(reportId);
      setReports((prev) => prev.map((r) => (r._id === reportId ? { ...r, status: "reviewed" } : r)));
    } catch (error) {
      toast({ title: "Couldn't update report", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setActingOnId(null);
    }
  };

  // Doctors can only send a prescription to the admin team - this is the step
  // that actually delivers it to the patient (adminStatus "fulfilled" under
  // the hood; the patient's own prescriptions view only shows ones in this state).
  const handleSendPrescriptionToPatient = async (prescriptionId: string) => {
    setActingOnId(prescriptionId);
    try {
      await updateAdminPrescriptionStatus(prescriptionId, "fulfilled");
      toast({ title: "Sent to patient", description: "The patient has been notified and can now see this prescription." });
      await loadAll();
    } catch (error) {
      toast({ title: "Couldn't update prescription", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setActingOnId(null);
    }
  };

  const handleConfirmRejectPrescription = async () => {
    if (!rejectingRx || !rejectNote.trim()) return;
    setActingOnId(rejectingRx._id);
    try {
      await updateAdminPrescriptionStatus(rejectingRx._id, "rejected", rejectNote.trim());
      toast({ title: "Prescription rejected", description: "The patient and prescribing doctor have been notified." });
      setRejectingRx(null);
      setRejectNote("");
      await loadAll();
    } catch (error) {
      toast({ title: "Couldn't reject prescription", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setActingOnId(null);
    }
  };

  const handleCreateAdmin = async () => {
    setIsCreatingAdmin(true);
    try {
      const { admin, temporaryPassword } = await createAdmin({
        firstName: adminForm.firstName.trim(),
        lastName: adminForm.lastName.trim(),
        email: adminForm.email.trim(),
        phone: adminForm.phone.trim() || undefined,
        password: adminForm.password || undefined,
      });
      toast({ title: "Admin added", description: `${admin.firstName} ${admin.lastName} can now sign in as an admin.` });
      // Only show credentials when the server generated the password for us
      setCreatedCredentials(temporaryPassword ? { email: admin.email, password: temporaryPassword } : null);
      setAdminForm(emptyAdminForm);
      if (!temporaryPassword) setIsAdminDialogOpen(false);
      setAdmins(await getAdmins());
    } catch (error) {
      toast({ title: "Couldn't add admin", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleCreateDoctor = async () => {
    setIsCreatingDoctor(true);
    try {
      const { doctor, temporaryPassword } = await createDoctor({
        firstName: doctorForm.firstName.trim(),
        lastName: doctorForm.lastName.trim(),
        email: doctorForm.email.trim(),
        phone: doctorForm.phone.trim() || undefined,
        password: doctorForm.password || undefined,
        specialization: doctorForm.specialization.trim(),
        medicalLicenseNumber: doctorForm.medicalLicenseNumber.trim(),
        yearsOfExperience: Number(doctorForm.yearsOfExperience),
        gender: (doctorForm.gender as "male" | "female" | "other" | "") || undefined,
        dateOfBirth: doctorForm.dateOfBirth || undefined,
      });
      toast({
        title: "Doctor added",
        description: `Dr. ${doctor.firstName} ${doctor.lastName} can now sign in and go online.`,
      });
      setCreatedDoctorCredentials(temporaryPassword ? { email: doctor.email, password: temporaryPassword } : null);
      setDoctorForm(emptyDoctorForm);
      if (!temporaryPassword) setIsDoctorDialogOpen(false);
      await loadAll();
    } catch (error) {
      toast({ title: "Couldn't add doctor", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsCreatingDoctor(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Couldn't copy", description: "Select the text and copy it manually.", variant: "destructive" });
    }
  };

  const pendingPrescriptionCount = prescriptions.filter((p) => p.adminStatus === "pending").length;

  const NAV_ITEMS: ShellNavItem[] = [
    { id: "doctors", label: "Doctors", icon: Stethoscope, badge: pendingDoctors.length || undefined },
    { id: "reports", label: "Recommendations", icon: AlertTriangle, badge: overview?.openReports || undefined },
    { id: "prescriptions", label: "Prescriptions", icon: Pill, badge: pendingPrescriptionCount || undefined },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "users", label: "Users", icon: Users },
    { id: "admins", label: "Admins", icon: Shield },
    { id: "plans", label: "Plans", icon: Tag },
    { id: "payments", label: "Payments", icon: DollarSign },
  ];

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (userRoleFilter !== "all" && u.role !== userRoleFilter) return false;
      if (!q) return true;
      return (
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        (u.specialization || "").toLowerCase().includes(q) ||
        (u.medicalLicenseNumber || "").toLowerCase().includes(q)
      );
    });
  }, [users, userSearch, userRoleFilter]);

  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const diff = Date.now() - birth.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  const urgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || '?';

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    <DashboardShell
      nav={NAV_ITEMS}
      active={activeTab}
      onNav={(id) => setActiveTab(id as SectionKey)}
      brand="TeleMed"
      tag="Admin console"
      accent={ACCENT}
      user={{ name: `${user.firstName} ${user.lastName}`, role: isSuperAdmin ? "Super Admin" : "Admin" }}
      title={SECTION_COPY[activeTab].title}
      subtitle={SECTION_COPY[activeTab].subtitle}
      mobileIds={["doctors", "prescriptions", "users", "payments"]}
      actions={
        <>
          <NotificationBell />
          <Button variant="ghost" size="icon" aria-label="Log out" onClick={handleLogout}>
            <LogOut className="w-[18px] h-[18px]" />
          </Button>
        </>
      }
    >

        <div className="space-y-6 anim-rise">
          {/* Stats - persistent context above every section */}
          {overview && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-none shadow-none bg-secondary/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
                    <Users className="w-3.5 h-3.5" />Patients
                  </div>
                  <div className="text-xl font-display font-semibold text-foreground">{overview.totalPatients}</div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-none bg-accent/15">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
                    <Stethoscope className="w-3.5 h-3.5" />Doctors
                  </div>
                  <div className="text-xl font-display font-semibold text-foreground">{overview.totalDoctors}</div>
                  {overview.pendingDoctors > 0 && (
                    <p className="text-xs text-yellow-600 mt-1">{overview.pendingDoctors} pending approval</p>
                  )}
                </CardContent>
              </Card>
              <Card className="border-none shadow-none bg-secondary/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
                    <Calendar className="w-3.5 h-3.5" />Appointments
                  </div>
                  <div className="text-xl font-display font-semibold text-foreground">{overview.totalAppointments}</div>
                  <p className="text-xs text-muted-foreground mt-1">{overview.appointmentsToday} today</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-none bg-accent/15">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
                    <DollarSign className="w-3.5 h-3.5" />Revenue
                  </div>
                  <div className="text-xl font-display font-semibold text-foreground">{nairaFormatter.format(overview.revenue)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{overview.successfulPayments} payments</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "doctors" && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle>Doctor Approvals</CardTitle>
                    <CardDescription>
                      New doctor accounts awaiting review before they can go live
                      {!isSuperAdmin && " (view only - super admin access required to approve/reject)"}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCreatedDoctorCredentials(null);
                      setIsDoctorDialogOpen(true);
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />Add Doctor
                  </Button>
                </CardHeader>
                <CardContent>
                  {pendingDoctors.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-8">No doctors waiting for approval.</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingDoctors.map((doctor) => (
                        <div key={doctor._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>{`${doctor.firstName?.[0] || ''}${doctor.lastName?.[0] || ''}`}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">Dr. {doctor.firstName} {doctor.lastName}</p>
                              <p className="text-sm text-gray-600">{doctor.specialization} • {doctor.email}</p>
                              <p className="text-xs text-gray-500">License: {doctor.medicalLicenseNumber} • {doctor.yearsOfExperience} yrs experience</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingApplicant(doctor)}
                            >
                              View Application
                            </Button>
                            {isSuperAdmin ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleReject(doctor._id)}
                                  disabled={actingOnId === doctor._id}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />Reject
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApprove(doctor._id)}
                                  disabled={actingOnId === doctor._id}
                                >
                                  {actingOnId === doctor._id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                                  Approve
                                </Button>
                              </>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600 self-center">
                                Awaiting super admin
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Doctors</CardTitle>
                </CardHeader>
                <CardContent>
                  {allDoctors.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-8">No doctors yet. Add one to get started.</p>
                  ) : (
                    <div className="space-y-3">
                      {allDoctors.map((doctor) => (
                        <div key={doctor._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Dr. {doctor.firstName} {doctor.lastName}</p>
                            <p className="text-xs text-gray-500">{doctor.specialization}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className={
                                doctor.doctorApprovalStatus === "approved"
                                  ? "text-green-600 border-green-600"
                                  : doctor.doctorApprovalStatus === "rejected"
                                  ? "text-red-600 border-red-600"
                                  : "text-yellow-600 border-yellow-600"
                              }
                            >
                              {doctor.doctorApprovalStatus}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={() => setViewingApplicant(doctor)}>
                              View Application
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "reports" && (
            <Card>
              <CardHeader>
                <CardTitle>Doctor Recommendations</CardTitle>
                <CardDescription>Private notes doctors send after ending a consultation</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-8">No recommendations submitted yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <Card key={report._id} className={report.status === "open" ? "border-l-4 border-l-orange-400" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">
                                Dr. {report.doctor.firstName} {report.doctor.lastName} → {report.patient.firstName} {report.patient.lastName}
                                {report.familyMember && ` (${report.familyMember.name})`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(report.createdAt).toLocaleString()} • {report.appointment.appointmentType}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={urgencyColor(report.urgency)}>{report.urgency}</Badge>
                              <Badge variant="outline">{report.status}</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{report.recommendation}</p>
                          {report.status === "open" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3"
                              onClick={() => handleMarkReviewed(report._id)}
                              disabled={actingOnId === report._id}
                            >
                              {actingOnId === report._id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ClipboardList className="w-4 h-4 mr-1" />}
                              Mark Reviewed
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "prescriptions" && (
            <Card>
              <CardHeader>
                <CardTitle>Prescriptions</CardTitle>
                <CardDescription>
                  Doctors can only send prescriptions here - review each one, then send it on to the patient or reject it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {prescriptions.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-8">No prescriptions have been sent yet.</p>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((rx) => {
                      const patientName = `${rx.patient.firstName} ${rx.patient.lastName}`;
                      return (
                        <Card key={rx._id} className={rx.adminStatus === "pending" ? "border-l-4 border-l-yellow-400" : ""}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start space-x-3">
                                <Pill className="w-5 h-5 text-primary mt-1" />
                                <div>
                                  <p className="font-semibold text-lg">{rx.medication}</p>
                                  {rx.dosage && <p className="text-sm text-gray-600">{rx.dosage}</p>}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Dr. {rx.prescribedBy.firstName} {rx.prescribedBy.lastName}
                                    {rx.prescribedBy.specialization && ` (${rx.prescribedBy.specialization})`} • sent{" "}
                                    {rx.sentToAdminAt ? new Date(rx.sentToAdminAt).toLocaleString() : "—"}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  rx.adminStatus === "fulfilled"
                                    ? "text-green-600 border-green-600"
                                    : rx.adminStatus === "rejected"
                                    ? "text-red-600 border-red-600"
                                    : "text-yellow-600 border-yellow-600"
                                }
                              >
                                {rx.adminStatus === "fulfilled" ? "sent to patient" : rx.adminStatus}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                              <div>
                                <p className="text-xs text-gray-500">Patient</p>
                                <p className="font-medium">
                                  {rx.familyMember ? `${rx.familyMember.name} (${rx.familyMember.relationship})` : patientName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {rx.familyMember && `Account: ${patientName} • `}
                                  {rx.patient.email}
                                  {rx.patient.phone && ` • ${rx.patient.phone}`}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Refills</p>
                                <p className="font-medium">{rx.refills}</p>
                              </div>
                              {rx.instructions && (
                                <div className="sm:col-span-2">
                                  <p className="text-xs text-gray-500">Instructions</p>
                                  <p>{rx.instructions}</p>
                                </div>
                              )}
                            </div>

                            {rx.adminStatus !== "pending" && (
                              <p className="text-xs text-gray-500 mt-3">
                                {rx.adminStatus === "fulfilled" ? "Sent to patient" : "Rejected"}
                                {rx.handledBy && ` by ${rx.handledBy.firstName} ${rx.handledBy.lastName}`}
                                {rx.handledAt && ` on ${new Date(rx.handledAt).toLocaleString()}`}
                                {rx.adminNote && ` — ${rx.adminNote}`}
                              </p>
                            )}

                            {rx.adminStatus === "pending" && (
                              <div className="flex justify-end space-x-2 mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  disabled={actingOnId === rx._id}
                                  onClick={() => {
                                    setRejectNote("");
                                    setRejectingRx(rx);
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />Reject
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={actingOnId === rx._id}
                                  onClick={() => handleSendPrescriptionToPatient(rx._id)}
                                >
                                  {actingOnId === rx._id ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4 mr-1" />
                                  )}
                                  Send to Patient
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "appointments" && (
            <Card>
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-8">No appointments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((a) => (
                      <div key={a._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                        <div>
                          <p className="font-medium">
                            {a.patient.firstName} {a.patient.lastName} with Dr. {a.doctor.firstName} {a.doctor.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(a.date).toLocaleDateString()} at {a.time} • {a.type}
                          </p>
                        </div>
                        <Badge variant="outline">{a.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "users" && (
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Full account and application details for every patient and doctor on the platform - click
                  "View Application" on anyone to see their sex, date of birth, and, for doctors, their bio,
                  license, specialization and experience.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, phone, specialization or license..."
                      className="pl-9"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <Select value={userRoleFilter} onValueChange={(v) => setUserRoleFilter(v as "all" | UserRole)}>
                    <SelectTrigger className="sm:w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="patient">Patients</SelectItem>
                      <SelectItem value="doctor">Doctors</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="superadmin">Super Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredUsers.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-8">No users match that search.</p>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((u) => {
                      const age = calculateAge(u.dateOfBirth);
                      return (
                        <div key={u._id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="w-10 h-10 shrink-0">
                                <AvatarImage src={u.avatar} />
                                <AvatarFallback className="text-xs">
                                  {u.firstName?.[0] || ""}
                                  {u.lastName?.[0] || ""}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {u.role === "doctor" ? "Dr. " : ""}
                                  {u.firstName} {u.lastName}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {u.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="capitalize">{u.role}</Badge>
                              {u.role === "doctor" && u.doctorApprovalStatus && (
                                <Badge
                                  variant="outline"
                                  className={
                                    u.doctorApprovalStatus === "approved"
                                      ? "text-green-600 border-green-600"
                                      : u.doctorApprovalStatus === "rejected"
                                      ? "text-red-600 border-red-600"
                                      : "text-yellow-600 border-yellow-600"
                                  }
                                >
                                  {u.doctorApprovalStatus}
                                </Badge>
                              )}
                              {!u.isActive && (
                                <Badge variant="outline" className="text-red-600 border-red-600">Inactive</Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-xs text-gray-600">
                            {u.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" />
                                {u.phone}
                              </span>
                            )}
                            {u.gender && (
                              <span className="flex items-center gap-1 capitalize">
                                <UserRound className="w-3.5 h-3.5" />
                                {u.gender}
                              </span>
                            )}
                            {u.dateOfBirth && (
                              <span className="flex items-center gap-1">
                                <Cake className="w-3.5 h-3.5" />
                                {new Date(u.dateOfBirth).toLocaleDateString()}
                                {age !== null && ` (${age} yrs)`}
                              </span>
                            )}
                            {u.role === "doctor" && u.specialization && (
                              <span className="flex items-center gap-1">
                                <Stethoscope className="w-3.5 h-3.5" />
                                {u.specialization}
                              </span>
                            )}
                            {u.role === "doctor" && u.medicalLicenseNumber && (
                              <span className="flex items-center gap-1">
                                <BadgeCheck className="w-3.5 h-3.5" />
                                License: {u.medicalLicenseNumber}
                              </span>
                            )}
                            {u.role === "doctor" && u.yearsOfExperience !== undefined && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5" />
                                {u.yearsOfExperience} yr{u.yearsOfExperience === 1 ? "" : "s"} experience
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setViewingApplicant(u)}>
                              View Application
                            </Button>
                            {u.role === "doctor" && (
                              <Link to={`/doctors/${u._id}`}>
                                <Button variant="outline" size="sm">
                                  View Full Profile
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "admins" && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>Admins</CardTitle>
                  <CardDescription>People with access to this admin dashboard</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setCreatedCredentials(null);
                    setIsAdminDialogOpen(true);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />Add Admin
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {admins.map((a) => (
                    <div key={a._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                      <div>
                        <p className="font-medium">
                          {a.firstName} {a.lastName}
                          {a._id === user._id && <span className="text-xs text-gray-500 ml-2">(you)</span>}
                        </p>
                        <p className="text-xs text-gray-500">{a.email}</p>
                      </div>
                      <Badge variant="outline">{a.role === "superadmin" ? "Super Admin" : "Admin"}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "plans" && <AdminPlans />}

          {activeTab === "payments" && (
            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
                <CardDescription>Paystack subscription transactions platform-wide</CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-8">No payments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => {
                      const patient = typeof p.patient === "object" ? p.patient : null;
                      return (
                        <div key={p._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                          <div>
                            <p className="font-medium">
                              {patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient"} • {p.plan}
                            </p>
                            <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()} • {p.reference}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{nairaFormatter.format(p.amount)}</p>
                            <Badge
                              variant="outline"
                              className={
                                p.status === "success"
                                  ? "text-green-600 border-green-600"
                                  : p.status === "failed"
                                  ? "text-red-600 border-red-600"
                                  : "text-yellow-600 border-yellow-600"
                              }
                            >
                              {p.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
    </DashboardShell>

      {/* Reject prescription */}
      <Dialog open={!!rejectingRx} onOpenChange={(open) => !open && setRejectingRx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject prescription</DialogTitle>
            <DialogDescription>
              {rejectingRx && `${rejectingRx.medication} for ${rejectingRx.patient.firstName} ${rejectingRx.patient.lastName}`}
              {" — the patient and prescribing doctor will see your reason."}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="reject-note">Reason</Label>
            <Textarea
              id="reject-note"
              className="mt-2"
              maxLength={500}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. Out of stock, please prescribe an alternative"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setRejectingRx(null)} disabled={!!actingOnId}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRejectPrescription}
              disabled={!rejectNote.trim() || !!actingOnId}
            >
              {actingOnId && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add admin */}
      <Dialog
        open={isAdminDialogOpen}
        onOpenChange={(open) => {
          if (isCreatingAdmin) return;
          setIsAdminDialogOpen(open);
          if (!open) setCreatedCredentials(null);
        }}
      >
        <DialogContent>
          {createdCredentials ? (
            <>
              <DialogHeader>
                <DialogTitle>Admin created</DialogTitle>
                <DialogDescription>
                  Share these sign-in details securely. The password is only shown once — ask them to change it after
                  their first login.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg text-sm">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{createdCredentials.email}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Temporary password</p>
                    <p className="font-mono font-medium">{createdCredentials.password}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(createdCredentials.password)}>
                    <Copy className="w-4 h-4 mr-1" />Copy
                  </Button>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => {
                    setCreatedCredentials(null);
                    setIsAdminDialogOpen(false);
                  }}
                >
                  Done
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Add admin</DialogTitle>
                <DialogDescription>
                  The new admin can view everything on this dashboard and add other admins.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="admin-first">First name</Label>
                    <Input
                      id="admin-first"
                      className="mt-1"
                      value={adminForm.firstName}
                      onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-last">Last name</Label>
                    <Input
                      id="admin-last"
                      className="mt-1"
                      value={adminForm.lastName}
                      onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="admin-new-email">Email</Label>
                  <Input
                    id="admin-new-email"
                    type="email"
                    className="mt-1"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="admin-phone">Phone (optional)</Label>
                  <Input
                    id="admin-phone"
                    className="mt-1"
                    value={adminForm.phone}
                    onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="admin-new-password">Password (optional)</Label>
                  <Input
                    id="admin-new-password"
                    type="password"
                    className="mt-1"
                    placeholder="Leave blank to generate a temporary password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">At least 8 characters if you set one.</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsAdminDialogOpen(false)} disabled={isCreatingAdmin}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAdmin}
                  disabled={
                    isCreatingAdmin ||
                    !adminForm.firstName.trim() ||
                    !adminForm.lastName.trim() ||
                    !adminForm.email.trim() ||
                    (adminForm.password.length > 0 && adminForm.password.length < 8)
                  }
                >
                  {isCreatingAdmin && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Admin
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add doctor - the only way to create a doctor account now */}
      <Dialog
        open={isDoctorDialogOpen}
        onOpenChange={(open) => {
          if (isCreatingDoctor) return;
          setIsDoctorDialogOpen(open);
          if (!open) setCreatedDoctorCredentials(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {createdDoctorCredentials ? (
            <>
              <DialogHeader>
                <DialogTitle>Doctor created</DialogTitle>
                <DialogDescription>
                  Share these sign-in details securely. The password is only shown once — ask them to change it after
                  their first login.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg text-sm">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{createdDoctorCredentials.email}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Temporary password</p>
                    <p className="font-mono font-medium">{createdDoctorCredentials.password}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(createdDoctorCredentials.password)}>
                    <Copy className="w-4 h-4 mr-1" />Copy
                  </Button>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => {
                    setCreatedDoctorCredentials(null);
                    setIsDoctorDialogOpen(false);
                  }}
                >
                  Done
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Add doctor</DialogTitle>
                <DialogDescription>
                  There's no public doctor signup - this is the only way to create a doctor account. It's created
                  already approved, so they can go online as soon as they sign in.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="doctor-first">First name</Label>
                    <Input
                      id="doctor-first"
                      className="mt-1"
                      value={doctorForm.firstName}
                      onChange={(e) => setDoctorForm({ ...doctorForm, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctor-last">Last name</Label>
                    <Input
                      id="doctor-last"
                      className="mt-1"
                      value={doctorForm.lastName}
                      onChange={(e) => setDoctorForm({ ...doctorForm, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="doctor-new-email">Email</Label>
                  <Input
                    id="doctor-new-email"
                    type="email"
                    className="mt-1"
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="doctor-phone">Phone (optional)</Label>
                  <Input
                    id="doctor-phone"
                    className="mt-1"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="doctor-specialization">Specialization</Label>
                  <Input
                    id="doctor-specialization"
                    className="mt-1"
                    placeholder="e.g. Cardiology"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="doctor-license">Medical license number</Label>
                  <Input
                    id="doctor-license"
                    className="mt-1"
                    value={doctorForm.medicalLicenseNumber}
                    onChange={(e) => setDoctorForm({ ...doctorForm, medicalLicenseNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="doctor-experience">Years of experience</Label>
                  <Input
                    id="doctor-experience"
                    type="number"
                    min={0}
                    className="mt-1"
                    value={doctorForm.yearsOfExperience}
                    onChange={(e) => setDoctorForm({ ...doctorForm, yearsOfExperience: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="doctor-gender">Sex</Label>
                    <Select
                      value={doctorForm.gender}
                      onValueChange={(value) => setDoctorForm({ ...doctorForm, gender: value })}
                    >
                      <SelectTrigger id="doctor-gender" className="mt-1">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="doctor-dob">Date of birth</Label>
                    <Input
                      id="doctor-dob"
                      type="date"
                      className="mt-1"
                      value={doctorForm.dateOfBirth}
                      onChange={(e) => setDoctorForm({ ...doctorForm, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="doctor-new-password">Password (optional)</Label>
                  <Input
                    id="doctor-new-password"
                    type="password"
                    className="mt-1"
                    placeholder="Leave blank to generate a temporary password"
                    value={doctorForm.password}
                    onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">At least 8 characters if you set one.</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsDoctorDialogOpen(false)} disabled={isCreatingDoctor}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateDoctor}
                  disabled={
                    isCreatingDoctor ||
                    !doctorForm.firstName.trim() ||
                    !doctorForm.lastName.trim() ||
                    !doctorForm.email.trim() ||
                    !doctorForm.specialization.trim() ||
                    !doctorForm.medicalLicenseNumber.trim() ||
                    doctorForm.yearsOfExperience.trim() === "" ||
                    Number(doctorForm.yearsOfExperience) < 0 ||
                    (doctorForm.password.length > 0 && doctorForm.password.length < 8)
                  }
                >
                  {isCreatingDoctor && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Doctor
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View application / account details - full record for a patient or
          doctor, including a doctor's self-written bio, so admin can review
          everything submitted before approving an account or just looking
          someone up. */}
      <Dialog open={!!viewingApplicant} onOpenChange={(open) => !open && setViewingApplicant(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {viewingApplicant && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={viewingApplicant.avatar} />
                    <AvatarFallback>
                      {viewingApplicant.firstName?.[0] || ""}
                      {viewingApplicant.lastName?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {viewingApplicant.role === "doctor" ? "Dr. " : ""}
                    {viewingApplicant.firstName} {viewingApplicant.lastName}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  {viewingApplicant.role === "doctor" ? "Doctor application & account details" : "Patient account details"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="capitalize">{viewingApplicant.role}</Badge>
                  {viewingApplicant.role === "doctor" && viewingApplicant.doctorApprovalStatus && (
                    <Badge
                      variant="outline"
                      className={
                        viewingApplicant.doctorApprovalStatus === "approved"
                          ? "text-green-600 border-green-600"
                          : viewingApplicant.doctorApprovalStatus === "rejected"
                          ? "text-red-600 border-red-600"
                          : "text-yellow-600 border-yellow-600"
                      }
                    >
                      {viewingApplicant.doctorApprovalStatus}
                    </Badge>
                  )}
                  {!viewingApplicant.isActive && (
                    <Badge variant="outline" className="text-red-600 border-red-600">Inactive</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium break-all">{viewingApplicant.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium">{viewingApplicant.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="font-medium capitalize">{viewingApplicant.gender || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date of birth</p>
                    <p className="font-medium">
                      {viewingApplicant.dateOfBirth
                        ? `${new Date(viewingApplicant.dateOfBirth).toLocaleDateString()}${
                            calculateAge(viewingApplicant.dateOfBirth) !== null
                              ? ` (${calculateAge(viewingApplicant.dateOfBirth)} yrs)`
                              : ""
                          }`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="font-medium">
                      {viewingApplicant.createdAt ? new Date(viewingApplicant.createdAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Account status</p>
                    <p className="font-medium">{viewingApplicant.isActive ? "Active" : "Inactive"}</p>
                  </div>
                </div>

                {viewingApplicant.role === "doctor" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Specialization</p>
                      <p className="font-medium">{viewingApplicant.specialization || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Medical license number</p>
                      <p className="font-medium">{viewingApplicant.medicalLicenseNumber || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Years of experience</p>
                      <p className="font-medium">
                        {viewingApplicant.yearsOfExperience !== undefined ? viewingApplicant.yearsOfExperience : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Rating</p>
                      <p className="font-medium">
                        {viewingApplicant.rating ? `${viewingApplicant.rating.toFixed(1)} / 5` : "No ratings yet"}
                        {viewingApplicant.ratingCount ? ` (${viewingApplicant.ratingCount})` : ""}
                      </p>
                    </div>
                    {viewingApplicant.bio && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-500">Bio</p>
                        <p className="whitespace-pre-wrap">{viewingApplicant.bio}</p>
                      </div>
                    )}
                    {viewingApplicant.approvalNote && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-500">Admin note</p>
                        <p>{viewingApplicant.approvalNote}</p>
                      </div>
                    )}
                  </div>
                )}

                {viewingApplicant.role === "doctor" && viewingApplicant.doctorApprovalStatus === "pending" && (
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={!isSuperAdmin || actingOnId === viewingApplicant._id}
                      onClick={() => {
                        handleReject(viewingApplicant._id);
                        setViewingApplicant(null);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-1" />Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!isSuperAdmin || actingOnId === viewingApplicant._id}
                      onClick={() => {
                        handleApprove(viewingApplicant._id);
                        setViewingApplicant(null);
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />Approve
                    </Button>
                  </div>
                )}

                {viewingApplicant.role === "doctor" && (
                  <div className="flex justify-end">
                    <Link to={`/doctors/${viewingApplicant._id}`}>
                      <Button variant="outline" size="sm">View Public Profile</Button>
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboard;
