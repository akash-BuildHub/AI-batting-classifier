# AI Batting Classifier

Full-stack cricket shot classification app that predicts batting shot type from uploaded video and returns a batting-strength analysis.

## Project Structure

```text
AI batting classifier/
|- backend/
|  |- app.py
|  |- train.py
|  |- requirements.txt
|  |- dataset/
|  |- cricket_shot_cnn_lstm.h5
|  `- classes.json
|- frontend/
|  |- src/
|  |- public/
|  `- package.json
`- .gitignore
```

## Tech Stack

- Backend: Python, Flask, TensorFlow, OpenCV, NumPy
- Frontend: React (Create React App), Framer Motion

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

## Backend Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Frontend Setup

```powershell
cd frontend
npm install
```

Optional environment file in `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

## Run the App

Start backend:

```powershell
cd backend
.\.venv\Scripts\python.exe app.py
```

Start frontend (new terminal):

```powershell
cd frontend
npm start
```

Run both from project root:

```powershell
npm run install:all   # first time only
npm run full
```

Or run both from `frontend`:

```powershell
cd frontend
npm run full
```

Frontend URL: `http://localhost:3000`

Backend URL: `http://localhost:5000`

## API

### `GET /health`
Returns model and startup status.

### `POST /predict`
Accepts form-data with a `video` file and returns predictions plus batting analysis.

Example response:

```json
{
  "predictions": [{ "shot": "cover", "confidence": 83.7 }],
  "top_shot": "cover",
  "top_confidence": 83.7,
  "analysis": {
    "batting_strength": 68,
    "tier": "Strong",
    "technique_quality": "Good",
    "technique_match": "High",
    "consistency_score": 70.0,
    "control_score": 62.0,
    "adaptability_score": 20.0,
    "summary": "..."
  }
}
```

## Training

To retrain the model and regenerate `classes.json`:

```powershell
cd backend
.\.venv\Scripts\python.exe train.py
```

Dataset can be structured as either:

- Class folders under `backend/dataset/` containing videos or frame directories
- One video file per class directly inside `backend/dataset/`

## Notes

- Current model file: `backend/cricket_shot_cnn_lstm.h5`
- If class count and model output mismatch, retrain and regenerate `classes.json`.

## Deploy on Render

This repo includes `render.yaml` for Blueprint deployment of:

- `ai-batting-classifier-api` (Flask web service)
- `ai-batting-classifier-web` (React static site)

Steps:

1. Push this repository to GitHub.
2. In Render, click **New +** -> **Blueprint**.
3. Select this repository and deploy.

Render will provision both services and wire `REACT_APP_API_URL` automatically.

