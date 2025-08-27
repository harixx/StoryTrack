import { type Story, type InsertStory, type SearchQuery, type InsertSearchQuery, type SearchResult, type InsertSearchResult, type Citation, type InsertCitation, type StoryWithQueries, type DashboardStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Stories
  getStory(id: string): Promise<Story | undefined>;
  getStories(): Promise<Story[]>;
  getStoriesWithQueries(): Promise<StoryWithQueries[]>;
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: string, story: Partial<InsertStory>): Promise<Story | undefined>;
  deleteStory(id: string): Promise<boolean>;

  // Search Queries
  getSearchQuery(id: string): Promise<SearchQuery | undefined>;
  getQueriesByStoryId(storyId: string): Promise<SearchQuery[]>;
  getAllQueries(): Promise<SearchQuery[]>;
  createSearchQuery(query: InsertSearchQuery): Promise<SearchQuery>;
  updateSearchQuery(id: string, query: Partial<InsertSearchQuery>): Promise<SearchQuery | undefined>;
  deleteSearchQuery(id: string): Promise<boolean>;

  // Search Results
  getSearchResult(id: string): Promise<SearchResult | undefined>;
  getResultsByQueryId(queryId: string): Promise<SearchResult[]>;
  getResultsByStoryId(storyId: string): Promise<SearchResult[]>;
  createSearchResult(result: InsertSearchResult): Promise<SearchResult>;

  // Citations
  getCitation(id: string): Promise<Citation | undefined>;
  getCitationsByStoryId(storyId: string): Promise<Citation[]>;
  getRecentCitations(limit?: number): Promise<Citation[]>;
  createCitation(citation: InsertCitation): Promise<Citation>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private stories: Map<string, Story>;
  private searchQueries: Map<string, SearchQuery>;
  private searchResults: Map<string, SearchResult>;
  private citations: Map<string, Citation>;

  constructor() {
    this.stories = new Map();
    this.searchQueries = new Map();
    this.searchResults = new Map();
    this.citations = new Map();
  }

  // Stories
  async getStory(id: string): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async getStories(): Promise<Story[]> {
    return Array.from(this.stories.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getStoriesWithQueries(): Promise<StoryWithQueries[]> {
    const stories = await this.getStories();
    return Promise.all(stories.map(async (story) => {
      const queries = await this.getQueriesByStoryId(story.id);
      const citations = await this.getCitationsByStoryId(story.id);
      const results = await this.getResultsByStoryId(story.id);
      const lastSearched = results.length > 0 ? 
        new Date(Math.max(...results.map(r => new Date(r.searchedAt!).getTime()))) : 
        undefined;

      return {
        ...story,
        queries,
        citationCount: citations.length,
        lastSearched,
      };
    }));
  }

  async createStory(insertStory: any): Promise<Story> {
    const id = randomUUID();
    const now = new Date();
    const story: Story = {
      id,
      name: insertStory.name || insertStory.title || '',
      description: insertStory.description || insertStory.content || '',
      keywords: insertStory.keywords || insertStory.tags || [],
      industry: insertStory.industry || insertStory.category || '',
      priority: insertStory.priority || 'medium',
      status: insertStory.status || 'draft',
      createdAt: now,
      updatedAt: now,
      // Legacy compatibility properties
      title: insertStory.name || insertStory.title || '',
      content: insertStory.description || insertStory.content || '',
      category: insertStory.industry || insertStory.category || '',
      tags: insertStory.keywords || insertStory.tags || [],
      publishedAt: insertStory.status === 'published' ? now : null,
    } as Story;
    this.stories.set(id, story);
    return story;
  }

  async updateStory(id: string, updateData: any): Promise<Story | undefined> {
    const story = this.stories.get(id);
    if (!story) return undefined;

    const updatedStory: Story = {
      ...story,
      name: updateData.name || updateData.title || story.name,
      description: updateData.description || updateData.content || story.description,
      keywords: updateData.keywords || updateData.tags || story.keywords,
      industry: updateData.industry || updateData.category || story.industry,
      priority: updateData.priority || story.priority,
      status: updateData.status || story.status,
      updatedAt: new Date(),
      // Legacy compatibility
      title: updateData.name || updateData.title || story.name,
      content: updateData.description || updateData.content || story.description,
      category: updateData.industry || updateData.category || story.industry,
      tags: updateData.keywords || updateData.tags || story.keywords,
      publishedAt: updateData.status === 'published' && !story.publishedAt ? new Date() : story.publishedAt,
    } as Story;
    
    this.stories.set(id, updatedStory);
    return updatedStory;
  }

  async deleteStory(id: string): Promise<boolean> {
    return this.stories.delete(id);
  }

  // Search Queries
  async getSearchQuery(id: string): Promise<SearchQuery | undefined> {
    return this.searchQueries.get(id);
  }

  async getQueriesByStoryId(storyId: string): Promise<SearchQuery[]> {
    return Array.from(this.searchQueries.values()).filter(q => q.storyId === storyId);
  }

  async getAllQueries(): Promise<SearchQuery[]> {
    return Array.from(this.searchQueries.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createSearchQuery(insertQuery: InsertSearchQuery): Promise<SearchQuery> {
    const id = randomUUID();
    const query: SearchQuery = {
      ...insertQuery,
      id,
      storyId: insertQuery.storyId || null,
      generatedBy: insertQuery.generatedBy || 'manual',
      isActive: insertQuery.isActive ?? true,
      createdAt: new Date(),
    };
    this.searchQueries.set(id, query);
    return query;
  }

  async updateSearchQuery(id: string, updateData: Partial<InsertSearchQuery>): Promise<SearchQuery | undefined> {
    const query = this.searchQueries.get(id);
    if (!query) return undefined;

    const updatedQuery: SearchQuery = { ...query, ...updateData };
    this.searchQueries.set(id, updatedQuery);
    return updatedQuery;
  }

  async deleteSearchQuery(id: string): Promise<boolean> {
    return this.searchQueries.delete(id);
  }

  // Search Results
  async getSearchResult(id: string): Promise<SearchResult | undefined> {
    return this.searchResults.get(id);
  }

  async getResultsByQueryId(queryId: string): Promise<SearchResult[]> {
    return Array.from(this.searchResults.values()).filter(r => r.queryId === queryId);
  }

  async getResultsByStoryId(storyId: string): Promise<SearchResult[]> {
    return Array.from(this.searchResults.values()).filter(r => r.storyId === storyId);
  }

  async createSearchResult(insertResult: InsertSearchResult): Promise<SearchResult> {
    const id = randomUUID();
    const result: SearchResult = {
      ...insertResult,
      id,
      storyId: insertResult.storyId || null,
      queryId: insertResult.queryId || null,
      cited: insertResult.cited ?? false,
      citationContext: insertResult.citationContext || null,
      confidence: insertResult.confidence ?? 0,
      searchedAt: new Date(),
    };
    this.searchResults.set(id, result);
    return result;
  }

  // Citations
  async getCitation(id: string): Promise<Citation | undefined> {
    return this.citations.get(id);
  }

  async getCitationsByStoryId(storyId: string): Promise<Citation[]> {
    return Array.from(this.citations.values()).filter(c => c.storyId === storyId);
  }

  async getRecentCitations(limit: number = 10): Promise<Citation[]> {
    return Array.from(this.citations.values())
      .sort((a, b) => new Date(b.foundAt!).getTime() - new Date(a.foundAt!).getTime())
      .slice(0, limit);
  }

  async createCitation(insertCitation: any): Promise<Citation> {
    const id = randomUUID();
    const citation: Citation = {
      ...insertCitation,
      id,
      brandId: insertCitation.brandId || insertCitation.storyId || null,
      searchResultId: insertCitation.searchResultId || null,
      platform: insertCitation.platform || 'openai',
      query: insertCitation.query || '',
      mentionText: insertCitation.mentionText || insertCitation.citationText || '',
      context: insertCitation.context || null,
      sourceUrls: insertCitation.sourceUrls || [],
      sentiment: insertCitation.sentiment || 'neutral',
      mentionType: insertCitation.mentionType || 'direct',
      confidence: insertCitation.confidence ?? 0,
      foundAt: new Date(),
      // Legacy compatibility
      citationText: insertCitation.mentionText || insertCitation.citationText || '',
      storyId: insertCitation.brandId || insertCitation.storyId || null,
    } as Citation;
    this.citations.set(id, citation);
    return citation;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const totalStories = this.stories.size;
    const citations = this.citations.size;
    const queries = this.searchQueries.size;
    const searchResults = Array.from(this.searchResults.values());
    const mentionedResults = searchResults.filter(r => r.mentioned);
    const citationRate = searchResults.length > 0 ? Math.round((mentionedResults.length / searchResults.length) * 100) : 0;

    return {
      totalStories,
      citations,
      queries,
      citationRate,
    };
  }
}

import { dbStorage } from "./db";

export const storage = dbStorage;
