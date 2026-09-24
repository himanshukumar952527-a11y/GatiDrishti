// ---------- DOM ELEMENTS ----------

const searchForm = document.getElementById("searchForm");
const trainInput = document.getElementById("trainInput");

const pnrForm = document.getElementById("pnrForm");
const pnrInput = document.getElementById("pnrInput");

const scheduleForm = document.getElementById("scheduleForm");
const scheduleInput = document.getElementById("scheduleInput");

const coachForm = document.getElementById("coachForm");
const coachInput = document.getElementById("coachInput");

const quickChipsRow = document.getElementById("quickChipsRow");
const resultsContainer = document.getElementById("resultsContainer");


const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

const lookupTabs = document.querySelectorAll(".lookup-tab");
const lookupPanels = document.querySelectorAll(".lookup-panel");

const helpBtn = document.getElementById("helpBtn");
const helpModalOverlay = document.getElementById("helpModalOverlay");
const helpModalClose = document.getElementById("helpModalClose");


// ---------- GLOBAL STATE ----------

let currentResultData = null;
let currentTab = "eta";



// ---------- BACKEND ----------

// const API_BASE = "https://gatidrishti.onrender.com";
const API_BASE = "http://127.0.0.1:5000";  
// for local testing use  127.0.01:5000 


// ============================================================
// DEMO DATA
// IMPORTANT:
// ETA DOES NOT USE THIS DATA.
// Only Schedule / Coach quick demos use 12301.
// ============================================================


// ---------- LIMITED DEMO TRAIN DATA ----------

const DUMMY_TRAINS = {
  "12301": {
    number: "12301",
    name: "Howrah Rajdhani Express",
    origin: "Howrah (HWH)",
    destination: "New Delhi (NDLS)",
    route: "Howrah (HWH) → New Delhi (NDLS)"
  }
};


// Only used for Schedule / Coach demo quick chips.
const AVAILABLE_TRAIN_NUMBERS = ["12301"];



// ============================================================
// SCHEDULE DEMO DATA
// ============================================================

const SCHEDULE_DATA = {
  "12301": {
    number: "12301",
    name: "Howrah Rajdhani Express",
    runsOn: "Daily",

    stations: [
      {
        name: "Howrah Jn",
        code: "HWH",
        arr: "—",
        dep: "16:55",
        day: 1,
        dist: 0,
        platform: "9"
      },

      {
        name: "Asansol Jn",
        code: "ASN",
        arr: "17:35",
        dep: "17:40",
        day: 1,
        dist: 214,
        platform: "3"
      },

      {
        name: "Dhanbad Jn",
        code: "DHN",
        arr: "18:47",
        dep: "18:52",
        day: 1,
        dist: 262,
        platform: "2"
      },

      {
        name: "Gaya Jn",
        code: "GAYA",
        arr: "21:08",
        dep: "21:13",
        day: 1,
        dist: 462,
        platform: "1"
      },

      {
        name: "Mughalsarai Jn",
        code: "MGS",
        arr: "23:35",
        dep: "23:40",
        day: 1,
        dist: 587,
        platform: "5"
      },

      {
        name: "New Delhi",
        code: "NDLS",
        arr: "10:00",
        dep: "—",
        day: 2,
        dist: 1447,
        platform: "1"
      }
    ]
  }
};


// ============================================================
// COACH COMPOSITION DEMO DATA
// ============================================================

const COACH_COMPOSITION = {
  "12301": [
    ["ENG", "loco"],
    ["PWR", "power"],
    ["H1", "ac1"],
    ["A1", "ac2"],
    ["A2", "ac2"],
    ["A3", "ac2"],
    ["B1", "ac3"],
    ["B2", "ac3"],
    ["B3", "ac3"],
    ["PC", "pantry"],
    ["B4", "ac3"],
    ["B5", "ac3"],
    ["B6", "ac3"],
    ["GRD", "guard"]
  ]
};


const COACH_CLASS_LABELS = {
  loco: "labelLoco",
  power: "labelPower",
  guard: "labelGuard",
  luggage: "labelLuggage",
  general: "labelGeneral",
  sleeper: "labelSleeper",
  ac3: "labelAc3",
  ac2: "labelAc2",
  ac1: "labelAc1",
  pantry: "labelPantry"
};


const COACH_CLASS_COLORS = {
  loco: "#4A4A4A",
  power: "#7C8B99",
  guard: "#7C8B99",
  luggage: "#9C8B6E",
  general: "#E0A100",
  sleeper: "#2E8B57",
  ac3: "#1565C0",
  ac2: "#0D47A1",
  ac1: "#6A1B9A",
  pantry: "#C41230"
};


// ============================================================
// PNR DEMO DATA
// ============================================================

const PNR_DEMO_DATA = {

  "9512876351": {
    status: "CNF",
    statusKey: "pnrStatusCnf",
    train: "12951 Mumbai Rajdhani Express",
    cls: "3A",
    from: "Mumbai Central",
    to: "New Delhi",
    journeyDate: "12-Sep-2026",
    coach: "B2",
    seat: "34 (Lower)",
    passengers: 1,
    chartStatus: "Chart not prepared"
  },

  "8734519206": {
    status: "WL",
    statusKey: "pnrStatusWl",
    train: "12301 Howrah Rajdhani Express",
    cls: "2A",
    from: "Howrah Jn",
    to: "New Delhi",
    journeyDate: "14-Sep-2026",
    coach: "—",
    seat: "WL 12 (GNWL)",
    passengers: 2,
    chartStatus: "Chart not prepared"
  }

};


// ============================================================
// TAB SWITCHING
// ============================================================

lookupTabs.forEach((tab) => {

  tab.addEventListener("click", () => {
    activateTab(tab.getAttribute("data-tab"));
  });

});


function activateTab(tabName) {

  currentTab = tabName;

  lookupTabs.forEach((tab) => {

    tab.classList.toggle(
      "active",
      tab.getAttribute("data-tab") === tabName
    );

  });


  lookupPanels.forEach((panel) => {

    panel.classList.toggle(
      "active",
      panel.getAttribute("data-panel") === tabName
    );

  });


  // --------------------------------------------------------
  // COACH POSITION: reuse an already-entered ETA train number
  // --------------------------------------------------------
  //
  // If the user already ran an ETA prediction (currentResultData
  // is set), opening the Coach Position tab should use that same
  // train number and its already-fetched route/stops instead of
  // asking the user to search again. Falls through to the normal
  // empty state / demo search below when no ETA data is available.
  // --------------------------------------------------------

  if (
    tabName === "coach" &&
    hasRealEtaTrainData(currentResultData)
  ) {

    renderCoachPositionFromEta(currentResultData);
    renderQuickChips(tabName);
    return;

  }


  resultsContainer.innerHTML = getEmptyStateForTab(tabName);

  renderQuickChips(tabName);
}


function getEmptyStateForTab(tabName) {

  if (tabName === "pnr") {

    return `
      <div class="empty-state">
        <div class="empty-icon">🎫</div>
        <p>${t("emptyStatePnr")}</p>
      </div>
    `;

  }


  if (tabName === "schedule") {

    return `
      <div class="empty-state">
        <div class="empty-icon">🕒</div>
        <p>${t("emptyStateSchedule")}</p>
      </div>
    `;

  }


  if (tabName === "coach") {

    return `
      <div class="empty-state">
        <div class="empty-icon">🚃</div>
        <p>${t("emptyStateCoach")}</p>
      </div>
    `;

  }


  return `
    <div class="empty-state">
      <div class="empty-icon">🚉</div>
      <p>${t("emptyState")}</p>
    </div>
  `;
}


// ============================================================
// QUICK TRY CHIPS
// ============================================================

function renderQuickChips(tabName) {

  quickChipsRow.innerHTML = "";


  // ---------- PNR ----------

  if (tabName === "pnr") {

    const label = document.createElement("span");

    label.className = "chip-label";
    label.textContent = t("tryPnrLabel");

    quickChipsRow.appendChild(label);


    Object.keys(PNR_DEMO_DATA).forEach((pnr) => {

      const chip = document.createElement("button");

      chip.className = "chip";
      chip.textContent = pnr;

      chip.addEventListener("click", () => {

        pnrInput.value = pnr;
        handlePnrLookup(pnr);

      });

      quickChipsRow.appendChild(chip);

    });

    return;
  }


  // ---------- ETA / SCHEDULE / COACH ----------

  const label = document.createElement("span");

  label.className = "chip-label";
  label.textContent = t("tryLabel");

  quickChipsRow.appendChild(label);


  AVAILABLE_TRAIN_NUMBERS.forEach((num) => {

    const train = DUMMY_TRAINS[num];

    const chip = document.createElement("button");

    chip.className = "chip";
    chip.textContent = `${num} · ${shortName(train.name)}`;


    chip.addEventListener("click", () => {

      if (tabName === "eta") {

        // IMPORTANT:
        // ETA still goes to backend.
        trainInput.value = num;
        handleEtaSearch(num);

      }


      if (tabName === "schedule") {

        scheduleInput.value = num;
        handleScheduleSearch(num);

      }


      if (tabName === "coach") {

        coachInput.value = num;
        handleCoachSearch(num);

      }

    });


    quickChipsRow.appendChild(chip);

  });


  // ---------- EXTRA ETA BUTTONS ----------

  if (tabName === "eta") {

    const myTrainsChip = document.createElement("button");

    myTrainsChip.className = "chip chip-secondary";
    myTrainsChip.textContent = t("myTrains");

    myTrainsChip.addEventListener(
      "click",
      () => console.log(
        "My Trains — requires login/backend, not yet implemented."
      )
    );

    quickChipsRow.appendChild(myTrainsChip);


    const recentChip = document.createElement("button");

    recentChip.className = "chip chip-secondary";
    recentChip.textContent = t("recentSearches");

    recentChip.addEventListener(
      "click",
      () => console.log(
        "Recent Searches — requires localStorage/backend wiring, not yet implemented."
      )
    );

    quickChipsRow.appendChild(recentChip);

  }

}


