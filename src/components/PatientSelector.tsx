
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, User, Baby, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Patient {
  id: string;
  name: string;
  relationship: string;
  age?: number;
  avatar?: string;
}

interface PatientSelectorProps {
  patients: Patient[];
  onPatientSelect: (patient: Patient) => void;
  selectedPatient: Patient | null;
}

const PatientSelector = ({ patients, onPatientSelect, selectedPatient }: PatientSelectorProps) => {
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    relationship: "",
    age: ""
  });

  const handleAddPatient = () => {
    if (newPatient.name && newPatient.relationship) {
      const patient: Patient = {
        id: Date.now().toString(),
        name: newPatient.name,
        relationship: newPatient.relationship,
        age: newPatient.age ? parseInt(newPatient.age) : undefined,
        avatar: "/placeholder.svg"
      };
      // Note: This would need to be updated to use the shared patient management
      // For now, we'll just close the dialog
      setNewPatient({ name: "", relationship: "", age: "" });
      setIsAddingPatient(false);
    }
  };

  const getPatientIcon = (relationship: string) => {
    switch (relationship) {
      case "self":
        return <User className="w-4 h-4" />;
      case "daughter":
      case "son":
      case "child":
        return <Baby className="w-4 h-4" />;
      default:
        return <Heart className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who is this consultation for?</CardTitle>
        <CardDescription>Select the patient for this consultation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPatient?.id === patient.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onPatientSelect(patient)}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={patient.avatar} />
                  <AvatarFallback>
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{patient.name}</p>
                  <div className="flex items-center mt-1">
                    {getPatientIcon(patient.relationship)}
                    <span className="text-xs text-gray-600 ml-1 capitalize">
                      {patient.relationship}
                      {patient.age && `, ${patient.age}y`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-600 text-center">
          Need to add a new patient? Go to the "Patients" tab to manage your family members.
        </p>
      </CardContent>
    </Card>
  );
};

export default PatientSelector;
