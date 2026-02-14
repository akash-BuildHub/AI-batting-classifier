import json
from pathlib import Path

from config import BATCH_SIZE, EPOCHS, MODEL_PATH
from data_loader import load_dataset
from model import build_model


def train():
    (X_train, X_test, y_train, y_test), classes = load_dataset()

    model = build_model(len(classes))
    model.summary()

    model.fit(
        X_train,
        y_train,
        validation_data=(X_test, y_test),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
    )

    model.save(MODEL_PATH)

    classes_file = Path(__file__).resolve().parent / "classes.json"
    with classes_file.open("w", encoding="utf-8") as file:
        json.dump(classes, file, ensure_ascii=True)

    print("Model saved:", MODEL_PATH)
    print("Classes saved:", classes_file)


if __name__ == "__main__":
    train()
