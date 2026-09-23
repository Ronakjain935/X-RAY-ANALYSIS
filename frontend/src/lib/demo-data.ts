import type { XRayCase } from "./types";

// Demo dataset — clearly labeled as DEMO DATA in the UI.
// These numbers are synthetic and intended for UI/UX prototyping only,
// not for clinical evaluation or statistical inference.

// Lightweight inline SVG chest X-ray placeholders (no external assets needed).
// They are stylized to look like radiographs but are NOT real medical images.
function xraySvg(seed: number, opacity = 0.95) {
  // Use different gradient patterns per seed to make cases visually distinguishable.
  const variants = [
    // Normal-looking denser lung fields (clear)
    `<radialGradient id='g${seed}' cx='50%' cy='50%' r='65%'>
       <stop offset='0%' stop-color='#0a0a0a'/>
       <stop offset='55%' stop-color='#1f2937'/>
       <stop offset='100%' stop-color='#020617'/>
     </radialGradient>`,
    // Pneumonia-like — opacity region in lower right lobe
    `<radialGradient id='g${seed}' cx='50%' cy='50%' r='65%'>
       <stop offset='0%' stop-color='#0a0a0a'/>
       <stop offset='55%' stop-color='#1f2937'/>
       <stop offset='100%' stop-color='#020617'/>
     </radialGradient>
     <radialGradient id='g${seed}o' cx='62%' cy='62%' r='18%'>
       <stop offset='0%' stop-color='#4b5563' stop-opacity='0.9'/>
       <stop offset='100%' stop-color='#4b5563' stop-opacity='0'/>
     </radialGradient>`,
    // Pneumonia-like — opacity region in left mid zone
    `<radialGradient id='g${seed}' cx='50%' cy='50%' r='65%'>
       <stop offset='0%' stop-color='#0a0a0a'/>
       <stop offset='55%' stop-color='#1f2937'/>
       <stop offset='100%' stop-color='#020617'/>
     </radialGradient>
     <radialGradient id='g${seed}o' cx='38%' cy='58%' r='20%'>
       <stop offset='0%' stop-color='#4b5563' stop-opacity='0.85'/>
       <stop offset='100%' stop-color='#4b5563' stop-opacity='0'/>
     </radialGradient>`,
  ];
  const idx = seed % variants.length;
  const overlay =
    idx === 0
      ? ""
      : `<circle cx='512' cy='512' r='110' fill='url(#g${seed}o)'/>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'>
       <defs>${variants[idx]}</defs>
       <rect width='1024' height='1024' fill='url(#g${seed})'/>
       <!-- stylized ribcage -->
       <g stroke='#0b1220' stroke-opacity='${opacity * 0.55}' stroke-width='3' fill='none'>
         <path d='M 200 240 Q 512 180 824 240'/>
         <path d='M 210 300 Q 512 250 834 300'/>
         <path d='M 220 360 Q 512 320 844 360'/>
         <path d='M 230 420 Q 512 390 854 420'/>
         <path d='M 240 480 Q 512 460 864 480'/>
         <path d='M 250 540 Q 512 530 874 540'/>
         <path d='M 260 600 Q 512 600 884 600'/>
       </g>
       <!-- spine -->
       <rect x='500' y='180' width='24' height='540' rx='12' fill='#0b1220' fill-opacity='0.6'/>
       <!-- heart shadow -->
       <path d='M 470 580 Q 430 620 440 700 Q 480 760 540 760 Q 600 760 620 720 Q 610 640 560 600 Z' fill='#0b1220' fill-opacity='0.55'/>
       ${overlay}
     </svg>`
  )}`;
}

const now = new Date();
function daysAgo(n: number) {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  d.setHours(9 + (n % 8), (n * 7) % 60, 0, 0);
  return d.toISOString();
}

export const DEMO_CASES: XRayCase[] = [
  {
    caseId: "XR-0001",
    date: daysAgo(0),
    prediction: "PNEUMONIA",
    score: 0.91,
    confidence: "HIGH",
    priority: "HIGH",
    quality: {
      status: "GOOD",
      brightness: "GOOD",
      contrast: "GOOD",
      resolution: "GOOD",
      visibility: "GOOD",
    },
    reviewStatus: "PENDING",
    gradcamAvailable: true,
    imageUrl: xraySvg(1),
    fileName: "chest_xr_001.jpg",
    fileSize: "1.2 MB",
  },
  {
    caseId: "XR-0002",
    date: daysAgo(0),
    prediction: "NORMAL",
    score: 0.12,
    confidence: "HIGH",
    priority: "LOW",
    quality: {
      status: "GOOD",
      brightness: "GOOD",
      contrast: "GOOD",
      resolution: "GOOD",
      visibility: "GOOD",
    },
    reviewStatus: "REVIEWED",
    reviewDecision: "AGREE",
    reviewerNotes: "Lung fields appear clear. No acute findings visible.",
    gradcamAvailable: true,
    imageUrl: xraySvg(0),
    fileName: "chest_xr_002.jpg",
    fileSize: "1.4 MB",
  },
  {
    caseId: "XR-0003",
    date: daysAgo(1),
    prediction: "PNEUMONIA",
    score: 0.62,
    confidence: "MEDIUM",
    priority: "MEDIUM",
    quality: {
      status: "MODERATE",
      brightness: "MODERATE",
      contrast: "GOOD",
      resolution: "MODERATE",
      visibility: "MODERATE",
      note: "Slight rotation detected; may affect analysis.",
    },
    reviewStatus: "PENDING",
    gradcamAvailable: true,
    imageUrl: xraySvg(2),
    fileName: "chest_xr_003.jpg",
    fileSize: "1.1 MB",
  },
  {
    caseId: "XR-0004",
    date: daysAgo(1),
    prediction: "PNEUMONIA",
    score: 0.74,
    confidence: "MEDIUM",
    priority: "HIGH",
    quality: {
      status: "GOOD",
      brightness: "GOOD",
      contrast: "GOOD",
      resolution: "GOOD",
      visibility: "GOOD",
    },
    reviewStatus: "REVIEWED",
    reviewDecision: "AGREE",
    reviewerNotes:
      "Opacity in the right lower lobe consistent with consolidation. Agree with AI flag — recommend clinical correlation.",
    gradcamAvailable: true,
    imageUrl: xraySvg(1),
    fileName: "chest_xr_004.jpg",
    fileSize: "1.3 MB",
  },
  {
    caseId: "XR-0005",
    date: daysAgo(2),
    prediction: "NORMAL",
    score: 0.34,
    confidence: "LOW",
    priority: "MEDIUM",
    quality: {
      status: "POOR",
      brightness: "POOR",
      contrast: "MODERATE",
      resolution: "MODERATE",
      visibility: "POOR",
      note: "Under-exposed image; quality may affect AI analysis.",
    },
    reviewStatus: "REVIEWED",
    reviewDecision: "NEEDS_REVIEW",
    reviewerNotes:
      "Image underexposed — recommend repeat study. AI score unreliable due to poor image quality.",
    gradcamAvailable: true,
    imageUrl: xraySvg(0),
    fileName: "chest_xr_005.jpg",
    fileSize: "0.9 MB",
  },
  {
    caseId: "XR-0006",
    date: daysAgo(2),
    prediction: "PNEUMONIA",
    score: 0.83,
    confidence: "HIGH",
    priority: "HIGH",
    quality: {
      status: "GOOD",
      brightness: "GOOD",
      contrast: "GOOD",
      resolution: "GOOD",
      visibility: "GOOD",
    },
    reviewStatus: "PENDING",
    gradcamAvailable: true,
    imageUrl: xraySvg(1),
    fileName: "chest_xr_006.jpg",
    fileSize: "1.5 MB",
  },
  {
    caseId: "XR-0007",
    date: daysAgo(3),
    prediction: "NORMAL",
    score: 0.08,
    confidence: "HIGH",
    priority: "LOW",
    quality: {
      status: "GOOD",
      brightness: "GOOD",
      contrast: "GOOD",
      resolution: "GOOD",
      visibility: "GOOD",
    },
    reviewStatus: "REVIEWED",
    reviewDecision: "AGREE",
    reviewerNotes: "Clear lung fields. No active cardiopulmonary findings.",
    gradcamAvailable: true,
    imageUrl: xraySvg(0),
    fileName: "chest_xr_007.jpg",
    fileSize: "1.2 MB",
  },
  {
    caseId: "XR-0008",
    date: daysAgo(3),
    prediction: "PNEUMONIA",
    score: 0.45,
    confidence: "LOW",
    priority: "MEDIUM",
    quality: {
      status: "MODERATE",
      brightness: "GOOD",
      contrast: "MODERATE",
      resolution: "MODERATE",
      visibility: "MODERATE",
    },
    reviewStatus: "REVIEWED",
    reviewDecision: "DISAGREE",
    reviewerNotes:
      "AI flagged possible opacity but visual review shows chronic changes only. Disagree with AI prediction.",
    gradcamAvailable: true,
    imageUrl: xraySvg(2),
    fileName: "chest_xr_008.jpg",
    fileSize: "1.0 MB",
  },
  {
    caseId: "XR-0009",
    date: daysAgo(4),
    prediction: "NORMAL",
    score: 0.18,
    confidence: "HIGH",
    priority: "LOW",
    quality: {
      status: "GOOD",
      brightness: "GOOD",
      contrast: "GOOD",
      resolution: "GOOD",
      visibility: "GOOD",
    },
    reviewStatus: "REVIEWED",
    reviewDecision: "AGREE",
    reviewerNotes: "Routine screening — no acute findings.",
    gradcamAvailable: true,
    imageUrl: xraySvg(0),
    fileName: "chest_xr_009.jpg",
    fileSize: "1.3 MB",
  },
  {
    caseId: "XR-0010",
    date: daysAgo(4),
    prediction: "PNEUMONIA",
    score: 0.69,
    confidence: "MEDIUM",
    priority: "HIGH",
    quality: {
      status: "GOOD",
      brightness: "GOOD",
      contrast: "GOOD",
      resolution: "GOOD",
      visibility: "GOOD",
    },
    reviewStatus: "PENDING",
    gradcamAvailable: true,
    imageUrl: xraySvg(1),
    fileName: "chest_xr_010.jpg",
    fileSize: "1.4 MB",
  },
  {
    caseId: "XR-0011",
    date: daysAgo(5),
    prediction: "PNEUMONIA",
    score: 0.88,
    confidence: "HIGH",
    priority: "HIGH",
    quality: {
      status: "GOOD",
      brightness: "GOOD",
      contrast: "GOOD",
      resolution: "GOOD",
      visibility: "GOOD",
    },
    reviewStatus: "REVIEWED",
    reviewDecision: "AGREE",
    reviewerNotes:
      "Right lower lobe consolidation with air bronchogram. AI prediction confirmed. Recommend clinical correlation.",
    gradcamAvailable: true,
    imageUrl: xraySvg(1),
    fileName: "chest_xr_011.jpg",
    fileSize: "1.6 MB",
  },
  {
    caseId: "XR-0012",
    date: daysAgo(5),
    prediction: "NORMAL",
    score: 0.22,
    confidence: "MEDIUM",
    priority: "LOW",
    quality: {
      status: "MODERATE",
      brightness: "MODERATE",
      contrast: "MODERATE",
      resolution: "GOOD",
      visibility: "MODERATE",
    },
    reviewStatus: "PENDING",
    gradcamAvailable: true,
    imageUrl: xraySvg(0),
    fileName: "chest_xr_012.jpg",
    fileSize: "1.1 MB",
  },
];

export function generateCaseId(): string {
  const id = Math.floor(Math.random() * 9000) + 13;
  return `XR-${String(id).padStart(4, "0")}`;
}

export function makePlaceholderXray(seed: number) {
  return xraySvg(seed);
}