function shortName(fullName) {

  return fullName
    .split(" (")[0]
    .split(" Express")[0]
    .split(" Superfast")[0];

}


// ============================================================
// ETA SEARCH
// ============================================================
//
// IMPORTANT:
// This section DOES NOT use DUMMY_TRAINS.
// It always calls the real backend.
//
// Flow:
//
// UI
//  ↓
// /api/trains
//  ↓
// backend
//  ↓
// /api/predict
//  ↓
// RailRadar + feature engineering + CatBoost
//
// ============================================================

searchForm.addEventListener("submit", function (e) {

  e.preventDefault();

  const query = trainInput.value.trim();

  if (!query) {

    trainInput.focus();
    return;

  }

  handleEtaSearch(query);

});


async function handleEtaSearch(query) {

  const normalized = query.trim().toLowerCase();


  resultsContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🚆</div>
      <p>
        ${t("fetching")}
        <strong>${escapeHtml(query)}</strong>...
      </p>
    </div>
  `;


  try {

    // --------------------------------------------------------
    // STEP 1: GET TRAIN FROM BACKEND
    // --------------------------------------------------------

    console.log(
      "[GatiDrishti] Searching backend for train:",
      normalized
    );


    const response = await fetch(
      `${API_BASE}/api/trains?search=${encodeURIComponent(normalized)}`
    );


    if (!response.ok) {

      console.error(
        "[GatiDrishti] /api/trains failed:",
        response.status
      );

      renderNotFound(query);
      return null;

    }


    const envelope = await response.json();


    console.log(
      "[GatiDrishti] /api/trains response:",
      envelope
    );


    if (!envelope.success || !envelope.data) {

      console.warn(
        "[GatiDrishti] Train not found:",
        query
      );

      renderNotFound(query);
      return null;

    }


    // Backend train record.
    let trainData = normalizeTrainData(envelope.data);


    console.log(
      "[GatiDrishti] Train data:",
      trainData
    );


    // --------------------------------------------------------
    // STEP 2: ML PREDICTION
    // --------------------------------------------------------

    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🚆</div>
        <p>
          Running live ML prediction for
          <strong>${escapeHtml(query)}</strong>...
          <br>
          <small>This can take a few seconds.</small>
        </p>
      </div>
    `;

    await attachPrediction(trainData);


    // --------------------------------------------------------
    // STEP 3: SAVE RESULT
    // --------------------------------------------------------

    currentResultData = trainData;


    // --------------------------------------------------------
    // STEP 4: RENDER
    // --------------------------------------------------------

    try {

      const rendered = renderResultCard(trainData);

      // If the route map is open, move it to the new train state.
      refreshOpenMap(trainData);

      return rendered;

    } catch (renderError) {

      // A rendering bug is NOT "train not found".
      console.error(
        "[GatiDrishti] Rendering result failed:",
        renderError
      );

      renderErrorState(
        "The result was received but could not be displayed. " +
        "See the browser console for details."
      );

      return null;

    }

  }


  catch (error) {

    console.error(
      "[GatiDrishti] ETA search failed:",
      error
    );

    renderErrorState(
      "Unable to reach the GatiDrishti backend. " +
      "Check that it is running and try again."
    );

    return null;

  }

}


// ============================================================
// NORMALIZE BACKEND TRAIN DATA
// ============================================================
//
// Backend/database field names may differ from UI field names.
// This keeps the existing UI stable.
//
// ============================================================

function normalizeTrainData(data) {

  const trainNumber =
    data.number ||
    data.train_number ||
    data.trainNumber ||
    data.train_id ||
    "";


  const trainName =
    data.name ||
    data.train_name ||
    data.trainName ||
    `Train ${trainNumber}`;


  const origin =
    data.origin ||
    data.source ||
    data.source_station ||
    data.source_station_name ||
    "";


  const destination =
    data.destination ||
    data.destination_station ||
    data.destination_station_name ||
    "";


  const route =
    data.route ||
    (
      origin && destination
        ? `${origin} → ${destination}`
        : ""
    );


  return {

    ...data,

    number: String(trainNumber),

    name: trainName,

    origin: origin,

    destination: destination,

    route: route,


    // --------------------------------------------------------
    // ETA + CURRENT/NEXT STATION  (script.js)
    // delayMinutes, currentStation(+Name), nextStation(+Name),
    // nextEtaTime, destinationEtaTime, scheduledArrival,
    // predictedDelayChange
    //
    // LIVE ROUTE  (map.js): liveRoute
    // --------------------------------------------------------

    ...normalizeEtaFields(data),

    ...normalizeMapFields(data),


    predictionError: null,


    confidence:
      data.confidence ||
      "medium",


    // --------------------------------------------------------
    // MODEL INFORMATION
    // --------------------------------------------------------

    predictionModel:
      data.predictionModel ||
      data.model ||
      "CatBoost",


    featureCount:
      data.featureCount ||
      data.feature_count ||
      27,


    // --------------------------------------------------------
    // OTHER EXISTING DATA
    // --------------------------------------------------------

    lastUpdated:
      data.lastUpdated ||
      "just now",


    reason:
      data.reason ||
      "ETA generated using live train data and the GatiDrishti prediction model.",


    stops:
      Array.isArray(data.stops)
        ? data.stops
        : [],


    alerts:
      Array.isArray(data.alerts)
        ? data.alerts
        : [],


    punctuality30d:
      typeof data.punctuality30d === "number"
        ? data.punctuality30d
        : 0,


    totalDistanceKm:
      Number(data.totalDistanceKm || 0),


    coveredDistanceKm:
      Number(data.coveredDistanceKm || 0)

  };

}



// ============================================================
// ============================================================
// ATTACH ML PREDICTION  (Phase 1: NEXT station only)
// ============================================================
//
// POST /api/predict returns:
//
//   current_station / current_station_name
//   next_station / next_station_name
//   scheduled_arrival          (next station, scheduled)
//   predicted_delay_change     (RAW CatBoost output, minutes)
//   predicted_delay            (current_total_delay + change)
//   predicted_arrival_time     (scheduled_arrival + predicted_delay)
//
// IMPORTANT:
//   predicted_delay_change  != ETA
//   predicted_delay         != ETA
//   predicted_arrival_time  == ETA (a clock time)
//
// Timeline rules:
//   current stop -> current = true , eta = null
//   next stop    -> next = true    , eta = predicted_arrival_time
//   other stops  -> eta = null
//
// This function never throws. On any failure it records
// trainData.predictionError so the UI can say so, instead of
// pretending the train is on time.
// ============================================================

const PREDICT_TIMEOUT_MS = 90000;


// Local calendar date (YYYY-MM-DD).
// toISOString() is UTC and gives yesterday's date between
// 00:00 and 05:30 IST, so it is not used here.
function getLocalDateString() {

  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;

}


///////helper1
function isFutureActualTimestamp(value) {
  if (!value || value === "--") {
    return false;
  }

  const text = String(value).trim();

  // Full ISO datetime
  if (text.includes("T") || text.includes("-")) {
    const parsed = new Date(text);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime() > Date.now();
    }
  }

  // Clock-only value: HH:MM
  const match = text.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return false;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  const now = new Date();

  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const actualMinutes =
    hours * 60 + minutes;

  return actualMinutes > currentMinutes;
}


function safeActualClock(record, keys) {
  const value = pickClock(record, keys);

  if (value === "--") {
    return "--";
  }

  if (isFutureActualTimestamp(value)) {
    return "--";
  }

  return value;
}


// Merge live (RailRadar) records into scheduled stops using the
// station CODE. Only ACT ARR / ACT DEP and (optionally) coordinates
// are taken from the live record; schedules stay database values.

