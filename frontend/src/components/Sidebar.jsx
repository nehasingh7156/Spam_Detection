import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  FileSpreadsheet,
  BarChart3,
  History,
  Cpu,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useDetection } from '../context/DetectionContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Spam Detector', path: '/detector', icon: ShieldAlert, badge: 'Live' },
  { name: 'Bulk Analysis', path: '/bulk', icon: FileSpreadsheet },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Detection History', path: '/history', icon: History },
  { name: 'Model Insights', path: '/insights', icon: Cpu },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { backendHealth } = useDetection();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-cyber-sidebar border-r border-cyber-border transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-cyber-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-glow-blue shrink-0">
              <Shield size={22} className="stroke-[2.5]" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-white">
                    SpamShield
                  </span>
                  <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 text-[10px] font-mono rounded font-semibold border border-blue-500/30">
                    SOC
                  </span>
                </div>
                <span className="text-[11px] text-cyber-muted truncate font-mono">
                  v1.0 • ML Defense
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-cyber-muted hover:text-white hover:bg-cyber-card transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="mb-2 px-3">
            {!isCollapsed ? (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-cyber-dim">
                Navigation
              </span>
            ) : (
              <div className="h-2" />
            )}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-card/60'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`
                }
                title={isCollapsed ? item.name : undefined}
              >
                {({ isActive }) => (
                  <>
                    {/* Active glowing indicator pill */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyber-accent rounded-r-full shadow-glow-blue" />
                    )}

                    <Icon
                      size={18}
                      className={`shrink-0 transition-colors ${
                        isActive
                          ? 'text-cyber-accent'
                          : 'text-cyber-muted group-hover:text-cyber-text'
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.name}</span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Protection Engine Status Card at Bottom */}
        <div className="p-3 border-t border-cyber-border bg-cyber-bg/60">
          {!isCollapsed ? (
            <div className="p-3 rounded-xl bg-cyber-card border border-cyber-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-cyber-text flex items-center gap-1.5">
                  <Zap size={13} className="text-cyber-cyan" />
                  Security Engine
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    backendHealth.isOnline
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      backendHealth.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                    }`}
                  />
                  {backendHealth.isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              <div className="text-[10px] text-cyber-muted font-mono leading-tight">
                Model: <span className="text-cyber-text">Linear SVM</span>
              </div>

              <div className="text-[10px] text-cyber-dim flex items-center justify-between pt-1 border-t border-cyber-border/40">
                <span>FastAPI :8000</span>
                <span>{backendHealth.latency ? `${backendHealth.latency}ms` : '--'}</span>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-cyber-card border border-cyber-border text-center"
              title={`Engine: Linear SVM (${backendHealth.isOnline ? 'Online' : 'Offline'})`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full mb-1 ${
                  backendHealth.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                }`}
              />
              <span className="text-[9px] font-mono text-cyber-dim">SVM</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
