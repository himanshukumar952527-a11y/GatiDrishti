# BACKEND/app.py

import os
import logging
from datetime import datetime, timedelta

from flask import Flask, request, jsonify
from flask_cors import CORS
from zoneinfo import ZoneInfo

import database_function

from live_data import get_live_train_context
from weather_data import fetch_current_and_next_weather
from congestion import process_congestion

from feature_engineering import (
    create_model_features,
    MODEL_FEATURE_COLUMNS
)

from prediction import predict_train_status

from database_insert import (
    insert_weather_data,
    insert_next_station_weather_data,
    insert_train_running_history,
    insert_temporary_training_data
)

from prediction_insert import (
    insert_prediction
)



#Configuration


app = Flask(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

INDIA_TZ = ZoneInfo("Asia/Kolkata")



# TIME HELPERS

def parse_time_to_minutes(value):
    """
    Convert HH:MM / HH:MM:SS into minutes from midnight.
    """

    if value is None:
        return None

    value = str(value).strip()

    if not value:
        return None

    try:
        parts = value.split(":")

        hour = int(parts[0])
        minute = int(parts[1])

        return hour * 60 + minute

    except (
        ValueError,
        IndexError
    ):
        return None


def format_schedule_time(value):
    """
    Convert DB/API scheduled datetime/time into HH:MM.
    """

    if value is None:
        return "--"

    text = str(value).strip()

    if not text:
        return "--"

    # ISO datetime
    if "T" in text:
        text = text.split("T", 1)[1]

    # Datetime with space
    elif (
        " " in text
        and len(text.split(" ", 1)[1]) >= 5
    ):
        text = text.split(" ", 1)[1]

    # Timezone
    if "+" in text:
        text = text.split("+", 1)[0]

    if "Z" in text:
        text = text.replace("Z", "")

    # Microseconds
    if "." in text:
        text = text.split(".", 1)[0]

    return text[:5]


def _parse_journey_date(value):
    """
    Return a date object from a request/journey-date value.
    """

    if value is None:
        return datetime.now(
            INDIA_TZ
        ).date()

    text = str(value).strip()

    if not text:
        return datetime.now(
            INDIA_TZ
        ).date()

    try:

        if "T" in text:
            text = text.split("T", 1)[0]

        elif " " in text:
            text = text.split(" ", 1)[0]

        return datetime.strptime(
            text,
            "%Y-%m-%d"
        ).date()

    except ValueError:

        return datetime.now(
            INDIA_TZ
        ).date()


def _scheduled_datetime(
    value,
    journey_date
):
    """
    Convert schedule value into India-time datetime.
    """

    if value is None:
        return None

    text = str(value).strip()

    if not text:
        return None

    try:

        # Full ISO datetime
        if "T" in text:

            parsed = datetime.fromisoformat(
                text.replace(
                    "Z",
                    "+00:00"
                )
            )

            if parsed.tzinfo is None:

                return parsed.replace(
                    tzinfo=INDIA_TZ
                )

            return parsed.astimezone(
                INDIA_TZ
            )

        # Datetime with space
        if (
            " " in text
            and "-" in text.split(
                " ",
                1
            )[0]
        ):

            parsed = datetime.fromisoformat(
                text
            )

            if parsed.tzinfo is None:

                return parsed.replace(
                    tzinfo=INDIA_TZ
                )

            return parsed.astimezone(
                INDIA_TZ
            )

        minutes = parse_time_to_minutes(
            text
        )

        if minutes is None:
            return None

        return datetime.combine(
            journey_date,
            datetime.min.time()
        ).replace(
            hour=minutes // 60,
            minute=minutes % 60,
            tzinfo=INDIA_TZ
        )

    except (
        TypeError,
        ValueError,
        OverflowError
    ):
        return None


#Predicted arrival time 


def compute_predicted_arrival_time(
    scheduled_arrival,
    predicted_delay_minutes
):
    """
    Convert scheduled arrival datetime/time + predicted delay
    into HH:MM for frontend.
    """

    if scheduled_arrival is None:
        return None

    text = str(
        scheduled_arrival
    ).strip()

    if not text:
        return None

    # ISO datetime:
    # 2026-09-19T00:25:00+05:30
    if "T" in text:

        text = text.split(
            "T",
            1
        )[1]

    # Datetime with space:
    # 2026-09-19 00:25:00
    elif " " in text:

        text = text.split(
            " ",
            1
        )[1]

    # Remove timezone
    if "+" in text:

        text = text.split(
            "+",
            1
        )[0]

    if "Z" in text:

        text = text.replace(
            "Z",
            ""
        )

    # Remove microseconds
    if "." in text:

        text = text.split(
            ".",
            1
        )[0]

    scheduled_time = text[:5]

    base_minutes = parse_time_to_minutes(
        scheduled_time
    )

    if base_minutes is None:
        return None

    try:

        delay = float(
            predicted_delay_minutes
        )

    except (
        TypeError,
        ValueError
    ):

        return None

    predicted_minutes = (
        base_minutes
        + round(delay)
    )

    predicted_minutes %= (
        24 * 60
    )

    hour = (
        predicted_minutes // 60
    )

    minute = (
        predicted_minutes % 60
    )

    return f"{hour:02d}:{minute:02d}"


def build_prediction_datetime(
    scheduled_arrival,
    predicted_clock,
    journey_date
):
    """
    Convert predicted HH:MM into a full India-time datetime.

    If scheduled_arrival contains a complete date, its date is used.
    Otherwise journey_date is used.
    """

    if not predicted_clock:
        return None

    if predicted_clock == "--":
        return None
    # Determine base date
    base_date = None

    if scheduled_arrival:

        text = str(
            scheduled_arrival
        ).strip()

        try:

            if "T" in text:

                parsed = datetime.fromisoformat(
                    text.replace(
                        "Z",
                        "+00:00"
                    )
                )

                base_date = (
                    parsed.astimezone(
                        INDIA_TZ
                    ).date()
                    if parsed.tzinfo
                    else parsed.date()
                )

            elif (
                " " in text
                and "-"
                in text.split(
                    " ",
                    1
                )[0]
            ):

                parsed = datetime.fromisoformat(
                    text
                )

                base_date = (
                    parsed.astimezone(
                        INDIA_TZ
                    ).date()
                    if parsed.tzinfo
                    else parsed.date()
                )

        except (
            TypeError,
            ValueError
        ):
            base_date = None

    
    #Fallback to journey date
    
    if base_date is None:

        parsed_journey_date = (
            _parse_journey_date(
                journey_date
            )
        )

        base_date = parsed_journey_date
    # Parse predicted clock
    try:

        parts = str(
            predicted_clock
        ).split(":")

        hour = int(
            parts[0]
        )

        minute = int(
            parts[1]
        )

    except (
        TypeError,
        ValueError,
        IndexError
    ):

        return None

    if not (
        0 <= hour <= 23
        and 0 <= minute <= 59
    ):
        return None

    result = datetime(
        base_date.year,
        base_date.month,
        base_date.day,
        hour,
        minute,
        tzinfo=INDIA_TZ
    )

    return result.isoformat()


# NEW: PREDICTION TIMESTAMP FORMATTER (display only)

def format_prediction_timestamp(value):
    """
    NEW.

    Convert a STORED prediction timestamp (the value written to the
    prediction record) into:

        (iso_string_in_india_time, "HH:MM" in india time)

    Returns (None, None) when the value is missing / unparseable.
    It NEVER falls back to the current time.
    """

    if value is None:
        return None, None

    parsed = None

    try:

        if isinstance(value, datetime):
            parsed = value

        elif (
            isinstance(value, (int, float))
            and not isinstance(value, bool)
        ):
            seconds = float(value)

            # epoch milliseconds -> seconds
            if seconds > 1e11:
                seconds /= 1000.0

            parsed = datetime.fromtimestamp(
                seconds,
                tz=INDIA_TZ
            )

        else:
            text = str(value).strip()

            if not text:
                return None, None

            try:
                # numeric string: epoch seconds / milliseconds
                seconds = float(text)

                if seconds > 1e11:
                    seconds /= 1000.0

                parsed = datetime.fromtimestamp(
                    seconds,
                    tz=INDIA_TZ
                )

            except ValueError:
                parsed = datetime.fromisoformat(
                    text.replace("Z", "+00:00")
                )

    except (
        TypeError,
        ValueError,
        OverflowError,
        OSError
    ):
        return None, None

    if parsed.tzinfo is None:
        # Project convention: naive timestamps are India time.
        parsed = parsed.replace(tzinfo=INDIA_TZ)
    else:
        parsed = parsed.astimezone(INDIA_TZ)

    return parsed.isoformat(), parsed.strftime("%H:%M")


# JOURNEY DAY
def _calculate_route_day(
    route,
    current_sequence
):
    """
    Calculate journey-relative day from static route.

    Day increments whenever scheduled clock moves backwards.
    """

    if not route or current_sequence is None:
        return 1

    sorted_route = sorted(
        route,
        key=lambda item: (
            item.get(
                "station_sequence",
                0
            ) or 0
        )
    )

    day = 1
    previous_minutes = None

    for item in sorted_route:

        sequence = item.get(
            "station_sequence"
        )

        try:

            sequence = int(
                sequence
            )

        except (
            TypeError,
            ValueError
        ):

            continue

        value = (
            item.get(
                "scheduled_arrival"
            )
            or item.get(
                "scheduled_departure"
            )
        )

        minutes = parse_time_to_minutes(
            value
        )

        if minutes is None:
            continue

        if (
            previous_minutes is not None
            and minutes < previous_minutes
        ):
            day += 1

        if sequence >= int(
            current_sequence
        ):
            return day

        previous_minutes = minutes

    return day




# JOURNEY STATUS DETECTION
# detect_journey_status() is a PURE function: no database call, no
# live-API call, no ML call. get_train_journey_status() fetches the
# data once and passes it in.
#
# Statuses: NOT_STARTED | RUNNING | AT_STATION | COMPLETED | UNKNOWN
# Only RUNNING and AT_STATION allow a next-station prediction.
NOT_STARTED = "NOT_STARTED"
RUNNING = "RUNNING"
AT_STATION = "AT_STATION"
COMPLETED = "COMPLETED"
UNKNOWN = "UNKNOWN"

MSG_NOT_STARTED = "Train has not started its journey yet."
MSG_COMPLETED = "Train journey completed."
MSG_DEPARTURE_PASSED = (
    "Scheduled departure time has passed, but live data indicates "
    "that the train has not started."
)
MSG_DEPARTURE_UNVERIFIED = "Scheduled departure time could not be verified."
MSG_UNAVAILABLE = "Live train status is currently unavailable."
MSG_INCONSISTENT = (
    "Live train data is incomplete or inconsistent. "
    "Prediction is not available right now."
)
# Live-status vocabularies (compared after _norm_status)

_STATUS_COMPLETED = {
    "completed", "complete", "terminated", "journey-completed",
    "destination-reached", "reached-destination"
}
_STATUS_NOT_STARTED = {
    "not-started", "yet-to-start", "scheduled", "upcoming"
}
_STATUS_AT_STATION = {
    "at-station", "halted", "stopped", "arrived", "at-platform"
}
_STATUS_DEPARTED = {
    "departed", "running", "in-transit", "between-stations",
    "approaching", "en-route", "enroute"
}

_EMPTY_VALUES = {"", "--", "-", "na", "n/a", "null", "none", "nan"}

# A "recorded" actual time later than now + this is a forecast,
# not something that has happened.
_FUTURE_TOLERANCE = timedelta(minutes=10)


# SMALL HELPERS

def _norm_status(value):
    return (
        str(value or "")
        .strip()
        .lower()
        .replace("_", "-")
        .replace(" ", "-")
    )


def _norm_code(value):
    if value is None:
        return ""
    return str(value).strip().upper()


def _has_value(value):
    if value is None:
        return False
    return str(value).strip().lower() not in _EMPTY_VALUES


def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _is_real_actual(value, now):
    """
    True only if `value` is a recorded actual time that has already
    happened. Empty markers ("--", null, ...) and future timestamps
    (forecasts) are not actuals. Values that cannot be parsed
    (e.g. "17:22") are accepted as recorded.
    """
    if not _has_value(value):
        return False

    text = str(value).strip()
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return True

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=INDIA_TZ)

    return parsed <= now + _FUTURE_TOLERANCE


