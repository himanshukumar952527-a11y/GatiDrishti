# BACKEND/event.py

from database_insert import insert_operational_event

# EVENT NORMALIZATION
def normalize_event(event):
    """
    Normalize a RailRadar event into the structure
    required by operational.operational_events.

    Since the exact event payload can vary, only fields
    that are actually available are mapped.
    """

    if not isinstance(event, dict):

        return None

    event_type = (
        event.get("type")
        or event.get("eventType")
        or event.get("event_type")
        or "unknown"
    )

    event_start_time = (
        event.get("startTime")
        or event.get("eventStartTime")
        or event.get("event_start_time")
    )

    event_end_time = (
        event.get("endTime")
        or event.get("eventEndTime")
        or event.get("event_end_time")
    )

    duration_minutes = (
        event.get("durationMinutes")
        or event.get("duration_minutes")
    )

    severity = (
        event.get("severity")
        or "unknown"
    )

    return {

        "event_type": event_type,

        "event_start_time":
            event_start_time,

        "event_end_time":
            event_end_time,

        "duration_minutes":
            duration_minutes,

        "severity":
            severity
    }

# STORE SINGLE EVENT
def store_event(
    station_id,
    event
):
    """
    Normalize and store one operational event.
    """

    normalized = normalize_event(event)

    if not normalized:

        return {
            "success": False,
            "error": "Invalid event data"
        }

    try:

        inserted = insert_operational_event(
            station_id=station_id,
            event_type=normalized["event_type"],
            event_start_time=normalized[
                "event_start_time"
            ],
            event_end_time=normalized[
                "event_end_time"
            ],
            duration_minutes=normalized[
                "duration_minutes"
            ],
            severity=normalized[
                "severity"
            ]
        )

        return {
            "success": True,
            "event": normalized,
            "db_insert": inserted
        }

    except Exception as error:

        return {
            "success": False,
            "error": str(error),
            "event": normalized
        }

# STORE MULTIPLE EVENTS
def store_events(
    station_id,
    events
):
    """
    Store multiple operational events.
    """

    if not events:

        return {
            "success": True,
            "inserted": 0,
            "results": []
        }

    results = []

    for event in events:

        result = store_event(
            station_id,
            event
        )

        results.append(result)

    successful = sum(
        1
        for result in results
        if result["success"]
    )

    return {

        "success": True,

        "inserted":
            successful,

        "total":
            len(events),

        "results":
            results
    }

# BASIC TEST
if __name__ == "__main__":

    print(
        "Use store_event() or store_events()"
    )