/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, BarChart3, MessageSquare, Terminal, Lock, Activity } from "lucide-react";
import ProxyView from "./components/ProxyView";
import DashboardView from "./components/DashboardView";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"proxy" | "dashboard">("proxy");

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E1E1E6] font-sans selection:bg-[#3E3E42] selection:text-white">
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#1E1E20] bg-[#0A0A0B]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">Shield<span className="text-indigo-400">LLM</span></h1>
            <div className="ml-4 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Protection
            </div>
          </div>

          <nav className="flex p-1 bg-[#161618] rounded-xl border border-[#1E1E20]">
            <button
              onClick={() => setActiveTab("proxy")}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                activeTab === "proxy" ? "bg-[#252529] text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              Secure Proxy
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                activeTab === "dashboard" ? "bg-[#252529] text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </nav>

          <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              AES-256
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              99.9% Up
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "proxy" ? <ProxyView /> : <DashboardView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 border-t border-[#1E1E20] bg-[#0A0A0B] flex items-center px-4 text-[10px] font-mono text-gray-600 justify-between">
        <div className="flex items-center gap-4">
          <span>INSTANCE: SHIELD-CORE-V1</span>
          <span>REGION: GLOBAL-M-01</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            SYSTEM_OK
          </div>
          <div className="flex items-center gap-1">
            <Terminal className="w-3 h-3" />
            v1.2.0-STABLE
          </div>
        </div>
      </footer>
    </div>
  );
}

