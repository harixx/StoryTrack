import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [openaiStatus, setOpenaiStatus] = useState<'checking' | 'available' | 'missing'>('checking');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkOpenaiStatus();
  }, []);

  const checkOpenaiStatus = async () => {
    try {
      const response = await fetch('/api/generate-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: 'Test', 
          content: 'Test content', 
          tags: [] 
        })
      });
      
      if (response.ok) {
        setOpenaiStatus('available');
      } else {
        const error = await response.json();
        if (error.details?.includes('OpenAI API is not configured')) {
          setOpenaiStatus('missing');
        } else {
          setOpenaiStatus('available');
        }
      }
    } catch (error) {
      setOpenaiStatus('missing');
    }
  };

  const testApiConnection = async () => {
    setIsTestingApi(true);
    try {
      const response = await fetch('/api/generate-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: 'Test Story', 
          content: 'This is a test story to verify API connectivity', 
          tags: ['test'] 
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "API Test Successful",
          description: `Generated ${data.queries?.length || 0} test queries successfully.`,
        });
        setOpenaiStatus('available');
      } else {
        const error = await response.json();
        toast({
          title: "API Test Failed",
          description: error.details || "API connection test failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "API Test Failed", 
        description: "Could not connect to API service",
        variant: "destructive",
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  return (
    <>
      <Header 
        title="Settings & Configuration"
        subtitle="Manage your citation tracking preferences and API settings"
      />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Key className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">OpenAI API Key</h3>
                    <p className="text-sm text-slate-500">
                      Required for AI-powered query generation and citation searching
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={openaiStatus === 'available' ? 'default' : 'destructive'}
                    data-testid="openai-status-badge"
                  >
                    {openaiStatus === 'checking' && (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Checking...
                      </>
                    )}
                    {openaiStatus === 'available' && (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </>
                    )}
                    {openaiStatus === 'missing' && (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Configured
                      </>
                    )}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={testApiConnection}
                    disabled={isTestingApi}
                    data-testid="test-api-button"
                  >
                    {isTestingApi ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                </div>
              </div>

              {openaiStatus === 'missing' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>OpenAI API Key Required:</strong> To enable AI-powered features, you need to add your OpenAI API key 
                    as an environment variable named <code className="bg-slate-100 px-1 rounded">OPENAI_API_KEY</code>. 
                    Without this, the app will use basic template-based query generation.
                  </AlertDescription>
                </Alert>
              )}

              {openaiStatus === 'available' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>API Connected:</strong> OpenAI API is properly configured and working. 
                    You can use AI-powered query generation and citation search features.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Feature Status */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Story Management</span>
                  <Badge variant="default" data-testid="feature-stories">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Query Generation</span>
                  <Badge 
                    variant={openaiStatus === 'available' ? 'default' : 'secondary'}
                    data-testid="feature-queries"
                  >
                    {openaiStatus === 'available' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        AI + Template
                      </>
                    ) : (
                      <>Template Only</>
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Citation Search</span>
                  <Badge 
                    variant={openaiStatus === 'available' ? 'default' : 'secondary'}
                    data-testid="feature-citations"
                  >
                    {openaiStatus === 'available' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>Limited</>
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Export Reports</span>
                  <Badge variant="default" data-testid="feature-export">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Storage:</span>
                  <span className="ml-2 font-medium">In-Memory (Development)</span>
                </div>
                <div>
                  <span className="text-slate-600">Citation Detection:</span>
                  <span className="ml-2 font-medium">Pattern Matching</span>
                </div>
                <div>
                  <span className="text-slate-600">LLM Platform:</span>
                  <span className="ml-2 font-medium">OpenAI GPT-4</span>
                </div>
                <div>
                  <span className="text-slate-600">Query Types:</span>
                  <span className="ml-2 font-medium">AI + Template Generated</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}