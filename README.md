# X-RAY SQUARED

> **Smarter X-Rays. Clearer AI Insights.**

An academic AI-assisted chest X-ray screening platform with explainability
(Grad-CAM), uncertainty awareness, workflow prioritization and
human-in-the-loop review.

> ⚠️ This is an academic/research prototype. It is **NOT** a medical
> diagnosis system and does **not** replace a qualified healthcare
> professional. The final medical decision always remains with the human
> reviewer.

---

## 📁 Project Structure

```
X-RAY-SQUARED/
├── frontend/          # Next.js + TypeScript + Tailwind + shadcn/ui
├── backend/           # FastAPI + PyTorch + SQLAlchemy + SQLite
├── README.md          # This file
└── .gitignore
```

---

## ✨ Features

- **Real FastAPI + PyTorch backend** — trained ResNet18 model is included
  in `backend/trained_models/pneumonia_resnet18_best.pth` (43 MB).
- **Real Grad-CAM** — generated using the actual trained model.
- **Real model predictions** — never fabricated. When the model is missing,
  `/api/analyze` returns HTTP 503 `MODEL_NOT_AVAILABLE`.
- **Premium Next.js frontend** — 10 pages, X-ray viewer with Zoom/Fit/Reset,
  AI scanning animation, clearly-labeled Live/Demo mode badges.
- **Live + Demo modes** — set `NEXT_PUBLIC_API_URL` to enable live mode;
  when unset or backend unreachable, the UI falls back to clearly-labeled
  DEMO data.
- **Human-in-the-loop** — when live, the Human Review component POSTs
  reviews to `PATCH /api/cases/{id}/review` (the AI cannot override them).
- **SQLite persistence** — every analysis is persisted with full prediction,
  score, uncertainty, probabilities, quality, Grad-CAM path, review status,
  and reviewer notes.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm (or bun)
- **Python** 3.11+
- The trained model is already included at
  `backend/trained_models/pneumonia_resnet18_best.pth`

### Step 1 — Start the backend

```bash
cd backend

# Create a virtual environment
python -m venv .venv

# Activate it
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env template (already done, but just in case)
cp .env.example .env

# Run the server
uvicorn main:app --reload --port 8000
```

The backend starts on http://localhost:8000.

Verify:
```bash
curl http://localhost:8000/health
# {"status":"ok","model_available":true}
```

Swagger docs: http://localhost:8000/docs

### Step 2 — Start the frontend

In a separate terminal:

```bash
cd frontend

# Install dependencies
npm install
# (or: bun install)

# The .env.local file is pre-configured with:
#   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
# If you need to change it, edit .env.local

# Run the dev server
npm run dev
# (or: bun run dev)
```

Open http://localhost:3000 — the header shows a green **"Live Backend"**
badge, and `Analyze X-Ray` runs the real PyTorch model.

---

## 🧠 Model Information

- **Architecture:** ResNet18 (torchvision)
- **Classes:** 2 — `0: NORMAL`, `1: PNEUMONIA`
- **Input:** 224×224 RGB (grayscale converted to RGB), ImageNet normalization
- **File:** `backend/trained_models/pneumonia_resnet18_best.pth` (43 MB)
- **Loading:** Automatic on backend startup. If the file is missing, the
  backend still starts but `/api/analyze` returns HTTP 503.

To replace with your own trained model, see
`backend/trained_models/TRAINING_REFERENCE.md` for a sample Google Colab
training notebook.

---

## 📡 API Endpoints

| Method   | Path                                | Description                                  |
|----------|-------------------------------------|----------------------------------------------|
| `GET`    | `/health`                           | Backend health + model availability          |
| `POST`   | `/api/analyze`                      | Analyze a single X-ray (multipart `file`)    |
| `POST`   | `/api/analyze-batch`                | Analyze multiple X-rays                       |
| `GET`    | `/api/cases`                        | List cases (paginated + filterable)          |
| `GET`    | `/api/cases/{case_id}`              | Get full case detail                          |
| `DELETE` | `/api/cases/{case_id}`              | Delete a case + its files                     |
| `PATCH`  | `/api/cases/{case_id}/review`       | Submit human review (final)                   |
| `GET`    | `/api/cases/{case_id}/report`       | AI-assisted case report (JSON)                |
| `GET`    | `/api/cases/{case_id}/report.txt`   | AI-assisted case report (plain text)          |
| `GET`    | `/api/analytics/summary`            | Dashboard analytics summary                   |
| `GET`    | `/uploads/{filename}`               | Static — saved X-ray images                   |
| `GET`    | `/results/{filename}`               | Static — Grad-CAM outputs                     |

---

## 🧪 Testing

### Backend tests

```bash
cd backend
source .venv/bin/activate
pytest -v
```

### Frontend lint

```bash
cd frontend
npm run lint
```

---

## 🛡️ Safety & Responsible Use

- ❌ Does **not** fabricate model predictions, Grad-CAMs, cases, or analytics
- ❌ Does **not** call the raw model score a "calibrated probability"
- ❌ Does **not** present Grad-CAM as proof of disease
- ❌ Does **not** call case priority "clinical severity"
- ❌ Does **not** let AI override a human review decision
- ❌ Does **not** claim "100% accurate", "clinically proven", or "doctor replacement"

All demo numbers are clearly labeled with a **Demo Data** badge. Live mode
shows a green **Live Backend** badge.

---

## 📚 Documentation

- **`backend/README.md`** — Backend setup, model integration, security
- **`backend/trained_models/TRAINING_REFERENCE.md`** — Sample Colab notebook
- **FastAPI Swagger** — http://localhost:8000/docs (when backend is running)
- **In-app pages:** Dashboard, Analyze X-Ray, Cases, History, Reports,
  Analytics, How It Works, About, Settings, Help

---

## 📝 License

Academic / educational use. Not for clinical deployment.

---

**X-RAY SQUARED** — *Smarter X-Rays. Clearer AI Insights.*
