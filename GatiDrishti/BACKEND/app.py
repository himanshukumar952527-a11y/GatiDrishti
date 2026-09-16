# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import os
# import logging

# import database_function


# # ============================================================
# # APP CONFIGURATION
# # ============================================================

# app = Flask(__name__)

# CORS(
#     app,
#     resources={
#         r"/api/*": {
#             "origins": "https://gati-drishti.vercel.app"
#         }
#     }
# )


# # ============================================================
# # LOGGING
# # ============================================================

# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)


# # ============================================================
# # TRAIN SEARCH
# # ============================================================

# @app.route("/api/trains", methods=["GET"])
# def search_trains():

#     query = request.args.get("search", "").strip()

#     if not query:
#         return jsonify({
#             "success": False,
#             "error": "Please provide a search term"
#         }), 400

#     try:

#         train_data = database_function.fetch_train_data(query)

#         if train_data:
#             return jsonify({
#                 "success": True,
#                 "data": train_data
#             }), 200

#         return jsonify({
#             "success": False,
#             "error": "Train not found"
#         }), 404

#     except Exception as e:

#         logger.exception("Train search failed")

#         return jsonify({
#             "success": False,
#             "error": "Internal server error"
#         }), 500


# # ============================================================
# # PNR STATUS
# # ============================================================

# @app.route("/api/pnr/<pnr_number>", methods=["GET"])
# def get_pnr(pnr_number):

#     if len(pnr_number) != 10 or not pnr_number.isdigit():

#         return jsonify({
#             "success": False,
#             "error": "Invalid PNR format. Must be 10 digits."
#         }), 400

#     try:

#         data = database_function.fetch_pnr_status(pnr_number)

#         return jsonify({
#             "success": True,
#             "data": data
#         }), 200

#     except Exception as e:

#         logger.exception("PNR request failed")

#         return jsonify({
#             "success": False,
#             "error": "Unable to fetch PNR status"
#         }), 500


# # ============================================================
# # HEALTH CHECK
# # ============================================================

# @app.route("/api/health", methods=["GET"])
# def health_check():

#     return jsonify({
#         "success": True,
#         "service": "GatiDrishti Backend",
#         "status": "running"
#     }), 200


# # ============================================================
# # ML PREDICTION
# # ============================================================
# #
# # This endpoint will connect:
# #
# # User
# #   ↓
# # RailRadar live data
# #   ↓
# # database_fetch
# #   ↓
# # next station
# #   ↓
# # weather
# #   ↓
# # feature engineering
# #   ↓
# # model prediction
# #   ↓
# # ml_predictions
# #
# # Keep this endpoint ready for the final ML integration.
# #


# @app.route("/api/predict", methods=["POST"])
# def predict():

#     try:

#         data = request.get_json(silent=True)

#         if not data:
#             return jsonify({
#                 "success": False,
#                 "error": "Request body is required"
#             }), 400

#         train_number = str(
#             data.get("train_number", "")
#         ).strip()

#         journey_date = str(
#             data.get("date", "")
#         ).strip()

#         if not train_number:
#             return jsonify({
#                 "success": False,
#                 "error": "train_number is required"
#             }), 400

#         if not journey_date:
#             return jsonify({
#                 "success": False,
#                 "error": "date is required"
#             }), 400

#         # ----------------------------------------------------
#         # ML PIPELINE WILL BE CONNECTED HERE
#         # ----------------------------------------------------
#         #
#         # 1. live_data.py
#         # 2. database_fetch.py
#         # 3. weather_data.py
#         # 4. feature_engineering.py
#         # 5. model_prediction.py
#         # 6. database_insert.py
#         #
#         # Do not put all this logic directly inside app.py.
#         #
#         # ----------------------------------------------------

#         return jsonify({
#             "success": False,
#             "message": "ML prediction pipeline is not connected yet",
#             "train_number": train_number,
#             "date": journey_date
#         }), 501

#     except Exception:

#         logger.exception("Prediction request failed")

#         return jsonify({
#             "success": False,
#             "error": "Prediction request failed"
#         }), 500


# # ============================================================
# # ACTUAL DATA + COMPARISON
# # ============================================================

# @app.route(
#     "/api/prediction/<int:prediction_id>/actual",
#     methods=["POST"]
# )
# def update_prediction_actual(prediction_id):

#     try:

#         data = request.get_json(silent=True)

#         if not data:
#             return jsonify({
#                 "success": False,
#                 "error": "Request body is required"
#             }), 400

#         actual_arrival_time = data.get(
#             "actual_arrival_time"
#         )

#         actual_departure_time = data.get(
#             "actual_departure_time"
#         )

#         actual_arrival_delay = data.get(
#             "actual_arrival_delay"
#         )

#         if actual_arrival_time is None:
#             return jsonify({
#                 "success": False,
#                 "error": "actual_arrival_time is required"
#             }), 400

