import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { verifyPayment } from "@/services/payments";
import { getErrorMessage } from "@/services/api";

const SubscriptionCallback = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No payment reference was provided.");
      return;
    }

    (async () => {
      try {
        const { subscription } = await verifyPayment(reference);
        setPlanName(subscription.plan);
        setStatus("success");
      } catch (error) {
        setStatus("error");
        setMessage(getErrorMessage(error, "We couldn't verify this payment."));
      }
    })();
  }, [reference]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Subscription Payment</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "verifying" && (
            <>
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
              <p className="text-gray-600">Verifying your payment with Paystack…</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
              <p className="text-gray-900 font-medium capitalize">
                You're now on the {planName} plan!
              </p>
              <p className="text-sm text-gray-600">Your subscription has been activated.</p>
              <Link to="/patient-dashboard">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="w-12 h-12 mx-auto text-red-600" />
              <p className="text-gray-900 font-medium">Payment verification failed</p>
              <p className="text-sm text-gray-600">{message}</p>
              <Link to="/patient-dashboard">
                <Button variant="outline" className="w-full">Back to Dashboard</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCallback;
