import { generateBrandMentionQueries } from "./openai";

export class QueryGenerator {
  async generateQueriesFromStory(title: string, content: string, tags: string[]): Promise<string[]> {
    try {
      // Use OpenAI to generate contextual queries
      const aiQueries = await generateSearchQueries(title, content, tags);
      
      // Generate some basic template queries as fallback
      const templateQueries = this.generateTemplateQueries(title, tags);
      
      // Combine and deduplicate
      const allQueries = [...aiQueries, ...templateQueries];
      const uniqueQueries = Array.from(new Set(allQueries));
      
      return uniqueQueries.slice(0, 10); // Limit to 10 queries max
    } catch (error) {
      console.error("AI query generation failed, falling back to template queries:", error);
      return this.generateTemplateQueries(title, tags);
    }
  }

  private generateTemplateQueries(title: string, tags: string[]): string[] {
    const queries: string[] = [];
    
    // Extract key terms from title
    const titleWords = title.toLowerCase().split(' ').filter(word => 
      word.length > 3 && !['the', 'and', 'for', 'with', 'that', 'this'].includes(word)
    );
    
    // Generate queries based on title
    if (titleWords.length > 0) {
      queries.push(`What is ${titleWords.slice(0, 3).join(' ')}?`);
      queries.push(`${titleWords[0]} news`);
      queries.push(`Latest ${titleWords.slice(0, 2).join(' ')} updates`);
    }
    
    // Generate queries based on tags
    tags.forEach(tag => {
      const cleanTag = tag.trim().toLowerCase();
      queries.push(`Best ${cleanTag} solutions`);
      queries.push(`${cleanTag} news today`);
      queries.push(`What is happening with ${cleanTag}?`);
    });
    
    return queries.filter(q => q.length > 5);
  }
}

export const queryGenerator = new QueryGenerator();
