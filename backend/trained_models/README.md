# Place your trained ResNet18 model here

The backend automatically loads a model from this directory on startup.

## Expected file

```
trained_models/pneumonia_resnet18_best.pth
```

## Model requirements

- **Architecture:** ResNet18 (torchvision)
- **Classes:** 2
  - `0 -> NORMAL`
  - `1 -> PNEUMONIA`
- **State dict format:** Either a raw `state_dict` OR a checkpoint dict
  containing a `state_dict` / `model_state_dict` / `model` key.
- **Final FC layer:** `torch.nn.Linear(512, 2)` (replacing the 1000-class
  ImageNet classifier).

## What happens when the file is missing?

The backend still starts successfully. The `/health` endpoint reports
`model_available: false`, and `/api/analyze` returns HTTP 503 with:

```json
{
  "error": "MODEL_NOT_AVAILABLE",
  "message": "The trained pneumonia model is not available. Please place pneumonia_resnet18_best.pth inside trained_models/."
}
```

## After training in Google Colab

1. Train your ResNet18 in Colab.
2. Save:
   ```python
   torch.save(model.state_dict(), "pneumonia_resnet18_best.pth")
   ```
3. Download the `.pth` file.
4. Copy it into this folder:
   ```
   backend/trained_models/pneumonia_resnet18_best.pth
   ```
5. Start (or restart) the backend — the model is loaded automatically.

You do NOT need to change any backend code to attach the trained model.
