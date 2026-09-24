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

    current_sequence must be the DATABASE station_sequence,
    not the RailRadar sequence.
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
# HELPER: NORMALIZE STATION CODE
# ============================================================

def normalize_station_code(code):
    """
    Normalize station code for reliable comparison.
    """

    if code is None:
        return None

    return str(code).strip().upper()


# ============================================================
# FINAL DATABASE FUNCTION
# ============================================================

def fetch_live_database_context(
    train_number,
    current_station_code=None,
    current_station_sequence=None,
    previous_halt=None,
    next_halt=None
):
    """
    Main database function used by live_data.py.

    IMPORTANT:
    RailRadar's sequence is NOT treated as the database
    station_sequence.

    Logic:

    1. If RailRadar current location is a scheduled station,
       use that station as current.

    2. If current location is NOT a scheduled station,
       use previousHalt as current scheduled station.

    3. Use nextHalt as next scheduled station.

    4. Use database route sequence to find next2 station.

    Example:

        RailRadar:
            currentLocation = DRRN
            previousHalt = BRC
            nextHalt = RTM

        Database:
            BRC = sequence 4
            RTM = sequence 5
            NAD = sequence 6

        Result:
            current = BRC
            next = RTM
            next2 = NAD
    """

    # --------------------------------------------------------
    # Get train
    # --------------------------------------------------------

    train = get_train(train_number)

    if not train:
        return {
            "success": False,
            "error": "Train not found in database"
        }

    train_id = train["train_id"]

    # --------------------------------------------------------
    # Get route
    # --------------------------------------------------------

    route = get_train_route(train_id)

    if not route:
        return {
            "success": False,
            "error": "Train route not found in database"
        }

    # --------------------------------------------------------
    # Debug information
    # --------------------------------------------------------

    print("\n========== DEBUG LIVE CONTEXT ==========")

    print("Train number:", train_number)

    print("RailRadar current station code:",
          current_station_code)

    print("RailRadar current sequence:",
          current_station_sequence)

    print("Previous halt:",
          previous_halt)

    print("Next halt:",
          next_halt)

    print("\nDB ROUTE:")

    for station in route:
        print(
            "seq =", station.get("station_sequence"),
            "| station_id =", station.get("station_id")
        )

    print("========================================\n")

    # --------------------------------------------------------
    # Fetch station details for entire route
    #
    # This is done once instead of querying every station
    # individually.
    # --------------------------------------------------------

    station_ids = list({
        station["station_id"]
        for station in route
        if station.get("station_id") is not None
    })

    stations = get_stations(station_ids)

    station_lookup = {
        station["station_id"]: station
        for station in stations
    }

    # --------------------------------------------------------
    # Build route with station information
    # --------------------------------------------------------

    enriched_route = []

    for route_station in route:

        station = station_lookup.get(
            route_station["station_id"]
        )

        if station:

            enriched_station = {
                **route_station,

                "station_code":
                    station.get("station_code"),

                "station_name":
                    station.get("station_name"),

                "latitude":
                    station.get("latitude"),

                "longitude":
                    station.get("longitude"),

                "zone":
                    station.get("zone"),

                "division":
                    station.get("division")
            }

        else:

            enriched_station = route_station

        enriched_route.append(enriched_station)

    # --------------------------------------------------------
    # Build station-code lookup
    # --------------------------------------------------------

    station_code_lookup = {}

    for station in enriched_route:

        code = normalize_station_code(
            station.get("station_code")
        )

        if code:
            station_code_lookup[code] = station

    # --------------------------------------------------------
    # Normalize RailRadar values
    # --------------------------------------------------------

    live_code = normalize_station_code(
        current_station_code
    )

    previous_code = normalize_station_code(
        (previous_halt or {}).get("stationCode")
    )

    next_code = normalize_station_code(
        (next_halt or {}).get("stationCode")
    )

    # --------------------------------------------------------
    # Determine current scheduled station
    # --------------------------------------------------------

    current_station = None
    next_station = None
    next2_station = None

    # ========================================================
    # CASE 1:
    # Current RailRadar location itself is a scheduled
    # station in our database.
    # ========================================================

    if live_code and live_code in station_code_lookup:

        current_station = station_code_lookup[live_code]

        print(
            "Current location is a scheduled DB station:",
            live_code
        )

    # ========================================================
    # CASE 2:
    # Current RailRadar location is an intermediate/
    # unscheduled location.
    #
    # Example:
    #
    # currentLocation = DRRN
    # previousHalt = BRC
    # nextHalt = RTM
    #
    # Therefore:
    #
    # current = BRC
    # next = RTM
    # ========================================================

    elif previous_code and previous_code in station_code_lookup:

        current_station = station_code_lookup[previous_code]

        print(
            "Current location is intermediate."
        )

        print(
            "Using previous scheduled halt as current:",
            previous_code
        )

    else:

        return {
            "success": False,
            "error": (
                "Unable to determine current scheduled "
                "station from RailRadar data"
            )
        }

    # --------------------------------------------------------
    # Determine current DB sequence
    # --------------------------------------------------------

    current_sequence = current_station.get(
        "station_sequence"
    )

    if current_sequence is None:

        return {
            "success": False,
            "error": (
                "Current scheduled station has no "
                "database station_sequence"
            )
        }

    # --------------------------------------------------------
    # Determine next station
    #
    # Prefer RailRadar nextHalt if it exists in the DB route.
    # Otherwise use DB sequence + 1.
    # --------------------------------------------------------

    if next_code and next_code in station_code_lookup:

        candidate_next = station_code_lookup[next_code]

        candidate_sequence = candidate_next.get(
            "station_sequence"
        )

        # Ensure next halt is actually ahead of current station
        if (
            candidate_sequence is not None
            and candidate_sequence > current_sequence
        ):
            next_station = candidate_next

    # --------------------------------------------------------
    # Fallback:
    # Use database route ordering
    # --------------------------------------------------------

    if next_station is None:

        for station in enriched_route:

            if (
                station.get("station_sequence")
                == current_sequence + 1
            ):
                next_station = station
                break

    # --------------------------------------------------------
    # Determine next2 station
    #
    # Always based on database route ordering.
    # --------------------------------------------------------

    if next_station is not None:

        next_sequence = next_station.get(
            "station_sequence"
        )

        if next_sequence is not None:

            for station in enriched_route:

                if (
                    station.get("station_sequence")
                    == next_sequence + 1
                ):
                    next2_station = station
                    break

    # --------------------------------------------------------
    # Validate next station
    # --------------------------------------------------------

    if next_station is None:

        return {
            "success": False,
            "error": (
                "Next scheduled station not found "
                "in database route"
            )
        }

    # --------------------------------------------------------
    # Metadata
    # --------------------------------------------------------

    metadata = get_train_metadata(train_id)

    # --------------------------------------------------------
    # Debug final context
    # --------------------------------------------------------

    print("\n========== FINAL STATION CONTEXT ==========")

    print(
        "Current:",
        current_station.get("station_code"),
        "|",
        current_station.get("station_name"),
        "| seq =",
        current_station.get("station_sequence")
    )

    print(
        "Next:",
        next_station.get("station_code"),
        "|",
        next_station.get("station_name"),
        "| seq =",
        next_station.get("station_sequence")
    )

    if next2_station:

        print(
            "Next2:",
            next2_station.get("station_code"),
            "|",
            next2_station.get("station_name"),
            "| seq =",
            next2_station.get("station_sequence")
        )

    else:

        print("Next2: None")

    print("===========================================\n")

    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    return {
        "success": True,

        "train": train,

        "metadata": metadata,

        "current_station": current_station,

        "next_station": next_station,

        "next2_station": next2_station
    }