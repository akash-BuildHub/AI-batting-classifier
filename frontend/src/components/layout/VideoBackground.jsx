function VideoBackground() {
  return (
    <video autoPlay loop muted playsInline className="video-bg">
      <source src="/background.mp4" type="video/mp4" />
    </video>
  );
}

export default VideoBackground;
