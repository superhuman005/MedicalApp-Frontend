
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPlans, getCurrentSubscription, subscribeToPlan } from "@/services/subscriptions";
import { getErrorMessage } from "@/services/api";
import type { Plan, Subscription, SubscriptionLimits, PlanId } from "@/types";

const PLAN_ICONS: Record<PlanId, React.ReactNode> = {
  free: <Star className="w-6 h-6" />,
  basic: <Zap className="w-6 h-6" />,
  premium: <Crown className="w-6 h-6" />,
};

const PLAN_COLORS: Record<PlanId, string> = {
  free: "border-gray-200",
  basic: "border-blue-200",
  premium: "border-purple-200",
};

const formatLimit = (n: number) => (n === Infinity ? "Unlimited" : n);

const PatientSubscription = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribingTo, setSubscribingTo] = useState<PlanId | null>(null);

  const load = async () => {
    try {
      const [plansData, currentData] = await Promise.all([getPlans(), getCurrentSubscription()]);
      setPlans(plansData);
      setSubscription(currentData.subscription);
      setLimits(currentData.limits);
    } catch (error) {
      toast({
        title: "Couldn't load subscription",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubscribe = async (planId: PlanId) => {
    setSubscribingTo(planId);
    try {
      const updated = await subscribeToPlan(planId);
      setSubscription(updated);
      const plansData = await getPlans();
      const currentData = await getCurrentSubscription();
      setLimits(currentData.limits);
      toast({
        title: "Plan Updated",
        description: `You're now on the ${plansData.find((p) => p.id === planId)?.name || planId} plan.`,
      });
    } catch (error) {
      toast({
        title: "Couldn't update plan",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubscribingTo(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const currentPlan = plans.find((p) => p.id === subscription?.plan);

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle>Your Current Plan</CardTitle>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                {subscription ? PLAN_ICONS[subscription.plan] : <Star className="w-6 h-6 text-gray-600" />}
              </div>
              <div>
                <h3 className="font-semibold">{currentPlan?.name || "Free Plan"}</h3>
                {limits && (
                  <p className="text-sm text-gray-600">
                    {formatLimit(limits.chatConsultationsLimit)} chat / {formatLimit(limits.videoConsultationsLimit)} video consultations per month
                  </p>
                )}
                {limits && <p className="text-xs text-gray-500">Coverage: up to {limits.familyMemberLimit} {limits.familyMemberLimit === 1 ? 'person' : 'people'}</p>}
              </div>
            </div>
            <Badge variant="outline" className="capitalize">{subscription?.status || 'active'}</Badge>
          </div>
          {subscription && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Consultations used this period:</span>
                  <p className="font-medium">
                    {subscription.chatConsultationsUsed} chat / {subscription.videoConsultationsUsed} video
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Renewal:</span>
                  <p className="font-medium">
                    {subscription.plan === 'free'
                      ? 'No billing required'
                      : subscription.endDate
                      ? new Date(subscription.endDate).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = subscription?.plan === plan.id;
          const isPopular = plan.id === 'premium';
          return (
            <Card key={plan.id} className={`relative ${PLAN_COLORS[plan.id]} ${isPopular ? 'ring-2 ring-purple-500' : ''}`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  {PLAN_ICONS[plan.id]}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">${plan.price}</div>
                  <div className="text-sm text-gray-600">{plan.period}</div>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg mb-2">
                  <div className="flex items-center justify-center space-x-1 text-sm font-medium text-blue-700">
                    <Users className="w-4 h-4" />
                    <span>Up to {plan.familyMembers} {plan.familyMembers === 1 ? 'person' : 'members'}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  disabled={isCurrent || subscribingTo !== null}
                  variant={isCurrent ? "outline" : "default"}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {subscribingTo === plan.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isCurrent ? "Current Plan" : `Switch to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your payment history and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Billing history isn't available yet</p>
            <p className="text-sm mt-1">This section will show your invoices once billing is enabled</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientSubscription;
