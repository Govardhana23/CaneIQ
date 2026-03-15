import numpy as np
from scipy.signal import savgol_filter

def apply_savgol(spectra, window_length=15, polyorder=2, deriv=0):
    """
    Applies Savitzky-Golay smoothing or differentiation.
    """
    return savgol_filter(spectra, window_length=window_length, polyorder=polyorder, deriv=deriv, axis=1)

def apply_snv(spectra):
    """
    Standard Normal Variate (SNV) transformation.
    Corrects for scattering and baseline shifts line by line.
    """
    mean = np.mean(spectra, axis=1, keepdims=True)
    std = np.std(spectra, axis=1, keepdims=True)
    return (spectra - mean) / (std + 1e-8)

def min_max_normalize(spectra):
    """
    Min-Max normalization to [0, 1] range.
    """
    mins = np.min(spectra, axis=1, keepdims=True)
    maxes = np.max(spectra, axis=1, keepdims=True)
    return (spectra - mins) / (maxes - mins + 1e-8)

def preprocess_pipeline(spectra, use_snv=True, use_savgol=True, use_deriv=1):
    """
    Full preprocessing pipeline for raw NIR spectra.
    """
    processed = np.copy(spectra)
    
    if use_snv:
        processed = apply_snv(processed)
        
    if use_savgol:
        processed = apply_savgol(processed, window_length=15, polyorder=2, deriv=use_deriv)
        
    return processed
