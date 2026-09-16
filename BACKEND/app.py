# BACKEND/app.py

import os
import logging
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS

import database_function

from live_data import get_live_train_context
from weather_data import fetch_current_and_next_weather
from congestion import process_congestion

from feature_engineering import (
    create_model_features,
    MODEL_FEATURE_COLUMNS
)

from prediction import predict_train_status


# ============================================================
# CONFIGURATION
# ============================================================

app = Flask(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


# ============================================================
# CORS
# ============================================================

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "https://gati-drishti.vercel.app"
            ]
        }
    }
)


# ============================================================
# MODEL PATH
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.getenv(
    "MODEL_PATH",
    os.path.join(
        BASE_DIR,
        "gatidrishti_catboost_final.cbm"
    )
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "success": True,
        "service": "GatiDrishti Backend",
        "status": "healthy",
        "model_available": os.path.exists(MODEL_PATH)
    })


# ============================================================
# TRAIN SEARCH
# ============================================================

@app.route("/api/trains", methods=["GET"])
def search_trains():

    query = request.args.get(
        "search",
        ""
    ).strip()

    if not query:

        return jsonify({
            "success": False,
            "error": "Search query is required"
        }), 400

    try:

        result = database_function.fetch_train_data(
            query
        )

        return jsonify(result)

    except Exception as error:

        logger.exception(
            "Train search failed"
        )

        return jsonify({
            "success": False,
            "error": "Unable to fetch train data",
            "details": str(error)
        }), 500


# ============================================================
# PNR STATUS
# ============================================================

@app.route(
    "/api/pnr/<pnr_number>",
    methods=["GET"]
)
def pnr_status(pnr_number):

    if (
        not pnr_number.isdigit()
        or len(pnr_number) != 10
    ):

        return jsonify({
            "success": False,
            "error": "PNR must be a 10-digit number"
        }), 400

    try:

        result = database_function.fetch_pnr_status(
            pnr_number
        )

        return jsonify(result)

    except Exception as error:

        logger.exception(
            "PNR lookup failed"
        )

        return jsonify({
            "success": False,
            "error": "Unable to fetch PNR status",
            "details": str(error)
        }), 500


# ============================================================
# TIME HELPER
# ============================================================

def parse_time_to_minutes(value):

    if value is None:
        return None

    value = str(value).strip()

    if not value:
        return None

    try:

        parts = value.split(":")

        hour = int(parts[0])
        minute = int(parts[1])

        return (
            hour * 60
            + minute
        )

    except (
        ValueError,
        IndexError
    ):

        return None


# ============================================================
# PREDICTED ARRIVAL TIME
# ============================================================

def compute_predicted_arrival_time(
    scheduled_arrival,
    predicted_delay_minutes
):

    base_minutes = parse_time_to_minutes(
        scheduled_arrival
    )

    if base_minutes is None:
        return None

    try:

        delay = float(
            predicted_delay_minutes
        )

    except (
        TypeError,
        ValueError
    ):

        return None

    predicted_minutes = (
        base_minutes
        + round(delay)
    )

    predicted_minutes %= (
        24 * 60
    )

    hour = predicted_minutes // 60
    minute = predicted_minutes % 60

    return (
        f"{hour:02d}:"
        f"{minute:02d}"
    )


# ============================================================
# CONGESTION LIVE TRAIN PREPARATION
# ============================================================

def prepare_live_trains(
    target_train_number,
    live_route,
    target_sequence
):
    """
    Prepare train sequence data for congestion.py.

    If RailRadar provides multiple active trains,
    they are passed to congestion calculation.

    Target train is always included.
    """

    live_trains = []

    if not isinstance(
        live_route,
        list
    ):
        live_route = []

    for item in live_route:

        if not isinstance(
            item,
            dict
        ):
            continue

        sequence = (
            item.get("sequence")
            or item.get("stationSequence")
        )

        if sequence is None:
            continue

        try:

            sequence = int(
                sequence
            )

        except (
            TypeError,
            ValueError
        ):

            continue

        live_trains.append({
            "train_number": item.get(
                "trainNumber",
                target_train_number
            ),
            "sequence": sequence
        })

    # --------------------------------------------------------
    # Ensure target train exists
    # --------------------------------------------------------

    target_exists = any(
        str(item.get("train_number"))
        == str(target_train_number)
        for item in live_trains
    )

    if not target_exists:

        live_trains.append({
            "train_number": str(
                target_train_number
            ),
            "sequence": int(
                target_sequence
            )
        })

    return live_trains


# ============================================================
# BUILD FINAL MODEL FEATURE ROW
# ============================================================

