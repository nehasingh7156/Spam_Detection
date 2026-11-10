import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Mail,
  Activity,
  ArrowRight,
  Cpu,
  Server,
  Zap,
  Upload,
  Eye,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useDetection } from '../context/DetectionContext';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { formatScore, formatTimestamp, truncate } from '../utils/formatters';

export const Dashboard = () => {
  const { history, stats, backendHealth, loadEvaluationSamples } = useDetection();
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Group detection history by timestamp for timeline chart
  const timelineData = useMemo(() => {
    if (history.length === 0) return [];

    // Bucket by date or hourly
    const buckets = {};
    const sorted = [...history].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    sorted.forEach((item) => {
      const d = new Date(item.timestamp);
      // Format as "HH:mm" or "MMM DD"
      const key = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
      if (!buckets[key]) {
        buckets[key] = { time: key, spam: 0, ham: 0, total: 0 };
      }
      if (item.prediction === 'Spam' || item.label === 1) {
        buckets[key].spam += 1;
      } else {
        buckets[key].ham += 1;
      }
      buckets[key].total += 1;
    });

    return Object.values(buckets).slice(-10);
  }, [history]);

  // Donut chart data
  const pieData = useMemo(() => {
    if (stats.total === 0) return [];
    return [
      { name: 'Spam Detected', value: stats.spamCount, color: '#EF4444' },
      { name: 'Safe Messages', value: stats.hamCount, color: '#22C55E' },
    ];
  }, [stats]);

  // Recent 6 detections
  const recentDetections = useMemo(() => {
    return history.slice(0, 6);
  }, [history]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cyber-text">
              Security Overview
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyber-accent text-[11px] font-mono font-medium">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-cyber-muted mt-1">
            Monitor message security, spam detection activity, and model performance.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/detector"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyber-accent hover:bg-blue-600 text-white text-xs font-semibold shadow-glow-blue transition-all"
          >
            <Zap size={14} className="stroke-[2.5]" />
            <span>Analyze Message</span>
          </Link>
          <Link
            to="/bulk"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyber-card hover:bg-cyber-cardHover text-cyber-text border border-cyber-border text-xs font-medium transition-all"
          >
            <Upload size={14} />
            <span>Upload CSV</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Messages Scanned"
          value={stats.total.toLocaleString()}
          subtitle={stats.total === 0 ? 'No scans executed yet' : 'Real-time audit log'}
          icon={Mail}
          color="blue"
        />
        <StatCard
          title="Spam Detected"
          value={stats.spamCount.toLocaleString()}
          subtitle={stats.total > 0 ? `${stats.detectionRate.toFixed(1)}% interception rate` : 'Zero threats detected'}
          icon={ShieldAlert}
          color="red"
        />
        <StatCard
          title="Safe Messages"
          value={stats.hamCount.toLocaleString()}
          subtitle={stats.total > 0 ? `${(100 - stats.detectionRate).toFixed(1)}% verified legitimate` : 'Clean inbox telemetry'}
          icon={ShieldCheck}
          color="green"
        />
        <StatCard
          title="Detection Rate"
          value={`${stats.detectionRate.toFixed(1)}%`}
          subtitle={stats.total > 0 ? 'Spam ratio in telemetry' : 'Calculated upon detection'}
          icon={Activity}
          color="cyan"
        />
      </div>

      {/* Visualization Row: Donut Chart & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classification Distribution Donut Chart */}
        <ChartCard
          title="Classification Distribution"
          subtitle="Real-time proportion of Spam vs Legitimate traffic"
          icon={PieChart}
          className="lg:col-span-1"
        >
          {stats.total > 0 ? (
            <div className="h-64 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#151F32" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#151F32',
                      borderColor: '#263449',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="w-full flex items-center justify-around pt-2 border-t border-cyber-border/40 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyber-spam" />
                  <span className="text-cyber-muted">Spam:</span>
                  <span className="font-mono font-bold text-cyber-text">{stats.spamCount}</span>
                  <span className="text-cyber-dim font-mono">({stats.detectionRate.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyber-safe" />
                  <span className="text-cyber-muted">Safe:</span>
                  <span className="font-mono font-bold text-cyber-text">{stats.hamCount}</span>
                  <span className="text-cyber-dim font-mono">({(100 - stats.detectionRate).toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Classification Data"
              description="Analyze a message or upload a CSV to generate distribution telemetry."
              actionText="Analyze First Message"
              actionLink="/detector"
              secondaryActionText="Load Sample Data"
              onSecondaryAction={loadEvaluationSamples}
            />
          )}
        </ChartCard>

        {/* Detection Activity Timeline Chart */}
        <ChartCard
          title="Detection Activity Timeline"
          subtitle="Frequency of incoming scans and threat interceptions"
          icon={Activity}
          className="lg:col-span-2"
        >
          {timelineData.length > 0 ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="spamGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="hamGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263449" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#263449' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#263449' }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#151F32',
                      borderColor: '#263449',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="spam"
                    name="Spam Threats"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#spamGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="ham"
                    name="Legitimate Messages"
                    stroke="#22C55E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#hamGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No Activity Logged"
              description="Detection timeline will chart incoming messages as you analyze emails."
              actionText="Scan a Message"
              actionLink="/detector"
            />
          )}
        </ChartCard>
      </div>

      {/* Row: Recent Detection Activity & System Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Detections Table (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-cyber-card border border-cyber-border p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-cyber-border mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyber-input flex items-center justify-center text-cyber-accent border border-cyber-border/70">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-cyber-text">Recent Detection Activity</h3>
                <p className="text-xs text-cyber-muted">Latest analyzed messages and threat classifications</p>
              </div>
            </div>
            {history.length > 0 && (
              <Link
                to="/history"
                className="text-xs text-cyber-accent hover:underline flex items-center gap-1 font-medium"
              >
                <span>View Full Audit Log</span>
                <ArrowRight size={13} />
              </Link>
            )}
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentDetections.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-cyber-border/70 text-cyber-muted font-medium uppercase tracking-wider">
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Message Preview</th>
                    <th className="py-2.5 px-3">Decision Score</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/40">
                  {recentDetections.map((row) => (
                    <tr key={row.id} className="hover:bg-cyber-cardHover/40 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={row.prediction} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-cyber-text font-mono max-w-xs">
                        <span className="truncate block" title={row.message}>
                          {truncate(row.message, 50)}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                            row.decision_score > 0
                              ? 'text-red-400 bg-red-500/10'
                              : 'text-emerald-400 bg-emerald-500/10'
                          }`}
                        >
                          {formatScore(row.decision_score)}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-cyber-muted text-[11px]">
                        {formatTimestamp(row.timestamp)}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedMessage(row)}
                          className="p-1 rounded bg-cyber-input hover:bg-cyber-cardHover text-cyber-muted hover:text-white transition-colors"
                          title="Inspect Message"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8">
                <EmptyState
                  title="No Recent Detections"
                  description="Your audit log is currently clean. Start by evaluating an email in the detector."
                  actionText="Analyze Message"
                  actionLink="/detector"
                  secondaryActionText="Load Sample Data"
                  onSecondaryAction={loadEvaluationSamples}
                />
              </div>
            )}
          </div>
        </div>

        {/* System & Model Status Overview (1 col) */}
        <div className="space-y-6 flex flex-col">
          {/* Model Performance Card (Real Test-set Results) */}
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-5">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border mb-3">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-cyber-cyan" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-text">
                  Model Performance (Linear SVM)
                </h3>
              </div>
              <Link to="/insights" className="text-[11px] text-cyber-accent hover:underline">
                Details →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-cyber-input border border-cyber-border">
                <span className="text-[10px] text-cyber-muted uppercase tracking-wider block">
                  Accuracy
                </span>
                <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                  98.45%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-cyber-input border border-cyber-border">
                <span className="text-[10px] text-cyber-muted uppercase tracking-wider block">
                  Spam Precision
                </span>
                <span className="text-base font-bold font-mono text-cyan-400 mt-0.5 block">
                  93.75%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-cyber-input border border-cyber-border">
                <span className="text-[10px] text-cyber-muted uppercase tracking-wider block">
                  Spam Recall
                </span>
                <span className="text-base font-bold font-mono text-blue-400 mt-0.5 block">
                  93.75%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-cyber-input border border-cyber-border">
                <span className="text-[10px] text-cyber-muted uppercase tracking-wider block">
                  F1-Score
                </span>
                <span className="text-base font-bold font-mono text-purple-400 mt-0.5 block">
                  93.75%
                </span>
              </div>
            </div>

            <p className="text-[10px] text-cyber-dim mt-3 italic">
              *Verified test-set evaluation benchmarks from backend training pipeline.
            </p>
          </div>

          {/* System Telemetry Status */}
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-cyber-border mb-3">
              <Server size={16} className="text-cyber-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-text">
                Architecture Status
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-cyber-input border border-cyber-border">
                <span className="text-cyber-muted flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      backendHealth.isChecking && !backendHealth.lastChecked
                        ? 'bg-amber-400 animate-pulse'
                        : backendHealth.isOnline
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-red-400'
                    }`}
                  />
                  FastAPI Backend:
                </span>
                <span className="font-mono text-xs font-medium">
                  {backendHealth.isChecking && !backendHealth.lastChecked ? (
                    <span className="text-amber-400 flex items-center gap-1">
                      <RefreshCw size={11} className="animate-spin" /> Checking...
                    </span>
                  ) : backendHealth.isOnline ? (
                    <span className="text-emerald-400">
                      Backend Online ({backendHealth.latency}ms)
                    </span>
                  ) : (
                    <span className="text-red-400">
                      Backend Offline
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-cyber-input border border-cyber-border">
                <span className="text-cyber-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Classifier Engine:
                </span>
                <span className="font-mono text-cyber-text font-medium">
                  Linear SVM (TF-IDF)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-cyber-input border border-cyber-border">
                <span className="text-cyber-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Frontend Engine:
                </span>
                <span className="font-mono text-cyber-text font-medium">
                  React 19 + Vite
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Inspection Modal */}
      {selectedMessage && (
        <Modal
          isOpen={!!selectedMessage}
          onClose={() => setSelectedMessage(null)}
          title="Threat Audit Inspection"
          subtitle={`Detection ID: ${selectedMessage.id}`}
          icon={selectedMessage.prediction === 'Spam' ? ShieldAlert : ShieldCheck}
          footer={
            <button
              onClick={() => setSelectedMessage(null)}
              className="px-4 py-2 rounded-lg bg-cyber-cardHover hover:bg-cyber-cardActive text-xs text-cyber-text border border-cyber-border"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-cyber-input border border-cyber-border">
              <div>
                <span className="text-cyber-dim block text-[10px] uppercase">Classification</span>
                <StatusBadge status={selectedMessage.prediction} size="md" className="mt-1" />
              </div>
              <div>
                <span className="text-cyber-dim block text-[10px] uppercase">Decision Score</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    selectedMessage.decision_score > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {formatScore(selectedMessage.decision_score)}
                </span>
              </div>
              <div>
                <span className="text-cyber-dim block text-[10px] uppercase">Logged At</span>
                <span className="text-cyber-muted font-mono mt-1 block">
                  {formatTimestamp(selectedMessage.timestamp)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-cyber-dim uppercase text-[10px] font-semibold block mb-1">
                Full Message Payload
              </label>
              <div className="p-3.5 rounded-xl bg-cyber-input border border-cyber-border text-cyber-text font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto select-all">
                {selectedMessage.message}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-cyber-muted text-xs leading-relaxed">
              <span className="font-semibold text-blue-400 block mb-1">SVM Hyperplane Telemetry:</span>
              Linear Support Vector Machine produces an algebraic decision function value $w \cdot x + b$. Positive values correspond to Spam ($&gt;0$), while negative values correspond to Legitimate / Ham ($\le 0$).
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
