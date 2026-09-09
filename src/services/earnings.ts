import API from "./api";
import type { EarningsSummary, EarningsBreakdownItem, Transaction } from "@/types";

export const getEarningsSummary = async (): Promise<{
  summary: EarningsSummary;
  breakdown: EarningsBreakdownItem[];
}> => {
  const { data } = await API.get("/earnings/summary");
  return { summary: data.summary, breakdown: data.breakdown };
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data } = await API.get("/earnings/transactions");
  return data.transactions;
};
