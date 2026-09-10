import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
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
  Video, CalendarDays, FileText, Users, Clock, MessageSquare, LogOut, Bot,
  CreditCard, Loader2, Stethoscope, LayoutGrid, ChevronRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PatientSubscription from "@/components/PatientSubscription";
import PatientSelector from "@/components/PatientSelector";
import PatientManagement from "@/components/PatientManagement";
import DoctorList from "@/components/DoctorList";
import AIChatbot from "@/components/AIChatbot";
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

type SectionKey = "overview" | "request" | "ai-chat" | "appointments" | "records" | "patients" | "subscription";

const NAV_ITEMS: { key: SectionKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "request", label: "Request Care", icon: Stethoscope },
  { key: "ai-chat", label: "AI Assistant", icon: Bot },
  { key: "appointments", label: "Appointments", icon: CalendarDays },
  { key: "records", label: "Records", icon: FileText },
  { key: "patients", label: "Patients", icon: Users },
  { key: "subscription", label: "Subscription", icon: CreditCard },
];

const SECTION_COPY: Record<SectionKey, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "A quick look at your care" },
  request: { title: "Request Care", subtitle: "Get matched with an available doctor" },
  "ai-chat": { title: "AI Assistant", subtitle: "Ask about symptoms or medications" },
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
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

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
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-sidebar-foreground/60 capitalize truncate">
                  {subscription?.plan || 'free'} plan
                </p>
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
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link to="/book-appointment">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <CalendarDays className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Book Appointment</span>
              </Button>
            </Link>
            <Avatar className="w-8 h-8 md:hidden">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="flex-1 px-4 sm:px-6 py-6">
          {/* Patient Selection Modal */}
          {showPatientSelector && (
            <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg border">
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
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="border-none shadow-none bg-secondary/60">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Next Appointment
                    </div>
                    {nextAppointment ? (
                      <>
                        <div className="text-xl font-display font-semibold text-foreground">
                          {new Date(nextAppointment.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Dr. {nextAppointment.doctor.lastName}</p>
                      </>
                    ) : (
                      <>
                        <div className="text-xl font-display font-semibold text-muted-foreground">None</div>
                        <p className="text-xs text-muted-foreground mt-0.5">Nothing scheduled</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-none bg-secondary/60">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
                      <Users className="w-3.5 h-3.5" />
                      Family Members
                    </div>
                    <div className="text-xl font-display font-semibold text-foreground">{patients.length}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">Under your account</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-none bg-secondary/60">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
                      <Stethoscope className="w-3.5 h-3.5" />
                      Consultations
                    </div>
                    <div className="text-xl font-display font-semibold text-foreground">{appointments.length}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">All time</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-none bg-accent/15">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
                      <CreditCard className="w-3.5 h-3.5" />
                      Current Plan
                    </div>
                    <div className="text-xl font-display font-semibold text-foreground capitalize">{subscription?.plan || 'free'}</div>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{subscription?.status || 'active'}</p>
                  </CardContent>
                </Card>
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
                    <CardTitle className="font-display text-lg">AI Health Assistant</CardTitle>
                    <CardDescription>Get quick answers to your health questions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setIsChatbotOpen(true)}
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      Chat with AI Assistant
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Ask questions about symptoms, medications, or general health information.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Subscription Status</CardTitle>
                    <CardDescription>Manage your plan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-secondary/60 rounded-lg">
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
                          <div key={appointment._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-secondary/60 rounded-lg space-y-2 sm:space-y-0">
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

            <TabsContent value="request" className="mt-0">
              <DoctorList
                selectedPatient={selectedPatient}
                onSelectPatient={() => setShowPatientSelector(true)}
                onRequestSent={loadDashboard}
              />
            </TabsContent>

            <TabsContent value="ai-chat" className="mt-0">
              <AIChatbot selectedPatient={selectedPatient} />
            </TabsContent>

            <TabsContent value="appointments" className="mt-0">
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
                          <div key={appointment._id} className="flex justify-between items-center p-4 rounded-lg border">
                            <div>
                              <h3 className="font-medium">Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</h3>
                              <p className="text-sm text-muted-foreground">{appointment.doctor.specialization}</p>
                              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4 mr-1" />
                                {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
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

            <TabsContent value="records" className="mt-0">
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
                            <div key={record._id} className="flex justify-between items-center p-4 rounded-lg border">
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

            <TabsContent value="patients" className="mt-0">
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

            <TabsContent value="subscription" className="mt-0">
              <PatientSubscription />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>

      {/* Floating AI Chatbot Button */}
      <Drawer open={isChatbotOpen} onOpenChange={setIsChatbotOpen} shouldScaleBackground={false}>
        <DrawerTrigger asChild>
          <Button
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg z-40 bg-accent hover:bg-accent/90 text-accent-foreground"
            size="icon"
          >
            <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] sm:h-[80vh]">
          <DrawerHeader>
            <DrawerTitle className="font-display">AI Health Assistant</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 p-4">
            <AIChatbot selectedPatient={selectedPatient} />
          </div>
        </DrawerContent>
      </Drawer>
    </SidebarProvider>
  );
};

export default PatientDashboard;