def _station_code(station):
    if not isinstance(station, dict):
        return ""
    return _norm_code(
        station.get("station_code")
        or station.get("stationCode")
        or station.get("code")
    )


def _find_route_index(route, station):
    """
    Locate `station` in the COMPLETE route.
    Order: station_id -> station_code -> station_sequence.
    Returns an index or None.
    """
    if not isinstance(station, dict):
        return None

    station_id = station.get("station_id")
    if station_id is not None:
        for index, item in enumerate(route):
            if item.get("station_id") == station_id:
                return index

    code = _station_code(station)
    if code:
        for index, item in enumerate(route):
            if _station_code(item) == code:
                return index

    sequence = _to_int(station.get("station_sequence"))
    if sequence is not None:
        for index, item in enumerate(route):
            if _to_int(item.get("station_sequence")) == sequence:
                return index

    return None


def _build_live_lookup(live_data):
    """RailRadar route -> {STATION_CODE: record}."""
    lookup = {}
    live_route = live_data.get("route")

    if not isinstance(live_route, list):
        return lookup

    for record in live_route:
        if not isinstance(record, dict):
            continue
        code = _norm_code(
            record.get("stationCode") or record.get("station_code")
        )
        if code:
            lookup[code] = record

    return lookup


def _record_time(record, camel, snake):
    if not isinstance(record, dict):
        return None
    for key in (camel, snake):
        if _has_value(record.get(key)):
            return record.get(key)
    return None



# MAIN DETECTOR


