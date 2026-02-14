import { useState } from "react";
import "../../styles/upload/UploadCard.css";

function UploadCard({ onSelect, onClose }) {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className={`drop-zone ${dragActive ? "active" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files.length > 0) {
          onSelect({ target: { files: e.dataTransfer.files } });
        }
      }}
    >
      <button type="button" className="close-upload-btn" onClick={onClose} aria-label="Close upload box">
        X
      </button>

      {/* Animation Section */}
      <div className="ai-scene">
        <div className="digital-grid"></div>
        <div className="ball-container">
          <div className="ball-trail"></div>
          <div className="cricket-ball"></div>
        </div>
        <div className="bat-system">
          <div className="data-rings"></div>
          <div className="cyber-bat">
            <div className="handle"></div>
            <div className="blade"></div>
          </div>
        </div>
      </div>

      {/* Your Requested Text Section */}
      <div className="text-container">
        <h2>Analyze Your Shot</h2>
        <p className="sub-text">Drag & drop your batting footage</p>
        
        <div className="format-group">
          <span>MP4</span><span>MOV</span><span>AVI</span>
        </div>

        <label className="select-btn-neon">
          Select Video File
          <input type="file" accept="video/*" hidden onChange={onSelect} />
        </label>
      </div>
    </div>
  );
}

export default UploadCard;
