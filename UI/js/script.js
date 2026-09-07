// ============================================
// GATIDRISHTI — FRONTEND LOGIC
//
// MAP BOUNDARY FIX (this version):
// Default OpenStreetMap tiles render India's northern/eastern borders
// per international/UN convention, which shows Jammu & Kashmir and
// parts of the Northeast incorrectly for an Indian platform. This is
// a known, widely-documented issue (see OSM Wiki "India/Rendering
// server" and multiple Leaflet GitHub issues). Fix applied below:
// we keep the OSM base tiles (roads/terrain/cities are fine) but draw
// India's correct outline ON TOP using the Survey-of-India-derived
// boundary dataset published by the DataMeet open-data community
// (github.com/datameet/maps, india-soi.geojson — sourced from
// Survey of India's official shapefiles). This overlay is fetched
// live from GitHub's raw file host, so it needs an internet
// connection at runtime (same requirement the map tiles already have).
// If the fetch fails, the map still works normally, just without the
// extra correct-boundary line drawn on top.
//
// IMPORTANT: No fake/dummy PNR or schedule data is invented. The
// DUMMY_TRAINS entries are prototype-only ETA demo data.
// ============================================

const searchForm = document.getElementById("searchForm");
const trainInput = document.getElementById("trainInput");
const pnrForm = document.getElementById("pnrForm");
const pnrInput = document.getElementById("pnrInput");
const scheduleForm = document.getElementById("scheduleForm");
const scheduleInput = document.getElementById("scheduleInput");
const chips = document.querySelectorAll(".chip[data-train]");
const myTrainsChip = document.getElementById("myTrainsChip");
const recentChip = document.getElementById("recentChip");
const resultsContainer = document.getElementById("resultsContainer");
const mapModalOverlay = document.getElementById("mapModalOverlay");
const mapModalClose = document.getElementById("mapModalClose");
const mapModalSubtitle = document.getElementById("mapModalSubtitle");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const lookupTabs = document.querySelectorAll(".lookup-tab");
const lookupPanels = document.querySelectorAll(".lookup-panel");
const etaChipsRow = document.getElementById("etaChipsRow");
const pnrNavLink = document.getElementById("pnrNavLink");
const scheduleNavLink = document.getElementById("scheduleNavLink");

let currentResultData = null;
let leafletMapInstance = null;
let indiaBoundaryLayer = null;
let indiaBoundaryGeoJsonCache = null;

// ---------- STATION COORDINATES (REAL approx lat/long) ----------
const STATION_LATLNG = {
  "Mumbai Central (MMCT)": [18.9696, 72.8194],
  "Surat": [21.1959, 72.8302],
  "Vadodara Jn": [22.3072, 73.1812],
  "Vadodara Jn (BRC)": [22.3072, 73.1812],
  "Ratlam Jn": [23.3315, 75.0367],
  "Kota Jn": [25.1804, 75.8648],
  "New Delhi": [28.6431, 77.2197],
  "New Delhi (NDLS)": [28.6431, 77.2197],
  "Howrah (HWH)": [22.5839, 88.3428],
  "Asansol Jn": [23.6739, 86.9524],
  "Dhanbad Jn": [23.7957, 86.4304],
  "Dhanbad Jn (DHN)": [23.7957, 86.4304],
  "Gaya Jn": [24.7955, 84.9994],
  "Mughalsarai": [25.2802, 83.1187],
  "Sealdah (SDAH)": [22.5675, 88.3708],
  "Allahabad Jn": [25.4484, 81.8397],
  "Kanpur Central": [26.4499, 80.3319],
  "Kanpur Central (CNB)": [26.4499, 80.3319],
  "Tundla Jn": [27.2226, 78.2379]
};

