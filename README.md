# AI Batting Classifier

Full-stack cricket batting analysis app. Upload a video from the React UI and the FastAPI backend returns shot predictions and a batting-strength breakdown.

## Tech Stack

- Backend: FastAPI, TensorFlow, OpenCV, NumPy, scikit-learn
- Frontend: React (Create React App), Framer Motion
- Serving: Uvicorn (plus `Procfile` for deployment)

## Project Structure

```text
AI batting classifier/
|- backend/
|  |- app.py
|  |- train.py
|  |- data_loader.py
|  |- model.py
|  |- video_utils.py
|  |- config.py
|  |- classes.json
|  `- cricket_shot_cnn_lstm.h5
|- frontend/
|  |- src/
|  |- public/
|  |- package.json
|  `- .env.development
|- requirements.txt
|- Procfile
|- runtime.txt
`- package.json
```

## Prerequisites

- Python 3.11
- Node.js 18+
- npm 9+

## Setup

1. Create and activate backend virtual environment:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ..\requirements.txt
```

2. Install frontend dependencies:

```powershell
cd ..\frontend
npm install
```

3. Optional frontend API override:

```env
REACT_APP_API_URL=http://localhost:5000
```

If `REACT_APP_API_URL` is not set, the frontend defaults to `http://<current-host>:5000`.

## Run Locally

Start backend (Terminal 1):

```powershell
cd backend
.\.venv\Scripts\python.exe app.py
```

Start frontend (Terminal 2):

```powershell
cd frontend
npm start
```

Run both with helper scripts from project root:

```powershell
npm run install:all
npm run full
```

URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## API Endpoints

- `GET /`: basic service metadata and endpoint hints.
- `GET /health`: model load status, classes, and startup warnings/errors.
- `POST /predict`: accepts `multipart/form-data` with `video` file and returns predictions + batting analysis.

Example:

```powershell
curl -X POST "http://localhost:5000/predict" -F "video=@sample.mp4"
```

## Training

1. Add dataset under `backend/dataset/` using either format:
- Class-folder format: one folder per class containing videos or frame directories.
- File-per-class format: one video file per class directly in `backend/dataset/`.

2. Train and regenerate `classes.json`:

```powershell
cd backend
.\.venv\Scripts\python.exe train.py
```

Training output:

- Model: `backend/cricket_shot_cnn_lstm.h5`
- Labels: `backend/classes.json`

## Runtime Notes

- `runtime.txt` pins Python version for platform deployment.
- `Procfile` starts API with:
  `uvicorn app:app --app-dir backend --host 0.0.0.0 --port $PORT`
- Optional backend env vars:
  `CORS_ALLOWED_ORIGINS`, `MAX_INFERENCE_WINDOWS`, `MODEL_WARMUP`
