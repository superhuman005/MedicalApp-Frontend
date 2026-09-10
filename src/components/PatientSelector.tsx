
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Baby, Heart } from "lucide-react";
import type { FamilyMember } from "@/types";

interface PatientSelectorProps {
  patients: FamilyMember[];
  onPatientSelect: (patient: FamilyMember) => void;
  selectedPatient: FamilyMember | null;
}

const PatientSelector = ({ patients, onPatientSelect, selectedPatient }: PatientSelectorProps) => {
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
        {patients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No patient profiles yet. Add one from the "Patients" tab first.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {patients.map((patient) => (
              <div
                key={patient._id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPatient?._id === patient._id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
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
                      <span className="text-xs text-muted-foreground ml-1 capitalize">
                        {patient.relationship}
                        {patient.age && `, ${patient.age}y`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground text-center">
          Need to add a new patient? Go to the "Patients" tab to manage your family members.
        </p>
      </CardContent>
    </Card>
  );
};

export default PatientSelector;
