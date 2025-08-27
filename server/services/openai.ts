import OpenAI from "openai";

let openai: OpenAI | null = null;

// Initialize OpenAI only if API key is available
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });
  console.log("OpenAI API initialized successfully");
} else {
  console.warn("OPENAI_API_KEY not found - OpenAI features will be disabled");
}

export async function searchLLMWithQuery(query: string): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI API is not configured. Please provide OPENAI_API_KEY environment variable.");
  }
  
  // Validate API key is still working
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is missing from environment variables.");
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `${query}

Please provide specific sources, URLs, or references where this information can be verified if available. Include links in your response using formats like "Source: https://..." or "According to https://..." or "Read more: https://...".`,
        }
      ],
      max_completion_tokens: 1000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error(`OpenAI API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateBrandMentionQueries(brandName: string, keywords: string[], industry?: string): Promise<string[]> {
  if (!openai) {
    throw new Error("OpenAI API is not configured. Please provide OPENAI_API_KEY environment variable.");
  }
  
  // Validate API key is still working
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is missing from environment variables.");
  }
  
  try {
    const prompt = `Generate 8-12 diverse search queries to find mentions of the brand "${brandName}" across the web. The queries should be designed to discover when this brand is mentioned, cited, or discussed by AI systems like ChatGPT.

Brand Name: ${brandName}
Keywords: ${keywords.join(", ")}
Industry: ${industry || "Not specified"}

Generate queries that would help discover:
1. Direct brand mentions and discussions
2. Industry news that might reference the brand
3. Competitor comparisons that include the brand
4. Product/service reviews and mentions
5. Recent news, announcements, or developments
6. Expert opinions or analysis mentioning the brand

Each query should be:
- Natural and conversational (as a real user would ask)
- Likely to generate responses that mention ${brandName}
- Varied in approach (news, comparisons, reviews, industry discussions)
- Specific enough to be relevant but broad enough to capture various mention contexts

Respond with a JSON object containing an array of query strings: { "queries": ["query1", "query2", ...] }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at generating search queries for brand monitoring and PR tracking. Generate realistic, varied queries that would help discover mentions of a specific brand across different contexts. Always respond with a JSON object containing an array of query strings."
        },
        {
          role: "user",
          content: prompt,
        }
      ],
    });

    const content = response.choices[0].message.content || "";
    console.log("OpenAI brand query response:", content);
    
    // Try to extract JSON from the response
    try {
      const result = JSON.parse(content);
      return result.queries || [];
    } catch (parseError) {
      // If it's not valid JSON, try to extract queries manually
      const lines = content.split('\n').filter(line => 
        line.trim() && (line.includes('?') || line.includes('how') || line.includes('what') || line.includes('when'))
      );
      return lines.slice(0, 8).map(line => line.trim().replace(/^[-*•]\s*/, ''));
    }
  } catch (error) {
    console.error("OpenAI brand query generation error:", error);
    throw new Error(`Failed to generate brand mention queries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
