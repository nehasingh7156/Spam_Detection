import { Shield } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', label = 'Processing...' }) => {
  const sizeMap = {
    sm: { box: 'w-6 h-6', border: 'border-2', icon: 12 },
    md: { box: 'w-12 h-12', border: 'border-3', icon: 20 },
    lg: { box: 'w-16 h-16', border: 'border-4', icon: 28 },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div
          className={`${current.box} rounded-full border-t-cyber-accent border-r-cyber-cyan border-b-transparent border-l-transparent animate-spin`}
          style={{ borderWidth: size === 'sm' ? '2px' : '3px' }}
        />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center text-cyber-accent animate-pulse">
          <Shield size={current.icon} />
        </div>
      </div>
      {label && (
        <span className="text-xs font-mono tracking-wider text-cyber-muted animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
