import Header from "@/components/layout/header";
import EnhancedStatsGrid from "@/components/dashboard/enhanced-stats-grid";
import RecentCitations from "@/components/dashboard/recent-citations";
import QuickActions from "@/components/dashboard/quick-actions";
import StoryTable from "@/components/stories/story-table";

export default function Dashboard() {
  return (
    <>
      <Header 
        title="Dashboard Overview"
        subtitle="Track your story citations across LLM platforms"
        showAddStory={true}
        showExport={true}
      />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          <EnhancedStatsGrid />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentCitations />
            </div>
            <QuickActions />
          </div>

          <StoryTable />
        </div>
      </main>
    </>
  );
}