def build_raw_feature_row(
    train_number,
    journey_date=None
):
    """
    Complete production prediction pipeline.

    Vercel
       ↓
    Render /api/predict
       ↓
    RailRadar
       ↓
    Supabase
       ↓
    Open-Meteo
       ↓
    Congestion
       ↓
    Feature Engineering
       ↓
    27 model features
       ↓
    CatBoost
    """

    logger.info(
        "Prediction started for train %s",
        train_number
    )

    # ========================================================
    # STEP 1: LIVE TRAIN + DATABASE
    # ========================================================

    context = get_live_train_context(
        train_number
    )

    if not context.get(
        "success"
    ):

        raise RuntimeError(
            context.get(
                "error",
                "Unable to fetch live train context"
            )
        )

    live_data = context["live"]

    database_data = context["database"]

    # ========================================================
    # STEP 2: DATABASE CONTEXT
    # ========================================================

    train = database_data.get(
        "train"
    )

    metadata = database_data.get(
        "metadata"
    )

    current_station = database_data.get(
        "current_station"
    )

    next_station = database_data.get(
        "next_station"
    )

    next2_station = database_data.get(
        "next2_station"
    )

    if not train:

        raise RuntimeError(
            "Train not found in database"
        )

    if not current_station:

        raise RuntimeError(
            "Current station not found"
        )

    if not next_station:

        raise RuntimeError(
            "No next station available. "
            "Train may have reached destination."
        )

    # ========================================================
    # STEP 3: CURRENT SEQUENCE
    # ========================================================

    current_sequence = (
        current_station.get(
            "station_sequence"
        )
    )

    if current_sequence is None:

        current_sequence = (
            live_data
            .get(
                "current_location",
                {}
            )
            .get(
                "sequence"
            )
        )

    if current_sequence is None:

        raise RuntimeError(
            "Current station sequence unavailable"
        )

    try:

        current_sequence = int(
            current_sequence
        )

    except (
        TypeError,
        ValueError
    ):

        raise RuntimeError(
            "Invalid current station sequence"
        )

    # ========================================================
    # STEP 4: WEATHER
    # ========================================================

    weather_result = (
        fetch_current_and_next_weather(
            current_station=current_station,
            next_station=next_station
        )
    )

    if not weather_result.get(
        "success"
    ):

        raise RuntimeError(
            "Unable to fetch weather data"
        )

    current_weather_result = (
        weather_result.get(
            "current_weather",
            {}
        )
    )

    next_weather_result = (
        weather_result.get(
            "next_station_weather",
            {}
        )
    )

    current_weather = (
        current_weather_result.get(
            "weather",
            {}
        )
    )

    next_station_weather = (
        next_weather_result.get(
            "weather",
            {}
        )
    )

    # ========================================================
    # STEP 5: CONGESTION
    # ========================================================

    live_route = live_data.get(
        "route",
        []
    )

    live_trains = prepare_live_trains(
        target_train_number=train_number,
        live_route=live_route,
        target_sequence=current_sequence
    )

    congestion_result = process_congestion(
        train_number=train_number,
        target_train_sequence=current_sequence,
        live_trains=live_trains,
        station_id=current_station.get(
            "station_id"
        )
    )

    if isinstance(
        congestion_result,
        dict
    ):

        congestion = (
            congestion_result.get(
                "congestion",
                congestion_result
            )
        )

    else:

        congestion = {}

    # ========================================================
    # STEP 6: DATABASE CONTEXT FOR FEATURE ENGINEERING
    # ========================================================

    feature_context = {

        "train": train,

        "metadata": metadata,

        "current": current_station,

        "next_station": next_station,

        "next2_station": next2_station
    }

    # ========================================================
    # STEP 7: PREDICTION TIME
    # ========================================================

    prediction_time = (
        live_data.get(
            "last_updated_at"
        )
        or datetime.now().isoformat()
    )

    # ========================================================
    # STEP 8: FINAL 27 FEATURES
    # ========================================================

    features = create_model_features(

        context=feature_context,

        live_data=live_data,

        current_weather=current_weather,

        next_station_weather=next_station_weather,

        congestion=congestion,

        prediction_time=prediction_time,

        train_on_station=(
            live_data
            .get(
                "current_location",
                {}
            )
            .get(
                "is_halt",
                False
            )
        )
    )

    # ========================================================
    # STEP 9: VERIFY FEATURES
    # ========================================================

    missing_features = [
        feature
        for feature in MODEL_FEATURE_COLUMNS
        if feature not in features
    ]

    if missing_features:

        raise RuntimeError(
            "Missing model features: "
            + ", ".join(
                missing_features
            )
        )

    if len(features) != len(
        MODEL_FEATURE_COLUMNS
    ):

        logger.warning(
            "Feature dictionary contains %d "
            "values; expected %d model features",
            len(features),
            len(MODEL_FEATURE_COLUMNS)
        )

    logger.info(
        "27 model features successfully generated"
    )

    # ========================================================
    # RETURN
    # ========================================================

    return {

        "features": features,

        "train_number": str(
            train_number
        ),

        "journey_date": (
            live_data.get(
                "journey_date"
            )
            or journey_date
        ),

        "current_station": current_station,

        "next_station": next_station,

        "next2_station": next2_station,

        "live_data": live_data,

        "congestion": congestion,

        "weather": {

            "current": current_weather,

            "next": next_station_weather
        }
    }


