import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySchema, insertSearchQuerySchema } from "@shared/schema";
import { queryGenerator } from "./services/queryGenerator";
import { searchLLMWithQuery } from "./services/openai";
import { citationDetector } from "./services/citationDetector";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Recent citations
  app.get("/api/dashboard/recent-citations", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const citations = await storage.getRecentCitations(limit);
      res.json(citations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent citations" });
    }
  });

  // Stories endpoints
  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getStoriesWithQueries();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.get("/api/stories/:id", async (req, res) => {
    try {
      const story = await storage.getStory(req.params.id);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch story" });
    }
  });

  app.post("/api/stories", async (req, res) => {
    try {
      const validatedData = insertStorySchema.parse(req.body);
      const story = await storage.createStory(validatedData);
      res.status(201).json(story);
    } catch (error) {
      res.status(400).json({ error: "Invalid story data" });
    }
  });

  app.put("/api/stories/:id", async (req, res) => {
    try {
      const validatedData = insertStorySchema.partial().parse(req.body);
      const story = await storage.updateStory(req.params.id, validatedData);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      res.status(400).json({ error: "Invalid story data" });
    }
  });

  app.delete("/api/stories/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteStory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Story not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete story" });
    }
  });

  // Generate search queries for a story
  app.post("/api/stories/:id/generate-queries", async (req, res) => {
    try {
      const story = await storage.getStory(req.params.id);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      const queries = await queryGenerator.generateQueriesFromStory(
        story.title,
        story.content,
        story.tags || []
      );

      // Save generated queries to storage
      const savedQueries = await Promise.all(
        queries.map(query => 
          storage.createSearchQuery({
            storyId: story.id,
            query,
            generatedBy: "ai",
            isActive: true,
          })
        )
      );

      res.json(savedQueries);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate queries" });
    }
  });

  // Search queries endpoints
  app.get("/api/queries", async (req, res) => {
    try {
      const storyId = req.query.storyId as string;
      const queries = storyId 
        ? await storage.getQueriesByStoryId(storyId)
        : await storage.getAllQueries();
      res.json(queries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch queries" });
    }
  });

  app.post("/api/queries", async (req, res) => {
    try {
      const validatedData = insertSearchQuerySchema.parse(req.body);
      const query = await storage.createSearchQuery(validatedData);
      res.status(201).json(query);
    } catch (error) {
      res.status(400).json({ error: "Invalid query data" });
    }
  });

  app.delete("/api/queries/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSearchQuery(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Query not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete query" });
    }
  });

  // Run citation search for a story
  app.post("/api/stories/:id/search-citations", async (req, res) => {
    try {
      const story = await storage.getStory(req.params.id);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      const queries = await storage.getQueriesByStoryId(req.params.id);
      const activeQueries = queries.filter(q => q.isActive);
      
      if (activeQueries.length === 0) {
        return res.status(400).json({ error: "No active queries found for this story" });
      }

      const searchResults = [];
      const foundCitations = [];

      for (const query of activeQueries) {
        try {
          const llmResponse = await searchLLMWithQuery(query.query);
          
          const citationAnalysis = citationDetector.detectCitation(
            story.title,
            story.content,
            llmResponse
          );

          const searchResult = await storage.createSearchResult({
            queryId: query.id,
            storyId: story.id,
            platform: "openai",
            response: llmResponse,
            cited: citationAnalysis.cited,
            citationContext: citationAnalysis.citationContext,
            confidence: citationAnalysis.confidence,
          });

          searchResults.push(searchResult);

          if (citationAnalysis.cited) {
            const citation = await storage.createCitation({
              storyId: story.id,
              searchResultId: searchResult.id,
              platform: "openai",
              query: query.query,
              citationText: citationAnalysis.citationContext || "",
              context: citationAnalysis.citationContext,
              confidence: citationAnalysis.confidence,
            });
            foundCitations.push(citation);
          }
        } catch (error) {
          console.error(`Search failed for query "${query.query}":`, error);
        }
      }

      res.json({
        searchResults,
        citations: foundCitations,
        summary: {
          totalQueries: activeQueries.length,
          successfulSearches: searchResults.length,
          citationsFound: foundCitations.length,
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to run citation search" });
    }
  });

  // Citations endpoints
  app.get("/api/citations", async (req, res) => {
    try {
      const storyId = req.query.storyId as string;
      const citations = storyId 
        ? await storage.getCitationsByStoryId(storyId)
        : await storage.getRecentCitations(100);
      res.json(citations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch citations" });
    }
  });

  // Export report
  app.get("/api/export/report", async (req, res) => {
    try {
      const stories = await storage.getStoriesWithQueries();
      const citations = await storage.getRecentCitations(1000);
      const stats = await storage.getDashboardStats();

      const report = {
        generatedAt: new Date().toISOString(),
        stats,
        stories,
        citations,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="citation-report-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
