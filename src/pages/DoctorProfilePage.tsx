import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Star, Loader2, Mail, Phone, BadgeCheck, Briefcase, Video, Calendar, UserRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getDoctorById, updateMyDoctorProfile, updateMyDoctorStatus } from "@/services/doctors";
import { getDoctorReviews } from "@/services/reviews";
import { getErrorMessage } from "@/services/api";
import DoctorProfile from "@/components/DoctorProfile";
import type { User, Review, DoctorStatus } from "@/types";

const statusLabel: Record<string, string> = {
  online: "Online",
  available: "Available",
  busy: "Busy",
  offline: "Offline",
};

const statusColor: Record<string, string> = {
  online: "bg-emerald-100 text-emerald-700 border-emerald-200",
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  busy: "bg-amber-100 text-amber-700 border-amber-200",
  offline: "bg-gray-100 text-gray-600 border-gray-200",
};

const DoctorProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [doctor, setDoctor] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  const isSelf = !!user && user._id === id;
  // Only the doctor themself (editing) or an admin sees contact details here -
  // everyone else sees the professional info relevant to deciding whether to
  // book, including the license number for credibility.
  const canSeeContactInfo = isSelf || user?.role === "admin";

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getDoctorById(id)
      .then(setDoctor)
      .catch((error) => {
        toast({ title: "Couldn't load doctor", description: getErrorMessage(error), variant: "destructive" });
      })
      .finally(() => setIsLoading(false));
  }, [id, toast]);

  useEffect(() => {
    if (!id) return;
    setIsLoadingReviews(true);
    getDoctorReviews(id)
      .then(setReviews)
      .catch(() => {
        // Non-critical - just leave the reviews section empty
      })
      .finally(() => setIsLoadingReviews(false));
  }, [id]);

  const handleProfileUpdate = async (updates: {
    bio?: string;
    specialization?: string;
    yearsOfExperience?: number;
    avatar?: string;
    gender?: "male" | "female" | "other" | "";
    dateOfBirth?: string;
  }) => {
    try {
      const updated = await updateMyDoctorProfile(updates);
      setDoctor(updated);
      updateUser(updated);
      toast({ title: "Profile updated" });
    } catch (error) {
      toast({ title: "Couldn't update profile", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const handleStatusChange = async (status: DoctorStatus) => {
    try {
      const updated = await updateMyDoctorStatus(status);
      setDoctor(updated);
      updateUser(updated);
    } catch (error) {
      toast({ title: "Couldn't update status", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const backTo = user?.role === "doctor" ? "/doctor-dashboard" : user?.role === "patient" ? "/patient-dashboard" : "/admin-dashboard";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-muted-foreground">Doctor not found.</p>
        <Link to={backTo}>
          <Button variant="outline">Back</Button>
        </Link>
      </div>
    );
  }

  const displayName = `Dr. ${doctor.firstName} ${doctor.lastName}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {isSelf ? (
          // Full editable card (bio, specialization, experience, avatar, status) -
          // the same component used inline on the doctor dashboard.
          <DoctorProfile doctor={doctor} onProfileUpdate={handleProfileUpdate} onStatusChange={handleStatusChange} />
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="relative shrink-0">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={doctor.avatar} />
                    <AvatarFallback className="text-xl">
                      {doctor.firstName?.[0] || ""}
                      {doctor.lastName?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold">{displayName}</h1>
                    {doctor.status && (
                      <Badge variant="outline" className={statusColor[doctor.status]}>
                        {statusLabel[doctor.status]}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5">{doctor.specialization || "General Practice"}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                    {doctor.rating !== undefined && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {doctor.rating.toFixed(1)} ({doctor.ratingCount || 0} review{doctor.ratingCount === 1 ? "" : "s"})
                      </span>
                    )}
                    {doctor.yearsOfExperience !== undefined && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {doctor.yearsOfExperience} year{doctor.yearsOfExperience === 1 ? "" : "s"} experience
                      </span>
                    )}
                    {doctor.medicalLicenseNumber && (
                      <span className="flex items-center gap-1">
                        <BadgeCheck className="w-4 h-4" />
                        License: {doctor.medicalLicenseNumber}
                      </span>
                    )}
                    {doctor.gender && (
                      <span className="flex items-center gap-1">
                        <UserRound className="w-4 h-4" />
                        {doctor.gender[0].toUpperCase()}{doctor.gender.slice(1)}
                      </span>
                    )}
                  </div>

                  {canSeeContactInfo && (
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {doctor.email}
                      </span>
                      {doctor.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {doctor.phone}
                        </span>
                      )}
                    </div>
                  )}

                  {doctor.bio && <p className="text-sm text-gray-700 mt-4 whitespace-pre-wrap">{doctor.bio}</p>}

                  {user?.role === "patient" && (
                    <div className="flex flex-wrap gap-2 mt-5">
                      <Link to={`/book-appointment?doctorId=${doctor._id}`}>
                        <Button>
                          <Calendar className="w-4 h-4 mr-2" />
                          Book Appointment
                        </Button>
                      </Link>
                      {(doctor.status === "online" || doctor.status === "available") && (
                        <Badge variant="outline" className="flex items-center gap-1 px-3">
                          <Video className="w-3.5 h-3.5" />
                          Available now
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>What patients have said after a consultation</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingReviews ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="flex gap-3 pb-4 border-b last:border-b-0 last:pb-0">
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={review.patient.avatar} />
                      <AvatarFallback className="text-xs">
                        {review.patient.firstName?.[0] || ""}
                        {review.patient.lastName?.[0] || ""}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium">
                          {review.patient.firstName} {review.patient.lastName?.[0] || ""}.
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-gray-700 mt-1">{review.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorProfilePage;