# ============================================================
# PREDICTION API
# ============================================================

@app.route(
    "/api/predict",
    methods=["POST"]
)
def predict():

    try:

        body = request.get_json(
            silent=True
        ) or {}

        train_number = body.get(
            "train_number"
        )

        journey_date = body.get(
            "date"
        )

        # ----------------------------------------------------
        # VALIDATION
        # ----------------------------------------------------

        if not train_number:

            return jsonify({
                "success": False,
                "error": "train_number is required"
            }), 400

        train_number = str(
            train_number
        ).strip()

        if not train_number:

            return jsonify({
                "success": False,
                "error": "Invalid train number"
            }), 400

        # ----------------------------------------------------
        # MODEL CHECK
        # ----------------------------------------------------

        if not os.path.exists(
            MODEL_PATH
        ):

            return jsonify({
                "success": False,
                "error": "CatBoost model not found"
            }), 500

        # ----------------------------------------------------
        # BUILD FEATURES
        # ----------------------------------------------------

        pipeline = build_raw_feature_row(
            train_number=train_number,
            journey_date=journey_date
        )

        features = pipeline[
            "features"
        ]

        # ----------------------------------------------------
        # CATBOOST
        # ----------------------------------------------------

        predicted_delay, _ = (
            predict_train_status(
                MODEL_PATH,
                features
            )
        )

        # ----------------------------------------------------
        # NEXT STATION
        # ----------------------------------------------------

        next_station = pipeline[
            "next_station"
        ]

        scheduled_arrival = (
            next_station.get(
                "scheduled_arrival"
            )
        )

        predicted_arrival_time = (
            compute_predicted_arrival_time(
                scheduled_arrival,
                predicted_delay
            )
        )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "train_number": pipeline[
                "train_number"
            ],

            "journey_date": pipeline[
                "journey_date"
            ],

            "current_station": (
                pipeline[
                    "current_station"
                ].get(
                    "station_code"
                )
            ),

            "current_station_name": (
                pipeline[
                    "current_station"
                ].get(
                    "station_name"
                )
            ),

            "next_station": (
                next_station.get(
                    "station_code"
                )
            ),

            "next_station_name": (
                next_station.get(
                    "station_name"
                )
            ),

            "predicted_delay": (
                round(
                    float(
                        predicted_delay
                    ),
                    2
                )
            ),

            "predicted_arrival_time": (
                predicted_arrival_time
            ),

            "scheduled_arrival": (
                scheduled_arrival
            ),

            "model": "CatBoost",

            "feature_count": len(
                MODEL_FEATURE_COLUMNS
            )
        })

    except Exception as error:

        logger.exception(
            "Prediction failed"
        )

        return jsonify({

            "success": False,

            "error": "Prediction failed",

            "details": str(error)

        }), 500


# ============================================================
# ACTUAL DATA ENDPOINT
# ============================================================

@app.route(
    "/api/prediction/<int:prediction_id>/actual",
    methods=["POST"]
)
def record_actual_data(
    prediction_id
):

    return jsonify({

        "success": False,

        "error": (
            "Actual data endpoint "
            "not implemented yet"
        )

    }), 501


# ============================================================
# 404 HANDLER
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({

        "success": False,

        "error": "API endpoint not found"

    }), 404


# ============================================================
# 500 HANDLER
# ============================================================

@app.errorhandler(500)
def internal_error(error):

    return jsonify({

        "success": False,

        "error": "Internal server error"

    }), 500


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    port = int(
        os.getenv(
            "PORT",
            5000
        )
    )

    logger.info(
        "Starting GatiDrishti backend"
    )

    logger.info(
        "Model: %s",
        MODEL_PATH
    )

    logger.info(
        "Model available: %s",
        os.path.exists(MODEL_PATH)
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )