from flask import Flask, request, jsonify
from predict import predict_health_risk
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok", "service": "naari-shakthi-ml"})


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body is required"}), 400

    required = ["age", "symptoms"]
    missing  = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    try:
        result = predict_health_risk(
            age           = data["age"],
            symptoms      = data["symptoms"],
            blood_pressure= data.get("bloodPressure", "normal"),
            heart_rate    = data.get("heartRate", 72),
        )
        app.logger.info(f"Prediction for user {data.get('userId')}: risk={result['risk_score']}")
        return jsonify(result)

    except Exception as e:
        app.logger.error(f"Prediction error: {e}")
        return jsonify({"error": "Prediction failed", "detail": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
