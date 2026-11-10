import { ShieldAlert, ShieldCheck, Clock } from 'lucide-react';

export const StatusBadge = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const isSpam =
    status === 'Spam' ||
    status === 1 ||
    status === 'spam' ||
    status === 'danger' ||
    status === 'critical';

  const isHam =
    status === 'Ham' ||
    status === 0 ||
    status === 'ham' ||
    status === 'safe' ||
    status === 'legitimate' ||
    status === 'Legitimate';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  if (isSpam) {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-cyber-spamBg border border-cyber-spamBorder text-cyber-spam shadow-sm ${sizeClasses[size]} ${className}`}
      >
        {showIcon && <ShieldAlert size={iconSizes[size]} className="text-cyber-spam shrink-0" />}
        <span>SPAM</span>
      </span>
    );
  }

  if (isHam) {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-cyber-safeBg border border-cyber-safeBorder text-cyber-safe shadow-sm ${sizeClasses[size]} ${className}`}
      >
        {showIcon && <ShieldCheck size={iconSizes[size]} className="text-cyber-safe shrink-0" />}
        <span>SAFE / HAM</span>
      </span>
    );
  }

  // Fallback / pending / neutral
  return (
    <span
      className={`inline-flex items-center rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Clock size={iconSizes[size]} className="text-slate-400 shrink-0" />}
      <span>{status || 'Unknown'}</span>
    </span>
  );
};

export default StatusBadge;
