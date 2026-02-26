import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, Calendar, FileText, Users, Clock, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DoctorEarnings from "@/components/DoctorEarnings";
import DoctorProfile from "@/components/DoctorProfile";
import ConsultationRequests from "@/components/ConsultationRequests";

const DoctorDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userType');
    navigate('/login');
  };

  const [doctorInfo, setDoctorInfo] = useState({
    name: "Dr. Smith",
    specialty: "Cardiology",
    experience: "15 years experience",
    bio: "Experienced cardiologist with expertise in interventional cardiology and heart disease prevention.",
    avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=face",
    status: 'available' as 'online' | 'offline' | 'busy' | 'available'
  });

  const handleProfileUpdate = (updatedProfile: any) => {
    setDoctorInfo({ ...doctorInfo, ...updatedProfile });
  };

  const handleStatusChange = (status: 'online' | 'offline' | 'busy' | 'available') => {
    setDoctorInfo({ ...doctorInfo, status });
  };

  const [todayAppointments] = useState([
    {
      id: 1,
      patient: "John Smith",
      time: "10:00 AM",
      type: "Follow-up",
      status: "waiting",
      avatar: "/placeholder.svg"
    },
    {
      id: 2,
      patient: "Mary Johnson",
      time: "11:30 AM",
      type: "Initial Consultation",
      status: "upcoming",
      avatar: "/placeholder.svg"
    },
    {
      id: 3,
      patient: "Robert Davis",
      time: "2:00 PM",
      type: "Check-up",
      status: "upcoming",
      avatar: "/placeholder.svg"
    }
  ]);

  const [recentPatients] = useState([
    {
      id: 1,
      name: "Alice Brown",
      lastVisit: "2024-01-12",
      condition: "Hypertension",
      status: "stable"
    },
    {
      id: 2,
      name: "James Wilson",
      lastVisit: "2024-01-11",
      condition: "Diabetes Type 2",
      status: "monitoring"
    }
  ]);

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
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Patient List
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Avatar>
                <AvatarImage src={doctorInfo.avatar} />
                <AvatarFallback>{doctorInfo.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <DoctorProfile
            doctor={doctorInfo}
            onProfileUpdate={handleProfileUpdate}
            onStatusChange={handleStatusChange}
          />
          <p className="text-gray-600 mt-2">You have 3 appointments scheduled for today</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">3</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Patients Waiting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">1</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">47</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Patient Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">4.9</div>
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
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={`https://images.unsplash.com/photo-${1500000000000 + appointment.id}?w=150&h=150&fit=crop&crop=face`} />
                          <AvatarFallback>
                            {appointment.patient.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{appointment.patient}</h3>
                          <p className="text-gray-600">{appointment.type}</p>
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
                        <Link to="/video-call">
                          <Button disabled={appointment.status !== 'waiting'}>
                            {appointment.status === 'waiting' ? 'Start Call' : 'View Details'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patients">
            <div className="space-y-4">
              {recentPatients.map((patient) => (
                <Card key={patient.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{patient.name}</h3>
                        <p className="text-gray-600">Last visit: {patient.lastVisit}</p>
                        <p className="text-sm font-medium">Condition: {patient.condition}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={patient.status === 'stable' ? 'outline' : 'secondary'}
                          className={patient.status === 'stable' ? 'text-green-600 border-green-600' : ''}
                        >
                          {patient.status}
                        </Badge>
                        <Link to="/medical-records">
                          <Button variant="outline" size="sm">
                            View Records
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Chart placeholder - Integration with charts library needed
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Patient Satisfaction</CardTitle>
                  <CardDescription>Average rating from patient feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Communication</span>
                      <span className="font-semibold">4.9/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Professionalism</span>
                      <span className="font-semibold">4.8/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Treatment Quality</span>
                      <span className="font-semibold">4.9/5</span>
                    </div>
                  </div>
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
