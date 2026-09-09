import API from "./api";
import type { Plan, Subscription, SubscriptionLimits, PlanId } from "@/types";

export const getPlans = async (): Promise<Plan[]> => {
  const { data } = await API.get("/subscriptions/plans");
  return data.plans;
};

export const getCurrentSubscription = async (): Promise<{
  subscription: Subscription;
  limits: SubscriptionLimits;
}> => {
  const { data } = await API.get("/subscriptions/current");
  return { subscription: data.subscription, limits: data.limits };
};

export const subscribeToPlan = async (plan: PlanId): Promise<Subscription> => {
  const { data } = await API.post("/subscriptions/subscribe", { plan });
  return data.subscription;
};

export const cancelSubscription = async (): Promise<Subscription> => {
  const { data } = await API.post("/subscriptions/cancel");
  return data.subscription;
};
