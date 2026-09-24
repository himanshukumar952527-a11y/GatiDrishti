# BACKEND/congestion.py

from datetime import datetime, timezone

from database_insert import (
    insert_congestion_data
)

from redis_manager import (
    set_json
)



# REDIS
CONGESTION_KEY_PREFIX = (
    "gatidrishti:congestion"
)
# HEADWAY
def calculate_headway(
    target_sequence,
    other_sequence
):
    """
    Calculate sequence-based headway proxy.

    Final formula should match the training
    feature-engineering logic exactly.
    """

    if target_sequence is None:
        return None

    if other_sequence is None:
        return None

    return abs(
        other_sequence -
        target_sequence
    )
# CONGESTION CALCULATION

def calculate_congestion(
    target_train_sequence,
    live_trains
):
    """
    Calculate the four GatiDrishti congestion features:

        active_train_count
        trains_ahead
        trains_behind
        avg_headway
    """

    if target_train_sequence is None:

        return {
            "success": False,
            "error":
                "Target train sequence missing"
        }

    active_trains = []

    for train in live_trains:

        if not train:
            continue

        sequence = train.get(
            "sequence"
        )

        if sequence is None:
            continue

        active_trains.append(
            train
        )

    # ACTIVE TRAIN COUNT
    active_train_count = len(
        active_trains
    )
    # AHEAD / BEHIND

    trains_ahead = 0
    trains_behind = 0

    headways = []

    for train in active_trains:

        sequence = train.get(
            "sequence"
        )

        if sequence > target_train_sequence:

            trains_ahead += 1

        elif sequence < target_train_sequence:

            trains_behind += 1

        if sequence != target_train_sequence:

            headway = calculate_headway(
                target_train_sequence,
                sequence
            )

            if headway is not None:
                headways.append(
                    headway
                )

    # AVG HEADWAY

    if headways:

        avg_headway = (
            sum(headways) /
            len(headways)
        )

    else:

        avg_headway = 0.0

    # FINAL FEATURES

    congestion = {

        "active_train_count":
            active_train_count,

        "trains_ahead":
            trains_ahead,

        "trains_behind":
            trains_behind,

        "avg_headway":
            avg_headway,

        "calculated_at":
            datetime.now(
                timezone.utc
            ).isoformat()
    }

    return {
        "success": True,
        "congestion": congestion
    }


# CONGESTION LEVEL

def determine_congestion_level(
    active_train_count,
    trains_ahead
):
    """
    Generate a simple operational congestion label
    for operational_congestion_data.

    This is separate from the four ML features.
    """

    if active_train_count <= 2:

        return "LOW"

    if active_train_count <= 5:

        return "MEDIUM"

    if active_train_count <= 8:

        return "HIGH"

    return "SEVERE"


# STORE IN REDIS

def store_congestion_redis(
    train_number,
    congestion_data,
    expiry_seconds=120
):
    """
    Store the four ML congestion features in Redis.
    """

    key = (
        f"{CONGESTION_KEY_PREFIX}:"
        f"{train_number}"
    )

    set_json(
        key,
        congestion_data,
        expiry_seconds
    )

    return {
        "success": True,
        "redis_key": key,
        "data": congestion_data
    }

# STORE IN SUPABASE

def store_congestion_database(
    station_id,
    congestion_data
):
    """
    Store congestion summary in:

        operational.operational_congestion_data
    """

    congestion_level = (
        determine_congestion_level(
            congestion_data[
                "active_train_count"
            ],
            congestion_data[
                "trains_ahead"
            ]
        )
    )

    # At this stage we don't have a reliable
    # congestion-caused delay estimate.
    #
    # Therefore do not fabricate one.

    estimated_delay = None

    date_time = congestion_data.get(
        "calculated_at"
    )

    try:

        inserted = insert_congestion_data(
            station_id=station_id,
            date_time=date_time,
            congestion_level=congestion_level,
            estimated_delay=estimated_delay
        )

        return {
            "success": True,
            "db_insert": inserted
        }

    except Exception as error:

        return {
            "success": False,
            "error": str(error)
        }


# COMPLETE CONGESTION PIPELINE

def process_congestion(
    train_number,
    station_id,
    target_train_sequence,
    live_trains,
    expiry_seconds=120
):
    """
    Complete congestion pipeline:

        Live train positions
                ↓
        Calculate congestion
                ↓
          ┌─────┴─────┐
          ↓           ↓
        Redis      Supabase
          ↓
     Feature Engineering
    """

    result = calculate_congestion(
        target_train_sequence,
        live_trains
    )

    if not result["success"]:
        return result

    congestion_data = (
        result["congestion"]
    )

    # REDIS

    redis_result = store_congestion_redis(
        train_number=train_number,
        congestion_data=congestion_data,
        expiry_seconds=expiry_seconds
    )

    # DATABASE

    database_result = (
        store_congestion_database(
            station_id=station_id,
            congestion_data=congestion_data
        )
    )

    # FINAL

    return {

        "success":
            redis_result["success"]
            and database_result["success"],

        "congestion":
            congestion_data,

        "redis":
            redis_result,

        "database":
            database_result
    }

# BASIC TEST

if __name__ == "__main__":

    test_live_trains = [

        {
            "train_number": "12951",
            "sequence": 25
        },

        {
            "train_number": "12002",
            "sequence": 28
        },

        {
            "train_number": "12309",
            "sequence": 22
        },

        {
            "train_number": "12424",
            "sequence": 30
        }
    ]

    result = process_congestion(

        train_number="12951",

        station_id=123,

        target_train_sequence=25,

        live_trains=test_live_trains
    )

    print(result)