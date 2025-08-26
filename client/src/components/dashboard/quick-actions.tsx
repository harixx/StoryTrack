import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Wand2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StoryWithQueries } from "@shared/schema";
import AddStoryModal from "@/components/stories/add-story-modal";

export default function QuickActions() {
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stories } = useQuery<StoryWithQueries[]>({
    queryKey: ["/api/stories"],
  });

  const searchAllCitationsMutation = useMutation({
    mutationFn: async () => {
      const publishedStories = stories?.filter(story => 
        story.status === 'published' && story.queries.length > 0
      ) || [];
      
      if (publishedStories.length === 0) {
        throw new Error("No published stories with queries found");
      }

      const results = [];
      for (const story of publishedStories) {
        const response = await apiRequest("POST", `/api/stories/${story.id}/search-citations`);
        const data = await response.json();
        results.push(data);
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/citations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      const totalCitations = results.reduce((sum, result) => sum + result.citations.length, 0);
      const totalSearches = results.reduce((sum, result) => sum + result.summary.successfulSearches, 0);
      
      toast({
        title: "Citation search completed",
        description: `Found ${totalCitations} citations from ${totalSearches} searches across ${results.length} stories.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Search failed", 
        description: error.message || "Failed to search for citations. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full p-4 h-auto justify-start"
            onClick={() => setShowAddModal(true)}
            data-testid="button-quick-add-story"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Plus className="text-primary-600 h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-900">Publish New Story</p>
                <p className="text-sm text-slate-500">Add and track a new story</p>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full p-4 h-auto justify-start"
            onClick={() => searchAllCitationsMutation.mutate()}
            disabled={searchAllCitationsMutation.isPending || !stories?.some(s => s.status === 'published' && s.queries.length > 0)}
            data-testid="button-quick-search"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Search className="text-amber-600 h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-900">Run Citation Search</p>
                <p className="text-sm text-slate-500">Check for new citations</p>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full p-4 h-auto justify-start"
            data-testid="button-quick-generate"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Wand2 className="text-green-600 h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-900">Generate Queries</p>
                <p className="text-sm text-slate-500">AI-powered query suggestions</p>
              </div>
            </div>
          </Button>

          <div className="pt-4 border-t border-slate-200">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-2" data-testid="text-api-usage">
                API Usage This Month
              </p>
              <Progress value={68} className="mb-2" data-testid="progress-api-usage" />
              <p className="text-xs text-slate-500" data-testid="text-api-usage-details">
                6,800 / 10,000 requests
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddStoryModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal} 
      />
    </>
  );
}
