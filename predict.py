
import numpy as np
import os
import pickle
from model import train_and_save_model, MODEL_PATH

# ── Symptom vocabulary ────────────────────────────────────────────────────────
SYMPTOMS = [
    "fever", "cough", "headache", "fatigue", "chest_pain",
    "shortness_of_breath", "nausea", "vomiting", "diarrhea",
    "abdominal_pain", "dizziness", "rash", "joint_pain", "back_pain",
]

MEDICINE_MAP = {
    "fever":               ["Paracetamol 500mg", "Ibuprofen 400mg"],
    "cough":               ["Dextromethorphan Syrup", "Ambroxol 30mg"],
    "headache":            ["Paracetamol 500mg", "Aspirin 300mg"],
    "chest_pain":          ["Refer to cardiologist immediately"],
    "shortness_of_breath": ["Seek emergency care immediately"],
    "nausea":              ["Ondansetron 4mg", "Domperidone 10mg"],
    "diarrhea":            ["ORS Solution", "Loperamide 2mg"],
    "dizziness":           ["Meclizine 25mg", "Rest and hydration"],
    "rash":                ["Cetirizine 10mg", "Calamine lotion"],
    "joint_pain":          ["Diclofenac 50mg", "Physiotherapy advised"],
}

RISK_ADVICE = {
    "low":      "Rest, stay hydrated, and monitor symptoms. No immediate medical attention required.",
    "moderate": "Consult a general physician within 24–48 hours.",
    "high":     "Seek medical attention today. Visit a clinic or hospital.",
    "critical": "EMERGENCY: Seek immediate medical care. Call emergency services.",
}


def encode_symptoms(symptoms: list) -> np.ndarray:
    """One-hot encode symptoms against the known symptom vocabulary."""
    vector = np.zeros(len(SYMPTOMS))
    for s in symptoms:
        s_normalized = s.lower().strip().replace(" ", "_")
        if s_normalized in SYMPTOMS:
            vector[SYMPTOMS.index(s_normalized)] = 1
    return vector


def encode_bp(bp: str) -> float:
    """Encode blood pressure category as numeric."""
    bp_map = {"low": 0.0, "normal": 0.5, "elevated": 0.7, "high": 1.0, "very_high": 1.0}
    return bp_map.get(bp.lower().replace(" ", "_"), 0.5)


def load_model():
    """Load trained model from disk. Train if not found."""
    if not os.path.exists(MODEL_PATH):
        print("  Model not found. Training now...")
        train_and_save_model()
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)


def predict_health_risk(
    age: int,
    symptoms: list,
    blood_pressure: str = "normal",
    heart_rate: int = 72
) -> dict:
    """
    Predict health risk level and return medicine recommendations.

    Args:
        age:            Patient age in years.
        symptoms:       List of symptom strings.
        blood_pressure: 'low' | 'normal' | 'elevated' | 'high'
        heart_rate:     BPM (beats per minute)

    Returns:
        dict with risk_score, recommendation, suggested_medicines, advice
    """
    model = load_model()

    # Build feature vector
    symptom_vec = encode_symptoms(symptoms)
    bp_encoded  = encode_bp(blood_pressure)
    hr_norm     = (heart_rate - 60) / 100.0  # Normalize around resting HR

    features = np.concatenate([
        symptom_vec,
        [age / 100.0, bp_encoded, hr_norm]
    ]).reshape(1, -1)

    # Predict risk score (0.0 – 1.0)
    risk_score = float(model.predict(features)[0])
    risk_score = max(0.0, min(1.0, risk_score))  # Clamp

    # Map score to category
    if risk_score < 0.25:
        category = "low"
    elif risk_score < 0.50:
        category = "moderate"
    elif risk_score < 0.75:
        category = "high"
    else:
        category = "critical"

    # Collect medicine recommendations for detected symptoms
    medicines = []
    for symptom in symptoms:
        s = symptom.lower().strip().replace(" ", "_")
        if s in MEDICINE_MAP:
            medicines.extend(MEDICINE_MAP[s])

    medicines = list(dict.fromkeys(medicines))  # Deduplicate, preserve order

    return {
        "risk_score":        round(risk_score, 4),
        "recommendation":    category.upper(),
        "suggested_medicines": medicines[:5],   # Cap at 5 suggestions
        "advice":            RISK_ADVICE[category],
        "symptoms_detected": [s for s in symptoms if s.lower().replace(" ", "_") in SYMPTOMS],
    }


if __name__ == "__main__":
    result = predict_health_risk(
        age=35,
        symptoms=["fever", "headache", "fatigue"],
        blood_pressure="elevated",
        heart_rate=95
    )
    print("\n Prediction Result:")
    for k, v in result.items():
        print(f"   {k}: {v}")
