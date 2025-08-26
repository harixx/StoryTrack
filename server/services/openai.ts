import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Validate API key on startup
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is required");
}

export async function searchLLMWithQuery(query: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: query,
        }
      ],
      max_completion_tokens: 1000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error(`OpenAI API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateSearchQueries(storyTitle: string, storyContent: string, tags: string[]): Promise<string[]> {
  try {
    const prompt = `Based on the following news story, generate 5-8 relevant search queries that people might ask a large language model when looking for information related to this story's topic. The queries should be natural questions or search terms that would likely result in this story being mentioned as a relevant source.

Story Title: ${storyTitle}

Story Content: ${storyContent}

Tags: ${tags.join(", ")}

Generate queries that are:
1. Natural and conversational
2. Likely to be asked by real users
3. Related to the main topics and themes of the story
4. Varied in specificity (some broad, some specific)

Respond with a JSON object containing an array of query strings: { "queries": ["query1", "query2", ...] }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at generating search queries that people would naturally ask when looking for information. Generate realistic, varied queries that would lead someone to find the given news story. Always respond with a JSON object containing an array of query strings."
        },
        {
          role: "user",
          content: prompt,
        }
      ],
    });

    const content = response.choices[0].message.content || "";
    console.log("OpenAI response:", content);
    
    // Try to extract JSON from the response
    try {
      const result = JSON.parse(content);
      return result.queries || [];
    } catch (parseError) {
      // If it's not valid JSON, try to extract queries manually
      const lines = content.split('\n').filter(line => 
        line.trim() && (line.includes('?') || line.includes('how') || line.includes('what') || line.includes('when'))
      );
      return lines.slice(0, 5).map(line => line.trim().replace(/^[-*•]\s*/, ''));
    }
  } catch (error) {
    console.error("OpenAI query generation error:", error);
    throw new Error(`Failed to generate search queries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
