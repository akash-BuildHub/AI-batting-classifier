from pathlib import Path

import numpy as np
from sklearn.model_selection import train_test_split

from config import DATASET_PATH, SEQ_LEN
from image_utils import video_to_frames
from video_utils import video_to_sequence


VIDEO_EXTENSIONS = (".mp4", ".mov", ".avi", ".webm", ".mkv", ".gif")


def infer_dataset_classes(root=DATASET_PATH):
    root_path = Path(root)
    if not root_path.exists():
        return []

    grouped_classes = sorted(item.name for item in root_path.iterdir() if item.is_dir())
    if grouped_classes:
        return grouped_classes

    return sorted(item.stem for item in root_path.iterdir() if item.is_file() and item.suffix.lower() in VIDEO_EXTENSIONS)


def _read_sequence_from_dir(path):
    frames = video_to_frames(path)
    if frames is None or len(frames) == 0:
        return None
    if len(frames) > SEQ_LEN:
        return frames[:SEQ_LEN]
    if len(frames) < SEQ_LEN:
        padded = list(frames)
        while len(padded) < SEQ_LEN:
            padded.append(padded[-1])
        return np.array(padded)
    return frames


def _load_grouped_dataset(root):
    X, y, classes = [], [], []
    root_path = Path(root)
    class_names = sorted(item.name for item in root_path.iterdir() if item.is_dir())

    for class_index, class_name in enumerate(class_names):
        class_path = root_path / class_name
        classes.append(class_name)

        for item in sorted(class_path.iterdir(), key=lambda p: p.name):
            frames = None

            if item.is_dir():
                frames = _read_sequence_from_dir(str(item))
            elif item.suffix.lower() in VIDEO_EXTENSIONS:
                frames = video_to_sequence(str(item))

            if frames is None:
                continue

            X.append(frames)
            y.append(class_index)

    return X, y, classes


def _load_file_per_class_dataset(root):
    X, y, classes = [], [], []
    root_path = Path(root)
    files = sorted(item for item in root_path.iterdir() if item.is_file() and item.suffix.lower() in VIDEO_EXTENSIONS)

    for class_index, file_path in enumerate(files):
        label = file_path.stem
        frames = video_to_sequence(str(file_path))
        if frames is None:
            continue

        classes.append(label)
        X.append(frames)
        y.append(class_index)

    return X, y, classes


def load_dataset():
    from tensorflow.keras.utils import to_categorical

    X, y, classes = _load_grouped_dataset(DATASET_PATH)
    if len(classes) == 0:
        X, y, classes = _load_file_per_class_dataset(DATASET_PATH)

    if len(X) < 2:
        raise ValueError(
            "Dataset is too small for train/test split. Add more videos or frame sequences under backend/dataset."
        )

    X = np.array(X, dtype=np.float32)
    y = to_categorical(y, num_classes=len(classes))

    return train_test_split(X, y, test_size=0.2, random_state=42), classes
