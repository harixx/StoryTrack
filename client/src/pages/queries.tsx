import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SearchQuery } from "@shared/schema";

export default function Queries() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: queries, isLoading } = useQuery<SearchQuery[]>({
    queryKey: ["/api/queries"],
  });

  const deleteQueryMutation = useMutation({
    mutationFn: async (queryId: string) => {
      const response = await apiRequest("DELETE", `/api/queries/${queryId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queries"] });
      toast({
        title: "Query deleted",
        description: "Search query has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete query. Please try again.",
        variant: "destructive",
      });
    },
  });

  const runSingleQueryMutation = useMutation({
    mutationFn: async (query: SearchQuery) => {
      if (!query.storyId) throw new Error("No story associated with this query");
      const response = await apiRequest("POST", `/api/stories/${query.storyId}/search-citations`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/citations"] });
      toast({
        title: "Search completed",
        description: `Found ${data.citations.length} citations.`,
      });
    },
    onError: () => {
      toast({
        title: "Search failed",
        description: "Failed to run citation search. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <>
        <Header 
          title="Search Queries"
          subtitle="Manage your search queries and generation settings"
        />
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header 
        title="Search Queries"
        subtitle="Manage your search queries and generation settings"
      />
      <main className="flex-1 p-6 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Search Queries</span>
              <Badge variant="secondary" data-testid="text-query-count">
                {queries?.length || 0} queries
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {queries?.map((query) => (
                <div 
                  key={query.id} 
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                  data-testid={`card-query-${query.id}`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900" data-testid={`text-query-${query.id}`}>
                      {query.query}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge 
                        variant={query.generatedBy === 'ai' ? 'default' : 'secondary'}
                        data-testid={`badge-generated-${query.id}`}
                      >
                        {query.generatedBy === 'ai' ? 'AI Generated' : 'Manual'}
                      </Badge>
                      <Badge 
                        variant={query.isActive ? 'default' : 'secondary'}
                        data-testid={`badge-status-${query.id}`}
                      >
                        {query.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-sm text-slate-500" data-testid={`text-created-${query.id}`}>
                        {new Date(query.createdAt!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => runSingleQueryMutation.mutate(query)}
                      disabled={runSingleQueryMutation.isPending || !query.storyId}
                      data-testid={`button-search-${query.id}`}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteQueryMutation.mutate(query.id)}
                      disabled={deleteQueryMutation.isPending}
                      data-testid={`button-delete-${query.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!queries || queries.length === 0) && (
                <div className="text-center py-12" data-testid="empty-state-queries">
                  <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No search queries</h3>
                  <p className="text-slate-500">Start by adding a story to generate search queries automatically.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
