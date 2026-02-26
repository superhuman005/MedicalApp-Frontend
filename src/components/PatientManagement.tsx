
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Edit, User, Baby, Heart, Trash2 } from "lucide-react";
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

interface PatientManagementProps {
  patients: Patient[];
  onPatientsUpdate: (patients: Patient[]) => void;
}

const PatientManagement = ({ patients, onPatientsUpdate }: PatientManagementProps) => {
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientForm, setPatientForm] = useState({
    name: "",
    relationship: "",
    age: ""
  });

  const handleAddPatient = () => {
    if (patientForm.name && patientForm.relationship) {
      const newPatient: Patient = {
        id: Date.now().toString(),
        name: patientForm.name,
        relationship: patientForm.relationship,
        age: patientForm.age ? parseInt(patientForm.age) : undefined,
        avatar: "/placeholder.svg"
      };
      onPatientsUpdate([...patients, newPatient]);
      setPatientForm({ name: "", relationship: "", age: "" });
      setIsAddingPatient(false);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setPatientForm({
      name: patient.name,
      relationship: patient.relationship,
      age: patient.age?.toString() || ""
    });
  };

  const handleSaveEdit = () => {
    if (editingPatient && patientForm.name && patientForm.relationship) {
      const updatedPatients = patients.map(p => 
        p.id === editingPatient.id 
          ? {
              ...p,
              name: patientForm.name,
              relationship: patientForm.relationship,
              age: patientForm.age ? parseInt(patientForm.age) : undefined
            }
          : p
      );
      onPatientsUpdate(updatedPatients);
      setEditingPatient(null);
      setPatientForm({ name: "", relationship: "", age: "" });
    }
  };

  const handleDeletePatient = (patientId: string) => {
    const updatedPatients = patients.filter(p => p.id !== patientId);
    onPatientsUpdate(updatedPatients);
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
        <CardTitle>Manage Patients</CardTitle>
        <CardDescription>Add, edit, or remove family members and yourself</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patients.map((patient) => (
            <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={patient.avatar} />
                  <AvatarFallback>
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{patient.name}</p>
                  <div className="flex items-center mt-1">
                    {getPatientIcon(patient.relationship)}
                    <span className="text-sm text-gray-600 ml-1 capitalize">
                      {patient.relationship}
                      {patient.age && `, ${patient.age} years old`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditPatient(patient)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                {patient.relationship !== "self" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePatient(patient.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAddingPatient(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Patient
          </Button>
        </div>

        {/* Add Patient Dialog */}
        <Dialog open={isAddingPatient} onOpenChange={setIsAddingPatient}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Add a family member or yourself to manage consultations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-name">Name</Label>
                <Input
                  id="add-name"
                  value={patientForm.name}
                  onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <Label htmlFor="add-relationship">Relationship</Label>
                <Select
                  value={patientForm.relationship}
                  onValueChange={(value) => setPatientForm({ ...patientForm, relationship: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Self</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="son">Son</SelectItem>
                    <SelectItem value="daughter">Daughter</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="add-age">Age (optional)</Label>
                <Input
                  id="add-age"
                  type="number"
                  value={patientForm.age}
                  onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                  placeholder="Enter age"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingPatient(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPatient}>
                  Add Patient
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Patient Dialog */}
        <Dialog open={!!editingPatient} onOpenChange={() => setEditingPatient(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Patient</DialogTitle>
              <DialogDescription>
                Update patient information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={patientForm.name}
                  onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <Label htmlFor="edit-relationship">Relationship</Label>
                <Select
                  value={patientForm.relationship}
                  onValueChange={(value) => setPatientForm({ ...patientForm, relationship: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Self</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="son">Son</SelectItem>
                    <SelectItem value="daughter">Daughter</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-age">Age (optional)</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={patientForm.age}
                  onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                  placeholder="Enter age"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingPatient(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PatientManagement;
