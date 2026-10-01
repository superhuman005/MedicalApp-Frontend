import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Loader2, Pencil, Trash2, Star, Users, Video, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAdminPlans, createPlan, updatePlan, deletePlan, type PlanInput } from "@/services/admin";
import { getErrorMessage } from "@/services/api";
import type { AdminPlan } from "@/types";

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

// -1 is the backend's "unlimited" sentinel (Infinity doesn't survive JSON).
const formatLimit = (n: number) => (n === -1 ? "Unlimited" : n);

type PlanFormState = {
  planId: string;
  name: string;
  price: string;
  period: string;
  familyMemberLimit: string;
  videoConsultationsLimit: string; // "-1" means unlimited, stored as text for the input
  chatConsultationsLimit: string;
  features: string; // one per line in the textarea
  isFeatured: boolean;
  isActive: boolean;
  isDefault: boolean;
};

const emptyForm = (): PlanFormState => ({
  planId: "",
  name: "",
  price: "",
  period: "per month",
  familyMemberLimit: "1",
  videoConsultationsLimit: "0",
  chatConsultationsLimit: "0",
  features: "",
  isFeatured: false,
  isActive: true,
  isDefault: false,
});

const planToForm = (plan: AdminPlan): PlanFormState => ({
  planId: plan.planId,
  name: plan.name,
  price: String(plan.price),
  period: plan.period,
  familyMemberLimit: String(plan.familyMemberLimit),
  videoConsultationsLimit: String(plan.videoConsultationsLimit),
  chatConsultationsLimit: String(plan.chatConsultationsLimit),
  features: plan.features.join("\n"),
  isFeatured: plan.isFeatured,
  isActive: plan.isActive,
  isDefault: plan.isDefault,
});

