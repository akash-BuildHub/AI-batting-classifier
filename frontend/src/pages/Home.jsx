import { useState, useEffect, useRef, lazy, Suspense } from "react";
import "../styles/pages/Home.css";

const UploadCard = lazy(() => import("../features/upload/UploadCard"));
const ProcessingAnimation = lazy(() => import("../features/upload/ProcessingAnimation"));
const ResultsSection = lazy(() => import("../features/results/ResultsSection"));
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Home() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState("upload");
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const resultsRef = useRef(null);
  const unlockPageScroll = () => {
    document.documentElement.style.overflowY = "auto";
    document.body.style.overflowY = "auto";
  };

  const scrollToResults = () => {
    unlockPageScroll();
    const target = document.getElementById("analysis-complete") || resultsRef.current;
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
    setProgress(0);
    setShowResults(false);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Prediction failed");
      }

      setResults(payload);
      setProgress(100);
    } catch (err) {
      setError(err.message || "Could not analyze this video");
      setStage("upload");
      setOpen(false);
      setShowResults(false);
      return;
    }

    setStage("processing");
    setProgress(0);
  };

  const closeUploadModal = () => {
    setOpen(false);
    setStage("upload");
    setProgress(0);
    setError("");
  };

  useEffect(() => {
    if (stage === "uploading" || stage === "processing" || stage === "analyzing") {
      const interval = setInterval(() => {
        setProgress((p) => {
          if (stage === "uploading") {
            return p >= 92 ? p : p + 3;
          }
          if (p >= 100) {
            if (stage === "processing") {
              setStage("analyzing");
            } else {
              clearInterval(interval);
              setOpen(false);
              setShowResults(true);
            }
            return 0;
          }
          return p + 5;
        });
      }, 180);

      return () => clearInterval(interval);
    }
  }, [stage]);

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
        <div ref={resultsRef}>
          <Suspense fallback={null}>
            <ResultsSection results={results} />
          </Suspense>
        </div>
      )}
    </>
  );
}

export default Home;
