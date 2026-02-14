import { motion } from "framer-motion";
import { Brain, Cpu, Activity } from "lucide-react";
import "../../styles/upload/ProcessingAnimation.css";

const ProcessingAnimation = ({ stage, progress }) => {
  const stageConfig = {
    uploading: { icon: Activity, title: "Uploading...", color: "#48dbfb" },
    processing: { icon: Cpu, title: "Processing...", color: "#1dd1a1" },
    analyzing: { icon: Brain, title: "AI Analysis...", color: "#ff4757" },
  };

  const current = stageConfig[stage];
  const Icon = current.icon;

  return (
    <div className="simple-processing-backdrop">
      <div className="simple-card">
        
        {/* Animated Cricket Ball */}
        <div className="ball-wrapper">
          <motion.div 
            className="main-ball"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          >
            <div className="seam"></div>
          </motion.div>
          {/* Pulsing glow based on stage color */}
          <motion.div 
            className="ball-glow"
            style={{ backgroundColor: current.color }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </div>

        <div className="info-area">
          <div className="stage-header">
            <Icon size={24} style={{ color: current.color }} />
            <h2>{current.title}</h2>
          </div>
          
          <div className="percentage-text">{progress}%</div>

          {/* Progress bar that looks like a cricket pitch */}
          <div className="pitch-progress-container">
            <div className="crease-line start"></div>
            <motion.div 
              className="pitch-fill"
              style={{ backgroundColor: current.color }}
              animate={{ width: `${progress}%` }}
            />
            <div className="crease-line end"></div>
          </div>
          
          <p className="status-subtext">Calculating your batting metrics</p>
        </div>

      </div>
    </div>
  );
};

export default ProcessingAnimation;
