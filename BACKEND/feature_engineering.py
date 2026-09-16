"""
===========================================================
GatiDrishti - Final Feature Engineering
===========================================================

FINAL MODEL INPUT FEATURES
--------------------------

The model receives exactly these 27 features, in this order:

1.  arr_delay
2.  dep_delay
3.  latitude
4.  longitude
5.  station_sequence
6.  distance
7.  next_station_distance_value
8.  next2_station_distance_value
9.  total_active_train
10. trains_ahead
11. trains_behind
12. avg_headway
13. avg_speed
14. max_speed
15. category_encoding
16. next_station_latitude
17. next_station_longitude
18. sch_halt_current_station
19. act_halt_current_station
20. sch_halt_next_station
21. day_night
22. weather_score
23. next_weather_score
24. weather_distance
25. next_weather_distance
26. weather_avg_speed
27. next_weather_avg_speed

TARGET
------
next_station_arr_delay

IMPORTANT
---------
- The final inference vector contains ONLY the 27 features above.
- Raw weather variables are NOT passed directly to the model.
- Event fields are NOT passed directly to the model.
- Congestion contains exactly the 4 agreed features.
- Current station arrival/departure delays are calculated from actual
  and scheduled timestamps.
- If the train is currently at the current station, dep_delay = 0.
- Remaining stations are prepared for recursive station-by-station ETA.
- For the current prototype journey logic, actual_departure is treated
  as scheduled_departure where an actual departure is not yet available.
"""

from datetime import datetime


# ============================================================
# 1. FINAL MODEL FEATURE ORDER
# ============================================================

MODEL_FEATURE_COLUMNS = [
    "arr_delay",
    "dep_delay",
    "latitude",
    "longitude",
    "station_sequence",
    "distance",
    "next_station_distance_value",
    "next2_station_distance_value",
    "total_active_train",
    "trains_ahead",
    "trains_behind",
    "avg_headway",
    "avg_speed",
    "max_speed",
    "category_encoding",
    "next_station_latitude",
    "next_station_longitude",
    "sch_halt_current_station",
    "act_halt_current_station",
    "sch_halt_next_station",
    "day_night",
    "weather_score",
    "next_weather_score",
    "weather_distance",
    "next_weather_distance",
    "weather_avg_speed",
    "next_weather_avg_speed",
]

TARGET_COLUMN = "next_station_arr_delay"


# ============================================================
# 2. SAFE VALUE HELPERS
# ============================================================

def safe_float(value, default=0.0):
    if value is None or value == "":
        return default

    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def safe_int(value, default=0):
    if value is None or value == "":
        return default

    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def first_value(data, *keys, default=None):
    """Return the first available non-None key from a dictionary."""
    if not data:
        return default

    for key in keys:
        value = data.get(key)
        if value is not None:
            return value

    return default


# ============================================================
# 3. DATETIME HELPERS
# ============================================================

def parse_datetime(value):
    """
    Parse the datetime formats used by the project.
    """
    if value is None or value == "":
        return None

    if isinstance(value, datetime):
        return value

    text = str(value).strip()

    # ISO datetime
    try:
        return datetime.fromisoformat(
            text.replace("Z", "+00:00")
        )
    except (ValueError, TypeError):
        pass

    # Common railway datetime formats
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%d-%m-%Y %H:%M:%S",
        "%d-%m-%Y %H:%M",
    ):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue

    return None


def minutes_difference(later, earlier):
    """
    Return later - earlier in minutes.
    """
    later_dt = parse_datetime(later)
    earlier_dt = parse_datetime(earlier)

    if later_dt is None or earlier_dt is None:
        return None

    return (
        later_dt - earlier_dt
    ).total_seconds() / 60.0


# ============================================================
# 4. CURRENT STATION DELAYS
# ============================================================

def calculate_arr_delay(
    actual_arrival,
    scheduled_arrival
):
    """
    Current station arrival delay:

        actual_arrival - scheduled_arrival
    """

    value = minutes_difference(
        actual_arrival,
        scheduled_arrival
    )

    return 0.0 if value is None else value


def calculate_dep_delay(
    actual_departure,
    scheduled_departure,
    train_on_station=False
):
    """
    Current station departure delay:

        actual_departure - scheduled_departure

    If the train is currently at the station,
    dep_delay is explicitly 0.
    """

    if train_on_station:
        return 0.0

    value = minutes_difference(
        actual_departure,
        scheduled_departure
    )

    return 0.0 if value is None else value


# ============================================================
# 5. CURRENT ACTUAL HALT
# ============================================================

