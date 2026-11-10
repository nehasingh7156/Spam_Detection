import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { checkHealth } from '../services/api';

const DetectionContext = createContext(null);

const STORAGE_KEY = 'emailshield_detection_history';
const SETTINGS_KEY = 'emailshield_user_settings';

export const DetectionProvider = ({ children }) => {
  // Detection history - strictly loaded from localStorage or initialized empty (Rule 7)
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse detection history from localStorage:', e);
    }
    return [];
  });

  // User preferences
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return {
      autoHealthCheck: true,
      bulkConcurrency: 3,
      defaultPageSize: 10,
      soundAlerts: false,
    };
  });

  // Backend Health Telemetry
  const [backendHealth, setBackendHealth] = useState({
    isOnline: false,
    latency: 0,
    lastChecked: null,
    statusText: 'Connecting...',
    version: '1.0.0',
    model: 'Linear Support Vector Machine (LinearSVC)',
    isChecking: true,
  });

  // Notifications / Toasts queue
  const [notifications, setNotifications] = useState([]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save detection history:', e);
    }
  }, [history]);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  // Toast notifier helper
  const addToast = useCallback((type, message, title = '') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newToast = { id, type, message, title, timestamp: new Date() };
    setNotifications((prev) => [...prev, newToast]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setNotifications((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Backend Health Checker
  const refreshHealth = useCallback(async () => {
    setBackendHealth((prev) => ({ ...prev, isChecking: true }));
    try {
      const res = await checkHealth();
      if (res.success) {
        setBackendHealth({
          isOnline: true,
          latency: res.latency,
          lastChecked: new Date().toISOString(),
          statusText: 'Operational',
          version: '1.0.0',
          model: 'Linear Support Vector Machine (LinearSVC)',
          isChecking: false,
        });
      } else {
        setBackendHealth((prev) => ({
          ...prev,
          isOnline: false,
          latency: res.latency,
          lastChecked: new Date().toISOString(),
          statusText: 'Offline / Unreachable',
          isChecking: false,
        }));
      }
      return res;
    } catch (err) {
      setBackendHealth((prev) => ({
        ...prev,
        isOnline: false,
        lastChecked: new Date().toISOString(),
        statusText: 'Error',
        isChecking: false,
      }));
      return { success: false, error: err.message };
    }
  }, []);

  // Periodic health check on mount and interval using async fetch
  useEffect(() => {
    let isMounted = true;
    const runCheck = async () => {
      setBackendHealth((prev) => ({ ...prev, isChecking: true }));
      try {
        const res = await checkHealth();
        if (!isMounted) return;
        if (res.success) {
          setBackendHealth({
            isOnline: true,
            latency: res.latency,
            lastChecked: new Date().toISOString(),
            statusText: 'Operational',
            version: '1.0.0',
            model: 'Linear Support Vector Machine (LinearSVC)',
            isChecking: false,
          });
        } else {
          setBackendHealth((prev) => ({
            ...prev,
            isOnline: false,
            latency: res.latency,
            lastChecked: new Date().toISOString(),
            statusText: 'Offline / Unreachable',
            isChecking: false,
          }));
        }
      } catch {
        if (isMounted) {
          setBackendHealth((prev) => ({
            ...prev,
            isOnline: false,
            lastChecked: new Date().toISOString(),
            statusText: 'Error',
            isChecking: false,
          }));
        }
      }
    };

    runCheck();

    if (settings.autoHealthCheck) {
      const interval = setInterval(runCheck, 20000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [settings.autoHealthCheck]);

  // Add a single detection record
  const addRecord = useCallback((record) => {
    const formattedRecord = {
      id: record.id || `det_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      message: record.message,
      prediction: record.prediction, // 'Spam' or 'Ham'
      label: record.label !== undefined ? record.label : (record.prediction === 'Spam' ? 1 : 0),
      decision_score: typeof record.decision_score === 'number' ? record.decision_score : Number(record.decision_score || 0),
      timestamp: record.timestamp || new Date().toISOString(),
      source: record.source || 'manual',
    };

    setHistory((prev) => [formattedRecord, ...prev]);
    return formattedRecord;
  }, []);

  // Add multiple detection records (e.g. from bulk analysis)
  const addRecords = useCallback((newRecords) => {
    if (!Array.isArray(newRecords) || newRecords.length === 0) return;
    const formattedList = newRecords.map((record) => ({
      id: record.id || `det_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      message: record.message,
      prediction: record.prediction,
      label: record.label !== undefined ? record.label : (record.prediction === 'Spam' ? 1 : 0),
      decision_score: typeof record.decision_score === 'number' ? record.decision_score : Number(record.decision_score || 0),
      timestamp: record.timestamp || new Date().toISOString(),
      source: record.source || 'bulk',
    }));

    setHistory((prev) => [...formattedList, ...prev]);
  }, []);

  // Delete a specific record
  const deleteRecord = useCallback((id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    addToast('info', 'Detection record removed from history.');
  }, [addToast]);

  // Clear all detection history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    addToast('info', 'All detection history cleared.');
  }, [addToast]);

  // Update user preferences
  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Compute live KPI stats strictly from history
  const stats = useMemo(() => {
    const total = history.length;
    let spamCount = 0;
    let hamCount = 0;
    let totalSpamScore = 0;
    let totalHamScore = 0;

    history.forEach((item) => {
      if (item.prediction === 'Spam' || item.label === 1) {
        spamCount++;
        totalSpamScore += item.decision_score;
      } else {
        hamCount++;
        totalHamScore += item.decision_score;
      }
    });

    const detectionRate = total > 0 ? (spamCount / total) * 100 : 0;
    const avgSpamScore = spamCount > 0 ? (totalSpamScore / spamCount) : 0;
    const avgHamScore = hamCount > 0 ? (totalHamScore / hamCount) : 0;

    return {
      total,
      spamCount,
      hamCount,
      detectionRate,
      avgSpamScore,
      avgHamScore,
    };
  }, [history]);

  // Load sample evaluation dataset for verification if explicitly requested in Settings
  const loadEvaluationSamples = useCallback(() => {
    const samples = [
      {
        message: "WINNER!! As a valued network customer you have been selected to receivea £900 prize reward! To claim call 09061701461. Claim code KL341. Valid 12 hours only.",
        prediction: "Spam",
        label: 1,
        decision_score: 1.8421,
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        source: 'sample'
      },
      {
        message: "Hey! Are you still joining us for the team lunch at 12:30? Let me know so we can book the table.",
        prediction: "Ham",
        label: 0,
        decision_score: -1.2154,
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        source: 'sample'
      },
      {
        message: "URGENT! Your Mobile number has been awarded with a £2000 prize. Call 09066532112 from landline. Claim code 4115. Valid 12hrs only.",
        prediction: "Spam",
        label: 1,
        decision_score: 2.1034,
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        source: 'sample'
      },
      {
        message: "Can you review the pull request on the repository when you have a moment? No rush at all.",
        prediction: "Ham",
        label: 0,
        decision_score: -0.9842,
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        source: 'sample'
      },
      {
        message: "FREE entry in 2 a weekly competition to win FA Cup final tkts 21st May 2005. Text FA to 87121 to receive entry question(std txt rate)T&C's apply",
        prediction: "Spam",
        label: 1,
        decision_score: 1.6241,
        timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        source: 'sample'
      },
      {
        message: "Sounds great, see you at the office tomorrow morning.",
        prediction: "Ham",
        label: 0,
        decision_score: -1.4590,
        timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
        source: 'sample'
      }
    ];
    setHistory(samples);
    addToast('success', 'Sample evaluation records loaded for demonstration.');
  }, [addToast]);

  const value = {
    history,
    stats,
    backendHealth,
    settings,
    notifications,
    addRecord,
    addRecords,
    deleteRecord,
    clearHistory,
    updateSettings,
    refreshHealth,
    addToast,
    removeToast,
    loadEvaluationSamples,
  };

  return (
    <DetectionContext.Provider value={value}>
      {children}
    </DetectionContext.Provider>
  );
};

/* eslint-disable-next-line react-refresh/only-export-components */
export { useDetection } from '../hooks/useDetection';

export default DetectionContext;
