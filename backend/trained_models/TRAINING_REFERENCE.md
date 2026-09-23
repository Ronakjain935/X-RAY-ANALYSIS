# X-RAY SQUARED — Sample Model Training Reference (Google Colab)

This is a **reference** notebook script for training the ResNet18 model
that plugs into the backend. Save the produced
`pneumonia_resnet18_best.pth` into `backend/trained_models/`.

> This is NOT executed by the backend. It is provided only as a starting
> point for your own training pipeline.

---

## Cell 1 — Install dependencies (Colab)

```python
!pip install -q torch torchvision pillow
```

## Cell 2 — Imports

```python
import os
import copy
import time
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
from pathlib import Path
```

## Cell 3 — Config

```python
# Upload your dataset to Google Drive and mount it, OR upload directly.
DATA_DIR = "/content/data/chest_xray"   # subfolders: NORMAL/ and PNEUMONIA/
BATCH_SIZE = 32
NUM_EPOCHS = 15
LR = 1e-4
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print("Device:", DEVICE)
```

## Cell 4 — Data transforms (must match backend preprocessing!)

```python
# IMPORTANT: The validation transform MUST match services/preprocessing.py
IMG_SIZE = 224
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

train_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(5),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])

eval_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])
```

## Cell 5 — Datasets & DataLoaders

```python
train_ds = datasets.ImageFolder(os.path.join(DATA_DIR, "train"), transform=train_tf)
val_ds   = datasets.ImageFolder(os.path.join(DATA_DIR, "val"),   transform=eval_tf)

# IMPORTANT: ImageFolder sorts class names alphabetically.
# So class 0 = NORMAL, class 1 = PNEUMONIA — which matches the backend mapping.
print("Class mapping:", train_ds.class_to_idx)

train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=2)
val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=2)
```

## Cell 6 — Build ResNet18 with 2 output classes

```python
model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
model.fc = nn.Linear(model.fc.in_features, 2)  # 2 classes: NORMAL, PNEUMONIA
model = model.to(DEVICE)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=LR)
```

## Cell 7 — Training loop

```python
best_val_acc = 0.0
best_state = copy.deepcopy(model.state_dict())

for epoch in range(NUM_EPOCHS):
    t0 = time.time()
    # ---- Train ----
    model.train()
    train_loss, train_correct, train_total = 0.0, 0, 0
    for x, y in train_loader:
        x, y = x.to(DEVICE), y.to(DEVICE)
        optimizer.zero_grad()
        out = model(x)
        loss = criterion(out, y)
        loss.backward()
        optimizer.step()
        train_loss += loss.item() * x.size(0)
        train_correct += (out.argmax(1) == y).sum().item()
        train_total += x.size(0)

    # ---- Validate ----
    model.eval()
    val_loss, val_correct, val_total = 0.0, 0, 0
    with torch.no_grad():
        for x, y in val_loader:
            x, y = x.to(DEVICE), y.to(DEVICE)
            out = model(x)
            loss = criterion(out, y)
            val_loss += loss.item() * x.size(0)
            val_correct += (out.argmax(1) == y).sum().item()
            val_total += x.size(0)

    val_acc = val_correct / val_total
    print(f"Epoch {epoch+1}/{NUM_EPOCHS} ({time.time()-t0:.1f}s) "
          f"train_loss={train_loss/train_total:.4f} "
          f"train_acc={train_correct/train_total:.4f} "
          f"val_loss={val_loss/val_total:.4f} "
          f"val_acc={val_acc:.4f}")

    if val_acc > best_val_acc:
        best_val_acc = val_acc
        best_state = copy.deepcopy(model.state_dict())

print(f"\nBest validation accuracy: {best_val_acc:.4f}")
```

## Cell 8 — Save the model

```python
# IMPORTANT: save as a raw state_dict so the backend can load it directly.
torch.save(best_state, "pneumonia_resnet18_best.pth")
print("Saved pneumonia_resnet18_best.pth")
print("Class mapping: 0=NORMAL, 1=PNEUMONIA")
```

## Cell 9 — Download

```python
from google.colab import files
files.download("pneumonia_resnet18_best.pth")
```

---

## After downloading

1. Copy `pneumonia_resnet18_best.pth` into `backend/trained_models/`.
2. Start (or restart) the FastAPI backend.
3. Verify with: `curl http://localhost:8000/health` — should return
   `"model_available": true`.

That's it — the backend will automatically start using your trained model
for `/api/analyze` requests.