def calculate_actual_halt(
    actual_arrival,
    actual_departure
):
    """
    Actual halt at current station:

        actual_departure - actual_arrival
    """

    value = minutes_difference(
        actual_departure,
        actual_arrival
    )

    return 0.0 if value is None else value


# ============================================================
# 6. DAY / NIGHT
# ============================================================

def calculate_day_night(timestamp=None):
    """
    Project encoding:

        Day   = 0
        Night = 1

    Day:
        06:00 - 17:59

    Night:
        18:00 - 05:59
    """

    parsed = parse_datetime(timestamp)

    if parsed is not None:
        hour = parsed.hour
    else:
        hour = datetime.now().hour

    if 6 <= hour < 18:
        return 0

    return 1


# ============================================================
# 7. TRAIN CATEGORY ENCODING
# ============================================================

def encode_category(category=None, train_type=None):
    """
    Return the category_encoding used by the trained model.

    The existing confirmed training decision is:
        missing train_type -> mail_express
        mail_express -> 2

    Other mappings should be added only when they exactly match
    the encoding used during model training.
    """

    value = category

    if value is None:
        value = train_type

    if value is None or str(value).strip() == "":
        value = "mail_express"

    # Already encoded
    try:
        numeric_value = int(value)

        if numeric_value in (1, 2, 3, 4, 5):
            return numeric_value

    except (ValueError, TypeError):
        pass

    normalized = (
        str(value)
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )

    # Confirmed training mapping
    category_encoding = {
        "mail_express": 2,
    }

    if normalized in category_encoding:
        return category_encoding[normalized]

    raise ValueError(
        f"Unknown category '{value}'. "
        "Use the exact category_encoding from training."
    )


# ============================================================
# 8. ROUTE DISTANCE FEATURES
# ============================================================

def calculate_distance_from_source(current_station):
    """
    Model feature:
        distance
    """

    return safe_float(
        first_value(
            current_station,
            "distance_from_source",
            "distance"
        )
    )


def calculate_next_station_distance(
    current_station,
    next_station
):
    """
    Distance from current station to next station:

        next.distance_from_source
        - current.distance_from_source
    """

    current_distance = calculate_distance_from_source(
        current_station
    )

    next_distance = safe_float(
        first_value(
            next_station,
            "distance_from_source",
            "distance"
        )
    )

    return next_distance - current_distance


def calculate_next2_station_distance(
    current_station,
    next2_station
):
    """
    Distance from current station to second-next station:

        next2.distance_from_source
        - current.distance_from_source
    """

    if not next2_station:
        return 0.0

    current_distance = calculate_distance_from_source(
        current_station
    )

    next2_distance = safe_float(
        first_value(
            next2_station,
            "distance_from_source",
            "distance"
        )
    )

    return next2_distance - current_distance


# ============================================================
# 9. CONGESTION
# ============================================================

CONGESTION_FEATURES = [
    "total_active_train",
    "trains_ahead",
    "trains_behind",
    "avg_headway",
]


def normalize_congestion(congestion):
    """
    Read exactly the four congestion features produced by
    congestion.py / Redis.

    Supports both:
        total_active_train
    and the older internal Redis name:
        active_train_count
    """

    congestion = congestion or {}

    return {
        "total_active_train": safe_float(
            first_value(
                congestion,
                "total_active_train",
                "active_train_count"
            )
        ),

        "trains_ahead": safe_float(
            congestion.get("trains_ahead")
        ),

        "trains_behind": safe_float(
            congestion.get("trains_behind")
        ),

        "avg_headway": safe_float(
            congestion.get("avg_headway")
        ),
    }


# ============================================================
# 10. WEATHER FEATURES
# ============================================================

def get_weather_score(weather):
    """
    Weather score should normally be produced by the same
    weather-score logic used during training.

    If weather_score is already available, use it directly.
    Otherwise calculate it from the six raw weather values.
    """

    if not weather:
        return 0.0

    # Prefer an already calculated score.
    if weather.get("weather_score") is not None:
        return safe_float(
            weather.get("weather_score")
        )

    temperature = safe_float(
        weather.get("temperature")
    )

    precipitation = safe_float(
        weather.get("precipitation")
    )

    visibility = safe_float(
        weather.get("visibility")
    )

    wind_speed = safe_float(
        weather.get("wind_speed")
    )

    cloud_cover = safe_float(
        weather.get("cloud_cover")
    )

    # Same project weighting:
    # precipitation + visibility have the highest weight.
    precipitation_score = min(
        max(precipitation, 0.0) / 10.0,
        1.0
    )

    if visibility <= 0:
        visibility_score = 1.0
    elif visibility < 1000:
        visibility_score = 1.0
    elif visibility < 5000:
        visibility_score = 0.7
    elif visibility < 10000:
        visibility_score = 0.3
    else:
        visibility_score = 0.0

    wind_score = min(
        max(wind_speed, 0.0) / 60.0,
        1.0
    )

    cloud_score = min(
        max(cloud_cover, 0.0) / 100.0,
        1.0
    )

    temperature_score = min(
        abs(temperature - 25.0) / 25.0,
        1.0
    )

    score = (
        0.35 * precipitation_score
        + 0.35 * visibility_score
        + 0.15 * wind_score
        + 0.10 * cloud_score
        + 0.05 * temperature_score
    )

    return round(score, 6)