def detect_journey_status(
    route,
    live_data,
    current_station,
    next_station,
    scheduled_departure_dt=None,
    now=None
):
    """
    Decide whether a next-station prediction is valid.

    route                   COMPLETE, unfiltered DB route (any order)
    live_data               context["live"] (may be empty/None)
    current_station         DB dict for the live current station (or None)
    next_station            DB dict for the next halt (or None)
    scheduled_departure_dt  tz-aware datetime of origin departure, or None
    now                     tz-aware datetime (defaults to IST now)

    Never raises for bad/missing data; returns UNKNOWN instead.
    """

    now = now or datetime.now(INDIA_TZ)

    route = sorted(
        [item for item in (route or []) if isinstance(item, dict)],
        key=lambda item: _to_int(item.get("station_sequence")) or 0
    )

    live_data = live_data if isinstance(live_data, dict) else {}
    location = live_data.get("current_location")
    location = location if isinstance(location, dict) else {}

    live_status = _norm_status(location.get("status"))
    live_sequence = _to_int(location.get("sequence"))
    live_lookup = _build_live_lookup(live_data)

    origin = route[0] if route else {}
    final = route[-1] if route else {}
    final_code = _station_code(final)

    current_code = _station_code(current_station)
    next_code = _station_code(next_station)

    def build(status, allowed, message, reason, **extra):
        payload = {
            "journey_status": status,
            "is_prediction_allowed": allowed,
            "current_station": current_code or None,
            "current_station_name": (
                (current_station or {}).get("station_name")
            ),
            "next_station": next_code if allowed else None,
            "message": message,
            "reason": reason,
            "live_status": live_status or None,
            "origin_station": _station_code(origin) or None,
            "final_station": final_code or None,
            "final_station_name": final.get("station_name"),
            "scheduled_departure": origin.get("scheduled_departure"),
            "actual_arrival": None,
            "actual_departure": None,
            "station_state": None
        }
        payload.update(extra)

        logger.info(
            "[JOURNEY STATUS] status=%s allowed=%s current=%s next=%s "
            "live_status=%r live_seq=%s reason=%s",
            status,
            allowed,
            payload["current_station"],
            payload["next_station"],
            live_status,
            live_sequence,
            reason
        )
        return payload

  
    # 0. Route is mandatory
   
    if not route:
        return build(
            UNKNOWN, False, MSG_UNAVAILABLE, "complete route missing"
        )

    # Final-station evidence from live data (not from filtered route)
    final_record = live_lookup.get(final_code)
    final_actual_arrival = _record_time(
        final_record, "actualArrival", "actual_arrival"
    )
    final_arrived = _is_real_actual(final_actual_arrival, now)
    live_says_completed = live_status in _STATUS_COMPLETED

    # 1. Current station must be resolvable
  
    current_index = _find_route_index(route, current_station)

    if current_index is None:
        if final_arrived:
            return build(
                COMPLETED, False, MSG_COMPLETED,
                "final station has actual arrival; current station "
                "unresolved",
                current_station=final_code,
                current_station_name=final.get("station_name"),
                actual_arrival=final_actual_arrival,
                station_state="completed"
            )

        if not live_data:
            return build(
                UNKNOWN, False, MSG_UNAVAILABLE,
                "live data unavailable"
            )

        return build(
            UNKNOWN, False, MSG_INCONSISTENT,
            "current station not found on complete route"
        )

    current_code = current_code or _station_code(route[current_index])
    is_origin = current_index == 0
    is_final = current_index == len(route) - 1

    # 2. Live sequence must agree with the route on the ORIGIN edge.
    #    (Sequence 1 is the origin in any numbering scheme.)
    if live_sequence is not None and (live_sequence == 1) != is_origin:
        return build(
            UNKNOWN, False, MSG_INCONSISTENT,
            f"live sequence {live_sequence} contradicts route position "
            f"{current_index}"
        )

    # 3. Actual times of the CURRENT station
    current_record = live_lookup.get(current_code)

    actual_arrival = (
        _record_time(current_record, "actualArrival", "actual_arrival")
        or live_data.get("actual_arrival")
    )
    actual_departure = (
        _record_time(current_record, "actualDeparture", "actual_departure")
        or live_data.get("actual_departure")
    )

    has_arrived = _is_real_actual(actual_arrival, now)
    has_departed = (
        _is_real_actual(actual_departure, now)
        or live_status in _STATUS_DEPARTED
    )

    # 4. COMPLETED  (final station of the COMPLETE route)
    if is_final:
        return build(
            COMPLETED, False, MSG_COMPLETED,
            "current station is last station of complete route"
            + (" (arrival confirmed)" if final_arrived or has_arrived
               else " (arrival time not reported)"),
            current_station_name=final.get("station_name"),
            actual_arrival=(
                actual_arrival if has_arrived
                else final_actual_arrival if final_arrived
                else None
            ),
            station_state="completed"
        )

    if final_arrived:
        # Live route shows an actual arrival at the final station even
        # though the "current" pointer is behind it.
        return build(
            COMPLETED, False, MSG_COMPLETED,
            "final station has actual arrival",
            current_station=final_code,
            current_station_name=final.get("station_name"),
            actual_arrival=final_actual_arrival,
            station_state="completed"
        )

    if live_says_completed:
        # Live says completed but nothing proves it and the route says
        # otherwise -> do not guess.
        return build(
            UNKNOWN, False, MSG_INCONSISTENT,
            "live status 'completed' but current station is not the "
            "final station and no final arrival recorded"
        )

    # 5. A valid next station must exist and lie AFTER the current one
    next_index = _find_route_index(route, next_station)

    if next_index is None or next_index <= current_index:
        return build(
            UNKNOWN, False, MSG_UNAVAILABLE,
            "no valid next station in live/database context"
        )

    # Live pointer stale? (next station already has a real arrival)
    next_record = live_lookup.get(next_code)
    if _is_real_actual(
        _record_time(next_record, "actualArrival", "actual_arrival"), now
    ):
        return build(
            UNKNOWN, False, MSG_INCONSISTENT,
            "next station already has an actual arrival; live current "
            "station looks stale"
        )

    # 6. NOT STARTED  (origin, no departure)
    if is_origin:
        if has_departed:
            return build(
                RUNNING, True, None,
                "departed from origin",
                actual_departure=actual_departure,
                station_state="departed"
            )

        origin_status_ok = (
            live_status == ""
            or live_status in _STATUS_NOT_STARTED
            or live_status in _STATUS_AT_STATION
        )
        before_departure = (
            scheduled_departure_dt is not None
            and now < scheduled_departure_dt
        )

        if origin_status_ok or before_departure:
            # scheduled_departure_dt is None when the date/time could
            # not be verified (see resolve_scheduled_departure()).
            overdue = None
            departure_note = None

            if scheduled_departure_dt is None:
                departure_note = MSG_DEPARTURE_UNVERIFIED
            elif now >= scheduled_departure_dt:
                overdue = int(
                    (now - scheduled_departure_dt).total_seconds() // 60
                )
                departure_note = MSG_DEPARTURE_PASSED
            # else: scheduled departure is still in the future -> no note

            return build(
                NOT_STARTED, False, MSG_NOT_STARTED,
                "at origin, no actual departure"
                + (
                    f" ({overdue} min past scheduled departure)"
                    if overdue is not None else ""
                ),
                next_station=None,
                station_state="not_started",
                departure_overdue_minutes=overdue,
                departure_note=departure_note
            )

        return build(
            UNKNOWN, False, MSG_INCONSISTENT,
            f"origin with unrecognised live status {live_status!r} and "
            "no actual departure"
        )

    # 7. Intermediate station: AT_STATION vs RUNNING
    at_station = (not has_departed) and (
        live_status in _STATUS_AT_STATION or has_arrived
    )

    if at_station:
        return build(
            AT_STATION, True,
            f"Train is currently at "
            f"{(current_station or {}).get('station_name') or current_code}"
            " station.",
            "arrived at intermediate station, not departed",
            actual_arrival=actual_arrival if has_arrived else None,
            station_state="at_station"
        )

    return build(
        RUNNING, True, None,
        "departed from current station / travelling",
        actual_arrival=actual_arrival if has_arrived else None,
        actual_departure=(
            actual_departure
            if _is_real_actual(actual_departure, now) else None
        ),
        station_state="departed" if has_departed else "approaching"
    )


# SCHEDULED DEPARTURE (date-safe)
MAX_DEPARTURE_OVERDUE_MIN = 12 * 60     # passed, still not started
MAX_DEPARTURE_AHEAD_MIN = 24 * 60       # not yet due


