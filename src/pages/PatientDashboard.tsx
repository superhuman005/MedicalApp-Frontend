import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { RefShell, type RefNavItem } from "@/components/RefShell";
import { RefAvatar, RefBadge, RefButton, Card as RefCard } from "@/components/ui-ref";
import { Icon } from "@/components/Icon";
import {
  Video, CalendarDays, FileText, Users, Clock, MessageSquare, LogOut,
  CreditCard, Loader2, Stethoscope, LayoutGrid, ChevronRight, UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "@/components/NotificationBell";
import PatientSubscription from "@/components/PatientSubscription";
import PatientSelector from "@/components/PatientSelector";
import PatientManagement from "@/components/PatientManagement";
import DoctorList from "@/components/DoctorList";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/services/api";
import {
  getFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  FamilyMemberInput,
} from "@/services/familyMembers";
import { getMyAppointments } from "@/services/appointments";
import { getCurrentSubscription } from "@/services/subscriptions";
import { getConsultations } from "@/services/medicalRecords";
import type { FamilyMember, Appointment, Subscription, SubscriptionLimits, ConsultationRecord } from "@/types";

// This dashboard's own emphasis color (teal, same as the app-wide brand
// primary) - passed to RefShell for nav highlights. Doctor and admin
// use their own accent hex so the three workspaces read as distinct roles.
const ACCENT = "#0d9488";

type SectionKey = "overview" | "request" | "appointments" | "records" | "patients" | "subscription";

const NAV_ITEMS: RefNavItem[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "request", label: "Request Care", icon: "stethoscope" },
  { id: "appointments", label: "Appointments", icon: "calendar" },
  { id: "records", label: "Records", icon: "file" },
  { id: "patients", label: "Patients", icon: "user" },
  { id: "subscription", label: "Subscription", icon: "wallet" },
];