def get_weather_context_value(
    weather,
    field,
    default=0.0
):
    """
    Read a derived weather feature from weather context.

    These fields are expected to be prepared by the weather
    pipeline when they are not directly available from the API.
    """

    if not weather:
        return default

    return safe_float(
        weather.get(field),
        default
    )


# ============================================================
# 11. MAIN FEATURE BUILDER
# ============================================================

def build_features(
    train,
    metadata,
    current_station,
    next_station,
    next2_station=None,
    live_data=None,
    current_weather=None,
    next_station_weather=None,
    congestion=None,
    prediction_time=None,
    train_on_station=False
):
    """
    Build the EXACT 27 model features.

    No extra model features are returned.
    """

    train = train or {}
    metadata = metadata or {}
    current_station = current_station or {}
    next_station = next_station or {}
    next2_station = next2_station or {}
    live_data = live_data or {}
    current_weather = current_weather or {}
    next_station_weather = next_station_weather or {}

    if not next_station:
        raise ValueError(
            "next_station is required for model prediction."
        )

    # ========================================================
    # CURRENT STATION SCHEDULE / ACTUAL DATA
    # ========================================================

    current_scheduled_arrival = first_value(
        current_station,
        "scheduled_arrival",
        "scheduledArrival"
    )

    current_scheduled_departure = first_value(
        current_station,
        "scheduled_departure",
        "scheduledDeparture"
    )

    current_actual_arrival = first_value(
        current_station,
        "actual_arrival",
        "actualArrival"
    )

    current_actual_departure = first_value(
        current_station,
        "actual_departure",
        "actualDeparture"
    )

    # If live data contains the current station actual values,
    # prefer them.
    if current_actual_arrival is None:
        current_actual_arrival = first_value(
            live_data,
            "actual_arrival",
            "actualArrival"
        )

    if current_actual_departure is None:
        current_actual_departure = first_value(
            live_data,
            "actual_departure",
            "actualDeparture"
        )

    # Current station delay features
    arr_delay = calculate_arr_delay(
        current_actual_arrival,
        current_scheduled_arrival
    )

    dep_delay = calculate_dep_delay(
        current_actual_departure,
        current_scheduled_departure,
        train_on_station=train_on_station
    )

    # Current actual halt
    act_halt_current_station = calculate_actual_halt(
        current_actual_arrival,
        current_actual_departure
    )

    # ========================================================
    # CURRENT STATION LOCATION / ROUTE
    # ========================================================

    latitude = safe_float(
        first_value(
            current_station,
            "latitude"
        )
    )

    longitude = safe_float(
        first_value(
            current_station,
            "longitude"
        )
    )

    station_sequence = safe_int(
        first_value(
            current_station,
            "station_sequence",
            "sequence"
        )
    )

    distance = calculate_distance_from_source(
        current_station
    )

    # ========================================================
    # NEXT / NEXT2 DISTANCE
    # ========================================================

    next_station_distance_value = (
        calculate_next_station_distance(
            current_station,
            next_station
        )
    )

    next2_station_distance_value = (
        calculate_next2_station_distance(
            current_station,
            next2_station
        )
    )

    # ========================================================
    # NEXT STATION LOCATION
    # ========================================================

    next_station_latitude = safe_float(
        first_value(
            next_station,
            "latitude"
        )
    )

    next_station_longitude = safe_float(
        first_value(
            next_station,
            "longitude"
        )
    )

    # ========================================================
    # HALT FEATURES
    # ========================================================

    sch_halt_current_station = safe_float(
        first_value(
            current_station,
            "scheduled_halt"
        )
    )

    sch_halt_next_station = safe_float(
        first_value(
            next_station,
            "scheduled_halt"
        )
    )

    # ========================================================
    # TRAIN FEATURES
    # ========================================================

    avg_speed = safe_float(
        first_value(
            metadata,
            "avg_speed",
            "average_speed"
        )
    )

    max_speed = safe_float(
        first_value(
            metadata,
            "max_speed",
            "maximum_speed"
        )
    )

    category_encoding = encode_category(
        category=first_value(
            metadata,
            "category",
            "train_category"
        ),
        train_type=first_value(
            train,
            "train_type",
            "trainType"
        )
    )

    # ========================================================
    # CONGESTION FEATURES
    # ========================================================

    congestion_values = normalize_congestion(
        congestion
    )

    # ========================================================
    # WEATHER FEATURES
    # ========================================================

    weather_score = get_weather_score(
        current_weather
    )

    next_weather_score = get_weather_score(
        next_station_weather
    )

    # These four values are kept as explicit inputs because they
    # were part of the final trained feature set.
    #
    # The weather pipeline should provide them using the same
    # calculation used during training.
    weather_distance = get_weather_context_value(
        current_weather,
        "weather_distance"
    )

    next_weather_distance = get_weather_context_value(
        next_station_weather,
        "weather_distance",
        default=get_weather_context_value(
            next_station_weather,
            "next_weather_distance"
        )
    )

    weather_avg_speed = get_weather_context_value(
        current_weather,
        "weather_avg_speed"
    )

    next_weather_avg_speed = get_weather_context_value(
        next_station_weather,
        "weather_avg_speed",
        default=get_weather_context_value(
            next_station_weather,
            "next_weather_avg_speed"
        )
    )

    # ========================================================
    # DAY / NIGHT
    # ========================================================

    if prediction_time is None:
        prediction_time = first_value(
            live_data,
            "last_updated_at",
            "prediction_time",
            "date_time"
        )

    if prediction_time is None:
        prediction_time = current_actual_departure

    if prediction_time is None:
        prediction_time = current_actual_arrival

    day_night = calculate_day_night(
        prediction_time
    )

    # ========================================================
    # EXACT FINAL 27 FEATURES
    # ========================================================

    features = {

        "arr_delay":
            arr_delay,

        "dep_delay":
            dep_delay,

        "latitude":
            latitude,

        "longitude":
            longitude,

        "station_sequence":
            station_sequence,

        "distance":
            distance,

        "next_station_distance_value":
            next_station_distance_value,

        "next2_station_distance_value":
            next2_station_distance_value,

        "total_active_train":
            congestion_values[
                "total_active_train"
            ],

        "trains_ahead":
            congestion_values[
                "trains_ahead"
            ],

        "trains_behind":
            congestion_values[
                "trains_behind"
            ],

        "avg_headway":
            congestion_values[
                "avg_headway"
            ],

        "avg_speed":
            avg_speed,

        "max_speed":
            max_speed,

        "category_encoding":
            category_encoding,

        "next_station_latitude":
            next_station_latitude,

        "next_station_longitude":
            next_station_longitude,

        "sch_halt_current_station":
            sch_halt_current_station,

        "act_halt_current_station":
            act_halt_current_station,

        "sch_halt_next_station":
            sch_halt_next_station,

        "day_night":
            day_night,

        "weather_score":
            weather_score,

        "next_weather_score":
            next_weather_score,

        "weather_distance":
            weather_distance,

        "next_weather_distance":
            next_weather_distance,

        "weather_avg_speed":
            weather_avg_speed,

        "next_weather_avg_speed":
            next_weather_avg_speed,
    }

    # Safety check: absolutely no unexpected model features.
    if list(features.keys()) != MODEL_FEATURE_COLUMNS:
        raise RuntimeError(
            "Feature dictionary does not match the final "
            "model feature order."
        )

    return features


