/**
 * Format ISO timestamp to a readable date string
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return String(timestamp);
  }
};

/**
 * Format relative time (e.g., 2m ago, yesterday)
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatTimestamp(timestamp).split(',')[0];
};

/**
 * Format SVM Decision Score
 * Positive values prefixed with +, rounded to 4 decimals
 */
export const formatScore = (score) => {
  if (score === undefined || score === null || isNaN(score)) return '0.0000';
  const num = Number(score);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(4)}`;
};

/**
 * Truncate long string
 */
export const truncate = (str, maxLength = 80) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '...';
};

/**
 * Text statistics (character count, word count, line count)
 */
export const getTextStats = (text = '') => {
  const chars = text.length;
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
  return { chars, words, lines };
};
