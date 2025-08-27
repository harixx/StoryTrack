import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySchema, insertSearchQuerySchema } from "@shared/schema";
import { queryGenerator } from "./services/queryGenerator";
import { searchLLMWithQuery, generateBrandMentionQueries } from "./services/openai";
// import { citationDetector } from "./services/citationDetector";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate queries endpoint for frontend
  app.post("/api/generate-queries", async (req, res) => {
    try {
      const { title, content, tags } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }
      
      console.log("Generating queries for:", { title, content, tags });
      const queries = await generateSearchQueries(title, content, tags || []);
      console.log("Generated queries:", queries);
      res.json({ queries });
    } catch (error) {
      console.error("Query generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate queries", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
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
      console.log("Received story data:", req.body);
      
      if (!req.body) {
        return res.status(400).json({ error: "Request body is required" });
      }
      
      const validatedData = insertStorySchema.parse(req.body);
      console.log("Validated story data:", validatedData);
      
      if (!validatedData.title?.trim()) {
        return res.status(400).json({ error: "Title is required and cannot be empty" });
      }
      
      if (!validatedData.content?.trim()) {
        return res.status(400).json({ error: "Content is required and cannot be empty" });
      }
      
      if (validatedData.content.length < 50) {
        return res.status(400).json({ error: "Content must be at least 50 characters long" });
      }
      
      const story = await storage.createStory(validatedData);
      res.status(201).json(story);
    } catch (error) {
      console.error("Story creation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: `Validation failed: ${error.message}` });
      } else {
        res.status(500).json({ error: "Failed to create story" });
      }
    }
  });

  app.put("/api/stories/:id", async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: "Story ID is required" });
      }
      
      const validatedData = insertStorySchema.partial().parse(req.body);
      
      // Validate non-empty fields if they are provided
      if (validatedData.title !== undefined && !validatedData.title?.trim()) {
        return res.status(400).json({ error: "Title cannot be empty if provided" });
      }
      
      if (validatedData.content !== undefined) {
        if (!validatedData.content?.trim()) {
          return res.status(400).json({ error: "Content cannot be empty if provided" });
        }
        if (validatedData.content.length < 50) {
          return res.status(400).json({ error: "Content must be at least 50 characters long" });
        }
      }
      
      const story = await storage.updateStory(req.params.id, validatedData);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      console.error("Story update error:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: `Validation failed: ${error.message}` });
      } else {
        res.status(500).json({ error: "Failed to update story" });
      }
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
  // Save pre-generated queries for a story
  app.post("/api/stories/:id/save-queries", async (req, res) => {
    try {
      const { queries } = req.body;
      if (!queries || !Array.isArray(queries)) {
        return res.status(400).json({ error: "Queries array is required" });
      }

      const story = await storage.getStory(req.params.id);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

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
      console.error("Failed to save generated queries:", error);
      res.status(500).json({ error: "Failed to save generated queries" });
    }
  });

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

  // Citations endpoints
  app.get("/api/citations", async (req, res) => {
    try {
      const storyId = req.query.storyId as string;
      const citations = storyId 
        ? await storage.getCitationsByStoryId(storyId)
        : await storage.getRecentCitations(50);
      res.json(citations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch citations" });
    }
  });

  // Get all source URLs from citations
  app.get("/api/citations/source-urls", async (req, res) => {
    try {
      const citations = await storage.getRecentCitations(100);
      const allSourceUrls = citations
        .filter(citation => citation.sourceUrls && citation.sourceUrls.length > 0)
        .map(citation => ({
          id: citation.id,
          storyId: citation.storyId,
          platform: citation.platform,
          query: citation.query,
          sourceUrls: citation.sourceUrls,
          citationText: citation.citationText,
          confidence: citation.confidence,
          foundAt: citation.foundAt,
        }));
      
      res.json(allSourceUrls);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch source URLs" });
    }
  });

  // Search for citations endpoint
  app.post("/api/stories/:id/search-citations", async (req, res) => {
    try {
      const story = await storage.getStory(req.params.id);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      const queries = await storage.getQueriesByStoryId(story.id);
      if (queries.length === 0) {
        // Generate queries if none exist
        const generatedQueries = await queryGenerator.generateQueriesFromStory(
          story.title,
          story.content,
          story.tags || []
        );

        // Save generated queries
        await Promise.all(
          generatedQueries.map(query => 
            storage.createSearchQuery({
              storyId: story.id,
              query,
              generatedBy: "ai",
              isActive: true,
            })
          )
        );
        
        // Refresh queries list
        const refreshedQueries = await storage.getQueriesByStoryId(story.id);
        queries.length = 0; // Clear existing array
        queries.push(...refreshedQueries);
      }

      const searchResults = [];
      const foundCitations = [];
      let successfulSearches = 0;

      // Process each query
      for (const query of queries) {
        try {
          // Search using OpenAI
          const response = await searchLLMWithQuery(query.query);
          
          // Create search result
          const searchResult = await storage.createSearchResult({
            queryId: query.id,
            storyId: story.id,
            platform: "openai",
            response,
            cited: false,
            citationContext: null,
            confidence: 0,
          });
          
          // Detect citations
          const citationData = await citationDetector.detectCitation(
            story.title,
            story.content,
            query.query,
            response
          );

          if (citationData.cited) {
            // Update search result
            searchResult.cited = true;
            searchResult.citationContext = citationData.context;
            searchResult.confidence = citationData.confidence;

            // Create citation record
            const citation = await storage.createCitation({
              storyId: story.id,
              searchResultId: searchResult.id,
              platform: "openai",
              query: query.query,
              citationText: citationData.citationText || response.substring(0, 200),
              context: citationData.context,
              confidence: citationData.confidence,
              sourceUrls: citationData.sourceUrls,
            });

            foundCitations.push(citation);
          }

          searchResults.push(searchResult);
          successfulSearches++;
          
        } catch (error) {
          console.error(`Search failed for query "${query.query}":`, error);
          // Continue with other queries even if one fails
        }
      }

      res.json({
        citations: foundCitations,
        summary: {
          totalQueries: queries.length,
          successfulSearches,
          citationsFound: foundCitations.length,
        }
      });

    } catch (error) {
      console.error("Citation search error:", error);
      res.status(500).json({ 
        error: "Failed to search for citations",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Export report endpoint
  app.get("/api/export/report", async (req, res) => {
    try {
      const stories = await storage.getStoriesWithQueries();
      const citations = await storage.getRecentCitations(100);
      const stats = await storage.getDashboardStats();

      const report = {
        generatedAt: new Date().toISOString(),
        summary: stats,
        stories: stories,
        citations: citations,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=citation-report.json');
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Test API connection endpoint
  app.post("/api/test-connection", async (req, res) => {
    try {
      const { service } = req.body;
      
      if (service === "OpenAI API") {
        if (!process.env.OPENAI_API_KEY) {
          return res.json({ 
            connected: false, 
            message: "OpenAI API key not configured" 
          });
        }
        
        // Test OpenAI connection
        try {
          await searchLLMWithQuery("Test connection query");
          res.json({ 
            connected: true, 
            message: "OpenAI API connected successfully" 
          });
        } catch (error) {
          res.json({ 
            connected: false, 
            message: "OpenAI API connection failed: " + (error as Error).message 
          });
        }
      } else if (service === "Database Connection") {
        // Test database connection
        try {
          await storage.getDashboardStats();
          res.json({ 
            connected: true, 
            message: "Database connected successfully" 
          });
        } catch (error) {
          res.json({ 
            connected: false, 
            message: "Database connection failed: " + (error as Error).message 
          });
        }
      } else {
        res.status(400).json({ error: "Unknown service" });
      }
    } catch (error) {
      res.status(500).json({ 
        connected: false, 
        message: "Connection test failed" 
      });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
