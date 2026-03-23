import CricketShotGraph from "./CricketShotGraph";
import BattingStrengthLevel from "./BattingStrengthLevel";
import UploadAnotherVideo from "./UploadAnotherVideo";
import "../../styles/results/ResultsSection.css";

function formatShotName(shot) {
  return String(shot || "Unknown")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ResultsSection({ results }) {
  if (!results) {
    return null;
  }

  const topShot = results.top_shot || "Unknown";
  const analysis = results.analysis || {};

  return (
    <section id="analysis-complete" className="results-section">

      {/* Page 1 — header + graph, fills one full viewport */}
      <div className="results-page-one">
        <div className="results-header">
          <span className="status-pill">Analysis Complete</span>

          <h2>
            Your Batting <span>Analysis Results</span>
          </h2>

          <p>
            Most Used Shot: <strong className="shot-name">{formatShotName(topShot)}</strong>
          </p>
        </div>

        <CricketShotGraph predictions={results.predictions || []} />
      </div>

      {/* Page 2 — batting analysis + reset button */}
      <div className="results-page-two">
        <BattingStrengthLevel analysis={analysis} />
        <UploadAnotherVideo />
      </div>

    </section>
  );
}

export default ResultsSection;
