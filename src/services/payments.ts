import API from "./api";
import type { Payment, Subscription, PlanId } from "@/types";

export const initializePayment = async (
  plan: Exclude<PlanId, "free">
): Promise<{ authorizationUrl: string; reference: string }> => {
  const { data } = await API.post("/payments/initialize", { plan });
  return { authorizationUrl: data.authorizationUrl, reference: data.reference };
};

export const verifyPayment = async (
  reference: string
): Promise<{ payment: Payment; subscription: Subscription }> => {
  const { data } = await API.get(`/payments/verify/${reference}`);
  return { payment: data.payment, subscription: data.subscription };
};

export const getMyPayments = async (): Promise<Payment[]> => {
  const { data } = await API.get("/payments");
  return data.payments;
};
