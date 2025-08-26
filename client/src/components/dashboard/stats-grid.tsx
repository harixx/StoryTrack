import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Quote, Search, TrendingUp } from "lucide-react";
import { DashboardStats } from "@shared/schema";

const statCards = [
  {
    title: "Total Stories",
    key: "totalStories" as keyof DashboardStats,
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    testId: "stat-total-stories"
  },
  {
    title: "Citations Found",
    key: "citations" as keyof DashboardStats,
    icon: Quote,
    color: "text-green-600",
    bgColor: "bg-green-100",
    testId: "stat-citations"
  },
  {
    title: "Active Queries",
    key: "queries" as keyof DashboardStats,
    icon: Search,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    testId: "stat-queries"
  },
  {
    title: "Citation Rate",
    key: "citationRate" as keyof DashboardStats,
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    suffix: "%",
    testId: "stat-citation-rate"
  },
];

export default function StatsGrid() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => {
        const value = stats ? stats[stat.key] : 0;
        const displayValue = `${value}${stat.suffix || ''}`;

        return (
          <Card key={stat.title} data-testid={stat.testId}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900" data-testid={`${stat.testId}-value`}>
                {displayValue}
              </div>
              {stat.key === 'citationRate' && (
                <p className="text-xs text-slate-500 mt-1">
                  {value >= 10 ? 'Good' : value >= 5 ? 'Fair' : 'Low'} detection rate
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}