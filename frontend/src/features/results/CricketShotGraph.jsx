import "../../styles/results/CricketShotGraph.css";

const CLASS_ORDER = [
  "cover",
  "defense",
  "flick",
  "hook",
  "late_cut",
  "lofted",
  "pull",
  "square_cut",
  "straight",
  "sweep",
];

const LEGACY_LABEL_MAP = {
  drive: "cover",
  "legglance-flick": "flick",
  pullshot: "pull",
};

function normalizeLabel(label) {
  return label
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeShotKey(shot) {
  const raw = String(shot || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return LEGACY_LABEL_MAP[raw] || raw;
}

function parseConfidence(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  }
  const parsed = Number.parseFloat(String(value || "").replace("%", ""));
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(100, parsed));
}

function CricketShotGraph({ predictions = [] }) {
  const chartTop = 20;
  const chartBottom = 300;
  const chartHeight = chartBottom - chartTop;
  const yAxisLabels = [0, 20, 40, 60, 80, 100];
  const confidenceByShot = new Map();
  predictions.forEach((item) => {
    const shotKey = normalizeShotKey(item?.shot);
    confidenceByShot.set(shotKey, parseConfidence(item?.confidence));
  });
  const values = CLASS_ORDER.map((shot) => ({
    shot,
    confidence: confidenceByShot.get(shot) ?? 0,
  }));
  const left = 70;
  const right = 930;
  const width = right - left;
  const xAxisPositions =
    values.length > 1
      ? values.map((_, i) => left + (i * width) / (values.length - 1))
      : [left + width / 2];

  const polylinePoints = values
    .map((item, i) => {
      const x = xAxisPositions[i];
      const y = chartBottom - (item.confidence * chartHeight) / 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="cricket-graph-card">
      <div className="cricket-graph-header">
        <div className="ai-badge">AI CLASSIFIER</div>
        <h3>Batting Shot Analysis</h3>
        <p>Confidence by detected batting shot class</p>
      </div>

      <svg viewBox="0 0 1000 395" className="cricket-graph">
        {/* BACKGROUND STADIUM */}
        <line x1="500" y1={chartTop} x2="500" y2={chartBottom} className="stadium-axis" />

        {/* Y AXIS */}
        <line x1="50" y1={chartTop} x2="50" y2={chartBottom} className="axis-line" />
        {/* X AXIS */}
        <line x1="50" y1={chartBottom} x2="950" y2={chartBottom} className="axis-line" />

        {/* Y AXIS LABELS + GRID */}
        {yAxisLabels.map((value, i) => {
          const y = chartBottom - (value * chartHeight) / 100;
          return (
            <g key={i}>
              <line x1="50" y1={y} x2="950" y2={y} className="grid-line" />
              <text x="35" y={y + 4} className="axis-label" textAnchor="end">
                {value}
              </text>
              <line x1="45" y1={y} x2="55" y2={y} className="axis-tick" />
            </g>
          );
        })}

        {values.length > 0 && (
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#18ffff"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.8"
          />
        )}

        {/* X AXIS LABELS */}
        {values.map((item, i) => (
          <g key={i}>
            <line
              x1={xAxisPositions[i]}
              y1={chartBottom}
              x2={xAxisPositions[i]}
              y2={chartBottom + 24}
              className="x-label-guide"
            />
            <text
              x={xAxisPositions[i]}
              y="335"
              className="x-axis-label"
              textAnchor="middle"
            >
              {normalizeLabel(item.shot)}
            </text>
            <line
              x1={xAxisPositions[i]}
              y1={chartBottom - 5}
              x2={xAxisPositions[i]}
              y2={chartBottom + 5}
              className="axis-tick"
            />

            <circle
              cx={xAxisPositions[i]}
              cy={chartBottom - (item.confidence * chartHeight) / 100}
              r="7"
              className="data-node"
            />
            <text
              x={xAxisPositions[i]}
              y={chartBottom - 15 - (item.confidence * chartHeight) / 100}
              className="node-percent"
            >
              {item.confidence.toFixed(1)}%
            </text>
          </g>
        ))}

        {values.length === 0 && (
          <text x="500" y="210" className="axis-label" textAnchor="middle">
            No prediction scores returned by the model
          </text>
        )}
      </svg>
    </div>
  );
}

export default CricketShotGraph;
