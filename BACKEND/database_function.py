
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()


# SUPABASE CONFIGURATION
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")


if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is missing")

if not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_KEY is missing")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)

# TRAIN SEARCH
def fetch_train_data(query: str):
    """
    Searches for a train by train number (exact match)
    or train name (partial/case-insensitive match)
    from the static schema.
    """

    try:
        # Search by train number
        response = (
            supabase
            .schema("static")
            .table("static_trains")
            .select("*")
            .eq("train_number", query)
            .execute()
        )

        if response.data and len(response.data) > 0:
            return response.data[0]
        # Search by train name
        response_name = (
            supabase
            .schema("static")
            .table("static_trains")
            .select("*")
            .ilike(
                "train_name",
                f"%{query}%"
            )
            .execute()
        )

        if response_name.data and len(response_name.data) > 0:
            return response_name.data[0]

        return None

    except Exception as e:
        raise e

# GET TRAIN
def get_train(train_number):
    """
    Fetch a single train from static.static_trains
    using its train number.
    """

    try:

        response = (
            supabase
            .schema("static")
            .table("static_trains")
            .select("*")
            .eq(
                "train_number",
                str(train_number)
            )
            .limit(1)
            .execute()
        )

        if response.data:
            return response.data[0]

        return None

    except Exception as e:

        raise e

# GET COMPLETE TRAIN ROUTE
def get_train_route(train_id):
    """
    Fetch the complete route of a train from
    static.static_routes.

    Returns route rows ordered by station_sequence.
    """

    try:

        response = (
            supabase
            .schema("static")
            .table("static_routes")
            .select("*")
            .eq(
                "train_id",
                train_id
            )
            .order(
                "station_sequence",
                desc=False
            )
            .execute()
        )

        return response.data or []

    except Exception as e:

        raise e

# GET STATIONS
def get_stations(station_ids):
    """
    Fetch station details from static.static_stations
    for a list of station IDs.
    """

    if not station_ids:
        return []

    try:

        response = (
            supabase
            .schema("static")
            .table("static_stations")
            .select("*")
            .in_(
                "station_id",
                station_ids
            )
            .execute()
        )

        return response.data or []

    except Exception as e:

        raise e


# WEATHER DATA INSERT
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