import React, { useEffect, useState } from "react";
import { getAnalyticsLogs, getAnalyticsSummary } from "../lib/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { 
  TrendingUp, ShieldAlert, Cpu, Hash, Clock, 
  ExternalLink, ChevronRight, AlertCircle 
} from "lucide-react";
import { motion } from "motion/react";

interface Log {
  id: number;
  timestamp: string;
  prompt_length: number;
  response_length: number;
  status: string;
  security_flag: boolean;
  tokens_estimate: number;
}

interface Summary {
  total_requests: number;
  flagged_count: number;
  avg_prompt: number;
  total_tokens: number;
}

export default function DashboardView() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsData, summaryData] = await Promise.all([
          getAnalyticsLogs(),
          getAnalyticsSummary()
        ]);
        setLogs(logsData);
        setSummary(summaryData);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Aggregating Metrics...</span>
        </div>
      </div>
    );
  }

  // Prep chart data
  const chartData = logs.slice(0, 20).reverse().map((log, i) => ({
    name: i + 1,
    tokens: log.tokens_estimate || 0,
    security: log.security_flag ? 100 : 0
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Requests" 
          value={summary?.total_requests || 0} 
          icon={<Hash className="w-4 h-4" />} 
          color="indigo" 
        />
        <StatCard 
          label="Flagged Requests" 
          value={summary?.flagged_count || 0} 
          icon={<ShieldAlert className="w-4 h-4" />} 
          color="amber" 
        />
        <StatCard 
          label="Estimated Tokens" 
          value={(summary?.total_tokens || 0).toLocaleString()} 
          icon={<Cpu className="w-4 h-4" />} 
          color="emerald" 
        />
        <StatCard 
          label="Avg. Prompt Size" 
          value={`${Math.round(summary?.avg_prompt || 0)} chars`} 
          icon={<TrendingUp className="w-4 h-4" />} 
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Token Usage Chart */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Token Consumption Trend
            </h3>
            <span className="text-[10px] font-mono text-gray-500 uppercase">Last 20 Requests</span>
          </div>
          <div className="h-[300px] w-full rounded-2xl border border-[#1E1E20] bg-[#161618] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E20" vertical={false} />
                <XAxis dataKey="name" stroke="#52525B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525B" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E20', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Area type="monotone" dataKey="tokens" stroke="#6366f1" fillOpacity={1} fill="url(#colorTokens)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Logs Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Audit Stream
            </h3>
            <span className="text-[10px] font-mono text-gray-500 uppercase">Real-time</span>
          </div>
          <div className="h-[300px] rounded-2xl border border-[#1E1E20] bg-[#161618] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-600 text-xs italic">
                  No audit logs recorded yet.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 border-b border-[#1E1E20] last:border-0 hover:bg-[#1E1E20]/50 transition-colors group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-gray-500">ID: #{log.id}</span>
                      <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${log.security_flag ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <span className={`text-xs font-medium ${log.security_flag ? 'text-amber-400' : 'text-gray-300'}`}>
                        {log.security_flag ? 'SECURITY_FLAGGED' : 'AUDIT_PASSED'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="p-3 text-[10px] font-mono text-indigo-400 hover:text-indigo-300 border-t border-[#1E1E20] transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
              View Full Audit Trail <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Raw Data Table */}
      <div className="space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Hash className="w-5 h-5 text-purple-400" />
          Recent Transaction Log
        </h3>
        <div className="rounded-2xl border border-[#1E1E20] bg-[#161618] overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#1E1E20] text-gray-400 text-[10px] uppercase font-mono tracking-widest">
              <tr>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Prompt (Ch)</th>
                <th className="px-6 py-4 font-semibold">Response (Ch)</th>
                <th className="px-6 py-4 font-semibold">Tokens</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E20]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{log.prompt_length}</td>
                  <td className="px-6 py-4 text-gray-300">{log.response_length || 0}</td>
                  <td className="px-6 py-4 font-bold text-indigo-400">{log.tokens_estimate || 0}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-500 uppercase border border-emerald-500/20">
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.security_flag ? (
                      <span className="text-amber-500 flex items-center gap-1 text-[10px] font-mono uppercase font-bold">
                        <AlertCircle className="w-3 h-3" /> HIGH
                      </span>
                    ) : (
                      <span className="text-gray-600 text-[10px] font-mono uppercase">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <div className="p-6 rounded-2xl border border-[#1E1E20] bg-[#161618] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">{label}</span>
        <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
    </div>
  );
}
