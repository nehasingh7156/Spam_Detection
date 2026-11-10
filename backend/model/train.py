
import os
import joblib
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer

from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)


# ==========================================
# 1. CONFIGURATION
# ==========================================

DATASET_PATH = "dataset/sms_spam.csv"
MODEL_DIR = "backend/model"
RESULT_DIR = "backend/model/results"

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

print("\n========== EMAILSHIELD MODEL TRAINING ==========")


# ==========================================
# 2. LOAD DATASET
# ==========================================

print("\nLoading dataset...")

df = pd.read_csv(DATASET_PATH)

df = df[["sms", "label"]].copy()
df.dropna(subset=["sms", "label"], inplace=True)

df["sms"] = df["sms"].astype(str).str.strip()
df = df[df["sms"] != ""]

df["label"] = df["label"].astype(int)

print("Original dataset size:", len(df))


# ==========================================
# 3. HANDLE DUPLICATES
# ==========================================

print("\nChecking duplicate messages...")

# Identify messages assigned conflicting labels
conflicts = (
    df.groupby("sms")["label"]
    .nunique()
)

conflicting_messages = conflicts[conflicts > 1].index

print("Messages with conflicting labels:", len(conflicting_messages))

# Exclude ambiguous messages
df = df[~df["sms"].isin(conflicting_messages)].copy()

# Remove exact duplicate messages
df.drop_duplicates(subset=["sms"], keep="first", inplace=True)

print("Dataset size after cleaning:", len(df))

print("\nClass distribution:")
print(df["label"].value_counts())


# ==========================================
# 4. SEPARATE FEATURES AND LABELS
# ==========================================

X = df["sms"]
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==========================================
# 5. DEFINE MACHINE LEARNING MODELS
# ==========================================

models = {
    "Naive Bayes": MultinomialNB(alpha=0.5),

    "Logistic Regression": LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        random_state=42
    ),

    "Linear SVM": LinearSVC(
        class_weight="balanced",
        random_state=42
    )
}


# ==========================================
# 6. TRAIN AND EVALUATE MODELS
# ==========================================

results = []
trained_models = {}

for model_name, classifier in models.items():

    print("\n" + "=" * 50)
    print("Training:", model_name)
    print("=" * 50)

    # TF-IDF and classifier in one pipeline
    pipeline = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                lowercase=True,
                ngram_range=(1, 2),
                min_df=2,
                max_features=30000,
                sublinear_tf=True
            )
        ),
        ("classifier", classifier)
    ])

    # Train
    pipeline.fit(X_train, y_train)

    # Predict
    y_pred = pipeline.predict(X_test)

    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(
        y_test, y_pred, zero_division=0
    )
    recall = recall_score(
        y_test, y_pred, zero_division=0
    )
    f1 = f1_score(
        y_test, y_pred, zero_division=0
    )

    # ROC-AUC using probability or decision scores
    if hasattr(pipeline, "predict_proba"):
        scores = pipeline.predict_proba(X_test)[:, 1]
    else:
        scores = pipeline.decision_function(X_test)

    roc_auc = roc_auc_score(y_test, scores)

    print("\nAccuracy:", round(accuracy, 4))
    print("Spam Precision:", round(precision, 4))
    print("Spam Recall:", round(recall, 4))
    print("Spam F1-score:", round(f1, 4))
    print("ROC-AUC:", round(roc_auc, 4))

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            y_pred,
            target_names=["Ham", "Spam"],
            zero_division=0
        )
    )

    # Save trained pipeline
    safe_name = model_name.lower().replace(" ", "_")

    model_path = os.path.join(
        MODEL_DIR,
        f"{safe_name}.joblib"
    )

    joblib.dump(pipeline, model_path)

    trained_models[model_name] = pipeline

    # Save confusion matrix
    cm = confusion_matrix(y_test, y_pred)

    plt.figure(figsize=(6, 5))

    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["Ham", "Spam"],
        yticklabels=["Ham", "Spam"]
    )

    plt.title(f"{model_name} - Confusion Matrix")
    plt.xlabel("Predicted Label")
    plt.ylabel("Actual Label")
    plt.tight_layout()

    plt.savefig(
        os.path.join(
            RESULT_DIR,
            f"{safe_name}_confusion_matrix.png"
        )
    )

    plt.close()

    # Store metrics
    results.append({
        "Model": model_name,
        "Accuracy": accuracy,
        "Precision": precision,
        "Recall": recall,
        "F1 Score": f1,
        "ROC AUC": roc_auc
    })


# ==========================================
# 7. COMPARE ALL MODELS
# ==========================================

results_df = pd.DataFrame(results)

results_df = results_df.sort_values(
    by="F1 Score",
    ascending=False
)

print("\n========== MODEL COMPARISON ==========")
print(results_df.to_string(index=False))

results_df.to_csv(
    os.path.join(RESULT_DIR, "model_comparison.csv"),
    index=False
)


# ==========================================
# 8. SAVE BEST MODEL
# ==========================================

best_model_name = results_df.iloc[0]["Model"]

best_model = trained_models[best_model_name]

joblib.dump(
    best_model,
    os.path.join(MODEL_DIR, "best_model.joblib")
)

print("\nBest model:", best_model_name)
print("Best Spam F1-score:", round(
    results_df.iloc[0]["F1 Score"], 4
))


# ==========================================
# 9. CREATE MODEL COMPARISON GRAPH
# ==========================================

plt.figure(figsize=(10, 6))

comparison = results_df.melt(
    id_vars="Model",
    value_vars=["Accuracy", "Precision", "Recall", "F1 Score"],
    var_name="Metric",
    value_name="Score"
)

sns.barplot(
    data=comparison,
    x="Model",
    y="Score",
    hue="Metric"
)

plt.title("EmailShield - Model Performance Comparison")
plt.ylim(0, 1.05)
plt.ylabel("Performance Score")
plt.xlabel("Machine Learning Algorithm")
plt.xticks(rotation=10)
plt.tight_layout()

plt.savefig(
    os.path.join(RESULT_DIR, "model_comparison.png")
)

plt.close()


print("\n========== TRAINING COMPLETED ==========")
print("All models saved successfully!")
print("Results folder:", RESULT_DIR)
print("Best model:", best_model_name)
print("========================================")