const AdminPlans = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [form, setForm] = useState<PlanFormState>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);

  const [deletingPlan, setDeletingPlan] = useState<AdminPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    try {
      const data = await getAdminPlans();
      setPlans(data);
    } catch (error) {
      toast({ title: "Couldn't load plans", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm());
    setIsDialogOpen(true);
  };

  const openEdit = (plan: AdminPlan) => {
    setEditingPlan(plan);
    setForm(planToForm(plan));
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const price = Number(form.price);
    const familyMemberLimit = Number(form.familyMemberLimit);
    const videoConsultationsLimit = Number(form.videoConsultationsLimit);
    const chatConsultationsLimit = Number(form.chatConsultationsLimit);

    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!editingPlan && !/^[a-z0-9-]+$/.test(form.planId.trim())) {
      toast({
        title: "Invalid plan ID",
        description: "Lowercase letters, numbers and hyphens only (e.g. 'gold-plus')",
        variant: "destructive",
      });
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast({ title: "Price must be a non-negative number", variant: "destructive" });
      return;
    }
    if (form.isDefault && price > 0) {
      toast({
        title: "Default plan must be free",
        description: "Only a plan priced ₦0 can be the one new patients start on",
        variant: "destructive",
      });
      return;
    }

    const payload: PlanInput = {
      name: form.name.trim(),
      price,
      period: form.period.trim() || "per month",
      familyMemberLimit,
      videoConsultationsLimit,
      chatConsultationsLimit,
      features: form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      isDefault: form.isDefault,
    };
    if (!editingPlan) payload.planId = form.planId.trim().toLowerCase();

    setIsSaving(true);
    try {
      if (editingPlan) {
        await updatePlan(editingPlan._id, payload);
        toast({ title: "Plan updated" });
      } else {
        await createPlan(payload);
        toast({ title: "Plan created" });
      }
      setIsDialogOpen(false);
      await load();
    } catch (error) {
      toast({ title: "Couldn't save plan", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlan) return;
    setIsDeleting(true);
    try {
      await deletePlan(deletingPlan._id);
      toast({ title: "Plan deleted" });
      setDeletingPlan(null);
      await load();
    } catch (error) {
      toast({ title: "Couldn't delete plan", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground max-w-xl">
          The only place prices are set anywhere in the app - doctors have no pricing controls. Patients
          subscribe to one of these plans; pricing is in NGN.
        </p>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan._id} className={!plan.isActive ? "opacity-60" : undefined}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  {plan.isFeatured && (
                    <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {plan.isDefault && <Badge variant="outline">Default</Badge>}
                  {!plan.isActive && <Badge variant="outline" className="text-red-600 border-red-600">Inactive</Badge>}
                </div>
                <p className="text-2xl font-semibold mt-2">
                  {plan.price === 0 ? "Free" : nairaFormatter.format(plan.price)}
                </p>
                <p className="text-xs text-muted-foreground">{plan.period}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Up to {plan.familyMemberLimit}
                </span>
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" /> {formatLimit(plan.videoConsultationsLimit)}/mo
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> {formatLimit(plan.chatConsultationsLimit)}/mo
                </span>
              </div>
              {plan.features.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                  {plan.features.length > 4 && <li>+{plan.features.length - 4} more</li>}
                </ul>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(plan)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setDeletingPlan(plan)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create / edit */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !isSaving && setIsDialogOpen(open)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "New Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan
                ? "Changes apply immediately, including to existing subscribers on this plan."
                : "Create a new subscription tier patients can choose from."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editingPlan && (
              <div>
                <Label htmlFor="plan-id">Plan ID</Label>
                <Input
                  id="plan-id"
                  className="mt-1"
                  placeholder="e.g. gold-plus"
                  value={form.planId}
                  onChange={(e) => setForm({ ...form, planId: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lowercase letters, numbers and hyphens only. Can't be changed later.
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="plan-name">Name</Label>
              <Input
                id="plan-name"
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="plan-price">Price (₦)</Label>
                <Input
                  id="plan-price"
                  type="number"
                  min={0}
                  step={100}
                  className="mt-1"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="plan-period">Billing period label</Label>
                <Input
                  id="plan-period"
                  className="mt-1"
                  placeholder="per month"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="plan-family">Family members</Label>
                <Input
                  id="plan-family"
                  type="number"
                  min={1}
                  className="mt-1"
                  value={form.familyMemberLimit}
                  onChange={(e) => setForm({ ...form, familyMemberLimit: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="plan-video">Video/mo</Label>
                <Input
                  id="plan-video"
                  type="number"
                  min={-1}
                  className="mt-1"
                  value={form.videoConsultationsLimit}
                  onChange={(e) => setForm({ ...form, videoConsultationsLimit: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="plan-chat">Chat/mo</Label>
                <Input
                  id="plan-chat"
                  type="number"
                  min={-1}
                  className="mt-1"
                  value={form.chatConsultationsLimit}
                  onChange={(e) => setForm({ ...form, chatConsultationsLimit: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Use -1 for unlimited video/chat consultations.</p>
            <div>
              <Label htmlFor="plan-features">Features (one per line)</Label>
              <Textarea
                id="plan-features"
                className="mt-1"
                rows={4}
                placeholder={"Unlimited chat consultations\nPriority support"}
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="plan-featured"
                  checked={form.isFeatured}
                  onCheckedChange={(checked) => setForm({ ...form, isFeatured: checked === true })}
                />
                <Label htmlFor="plan-featured" className="font-normal cursor-pointer">
                  Show "Most Popular" badge
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="plan-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: checked === true })}
                />
                <Label htmlFor="plan-active" className="font-normal cursor-pointer">
                  Active (visible to patients)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="plan-default"
                  checked={form.isDefault}
                  onCheckedChange={(checked) => setForm({ ...form, isDefault: checked === true })}
                />
                <Label htmlFor="plan-default" className="font-normal cursor-pointer">
                  Default plan for new patients (must be free)
                </Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPlan ? "Save Changes" : "Create Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingPlan} onOpenChange={(open) => !open && setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingPlan?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. If any patient is currently subscribed to this plan, deletion will be
              refused - deactivate it instead so existing subscribers keep working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPlans;
