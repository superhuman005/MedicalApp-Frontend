
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Calendar, FileText, MessageSquare, Shield, Clock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">TeleMed</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Healthcare at Your
            <span className="text-blue-600 block">Fingertips</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with licensed healthcare professionals through secure video consultations. 
            Get the care you need, when you need it, from the comfort of your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/patient-dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Start Consultation
              </Button>
            </Link>
            <Link to="/doctor-dashboard">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                I'm a Doctor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need for Remote Healthcare
          </h2>
          <p className="text-lg text-gray-600">
            Comprehensive telemedicine platform with all essential features
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Video className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>HD Video Consultations</CardTitle>
              <CardDescription>
                Crystal clear video calls with licensed healthcare professionals
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Calendar className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Easy Scheduling</CardTitle>
              <CardDescription>
                Book appointments 24/7 with your preferred doctors
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Medical Records</CardTitle>
              <CardDescription>
                Secure access to your complete medical history and prescriptions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageSquare className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Secure Messaging</CardTitle>
              <CardDescription>
                HIPAA-compliant messaging with your healthcare team
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Privacy & Security</CardTitle>
              <CardDescription>
                End-to-end encryption and HIPAA compliance guaranteed
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Clock className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>24/7 Availability</CardTitle>
              <CardDescription>
                Access healthcare professionals around the clock
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of patients who trust TeleMed for their healthcare needs
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">TeleMed</span>
              </div>
              <p className="text-gray-400">
                Making healthcare accessible to everyone, everywhere.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">For Patients</a></li>
                <li><a href="#" className="hover:text-white">For Doctors</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TeleMed. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
