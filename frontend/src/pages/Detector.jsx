import { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  RotateCcw,
  Clipboard,
  Copy,
  Download,
  AlertTriangle,
  Lock,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { predictMessage } from '../services/api';
import { useDetection } from '../context/DetectionContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { formatScore, getTextStats } from '../utils/formatters';
import { downloadFile } from '../utils/csvUtils';

const SAMPLE_MESSAGES = [
  {
    type: 'spam',
    label: 'Prize Lottery Scam',
    text: 'CONGRATULATIONS! You have won a £1,000 Walmart Gift Card. Click here to claim your reward immediately or call 0800-999-777. Offer expires in 2 hours!',
  },
  {
    type: 'spam',
    label: 'Urgent Account Suspension',
    text: 'URGENT: Your bank account has been suspended due to unauthorized login attempts. Verify your identity now by texting VERIFY to 88410 or account will be closed.',
  },
  {
    type: 'ham',
    label: 'Team Meeting (Ham)',
    text: 'Hi Sarah, are we still meeting in conference room B at 2 PM to go over the quarterly security review? Let me know if you need to reschedule.',
  },
  {
    type: 'ham',
    label: 'Flight Confirmation (Ham)',
    text: 'Your flight reservation #AA-9482 has been confirmed for Friday, Nov 14 departing at 08:30 AM from Terminal 3. Check-in online 24 hours prior to departure.',
  },
];

export const Detector = () => {
  const { addRecord, addToast, history } = useDetection();

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const stats = getTextStats(message);

  const handleClear = () => {
    setMessage('');
    setError(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setMessage(text);
        addToast('info', 'Pasted text from clipboard');
      }
    } catch {
      addToast('warning', 'Clipboard access denied. Please paste manually using Ctrl+V.');
    }
  };

  const handleSelectSample = (sample) => {
    setMessage(sample.text);
    setError(null);
    setResult(null);
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim()) {
      setError('Please provide a message or email text to classify.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      const response = await predictMessage(message);

      if (response.success && response.data) {
        const data = response.data;
        setResult(data);

        // Store in global detection history
        addRecord({
          message: data.message,
          prediction: data.prediction,
          label: data.label,
          decision_score: data.decision_score,
          timestamp: new Date().toISOString(),
          source: 'manual',
        });

        if (data.prediction === 'Spam') {
          addToast('error', 'Threat intercepted: Spam detected by Linear SVM.', 'Security Alert');
        } else {
          addToast('success', 'Message verified as legitimate / safe.', 'Scan Clean');
        }
      } else {
        setError(response.error || 'Failed to analyze message. Ensure the backend is reachable.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during prediction.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    const summary = `EmailShield Security Report
Classification: ${result.prediction.toUpperCase()}
Label: ${result.label}
Decision Score: ${result.decision_score}
Message: ${result.message}
Timestamp: ${new Date().toISOString()}`;

    navigator.clipboard.writeText(summary);
    addToast('success', 'Security evaluation copied to clipboard');
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const content = `=====================================================
EMAILSHIELD - AI MESSAGE SECURITY REPORT
=====================================================
Classification : ${result.prediction.toUpperCase()}
Numeric Label  : ${result.label}
Decision Score : ${result.decision_score}
Model Engine   : Linear Support Vector Machine (LinearSVC)
Evaluated At   : ${new Date().toLocaleString()}

-----------------------------------------------------
ORIGINAL MESSAGE PAYLOAD:
-----------------------------------------------------
${result.message}

-----------------------------------------------------
SVM HYPERPLANE ANALYSIS:
-----------------------------------------------------
Decision Score indicates the signed distance of the feature
vector to the separating hyperplane:
- Score > 0  : Classified as SPAM
- Score <= 0 : Classified as HAM (Legitimate)
* Note: Decision score is an algebraic metric, not a probability.

-----------------------------------------------------
RECOMMENDED ACTIONS:
-----------------------------------------------------
${
  result.prediction === 'Spam'
    ? `[!] High Threat Alert: Do not click hyperlinks or download attachments.\n[!] Do not reply or provide credentials or MFA tokens.\n[!] Quarantine or delete message and submit to SOC administrator.`
    : `[✓] Message appears clean and legitimate.\n[✓] Standard operational safety practices still apply.`
}
=====================================================
`;
    const filename = `emailshield_scan_${Date.now()}.txt`;
    downloadFile(content, filename, 'text/plain;charset=utf-8;');
    addToast('info', `Report saved as ${filename}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cyber-text">
            AI Message Analyzer
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyber-cyan text-[11px] font-mono font-medium">
            FastAPI • LinearSVC
          </span>
        </div>
        <p className="text-xs sm:text-sm text-cyber-muted mt-1">
          Analyze suspicious messages using the EmailShield machine learning engine.
        </p>
      </div>

      {/* Main Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Input & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 shadow-cyber-card">
            {/* Input Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border/70 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyber-text flex items-center gap-1.5">
                <Zap size={14} className="text-cyber-accent" />
                Message Input
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2.5 py-1 rounded bg-cyber-input hover:bg-cyber-cardHover text-[11px] text-cyber-muted hover:text-cyber-text border border-cyber-border transition-colors flex items-center gap-1"
                  title="Paste from Clipboard"
                >
                  <Clipboard size={12} />
                  <span>Paste</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!message}
                  className="px-2.5 py-1 rounded bg-cyber-input hover:bg-cyber-cardHover text-[11px] text-cyber-muted hover:text-cyber-text border border-cyber-border disabled:opacity-40 transition-colors flex items-center gap-1"
                  title="Clear text"
                >
                  <RotateCcw size={12} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Text Area */}
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (error) setError(null);
                }}
                rows={9}
                placeholder="Paste or type suspicious email, SMS, or notification content here to run security classification..."
                className="w-full p-3.5 rounded-xl bg-cyber-input border border-cyber-border text-cyber-text placeholder-cyber-muted font-mono text-xs leading-relaxed focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent transition-all resize-y"
              />
            </div>

            {/* Footer with Counters & Submit Button */}
            <div className="mt-3 pt-3 border-t border-cyber-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Counters */}
              <div className="flex items-center gap-4 text-xs font-mono text-cyber-muted">
                <span>
                  Words: <strong className="text-cyber-text">{stats.words}</strong>
                </span>
                <span>
                  Chars: <strong className="text-cyber-text">{stats.chars}</strong>
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading || !message.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyber-accent hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wide shadow-glow-blue transition-all"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" label="" />
                    <span>Evaluating Model...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} className="stroke-[2.5]" />
                    <span>Analyze Message</span>
                  </>
                )}
              </button>
            </div>

            {/* Validation / Error banner */}
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Classification Error</p>
                  <p className="text-[11px] text-red-300 mt-0.5">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Test Samples Bar */}
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles size={14} className="text-cyber-accent" />
              <span className="text-xs font-semibold text-cyber-text uppercase tracking-wider">
                Quick Test Samples
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_MESSAGES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`p-2.5 rounded-lg border text-left transition-all hover:border-cyber-accent flex items-start gap-2 ${
                    sample.type === 'spam'
                      ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                      : 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                  }`}
                >
                  {sample.type === 'spam' ? (
                    <ShieldAlert size={15} className="text-cyber-spam shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck size={15} className="text-cyber-safe shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-cyber-text truncate">
                      {sample.label}
                    </p>
                    <p className="text-[10px] text-cyber-muted truncate mt-0.5">
                      {sample.text}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Analysis Results (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 shadow-cyber-card min-h-[460px] flex flex-col justify-between">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16">
                <LoadingSpinner size="lg" label="RUNNING LINEAR SVM INFERENCE..." />
                <p className="text-xs text-cyber-muted text-center max-w-xs mt-2">
                  Vectorizing text features with TF-IDF and calculating hyperplane distance...
                </p>
              </div>
            ) : result ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Result Header Badge */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    result.prediction === 'Spam'
                      ? 'bg-cyber-spamBg border-cyber-spamBorder shadow-glow-spam'
                      : 'bg-cyber-safeBg border-cyber-safeBorder shadow-glow-safe'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        result.prediction === 'Spam'
                          ? 'bg-red-500/20 text-cyber-spam'
                          : 'bg-emerald-500/20 text-cyber-safe'
                      }`}
                    >
                      {result.prediction === 'Spam' ? (
                        <ShieldAlert size={28} className="stroke-[2.5]" />
                      ) : (
                        <ShieldCheck size={28} className="stroke-[2.5]" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyber-muted">
                        Classification Verdict
                      </span>
                      <h3
                        className={`text-lg font-bold tracking-tight ${
                          result.prediction === 'Spam' ? 'text-cyber-spam' : 'text-cyber-safe'
                        }`}
                      >
                        {result.prediction === 'Spam' ? 'SPAM DETECTED' : 'LEGITIMATE MESSAGE'}
                      </h3>
                    </div>
                  </div>

                  <StatusBadge status={result.prediction} size="md" />
                </div>

                {/* Decision Score Metric Card */}
                <div className="p-4 rounded-xl bg-cyber-input border border-cyber-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyber-text">
                      SVM Decision Score
                    </span>
                    <span
                      className={`font-mono text-base font-bold px-2.5 py-0.5 rounded border ${
                        result.decision_score > 0
                          ? 'text-red-400 bg-red-500/10 border-red-500/30'
                          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      }`}
                    >
                      {formatScore(result.decision_score)}
                    </span>
                  </div>

                  <p className="text-[11px] text-cyber-muted leading-relaxed">
                    {result.decision_score > 0 ? (
                      <>
                        <strong className="text-red-400">Positive Score ({formatScore(result.decision_score)}):</strong> The feature vector lies on the <strong>Spam</strong> side of the separating hyperplane ($w \cdot x + b &gt; 0$). Higher positive values indicate stronger spam lexical characteristics.
                      </>
                    ) : (
                      <>
                        <strong className="text-emerald-400">Negative Score ({formatScore(result.decision_score)}):</strong> The feature vector lies on the <strong>Legitimate / Ham</strong> side of the decision boundary ($w \cdot x + b \le 0$).
                      </>
                    )}
                  </p>

                  <div className="pt-2 border-t border-cyber-border/50 text-[10px] text-cyber-dim font-mono flex items-center gap-1.5">
                    <Info size={12} className="shrink-0 text-cyan-400" />
                    <span>
                      Linear SVM outputs an uncalibrated signed hyperplane distance, not a probability percentage.
                    </span>
                  </div>
                </div>

                {/* Recommended Safety Actions */}
                <div className="p-4 rounded-xl bg-cyber-input border border-cyber-border space-y-2.5">
                  <span className="text-xs font-semibold text-cyber-text flex items-center gap-1.5">
                    <Lock size={14} className="text-cyber-accent" />
                    Recommended Security Actions
                  </span>

                  {result.prediction === 'Spam' ? (
                    <ul className="space-y-1.5 text-xs text-cyber-muted">
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">•</span>
                        <span>Do not click any embedded links, URLs, or download attachments.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">•</span>
                        <span>Never disclose sensitive passwords, 2FA tokens, or financial info.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">•</span>
                        <span>Quarantine the sender domain and report to security administrator.</span>
                      </li>
                    </ul>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-cyber-muted">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Message appears legitimate; normal handling can proceed.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Always verify sender addresses if unexpected attachments are requested.</span>
                      </li>
                    </ul>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyResult}
                    className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyber-input hover:bg-cyber-cardHover text-xs text-cyber-text border border-cyber-border transition-colors font-medium"
                  >
                    <Copy size={13} />
                    <span>Copy Verdict</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyber-input hover:bg-cyber-cardHover text-xs text-cyber-text border border-cyber-border transition-colors font-medium"
                  >
                    <Download size={13} />
                    <span>Download TXT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMessage('');
                      setResult(null);
                    }}
                    className="px-3 py-2 rounded-lg bg-cyber-accent/10 hover:bg-cyber-accent/20 text-xs text-cyber-accent border border-cyber-accent/30 transition-colors font-medium"
                  >
                    New Scan
                  </button>
                </div>
              </div>
            ) : (
              /* Initial Empty State */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-cyber-input border border-cyber-border flex items-center justify-center text-cyber-accent mb-4 shadow-sm">
                  <ShieldAlert size={32} className="stroke-[1.5]" />
                </div>
                <h4 className="text-sm font-semibold text-cyber-text mb-1">
                  Awaiting Message Submission
                </h4>
                <p className="text-xs text-cyber-muted max-w-xs leading-relaxed mb-4">
                  Enter suspicious text or select one of the test samples on the left to evaluate it against the Linear SVM classifier.
                </p>
                <div className="p-3 rounded-lg bg-cyber-input/60 border border-cyber-border/70 text-[11px] text-cyber-dim max-w-xs font-mono">
                  Engine: FastAPI POST /api/predict
                </div>
              </div>
            )}
          </div>

          {/* Recent History Mini-Panel */}
          {history.length > 0 && (
            <div className="rounded-xl bg-cyber-card border border-cyber-border p-4">
              <div className="flex items-center justify-between pb-2 border-b border-cyber-border/70 mb-2.5">
                <span className="text-xs font-semibold text-cyber-text flex items-center gap-1.5">
                  <Clock size={13} className="text-cyber-cyan" />
                  Recent Scans
                </span>
                <span className="text-[10px] text-cyber-muted font-mono">
                  Last {Math.min(3, history.length)}
                </span>
              </div>

              <div className="space-y-2">
                {history.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setMessage(item.message);
                      setResult(item);
                    }}
                    className="p-2 rounded-lg bg-cyber-input hover:bg-cyber-cardHover border border-cyber-border/60 cursor-pointer transition-all flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-cyber-text font-mono truncate">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-cyber-dim font-mono">
                        Score: {formatScore(item.decision_score)}
                      </span>
                    </div>
                    <StatusBadge status={item.prediction} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Detector;
