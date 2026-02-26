
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Star } from "lucide-react";

const DoctorEarnings = () => {
  // Mock earnings data
  const monthlyEarnings = {
    current: 8750,
    previous: 7420,
    growth: 17.9,
    consultations: 47,
    avgPerConsultation: 186,
    rating: 4.9
  };

  const earningsBreakdown = [
    { type: "Video Consultations", amount: 6200, sessions: 31, rate: 200 },
    { type: "Chat Consultations", amount: 2400, sessions: 16, rate: 150 },
    { type: "Follow-up Sessions", amount: 150, sessions: 3, rate: 50 }
  ];

  const weeklyEarnings = [
    { week: "Week 1", amount: 2100 },
    { week: "Week 2", amount: 2300 },
    { week: "Week 3", amount: 2150 },
    { week: "Week 4", amount: 2200 }
  ];

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
            <div className="text-2xl font-bold text-green-600">${monthlyEarnings.current.toLocaleString()}</div>
            <div className="flex items-center mt-1">
              {monthlyEarnings.growth > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${monthlyEarnings.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monthlyEarnings.growth > 0 ? '+' : ''}{monthlyEarnings.growth}% from last month
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
            <div className="text-2xl font-bold text-blue-600">{monthlyEarnings.consultations}</div>
            <div className="text-sm text-gray-500 mt-1">
              Avg: ${monthlyEarnings.avgPerConsultation} per consultation
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
            <div className="text-2xl font-bold text-purple-600">{monthlyEarnings.rating}</div>
            <div className="text-sm text-gray-500 mt-1">
              Based on {monthlyEarnings.consultations} reviews
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
          <div className="space-y-4">
            {earningsBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">{item.type}</h3>
                  <p className="text-sm text-gray-600">{item.sessions} sessions • ${item.rate} per session</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${item.amount.toLocaleString()}</p>
                  <Badge variant="outline" className="text-xs">
                    {((item.amount / monthlyEarnings.current) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Earnings</CardTitle>
          <CardDescription>Earnings progression over the past 4 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyEarnings.map((week, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{week.week}</span>
                <span className="font-semibold">${week.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>Manage your payment preferences and banking details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Bank Account</h3>
              <p className="text-sm text-gray-600">••••••••••••1234</p>
            </div>
            <Button variant="outline" size="sm">Update</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Payment Schedule</h3>
              <p className="text-sm text-gray-600">Weekly automatic transfers</p>
            </div>
            <Button variant="outline" size="sm">Change</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorEarnings;
