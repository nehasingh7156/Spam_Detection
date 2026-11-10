
import os
import joblib

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "best_model.joblib"
)

# Load trained model
model = joblib.load(MODEL_PATH)


def predict_message(message):

    if not isinstance(message, str) or not message.strip():
        raise ValueError("Please enter a valid message.")

    prediction = model.predict([message])[0]

    # Linear SVM provides decision scores, not probabilities.
    score = float(model.decision_function([message])[0])

    return {
        "message": message,
        "prediction": "Spam" if prediction == 1 else "Ham",
        "label": int(prediction),
        "decision_score": round(score, 4)
    }


if __name__ == "__main__":

    test_messages = [
        "Congratulations! You have won a free prize. Call now!",
        "Hey, are we meeting for lunch today?"
    ]

    for message in test_messages:
        result = predict_message(message)

        print("\nMessage:", result["message"])
        print("Prediction:", result["prediction"])
        print("Decision Score:", result["decision_score"])
