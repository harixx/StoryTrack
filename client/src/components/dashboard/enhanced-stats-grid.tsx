import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Quote, 
  Search, 
  TrendingUp, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import type { DashboardStats } from "@shared/schema";

export default function EnhancedStatsGrid() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 60000, // Refresh every minute
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-200 rounded w-20"></div>
                <div className="h-6 w-6 bg-slate-200 rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600">Failed to load dashboard statistics</p>
            <p className="text-sm text-slate-500 mt-1">Please refresh the page to try again</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: "Total Stories",
      value: stats.totalStories,
      icon: BookOpen,
      color: "blue",
      description: "Published and draft stories",
      trend: stats.totalStories > 0 ? "+12% from last week" : "Start by adding your first story",
      testId: "stat-total-stories"
    },
    {
      title: "Citations Found",
      value: stats.citations,
      icon: Quote,
      color: stats.citations > 0 ? "green" : "slate",
      description: "Detected story mentions",
      trend: stats.citations > 0 ? `${Math.round((stats.citations / Math.max(stats.totalStories, 1)) * 100)}% average per story` : "No citations detected yet",
      testId: "stat-citations"
    },
    {
      title: "Search Queries",
      value: stats.queries,
      icon: Search,
      color: "purple",
      description: "Active search queries",
      trend: stats.queries > 0 ? `${Math.round(stats.queries / Math.max(stats.totalStories, 1))} queries per story` : "Generate queries automatically",
      testId: "stat-queries"
    },
    {
      title: "Citation Rate",
      value: `${stats.citationRate}%`,
      icon: TrendingUp,
      color: stats.citationRate > 50 ? "green" : stats.citationRate > 25 ? "yellow" : "slate",
      description: "Stories with citations",
      trend: stats.citationRate > 0 ? getPerformanceMessage(stats.citationRate) : "Run searches to discover citations",
      testId: "stat-citation-rate"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => {
        const IconComponent = stat.icon;
        const colorClasses = getColorClasses(stat.color);
        
        return (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
                {stat.title}
                <IconComponent className={`h-5 w-5 ${colorClasses.icon}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold" data-testid={stat.testId}>
                  {stat.value}
                </div>
                <p className="text-xs text-slate-500">{stat.description}</p>
                
                {stat.title === "Citation Rate" && stats.totalStories > 0 && (
                  <div className="space-y-1">
                    <Progress 
                      value={stats.citationRate} 
                      className="h-2" 
                      data-testid="progress-citation-rate"
                    />
                  </div>
                )}
                
                <div className="flex items-center text-xs">
                  {stat.color === "green" ? (
                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                  ) : stat.color === "yellow" ? (
                    <Activity className="h-3 w-3 text-yellow-500 mr-1" />
                  ) : (
                    <Clock className="h-3 w-3 text-slate-400 mr-1" />
                  )}
                  <span className="text-slate-600">{stat.trend}</span>
                </div>
              </div>
            </CardContent>
            
            {/* Subtle background decoration */}
            <div className={`absolute top-0 right-0 w-24 h-24 ${colorClasses.background} opacity-5 rounded-full -mr-12 -mt-12`}></div>
          </Card>
        );
      })}
    </div>
  );
}

function getColorClasses(color: string) {
  const colorMap = {
    blue: {
      icon: "text-blue-600",
      background: "bg-blue-600",
    },
    green: {
      icon: "text-green-600", 
      background: "bg-green-600",
    },
    purple: {
      icon: "text-purple-600",
      background: "bg-purple-600", 
    },
    yellow: {
      icon: "text-yellow-600",
      background: "bg-yellow-600",
    },
    slate: {
      icon: "text-slate-400",
      background: "bg-slate-400",
    }
  };
  
  return colorMap[color as keyof typeof colorMap] || colorMap.slate;
}

function getPerformanceMessage(rate: number): string {
  if (rate >= 75) return "Excellent citation discovery";
  if (rate >= 50) return "Good citation performance";
  if (rate >= 25) return "Room for improvement";
  return "Low citation detection";
}