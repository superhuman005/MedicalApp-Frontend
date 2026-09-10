import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Video, Calendar, FileText, Users, Clock, MessageSquare, LogOut, Bot, CreditCard, Loader2 } from "lucide-react";
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

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
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

  const handleStartConsultation = (type: 'video' | 'chat') => {
    setShowPatientSelector(true);
  };

  const upcomingAppointments = appointments
    .filter((a) => ["pending", "confirmed", "waiting", "in-progress"].includes(a.status))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextAppointment = upcomingAppointments[0];

  if (isLoading) {
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
                <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">TeleMed</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/book-appointment" className="hidden sm:block">
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="hidden md:inline">Book Appointment</span>
                  <span className="md:hidden">Book</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || '?'}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.firstName}!</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage your health consultations and appointments</p>
        </div>

        {/* Patient Selection Modal */}
        {showPatientSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Next Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              {nextAppointment ? (
                <>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {new Date(nextAppointment.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">Dr. {nextAppointment.doctor.lastName}</p>
                </>
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-bold text-gray-400">None</div>
                  <p className="text-xs sm:text-sm text-gray-500">No upcoming appointments</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Family Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{patients.length}</div>
              <p className="text-xs sm:text-sm text-gray-500">Under your account</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Consultations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{appointments.length}</div>
              <p className="text-xs sm:text-sm text-gray-500">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-orange-600 capitalize">{subscription?.plan || 'free'}</div>
              <p className="text-xs sm:text-sm text-gray-500 capitalize">{subscription?.status || 'active'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-max grid-cols-7 min-w-full sm:w-full">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3">
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Home</span>
              </TabsTrigger>
              <TabsTrigger value="request" className="text-xs sm:text-sm px-2 sm:px-3">
                <span className="hidden sm:inline">Request Care</span>
                <span className="sm:hidden">Request</span>
              </TabsTrigger>
              <TabsTrigger value="ai-chat" className="text-xs sm:text-sm px-2 sm:px-3">
                <Bot className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">AI Assistant</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="text-xs sm:text-sm px-2 sm:px-3">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden md:inline">Appointments</span>
                <span className="md:hidden">Appts</span>
              </TabsTrigger>
              <TabsTrigger value="records" className="text-xs sm:text-sm px-2 sm:px-3">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Records</span>
                <span className="sm:hidden">Files</span>
              </TabsTrigger>
              <TabsTrigger value="patients" className="text-xs sm:text-sm px-2 sm:px-3">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Patients</span>
                <span className="sm:hidden">Family</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="text-xs sm:text-sm px-2 sm:px-3">
                <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Subscription</span>
                <span className="sm:hidden">Plan</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Request Consultation</CardTitle>
                  <CardDescription className="text-sm">Send a request to available doctors for immediate care</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      className="w-full text-sm"
                      size="sm"
                      onClick={() => handleStartConsultation('video')}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Video Call
                    </Button>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-sm"
                      size="sm"
                      onClick={() => handleStartConsultation('chat')}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Doctors will be notified of your request and you'll be connected when one becomes available.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">AI Health Assistant</CardTitle>
                  <CardDescription className="text-sm">Get quick answers to your health questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-sm"
                    size="sm"
                    onClick={() => setIsChatbotOpen(true)}
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Chat with AI Assistant
                  </Button>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Ask questions about symptoms, medications, or general health information.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Subscription Status</CardTitle>
                  <CardDescription className="text-sm">Manage your plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm sm:text-base capitalize">{subscription?.plan || 'free'} Plan</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {subscription?.chatConsultationsUsed || 0} chat / {subscription?.videoConsultationsUsed || 0} video used
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">{subscription?.status || 'active'}</Badge>
                  </div>
                  <Button
                    className="w-full text-sm"
                    variant="outline"
                    onClick={() => setActiveTab("subscription")}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No upcoming appointments</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppointments.slice(0, 2).map((appointment) => (
                        <div key={appointment._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                          <div>
                            <p className="font-medium text-sm sm:text-base">Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</p>
                            <p className="text-xs sm:text-sm text-gray-600">
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

          <TabsContent value="request">
            <DoctorList
              selectedPatient={selectedPatient}
              onSelectPatient={() => setShowPatientSelector(true)}
              onRequestSent={loadDashboard}
            />
          </TabsContent>

          <TabsContent value="ai-chat">
            <AIChatbot selectedPatient={selectedPatient} />
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Your Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No appointments yet. <Link to="/book-appointment" className="text-blue-600 hover:underline">Book one now</Link>.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {appointments
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((appointment) => (
                        <div key={appointment._id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div>
                            <h3 className="font-semibold">Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</h3>
                            <p className="text-sm text-gray-600">{appointment.doctor.specialization}</p>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
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

          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle>Medical Records</CardTitle>
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
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentRecords.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-4">No records yet for {selectedPatient.name}</p>
                      ) : (
                        recentRecords.map((record) => (
                          <div key={record._id} className="flex justify-between items-center p-4 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{record.diagnosis || 'Consultation'}</h3>
                              <p className="text-sm text-gray-600">
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
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p>Please select a patient to view their medical records</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients">
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

          <TabsContent value="subscription">
            <PatientSubscription />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating AI Chatbot Button */}
      <Drawer open={isChatbotOpen} onOpenChange={setIsChatbotOpen} shouldScaleBackground={false}>
        <DrawerTrigger asChild>
          <Button
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg z-40"
            size="icon"
          >
            <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] sm:h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>AI Health Assistant</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 p-4">
            <AIChatbot selectedPatient={selectedPatient} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default PatientDashboard;
