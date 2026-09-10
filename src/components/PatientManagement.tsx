
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Edit, User, Baby, Heart, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FamilyMember } from "@/types";
import type { FamilyMemberInput } from "@/services/familyMembers";

interface PatientManagementProps {
  patients: FamilyMember[];
  onAdd: (input: FamilyMemberInput) => Promise<void>;
  onEdit: (id: string, input: Partial<FamilyMemberInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  canAddMore: boolean;
  familyMemberLimit: number;
  currentPlan: string;
  onUpgradeClick?: () => void;
}

const emptyForm = { name: "", relationship: "", age: "" };

const PatientManagement = ({
  patients,
  onAdd,
  onEdit,
  onDelete,
  canAddMore,
  familyMemberLimit,
  currentPlan,
  onUpgradeClick,
}: PatientManagementProps) => {
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [editingPatient, setEditingPatient] = useState<FamilyMember | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientForm, setPatientForm] = useState(emptyForm);

  const handleAddPatient = async () => {
    if (!patientForm.name || !patientForm.relationship) return;
    setIsSubmitting(true);
    try {
      await onAdd({
        name: patientForm.name,
        relationship: patientForm.relationship,
        age: patientForm.age ? parseInt(patientForm.age) : undefined,
      });
      setPatientForm(emptyForm);
      setIsAddingPatient(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPatient = (patient: FamilyMember) => {
    setEditingPatient(patient);
    setPatientForm({
      name: patient.name,
      relationship: patient.relationship,
      age: patient.age?.toString() || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPatient || !patientForm.name || !patientForm.relationship) return;
    setIsSubmitting(true);
    try {
      await onEdit(editingPatient._id, {
        name: patientForm.name,
        relationship: patientForm.relationship,
        age: patientForm.age ? parseInt(patientForm.age) : undefined,
      });
      setEditingPatient(null);
      setPatientForm(emptyForm);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    setDeletingId(patientId);
    try {
      await onDelete(patientId);
    } finally {
      setDeletingId(null);
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
        <CardTitle>Manage Patients</CardTitle>
        <CardDescription>Add, edit, or remove family members and yourself</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patients.map((patient) => (
            <div key={patient._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50">
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
                    <span className="text-sm text-muted-foreground ml-1 capitalize">
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
                {!patient.isSelf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePatient(patient._id)}
                    disabled={deletingId === patient._id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {deletingId === patient._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {canAddMore ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAddingPatient(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Patient
            </Button>
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-border bg-secondary/40 text-center">
              <p className="text-sm text-muted-foreground">
                {currentPlan === "free"
                  ? "The Free plan only covers your own profile."
                  : `Your ${currentPlan} plan covers up to ${familyMemberLimit} ${familyMemberLimit === 1 ? "person" : "people"}.`}{" "}
                Upgrade your plan to add more family members.
              </p>
              {onUpgradeClick && (
                <Button variant="outline" size="sm" className="mt-3" onClick={onUpgradeClick}>
                  View Plans
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Add Patient Dialog */}
        <Dialog open={isAddingPatient} onOpenChange={setIsAddingPatient}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Add a family member to manage their consultations. Limits depend on your subscription plan.
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
                <Button variant="outline" onClick={() => setIsAddingPatient(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleAddPatient} disabled={isSubmitting || !patientForm.name || !patientForm.relationship}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Patient
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Patient Dialog */}
        <Dialog open={!!editingPatient} onOpenChange={(open) => !open && setEditingPatient(null)}>
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
                  disabled={editingPatient?.isSelf}
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
                <Button variant="outline" onClick={() => setEditingPatient(null)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSubmitting || !patientForm.name || !patientForm.relationship}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
