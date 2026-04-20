import numpy as np
import pickle
import os
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

MODEL_PATH = "health_risk_model.pkl"

# Number of symptoms in the feature vector (must match predict.py)
N_SYMPTOMS = 14


def generate_training_data(n_samples: int = 2000):
    """
    Generate synthetic training data for health risk prediction.

    Features:
      - 14 binary symptom flags
      - age (normalized 0–1)
      - blood pressure (0–1)
      - heart rate (normalized)

    Target:
      - risk_score (0.0 = no risk, 1.0 = critical)
    """
    np.random.seed(42)

    # Random symptom combinations
    symptoms = np.random.randint(0, 2, size=(n_samples, N_SYMPTOMS))
    ages     = np.random.uniform(0.05, 1.0, n_samples)        # normalized age
    bp       = np.random.uniform(0.0, 1.0, n_samples)         # blood pressure
    hr       = np.random.uniform(-0.3, 0.6, n_samples)        # normalized heart rate

    X = np.column_stack([symptoms, ages, bp, hr])

    # Risk scoring rules (simulated clinical logic):
    # - More symptoms = higher risk
    # - Chest pain (idx 4) or shortness of breath (idx 5) = critical flag
    # - High BP + age > 60 = elevated risk
    # - High heart rate = moderate risk flag

    symptom_count = symptoms.sum(axis=1)
    critical_flag = (symptoms[:, 4] | symptoms[:, 5]).astype(float)  # chest pain or SOB
    age_bp_risk   = ages * bp  # older + high BP = more risk

    y = (
        symptom_count * 0.04       # each symptom adds ~4% risk
        + critical_flag * 0.35     # critical symptoms jump risk significantly
        + age_bp_risk * 0.20       # age × BP interaction
        + np.abs(hr) * 0.10        # abnormal heart rate
        + np.random.normal(0, 0.03, n_samples)  # noise
    )

    y = np.clip(y, 0.0, 1.0)

    return X, y


def train_and_save_model(n_samples: int = 2000):
    """
    Train Gradient Boosting model and save to MODEL_PATH.
    Returns the trained model and evaluation metrics.
    """
    print(f" Generating {n_samples} training samples...")
    X, y = generate_training_data(n_samples)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print("  Training Gradient Boosting Regressor...")
    model = GradientBoostingRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=4,
        min_samples_leaf=5,
        random_state=42
    )
    model.fit(X_train, y_train)

    # Evaluate
    preds = model.predict(X_test)
    mae   = mean_absolute_error(y_test, preds)
    r2    = r2_score(y_test, preds)

    print(f" Training complete:")
    print(f"   MAE: {mae:.4f}")
    print(f"   R²:  {r2:.4f}")

    # Save model
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)

    print(f" Model saved to: {MODEL_PATH}")
    return model, {"mae": mae, "r2": r2}


if __name__ == "__main__":
    train_and_save_model()
