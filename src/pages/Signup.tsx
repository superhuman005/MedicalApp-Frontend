
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Video, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [patientData, setPatientData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [doctorData, setDoctorData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialty: "",
    licenseNumber: "",
    experience: "",
    password: "",
    confirmPassword: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePatientSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientData.password !== patientData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive"
      });
      return;
    }
    
    localStorage.setItem('userType', 'patient');
    localStorage.setItem('userEmail', patientData.email);
    toast({
      title: "Account Created Successfully",
      description: "Welcome to TeleMed! Redirecting to your dashboard...",
    });
    setTimeout(() => navigate('/patient-dashboard'), 1000);
  };

  const handleDoctorSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (doctorData.password !== doctorData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive"
      });
      return;
    }
    
    localStorage.setItem('userType', 'doctor');
    localStorage.setItem('userEmail', doctorData.email);
    toast({
      title: "Account Created Successfully",
      description: "Welcome to TeleMed, Doctor! Redirecting to your dashboard...",
    });
    setTimeout(() => navigate('/doctor-dashboard'), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <div className="mb-4">
          <Link to="/">
            <Button variant="ghost" className="p-2 hover:bg-white/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="ml-2 text-2xl font-bold text-gray-900">TeleMed</span>
          </Link>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Choose your account type to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="patient" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="patient">Patient</TabsTrigger>
                <TabsTrigger value="doctor">Doctor</TabsTrigger>
              </TabsList>
              
              <TabsContent value="patient" className="space-y-4">
                <form onSubmit={handlePatientSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient-firstName">First Name</Label>
                      <Input
                        id="patient-firstName"
                        placeholder="John"
                        value={patientData.firstName}
                        onChange={(e) => setPatientData({ ...patientData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-lastName">Last Name</Label>
                      <Input
                        id="patient-lastName"
                        placeholder="Doe"
                        value={patientData.lastName}
                        onChange={(e) => setPatientData({ ...patientData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patient-email">Email</Label>
                    <Input
                      id="patient-email"
                      type="email"
                      placeholder="john@example.com"
                      value={patientData.email}
                      onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patient-phone">Phone Number</Label>
                    <Input
                      id="patient-phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={patientData.phone}
                      onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patient-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="patient-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={patientData.password}
                        onChange={(e) => setPatientData({ ...patientData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patient-confirmPassword">Confirm Password</Label>
                    <Input
                      id="patient-confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={patientData.confirmPassword}
                      onChange={(e) => setPatientData({ ...patientData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Patient Account
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="doctor" className="space-y-4">
                <form onSubmit={handleDoctorSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="doctor-firstName">First Name</Label>
                      <Input
                        id="doctor-firstName"
                        placeholder="Dr. Jane"
                        value={doctorData.firstName}
                        onChange={(e) => setDoctorData({ ...doctorData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctor-lastName">Last Name</Label>
                      <Input
                        id="doctor-lastName"
                        placeholder="Smith"
                        value={doctorData.lastName}
                        onChange={(e) => setDoctorData({ ...doctorData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor-email">Email</Label>
                    <Input
                      id="doctor-email"
                      type="email"
                      placeholder="doctor@example.com"
                      value={doctorData.email}
                      onChange={(e) => setDoctorData({ ...doctorData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor-phone">Phone Number</Label>
                    <Input
                      id="doctor-phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={doctorData.phone}
                      onChange={(e) => setDoctorData({ ...doctorData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor-specialty">Medical Specialty</Label>
                    <Input
                      id="doctor-specialty"
                      placeholder="e.g., Cardiology, Dermatology"
                      value={doctorData.specialty}
                      onChange={(e) => setDoctorData({ ...doctorData, specialty: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor-license">Medical License Number</Label>
                    <Input
                      id="doctor-license"
                      placeholder="Enter your license number"
                      value={doctorData.licenseNumber}
                      onChange={(e) => setDoctorData({ ...doctorData, licenseNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor-experience">Years of Experience</Label>
                    <Input
                      id="doctor-experience"
                      type="number"
                      placeholder="e.g., 10"
                      value={doctorData.experience}
                      onChange={(e) => setDoctorData({ ...doctorData, experience: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="doctor-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={doctorData.password}
                        onChange={(e) => setDoctorData({ ...doctorData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor-confirmPassword">Confirm Password</Label>
                    <Input
                      id="doctor-confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={doctorData.confirmPassword}
                      onChange={(e) => setDoctorData({ ...doctorData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Doctor Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
