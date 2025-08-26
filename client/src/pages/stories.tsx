import Header from "@/components/layout/header";
import StoryTable from "@/components/stories/story-table";

export default function Stories() {
  return (
    <>
      <Header 
        title="Story Management"
        subtitle="Manage and track your published stories"
        showAddStory={true}
        showExport={true}
      />
      <main className="flex-1 p-6 overflow-y-auto">
        <StoryTable />
      </main>
    </>
  );
}
