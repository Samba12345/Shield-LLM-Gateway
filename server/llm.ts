import { GoogleGenAI as UpstreamAIProvider } from "@google/genai";
import db from "./db.js";
import { processSecurePrompt, AuditResult } from "./dlp.js";

const DEFAULT_UPSTREAM_MODEL = "gemini-3-flash-preview";

// Initialize AI Client
const llmClient = new UpstreamAIProvider({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'shield-gateway-v1',
    }
  }
});

export interface LLMResponse {
  text: string;
  tokens: number;
  audit: AuditResult;
  logId: number | bigint;
}

export const handleLLMRequest = async (prompt: string): Promise<LLMResponse> => {
  const audit = processSecurePrompt(prompt);
  
  // Create log entry
  const insert = db.prepare(`
      INSERT INTO logs (prompt_length, status, security_flag, tokens_estimate) 
      VALUES (?, ?, ?, ?)
    `);
  const result = insert.run(audit.originalLength, "processing", audit.riskScore > 0 ? 1 : 0, 0);
  const logId = result.lastInsertRowid;

  try {
    const response = await llmClient.models.generateContent({
      model: process.env.UPSTREAM_MODEL || DEFAULT_UPSTREAM_MODEL,
      contents: audit.redactedText,
    });

    const responseText = response.text || "";
    const tokens = Math.ceil((audit.redactedText.length + responseText.length) / 4);
    
    db.prepare(`
      UPDATE logs 
      SET status = ?, response_length = ?, tokens_estimate = ?
      WHERE id = ?
    `).run("success", responseText.length, tokens, logId);

    return { text: responseText, tokens, audit, logId };
  } catch (error: any) {
    db.prepare(`UPDATE logs SET status = ? WHERE id = ?`).run("error", logId);
    console.error("LLM Request Internal Error:", error);
    
    // Enhance error message for the user if it's an API key issue
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("PERMISSION_DENIED")) {
      throw new Error("Invalid or missing API Key. Please check your Settings > Secrets panel.");
    }
    
    throw error;
  }
};
