import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  keywords: text("keywords").array().default(sql`ARRAY[]::text[]`), // Additional keywords to search for
  industry: text("industry"),
  priority: text("priority").notNull().default("medium"), // high, medium, low
  status: text("status").notNull().default("active"), // active, paused, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const searchQueries = pgTable("search_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  query: text("query").notNull(),
  queryType: text("query_type").notNull().default("brand_mention"), // brand_mention, competitor_analysis, industry_news
  generatedBy: text("generated_by").notNull().default("manual"), // manual, ai
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const searchResults = pgTable("search_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  queryId: varchar("query_id").references(() => searchQueries.id),
  brandId: varchar("brand_id").references(() => brands.id),
  platform: text("platform").notNull(), // openai, claude, etc
  response: text("response").notNull(),
  mentioned: boolean("mentioned").default(false), // Changed from 'cited' to 'mentioned'
  mentionContext: text("mention_context"),
  confidence: integer("confidence").default(0), // 0-100
  searchedAt: timestamp("searched_at").defaultNow(),
});

export const brandMentions = pgTable("brand_mentions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  searchResultId: varchar("search_result_id").references(() => searchResults.id),
  platform: text("platform").notNull(),
  query: text("query").notNull(),
  mentionText: text("mention_text").notNull(), // The actual text mentioning the brand
  context: text("context"), // Surrounding context
  sourceUrls: text("source_urls").array().default(sql`ARRAY[]::text[]`), // Cited sources as PR coverage evidence
  sentiment: text("sentiment").default("neutral"), // positive, negative, neutral
  mentionType: text("mention_type").default("direct"), // direct, indirect, competitor_comparison
  confidence: integer("confidence").default(0),
  foundAt: timestamp("found_at").defaultNow(),
});

// Insert schemas - Keep legacy story schema for compatibility
export const insertStorySchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tags: z.union([
    z.array(z.string()),
    z.string().transform((str) => str.split(',').map(tag => tag.trim()).filter(Boolean))
  ]).optional().default([]),
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  keywords: z.union([
    z.array(z.string()),
    z.string().transform((str) => str.split(',').map(keyword => keyword.trim()).filter(Boolean))
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

export const insertBrandMentionSchema = createInsertSchema(brandMentions).omit({
  id: true,
  foundAt: true,
});

// Types - Keep legacy types for compatibility
export type Story = typeof brands.$inferSelect & {
  title: string;
  content: string;
  category: string;
  tags: string[];
  publishedAt?: Date | null;
};
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type SearchQuery = typeof searchQueries.$inferSelect;
export type InsertSearchQuery = z.infer<typeof insertSearchQuerySchema>;
export type SearchResult = typeof searchResults.$inferSelect;
export type InsertSearchResult = z.infer<typeof insertSearchResultSchema>;
export type BrandMention = typeof brandMentions.$inferSelect;
export type InsertBrandMention = z.infer<typeof insertBrandMentionSchema>;
export type Citation = typeof brandMentions.$inferSelect & {
  citationText: string;
  storyId: string;
};
export type InsertCitation = z.infer<typeof insertBrandMentionSchema>;

// Additional types for API responses
export type StoryWithQueries = Story & {
  queries: SearchQuery[];
  citationCount: number;
  lastSearched?: Date;
};

export type BrandWithQueries = Brand & {
  queries: SearchQuery[];
  mentionCount: number;
  lastSearched?: Date;
};

export type DashboardStats = {
  totalStories: number;
  citations: number;
  totalBrands: number;
  brandMentions: number;
  queries: number;
  citationRate: number;
  mentionRate: number;
};
