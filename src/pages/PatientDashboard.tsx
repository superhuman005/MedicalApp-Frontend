import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Video, Calendar, FileText, Users, Clock, MessageSquare, Phone, LogOut, Bot, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PatientSubscription from "@/components/PatientSubscription";
import PatientSelector from "@/components/PatientSelector";
import PatientManagement from "@/components/PatientManagement";
import DoctorList from "@/components/DoctorList";
import AIChatbot from "@/components/AIChatbot";

interface Patient {
  id: string;
  name: string;
  relationship: string;
  age?: number;
  avatar?: string;
}

const PatientDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userType');
    navigate('/login');
  };

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [pendingConsultationType, setPendingConsultationType] = useState<'video' | 'chat' | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([
    {
      id: "1",
      name: "John Smith (You)",
      relationship: "self",
      age: 35,
      avatar: "/placeholder.svg"
    },
    {
      id: "2",
      name: "Emma Smith",
      relationship: "daughter",
      age: 8,
      avatar: "/placeholder.svg"
    },
    {
      id: "3",
      name: "Michael Smith",
      relationship: "son",
      age: 12,
      avatar: "/placeholder.svg"
    }
  ]);

  const [upcomingAppointments] = useState([
    {
      id: 1,
      doctor: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      date: "2024-01-15",
      time: "10:00 AM",
      type: "Follow-up",
      status: "confirmed"
    },
    {
      id: 2,
      doctor: "Dr. Michael Chen",
      specialty: "Dermatologist",
      date: "2024-01-18",
      time: "2:30 PM",
      type: "Initial Consultation",
      status: "pending"
    }
  ]);

  const [availableDoctors] = useState([
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      rating: 4.9,
      experience: "15 years",
      avatar: "/placeholder.svg",
      status: "online"
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      specialty: "Dermatologist",
      rating: 4.8,
      experience: "12 years",
      avatar: "/placeholder.svg",
      status: "online"
    },
    {
      id: 3,
      name: "Dr. Emily Rodriguez",
      specialty: "Pediatrician",
      rating: 4.9,
      experience: "10 years",
      avatar: "/placeholder.svg",
      status: "busy"
    }
  ]);

  const handleStartConsultation = (type: 'video' | 'chat') => {
    setPendingConsultationType(type);
    setShowPatientSelector(true);
  };

  const handlePatientSelected = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleProceedToConsultation = () => {
    setShowPatientSelector(false);
  };

  const handlePatientsUpdate = (updatedPatients: Patient[]) => {
    setPatients(updatedPatients);
  };

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
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome back, John!</h1>
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
                  onClick={handleProceedToConsultation}
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
              <div className="text-xl sm:text-2xl font-bold text-blue-600">Jan 15</div>
              <p className="text-xs sm:text-sm text-gray-500">Dr. Sarah Johnson</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">85%</div>
              <p className="text-xs sm:text-sm text-gray-500">Good condition</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Consultations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">12</div>
              <p className="text-xs sm:text-sm text-gray-500">This year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-orange-600">Free</div>
              <p className="text-xs sm:text-sm text-gray-500">2 consultations left</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-max grid-cols-6 min-w-full sm:w-full">
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
                  <CardDescription className="text-sm">Manage your plan and billing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm sm:text-base">Free Plan</p>
                      <p className="text-xs sm:text-sm text-gray-600">2 consultations remaining</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <Button 
                    className="w-full text-sm" 
                    variant="outline"
                    onClick={() => setActiveTab("subscription")}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 2).map((appointment) => (
                      <div key={appointment.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                        <div>
                          <p className="font-medium text-sm sm:text-base">{appointment.doctor}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{appointment.date} at {appointment.time}</p>
                        </div>
                        <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="request">
            <DoctorList 
              onStartVideoCall={() => {}}
              onStartChat={() => {}}
              selectedPatient={selectedPatient}
              onSelectPatient={() => setShowPatientSelector(true)}
            />
          </TabsContent>

          <TabsContent value="ai-chat">
            <AIChatbot selectedPatient={selectedPatient} />
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{appointment.doctor}</h3>
                        <p className="text-sm text-gray-600">{appointment.specialty}</p>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {appointment.date} at {appointment.time}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                          {appointment.status}
                        </Badge>
                        <Link to="/video-call">
                          <Button size="sm">Join Call</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
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
                {/* Patient Selector for Records */}
                <div className="mb-6">
                  <PatientSelector 
                    patients={patients}
                    onPatientSelect={setSelectedPatient}
                    selectedPatient={selectedPatient}
                  />
                </div>

                {selectedPatient ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Blood Test Results</h3>
                        <p className="text-sm text-gray-600">January 10, 2024 - {selectedPatient.name}</p>
                      </div>
                      <Link to={`/medical-records?patient=${selectedPatient.id}`}>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Prescription History</h3>
                        <p className="text-sm text-gray-600">December 28, 2023 - {selectedPatient.name}</p>
                      </div>
                      <Link to={`/medical-records?patient=${selectedPatient.id}`}>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </div>
                    <div className="text-center mt-6">
                      <Link to={`/medical-records?patient=${selectedPatient.id}`}>
                        <Button>
                          <FileText className="w-4 h-4 mr-2" />
                          View All Records for {selectedPatient.name}
                        </Button>
                      </Link>
                    </div>
                  </div>
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
              onPatientsUpdate={handlePatientsUpdate}
            />
          </TabsContent>

          <TabsContent value="subscription">
            <PatientSubscription />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating AI Chatbot Button */}
      <Drawer open={isChatbotOpen} onOpenChange={setIsChatbotOpen}>
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
