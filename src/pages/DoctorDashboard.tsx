import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Video, CalendarDays, Users, Clock, LogOut, Loader2, Inbox, ClipboardList,
  Wallet, BarChart3, AlertTriangle,
} from "lucide-react";
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

type SectionKey = "requests" | "appointments" | "patients" | "earnings" | "analytics";

const NAV_ITEMS: { key: SectionKey; label: string; icon: typeof Inbox }[] = [
  { key: "requests", label: "Requests", icon: Inbox },
  { key: "appointments", label: "Today's Schedule", icon: CalendarDays },
  { key: "patients", label: "Patient Records", icon: ClipboardList },
  { key: "earnings", label: "Earnings", icon: Wallet },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
];

const SECTION_COPY: Record<SectionKey, { title: string; subtitle: string }> = {
  requests: { title: "Requests", subtitle: "Patients waiting for a doctor" },
  appointments: { title: "Today's Schedule", subtitle: "Your appointments for today" },
  patients: { title: "Patient Records", subtitle: "Everyone you've treated" },
  earnings: { title: "Earnings", subtitle: "Your consultations and payouts" },
  analytics: { title: "Analytics", subtitle: "Trends and patient feedback" },
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<SectionKey>("requests");
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
    consultationFee?: { video?: number; chat?: number };
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

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || '?';

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-sidebar-border">
        <SidebarHeader className="px-3 py-4">
          <Link to="/" className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center shrink-0">
              <Video className="w-[18px] h-[18px] text-sidebar-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-sidebar-foreground text-lg tracking-tight group-data-[collapsible=icon]:hidden">
              TeleMed
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={activeTab === item.key}
                      onClick={() => setActiveTab(item.key)}
                      tooltip={item.label}
                      className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium relative data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:bottom-1.5 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary"
                    >
                      <item.icon className="shrink-0" />
                      <span>{item.label}</span>
                      {item.key === "requests" && waitingCount > 0 && (
                        <Badge className="ml-auto bg-accent text-accent-foreground hover:bg-accent group-data-[collapsible=icon]:hidden">
                          {waitingCount}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="px-2 pb-3">
          <div className="rounded-lg bg-sidebar-accent/60 p-3 mb-2 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-sidebar-background ${
                    user.status === 'online' || user.status === 'available'
                      ? 'bg-emerald-500'
                      : user.status === 'busy'
                      ? 'bg-amber-500'
                      : 'bg-sidebar-foreground/30'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  Dr. {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user.specialization || 'General Practice'}</p>
              </div>
            </div>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                <LogOut className="shrink-0" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-card/80 backdrop-blur px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger className="md:hidden" />
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-lg sm:text-xl text-foreground truncate">
                {SECTION_COPY[activeTab].title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
                {SECTION_COPY[activeTab].subtitle}
              </p>
            </div>
          </div>
          <Avatar className="w-8 h-8 md:hidden shrink-0">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </header>

        <div className="flex-1 px-4 sm:px-6 py-6 space-y-6">
          {/* Profile + approval status - persistent context above every section */}
          <div>
            <DoctorProfile
              doctor={user}
              onProfileUpdate={handleProfileUpdate}
              onStatusChange={handleStatusChange}
            />
            <p className="text-muted-foreground mt-2 text-sm">
              You have {todayAppointments.length} appointment{todayAppointments.length === 1 ? '' : 's'} scheduled for today
            </p>

            {user.doctorApprovalStatus === "pending" && (
              <div className="mt-4 flex items-start space-x-3 rounded-lg border border-amber-300/60 bg-amber-500/10 p-4">
                <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-900">Your account is awaiting admin approval</p>
                  <p className="text-sm text-amber-700/90 mt-1">
                    You can complete your profile in the meantime, but you won't be able to go online or accept
                    patients until an admin reviews and approves your account.
                  </p>
                </div>
              </div>
            )}
            {user.doctorApprovalStatus === "rejected" && (
              <div className="mt-4 flex items-start space-x-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-destructive">Your application wasn't approved</p>
                  <p className="text-sm text-destructive/80 mt-1">
                    {user.approvalNote || "Please contact support for more information."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border-none shadow-none bg-secondary/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Today's Appointments
                </div>
                <div className="text-xl font-display font-semibold text-foreground">{todayAppointments.length}</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-none bg-accent/15">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  Patients Waiting
                </div>
                <div className="text-xl font-display font-semibold text-foreground">{waitingCount}</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-none bg-secondary/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
                  <ClipboardList className="w-3.5 h-3.5" />
                  This Month
                </div>
                <div className="text-xl font-display font-semibold text-foreground">{thisMonthAppointments.length}</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-none bg-secondary/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Patient Rating
                </div>
                <div className="text-xl font-display font-semibold text-foreground">
                  {user.rating && user.rating > 0 ? user.rating.toFixed(1) : '—'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab}>
            <TabsContent value="requests" className="mt-0">
              <ConsultationRequests />
            </TabsContent>

            <TabsContent value="appointments" className="mt-0">
              {todayAppointments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    No appointments scheduled for today.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {todayAppointments.map((appointment) => {
                    const displayName = appointment.familyMember
                      ? appointment.familyMember.name
                      : `${appointment.patient.firstName} ${appointment.patient.lastName}`;
                    const canJoin = ["confirmed", "waiting", "in-progress"].includes(appointment.status);
                    return (
                      <Card key={appointment._id}>
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Avatar className="w-11 h-11">
                                <AvatarImage src={appointment.patient.avatar} />
                                <AvatarFallback>
                                  {displayName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium">{displayName}</h3>
                                <p className="text-sm text-muted-foreground">{appointment.appointmentType}</p>
                                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                  <Clock className="w-3.5 h-3.5 mr-1" />
                                  {appointment.time}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge
                                variant={appointment.status === 'waiting' ? 'destructive' : 'outline'}
                                className={appointment.status === 'waiting' ? '' : 'text-primary border-primary/30'}
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

            <TabsContent value="patients" className="mt-0">
              {recentPatients.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    You haven't seen any patients yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {recentPatients.map((patient) => (
                    <Card key={`${patient.patientId}:${patient.familyMemberId || 'self'}`}>
                      <CardContent className="p-5">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{patient.name}</h3>
                            <p className="text-sm text-muted-foreground">Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</p>
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

            <TabsContent value="earnings" className="mt-0">
              <DoctorEarnings />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Monthly Consultations</CardTitle>
                    <CardDescription>Patient visits over the last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis allowDecimals={false} domain={[0, (max: number) => Math.max(max, 4)]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 'var(--radius)',
                              fontSize: 13,
                            }}
                          />
                          <Line type="monotone" dataKey="count" name="Consultations" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Overall Rating</CardTitle>
                    <CardDescription>Based on patient feedback</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user.rating && user.rating > 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-4xl font-display font-semibold">{user.rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          based on {user.ratingCount || 0} review{user.ratingCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-6 text-center">No patient reviews yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DoctorDashboard;
