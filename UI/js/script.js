// ============================================================
// GATIDRISHTI  -  script.js   (ETA ONLY)
// ============================================================
//
// This file holds ONLY ETA code:
//   * prediction response -> delay / ETA / current+next station
//   * ETA calculation + formatting
//   * ETA shown on the NEXT station
//
// It has NO dependency on map.js or other.js. Load order:
//
//   <script src="script.js"></script>
//   <script src="map.js"></script>
//   <script src="other.js"></script>
// ============================================================


// ============================================================
// HELPERS REQUIRED BY ETA
// ============================================================
//
// Station matching is ALWAYS done on the station CODE.
// RailRadar sequence numbers and our DB station_sequence are not
// guaranteed to agree, so sequence numbers are never used to match.
//
// ============================================================

// "16:45:00" / "16:45" / "2026-09-19T16:45:00" -> "16:45"
function formatClock(value) {

  if (value === null || value === undefined) {
    return "--";
  }

  let text = String(value).trim();

  if (!text || text === "--") {
    return "--";
  }

  if (text.includes("T")) {
    text = text.split("T")[1];
  } else if (text.includes(" ") && text.split(" ")[1].includes(":")) {
    text = text.split(" ")[1];
  }

  const match = text.match(/^(\d{1,2}):(\d{2})/);

  return match
    ? `${match[1].padStart(2, "0")}:${match[2]}`
    : text;

}


function normalizeStationCode(value) {

  return String(value || "").trim().toUpperCase();

}


// "HH:MM" (or anything formatClock understands) -> minutes since
// midnight, or null when it is not a real clock time ("--", "—", ...).
function clockToMinutes(value) {

  if (value === null || value === undefined) {
    return null;
  }

  const match =
    String(formatClock(value)).match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;

}


// Minutes -> "HH:MM". Wraps around midnight, so negative values and
// values beyond 24 h are both handled.
function minutesToClock(totalMinutes) {

  if (
    typeof totalMinutes !== "number" ||
    !Number.isFinite(totalMinutes)
  ) {
    return null;
  }

  const wrapped =
    ((Math.round(totalMinutes) % 1440) + 1440) % 1440;

  const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(wrapped % 60).padStart(2, "0");

  return `${hh}:${mm}`;

}


function getStopCode(stop) {

  if (!stop || typeof stop !== "object") {
    return "";
  }

  return normalizeStationCode(
    stop.code ||
    stop.station_code ||
    stop.stationCode
  );

}


function escapeHtml(str) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    String(str ?? "");


  return div.innerHTML;

}


// ============================================================
// ETA
// ============================================================
//
// Semantics:
//   current_total_delay    = arr_delay + dep_delay
//   predicted_delay_change = raw model output
//   predicted_delay        = current_total_delay + predicted_delay_change
//   ETA                    = scheduled_arrival + predicted_delay
//
// prediction.predicted_arrival_time is used first; the frontend
// calculation is only a fallback. ETA is shown ONLY for the NEXT
// station.
//
// ============================================================

// ETA = scheduled arrival + predicted FINAL delay.
// e.g. 00:25 + 9.54 min -> 00:35.  Returns null on invalid input.
function computeEtaFromDelay(scheduledArrival, delayMinutes) {

  if (
    delayMinutes === null ||
    delayMinutes === undefined ||
    delayMinutes === ""
  ) {
    return null;
  }

  const delay = Number(delayMinutes);

  if (!Number.isFinite(delay)) {
    return null;
  }

  const scheduled = clockToMinutes(scheduledArrival);

  if (scheduled === null) {
    return null;
  }

  return minutesToClock(scheduled + delay);

}


// ETA-related fields of a train record (delay, ETA, current/next station).
// Called by normalizeTrainData() in other.js.
function normalizeEtaFields(data) {

  return {

    // null = no prediction yet (never fake "0 min / on time").
    delayMinutes:
      typeof data.delayMinutes === "number"
        ? data.delayMinutes
        : null,


    // CURRENT STATION
    currentStation:
      data.currentStation ||
      data.current_station ||
      "",

    currentStationName:
      data.currentStationName ||
      data.current_station_name ||
      "",


    // NEXT STATION
    nextStation:
      data.nextStation ||
      data.next_station ||
      "",

    nextStationName:
      data.nextStationName ||
      data.next_station_name ||
      "",


    // ETA
    nextEtaTime:
      data.nextEtaTime ||
      data.next_eta_time ||
      "--",

    destinationEtaTime:
      data.destinationEtaTime ||
      data.destination_eta_time ||
      "--",


    // SCHEDULED ARRIVAL
    scheduledArrival:
      data.scheduledArrival ||
      data.scheduled_arrival ||
      "--",


    // ML DELAY CHANGE
    predictedDelayChange:
      typeof data.predictedDelayChange === "number"
        ? data.predictedDelayChange
        : (
            typeof data.predicted_delay_change === "number"
              ? data.predicted_delay_change
              : null
          )

  };

}


