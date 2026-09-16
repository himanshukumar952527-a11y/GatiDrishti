import catboost as cb
import pandas as pd

from BACKEND.feature_engineering import MODEL_FEATURE_COLUMNS


def predict_train_status(model_path, features):
    """
    Load the trained CatBoost model and predict
    next_station_arr_delay using the final 27 features.
    """

    # 1. Validate features
    missing_features = [
        feature
        for feature in MODEL_FEATURE_COLUMNS
        if feature not in features
    ]

    if missing_features:
        raise ValueError(
            "Missing model features: "
            + ", ".join(missing_features)
        )

    # 2. Keep ONLY the final 27 features
    features_df = pd.DataFrame(
        [[features[feature] for feature in MODEL_FEATURE_COLUMNS]],
        columns=MODEL_FEATURE_COLUMNS
    )

    # 3. Load CatBoost model
    model = cb.CatBoostRegressor()
    model.load_model(model_path)

    # 4. Prediction
    prediction = model.predict(features_df)

    predicted_delay = float(prediction[0])

    return predicted_delay, features_df


if __name__ == "__main__":

    print("GatiDrishti prediction.py loaded.")
    print(
        f"Expected model features: "
        f"{len(MODEL_FEATURE_COLUMNS)}"
    )

    for index, feature in enumerate(
        MODEL_FEATURE_COLUMNS,
        start=1
    ):
        print(f"{index:02d}. {feature}")