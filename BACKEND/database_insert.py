# BACKEND/database_insert.py
import json 
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from supabase import create_client, Client


# SUPABASE CONFIGURATION
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_API_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is missing from .env for inertion file.")

if not SUPABASE_SERVICE_ROLE_API_KEY:
    raise ValueError("SUPABASE_KEY is missing from .env for insertion file")


supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_API_KEY
)


# HELPER
def current_utc_time():
    """
    Return current UTC timestamp.
    """

    return datetime.now(
        timezone.utc
    ).isoformat()


# OPERATIONAL WEATHER

def insert_weather_data(
    running_id,
    station_id,
    date_time,
    temperature,
    precipitation,
    visibility,
    wind_speed,
    wind_direction,
    cloud_cover
):
    """
    Insert current-station weather snapshot into:

        operational.operational_weather_data
    """

    data = {
        "running_id":running_id,
        "station_id": station_id,
        "date_time": date_time,
        "temperature": temperature,
        "precipitation": precipitation,
        "visibility": visibility,
        "wind_speed": wind_speed,
        "wind_direction": wind_direction,
        "cloud_cover": cloud_cover
    }

    response = (
        supabase
        .schema("operational")
        .table("operational_weather_data")
        .insert(data)
        .execute()
    )

    return response.data

# NEXT STATION WEATHER
def insert_next_station_weather_data(
    running_id,
    station_id,
    date_time,
    temperature,
    precipitation,
    visibility,
    wind_speed,
    wind_direction,
    cloud_cover
):
    """
    Insert next-station weather snapshot into:

        operational.operational_next_station_weather_data
    """

    data = {
        "running_id":running_id,
        "station_id": station_id,
        "date_time": date_time,
        "temperature": temperature,
        "precipitation": precipitation,
        "visibility": visibility,
        "wind_speed": wind_speed,
        "wind_direction": wind_direction,
        "cloud_cover": cloud_cover
    }

    response = (
        supabase
        .schema("operational")
        .table(
            "operational_next_station_weather_data"
        )
        .insert(data)
        .execute()
    )

    return response.data

# TRAIN RUNNING HISTORY
def insert_train_running_history(
    train_id,
    station_id,
    route_id,
    weather_id,
    date_time,
    actual_arrival,
    actual_departure,
    arrival_delay,
    departure_delay
):
    """
    Insert train running snapshot into:

        operational.operational_train_running_history

    This stores the operational running information
    required for historical/live feature generation.

    Scheduled arrival/departure/halt are NOT stored here.
    They are available from static_routes.
    """

    data = {
        "train_id": train_id,
        "station_id": station_id,
        "route_id": route_id,
        "weather_id": weather_id,
        "date_time": date_time,
        "actual_arrival": actual_arrival,
        "actual_departure": actual_departure,
        "arrival_delay": arrival_delay,
        "departure_delay": departure_delay
    }

    response = (
        supabase
        .schema("operational")
        .table(
            "operational_train_running_history"
        )
        .insert(data)
        .execute()
    )

    return response.data
# CONGESTION DATABASE
def insert_congestion_data(
    station_id,
    date_time,
    congestion_level,
    estimated_delay
):
    """
    Insert congestion summary into:

        operational.operational_congestion_data

    The four ML congestion features themselves
    are handled separately through Redis.
    """

    data = {
        "station_id": station_id,
        "date_time": date_time,
        "congestion_level": congestion_level,
        "estimated_delay": estimated_delay
    }

    response = (
        supabase
        .schema("operational")
        .table(
            "operational_congestion_data"
        )
        .insert(data)
        .execute()
    )

    return response.data

# OPERATIONAL EVENTS
def insert_operational_event(
    station_id,
    event_type,
    event_start_time,
    event_end_time,
    duration_minutes,
    severity
):
    """
    Insert operational event into:

        operational.operational_events
    """

    data = {
        "station_id": station_id,
        "event_type": event_type,
        "event_start_time": event_start_time,
        "event_end_time": event_end_time,
        "duration_minutes": duration_minutes,
        "severity": severity
    }

    response = (
        supabase
        .schema("operational")
        .table(
            "operational_events"
        )
        .insert(data)
        .execute()
    )

    return response.data

# ML TEMPORARY TRAINING DATA
def insert_temporary_training_data(
    running_id,
    input_features
):
    """
    Insert temporary feature record into:

        ml.ml_temporary_training_data
    """

    data = {
        "running_id": running_id,
        "input_features": input_features,
        "created_at": current_utc_time()
    }

    response = (
        supabase
        .schema("ml")
        .table(
            "ml_temporary_training_data"
        )
        .insert(data)
        .execute()
    )

    return response.data

# ML TRAINING DATA
def insert_training_data(
    temp_training_id,
    input_features,
    target_variable
):
    """
    Insert final training record into:

        ml.ml_training_data
    """

    data = {
        "temp_training_id": temp_training_id,
        "input_features": input_features,
        "target_variable": target_variable
    }

    response = (
        supabase
        .schema("ml")
        .table(
            "ml_training_data"
        )
        .insert(data)
        .execute()
    )

    return response.data

# SAFE INSERT
def safe_insert(
    insert_function,
    **kwargs
):
    """
    Execute any insert function safely.

    Returns a standard result dictionary instead
    of raising an exception to the main pipeline.
    """

    try:

        result = insert_function(
            **kwargs
        )

        return {
            "success": True,
            "data": result
        }

    except Exception as error:

        return {
            "success": False,
            "error_type":
                type(error).__name__,
            "error": str(error)
        }

# BASIC TEST
if __name__ == "__main__":

    print("=" * 70)
    print(
        "GATIDRISHTI - DATABASE INSERT MODULE"
    )
    print("=" * 70)

    print(
        "\nSupabase client initialized successfully."
    )

    print("\nAvailable functions:")
    print("--------------------------------")

    print(
        "1. insert_weather_data()"
    )

    print(
        "2. insert_next_station_weather_data()"
    )

    print(
        "3. insert_train_running_history()"
    )

    print(
        "4. insert_congestion_data()"
    )

    print(
        "5. insert_operational_event()"
    )

    print(
        "6. insert_temporary_training_data()"
    )

    print(
        "7. insert_training_data()"
    )

    print("\nUtility:")
    print("--------------------------------")

    print(
        "8. safe_insert()"
    )

    print("\nPrediction functions:")
    print("--------------------------------")

    print(
        "Handled separately in "
        "prediction_insert.py"
    )

    print("\n" + "=" * 70)

    print(
        "DATABASE INSERT MODULE READY"
    )

    print("=" * 70)