function mergeLiveRouteIntoStops(stops, records) {

  const list =
    Array.isArray(stops)
      ? stops.filter(
          (s) =>
            s &&
            typeof s === "object"
        )
      : [];

  if (list.length === 0) {
    return list;
  }

  const lookup =
    buildLiveRouteLookup(records);

  if (lookup.size === 0) {
    return list;
  }

  // --------------------------------------------------------
  // FIND CURRENT STATION INDEX
  // Backend already marks current station using current:true.
  // --------------------------------------------------------

 let currentIndex =
  list.findIndex(
    (stop) =>
      stop.current === true
  );

  // Fallback: if current flag is missing, use NEXT station.
  // Everything after NEXT is also future.
  if (currentIndex < 0) {

    currentIndex =
      list.findIndex(
        (stop) =>
          stop.next === true
      );

    if (currentIndex >= 0) {
      currentIndex -= 1;
    }

  }

  // --------------------------------------------------------
  // MERGE LIVE DATA
  // --------------------------------------------------------

  return list.map(
    (stop, index) => {

      const stopCode =
        getStopCode(stop);

      const record =
        lookup.get(stopCode);

      // ----------------------------------------------------
      // FUTURE STATION CHECK
      // ----------------------------------------------------
      //
      // Any scheduled stop after the current station is
      // a future station. Never show RailRadar actual
      // arrival/departure for it.
      //

      const isFutureStation =
        currentIndex >= 0 &&
        index > currentIndex;

      // ----------------------------------------------------
      // FUTURE STATION: FORCE "--"
      // ----------------------------------------------------

      if (isFutureStation) {

        return {
          ...stop,

          act_arr: "--",

          act_dep: "--"
        };

      }

      // ----------------------------------------------------
      // NO LIVE RECORD
      // ----------------------------------------------------

      if (!record) {
        return {
          ...stop,

          act_arr:
            stop.act_arr || "--",

          act_dep:
            stop.act_dep || "--"
        };
      }

      // ----------------------------------------------------
      // ONLY ACTUAL HALTS CAN HAVE ACTUAL TIMES
      // ----------------------------------------------------

      const isHalt =
        record.isHalt === true;

      const liveArr =
        isHalt
          ? pickClock(
              record,
              ACTUAL_ARRIVAL_KEYS
            )
          : "--";

      const liveDep =
        isHalt
          ? pickClock(
              record,
              ACTUAL_DEPARTURE_KEYS
            )
          : "--";

      const merged = {
        ...stop,

        act_arr:
          liveArr !== "--"
            ? liveArr
            : (stop.act_arr || "--"),

        act_dep:
          liveDep !== "--"
            ? liveDep
            : (stop.act_dep || "--")
      };

      // ----------------------------------------------------
      // PRESERVE LIVE COORDINATES
      // ----------------------------------------------------

      const liveLatLng =
        readLatLng(record);

      if (
        liveLatLng &&
        !readLatLng(stop)
      ) {

        merged.latitude =
          liveLatLng[0];

        merged.longitude =
          liveLatLng[1];

      }

      return merged;

    }
  );

}
// ============================================================
// JOURNEY STATUS HELPERS
// ============================================================
// Backend journey_status: NOT_STARTED | RUNNING | AT_STATION |
// COMPLETED | UNKNOWN. Stored lower-case on trainData
// (not_started / running / at_station / completed / unknown).
const NO_PREDICTION_STATUSES = ["not_started", "completed", "unknown"];

function normalizeJourneyStatus(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return text || null;
}

// True when the ETA / delay / delay-change UI may be shown.
function isPredictionAllowed(data) {
  if (!data) return false;
  if (typeof data.is_prediction_allowed === "boolean") {
    return data.is_prediction_allowed;
  }
  // Older backend without the flag: fall back to the status.
  return !NO_PREDICTION_STATUSES.includes(data.journey_status);
}

async function attachPrediction(trainData) {

  const trainNumber =
    trainData.number ||
    trainData.train_number;

  if (!trainNumber) {

    console.warn(
      "[GatiDrishti] No train number available for prediction."
    );

    trainData.predictionError =
      "Train number missing.";

    return;
  }

  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    PREDICT_TIMEOUT_MS
  );

  try {

    console.log(
      "[GatiDrishti] Requesting ML prediction for:",
      trainNumber
    );

    // --------------------------------------------------------
    // CALL BACKEND
    // --------------------------------------------------------

    const response = await fetch(
      `${API_BASE}/api/predict`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          train_number: String(trainNumber),
          date: getLocalDateString()
        }),

        signal: controller.signal
      }
    );

    console.log(
      "[GatiDrishti] /api/predict HTTP status:",
      response.status
    );

    // --------------------------------------------------------
    // READ RESPONSE
    // --------------------------------------------------------

    let prediction = null;

    try {

      prediction = await response.json();

    } catch (parseError) {

      console.error(
        "[GatiDrishti] /api/predict returned non-JSON body."
      );

    }

    console.log(
      "[GatiDrishti] Prediction response:",
      prediction
    );

    if (
      !response.ok ||
      !prediction ||
      !prediction.success
    ) {

      const reason =
        (prediction &&
          (prediction.details || prediction.error)) ||
        `HTTP ${response.status}`;

      console.warn(
        "[GatiDrishti] Prediction unavailable:",
        reason
      );

      trainData.predictionError =
        String(reason);

      return;
    }

    // ========================================================
    // JOURNEY STATUS
    // ========================================================

    trainData.journey_status =
      normalizeJourneyStatus(prediction.journey_status);

    trainData.is_prediction_allowed =
      typeof prediction.is_prediction_allowed === "boolean"
        ? prediction.is_prediction_allowed
        : !NO_PREDICTION_STATUSES.includes(trainData.journey_status);

    trainData.journey_message =
      prediction.message || null;

    trainData.scheduledDeparture =
      prediction.scheduled_departure || null;

    trainData.departureNote =
      prediction.departure_note || null;

    trainData.finalStationName =
      prediction.final_station_name || prediction.final_station || null;

    trainData.actualArrivalFinal =
      prediction.actual_arrival || null;

    // ------------------------------------------------------
    // ROUTE PROGRESS (backend: distance based, complete route)
    // ------------------------------------------------------
    const numOrNull = (v) =>
      typeof v === "number" && Number.isFinite(v) ? v : null;

    trainData.journeyProgressPercent =
      numOrNull(prediction.journey_progress_percent);

    trainData.scheduledStopsReached =
      numOrNull(prediction.scheduled_stops_reached);

    trainData.totalScheduledStops =
      numOrNull(prediction.total_scheduled_stops);

    // Existing "X km of Y km covered" line reads these two fields.
    if (numOrNull(prediction.total_distance_km) !== null) {
      trainData.totalDistanceKm = prediction.total_distance_km;
      trainData.coveredDistanceKm =
        numOrNull(prediction.distance_covered_km) ?? 0;
    }

    trainData.status_text =
      prediction.status_text || null;

    trainData.journey_day =
      prediction.journey_day || null;

    console.log(
      "[GatiDrishti] Journey status:",
      {
        journey_status:
          trainData.journey_status,

        status_text:
          trainData.status_text,

        journey_day:
          trainData.journey_day
      }
    );

    // ========================================================
    // NO PREDICTION ALLOWED (not started / completed / unknown)
    // ========================================================
    // Never keep a next station, ETA or delay from earlier data.
    if (!trainData.is_prediction_allowed) {
      trainData.delayMinutes = null;
      trainData.predictedDelayChange = null;
      trainData.nextEtaTime = "--";
      trainData.destinationEtaTime = "--";
      trainData.scheduledArrival = "--";
      trainData.nextStation = "";
      trainData.nextStationName = "";
      prediction.next_station = null;
      prediction.next_station_name = null;
    }

    // ========================================================
    // TIMELINE STOPS FROM BACKEND
    // ========================================================

    if (Array.isArray(prediction.stops)) {

      trainData.stops =
        prediction.stops;

      console.log(
        "[GatiDrishti] Timeline stops received:",
        trainData.stops
      );

    }

    // ========================================================
    // LIVE ROUTE (OPTIONAL) -> ACTUAL TIMES + COORDINATES
    // ========================================================
    //
    // prediction.route may be missing. Records are merged into the
    // scheduled stops by station CODE only.

    trainData.liveRoute =
      extractLiveRouteRecords(prediction.route);

    if (trainData.liveRoute.length > 0) {

      trainData.stops =
        mergeLiveRouteIntoStops(
          trainData.stops,
          trainData.liveRoute
        );

    }

    // ========================================================
    // ETA / CURRENT-NEXT / MAP STATE  (script.js)
    // ========================================================

    // Delay, ETA, current/next station and the CURRENT / NEXT / ETA
    // flags on the stops are handled by the ETA + MAP module.
    applyEtaPrediction(trainData, prediction);
    // ========================================================
// FINAL SAFETY: HIDE ACTUAL TIMES FOR FUTURE STATIONS
// ========================================================

