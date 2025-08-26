export class CitationDetector {
  detectCitation(storyTitle: string, storyContent: string, llmResponse: string): {
    cited: boolean;
    citationContext?: string;
    confidence: number;
  } {
    const response = llmResponse.toLowerCase();
    const title = storyTitle.toLowerCase();
    const content = storyContent.toLowerCase();
    
    let confidence = 0;
    let cited = false;
    let citationContext = "";
    
    // Check for direct title mentions
    if (response.includes(title)) {
      cited = true;
      confidence += 60;
      citationContext = this.extractContext(llmResponse, storyTitle);
    }
    
    // Check for key phrases from the story
    const keyPhrases = this.extractKeyPhrases(storyContent);
    const matchedPhrases: string[] = [];
    
    keyPhrases.forEach(phrase => {
      if (response.includes(phrase.toLowerCase())) {
        matchedPhrases.push(phrase);
        confidence += Math.min(20, 40 / keyPhrases.length);
      }
    });
    
    // Check for company/entity mentions
    const entities = this.extractEntities(storyContent);
    entities.forEach(entity => {
      if (response.includes(entity.toLowerCase())) {
        confidence += 10;
        if (!cited) {
          cited = matchedPhrases.length > 0 || confidence > 30;
          if (cited && !citationContext) {
            citationContext = this.extractContext(llmResponse, entity);
          }
        }
      }
    });
    
    // Adjust confidence based on context quality
    if (cited && citationContext.length > 50) {
      confidence += 10;
    }
    
    return {
      cited,
      citationContext: cited ? citationContext : undefined,
      confidence: Math.min(100, Math.round(confidence))
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
