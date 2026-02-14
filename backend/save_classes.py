import json
from pathlib import Path

from data_loader import infer_dataset_classes


BASE_DIR = Path(__file__).resolve().parent
CLASSES_FILE = BASE_DIR / "classes.json"


if __name__ == "__main__":
    classes = infer_dataset_classes()
    if not classes:
        raise ValueError("No class data found in dataset folder.")

    with CLASSES_FILE.open("w", encoding="utf-8") as file:
        json.dump(classes, file, ensure_ascii=True)

    print("classes.json created successfully:", CLASSES_FILE)
    print("Classes:", classes)
