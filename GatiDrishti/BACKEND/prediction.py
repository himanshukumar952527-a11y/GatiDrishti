import catboost as cb
import pandas as pd
from feature_builder import build_features  # Imports from your feature_builder.py


def predict_train_status(model_path, raw_input_row):
    """
    Loads a CatBoost .cbm model, builds the 27 required features,
    and returns the model prediction.
    """
    # 1. Load the CatBoost model
    model = cb.CatBoostRegressor()  # Use CatBoostClassifier if your model is a classifier
    model.load_model(model_path)
    
    # 2. Build the exact 27 features using your pipeline
    features_dict = build_features(raw_input_row)
    
    # 3. Convert dictionary to a pandas DataFrame (maintains column order)
    features_df = pd.DataFrame([features_dict])
    
    # 4. Make prediction
    prediction = model.predict(features_df)
    
    return prediction[0], features_df

# ==========================================
# Example Usage with Sample Raw Data
# ==========================================
if __name__ == "__main__":
    sample_row = {
        "arr_delay": 5.0,
        "dep_delay": 3.0,
        "latitude": 28.6139,
        "longitude": 77.2090,
        "station_sequence": 4,
        "distance": 45.5,
        "next_station_distance_value": 30.2,
        "next2_station_distance_value": 60.0,
        "total_active_train": 120,
        "trains_ahead": 2,
        "trains_behind": 5,
        "avg_headway": 15.0,
        "avg_speed": 75.0,
        "max_speed": 110.0,
        "category_encoding": 1,
        "next_station_latitude": 28.7041,
        "next_station_longitude": 77.1025,
        "sch_halt_current_station": 5.0,
        "act_halt_current_station": 7.0,
        "sch_halt_next_station": 3.0,
        "day_night": 1,
        # Current Weather Parameters
        "precipitation": 0.0,
        "visibility": 9000,
        "temperature_2m": 28.0,
        "relative_humidity_2m": 60.0,
        "cloud_cover": 20.0,
        "wind_speed_10m": 12.0,
        # Next Station Weather Parameters
        "next_precipitation": 1.2,
        "next_visibility": 7000,
        "next_temperature_2m": 26.5,
        "next_relative_humidity_2m": 65.0,
        "next_cloud_cover": 40.0,
        "next_wind_speed_10m": 15.0
    }

    model_file = "model.cbm"  # Replace with your actual .cbm file path
    
    try:
        pred_value, processed_df = predict_train_status("gatidrishti_catboost_final.cbm", sample_row)
        print(f"Predicted Output/Delay: {pred_value:.2f} minutes")
    except Exception as e:
        print(f"Error loading model or predicting: {e}")