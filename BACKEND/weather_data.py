# BACKEND/weather.py

import requests

from datetime import datetime, timezone

from database_insert import insert_weather_data


# ============================================================
# OPEN-METEO CONFIGURATION
# ============================================================

URL = "https://api.open-meteo.com/v1/forecast"


# ============================================================
# FETCH NEXT STATION WEATHER
# ============================================================

def fetch_next_station_weather(next_station):
    """
    Fetch current weather conditions for the next station.

    The next_station object comes directly from
    database_fetch.py and uses a flat structure.
    """

    if not next_station:
        return {
            "success": False,
            "error": "Next station data missing"
        }

    latitude = next_station.get("latitude")
    longitude = next_station.get("longitude")
    station_id = next_station.get("station_id")

    station_code = next_station.get("station_code")
    station_name = next_station.get("station_name")

    if latitude is None or longitude is None:
        return {
            "success": False,
            "error": "Next station latitude/longitude missing"
        }

    if station_id is None:
        return {
            "success": False,
            "error": "Next station station_id missing"
        }

    # ========================================================
    # OPEN-METEO REQUEST
    # ========================================================

    params = {
        "latitude": latitude,
        "longitude": longitude,

        "current": (
            "temperature_2m,"
            "precipitation,"
            "visibility,"
            "wind_speed_10m,"
            "wind_direction_10m,"
            "cloud_cover"
        ),

        "timezone": "Asia/Kolkata"
    }

    try:

        response = requests.get(
            URL,
            params=params,
            timeout=20
        )

        response.raise_for_status()

        data = response.json()

    except requests.RequestException as error:

        return {
            "success": False,
            "error": f"Open-Meteo request failed: {error}"
        }

    # ========================================================
    # EXTRACT CURRENT WEATHER
    # ========================================================

    current = data.get("current") or {}

    timestamp = current.get("time")

    if not timestamp:
        timestamp = datetime.now(timezone.utc).isoformat()

    # ========================================================
    # WEATHER DATA
    # ========================================================

    weather = {

        "station_id": station_id,

        "date_time": timestamp,

        "temperature": current.get(
            "temperature_2m"
        ),

        "precipitation": current.get(
            "precipitation"
        ),

        "visibility": current.get(
            "visibility"
        ),

        "wind_speed": current.get(
            "wind_speed_10m"
        ),

        "wind_direction": current.get(
            "wind_direction_10m"
        ),

        "cloud_cover": current.get(
            "cloud_cover"
        )
    }

    # ========================================================
    # INSERT INTO DATABASE
    # ========================================================

    try:

        inserted = insert_weather_data(
            **weather
        )

    except Exception as error:

        return {
            "success": False,
            "error": (
                f"Weather fetched but DB insert failed: "
                f"{error}"
            ),
            "weather": weather
        }

    # ========================================================
    # RETURN
    # ========================================================

    return {

        "success": True,

        "station_id": station_id,

        "station_code": station_code,

        "station_name": station_name,

        "weather_timestamp": timestamp,

        "weather": weather,

        "db_insert": inserted
    }


# ============================================================
# BASIC TEST
# ============================================================

if __name__ == "__main__":

    print(
        "Use fetch_next_station_weather(next_station)"
    )