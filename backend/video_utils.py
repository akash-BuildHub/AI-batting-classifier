import cv2
import numpy as np
from config import IMG_SIZE, SEQ_LEN


def _preprocess_frame(frame):
    frame = cv2.resize(frame, (IMG_SIZE, IMG_SIZE))
    return frame.astype(np.float32) / 255.0


def _read_all_frames(video_path, max_frames=None):
    cap = cv2.VideoCapture(video_path)
    frames = []
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

    if max_frames and frame_count > max_frames:
        # Fast path for long videos: sample evenly across the clip.
        sample_idx = np.linspace(0, frame_count - 1, num=max_frames, dtype=np.int32)
        for idx in sample_idx:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
            ret, frame = cap.read()
            if not ret:
                continue
            frames.append(_preprocess_frame(frame))
    else:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(_preprocess_frame(frame))
            if max_frames and len(frames) >= max_frames:
                break

    cap.release()
    return frames


def video_to_sequence(video_path):
    frames = _read_all_frames(video_path, max_frames=SEQ_LEN)
    if len(frames) == 0:
        return None
    while len(frames) < SEQ_LEN:
        frames.append(frames[-1])
    return np.array(frames[:SEQ_LEN], dtype=np.float32)


def video_to_windows(video_path, max_windows=5):
    """Extract up to max_windows evenly-spaced SEQ_LEN-frame windows from the video.

    Returns a list of numpy arrays each shaped (SEQ_LEN, IMG_SIZE, IMG_SIZE, 3),
    or None if no frames could be read.
    """
    max_windows = max(1, int(max_windows))
    frames = _read_all_frames(video_path, max_frames=SEQ_LEN * max_windows)
    if len(frames) == 0:
        return None

    # Pad short videos so we always have at least one full window.
    while len(frames) < SEQ_LEN:
        frames.append(frames[-1])

    total = len(frames)
    max_start = total - SEQ_LEN  # inclusive upper bound for window starts

    # How many distinct windows can we create?
    possible = min(max_windows, max_start + 1)

    # Evenly distribute start positions across [0, max_start].
    if possible == 1:
        starts = [0]
    else:
        starts = [round(max_start * i / (possible - 1)) for i in range(possible)]

    windows = []
    seen = set()
    for s in starts:
        s = int(min(s, max_start))
        if s not in seen:
            seen.add(s)
            windows.append(np.array(frames[s: s + SEQ_LEN], dtype=np.float32))

    return windows if windows else None
