import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { MoreVertical, Search, Edit, Trash2, Eye, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@shared/schema";

interface StoryActionsProps {
  story: Story;
  onView: () => void;
  onEdit: () => void;
}

export default function StoryActions({ story, onView, onEdit }: StoryActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("DELETE", `/api/stories/${storyId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Story deleted",
        description: "Story has been permanently removed.",
      });
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const searchCitationsMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/search-citations`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/citations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Citation search completed",
        description: `Found ${data.citations.length} citations from ${data.summary.successfulSearches} searches.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Search failed",
        description: error.message || "Failed to search for citations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateQueriesMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/generate-queries`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/queries"] });
      
      toast({
        title: "Queries generated",
        description: `Generated ${data.length} search queries for this story.`,
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Failed to generate queries. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            data-testid={`button-actions-${story.id}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onView} data-testid={`action-view-${story.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit} data-testid={`action-edit-${story.id}`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Story
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => generateQueriesMutation.mutate(story.id)}
            disabled={generateQueriesMutation.isPending}
            data-testid={`action-generate-${story.id}`}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Generate Queries
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => searchCitationsMutation.mutate(story.id)}
            disabled={searchCitationsMutation.isPending}
            data-testid={`action-search-${story.id}`}
          >
            <Search className="mr-2 h-4 w-4" />
            {searchCitationsMutation.isPending ? "Searching..." : "Search Citations"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-red-600 focus:text-red-600"
            onClick={() => setShowDeleteDialog(true)}
            data-testid={`action-delete-${story.id}`}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Story
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{story.title}"? This action cannot be undone and will also remove all associated queries and citations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStoryMutation.mutate(story.id)}
              disabled={deleteStoryMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteStoryMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}