import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Mail, Users, CreditCard, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { updateMe } from "@/services/users";
import { updatePasswordRequest } from "@/services/auth";
import { getCurrentSubscription } from "@/services/subscriptions";
import { getFamilyMembers } from "@/services/familyMembers";
import { getErrorMessage } from "@/services/api";
import type { Subscription, FamilyMember } from "@/types";

const PatientProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
    gender: user?.gender || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoadingExtras, setIsLoadingExtras] = useState(true);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    Promise.all([getCurrentSubscription(), getFamilyMembers()])
      .then(([sub, members]) => {
        setSubscription(sub.subscription);
        setFamilyMembers(members);
      })
      .catch(() => {
        // Non-critical for this page - the summary cards just stay empty
      })
      .finally(() => setIsLoadingExtras(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateMe({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: (formData.gender as "male" | "female" | "other" | "") || undefined,
      });
      updateUser(updated);
      toast({ title: "Profile updated" });
    } catch (error) {
      toast({ title: "Couldn't update profile", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      await updatePasswordRequest(passwordForm.currentPassword, passwordForm.newPassword);
      toast({ title: "Password changed" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast({ title: "Couldn't change password", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/patient-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </p>
          </div>
        </div>

        {/* Quick summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  Subscription
                </p>
                <p className="text-lg font-semibold capitalize mt-1">
                  {isLoadingExtras ? "…" : subscription ? `${subscription.plan} plan` : "Free plan"}
                </p>
              </div>
              <Link to="/patient-dashboard">
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Family Members
                </p>
                <p className="text-lg font-semibold mt-1">{isLoadingExtras ? "…" : familyMembers.length}</p>
              </div>
              <Link to="/patient-dashboard">
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Profile details */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your name, phone number and other details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    className="mt-1"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    className="mt-1"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  className="mt-1"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    className="mt-1"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger id="gender" className="mt-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>You'll stay signed in after changing your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type={showPasswords ? "text" : "password"}
                  className="mt-1"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type={showPasswords ? "text" : "password"}
                    className="mt-1"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPasswords ? "text" : "password"}
                    className="mt-1"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground"
                  onClick={() => setShowPasswords((v) => !v)}
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPasswords ? "Hide" : "Show"} passwords
                </button>
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Change Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientProfilePage;
