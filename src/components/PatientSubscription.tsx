
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, Users } from "lucide-react";

const PatientSubscription = () => {
  const [currentPlan] = useState("free"); // This would come from your auth/subscription context

  const plans = [
    {
      id: "free",
      name: "Free Plan",
      price: "$0",
      period: "forever",
      description: "Basic healthcare consultations",
      familyMembers: 1,
      features: [
        "2 chat consultations per month",
        "Basic medical records",
        "Email support",
        "For yourself only"
      ],
      icon: <Star className="w-6 h-6" />,
      color: "border-gray-200",
      buttonText: "Current Plan",
      disabled: true
    },
    {
      id: "basic",
      name: "Basic Plan",
      price: "$14.99",
      period: "per month",
      description: "Enhanced healthcare access",
      familyMembers: 2,
      features: [
        "Unlimited chat consultations",
        "5 video consultations per month",
        "Priority support",
        "Advanced medical records",
        "Prescription management",
        "Coverage for up to 2 family members"
      ],
      icon: <Zap className="w-6 h-6" />,
      color: "border-blue-200",
      buttonText: "Upgrade to Basic",
      disabled: false
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: "$24.99",
      period: "per month",
      description: "Complete healthcare solution",
      familyMembers: 4,
      features: [
        "Unlimited chat consultations",
        "Unlimited video consultations",
        "24/7 priority support",
        "Specialist consultations",
        "Health monitoring",
        "Coverage for up to 4 family members",
        "Lab test integration",
        "Prescription delivery"
      ],
      icon: <Crown className="w-6 h-6" />,
      color: "border-purple-200",
      buttonText: "Upgrade to Premium",
      disabled: false,
      popular: true
    },
    {
      id: "family",
      name: "Family Plan",
      price: "$39.99",
      period: "per month",
      description: "Complete family healthcare coverage",
      familyMembers: 8,
      features: [
        "Unlimited chat consultations",
        "Unlimited video consultations",
        "24/7 priority support",
        "Specialist consultations",
        "Health monitoring",
        "Coverage for up to 8 family members",
        "Lab test integration",
        "Prescription delivery",
        "Dedicated family health coordinator",
        "Emergency consultation priority"
      ],
      icon: <Users className="w-6 h-6" />,
      color: "border-green-200",
      buttonText: "Upgrade to Family",
      disabled: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle>Your Current Plan</CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold">Free Plan</h3>
                <p className="text-sm text-gray-600">2 consultations remaining this month</p>
                <p className="text-xs text-gray-500">Coverage: 1 person (yourself)</p>
              </div>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Next billing date:</span>
                <p className="font-medium">No billing required</p>
              </div>
              <div>
                <span className="text-gray-600">Consultations used:</span>
                <p className="font-medium">0 of 2 this month</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.color} ${plan.popular ? 'ring-2 ring-purple-500' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-500">Most Popular</Badge>
              </div>
            )}
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                {plan.icon}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="space-y-1">
                <div className="text-3xl font-bold">{plan.price}</div>
                <div className="text-sm text-gray-600">{plan.period}</div>
              </div>
              <div className="bg-blue-50 p-2 rounded-lg mb-2">
                <div className="flex items-center justify-center space-x-1 text-sm font-medium text-blue-700">
                  <Users className="w-4 h-4" />
                  <span>Up to {plan.familyMembers} {plan.familyMembers === 1 ? 'person' : 'members'}</span>
                </div>
              </div>
              <CardDescription>{plan.description}</CardDescription>
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
                disabled={plan.disabled}
                variant={currentPlan === plan.id ? "outline" : "default"}
              >
                {plan.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Family Plan Benefits */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Family Plan Benefits</span>
          </CardTitle>
          <CardDescription>Why choose a family plan?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold">Cost Effective</h4>
              <p className="text-sm text-gray-600">Save up to 60% compared to individual plans</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold">One Account</h4>
              <p className="text-sm text-gray-600">Manage everyone's health in one place</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold">Priority Care</h4>
              <p className="text-sm text-gray-600">Family health coordinator and priority support</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your payment history and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No billing history available for free plan</p>
            <p className="text-sm mt-1">Upgrade to a paid plan to see billing history</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientSubscription;
