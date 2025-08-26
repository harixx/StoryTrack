import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Key, 
  Bell, 
  Download, 
  Trash2, 
  RefreshCw,
  Shield,
  Zap
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSearch, setAutoSearch] = useState(false);
  const [searchFrequency, setSearchFrequency] = useState("daily");
  const [confidenceThreshold, setConfidenceThreshold] = useState("70");
  const { toast } = useToast();

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export started",
      description: "Your data export will begin shortly.",
    });
  };

  const handleClearData = () => {
    toast({
      title: "Data cleared",
      description: "All citation data has been removed.",
      variant: "destructive",
    });
  };

  return (
    <>
      <Header 
        title="Settings"
        subtitle="Manage your account preferences and citation tracking settings"
      />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl space-y-6">
          
          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>API Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-..."
                      value="••••••••••••••••"
                      readOnly
                      data-testid="input-openai-key"
                    />
                    <Badge variant="default" data-testid="badge-api-status">
                      Connected
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">API key is securely stored</p>
                </div>
                <div>
                  <Label htmlFor="monthly-limit">Monthly Request Limit</Label>
                  <Input
                    id="monthly-limit"
                    type="number"
                    placeholder="10000"
                    defaultValue="10000"
                    className="mt-1"
                    data-testid="input-monthly-limit"
                  />
                  <p className="text-xs text-slate-500 mt-1">Maximum API requests per month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-slate-500">Receive email alerts when citations are found</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  data-testid="switch-email-notifications"
                />
              </div>
              <Separator />
              <div>
                <Label htmlFor="notification-threshold">Citation Confidence Threshold</Label>
                <Select value={confidenceThreshold} onValueChange={setConfidenceThreshold}>
                  <SelectTrigger className="mt-1" data-testid="select-confidence-threshold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50% - Low confidence</SelectItem>
                    <SelectItem value="70">70% - Medium confidence</SelectItem>
                    <SelectItem value="85">85% - High confidence</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">Only notify for citations above this confidence level</p>
              </div>
            </CardContent>
          </Card>

          {/* Automation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Automation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-search">Automatic Citation Search</Label>
                  <p className="text-sm text-slate-500">Automatically run citation searches for published stories</p>
                </div>
                <Switch
                  id="auto-search"
                  checked={autoSearch}
                  onCheckedChange={setAutoSearch}
                  data-testid="switch-auto-search"
                />
              </div>
              {autoSearch && (
                <>
                  <Separator />
                  <div>
                    <Label htmlFor="search-frequency">Search Frequency</Label>
                    <Select value={searchFrequency} onValueChange={setSearchFrequency}>
                      <SelectTrigger className="mt-1" data-testid="select-search-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">How often to check for new citations</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Data Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  className="h-auto p-4 flex-col"
                  data-testid="button-export-data"
                >
                  <Download className="h-5 w-5 mb-2" />
                  <span className="font-medium">Export Data</span>
                  <span className="text-xs text-slate-500">Download all your data</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 flex-col"
                  data-testid="button-refresh-stats"
                >
                  <RefreshCw className="h-5 w-5 mb-2" />
                  <span className="font-medium">Refresh Stats</span>
                  <span className="text-xs text-slate-500">Recalculate all metrics</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleClearData}
                  className="h-auto p-4 flex-col text-red-600 hover:text-red-700"
                  data-testid="button-clear-data"
                >
                  <Trash2 className="h-5 w-5 mb-2" />
                  <span className="font-medium">Clear Data</span>
                  <span className="text-xs text-slate-500">Remove all citations</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Account Type</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="default" data-testid="badge-account-type">Pro Plan</Badge>
                    <span className="text-sm text-slate-500">Unlimited stories & searches</span>
                  </div>
                </div>
                <div>
                  <Label>API Usage This Month</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm font-medium" data-testid="text-api-usage">6,800 / 10,000</span>
                    <Badge variant="secondary">68%</Badge>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="text-xs text-slate-500">
                <p>Account created: January 15, 2024</p>
                <p>Last login: {new Date().toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Save Settings */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} data-testid="button-save-settings">
              Save Settings
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}