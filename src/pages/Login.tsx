
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [patientData, setPatientData] = useState({ email: "", password: "" });
  const [doctorData, setDoctorData] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePatientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientData.email && patientData.password) {
      // Store user type in localStorage for demo purposes
      localStorage.setItem('userType', 'patient');
      localStorage.setItem('userEmail', patientData.email);
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting to your dashboard...",
      });
      setTimeout(() => navigate('/patient-dashboard'), 1000);
    }
  };

  const handleDoctorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (doctorData.email && doctorData.password) {
      localStorage.setItem('userType', 'doctor');
      localStorage.setItem('userEmail', doctorData.email);
      toast({
        title: "Login Successful",
        description: "Welcome back, Doctor! Redirecting to your dashboard...",
      });
      setTimeout(() => navigate('/doctor-dashboard'), 1000);
    }
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
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Choose your account type to sign in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="patient" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="patient">Patient</TabsTrigger>
                <TabsTrigger value="doctor">Doctor</TabsTrigger>
              </TabsList>
              
              <TabsContent value="patient" className="space-y-4">
                <form onSubmit={handlePatientLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient-email">Email</Label>
                    <Input
                      id="patient-email"
                      type="email"
                      placeholder="patient@example.com"
                      value={patientData.email}
                      onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patient-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="patient-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
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
                  <Button type="submit" className="w-full">
                    Sign In as Patient
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="doctor" className="space-y-4">
                <form onSubmit={handleDoctorLogin} className="space-y-4">
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
                    <Label htmlFor="doctor-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="doctor-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
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
                  <Button type="submit" className="w-full">
                    Sign In as Doctor
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="text-blue-600 hover:underline">
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