// ---------- ETA DEMO DATA ----------
const DUMMY_TRAINS = {
  "12951": {
    number: "12951",
    name: "Mumbai Rajdhani Express",
    origin: "Mumbai Central (MMCT)",
    destination: "New Delhi (NDLS)",
    route: "Mumbai Central (MMCT) → New Delhi (NDLS)",
    delayMinutes: 18,
    confidence: "high",
    nextStation: "Vadodara Jn (BRC)",
    nextEtaTime: "14:32",
    nextPlatform: "3",
    nextPlatformConfidence: "confirmed",
    destinationEtaTime: "08:35 (+1 day)",
    destinationPlatform: "1",
    destinationPlatformConfidence: "confirmed",
    lastUpdated: "2 min ago",
    reason: "Running late due to congestion near Surat; recovered 6 min after last halt.",
    punctuality30d: 71,
    totalDistanceKm: 1384,
    coveredDistanceKm: 490,
    stops: [
      { name: "Mumbai Central (MMCT)", sched: "16:00", predicted: "16:00", status: "ontime", delta: "Origin", passed: true, platform: "1", platformConfidence: "confirmed" },
      { name: "Surat", sched: "12:48", predicted: "13:04", status: "delay", delta: "+16 min", passed: true, platform: "2", platformConfidence: "confirmed" },
      { name: "Vadodara Jn", sched: "14:14", predicted: "14:32", status: "delay", delta: "+18 min", current: true, platform: "3", platformConfidence: "confirmed" },
      { name: "Ratlam Jn", sched: "16:42", predicted: "16:55", status: "delay", delta: "+13 min", platform: "1", platformConfidence: "expected" },
      { name: "Kota Jn", sched: "19:50", predicted: "19:58", status: "ontime", delta: "+8 min", platform: "4", platformConfidence: "expected" },
      { name: "New Delhi", sched: "08:35", predicted: "08:35", status: "ontime", delta: "On time", platform: "1", platformConfidence: "confirmed" }
    ],
    alerts: [
      { text: "Temporary speed restriction (30 km/h) between Surat–Vadodara due to track maintenance.", time: "Active until 15:00" },
      { text: "Moderate congestion reported ahead near Ratlam Jn.", time: "Updated 5 min ago" }
    ]
  },
  "12301": {
    number: "12301",
    name: "Howrah Rajdhani Express",
    origin: "Howrah (HWH)",
    destination: "New Delhi (NDLS)",
    route: "Howrah (HWH) → New Delhi (NDLS)",
    delayMinutes: 0,
    confidence: "high",
    nextStation: "Dhanbad Jn (DHN)",
    nextEtaTime: "18:47",
    nextPlatform: "2",
    nextPlatformConfidence: "confirmed",
    destinationEtaTime: "10:00 (+1 day)",
    destinationPlatform: "1",
    destinationPlatformConfidence: "confirmed",
    lastUpdated: "1 min ago",
    reason: "Running on schedule. No active restrictions on this section.",
    punctuality30d: 88,
    totalDistanceKm: 1447,
    coveredDistanceKm: 165,
    stops: [
      { name: "Howrah (HWH)", sched: "16:55", predicted: "16:55", status: "ontime", delta: "Origin", passed: true, platform: "9", platformConfidence: "confirmed" },
      { name: "Asansol Jn", sched: "17:35", predicted: "17:35", status: "ontime", delta: "On time", passed: true, platform: "3", platformConfidence: "confirmed" },
      { name: "Dhanbad Jn", sched: "18:47", predicted: "18:47", status: "ontime", delta: "On time", current: true, platform: "2", platformConfidence: "confirmed" },
      { name: "Gaya Jn", sched: "21:08", predicted: "21:10", status: "ontime", delta: "+2 min", platform: "1", platformConfidence: "expected" },
      { name: "Mughalsarai", sched: "23:35", predicted: "23:40", status: "ontime", delta: "+5 min", platform: "5", platformConfidence: "expected" },
      { name: "New Delhi", sched: "10:00", predicted: "10:00", status: "ontime", delta: "On time", platform: "1", platformConfidence: "confirmed" }
    ],
    alerts: [
      { text: "No active alerts on this route currently.", time: "Checked just now" }
    ]
  },
  "12259": {
    number: "12259",
    name: "Sealdah Duronto Express",
    origin: "Sealdah (SDAH)",
    destination: "New Delhi (NDLS)",
    route: "Sealdah (SDAH) → New Delhi (NDLS)",
    delayMinutes: 42,
    confidence: "medium",
    nextStation: "Kanpur Central (CNB)",
    nextEtaTime: "05:58",
    nextPlatform: "5",
    nextPlatformConfidence: "expected",
    destinationEtaTime: "11:20",
    destinationPlatform: "2",
    destinationPlatformConfidence: "expected",
    lastUpdated: "4 min ago",
    reason: "Delay accumulated due to a preceding freight movement and one unscheduled signal halt near Allahabad.",
    punctuality30d: 54,
    totalDistanceKm: 1450,
    coveredDistanceKm: 780,
    stops: [
      { name: "Sealdah (SDAH)", sched: "23:55", predicted: "23:55", status: "ontime", delta: "Origin", passed: true, platform: "8", platformConfidence: "confirmed" },
      { name: "Allahabad Jn", sched: "02:20", predicted: "02:58", status: "severe", delta: "+38 min", passed: true, platform: "6", platformConfidence: "confirmed" },
      { name: "Kanpur Central", sched: "05:16", predicted: "05:58", status: "severe", delta: "+42 min", current: true, platform: "5", platformConfidence: "expected" },
      { name: "Tundla Jn", sched: "08:05", predicted: "08:40", status: "delay", delta: "+35 min", platform: "2", platformConfidence: "expected" },
      { name: "New Delhi", sched: "10:40", predicted: "11:20", status: "delay", delta: "+40 min", platform: "2", platformConfidence: "expected" }
    ],
    alerts: [
      { text: "Unscheduled signal halt recorded near Allahabad Jn.", time: "Occurred 45 min ago" },
      { text: "Preceding freight train causing minor congestion till Kanpur.", time: "Updated 10 min ago" }
    ]
  }
};

