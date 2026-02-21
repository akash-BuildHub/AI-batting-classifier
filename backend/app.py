import json
import os
import tempfile
import threading
from pathlib import Path

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

from config import MODEL_PATH
from video_utils import video_to_sequence


BASE_DIR = Path(__file__).resolve().parent
MODEL_FILE = BASE_DIR / MODEL_PATH
CLASSES_FILE = BASE_DIR / "classes.json"

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 30 * 1024 * 1024
CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "https://ai-batting-classifier-web.onrender.com",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ]
        }
    },
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def _load_model(num_classes=None):
    import tensorflow as tf

    if not MODEL_FILE.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_FILE}")
    try:
        return tf.keras.models.load_model(MODEL_FILE, compile=False)
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(
            "Failed to load model file. Ensure cricket_shot_cnn_lstm.h5 is a full Keras model compatible with TensorFlow 2.15.1."
        ) from exc


def _load_classes(expected_count=None):
    from data_loader import infer_dataset_classes

    file_classes = []
    if CLASSES_FILE.exists():
        with CLASSES_FILE.open("r", encoding="utf-8") as file:
            loaded = json.load(file)
            if isinstance(loaded, list):
                file_classes = loaded

    inferred = infer_dataset_classes()

    if expected_count is not None:
        if len(file_classes) == expected_count:
            return file_classes
        if len(inferred) == expected_count:
            return inferred
        if file_classes:
            return file_classes
        return inferred

    return file_classes or inferred


def _initialize():
    from data_loader import infer_dataset_classes

    startup_warnings = []
    initial_classes = _load_classes()
    model = _load_model(len(initial_classes) if initial_classes else None)
    output_shape = model.output_shape
    expected_num_classes = int(output_shape[-1]) if isinstance(output_shape, tuple) else int(output_shape[0][-1])
    classes = _load_classes(expected_num_classes)
    dataset_classes = infer_dataset_classes()
    if dataset_classes and len(dataset_classes) != len(classes):
        startup_warnings.append(
            "Dataset class count does not match model output count. Retrain and regenerate classes.json for this dataset."
        )
    return model, classes, startup_warnings, None


model = None
classes = []
startup_warnings = []
startup_error = None
_model_init_lock = threading.Lock()


def ensure_model_loaded():
    global model, classes, startup_warnings, startup_error

    if model is not None:
        return

    with _model_init_lock:
        if model is not None:
            return
        try:
            model, classes, startup_warnings, startup_error = _initialize()
        except Exception as exc:  # noqa: BLE001
            model, classes, startup_warnings, startup_error = None, [], [], str(exc)


def _clamp(value, low=0.0, high=100.0):
    return max(low, min(high, float(value)))


def build_batting_analysis(probabilities, labels):
    top_indices = np.argsort(probabilities)[::-1]
    top1 = float(probabilities[top_indices[0]] * 100.0)
    top2 = float(probabilities[top_indices[1]] * 100.0) if len(top_indices) > 1 else 0.0
    margin = max(0.0, top1 - top2)
    entropy = float(-np.sum(probabilities * np.log(probabilities + 1e-10)))
    max_entropy = float(np.log(max(len(probabilities), 2)))
    normalized_entropy = entropy / max_entropy

    shot_coverage = float(np.count_nonzero(probabilities > 0.10) / max(len(probabilities), 1))
    consistency_score = _clamp(0.65 * top1 + 0.35 * margin)
    control_score = _clamp((1.0 - normalized_entropy) * 100.0)
    adaptability_score = _clamp(shot_coverage * 100.0)
    batting_strength = int(round(_clamp(0.45 * consistency_score + 0.35 * control_score + 0.20 * adaptability_score)))

    if batting_strength >= 78:
        tier = "Elite"
        quality = "Excellent"
        note = "Strong shot execution with high control and consistency."
    elif batting_strength >= 60:
        tier = "Strong"
        quality = "Good"
        note = "Solid shot mechanics, but timing can improve under pressure."
    elif batting_strength >= 40:
        tier = "Moderate"
        quality = "Developing"
        note = "Base technique is visible. Improve balance and bat swing repeatability."
    else:
        tier = "Weak"
        quality = "Needs Improvement"
        note = "Shot selection confidence is low. Focus on footwork and head position."

    top_shot = labels[top_indices[0]]
    technique_match = "High" if top1 >= 60 else "Medium" if top1 >= 40 else "Low"

    return {
        "batting_strength": batting_strength,
        "tier": tier,
        "technique_quality": quality,
        "technique_match": technique_match,
        "consistency_score": round(consistency_score, 2),
        "control_score": round(control_score, 2),
        "adaptability_score": round(adaptability_score, 2),
        "summary": f"Primary shot pattern is '{top_shot}' ({top1:.1f}% confidence). {note}",
    }


@app.get("/health")
def health():
    return jsonify(
        {
            "ok": startup_error is None,
            "model_loaded": model is not None,
            "num_classes": len(classes),
            "classes": classes,
            "warnings": startup_warnings,
            "startup_error": startup_error,
        }
    )


@app.get("/")
def index():
    return jsonify(
        {
            "service": "ai-batting-classifier-api",
            "ok": startup_error is None,
            "health": "/health",
            "predict": "/predict (POST, form-data: video)",
        }
    )


@app.post("/predict")
def predict():
    ensure_model_loaded()

    if startup_error is not None or model is None:
        return jsonify({"error": startup_error}), 500

    if "video" not in request.files:
        return jsonify({"error": "Missing 'video' file in form-data"}), 400

    video = request.files["video"]
    if video.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    suffix = os.path.splitext(video.filename)[1] or ".mp4"
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            video.save(tmp.name)
            temp_path = tmp.name

        sequence = video_to_sequence(temp_path)
        if sequence is None:
            return jsonify(
                {
                    "error": "Could not read enough frames from the video. Use a clearer clip with at least 30 readable frames."
                }
            ), 400

        inputs = np.expand_dims(sequence, axis=0)
        predictions = model.predict(inputs, verbose=0)[0]
        if len(classes) != len(predictions):
            return jsonify(
                {
                    "error": (
                        f"Model output classes ({len(predictions)}) do not match classes.json entries ({len(classes)}). "
                        "Regenerate classes.json for the trained model."
                    )
                }
            ), 500

        items = [
            {
                "shot": label,
                "confidence": round(float(prob) * 100.0, 2),
            }
            for label, prob in zip(classes, predictions)
        ]
        items.sort(key=lambda item: item["confidence"], reverse=True)

        analysis = build_batting_analysis(predictions, classes)

        return jsonify(
            {
                "predictions": items,
                "top_shot": items[0]["shot"],
                "top_confidence": items[0]["confidence"],
                "analysis": analysis,
            }
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@app.errorhandler(413)
def too_large(_err):
    return jsonify({"error": "Video is too large. Use a file under 30MB."}), 413


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
