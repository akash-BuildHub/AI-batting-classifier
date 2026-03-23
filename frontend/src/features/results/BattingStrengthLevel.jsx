import { Zap, Shield, Star, Trophy, Activity } from "lucide-react";
import "../../styles/results/BattingStrengthLevel.css";

function BattingStrengthLevel({ analysis }) {
  const strength = analysis?.batting_strength ?? 0;
  const techniqueQuality = analysis?.technique_quality ?? "Unknown";
  const techniqueMatch = analysis?.technique_match ?? "Unknown";
  const summary = analysis?.summary ?? "Analysis summary unavailable.";
  const currentTier = analysis?.tier || "Weak";

  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (strength / 100) * circumference;

  const metricRows = [
    { label: "Weak", rangeText: "0-39%", icon: Shield },
    { label: "Moderate", rangeText: "40-59%", icon: Zap },
    { label: "Strong", rangeText: "60-77%", icon: Star },
    { label: "Elite", rangeText: "78-100%", icon: Trophy },
  ];
  const activeMetric = metricRows.find((item) => item.label.toLowerCase() === String(currentTier).toLowerCase()) || metricRows[0];
  const TierIcon = activeMetric.icon;

  return (
    <div className="batting-strength-container">
      <div className="batting-strength-card">
        <div className="batting-strength-header">
          <Activity size={24} className="accent-green" />
          <div className="header-text">
            <h3>Batting Power Analysis</h3>
            <p>Shot quality and style compared with AI-classified patterns</p>
          </div>
        </div>

        <div className="batting-strength-content">
          <div className="gauge-section">
            <div className="gauge-visual-container">
              <svg viewBox="0 0 190 190" className="gauge-svg">
                <defs>
                  <linearGradient id="powerGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>

                <circle cx="95" cy="95" r={radius} className="gauge-track" />
                <circle
                  cx="95"
                  cy="95"
                  r={radius}
                  className="gauge-fill"
                  stroke="url(#powerGradient)"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>

              <div className="gauge-overlay">
                <div className="percentage-display">
                  {strength}
                  <span>%</span>
                </div>
              </div>
            </div>

            <div className="elite-pill">
              <TierIcon size={14} className="tier-icon" />
              <span className="elite-label">{currentTier.toUpperCase()}</span>
            </div>
          </div>

          <div className="metrics-column">
            {metricRows.map((item, idx) => {
              const isActive = item.label.toLowerCase() === String(currentTier).toLowerCase();
              return (
                <div key={idx} className={`metric-row ${isActive ? "active" : ""}`}>
                  <div className="metric-info">
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </div>

                  <div className="metric-progress-container">
                    <div
                      className="metric-progress-bar"
                      style={{
                        width: isActive ? "100%" : "35%",
                        background: isActive ? "#22c55e" : "#334155",
                      }}
                    />
                  </div>

                  <span className="metric-range">
                    {item.rangeText}
                  </span>
                </div>
              );
            })}

          </div>
        </div>

        <div className="footer-note">
          <Zap size={14} />
          Suggestion:{summary} Technique: {techniqueQuality}. Style match: {techniqueMatch}.
        </div>
      </div>
    </div>
  );
}

export default BattingStrengthLevel;
