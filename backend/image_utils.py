import os
import cv2
import numpy as np
from config import IMG_SIZE, MAX_FRAMES

def video_to_frames(seq_path):
    images = sorted(os.listdir(seq_path))
    frames = []

    for img in images[:MAX_FRAMES]:
        img_path = os.path.join(seq_path, img)
        frame = cv2.imread(img_path)

        if frame is None:
            continue

        frame = cv2.resize(frame, (IMG_SIZE, IMG_SIZE))
        frame = frame / 255.0
        frames.append(frame)

    if len(frames) == 0:
        return None

    # Padding if frames < MAX_FRAMES
    while len(frames) < MAX_FRAMES:
        frames.append(frames[-1])

    return np.array(frames)
