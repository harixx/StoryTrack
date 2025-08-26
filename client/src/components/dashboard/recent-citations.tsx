import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { Citation } from "@shared/schema";

export default function RecentCitations() {
  const { data: citations, isLoading } = useQuery<Citation[]>({
    queryKey: ["/api/dashboard/recent-citations"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Citations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
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
          <CardTitle>Recent Citations</CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-view-all-citations">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {citations?.slice(0, 3).map((citation) => (
            <div 
              key={citation.id} 
              className="flex items-start space-x-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50"
              data-testid={`citation-item-${citation.id}`}
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="text-green-600 h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900" data-testid={`citation-query-${citation.id}`}>
                  "{citation.query}"
                </p>
                <p className="text-sm text-slate-500 mt-1" data-testid={`citation-platform-${citation.id}`}>
                  Found in {citation.platform} response
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="text-xs text-slate-400" data-testid={`citation-time-${citation.id}`}>
                    {new Date(citation.foundAt!).toLocaleDateString()}
                  </span>
                  <Badge 
                    variant="default" 
                    className="text-xs"
                    data-testid={`citation-confidence-${citation.id}`}
                  >
                    {citation.confidence}% confidence
                  </Badge>
                </div>
              </div>
            </div>
          ))}

          {(!citations || citations.length === 0) && (
            <div className="text-center py-8" data-testid="empty-citations">
              <Check className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No citations yet</h3>
              <p className="text-slate-500">Start by adding stories and running citation searches.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
