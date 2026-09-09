import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, Calendar, FileText, Users, Clock, LogOut, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DoctorEarnings from "@/components/DoctorEarnings";
import DoctorProfile from "@/components/DoctorProfile";
import ConsultationRequests from "@/components/ConsultationRequests";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/services/api";
import { getMyAppointments, updateAppointmentStatus } from "@/services/appointments";
import { updateMyDoctorStatus, updateMyDoctorProfile } from "@/services/doctors";
import type { Appointment, DoctorStatus } from "@/types";

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAppointments = useCallback(async () => {
    try {
      const data = await getMyAppointments();
      setAppointments(data);
    } catch (error) {
      toast({
        title: "Couldn't load appointments",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileUpdate = async (updates: {
    bio?: string;
    specialization?: string;
    yearsOfExperience?: number;
    avatar?: string;
  }) => {
    try {
      const updated = await updateMyDoctorProfile(updates);
      updateUser(updated);
      toast({ title: "Profile updated" });
    } catch (error) {
      toast({ title: "Couldn't update profile", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const handleStatusChange = async (status: DoctorStatus) => {
    try {
      const updated = await updateMyDoctorStatus(status);
      updateUser(updated);
    } catch (error) {
      toast({ title: "Couldn't update status", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const handleStartCall = async (appointment: Appointment) => {
    try {
      if (appointment.status !== "in-progress") {
        await updateAppointmentStatus(appointment._id, "in-progress");
      }
      navigate(`/video-call?appointmentId=${appointment._id}&type=${appointment.type}`);
    } catch (error) {
      toast({ title: "Couldn't start call", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const today = new Date();
  const todayAppointments = appointments.filter((a) => isSameDay(new Date(a.date), today));
  const waitingCount = todayAppointments.filter((a) => a.status === 'waiting').length;
  const thisMonthAppointments = appointments.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && a.status !== 'cancelled';
  });

  // Distinct patients this doctor has seen, most recent visit first.
  const recentPatients = useMemo(() => {
    const map = new Map<string, { name: string; specialization?: string; lastVisit: string; patientId: string; familyMemberId?: string }>();
    appointments
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach((a) => {
        const key = `${a.patient._id}:${a.familyMember?._id || 'self'}`;
        if (!map.has(key)) {
          map.set(key, {
            name: a.familyMember ? a.familyMember.name : `${a.patient.firstName} ${a.patient.lastName}`,
            specialization: a.appointmentType,
            lastVisit: a.date,
            patientId: a.patient._id,
            familyMemberId: a.familyMember?._id,
          });
        }
      });
    return Array.from(map.values()).slice(0, 10);
  }, [appointments]);

  // Real 6-month consultation trend computed from actual appointments (not fabricated).
  const monthlyTrend = useMemo(() => {
    const months: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = d.toLocaleDateString(undefined, { month: 'short' });
      const count = appointments.filter((a) => {
        const ad = new Date(a.date);
        return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear() && a.status !== 'cancelled';
      }).length;
      months.push({ label, count });
    }
    return months;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments]);

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
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">TeleMed</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Avatar>
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{`${user.firstName[0]}${user.lastName[0]}`}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <DoctorProfile
            doctor={user}
            onProfileUpdate={handleProfileUpdate}
            onStatusChange={handleStatusChange}
          />
          <p className="text-gray-600 mt-2">
            You have {todayAppointments.length} appointment{todayAppointments.length === 1 ? '' : 's'} scheduled for today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{todayAppointments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Patients Waiting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{waitingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{thisMonthAppointments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Patient Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {user.rating && user.rating > 0 ? user.rating.toFixed(1) : '—'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="appointments">Today's Schedule</TabsTrigger>
            <TabsTrigger value="patients">Patient Records</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <ConsultationRequests />
          </TabsContent>

          <TabsContent value="appointments">
            {todayAppointments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-gray-500">
                  No appointments scheduled for today.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => {
                  const displayName = appointment.familyMember
                    ? appointment.familyMember.name
                    : `${appointment.patient.firstName} ${appointment.patient.lastName}`;
                  const canJoin = ["confirmed", "waiting", "in-progress"].includes(appointment.status);
                  return (
                    <Card key={appointment._id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={appointment.patient.avatar} />
                              <AvatarFallback>
                                {displayName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg">{displayName}</h3>
                              <p className="text-gray-600">{appointment.appointmentType}</p>
                              <div className="flex items-center mt-1 text-sm text-gray-500">
                                <Clock className="w-4 h-4 mr-1" />
                                {appointment.time}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant={appointment.status === 'waiting' ? 'destructive' : 'outline'}
                              className={appointment.status === 'waiting' ? '' : 'text-blue-600 border-blue-600'}
                            >
                              {appointment.status}
                            </Badge>
                            <Button disabled={!canJoin} onClick={() => handleStartCall(appointment)}>
                              {appointment.status === 'waiting' ? 'Start Call' : canJoin ? 'Join Call' : 'Not Ready'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="patients">
            {recentPatients.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-gray-500">
                  You haven't seen any patients yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <Card key={`${patient.patientId}:${patient.familyMemberId || 'self'}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{patient.name}</h3>
                          <p className="text-gray-600">Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</p>
                        </div>
                        <Link
                          to={`/medical-records?patientId=${patient.patientId}${patient.familyMemberId ? `&familyMemberId=${patient.familyMemberId}` : ''}`}
                        >
                          <Button variant="outline" size="sm">
                            View Records
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="earnings">
            <DoctorEarnings />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Consultations</CardTitle>
                  <CardDescription>Patient visits over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" name="Consultations" stroke="#2563eb" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Overall Rating</CardTitle>
                  <CardDescription>Based on patient feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  {user.rating && user.rating > 0 ? (
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-bold">{user.rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-500">
                        based on {user.ratingCount || 0} review{user.ratingCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-6 text-center">No patient reviews yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorDashboard;
