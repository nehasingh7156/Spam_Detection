import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  className = '',
}) => {
  const colorStyles = {
    blue: {
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      borderGlow: 'hover:border-blue-500/40',
      badge: 'text-blue-400 bg-blue-500/10',
    },
    cyan: {
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      borderGlow: 'hover:border-cyan-500/40',
      badge: 'text-cyan-400 bg-cyan-500/10',
    },
    red: {
      iconBg: 'bg-red-500/10 text-red-400 border-red-500/20',
      borderGlow: 'hover:border-red-500/40',
      badge: 'text-red-400 bg-red-500/10',
    },
    green: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      borderGlow: 'hover:border-emerald-500/40',
      badge: 'text-emerald-400 bg-emerald-500/10',
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      borderGlow: 'hover:border-amber-500/40',
      badge: 'text-amber-400 bg-amber-500/10',
    },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-cyber-card p-5 border border-cyber-border transition-all duration-300 hover:shadow-cyber-card ${style.borderGlow} ${className}`}
    >
      {/* Background glow accent */}
      <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-cyber-accent/5 blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-cyber-muted tracking-wide uppercase">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-cyber-text">
              {value}
            </span>
            {trend && (
              <span
                className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${style.badge}`}
              >
                {trend.direction === 'up' && <ArrowUpRight size={12} className="mr-0.5" />}
                {trend.direction === 'down' && <ArrowDownRight size={12} className="mr-0.5" />}
                {trend.label}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 transition-transform hover:scale-105 ${style.iconBg}`}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-3 pt-3 border-t border-cyber-border/60 flex items-center justify-between text-xs text-cyber-muted">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