// ETA-specific part of handling a /api/predict response:
//   * current / next station
//   * scheduled arrival, predicted delay change, final delay
//   * ETA (backend value first, frontend fallback second)
//   * CURRENT / NEXT / ETA flags on trainData.stops
// Called by attachPrediction() in other.js, AFTER trainData.stops
// has been filled from the response.
function applyEtaPrediction(trainData, prediction) {

  const normalizeCode = normalizeStationCode;

  // ========================================================
  // CURRENT / NEXT STATION
  // ========================================================

  if (prediction.current_station) {

    trainData.currentStation =
      prediction.current_station;

  }

  if (prediction.current_station_name) {

    trainData.currentStationName =
      prediction.current_station_name;

  }

  if (prediction.next_station) {

    trainData.nextStation =
      prediction.next_station;

  }

  if (prediction.next_station_name) {

    trainData.nextStationName =
      prediction.next_station_name;

  }

  // ========================================================
  // SCHEDULED ARRIVAL
  // ========================================================

  if (prediction.scheduled_arrival) {

    trainData.scheduledArrival =
      formatClock(
        prediction.scheduled_arrival
      );

  }

  // ========================================================
  // PREDICTED DELAY CHANGE
  // ========================================================

  if (
    typeof prediction.predicted_delay_change ===
    "number"
  ) {

    trainData.predictedDelayChange =
      prediction.predicted_delay_change;

  }

  // ========================================================
  // FINAL PREDICTED DELAY
  // ========================================================

  if (
    typeof prediction.predicted_delay ===
    "number"
  ) {

    trainData.delayMinutes =
      prediction.predicted_delay;

  }

  // ========================================================
  // PREDICTED ARRIVAL TIME / ETA
  // ========================================================

  // Backend ETA first. If it is missing/invalid, fall back to
  //   scheduled arrival + predicted FINAL delay
  // (predicted_delay = current_total_delay + predicted_delay_change,
  //  so predicted_delay_change is never used as the final delay).

  let predictedArrival = null;

  if (prediction.predicted_arrival_time) {

    const backendEta =
      formatClock(
        prediction.predicted_arrival_time
      );

    if (clockToMinutes(backendEta) !== null) {
      predictedArrival = backendEta;
    }

  }

  if (!predictedArrival) {

    const etaNextCode =
      normalizeCode(
        prediction.next_station ||
        trainData.nextStation
      );

    if (etaNextCode) {

      const etaNextStop =
        (Array.isArray(trainData.stops)
          ? trainData.stops
          : []
        ).find(
          (s) => getStopCode(s) === etaNextCode
        );

      const scheduledForNext =
        prediction.scheduled_arrival ||
        (etaNextStop && etaNextStop.sch_arr) ||
        trainData.scheduledArrival;

      predictedArrival =
        computeEtaFromDelay(
          scheduledForNext,
          prediction.predicted_delay
        );

    }

  }

  if (predictedArrival) {

    trainData.nextEtaTime =
      predictedArrival;

  }

  // ========================================================
  // UPDATE CURRENT / NEXT FLAGS + ETA
  // ========================================================

  if (Array.isArray(trainData.stops)) {

    const currentCode =
      normalizeCode(
        prediction.current_station ||
        trainData.currentStation
      );

    const nextCode =
      normalizeCode(
        prediction.next_station ||
        trainData.nextStation
      );

    // Exactly one CURRENT and one NEXT stop (first match by code).
    // A station can never be both current and next.
    let currentAssigned = false;
    let nextAssigned = false;

    trainData.stops =
      trainData.stops
        .filter((stop) => stop && typeof stop === "object")
        .map((stop) => {

        const stopCode = getStopCode(stop);

        const isCurrent =
          !currentAssigned &&
          stopCode !== "" &&
          stopCode === currentCode;

        if (isCurrent) {
          currentAssigned = true;
        }

        const isNext =
          !nextAssigned &&
          stopCode !== "" &&
          stopCode === nextCode &&
          stopCode !== currentCode;

        if (isNext) {
          nextAssigned = true;
        }

        return {
          ...stop,

          current: isCurrent,

          next: isNext,

          eta:
            isNext && predictedArrival
              ? predictedArrival
              : null
        };

      });

    // ======================================================
    // ETA DEBUG
    // ======================================================

    console.log(
      "[GatiDrishti] ETA matching:",
      {
        currentCode,
        nextCode,
        predictedArrival,

        stops:
          trainData.stops.map((s) => ({
            code: s.code,
            name: s.name,
            sch_arr: s.sch_arr,
            sch_dep: s.sch_dep,
            act_arr: s.act_arr,
            act_dep: s.act_dep,
            current: s.current,
            next: s.next,
            eta: s.eta
          }))
      }
    );

    const currentInStops =
      trainData.stops.some(
        (s) => s.current
      );

    const nextInStops =
      trainData.stops.some(
        (s) => s.next
      );

    if (!currentInStops) {

      console.warn(
        "[GatiDrishti] Current station is not a scheduled stop:",
        currentCode
      );

    }

    if (!nextInStops) {

      console.warn(
        "[GatiDrishti] Next station is not a scheduled stop:",
        nextCode
      );

    }

  }

}


