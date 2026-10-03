import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Loader2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createReview } from "@/services/reviews";
import { getErrorMessage } from "@/services/api";

interface RateDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string;
  doctorName: string;
  appointmentId: string;
  // Called once the dialog is done with (submitted or skipped) - typically
  // used to navigate away.
  onDone: () => void;
}

// Shown right after a patient ends a consultation. Framed around the wait
// for prescription approval (doctors can only send prescriptions to the
// admin team, who reviews before it reaches the patient - see
// adminController.updateAdminPrescriptionStatus on the backend), since
// that's a natural moment for a patient to have a minute to spare.
const RateDoctorDialog = ({ open, onOpenChange, doctorId, doctorName, appointmentId, onDone }: RateDoctorDialogProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await createReview({ doctorId, appointmentId, rating, comment: comment.trim() || undefined });
      toast({ title: "Thanks for your feedback!" });
      onDone();
    } catch (error) {
      toast({ title: "Couldn't submit review", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && (next ? onOpenChange(next) : handleSkip())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Consultation Ended</DialogTitle>
          <DialogDescription className="flex items-start gap-2 pt-1">
            <Clock className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
            <span>
              If Dr. {doctorName} sends you a prescription, it needs a quick admin review first - we'll notify
              you once it's ready. While you wait, how was your consultation?
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1"
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          <Textarea
            placeholder={`Anything you'd like to share about your consultation with Dr. ${doctorName}? (optional)`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            className="min-h-[80px]"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleSkip} disabled={isSubmitting}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={rating === 0 || isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RateDoctorDialog;
