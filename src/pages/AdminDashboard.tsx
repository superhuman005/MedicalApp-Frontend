import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Video, Users, Stethoscope, Calendar, DollarSign, AlertTriangle, LogOut, Loader2,
  CheckCircle2, XCircle, ClipboardList, Pill, UserPlus, Copy,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/services/api";
import {
  getAdminOverview,
  getPendingDoctors,
  getAllDoctors,
  approveDoctor,
  rejectDoctor,
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
import type { AdminOverview, User, Appointment, DoctorReportItem, Payment, AdminPrescription } from "@/types";

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const { toast } = useToast();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [pendingDoctors, setPendingDoctors] = useState<User[]>([]);
  const [allDoctors, setAllDoctors] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<DoctorReportItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [prescriptions, setPrescriptions] = useState<AdminPrescription[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingOnId, setActingOnId] = useState<string | null>(null);

  // Reject-prescription dialog
  const [rejectingRx, setRejectingRx] = useState<AdminPrescription | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  // Add-admin dialog
  const emptyAdminForm = { firstName: "", lastName: "", email: "", phone: "", password: "" };
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

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

  const handleFulfillPrescription = async (prescriptionId: string) => {
    setActingOnId(prescriptionId);
    try {
      await updateAdminPrescriptionStatus(prescriptionId, "fulfilled");
      toast({ title: "Prescription marked as fulfilled", description: "The patient has been notified." });
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Couldn't copy", description: "Select the text and copy it manually.", variant: "destructive" });
    }
  };

  const pendingPrescriptionCount = prescriptions.filter((p) => p.adminStatus === "pending").length;

  const urgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-green-100 text-green-800 border-green-200";
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">TeleMed Admin</span>
              </Link>
              <Badge variant="outline" className="ml-3 capitalize">
                {user.role === "superadmin" ? "Super Admin" : "Admin"}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Avatar>
                <AvatarFallback>{`${user.firstName[0] || ''}${user.lastName[0] || ''}`}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Platform Overview</h1>

        {/* Stats */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Users className="w-4 h-4 mr-2" />Patients
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{overview.totalPatients}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Stethoscope className="w-4 h-4 mr-2" />Doctors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalDoctors}</div>
                {overview.pendingDoctors > 0 && (
                  <p className="text-xs text-yellow-600 mt-1">{overview.pendingDoctors} pending approval</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalAppointments}</div>
                <p className="text-xs text-gray-500 mt-1">{overview.appointmentsToday} today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nairaFormatter.format(overview.revenue)}</div>
                <p className="text-xs text-gray-500 mt-1">{overview.successfulPayments} payments</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="pending-doctors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="pending-doctors">
              Doctor Approvals{pendingDoctors.length > 0 && <Badge className="ml-2 bg-yellow-500">{pendingDoctors.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="reports">
              Recommendations{overview && overview.openReports > 0 && <Badge className="ml-2 bg-red-500">{overview.openReports}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="prescriptions">
              Prescriptions{pendingPrescriptionCount > 0 && <Badge className="ml-2 bg-red-500">{pendingPrescriptionCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="pending-doctors">
            <Card>
              <CardHeader>
                <CardTitle>Doctor Approvals</CardTitle>
                <CardDescription>
                  New doctor sign-ups awaiting review before they can go live
                  {!isSuperAdmin && " (view only - super admin access required to approve/reject)"}
                </CardDescription>
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
                            <AvatarFallback>{`${doctor.firstName[0]}${doctor.lastName[0]}`}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">Dr. {doctor.firstName} {doctor.lastName}</p>
                            <p className="text-sm text-gray-600">{doctor.specialization} • {doctor.email}</p>
                            <p className="text-xs text-gray-500">License: {doctor.medicalLicenseNumber} • {doctor.yearsOfExperience} yrs experience</p>
                          </div>
                        </div>
                        {isSuperAdmin ? (
                          <div className="flex space-x-2">
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
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Awaiting super admin
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>All Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allDoctors.map((doctor) => (
                    <div key={doctor._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Dr. {doctor.firstName} {doctor.lastName}</p>
                        <p className="text-xs text-gray-500">{doctor.specialization}</p>
                      </div>
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
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
          </TabsContent>

          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle>Prescriptions</CardTitle>
                <CardDescription>Prescriptions doctors have sent to the admin team for processing</CardDescription>
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
                                <Pill className="w-5 h-5 text-blue-600 mt-1" />
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
                                {rx.adminStatus}
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
                                {rx.adminStatus === "fulfilled" ? "Fulfilled" : "Rejected"}
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
                                  onClick={() => handleFulfillPrescription(rx._id)}
                                >
                                  {actingOnId === rx._id ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                  )}
                                  Mark Fulfilled
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
          </TabsContent>

          <TabsContent value="appointments">
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
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((u) => (
                    <div key={u._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                      <div>
                        <p className="font-medium">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{u.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
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
          </TabsContent>

          <TabsContent value="payments">
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
          </TabsContent>
        </Tabs>
      </div>

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
    </div>
  );
};

export default AdminDashboard;
