
from pathlib import Path
import sys

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Add backend directory to Python's import path
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

# Import the trained ML prediction function
from model.predict import predict_message


# Initialize FastAPI
app = FastAPI(
    title="EmailShield API",
    description="ML-powered Spam Detection API",
    version="1.0.0"
)


# Allow React frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request schema
class MessageRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        description="Message to classify"
    )


# Health check endpoint
@app.get("/api/health")
def health_check():
    return {
        "status": "success",
        "message": "EmailShield API is running"
    }


# Spam prediction endpoint
@app.post("/api/predict")
def predict(request: MessageRequest):

    try:
        result = predict_message(request.message)

        return {
            "status": "success",
            "message": result["message"],
            "prediction": result["prediction"],
            "label": result["label"],
            "decision_score": result["decision_score"]
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Please check the backend logs."
        )
