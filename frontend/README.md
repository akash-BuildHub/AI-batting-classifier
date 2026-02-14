# Cricket Shot Analysis Frontend

React frontend for uploading a batting video, showing processing states, and rendering model prediction results from the backend API.

## Tech Stack

- React (Create React App)
- Framer Motion
- Lucide React icons

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+
- Backend API running at `http://localhost:5000`

## Setup

```bash
cd frontend
npm install
```

## Environment

Create a `.env` file in `frontend/`:

```env
REACT_APP_API_URL=http://localhost:5000
```

If not set, the app defaults to `http://localhost:5000`.

## Run (Development)

```bash
cd frontend
npm start
```

Open `http://localhost:3000`.

## Build (Production)

```bash
cd frontend
npm run build
```

Output is generated in `frontend/build/`.

## Expected Backend Response

The UI expects `/predict` to return:

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

## Notes

- The graph is fixed to 10 classes:
  `cover, defense, flick, hook, late_cut, lofted, pull, square_cut, straight, sweep`.
- Legacy labels are normalized in UI mapping (`drive`, `legglance-flick`, `pullshot`).
