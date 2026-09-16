import os
from supabase import create_client, Client


# =========================================================
# SUPABASE CONFIGURATION
# =========================================================

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

print("DEBUG SUPABASE_URL:", bool(SUPABASE_URL))
print("DEBUG SUPABASE_KEY:", bool(SUPABASE_KEY))

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is missing")

if not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_KEY is missing")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


# =========================================================
# TRAIN SEARCH
# =========================================================

def fetch_train_data(query: str):
    """
    Searches for a train in Supabase by train_id (exact match)
    or by name (partial/case-insensitive match).
    """

    try:
        # Search by train_id
        response = (
            supabase
            .table("trains")
            .select("*")
            .eq("train_id", query)
            .execute()
        )

        if response.data and len(response.data) > 0:
            return response.data[0]

        # Search by train name
        response_name = (
            supabase
            .table("trains")
            .select("*")
            .ilike("name", f"%{query}%")
            .execute()
        )

        if response_name.data and len(response_name.data) > 0:
            return response_name.data[0]

        return None

    except Exception as e:
        raise e


# =========================================================
# WEATHER DATA INSERT
# =========================================================

def insert_weather_data(
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
    Inserts current weather data into
    operational_weather_data table.
    """

    try:
        weather_data = {
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
            .table("operational_weather_data")
            .insert(weather_data)
            .execute()
        )

        return response.data

    except Exception as e:
        raise e