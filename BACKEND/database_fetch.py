# BACKEND/database_fetch.py

import os
from dotenv import load_dotenv
from supabase import create_client, Client


# ============================================================
# SUPABASE CONFIGURATION
# ============================================================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is missing from .env")

if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY is missing from .env")


supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


# ============================================================
# TRAIN
# ============================================================

def get_train(train_number):
    """
    Fetch train from static.static_trains.
    """

    response = (
        supabase
        .schema("static")
        .table("static_trains")
        .select("*")
        .eq("train_number", str(train_number))
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]


# ============================================================
# TRAIN ROUTE
# ============================================================

def get_train_route(train_id):
    """
    Fetch complete route of train.
    """

    response = (
        supabase
        .schema("static")
        .table("static_routes")
        .select("*")
        .eq("train_id", train_id)
        .order("station_sequence")
        .execute()
    )

    return response.data


# ============================================================
# STATIONS
# ============================================================

def get_stations(station_ids):
    """
    Fetch station details.
    """

    if not station_ids:
        return []

    response = (
        supabase
        .schema("static")
        .table("static_stations")
        .select("*")
        .in_("station_id", station_ids)
        .execute()
    )

    return response.data


# ============================================================
# TRAIN METADATA
# ============================================================

def get_train_metadata(train_id):
    """
    Fetch train metadata.
    """

    response = (
        supabase
        .schema("static")
        .table("static_train_metadata")
        .select("*")
        .eq("train_id", train_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]


# ============================================================
# COMPLETE STATIC TRAIN DATA
# ============================================================

def get_complete_route(train_number):
    """
    Fetch:

        train
        metadata
        route
        station information
    """

    train = get_train(train_number)

    if not train:
        return None

    train_id = train["train_id"]

    route = get_train_route(train_id)

    if not route:
        return None

    station_ids = list({
        item["station_id"]
        for item in route
        if item.get("station_id") is not None
    })

    stations = get_stations(station_ids)

    station_lookup = {
        station["station_id"]: station
        for station in stations
    }

    complete_route = []

    for route_item in route:

        station_id = route_item["station_id"]

        station = station_lookup.get(station_id)

        complete_route.append({
            "route_id": route_item["route_id"],
            "station_id": station_id,
            "station_sequence": route_item["station_sequence"],

            "distance_from_source":
                route_item["distance_from_source"],

            "distance_to_destination":
                route_item["distance_to_destination"],

            "scheduled_arrival":
                route_item["scheduled_arrival"],

            "scheduled_departure":
                route_item["scheduled_departure"],

            "scheduled_halt":
                route_item["scheduled_halt"],

            "station_code":
                station["station_code"] if station else None,

            "station_name":
                station["station_name"] if station else None,

            "latitude":
                station["latitude"] if station else None,

            "longitude":
                station["longitude"] if station else None,

            "zone":
                station["zone"] if station else None,

            "division":
                station["division"] if station else None
        })

    metadata = get_train_metadata(train_id)

    return {
        "train": train,
        "metadata": metadata,
        "route": complete_route
    }


# ============================================================
# CURRENT + NEXT + NEXT2
# ============================================================

def get_station_context(train_number, current_sequence):
    """
    Get current, next and next2 station from database.
    """

    data = get_complete_route(train_number)

    if not data:
        return None

    route = data["route"]

    current_station = None
    next_station = None
    next2_station = None

    for station in route:

        sequence = station["station_sequence"]

        if sequence == current_sequence:
            current_station = station

        elif sequence == current_sequence + 1:
            next_station = station

        elif sequence == current_sequence + 2:
            next2_station = station

    return {
        "current_station": current_station,
        "next_station": next_station,
        "next2_station": next2_station
    }


# ============================================================
# FINAL DATABASE FUNCTION
# ============================================================

def fetch_live_database_context(
    train_number,
    current_station_code=None,
    current_station_sequence=None
):
    """
    Main database function used by live_data.py.

    Either current_station_code OR current_station_sequence
    must be supplied.
    """

    train = get_train(train_number)

    if not train:
        return {
            "success": False,
            "error": "Train not found in database"
        }

    train_id = train["train_id"]

    route = get_train_route(train_id)

    if not route:
        return {
            "success": False,
            "error": "Train route not found in database"
        }

    # --------------------------------------------------------
    # Find current sequence
    # --------------------------------------------------------

    if current_station_sequence is None:

        if not current_station_code:
            return {
                "success": False,
                "error": "Current station information missing"
            }

        current_station_code = current_station_code.upper()

        for station in route:

            station_id = station["station_id"]

            station_response = (
                supabase
                .schema("static")
                .table("static_stations")
                .select("station_id, station_code")
                .eq("station_id", station_id)
                .limit(1)
                .execute()
            )

            if station_response.data:

                db_code = station_response.data[0]["station_code"]

                if db_code == current_station_code:
                    current_station_sequence = (
                        station["station_sequence"]
                    )
                    break

    if current_station_sequence is None:
        return {
            "success": False,
            "error": (
                f"Current station "
                f"{current_station_code} "
                f"not found in route"
            )
        }

    # --------------------------------------------------------
    # Get station IDs around current station
    # --------------------------------------------------------

    current = None
    next_station = None
    next2_station = None

    for station in route:

        seq = station["station_sequence"]

        if seq == current_station_sequence:
            current = station

        elif seq == current_station_sequence + 1:
            next_station = station

        elif seq == current_station_sequence + 2:
            next2_station = station

    # --------------------------------------------------------
    # Fetch station information
    # --------------------------------------------------------

    required_station_ids = [
        x["station_id"]
        for x in [current, next_station, next2_station]
        if x is not None
    ]

    stations = get_stations(required_station_ids)

    station_lookup = {
        station["station_id"]: station
        for station in stations
    }

    # --------------------------------------------------------
    # Merge station details
    # --------------------------------------------------------

    def enrich_station(route_station):

        if route_station is None:
            return None

        station = station_lookup.get(
            route_station["station_id"]
        )

        if not station:
            return route_station

        return {
            **route_station,

            "station_code":
                station["station_code"],

            "station_name":
                station["station_name"],

            "latitude":
                station["latitude"],

            "longitude":
                station["longitude"],

            "zone":
                station["zone"],

            "division":
                station["division"]
        }

    current = enrich_station(current)
    next_station = enrich_station(next_station)
    next2_station = enrich_station(next2_station)

    # --------------------------------------------------------
    # Metadata
    # --------------------------------------------------------

    metadata = get_train_metadata(train_id)

    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    return {
        "success": True,

        "train": train,

        "metadata": metadata,

        "current_station": current,

        "next_station": next_station,

        "next2_station": next2_station
    }