if (
  Array.isArray(trainData.stops) &&
  trainData.stops.length > 0
) {

  let currentIndex = trainData.stops.findIndex(
    (s) => s && s.current === true
  );

  if (currentIndex < 0) {

    const nextIndex = trainData.stops.findIndex(
      (s) => s && s.next === true
    );

    if (nextIndex >= 0) {
      currentIndex = nextIndex - 1;
    }

  }

  if (currentIndex >= 0) {

    trainData.stops =
      trainData.stops.map((stop, index) => {

        if (
          index > currentIndex
        ) {

          return {
            ...stop,
            act_arr: "--",
            act_dep: "--",
            actualArrival: "--",
            actualDeparture: "--",
            actual_arrival: "--",
            actual_departure: "--"
          };

        }

        return stop;

      });

  }

}

    // ========================================================
    // NEW: PREDICTION TIMESTAMP (from backend / stored record)
    // ========================================================
    // Never browser time. Only the NEXT station's ETA has a
    // timestamp, so remember which station it belongs to.

    trainData.predictionTimeDisplay =
      trainData.is_prediction_allowed &&
      prediction.prediction_time_display
        ? String(prediction.prediction_time_display)
        : null;

    trainData.predictionTimeStation =
      trainData.is_prediction_allowed && prediction.next_station
        ? String(prediction.next_station).trim().toUpperCase()
        : null;

    // ========================================================
    // MODEL INFORMATION
    // ========================================================

    trainData.predictionModel =
      prediction.model ||
      "CatBoost";

    trainData.featureCount =
      prediction.feature_count ||
      27;

    trainData.lastUpdated =
      "just now";

    trainData.reason =
      trainData.is_prediction_allowed
        ? `Predicted using ${trainData.predictionModel} with live train data.`
        : (trainData.journey_message || "Prediction not available.");

    trainData.predictionError =
      null;

    // ========================================================
    // FINAL DEBUG
    // ========================================================

    console.log(
      "[GatiDrishti] Prediction attached successfully:",
      {
        currentStation:
          trainData.currentStation,

        nextStation:
          trainData.nextStation,

        journeyStatus:
          trainData.journey_status,

        statusText:
          trainData.status_text,

        journeyDay:
          trainData.journey_day,

        scheduledArrival:
          trainData.scheduledArrival,

        predictedDelayChange:
          trainData.predictedDelayChange,

        predictedDelay:
          trainData.delayMinutes,

        predictedArrival:
          trainData.nextEtaTime,

        stops:
          trainData.stops
      }
    );

  }

  catch (error) {

    const timedOut =
      error &&
      error.name === "AbortError";

    console.error(
      "[GatiDrishti] Prediction request failed:",
      timedOut
        ? `no response within ${PREDICT_TIMEOUT_MS / 1000}s`
        : error
    );

    trainData.predictionError =
      timedOut
        ? "Prediction timed out."
        : "Could not reach the prediction service.";

  }

  finally {

    clearTimeout(timeoutId);

  }

}


function renderPnrResult(pnr, record) {

  const statusClassMap = {
    CNF: "pnr-cnf",
    WL: "pnr-wl",
    RAC: "pnr-rac",
    CAN: "pnr-can"
  };


  const statusCls =
    statusClassMap[record.status] || "";


  resultsContainer.innerHTML = `

    <div class="result-card">

      <div class="result-header">

        <div>

          <div class="train-id">
            ${t("pnrLabel")} ${escapeHtml(pnr)}
          </div>

          <div class="train-route">
            ${escapeHtml(record.train)}
          </div>

        </div>

        <span class="pnr-status-badge ${statusCls}">
          ${t(record.statusKey)}
        </span>

      </div>


      <div class="pnr-details-grid">

        <div class="pnr-detail-item">
          <span class="pnr-detail-label">
            ${t("pnrFrom")}
          </span>
          <span class="pnr-detail-value">
            ${escapeHtml(record.from)}
          </span>
        </div>


        <div class="pnr-detail-item">
          <span class="pnr-detail-label">
            ${t("pnrTo")}
          </span>
          <span class="pnr-detail-value">
            ${escapeHtml(record.to)}
          </span>
        </div>


        <div class="pnr-detail-item">
          <span class="pnr-detail-label">
            ${t("pnrDate")}
          </span>
          <span class="pnr-detail-value">
            ${escapeHtml(record.journeyDate)}
          </span>
        </div>


        <div class="pnr-detail-item">
          <span class="pnr-detail-label">
            ${t("pnrClass")}
          </span>
          <span class="pnr-detail-value">
            ${escapeHtml(record.cls)}
          </span>
        </div>


        <div class="pnr-detail-item">
          <span class="pnr-detail-label">
            ${t("pnrCoach")}
          </span>
          <span class="pnr-detail-value">
            ${escapeHtml(record.coach)}
          </span>
        </div>


        <div class="pnr-detail-item">
          <span class="pnr-detail-label">
            ${t("pnrSeat")}
          </span>
          <span class="pnr-detail-value">
            ${escapeHtml(record.seat)}
          </span>
        </div>


        <div class="pnr-detail-item">
          <span class="pnr-detail-label">
            ${t("pnrPassengers")}
          </span>
          <span class="pnr-detail-value">
            ${record.passengers}
          </span>
        </div>


        <div class="pnr-detail-item">
          <span class="pnr-detail-label">
            ${t("pnrChart")}
          </span>
          <span class="pnr-detail-value">
            ${escapeHtml(record.chartStatus)}
          </span>
        </div>

      </div>


      <div class="coach-note">
        ${t("pnrDemoNote")}
      </div>

    </div>
  `;

}


// ============================================================
// TRAIN SCHEDULE - DEMO
// ============================================================

scheduleForm.addEventListener("submit", function (e) {

  e.preventDefault();

  const query =
    scheduleInput.value.trim();


  if (!query) {

    scheduleInput.focus();
    return;

  }


  handleScheduleSearch(query);

});


function handleScheduleSearch(query) {

  const normalized =
    query.trim().toLowerCase();


  const matchedNumber =
    Object.keys(SCHEDULE_DATA).find((num) => {

      const sched =
        SCHEDULE_DATA[num];


      return (
        num === normalized ||
        sched.name
          .toLowerCase()
          .includes(normalized)
      );

    });


  if (!matchedNumber) {

    resultsContainer.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">❓</div>

        <p>
          ${t("notFound")}
          "<strong>${escapeHtml(query)}</strong>".
          ${t("notFoundHint")}
        </p>

      </div>
    `;

    return;

  }


  renderSchedule(matchedNumber);

}


function renderSchedule(trainNumber) {

  const sched =
    SCHEDULE_DATA[trainNumber];


  const rows =
    sched.stations.map((s, idx) => `

      <tr
        class="${idx === 0 ? "sched-origin" : ""}
        ${idx === sched.stations.length - 1
          ? "sched-destination"
          : ""}"
      >

        <td>${idx + 1}</td>

        <td>
          <strong>
            ${escapeHtml(s.name)}
          </strong>

          <span class="sched-code">
            (${escapeHtml(s.code)})
          </span>
        </td>

        <td>${escapeHtml(s.arr)}</td>

        <td>${escapeHtml(s.dep)}</td>

        <td>Day ${s.day}</td>

        <td>${s.dist} km</td>

        <td>
          ${platformBadgeHtml(
            s.platform,
            "confirmed",
            ""
          )}
        </td>

      </tr>

    `).join("");


  resultsContainer.innerHTML = `

    <div class="result-card">

      <div class="result-header">

        <div>

          <div class="train-id">
            ${sched.number} ·
            ${escapeHtml(sched.name)}
          </div>

          <div class="train-route">
            ${t("runsOn")}:
            ${escapeHtml(sched.runsOn)}
          </div>

        </div>

        <span class="coach-demo-badge">
          ${t("scheduleDemoBadge")}
        </span>

      </div>


      <div class="schedule-table-wrap">

        <table class="schedule-table">

          <thead>

            <tr>

              <th>#</th>

              <th>
                ${t("schedStation")}
              </th>

              <th>
                ${t("schedArr")}
              </th>

              <th>
                ${t("schedDep")}
              </th>

              <th>
                ${t("schedDay")}
              </th>

              <th>
                ${t("schedDist")}
              </th>

              <th>
                ${t("schedPlatform")}
              </th>

            </tr>

          </thead>


          <tbody>
            ${rows}
          </tbody>

        </table>

      </div>


      <div class="coach-note">
        ${t("scheduleDataNote")}
      </div>

    </div>
  `;

}


// ============================================================
// COACH POSITION - DEMO
// ============================================================

coachForm.addEventListener("submit", function (e) {

  e.preventDefault();

  const query =
    coachInput.value.trim();


  if (!query) {

    coachInput.focus();
    return;

  }


  handleCoachSearch(query);

});


function handleCoachSearch(query) {

  const normalized =
    query.trim().toLowerCase();


  const matchedNumber =
    Object.keys(COACH_COMPOSITION).find((num) => {

      const train =
        DUMMY_TRAINS[num];


      return (
        num === normalized ||
        (
          train &&
          train.name
            .toLowerCase()
            .includes(normalized)
        )
      );

    });


  if (!matchedNumber) {

    resultsContainer.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">❓</div>

        <p>
          ${t("notFound")}
          "<strong>${escapeHtml(query)}</strong>".
          ${t("notFoundHint")}
        </p>

      </div>
    `;

    return;

  }


  renderCoachPosition(matchedNumber);

}


// ============================================================
// COACH POSITION - REAL (uses already-entered ETA train number)
// ============================================================
//
// When the user opens the Coach Position tab and an ETA
// prediction has already run (currentResultData is set), we
// reuse that train number and its already-fetched "stops"
// instead of asking the user to search again or making any
// extra API call.
//
// "stops" comes straight from the backend's /api/predict
// response (build_scheduled_ui_stops), which already contains
// ONLY scheduled-halt stations plus the origin/destination
// endpoints - intermediate, non-halt stations are never
// included, so this dropdown never needs to filter halt_time
// itself.
//
// Each stop may carry a "coach_position" field taken directly
// from RailRadar's live route data (matched by station code on
// the backend, same as actual arrival/departure). If RailRadar
// has not provided it for a station, coach_position is empty and
// a clear "not available" message is shown - no coach data is
// ever invented here.
// ============================================================

