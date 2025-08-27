export interface CitationResult {
  cited: boolean;
  confidence: number;
  citationText: string | null;
  context: string | null;
}

export class CitationDetector {
  async detectCitation(
    storyTitle: string,
    storyContent: string,
    query: string,
    response: string
  ): Promise<CitationResult> {
    try {
      // Enhanced citation detection with multiple strategies
      const strategies = [
        this.exactTitleMatch(storyTitle, response),
        this.keywordDensityAnalysis(storyTitle, storyContent, response),
        this.semanticSimilarity(storyTitle, storyContent, response),
        this.entityMatch(storyContent, response),
      ];

      const results = await Promise.all(strategies);
      const maxConfidence = Math.max(...results.map(r => r.confidence));
      const bestMatch = results.find(r => r.confidence === maxConfidence);

      if (bestMatch && maxConfidence > 25) {
        return {
          cited: true,
          confidence: Math.round(maxConfidence),
          context: response.substring(0, 800),
          citationText: bestMatch.citationText || this.extractBestSentence(storyTitle, response),
        };
      }

    } catch (error) {
      console.error("Citation detection error:", error);
      // Fallback to simple detection
      return this.simpleDetection(storyTitle, storyContent, response);
    }

    return {
      cited: false,
      confidence: 0,
      citationText: null,
      context: null,
    };
  }

  private exactTitleMatch(title: string, response: string): CitationResult {
    const titleLower = title.toLowerCase();
    const responseLower = response.toLowerCase();

    if (responseLower.includes(titleLower)) {
      return {
        cited: true,
        confidence: 90,
        citationText: title,
        context: response.substring(0, 300),
      };
    }

    return { cited: false, confidence: 0, citationText: null, context: null };
  }

  private keywordDensityAnalysis(title: string, content: string, response: string): CitationResult {
    const titleWords = title.toLowerCase().split(' ').filter(word => word.length > 3);
    const contentKeywords = this.extractKeywords(content);
    const responseLower = response.toLowerCase();

    let titleMatches = 0;
    let keywordMatches = 0;

    titleWords.forEach(word => {
      if (responseLower.includes(word)) {
        titleMatches++;
      }
    });

    contentKeywords.forEach(keyword => {
      if (responseLower.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    });

    const titleScore = titleWords.length > 0 ? (titleMatches / titleWords.length) * 50 : 0;
    const keywordScore = Math.min(keywordMatches * 8, 50);
    const totalConfidence = titleScore + keywordScore;

    return {
      cited: totalConfidence > 25,
      confidence: Math.min(totalConfidence, 85),
      citationText: this.extractBestSentence(title, response),
      context: response.substring(0, 400),
    };
  }

  private semanticSimilarity(title: string, content: string, response: string): CitationResult {
    const titleConcepts = this.extractConcepts(title);
    const contentConcepts = this.extractConcepts(content);
    const responseConcepts = this.extractConcepts(response);

    let conceptMatches = 0;
    const allConcepts = [...titleConcepts, ...contentConcepts];

    responseConcepts.forEach(concept => {
      if (allConcepts.some(c => c.toLowerCase().includes(concept.toLowerCase()) || 
                              concept.toLowerCase().includes(c.toLowerCase()))) {
        conceptMatches++;
      }
    });

    const confidence = Math.min(conceptMatches * 15, 70);

    return {
      cited: confidence > 30,
      confidence,
      citationText: this.extractBestSentence(title, response),
      context: response.substring(0, 350),
    };
  }

  private entityMatch(content: string, response: string): CitationResult {
    const entities = this.extractEntities(content);
    const responseLower = response.toLowerCase();
    let entityMatches = 0;

    entities.forEach(entity => {
      if (responseLower.includes(entity.toLowerCase())) {
        entityMatches++;
      }
    });

    const confidence = Math.min(entityMatches * 20, 75);

    return {
      cited: confidence > 25,
      confidence,
      citationText: this.extractBestSentence(entities.join(' '), response),
      context: response.substring(0, 400),
    };
  }

  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const stopWords = ['that', 'this', 'with', 'from', 'they', 'have', 'been', 'will', 'were', 'said', 'what', 'when', 'where', 'would', 'there', 'their'];
    
    return words
      .filter(word => !stopWords.includes(word))
      .filter((word, index, arr) => arr.indexOf(word) === index)
      .slice(0, 15);
  }

  private extractConcepts(text: string): string[] {
    const conceptPatterns = [
      /\b(?:company|corporation|startup|business|firm|enterprise)\b/gi,
      /\b(?:technology|software|platform|service|product|solution)\b/gi,
      /\b(?:funding|investment|revenue|market|industry|sector)\b/gi,
      /\b(?:CEO|founder|executive|president|director|manager)\b/gi,
    ];

    const concepts: string[] = [];
    conceptPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        concepts.push(...matches);
      }
    });

    return concepts.slice(0, 10);
  }

  private extractBestSentence(title: string, response: string): string | null {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const titleWords = title.toLowerCase().split(' ').filter(word => word.length > 3);

    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      const matches = titleWords.filter(word => sentenceLower.includes(word));
      if (matches.length >= 2 || (matches.length === 1 && titleWords.length <= 2)) {
        return sentence.trim().substring(0, 200);
      }
    }

    return sentences[0]?.trim().substring(0, 200) || null;
  }

  private simpleDetection(title: string, content: string, response: string): CitationResult {
    const titleWords = title.toLowerCase().split(' ');
    const responseText = response.toLowerCase();

    let matchedWords = 0;
    titleWords.forEach(word => {
      if (word.length > 3 && responseText.includes(word)) {
        matchedWords++;
      }
    });

    const confidence = titleWords.length > 0 ? (matchedWords / titleWords.length) * 60 : 0;

    return {
      cited: confidence > 30,
      confidence: Math.round(confidence),
      citationText: this.extractBestSentence(title, response),
      context: response.substring(0, 300),
    };
  }
  
  private extractKeyPhrases(content: string): string[] {
    // Simple extraction of quoted text and capitalized phrases
    const phrases: string[] = [];
    
    // Extract quoted text
    const quotedMatches = content.match(/"([^"]+)"/g);
    if (quotedMatches) {
      phrases.push(...quotedMatches.map(match => match.slice(1, -1)));
    }
    
    // Extract capitalized multi-word phrases (likely product/company names)
    const capitalizedMatches = content.match(/[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
    if (capitalizedMatches) {
      phrases.push(...capitalizedMatches);
    }
    
    return phrases.filter(phrase => phrase.length > 3 && phrase.length < 50);
  }
  
  private extractEntities(content: string): string[] {
    // Extract potential company names, product names, etc.
    const entities: string[] = [];
    
    // Look for patterns like "Company Name", "Product Name", etc.
    const entityPatterns = [
      /(?:^|\s)([A-Z][a-zA-Z]{2,}\s+[A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})?)/g,
      /(?:^|\s)([A-Z]{2,}[a-z]+[A-Z][a-zA-Z]*)/g, // CamelCase
    ];
    
    entityPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        entities.push(...matches.map(match => match.trim()));
      }
    });
    
    return entities.filter(entity => entity.length > 2 && entity.length < 30);
  }
  
  private extractContext(text: string, searchTerm: string): string {
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return "";
    
    const start = Math.max(0, index - 100);
    const end = Math.min(text.length, index + searchTerm.length + 100);
    
    return text.slice(start, end).trim();
  }
}

export const citationDetector = new CitationDetector();
