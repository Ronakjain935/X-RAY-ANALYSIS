# X-RAY SQUARED — Backend

> **Smarter X-Rays. Clearer AI Insights.**
>
> FastAPI backend for the X-RAY SQUARED academic AI-assisted chest X-ray
> screening platform. Designed to plug into a trained ResNet18 model that
> you train separately (e.g., in Google Colab) and place into
> `trained_models/`.

---

## ⚠️ Important Safety Notice

This is an **academic / research prototype**. It is **NOT** a medical
diagnosis system and does **not** replace a qualified healthcare
professional. The AI output is for screening and educational purposes only.
The final clinical decision always belongs to a qualified medical
professional.

Throughout the API we use accurate language:
- ✅ "AI-assisted screening", "model prediction", "model score",
  "prototype confidence", "workflow priority", "human review required"
- ❌ Never "100% accurate", "guaranteed diagnosis", "doctor replacement",
  "clinically proven", or "medical certainty"

---

## 📁 Folder structure

```
backend/
├── main.py                      # FastAPI entry point
├── config.py                    # Settings (reads .env)
├── requirements.txt
├── .env.example
├── README.md
│
├── api/                         # FastAPI routers
│   ├── __init__.py
│   ├── _helpers.py              # Case ID + confidence helpers
│   ├── analyze.py               # POST /api/analyze, /api/analyze-batch
│   ├── cases.py                 # GET/DELETE /api/cases
│   ├── reviews.py               # PATCH /api/cases/{id}/review
│   ├── reports.py               # GET /api/cases/{id}/report
│   └── analytics.py             # GET /api/analytics/summary
│
├── services/                    # Business logic
│   ├── __init__.py
│   ├── prediction.py            # ResNet18 loader + predict()
│   ├── preprocessing.py         # Image -> tensor (224x224, ImageNet norm)
│   ├── gradcam.py               # Grad-CAM heatmap + overlay
│   ├── image_quality.py         # Prototype quality check
│   ├── priority.py              # Workflow priority (NOT clinical severity)
│   └── report.py                # Report builder
│
├── models/                      # Database + Pydantic schemas
│   ├── __init__.py
│   ├── database.py              # SQLAlchemy engine + session
│   ├── case.py                  # Case ORM
│   └── schemas.py               # Pydantic request/response models
│
├── utils/
│   ├── __init__.py
│   ├── file_utils.py            # Safe filenames + save_upload
│   └── validation.py            # validate_image_file
│
├── trained_models/              # Place pneumonia_resnet18_best.pth here
│   └── README.md
│
├── uploads/                     # Saved X-ray images (auto-created)
├── results/                     # Grad-CAM outputs (auto-created)
│
└── tests/
    ├── __init__.py
    ├── test_health.py
    ├── test_quality.py
    └── test_api.py
```

---

## 🚀 Getting started (Windows / macOS / Linux)

### 1. Create a virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

> **PyTorch note:** The CPU-only wheel is the default. For GPU support,
> install torch + torchvision matching your CUDA version from
> https://pytorch.org/get-started/locally/ **before** running the line above,
> or replace the two PyTorch lines in `requirements.txt` with the
> CUDA-specific wheel URL.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if you need to change ports, CORS origins, or confidence
thresholds. Defaults work for local development.

### 4. Run the server

```bash
python main.py
# or:
uvicorn main:app --reload --port 8000
```

The server starts on **http://localhost:8000**.

- **Swagger docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health:** http://localhost:8000/health

The server starts successfully **even without the trained model** —
`/health` will report `model_available: false` and `/api/analyze` will
return HTTP 503.

---

## 🧠 Attaching the trained model

After you train your ResNet18 in Google Colab:

1. Save the model:
   ```python
   torch.save(model.state_dict(), "pneumonia_resnet18_best.pth")
   ```
2. Copy the `.pth` file into:
   ```
   backend/trained_models/pneumonia_resnet18_best.pth
   ```
3. Start (or restart) the backend.

The backend auto-detects the model on startup and loads it. **No code changes
required.**

### Model requirements

- Architecture: `torchvision.models.resnet18` with `fc = Linear(512, 2)`
- Class mapping (FIXED, do not change without retraining):
  - `0 -> NORMAL`
  - `1 -> PNEUMONIA`
- Checkpoint format: either a raw `state_dict` or a checkpoint dict with a
  `state_dict` / `model_state_dict` / `model` key.

---

## 📡 API endpoints