#         if actual_arrival_delay is None:
#             return jsonify({
#                 "success": False,
#                 "error": "actual_arrival_delay is required"
#             }), 400

#         # ----------------------------------------------------
#         # ACTUAL + COMPARISON PIPELINE WILL BE CONNECTED HERE
#         # ----------------------------------------------------
#         #
#         # model_prediction.py will:
#         #
#         # prediction_id
#         #       ↓
#         # actual data
#         #       ↓
#         # actual_id
#         #       ↓
#         # predicted_delay vs actual_delay
#         #       ↓
#         # ml_comparison_data
#         #
#         # ----------------------------------------------------

#         return jsonify({
#             "success": False,
#             "message": "Actual/comparison pipeline is not connected yet",
#             "prediction_id": prediction_id
#         }), 501

#     except Exception:

#         logger.exception(
#             "Actual/comparison update failed"
#         )

#         return jsonify({
#             "success": False,
#             "error": "Failed to update actual data"
#         }), 500


# # ============================================================
# # ERROR HANDLERS
# # ============================================================

# @app.errorhandler(404)
# def not_found(error):

#     return jsonify({
#         "success": False,
#         "error": "API endpoint not found"
#     }), 404


# @app.errorhandler(500)
# def internal_error(error):

#     return jsonify({
#         "success": False,
#         "error": "Internal server error"
#     }), 500


# # ============================================================
# # LOCAL DEVELOPMENT / RENDER
# # ============================================================

# if __name__ == "__main__":

#     port = int(
#         os.environ.get("PORT", 5000)
#     )

#     app.run(
#         host="0.0.0.0",
#         port=port,
#         debug=True
#     )


from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging

import database_function
from prediction import predict_train_status

# Path to the trained CatBoost model file. Adjust if the .cbm file lives
# somewhere else relative to app.py (e.g. inside a /models folder).
MODEL_PATH = os.environ.get("MODEL_PATH", "gatidrishti_catboost_final.cbm")


# ============================================================
# APP CONFIGURATION
# ============================================================

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "https://gati-drishti.vercel.app"
        }
    }
)


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================
# TRAIN SEARCH
# ============================================================

@app.route("/api/trains", methods=["GET"])
def search_trains():

    query = request.args.get("search", "").strip()

    if not query:
        return jsonify({
            "success": False,
            "error": "Please provide a search term"
        }), 400

    try:

        train_data = database_function.fetch_train_data(query)

        if train_data:
            return jsonify({
                "success": True,
                "data": train_data
            }), 200

        return jsonify({
            "success": False,
            "error": "Train not found"
        }), 404

    except Exception as e:

        logger.exception("Train search failed")

        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500


# ============================================================
# PNR STATUS
# ============================================================

@app.route("/api/pnr/<pnr_number>", methods=["GET"])
def get_pnr(pnr_number):

    if len(pnr_number) != 10 or not pnr_number.isdigit():

        return jsonify({
            "success": False,
            "error": "Invalid PNR format. Must be 10 digits."
        }), 400

    try:

        data = database_function.fetch_pnr_status(pnr_number)

        return jsonify({
            "success": True,
            "data": data
        }), 200

    except Exception as e:

        logger.exception("PNR request failed")

        return jsonify({
            "success": False,
            "error": "Unable to fetch PNR status"
        }), 500


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/api/health", methods=["GET"])
def health_check():

    return jsonify({
        "success": True,
        "service": "GatiDrishti Backend",
        "status": "running"
    }), 200


# ============================================================
# ML PREDICTION
# ============================================================
#
# This endpoint will connect:
#
# User
#   ↓
# RailRadar live data
#   ↓
# database_fetch
#   ↓
# next station
#   ↓
# weather
#   ↓
# feature engineering
#   ↓
# model prediction
#   ↓
# ml_predictions
#
# Keep this endpoint ready for the final ML integration.
#


def build_raw_feature_row(train_number, journey_date):
    """
    Gathers the raw context for one train and returns the dict that
    prediction.py's build_features() turns into the 27 model features:

        arr_delay, dep_delay, latitude, longitude, station_sequence,
        distance, next_station_distance_value, next2_station_distance_value,
        total_active_train, trains_ahead, trains_behind, avg_headway,
        avg_speed, max_speed, category_encoding, next_station_latitude,
        next_station_longitude, sch_halt_current_station,
        act_halt_current_station, sch_halt_next_station, day_night,
        weather_score, next_weather_score, weather_distance,
        next_weather_distance, weather_avg_speed, next_weather_avg_speed

    plus "current_station", "next_station" and "next_station_sch_arrival"
    (HH:MM or an ISO datetime) used only for the response/UI, not the model.

    TODO: this is the one piece not wired up, because live_data.py,
    weather_data.py, and the rest of database_function.py weren't
    provided. Fill this in with the real calls, e.g.:

        live = live_data.get_live_position(train_number)
        db_ctx = database_function.fetch_prediction_context(train_number, journey_date)
        weather = weather_data.get_weather(...)
        return { ...merge the three into the fields above... }

    Return None if the train/date can't be resolved, so the route can
    reply with 404 instead of predicting on incomplete data.
    """
    raise NotImplementedError(
        "build_raw_feature_row() needs to be connected to your live_data.py, "
        "database_function.py and weather_data.py sources."
    )


