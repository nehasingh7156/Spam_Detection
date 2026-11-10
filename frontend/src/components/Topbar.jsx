import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  ShieldCheck,
  ShieldAlert,
  Plus,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { useDetection } from '../context/DetectionContext';

const routeTitles = {
  '/': { title: 'Security Overview', breadcrumb: 'Dashboard' },
  '/detector': { title: 'AI Message Analyzer', breadcrumb: 'Spam Detector' },
  '/bulk': { title: 'Bulk CSV Analysis', breadcrumb: 'Batch Processor' },
  '/analytics': { title: 'Threat Intelligence', breadcrumb: 'Analytics' },
  '/history': { title: 'Detection Audit Log', breadcrumb: 'Detection History' },
  '/insights': { title: 'Machine Learning Insights', breadcrumb: 'Model Evaluation' },
  '/settings': { title: 'Platform Settings', breadcrumb: 'Settings' },
};

export const Topbar = ({
  isCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendHealth, refreshHealth, history, stats } = useDetection();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentRoute = routeTitles[location.pathname] || {
    title: 'SpamShield Security',
    breadcrumb: 'Overview',
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshHealth();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/history?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-cyber-bg/90 backdrop-blur-md border-b border-cyber-border transition-all duration-300 ${
        isCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-64'
      }`}
    >
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-cyber-muted hover:text-white hover:bg-cyber-card transition-colors"
          >
            <Menu size={20} />
          </button>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-cyber-muted">
              <span>SpamShield</span>
              <ChevronRight size={12} className="text-cyber-dim" />
              <span className="text-cyber-accent font-medium">
                {currentRoute.breadcrumb}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-cyber-text tracking-tight hidden sm:block">
              {currentRoute.title}
            </h1>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search threat logs, messages, or IDs... (Press Enter)"
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-cyber-input border border-cyber-border text-xs text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-accent transition-all"
            />
          </form>
        </div>

        {/* Right: Actions, Health Status, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Scan CTA */}
          <Link
            to="/detector"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-accent hover:bg-blue-600 text-white text-xs font-semibold shadow-glow-blue transition-all"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>New Scan</span>
          </Link>

          {/* Backend Connection Health Badge */}
          <button
            onClick={handleManualRefresh}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              backendHealth.isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
            }`}
            title={`Backend: ${backendHealth.statusText}. Click to ping health endpoint.`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendHealth.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="hidden xl:inline">
              {backendHealth.isOnline ? 'API Connected' : 'API Offline'}
            </span>
            <RefreshCw
              size={12}
              className={`shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className="relative p-2 rounded-lg text-cyber-muted hover:text-white hover:bg-cyber-card transition-colors"
              title="Security Alerts"
            >
              <Bell size={18} />
              {stats.spamCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyber-spam ring-2 ring-cyber-bg" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-cyber-card border border-cyber-border shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-cyber-border mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Threat Notifications
                  </h4>
                  <span className="text-[10px] text-cyber-dim font-mono">
                    {history.length} Events Logged
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {history.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-cyber-input/60 border border-cyber-border/70 flex items-start gap-2.5"
                    >
                      {item.prediction === 'Spam' ? (
                        <ShieldAlert size={16} className="text-cyber-spam shrink-0 mt-0.5" />
                      ) : (
                        <ShieldCheck size={16} className="text-cyber-safe shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[11px] font-semibold ${
                              item.prediction === 'Spam' ? 'text-cyber-spam' : 'text-cyber-safe'
                            }`}
                          >
                            {item.prediction === 'Spam' ? 'Spam Intercepted' : 'Message Verified'}
                          </span>
                          <span className="text-[9px] text-cyber-dim font-mono">
                            {item.decision_score > 0 ? `+${item.decision_score}` : item.decision_score}
                          </span>
                        </div>
                        <p className="text-[11px] text-cyber-muted truncate mt-0.5">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))}

                  {history.length === 0 && (
                    <div className="text-center py-6 text-xs text-cyber-muted">
                      No threat alerts registered.
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-cyber-border text-center">
                  <Link
                    to="/history"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-cyber-accent hover:underline font-medium"
                  >
                    View All Audit Logs →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-cyber-card transition-colors border border-transparent hover:border-cyber-border"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                SA
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-cyber-text leading-tight">
                  SecOps Admin
                </p>
                <p className="text-[10px] text-cyber-muted leading-tight font-mono">
                  Tier-1 SOC
                </p>
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-cyber-card border border-cyber-border shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="p-2 border-b border-cyber-border mb-2">
                  <p className="text-xs font-semibold text-white">Security Operations</p>
                  <p className="text-[11px] text-cyber-muted font-mono">admin@emailshield.local</p>
                </div>
                <div className="space-y-1">
                  <Link
                    to="/settings"
                    onClick={() => setShowProfile(false)}
                    className="block px-2.5 py-1.5 text-xs text-cyber-muted hover:text-white hover:bg-cyber-cardHover rounded-lg transition-colors"
                  >
                    API Settings & Config
                  </Link>
                  <Link
                    to="/insights"
                    onClick={() => setShowProfile(false)}
                    className="block px-2.5 py-1.5 text-xs text-cyber-muted hover:text-white hover:bg-cyber-cardHover rounded-lg transition-colors"
                  >
                    Model Benchmarks
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
