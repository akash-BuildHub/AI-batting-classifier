import { useState, useEffect, lazy, Suspense } from "react";
import "../styles/pages/Home.css";

const UploadCard = lazy(() => import("../features/upload/UploadCard"));
const ProcessingAnimation = lazy(() => import("../features/upload/ProcessingAnimation"));
const ResultsSection = lazy(() => import("../features/results/ResultsSection"));

const resolveApiBaseUrl = () => {
  const configured = process.env.REACT_APP_API_URL?.trim();
  if (configured) {
    const hasProtocol = /^https?:\/\//i.test(configured);
    const looksLocalHost = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured);
    const normalized = hasProtocol ? configured : `${looksLocalHost ? "http" : "https"}://${configured}`;
    return normalized.replace(/\/+$/, "");
  }

  const host = window.location.hostname || "localhost";
  return `http://${host}:5000`;
};

const API_BASE_URL = resolveApiBaseUrl();

function Home() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState("upload");
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const unlockPageScroll = () => {
    document.documentElement.style.overflowY = "auto";
    document.body.style.overflowY = "auto";
  };

  const scrollToResults = () => {
    unlockPageScroll();
    const target = document.getElementById("analysis-complete");
    if (!target) {
      return false;
    }
    const top = window.scrollY + target.getBoundingClientRect().top;
    window.scrollTo({ top, behavior: "smooth" });
    return true;
  };

  const startUpload = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setResults(null);
    setStage("uploading");
    setProgress(1);
    setShowResults(false);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Prediction failed");
      }

      setResults(payload);
      setProgress(100);
      setStage("upload");
      setOpen(false);
      setShowResults(true);
      return;
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          `Failed to connect to API at ${API_BASE_URL}. Start backend with: cd backend && .\\.venv\\Scripts\\python.exe app.py`
        );
      } else {
        setError(err.message || "Could not analyze this video");
      }
      setStage("upload");
      setProgress(0);
      setOpen(false);
      setShowResults(false);
      return;
    }
  };

  const closeUploadModal = () => {
    setOpen(false);
    setStage("upload");
    setProgress(0);
    setError("");
  };

  // Animate progress — no hard ceilings, no stalls.
  useEffect(() => {
    if (stage !== "uploading" && stage !== "processing" && stage !== "analyzing") return;

    const id = setInterval(() => {
      setProgress((p) => {
        if (stage === "uploading") {
          // Asymptotic deceleration toward ~92%: 5% of remaining distance per tick,
          // with a guaranteed minimum so the bar is always visibly moving.
          const increment = Math.max((92 - p) * 0.05, 0.06);
          return Math.min(p + increment, 92);
        }
        if (stage === "processing") return Math.min(p + 3.0, 95);
        // analyzing
        return Math.min(p + 2.0, 100);
      });
    }, 50);

    return () => clearInterval(id);
  }, [stage]);

  // Advance stage when progress crosses each threshold.
  useEffect(() => {
    if (stage === "processing" && progress >= 95) {
      setStage("analyzing");
    } else if (stage === "analyzing" && progress >= 100) {
      setOpen(false);
      setShowResults(true);
    }
  }, [progress, stage]);

  useEffect(() => {
    if (!showResults || !results) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 60;
    const intervalId = setInterval(() => {
      attempts += 1;
      if (scrollToResults() || attempts >= maxAttempts) {
        clearInterval(intervalId);
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [showResults, results]);

  useEffect(() => {
    const shouldLockScroll = !showResults;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflowY;
    const prevBodyOverflow = body.style.overflowY;

    html.style.overflowY = shouldLockScroll ? "hidden" : "auto";
    body.style.overflowY = shouldLockScroll ? "hidden" : "auto";

    return () => {
      html.style.overflowY = prevHtmlOverflow;
      body.style.overflowY = prevBodyOverflow;
    };
  }, [showResults]);

  return (
    <>
      <div className="hero">
        <h1>
          Analyze Your <span>Cricket Batting</span> Strengths
        </h1>
        <p>
          Get started and explore AI-based analysis that understands the mechanics of your cricket batting
          Strengths.
        </p>
        <div className="cta-animation">
          <button
            className="cta-btn shake-btn"
            onClick={() => {
              setOpen(true);
              setStage("upload");
            }}
          >
            {["G", "e", "t", " ", "S", "t", "a", "r", "t", "e", "d"].map((char, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </button>
        </div>
        {error && <p style={{ color: "#ff7675", marginTop: "14px" }}>{error}</p>}
      </div>

      {open && stage === "upload" && (
        <Suspense fallback={null}>
          <div className="modal-backdrop">
            <div className="upload-card">
              <UploadCard onSelect={startUpload} onClose={closeUploadModal} />
            </div>
          </div>
        </Suspense>
      )}

      {open && stage !== "upload" && (
        <Suspense fallback={null}>
          <ProcessingAnimation stage={stage} progress={progress} />
        </Suspense>
      )}

      {showResults && (
        <div>
          <Suspense fallback={null}>
            <ResultsSection results={results} />
          </Suspense>
        </div>
      )}
    </>
  );
}

export default Home;

