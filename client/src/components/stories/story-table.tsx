import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Search, Newspaper, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { StoryWithQueries } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function StoryTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stories, isLoading } = useQuery<StoryWithQueries[]>({
    queryKey: ["/api/stories"],
  });

  const searchCitationsMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/search-citations`);
      return response.json();
    },
    onSuccess: (data, storyId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/citations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Citation search completed",
        description: `Found ${data.citations.length} citations from ${data.summary.successfulSearches} searches.`,
      });
    },
    onError: () => {
      toast({
        title: "Search failed",
        description: "Failed to search for citations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredStories = stories?.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || story.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Stories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Stories</CardTitle>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-stories"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="tracking">Tracking</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Story</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Published</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Queries</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Citations</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Last Check</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStories?.map((story) => (
                <tr key={story.id} className="hover:bg-slate-50" data-testid={`row-story-${story.id}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Newspaper className="text-primary-600 text-sm" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm" data-testid={`text-title-${story.id}`}>
                          {story.title}
                        </p>
                        <p className="text-slate-500 text-sm" data-testid={`text-category-${story.id}`}>
                          {story.category}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant={story.status === 'published' ? 'default' : 'secondary'}
                            data-testid={`badge-status-${story.id}`}
                          >
                            {story.status}
                          </Badge>
                          <Badge 
                            variant={story.priority === 'high' ? 'destructive' : story.priority === 'medium' ? 'default' : 'secondary'}
                            data-testid={`badge-priority-${story.id}`}
                          >
                            {story.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500" data-testid={`text-published-${story.id}`}>
                    {story.publishedAt ? new Date(story.publishedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900" data-testid={`text-queries-${story.id}`}>
                    {story.queries.length}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${story.citationCount > 0 ? 'text-green-600' : 'text-slate-500'}`} data-testid={`text-citations-${story.id}`}>
                        {story.citationCount}
                      </span>
                      {story.queries.length > 0 && (
                        <Badge 
                          variant={story.citationCount > 0 ? 'default' : 'secondary'}
                          data-testid={`badge-rate-${story.id}`}
                        >
                          {story.queries.length > 0 ? Math.round((story.citationCount / story.queries.length) * 100) : 0}%
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500" data-testid={`text-last-check-${story.id}`}>
                    {story.lastSearched ? new Date(story.lastSearched).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-view-${story.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-edit-${story.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => searchCitationsMutation.mutate(story.id)}
                        disabled={searchCitationsMutation.isPending || story.queries.length === 0}
                        data-testid={`button-search-${story.id}`}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {(!filteredStories || filteredStories.length === 0) && (
            <div className="text-center py-12" data-testid="empty-state-stories">
              <Newspaper className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchTerm || statusFilter !== "all" ? "No matching stories" : "No stories yet"}
              </h3>
              <p className="text-slate-500">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria." 
                  : "Start by adding your first story to track citations."
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
