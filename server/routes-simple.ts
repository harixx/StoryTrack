import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchQuerySchema, insertBrandSchema } from "@shared/schema";
import { searchLLMWithQuery } from "./services/openai";

// Simple URL extraction function
function extractSourceUrls(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
  const urls = text.match(urlPattern) || [];
  
  // Filter for likely news/article sources
  const newsUrls = urls.filter(url => {
    const domain = url.toLowerCase();
    return domain.includes('news') || 
           domain.includes('article') || 
           domain.includes('blog') ||
           domain.includes('press') ||
           domain.includes('media') ||
           domain.includes('.com') ||
           domain.includes('.org');
  });
  
  return Array.from(new Set(newsUrls)); // Remove duplicates
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Manual query endpoints - no stories, just direct query management
  app.get("/api/queries", async (req, res) => {
    try {
      const queries = await storage.getAllQueries();
      res.json(queries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch queries" });
    }
  });

  app.post("/api/queries", async (req, res) => {
    try {
      const { query, queryType = "brand_mention" } = req.body;
      
      if (!query?.trim()) {
        return res.status(400).json({ error: "Query text is required" });
      }
      
      const queryData = {
        query: query.trim(),
        queryType,
        generatedBy: "manual",
        brandId: null, // No brand association needed for manual queries
        isActive: true
      };
      
      const createdQuery = await storage.createSearchQuery(queryData);
      res.status(201).json(createdQuery);
    } catch (error) {
      console.error("Query creation error:", error);
      res.status(500).json({ error: "Failed to create query" });
    }
  });

  // Delete query endpoint
  app.delete("/api/queries/:id", async (req, res) => {
    try {
      const success = await storage.deleteSearchQuery(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Query not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete query" });
    }
  });

  // Process query through ChatGPT and check for brand mentions
  app.post("/api/queries/:id/search", async (req, res) => {
    try {
      const queryId = req.params.id;
      const query = await storage.getSearchQuery(queryId);
      
      if (!query) {
        return res.status(404).json({ error: "Query not found" });
      }
      
      console.log("Processing query:", query.query);
      
      // Search with ChatGPT
      const response = await searchLLMWithQuery(query.query);
      console.log("ChatGPT response received, length:", response.length);
      
      // Simple brand mention detection
      const brandKeywords = ["tesla", "apple", "microsoft", "google", "amazon", "brand", "company"];
      const mentioned = brandKeywords.some(keyword => 
        response.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // Extract source URLs from the response
      const sourceUrls = extractSourceUrls(response);
      
      // Create search result
      const searchResult = await storage.createSearchResult({
        queryId: query.id,
        brandId: null,
        platform: "openai",
        response: response,
        mentioned: mentioned,
        mentionContext: response.substring(0, 500),
        confidence: mentioned ? 75 : 25
      });

      // If brand mentioned, create a citation
      if (mentioned) {
        await storage.createCitation({
          brandId: null,
          searchResultId: searchResult.id,
          platform: "openai",
          query: query.query,
          mentionText: response.substring(0, 200),
          context: response.substring(0, 500),
          sourceUrls: sourceUrls,
          confidence: 75,
          sentiment: "neutral",
          mentionType: "direct"
        });
      }
      
      res.json({
        searchResult: {
          id: searchResult.id,
          queryId: searchResult.queryId,
          platform: searchResult.platform,
          mentioned: searchResult.mentioned,
          confidence: searchResult.confidence,
          searchedAt: searchResult.searchedAt
        },
        sourceUrls,
        responseLength: response.length,
        possibleMentions: mentioned,
        responsePreview: response.substring(0, 200) + "..."
      });
    } catch (error) {
      console.error("Query search error:", error);
      res.status(500).json({ 
        error: "Failed to process query", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get search results for a query
  app.get("/api/queries/:id/results", async (req, res) => {
    try {
      const results = await storage.getResultsByQueryId(req.params.id);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  // Dashboard stats - simplified
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const queries = await storage.getAllQueries();
      const brands = await storage.getStories(); // Using stories as brands
      const citations = await storage.getRecentCitations(50);
      const stats = {
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.isActive).length,
        manualQueries: queries.filter(q => q.generatedBy === 'manual').length,
        recentQueries: queries.slice(-5),
        totalStories: brands.length,
        citations: citations.length,
        queries: queries.length,
        citationRate: queries.length > 0 ? Math.round((citations.length / queries.length) * 100) : 0
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Stories endpoints (treating brands as stories for compatibility)
  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getStoriesWithQueries();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.post("/api/stories", async (req, res) => {
    try {
      const storyData = {
        name: req.body.title,
        description: req.body.content,
        industry: req.body.category,
        priority: req.body.priority || 'medium',
        status: req.body.status || 'draft',
        keywords: req.body.tags || []
      };
      const story = await storage.createStory(storyData);
      res.status(201).json(story);
    } catch (error) {
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  app.put("/api/stories/:id", async (req, res) => {
    try {
      const updateData = {
        name: req.body.title,
        description: req.body.content,
        industry: req.body.category,
        priority: req.body.priority
      };
      const story = await storage.updateStory(req.params.id, updateData);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ error: "Failed to update story" });
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

  // Citations endpoint
  app.get("/api/citations", async (req, res) => {
    try {
      const citations = await storage.getRecentCitations(50);
      res.json(citations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch citations" });
    }
  });

  // Recent citations for dashboard
  app.get("/api/dashboard/recent-citations", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const citations = await storage.getRecentCitations(limit);
      res.json(citations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent citations" });
    }
  });

  // Export report endpoint
  app.get("/api/export/report", async (req, res) => {
    try {
      const stories = await storage.getStoriesWithQueries();
      const citations = await storage.getRecentCitations(100);
      const queries = await storage.getAllQueries();
      
      const report = {
        generatedAt: new Date().toISOString(),
        summary: {
          totalStories: stories.length,
          totalQueries: queries.length,
          totalCitations: citations.length,
        },
        stories: stories,
        citations: citations,
        queries: queries,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=citation-report.json');
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  const server = createServer(app);
  return server;
}