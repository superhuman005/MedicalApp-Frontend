
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Video, Clock, Star, ArrowLeft, MessageSquare } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

const BookAppointment = () => {
  const [searchParams] = useSearchParams();
  const consultationType = searchParams.get('type') || 'video';
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const allDoctors = [
    {
      id: "1",
      name: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      rating: 4.9,
      avatar: "/placeholder.svg",
      isOnline: true,
      lastSeen: "Active now",
      availability: {
        video: ["9:00 AM", "10:30 AM", "2:00 PM", "3:30 PM"],
        chat: ["9:00 AM", "10:30 AM", "11:00 AM", "2:00 PM", "3:30 PM", "4:00 PM"]
      }
    },
    {
      id: "2",
      name: "Dr. Michael Chen",
      specialty: "Dermatologist",
      rating: 4.8,
      avatar: "/placeholder.svg",
      isOnline: true,
      lastSeen: "Active now",
      availability: {
        video: ["10:00 AM", "11:30 AM", "1:00 PM", "4:00 PM"],
        chat: ["10:00 AM", "11:30 AM", "12:00 PM", "1:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"]
      }
    },
    {
      id: "3",
      name: "Dr. Emily Davis",
      specialty: "General Practice",
      rating: 4.7,
      avatar: "/placeholder.svg",
      isOnline: false,
      lastSeen: "Last seen 2 hours ago",
      availability: {
        video: ["9:30 AM", "11:00 AM", "2:30 PM", "4:30 PM"],
        chat: ["9:30 AM", "11:00 AM", "12:30 PM", "2:30 PM", "4:30 PM", "5:30 PM"]
      }
    },
    {
      id: "4",
      name: "Dr. James Wilson",
      specialty: "Psychiatrist",
      rating: 4.9,
      avatar: "/placeholder.svg",
      isOnline: true,
      lastSeen: "Active now",
      availability: {
        video: ["8:00 AM", "9:30 AM", "1:30 PM", "3:00 PM"],
        chat: ["8:00 AM", "9:30 AM", "10:30 AM", "1:30 PM", "3:00 PM", "4:30 PM"]
      }
    }
  ];

  // Filter to show only online doctors
  const doctors = allDoctors.filter(doctor => doctor.isOnline);

  const timeSlots = selectedDoctor 
    ? doctors.find(doc => doc.id === selectedDoctor)?.availability[consultationType as 'video' | 'chat'] || []
    : [];

  const selectedDoctorData = selectedDoctor 
    ? doctors.find(doc => doc.id === selectedDoctor)
    : null;

  const handleBooking = () => {
    if (selectedDoctor && selectedTime && selectedDate) {
      console.log("Booking appointment:", {
        doctorId: selectedDoctor,
        date: selectedDate,
        time: selectedTime,
        type: consultationType
      });
      alert(`${consultationType === 'video' ? 'Video' : 'Chat'} appointment booked successfully!`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/patient-dashboard" className="flex items-center mr-4">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">TeleMed</span>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {consultationType === 'video' ? (
                <><Video className="w-3 h-3 mr-1" />Video Consultation</>
              ) : (
                <><MessageSquare className="w-3 h-3 mr-1" />Chat Consultation</>
              )}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Book a {consultationType === 'video' ? 'Video' : 'Chat'} Appointment
          </h1>
          <p className="text-gray-600">
            Choose from our available online doctors for your {consultationType} consultation
          </p>
          <div className="mt-2 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">{doctors.length} doctors currently online</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Doctor Selection */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Available Online Doctors</CardTitle>
                <CardDescription>All doctors shown are currently online and ready for consultation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedDoctor === doctor.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedDoctor(doctor.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={doctor.avatar} />
                              <AvatarFallback>
                                {doctor.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{doctor.name}</h3>
                            <p className="text-gray-600">{doctor.specialty}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm ml-1">{doctor.rating}</span>
                              </div>
                            </div>
                            <div className="flex items-center mt-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              <span className="text-sm text-green-600 font-medium">{doctor.lastSeen}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time Slots */}
            {selectedDoctor && (
              <Card>
                <CardHeader>
                  <CardTitle>Available Time Slots for {consultationType === 'video' ? 'Video' : 'Chat'}</CardTitle>
                  <CardDescription>
                    {selectedDoctorData?.name} is available for {consultationType} consultation at these times
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        className="h-12"
                        onClick={() => setSelectedTime(time)}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {time}
                      </Button>
                    ))}
                  </div>
                  {timeSlots.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No available slots for {consultationType} consultation today
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Appointment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Calendar */}
                <div>
                  <Label className="text-sm font-medium">Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border mt-2"
                    disabled={(date) => date < new Date()}
                  />
                </div>

                {/* Booking Details */}
                {selectedDoctor && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium capitalize">
                        {consultationType} Consultation
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Doctor:</span>
                      <span className="text-sm font-medium">
                        {selectedDoctorData?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-green-600">Online</span>
                      </div>
                    </div>
                    {selectedDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm font-medium">
                          {selectedDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Time:</span>
                        <span className="text-sm font-medium">{selectedTime}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Patient Information */}
                <div className="space-y-3 pt-4 border-t">
                  <div>
                    <Label htmlFor="reason">Reason for Visit</Label>
                    <Textarea
                      id="reason"
                      placeholder="Please describe your symptoms or reason for consultation..."
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={!selectedDoctor || !selectedTime || !selectedDate}
                  onClick={handleBooking}
                >
                  Book {consultationType === 'video' ? 'Video' : 'Chat'} Appointment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
