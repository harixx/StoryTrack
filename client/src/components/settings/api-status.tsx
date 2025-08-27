import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertTriangle,
  Zap,
  Globe,
  Key
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface APIStatus {
  service: string;
  status: "connected" | "error" | "checking" | "not_configured";
  message: string;
  lastChecked?: string;
}

export default function APIStatus() {
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([
    {
      service: "OpenAI API",
      status: "not_configured",
      message: "API key not configured",
    },
    {
      service: "Database Connection",
      status: "connected",
      message: "Connected successfully",
    }
  ]);

  const testConnectionMutation = useMutation({
    mutationFn: async (service: string) => {
      const response = await apiRequest("POST", "/api/test-connection", { service });
      return response.json();
    },
    onMutate: (service) => {
      setApiStatuses(prev => prev.map(status => 
        status.service === service 
          ? { ...status, status: "checking" }
          : status
      ));
    },
    onSuccess: (data, service) => {
      setApiStatuses(prev => prev.map(status => 
        status.service === service 
          ? { 
              ...status, 
              status: data.connected ? "connected" : "error",
              message: data.message,
              lastChecked: new Date().toLocaleString()
            }
          : status
      ));
    },
    onError: (error: any, service) => {
      setApiStatuses(prev => prev.map(status => 
        status.service === service 
          ? { 
              ...status, 
              status: "error",
              message: error.message || "Connection failed",
              lastChecked: new Date().toLocaleString()
            }
          : status
      ));
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "checking":
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case "not_configured":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <XCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "checking":
        return <Badge variant="secondary">Checking...</Badge>;
      case "not_configured":
        return <Badge variant="outline" className="border-yellow-300 text-yellow-800">Not Configured</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getServiceIcon = (serviceName: string) => {
    if (serviceName.includes("OpenAI")) return <Zap className="h-4 w-4" />;
    if (serviceName.includes("Database")) return <Globe className="h-4 w-4" />;
    return <Key className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          API & Service Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {apiStatuses.some(s => s.status === "not_configured" || s.status === "error") && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some services require configuration. Check the settings below and ensure all API keys are properly set.
            </AlertDescription>
          </Alert>
        )}

        {apiStatuses.map((status) => (
          <div 
            key={status.service} 
            className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
            data-testid={`api-status-${status.service.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-center space-x-3">
              {getServiceIcon(status.service)}
              <div>
                <h4 className="font-medium text-slate-900">{status.service}</h4>
                <p className="text-sm text-slate-500">{status.message}</p>
                {status.lastChecked && (
                  <p className="text-xs text-slate-400">
                    Last checked: {status.lastChecked}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(status.status)}
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.status)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testConnectionMutation.mutate(status.service)}
                  disabled={testConnectionMutation.isPending}
                  data-testid={`button-test-${status.service.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${testConnectionMutation.isPending ? 'animate-spin' : ''}`} />
                  Test
                </Button>
              </div>
            </div>
          </div>
        ))}

        {apiStatuses.some(s => s.status === "not_configured") && (
          <div className="pt-4 border-t border-slate-200">
            <h4 className="font-medium text-slate-900 mb-2">Configuration Required</h4>
            <p className="text-sm text-slate-600 mb-3">
              To enable full functionality, please configure the following environment variables:
            </p>
            <div className="bg-slate-50 rounded-lg p-3">
              <code className="text-sm">
                OPENAI_API_KEY=your_openai_api_key_here
              </code>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Add these to your environment variables and restart the application.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
            data-testid="button-refresh-status"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}