| Method   | Path                                | Description                                   |
|----------|-------------------------------------|-----------------------------------------------|
| `GET`    | `/health`                           | Backend health + model availability           |
| `GET`    | `/model-status`                     | Detailed model status (debugging)             |
| `POST`   | `/api/analyze`                      | Analyze a single X-ray image                  |
| `POST`   | `/api/analyze-batch`                | Analyze multiple X-ray images                 |
| `GET`    | `/api/cases`                        | List cases (paginated + filterable)           |
| `GET`    | `/api/cases/{case_id}`              | Get full case detail                          |
| `DELETE` | `/api/cases/{case_id}`              | Delete a case and its files                   |
| `PATCH`  | `/api/cases/{case_id}/review`       | Submit human review (final)                   |
| `GET`    | `/api/cases/{case_id}/report`       | AI-assisted case report (JSON)                |
| `GET`    | `/api/cases/{case_id}/report.txt`   | AI-assisted case report (plain text download) |
| `GET`    | `/api/analytics/summary`            | Dashboard analytics summary                   |

Static files: `/uploads/<filename>` and `/results/<filename>` serve saved
images and Grad-CAM outputs.

---

## 🔌 Frontend integration

### CORS

By default the backend allows `http://localhost:3000` and `http://localhost:3001`
(the Next.js dev ports). Override via `CORS_ORIGINS` in `.env`:

```
CORS_ORIGINS=http://localhost:3000,https://your-frontend.example.com
```

### Switching the Next.js frontend to the real backend

In `src/lib/api.ts` of the frontend, set:

```ts
const USE_MOCK = false;
const ANALYZE_ENDPOINT = "http://localhost:8000/api/analyze";
const ANALYZE_BATCH_ENDPOINT = "http://localhost:8000/api/analyze-batch";
```

The response shape matches what the frontend already expects.

---

## 📨 Example requests

### Analyze a single image

```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@chest_xray.jpg"
```

**Response (200):**

```json
{
  "case_id": "XR-000001",
  "filename": "chest_xray.jpg",
  "prediction": "PNEUMONIA",
  "score": 0.91,
  "confidence": "HIGH",
  "priority": "HIGH",
  "quality": {
    "status": "GOOD",
    "brightness": "GOOD",
    "contrast": "GOOD",
    "resolution": "GOOD"
  },
  "gradcam_url": "/results/XR-000001-gradcam.png",
  "review_status": "PENDING"
}
```

**Response when model is missing (503):**

```json
{
  "detail": {
    "error": "MODEL_NOT_AVAILABLE",
    "message": "The trained pneumonia model is not available. Please place pneumonia_resnet18_best.pth inside trained_models/."
  }
}
```

### Submit a human review

```bash
curl -X PATCH http://localhost:8000/api/cases/XR-000001/review \
  -H "Content-Type: application/json" \
  -d '{
    "human_decision": "AGREE_WITH_AI",
    "reviewer_notes": "Opacity in lower lobe consistent with consolidation.",
    "reviewer_name": "Dr. Rivera"
  }'
```

### Get analytics summary

```bash
curl http://localhost:8000/api/analytics/summary
```

---

## 🧪 Running tests

```bash
cd backend
pytest -v
```

Tests do **not** require the trained model — they verify:
- Health endpoint behavior
- Image validation (invalid files, empty files, unsupported types)
- Image quality heuristics
- Missing-model behavior (HTTP 503)
- Analytics summary shape
- 404 handling for unknown cases

---

## 🛡️ Safety & security

- ✅ Uploaded files are validated by extension, MIME type, size, dimensions
  and PIL readability.
- ✅ Filenames are replaced with random hex strings (no path traversal, no
  user-controlled filenames on disk).
- ✅ Upload size is limited (default 10 MB, configurable).
- ✅ Static file mounts only expose `uploads/` and `results/` — never the
  whole filesystem.
- ✅ No patient-identifying information is stored.
- ✅ Sensitive stack traces are not leaked to the frontend — errors are
  logged server-side and a clean JSON error is returned.

---

## 🚫 What this backend does NOT do

- ❌ Fabricate model predictions
- ❌ Generate fake Grad-CAM images
- ❌ Create fake cases or fake analytics
- ❌ Train the model
- ❌ Automatically retrain from reviewer feedback
- ❌ Override the human reviewer's decision
- ❌ Make clinical claims (accuracy %, "clinically proven", etc.)

---

## 📝 License

Academic / educational use. Not for clinical deployment.

---

**X-RAY SQUARED** — *Smarter X-Rays. Clearer AI Insights.*