def resolve_scheduled_departure(value, journey_date, now):
    """
    Return the tz-aware scheduled departure datetime for THIS journey,
    or None if it cannot be verified.
    """

    def log(scheduled, diff, verdict):
        logger.info(
            "[DEPARTURE DEBUG] now=%s scheduled=%s journey_date=%s "
            "tz=%s raw=%r diff_min=%s -> %s",
            now.isoformat(),
            scheduled.isoformat() if scheduled else None,
            journey_date,
            INDIA_TZ.key,
            value,
            diff,
            verdict
        )

    if journey_date is None or value is None or not str(value).strip():
        log(None, None, "missing date/time")
        return None

    parsed = _scheduled_datetime(value, journey_date)

    if parsed is None:
        log(None, None, "unparseable")
        return None

    if str(value).strip()[:4].isdigit() and parsed.date() != journey_date:
        logger.warning(
            "[DEPARTURE DEBUG] stored schedule date %s differs from "
            "journey date %s; using time of day only",
            parsed.date(),
            journey_date
        )

    def candidate(day_offset):
        return datetime.combine(
            journey_date + timedelta(days=day_offset),
            parsed.time(),
            tzinfo=INDIA_TZ
        )

    def minutes_past(moment):
        return int((now - moment).total_seconds() // 60)

    chosen = candidate(0)
    diff = minutes_past(chosen)

    # Overnight case: 00:30 now, 23:50 schedule of the journey date is
    # ~23h away, but yesterday's 23:50 is 40 min ago.
    if diff < -MAX_DEPARTURE_OVERDUE_MIN:
        previous = candidate(-1)
        previous_diff = minutes_past(previous)
        if 0 <= previous_diff <= MAX_DEPARTURE_OVERDUE_MIN:
            chosen, diff = previous, previous_diff

    if -MAX_DEPARTURE_AHEAD_MIN <= diff <= MAX_DEPARTURE_OVERDUE_MIN:
        log(chosen, diff, "verified")
        return chosen

    log(chosen, diff, "REJECTED: implausible difference")
    return None

# JOURNEY PROGRESS (distance based)

ROUTE_DISTANCE_FIELD = None     # None = auto-detect from route rows
ROUTE_DISTANCE_MODE = None      # None = infer from field name / values

_DISTANCE_NAME_HINTS = ("dist", "km", "kilomet")
_CUMULATIVE_NAME_HINTS = (
    "from", "cumul", "source", "origin", "start", "total", "chainage"
)
_SEGMENT_NAME_HINTS = (
    "segment", "leg", "next", "prev", "between", "section"
)

_LAT_KEYS = ("latitude", "lat")
_LNG_KEYS = ("longitude", "lng", "lon", "long")


def _valid_km(value):
    """Finite, non-negative float or None (bool/NaN/inf/negative -> None)."""
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number != number or number in (float("inf"), float("-inf")):
        return None
    return number if number >= 0 else None


def _route_row_key(row):
    for name in ("station_id", "station_code", "stationCode"):
        if row.get(name) not in (None, ""):
            return (name, str(row.get(name)).strip().upper())
    return None


def _dedupe_route(route):
    """
    Complete route sorted by station_sequence with duplicate station
    records (same station, or same sequence) removed. First one wins.
    """
    rows = sorted(
        [r for r in (route or []) if isinstance(r, dict)],
        key=lambda r: _to_int(r.get("station_sequence")) or 0
    )

    seen_stations, seen_sequences, clean = set(), set(), []

    for row in rows:
        key = _route_row_key(row)
        sequence = _to_int(row.get("station_sequence"))

        if (key is not None and key in seen_stations) or (
            sequence is not None and sequence in seen_sequences
        ):
            logger.warning(
                "[PROGRESS] duplicate route record ignored: %r", key
            )
            continue

        if key is not None:
            seen_stations.add(key)
        if sequence is not None:
            seen_sequences.add(sequence)
        clean.append(row)

    return clean


def _detect_distance_field(rows):
    """Numeric column whose name looks like a distance, with most values."""
    counts = {}
    for row in rows:
        for name, value in row.items():
            lowered = str(name).lower()
            if (
                any(h in lowered for h in _DISTANCE_NAME_HINTS)
                and "id" not in lowered.split("_")
                and _valid_km(value) is not None
            ):
                counts[name] = counts.get(name, 0) + 1

    if not counts:
        return None

    best = sorted(counts, key=lambda n: (-counts[n], str(n)))[0]

    if len(counts) > 1:
        logger.warning(
            "[PROGRESS] several distance-like columns %s; using %r. "
            "Set ROUTE_DISTANCE_FIELD to pin one.", sorted(counts), best
        )
    return best


def _cumulative_distances(rows):
    """
    Returns (cumulative_km_list, field, mode) or (None, field, mode)
    when the distances cannot be trusted. cumulative_km_list[i] is the
    distance from the origin to rows[i]; [0] is always 0.
    """
    field = ROUTE_DISTANCE_FIELD or _detect_distance_field(rows)

    if not field:
        logger.warning("[PROGRESS] no distance field found in route rows")
        return None, None, None

    values = [_valid_km(r.get(field)) for r in rows]

    mode = ROUTE_DISTANCE_MODE
    if mode not in ("cumulative", "segment"):
        lowered = str(field).lower()
        if any(h in lowered for h in _SEGMENT_NAME_HINTS):
            mode = "segment"
        elif any(h in lowered for h in _CUMULATIVE_NAME_HINTS):
            mode = "cumulative"
        else:
            known = [v for v in values if v is not None]
            mode = (
                "cumulative"
                if len(known) >= 3
                and known == sorted(known)
                and known[-1] > known[0]
                else "segment"
            )
            logger.warning(
                "[PROGRESS] distance mode inferred from values: %s "
                "(field %r). Set ROUTE_DISTANCE_MODE to pin it.",
                mode, field
            )

    # every station after the origin needs a usable value
    if len(rows) < 2 or any(v is None for v in values[1:]):
        logger.warning(
            "[PROGRESS] distance data incomplete for field %r: %s",
            field, values
        )
        return None, field, mode

    cumulative = [0.0]

    if mode == "cumulative":
        base = values[0] or 0.0
        for value in values[1:]:
            reading = value - base
            if reading < cumulative[-1]:
                logger.warning(
                    "[PROGRESS] cumulative distance decreased (%s < %s); "
                    "segment treated as 0", reading, cumulative[-1]
                )
                reading = cumulative[-1]
            cumulative.append(reading)
    else:
        for value in values[1:]:
            cumulative.append(cumulative[-1] + value)

    if cumulative[-1] <= 0:
        logger.warning("[PROGRESS] total route distance is 0")
        return None, field, mode

    return cumulative, field, mode


def _coords(source):
    if not isinstance(source, dict):
        return None
    lat = lng = None
    for key in _LAT_KEYS:
        lat = _valid_coord(source.get(key), 90)
        if lat is not None:
            break
    for key in _LNG_KEYS:
        lng = _valid_coord(source.get(key), 180)
        if lng is not None:
            break
    if lat is None or lng is None or (lat == 0 and lng == 0):
        return None
    return lat, lng


def _valid_coord(value, limit):
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if -limit <= number <= limit else None


def _haversine_km(a, b):
    from math import radians, sin, cos, asin, sqrt
    (la1, lo1), (la2, lo2) = a, b
    dla, dlo = radians(la2 - la1), radians(lo2 - lo1)
    h = sin(dla / 2) ** 2 + cos(radians(la1)) * cos(radians(la2)) * sin(dlo / 2) ** 2
    return 2 * 6371.0 * asin(sqrt(h))


def _segment_fraction(live_data, previous_row, next_row):
    """
    Fraction (0..1) of the way from previous_row to next_row using a
    reliable live train position, else None. The position must differ
    from the previous station and lie plausibly ON the segment.
    """
    location = (live_data or {}).get("current_location")
    train = _coords(location) or _coords(live_data)
    if train is None:
        return None

    stations = {}
    ids = [
        r.get("station_id") for r in (previous_row, next_row)
        if r.get("station_id") is not None
    ]
    if ids and hasattr(database_function, "get_stations"):
        try:
            for st_row in database_function.get_stations(ids) or []:
                stations[st_row.get("station_id")] = st_row
        except Exception:
            logger.exception("[PROGRESS] station coordinate lookup failed")

    a = _coords(stations.get(previous_row.get("station_id"))) or _coords(previous_row)
    b = _coords(stations.get(next_row.get("station_id"))) or _coords(next_row)
    if a is None or b is None:
        return None

    seg = _haversine_km(a, b)
    d_prev, d_next = _haversine_km(a, train), _haversine_km(train, b)

    # unreliable if the position is far off the a->b line
    if seg <= 0 or d_prev + d_next > 1.5 * seg + 2.0:
        return None

    return min(1.0, max(0.0, d_prev / (d_prev + d_next))) if (d_prev + d_next) > 0 else None


def compute_route_progress(
    route,
    journey_status,
    current_station,
    next_station=None,
    live_data=None
):
    """
    Distance-based journey progress + scheduled-stops-reached.

    journey_status: NOT_STARTED / RUNNING / AT_STATION / COMPLETED /
                    UNKNOWN (from detect_journey_status()).
    """

    rows = _dedupe_route(route)

    result = {
        "origin_station": _station_code(rows[0]) or None if rows else None,
        "final_station": _station_code(rows[-1]) or None if rows else None,
        "distance_covered_km": None,
        "total_distance_km": None,
        "journey_progress_percent": None,
        "scheduled_stops_reached": None,
        "total_scheduled_stops": len(rows),
        "distance_field": None,
        "distance_mode": None,
        "progress_source": None
    }

    if not rows:
        return result

    cumulative, field, mode = _cumulative_distances(rows)
    result["distance_field"], result["distance_mode"] = field, mode
    total = cumulative[-1] if cumulative else None
    last = len(rows) - 1

    current_index = _find_route_index(rows, current_station)

    covered, reached, source = None, None, "station"

    if journey_status == "NOT_STARTED":
        covered, reached = 0.0, 0
    elif journey_status == "COMPLETED":
        covered, reached = total, len(rows)
    elif journey_status in ("RUNNING", "AT_STATION") and current_index is not None:
        reached = current_index + 1
        if cumulative:
            covered = cumulative[current_index]

            if journey_status == "RUNNING" and current_index < last:
                fraction = _segment_fraction(
                    live_data, rows[current_index], rows[current_index + 1]
                )
                if fraction is not None:
                    covered += fraction * (
                        cumulative[current_index + 1] - cumulative[current_index]
                    )
                    source = "live_position"

    # ---- percent (distance based only) ----------------------
    percent = None
    if journey_status == "NOT_STARTED":
        percent = 0.0
    elif journey_status == "COMPLETED":
        percent = 100.0
    elif covered is not None and total:
        percent = min(100.0, max(0.0, covered / total * 100.0))

    result.update({
        "distance_covered_km": (
            round(min(covered, total), 2)
            if covered is not None and total else covered
        ),
        "total_distance_km": round(total, 2) if total else None,
        "journey_progress_percent": (
            round(percent, 1) if percent is not None else None
        ),
        "scheduled_stops_reached": reached,
        "progress_source": source
    })

    logger.info(
        "[PROGRESS] status=%s stops=%s/%s covered=%s total=%s "
        "percent=%s field=%r mode=%s source=%s",
        journey_status, reached, len(rows),
        result["distance_covered_km"], result["total_distance_km"],
        result["journey_progress_percent"], field, mode, source
    )

    return result

# TRAIN JOURNEY STATUS

def get_train_journey_status(
    train_number,
    journey_date=None
):

    # 1. TRAIN + COMPLETE ROUTE  (never the filtered route)
    train = database_function.get_train(train_number)

    if not train:
        raise RuntimeError(
            f"Train {train_number} not found in database."
        )

    train_id = train.get("train_id")

    if train_id is None:
        raise RuntimeError("Train ID unavailable.")

    route = database_function.get_train_route(train_id)

    if not route:
        raise RuntimeError("Train route not found in database.")

    route = sorted(
        route,
        key=lambda item: (
            item.get("station_sequence", 0) or 0
        )
    )

    # 2. SCHEDULED DEPARTURE FROM ORIGIN
    start_date = _parse_journey_date(journey_date)

    scheduled_departure = route[0].get("scheduled_departure")

    now_ist = datetime.now(INDIA_TZ)

    scheduled_departure_dt = resolve_scheduled_departure(
        scheduled_departure,
        start_date,
        now_ist
    )

    # 3. LIVE CONTEXT  (single call, reused by predict())
    context = None

    try:
        context = get_live_train_context(train_number)
    except Exception as error:
        logger.warning(
            "[JOURNEY STATUS] live context failed for %s: %s",
            train_number,
            error
        )

    if not isinstance(context, dict) or not context.get("success"):
        logger.warning(
            "[JOURNEY STATUS] live context unavailable for %s: %s",
            train_number,
            (
                context.get("error")
                if isinstance(context, dict)
                else "invalid context"
            )
        )
        context = None

    live_data = (context or {}).get("live") or {}
    database_data = (context or {}).get("database") or {}

    if not isinstance(live_data, dict):
        live_data = {}

    if not isinstance(database_data, dict):
        database_data = {}

    current_station = database_data.get("current_station")
    next_station = database_data.get("next_station")

    # 4. DETECT
    detection = detect_journey_status(
        route=route,
        live_data=live_data,
        current_station=current_station,
        next_station=next_station,
        scheduled_departure_dt=scheduled_departure_dt,
        now=now_ist
    )

    # 5. JOURNEY DAY
    journey_day = 1

    current_sequence = (
        (current_station or {}).get("station_sequence")
    )

    try:
        if current_sequence is not None:
            journey_day = _calculate_route_day(
                route,
                int(current_sequence)
            )
    except Exception:
        journey_day = 1

    # 6. ROUTE PROGRESS (complete route, distance based)
    route_progress = compute_route_progress(
        route=route,
        journey_status=detection["journey_status"],
        current_station=current_station,
        next_station=next_station,
        live_data=live_data
    )

    return {
        "route_progress": route_progress,
        "status": detection["journey_status"].lower(),
        "detection": detection,
        "journey_day": journey_day,
        "journey_date": start_date.isoformat(),
        "scheduled_departure": scheduled_departure,
        "live_context": context,
        "train": train,
        "route": route,
        "current_station": current_station,
        "next_station": next_station
    }


def build_no_prediction_response(
    train_number,
    journey_status
):
    """
    Response for every state where prediction is NOT allowed
    (NOT_STARTED / COMPLETED / UNKNOWN).

    Carries NO prediction values: no delay, no delay change, no ETA.
    Scheduled stops are still returned so the timetable keeps working.
    """

    detection = journey_status["detection"]
    status = detection["journey_status"]

    status_text = {
        "NOT_STARTED": "Train Not Started",
        "COMPLETED": "Journey Completed"
    }.get(status, "Status Unavailable")

    live_data = (
        (journey_status.get("live_context") or {}).get("live") or {}
    )

    stops = []

    try:
        stops = build_scheduled_ui_stops(
            train_number=train_number,
            live_route=live_data.get("route", []),
            current_code=detection.get("current_station"),
            next_code=None,
            predicted_eta=None
        )
    except Exception:
        logger.exception("Scheduled stops could not be built")

    payload = {
        "success": True,
        "train_number": train_number,
        "journey_date": journey_status["journey_date"],
        "journey_status": status,
        "is_prediction_allowed": False,
        "status_text": status_text,
        "message": detection["message"],
        "journey_day": journey_status["journey_day"],
        "current_station": detection.get("current_station"),
        "current_station_name": detection.get("current_station_name"),
        "next_station": None,
        "next_station_name": None,
        "origin_station": detection.get("origin_station"),
        "scheduled_departure": (
            format_schedule_time(detection.get("scheduled_departure"))
            if detection.get("scheduled_departure")
            else None
        ),
        "departure_overdue_minutes": detection.get(
            "departure_overdue_minutes"
        ),
        "departure_note": detection.get("departure_note"),
        "final_station": detection.get("final_station"),
        "final_station_name": detection.get("final_station_name"),
        "actual_arrival": (
            format_schedule_time(detection["actual_arrival"])
            if detection.get("actual_arrival")
            else None
        ),
        "scheduled_arrival": None,
        "predicted_delay_change": None,
        "predicted_delay": None,
        "predicted_arrival_time": None,
        "model": None,
        "feature_count": 0
    }

    payload.update(journey_status.get("route_progress") or {})

    # Omit the key when empty so the frontend keeps the stops it
    # already has instead of overwriting them with [].
    if stops:
        payload["stops"] = stops

    return payload


# CORS

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "https://gati-drishti.vercel.app",
                "http://127.0.0.1:5500",
                "http://localhost:5500"
            ]
        }
    }
)


