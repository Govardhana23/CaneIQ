import os
import sys
import pandas as pd

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.engine import CaneIQMLEngine
from data.generator import generate_dataset

def main():
    data_path = "../data/synthetic_spectra.csv"
    if not os.path.exists(data_path):
        generate_dataset(num_samples=1000, save_path=data_path)
        
    print("Loading dataset...")
    df = pd.read_csv(data_path)
    
    # Exclude non-spectral columns for features
    X = df.drop(columns=['Pol', 'Moisture']).values
    y = df['Pol']
    
    print(f"Features shape: {X.shape}, Target shape: {y.shape}")
    
    engine = CaneIQMLEngine()
    engine.train_all(X, y)
    
    os.makedirs("../models", exist_ok=True)
    engine.save_models()
    print("Models saved successfully in ../models/")
    
    # Test a prediction
    print("Testing Engine Prediction...")
    test_batch = X[:5]
    results = engine.predict(test_batch)
    for i, res in enumerate(results):
        print(f"Sample {i+1}: True Pol={y.iloc[i]:.2f} => Pred={res['pol_prediction']}, Conf={res['confidence']}%")

if __name__ == "__main__":
    main()