# ============================================================
# 12. MODEL INPUT
# ============================================================

def prepare_model_input(features):
    """
    Convert the final feature dictionary into the exact
    2-D array expected by sklearn/XGBoost/CatBoost.

    Output:
        [[feature1, feature2, ..., feature27]]
    """

    missing = [
        feature
        for feature in MODEL_FEATURE_COLUMNS
        if feature not in features
    ]

    if missing:
        raise ValueError(
            "Missing model features: "
            + ", ".join(missing)
        )

    values = [
        safe_float(features[feature])
        for feature in MODEL_FEATURE_COLUMNS
    ]

    return [values]


# ============================================================
# 13. TARGET
# ============================================================

def calculate_target_delay(
    next_actual_arrival,
    next_scheduled_arrival
):
    """
    Training target:

        next_station_arr_delay
        = actual arrival - scheduled arrival
    """

    value = minutes_difference(
        next_actual_arrival,
        next_scheduled_arrival
    )

    if value is None:
        raise ValueError(
            "next_actual_arrival and "
            "next_scheduled_arrival are required."
        )

    return value


# ============================================================
# 14. TRAINING ROW
# ============================================================

def make_training_row(
    features,
    next_actual_arrival,
    next_scheduled_arrival
):
    """
    Create one training row:

        27 input features + target
    """

    row = {
        feature: features[feature]
        for feature in MODEL_FEATURE_COLUMNS
    }

    row[TARGET_COLUMN] = calculate_target_delay(
        next_actual_arrival,
        next_scheduled_arrival
    )

    return row


