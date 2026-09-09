
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Video, Clock, Star, ArrowLeft, MessageSquare, Loader2 } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getDoctors } from "@/services/doctors";
import { getFamilyMembers } from "@/services/familyMembers";
import { bookAppointment } from "@/services/appointments";
import { getErrorMessage } from "@/services/api";
import type { User, FamilyMember } from "@/types";

// The backend doesn't model per-doctor availability slots, so patients pick a
// preferred time from a standard set of business-hours slots; the appointment
// is created as "pending" until the doctor confirms it.
const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

const BookAppointment = () => {
  const [searchParams] = useSearchParams();
  const consultationType = (searchParams.get('type') as 'video' | 'chat') || 'video';
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string>("");

  const [doctors, setDoctors] = useState<User[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [doctorsData, familyData] = await Promise.all([getDoctors(), getFamilyMembers()]);
        setDoctors(doctorsData);
        setFamilyMembers(familyData);
        const self = familyData.find((f) => f.isSelf);
        if (self) setSelectedFamilyMemberId(self._id);
      } catch (error) {
        toast({
          title: "Couldn't load doctors",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [toast]);

  const selectedDoctorData = selectedDoctor ? doctors.find((d) => d._id === selectedDoctor) : null;
  const isDoctorOnline = (d: User) => d.status === 'online' || d.status === 'available';

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedTime || !selectedDate) return;
    setIsBooking(true);
    try {
      await bookAppointment({
        doctorId: selectedDoctor,
        familyMemberId: selectedFamilyMemberId || undefined,
        date: selectedDate.toISOString(),
        time: selectedTime,
        type: consultationType,
        reason: reason || undefined,
      });

      toast({
        title: "Appointment Requested",
        description: `Your ${consultationType} appointment request has been sent. You'll see it in your appointments once confirmed.`,
      });

      navigate("/patient-dashboard");
    } catch (error) {
      toast({
        title: "Couldn't book appointment",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
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
            Choose from our doctors for your {consultationType} consultation
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Doctor Selection */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Available Doctors</CardTitle>
                  <CardDescription>Pick a doctor for your consultation</CardDescription>
                </CardHeader>
                <CardContent>
                  {doctors.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No doctors are registered yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {doctors.map((doctor) => {
                        const online = isDoctorOnline(doctor);
                        const name = `Dr. ${doctor.firstName} ${doctor.lastName}`;
                        return (
                          <div
                            key={doctor._id}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedDoctor === doctor._id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedDoctor(doctor._id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  <Avatar className="w-16 h-16">
                                    <AvatarImage src={doctor.avatar} />
                                    <AvatarFallback>
                                      {name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${online ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white rounded-full`}></div>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{name}</h3>
                                  <p className="text-gray-600">{doctor.specialization || 'General Practice'}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {doctor.rating ? (
                                      <div className="flex items-center">
                                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                        <span className="text-sm ml-1">{doctor.rating.toFixed(1)}</span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400">No ratings yet</span>
                                    )}
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <div className={`w-2 h-2 ${online ? 'bg-green-500' : 'bg-gray-400'} rounded-full mr-2`}></div>
                                    <span className={`text-sm font-medium ${online ? 'text-green-600' : 'text-gray-500'}`}>
                                      {online ? 'Online now' : 'Offline'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Time Slots */}
              {selectedDoctor && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preferred Time</CardTitle>
                    <CardDescription>
                      Pick a preferred time on {selectedDate?.toLocaleDateString()}. {selectedDoctorData ? `Dr. ${selectedDoctorData.lastName}` : 'The doctor'} will confirm your appointment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {TIME_SLOTS.map((time) => (
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
                  {/* Who this is for */}
                  {familyMembers.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Booking for</Label>
                      <Select value={selectedFamilyMemberId} onValueChange={setSelectedFamilyMemberId}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {familyMembers.map((member) => (
                            <SelectItem key={member._id} value={member._id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Calendar */}
                  <div>
                    <Label className="text-sm font-medium">Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border mt-2"
                      disabled={(date) => date < new Date(new Date().toDateString())}
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
                          {selectedDoctorData ? `Dr. ${selectedDoctorData.firstName} ${selectedDoctorData.lastName}` : ''}
                        </span>
                      </div>
                      {selectedDoctorData?.consultationFee && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Fee:</span>
                          <span className="text-sm font-medium">
                            ${consultationType === 'video' ? selectedDoctorData.consultationFee.video : selectedDoctorData.consultationFee.chat}
                          </span>
                        </div>
                      )}
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

                  {/* Reason for visit */}
                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <Label htmlFor="reason">Reason for Visit</Label>
                      <Textarea
                        id="reason"
                        placeholder="Please describe your symptoms or reason for consultation..."
                        className="mt-1"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!selectedDoctor || !selectedTime || !selectedDate || isBooking}
                    onClick={handleBooking}
                  >
                    {isBooking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Book {consultationType === 'video' ? 'Video' : 'Chat'} Appointment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
