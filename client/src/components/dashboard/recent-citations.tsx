import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Quote } from "lucide-react";
import { Citation } from "@shared/schema";
import { useLocation } from "wouter";

export default function RecentCitations() {
  const [, setLocation] = useLocation();
  
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
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Citations</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation("/citations")}
          data-testid="button-view-all-citations"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {citations && citations.length > 0 ? (
          <div className="space-y-4">
            {citations.slice(0, 5).map((citation) => (
              <div 
                key={citation.id} 
                className="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                data-testid={`citation-item-${citation.id}`}
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Quote className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-900 truncate" data-testid={`citation-platform-${citation.id}`}>
                      Found on {citation.platform}
                    </p>
                    <Badge 
                      variant={(citation.confidence ?? 0) > 70 ? 'default' : (citation.confidence ?? 0) > 40 ? 'secondary' : 'outline'}
                      className="ml-2"
                      data-testid={`citation-confidence-${citation.id}`}
                    >
                      {citation.confidence ?? 0}%
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 truncate mb-1" data-testid={`citation-query-${citation.id}`}>
                    "{citation.query}"
                  </p>
                  {citation.citationText && (
                    <p className="text-xs text-slate-500 line-clamp-2" data-testid={`citation-text-${citation.id}`}>
                      "{citation.citationText}"
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1" data-testid={`citation-date-${citation.id}`}>
                    {new Date(citation.foundAt!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8" data-testid="empty-recent-citations">
            <Quote className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-slate-900 mb-1">No citations yet</h3>
            <p className="text-xs text-slate-500">
              Start by adding stories and running citation searches.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}