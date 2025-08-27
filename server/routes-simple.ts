import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchQuerySchema } from "@shared/schema";
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
  
  return [...new Set(newsUrls)]; // Remove duplicates
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
      
      // Extract source URLs from the response
      const sourceUrls = extractSourceUrls(response);
      
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
      const stats = {
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.isActive).length,
        manualQueries: queries.filter(q => q.generatedBy === 'manual').length,
        recentQueries: queries.slice(-5)
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  const server = createServer(app);
  return server;
}