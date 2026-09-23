# X-RAY SQUARED — Frontend

Next.js + TypeScript + Tailwind CSS + shadcn/ui frontend for the X-RAY SQUARED
AI-assisted chest X-ray screening platform.

## Setup

```bash
npm install
# or: bun install
```

## Run

```bash
npm run dev
# or: bun run dev
```

Open http://localhost:3000

## Environment

The `.env.local` file is pre-configured:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

- **Set** → LIVE mode (real FastAPI + PyTorch predictions)
- **Unset or unreachable** → DEMO mode (clearly-labeled synthetic data)

## Lint

```bash
npm run lint
```

## Pages

1. Dashboard — KPIs, recent cases, AI review queue
2. Analyze X-Ray — Upload + AI screening + Grad-CAM + human review + report
3. Cases — Search/filter/open/delete cases
4. History — Previous analyses
5. Reports — Generated reports
6. Analytics — Charts + AI-human agreement metrics
7. How It Works — 6-step workflow + architecture diagram
8. About — Project info + responsible use
9. Settings — Theme, notifications, preferences
10. Help — FAQ + glossary
