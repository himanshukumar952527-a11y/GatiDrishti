# BACKEND/live_data.py

import os
import requests
from dotenv import load_dotenv

from database_fetch import fetch_live_database_context


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

RAILRADAR_API_KEY = os.getenv("RAILRADAR_API_KEY")

if not RAILRADAR_API_KEY:
    raise ValueError(
        "RAILRADAR_API_KEY is missing from .env"
    )

RAILRADAR_BASE_URL = "https://api.railradar.in/v1"


# ============================================================
# FETCH LIVE TRAIN DATA
# ============================================================

def fetch_live_train(train_number):
    """
    Fetch real-time train data from RailRadar.

    Only ONE API request is made.
    """

    url = (
        f"{RAILRADAR_BASE_URL}/trains/"
        f"{train_number}/live"
    )

    headers = {
        "Authorization":
            f"Bearer {RAILRADAR_API_KEY}"
    }

    try:

        response = requests.get(
            url,
            headers=headers,
            timeout=15
        )

    except requests.RequestException as error:

        return {
            "success": False,
            "source": "railradar",
            "error": "RailRadar request failed",
            "details": str(error)
        }

    # --------------------------------------------------------
    # HTTP ERROR HANDLING
    # --------------------------------------------------------

    if response.status_code == 401:

        return {
            "success": False,
            "source": "railradar",
            "error": "Invalid or expired RailRadar API key"
        }

    if response.status_code == 404:

        return {
            "success": False,
            "source": "railradar",
            "error": "Train not found"
        }

    if response.status_code == 429:

        return {
            "success": False,
            "source": "railradar",
            "error": "RailRadar API quota/rate limit exceeded"
        }

    if response.status_code == 503:

        return {
            "success": False,
            "source": "railradar",
            "error": "RailRadar service unavailable"
        }

    if response.status_code != 200:

        return {
            "success": False,
            "source": "railradar",
            "error": (
                f"RailRadar returned "
                f"HTTP {response.status_code}"
            ),
            "details": response.text
        }

    # --------------------------------------------------------
    # PARSE JSON
    # --------------------------------------------------------

    try:

        payload = response.json()

    except ValueError:

        return {
            "success": False,
            "source": "railradar",
            "error": "Invalid JSON response from RailRadar"
        }

    if not payload.get("success"):

        error_info = payload.get("error", {})

        return {
            "success": False,
            "source": "railradar",
            "error": error_info.get(
                "message",
                "RailRadar request unsuccessful"
            )
        }

    data = payload.get("data")

    if not data:

        return {
            "success": False,
            "source": "railradar",
            "error": "RailRadar returned empty data"
        }

    # --------------------------------------------------------
    # CURRENT LOCATION
    # --------------------------------------------------------

    current_location = data.get(
        "currentLocation"
    ) or {}

    current_station_code = current_location.get(
        "stationCode"
    )

    current_sequence = current_location.get(
        "sequence"
    )

    # --------------------------------------------------------
    # NEXT HALT
    # --------------------------------------------------------

    next_halt = data.get("nextHalt") or {}

    # --------------------------------------------------------
    # FINAL LIVE DATA
    # --------------------------------------------------------

    return {
        "success": True,

        "source": "railradar",

        "train_number": data.get(
            "trainNumber",
            str(train_number)
        ),

        "train_name": data.get(
            "trainName"
        ),

        "journey_date": data.get(
            "startDate"
        ),

        "last_updated_at": data.get(
            "lastUpdatedAt"
        ),

        "status": data.get(
            "status"
        ),

        "delay_minutes": data.get(
            "delayMinutes"
        ),

        "current_location": {
            "station_code": current_station_code,
            "sequence": current_sequence,
            "status": current_location.get(
                "status"
            ),
            "is_halt": current_location.get(
                "isHalt"
            ),
            "is_actual_position": current_location.get(
                "isActualPosition"
            ),
            "segment_progress": current_location.get(
                "segmentProgress"
            ),
            "speed_kmh": current_location.get(
                "speedKmh"
            ),
            "bearing_degrees": current_location.get(
                "bearingDegrees"
            )
        },

        "previous_halt": data.get(
            "previousHalt"
        ),

        "next_halt": next_halt,

        # RailRadar operational exceptions/events
        "events": data.get(
            "exceptions",
            []
        ),

        "route": data.get(
            "route",
            []
        ),

        "is_live": data.get(
            "isLive"
        )
    }


# ============================================================
# FETCH TRAIN EVENTS
# ============================================================