// ETA text for one timeline row. ETA is shown ONLY on the NEXT
// station; every other stop gets "--".
function getStopEtaText(stop, data) {

  if (!stop || typeof stop !== "object") {
    return "--";
  }

  // A station can never be both CURRENT and NEXT.
  const isNext =
    stop.next === true &&
    stop.current !== true;

  if (!isNext) {
    return "--";
  }

  const etaSource =
    stop.eta && clockToMinutes(stop.eta) !== null
      ? stop.eta
      : (data ? data.nextEtaTime : null);

  return clockToMinutes(etaSource) !== null
    ? formatClock(etaSource)
    : "--";

}


// "Next Station ETA" block + "Predicted Delay" block of the ETA
// panel. `platformHtml` (platform badge) is supplied by other.js so
// this file stays independent of it.
function renderEtaBlocks(data, platformHtml) {

  // PREDICTED DELAY CHANGE
  const delayChange =
    typeof data.predictedDelayChange === "number" &&
    Number.isFinite(data.predictedDelayChange)
      ? data.predictedDelayChange
      : null;

  // FINAL PREDICTED DELAY
  const predictedDelay =
    typeof data.delayMinutes === "number" &&
    Number.isFinite(data.delayMinutes)
      ? data.delayMinutes
      : null;

  const delayChangeText =
    delayChange === null
      ? "--"
      : `${
          delayChange >= 0
            ? "+"
            : ""
        }${delayChange.toFixed(1)} min`;

  const predictedDelayText =
    predictedDelay === null
      ? "--"
      : `${
          predictedDelay >= 0
            ? "+"
            : ""
        }${predictedDelay.toFixed(1)} min`;

  // ETA
  const etaText =
    data.nextEtaTime &&
    data.nextEtaTime !== "--"
      ? data.nextEtaTime
      : "--";

  // NEXT STATION
  const nextStation =
    data.nextStationName ||
    data.nextStation ||
    "--";

  // SCHEDULED ARRIVAL
  const scheduledArrival =
    data.scheduledArrival &&
    data.scheduledArrival !== "--"
      ? data.scheduledArrival
      : "--";

  return `
      <!-- ================================================== -->
      <!-- NEXT STATION ETA -->
      <!-- ================================================== -->

      <div class="eta-main">

        <span class="eta-label">
          Next Station ETA
        </span>


        <span class="eta-value">
          ${escapeHtml(etaText)}
        </span>


        <span class="eta-station">
          ${escapeHtml(nextStation)}
        </span>


        <div class="eta-platform-row">
          ${platformHtml}
        </div>


        <span class="eta-updated">
          ${t("updated")}
          ${escapeHtml(
            data.lastUpdated || "just now"
          )}
        </span>

      </div>


      <!-- ================================================== -->
      <!-- DELAY INFORMATION -->
      <!-- ================================================== -->

      <div class="eta-secondary">

        <span class="eta-label">
          Predicted Delay
        </span>


        <span
          class="eta-value"
          style="font-size:24px;"
        >
          ${escapeHtml(predictedDelayText)}
        </span>


        <span
          class="eta-station"
          style="
            margin-top:4px;
            font-size:13px;
          "
        >
          Delay change to next station:
          ${escapeHtml(delayChangeText)}
        </span>


        <div
          style="
            margin-top:12px;
            font-size:13px;
            opacity:0.75;
          "
        >

          Scheduled arrival:

          <strong>
            ${escapeHtml(scheduledArrival)}
          </strong>

        </div>

      </div>
  `;

}