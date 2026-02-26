
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import VideoCall from "./pages/VideoCall";
import BookAppointment from "./pages/BookAppointment";
import MedicalRecords from "./pages/MedicalRecords";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/patient-dashboard" 
            element={
              <ProtectedRoute allowedUserType="patient">
                <PatientDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doctor-dashboard" 
            element={
              <ProtectedRoute allowedUserType="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/video-call" 
            element={
              <ProtectedRoute>
                <VideoCall />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/book-appointment" 
            element={
              <ProtectedRoute allowedUserType="patient">
                <BookAppointment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/medical-records" 
            element={
              <ProtectedRoute>
                <MedicalRecords />
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
