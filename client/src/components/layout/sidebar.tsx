import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Quote, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@shared/schema";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, testId: "nav-dashboard" },
  { name: "Stories", href: "/stories", icon: FileText, testId: "nav-stories" },
  { name: "Queries", href: "/queries", icon: Search, testId: "nav-queries" },
  { name: "Citations", href: "/citations", icon: Quote, testId: "nav-citations" },
  { name: "Settings", href: "/settings", icon: Settings, testId: "nav-settings" },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className={cn(
      "bg-white border-r border-slate-200 flex flex-col transition-all duration-200",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-semibold text-slate-900" data-testid="text-app-title">
                Citation Tracker
              </h1>
              <p className="text-xs text-slate-500">Monitor your content citations</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            data-testid="button-toggle-sidebar"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Button
              key={item.name}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                collapsed && "px-2"
              )}
              onClick={() => setLocation(item.href)}
              data-testid={item.testId}
            >
              <item.icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
              {!collapsed && (
                <span className="flex-1 text-left">{item.name}</span>
              )}
              {!collapsed && item.name === "Citations" && stats && stats.citations > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {stats.citations}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Stats Footer */}
      {!collapsed && stats && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Stories:</span>
              <span className="font-medium" data-testid="text-sidebar-stories">
                {stats.totalStories}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Citations:</span>
              <span className="font-medium" data-testid="text-sidebar-citations">
                {stats.citations}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Rate:</span>
              <span className="font-medium" data-testid="text-sidebar-rate">
                {stats.citationRate}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}