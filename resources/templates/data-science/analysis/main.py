"""
{{PROJECT_NAME}} - Data Analysis Project
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns


def load_sample_data() -> pd.DataFrame:
    """Load sample data for analysis."""
    np.random.seed(42)
    return pd.DataFrame({
        "x": np.random.randn(100),
        "y": np.random.randn(100),
        "category": np.random.choice(["A", "B", "C"], 100),
    })


def analyze_data(df: pd.DataFrame) -> dict:
    """Perform basic analysis on the data."""
    return {
        "shape": df.shape,
        "columns": list(df.columns),
        "dtypes": df.dtypes.to_dict(),
        "summary": df.describe().to_dict(),
    }


def create_visualization(df: pd.DataFrame) -> None:
    """Create a sample visualization."""
    plt.figure(figsize=(10, 6))
    sns.scatterplot(data=df, x="x", y="y", hue="category")
    plt.title("Sample Scatter Plot")
    plt.savefig("output.png")
    plt.show()


def main():
    """Main analysis workflow."""
    print("Loading data...")
    df = load_sample_data()
    
    print("Analyzing data...")
    results = analyze_data(df)
    print(f"Data shape: {results['shape']}")
    
    print("Creating visualization...")
    create_visualization(df)
    
    print("Done!")


if __name__ == "__main__":
    main()
