import json
import os
import tempfile
import threading
from pathlib import Path

import numpy as np
import tensorflow as tf
from flask import Flask, jsonify, request
from flask_cors import CORS

from config import IMG_SIZE, MODEL_PATH, SEQ_LEN
from data_loader import infer_dataset_classes
from model import build_model
from video_utils import video_to_windows


BASE_DIR = Path(__file__).resolve().parent
MODEL_FILE = BASE_DIR / MODEL_PATH
CLASSES_FILE = BASE_DIR / "classes.json"

app = Flask(__name__)
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
    if not MODEL_FILE.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_FILE}")
    try:
        return tf.keras.models.load_model(MODEL_FILE, compile=False)
    except Exception as exc:  # noqa: BLE001
        if num_classes is None:
            raise RuntimeError(
                "Model deserialization failed and fallback weight-loading cannot run without class count."
            ) from exc

        fallback = build_model(num_classes)
        fallback.load_weights(MODEL_FILE)
        return fallback


def _load_classes(expected_count=None):
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
    try:
        warmup_batch = np.zeros((1, SEQ_LEN, IMG_SIZE, IMG_SIZE, 3), dtype=np.float32)
        model(tf.constant(warmup_batch), training=False)
    except Exception as exc:  # noqa: BLE001
        startup_warnings.append(f"Warmup prediction skipped: {exc}")
    return model, classes, startup_warnings, None


model = None
classes = []
startup_warnings = []
startup_error = None
_model_init_lock = threading.Lock()
MAX_INFERENCE_WINDOWS = max(1, int(os.environ.get("MAX_INFERENCE_WINDOWS", "2")))


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


if os.environ.get("MODEL_WARMUP", "1") == "1":
    threading.Thread(target=ensure_model_loaded, daemon=True).start()


def _clamp(value, low=0.0, high=100.0):
    return max(low, min(high, float(value)))


def build_batting_analysis(probabilities, labels, vote_confidence=100.0, num_windows=1):
    """Build batting analysis from mean probabilities across all video windows.

    vote_confidence  – percentage of windows that agreed on the dominant shot (0-100).
    num_windows      – total number of windows analysed.
    """
    top_indices = np.argsort(probabilities)[::-1]
    top1 = float(probabilities[top_indices[0]] * 100.0)
    top2 = float(probabilities[top_indices[1]] * 100.0) if len(top_indices) > 1 else 0.0
    margin = max(0.0, top1 - top2)

    entropy = float(-np.sum(probabilities * np.log(probabilities + 1e-10)))
    max_entropy = float(np.log(max(len(probabilities), 2)))
    normalized_entropy = entropy / max_entropy

    shot_coverage = float(np.count_nonzero(probabilities > 0.10) / max(len(probabilities), 1))

    # Multi-window agreement is the primary reliability signal for consistency.
    consistency_score = _clamp(0.45 * top1 + 0.25 * margin + 0.30 * vote_confidence)
    control_score = _clamp((1.0 - normalized_entropy) * 100.0)
    adaptability_score = _clamp(shot_coverage * 100.0)
    batting_strength = int(round(_clamp(0.45 * consistency_score + 0.35 * control_score + 0.20 * adaptability_score)))

    shot_verified = vote_confidence >= 50.0

    if batting_strength >= 78:
        tier = "Elite"
        note = "Strong shot execution with high control and consistency."
    elif batting_strength >= 60:
        tier = "Strong"
        note = "Solid shot mechanics, but timing can improve under pressure."
    elif batting_strength >= 40:
        tier = "Moderate"
        note = "Base technique visible. Improve balance and bat swing repeatability."
    else:
        tier = "Weak"
        note = "Shot selection confidence is low. Focus on footwork and head position."

    # Technique quality considers both model confidence and cross-window agreement.
    if top1 >= 65 and vote_confidence >= 70:
        technique_quality = "Excellent"
    elif top1 >= 50 and vote_confidence >= 50:
        technique_quality = "Good"
    elif top1 >= 35 or vote_confidence >= 40:
        technique_quality = "Developing"
    else:
        technique_quality = "Needs Improvement"

    top_shot = labels[top_indices[0]]
    technique_match = "High" if top1 >= 60 else "Medium" if top1 >= 40 else "Low"

    if num_windows > 1:
        if shot_verified:
            verification_text = "Confirmed across the uploaded video segments."
        else:
            verification_text = "Mixed signals across the uploaded video segments. Use a clearer, single-shot recording for better results."
    else:
        verification_text = ""

    summary_parts = []
    if verification_text:
        summary_parts.append(verification_text)
    summary_parts.append(note)

    return {
        "batting_strength": batting_strength,
        "tier": tier,
        "technique_quality": technique_quality,
        "technique_match": technique_match,
        "consistency_score": round(consistency_score, 2),
        "control_score": round(control_score, 2),
        "adaptability_score": round(adaptability_score, 2),
        "shot_verified": shot_verified,
        "verification_confidence": round(vote_confidence, 1),
        "num_windows_analyzed": num_windows,
        "summary": " ".join(summary_parts),
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

        windows = video_to_windows(temp_path, max_windows=MAX_INFERENCE_WINDOWS)
        if windows is None:
            return jsonify(
                {
                    "error": "Could not read enough frames from the video. Use a clearer clip with at least 30 readable frames."
                }
            ), 400

        # Direct model call — faster than model.predict() for small batches
        # because it skips tf.data.Dataset creation overhead.
        inputs = np.array(windows, dtype=np.float32)
        all_preds = model(tf.constant(inputs), training=False).numpy()

        if all_preds.shape[1] != len(classes):
            return jsonify(
                {
                    "error": (
                        f"Model output classes ({all_preds.shape[1]}) do not match classes.json entries ({len(classes)}). "
                        "Regenerate classes.json for the trained model."
                    )
                }
            ), 500

        # Mean probabilities across all windows → used for the confidence chart.
        mean_probs = np.mean(all_preds, axis=0)

        # Majority vote across windows → most frequently predicted shot = verified result.
        top_per_window = np.argmax(all_preds, axis=1)
        vote_counts = np.bincount(top_per_window, minlength=len(classes))
        dominant_idx = int(np.argmax(vote_counts))
        num_windows = len(windows)
        vote_confidence = float(vote_counts[dominant_idx] / num_windows * 100.0)

        # Build sorted chart data from mean probabilities.
        items = [
            {"shot": label, "confidence": round(float(prob) * 100.0, 2)}
            for label, prob in zip(classes, mean_probs)
        ]
        items.sort(key=lambda item: item["confidence"], reverse=True)

        # Report the majority-voted shot as the top result (more reliable than argmax of mean).
        dominant_shot = classes[dominant_idx]
        dominant_confidence = round(float(mean_probs[dominant_idx] * 100.0), 2)

        analysis = build_batting_analysis(mean_probs, classes, vote_confidence, num_windows)

        return jsonify(
            {
                "predictions": items,
                "top_shot": dominant_shot,
                "top_confidence": dominant_confidence,
                "analysis": analysis,
            }
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