const SECTION_COPY: Record<SectionKey, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "A quick look at your care" },
  request: { title: "Request Care", subtitle: "Get matched with an available doctor" },
  appointments: { title: "Appointments", subtitle: "Everything you've booked" },
  records: { title: "Medical Records", subtitle: "Your family's health history" },
  patients: { title: "Patients", subtitle: "Manage who's covered on your account" },
  subscription: { title: "Subscription", subtitle: "Plan, usage, and billing" },
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<SectionKey>("overview");
  const [selectedPatient, setSelectedPatient] = useState<FamilyMember | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);

  const [patients, setPatients] = useState<FamilyMember[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [recentRecords, setRecentRecords] = useState<ConsultationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const [patientsData, appointmentsData, subData] = await Promise.all([
        getFamilyMembers(),
        getMyAppointments(),
        getCurrentSubscription(),
      ]);
      setPatients(patientsData);
      setAppointments(appointmentsData);
      setSubscription(subData.subscription);
      setLimits(subData.limits);
      setSelectedPatient((prev) => prev || patientsData.find((p) => p.isSelf) || patientsData[0] || null);
    } catch (error) {
      toast({
        title: "Couldn't load your dashboard",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Load recent records for the selected patient whenever it changes (records tab)
  useEffect(() => {
    if (!selectedPatient) return;
    setRecordsLoading(true);
    getConsultations({ familyMemberId: selectedPatient.isSelf ? undefined : selectedPatient._id })
      .then((data) => setRecentRecords(data.slice(0, 3)))
      .catch(() => setRecentRecords([]))
      .finally(() => setRecordsLoading(false));
  }, [selectedPatient]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAddPatient = async (input: FamilyMemberInput) => {
    try {
      const created = await addFamilyMember(input);
      setPatients((prev) => [...prev, created]);
      toast({ title: "Patient added", description: `${created.name} has been added.` });
    } catch (error) {
      toast({ title: "Couldn't add patient", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const handleEditPatient = async (id: string, input: Partial<FamilyMemberInput>) => {
    try {
      const updated = await updateFamilyMember(id, input);
      setPatients((prev) => prev.map((p) => (p._id === id ? updated : p)));
      if (selectedPatient?._id === id) setSelectedPatient(updated);
      toast({ title: "Patient updated" });
    } catch (error) {
      toast({ title: "Couldn't update patient", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const handleDeletePatient = async (id: string) => {
    try {
      await deleteFamilyMember(id);
      setPatients((prev) => prev.filter((p) => p._id !== id));
      if (selectedPatient?._id === id) setSelectedPatient(null);
      toast({ title: "Patient removed" });
    } catch (error) {
      toast({ title: "Couldn't remove patient", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const handlePatientSelected = (patient: FamilyMember) => {
    setSelectedPatient(patient);
  };

  const handleStartConsultation = (_type: 'video' | 'chat') => {
    setShowPatientSelector(true);
  };

  const upcomingAppointments = appointments
    .filter((a) => ["pending", "confirmed", "waiting", "in-progress"].includes(a.status))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextAppointment = upcomingAppointments[0];
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || '?';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <RefShell
        nav={NAV_ITEMS}
        active={activeTab}
        onNav={(id) => setActiveTab(id as SectionKey)}
        brand="TeleMed"
        tag="Patient"
        accent={ACCENT}
        user={{ name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Patient", role: `${subscription?.plan || "free"} plan`, photo: user?.avatar }}
        title={SECTION_COPY[activeTab].title}
        subtitle={SECTION_COPY[activeTab].subtitle}
        mobileIds={["overview", "request", "appointments", "records", "subscription"]}
        actions={
          <>
            <Link to="/book-appointment">
              <Button size="sm">
                <CalendarDays className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Book Appointment</span>
              </Button>
            </Link>
            <NotificationBell />
            <Link to="/profile">
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
        {/* Patient Selection Modal */}
        {showPatientSelector && (
          <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-border">
              <PatientSelector
                patients={patients}
                onPatientSelect={handlePatientSelected}
                selectedPatient={selectedPatient}
              />
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowPatientSelector(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => { setShowPatientSelector(false); setActiveTab("request"); }}
                  disabled={!selectedPatient}
                  className="w-full sm:w-auto"
                >
                  Continue to Consultation
                </Button>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} className="space-y-6">
          <TabsContent value="overview" className="mt-0 space-y-6 anim-rise">
            {/* Hero: next appointment - exact port of the reference's NextVisit card */}
            <RefCard pad={false} className="relative overflow-hidden border-transparent bg-[linear-gradient(135deg,#0b3b3a_0%,#0d5a52_45%,#124f62_100%)] text-white">
              <div className="grain absolute inset-0 opacity-60" />
              <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[var(--c-brand)]/25 blur-3xl" />
              <div className="relative p-6">
                {nextAppointment ? (
                  <>
                    <RefBadge className="border border-white/15 bg-white/10 text-white/90" dot="#4ade80">Next appointment</RefBadge>
                    <div className="mt-5 flex flex-wrap items-center gap-4">
                      <RefAvatar name={`Dr. ${nextAppointment.doctor.firstName} ${nextAppointment.doctor.lastName}`} size={62} className="ring-2 ring-white/25" />
                      <div className="min-w-0">
                        <h2 className="truncate text-[21px] leading-tight font-extrabold tracking-tight">
                          Dr. {nextAppointment.doctor.firstName} {nextAppointment.doctor.lastName}
                        </h2>
                        <p className="text-[13px] text-white/70">
                          {nextAppointment.doctor.specialization} · {new Date(nextAppointment.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} at {nextAppointment.time}
                        </p>
                      </div>
                      {["confirmed", "waiting", "in-progress"].includes(nextAppointment.status) && (
                        <Link to={`/video-call?appointmentId=${nextAppointment._id}&type=${nextAppointment.type}`} className="ml-auto">
                          <RefButton className="bg-white text-[#0b3b3a] shadow-none hover:bg-white/90">
                            <Icon name="video" className="h-4 w-4" /> Join visit
                          </RefButton>
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <RefBadge className="border border-white/15 bg-white/10 text-white/90">No upcoming visits</RefBadge>
                    <h2 className="mt-4 text-[21px] font-extrabold tracking-tight">Your schedule is clear</h2>
                    <p className="mt-1 text-[13px] text-white/70">Book a visit or send a care request whenever you need one.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <RefButton className="bg-white text-[#0b3b3a] shadow-none hover:bg-white/90" onClick={() => setActiveTab("request")}>
                        <Icon name="stethoscope" className="h-4 w-4" /> Request care
                      </RefButton>
                      <Link to="/book-appointment">
                        <RefButton variant="ghost" className="border border-white/20 text-white hover:bg-white/10 hover:text-white">
                          <Icon name="calendar" className="h-4 w-4" /> Book appointment
                        </RefButton>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </RefCard>

            {/* Quick Stats - exact port of the reference's StatTile card */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <RefCard>
                <p className="truncate text-[12px] font-semibold text-[var(--c-muted)]">Upcoming</p>
                <p className="mt-1 text-[25px] leading-none font-extrabold tracking-tight text-[var(--c-ink)]">{upcomingAppointments.length}</p>
                <p className="mt-2 text-[11.5px] text-[var(--c-muted)]">Scheduled visits</p>
              </RefCard>

              <RefCard>
                <p className="truncate text-[12px] font-semibold text-[var(--c-muted)]">Family Members</p>
                <p className="mt-1 text-[25px] leading-none font-extrabold tracking-tight text-[var(--c-ink)]">{patients.length}</p>
                <p className="mt-2 text-[11.5px] text-[var(--c-muted)]">Under your account</p>
              </RefCard>

              <RefCard>
                <p className="truncate text-[12px] font-semibold text-[var(--c-muted)]">Consultations</p>
                <p className="mt-1 text-[25px] leading-none font-extrabold tracking-tight text-[var(--c-ink)]">{appointments.length}</p>
                <p className="mt-2 text-[11.5px] text-[var(--c-muted)]">All time</p>
              </RefCard>

              <RefCard className="bg-[var(--c-accentsoft)]/60">
                <p className="truncate text-[12px] font-semibold text-[var(--c-muted)]">Current Plan</p>
                <p className="mt-1 text-[25px] leading-none font-extrabold tracking-tight text-[var(--c-ink)] capitalize">{subscription?.plan || 'free'}</p>
                <p className="mt-2 text-[11.5px] text-[var(--c-muted)] capitalize">{subscription?.status || 'active'}</p>
              </RefCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">Request Consultation</CardTitle>
                  <CardDescription>Send a request to available doctors for immediate care</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      className="w-full"
                      onClick={() => handleStartConsultation('video')}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Video Call
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleStartConsultation('chat')}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Doctors will be notified of your request and you'll be connected when one becomes available.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">Subscription Status</CardTitle>
                  <CardDescription>Manage your plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                    <div>
                      <p className="font-medium text-sm capitalize">{subscription?.plan || 'free'} Plan</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription?.chatConsultationsUsed || 0} chat / {subscription?.videoConsultationsUsed || 0} video used
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">{subscription?.status || 'active'}</Badge>
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setActiveTab("subscription")}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-display text-lg">Upcoming Appointments</CardTitle>
                  </div>
                  {upcomingAppointments.length > 0 && (
                    <button
                      onClick={() => setActiveTab("appointments")}
                      className="text-xs text-primary hover:underline flex items-center gap-0.5"
                    >
                      View all <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming appointments</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppointments.slice(0, 2).map((appointment) => (
                        <div key={appointment._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-secondary rounded-xl space-y-2 sm:space-y-0">
                          <div>
                            <p className="font-medium text-sm">Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                            </p>
                          </div>
                          <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                            {appointment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="request" className="mt-0 anim-rise">
            <DoctorList
              selectedPatient={selectedPatient}
              onSelectPatient={() => setShowPatientSelector(true)}
              onRequestSent={loadDashboard}
            />
          </TabsContent>

          <TabsContent value="appointments" className="mt-0 anim-rise">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Your Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No appointments yet. <Link to="/book-appointment" className="text-primary hover:underline">Book one now</Link>.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {appointments
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((appointment) => (
                        <div key={appointment._id} className="flex justify-between items-center p-4 rounded-xl border border-border">
                          <div className="flex items-center gap-3">
                            <RefAvatar name={`Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`} size={38} />
                            <div>
                              <h3 className="font-medium">Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</h3>
                              <p className="text-sm text-muted-foreground">{appointment.doctor.specialization}</p>
                              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4 mr-1" />
                                {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                              {appointment.status}
                            </Badge>
                            {["confirmed", "waiting", "in-progress"].includes(appointment.status) && (
                              <Link to={`/video-call?appointmentId=${appointment._id}&type=${appointment.type}`}>
                                <Button size="sm">Join</Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="mt-0 anim-rise">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Medical Records</CardTitle>
                <CardDescription>Access health history and documents for your family members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <PatientSelector
                    patients={patients}
                    onPatientSelect={setSelectedPatient}
                    selectedPatient={selectedPatient}
                  />
                </div>

                {selectedPatient ? (
                  recordsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentRecords.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">No records yet for {selectedPatient.name}</p>
                      ) : (
                        recentRecords.map((record) => (
                          <div key={record._id} className="flex justify-between items-center p-4 rounded-xl border border-border">
                            <div>
                              <h3 className="font-medium">{record.diagnosis || 'Consultation'}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(record.date).toLocaleDateString()} - Dr. {record.doctor.firstName} {record.doctor.lastName}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div className="text-center mt-6">
                        <Link to={`/medical-records?familyMemberId=${selectedPatient._id}`}>
                          <Button>
                            <FileText className="w-4 h-4 mr-2" />
                            View All Records for {selectedPatient.name}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p>Please select a patient to view their medical records</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="mt-0 anim-rise">
            <PatientManagement
              patients={patients}
              onAdd={handleAddPatient}
              onEdit={handleEditPatient}
              onDelete={handleDeletePatient}
              canAddMore={!limits || patients.length < limits.familyMemberLimit}
              familyMemberLimit={limits?.familyMemberLimit || 1}
              currentPlan={subscription?.plan || "free"}
              onUpgradeClick={() => setActiveTab("subscription")}
            />
          </TabsContent>

          <TabsContent value="subscription" className="mt-0 anim-rise">
            <PatientSubscription />
          </TabsContent>
        </Tabs>
      </RefShell>
    </>
  );
};

export default PatientDashboard;
