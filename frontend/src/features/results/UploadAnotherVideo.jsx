import "../../styles/results/UploadAnotherVideo.css";

function UploadAnotherVideo() {
  const handleUploadAgain = () => {
    window.location.reload(); // simple & effective
  };

  return (
    <div className="upload-again-container">
      <p className="upload-again-text">
        Want to analyze another video?
      </p>

      <button
        className="upload-again-btn"
        onClick={handleUploadAgain}
      >
        Upload New Video
      </button>
    </div>
  );
}

export default UploadAnotherVideo;
