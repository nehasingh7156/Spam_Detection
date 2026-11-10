import { Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmptyState = ({
  icon: Icon = Shield,
  title = 'No Data Available',
  description = 'No detection activity has been recorded yet.',
  actionText,
  actionLink,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-6 bg-cyber-card/40 rounded-xl border border-cyber-border/70 border-dashed">
      <div className="w-14 h-14 rounded-2xl bg-cyber-card flex items-center justify-center border border-cyber-border text-cyber-accent mb-4 shadow-cyber-card">
        <Icon size={28} className="text-cyber-accent" />
      </div>
      <h3 className="text-base font-semibold text-cyber-text mb-1.5">{title}</h3>
      <p className="text-xs text-cyber-muted leading-relaxed mb-5 max-w-xs">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {actionLink && actionText && (
          <Link
            to={actionLink}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyber-accent hover:bg-cyber-accent/90 text-white text-xs font-medium transition-all shadow-glow-blue"
          >
            <span>{actionText}</span>
            <ArrowRight size={14} />
          </Link>
        )}

        {onAction && actionText && !actionLink && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyber-accent hover:bg-cyber-accent/90 text-white text-xs font-medium transition-all shadow-glow-blue"
          >
            <span>{actionText}</span>
            <ArrowRight size={14} />
          </button>
        )}

        {secondaryActionText && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyber-cardHover hover:bg-cyber-cardActive text-cyber-text text-xs font-medium border border-cyber-border transition-colors"
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
