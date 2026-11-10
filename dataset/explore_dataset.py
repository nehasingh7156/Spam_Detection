
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import re
from collections import Counter

# Load dataset
df = pd.read_csv("dataset/sms_spam.csv")

print("\n========== EMAILSHIELD EDA ==========")

# Basic information
print("\nDataset Shape:", df.shape)
print("\nDataset Information:")
df.info()

print("\nMissing Values:")
print(df.isnull().sum())

print("\nDuplicate Messages:", df.duplicated(subset=["sms"]).sum())

# Category distribution
print("\nClass Distribution:")
print(df["category"].value_counts())

print("\nClass Percentage:")
print(df["category"].value_counts(normalize=True) * 100)

# Feature engineering for analysis
df["message_length"] = df["sms"].apply(len)
df["word_count"] = df["sms"].apply(
    lambda x: len(str(x).split())
)

print("\nAverage Message Length:")
print(df.groupby("category")["message_length"].mean())

print("\nAverage Word Count:")
print(df.groupby("category")["word_count"].mean())

# Graph 1: Spam vs Ham distribution
plt.figure(figsize=(8, 5))

sns.countplot(
    data=df,
    x="category",
    hue="category",
    palette=["#16a34a", "#ef4444"],
    legend=False
)

plt.title("Spam vs Ham Message Distribution")
plt.xlabel("Message Category")
plt.ylabel("Number of Messages")
plt.tight_layout()
plt.savefig("dataset/class_distribution.png")
plt.close()

# Graph 2: Message length distribution
plt.figure(figsize=(9, 5))

sns.histplot(
    data=df,
    x="message_length",
    hue="category",
    bins=40,
    kde=True
)

plt.title("Message Length Distribution")
plt.xlabel("Message Length (Characters)")
plt.ylabel("Frequency")
plt.tight_layout()
plt.savefig("dataset/message_length.png")
plt.close()

# Extract frequently used words
def extract_words(messages):
    words = []

    for message in messages:
        tokens = re.findall(r"\b[a-z]+\b", str(message).lower())
        words.extend(tokens)

    return Counter(words)

spam_messages = df[df["category"] == "spam"]["sms"]
ham_messages = df[df["category"] == "ham"]["sms"]

spam_words = extract_words(spam_messages)
ham_words = extract_words(ham_messages)

print("\nTop 15 Spam Words:")
print(spam_words.most_common(15))

print("\nTop 15 Ham Words:")
print(ham_words.most_common(15))

# Graph 3: Most common spam words
top_spam = spam_words.most_common(15)

words = [item[0] for item in top_spam]
counts = [item[1] for item in top_spam]

plt.figure(figsize=(10, 6))

sns.barplot(
    x=counts,
    y=words,
    color="tomato"
)

plt.title("Top 15 Frequently Used Words in Spam")
plt.xlabel("Frequency")
plt.ylabel("Words")
plt.tight_layout()
plt.savefig("dataset/top_spam_words.png")
plt.close()

print("\nEDA COMPLETED SUCCESSFULLY!")
