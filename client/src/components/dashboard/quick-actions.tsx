import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Download, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import AddStoryModal from "@/components/stories/add-story-modal-simple";

export default function QuickActions() {
  const [, setLocation] = useLocation();
  const [showAddStory, setShowAddStory] = useState(false);

  const handleExport = async () => {
    try {
      const response = await fetch("/api/export/report");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `citation-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const quickActions = [
    {
      title: "Add New Story",
      description: "Publish a new story to track",
      icon: Plus,
      action: () => setShowAddStory(true),
      testId: "quick-action-add-story"
    },
    {
      title: "View Queries",
      description: "Manage search queries",
      icon: Search,
      action: () => setLocation("/queries"),
      testId: "quick-action-view-queries"
    },
    {
      title: "Export Report",
      description: "Download citation data",
      icon: Download,
      action: handleExport,
      testId: "quick-action-export"
    },
    {
      title: "Settings",
      description: "Configure tracking options",
      icon: Settings,
      action: () => setLocation("/settings"),
      testId: "quick-action-settings"
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={action.action}
                data-testid={action.testId}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <action.icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900">
                      {action.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <AddStoryModal 
        open={showAddStory} 
        onOpenChange={setShowAddStory}
      />
    </>
  );
}