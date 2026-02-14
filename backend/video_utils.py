import cv2
import numpy as np
from config import IMG_SIZE, SEQ_LEN

def video_to_sequence(video_path):
    cap = cv2.VideoCapture(video_path)
    frames = []

    while len(frames) < SEQ_LEN:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, (IMG_SIZE, IMG_SIZE))
        frame = frame / 255.0
        frames.append(frame)

    cap.release()

    if len(frames) == 0:
        return None

    while len(frames) < SEQ_LEN:
        frames.append(frames[-1])

    return np.array(frames)