def fetch_live_events(train_number):
    """
    Fetch operational events/exceptions for a train
    from RailRadar.

    Events may include:
        - DIVERTED
        - RESCHEDULED
        - PARTIALLY_CANCELLED
        - other RailRadar exceptions
    """

    live_data = fetch_live_train(train_number)

    if not live_data["success"]:

        return {
            "success": False,
            "events": [],
            "error": live_data.get("error")
        }

    events = live_data.get(
        "events",
        []
    )

    return {
        "success": True,
        "source": "railradar",
        "train_number": train_number,
        "events": events
    }


# ============================================================
# COMPLETE LIVE TRAIN CONTEXT
# ============================================================

def get_live_train_context(train_number):
    """
    Complete pipeline:

        RailRadar
            ↓
        current station
            ↓
        Supabase
            ↓
        current + next + next2
    """

    # --------------------------------------------------------
    # STEP 1: RailRadar
    # --------------------------------------------------------

    live_data = fetch_live_train(
        train_number
    )

    if not live_data["success"]:

        return live_data

    current_location = live_data[
        "current_location"
    ]

    current_station_code = current_location[
        "station_code"
    ]

    current_sequence = current_location[
        "sequence"
    ]

    # --------------------------------------------------------
    # STEP 2: Database
    # --------------------------------------------------------

    database_data = fetch_live_database_context(
        train_number=train_number,

        current_station_code=current_station_code,

        current_station_sequence=current_sequence
    )

    if not database_data["success"]:

        return {
            "success": False,

            "source": "database",

            "error": database_data["error"],

            "live_data": live_data
        }

    # --------------------------------------------------------
    # STEP 3: Combine
    # --------------------------------------------------------

    return {
        "success": True,

        "live": live_data,

        "database": database_data
    }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print("=" * 70)
    print("GATIDRISHTI - LIVE TRAIN DATA")
    print("=" * 70)

    train_number = input(
        "\nEnter train number: "
    ).strip()

    print("\nFetching live data...")

    result = get_live_train_context(
        train_number
    )

    # --------------------------------------------------------
    # ERROR
    # --------------------------------------------------------

    if not result["success"]:

        print("\n" + "=" * 70)
        print("❌ LIVE DATA FETCH FAILED")
        print("=" * 70)

        print("\nError:")
        print(result.get("error"))

        exit()

    # --------------------------------------------------------
    # LIVE DATA
    # --------------------------------------------------------

    live = result["live"]

    location = live["current_location"]

    print("\n" + "=" * 70)
    print("LIVE TRAIN INFORMATION")
    print("=" * 70)

    print(
        "Train Number    :",
        live["train_number"]
    )

    print(
        "Train Name      :",
        live["train_name"]
    )

    print(
        "Status          :",
        live["status"]
    )

    print(
        "Delay           :",
        live["delay_minutes"],
        "minutes"
    )

    print(
        "Last Updated    :",
        live["last_updated_at"]
    )

    print(
        "Current Station :",
        location["station_code"]
    )

    print(
        "Sequence        :",
        location["sequence"]
    )

    print(
        "Speed           :",
        location["speed_kmh"],
        "km/h"
    )

    print(
        "Segment Progress:",
        location["segment_progress"]
    )

    # --------------------------------------------------------
    # DATABASE DATA
    # --------------------------------------------------------

    database = result["database"]

    current = database[
        "current_station"
    ]

    next_station = database[
        "next_station"
    ]

    next2 = database[
        "next2_station"
    ]

    print("\n" + "=" * 70)
    print("DATABASE ROUTE CONTEXT")
    print("=" * 70)

    print("\nCURRENT STATION")

    if current:

        print(
            current["station_code"],
            "-",
            current["station_name"]
        )

        print(
            "Sequence:",
            current["station_sequence"]
        )

        print(
            "Latitude:",
            current["latitude"]
        )

        print(
            "Longitude:",
            current["longitude"]
        )

    print("\nNEXT STATION")

    if next_station:

        print(
            next_station["station_code"],
            "-",
            next_station["station_name"]
        )

        print(
            "Sequence:",
            next_station["station_sequence"]
        )

        print(
            "Latitude:",
            next_station["latitude"]
        )

        print(
            "Longitude:",
            next_station["longitude"]
        )

        print(
            "Scheduled Arrival:",
            next_station["scheduled_arrival"]
        )

        print(
            "Scheduled Departure:",
            next_station["scheduled_departure"]
        )

    else:

        print(
            "No next station "
            "(destination reached)."
        )

    print("\nNEXT 2 STATION")

    if next2:

        print(
            next2["station_code"],
            "-",
            next2["station_name"]
        )

        print(
            "Sequence:",
            next2["station_sequence"]
        )

        print(
            "Latitude:",
            next2["latitude"]
        )

        print(
            "Longitude:",
            next2["longitude"]
        )

    else:

        print("No next2 station.")

    # --------------------------------------------------------
    # SUCCESS
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("✅ LIVE DATABASE PIPELINE SUCCESSFUL")
    print("=" * 70)