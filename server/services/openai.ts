import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export async function searchLLMWithQuery(query: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
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
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert at generating search queries that people would naturally ask when looking for information. Generate realistic, varied queries that would lead someone to find the given news story."
        },
        {
          role: "user",
          content: prompt,
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.queries || [];
  } catch (error) {
    throw new Error(`Failed to generate search queries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
