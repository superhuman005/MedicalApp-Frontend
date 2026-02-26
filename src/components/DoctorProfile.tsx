
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, User } from "lucide-react";

interface DoctorProfileProps {
  doctor: {
    name: string;
    specialty: string;
    experience: string;
    bio: string;
    avatar: string;
    status: 'online' | 'offline' | 'busy' | 'available';
  };
  onProfileUpdate: (updatedDoctor: any) => void;
  onStatusChange: (status: 'online' | 'offline' | 'busy' | 'available') => void;
}

const DoctorProfile = ({ doctor, onProfileUpdate, onStatusChange }: DoctorProfileProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: doctor.name,
    specialty: doctor.specialty,
    experience: doctor.experience,
    bio: doctor.bio,
    avatar: doctor.avatar
  });

  const handleSave = () => {
    onProfileUpdate(formData);
    setIsOpen(false);
  };

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
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

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Avatar className="w-16 h-16">
          <AvatarImage src={doctor.avatar} />
          <AvatarFallback>
            {doctor.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(doctor.status)} rounded-full border-2 border-white`}></div>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <h1 className="text-3xl font-bold text-gray-900">Good morning, {doctor.name}!</h1>
          <Badge variant="outline" className="text-xs">
            {getStatusText(doctor.status)}
          </Badge>
        </div>
        <p className="text-gray-600 mb-2">{doctor.specialty} • {doctor.experience}</p>
        
        <div className="flex items-center space-x-2">
          <Select value={doctor.status} onValueChange={onStatusChange}>
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
                  Update your profile information and settings.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="specialty" className="text-right">
                    Specialty
                  </Label>
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="experience" className="text-right">
                    Experience
                  </Label>
                  <Input
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, avatar: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
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