# ============================================================
# 15. REMAINING JOURNEY STATIONS
# ============================================================

def get_remaining_stations(
    route,
    current_sequence
):
    """
    Return every station after the current station.

    These stations are processed recursively:

        current -> next -> next2 -> next3 -> ... -> destination

    The number of returned stations is the number of future
    prediction steps required for the journey.
    """

    if not route:
        return []

    remaining = []

    for station in sorted(
        route,
        key=lambda x: safe_int(
            first_value(
                x,
                "station_sequence",
                "sequence"
            )
        )
    ):
        sequence = safe_int(
            first_value(
                station,
                "station_sequence",
                "sequence"
            )
        )

        if sequence > int(current_sequence):
            remaining.append(station)

    return remaining


def get_next_station_pair(
    route,
    current_sequence
):
    """
    Return:

        next_station
        next2_station
    """

    remaining = get_remaining_stations(
        route,
        current_sequence
    )

    next_station = (
        remaining[0]
        if len(remaining) >= 1
        else None
    )

    next2_station = (
        remaining[1]
        if len(remaining) >= 2
        else None
    )

    return next_station, next2_station


# ============================================================
# 16. JOURNEY PREDICTION PLAN
# ============================================================

def create_journey_prediction_plan(
    route,
    current_sequence
):
    """
    Prepare the complete future station sequence for the
    output/prediction layer.

    No dummy data is used here.
    """

    remaining = get_remaining_stations(
        route,
        current_sequence
    )

    plan = []

    for station in remaining:

        scheduled_arrival = first_value(
            station,
            "scheduled_arrival",
            "scheduledArrival"
        )

        scheduled_departure = first_value(
            station,
            "scheduled_departure",
            "scheduledDeparture"
        )

        # Current prototype convention:
        # when actual departure is not yet available,
        # use scheduled departure.
        actual_departure = first_value(
            station,
            "actual_departure",
            "actualDeparture"
        )

        if actual_departure is None:
            actual_departure = scheduled_departure

        plan.append(
            {
                "station_id": first_value(
                    station,
                    "station_id",
                    "stationId"
                ),

                "station_code": first_value(
                    station,
                    "station_code",
                    "stationCode"
                ),

                "station_name": first_value(
                    station,
                    "station_name",
                    "stationName"
                ),

                "station_sequence": safe_int(
                    first_value(
                        station,
                        "station_sequence",
                        "sequence"
                    )
                ),

                "scheduled_arrival":
                    scheduled_arrival,

                "scheduled_departure":
                    scheduled_departure,

                "actual_departure":
                    actual_departure,

                "scheduled_halt": safe_float(
                    first_value(
                        station,
                        "scheduled_halt"
                    )
                ),
            }
        )

    return plan


# ============================================================
# 17. SIMPLE CONTEXT WRAPPER
# ============================================================

def create_model_features(
    context,
    live_data,
    current_weather=None,
    next_station_weather=None,
    congestion=None,
    prediction_time=None,
    train_on_station=False
):
    """
    Build the final model features from the DB/live context.

    Expected context:

        {
            "train": ...,
            "metadata": ...,
            "current": ...,
            "next_station": ...,
            "next2_station": ...
        }
    """

    if not context:
        raise ValueError(
            "Database context is missing."
        )

    if not context.get("next_station"):
        raise ValueError(
            "Next station is required."
        )

    return build_features(
        train=context.get("train"),
        metadata=context.get("metadata"),
        current_station=context.get("current"),
        next_station=context.get("next_station"),
        next2_station=context.get("next2_station"),
        live_data=live_data,
        current_weather=current_weather,
        next_station_weather=next_station_weather,
        congestion=congestion,
        prediction_time=prediction_time,
        train_on_station=train_on_station
    )


# ============================================================
# 18. TEST
# ============================================================

if __name__ == "__main__":

    print(
        "GatiDrishti feature_engineering.py loaded."
    )

    print(
        f"Final model features: "
        f"{len(MODEL_FEATURE_COLUMNS)}"
    )

    for index, feature in enumerate(
        MODEL_FEATURE_COLUMNS,
        start=1
    ):
        print(
            f"{index:02d}. {feature}"
        )

    print(
        f"\nTarget: {TARGET_COLUMN}"
    )