def compute_predicted_arrival_time(next_station_sch_arrival, predicted_delay_minutes):
    """
    Converts the model's predicted delay (minutes) into a predicted
    arrival clock time, given the next station's scheduled arrival
    ("HH:MM"). Returns None if no scheduled time is available.
    """
    if not next_station_sch_arrival:
        return None

    from datetime import datetime, timedelta

    try:
        sch_time = datetime.strptime(next_station_sch_arrival, "%H:%M")
    except ValueError:
        # Already a full ISO datetime string — leave conversion to the caller.
        return next_station_sch_arrival

    predicted_time = sch_time + timedelta(minutes=predicted_delay_minutes)
    return predicted_time.strftime("%H:%M")


@app.route("/api/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "error": "Request body is required"
            }), 400

        train_number = str(
            data.get("train_number", "")
        ).strip()

        journey_date = str(
            data.get("date", "")
        ).strip()

        if not train_number:
            return jsonify({
                "success": False,
                "error": "train_number is required"
            }), 400

        if not journey_date:
            return jsonify({
                "success": False,
                "error": "date is required"
            }), 400

        # ----------------------------------------------------
        # ML PIPELINE
        # ----------------------------------------------------
        #
        # build_raw_feature_row() below is the single integration point
        # that turns "which train, which date" into the raw row that
        # prediction.py's feature_engineering step needs. It is NOT
        # wired to live_data.py / weather_data.py yet because those
        # files weren't provided — see the function docstring for the
        # exact fields it must return.
        #
        raw_row = build_raw_feature_row(train_number, journey_date)

        if raw_row is None:
            return jsonify({
                "success": False,
                "error": "Could not gather live/database context for this train"
            }), 404

        predicted_delay, _ = predict_train_status(MODEL_PATH, raw_row)
        predicted_delay = round(float(predicted_delay), 1)

        current_station = raw_row.get("current_station")
        next_station = raw_row.get("next_station")
        predicted_arrival_time = compute_predicted_arrival_time(
            raw_row.get("next_station_sch_arrival"), predicted_delay
        )

        return jsonify({
            "success": True,
            "train_number": train_number,
            "date": journey_date,
            "current_station": current_station,
            "next_station": next_station,
            "predicted_delay": predicted_delay,
            "predicted_arrival_time": predicted_arrival_time
        }), 200

    except Exception:

        logger.exception("Prediction request failed")

        return jsonify({
            "success": False,
            "error": "Prediction request failed"
        }), 500


# ============================================================
# ACTUAL DATA + COMPARISON
# ============================================================

@app.route(
    "/api/prediction/<int:prediction_id>/actual",
    methods=["POST"]
)
def update_prediction_actual(prediction_id):

    try:

        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "error": "Request body is required"
            }), 400

        actual_arrival_time = data.get(
            "actual_arrival_time"
        )

        actual_departure_time = data.get(
            "actual_departure_time"
        )

        actual_arrival_delay = data.get(
            "actual_arrival_delay"
        )

        if actual_arrival_time is None:
            return jsonify({
                "success": False,
                "error": "actual_arrival_time is required"
            }), 400

        if actual_arrival_delay is None:
            return jsonify({
                "success": False,
                "error": "actual_arrival_delay is required"
            }), 400

        # ----------------------------------------------------
        # ACTUAL + COMPARISON PIPELINE WILL BE CONNECTED HERE
        # ----------------------------------------------------
        #
        # model_prediction.py will:
        #
        # prediction_id
        #       ↓
        # actual data
        #       ↓
        # actual_id
        #       ↓
        # predicted_delay vs actual_delay
        #       ↓
        # ml_comparison_data
        #
        # ----------------------------------------------------

        return jsonify({
            "success": False,
            "message": "Actual/comparison pipeline is not connected yet",
            "prediction_id": prediction_id
        }), 501

    except Exception:

        logger.exception(
            "Actual/comparison update failed"
        )

        return jsonify({
            "success": False,
            "error": "Failed to update actual data"
        }), 500


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "success": False,
        "error": "API endpoint not found"
    }), 404


@app.errorhandler(500)
def internal_error(error):

    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500


# ============================================================
# LOCAL DEVELOPMENT / RENDER
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get("PORT", 5000)
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=True
    )