# MODEL PATH

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.getenv(
    "MODEL_PATH",
    os.path.join(
        BASE_DIR,
        "gatidrishti_catboost_final.cbm"
    )
)


# HEALTH CHECK

@app.route(
    "/api/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "success":
            True,

        "service":
            "GatiDrishti Backend",

        "status":
            "healthy",

        "model_available":
            os.path.exists(
                MODEL_PATH
            )
    })

# BUILD UI STOPS

def build_scheduled_ui_stops(
    train_number,
    live_route=None,
    current_code=None,
    next_code=None,
    predicted_eta=None
):
    """
    Build UI stops using:

    Supabase:
        scheduled route data

    RailRadar:
        actual arrival/departure

    Matching:
        station CODE only
    """

    train = database_function.get_train(
        train_number
    )

    if not train:
        return []

    train_id = train.get(
        "train_id"
    )

    if train_id is None:
        return []

    route = database_function.get_train_route(
        train_id
    )

    if not route:
        return []

    route = sorted(
        route,
        key=lambda item: (
            item.get(
                "station_sequence",
                0
            ) or 0
        )
    )

    # Station lookup

    station_ids = [

        item.get(
            "station_id"
        )

        for item in route

        if item.get(
            "station_id"
        ) is not None
    ]

    station_lookup = {}

    if (
        station_ids
        and hasattr(
            database_function,
            "get_stations"
        )
    ):

        stations = (
            database_function.get_stations(
                station_ids
            )
        )

        station_lookup = {

            station.get(
                "station_id"
            ):
            station

            for station in stations

            if station.get(
                "station_id"
            ) is not None
        }

    # RailRadar route lookup

    live_lookup = {}

    if isinstance(
        live_route,
        list
    ):

        for live_station in live_route:

            if not isinstance(
                live_station,
                dict
            ):
                continue

            code = (
                live_station.get(
                    "stationCode"
                )
                or live_station.get(
                    "station_code"
                )
            )

            if code:

                live_lookup[
                    str(code)
                    .strip()
                    .upper()
                ] = live_station

    # DEBUG: LIVE ROUTE

    print(
        "[LIVE ROUTE DEBUG] count =",
        len(live_route)
        if isinstance(
            live_route,
            list
        )
        else 0
    )

    print(
        "[LIVE ROUTE DEBUG] BRC =",
        live_lookup.get("BRC")
    )

    print(
        "[LIVE ROUTE DEBUG] RTM =",
        live_lookup.get("RTM")
    )

    # Normalize current / next codes

    current_code = (

        str(
            current_code
        )
        .strip()
        .upper()

        if current_code

        else ""
    )

    next_code = (

        str(
            next_code
        )
        .strip()
        .upper()

        if next_code

        else ""
    )

    stops = []

    last_index = (
        len(route) - 1
    )

    # Build stops

    for index, route_station in enumerate(
        route
    ):

        try:

            scheduled_halt = float(
                route_station.get(
                    "scheduled_halt",
                    0
                ) or 0
            )

        except (
            TypeError,
            ValueError
        ):

            scheduled_halt = 0.0

        is_endpoint = (

            index == 0

            or

            index == last_index
        )

        if (
            not is_endpoint
            and scheduled_halt <= 0
        ):

            continue

        station_id = (
            route_station.get(
                "station_id"
            )
        )

        station = (
            station_lookup.get(
                station_id,
                {}
            )
        )

        station_code = (

            station.get(
                "station_code"
            )

            or

            route_station.get(
                "station_code"
            )

            or ""
        )

        station_code = (
            str(
                station_code
            )
            .strip()
            .upper()
        )

        station_name = (

            station.get(
                "station_name"
            )

            or

            route_station.get(
                "station_name"
            )

            or

            station_code

            or

            "Unknown Station"
        )
        # LIVE RECORD

        live_record = (
            live_lookup.get(
                station_code
            )
        )

        actual_arrival = None
        actual_departure = None

        if live_record:

            actual_arrival = (

                live_record.get(
                    "actualArrival"
                )

                or

                live_record.get(
                    "actual_arrival"
                )
            )

            actual_departure = (

                live_record.get(
                    "actualDeparture"
                )

                or

                live_record.get(
                    "actual_departure"
                )
            )

        # COACH POSITION (RailRadar live route)


        coach_position = None

        if live_record:

            coach_position = (

                live_record.get(
                    "coachPosition"
                )

                or

                live_record.get(
                    "coach_position"
                )

                or

                live_record.get(
                    "coachPositions"
                )

                or

                live_record.get(
                    "coach_positions"
                )
            )

        # CURRENT / NEXT

        is_current = (
            station_code
            == current_code
        )

        is_next = (
            station_code
            == next_code
            and not is_current
        )

        eta = (

            predicted_eta

            if (
                is_next
                and predicted_eta
            )

            else None
        )

        # DEBUG BRC / RTM

        if station_code in [
            "BRC",
            "RTM"
        ]:

            print(
                "[STOP DEBUG]",
                station_code,
                "live_record =",
                live_record,
                "actual_arrival =",
                actual_arrival,
                "actual_departure =",
                actual_departure,
                "eta =",
                eta
            )

        stops.append({

            "station_sequence":
                route_station.get(
                    "station_sequence"
                ),

            "code":
                station_code,

            "name":
                station_name,

            "sch_arr":
                format_schedule_time(
                    route_station.get(
                        "scheduled_arrival"
                    )
                ),

            "sch_dep":
                format_schedule_time(
                    route_station.get(
                        "scheduled_departure"
                    )
                ),

            "act_arr":
                (
                    format_schedule_time(
                        actual_arrival
                    )
                    if actual_arrival
                    else "--"
                ),

            "act_dep":
                (
                    format_schedule_time(
                        actual_departure
                    )
                    if actual_departure
                    else "--"
                ),

            "eta":
                eta or "--",

            "current":
                is_current,

            "next":
                is_next,

            "coach_position":
                coach_position
        })

    return stops

