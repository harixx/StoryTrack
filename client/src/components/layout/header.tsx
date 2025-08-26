import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import { useState } from "react";
import AddStoryModal from "@/components/stories/add-story-modal-simple";

interface HeaderProps {
  title: string;
  subtitle: string;
  showAddStory?: boolean;
  showExport?: boolean;
}

export default function Header({ title, subtitle, showAddStory = false, showExport = false }: HeaderProps) {
  const [showModal, setShowModal] = useState(false);

  const handleExport = async () => {
    try {
      const response = await fetch("/api/export/report");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `citation-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900" data-testid="text-page-title">{title}</h2>
            <p className="text-sm text-slate-500" data-testid="text-page-subtitle">{subtitle}</p>
          </div>
          <div className="flex items-center space-x-4">
            {showExport && (
              <Button 
                variant="outline"
                onClick={handleExport}
                data-testid="button-export"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            )}
            {showAddStory && (
              <Button 
                onClick={() => setShowModal(true)}
                data-testid="button-add-story"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Story
              </Button>
            )}
          </div>
        </div>
      </header>

      <AddStoryModal 
        open={showModal} 
        onOpenChange={setShowModal} 
      />
    </>
  );
}
