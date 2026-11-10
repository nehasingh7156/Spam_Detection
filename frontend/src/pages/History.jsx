import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Download,
  Trash2,
  Eye,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import { useDetection } from '../context/DetectionContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { generateCsv, downloadFile } from '../utils/csvUtils';
import { formatScore, formatTimestamp, truncate } from '../utils/formatters';

export const History = () => {
  const [searchParams] = useSearchParams();
  const { history, deleteRecord, clearHistory, addToast, loadEvaluationSamples } = useDetection();

  // Search & Filter state - initialize searchTerm from URL query parameter directly
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'SPAM', 'HAM'
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc', 'date_asc', 'score_desc', 'score_asc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filtered dataset
  const filteredList = useMemo(() => {
    return history.filter((item) => {
      if (filterType === 'SPAM' && item.prediction !== 'Spam' && item.label !== 1) return false;
      if (filterType === 'HAM' && item.prediction !== 'Ham' && item.label !== 0) return false;
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const msg = (item.message || '').toLowerCase();
      const pred = (item.prediction || '').toLowerCase();
      const id = (item.id || '').toLowerCase();
      return msg.includes(term) || pred.includes(term) || id.includes(term);
    });
  }, [history, filterType, searchTerm]);

  // Sorted dataset
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      }
      if (sortBy === 'date_asc') {
        return new Date(a.timestamp) - new Date(b.timestamp);
      }
      if (sortBy === 'score_desc') {
        return Number(b.decision_score) - Number(a.decision_score);
      }
      if (sortBy === 'score_asc') {
        return Number(a.decision_score) - Number(b.decision_score);
      }
      return 0;
    });
  }, [filteredList, sortBy]);

  // Paginated dataset
  const totalPages = Math.ceil(sortedList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, currentPage, pageSize]);

  // Export Audit History to CSV
  const handleExportCsv = () => {
    if (history.length === 0) return;
    const columns = ['id', 'message', 'prediction', 'label', 'decision_score', 'timestamp', 'source'];
    const csvContent = generateCsv(history, columns);
    const filename = `emailshield_audit_history_${Date.now()}.csv`;
    downloadFile(csvContent, filename);
    addToast('info', `Exported ${history.length} records to ${filename}`);
  };

  const handleConfirmClear = () => {
    clearHistory();
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cyber-text">
              Detection Audit Log
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyber-accent text-[11px] font-mono font-medium">
              {history.length} Events Persisted
            </span>
          </div>
          <p className="text-xs sm:text-sm text-cyber-muted mt-1">
            Complete audit trail of all messages evaluated by the Linear SVM classifier.
          </p>
        </div>

        {/* Action Buttons: Export & Clear */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyber-card hover:bg-cyber-cardHover text-cyber-text border border-cyber-border text-xs font-medium transition-colors disabled:opacity-40"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium transition-colors disabled:opacity-40"
          >
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
        {/* Search, Filter, Sort Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-cyber-border">
          {/* Left: Filter Buttons */}
          <div className="flex items-center gap-1 bg-cyber-input p-1 rounded-xl border border-cyber-border text-xs">
            <button
              onClick={() => {
                setFilterType('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterType === 'ALL'
                  ? 'bg-cyber-accent text-white shadow-sm'
                  : 'text-cyber-muted hover:text-white'
              }`}
            >
              All Events ({history.length})
            </button>
            <button
              onClick={() => {
                setFilterType('SPAM');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterType === 'SPAM'
                  ? 'bg-cyber-spam text-white shadow-sm'
                  : 'text-cyber-muted hover:text-white'
              }`}
            >
              Spam ({history.filter((i) => i.prediction === 'Spam').length})
            </button>
            <button
              onClick={() => {
                setFilterType('HAM');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterType === 'HAM'
                  ? 'bg-cyber-safe text-white shadow-sm'
                  : 'text-cyber-muted hover:text-white'
              }`}
            >
              Safe ({history.filter((i) => i.prediction === 'Ham').length})
            </button>
          </div>

          {/* Right: Search & Sort dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
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
                placeholder="Search message text or ID..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-cyber-input border border-cyber-border text-xs text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-accent"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-cyber-muted">
              <ArrowUpDown size={13} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-cyber-input border border-cyber-border rounded-lg px-2.5 py-1.5 text-xs text-cyber-text focus:outline-none focus:border-cyber-accent"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="score_desc">Highest Score</option>
                <option value="score_asc">Lowest Score</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-cyber-muted">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-cyber-input border border-cyber-border rounded-lg px-2 py-1.5 text-xs text-cyber-text focus:outline-none focus:border-cyber-accent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {sortedList.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-cyber-border bg-cyber-input/60 text-cyber-muted font-medium uppercase tracking-wider">
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3">Label</th>
                    <th className="py-2.5 px-3">Decision Score</th>
                    <th className="py-2.5 px-3">Message Preview</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/40">
                  {paginatedList.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-cyber-cardHover/40 transition-colors group"
                    >
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={item.prediction} size="sm" />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-cyber-dim">
                        {item.label}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                            item.decision_score > 0
                              ? 'text-red-400 bg-red-500/10'
                              : 'text-emerald-400 bg-emerald-500/10'
                          }`}
                        >
                          {formatScore(item.decision_score)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-cyber-text max-w-sm sm:max-w-md">
                        <span className="truncate block" title={item.message}>
                          {truncate(item.message, 70)}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-cyber-muted text-[11px]">
                        {formatTimestamp(item.timestamp)}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-1 rounded bg-cyber-input hover:bg-cyber-cardHover text-cyber-muted hover:text-white transition-colors"
                            title="Inspect Details"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => deleteRecord(item.id)}
                            className="p-1 rounded bg-cyber-input hover:bg-red-500/20 text-cyber-muted hover:text-red-400 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cyber-muted pt-3 border-t border-cyber-border/60">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, sortedList.length)} of {sortedList.length} events
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded bg-cyber-input border border-cyber-border disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="font-mono text-cyber-text px-2">
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
          </>
        ) : (
          <div className="py-12">
            <EmptyState
              title={searchTerm ? 'No Matching Events' : 'No Detection History'}
              description={
                searchTerm
                  ? `No logs match "${searchTerm}". Try adjusting your search query or filter.`
                  : 'Your audit log is empty. Scanned messages will automatically appear here with their SVM hyperplane decision scores.'
              }
              actionText={searchTerm ? 'Clear Search' : 'Run First Scan'}
              actionLink={searchTerm ? undefined : '/detector'}
              onAction={searchTerm ? () => setSearchTerm('') : undefined}
              secondaryActionText={history.length === 0 ? 'Load Sample Data' : undefined}
              onSecondaryAction={history.length === 0 ? loadEvaluationSamples : undefined}
            />
          </div>
        )}
      </div>

      {/* Message Inspection Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title="Audit Log Detail"
          subtitle={`Event ID: ${selectedItem.id}`}
          icon={selectedItem.prediction === 'Spam' ? ShieldAlert : ShieldCheck}
          footer={
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  deleteRecord(selectedItem.id);
                  setSelectedItem(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium"
              >
                Delete Record
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 rounded-lg bg-cyber-cardHover hover:bg-cyber-cardActive text-xs text-cyber-text border border-cyber-border"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-cyber-input border border-cyber-border">
              <div>
                <span className="text-[10px] text-cyber-dim uppercase">Classification</span>
                <StatusBadge status={selectedItem.prediction} size="md" className="mt-1" />
              </div>
              <div>
                <span className="text-[10px] text-cyber-dim uppercase">Decision Score</span>
                <span
                  className={`text-base font-bold font-mono mt-1 block ${
                    selectedItem.decision_score > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {formatScore(selectedItem.decision_score)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-cyber-dim uppercase">Logged At</span>
                <span className="text-cyber-muted font-mono mt-1 block">
                  {formatTimestamp(selectedItem.timestamp)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-cyber-dim uppercase font-semibold block mb-1">
                Full Message Payload
              </span>
              <div className="p-3.5 rounded-xl bg-cyber-input border border-cyber-border text-cyber-text font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto select-all">
                {selectedItem.message}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyber-cardHover border border-cyber-border text-cyber-muted text-xs">
              <span className="text-cyber-text font-semibold block mb-0.5">Evaluation Source:</span>
              Origin: <span className="font-mono text-cyber-accent uppercase">{selectedItem.source || 'manual'}</span> • Classified by <span className="text-cyber-text">Linear Support Vector Machine</span>
            </div>
          </div>
        </Modal>
      )}

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
                onClick={handleConfirmClear}
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

export default History;
