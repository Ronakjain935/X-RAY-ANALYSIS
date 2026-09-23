"""Create a minimal ResNet18 checkpoint for end-to-end smoke testing.

This is NOT a trained model — it's randomly initialized weights used ONLY
to verify that the backend's loading + inference + Grad-CAM pipeline works.

In production, replace this file with your real trained checkpoint:
    pneumonia_resnet18_best.pth

Run:
    python3 tests/_make_dummy_model.py
"""
from __future__ import annotations

import sys
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import torch
from torchvision import models

OUT_PATH = Path(__file__).resolve().parent.parent / "trained_models" / "pneumonia_resnet18_best.pth"


def main() -> int:
    print(f"Building ResNet18 with 2-class output...")
    model = models.resnet18(weights=None)
    model.fc = torch.nn.Linear(model.fc.in_features, 2)

    print(f"Saving random-initialized state_dict to {OUT_PATH}")
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), OUT_PATH)

    print("Done. Backend will now load this file and serve REAL inference requests.")
    print("Class mapping: 0=NORMAL, 1=PNEUMONIA")
    print()
    print("NOTE: This model is RANDOMLY initialized — predictions are meaningless.")
    print("Replace it with your trained checkpoint for actual screening use.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
