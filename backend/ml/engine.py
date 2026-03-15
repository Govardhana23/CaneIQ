import numpy as np
import torch
import torch.nn as nn
import xgboost as xgb
from sklearn.cross_decomposition import PLSRegression
from preprocessing.spectral import preprocess_pipeline
import joblib

class SpectralCNN(nn.Module):
    def __init__(self, input_size):
        super(SpectralCNN, self).__init__()
        self.conv1 = nn.Conv1d(1, 16, kernel_size=15, stride=2, padding=7)
        self.relu = nn.ReLU()
        self.pool = nn.MaxPool1d(2)
        self.conv2 = nn.Conv1d(16, 32, kernel_size=7, stride=2, padding=3)
        
        # Calculate resulting shape
        # Initial size typically 901 for 700-2500nm with step=2
        # After conv1: 451, pool: 225
        # After conv2: 113, pool: 56
        self.flatten = nn.Flatten()
        
        # We compute this dynamically in init since input shape could vary slightly
        dummy_input = torch.zeros(1, 1, input_size)
        dummy_out = self.pool(self.relu(self.conv2(self.pool(self.relu(self.conv1(dummy_input))))))
        flattened_size = dummy_out.shape[1] * dummy_out.shape[2]
        
        self.fc1 = nn.Linear(flattened_size, 64)
        self.fc2 = nn.Linear(64, 1)

    def forward(self, x):
        # x is (batch, channels, length)
        x = self.pool(self.relu(self.conv1(x)))
        x = self.pool(self.relu(self.conv2(x)))
        x = self.flatten(x)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x

class CaneIQMLEngine:
    def __init__(self, base_path="../models/"):
        self.base_path = base_path
        self.pls = PLSRegression(n_components=10)
        self.xgb = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1)
        self.cnn = None
        self.is_trained = False

    def train_all(self, X_train, y_train):
        print("Training PLS Model...")
        self.pls.fit(X_train, y_train)
        
        print("Training XGBoost Model...")
        self.xgb.fit(X_train, y_train)
        
        print("Training 1D CNN Model...")
        input_size = X_train.shape[1]
        self.cnn = SpectralCNN(input_size)
        
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(self.cnn.parameters(), lr=0.001)
        
        X_tensor = torch.tensor(X_train, dtype=torch.float32).unsqueeze(1) # Add channel dim
        y_tensor = torch.tensor(y_train.values, dtype=torch.float32).unsqueeze(1)
        
        dataset = torch.utils.data.TensorDataset(X_tensor, y_tensor)
        loader = torch.utils.data.DataLoader(dataset, batch_size=32, shuffle=True)
        
        epochs = 20
        self.cnn.train()
        for epoch in range(epochs):
            for batch_X, batch_y in loader:
                optimizer.zero_grad()
                outputs = self.cnn(batch_X)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()
        
        self.is_trained = True
        print("All models trained successfully.")

    def save_models(self):
        joblib.dump(self.pls, self.base_path + "pls_model.pkl")
        self.xgb.save_model(self.base_path + "xgb_model.json")
        torch.save(self.cnn.state_dict(), self.base_path + "cnn_model.pth")
    
    def load_models(self, input_size):
        try:
            self.pls = joblib.load(self.base_path + "pls_model.pkl")
            self.xgb.load_model(self.base_path + "xgb_model.json")
            self.cnn = SpectralCNN(input_size)
            self.cnn.load_state_dict(torch.load(self.base_path + "cnn_model.pth"))
            self.cnn.eval()
            self.is_trained = True
        except Exception as e:
            print(f"Error loading models: {e}. Train first.")

    def predict(self, raw_spectrum_batch):
        """
        raw_spectrum_batch: NumPy array of shape (N, features)
        Returns: predictions, confidence_score
        """
        # 1. Preprocess
        processed = preprocess_pipeline(raw_spectrum_batch)
        
        # 2. Predict PLS
        pls_preds = self.pls.predict(processed).flatten()
        
        # 3. Predict XGB
        xgb_preds = self.xgb.predict(processed)
        
        # 4. Predict CNN
        with torch.no_grad():
            X_tensor = torch.tensor(processed, dtype=torch.float32).unsqueeze(1)
            cnn_preds = self.cnn(X_tensor).flatten().numpy()
            
        # 5. Ensemble average
        ensemble_pred = (pls_preds + xgb_preds + cnn_preds) / 3.0
        
        # 6. Confidence Engine
        # Calculate variance among models
        preds_matrix = np.vstack((pls_preds, xgb_preds, cnn_preds))
        std_devs = np.std(preds_matrix, axis=0)
        
        # Convert std to confidence score (0 to 100%)
        # Normal std is usually ~0.1 to 0.5. Let's scale it.
        # If std_dev is 0 => 100% confidence. If std_dev > 1.0 => 0% confidence
        confidence_scores = np.clip(100 - (std_devs * 100), 10, 100)
        
        results = []
        for i in range(len(ensemble_pred)):
            results.append({
                "pol_prediction": round(ensemble_pred[i], 2),
                "confidence": round(confidence_scores[i], 1),
                "needs_manual_lab": confidence_scores[i] < 70.0
            })
            
        return results
