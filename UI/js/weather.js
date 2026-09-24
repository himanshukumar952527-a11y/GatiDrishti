/**
 * GatiDrishti - Frontend Weather Module
 *
 * Responsibility:
 * 1. Fetch current station weather from Open-Meteo.
 * 2. Fetch next station weather from Open-Meteo.
 * 3. Return normalized weather data.
 * 4. Keep weather-fetching logic separate from script.js.
 *
 * Note:
 * This module does not call the prediction API.
 * script.js will use the returned weather payload.
 */

(function () {
"use strict";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

const WEATHER_TIMEOUT_MS = 10000;

const WEATHER_FIELDS = [
    "temperature_2m",
    "precipitation",
    "visibility",
    "wind_speed_10m",
    "wind_direction_10m",
    "cloud_cover"
];

/**
 * Validate station coordinates.
 */
function validateStationCoordinates(station, stationLabel = "Station") {
    if (!station || typeof station !== "object") {
        throw new Error(`${stationLabel} data is missing`);
    }

    const latitude = Number(
        station.latitude ?? station.lat
    );

    const longitude = Number(
        station.longitude ?? station.lon ?? station.lng
    );

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error(
            `${stationLabel} has invalid latitude or longitude`
        );
    }

    if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        throw new Error(
            `${stationLabel} coordinates are out of range`
        );
    }

    if (latitude === 0 && longitude === 0) {
        throw new Error(
            `${stationLabel} has invalid coordinates: 0,0`
        );
    }

    return {
        latitude,
        longitude
    };
}

/**
 * Extract station weather from Open-Meteo response.
 */
function normalizeWeatherResponse(response, station) {
    if (!response || typeof response !== "object") {
        throw new Error("Invalid weather API response");
    }

    if (response.error) {
        throw new Error(
            response.reason || "Open-Meteo returned an error"
        );
    }

    const current = response.current || {};

    const missing = WEATHER_FIELDS.filter(
        (field) =>
            current[field] === null ||
            current[field] === undefined ||
            !Number.isFinite(Number(current[field]))
    );

    if (missing.length > 0) {
        throw new Error(
            `Weather response missing fields: ${missing.join(", ")}`
        );
    }

    return {
        station_code: station.stationCode || station.station_code || null,
        station_name: station.stationName || station.station_name || null,

        latitude: response.latitude ?? null,
        longitude: response.longitude ?? null,
        timezone: response.timezone ?? null,

        temperature: current.temperature_2m ?? null,
        precipitation: current.precipitation ?? null,
        visibility: current.visibility ?? null,
        wind_speed: current.wind_speed_10m ?? null,
        wind_direction: current.wind_direction_10m ?? null,
        cloud_cover: current.cloud_cover ?? null,

        time: current.time ?? null
    };
}

/**
 * Fetch weather for one station from Open-Meteo.
 */
async function fetchStationWeatherFrontend(station, stationLabel = "Station") {
    const coordinates = validateStationCoordinates(
        station,
        stationLabel
    );

    const params = new URLSearchParams({
        latitude: String(coordinates.latitude),
        longitude: String(coordinates.longitude),
        current: WEATHER_FIELDS.join(","),
        timezone: "Asia/Kolkata"
    });

    const requestUrl = `${OPEN_METEO_URL}?${params.toString()}`;

    let response;

    const controller = new AbortController();
    const timeoutId = setTimeout(
        () => controller.abort(),
        WEATHER_TIMEOUT_MS
    );

    try {
        response = await fetch(requestUrl, {
            method: "GET",
            headers: {
                Accept: "application/json"
            },
            signal: controller.signal
        });
    } catch (error) {
        throw new Error(
            error && error.name === "AbortError"
                ? `${stationLabel} weather request timed out`
                : `${stationLabel} weather network error: ${error.message}`
        );
    } finally {
        clearTimeout(timeoutId);
    }

    let responseData;

    try {
        responseData = await response.json();
    } catch (error) {
        throw new Error(
            `${stationLabel} weather response is not valid JSON`
        );
    }

    if (!response.ok) {
        const reason =
            responseData?.reason ||
            responseData?.error ||
            `HTTP ${response.status}`;

        throw new Error(
            `${stationLabel} weather request failed: ${reason}`
        );
    }

    return normalizeWeatherResponse(
        responseData,
        station
    );
}

/**
 * Fetch current and next station weather.
 *
 * @param {Object} currentStation - Current station object.
 * @param {Object} nextStation - Next station object.
 *
 * @returns {Object} Weather payload for backend prediction.
 */
async function fetchCurrentAndNextWeatherFrontend(
    currentStation,
    nextStation
) {
    if (!currentStation) {
        throw new Error("Current station is missing");
    }

    if (!nextStation) {
        throw new Error("Next station is missing");
    }

    const [currentWeather, nextWeather] = await Promise.all([
        fetchStationWeatherFrontend(
            currentStation,
            "Current station"
        ),

        fetchStationWeatherFrontend(
            nextStation,
            "Next station"
        )
    ]);

    return {
        current_weather: currentWeather,
        next_weather: nextWeather,

        fetched_from: "frontend",
        fetched_at: new Date().toISOString()
    };
}

/**
 * Safe wrapper.
 *
 * Instead of throwing an error directly, this returns
 * success: false, so script.js can handle it properly.
 */
async function getPredictionWeatherData(
    currentStation,
    nextStation
) {
    try {
        const weatherData =
            await fetchCurrentAndNextWeatherFrontend(
                currentStation,
                nextStation
            );

        return {
            success: true,
            data: weatherData,
            error: null
        };
    } catch (error) {
        console.error(
            "Frontend weather fetching failed:",
            error
        );

        return {
            success: false,
            data: null,
            error: error.message || "Unable to fetch weather data"
        };
    }
}

// Make functions available to script.js.
window.GatiDrishtiWeather = {
    fetchStationWeatherFrontend,
    fetchCurrentAndNextWeatherFrontend,
    getPredictionWeatherData
};

})();