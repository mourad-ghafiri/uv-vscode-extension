"""
{{PROJECT_NAME}} - Scikit-learn ML Project
"""
import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score


def create_dataset():
    """Create a sample classification dataset."""
    X, y = make_classification(
        n_samples=1000,
        n_features=20,
        n_informative=10,
        n_classes=2,
        random_state=42,
    )
    return train_test_split(X, y, test_size=0.2, random_state=42)


def train_model(X_train, y_train):
    """Train a Random Forest classifier."""
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    return model


def evaluate_model(model, X_test, y_test):
    """Evaluate the model."""
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    report = classification_report(y_test, predictions)
    return accuracy, report


def main():
    """Main entry point."""
    print("Creating dataset...")
    X_train, X_test, y_train, y_test = create_dataset()
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    
    print("\nTraining model...")
    model = train_model(X_train, y_train)
    
    print("\nEvaluating model...")
    accuracy, report = evaluate_model(model, X_test, y_test)
    print(f"Accuracy: {accuracy:.4f}")
    print(f"\nClassification Report:\n{report}")


if __name__ == "__main__":
    main()
