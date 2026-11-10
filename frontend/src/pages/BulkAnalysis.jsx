import { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  AlertCircle,
  Play,
  Square,
  Download,
  Eye,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { parseCsv, generateCsv, downloadFile } from '../utils/csvUtils';
import { predictMessage } from '../services/api';
import { useDetection } from '../context/DetectionContext';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import { formatScore, truncate } from '../utils/formatters';

export const BulkAnalysis = () => {
  const { addRecords, addToast, settings } = useDetection();

  const fileInputRef = useRef(null);
  const isCancelledRef = useRef(false);

  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState({ headers: [], rows: [] });
  const [selectedColumn, setSelectedColumn] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, errors: 0 });
  const [results, setResults] = useState([]);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'SPAM', 'HAM'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [inspectItem, setInspectItem] = useState(null);

  // File Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (fileObj) => {
    if (!fileObj.name.toLowerCase().endsWith('.csv')) {
      setParseError('Invalid file format. Please upload a .csv file.');
      return;
    }

    setParseError(null);
    setFile(fileObj);
    setResults([]);
    setProgress({ current: 0, total: 0, errors: 0 });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const { headers, rows } = parseCsv(text);

        if (headers.length === 0 || rows.length === 0) {
          setParseError('The uploaded CSV file is empty or corrupted.');
          return;
        }

        setCsvData({ headers, rows });

        // Auto-select text column if named 'message', 'text', 'sms', 'email', 'body', 'content'
        const candidate = headers.find((h) =>
          /message|text|sms|email|body|content|comment/i.test(h)
        );
        setSelectedColumn(candidate || headers[0]);
        addToast('success', `Loaded CSV with ${rows.length} rows and ${headers.length} columns.`);
      } catch (err) {
        setParseError(`Failed to parse CSV: ${err.message}`);
      }
    };
    reader.onerror = () => setParseError('Failed to read the file.');
    reader.readAsText(fileObj);
  };

  // Run Bulk Prediction using worker queue
  const handleStartAnalysis = async () => {
    if (!csvData.rows.length || !selectedColumn) return;

    setIsProcessing(true);
    isCancelledRef.current = false;
    const total = csvData.rows.length;
    setProgress({ current: 0, total, errors: 0 });

    const concurrency = settings.bulkConcurrency || 3;
    const rows = [...csvData.rows];
    const processedResults = [];
    let completedCount = 0;
    let errorCount = 0;
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < rows.length && !isCancelledRef.current) {
        const index = currentIndex++;
        const row = rows[index];
        const messageText = String(row[selectedColumn] || '').trim();

        if (!messageText) {
          processedResults[index] = {
            ...row,
            prediction: 'Skipped',
            label: -1,
            decision_score: 0,
            _status: 'Empty text',
          };
          completedCount++;
          setProgress({ current: completedCount, total, errors: errorCount });
          continue;
        }

        try {
          const res = await predictMessage(messageText);
          if (res.success && res.data) {
            processedResults[index] = {
              ...row,
              prediction: res.data.prediction,
              label: res.data.label,
              decision_score: res.data.decision_score,
              _status: 'Success',
              _analyzedText: messageText,
            };
          } else {
            errorCount++;
            processedResults[index] = {
              ...row,
              prediction: 'Error',
              label: -1,
              decision_score: 0,
              _status: res.error || 'Prediction failed',
              _analyzedText: messageText,
            };
          }
        } catch (err) {
          errorCount++;
          processedResults[index] = {
            ...row,
            prediction: 'Error',
            label: -1,
            decision_score: 0,
            _status: err.message,
            _analyzedText: messageText,
          };
        }

        completedCount++;
        setProgress({ current: completedCount, total, errors: errorCount });
      }
    };

    // Run parallel workers
    const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(workers);

    setIsProcessing(false);
    setResults(processedResults);

    // Save successful predictions into detection history
    const validDetections = processedResults
      .filter((r) => r.prediction === 'Spam' || r.prediction === 'Ham')
      .map((r) => ({
        message: r._analyzedText || r[selectedColumn],
        prediction: r.prediction,
        label: r.label,
        decision_score: r.decision_score,
        timestamp: new Date().toISOString(),
        source: 'bulk',
      }));

    if (validDetections.length > 0) {
      addRecords(validDetections);
      addToast('success', `Completed batch analysis. ${validDetections.length} records added to audit history.`);
    }
  };

  const handleStopAnalysis = () => {
    isCancelledRef.current = true;
    setIsProcessing(false);
    addToast('warning', 'Bulk analysis cancelled by user.');
  };

  // Export Results with prediction, label, decision_score
  const handleExportCsv = () => {
    if (results.length === 0) return;
    const baseHeaders = csvData.headers;
    const exportHeaders = [...baseHeaders, 'prediction', 'label', 'decision_score'];
    const csvString = generateCsv(results, exportHeaders);
    const filename = `analyzed_${file ? file.name : 'emailshield_results.csv'}`;
    downloadFile(csvString, filename);
    addToast('info', `Downloaded analyzed CSV as ${filename}`);
  };

  // Filtered & Paginated Results
  const filteredResults = results.filter((row) => {
    if (filterType === 'SPAM' && row.prediction !== 'Spam') return false;
    if (filterType === 'HAM' && row.prediction !== 'Ham') return false;
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    const text = String(row[selectedColumn] || '').toLowerCase();
    const pred = String(row.prediction || '').toLowerCase();
    return text.includes(term) || pred.includes(term);
  });

  const totalPages = Math.ceil(filteredResults.length / pageSize) || 1;
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Metrics from completed results
  const summary = results.reduce(
    (acc, row) => {
      if (row.prediction === 'Spam') acc.spam++;
      if (row.prediction === 'Ham') acc.ham++;
      if (row.prediction === 'Error') acc.errors++;
      return acc;
    },
    { spam: 0, ham: 0, errors: 0 }
  );
  const totalAnalyzed = summary.spam + summary.ham;
  const spamPercentage = totalAnalyzed > 0 ? (summary.spam / totalAnalyzed) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cyber-text">
            Bulk CSV Analysis
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyber-cyan text-[11px] font-mono font-medium">
            Sequential Stream
          </span>
        </div>
        <p className="text-xs sm:text-sm text-cyber-muted mt-1">
          Upload CSV spreadsheets of messages for concurrent security triage via the API.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center bg-cyber-card/60 ${
          isDragging
            ? 'border-cyber-accent bg-blue-500/10 scale-[1.01]'
            : 'border-cyber-border hover:border-cyber-accent/60 hover:bg-cyber-card'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-cyber-input border border-cyber-border flex items-center justify-center text-cyber-accent mb-3 shadow-sm">
          <FileSpreadsheet size={28} />
        </div>

        <h3 className="text-sm font-semibold text-cyber-text mb-1">
          {file ? file.name : 'Drag & Drop CSV File Here'}
        </h3>
        <p className="text-xs text-cyber-muted max-w-sm">
          {file
            ? `File size: ${(file.size / 1024).toFixed(1)} KB • Click or drop another to replace`
            : 'Supports standard CSV format with headers. Select your message text column after upload.'}
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="mt-4 px-4 py-2 rounded-xl bg-cyber-input hover:bg-cyber-cardHover text-cyber-text border border-cyber-border text-xs font-medium transition-colors"
        >
          Browse Files
        </button>
      </div>

      {parseError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{parseError}</span>
        </div>
      )}

      {/* Configuration & Column Selection Bar */}
      {csvData.rows.length > 0 && (
        <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs font-semibold text-cyber-text uppercase tracking-wider">
              Message Column:
            </span>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              disabled={isProcessing}
              className="bg-cyber-input border border-cyber-border text-cyber-text rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-cyber-accent"
            >
              {csvData.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="text-xs text-cyber-muted font-mono">
              ({csvData.rows.length} rows loaded)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isProcessing ? (
              <button
                type="button"
                onClick={handleStopAnalysis}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-glow-spam transition-all"
              >
                <Square size={13} fill="currentColor" />
                <span>Stop Analysis</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={!selectedColumn}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyber-accent hover:bg-blue-600 text-white text-xs font-semibold shadow-glow-blue transition-all disabled:opacity-50"
              >
                <Play size={13} fill="currentColor" />
                <span>Analyze {csvData.rows.length} Messages</span>
              </button>
            )}

            {results.length > 0 && !isProcessing && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyber-card hover:bg-cyber-cardHover text-cyber-text border border-cyber-border text-xs font-medium transition-colors"
              >
                <Download size={14} />
                <span>Export Analyzed CSV</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar while running */}
      {isProcessing && (
        <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cyber-text flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin text-cyber-accent" />
              Processing Messages ({progress.current} of {progress.total})
            </span>
            <span className="font-mono text-cyber-muted">
              {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
            </span>
          </div>

          <div className="w-full bg-cyber-input h-2.5 rounded-full overflow-hidden border border-cyber-border">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-150"
              style={{
                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-cyber-dim font-mono">
            <span>Concurrency: {settings.bulkConcurrency || 3} worker threads</span>
            {progress.errors > 0 && (
              <span className="text-red-400">{progress.errors} failures encountered</span>
            )}
          </div>
        </div>
      )}

      {/* Summary KPI Cards after batch analysis */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Messages Evaluated"
            value={totalAnalyzed.toLocaleString()}
            subtitle={`${results.length} total rows processed`}
            icon={FileSpreadsheet}
            color="blue"
          />
          <StatCard
            title="Spam Intercepted"
            value={summary.spam.toLocaleString()}
            subtitle={`${spamPercentage.toFixed(1)}% of batch`}
            icon={ShieldAlert}
            color="red"
          />
          <StatCard
            title="Safe / Ham Verified"
            value={summary.ham.toLocaleString()}
            subtitle={`${(100 - spamPercentage).toFixed(1)}% legitimate`}
            icon={ShieldCheck}
            color="green"
          />
          <StatCard
            title="Spam Ratio"
            value={`${spamPercentage.toFixed(1)}%`}
            subtitle={summary.errors > 0 ? `${summary.errors} errors` : 'Zero errors'}
            icon={AlertCircle}
            color="cyan"
          />
        </div>
      )}

      {/* Results Table / Preview */}
      {csvData.rows.length > 0 && (
        <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
          {/* Controls: Search & Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-cyber-border">
            <div className="flex items-center gap-1 bg-cyber-input p-1 rounded-lg border border-cyber-border">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filterType === 'ALL'
                    ? 'bg-cyber-accent text-white shadow-sm'
                    : 'text-cyber-muted hover:text-white'
                }`}
              >
                All ({results.length > 0 ? results.length : csvData.rows.length})
              </button>
              {results.length > 0 && (
                <>
                  <button
                    onClick={() => setFilterType('SPAM')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      filterType === 'SPAM'
                        ? 'bg-cyber-spam text-white shadow-sm'
                        : 'text-cyber-muted hover:text-white'
                    }`}
                  >
                    Spam ({summary.spam})
                  </button>
                  <button
                    onClick={() => setFilterType('HAM')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      filterType === 'HAM'
                        ? 'bg-cyber-safe text-white shadow-sm'
                        : 'text-cyber-muted hover:text-white'
                    }`}
                  >
                    Safe ({summary.ham})
                  </button>
                </>
              )}
            </div>

            <div className="relative max-w-xs w-full">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search messages in batch..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-cyber-input border border-cyber-border text-xs text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-accent"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-cyber-border bg-cyber-input/60 text-cyber-muted font-medium uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-16">#</th>
                  {results.length > 0 && <th className="py-2.5 px-3">Verdict</th>}
                  {results.length > 0 && <th className="py-2.5 px-3">Decision Score</th>}
                  <th className="py-2.5 px-3">Message Text ({selectedColumn})</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/50">
                {(results.length > 0 ? paginatedResults : csvData.rows.slice(0, 10)).map(
                  (row, idx) => {
                    const rowNumber =
                      results.length > 0 ? (currentPage - 1) * pageSize + idx + 1 : idx + 1;
                    const messageText = row[selectedColumn] || '';

                    return (
                      <tr key={idx} className="hover:bg-cyber-cardHover/40 transition-colors">
                        <td className="py-3 px-3 font-mono text-cyber-dim">{rowNumber}</td>
                        {results.length > 0 && (
                          <td className="py-3 px-3 whitespace-nowrap">
                            <StatusBadge status={row.prediction} size="sm" />
                          </td>
                        )}
                        {results.length > 0 && (
                          <td className="py-3 px-3 whitespace-nowrap">
                            {row.prediction !== 'Error' && row.prediction !== 'Skipped' ? (
                              <span
                                className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                                  row.decision_score > 0
                                    ? 'text-red-400 bg-red-500/10'
                                    : 'text-emerald-400 bg-emerald-500/10'
                                }`}
                              >
                                {formatScore(row.decision_score)}
                              </span>
                            ) : (
                              <span className="text-cyber-dim text-[11px] font-mono">--</span>
                            )}
                          </td>
                        )}
                        <td className="py-3 px-3 font-mono text-cyber-text max-w-md">
                          <span className="truncate block" title={messageText}>
                            {truncate(messageText, 80)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setInspectItem(row)}
                            className="p-1 rounded bg-cyber-input hover:bg-cyber-cardHover text-cyber-muted hover:text-white transition-colors"
                            title="Inspect Row Details"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {results.length > pageSize && (
            <div className="flex items-center justify-between text-xs text-cyber-muted pt-3 border-t border-cyber-border/60">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredResults.length)} of{' '}
                {filteredResults.length} rows
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded bg-cyber-input border border-cyber-border disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="font-mono text-cyber-text">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded bg-cyber-input border border-cyber-border disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row Inspection Modal */}
      {inspectItem && (
        <Modal
          isOpen={!!inspectItem}
          onClose={() => setInspectItem(null)}
          title="Row Inspection"
          subtitle={file ? file.name : 'Bulk CSV Record'}
          footer={
            <button
              onClick={() => setInspectItem(null)}
              className="px-4 py-2 rounded-lg bg-cyber-cardHover text-xs text-cyber-text border border-cyber-border"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4 text-xs">
            {inspectItem.prediction && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-cyber-input border border-cyber-border">
                <div>
                  <span className="text-[10px] text-cyber-dim uppercase">Classification</span>
                  <StatusBadge status={inspectItem.prediction} size="md" className="mt-1" />
                </div>
                <div>
                  <span className="text-[10px] text-cyber-dim uppercase">Decision Score</span>
                  <span
                    className={`text-sm font-bold font-mono ${
                      inspectItem.decision_score > 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatScore(inspectItem.decision_score)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-cyber-dim uppercase">Status</span>
                  <span className="text-cyber-muted font-mono mt-1 block">
                    {inspectItem._status || 'Ready'}
                  </span>
                </div>
              </div>
            )}

            <div>
              <span className="text-[10px] text-cyber-dim uppercase font-semibold block mb-1">
                Selected Message Text ({selectedColumn})
              </span>
              <div className="p-3 rounded-xl bg-cyber-input border border-cyber-border text-cyber-text font-mono text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                {inspectItem[selectedColumn]}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-cyber-dim uppercase font-semibold block mb-1">
                All Row Attributes
              </span>
              <div className="p-3 rounded-xl bg-cyber-input/60 border border-cyber-border space-y-1.5 font-mono text-[11px] max-h-40 overflow-y-auto">
                {Object.entries(inspectItem)
                  .filter(([k]) => !k.startsWith('_'))
                  .map(([key, val]) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className="text-cyber-muted">{key}:</span>
                      <span className="text-cyber-text break-all">{String(val)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BulkAnalysis;
