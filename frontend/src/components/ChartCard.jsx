export const ChartCard = ({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl bg-cyber-card border border-cyber-border p-5 flex flex-col transition-all duration-200 hover:border-cyber-borderLight ${className}`}
    >
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-cyber-border/60">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-cyber-input flex items-center justify-center text-cyber-accent border border-cyber-border/70">
              <Icon size={16} />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-cyber-text tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-cyber-muted mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>

      <div className="flex-1 w-full min-h-[240px] pt-2">{children}</div>
    </div>
  );
};

export default ChartCard;
