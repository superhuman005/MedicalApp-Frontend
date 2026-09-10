import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Video, Users, Stethoscope, Calendar, DollarSign, AlertTriangle, LogOut, Loader2,
  CheckCircle2, XCircle, ClipboardList,
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
} from "@/services/admin";
import type { AdminOverview, User, Appointment, DoctorReportItem, Payment } from "@/types";

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
  const [isLoading, setIsLoading] = useState(true);
  const [actingOnId, setActingOnId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [overviewData, pendingData, doctorsData, appointmentsData, reportsData, usersData, paymentsData] =
        await Promise.all([
          getAdminOverview(),
          getPendingDoctors(),
          getAllDoctors(),
          getAllAppointments(),
          getAdminDoctorReports(),
          getUsers(),
          getAllPayments(),
        ]);
      setOverview(overviewData);
      setPendingDoctors(pendingData);
      setAllDoctors(doctorsData);
      setAppointments(appointmentsData);
      setReports(reportsData);
      setUsers(usersData);
      setPayments(paymentsData);
    } catch (error) {
      toast({ title: "Couldn't load admin data", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending-doctors">
              Doctor Approvals{pendingDoctors.length > 0 && <Badge className="ml-2 bg-yellow-500">{pendingDoctors.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="reports">
              Recommendations{overview && overview.openReports > 0 && <Badge className="ml-2 bg-red-500">{overview.openReports}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
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
    </div>
  );
};

export default AdminDashboard;
