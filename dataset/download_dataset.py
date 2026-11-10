
import os
import urllib.request
import zipfile
import pandas as pd

# UCI SMS Spam Collection dataset
DATASET_URL = "https://archive.ics.uci.edu/static/public/228/sms+spam+collection.zip"

OUTPUT_DIR = "dataset"
ZIP_FILE = os.path.join(OUTPUT_DIR, "sms_spam_collection.zip")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "sms_spam.csv")

os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Downloading SMS Spam Collection dataset...")

try:
    # Download dataset ZIP
    urllib.request.urlretrieve(DATASET_URL, ZIP_FILE)
    print("Download completed!")

    # Extract dataset
    with zipfile.ZipFile(ZIP_FILE, "r") as zip_ref:
        zip_ref.extractall(OUTPUT_DIR)

    print("Dataset extracted successfully!")

    # Read original dataset
    raw_file = os.path.join(OUTPUT_DIR, "SMSSpamCollection")

    df = pd.read_csv(
        raw_file,
        sep="\t",
        header=None,
        names=["category", "sms"],
        encoding="utf-8"
    )

    # Convert categories into numerical labels
    df["label"] = df["category"].map({
        "ham": 0,
        "spam": 1
    })

    # Clean data
    df.dropna(subset=["sms", "label"], inplace=True)
    df["sms"] = df["sms"].astype(str).str.strip()
    df = df[df["sms"] != ""]
    df["label"] = df["label"].astype(int)

    # Save final CSV
    df = df[["sms", "label", "category"]]
    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8")

    print("\n========== DOWNLOAD SUCCESSFUL ==========")
    print("Dataset saved at:", OUTPUT_FILE)
    print("Total messages:", len(df))

    print("\nCategory distribution:")
    print(df["category"].value_counts())

    print("\nDataset preview:")
    print(df.head())

    print("\n=========================================")

except Exception as e:
    print("\nDataset download failed!")
    print("Error:", e)
