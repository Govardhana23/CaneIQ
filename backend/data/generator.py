import os
import sys
import pandas as pd
import numpy as np

# Add parent dir to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from simulator.virtual_nir import VirtualNIR

def generate_dataset(num_samples=1000, save_path="../data/synthetic_spectra.csv"):
    """
    Generates a synthetic dataset of sugarcane NIR spectra and corresponding Pol values.
    """
    print(f"Generating {num_samples} synthetic samples...")
    vnir = VirtualNIR()
    
    data = []
    
    # Generate varied Pol values (normally distributed around 13.5)
    pol_values = np.random.normal(loc=13.5, scale=2.5, size=num_samples)
    # Clip realistically to [8, 18]
    pol_values = np.clip(pol_values, 8.0, 18.0)
    
    for pol in pol_values:
        # Simulate realistic moisture variability
        moisture = np.random.normal(loc=70.0, scale=3.0)
        moisture = np.clip(moisture, 60.0, 80.0)
        
        wl, spec = vnir.generate_spectrum(base_pol=pol, moisture=moisture)
        
        row = {'Pol': pol, 'Moisture': moisture}
        for w, s in zip(wl, spec):
            row[f"WL_{int(w)}"] = s
        
        data.append(row)
        
    df = pd.DataFrame(data)
    
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    df.to_csv(save_path, index=False)
    print(f"Dataset saved to {save_path} with shape {df.shape}")

if __name__ == "__main__":
    generate_dataset()
