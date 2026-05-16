import { Router } from "express";
import db from "./db.js";
import { handleLLMRequest } from "./llm.js";

const router = Router();

// OpenAI Compatibility: POST /v1/chat/completions
router.post("/v1/chat/completions", async (req, res) => {
  try {
    const { messages } = req.body;
    const lastMessage = messages?.[messages.length - 1]?.content || "";
    
    const { text, tokens, logId } = await handleLLMRequest(lastMessage);

    // Return OpenAI Format
    res.json({
      id: `chatcmpl-${logId}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: req.body.model || "shield-llm-proxy",
      choices: [{
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: "stop"
      }],
      usage: {
        prompt_tokens: Math.ceil(lastMessage.length / 4),
        completion_tokens: Math.ceil(text.length / 4),
        total_tokens: tokens
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, type: "proxy_error" } });
  }
});

// Claude Compatibility: POST /v1/messages
router.post("/v1/messages", async (req, res) => {
  try {
    const { messages } = req.body;
    const lastMessage = messages?.[messages.length - 1]?.content || "";
    
    const { text, tokens, logId } = await handleLLMRequest(lastMessage);

    // Return Claude Format
    res.json({
      id: `msg_${logId}`,
      type: "message",
      role: "assistant",
      content: [{ type: "text", text: text }],
      model: req.body.model || "shield-llm-proxy",
      stop_reason: "end_turn",
      usage: {
        input_tokens: Math.ceil(lastMessage.length / 4),
        output_tokens: Math.ceil(text.length / 4)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: { type: "proxy_error", message: error.message } });
  }
});

// Main UI Proxy Route
router.post("/api/proxy/generate", async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ status: "error", message: "Prompt is required" });
  }

  try {
    const { text, tokens, audit, logId } = await handleLLMRequest(prompt);

    // Structured JSON Response for UI Dashboard
    res.json({
      txId: `STX-${logId}-${Date.now()}`,
      status: "success",
      data: {
        text: text,
        redacted: audit.redactionCount > 0,
      },
      audit: {
        redactions: audit.redactionCount,
        sanitized_prompt: audit.redactedText,
        risk_assessment: audit.riskScore > 50 ? "HIGH" : audit.riskScore > 0 ? "LOW" : "NONE"
      },
      tokens,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Shield Gateway Error:", error);
    res.status(500).json({ 
      status: "error", 
      error_code: "LLM_PROXY_FAILURE",
      message: error.message 
    });
  }
});

router.get("/api/analytics/logs", (req, res) => {
  const logs = db.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100").all();
  res.json(logs);
});

router.get("/api/analytics/summary", (req, res) => {
  const summary = db.prepare(`
    SELECT 
      COUNT(*) as total_requests,
      SUM(security_flag) as flagged_count,
      AVG(prompt_length) as avg_prompt,
      SUM(tokens_estimate) as total_tokens
    FROM logs
  `).get();
  res.json(summary);
});

export default router;