# TRAIN SEARCH

@app.route(
    "/api/trains",
    methods=["GET"]
)
def search_trains():

    query = request.args.get(
        "search",
        ""
    ).strip()

    if not query:

        return jsonify({

            "success":
                False,

            "error":
                "Search query is required"
        }), 400

    try:

        result = (
            database_function.fetch_train_data(
                query
            )
        )

        if not result:

            return jsonify({

                "success":
                    False,

                "data":
                    None,

                "error":
                    "Train not found"
            }), 404

        try:

            result["stops"] = (
                build_scheduled_ui_stops(
                    query
                )
            )

        except Exception:

            logger.exception(
                "Unable to build scheduled stop list"
            )

            result["stops"] = []

        return jsonify({

            "success":
                True,

            "data":
                result
        }), 200

    except Exception as error:

        logger.exception(
            "Train search failed"
        )

        return jsonify({

            "success":
                False,

            "data":
                None,

            "error":
                "Unable to fetch train data",

            "details":
                str(error)
        }), 500


# PNR STATUS

@app.route(
    "/api/pnr/<pnr_number>",
    methods=["GET"]
)
def pnr_status(
    pnr_number
):

    if (
        not pnr_number.isdigit()
        or len(pnr_number) != 10
    ):

        return jsonify({

            "success":
                False,

            "error":
                "PNR must be a 10-digit number"
        }), 400

    try:

        result = (
            database_function.fetch_pnr_status(
                pnr_number
            )
        )

        return jsonify(
            result
        )

    except Exception as error:

        logger.exception(
            "PNR lookup failed"
        )

        return jsonify({

            "success":
                False,

            "error":
                "Unable to fetch PNR status",

            "details":
                str(error)
        }), 500


# LIVE TRAIN PREPARATION

def prepare_live_trains(
    target_train_number,
    live_route,
    target_sequence
):
    """
    Prepare train sequence data for congestion.py.
    """

    live_trains = []

    if not isinstance(
        live_route,
        list
    ):

        live_route = []

    for item in live_route:

        if not isinstance(
            item,
            dict
        ):
            continue

        sequence = (
            item.get(
                "sequence"
            )
            or item.get(
                "stationSequence"
            )
        )

        if sequence is None:
            continue

        try:

            sequence = int(
                sequence
            )

        except (
            TypeError,
            ValueError
        ):

            continue

        live_trains.append({

            "train_number":
                item.get(
                    "trainNumber",
                    target_train_number
                ),

            "sequence":
                sequence
        })

    target_exists = any(

        str(
            item.get(
                "train_number"
            )
        )
        ==
        str(
            target_train_number
        )

        for item in live_trains
    )

    if not target_exists:

        live_trains.append({

            "train_number":
                str(
                    target_train_number
                ),

            "sequence":
                int(
                    target_sequence
                )
        })

    return live_trains


# ============================================================
# BUILD FINAL MODEL FEATURE ROW
# ============================================================

def build_raw_feature_row(
    train_number,
    journey_date=None,
    live_context=None
):

    logger.info(
        "Prediction started for train %s",
        train_number
    )

    # STEP 1: LIVE TRAIN + DATABASE

    context = (

        live_context

        if live_context is not None

        else

        get_live_train_context(
            train_number
        )
    )

    if not context.get(
        "success"
    ):

        raise RuntimeError(
            context.get(
                "error",
                "Unable to fetch live train context"
            )
        )

    live_data = context.get(
        "live",{}
    )

    database_data = context[
        "database"
    ]

    # STEP 2: DATABASE CONTEXT

    train = database_data.get(
        "train"
    )

    metadata = database_data.get(
        "metadata"
    )

    current_station = (
        database_data.get(
            "current_station"
        )
    )

    next_station = (
        database_data.get(
            "next_station"
        )
    )

    next2_station = (
        database_data.get(
            "next2_station"
        )
    )

    if not train:

        raise RuntimeError(
            "Train not found in database"
        )

    if not current_station:

        raise RuntimeError(
            "Current station not found"
        )

    if not next_station:

        raise RuntimeError(
            "No next station available. "
            "Train may have reached destination."
        )

    # STEP 3: CURRENT SEQUENCE

    current_sequence = (
        current_station.get(
            "station_sequence"
        )
    )

    if current_sequence is None:

        current_sequence = (

            live_data
            .get(
                "current_location",
                {}
            )
            .get(
                "sequence"
            )
        )

    if current_sequence is None:

        raise RuntimeError(
            "Current station sequence unavailable"
        )

    try:

        current_sequence = int(
            current_sequence
        )

    except (
        TypeError,
        ValueError
    ):

        raise RuntimeError(
            "Invalid current station sequence"
        )

    # STEP 4: WEATHER

    # weather_result = (
    #     fetch_current_and_next_weather(
    #         current_station=current_station,
    #         next_station=next_station
    #     )
    # )

    # if not weather_result.get(
    #     "success"
    # ):

    #     raise RuntimeError(
    #         "Unable to fetch weather data"
    #     )

    # current_weather_result = (
    #     weather_result.get(
    #         "current_weather",
    #         {}
    #     )
    # )

    # next_weather_result = (
    #     weather_result.get(
    #         "next_station_weather",
    #         {}
    #     )
    # )

    # current_weather = (
    #     current_weather_result.get(
    #         "weather",
    #         {}
    #     )
    # )

    # next_station_weather = (
    #     next_weather_result.get(
    #         "weather",
    #         {}
    #     )
    # )
    # STEP 4: WEATHER

    weather_result = fetch_current_and_next_weather(
        current_station=current_station,
        next_station=next_station
    )

    # Detailed weather failure handling
    if not weather_result.get("success", False):

        current_weather_result = weather_result.get(
            "current_weather",
            {}
        )

        next_weather_result = weather_result.get(
            "next_station_weather",
            {}
        )

        current_error = current_weather_result.get(
            "error",
            "Unknown current weather error"
        )

        current_details = current_weather_result.get(
            "details",
            ""
        )

        next_error = next_weather_result.get(
            "error",
            "Unknown next weather error"
        )

        next_details = next_weather_result.get(
            "details",
            ""
        )

        logger.error(
            "WEATHER FAILURE | Current station: %s",
            current_station
        )

        logger.error(
            "WEATHER FAILURE | Next station: %s",
            next_station
        )

        logger.error(
            "CURRENT WEATHER RESULT: %s",
            current_weather_result
        )

        logger.error(
            "NEXT WEATHER RESULT: %s",
            next_weather_result
        )

        raise RuntimeError(
            "Unable to fetch weather data | "
            f"Current: {current_error} {current_details} | "
            f"Next: {next_error} {next_details}"
        )

    current_weather_result = weather_result.get(
        "current_weather",
        {}
    )

    next_weather_result = weather_result.get(
        "next_station_weather",
        {}
    )

    current_weather = current_weather_result.get(
        "weather",
        {}
    )

    next_station_weather = next_weather_result.get(
        "weather",
        {}
    )
    # STEP 5: CONGESTION

    live_route = live_data.get(
        "route",
        []
    )

    live_trains = prepare_live_trains(
        target_train_number=train_number,
        live_route=live_route,
        target_sequence=current_sequence
    )

    congestion_result = process_congestion(
        train_number=train_number,
        target_train_sequence=current_sequence,
        live_trains=live_trains,
        station_id=current_station.get(
            "station_id"
        )
    )

    if isinstance(
        congestion_result,
        dict
    ):

        congestion = (
            congestion_result.get(
                "congestion",
                congestion_result
            )
        )

    else:

        congestion = {}

    # STEP 6: FEATURE CONTEXT

    feature_context = {

        "train":
            train,

        "metadata":
            metadata,

        "current":
            current_station,

        "next_station":
            next_station,

        "next2_station":
            next2_station
    }

    # STEP 7: PREDICTION TIME

    prediction_time = (

        live_data.get(
            "last_updated_at"
        )

        or

        live_data.get(
            "fetched_at"
        )

        or

        datetime.now(
            INDIA_TZ
        ).isoformat()
    )

    # STEP 8: FINAL 27 FEATURES

    features = create_model_features(

        context=feature_context,

        live_data=live_data,

        current_weather=current_weather,

        next_station_weather=next_station_weather,

        congestion=congestion,

        prediction_time=prediction_time,

        train_on_station=(

            live_data
            .get(
                "current_location",
                {}
            )
            .get(
                "is_halt",
                False
            )
        )
    )
    # STEP 9: VERIFY FEATURES
    missing_features = [

        feature

        for feature in MODEL_FEATURE_COLUMNS

        if feature not in features
    ]

    if missing_features:

        raise RuntimeError(
            "Missing model features: "
            + ", ".join(
                missing_features
            )
        )

    if len(features) != len(
        MODEL_FEATURE_COLUMNS
    ):

        logger.warning(
            "Feature dictionary contains %d "
            "values; expected %d model features",
            len(features),
            len(MODEL_FEATURE_COLUMNS)
        )

    logger.info(
        "27 model features successfully generated"
    )

    # RETURN
    return {

        "features":
            features,

        "train_number":
            str(
                train_number
            ),

        "journey_date": (

            live_data.get(
                "journey_date"
            )

            or

            journey_date
        ),

        "current_station":
            current_station,

        "next_station":
            next_station,

        "next2_station":
            next2_station,

        "live_data":
            live_data,

        "congestion":
            congestion,

        "weather": {

            "current":
                current_weather,

            "next":
                next_station_weather
        }
    }


