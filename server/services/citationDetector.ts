export interface CitationResult {
  cited: boolean;
  confidence: number;
  citationText: string | null;
  context: string | null;
  sourceUrls: string[];
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

      // Execute strategies with early exit for performance
      let bestMatch: CitationResult | null = null;
      let maxConfidence = 0;

      for (const strategy of strategies) {
        const result = await strategy;
        if (result.confidence > maxConfidence) {
          maxConfidence = result.confidence;
          bestMatch = result;
          
          // Early exit if we have high confidence
          if (maxConfidence >= 80) {
            break;
          }
        }
      }

      if (bestMatch && maxConfidence > 25) {
        return {
          cited: true,
          confidence: Math.round(maxConfidence),
          context: response.substring(0, 800),
          citationText: bestMatch.citationText || this.extractBestSentence(storyTitle, response),
          sourceUrls: this.extractSourceUrls(response),
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
      sourceUrls: [],
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
        sourceUrls: this.extractSourceUrls(response),
      };
    }

    return { cited: false, confidence: 0, citationText: null, context: null, sourceUrls: [] };
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
      sourceUrls: this.extractSourceUrls(response),
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
      sourceUrls: this.extractSourceUrls(response),
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
      sourceUrls: this.extractSourceUrls(response),
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
      sourceUrls: this.extractSourceUrls(response),
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

  private extractSourceUrls(response: string): string[] {
    const urls: string[] = [];
    
    // Common URL patterns that ChatGPT might include
    const urlPatterns = [
      // Standard HTTP/HTTPS URLs
      /https?:\/\/(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?/gi,
      // URLs in square brackets (common in citations)
      /\[([^\]]*(?:https?:\/\/[^\]]+)[^\]]*)\]/gi,
      // URLs in parentheses
      /\(([^)]*(?:https?:\/\/[^)]+)[^)]*)\)/gi,
      // News website patterns
      /(?:cnn\.com|bbc\.com|reuters\.com|ap\.org|nytimes\.com|washingtonpost\.com|theguardian\.com|forbes\.com|bloomberg\.com|wsj\.com|npr\.org)\/[^\s<>"\[\]{}|\\^`]*/gi,
      // Academic and research patterns
      /(?:arxiv\.org|pubmed\.ncbi\.nlm\.nih\.gov|scholar\.google\.com|researchgate\.net|doi\.org)\/[^\s<>"\[\]{}|\\^`]*/gi,
    ];

    for (const pattern of urlPatterns) {
      const matches = response.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Clean up URLs that might be wrapped in brackets or parentheses
          let cleanUrl = match;
          if (match.startsWith('[') && match.endsWith(']')) {
            cleanUrl = match.slice(1, -1);
          } else if (match.startsWith('(') && match.endsWith(')')) {
            cleanUrl = match.slice(1, -1);
          }
          
          // Extract just the URL part if it's mixed with text
          const urlMatch = cleanUrl.match(/(https?:\/\/[^\s<>"\[\]{}|\\^`]*)/i);
          if (urlMatch) {
            const url = urlMatch[1].replace(/[.,;:!?]*$/, ''); // Remove trailing punctuation
            if (url && !urls.includes(url)) {
              urls.push(url);
            }
          }
        });
      }
    }

    // Look for citations in common formats like "Source: URL" or "According to URL"
    const citationPatterns = [
      /(?:source|sources?|according to|from|via|see|ref|reference):?\s*(https?:\/\/[^\s<>"\[\]{}|\\^`]*)/gi,
      /\b(?:available at|found at|read more at):?\s*(https?:\/\/[^\s<>"\[\]{}|\\^`]*)/gi,
    ];

    for (const pattern of citationPatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        if (match[1]) {
          const url = match[1].replace(/[.,;:!?]*$/, ''); // Remove trailing punctuation
          if (url && !urls.includes(url)) {
            urls.push(url);
          }
        }
      }
    }

    return urls.slice(0, 20); // Limit to 20 URLs max
  }
}

export const citationDetector = new CitationDetector();