// ---------- TAB SWITCHING (ETA / PNR / Schedule) ----------

lookupTabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.getAttribute("data-tab")));
});

pnrNavLink.addEventListener("click", (e) => { e.preventDefault(); activateTab("pnr"); scrollToHero(); });
scheduleNavLink.addEventListener("click", (e) => { e.preventDefault(); activateTab("schedule"); scrollToHero(); });

function scrollToHero() {
  document.querySelector(".hero-section").scrollIntoView({ behavior: "smooth" });
}

function activateTab(tabName) {
  lookupTabs.forEach((tab) => tab.classList.toggle("active", tab.getAttribute("data-tab") === tabName));
  lookupPanels.forEach((panel) => panel.classList.toggle("active", panel.getAttribute("data-panel") === tabName));
  etaChipsRow.style.display = tabName === "eta" ? "flex" : "none";
  resultsContainer.innerHTML = getEmptyStateForTab(tabName);
}

function getEmptyStateForTab(tabName) {
  if (tabName === "pnr") {
    return `<div class="empty-state"><div class="empty-icon">🎫</div><p data-i18n="emptyStatePnr">${t("emptyStatePnr")}</p></div>`;
  }
  if (tabName === "schedule") {
    return `<div class="empty-state"><div class="empty-icon">🕒</div><p data-i18n="emptyStateSchedule">${t("emptyStateSchedule")}</p></div>`;
  }
  return `<div class="empty-state"><div class="empty-icon">🚉</div><p data-i18n="emptyState">${t("emptyState")}</p></div>`;
}

// ---------- ETA SEARCH ----------

searchForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const query = trainInput.value.trim();
  if (!query) { trainInput.focus(); return; }
  handleEtaSearch(query);
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const trainNo = chip.getAttribute("data-train");
    trainInput.value = trainNo;
    handleEtaSearch(trainNo);
  });
});

myTrainsChip.addEventListener("click", () => {
  console.log("My Trains — requires login/backend, not yet implemented.");
});
recentChip.addEventListener("click", () => {
  console.log("Recent Searches — requires localStorage/backend wiring, not yet implemented.");
});

function handleEtaSearch(query) {
  const key = query.trim();
  resultsContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">🚆</div><p>${t("fetching")} <strong>${escapeHtml(key)}</strong>...</p></div>`;
  setTimeout(() => {
    const data = fetchTrainData(key);
    if (!data) {
      currentResultData = null;
      renderNotFound(key);
      return;
    }
    currentResultData = data;
    renderResultCard(data);
  }, 500);
}

function fetchTrainData(query) {
  const normalized = query.trim().toLowerCase();
  return Object.values(DUMMY_TRAINS).find(
    (tr) => tr.number === normalized || tr.name.toLowerCase().includes(normalized)
  );
}

window.rerenderCurrentResult = function () {
  if (currentResultData) renderResultCard(currentResultData);
};

// ---------- PNR STATUS (UI SHELL ONLY — NO LIVE DATA CONNECTED) ----------

pnrForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const pnr = pnrInput.value.trim();
  if (!/^\d{10}$/.test(pnr)) {
    renderPnrValidationError();
    return;
  }
  renderPnrNotConnected(pnr);
});

function renderPnrValidationError() {
  resultsContainer.innerHTML = `
    <div class="empty-state warn">
      <div class="empty-icon">⚠️</div>
      <p>${t("pnrInvalid")}</p>
    </div>
  `;
}

function renderPnrNotConnected(pnr) {
  resultsContainer.innerHTML = `
    <div class="not-connected-card">
      <div class="not-connected-icon">🎫</div>
      <h3>${t("pnrLookupFor")} ${escapeHtml(pnr)}</h3>
      <p class="not-connected-text">${t("pnrNotConnectedText")}</p>
      <ul class="not-connected-list">
        <li>${t("pnrOption1")}</li>
        <li>${t("pnrOption2")}</li>
        <li>${t("pnrOption3")}</li>
      </ul>
      <div class="not-connected-badge">${t("noDataFabricated")}</div>
    </div>
  `;
}

// ---------- TRAIN SCHEDULE (UI SHELL ONLY — NO LIVE DATA CONNECTED) ----------

scheduleForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const query = scheduleInput.value.trim();
  if (!query) { scheduleInput.focus(); return; }
  renderScheduleNotConnected(query);
});

function renderScheduleNotConnected(query) {
  resultsContainer.innerHTML = `
    <div class="not-connected-card">
      <div class="not-connected-icon">🕒</div>
      <h3>${t("scheduleLookupFor")} "${escapeHtml(query)}"</h3>
      <p class="not-connected-text">${t("scheduleNotConnectedText")}</p>
      <ul class="not-connected-list">
        <li>${t("scheduleOption1")}</li>
        <li>${t("scheduleOption2")}</li>
      </ul>
      <div class="not-connected-badge">${t("noDataFabricated")}</div>
    </div>
  `;
}

// ---------- THEME TOGGLE ----------

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem("eta_theme", theme);
}

themeToggle.addEventListener("click", () => {
  const current = document.body.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

(function initTheme() {
  const saved = localStorage.getItem("eta_theme");
  applyTheme(saved === "dark" ? "dark" : "light");
})();

// ---------- RENDERING: ETA RESULT CARD ----------

function renderNotFound(query) {
  resultsContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">❓</div>
      <p>${t("notFound")} "<strong>${escapeHtml(query)}</strong>". ${t("notFoundHint")}</p>
    </div>
  `;
}

function renderResultCard(data) {
  const statusClass = data.delayMinutes > 0 ? "delayed" : "ontime";
  const statusText = data.delayMinutes > 0 ? t("runningLate", { min: data.delayMinutes }) : t("onTime");

  resultsContainer.innerHTML = `
    <div class="result-card">
      ${renderHeader(data, statusClass, statusText)}
      ${renderEtaPanel(data)}
      ${renderTimeline(data)}
      ${renderRouteOverview(data)}
      ${renderAlerts(data)}
    </div>
    ${renderBottomGrid(data)}
  `;

  const mapBtn = document.getElementById("showMapBtn");
  if (mapBtn) mapBtn.addEventListener("click", () => openMapModal(data));
}

function renderHeader(data, statusClass, statusText) {
  const confKey = data.confidence === "high" ? "confHigh" : data.confidence === "medium" ? "confMedium" : "confLow";
  return `
    <div class="result-header">
      <div>
        <div class="train-id">${data.number} · ${escapeHtml(data.name)}</div>
        <div class="train-route">${escapeHtml(data.route)}</div>
      </div>
      <div class="status-group">
        <span class="status-badge ${statusClass}">${statusText}</span>
        <span class="confidence-badge ${data.confidence}">
          <span class="confidence-dot"></span>
          ${t(confKey)}
        </span>
      </div>
    </div>
  `;
}

function platformBadgeHtml(platformNo, confidenceLevel, size) {
  if (!platformNo) return "";
  const isConfirmed = confidenceLevel === "confirmed";
  const cls = isConfirmed ? "platform-badge confirmed" : "platform-badge expected";
  const sizeCls = size === "lg" ? " platform-badge-lg" : "";
  const label = isConfirmed ? t("platformConfirmed") : t("platformExpected");
  return `
    <span class="${cls}${sizeCls}" title="${escapeHtml(label)}">
      <span class="platform-badge-icon">🛤️</span>
      <span class="platform-badge-text">${t("platformShort")} ${escapeHtml(platformNo)}</span>
      <span class="platform-badge-tag">${label}</span>
    </span>
  `;
}

function renderEtaPanel(data) {
  return `
    <div class="eta-panel">
      <div class="eta-main">
        <span class="eta-label">${t("nextStationEta")}</span>
        <span class="eta-value">${data.nextEtaTime}</span>
        <span class="eta-station">${escapeHtml(data.nextStation)}</span>
        <div class="eta-platform-row">${platformBadgeHtml(data.nextPlatform, data.nextPlatformConfidence, "lg")}</div>
        <span class="eta-updated">${t("updated")} ${data.lastUpdated}</span>
      </div>
      <div class="eta-secondary">
        <span class="eta-label">${t("destinationEta")}</span>
        <span class="eta-value" style="font-size:24px;">${data.destinationEtaTime}</span>
        <div class="eta-platform-row">${platformBadgeHtml(data.destinationPlatform, data.destinationPlatformConfidence, "")}</div>
      </div>
      <div class="eta-reason">
        <span class="icon">ℹ️</span>
        <span>${escapeHtml(data.reason)}</span>
      </div>
    </div>
  `;
}

function renderTimeline(data) {
  const stops = data.stops.map((s) => `
    <div class="timeline-stop">
      <div class="stop-dot ${s.current ? "current" : s.status}"></div>
      <div class="stop-name">${escapeHtml(s.name)}</div>
      <div class="stop-times">Sched: ${s.sched} &middot; <span class="predicted">${s.predicted}</span></div>
      ${platformBadgeHtml(s.platform, s.platformConfidence, "")}
      <div class="stop-delta ${s.status}">${escapeHtml(s.delta)}</div>
    </div>
  `).join("");

  return `
    <div class="timeline-section">
      <div class="section-title">${t("upcomingStations")}</div>
      <div class="timeline">${stops}</div>
    </div>
  `;
}

function renderRouteOverview(data) {
  const pct = data.totalDistanceKm ? Math.round((data.coveredDistanceKm / data.totalDistanceKm) * 100) : 0;
  return `
    <div class="route-overview-section">
      <div class="section-title-row">
        <div class="section-title">${t("routeOverview")}</div>
        <button class="show-map-btn" id="showMapBtn">🗺️ ${t("showOnMap")}</button>
      </div>
      <div class="route-progress-track">
        <div class="route-progress-fill" style="width:${pct}%;"></div>
        <div class="route-progress-marker" style="left:${pct}%;">🚆</div>
      </div>
      <div class="route-progress-labels">
        <span>${escapeHtml(data.origin || "Origin")}</span>
        <span class="route-progress-pct">${data.coveredDistanceKm} / ${data.totalDistanceKm} km (${pct}%)</span>
        <span>${escapeHtml(data.destination || "Destination")}</span>
      </div>
    </div>
  `;
}

function renderAlerts(data) {
  if (!data.alerts || data.alerts.length === 0) return "";
  const items = data.alerts.map((a) => `
    <div class="alert-item">
      <span class="alert-icon">⚠️</span>
      <div class="alert-text">
        <strong>${escapeHtml(a.text)}</strong>
        <span>${escapeHtml(a.time)}</span>
      </div>
    </div>
  `).join("");

  return `<div class="alerts-section"><div class="section-title">${t("activeAlerts")}</div>${items}</div>`;
}

function renderBottomGrid(data) {
  return `
    <div class="bottom-grid">
      <div class="info-card">
        <div class="section-title">${t("punctuality30")}</div>
        <div class="punctuality-bar-track">
          <div class="punctuality-bar-fill" style="width:${data.punctuality30d}%;"></div>
        </div>
        <div class="punctuality-text">${t("punctualityText", { pct: data.punctuality30d })}</div>
      </div>
      <div class="info-card">
        <div class="section-title">${t("actions")}</div>
        <div class="action-buttons">
          <button class="action-btn primary" onclick="alert('${t("setAlert")}: ${escapeHtml(data.nextStation)} · ${t("platformShort")} ${escapeHtml(data.nextPlatform || "-")}')">🔔 ${t("setAlert")}</button>
          <button class="action-btn" onclick="alert('${t("shareEta")} (demo)')">🔗 ${t("shareEta")}</button>
        </div>
      </div>
    </div>
  `;
}

// ---------- MAP MODAL (Leaflet.js — real India map, boundary-corrected) ----------

const INDIA_BOUNDARY_GEOJSON_URL = "https://raw.githubusercontent.com/datameet/maps/master/Country/india-soi.geojson";

mapModalClose.addEventListener("click", closeMapModal);
mapModalOverlay.addEventListener("click", (e) => { if (e.target === mapModalOverlay) closeMapModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMapModal(); });

function openMapModal(data) {
  mapModalSubtitle.textContent = `${data.number} · ${data.name}`;
  mapModalOverlay.classList.add("open");
  document.body.classList.add("modal-open");

  setTimeout(() => buildLeafletMap(data), 50);
}

function closeMapModal() {
  mapModalOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
  if (leafletMapInstance) {
    leafletMapInstance.remove();
    leafletMapInstance = null;
    indiaBoundaryLayer = null;
  }
}

function buildLeafletMap(data) {
  const points = data.stops
    .map((s) => ({ ...s, latlng: STATION_LATLNG[s.name] }))
    .filter((s) => s.latlng);

  if (points.length === 0) {
    document.getElementById("leafletMap").innerHTML =
      `<p style="padding:30px;text-align:center;color:#888;">Map data unavailable for this route.</p>`;
    return;
  }

  const currentIdx = points.findIndex((p) => p.current);
  const splitIdx = currentIdx >= 0 ? currentIdx : 0;

  const coveredCoords = points.slice(0, splitIdx + 1).map((p) => p.latlng);
  const remainingCoords = points.slice(splitIdx).map((p) => p.latlng);
  const currentPoint = points[splitIdx];

  if (leafletMapInstance) {
    leafletMapInstance.remove();
    leafletMapInstance = null;
    indiaBoundaryLayer = null;
  }

  leafletMapInstance = L.map("leafletMap", { scrollWheelZoom: true });

  // Base tiles: OpenStreetMap. Note — these render India's borders per
  // international convention (see comment block at top of file), which
  // is why we draw the corrected outline on top, below.
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 12,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | India boundary: Survey of India (via DataMeet)'
  }).addTo(leafletMapInstance);

  // Distance covered = green. Distance yet to be covered = blue.
  L.polyline(coveredCoords, { color: "#2E7D32", weight: 5, opacity: 0.9 }).addTo(leafletMapInstance);
  L.polyline(remainingCoords, { color: "#1565C0", weight: 4, opacity: 0.7, dashArray: "2 8" }).addTo(leafletMapInstance);

  points.forEach((p, i) => {
    const isCurrent = i === splitIdx;
    const isPassed = i < splitIdx;
    const color = isCurrent ? "#C41230" : (isPassed ? "#2E7D32" : "#1565C0");
    const platformText = p.platform ? ` (PF ${p.platform})` : "";

    L.circleMarker(p.latlng, {
      radius: isCurrent ? 8 : 6,
      color: color,
      fillColor: color,
      fillOpacity: 0.9,
      weight: 2
    })
      .addTo(leafletMapInstance)
      .bindPopup(`<strong>${escapeHtml(p.name)}</strong>${platformText}<br>${p.sched} → ${p.predicted}`);
  });

  const blinkIcon = L.divIcon({
    className: "leaflet-blink-icon",
    html: `<div class="blink-dot"></div>`,
    iconSize: [22, 22]
  });
  L.marker(currentPoint.latlng, { icon: blinkIcon }).addTo(leafletMapInstance);

  const bounds = L.latLngBounds(points.map((p) => p.latlng));
  leafletMapInstance.fitBounds(bounds, { padding: [30, 30] });

  // Draw India's correct outline (Survey of India boundary, via DataMeet)
  // on top of the base tiles, so J&K/Ladakh and the Northeast display
  // correctly regardless of the base tile's own border rendering.
  loadIndiaBoundaryOverlay();
}

function loadIndiaBoundaryOverlay() {
  if (indiaBoundaryGeoJsonCache) {
    drawIndiaBoundary(indiaBoundaryGeoJsonCache);
    return;
  }
  fetch(INDIA_BOUNDARY_GEOJSON_URL)
    .then((res) => {
      if (!res.ok) throw new Error("Boundary fetch failed: " + res.status);
      return res.json();
    })
    .then((geojson) => {
      indiaBoundaryGeoJsonCache = geojson;
      drawIndiaBoundary(geojson);
    })
    .catch((err) => {
      // Graceful degradation: map still works, just without the
      // corrected-boundary overlay line. Logged for debugging only.
      console.warn("Could not load corrected India boundary overlay (offline or GitHub unreachable):", err);
    });
}

function drawIndiaBoundary(geojson) {
  if (!leafletMapInstance) return;
  if (indiaBoundaryLayer) {
    leafletMapInstance.removeLayer(indiaBoundaryLayer);
  }
  indiaBoundaryLayer = L.geoJSON(geojson, {
    style: {
      color: "#003366",
      weight: 2.5,
      opacity: 0.9,
      fill: false
    }
  }).addTo(leafletMapInstance);
}

// ---------- UTILITIES ----------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

console.log("GatiDrishti frontend — corrected India boundary overlay, real Leaflet map, PNR/Schedule shells loaded.");
