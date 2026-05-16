import React, { useState } from "react";
import { Send, AlertTriangle, ShieldCheck, CornerDownLeft, Loader2, Code2, Copy, Check } from "lucide-react";
import { callShieldProxy } from "../lib/api";
import { motion, AnimatePresence } from "motion/react";

export default function ProxyView() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<{ text: string; redacted: boolean; audit: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const response = await callShieldProxy(prompt);
      setResult({
        text: response.data.text,
        redacted: response.data.redacted,
        audit: response.audit
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const baseUrl = window.location.origin;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
      {/* Input Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              Secure Gateway
            </h2>
            <p className="text-gray-400 text-sm">
              Audited server-side proxy with DLP enforcement.
            </p>
          </div>
          <button 
            onClick={() => setShowDocs(!showDocs)}
            className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 text-xs font-medium hover:bg-indigo-500/10 transition-colors flex items-center gap-2"
          >
            <Code2 className="w-4 h-4" />
            {showDocs ? "Hide Integration" : "Connection Guide"}
          </button>
        </div>

        <AnimatePresence>
          {showDocs && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4"
            >
              <div className="p-4 rounded-xl bg-[#161618] border border-[#1E1E20] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">OpenAI SDK Setup</span>
                  <button onClick={() => copyToClipboard(`baseURL: "${baseUrl}/v1"`)} className="text-gray-500 hover:text-white transition-colors">
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="bg-black/40 p-3 rounded-lg font-mono text-[11px] text-gray-300 leading-relaxed">
                  <span className="text-purple-400">from</span> openai <span className="text-purple-400">import</span> OpenAI<br/>
                  client = OpenAI(<br/>
                  &nbsp;&nbsp;base_url=<span className="text-emerald-400">"{baseUrl}/v1"</span>,<br/>
                  &nbsp;&nbsp;api_key=<span className="text-emerald-400">"proxy-not-required"</span><br/>
                  )
                </div>
                <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono">
                  <span>URL: {baseUrl}/v1</span>
                  <span>MODE: COMPAT_V1</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl border border-[#1E1E20] group-focus-within:border-indigo-500/50 transition-colors" />
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="relative w-full h-full bg-transparent p-6 outline-none resize-none text-[#E1E1E6] font-mono text-sm leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-3">
              <span className="text-[10px] font-mono text-gray-500">Press ENTER to send, SHIFT+ENTER for newline</span>
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center gap-3 text-red-400 text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          {result?.redacted && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-3 text-blue-400 text-sm"
            >
              <ShieldCheck className="w-4 h-4 mt-0.5" />
              <div>
                <strong className="block font-bold">DLP Enforcement Active</strong>
                Our enterprise proxy detected and redacted {result.audit.redactions} pieces of PII (emails/keys) before processing this request.
                <div className="mt-2 p-2 bg-black/30 rounded font-mono text-[10px] text-gray-400">
                  Audit Log: {result.audit.sanitized_prompt.substring(0, 100)}...
                </div>
              </div>
            </motion.div>
          )}
        </form>
      </div>

      {/* Output Section */}
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <CornerDownLeft className="w-6 h-6 text-emerald-400" />
            Verified Response
          </h2>
          <p className="text-gray-400 text-sm">
            Authenticated output directly from upstream LLM. Scanned and verified by middleware.
          </p>
        </div>

        <div className="flex-1 rounded-2xl border border-[#1E1E20] bg-[#161618] overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-[#1E1E20] border-b border-[#252529] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400/50" />
              <div className="w-2 h-2 rounded-full bg-amber-400/50" />
              <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
            </div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Output Terminal</span>
          </div>
          
          <div className="flex-1 p-6 font-mono text-sm leading-relaxed overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500/50" />
                <span className="text-xs uppercase tracking-[0.2em] font-bold">Processing Request...</span>
              </div>
            ) : result ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="whitespace-pre-wrap text-emerald-50/90"
              >
                {result.text}
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 italic">
                Awaiting input from secure gateway...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
