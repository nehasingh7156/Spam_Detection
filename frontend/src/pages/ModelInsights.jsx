import { useState } from 'react';
import {
  Cpu,
  BarChart2,
  AlertTriangle,
  Layers,
  FileCode,
  Shield,
  Sparkles,
  Info,
  Maximize2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import Modal from '../components/Modal';

// Exact benchmarks from backend/model/results/model_comparison.csv
const MODEL_COMPARISONS = [
  {
    model: 'Linear SVM',
    accuracy: 98.45,
    precision: 93.75,
    recall: 93.75,
    f1: 93.75,
    rocAuc: 99.42,
    selected: true,
    description:
      'Support Vector Classifier with linear kernel. Constructs maximum-margin hyperplane in TF-IDF space.',
  },
  {
    model: 'Logistic Regression',
    accuracy: 97.77,
    precision: 88.32,
    recall: 94.53,
    f1: 91.32,
    rocAuc: 99.59,
    selected: false,
    description:
      'Generalized linear model with sigmoid link. High recall but slightly lower precision on false positives.',
  },
  {
    model: 'Multinomial Naive Bayes',
    accuracy: 97.58,
    precision: 100.0,
    recall: 80.47,
    f1: 89.18,
    rocAuc: 98.28,
    selected: false,
    description:
      'Probabilistic Bayes classifier. 100% precision but suffers from lower recall (misses 19.5% of spam).',
  },
];

const METRIC_CHART_DATA = [
  { metric: 'Accuracy', 'Linear SVM': 98.45, 'Logistic Regression': 97.77, 'Naive Bayes': 97.58 },
  { metric: 'Precision', 'Linear SVM': 93.75, 'Logistic Regression': 88.32, 'Naive Bayes': 100.0 },
  { metric: 'Recall', 'Linear SVM': 93.75, 'Logistic Regression': 94.53, 'Naive Bayes': 80.47 },
  { metric: 'F1-Score', 'Linear SVM': 93.75, 'Logistic Regression': 91.32, 'Naive Bayes': 89.18 },
  { metric: 'ROC-AUC', 'Linear SVM': 99.42, 'Logistic Regression': 99.59, 'Naive Bayes': 98.28 },
];

const MATRIX_IMAGES = [
  {
    id: 'linear_svm',
    name: 'Linear SVM (Selected)',
    src: '/model_results/linear_svm_confusion_matrix.png',
    description: 'High diagonal concentration with balanced false positive and false negative counts.',
  },
  {
    id: 'logistic_regression',
    name: 'Logistic Regression',
    src: '/model_results/logistic_regression_confusion_matrix.png',
    description: 'Higher false positive count (16 false alarms) lowering precision to 88.32%.',
  },
  {
    id: 'naive_bayes',
    name: 'Multinomial Naive Bayes',
    src: '/model_results/naive_bayes_confusion_matrix.png',
    description: 'Zero false positives (100% precision) but 25 false negatives (low recall of 80.47%).',
  },
  {
    id: 'comparison_chart',
    name: 'Overall Model Comparison',
    src: '/model_results/model_comparison.png',
    description: 'Comparative benchmark bar graph generated during model training.',
  },
];

export const ModelInsights = () => {
  const [selectedMatrix, setSelectedMatrix] = useState('linear_svm');
  const [modalImage, setModalImage] = useState(null);

  const currentMatrix = MATRIX_IMAGES.find((m) => m.id === selectedMatrix) || MATRIX_IMAGES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cyber-text">
            Machine Learning Model Insights
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyber-accent text-[11px] font-mono font-medium">
            LinearSVC • Scikit-Learn
          </span>
        </div>
        <p className="text-xs sm:text-sm text-cyber-muted mt-1">
          Architectural evaluation, benchmark comparisons, and training pipeline telemetry.
        </p>
      </div>

      {/* Dataset Disclosure Alert Card (Mandatory Requirement) */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1.5 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <AlertTriangle size={17} className="text-amber-400 shrink-0" />
          <span>IMPORTANT DATASET DISCLOSURE & PRODUCTION SCOPE</span>
        </div>
        <p className="leading-relaxed text-amber-200/90 pl-6">
          The EmailShield model is currently trained on the <strong>UCI SMS Spam Collection dataset</strong> (5,572 labeled instances), not a dedicated enterprise multi-part email dataset. While the trained Linear SVM acts as a highly effective text classification engine capable of parsing email bodies and text patterns, it has not yet been validated on multi-part RFC-822 email headers, DKIM/SPF signatures, or embedded HTML attachments.
        </p>
        <p className="text-[11px] text-amber-300/80 pl-6 italic">
          *The displayed performance figures (98.45% accuracy, 93.75% F1) represent hold-out test set evaluation benchmarks, not guaranteed production SLAs in arbitrary email environments.
        </p>
      </div>

      {/* Selected Model Highlight KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-cyber-card border border-blue-500/40 relative overflow-hidden shadow-glow-blue">
          <div className="absolute top-0 right-0 bg-cyber-accent text-white text-[9px] font-mono uppercase px-2 py-0.5 rounded-bl font-bold">
            Selected
          </div>
          <span className="text-[10px] text-cyber-muted uppercase tracking-wider font-semibold block">
            Overall Accuracy
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            98.45%
          </span>
          <span className="text-[10px] text-cyber-dim mt-1 block">Top overall score</span>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[10px] text-cyber-muted uppercase tracking-wider font-semibold block">
            Spam Precision
          </span>
          <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">
            93.75%
          </span>
          <span className="text-[10px] text-cyber-dim mt-1 block">Low false positive rate</span>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[10px] text-cyber-muted uppercase tracking-wider font-semibold block">
            Spam Recall
          </span>
          <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
            93.75%
          </span>
          <span className="text-[10px] text-cyber-dim mt-1 block">93.75% threats caught</span>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[10px] text-cyber-muted uppercase tracking-wider font-semibold block">
            Spam F1-Score
          </span>
          <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">
            93.75%
          </span>
          <span className="text-[10px] text-cyber-dim mt-1 block">Harmonic balance</span>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[10px] text-cyber-muted uppercase tracking-wider font-semibold block">
            ROC-AUC Score
          </span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
            99.42%
          </span>
          <span className="text-[10px] text-cyber-dim mt-1 block">Separation capability</span>
        </div>
      </div>

      {/* Benchmark Comparison Table & Recharts Grouped Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Comparison Table (6 cols) */}
        <div className="lg:col-span-6 rounded-xl bg-cyber-card border border-cyber-border p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-cyber-border mb-3">
              <Cpu size={16} className="text-cyber-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-text">
                Benchmark Comparison (Hold-Out Test Set)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-cyber-border bg-cyber-input/60 text-cyber-muted font-medium uppercase tracking-wider">
                    <th className="py-2.5 px-3">Algorithm</th>
                    <th className="py-2.5 px-2">Accuracy</th>
                    <th className="py-2.5 px-2">Precision</th>
                    <th className="py-2.5 px-2">Recall</th>
                    <th className="py-2.5 px-2">F1</th>
                    <th className="py-2.5 px-2">ROC-AUC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/40">
                  {MODEL_COMPARISONS.map((m) => (
                    <tr
                      key={m.model}
                      className={
                        m.selected
                          ? 'bg-blue-600/10 font-medium'
                          : 'hover:bg-cyber-cardHover/30'
                      }
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-cyber-text">{m.model}</span>
                          {m.selected && (
                            <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 text-[9px] font-mono rounded font-semibold border border-blue-500/30">
                              Selected
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-emerald-400">{m.accuracy}%</td>
                      <td className="py-3 px-2 font-mono text-cyan-400">{m.precision}%</td>
                      <td className="py-3 px-2 font-mono text-blue-400">{m.recall}%</td>
                      <td className="py-3 px-2 font-mono text-purple-400">{m.f1}%</td>
                      <td className="py-3 px-2 font-mono text-amber-400">{m.rocAuc}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rationale Callout */}
          <div className="mt-4 p-3.5 rounded-xl bg-cyber-input border border-cyber-border text-xs text-cyber-muted space-y-1.5">
            <span className="text-cyber-text font-semibold flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyber-accent" />
              Why Linear Support Vector Machine was chosen:
            </span>
            <p className="leading-relaxed text-[11px]">
              While Naive Bayes achieves 100% precision, it misses nearly 20% of all spam (80.47% recall). Logistic Regression achieves higher recall but generates false alarms (88.32% precision). <strong>Linear SVM provides the highest overall accuracy (98.45%) and a harmonious balance of 93.75% Precision and 93.75% Recall</strong>, making it the superior architecture for mission-critical security triage.
            </p>
          </div>
        </div>

        {/* Grouped Bar Chart (6 cols) */}
        <div className="lg:col-span-6 rounded-xl bg-cyber-card border border-cyber-border p-5">
          <div className="flex items-center justify-between pb-3 border-b border-cyber-border mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-cyber-cyan" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-text">
                Metric Comparison Visualization
              </h3>
            </div>
            <span className="text-[10px] text-cyber-muted font-mono">Scores (%)</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={METRIC_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263449" vertical={false} />
                <XAxis
                  dataKey="metric"
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
                  domain={[75, 102]}
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
                <Bar dataKey="Linear SVM" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Logistic Regression" fill="#06B6D4" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Naive Bayes" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion Matrix Visualizer */}
      <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-cyber-accent" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-text">
                Confusion Matrix Visualizer
              </h3>
              <p className="text-[11px] text-cyber-muted">
                Inspect actual test-set evaluation heatmaps generated during model training.
              </p>
            </div>
          </div>

          {/* Matrix Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-cyber-input p-1 rounded-xl border border-cyber-border text-xs">
            {MATRIX_IMAGES.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedMatrix(img.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  selectedMatrix === img.id
                    ? 'bg-cyber-accent text-white shadow-sm'
                    : 'text-cyber-muted hover:text-white'
                }`}
              >
                {img.name}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Image Display */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 flex justify-center bg-cyber-input/40 p-4 rounded-xl border border-cyber-border relative group">
            <img
              src={currentMatrix.src}
              alt={currentMatrix.name}
              className="max-h-80 w-auto object-contain rounded-lg shadow-lg cursor-pointer"
              onClick={() => setModalImage(currentMatrix)}
            />
            <button
              onClick={() => setModalImage(currentMatrix)}
              className="absolute top-6 right-6 p-2 rounded-lg bg-black/60 hover:bg-black text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              title="Expand Image"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          <div className="md:col-span-5 space-y-3 text-xs">
            <h4 className="text-sm font-semibold text-cyber-text">
              {currentMatrix.name} Matrix Analysis
            </h4>
            <p className="text-cyber-muted leading-relaxed">
              {currentMatrix.description}
            </p>

            <div className="p-3.5 rounded-xl bg-cyber-input border border-cyber-border space-y-2">
              <span className="text-[10px] text-cyber-dim uppercase font-semibold block">
                Matrix Architecture Summary
              </span>
              <div className="space-y-1 text-cyber-muted text-[11px]">
                <div className="flex justify-between">
                  <span>True Negatives (Legit identified):</span>
                  <span className="font-mono text-emerald-400 font-semibold">High (Safe)</span>
                </div>
                <div className="flex justify-between">
                  <span>False Positives (Ham flagged as Spam):</span>
                  <span className="font-mono text-cyan-400 font-semibold">Minimized</span>
                </div>
                <div className="flex justify-between">
                  <span>False Negatives (Missed Spam):</span>
                  <span className="font-mono text-amber-400 font-semibold">6.25%</span>
                </div>
                <div className="flex justify-between">
                  <span>True Positives (Spam intercepted):</span>
                  <span className="font-mono text-red-400 font-semibold">93.75%</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-cyber-dim italic">
              Image source: <code className="text-cyber-accent">backend/model/results/{currentMatrix.id}.png</code>
            </p>
          </div>
        </div>
      </div>

      {/* Machine Learning Pipeline & TF-IDF Architecture Flow */}
      <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-cyber-border">
          <FileCode size={16} className="text-cyber-cyan" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-text">
            End-to-End Machine Learning Pipeline
          </h3>
        </div>

        {/* Pipeline Step Flow Diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-cyber-input border border-cyber-border flex flex-col items-center justify-center">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono font-bold flex items-center justify-center mb-1.5">
              1
            </span>
            <span className="text-xs font-bold text-cyber-text">Raw Text Input</span>
            <span className="text-[10px] text-cyber-muted mt-1">
              Email payload or SMS string
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-cyber-input border border-cyber-border flex flex-col items-center justify-center">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center mb-1.5">
              2
            </span>
            <span className="text-xs font-bold text-cyber-text">Preprocessing</span>
            <span className="text-[10px] text-cyber-muted mt-1">
              Lowercasing, tokens
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-cyber-input border border-cyber-border flex flex-col items-center justify-center">
            <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-mono font-bold flex items-center justify-center mb-1.5">
              3
            </span>
            <span className="text-xs font-bold text-cyber-text">TF-IDF Vectorizer</span>
            <span className="text-[10px] text-cyber-muted mt-1">
              N-gram term frequency weighting
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-cyber-input border border-cyber-border flex flex-col items-center justify-center">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center mb-1.5">
              4
            </span>
            <span className="text-xs font-bold text-cyber-text">Linear SVM</span>
            <span className="text-[10px] text-cyber-muted mt-1">
              Signed distance $w \cdot x + b$
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-cyber-input border border-cyber-border flex flex-col items-center justify-center">
            <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-mono font-bold flex items-center justify-center mb-1.5">
              5
            </span>
            <span className="text-xs font-bold text-cyber-text">Classification</span>
            <span className="text-[10px] text-cyber-muted mt-1">
              Verdict: Spam (1) or Ham (0)
            </span>
          </div>
        </div>

        {/* TF-IDF & SVM Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-cyber-input/60 border border-cyber-border text-xs space-y-2">
            <span className="text-xs font-semibold text-cyber-text flex items-center gap-1.5">
              <Info size={14} className="text-cyber-accent" />
              What is TF-IDF Vectorization?
            </span>
            <p className="text-cyber-muted leading-relaxed">
              <strong>Term Frequency-Inverse Document Frequency (TF-IDF)</strong> converts text strings into numerical sparse vectors. It scores words based on how frequently they appear in a message penalized by how commonly they appear across the entire corpus. Terms like "winner", "urgent", or "free" receive higher discriminator weights in spam contexts while stop words ("the", "is") are dampened.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-cyber-input/60 border border-cyber-border text-xs space-y-2">
            <span className="text-xs font-semibold text-cyber-text flex items-center gap-1.5">
              <Shield size={14} className="text-cyber-cyan" />
              Linear SVM Decision Function
            </span>
            <p className="text-cyber-muted leading-relaxed">
              The Linear Support Vector Machine determines the optimal separating hyperplane that maximizes the geometric margin between classes. The decision score returned by the API is computed as:
              <br />
              <code className="text-cyan-400 font-mono mt-1 block">
                decision_score = w · x + b
              </code>
              A positive value signifies spam orientation, whereas a negative score confirms legitimate email characteristics.
            </p>
          </div>
        </div>
      </div>

      {/* Modal for viewing expanded image */}
      {modalImage && (
        <Modal
          isOpen={!!modalImage}
          onClose={() => setModalImage(null)}
          title={modalImage.name}
          subtitle="Full Resolution Confusion Matrix"
          maxWidth="max-w-3xl"
        >
          <div className="flex justify-center p-2 bg-cyber-input rounded-xl border border-cyber-border">
            <img
              src={modalImage.src}
              alt={modalImage.name}
              className="max-h-[70vh] w-auto object-contain rounded"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ModelInsights;
