import { useState } from 'react';
import {
  Server,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  Trash2,
  Sliders,
  Info,
  Zap,
} from 'lucide-react';
import { useDetection } from '../context/DetectionContext';
import { getApiBaseUrl, setApiBaseUrl, checkHealth } from '../services/api';
import { downloadFile } from '../utils/csvUtils';
import Modal from '../components/Modal';

export const Settings = () => {
  const {
    history,
    clearHistory,
    loadEvaluationSamples,
    settings,
    updateSettings,
    addToast,
    backendHealth,
    refreshHealth,
  } = useDetection();

  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [testingHealth, setTestingHealth] = useState(false);
  const [healthResult, setHealthResult] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Storage size calculation
  const storageUsageBytes = (() => {
    try {
      const raw = localStorage.getItem('emailshield_detection_history') || '';
      return new Blob([raw]).size;
    } catch {
      return 0;
    }
  })();
  const storageKb = (storageUsageBytes / 1024).toFixed(2);

  // Test API Connection directly
  const handleTestConnection = async () => {
    setTestingHealth(true);
    setHealthResult(null);

    try {
      const res = await checkHealth();
      setHealthResult(res);
      await refreshHealth();

      if (res.success) {
        addToast('success', `API connection verified! Latency: ${res.latency}ms`);
      } else {
        addToast('error', `API connection failed: ${res.error}`);
      }
    } catch (err) {
      setHealthResult({
        success: false,
        error: err.message,
        latency: 0,
      });
      addToast('error', `Connection error: ${err.message}`);
    } finally {
      setTestingHealth(false);
    }
  };

  const handleSaveApiUrl = () => {
    setApiBaseUrl(apiUrl);
    addToast('success', `API Base URL updated to ${getApiBaseUrl()}`);
    handleTestConnection();
  };

  const handleResetApiUrl = () => {
    setApiBaseUrl('');
    setApiUrl('http://127.0.0.1:8000');
    addToast('info', 'Reset API Base URL to default (http://127.0.0.1:8000)');
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      platform: 'EmailShield Security Platform',
      version: '1.0.0',
      totalRecords: history.length,
      history,
    };
    const content = JSON.stringify(backupData, null, 2);
    downloadFile(content, `emailshield_backup_${Date.now()}.json`, 'application/json');
    addToast('success', `Exported full backup (${history.length} records).`);
  };

  // Import JSON Backup
  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const importedList = Array.isArray(parsed) ? parsed : parsed.history;
        if (!Array.isArray(importedList)) {
          throw new Error('Invalid JSON structure. Expected history array.');
        }

        localStorage.setItem('emailshield_detection_history', JSON.stringify(importedList));
        window.location.reload();
      } catch (err) {
        addToast('error', `Failed to restore backup: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="pb-2 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cyber-text">
            Platform Settings & Diagnostics
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyber-accent text-[11px] font-mono font-medium">
            System Config
          </span>
        </div>
        <p className="text-xs sm:text-sm text-cyber-muted mt-1">
          Configure API endpoints, inspect backend health diagnostics, and manage browser audit telemetry.
        </p>
      </div>

      {/* 1. API Connection & Health Testing */}
      <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-cyber-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-text">
              FastAPI Backend Connection
            </h3>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-full ${
              backendHealth.isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendHealth.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            {backendHealth.isOnline ? `Online (${backendHealth.latency}ms)` : 'Offline'}
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-cyber-dim uppercase text-[10px] font-semibold block mb-1">
              Backend Endpoint URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                className="flex-1 px-3 py-2 rounded-lg bg-cyber-input border border-cyber-border text-xs text-cyber-text font-mono focus:outline-none focus:border-cyber-accent"
              />
              <button
                type="button"
                onClick={handleSaveApiUrl}
                className="px-3.5 py-2 rounded-lg bg-cyber-accent hover:bg-blue-600 text-white font-medium transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleResetApiUrl}
                className="px-3.5 py-2 rounded-lg bg-cyber-input hover:bg-cyber-cardHover text-cyber-muted hover:text-white border border-cyber-border transition-colors"
              >
                Reset Default
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingHealth}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-cyber-accent border border-cyber-accent/40 font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={testingHealth ? 'animate-spin' : ''} />
              <span>Test API Connection (GET /api/health)</span>
            </button>
          </div>

          {/* Test Health Result Box */}
          {healthResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 mt-3 animate-in fade-in ${
                healthResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {healthResult.success ? (
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  ) : (
                    <AlertTriangle size={15} className="text-red-400" />
                  )}
                  {healthResult.success ? 'HTTP 200 OK — Backend Operational' : 'Connection Failure'}
                </span>
                <span>Latency: {healthResult.latency} ms</span>
              </div>
              <div className="p-2 rounded bg-black/40 text-[11px] overflow-x-auto text-cyber-text">
                {JSON.stringify(healthResult.data || { error: healthResult.error }, null, 2)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Audit History Storage Management */}
      <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-cyber-cyan" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-text">
              Local Audit Storage Telemetry
            </h3>
          </div>
          <span className="text-xs font-mono text-cyber-muted">
            {history.length} records stored ({storageKb} KB)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-cyber-input border border-cyber-border">
            <span className="text-[10px] text-cyber-dim uppercase block">Persisted Records</span>
            <span className="text-lg font-bold font-mono text-cyber-text mt-0.5 block">
              {history.length}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-cyber-input border border-cyber-border">
            <span className="text-[10px] text-cyber-dim uppercase block">Storage Space</span>
            <span className="text-lg font-bold font-mono text-cyber-text mt-0.5 block">
              {storageKb} KB
            </span>
          </div>
          <div className="p-3 rounded-lg bg-cyber-input border border-cyber-border">
            <span className="text-[10px] text-cyber-dim uppercase block">Storage Mechanism</span>
            <span className="text-xs font-mono text-cyber-cyan mt-1 block">
              localStorage (browser)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyber-input hover:bg-cyber-cardHover text-cyber-text border border-cyber-border text-xs font-medium transition-colors disabled:opacity-40"
          >
            <Download size={13} />
            <span>Backup History (JSON)</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyber-input hover:bg-cyber-cardHover text-cyber-text border border-cyber-border text-xs font-medium transition-colors cursor-pointer">
            <Upload size={13} />
            <span>Restore Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={loadEvaluationSamples}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyber-card hover:bg-cyber-cardHover text-cyber-accent border border-cyber-border text-xs font-medium transition-colors"
          >
            <Zap size={13} />
            <span>Load Sample Evaluation Set</span>
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium transition-colors disabled:opacity-40 ml-auto"
          >
            <Trash2 size={13} />
            <span>Purge All History</span>
          </button>
        </div>
      </div>

      {/* 3. Machine Learning Architecture Metadata */}
      <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-cyber-border">
          <Cpu size={18} className="text-cyber-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-text">
            Active Machine Learning Engine Specifications
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-cyber-input border border-cyber-border space-y-1">
            <span className="text-[10px] text-cyber-dim uppercase font-semibold">Trained Model Artifact</span>
            <p className="font-mono text-cyber-text">Linear Support Vector Classifier (LinearSVC)</p>
            <p className="text-[11px] text-cyber-muted font-mono">backend/model/best_model.joblib</p>
          </div>

          <div className="p-3 rounded-xl bg-cyber-input border border-cyber-border space-y-1">
            <span className="text-[10px] text-cyber-dim uppercase font-semibold">Feature Extractor</span>
            <p className="font-mono text-cyber-text">TfidfVectorizer (Word N-Grams)</p>
            <p className="text-[11px] text-cyber-muted font-mono">Vocabulary & IDF weight matrix</p>
          </div>

          <div className="p-3 rounded-xl bg-cyber-input border border-cyber-border space-y-1">
            <span className="text-[10px] text-cyber-dim uppercase font-semibold">Inference Function</span>
            <p className="font-mono text-cyber-text">model.decision_function([message])</p>
            <p className="text-[11px] text-cyber-muted">Algebraic hyperplane distance $w \cdot x + b$</p>
          </div>

          <div className="p-3 rounded-xl bg-cyber-input border border-cyber-border space-y-1">
            <span className="text-[10px] text-cyber-dim uppercase font-semibold">Dataset Lineage</span>
            <p className="font-mono text-cyber-text">UCI SMS Spam Collection (5,572 records)</p>
            <p className="text-[11px] text-amber-400/90">*Experimental text baseline</p>
          </div>
        </div>
      </div>

      {/* 4. Application Preferences */}
      <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-cyber-border">
          <Sliders size={18} className="text-cyber-cyan" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-text">
            Application Preferences
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-cyber-input border border-cyber-border">
            <div>
              <span className="font-semibold text-cyber-text block">
                Automatic Health Heartbeat
              </span>
              <span className="text-cyber-muted text-[11px]">
                Ping the FastAPI /api/health endpoint every 20 seconds
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoHealthCheck}
              onChange={(e) => updateSettings({ autoHealthCheck: e.target.checked })}
              className="w-4 h-4 rounded text-cyber-accent bg-cyber-card border-cyber-border focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-cyber-input border border-cyber-border">
            <div>
              <span className="font-semibold text-cyber-text block">
                Bulk Analysis Worker Concurrency
              </span>
              <span className="text-cyber-muted text-[11px]">
                Concurrent HTTP requests sent to single-message /api/predict (Default: 3)
              </span>
            </div>
            <select
              value={settings.bulkConcurrency || 3}
              onChange={(e) => updateSettings({ bulkConcurrency: Number(e.target.value) })}
              className="bg-cyber-card border border-cyber-border rounded px-3 py-1 text-xs text-cyber-text"
            >
              <option value={1}>1 (Sequential)</option>
              <option value={2}>2 Workers</option>
              <option value={3}>3 Workers (Recommended)</option>
              <option value={5}>5 Workers</option>
              <option value={8}>8 Workers</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. About EmailShield */}
      <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-3 shadow-sm text-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-cyber-border">
          <Info size={16} className="text-cyber-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-text">
            About EmailShield Platform
          </h3>
        </div>
        <p className="text-cyber-muted leading-relaxed">
          <strong>EmailShield</strong> is a specialized cybersecurity platform combining Scikit-Learn machine learning classifiers with an enterprise-grade SecOps dashboard to evaluate incoming messages, detect spam campaigns, and provide actionable threat remediation.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-cyber-dim font-mono text-[11px] pt-1 border-t border-cyber-border/40">
          <span>Engine: Python 3.12 + FastAPI</span>
          <span>UI: React 19 + Vite + TailwindCSS</span>
          <span>Version: 1.0.0</span>
          <span>License: MIT</span>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <Modal
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          title="Confirm History Purge"
          icon={AlertTriangle}
          footer={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-cyber-cardHover text-xs text-cyber-text border border-cyber-border"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-glow-spam"
              >
                Yes, Purge History
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-cyber-muted">
            <p>
              Are you sure you want to permanently clear all <strong className="text-white">{history.length} detection audit records</strong>?
            </p>
            <p className="text-red-400">
              This action cannot be undone. All telemetry on the Dashboard and Threat Analytics pages will be reset.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Settings;
