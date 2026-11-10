/**
 * Parse CSV text into an array of headers and rows
 * Handles quoted fields with commas and newlines
 */
export const parseCsv = (csvText) => {
  if (!csvText || !csvText.trim()) {
    return { headers: [], rows: [] };
  }

  const lines = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.length > 0 && currentRow.some((val) => val !== '')) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((val) => val !== '')) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = lines[0];
  const headers = rawHeaders.map((h, idx) => (h && h.trim()) || `Column_${idx + 1}`);

  const rows = lines.slice(1).map((row, rowIdx) => {
    const obj = { _rowId: rowIdx + 1 };
    headers.forEach((header, colIdx) => {
      obj[header] = row[colIdx] !== undefined ? row[colIdx] : '';
    });
    return obj;
  });

  return { headers, rows };
};

/**
 * Convert array of objects to CSV formatted string
 */
export const generateCsv = (data, columns) => {
  if (!data || data.length === 0) return '';

  const cols = columns && columns.length > 0
    ? columns
    : Object.keys(data[0]).filter((k) => !k.startsWith('_'));

  const escapeField = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const headerRow = cols.map(escapeField).join(',');
  const dataRows = data.map((row) =>
    cols.map((col) => escapeField(row[col])).join(',')
  );

  return [headerRow, ...dataRows].join('\r\n');
};

/**
 * Trigger download of text or blob in browser
 */
export const downloadFile = (content, filename, type = 'text/csv;charset=utf-8;') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
