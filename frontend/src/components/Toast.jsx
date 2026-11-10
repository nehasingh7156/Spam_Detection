import { useDetection } from '../context/DetectionContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { notifications, removeToast } = useDetection();

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((toast) => {
        const typeStyles = {
          success: {
            bg: 'bg-cyber-card/95 border-emerald-500/40 text-cyber-text',
            icon: <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />,
          },
          error: {
            bg: 'bg-cyber-card/95 border-red-500/40 text-cyber-text',
            icon: <AlertCircle className="text-red-400 shrink-0" size={18} />,
          },
          warning: {
            bg: 'bg-cyber-card/95 border-amber-500/40 text-cyber-text',
            icon: <AlertTriangle className="text-amber-400 shrink-0" size={18} />,
          },
          info: {
            bg: 'bg-cyber-card/95 border-blue-500/40 text-cyber-text',
            icon: <Info className="text-blue-400 shrink-0" size={18} />,
          },
        };

        const currentStyle = typeStyles[toast.type] || typeStyles.info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 animate-in slide-in-from-right-5 ${currentStyle.bg}`}
          >
            {currentStyle.icon}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-xs font-semibold text-white mb-0.5">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs text-cyber-muted leading-relaxed break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-cyber-muted hover:text-white p-1 rounded-md transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
