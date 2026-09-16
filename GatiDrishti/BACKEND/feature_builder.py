import numpy as np
import pandas as pd


# ============================================================
# WEATHER SCORE
# ============================================================

def calculate_weather_score(
    precipitation,
    visibility,
    temperature,
    humidity,
    cloud_cover,
    wind_speed
):
    rain_score = np.clip(
        (precipitation / 10) * 100,
        0,
        100
    )

    visibility_score = np.clip(
        ((10000 - visibility) / 10000) * 100,
        0,
        100
    )

    temperature_score = np.clip(
        (np.abs(temperature - 25) / 20) * 100,
        0,
        100
    )

    humidity_score = np.clip(
        ((humidity - 50) / 50) * 100,
        0,
        100
    )

    cloud_score = np.clip(
        cloud_cover,
        0,
        100
    )

    wind_score = np.clip(
        (wind_speed / 50) * 100,
        0,
        100
    )

    score = (
        0.30 * rain_score +
        0.25 * visibility_score +
        0.15 * temperature_score +
        0.08 * humidity_score +
        0.12 * cloud_score +
        0.10 * wind_score
    )

    return score


# ============================================================
# FEATURE BUILDER
# ============================================================

def build_features(row):
    """
    Convert one raw train/station record into
    the exact 27 features required by CatBoost.
    """

    # --------------------------------------------------------
    # 1. CURRENT WEATHER SCORE
    # --------------------------------------------------------

    weather_score = calculate_weather_score(
        row["precipitation"],
        row["visibility"],
        row["temperature_2m"],
        row["relative_humidity_2m"],
        row["cloud_cover"],
        row["wind_speed_10m"]
    )


    # --------------------------------------------------------
    # 2. NEXT-STATION WEATHER SCORE
    # --------------------------------------------------------

    next_weather_score = calculate_weather_score(
        row["next_precipitation"],
        row["next_visibility"],
        row["next_temperature_2m"],
        row["next_relative_humidity_2m"],
        row["next_cloud_cover"],
        row["next_wind_speed_10m"]
    )


    # --------------------------------------------------------
    # 3. WEATHER INTERACTION FEATURES
    # --------------------------------------------------------

    weather_distance = (
        weather_score *
        row["distance"]
    )

    next_weather_distance = (
        next_weather_score *
        row["next_station_distance_value"]
    )

    weather_avg_speed = (
        weather_score *
        row["avg_speed"]
    )

    next_weather_avg_speed = (
        next_weather_score *
        row["avg_speed"]
    )


    # --------------------------------------------------------
    # 4. EXACT 27 MODEL FEATURES
    # --------------------------------------------------------

    features = {

        "arr_delay":
            row["arr_delay"],

        "dep_delay":
            row["dep_delay"],

        "latitude":
            row["latitude"],

        "longitude":
            row["longitude"],

        "station_sequence":
            row["station_sequence"],

        "distance":
            row["distance"],

        "next_station_distance_value":
            row["next_station_distance_value"],

        "next2_station_distance_value":
            row["next2_station_distance_value"],

        "total_active_train":
            row["total_active_train"],

        "trains_ahead":
            row["trains_ahead"],

        "trains_behind":
            row["trains_behind"],

        "avg_headway":
            row["avg_headway"],

        "avg_speed":
            row["avg_speed"],

        "max_speed":
            row["max_speed"],

        "category_encoding":
            row["category_encoding"],

        "next_station_latitude":
            row["next_station_latitude"],

        "next_station_longitude":
            row["next_station_longitude"],

        "sch_halt_current_station":
            row["sch_halt_current_station"],

        "act_halt_current_station":
            row["act_halt_current_station"],

        "sch_halt_next_station":
            row["sch_halt_next_station"],

        "day_night":
            row["day_night"],

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
            next_weather_avg_speed
    }


    return features