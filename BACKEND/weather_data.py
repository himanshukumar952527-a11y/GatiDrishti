# BACKEND/weather_data.py

import os
import requests
from datetime import datetime
from dotenv import load_dotenv

from database_function import insert_weather_data


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

REQUEST_TIMEOUT = 15

TIMEZONE = "Asia/Kolkata"


# ============================================================
# SAFE FLOAT
# ============================================================

def safe_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


# ============================================================
# FETCH WEATHER FOR ONE STATION
# ============================================================

def fetch_station_weather(station):
    """
    Fetch current weather for a station using Open-Meteo.

    Expected station structure:

    {
        "station_id": ...,
        "station_code": ...,
        "station_name": ...,
        "latitude": ...,
        "longitude": ...
    }

    Returns raw weather data compatible with
    feature_engineering.py.
    """

    if not station:
        return {
            "success": False,
            "source": "open-meteo",
            "error": "Station data is missing"
        }

    latitude = station.get("latitude")
    longitude = station.get("longitude")

    if latitude is None or longitude is None:
        return {
            "success": False,
            "source": "open-meteo",
            "error": "Station latitude/longitude missing"
        }

    latitude = safe_float(latitude)
    longitude = safe_float(longitude)

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

        "timezone": TIMEZONE
    }

    try:

        response = requests.get(
            OPEN_METEO_URL,
            params=params,
            timeout=REQUEST_TIMEOUT
        )

    except requests.RequestException as error:

        return {
            "success": False,
            "source": "open-meteo",
            "error": "Open-Meteo request failed",
            "details": str(error)
        }

    # --------------------------------------------------------
    # HTTP ERROR
    # --------------------------------------------------------

    if response.status_code != 200:

        return {
            "success": False,
            "source": "open-meteo",
            "error": (
                f"Open-Meteo returned "
                f"HTTP {response.status_code}"
            ),
            "details": response.text
        }

    # --------------------------------------------------------
    # JSON
    # --------------------------------------------------------

    try:

        payload = response.json()

    except ValueError:

        return {
            "success": False,
            "source": "open-meteo",
            "error": "Invalid JSON response from Open-Meteo"
        }

    current = payload.get("current") or {}

    if not current:

        return {
            "success": False,
            "source": "open-meteo",
            "error": "Open-Meteo returned empty current weather"
        }

    # --------------------------------------------------------
    # NORMALIZED WEATHER DATA
    # --------------------------------------------------------

    weather = {
        "station_id": station.get("station_id"),
        "station_code": station.get("station_code"),
        "station_name": station.get("station_name"),

        "latitude": latitude,
        "longitude": longitude,

        "date_time": current.get("time"),

        "temperature": safe_float(
            current.get("temperature_2m")
        ),

        "precipitation": safe_float(
            current.get("precipitation")
        ),

        "visibility": safe_float(
            current.get("visibility")
        ),

        "wind_speed": safe_float(
            current.get("wind_speed_10m")
        ),

        "wind_direction": safe_float(
            current.get("wind_direction_10m")
        ),

        "cloud_cover": safe_float(
            current.get("cloud_cover")
        )
    }

    # --------------------------------------------------------
    # DATABASE INSERT
    # --------------------------------------------------------

    db_insert = None

    try:

        db_insert = insert_weather_data(
            station_id=weather["station_id"],
            date_time=weather["date_time"],
            temperature=weather["temperature"],
            precipitation=weather["precipitation"],
            visibility=weather["visibility"],
            wind_speed=weather["wind_speed"],
            wind_direction=weather["wind_direction"],
            cloud_cover=weather["cloud_cover"]
        )

    except Exception as error:

        # Weather API data is still usable even if
        # database insertion fails.
        db_insert = {
            "success": False,
            "error": str(error)
        }

    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    return {
        "success": True,
        "source": "open-meteo",

        "station": {
            "station_id": station.get("station_id"),
            "station_code": station.get("station_code"),
            "station_name": station.get("station_name"),
            "latitude": latitude,
            "longitude": longitude
        },

        "weather_timestamp": weather["date_time"],

        "weather": weather,

        "db_insert": db_insert
    }


# ============================================================
# CURRENT + NEXT STATION WEATHER
# ============================================================

def fetch_current_and_next_weather(
    current_station,
    next_station
):
    """
    Fetch weather for both:

        Current station
             +
        Next station

    This directly supports the final model features:

        weather_score
        next_weather_score

    and the associated weather-derived fields.
    """

    current_weather = fetch_station_weather(
        current_station
    )

    next_weather = fetch_station_weather(
        next_station
    ) if next_station else {
        "success": False,
        "source": "open-meteo",
        "error": "Next station is not available"
    }

    return {
        "success": (
            current_weather.get("success", False)
            and next_weather.get("success", False)
        ),

        "current_weather": current_weather,

        "next_station_weather": next_weather
    }


# ============================================================
# SIMPLE NEXT-STATION HELPER
# ============================================================

def fetch_next_station_weather(next_station):
    """
    Backward-compatible helper.

    Used when only next-station weather is required.
    """

    return fetch_station_weather(next_station)


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print("=" * 70)
    print("GATIDRISHTI - WEATHER DATA TEST")
    print("=" * 70)

    station = {
        "station_id": 1,
        "station_code": "GZB",
        "station_name": "Ghaziabad",
        "latitude": 28.6692,
        "longitude": 77.4538
    }

    print("\nFetching weather...")

    result = fetch_station_weather(station)

    if not result["success"]:

        print("\n❌ WEATHER FETCH FAILED")
        print(result.get("error"))
        print(result.get("details"))

    else:

        print("\n✅ WEATHER FETCH SUCCESSFUL")

        weather = result["weather"]

        print("\nStation       :", weather["station_code"])
        print("Date/Time     :", weather["date_time"])
        print("Temperature   :", weather["temperature"])
        print("Precipitation :", weather["precipitation"])
        print("Visibility    :", weather["visibility"])
        print("Wind Speed    :", weather["wind_speed"])
        print("Wind Direction:", weather["wind_direction"])
        print("Cloud Cover   :", weather["cloud_cover"])

    print("\n" + "=" * 70)