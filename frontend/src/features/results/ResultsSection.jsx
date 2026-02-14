import CricketShotGraph from "./CricketShotGraph";
import BattingStrengthLevel from "./BattingStrengthLevel";
import UploadAnotherVideo from "./UploadAnotherVideo";
import "../../styles/results/ResultsSection.css";

function ResultsSection({ results }) {
  if (!results) {
    return null;
  }

  const topShot = results.top_shot || "Unknown";
  const topConfidence = results.top_confidence ?? 0;

  return (
    <section id="analysis-complete" className="results-section">
      <div className="results-header">
        <span className="status-pill">Analysis Complete</span>

        <h2>
          Your Batting <span>Analysis Results</span>
        </h2>

        <p>Predicted shot: <strong>{topShot}</strong> ({topConfidence.toFixed(2)}% confidence)</p>
      </div>

      <CricketShotGraph predictions={results.predictions || []} />

      <BattingStrengthLevel analysis={results.analysis} />

      <UploadAnotherVideo />
    </section>
  );
}

export default ResultsSection;
