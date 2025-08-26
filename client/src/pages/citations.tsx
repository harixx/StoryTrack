import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, ExternalLink } from "lucide-react";
import { Citation } from "@shared/schema";
import EmptyState from "@/components/common/empty-state";

export default function Citations() {
  const { data: citations, isLoading } = useQuery<Citation[]>({
    queryKey: ["/api/citations"],
  });

  if (isLoading) {
    return (
      <>
        <Header 
          title="Citations Found"
          subtitle="Review discovered citations of your stories"
        />
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header 
        title="Citations Found"
        subtitle="Review discovered citations of your stories"
      />
      <main className="flex-1 p-6 overflow-y-auto">
        {citations && citations.length === 0 ? (
          <EmptyState
            icon={<Quote className="h-8 w-8 text-slate-400" />}
            title="No Citations Found"
            description="Run citation searches on your published stories to discover where your content is being referenced by AI systems."
            action={{
              label: "Search for Citations",
              onClick: () => window.location.href = "/stories"
            }}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Citations</span>
                <Badge variant="secondary" data-testid="text-citation-count">
                  {citations?.length || 0} citations
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {citations?.map((citation) => (
                <div 
                  key={citation.id} 
                  className="p-6 border border-slate-200 rounded-lg hover:bg-slate-50"
                  data-testid={`card-citation-${citation.id}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Quote className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-slate-900" data-testid={`text-platform-${citation.id}`}>
                          Found on {citation.platform}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={(citation.confidence ?? 0) > 70 ? 'default' : (citation.confidence ?? 0) > 40 ? 'secondary' : 'outline'}
                            data-testid={`badge-confidence-${citation.id}`}
                          >
                            {citation.confidence ?? 0}% confidence
                          </Badge>
                          <span className="text-sm text-slate-500" data-testid={`text-found-date-${citation.id}`}>
                            {new Date(citation.foundAt!).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-3" data-testid={`text-query-${citation.id}`}>
                        <strong>Query:</strong> "{citation.query}"
                      </p>
                      
                      {citation.citationText && (
                        <div className="bg-slate-50 rounded-lg p-4 mb-3">
                          <p className="text-sm text-slate-700" data-testid={`text-citation-${citation.id}`}>
                            "{citation.citationText}"
                          </p>
                        </div>
                      )}
                      
                      {citation.context && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-slate-600 hover:text-slate-900">
                            View full context
                          </summary>
                          <div className="mt-2 p-3 bg-slate-50 rounded border" data-testid={`text-context-${citation.id}`}>
                            {citation.context}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
                ))}
                {(!citations || citations.length === 0) && (
                  <div className="text-center py-12" data-testid="empty-state-citations">
                    <Quote className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No citations found</h3>
                    <p className="text-slate-500">Run citation searches on your stories to discover references.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
