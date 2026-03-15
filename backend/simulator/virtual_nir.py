import numpy as np

class VirtualNIR:
    """
    Virtual NIR Spectrometer (Digital Twin)
    Simulates reflectance spectra of sugarcane between 700nm and 2500nm.
    """
    def __init__(self, start_wl=700, end_wl=2500, resolution=2):
        self.wavelengths = np.arange(start_wl, end_wl + resolution, resolution)
        self.num_points = len(self.wavelengths)

    def generate_spectrum(self, base_pol=14.0, moisture=70.0, add_noise=True):
        """
        Generates a synthetic NIR spectrum given a pol (sugar content) and moisture level.
        Pol is typically 10-18%. Moisture is ~65-75%.
        """
        # Base gaussian peaks simulating typical organic matter in NIR
        spectrum = np.zeros(self.num_points)
        
        # Add water absorption peaks prominently at ~970, 1450, 1940nm
        spectrum += (moisture / 100) * 0.8 * self._gaussian(self.wavelengths, 970, 40)
        spectrum += (moisture / 100) * 1.5 * self._gaussian(self.wavelengths, 1450, 60)
        spectrum += (moisture / 100) * 2.0 * self._gaussian(self.wavelengths, 1940, 70)
        
        # Add sucrose (Pol) absorption peaks at ~990, 1200, 1430, 2080, 2270nm
        pol_factor = base_pol / 20.0
        spectrum += pol_factor * 0.4 * self._gaussian(self.wavelengths, 990, 20)
        spectrum += pol_factor * 0.6 * self._gaussian(self.wavelengths, 1200, 30)
        spectrum += pol_factor * 0.5 * self._gaussian(self.wavelengths, 1430, 40)
        spectrum += pol_factor * 1.2 * self._gaussian(self.wavelengths, 2080, 50)
        spectrum += pol_factor * 0.9 * self._gaussian(self.wavelengths, 2270, 60)

        # Cellulose and other fibers baseline
        spectrum += 0.3 * self._gaussian(self.wavelengths, 1700, 200)
        
        # Add variable baseline drift (scattering effect)
        baseline_drift = np.linspace(np.random.uniform(0.1, 0.3), np.random.uniform(0.4, 0.8), self.num_points)
        spectrum += baseline_drift
        
        if add_noise:
            # White noise representing sensor noise
            noise = np.random.normal(0, 0.005, self.num_points)
            spectrum += noise
            
        return self.wavelengths, spectrum

    def _gaussian(self, x, mu, sig):
        return np.exp(-np.power(x - mu, 2.) / (2 * np.power(sig, 2.)))
