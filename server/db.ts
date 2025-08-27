import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { brands, searchQueries, searchResults, brandMentions, type Brand, type InsertBrand, type SearchQuery, type InsertSearchQuery, type SearchResult, type InsertSearchResult, type BrandMention, type InsertBrandMention, type BrandWithQueries, type DashboardStats } from "@shared/schema";
import type { IStorage } from "./storage";
import { eq, desc, count } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

export class DatabaseStorage implements IStorage {
  // Stories
  async getStory(id: string): Promise<Story | undefined> {
    const result = await db.select().from(stories).where(eq(stories.id, id)).limit(1);
    return result[0];
  }

  async getStories(): Promise<Story[]> {
    try {
      return await db.select().from(brands).orderBy(desc(brands.createdAt));
    } catch (error) {
      console.error("Error in getStories:", error);
      return [];
    }
  }

  async getStoriesWithQueries(): Promise<StoryWithQueries[]> {
    try {
      const allStories = await this.getStories();
      
      const storiesWithQueries = await Promise.all(
        allStories.map(async (story) => {
          const queries = await this.getQueriesByStoryId(story.id);
          const citationCountResult = await db.select({ count: count() }).from(citations).where(eq(citations.storyId, story.id));
          const searchResultsForStory = await db.select().from(searchResults).where(eq(searchResults.storyId, story.id)).orderBy(desc(searchResults.searchedAt)).limit(1);
          
          return {
            ...story,
            queries,
            citationCount: Number(citationCountResult[0]?.count || 0),
            lastSearched: searchResultsForStory[0]?.searchedAt || undefined,
          };
        })
      );

      return storiesWithQueries;
    } catch (error) {
      console.error("Error in getStoriesWithQueries:", error);
      return [];
    }
  }

  async createStory(story: InsertStory): Promise<Story> {
    const result = await db.insert(stories).values({
      ...story,
      publishedAt: story.status === 'published' ? new Date() : null,
    }).returning();
    return result[0];
  }

  async updateStory(id: string, story: Partial<InsertStory>): Promise<Story | undefined> {
    const result = await db.update(stories)
      .set({
        ...story,
        updatedAt: new Date(),
        publishedAt: story.status === 'published' ? new Date() : undefined,
      })
      .where(eq(stories.id, id))
      .returning();
    return result[0];
  }

  async deleteStory(id: string): Promise<boolean> {
    try {
      // Delete related records first (this should be handled by CASCADE in production)
      await db.delete(citations).where(eq(citations.storyId, id));
      await db.delete(searchResults).where(eq(searchResults.storyId, id));
      await db.delete(searchQueries).where(eq(searchQueries.storyId, id));
      
      const result = await db.delete(stories).where(eq(stories.id, id));
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting story:", error);
      return false;
    }
  }

  // Search Queries
  async getSearchQuery(id: string): Promise<SearchQuery | undefined> {
    const result = await db.select().from(searchQueries).where(eq(searchQueries.id, id)).limit(1);
    return result[0];
  }

  async getQueriesByStoryId(storyId: string): Promise<SearchQuery[]> {
    return await db.select().from(searchQueries).where(eq(searchQueries.storyId, storyId)).orderBy(desc(searchQueries.createdAt));
  }

  async getAllQueries(): Promise<SearchQuery[]> {
    return await db.select().from(searchQueries).orderBy(desc(searchQueries.createdAt));
  }

  async createSearchQuery(query: InsertSearchQuery): Promise<SearchQuery> {
    const result = await db.insert(searchQueries).values(query).returning();
    return result[0];
  }

  async updateSearchQuery(id: string, query: Partial<InsertSearchQuery>): Promise<SearchQuery | undefined> {
    const result = await db.update(searchQueries).set(query).where(eq(searchQueries.id, id)).returning();
    return result[0];
  }

  async deleteSearchQuery(id: string): Promise<boolean> {
    try {
      // Delete related records first (this should be handled by CASCADE in production)
      const relatedResults = await db.select({ id: searchResults.id }).from(searchResults).where(eq(searchResults.queryId, id));
      for (const result of relatedResults) {
        await db.delete(citations).where(eq(citations.searchResultId, result.id));
      }
      await db.delete(searchResults).where(eq(searchResults.queryId, id));
      
      const result = await db.delete(searchQueries).where(eq(searchQueries.id, id));
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting search query:", error);
      return false;
    }
  }

  // Search Results
  async getSearchResult(id: string): Promise<SearchResult | undefined> {
    const result = await db.select().from(searchResults).where(eq(searchResults.id, id)).limit(1);
    return result[0];
  }

  async getResultsByQueryId(queryId: string): Promise<SearchResult[]> {
    return await db.select().from(searchResults).where(eq(searchResults.queryId, queryId)).orderBy(desc(searchResults.searchedAt));
  }

  async getResultsByStoryId(storyId: string): Promise<SearchResult[]> {
    return await db.select().from(searchResults).where(eq(searchResults.storyId, storyId)).orderBy(desc(searchResults.searchedAt));
  }

  async createSearchResult(result: InsertSearchResult): Promise<SearchResult> {
    const dbResult = await db.insert(searchResults).values(result).returning();
    return dbResult[0];
  }

  // Citations
  async getCitation(id: string): Promise<Citation | undefined> {
    const result = await db.select().from(citations).where(eq(citations.id, id)).limit(1);
    return result[0];
  }

  async getCitationsByStoryId(storyId: string): Promise<Citation[]> {
    return await db.select().from(citations).where(eq(citations.storyId, storyId)).orderBy(desc(citations.foundAt));
  }

  async getRecentCitations(limit: number = 10): Promise<Citation[]> {
    try {
      return await db.select().from(brandMentions).orderBy(desc(brandMentions.foundAt)).limit(limit);
    } catch (error) {
      console.error("Error in getRecentCitations:", error);
      return [];
    }
  }

  async createCitation(citation: InsertCitation): Promise<Citation> {
    const result = await db.insert(citations).values(citation).returning();
    return result[0];
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [storyCount, citationCount, queryCount] = await Promise.all([
        db.select({ count: count() }).from(stories),
        db.select({ count: count() }).from(citations),
        db.select({ count: count() }).from(searchQueries),
      ]);

      const totalResults = await db.select({ count: count() }).from(searchResults);
      const citedResults = await db.select({ count: count() }).from(searchResults).where(eq(searchResults.cited, true));

      const totalSearches = Number(totalResults[0]?.count || 0);
      const citedSearches = Number(citedResults[0]?.count || 0);
      const citationRate = totalSearches > 0 ? Math.round((citedSearches / totalSearches) * 100) : 0;

      return {
        totalStories: Number(storyCount[0]?.count || 0),
        citations: Number(citationCount[0]?.count || 0),
        queries: Number(queryCount[0]?.count || 0),
        citationRate,
      };
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      return {
        totalStories: 0,
        citations: 0,
        queries: 0,
        citationRate: 0,
      };
    }
  }
}

export const dbStorage = new DatabaseStorage();