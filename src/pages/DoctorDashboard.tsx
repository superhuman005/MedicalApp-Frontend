import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { RefShell, type RefNavItem } from "@/components/RefShell";
import { RefAvatar, Card as RefCard } from "@/components/ui-ref";
import {
  CalendarDays, Clock, LogOut, Loader2, ClipboardList,
  Wallet, BarChart3, AlertTriangle, UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "@/components/NotificationBell";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DoctorEarnings from "@/components/DoctorEarnings";
import DoctorProfile from "@/components/DoctorProfile";
import ConsultationRequests from "@/components/ConsultationRequests";
import DoctorAIAssistant from "@/components/DoctorAIAssistant";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/services/api";
import { getMyAppointments, updateAppointmentStatus, cancelAppointment } from "@/services/appointments";
import { QuestionnaireButton, QuestionnaireSummary } from "@/components/QuestionnaireView";
import { updateMyDoctorStatus, updateMyDoctorProfile, getMyPatients } from "@/services/doctors";
import type { Appointment, DoctorStatus, DoctorPatient } from "@/types";

// Doctor workspace emphasis color - indigo, distinct from the patient app's
// teal and the admin console's sky blue, matching the reference design's
// per-role accent convention.
const ACCENT = "#5b5bd6";

type SectionKey = "requests" | "appointments" | "patients" | "ai-assist" | "earnings" | "analytics";

const SECTION_COPY: Record<SectionKey, { title: string; subtitle: string }> = {
  requests: { title: "Requests", subtitle: "Patients waiting for a doctor" },
  appointments: { title: "Today's Schedule", subtitle: "Your appointments for today" },
  patients: { title: "Patient Records", subtitle: "Everyone you've treated" },
  "ai-assist": { title: "AI Assistant", subtitle: "A clinical co-pilot for your own reference" },
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
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // Patients this doctor has actually treated - not every patient on the
  // platform. Backed by GET /api/doctors/me/patients, which only counts
  // confirmed/in-progress/completed appointments (not merely-requested or
  // cancelled ones), matching exactly what the backend will actually let
  // this doctor open records for.
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);

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

  const loadPatients = useCallback(async () => {
    try {
      const data = await getMyPatients();
      setPatients(data);
    } catch (error) {
      toast({
        title: "Couldn't load patients",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoadingPatients(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAppointments();
    loadPatients();
  }, [loadAppointments, loadPatients]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileUpdate = async (updates: {
    bio?: string;
    specialization?: string;
    yearsOfExperience?: number;
    avatar?: string;
    gender?: "male" | "female" | "other" | "";
    dateOfBirth?: string;
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

  // Approve or decline a booking the patient made for a future/current slot.
  // The doctor can read the patient's questionnaire before deciding.
  const handleRespondToBooking = async (appointment: Appointment, decision: "confirmed" | "cancelled") => {
    setRespondingId(appointment._id);
    try {
      if (decision === "confirmed") {
        await updateAppointmentStatus(appointment._id, "confirmed");
      } else {
        await cancelAppointment(appointment._id, "Declined by doctor");
      }
      toast({ title: decision === "confirmed" ? "Appointment confirmed" : "Appointment declined" });
      await loadAppointments();
    } catch (error) {
      toast({ title: "Couldn't update appointment", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setRespondingId(null);
    }
  };

  const today = new Date();
  const pendingBookings = appointments.filter((a) => a.status === "pending");
  const todayAppointments = appointments.filter((a) => isSameDay(new Date(a.date), today));
  const waitingCount = todayAppointments.filter((a) => a.status === 'waiting').length;
  const thisMonthAppointments = appointments.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && a.status !== 'cancelled';
  });

  const NAV_ITEMS: RefNavItem[] = [
    { id: "requests", label: "Requests", icon: "folder", badge: waitingCount || undefined },
    { id: "appointments", label: "Today's Schedule", icon: "calendar" },
    { id: "patients", label: "Patient Records", icon: "clip" },
    { id: "ai-assist", label: "AI Assistant", icon: "sparkle" },
    { id: "earnings", label: "Earnings", icon: "wallet" },
    { id: "analytics", label: "Analytics", icon: "activity" },
  ];

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <RefShell
      nav={NAV_ITEMS}
      active={activeTab}
      onNav={(id) => setActiveTab(id as SectionKey)}
      brand="TeleMed"
      tag="Clinician"
      accent={ACCENT}
      user={{
        name: `Dr. ${user.firstName} ${user.lastName}`,
        role: user.specialization || "General Practice",
        photo: user.avatar,
      }}
      title={SECTION_COPY[activeTab].title}
      subtitle={SECTION_COPY[activeTab].subtitle}
      mobileIds={["requests", "appointments", "patients", "analytics"]}
      actions={
        <>
          <NotificationBell />
          <Link to={`/doctors/${user._id}`}>
            <Button variant="ghost" size="icon" aria-label="Your profile">
              <UserRound className="w-[18px] h-[18px]" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" aria-label="Log out" onClick={handleLogout}>
            <LogOut className="w-[18px] h-[18px]" />
          </Button>
        </>
      }
    >
      <div className="space-y-6 anim-rise">
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
            <div className="mt-4 flex items-start space-x-3 rounded-xl border border-warn/30 bg-warnsoft p-4">
              <Clock className="w-5 h-5 text-warn mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-warn">Your account is awaiting admin approval</p>
                <p className="text-sm text-warn/80 mt-1">
                  You can complete your profile in the meantime, but you won't be able to go online or accept
                  patients until an admin reviews and approves your account.
                </p>
              </div>
            </div>
          )}
          {user.doctorApprovalStatus === "rejected" && (
            <div className="mt-4 flex items-start space-x-3 rounded-xl border border-destructive/30 bg-dangersoft p-4">
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

        {/* Stats Cards - exact port of the reference's StatTile layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <RefCard>
            <p className="flex items-center gap-2 text-[12px] font-semibold text-[var(--c-muted)] mb-2">
              <CalendarDays className="w-3.5 h-3.5" />
              Today's Appointments
            </p>
            <p className="text-[25px] leading-none font-extrabold tracking-tight text-[var(--c-ink)]">{todayAppointments.length}</p>
          </RefCard>

          <RefCard className="bg-[var(--c-accentsoft)]/60">
            <p className="flex items-center gap-2 text-[12px] font-semibold text-[var(--c-muted)] mb-2">
              <Clock className="w-3.5 h-3.5" />
              Patients Waiting
            </p>
            <p className="text-[25px] leading-none font-extrabold tracking-tight text-[var(--c-ink)]">{waitingCount}</p>
          </RefCard>

          <RefCard>
            <p className="flex items-center gap-2 text-[12px] font-semibold text-[var(--c-muted)] mb-2">
              <ClipboardList className="w-3.5 h-3.5" />
              This Month
            </p>
            <p className="text-[25px] leading-none font-extrabold tracking-tight text-[var(--c-ink)]">{thisMonthAppointments.length}</p>
          </RefCard>

          <RefCard>
            <p className="flex items-center gap-2 text-[12px] font-semibold text-[var(--c-muted)] mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Patient Rating
            </p>
            <p className="text-[25px] leading-none font-extrabold tracking-tight text-[var(--c-ink)]">
              {user.rating && user.rating > 0 ? user.rating.toFixed(1) : '—'}
            </p>
          </RefCard>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab}>
          <TabsContent value="requests" className="mt-0">
            <ConsultationRequests />
          </TabsContent>

          <TabsContent value="appointments" className="mt-0">
            {pendingBookings.length > 0 && (
              <Card className="mb-6 border-l-4 border-l-warn">
                <CardHeader>
                  <CardTitle>Booking Requests</CardTitle>
                  <CardDescription>
                    {pendingBookings.length} appointment{pendingBookings.length === 1 ? '' : 's'} waiting for your confirmation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingBookings.map((appointment) => {
                    const displayName = appointment.familyMember
                      ? appointment.familyMember.name
                      : `${appointment.patient.firstName} ${appointment.patient.lastName}`;
                    return (
                      <div key={appointment._id} className="p-4 border border-border rounded-xl space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{displayName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(appointment.date).toLocaleDateString()} at {appointment.time} • {appointment.type}
                            </p>
                          </div>
                          <Badge variant="outline">{appointment.appointmentType}</Badge>
                        </div>
                        <QuestionnaireSummary questionnaire={appointment.questionnaire} />
                        <div className="flex justify-end space-x-2">
                          <QuestionnaireButton questionnaire={appointment.questionnaire} patientName={displayName} />
                          <Link
                            to={`/medical-records?patientId=${appointment.patient._id}${
                              appointment.familyMember ? `&familyMemberId=${appointment.familyMember._id}` : ''
                            }`}
                          >
                            <Button variant="outline" size="sm">
                              View Records
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-dangersoft"
                            disabled={respondingId === appointment._id}
                            onClick={() => handleRespondToBooking(appointment, "cancelled")}
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            disabled={respondingId === appointment._id}
                            onClick={() => handleRespondToBooking(appointment, "confirmed")}
                          >
                            {respondingId === appointment._id && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                            Confirm
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

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
                            <RefAvatar src={appointment.patient.avatar} name={displayName} size={44} />
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
                            <QuestionnaireButton questionnaire={appointment.questionnaire} patientName={displayName} />
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
            {isLoadingPatients ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : patients.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  You haven't seen any patients yet. Once you confirm an appointment, they'll show up here.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {patients.map((p) => {
                  const displayName = p.familyMember ? p.familyMember.name : `${p.patient.firstName} ${p.patient.lastName}`;
                  return (
                    <Card key={`${p.patient._id}:${p.familyMember?._id || 'self'}`}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <RefAvatar src={p.familyMember?.avatar || p.patient.avatar} name={displayName} size={40} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-medium truncate">{displayName}</h3>
                                {p.familyMember && (
                                  <Badge variant="outline" className="text-xs">
                                    {p.familyMember.relationship} of {p.patient.firstName} {p.patient.lastName}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {p.appointmentCount} visit{p.appointmentCount === 1 ? '' : 's'} • Last:{' '}
                                {new Date(p.lastAppointmentDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Link
                            to={`/medical-records?patientId=${p.patient._id}${p.familyMember ? `&familyMemberId=${p.familyMember._id}` : ''}`}
                            className="shrink-0"
                          >
                            <Button variant="outline" size="sm">
                              View Records
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-assist" className="mt-0">
            <DoctorAIAssistant />
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
                        <Line type="monotone" dataKey="count" name="Consultations" stroke={ACCENT} strokeWidth={2} dot={{ fill: ACCENT }} />
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
    </RefShell>
  );
};

export default DoctorDashboard;
