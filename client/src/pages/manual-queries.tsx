import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Play, Trash2, ExternalLink, Clock, Search } from "lucide-react";
import type { SearchQuery } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function ManualQueriesPage() {
  const [newQuery, setNewQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch all manual queries
  const { data: queries = [], isLoading } = useQuery({
    queryKey: ["/api/queries"],
  });

  // Create new query mutation
  const createQueryMutation = useMutation({
    mutationFn: async (queryText: string) => {
      return apiRequest("/api/queries", {
        method: "POST",
        body: { query: queryText, queryType: "brand_mention" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queries"] });
      setNewQuery("");
    },
  });

  // Process query mutation
  const processQueryMutation = useMutation({
    mutationFn: async (queryId: string) => {
      return apiRequest(`/api/queries/${queryId}/search`, {
        method: "POST",
      });
    },
    onSuccess: (data, queryId) => {
      console.log("Query processed:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/queries"] });
      setIsProcessing(null);
    },
    onError: (error) => {
      console.error("Query processing failed:", error);
      setIsProcessing(null);
    },
  });

  // Delete query mutation
  const deleteQueryMutation = useMutation({
    mutationFn: async (queryId: string) => {
      return apiRequest(`/api/queries/${queryId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queries"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuery.trim()) {
      createQueryMutation.mutate(newQuery.trim());
    }
  };

  const handleProcessQuery = (queryId: string) => {
    setIsProcessing(queryId);
    processQueryMutation.mutate(queryId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading queries...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Brand Mention Queries</h1>
          <p className="text-muted-foreground mt-2">
            Create manual queries to search for brand mentions through ChatGPT
          </p>
        </div>
      </div>

      {/* Add New Query Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Query
          </CardTitle>
          <CardDescription>
            Enter a query that will be processed by ChatGPT to check for brand mentions and extract cited sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="e.g., What are the latest news about Tesla? How is Apple performing in the market?"
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              rows={3}
              data-testid="input-new-query"
            />
            <Button 
              type="submit" 
              disabled={!newQuery.trim() || createQueryMutation.isPending}
              data-testid="button-create-query"
            >
              {createQueryMutation.isPending ? "Creating..." : "Create Query"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Queries List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Queries ({queries.length})</h2>
        
        {queries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No queries yet</h3>
              <p className="text-muted-foreground">
                Create your first query to start monitoring brand mentions
              </p>
            </CardContent>
          </Card>
        ) : (
          queries.map((query: SearchQuery) => (
            <Card key={query.id} data-testid={`card-query-${query.id}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{query.query}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {new Date(query.createdAt).toLocaleDateString()}
                      <Badge variant="secondary">{query.generatedBy}</Badge>
                      <Badge variant={query.isActive ? "default" : "secondary"}>
                        {query.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleProcessQuery(query.id)}
                      disabled={isProcessing === query.id || processQueryMutation.isPending}
                      data-testid={`button-process-${query.id}`}
                    >
                      {isProcessing === query.id ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Process with ChatGPT
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteQueryMutation.mutate(query.id)}
                      disabled={deleteQueryMutation.isPending}
                      data-testid={`button-delete-${query.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Processing Status */}
      {(processQueryMutation.isPending || isProcessing) && (
        <Card>
          <CardContent className="text-center py-6">
            <div className="text-lg font-medium">Processing query with ChatGPT...</div>
            <p className="text-muted-foreground mt-2">
              Searching for brand mentions and extracting cited sources
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}