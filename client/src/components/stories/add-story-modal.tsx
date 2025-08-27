import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { X, Wand2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertStorySchema, type InsertStory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";

interface AddStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddStoryModal({ open, onOpenChange }: AddStoryModalProps) {
  const [generatedQueries, setGeneratedQueries] = useState<string[]>([]);
  const [isGeneratingQueries, setIsGeneratingQueries] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<InsertStory>({
    resolver: zodResolver(insertStorySchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      priority: "medium",
      tags: [],
      status: "draft",
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: InsertStory) => {
      const response = await apiRequest("POST", "/api/stories", data);
      return response.json();
    },
    onSuccess: (newStory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      // If we have generated queries, save them
      if (generatedQueries.length > 0) {
        saveQueriesMutation.mutate(newStory.id);
      }
      
      toast({
        title: "Story created successfully",
        description: `${newStory.title} has been ${newStory.status === "published" ? "published" : "saved as draft"}${generatedQueries.length > 0 ? ` with ${generatedQueries.length} search queries.` : "."}.`,
      });
      
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveQueriesMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/save-queries`, {
        queries: generatedQueries
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
    },
  });

  const handleGenerateQueries = async () => {
    const title = form.getValues("title");
    const content = form.getValues("content");
    const tags = form.getValues("tags") || [];

    if (!title || !content) {
      toast({
        title: "Missing information",
        description: "Please enter a title and content before generating queries.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingQueries(true);
    try {
      const response = await fetch("/api/generate-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, tags: Array.isArray(tags) ? tags : [] }),
      });

      if (!response.ok) throw new Error("Failed to generate queries");
      
      const data = await response.json();
      setGeneratedQueries(data.queries || []);
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to generate AI queries. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQueries(false);
    }
  };

  const removeQuery = (index: number) => {
    setGeneratedQueries(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    form.reset();
    setGeneratedQueries([]);
    onOpenChange(false);
  };

  const onSubmit = (data: InsertStory) => {
    // Additional client-side validation
    if (!data.title?.trim()) {
      toast({
        title: "Validation Error",
        description: "Story title is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.content?.trim()) {
      toast({
        title: "Validation Error",
        description: "Story content is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (data.content.length < 50) {
      toast({
        title: "Validation Error",
        description: "Story content should be at least 50 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    createStoryMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish New Story</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your story title..." 
                      data-testid="input-story-title"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Paste or write your story content here..."
                      rows={8}
                      data-testid="editor-story-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Add tags to help with search query generation..."
                      maxTags={8}
                      data-testid="input-tags"
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500">These will be used to generate search queries</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-slate-700">Auto-Generate Search Queries</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateQueries}
                  disabled={isGeneratingQueries || !form.getValues("title").trim() || !form.getValues("content").trim()}
                  data-testid="button-generate-queries"
                >
                  {isGeneratingQueries ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>

              {generatedQueries.length > 0 && (
                <div className="space-y-2">
                  {generatedQueries.map((query, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 bg-white rounded border"
                      data-testid={`generated-query-${index}`}
                    >
                      <span className="text-sm text-slate-700">{query}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuery(index)}
                        data-testid={`button-remove-query-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.setValue("status", "draft");
                  form.handleSubmit(onSubmit)();
                }}
                disabled={createStoryMutation.isPending}
                data-testid="button-save-draft"
              >
{createStoryMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save as Draft"
                )}
              </Button>
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    form.setValue("status", "published");
                    form.handleSubmit(onSubmit)();
                  }}
                  disabled={createStoryMutation.isPending}
                  data-testid="button-publish"
                >
  {createStoryMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish & Start Tracking"
                )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
