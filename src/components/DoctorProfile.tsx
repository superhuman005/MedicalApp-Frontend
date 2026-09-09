
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Loader2 } from "lucide-react";
import type { User, DoctorStatus } from "@/types";

interface DoctorProfileProps {
  doctor: User;
  onProfileUpdate: (updates: {
    bio?: string;
    specialization?: string;
    yearsOfExperience?: number;
    avatar?: string;
  }) => Promise<void>;
  onStatusChange: (status: DoctorStatus) => Promise<void>;
}

const DoctorProfile = ({ doctor, onProfileUpdate, onStatusChange }: DoctorProfileProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    specialization: doctor.specialization || "",
    yearsOfExperience: doctor.yearsOfExperience?.toString() || "",
    bio: doctor.bio || "",
    avatar: doctor.avatar || "",
  });

  useEffect(() => {
    setFormData({
      specialization: doctor.specialization || "",
      yearsOfExperience: doctor.yearsOfExperience?.toString() || "",
      bio: doctor.bio || "",
      avatar: doctor.avatar || "",
    });
  }, [doctor.specialization, doctor.yearsOfExperience, doctor.bio, doctor.avatar]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onProfileUpdate({
        specialization: formData.specialization,
        yearsOfExperience: formData.yearsOfExperience ? Number(formData.yearsOfExperience) : undefined,
        bio: formData.bio,
        avatar: formData.avatar,
      });
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'available':
        return 'Available';
      case 'busy':
        return 'Busy';
      case 'offline':
        return 'Offline';
      default:
        return 'Offline';
    }
  };

  const fullName = `${doctor.firstName} ${doctor.lastName}`;
  const experienceLabel = doctor.yearsOfExperience
    ? `${doctor.yearsOfExperience} year${doctor.yearsOfExperience === 1 ? '' : 's'} experience`
    : 'Experience not set';

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Avatar className="w-16 h-16">
          <AvatarImage src={doctor.avatar} />
          <AvatarFallback>
            {fullName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(doctor.status)} rounded-full border-2 border-white`}></div>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, Dr. {doctor.lastName}!</h1>
          <Badge variant="outline" className="text-xs">
            {getStatusText(doctor.status)}
          </Badge>
        </div>
        <p className="text-gray-600 mb-2">{doctor.specialization || 'Specialty not set'} • {experienceLabel}</p>
        
        <div className="flex items-center space-x-2">
          <Select value={doctor.status} onValueChange={(value) => onStatusChange(value as DoctorStatus)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Update your professional information. Your name and email are managed on the Account settings.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="specialty" className="text-right">
                    Specialty
                  </Label>
                  <Input
                    id="specialty"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="experience" className="text-right">
                    Years Exp.
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    min={0}
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="avatar" className="text-right">
                    Avatar URL
                  </Label>
                  <Input
                    id="avatar"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="bio" className="text-right mt-2">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
