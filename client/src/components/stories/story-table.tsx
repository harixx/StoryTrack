import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Edit, Search, Newspaper, AlertCircle, Trash2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { StoryWithQueries, Story } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function StoryTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewStory, setViewStory] = useState<Story | null>(null);
  const [editStory, setEditStory] = useState<Story | null>(null);
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
        description: `Found ${data.citations?.length || 0} citations from ${data.summary?.successfulSearches || 0} searches.`,
      });
    },
    onError: (error) => {
      console.error("Citation search error:", error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Failed to search for citations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("DELETE", `/api/stories/${storyId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Story deleted",
        description: "Story has been permanently removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredStories = stories?.filter(story => {
    const matchesSearch = (story.title || story.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (story.content || story.description || '').toLowerCase().includes(searchTerm.toLowerCase());
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
    <>
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
                          {story.lastSearched ? `${Math.round((story.citationCount / Math.max(story.queries.length, 1)) * 100)}%` : 'N/A'}
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
                        onClick={() => setViewStory(story)}
                        data-testid={`button-view-${story.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditStory(story)}
                        data-testid={`button-edit-${story.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteStoryMutation.mutate(story.id)}
                        disabled={deleteStoryMutation.isPending}
                        data-testid={`button-delete-${story.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => searchCitationsMutation.mutate(story.id)}
                        disabled={searchCitationsMutation.isPending || story.queries.length === 0}
                        data-testid={`button-search-${story.id}`}
                        title={story.queries.length === 0 ? "Generate queries first" : "Search for citations"}
                      >
                        {searchCitationsMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
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
              <p className="text-slate-500 mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria." 
                  : "Start by adding your first story to track citations."
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button 
                  onClick={() => {
                    const addButton = document.querySelector('[data-testid="button-add-story"]') as HTMLElement;
                    if (addButton) addButton.click();
                  }}
                  variant="outline"
                >
                  <Newspaper className="h-4 w-4 mr-2" />
                  Add Your First Story
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    
    {/* View Story Dialog */}
    <Dialog open={!!viewStory} onOpenChange={() => setViewStory(null)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Story</DialogTitle>
        </DialogHeader>
        {viewStory && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{viewStory.title}</h3>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={viewStory.status === 'published' ? 'default' : 'secondary'}>
                  {viewStory.status}
                </Badge>
                <Badge variant={viewStory.priority === 'high' ? 'destructive' : 'default'}>
                  {viewStory.priority}
                </Badge>
                <span className="text-sm text-slate-500">{viewStory.category}</span>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Content:</h4>
              <div className="bg-slate-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{viewStory.content}</p>
              </div>
            </div>
            {viewStory.tags && viewStory.tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tags:</h4>
                <div className="flex flex-wrap gap-2">
                  {viewStory.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="text-xs text-slate-500">
              Created: {new Date(viewStory.createdAt!).toLocaleString()}
              {viewStory.publishedAt && (
                <> • Published: {new Date(viewStory.publishedAt).toLocaleString()}</>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Edit Story Dialog */}
    <Dialog open={!!editStory} onOpenChange={() => setEditStory(null)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Story</DialogTitle>
        </DialogHeader>
        {editStory && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <Input 
                value={editStory.title} 
                onChange={(e) => setEditStory({...editStory, title: e.target.value})}
                placeholder="Story title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
              <Textarea 
                value={editStory.content} 
                onChange={(e) => setEditStory({...editStory, content: e.target.value})}
                rows={6}
                placeholder="Story content"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <Input 
                  value={editStory.category} 
                  onChange={(e) => setEditStory({...editStory, category: e.target.value})}
                  placeholder="Category"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <Select 
                  value={editStory.priority} 
                  onValueChange={(value) => setEditStory({...editStory, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setEditStory(null)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                try {
                  await apiRequest("PUT", `/api/stories/${editStory.id}`, {
                    title: editStory.title,
                    content: editStory.content,
                    category: editStory.category,
                    priority: editStory.priority
                  });
                  queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
                  setEditStory(null);
                  toast({ title: "Story updated", description: "Your changes have been saved." });
                } catch (error) {
                  toast({ title: "Error", description: "Failed to update story.", variant: "destructive" });
                }
              }}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
