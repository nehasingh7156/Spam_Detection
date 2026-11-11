import { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Download,
  ShieldAlert,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useDetection } from '../context/DetectionContext';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import EmptyState from '../components/EmptyState';
import { formatScore } from '../utils/formatters';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';

export const Analytics = () => {
  const { history, loadEvaluationSamples, addToast } = useDetection();

  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL', '24H', '7D', '30D'
  // Filter history based on selected time window
  const filteredHistory = useMemo(() => {
    if (dateFilter === 'ALL') return history;
    /* eslint-disable-next-line react-hooks/purity */
    const now = Date.now();
    let maxAgeMs = Infinity;
    if (dateFilter === '24H') maxAgeMs = 24 * 60 * 60 * 1000;
    if (dateFilter === '7D') maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (dateFilter === '30D') maxAgeMs = 30 * 24 * 60 * 60 * 1000;

    return history.filter((item) => {
      const itemTime = new Date(item.timestamp).getTime();
      return now - itemTime <= maxAgeMs;
    });
  }, [history, dateFilter]);

  // Derived metrics for filtered dataset
  const filteredStats = useMemo(() => {
    const total = filteredHistory.length;
    let spam = 0;
    let ham = 0;
    let spamScoreSum = 0;
    let hamScoreSum = 0;

    filteredHistory.forEach((r) => {
      if (r.prediction === 'Spam' || r.label === 1) {
        spam++;
        spamScoreSum += Number(r.decision_score || 0);
      } else {
        ham++;
        hamScoreSum += Number(r.decision_score || 0);
      }
    });

    const rate = total > 0 ? (spam / total) * 100 : 0;
    const avgSpam = spam > 0 ? spamScoreSum / spam : 0;
    const avgHam = ham > 0 ? hamScoreSum / ham : 0;

    return { total, spam, ham, rate, avgSpam, avgHam };
  }, [filteredHistory]);

  // Pie chart data
  const pieData = useMemo(() => {
    if (filteredStats.total === 0) return [];
    return [
      { name: 'Spam Threats', value: filteredStats.spam, color: '#EF4444' },
      { name: 'Legitimate Messages', value: filteredStats.ham, color: '#22C55E' },
    ];
  }, [filteredStats]);

  // Daily / Timeline Chart data
  const timelineData = useMemo(() => {
    if (filteredHistory.length === 0) return [];
    const buckets = {};
    const sorted = [...filteredHistory].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    sorted.forEach((item) => {
      const d = new Date(item.timestamp);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      if (!buckets[label]) {
        buckets[label] = { date: label, spam: 0, ham: 0, total: 0 };
      }
      if (item.prediction === 'Spam' || item.label === 1) {
        buckets[label].spam++;
      } else {
        buckets[label].ham++;
      }
      buckets[label].total++;
    });

    return Object.values(buckets);
  }, [filteredHistory]);

  // Decision score distribution buckets (e.g. Strongly Ham <-1.5, Moderately Ham -1.5..0, Low Spam 0..1.5, High Spam >1.5)
  const scoreDistribution = useMemo(() => {
    if (filteredHistory.length === 0) return [];

    const buckets = [
      { range: '< -1.5 (Safe)', count: 0, type: 'ham' },
      { range: '-1.5 to 0.0 (Legit)', count: 0, type: 'ham' },
      { range: '0.0 to +1.5 (Spam)', count: 0, type: 'spam' },
      { range: '> +1.5 (High Spam)', count: 0, type: 'spam' },
    ];

    filteredHistory.forEach((r) => {
      const s = Number(r.decision_score || 0);
      if (s < -1.5) buckets[0].count++;
      else if (s <= 0) buckets[1].count++;
      else if (s <= 1.5) buckets[2].count++;
      else buckets[3].count++;
    });

    return buckets;
  }, [filteredHistory]);

  // Export Analytics Report as Word (.docx)
  const handleExportReport = async () => {
    const generatedAt = new Date();
    const dateStr = generatedAt.toLocaleString();
    const filterLabel = dateFilter === 'ALL' ? 'All Time' : dateFilter;

    // Helper: create a plain text paragraph
    const para = (text, opts = {}) =>
      new Paragraph({
        children: [new TextRun({ text, ...opts })],
        spacing: { after: 120 },
        alignment: opts.alignment || AlignmentType.LEFT,
      });

    // Helper: bold label + value on same line
    const labelValue = (label, value) =>
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true, size: 20 }),
          new TextRun({ text: String(value), size: 20 }),
        ],
        spacing: { after: 80 },
      });

    // Helper: build a table row
    const tableRow = (cells, isHeader = false) =>
      new TableRow({
        children: cells.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: String(cell),
                      bold: isHeader,
                      size: isHeader ? 20 : 18,
                      color: isHeader ? 'FFFFFF' : '1E293B',
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: isHeader
                ? { type: ShadingType.SOLID, color: '1D4ED8', fill: '1D4ED8' }
                : undefined,
              width: { size: 25, type: WidthType.PERCENTAGE },
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
              },
            })
        ),
      });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: 'SpamShield — Threat Analytics Report',
              heading: HeadingLevel.TITLE,
              spacing: { after: 200 },
              alignment: AlignmentType.CENTER,
            }),

            // Subtitle / generated date
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated: ${dateStr}   |   Time Filter: ${filterLabel}`,
                  size: 18,
                  color: '64748B',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // ── Section 1: KPI Summary ──────────────────────
            new Paragraph({
              text: '1. Key Performance Indicators',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 160 },
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                tableRow(['Metric', 'Value'], true),
                tableRow(['Total Messages Scanned', filteredStats.total.toLocaleString()]),
                tableRow(['Spam Detected', filteredStats.spam.toLocaleString()]),
                tableRow(['Safe (Ham) Messages', filteredStats.ham.toLocaleString()]),
                tableRow(['Spam Detection Rate', `${filteredStats.rate.toFixed(2)}%`]),
                tableRow(['Avg SVM Score — Spam', filteredStats.avgSpam.toFixed(4)]),
                tableRow(['Avg SVM Score — Ham', filteredStats.avgHam.toFixed(4)]),
              ],
            }),

            // ── Section 2: Distribution ───────────────────────
            new Paragraph({
              text: '2. Spam vs. Ham Distribution',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 160 },
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                tableRow(['Classification', 'Count', 'Percentage'], true),
                tableRow([
                  'Spam Threats',
                  filteredStats.spam.toLocaleString(),
                  `${filteredStats.rate.toFixed(1)}%`,
                ]),
                tableRow([
                  'Legitimate (Ham)',
                  filteredStats.ham.toLocaleString(),
                  `${(100 - filteredStats.rate).toFixed(1)}%`,
                ]),
                tableRow([
                  'Total',
                  filteredStats.total.toLocaleString(),
                  '100%',
                ]),
              ],
            }),

            // ── Section 3: SVM Decision Score Distribution ────
            new Paragraph({
              text: '3. SVM Decision Score Distribution',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 160 },
            }),

            para(
              'The SVM decision score represents the signed distance from the hyperplane. ' +
                'Negative values indicate legitimate messages (Ham); positive values indicate Spam.',
              { size: 18, color: '64748B' }
            ),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                tableRow(['Score Range', 'Classification', 'Message Count'], true),
                ...scoreDistribution.map((b) =>
                  tableRow([
                    b.range,
                    b.type === 'spam' ? 'Spam' : 'Ham',
                    b.count.toLocaleString(),
                  ])
                ),
              ],
            }),

            // ── Section 4: Daily Timeline ─────────────────────
            ...(timelineData.length > 0
              ? [
                  new Paragraph({
                    text: '4. Daily Detection Timeline',
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 160 },
                  }),
                  new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                      tableRow(['Date', 'Spam', 'Ham', 'Total'], true),
                      ...timelineData.map((d) =>
                        tableRow([d.date, d.spam, d.ham, d.total])
                      ),
                    ],
                  }),
                ]
              : []),

            // ── Section 5: Model Information ──────────────────
            new Paragraph({
              text: '5. Model Information',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 160 },
            }),

            labelValue('Classifier', 'Linear Support Vector Machine (LinearSVC)'),
            labelValue('Feature Extractor', 'TF-IDF Vectorizer'),
            labelValue('Training Dataset', 'UCI SMS Spam Collection (5,572 instances)'),
            labelValue('Decision Boundary', 'SVM Hyperplane (score = 0)'),

            // Footer note
            new Paragraph({
              children: [
                new TextRun({
                  text: '\nThis report was automatically generated by SpamShield and reflects only verified detection history stored locally in this session.',
                  size: 16,
                  color: '94A3B8',
                  italics: true,
                }),
              ],
              spacing: { before: 400 },
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SpamShield_Analytics_Report_${Date.now()}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast('success', 'Analytics report downloaded as Word document (.docx)');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cyber-text">
              Threat Analytics & Intelligence
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyber-cyan text-[11px] font-mono font-medium">
              Audit Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-cyber-muted mt-1">
            Telemetry metrics and distribution analyses calculated strictly from verified detection history.
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-cyber-input p-1 rounded-xl border border-cyber-border text-xs">
            {['ALL', '24H', '7D', '30D'].map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  dateFilter === filter
                    ? 'bg-cyber-accent text-white shadow-sm'
                    : 'text-cyber-muted hover:text-white'
                }`}
              >
                {filter === 'ALL' ? 'All Time' : filter}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportReport}
            disabled={filteredHistory.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyber-card hover:bg-cyber-cardHover text-cyber-text border border-cyber-border text-xs font-medium transition-colors disabled:opacity-40"
            title="Export Report"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>

      {filteredHistory.length > 0 ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Scans in Period"
              value={filteredStats.total.toLocaleString()}
              subtitle={`Filter: ${dateFilter}`}
              icon={Activity}
              color="blue"
            />
            <StatCard
              title="Spam Inceptions"
              value={filteredStats.spam.toLocaleString()}
              subtitle={`${filteredStats.rate.toFixed(1)}% threat frequency`}
              icon={ShieldAlert}
              color="red"
            />
            <StatCard
              title="Safe Clean Messages"
              value={filteredStats.ham.toLocaleString()}
              subtitle={`${(100 - filteredStats.rate).toFixed(1)}% safe pass`}
              icon={ShieldCheck}
              color="green"
            />
            <StatCard
              title="Avg Spam Score"
              value={formatScore(filteredStats.avgSpam)}
              subtitle={`Avg Ham: ${formatScore(filteredStats.avgHam)}`}
              icon={TrendingUp}
              color="cyan"
            />
          </div>

          {/* Charts Row: Trend Line & Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Activity Bar/Area */}
            <ChartCard
              title="Detection Volume Trends"
              subtitle="Aggregated traffic by day"
              icon={BarChart3}
              className="lg:col-span-2"
            >
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263449" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#263449' }}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#263449' }}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#151F32',
                        borderColor: '#263449',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="spam" name="Spam Threats" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ham" name="Safe Messages" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Distribution Pie */}
            <ChartCard
              title="Classification Ratio"
              subtitle="Proportional split of evaluated messages"
              icon={PieIcon}
              className="lg:col-span-1"
            >
              <div className="h-64 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#151F32" strokeWidth={2} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#151F32',
                        borderColor: '#263449',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="w-full flex items-center justify-around pt-3 border-t border-cyber-border/40 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyber-spam" />
                    <span className="text-cyber-muted">Spam:</span>
                    <span className="font-mono font-bold text-cyber-text">
                      {filteredStats.spam} ({filteredStats.rate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyber-safe" />
                    <span className="text-cyber-muted">Safe:</span>
                    <span className="font-mono font-bold text-cyber-text">
                      {filteredStats.ham} ({(100 - filteredStats.rate).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Decision Score Distribution Histogram */}
          <ChartCard
            title="SVM Decision Score Spread"
            subtitle="Hyperplane distance groupings: Negative values denote Ham, Positive denote Spam"
            icon={TrendingUp}
          >
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263449" vertical={false} />
                  <XAxis
                    dataKey="range"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#263449' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#263449' }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#151F32',
                      borderColor: '#263449',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Message Count" radius={[4, 4, 0, 0]}>
                    {scoreDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.type === 'spam' ? '#EF4444' : '#22C55E'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </>
      ) : (
        /* Empty State */
        <div className="py-12">
          <EmptyState
            title="No Threat Telemetry Available"
            description="Analytics require scanned message data to calculate metrics and plot distribution curves. Run a scan in the detector or upload a batch CSV."
            actionText="Go to Spam Detector"
            actionLink="/detector"
            secondaryActionText="Load Sample Evaluation Data"
            onSecondaryAction={loadEvaluationSamples}
          />
        </div>
      )}
    </div>
  );
};

export default Analytics;