function hasRealEtaTrainData(trainData) {

  return !!(
    trainData &&
    trainData.number &&
    Array.isArray(trainData.stops) &&
    trainData.stops.length > 0
  );

}


function getStopCodeSafe(stop) {

  return (
    (typeof getStopCode === "function"
      ? getStopCode(stop)
      : (stop && stop.code)) || ""
  );

}


// De-duplicates by station code while preserving route order,
// using the same station-code matching already used elsewhere.
function getHaltStationsForCoachPosition(trainData) {

  const stops =
    Array.isArray(trainData.stops)
      ? trainData.stops
      : [];

  const seenCodes = new Set();
  const haltStations = [];

  stops.forEach((stop) => {

    if (!stop) {
      return;
    }

    const code = getStopCodeSafe(stop);

    if (!code || seenCodes.has(code)) {
      return;
    }

    seenCodes.add(code);
    haltStations.push(stop);

  });

  return haltStations;

}


function renderCoachPositionFromEta(trainData) {

  const haltStations =
    getHaltStationsForCoachPosition(trainData);

  // Keep the existing demo search box in sync so a manual
  // re-submit (if the user edits it) still behaves as before.
  if (coachInput) {
    coachInput.value = trainData.number;
  }

  if (haltStations.length === 0) {

    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🚃</div>
        <p>
          Route information for
          <strong>${escapeHtml(trainData.number)}</strong>
          isn't available yet. Try again once ETA results have loaded.
        </p>
      </div>
    `;

    return;

  }

  const optionsHtml = haltStations
    .map((stop) => {

      const code = getStopCodeSafe(stop);

      const label =
        stop.name
          ? `${stop.name} (${code})`
          : code;

      return `
        <option value="${escapeHtml(code)}">
          ${escapeHtml(label)}
        </option>
      `;

    })
    .join("");

  resultsContainer.innerHTML = `
    <div class="coach-position-card">

      <div class="coach-position-header">
        <div>
          <div class="coach-position-title">
            ${escapeHtml(trainData.number)} ·
            ${escapeHtml(trainData.name || "")}
          </div>
          <div class="coach-position-sub">
            ${escapeHtml(trainData.route || "")}
          </div>
        </div>

        <span class="coach-live-badge">
          🟢 LIVE
        </span>

      </div>

      <div class="coach-station-picker">
        <label for="coachStationSelect">
          Select a halt station
        </label>
        <select id="coachStationSelect">
          <option value="" disabled selected>
            Choose a station...
          </option>
          ${optionsHtml}
        </select>
      </div>

      <div id="coachPositionResult"></div>

    </div>
  `;

  const selectEl =
    document.getElementById("coachStationSelect");

  const resultEl =
    document.getElementById("coachPositionResult");

  selectEl.addEventListener("change", () => {

    const selectedCode = selectEl.value;

    const selectedStop =
      haltStations.find(
        (stop) => getStopCodeSafe(stop) === selectedCode
      );

    renderStationCoachPosition(
      selectedStop,
      resultEl
    );

  });

}


// Normalizes whatever shape RailRadar returns for a station's
// coach position into a simple list of {position, code, type}
// entries.
//
//   - []   -> nothing returned for this station (genuinely empty)
//   - null -> unrecognized shape; caller shows "not available"
//             rather than guessing at a structure we don't know
//
// Confirmed real RailRadar shape (from live backend logs):
// coachPosition is a single hyphen-delimited string of coach
// codes in physical train order, e.g.
//   "ENG-LPR-B1-B2-B3-B4-B5-B6-B7-B8-B9-B10-B11-PC-H1-AE1-
//    A1-A2-A3-A4-A5-LPR-VP"
// An array shape is also handled below for forward-compatibility
// in case RailRadar changes its response format.
// ============================================================
function normalizeCoachPositionEntries(raw) {

  if (raw === null || raw === undefined || raw === "") {
    return [];
  }

  if (typeof raw === "string") {

    const codes = raw
      .split("-")
      .map((code) => code.trim())
      .filter((code) => code.length > 0);

    if (codes.length === 0) {
      return [];
    }

    return codes.map((code, index) => ({
      position: index + 1,
      code: code,
      // "ENG" is an unambiguous locomotive marker across Indian
      // Railways coach codes; everything else is shown as-is
      // rather than guessing a travel class we can't verify.
      type: code === "ENG" ? "loco" : null
    }));

  }

  if (Array.isArray(raw)) {

    if (raw.length === 0) {
      return [];
    }

    return raw.map((entry, index) => {

      if (entry && typeof entry === "object") {

        return {

          position:
            entry.position ||
            entry.order ||
            entry.sequence ||
            (index + 1),

          code:
            entry.coachCode ||
            entry.coach_code ||
            entry.code ||
            entry.coachId ||
            entry.coach_id ||
            entry.id ||
            `Coach ${index + 1}`,

          type:
            entry.coachType ||
            entry.coach_type ||
            entry.type ||
            entry.cls ||
            entry.class ||
            null

        };

      }

      return {
        position: index + 1,
        code: String(entry),
        type: null
      };

    });

  }

  return null;

}


// Classifies a REAL coach code (as returned by RailRadar) into one of
// the existing COACH_CLASS_COLORS/COACH_CLASS_LABELS buckets, purely
// for icon colour + legend grouping. This never touches position,
// order, or which coaches exist - it only recognises well-established
// Indian Railways coach-code prefixes (ENG, H1, A1, B1, S1, PC, GRD...).
// A code that doesn't match a known convention returns null and is
// rendered with the neutral fallback colour in buildCoachSvg(), with
// its raw code still shown - nothing is ever guessed or invented.
function inferCoachTypeFromCode(code) {

  if (!code) {
    return null;
  }

  const c =
    String(code).trim().toUpperCase();

  if (c === "ENG") return "loco";
  if (c === "GRD" || c === "SLR" || c === "BRAKE") return "guard";
  if (c === "PC") return "pantry";
  if (/^H[A-Z]?\d/.test(c) || c.startsWith("1A")) return "ac1";
  if (/^A\d/.test(c) || c.startsWith("2A")) return "ac2";
  if (/^B\d/.test(c) || c.startsWith("3A")) return "ac3";
  if (/^S\d/.test(c) || c === "SL") return "sleeper";
  if (c === "GEN" || c === "GS" || c === "UR" || c === "D") return "general";
  if (c === "LPR" || c === "VP" || c === "PWR") return "power";

  return null;

}


function renderStationCoachPosition(stop, targetEl) {

  if (!targetEl) {
    return;
  }

  const entries =
    stop
      ? normalizeCoachPositionEntries(stop.coach_position)
      : [];

  if (!entries || entries.length === 0) {

    targetEl.innerHTML = `
      <div class="coach-position-unavailable">
        Coach position is not available for this station currently.
      </div>
    `;

    return;

  }

  const units = entries
    .map((entry) => {

      const cls =
        entry.type ||
        inferCoachTypeFromCode(entry.code);

      const isLoco =
        cls === "loco";

      const isGuard =
        cls === "guard";

      return `

        <div class="coach-unit">

          <span class="coach-number">
            ${escapeHtml(String(entry.position))}
          </span>

          ${buildCoachSvg(
            entry.code,
            cls,
            isLoco,
            isGuard
          )}

        </div>

      `;

    })
    .join(
      `<div
        class="coach-coupling"
        aria-hidden="true"
      ></div>`
    );

  const usedClasses =
    [
      ...new Set(
        entries
          .map((entry) => entry.type || inferCoachTypeFromCode(entry.code))
          .filter((cls) => !!cls && COACH_CLASS_COLORS[cls])
      )
    ];

  const legendHtml =
    usedClasses
      .map((cls) => `

        <span class="coach-legend-item">

          <span
            class="coach-legend-swatch"
            style="background: ${COACH_CLASS_COLORS[cls]}"
          ></span>

          ${t(COACH_CLASS_LABELS[cls])}

        </span>

      `)
      .join("");

  targetEl.innerHTML = `

    <div class="coach-direction-hint">
      🚂 Coach positions shown in train direction, as reported by RailRadar.
    </div>

    <div class="coach-diagram-scroll">

      <div class="coach-diagram-track">
        ${units}
      </div>

      <div class="coach-rail-track"></div>

    </div>

    ${
      legendHtml
        ? `<div class="coach-legend">${legendHtml}</div>`
        : ""
    }

    <div class="coach-note">
      Live coach order as reported by RailRadar for this station.
      Codes shown in grey are real coaches whose class isn't
      recognised by our display mapping yet.
    </div>

  `;

}


// ============================================================
// COACH SVG
// ============================================================

function buildCoachSvg(
  code,
  cls,
  isLoco,
  isGuard
) {

  const color =
    COACH_CLASS_COLORS[cls] || "#888";


  const bodyRx =
    isLoco ? 8 : 10;


  let frontShape = "";


  if (isLoco) {

    frontShape = `
      <path
        d="M4,10
           L14,4
           L70,4
           Q76,4 76,10
           L76,34
           Q76,40 70,40
           L14,40
           Q4,40 4,34
           Z"
        fill="${color}"
        stroke="rgba(0,0,0,0.25)"
        stroke-width="1"
      />
    `;

  }


  else {

    frontShape = `
      <rect
        x="4"
        y="4"
        width="72"
        height="36"
        rx="${bodyRx}"
        fill="${color}"
        stroke="rgba(0,0,0,0.2)"
        stroke-width="1"
      />
    `;

  }


  const windows =
    isLoco
      ? ""
      : `
        <rect
          x="12"
          y="11"
          width="10"
          height="9"
          rx="2"
          fill="rgba(255,255,255,0.85)"
        />

        <rect
          x="26"
          y="11"
          width="10"
          height="9"
          rx="2"
          fill="rgba(255,255,255,0.85)"
        />

        <rect
          x="40"
          y="11"
          width="10"
          height="9"
          rx="2"
          fill="rgba(255,255,255,0.85)"
        />

        <rect
          x="54"
          y="11"
          width="10"
          height="9"
          rx="2"
          fill="rgba(255,255,255,0.85)"
        />
      `;


  const doorLine =
    isLoco
      ? ""
      : `
        <line
          x1="40"
          y1="4"
          x2="40"
          y2="40"
          stroke="rgba(255,255,255,0.35)"
          stroke-width="1.5"
        />
      `;


  const label = `
    <text
      x="40"
      y="30"
      text-anchor="middle"
      font-size="10"
      font-weight="700"
      fill="rgba(255,255,255,0.95)"
      font-family="Inter, sans-serif"
    >
      ${escapeHtml(code)}
    </text>
  `;


  const wheels = `
    <circle
      cx="20"
      cy="43"
      r="4"
      fill="#2b2b2b"
    />

    <circle
      cx="60"
      cy="43"
      r="4"
      fill="#2b2b2b"
    />
  `;


  return `
    <svg
      viewBox="0 0 80 48"
      width="72"
      height="44"
      class="coach-svg"
    >

      ${frontShape}
      ${windows}
      ${doorLine}
      ${label}
      ${wheels}

    </svg>
  `;

}


// ============================================================
// RENDER COACH POSITION
// ============================================================

function renderCoachPosition(trainNumber) {

  const train =
    DUMMY_TRAINS[trainNumber];


  const composition =
    COACH_COMPOSITION[trainNumber];


  const units =
    composition.map(
      ([code, cls], idx) => {

        const isLoco =
          cls === "loco";


        const isGuard =
          cls === "guard";


        return `

          <div class="coach-unit">

            <span class="coach-number">
              ${idx + 1}
            </span>

            ${buildCoachSvg(
              code,
              cls,
              isLoco,
              isGuard
            )}

          </div>

        `;

      }
    ).join(
      `<div
        class="coach-coupling"
        aria-hidden="true"
      ></div>`
    );


  const usedClasses =
    [
      ...new Set(
        composition.map(
          (c) => c[1]
        )
      )
    ];


  const legend =
    usedClasses.map(
      (cls) => `

        <span class="coach-legend-item">

          <span
            class="coach-legend-swatch"
            style="
              background:
              ${COACH_CLASS_COLORS[cls]}
            "
          ></span>

          ${t(
            COACH_CLASS_LABELS[cls]
          )}

        </span>

      `
    ).join("");


  resultsContainer.innerHTML = `

    <div class="coach-position-card">

      <div class="coach-position-header">

        <div>

          <div class="coach-position-title">

            ${train.number} ·
            ${escapeHtml(train.name)}

          </div>

          <div class="coach-position-sub">

            ${escapeHtml(train.route)}

          </div>

        </div>


        <span class="coach-demo-badge">

          ${t("coachDemoBadge")}

        </span>

      </div>


      <div class="coach-direction-hint">

        🚂 ${t("coachDirectionHint")}

      </div>


      <div class="coach-diagram-scroll">

        <div class="coach-diagram-track">

          ${units}

        </div>

        <div class="coach-rail-track"></div>

      </div>


      <div class="coach-legend">

        ${legend}

      </div>


      <div class="coach-note">

        ${t("coachDataNote")}

      </div>

    </div>

  `;

}


// ============================================================
// HELP MODAL
// ============================================================

helpBtn.addEventListener("click", () => {

  helpModalOverlay.classList.add("open");

  document.body.classList.add("modal-open");

});


helpModalClose.addEventListener(
  "click",
  closeHelpModal
);


helpModalOverlay.addEventListener(
  "click",
  (e) => {

    if (
      e.target === helpModalOverlay
    ) {

      closeHelpModal();

    }

  }
);


// Escape closes the help modal. (The map has its own Escape handler
// in script.js.)
document.addEventListener(
  "keydown",
  (e) => {

    if (e.key === "Escape") {

      closeHelpModal();

    }

  }
);


function closeHelpModal() {

  helpModalOverlay.classList.remove("open");

  document.body.classList.remove("modal-open");

}


// ============================================================
// THEME TOGGLE
// ============================================================

function applyTheme(theme) {

  document.body.setAttribute(
    "data-theme",
    theme
  );


  themeIcon.textContent =
    theme === "dark"
      ? "☀️"
      : "🌙";


  localStorage.setItem(
    "eta_theme",
    theme
  );

}


themeToggle.addEventListener(
  "click",
  () => {

    const current =
      document.body.getAttribute(
        "data-theme"
      );


    applyTheme(
      current === "dark"
        ? "light"
        : "dark"
    );

  }
);


(function initTheme() {

  const saved =
    localStorage.getItem(
      "eta_theme"
    );


  applyTheme(
    saved === "dark"
      ? "dark"
      : "light"
  );

})();


// ============================================================
// ETA RESULT CARD
// ============================================================

function renderNotFound(query) {

  resultsContainer.innerHTML = `

    <div class="empty-state">

      <div class="empty-icon">❓</div>

      <p>

        ${t("notFound")}
        "<strong>
          ${escapeHtml(query)}
        </strong>".

        ${t("notFoundHint")}

      </p>

    </div>

  `;

}



 function renderResultCard(data) {

  const hasDelay =
    typeof data.delayMinutes === "number";

  const delay =
    Number(data.delayMinutes || 0);

  let statusClass = "ontime";
  let statusText =
    data.status_text || "On Time";

  if (data.journey_status === "not_started") {

    statusClass = "not-started";
    statusText = "Train Not Started";

  }
  else if (data.journey_status === "completed") {

    statusClass = "completed";
    statusText = "Journey Completed";

  }
  else if (data.journey_status === "unknown") {
    statusClass = "not-started";
    statusText = "Status Unavailable";
  }
  else if (
    data.journey_status === "running" ||
    data.journey_status === "at_station"
  ) {

    // The backend status_text describes the train's CURRENT delay
    // ("On Time" / "Delayed by X min" / "X min Early"). Prefer it.
    // The predicted final delay is shown in the ETA panel instead.
    const backendStatus =
      typeof data.status_text === "string"
        ? data.status_text.trim()
        : "";

    if (backendStatus) {

      const lowered = backendStatus.toLowerCase();

      statusText = backendStatus;

      statusClass =
        lowered.startsWith("delayed")
          ? "delayed"
          : lowered.includes("early")
            ? "early"
            : "ontime";

    }
    else if (hasDelay && delay > 0) {

      statusClass = "delayed";
      statusText =
        `Delayed by ${Math.round(delay)} min`;

    }
    else if (hasDelay && delay < 0) {

      statusClass = "early";
      statusText =
        `${Math.abs(Math.round(delay))} min Early`;

    }
    else {

      statusClass = "ontime";
      statusText = "On Time";

    }
  }

  resultsContainer.innerHTML = `

    <div class="result-card">

      ${renderHeader(
        data,
        statusClass,
        escapeHtml(statusText)
      )}

      ${renderEtaPanel(data)}

      ${renderTimeline(data)}

      ${renderRouteOverview(data)}

      ${renderAlerts(data)}

    </div>

    ${renderBottomGrid(data)}

  `;

  const mapBtn =
    document.getElementById(
      "showMapBtn"
    );

  if (mapBtn) {

    mapBtn.addEventListener(
      "click",
      () => openMapModal(data)
    );

  }

}

// ============================================================
// RESULT HEADER
// ============================================================

function renderHeader(
  data,
  statusClass,
  statusText
) {

  const confKey =
    data.confidence === "high"
      ? "confHigh"
      : data.confidence === "medium"
        ? "confMedium"
        : "confLow";


  return `

    <div class="result-header">

      <div>

        <div class="train-id">

          ${escapeHtml(
            data.number || ""
          )}

          ·

          ${escapeHtml(
            data.name || ""
          )}

        </div>


        <div class="train-route">

          ${escapeHtml(
            data.route || ""
          )}

        </div>

      </div>


      <div class="status-group">

        <span
          class="status-badge ${statusClass}"
        >
          ${statusText}
        </span>
        ${
          isPredictionAllowed(data)
            ? `<span
                class="confidence-badge ${data.confidence || "medium"}"
              >
                <span class="confidence-dot"></span>
                ${t(confKey)}
              </span>`
            : ""
        }

      </div>

    </div>

  `;

}


// ============================================================
// PLATFORM BADGE
// ============================================================

function platformBadgeHtml(
  platformNo,
  confidenceLevel,
  size
) {

  if (!platformNo) return "";


  const isConfirmed =
    confidenceLevel === "confirmed";


  const cls =
    isConfirmed
      ? "platform-badge confirmed"
      : "platform-badge expected";


  const sizeCls =
    size === "lg"
      ? " platform-badge-lg"
      : "";


  const label =
    isConfirmed
      ? t("platformConfirmed")
      : t("platformExpected");


  return `

    <span
      class="${cls}${sizeCls}"
      title="${escapeHtml(label)}"
    >

      <span class="platform-badge-icon">
        🛤️
      </span>

      <span class="platform-badge-text">

        ${t("platformShort")}
        ${escapeHtml(platformNo)}

      </span>

      <span class="platform-badge-tag">

        ${label}

      </span>

    </span>

  `;

}

// rebder ETA panel Function
// ============================================================
// ETA PANEL
// ============================================================

// One labelled row of the journey-status card.
function journeyInfoRow(label, value) {
  return `
    <div style="margin-top:6px; font-size:14px;">
      <strong>${escapeHtml(label)}:</strong>
      ${escapeHtml(value || "--")}
    </div>
  `;
}

// Card shown INSTEAD of the ETA / delay blocks when the backend says
// is_prediction_allowed === false. It never shows an ETA, a delay or
// a delay change.
function renderJourneyStatusPanel(data) {
  const status = data.journey_status;

  const currentName =
    data.currentStationName ||
    data.currentStation ||
    data.origin ||
    "--";

  let title = "";
  let rows = "";

  if (status === "not_started") {
    title =
      data.journey_message ||
      "Train has not started its journey yet.";

    rows =
      journeyInfoRow("Current station", currentName) +
      journeyInfoRow(
        "Scheduled departure",
        data.scheduledDeparture
      ) +
      journeyInfoRow("Train status", "Not Started");

    // Backend-validated note (null when departure is still in the
    // future, so no "past scheduled time" warning is shown then).
    if (data.departureNote) {
      rows += journeyInfoRow("Note", data.departureNote);
    }
  }
  else if (status === "completed") {
    title =
      data.journey_message ||
      "Train journey completed.";

    rows =
      journeyInfoRow(
        "Final station",
        data.finalStationName || currentName
      ) +
      journeyInfoRow(
        "Actual arrival",
        data.actualArrivalFinal || "Not available"
      ) +
      journeyInfoRow("Train status", "Completed");
  }
  else {
    title =
      data.journey_message ||
      "Live train status is currently unavailable.";

    rows =
      journeyInfoRow("Train status", "Unavailable") +
      journeyInfoRow(
        "Note",
        "The scheduled stops below are still available. " +
        "Live prediction resumes when live data is available."
      );
  }

  return `
    <div class="eta-reason">
      <span class="icon">ℹ️</span>
      <span>
        <strong>${escapeHtml(title)}</strong>
        ${rows}
      </span>
    </div>
  `;
}

function renderEtaPanel(data) {

  // NOT STARTED / COMPLETED / UNKNOWN:
  // status card only. No ETA block, no delay block, no
  // "Current -> Next" row, no "Predicted using CatBoost" row.
  if (!isPredictionAllowed(data)) {
    return `
      <div class="eta-panel">
        ${renderJourneyStatusPanel(data)}
      </div>
    `;
  }

  // CURRENT / NEXT STATION (display names)
  const currentStation =
    data.currentStationName ||
    data.currentStation ||
    "--";

  const nextStation =
    data.nextStationName ||
    data.nextStation ||
    "--";

  // MODEL / FEATURE COUNT
  const model =
    data.predictionModel ||
    "CatBoost";

  const featureCount =
    data.featureCount ||
    27;

  // Train is stopped at an intermediate station (prediction is
  // still valid, but it must not be described as "travelling").
  const atStationNote =
    data.journey_status === "at_station"
      ? `
        <div class="eta-reason">
          <span class="icon">🚉</span>
          <span>
            <strong>
              ${escapeHtml(
                data.journey_message ||
                "Train is currently at this station."
              )}
            </strong>
          </span>
        </div>
      `
      : "";

  // "Next Station ETA" + "Predicted Delay" blocks come from the ETA
  // module (script.js). The platform badge is supplied from here so
  // script.js does not depend on other.js.
  return `
    <div class="eta-panel">

      ${renderEtaBlocks(
        data,
        platformBadgeHtml(
          data.nextPlatform,
          data.nextPlatformConfidence,
          "lg"
        )
      )}

      ${atStationNote}

      <!-- CURRENT -> NEXT -->
      <div class="eta-reason">
        <span class="icon">
          🚆
        </span>
        <span>
          <strong>
            Current:
          </strong>
          ${escapeHtml(currentStation)}
          <span
            style="
              margin:0 6px;
              opacity:0.7;
            "
          >
            →
          </span>
          <strong>
            Next:
          </strong>
          ${escapeHtml(nextStation)}
        </span>
      </div>

      <!-- MODEL INFORMATION -->
      <div class="eta-reason">
        <span class="icon">
          ℹ️
        </span>
        <span>
          ${escapeHtml(
            data.reason ||
            "Live ML prediction."
          )}
          <br>
          <small>
            Model:
            <strong>
              ${escapeHtml(model)}
            </strong>
            ·
            Features:
            <strong>
              ${escapeHtml(featureCount)}
            </strong>
          </small>
        </span>
      </div>

    </div>
  `;
}

// ============================================================
// TIMELINE
// ============================================================

function renderTimeline(data) {

  if (
    !Array.isArray(data.stops) ||
    data.stops.length === 0
  ) {
    return "";
  }

  // ========================================================
  // FIND CURRENT STATION AFTER applyEtaPrediction()
  // ========================================================

  const validStops = data.stops
    .filter((s) => s && typeof s === "object");

  // Current station index
  let currentIndex = validStops.findIndex(
    (s) => s.current === true
  );

  // Fallback: next station ke immediately previous station
  if (currentIndex < 0) {
    const nextIndex = validStops.findIndex(
      (s) => s.next === true
    );

    if (nextIndex >= 0) {
      currentIndex = nextIndex - 1;
    }
  }

  // Debug
  console.log("[TIMELINE ACTUAL DEBUG]", {
    currentIndex,
    stops: validStops.map((s, index) => ({
      index,
      code: getStopCode(s),
      current: s.current,
      next: s.next,
      act_arr: s.act_arr,
      act_dep: s.act_dep
    }))
  });

const rows = validStops.map((s, index) => {

    const stationName =
      s.name ||
      s.code ||
      "--";

    const schArr =
      s.sch_arr ||
      s.scheduled_arrival ||
      "--";

    const schDep =
      s.sch_dep ||
      s.scheduled_departure ||
      "--";

    // Actual times come ONLY from actual timestamps (never from
    // delayArrival / delayDeparture). Missing -> "--".
    // ========================================================
    // ACTUAL TIMES
    // ========================================================
    //
    // Future stations must ALWAYS display "--".
    // This check is performed here because applyEtaPrediction()
    // has already marked current/next stations by this stage.
    //

    const isFutureStation =
      currentIndex >= 0 &&
      index > currentIndex;

    let actArr = "--";
    let actDep = "--";

    if (!isFutureStation) {

      actArr = safeActualClock(
        s,
        ACTUAL_ARRIVAL_KEYS
      );

      actDep = safeActualClock(
        s,
        ACTUAL_DEPARTURE_KEYS
      );

    }

    const isCurrent =
      s.current === true;

    // A station can never be both CURRENT and NEXT.
    const isNext =
      s.next === true &&
      !isCurrent;

    // ETA is shown ONLY on the NEXT station (ETA module, script.js).
    const eta =
      getStopEtaText(s, data);

    // NEW: "Predicted at" label under the ETA (NEXT station only).
    // Shown only when a real ETA exists AND the stored prediction
    // belongs to this same station. Otherwise a placeholder.
    let predictedAtHtml = "";
    let etaWrapOpen = "";
    let etaWrapClose = "";

    if (isNext) {

      // column wrapper so the label always sits UNDER the ETA,
      // whatever layout .stop-time-cell has.
      etaWrapOpen =
        '<div style="display:flex; flex-direction:column;">';
      etaWrapClose = "</div>";

      const hasEta =
        eta && String(eta).trim() !== "--";

      const stopCodeNorm =
        String(getStopCode(s) || "").trim().toUpperCase();

      const sameStation =
        !!data.predictionTimeStation &&
        data.predictionTimeStation === stopCodeNorm;

      const predictedAtText =
        hasEta && sameStation && data.predictionTimeDisplay
          ? data.predictionTimeDisplay
          : "--";

      predictedAtHtml = `
        <span
          class="stop-predicted-at"
          style="
            display:block;
            font-size:10px;
            font-weight:400;
            opacity:0.65;
            margin-top:2px;
            white-space:nowrap;
          "
        >
          Predicted at: ${escapeHtml(predictedAtText)}
        </span>
      `;
    }

    return `
      <div
        class="timeline-stop"
        style="
          display:grid;
          grid-template-columns:
            minmax(180px, 1fr)
            110px
            110px
            110px
            110px
            110px;
          align-items:center;
          gap:12px;
          padding:12px;
          margin-bottom:6px;
          border-bottom:1px solid rgba(128,128,128,0.25);
        "
      >

        <div
          style="
            display:flex;
            align-items:center;
            gap:8px;
            min-width:0;
          "
        >

          <div class="stop-dot ${
            isCurrent
              ? "current"
              : isNext
                ? "next"
                : "ontime"
          }"></div>

          <div
            style="
              min-width:0;
              white-space:nowrap;
              overflow:hidden;
              text-overflow:ellipsis;
            "
          >

            <strong>
              ${escapeHtml(stationName)}
            </strong>

            ${
              s.code
                ? `
                  <span
                    style="
                      opacity:0.6;
                      font-size:12px;
                      margin-left:5px;
                    "
                  >
                    (${escapeHtml(s.code)})
                  </span>
                `
                : ""
            }

            ${
              isCurrent
                ? `<span style="margin-left:8px; font-size:10px; font-weight:700; color:#C41230;">● CURRENT</span>`
                : isNext
                  ? `<span style="margin-left:8px; font-size:10px; font-weight:700; color:#1565C0;">▶ NEXT</span>`
                  : ""
            }

          </div>

        </div>


        <!-- Scheduled Arrival -->
        <div class="stop-time-cell">

          <span class="stop-time-value">
            ${escapeHtml(schArr)}
          </span>

        </div>


        <!-- Scheduled Departure -->
        <div class="stop-time-cell">

          <span class="stop-time-value">
            ${escapeHtml(schDep)}
          </span>

        </div>


        <!-- Actual Arrival -->
        <div class="stop-time-cell">

          <span class="stop-time-value">
            ${escapeHtml(actArr)}
          </span>

        </div>


        <!-- Actual Departure -->
        <div class="stop-time-cell">

          <span class="stop-time-value">
            ${escapeHtml(actDep)}
          </span>

        </div>


        <!-- ETA -->
        <div class="stop-time-cell">

          ${etaWrapOpen}

          <span
            class="stop-time-value predicted"
            style="
              font-weight:${isNext ? "700" : "400"};
            "
          >
            ${escapeHtml(eta)}
          </span>

          ${predictedAtHtml}

          ${etaWrapClose}

        </div>

      </div>
    `;
  }).join("");


  return `
    <div class="timeline-section">

      <div class="section-title">
        Scheduled Stops
      </div>


      <div
        class="timeline"
        style="
          width:100%;
          overflow-x:auto;
        "
      >

        <div
          class="timeline-header"
          style="
            display:grid;
            grid-template-columns:
              minmax(180px, 1fr)
              110px
              110px
              110px
              110px
              110px;
            gap:12px;
            padding:10px 12px;
            font-size:11px;
            font-weight:700;
            opacity:0.65;
            border-bottom:1px solid rgba(128,128,128,0.35);
          "
        >

          <span>STATION</span>
          <span>SCH ARR</span>
          <span>SCH DEP</span>
          <span>ACT ARR</span>
          <span>ACT DEP</span>
          <span>ETA</span>

        </div>

        ${rows}

      </div>

    </div>
  `;
}

// ============================================================
// ROUTE OVERVIEW
// ============================================================
//
// NOTE: renderRouteOverview / renderAlerts / renderBottomGrid were
// called by renderResultCard() but were not defined anywhere in
// script.js. That ReferenceError was what broke the ETA result.
// These are minimal, data-driven implementations. Each returns ""
// when there is nothing to show. If you still have the originals,
// you can paste them over these three functions.
// ============================================================

function renderRouteOverview(data) {

  const stops =
    Array.isArray(data.stops)
      ? data.stops
      : [];

  if (stops.length === 0) {
    return "";
  }


  const first = stops[0];
  const last = stops[stops.length - 1];

  const currentIdx = stops.findIndex((s) => s.current);
  const nextIdx = stops.findIndex((s) => s.next);


  // ------------------------------------------------------
  // SCHEDULED STOPS REACHED  (station based)
  // Backend value first; otherwise derived from the current
  // station. A train that has not started has reached 0.
  // ------------------------------------------------------
  let reached = null;
  const totalStops =
    typeof data.totalScheduledStops === "number" &&
    data.totalScheduledStops > 0
      ? data.totalScheduledStops
      : stops.length;

  if (typeof data.scheduledStopsReached === "number") {
    reached = data.scheduledStopsReached;
  } else if (data.journey_status === "not_started") {
    reached = 0;
  } else if (data.journey_status === "completed") {
    reached = totalStops;
  } else if (data.journey_status === "unknown") {
    reached = null;
  } else if (currentIdx >= 0) {
    reached = currentIdx + 1;
  } else if (nextIdx >= 0) {
    reached = nextIdx;
  }

  if (reached !== null) {
    reached = Math.min(Math.max(reached, 0), totalStops);
  }


  // ------------------------------------------------------
  // JOURNEY PROGRESS  (cumulative distance based)
  // Comes ONLY from the backend. Never derived from the
  // station index or the current segment. When distances are
  // unavailable the bar is hidden instead of showing a guess.
  // ------------------------------------------------------
  const progressPercent =
    typeof data.journeyProgressPercent === "number"
      ? Math.min(100, Math.max(0, data.journeyProgressPercent))
      : null;

  const stopsLineHtml =
    reached === null
      ? ""
      : `
          <div style="margin-top:6px; font-size:12px; opacity:0.7;">
            Scheduled stops reached: ${reached} / ${totalStops}
          </div>
        `;

  const progressHtml =
    progressPercent === null && reached === null
      ? ""
      : `
        <div style="margin-top:12px;">

          ${
            progressPercent === null
              ? ""
              : `
          <div
            style="
              height:8px;
              border-radius:4px;
              background:rgba(128,128,128,0.25);
              overflow:hidden;
            "
          >
            <div
              style="
                height:100%;
                width:${progressPercent}%;
                background:#2E7D32;
              "
            ></div>
          </div>

          <div style="margin-top:6px; font-size:12px; opacity:0.7;">
            Journey progress: ${progressPercent.toFixed(1)}%
          </div>
          `
          }

          ${stopsLineHtml}

        </div>
      `;


  const totalKm = Number(data.totalDistanceKm || 0);
  const coveredKm = Number(data.coveredDistanceKm || 0);

  const distanceHtml =
    totalKm > 0
      ? `
        <div style="margin-top:4px; font-size:12px; opacity:0.7;">
          ${Math.round(coveredKm)} km of ${Math.round(totalKm)} km covered
        </div>
      `
      : "";


  return `
    <div class="timeline-section">

      <div class="section-title">
        Route Overview
      </div>

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          flex-wrap:wrap;
        "
      >

        <div>
          <strong>${escapeHtml(first.name || first.code || "--")}</strong>
          <span style="margin:0 8px; opacity:0.6;">→</span>
          <strong>${escapeHtml(last.name || last.code || "--")}</strong>
        </div>

        <button
          type="button"
          id="showMapBtn"
          class="chip"
        >
          🗺️ View route map
        </button>

      </div>

      ${progressHtml}
      ${distanceHtml}

    </div>
  `;
}


// ============================================================
// ALERTS
// ============================================================

function renderAlerts(data) {

  const alerts =
    Array.isArray(data.alerts)
      ? data.alerts
      : [];

  const messages =
    alerts
      .map((a) =>
        typeof a === "string"
          ? a
          : (a && (a.message || a.text || a.title)) || ""
      )
      .filter(Boolean);

  if (messages.length === 0) {
    return "";
  }

  return `
    <div class="timeline-section">

      <div class="section-title">
        Alerts
      </div>

      ${messages.map((m) => `
        <div class="eta-reason">
          <span class="icon">⚠️</span>
          <span>${escapeHtml(m)}</span>
        </div>
      `).join("")}

    </div>
  `;
}


// ============================================================
// BOTTOM GRID
// ============================================================

function renderBottomGrid(data) {

  const cards = [];

  const punctuality = Number(data.punctuality30d || 0);

  if (punctuality > 0) {

    cards.push(`
      <div class="result-card" style="padding:16px;">
        <div class="section-title">30-day punctuality</div>
        <strong style="font-size:24px;">${escapeHtml(Math.round(punctuality))}%</strong>
      </div>
    `);

  }

  cards.push(`
    <div class="result-card" style="padding:16px;">
      <div class="section-title">How this ETA is built</div>
      <div style="font-size:13px; opacity:0.8;">
        Live position (RailRadar), weather (Open-Meteo),
        congestion and route data feed
        ${escapeHtml(data.predictionModel || "CatBoost")}.
        The model predicts the change in delay up to the next
        station; the ETA is scheduled arrival plus the resulting delay.
      </div>
    </div>
  `);

  return `
    <div
      style="
        display:grid;
        grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));
        gap:16px;
        margin-top:16px;
      "
    >
      ${cards.join("")}
    </div>
  `;
}


// ============================================================
// ERROR STATE (backend unreachable / render failure)
// Distinct from renderNotFound so a real error is never shown
// as "train not found".
// ============================================================

function renderErrorState(message) {

  resultsContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <p>${escapeHtml(message)}</p>
    </div>
  `;

}


// ============================================================
// UTILITY
// ============================================================



// ============================================================
// INITIALIZATION
// ============================================================

renderQuickChips("eta");


console.log(
  "[GatiDrishti] Frontend loaded."
);

console.log(
  "[GatiDrishti] ETA mode = REAL BACKEND + ML"
);

console.log(
  "[GatiDrishti] Demo data = Schedule/Coach/PNR only"
);