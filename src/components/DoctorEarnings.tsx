
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getEarningsSummary, getTransactions } from "@/services/earnings";
import { getErrorMessage } from "@/services/api";
import type { EarningsSummary, EarningsBreakdownItem, Transaction } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  video: "Video Consultations",
  chat: "Chat Consultations",
  followup: "Follow-up Sessions",
};

// Groups this month's transactions into calendar weeks (1st-7th, 8th-14th, ...)
// so the "weekly earnings" view reflects real data instead of a fabricated series.
const groupByWeek = (transactions: Transaction[]) => {
  const buckets = new Map<number, number>();
  transactions.forEach((t) => {
    const day = new Date(t.date).getDate();
    const week = Math.floor((day - 1) / 7) + 1;
    buckets.set(week, (buckets.get(week) || 0) + t.amount);
  });
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([week, amount]) => ({ week: `Week ${week}`, amount }));
};

const DoctorEarnings = () => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [breakdown, setBreakdown] = useState<EarningsBreakdownItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ summary: s, breakdown: b }, tx] = await Promise.all([
          getEarningsSummary(),
          getTransactions(),
        ]);
        setSummary(s);
        setBreakdown(b);
        setTransactions(tx);
      } catch (error) {
        toast({
          title: "Couldn't load earnings",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!summary) return null;

  const thisMonthTransactions = transactions.filter((t) => {
    const now = new Date();
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const weeklyEarnings = groupByWeek(thisMonthTransactions);

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Monthly Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${summary.current.toLocaleString()}</div>
            <div className="flex items-center mt-1">
              {summary.growth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${summary.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.growth > 0 ? '+' : ''}{summary.growth}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Total Consultations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.consultations}</div>
            <div className="text-sm text-gray-500 mt-1">
              {summary.consultations > 0 ? `Avg: $${summary.avgPerConsultation} per consultation` : 'No consultations this month yet'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Star className="w-4 h-4 mr-2" />
              Patient Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary.rating > 0 ? summary.rating.toFixed(1) : '—'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {summary.rating > 0 ? 'Based on patient reviews' : 'No reviews yet'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
          <CardDescription>Revenue by consultation type this month</CardDescription>
        </CardHeader>
        <CardContent>
          {breakdown.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No earnings recorded this month yet.</p>
          ) : (
            <div className="space-y-4">
              {breakdown.map((item) => (
                <div key={item.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">{TYPE_LABELS[item.type] || item.type}</h3>
                    <p className="text-sm text-gray-600">{item.sessions} session{item.sessions === 1 ? '' : 's'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${item.amount.toLocaleString()}</p>
                    <Badge variant="outline" className="text-xs">
                      {summary.current > 0 ? ((item.amount / summary.current) * 100).toFixed(1) : '0.0'}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Earnings</CardTitle>
          <CardDescription>Earnings progression this month</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyEarnings.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No earnings recorded this month yet.</p>
          ) : (
            <div className="space-y-3">
              {weeklyEarnings.map((week) => (
                <div key={week.week} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{week.week}</span>
                  <span className="font-semibold">${week.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorEarnings;