# PREDICTION API
@app.route(
    "/api/predict",
    methods=["POST"]
)
def predict():

    try:

        body = (
            request.get_json(
                silent=True
            )
            or {}
        )

        train_number = body.get(
            "train_number"
        )

        journey_date = body.get(
            "date"
        )

        
        if not train_number:

            return jsonify({

                "success":
                    False,

                "error":
                    "train_number is required"
            }), 400

        train_number = str(
            train_number
        ).strip()

        if not train_number:

            return jsonify({

                "success":
                    False,

                "error":
                    "Invalid train number"
            }), 400

        # MODEL CHECK
        if not os.path.exists(
            MODEL_PATH
        ):

            return jsonify({

                "success":
                    False,

                "error":
                    "CatBoost model not found"
            }), 500

        logger.info(
            "Prediction started for train %s",
            train_number
        )

        # STEP 1: JOURNEY STATUS
        journey_status = (
            get_train_journey_status(
                train_number=train_number,
                journey_date=journey_date
            )
        )

        # NOT STARTED / COMPLETED / UNKNOWN
        detection = journey_status["detection"]

        if not detection["is_prediction_allowed"]:

            logger.info(
                "Prediction skipped for train %s: %s (%s)",
                train_number,
                detection["journey_status"],
                detection["reason"]
            )

            return jsonify(
                build_no_prediction_response(
                    train_number,
                    journey_status
                )
            )

        # STEP 2: COMPLETE PIPELINE

        pipeline = build_raw_feature_row(

            train_number=train_number,

            journey_date=journey_date,

            live_context=(
                journey_status[
                    "live_context"
                ]
            )
        )

        features = pipeline[
            "features"
        ]

        current_station = (
            pipeline[
                "current_station"
            ]
        )

        next_station = (
            pipeline[
                "next_station"
            ]
        )

        live_data = pipeline[
            "live_data"
        ]

        weather = pipeline[
            "weather"
        ]

        current_weather = (
            weather.get(
                "current"
            )
            or {}
        )

        next_station_weather = (
            weather.get(
                "next"
            )
            or {}
        )

        # STEP 3: PREDICTION TIME

        prediction_time = (

            live_data.get(
                "last_updated_at"
            )

            or

            live_data.get(
                "fetched_at"
            )

            or

            datetime.now(
                INDIA_TZ
            ).isoformat()
        )

        # STEP 4: CATBOOST

        (
            predicted_delay_change,
            _
        ) = predict_train_status(
            MODEL_PATH,
            features
        )

        predicted_delay_change = float(
            predicted_delay_change
        )

        # STEP 5: CURRENT DELAY

        current_arr_delay = float(
            features.get(
                "arr_delay",
                0
            )
        )

        current_dep_delay = float(
            features.get(
                "dep_delay",
                0
            )
        )

        current_total_delay = (
            current_arr_delay
            + current_dep_delay
        )

        # STEP 6: FINAL PREDICTED DELAY

        predicted_delay = (
            current_total_delay
            + predicted_delay_change
        )

        # STEP 7: NEXT STATION ETA

        scheduled_arrival = (
            next_station.get(
                "scheduled_arrival"
            )
        )

        predicted_arrival_time = (
            compute_predicted_arrival_time(
                scheduled_arrival,
                predicted_delay
            )
        )

        # ETA DEBUG

        print(
            "[ETA DEBUG]",
            "scheduled_arrival =",
            repr(
                scheduled_arrival
            ),
            "predicted_delay =",
            repr(
                predicted_delay
            ),
            "predicted_arrival =",
            repr(
                predicted_arrival_time
            )
        )

        # STEP 7A: UI STOPS

        ui_stops = (
            build_scheduled_ui_stops(

                train_number=train_number,

                live_route=(
                    live_data.get(
                        "route",
                        []
                    )
                ),

                current_code=(
                    current_station.get(
                        "station_code"
                    )
                ),

                next_code=(
                    next_station.get(
                        "station_code"
                    )
                ),

                predicted_eta=(
                    predicted_arrival_time
                )
            )
        )

        # STEP 8: TRAIN IDs

        train = database_function.get_train(
            train_number
        )

        if not train:

            raise RuntimeError(
                f"Train {train_number} "
                "not found in database."
            )

        train_id = train.get(
            "train_id"
        )

        current_station_id = (
            current_station.get(
                "station_id"
            )
        )

        current_route_id = (
            current_station.get(
                "route_id"
            )
        )

        next_station_id = (
            next_station.get(
                "station_id"
            )
        )

        # PERSISTENCE IDs

        weather_id = None
        next_weather_id = None
        running_id = None
        temp_training_id = None
        prediction_id = None
        stored_prediction_row = None  # NEW: row returned by insert_prediction

        # STEP 9: RUNNING HISTORY

        try:

            actual_arrival = (
                live_data.get(
                    "actual_arrival"
                )
            )

            actual_departure = (
                live_data.get(
                    "actual_departure"
                )
            )

            running_result = (
                insert_train_running_history(

                    train_id=train_id,

                    station_id=(
                        current_station_id
                    ),

                    route_id=(
                        current_route_id
                    ),

                    weather_id=None,

                    date_time=(
                        prediction_time
                    ),

                    actual_arrival=(
                        actual_arrival
                    ),

                    actual_departure=(
                        actual_departure
                    ),

                    arrival_delay=(
                        current_arr_delay
                    ),

                    departure_delay=(
                        current_dep_delay
                    )
                )
            )

            if running_result:

                running_id = (
                    running_result[0].get(
                        "running_id"
                    )
                )

            logger.info(
                "Running history stored. "
                "running_id=%s",
                running_id
            )

        except Exception as error:

            logger.exception(
                "Running history insertion failed: %s",
                error
            )

        # STEP 10: CURRENT WEATHER

        try:

            if current_station_id is not None:

                weather_result = (
                    insert_weather_data(
                        running_id = running_id,
                        station_id=(
                            current_station_id
                        ),

                        date_time=(
                            prediction_time
                        ),

                        temperature=(
                            current_weather.get(
                                "temperature"
                            )
                        ),

                        precipitation=(
                            current_weather.get(
                                "precipitation"
                            )
                        ),

                        visibility=(
                            current_weather.get(
                                "visibility"
                            )
                        ),

                        wind_speed=(
                            current_weather.get(
                                "wind_speed"
                            )
                        ),

                        wind_direction=(
                            current_weather.get(
                                "wind_direction"
                            )
                        ),

                        cloud_cover=(
                            current_weather.get(
                                "cloud_cover"
                            )
                        )
                    )
                )

                if weather_result:

                    weather_id = (
                        weather_result[0].get(
                            "weather_id"
                        )
                    )

                logger.info(
                    "Current weather stored. "
                    "weather_id=%s",
                    weather_id
                )

        except Exception as error:

            logger.exception(
                "Current weather insertion failed: %s",
                error
            )

        # STEP 11: NEXT STATION WEATHER

        try:

            if next_station_id is not None:

                next_weather_result = (
                    insert_next_station_weather_data(
                        running_id = running_id,

                        station_id=(
                            next_station_id
                        ),

                        date_time=(
                            prediction_time
                        ),

                        temperature=(
                            next_station_weather.get(
                                "temperature"
                            )
                        ),

                        precipitation=(
                            next_station_weather.get(
                                "precipitation"
                            )
                        ),

                        visibility=(
                            next_station_weather.get(
                                "visibility"
                            )
                        ),

                        wind_speed=(
                            next_station_weather.get(
                                "wind_speed"
                            )
                        ),

                        wind_direction=(
                            next_station_weather.get(
                                "wind_direction"
                            )
                        ),

                        cloud_cover=(
                            next_station_weather.get(
                                "cloud_cover"
                            )
                        )
                    )
                )

                if next_weather_result:

                    next_weather_id = (
                        next_weather_result[0].get(
                            "next_weather_id"
                        )
                    )

                logger.info(
                    "Next-station weather stored. "
                    "next_weather_id=%s",
                    next_weather_id
                )

        except Exception as error:

            logger.exception(
                "Next-station weather insertion failed: %s",
                error
            )

        # STEP 12: 27-FEATURE SNAPSHOT

        if running_id is not None:

            try:

                feature_result = (
                    insert_temporary_training_data(

                        running_id=(
                            running_id
                        ),

                        input_features=(
                            features
                        )
                    )
                )

                if feature_result:

                    temp_training_id = (
                        feature_result[0].get(
                            "temp_training_id"
                        )
                    )

                logger.info(
                    "27-feature snapshot stored. "
                    "temp_training_id=%s",
                    temp_training_id
                )

            except Exception as error:

                logger.exception(
                    "Feature snapshot insertion failed: %s",
                    error
                )

        else:

            logger.warning(
                "Feature snapshot skipped: "
                "running_id unavailable."
            )

        # STEP 13: PREDICTION
        if running_id is not None:

            try:

                database_prediction_time = (
                    prediction_time
                )

                database_predicted_arrival = (
                    build_prediction_datetime(

                        scheduled_arrival=(
                            scheduled_arrival
                        ),

                        predicted_clock=(
                            predicted_arrival_time
                        ),

                        journey_date=(
                            pipeline.get(
                                "journey_date"
                            )
                        )
                    )
                )

                prediction_result = (
                    insert_prediction(

                        running_id=(
                            running_id
                        ),

                        prediction_time=(
                            database_prediction_time
                        ),

                        predicted_arrival_time=(
                            database_predicted_arrival
                        ),

                        predicted_delay=(
                            float(
                                predicted_delay
                            )
                        ),

                        model_version="CatBoost"
                    )
                )

                if prediction_result:

                    prediction_id = (
                        prediction_result[0].get(
                            "prediction_id"
                        )
                    )

                    # NEW: keep the stored record so the timestamp
                    # shown in the UI comes from the SAME record as
                    # the ETA that was just stored.
                    stored_prediction_row = (
                        prediction_result[0]
                    )

                logger.info(
                    "Prediction stored. "
                    "prediction_id=%s",
                    prediction_id
                )

            except Exception as error:

                logger.exception(
                    "Prediction insertion failed: %s",
                    error
                )

        else:

            logger.warning(
                "Prediction storage skipped: "
                "running_id unavailable."
            )

        # NEW: PREDICTION TIMESTAMP FOR THE UI
        #
        # Only exposed when this ETA was actually stored
        # (prediction_id exists). ETA and timestamp were written by
        # the SAME insert_prediction() call above.

        prediction_time_iso = None
        prediction_time_display = None

        if prediction_id is not None and predicted_arrival_time:

            stored_time = None

            if isinstance(stored_prediction_row, dict):
                stored_time = stored_prediction_row.get(
                    "prediction_time"
                )

            if stored_time is None:
                # exact value that was passed to insert_prediction()
                stored_time = prediction_time

            (
                prediction_time_iso,
                prediction_time_display
            ) = format_prediction_timestamp(stored_time)

            if prediction_time_display is None:
                logger.warning(
                    "Stored prediction timestamp could not be "
                    "parsed. prediction_id=%s",
                    prediction_id
                )

        else:

            logger.warning(
                "Prediction timestamp not exposed: "
                "no stored prediction for this ETA."
            )

        
        # STATUS TEXT
       

        if abs(
            current_total_delay
        ) < 0.5:

            status_text = (
                "On Time"
            )

        elif current_total_delay > 0:

            status_text = (
                f"Delayed by "
                f"{round(float(current_total_delay), 2)} min"
            )

        else:

            status_text = (
                f"{round(abs(float(current_total_delay)), 2)} "
                "min Early"
            )

        
        # FINAL RESPONSE
       

        return jsonify({

            "success":
                True,

            "train_number":
                pipeline[
                    "train_number"
                ],

            "journey_date":
                pipeline[
                    "journey_date"
                ],

            "journey_status":
                detection["journey_status"],

            "is_prediction_allowed":
                True,

            **(journey_status.get("route_progress") or {}),

            "message":
                detection["message"],

            "status_text":
                status_text,

            "journey_day":
                journey_status[
                    "journey_day"
                ],

            "current_station":
                current_station.get(
                    "station_code"
                ),

            "current_station_name":
                current_station.get(
                    "station_name"
                ),

            "next_station":
                next_station.get(
                    "station_code"
                ),

            "next_station_name":
                next_station.get(
                    "station_name"
                ),

            "predicted_delay_change":
                round(
                    predicted_delay_change,
                    2
                ),

            "predicted_delay":
                round(
                    float(
                        predicted_delay
                    ),
                    2
                ),

            "predicted_arrival_time":
                predicted_arrival_time,

            "scheduled_arrival":
                scheduled_arrival,

            "stops":
                ui_stops,

            "model":
                "CatBoost",

            "feature_count":
                len(
                    MODEL_FEATURE_COLUMNS
                ),

            "prediction_id":
                prediction_id,

            # NEW: timestamp of the stored prediction (India time)
            "prediction_time":
                prediction_time_iso,

            "prediction_time_display":
                prediction_time_display,

            "running_id":
                running_id,

            "temporary_training_id":
                temp_training_id,

            "weather_id":
                weather_id,

            "next_weather_id":
                next_weather_id
        })

    except Exception as error:

        logger.exception(
            "Prediction failed"
        )

        return jsonify({

            "success":
                False,

            "error":
                "Prediction failed",

            "details":
                str(error)
        }), 500



# ACTUAL DATA ENDPOINT


@app.route(
    "/api/prediction/<int:prediction_id>/actual",
    methods=["POST"]
)
def record_actual_data(
    prediction_id
):

    return jsonify({

        "success":
            False,

        "error":
            "Actual data endpoint "
            "not implemented yet"
    }), 501



# 404 HANDLER


@app.errorhandler(404)
def not_found(error):

    return jsonify({

        "success":
            False,

        "error":
            "API endpoint not found"
    }), 404



# 500 HANDLER


@app.errorhandler(500)
def internal_error(error):

    return jsonify({

        "success":
            False,

        "error":
            "Internal server error"
    }), 500



# START SERVER


if __name__ == "__main__":

    port = int(
        os.getenv(
            "PORT",
            5000
        )
    )

    logger.info(
        "Starting GatiDrishti backend"
    )

    logger.info(
        "Model: %s",
        MODEL_PATH
    )

    logger.info(
        "Model available: %s",
        os.path.exists(
            MODEL_PATH
        )
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )