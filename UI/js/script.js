// ============================================================
// GATIDRISHTI FRONTEND
// ETA = REAL BACKEND / ML
// Schedule / Coach / PNR = LIMITED DEMO DATA
// ============================================================

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

const mapModalOverlay = document.getElementById("mapModalOverlay");
const mapModalClose = document.getElementById("mapModalClose");
const mapModalSubtitle = document.getElementById("mapModalSubtitle");

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

let leafletMapInstance = null;
let indiaBoundaryLayer = null;
let indiaBoundaryGeoJsonCache = null;


// ---------- BACKEND ----------

const API_BASE = "https://gatidrishti.onrender.com";


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


// ---------- STATION COORDINATES ----------

const STATION_LATLNG = {
  "Howrah (HWH)": [22.5839, 88.3428],
  "Howrah Jn": [22.5839, 88.3428],

  "Asansol Jn": [23.6739, 86.9524],
  "Asansol Jn (ASN)": [23.6739, 86.9524],

  "Dhanbad Jn": [23.7957, 86.4304],
  "Dhanbad Jn (DHN)": [23.7957, 86.4304],

  "Gaya Jn": [24.7955, 84.9994],

  "Mughalsarai": [25.2802, 83.1187],
  "Mughalsarai Jn": [25.2802, 83.1187],

  "New Delhi": [28.6431, 77.2197],
  "New Delhi (NDLS)": [28.6431, 77.2197]
};


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

    await attachPrediction(trainData);


    // --------------------------------------------------------
    // STEP 3: SAVE RESULT
    // --------------------------------------------------------

    currentResultData = trainData;


    // --------------------------------------------------------
    // STEP 4: RENDER
    // --------------------------------------------------------

    return renderResultCard(trainData);

  }


  catch (error) {

    console.error(
      "[GatiDrishti] ETA search failed:",
      error
    );

    renderNotFound(query);

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

    delayMinutes:
      typeof data.delayMinutes === "number"
        ? data.delayMinutes
        : 0,

    confidence:
      data.confidence ||
      "medium",

    nextStation:
      data.nextStation ||
      data.next_station ||
      "Next station",

    nextEtaTime:
      data.nextEtaTime ||
      data.next_eta_time ||
      "--",

    destinationEtaTime:
      data.destinationEtaTime ||
      data.destination_eta_time ||
      "--",

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
// ATTACH ML PREDICTION
// ============================================================

async function attachPrediction(trainData) {

  const trainNumber =
    trainData.number ||
    trainData.train_number;


  if (!trainNumber) {

    console.warn(
      "[GatiDrishti] No train number available for prediction."
    );

    return;

  }


  try {

    console.log(
      "[GatiDrishti] Requesting ML prediction for:",
      trainNumber
    );


    // Backend itself gets live journey date from RailRadar.
    // Sending date is harmless if backend accepts it.
    const today =
      new Date().toISOString().slice(0, 10);


    const response = await fetch(
      `${API_BASE}/api/predict`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          train_number: String(trainNumber),
          date: today
        })
      }
    );


    console.log(
      "[GatiDrishti] /api/predict status:",
      response.status
    );


    if (!response.ok) {

      const errorText = await response.text();

      console.error(
        "[GatiDrishti] Prediction failed:",
        errorText
      );

      return;

    }


    const prediction = await response.json();


    console.log(
      "[GatiDrishti] Prediction response:",
      prediction
    );


    if (!prediction.success) {

      console.warn(
        "[GatiDrishti] Prediction returned success=false."
      );

      return;

    }


    // --------------------------------------------------------
    // REAL PREDICTED DELAY
    // --------------------------------------------------------

    if (
      typeof prediction.predicted_delay === "number"
    ) {

      trainData.delayMinutes =
        prediction.predicted_delay;

    }


    // --------------------------------------------------------
    // REAL PREDICTED ARRIVAL
    // --------------------------------------------------------

    if (
      prediction.predicted_arrival_time
    ) {

      trainData.nextEtaTime =
        prediction.predicted_arrival_time;

    }


    // --------------------------------------------------------
    // CURRENT STATION
    // --------------------------------------------------------

    if (prediction.current_station) {

      trainData.currentStation =
        prediction.current_station;

    }


    if (prediction.current_station_name) {

      trainData.currentStationName =
        prediction.current_station_name;

    }


    // --------------------------------------------------------
    // NEXT STATION
    // --------------------------------------------------------

    if (prediction.next_station) {

      trainData.nextStation =
        prediction.next_station;

    }


    if (prediction.next_station_name) {

      trainData.nextStationName =
        prediction.next_station_name;

    }


    // --------------------------------------------------------
    // SCHEDULED ARRIVAL
    // --------------------------------------------------------

    if (prediction.scheduled_arrival) {

      trainData.scheduledArrival =
        prediction.scheduled_arrival;

    }


    trainData.predictionModel =
      prediction.model || "CatBoost";


    trainData.featureCount =
      prediction.feature_count || 27;


    trainData.lastUpdated =
      "just now";


    trainData.reason =
      `Predicted using ${trainData.predictionModel} with live train data.`;


    console.log(
      "[GatiDrishti] Prediction attached successfully:",
      trainData.delayMinutes
    );

  }


  catch (error) {

    console.error(
      "[GatiDrishti] Prediction request failed:",
      error
    );

  }

}


// ============================================================
// RERENDER CURRENT RESULT
// ============================================================

window.rerenderCurrentResult = function () {

  if (
    currentResultData &&
    currentTab === "eta"
  ) {

    renderResultCard(currentResultData);

  }

};


// ============================================================
// PNR STATUS - DEMO
// ============================================================

pnrForm.addEventListener("submit", function (e) {

  e.preventDefault();

  const pnr = pnrInput.value.trim();


  if (!/^\d{10}$/.test(pnr)) {

    renderPnrValidationError();
    return;

  }


  handlePnrLookup(pnr);

});


function handlePnrLookup(pnr) {

  resultsContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🎫</div>
      <p>
        ${t("fetching")}
        PNR <strong>${escapeHtml(pnr)}</strong>...
      </p>
    </div>
  `;


  setTimeout(() => {

    const record =
      PNR_DEMO_DATA[pnr];


    if (!record) {

      renderPnrNotFound(pnr);
      return;

    }


    renderPnrResult(pnr, record);

  }, 450);

}


function renderPnrValidationError() {

  resultsContainer.innerHTML = `
    <div class="empty-state warn">
      <div class="empty-icon">⚠️</div>
      <p>${t("pnrInvalid")}</p>
    </div>
  `;

}


function renderPnrNotFound(pnr) {

  resultsContainer.innerHTML = `
    <div class="not-connected-card">

      <div class="not-connected-icon">🎫</div>

      <h3>
        ${t("pnrLookupFor")}
        ${escapeHtml(pnr)}
      </h3>

      <p class="not-connected-text">
        ${t("pnrDemoOnlyText")}
      </p>

      <div class="not-connected-badge">
        ${t("noDataFabricated")}
      </div>

    </div>
  `;

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

  const delay =
    Number(data.delayMinutes || 0);


  const statusClass =
    delay > 0
      ? "delayed"
      : "ontime";


  const statusText =
    delay > 0
      ? t("runningLate", {
          min: Math.round(delay)
        })
      : t("onTime");


  resultsContainer.innerHTML = `

    <div class="result-card">

      ${renderHeader(
        data,
        statusClass,
        statusText
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


        <span
          class="confidence-badge
          ${data.confidence || "medium"}"
        >

          <span
            class="confidence-dot"
          ></span>

          ${t(confKey)}

        </span>

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


// ============================================================
// ETA PANEL
// ============================================================

function renderEtaPanel(data) {

  return `

    <div class="eta-panel">

      <div class="eta-main">

        <span class="eta-label">

          ${t("nextStationEta")}

        </span>


        <span class="eta-value">

          ${escapeHtml(
            data.nextEtaTime || "--"
          )}

        </span>


        <span class="eta-station">

          ${escapeHtml(
            data.nextStationName ||
            data.nextStation ||
            "--"
          )}

        </span>


        <div class="eta-platform-row">

          ${platformBadgeHtml(
            data.nextPlatform,
            data.nextPlatformConfidence,
            "lg"
          )}

        </div>


        <span class="eta-updated">

          ${t("updated")}

          ${escapeHtml(
            data.lastUpdated || "just now"
          )}

        </span>

      </div>


      <div class="eta-secondary">

        <span class="eta-label">

          ${t("destinationEta")}

        </span>


        <span
          class="eta-value"
          style="font-size:24px;"
        >

          ${escapeHtml(
            data.destinationEtaTime || "--"
          )}

        </span>


        <div class="eta-platform-row">

          ${platformBadgeHtml(
            data.destinationPlatform,
            data.destinationPlatformConfidence,
            ""
          )}

        </div>

      </div>


      <div class="eta-reason">

        <span class="icon">ℹ️</span>

        <span>

          ${escapeHtml(
            data.reason ||
            "Live ML prediction."
          )}

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


  const stops =
    data.stops.map((s) => `

      <div class="timeline-stop">

        <div
          class="stop-dot
          ${s.current
            ? "current"
            : (s.status || "ontime")}"
        ></div>


        <div class="stop-name">

          ${escapeHtml(
            s.name || ""
          )}

        </div>


        <div class="stop-times">

          Sched:
          ${escapeHtml(
            s.sched || "--"
          )}

          &middot;

          <span class="predicted">

            ${escapeHtml(
              s.predicted || "--"
            )}

          </span>

        </div>


        ${platformBadgeHtml(
          s.platform,
          s.platformConfidence,
          ""
        )}


        <div
          class="stop-delta
          ${s.status || "ontime"}"
        >

          ${escapeHtml(
            s.delta || ""
          )}

        </div>

      </div>

    `).join("");


  return `

    <div class="timeline-section">

      <div class="section-title">

        ${t("upcomingStations")}

      </div>


      <div class="timeline">

        ${stops}

      </div>

    </div>

  `;

}


// ============================================================
// ROUTE OVERVIEW
// ============================================================

function renderRouteOverview(data) {

  const total =
    Number(data.totalDistanceKm || 0);


  const covered =
    Number(data.coveredDistanceKm || 0);


  const pct =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (covered / total) * 100
          )
        )
      : 0;


  return `

    <div class="route-overview-section">

      <div class="section-title-row">

        <div class="section-title">

          ${t("routeOverview")}

        </div>


        <button
          class="show-map-btn"
          id="showMapBtn"
        >

          🗺️ ${t("showOnMap")}

        </button>

      </div>


      <div class="route-progress-track">

        <div
          class="route-progress-fill"
          style="width:${pct}%;"
        ></div>


        <div
          class="route-progress-marker"
          style="left:${pct}%;"
        >
          🚆
        </div>

      </div>


      <div class="route-progress-labels">

        <span>

          ${escapeHtml(
            data.origin || "Origin"
          )}

        </span>


        <span
          class="route-progress-pct"
        >

          ${covered} /
          ${total} km
          (${pct}%)

        </span>


        <span>

          ${escapeHtml(
            data.destination ||
            "Destination"
          )}

        </span>

      </div>

    </div>

  `;

}


// ============================================================
// ALERTS
// ============================================================

function renderAlerts(data) {

  if (
    !Array.isArray(data.alerts) ||
    data.alerts.length === 0
  ) {

    return "";

  }


  const items =
    data.alerts.map((a) => `

      <div class="alert-item">

        <span class="alert-icon">
          ⚠️
        </span>


        <div class="alert-text">

          <strong>

            ${escapeHtml(
              a.text || ""
            )}

          </strong>


          <span>

            ${escapeHtml(
              a.time || ""
            )}

          </span>

        </div>

      </div>

    `).join("");


  return `

    <div class="alerts-section">

      <div class="section-title">

        ${t("activeAlerts")}

      </div>

      ${items}

    </div>

  `;

}


// ============================================================
// BOTTOM GRID
// ============================================================

function renderBottomGrid(data) {

  const nextStation =
    data.nextStationName ||
    data.nextStation ||
    "-";


  return `

    <div class="bottom-grid">


      <div class="info-card">

        <div class="section-title">

          ${t("punctuality30")}

        </div>


        <div class="punctuality-bar-track">

          <div
            class="punctuality-bar-fill"
            style="
              width:
              ${Number(
                data.punctuality30d || 0
              )}%;
            "
          ></div>

        </div>


        <div class="punctuality-text">

          ${t(
            "punctualityText",
            {
              pct:
                Number(
                  data.punctuality30d || 0
                )
            }
          )}

        </div>

      </div>


      <div class="info-card">

        <div class="section-title">

          ${t("actions")}

        </div>


        <div class="action-buttons">

          <button
            class="action-btn primary"
            onclick="alert(
              '${t("setAlert")}: ${escapeHtml(
                nextStation
              )}'
            )"
          >

            🔔 ${t("setAlert")}

          </button>


          <button
            class="action-btn"
            onclick="alert(
              '${t("shareEta")} (demo)'
            )"
          >

            🔗 ${t("shareEta")}

          </button>

        </div>

      </div>

    </div>

  `;

}


// ============================================================
// MAP
// ============================================================

const INDIA_BOUNDARY_GEOJSON_URL =
  "https://raw.githubusercontent.com/datameet/maps/master/Country/india-soi.geojson";


mapModalClose.addEventListener(
  "click",
  closeMapModal
);


mapModalOverlay.addEventListener(
  "click",
  (e) => {

    if (
      e.target === mapModalOverlay
    ) {

      closeMapModal();

    }

  }
);


document.addEventListener(
  "keydown",
  (e) => {

    if (e.key === "Escape") {

      closeMapModal();
      closeHelpModal();

    }

  }
);


// ============================================================
// OPEN MAP
// ============================================================

function openMapModal(data) {

  mapModalSubtitle.textContent =
    `${data.number} · ${data.name}`;


  mapModalOverlay.classList.add("open");

  document.body.classList.add(
    "modal-open"
  );


  setTimeout(
    () => buildLeafletMap(data),
    50
  );

}


// ============================================================
// CLOSE MAP
// ============================================================

function closeMapModal() {

  mapModalOverlay.classList.remove(
    "open"
  );


  document.body.classList.remove(
    "modal-open"
  );


  if (leafletMapInstance) {

    leafletMapInstance.remove();

    leafletMapInstance = null;

    indiaBoundaryLayer = null;

  }

}


// ============================================================
// BUILD LEAFLET MAP
// ============================================================

function buildLeafletMap(data) {

  if (
    !Array.isArray(data.stops) ||
    data.stops.length === 0
  ) {

    document.getElementById(
      "leafletMap"
    ).innerHTML = `
      <p
        style="
          padding:30px;
          text-align:center;
          color:#888;
        "
      >
        Map data unavailable for this route.
      </p>
    `;

    return;

  }


  const points =
    data.stops
      .map((s) => ({
        ...s,
        latlng:
          STATION_LATLNG[s.name]
      }))
      .filter(
        (s) => s.latlng
      );


  if (points.length === 0) {

    document.getElementById(
      "leafletMap"
    ).innerHTML = `
      <p
        style="
          padding:30px;
          text-align:center;
          color:#888;
        "
      >
        Map data unavailable for this route.
      </p>
    `;

    return;

  }


  const currentIdx =
    points.findIndex(
      (p) => p.current
    );


  const splitIdx =
    currentIdx >= 0
      ? currentIdx
      : 0;


  const coveredCoords =
    points
      .slice(0, splitIdx + 1)
      .map(
        (p) => p.latlng
      );


  const remainingCoords =
    points
      .slice(splitIdx)
      .map(
        (p) => p.latlng
      );


  const currentPoint =
    points[splitIdx];


  if (leafletMapInstance) {

    leafletMapInstance.remove();

    leafletMapInstance = null;

    indiaBoundaryLayer = null;

  }


  leafletMapInstance =
    L.map(
      "leafletMap",
      {
        scrollWheelZoom: true
      }
    );


  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 12,

      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | India boundary: Survey of India (via DataMeet)'
    }
  ).addTo(
    leafletMapInstance
  );


  L.polyline(
    coveredCoords,
    {
      color: "#2E7D32",
      weight: 5,
      opacity: 0.9
    }
  ).addTo(
    leafletMapInstance
  );


  L.polyline(
    remainingCoords,
    {
      color: "#1565C0",
      weight: 4,
      opacity: 0.7,
      dashArray: "2 8"
    }
  ).addTo(
    leafletMapInstance
  );


  points.forEach(
    (p, i) => {

      const isCurrent =
        i === splitIdx;


      const isPassed =
        i < splitIdx;


      const color =
        isCurrent
          ? "#C41230"
          : (
              isPassed
                ? "#2E7D32"
                : "#1565C0"
            );


      const platformText =
        p.platform
          ? ` (PF ${p.platform})`
          : "";


      L.circleMarker(
        p.latlng,
        {
          radius:
            isCurrent
              ? 8
              : 6,

          color,

          fillColor: color,

          fillOpacity: 0.9,

          weight: 2
        }
      )
        .addTo(
          leafletMapInstance
        )
        .bindPopup(
          `<strong>
            ${escapeHtml(p.name)}
          </strong>
          ${platformText}
          <br>
          ${escapeHtml(
            p.sched || "--"
          )}
          →
          ${escapeHtml(
            p.predicted || "--"
          )}`
        );

    }
  );


  const blinkIcon =
    L.divIcon({
      className:
        "leaflet-blink-icon",

      html:
        `<div class="blink-dot"></div>`,

      iconSize: [22, 22]
    });


  L.marker(
    currentPoint.latlng,
    {
      icon: blinkIcon
    }
  ).addTo(
    leafletMapInstance
  );


  const bounds =
    L.latLngBounds(
      points.map(
        (p) => p.latlng
      )
    );


  leafletMapInstance.fitBounds(
    bounds,
    {
      padding: [30, 30]
    }
  );


  loadIndiaBoundaryOverlay();

}


// ============================================================
// INDIA BOUNDARY
// ============================================================

function loadIndiaBoundaryOverlay() {

  if (
    indiaBoundaryGeoJsonCache
  ) {

    drawIndiaBoundary(
      indiaBoundaryGeoJsonCache
    );

    return;

  }


  fetch(
    INDIA_BOUNDARY_GEOJSON_URL
  )

    .then((res) => {

      if (!res.ok) {

        throw new Error(
          "Boundary fetch failed: " +
          res.status
        );

      }


      return res.json();

    })

    .then((geojson) => {

      indiaBoundaryGeoJsonCache =
        geojson;


      drawIndiaBoundary(
        geojson
      );

    })

    .catch((err) => {

      console.warn(
        "Could not load India boundary:",
        err
      );

    });

}


function drawIndiaBoundary(
  geojson
) {

  if (!leafletMapInstance) {
    return;
  }


  if (indiaBoundaryLayer) {

    leafletMapInstance.removeLayer(
      indiaBoundaryLayer
    );

  }


  indiaBoundaryLayer =
    L.geoJSON(
      geojson,
      {
        style: {
          color: "#003366",
          weight: 2.5,
          opacity: 0.9,
          fill: false
        }
      }
    ).addTo(
      leafletMapInstance
    );

}


// ============================================================
// UTILITY
// ============================================================

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