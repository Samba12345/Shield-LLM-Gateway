export interface AuditResult {
  originalLength: number;
  redactedText: string;
  redactionCount: number;
  redactionTypes: string[];
  hasSensitiveKeywords: boolean;
  riskScore: number;
}

export const processSecurePrompt = (prompt: string): AuditResult => {
  const sensitiveKeywords = ["password", "secret", "private key", "apikey"];
  const foundKeywords = sensitiveKeywords.filter(k => prompt.toLowerCase().includes(k));
  
  // PII Patterns
  const patterns = {
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    API_KEY: /(?:sk-|key-|auth-)[a-zA-Z0-9]{20,}/gi
  };

  let redactedText = prompt;
  let redactionCount = 0;
  const redactionTypes: string[] = [];

  Object.entries(patterns).forEach(([type, regex]) => {
    const matches = redactedText.match(regex);
    if (matches) {
      redactionCount += matches.length;
      redactionTypes.push(type);
      redactedText = redactedText.replace(regex, `[REDACTED_${type}]`);
    }
  });

  return {
    originalLength: prompt.length,
    redactedText,
    redactionCount,
    redactionTypes,
    hasSensitiveKeywords: foundKeywords.length > 0,
    riskScore: (foundKeywords.length * 20) + (redactionCount * 10)
  };
};
