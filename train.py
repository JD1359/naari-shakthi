"""
ml-service/train.py - Standalone Model Training Script

Run this script directly to train (or retrain) the health risk
prediction model and save it to disk:

    python train.py
    python train.py --samples 5000   # train on more data
    python train.py --output custom_model.pkl

The trained model is consumed by predict.py at inference time.
If the model file does not exist when the Flask server starts,
predict.py will call train_and_save_model() automatically.
"""

import argparse
import os
import sys

# ── Ensure the ml-service directory is in the Python path ────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from model import train_and_save_model, MODEL_PATH


def main():
    parser = argparse.ArgumentParser(
        description="Train the Naari Shakthi health risk prediction model."
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=2000,
        help="Number of synthetic training samples to generate (default: 2000)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=MODEL_PATH,
        help=f"Output path for the trained model file (default: {MODEL_PATH})",
    )
    args = parser.parse_args()

    print("=" * 55)
    print("  Naari Shakthi - Health Risk Model Training")
    print("=" * 55)
    print(f"  Samples  : {args.samples}")
    print(f"  Output   : {args.output}")
    print("=" * 55)

    # Temporarily override MODEL_PATH if a custom output was specified
    import model as model_module
    original_path = model_module.MODEL_PATH
    model_module.MODEL_PATH = args.output

    try:
        trained_model, metrics = train_and_save_model(n_samples=args.samples)

        print("\n Evaluation Metrics:")
        print(f"   Mean Absolute Error : {metrics['mae']:.4f}")
        print(f"   R² Score            : {metrics['r2']:.4f}")

        if metrics["r2"] >= 0.85:
            print("\n Model quality: GOOD  (R² ≥ 0.85)")
        elif metrics["r2"] >= 0.70:
            print("\n  Model quality: FAIR  (R² ≥ 0.70 - consider more samples)")
        else:
            print("\n Model quality: POOR  (R² < 0.70 - increase --samples)")

        print(f"\n Saved to: {args.output}")
        print("\nThe Flask ML service will load this model automatically on next start.")

    finally:
        model_module.MODEL_PATH = original_path


if __name__ == "__main__":
    main()
