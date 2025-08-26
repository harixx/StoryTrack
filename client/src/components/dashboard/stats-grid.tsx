import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper, Quote, Search, PieChart } from "lucide-react";
import { DashboardStats } from "@shared/schema";

export default function StatsGrid() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Stories",
      value: stats?.totalStories || 0,
      icon: Newspaper,
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
      change: "+12%",
      changeText: "from last month",
      testId: "total-stories"
    },
    {
      title: "Citations Found",
      value: stats?.citations || 0,
      icon: Quote,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      change: "+8%",
      changeText: "from last month",
      testId: "citations-found"
    },
    {
      title: "Search Queries",
      value: stats?.queries || 0,
      icon: Search,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      change: "+15%",
      changeText: "from last month",
      testId: "search-queries"
    },
    {
      title: "Citation Rate",
      value: `${stats?.citationRate || 0}%`,
      icon: PieChart,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      change: "+3%",
      changeText: "from last month",
      testId: "citation-rate"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statsCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.testId}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-900" data-testid={`stat-${card.testId}`}>
                    {card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.iconColor}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-green-600 font-medium">{card.change}</span>
                <span className="text-sm text-slate-500 ml-2">{card.changeText}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
