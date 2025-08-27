import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("medium"),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  status: text("status").notNull().default("draft"), // draft, published, tracking
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const searchQueries = pgTable("search_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").references(() => stories.id),
  query: text("query").notNull(),
  generatedBy: text("generated_by").notNull().default("manual"), // manual, ai
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const searchResults = pgTable("search_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  queryId: varchar("query_id").references(() => searchQueries.id),
  storyId: varchar("story_id").references(() => stories.id),
  platform: text("platform").notNull(), // openai, claude, etc
  response: text("response").notNull(),
  cited: boolean("cited").default(false),
  citationContext: text("citation_context"),
  confidence: integer("confidence").default(0), // 0-100
  searchedAt: timestamp("searched_at").defaultNow(),
});

export const citations = pgTable("citations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").references(() => stories.id),
  searchResultId: varchar("search_result_id").references(() => searchResults.id),
  platform: text("platform").notNull(),
  query: text("query").notNull(),
  citationText: text("citation_text").notNull(),
  context: text("context"),
  sourceUrls: text("source_urls").array().default(sql`ARRAY[]::text[]`),
  confidence: integer("confidence").default(0),
  foundAt: timestamp("found_at").defaultNow(),
});

// Insert schemas
export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
}).extend({
  tags: z.union([
    z.array(z.string()),
    z.string().transform((str) => str.split(',').map(tag => tag.trim()).filter(Boolean))
  ]).optional().default([]),
});

export const insertSearchQuerySchema = createInsertSchema(searchQueries).omit({
  id: true,
  createdAt: true,
});

export const insertSearchResultSchema = createInsertSchema(searchResults).omit({
  id: true,
  searchedAt: true,
});

export const insertCitationSchema = createInsertSchema(citations).omit({
  id: true,
  foundAt: true,
});

// Types
export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type SearchQuery = typeof searchQueries.$inferSelect;
export type InsertSearchQuery = z.infer<typeof insertSearchQuerySchema>;
export type SearchResult = typeof searchResults.$inferSelect;
export type InsertSearchResult = z.infer<typeof insertSearchResultSchema>;
export type Citation = typeof citations.$inferSelect;
export type InsertCitation = z.infer<typeof insertCitationSchema>;

// Additional types for API responses
export type StoryWithQueries = Story & {
  queries: SearchQuery[];
  citationCount: number;
  lastSearched?: Date;
};

export type DashboardStats = {
  totalStories: number;
  citations: number;
  queries: number;
  citationRate: number;
};
