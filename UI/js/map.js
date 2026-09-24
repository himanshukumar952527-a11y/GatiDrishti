


// ============================================================
// GATIDRISHTI  -  map.js   (MAP + TRAIN ANIMATION)
// ============================================================
//
// This file holds ONLY map code:
//   * map initialization (Leaflet), route/polyline, station markers
//   * current / next station markers, train marker + animation
//   * station coordinates and coordinate helpers
//   * map update + animation cleanup
//
// It uses ETA data and helpers from script.js (formatClock,
// normalizeStationCode, clockToMinutes, getStopCode, escapeHtml,
// data.nextEtaTime) and never calls other.js. Load order:
//
//   <script src="script.js"></script>
//   <script src="map.js"></script>
//   <script src="other.js"></script>
// ============================================================

// ---------- DOM ELEMENTS (MAP MODAL) ----------

const mapModalOverlay = document.getElementById("mapModalOverlay");
const mapModalClose = document.getElementById("mapModalClose");
const mapModalSubtitle = document.getElementById("mapModalSubtitle");


// ---------- GLOBAL STATE (MAP) ----------

let leafletMapInstance = null;
let indiaBoundaryLayer = null;
let indiaBoundaryGeoJsonCache = null;

// Holds every reusable Leaflet object + the single animation loop
// for the route map. null whenever the map modal is closed.
let trainMapState = null;

// Default view (roughly centre of India) used ONLY to give the
// Leaflet map a valid initial center/zoom before any vector layers
// (circle markers, polylines) are added to it. Leaflet does not
// fully initialize its internal pixel-origin state until the map
// has a defined view; adding CircleMarkers before that and then
// calling fitBounds() throws inside Leaflet itself
// ("Cannot read properties of undefined (reading 'intersects')")
// because _resetView tries to render markers that were attached
// to a view-less map. fitBounds() below immediately overrides this
// default view with the real route bounds once data is available.
const DEFAULT_MAP_CENTER = [22.9734, 78.6569];
const DEFAULT_MAP_ZOOM = 5;


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


// Fallback coordinates keyed by station CODE (approximate).
// Used ONLY when the stop / live route record has no lat/lng of its own.
// Matching by code is reliable; matching by display name is not.
const STATION_LATLNG_BY_CODE = {
  HWH:  [22.5839, 88.3428],
  ASN:  [23.6739, 86.9524],
  DHN:  [23.7957, 86.4304],
  GAYA: [24.7955, 84.9994],
  MGS:  [25.2802, 83.1187],
  DDU:  [25.2802, 83.1187],
  NDLS: [28.6431, 77.2197],
  NZM:  [28.5880, 77.2540],
  BCT:  [18.9696, 72.8194],
  BVI:  [19.2295, 72.8579],
  ST:   [21.2049, 72.8410],
  BRC:  [22.3106, 73.1810],
  RTM:  [23.3315, 75.0367],
  KOTA: [25.1826, 75.8523],
  ADI:  [23.0258, 72.6011],
  BPL:  [23.2666, 77.4125],
  NGP:  [21.1497, 79.0882],
  JHS:  [25.4484, 78.5685],
  AGC:  [27.1583, 77.9900],
  MTJ:  [27.4832, 77.6690],
  CNB:  [26.4540, 80.3510],
  PRYJ: [25.4460, 81.8250],
  BSB:  [25.3320, 82.9870],
  PNBE: [25.6040, 85.1380],
  LKO:  [26.8320, 80.9200],
  JP:   [26.9190, 75.7880]
};


// ============================================================
// MAP HELPERS  (coordinates / live route / actual times)
// ============================================================

const ACTUAL_ARRIVAL_KEYS =
  ["actualArrival", "actual_arrival", "act_arr"];

const ACTUAL_DEPARTURE_KEYS =
  ["actualDeparture", "actual_departure", "act_dep"];


// First usable clock time among `keys` of `record`, else "--".
// Only ACTUAL timestamps are read here; delayArrival /
// delayDeparture are delays, never timestamps.
function pickClock(record, keys) {

  if (!record || typeof record !== "object") {
    return "--";
  }

  for (const key of keys) {

    const value = record[key];

    if (value === null || value === undefined) {
      continue;
    }

    const text = formatClock(value);

    if (clockToMinutes(text) !== null) {
      return text;
    }

  }

  return "--";

}


function getRecordStationCode(record) {

  if (!record || typeof record !== "object") {
    return "";
  }

  return normalizeStationCode(
    record.stationCode ||
    record.station_code ||
    record.code
  );

}


// Live route may arrive as an array or wrapped in an object.
function extractLiveRouteRecords(route) {

  let list = [];

  if (Array.isArray(route)) {

    list = route;

  } else if (route && typeof route === "object") {

    for (const key of ["route", "stations", "stops", "data"]) {

      if (Array.isArray(route[key])) {
        list = route[key];
        break;
      }

    }

  }

  return list.filter(
    (record) => record && typeof record === "object"
  );

}


// Validated [lat, lng] or null.
function toValidLatLng(lat, lng) {

  if (
    lat === null || lat === undefined || lat === "" ||
    lng === null || lng === undefined || lng === ""
  ) {
    return null;
  }

  const la = Number(lat);
  const lo = Number(lng);

  if (!Number.isFinite(la) || !Number.isFinite(lo)) {
    return null;
  }

  if (Math.abs(la) > 90 || Math.abs(lo) > 180) {
    return null;
  }

  if (la === 0 && lo === 0) {
    return null;
  }

  return [la, lo];

}


// Reads coordinates from a stop / live record, whichever field
// names it happens to use.
function readLatLng(source) {

  if (!source || typeof source !== "object") {
    return null;
  }

  const pairs = [
    [source.latitude, source.longitude],
    [source.lat, source.lng],
    [source.lat, source.lon],
    [source.lat, source.long],
    [source.station_latitude, source.station_longitude]
  ];

  for (const [lat, lng] of pairs) {

    const found = toValidLatLng(lat, lng);

    if (found) {
      return found;
    }

  }

  if (Array.isArray(source.latlng) && source.latlng.length >= 2) {

    const found = toValidLatLng(source.latlng[0], source.latlng[1]);

    if (found) {
      return found;
    }

  }

  if (
    source.location &&
    typeof source.location === "object" &&
    source.location !== source
  ) {

    return toValidLatLng(
      source.location.latitude ?? source.location.lat,
      source.location.longitude ??
        source.location.lng ??
        source.location.lon
    );

  }

  return null;

}


// code -> live record. If a station appears twice, keep the record
// that carries more actual arrival/departure information.
function buildLiveRouteLookup(records) {

  const lookup = new Map();

  if (!Array.isArray(records)) {
    return lookup;
  }

  const score = (record) =>
    (pickClock(record, ACTUAL_ARRIVAL_KEYS) !== "--" ? 1 : 0) +
    (pickClock(record, ACTUAL_DEPARTURE_KEYS) !== "--" ? 1 : 0);

  records.forEach((record) => {

    const code = getRecordStationCode(record);

    if (!code) {
      return;
    }

    const existing = lookup.get(code);

    if (!existing || score(record) > score(existing)) {
      lookup.set(code, record);
    }

  });

  return lookup;

}


// Map-related fields of a train record (live route records from
// RailRadar, used for coordinates). Kept separate from `route`,
// which is the "A -> B" display string.
// Called by normalizeTrainData() in other.js.
function normalizeMapFields(data) {

  return {

    liveRoute:
      Array.isArray(data.liveRoute)
        ? data.liveRoute
        : []

  };

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


// Escape closes the map. (The help modal has its own Escape
// handler in other.js.)
document.addEventListener(
  "keydown",
  (e) => {

    if (e.key === "Escape") {

      closeMapModal();

    }

  }
);


// If the modal is shown/hidden via a CSS transition, Leaflet can
// measure the container's size before that transition finishes and
// lock in a stale (or zero) size. Re-measuring once the transition
// actually ends is the reliable fix; this is in addition to the
// immediate invalidateSize() calls in buildLeafletMap().
mapModalOverlay.addEventListener(
  "transitionend",
  (e) => {

    if (
      e.target === mapModalOverlay &&
      mapModalOverlay.classList.contains("open")
    ) {

      ensureMapSized();

    }

  }
);


// ============================================================
// OPEN MAP
// ============================================================

function openMapModal(data) {

  mapModalSubtitle.textContent =
    `${data.number} · ${data.name}`;


  mapModalOverlay.classList.add(
    "open"
  );

  document.body.classList.add(
    "modal-open"
  );


  setTimeout(
    () => {

      //The modal may have been closed again during the delay.
      if (
        mapModalOverlay.classList.contains(
          "open"
        )
      ) {

        buildLeafletMap(data);

      }
      

    },
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


  destroyTrainMap();

}


// Stops the animation, then removes the Leaflet map. Safe to call
// when no map exists.
function destroyTrainMap() {

  stopTrainAnimation();

  trainMapState = null;

  if (leafletMapInstance) {

    leafletMapInstance.remove();

    leafletMapInstance = null;

    indiaBoundaryLayer = null;

  }

}


// Re-measures the Leaflet container and asks Leaflet to recompute
// its internal size. Safe to call at any time, including when no
// map exists yet.
function ensureMapSized() {

  if (!leafletMapInstance) {
    return;
  }

  leafletMapInstance.invalidateSize();

}


// Called after a new prediction: if the map is open, move it to
// the new state instead of leaving it stale.
function refreshOpenMap(data) {

  if (
    !trainMapState ||
    !leafletMapInstance ||
    !mapModalOverlay.classList.contains("open")
  ) {
    return;
  }

  // The modal may have been resized/backgrounded since it was
  // opened; make sure Leaflet's cached size is still correct
  // before drawing the refreshed route on top of it.
  ensureMapSized();

  mapModalSubtitle.textContent =
    `${data.number} · ${data.name}`;

  updateTrainMap(data);

}


// ============================================================
// MAP HELPERS: COORDINATES / CURRENT+NEXT / PROGRESS
// ============================================================

const TRAIN_GLIDE_MS = 1800;
const TRAIN_PROGRESS_REFRESH_MS = 20000;


// Coordinates for a stop. Priority:
//   1. lat/lng on the stop itself
//   2. lat/lng on the matching live route record (by CODE)
//   3. fallback table by station CODE
//   4. legacy fallback table by station NAME
// Returns null when nothing is known (that stop is skipped).
function resolveStationLatLng(stop, code, liveLookup) {

  const direct = readLatLng(stop);

  if (direct) {
    return direct;
  }

  if (code && liveLookup && liveLookup.has(code)) {

    const live = readLatLng(liveLookup.get(code));

    if (live) {
      return live;
    }

  }

  return resolveCodeLatLng(code, stop && stop.name);

}


function resolveCodeLatLng(code, name) {

  if (
    code &&
    Object.prototype.hasOwnProperty.call(
      STATION_LATLNG_BY_CODE,
      code
    )
  ) {

    const found =
      toValidLatLng(
        STATION_LATLNG_BY_CODE[code][0],
        STATION_LATLNG_BY_CODE[code][1]
      );

    if (found) {
      return found;
    }

  }

  if (
    name &&
    Object.prototype.hasOwnProperty.call(
      STATION_LATLNG,
      name
    )
  ) {

    return toValidLatLng(
      STATION_LATLNG[name][0],
      STATION_LATLNG[name][1]
    );

  }

  return null;

}


// Single source of truth for CURRENT / NEXT on the map. Uses the
// same station CODEs as the timeline flags, so both always agree.
function getCurrentNextCodes(data) {

  const stops =
    Array.isArray(data.stops)
      ? data.stops
      : [];

  let currentCode =
    normalizeStationCode(data.currentStation);

  let nextCode =
    normalizeStationCode(data.nextStation);

  if (!currentCode) {

    const flagged =
      stops.find((s) => s && s.current === true);

    currentCode = getStopCode(flagged);

  }

  if (!nextCode) {

    const flagged =
      stops.find((s) => s && s.next === true);

    nextCode = getStopCode(flagged);

  }

  // A station cannot be both current and next.
  if (nextCode && nextCode === currentCode) {
    nextCode = "";
  }

  return { currentCode, nextCode };

}


// Current India Standard Time as fractional minutes since midnight.
function getIstNowMinutes() {

  try {

    const parts =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23"
        }
      ).formatToParts(new Date());

    const read = (type) => {
      const part = parts.find((p) => p.type === type);
      return Number(part ? part.value : NaN);
    };

    const hh = read("hour") % 24;
    const mm = read("minute");
    const ss = read("second");

    if ([hh, mm, ss].every(Number.isFinite)) {
      return hh * 60 + mm + ss / 60;
    }

  } catch (error) {
    // fall through to local time
  }

  const now = new Date();

  return (
    now.getHours() * 60 +
    now.getMinutes() +
    now.getSeconds() / 60
  );

}


// Fraction (0..1) of the current -> next leg the train has covered,
// estimated from data we ALREADY have (no extra API calls):
//   leg start = actual/expected departure from the current station
//   leg end   = predicted ETA at the next station
// Returns null when that cannot be worked out.
function computeTrainProgress(data) {

  const stops =
    Array.isArray(data.stops)
      ? data.stops
      : [];

  const { currentCode, nextCode } =
    getCurrentNextCodes(data);

  if (!currentCode || !nextCode) {
    return null;
  }

  const currentStop =
    stops.find((s) => getStopCode(s) === currentCode);

  const arrival = clockToMinutes(data.nextEtaTime);

  if (!currentStop || arrival === null) {
    return null;
  }

  let departure =
    clockToMinutes(
      pickClock(currentStop, ACTUAL_DEPARTURE_KEYS)
    );

  if (departure === null) {

    const scheduledDeparture =
      clockToMinutes(currentStop.sch_dep);

    if (scheduledDeparture === null) {
      return null;
    }

    // current delay = predicted final delay - predicted change
    const currentDelay =
      (
        typeof data.delayMinutes === "number" &&
        typeof data.predictedDelayChange === "number"
      )
        ? data.delayMinutes - data.predictedDelayChange
        : 0;

    departure =
      scheduledDeparture +
      (Number.isFinite(currentDelay) ? currentDelay : 0);

  }

  departure = ((departure % 1440) + 1440) % 1440;

  let end = arrival;

  while (end < departure) {
    end += 1440;
  }

  const span = end - departure;

  if (!(span > 0) || span > 1440) {
    return null;
  }

  // Pick the day offset that puts "now" closest to the leg.
  const nowBase = getIstNowMinutes();

  let bestNow = nowBase;
  let bestDistance = Infinity;

  [-1440, 0, 1440].forEach((offset) => {

    const candidate = nowBase + offset;

    const distance =
      candidate < departure
        ? departure - candidate
        : candidate > end
          ? candidate - end
          : 0;

    if (distance < bestDistance) {
      bestDistance = distance;
      bestNow = candidate;
    }

  });

  const raw = (bestNow - departure) / span;

  return Math.min(0.97, Math.max(0.03, raw));

}


// Position at `fraction` (0..1) along a polyline of [lat, lng].
function pointAlongPath(path, fraction) {

  if (!Array.isArray(path) || path.length === 0) {
    return null;
  }

  if (path.length === 1) {
    return path[0];
  }

  const f =
    Math.min(
      1,
      Math.max(0, Number.isFinite(fraction) ? fraction : 0)
    );

  const lengths = [];
  let total = 0;

  for (let i = 0; i < path.length - 1; i++) {

    const a = path[i];
    const b = path[i + 1];

    const dLat = b[0] - a[0];
    const dLng =
      (b[1] - a[1]) *
      Math.cos((((a[0] + b[0]) / 2) * Math.PI) / 180);

    const length = Math.hypot(dLat, dLng);

    lengths.push(length);
    total += length;

  }

  if (total === 0) {
    return path[0];
  }

  let remaining = f * total;

  for (let i = 0; i < lengths.length; i++) {

    if (remaining <= lengths[i] || i === lengths.length - 1) {

      const ratio =
        lengths[i] === 0
          ? 0
          : Math.min(1, remaining / lengths[i]);

      const a = path[i];
      const b = path[i + 1];

      return [
        a[0] + (b[0] - a[0]) * ratio,
        a[1] + (b[1] - a[1]) * ratio
      ];

    }

    remaining -= lengths[i];

  }

  return path[path.length - 1];

}


function easeInOutCubic(t) {

  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;

}


// ============================================================
// MAP MODEL  (pure: data -> what the map should show)
// ============================================================

function buildTrainMapModel(data) {

  const stops =
    Array.isArray(data.stops)
      ? data.stops.filter((s) => s && typeof s === "object")
      : [];

  const liveLookup =
    buildLiveRouteLookup(data.liveRoute);

  const { currentCode, nextCode } =
    getCurrentNextCodes(data);

  const status = data.journey_status || "";


  // Stops with usable coordinates, in route order. Stops without
  // coordinates and duplicate station records are skipped, so the
  // route never breaks on incomplete data.
  const points = [];
  const seen = new Set();

  stops.forEach((stop) => {

    const code = getStopCode(stop);

    if (code && seen.has(code)) {
      return;
    }

    const latlng =
      resolveStationLatLng(stop, code, liveLookup);

    if (!latlng) {
      return;
    }

    if (code) {
      seen.add(code);
    }

    points.push({
      code,
      name: stop.name || code || "--",
      latlng,
      stop
    });

  });


  const indexOfCode = (code) =>
    code
      ? points.findIndex((p) => p.code === code)
      : -1;

  const currentIdx = indexOfCode(currentCode);
  let nextIdx = indexOfCode(nextCode);

  if (nextIdx >= 0 && nextIdx === currentIdx) {
    nextIdx = -1;
  }


  // A current/next station that is not a scheduled stop (a
  // pass-through) can still be placed if its coordinates are known.
  const codeLatLng = (code, idx) =>
    idx >= 0
      ? points[idx].latlng
      : (
          code
            ? (
                readLatLng(liveLookup.get(code)) ||
                resolveCodeLatLng(code, "")
              )
            : null
        );

  const currentLL = codeLatLng(currentCode, currentIdx);
  const nextLL = codeLatLng(nextCode, nextIdx);


  // Covered / remaining route
  let covered = [];
  let remaining = [];

  if (status === "not_started") {

    remaining = points.slice();

  } else if (status === "completed") {

    covered = points.slice();

  } else if (currentIdx >= 0) {

    covered = points.slice(0, currentIdx + 1);

    remaining =
      nextIdx > currentIdx
        ? points.slice(nextIdx)
        : points.slice(currentIdx + 1);

  } else if (nextIdx >= 0) {

    covered = points.slice(0, nextIdx);
    remaining = points.slice(nextIdx);

  } else {

    remaining = points.slice();

  }


  // Leg the train is travelling on: current -> next.
  const isLive =
    status !== "not_started" &&
    status !== "completed";

  const path =
    isLive && currentLL && nextLL
      ? [currentLL, nextLL]
      : null;


  // Where the marker sits when it is not travelling a leg.
  let restLatLng = null;

  if (status === "not_started") {

    restLatLng =
      points.length > 0
        ? points[0].latlng
        : null;

  } else if (status === "completed") {

    restLatLng =
      currentLL ||
      (
        points.length > 0
          ? points[points.length - 1].latlng
          : null
      );

  } else if (currentLL) {

    restLatLng = currentLL;

  } else if (nextIdx > 0) {

    restLatLng = points[nextIdx - 1].latlng;

  } else if (nextLL) {

    restLatLng = nextLL;

  }


  const progress =
    path
      ? computeTrainProgress(data)
      : null;


  const signature =
    points
      .map((p) => `${p.code}:${p.latlng[0]},${p.latlng[1]}`)
      .join("|") +
    `#${currentLL || ""}#${nextLL || ""}`;


  return {
    points,
    status,
    currentCode,
    nextCode,
    currentIdx,
    nextIdx,
    currentLL,
    nextLL,
    currentName:
      data.currentStationName || currentCode,
    nextName:
      data.nextStationName || nextCode,
    covered: covered.map((p) => p.latlng),
    remaining: remaining.map((p) => p.latlng),
    path,
    restLatLng,
    targetProgress:
      progress === null
        ? 0
        : progress,
    signature
  };

}


// ============================================================
// MAP RENDERING
// ============================================================

function stationMarkerStyle(kind) {

  if (kind === "current") {

    return {
      radius: 10,
      color: "#FFFFFF",
      weight: 3,
      fillColor: "#C41230",
      fillOpacity: 1
    };

  }

  if (kind === "next") {

    return {
      radius: 9,
      color: "#1565C0",
      weight: 3,
      fillColor: "#FFB300",
      fillOpacity: 1
    };

  }

  if (kind === "passed") {

    return {
      radius: 6,
      color: "#2E7D32",
      weight: 2,
      fillColor: "#2E7D32",
      fillOpacity: 0.9
    };

  }

  return {
    radius: 6,
    color: "#1565C0",
    weight: 2,
    fillColor: "#1565C0",
    fillOpacity: 0.9
  };

}


function stationPopupHtml(name, code, stop, kind, etaText) {

  const tag =
    kind === "current"
      ? " · CURRENT"
      : kind === "next"
        ? " · NEXT"
        : "";

  const platformText =
    stop && stop.platform
      ? ` (PF ${escapeHtml(stop.platform)})`
      : "";

  const schedule =
    stop
      ? `Sch: ${escapeHtml(stop.sch_arr || "--")} / ${escapeHtml(stop.sch_dep || "--")}`
      : "";

  const actual =
    stop
      ? `Act: ${escapeHtml(pickClock(stop, ACTUAL_ARRIVAL_KEYS))} / ${escapeHtml(pickClock(stop, ACTUAL_DEPARTURE_KEYS))}`
      : "";

  const eta =
    kind === "next"
      ? `ETA: <strong>${escapeHtml(etaText)}</strong>`
      : "";

  return [
    `<strong>${escapeHtml(name)}</strong>` +
      (code ? ` (${escapeHtml(code)})` : "") +
      platformText +
      escapeHtml(tag),
    schedule,
    actual,
    eta
  ]
    .filter(Boolean)
    .join("<br>");

}


function drawStationMarkers(model, data) {

  const state = trainMapState;

  state.stationLayer.clearLayers();

  const etaText =
    clockToMinutes(data.nextEtaTime) !== null
      ? formatClock(data.nextEtaTime)
      : "--";

  // Stations before this index have been passed.
  const passedBefore =
    model.status === "completed"
      ? model.points.length
      : model.currentIdx >= 0
        ? model.currentIdx
        : model.nextIdx >= 0
          ? model.nextIdx
          : 0;

  const addMarker = (latlng, kind, name, code, stop) => {

    const marker =
      L.circleMarker(latlng, stationMarkerStyle(kind))
        .bindPopup(
          stationPopupHtml(name, code, stop, kind, etaText)
        );

    if (kind === "current" || kind === "next") {

      marker.bindTooltip(
        kind === "current" ? "CURRENT" : "NEXT",
        {
          permanent: true,
          direction: "top",
          offset: [0, -10]
        }
      );

    }

    marker.addTo(state.stationLayer);

  };

  model.points.forEach((p, i) => {

    const kind =
      i === model.currentIdx
        ? "current"
        : i === model.nextIdx
          ? "next"
          : i < passedBefore
            ? "passed"
            : "upcoming";

    addMarker(p.latlng, kind, p.name, p.code, p.stop);

  });

  // Current / next that are not scheduled stops but have coordinates.
  if (model.currentIdx < 0 && model.currentLL) {

    addMarker(
      model.currentLL,
      "current",
      model.currentName || "Current station",
      model.currentCode,
      null
    );

  }

  if (model.nextIdx < 0 && model.nextLL) {

    addMarker(
      model.nextLL,
      "next",
      model.nextName || "Next station",
      model.nextCode,
      null
    );

  }

}


function trainPopupHtml(data, model) {

  const label =
    `${escapeHtml(data.number || "")} ${escapeHtml(data.name || "")}`.trim();

  if (model.status === "not_started") {
    return `<strong>${label}</strong><br>Train not started`;
  }

  if (model.status === "completed") {
    return `<strong>${label}</strong><br>Journey completed`;
  }

  const from = model.currentName || model.currentCode || "--";
  const to = model.nextName || model.nextCode || "--";

  return (
    `<strong>${label}</strong><br>` +
    `${escapeHtml(from)} → ${escapeHtml(to)}`
  );

}


// Draws covered (solid green) and remaining (dashed blue) route,
// split at the train's current display position.
function updateTrainLines(position) {

  const state = trainMapState;

  if (!state || !state.model) {
    return;
  }

  const model = state.model;

  state.coveredLine.setLatLngs(
    position
      ? model.covered.concat([position])
      : model.covered
  );

  state.remainingLine.setLatLngs(
    position
      ? [position].concat(model.remaining)
      : model.remaining
  );

}


function setTrainDisplay(state, position) {

  if (trainMapState !== state || !position) {
    return;
  }

  state.displayed = position;

  if (state.trainMarker) {
    state.trainMarker.setLatLng(position);
  }

  updateTrainLines(position);

}


// Cancels the single animation frame loop and refresh timer.
function stopTrainAnimation() {

  const state = trainMapState;

  if (!state) {
    return;
  }

  if (state.rafId !== null) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }

  if (state.refreshTimer !== null) {
    clearInterval(state.refreshTimer);
    state.refreshTimer = null;
  }

}


// Smoothly moves the marker from wherever it is now to `target`.
// Any glide already in progress is cancelled first, so there is
// never more than one animation loop.
function glideTrainTo(target, duration) {

  const state = trainMapState;

  if (!state || !target) {
    return;
  }

  if (state.rafId !== null) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }

  const from = state.displayed || target;

  const reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const distance =
    Math.abs(target[0] - from[0]) +
    Math.abs(target[1] - from[1]);

  if (reduceMotion || duration <= 0 || distance < 1e-7) {
    setTrainDisplay(state, target);
    return;
  }

  const startedAt = performance.now();

  const step = (now) => {

    // Map closed or replaced while animating.
    if (trainMapState !== state) {
      return;
    }

    const t = Math.min(1, (now - startedAt) / duration);
    const e = easeInOutCubic(t);

    setTrainDisplay(
      state,
      [
        from[0] + (target[0] - from[0]) * e,
        from[1] + (target[1] - from[1]) * e
      ]
    );

    state.rafId =
      t < 1
        ? requestAnimationFrame(step)
        : null;

  };

  state.rafId = requestAnimationFrame(step);

}


// Re-estimates progress from the data already on the page and
// glides to it. No network requests.
function refreshTrainProgress() {

  const state = trainMapState;

  if (!state || !state.model || !state.model.path) {
    return;
  }

  const progress = computeTrainProgress(state.data);

  if (progress === null) {
    return;
  }

  state.model.targetProgress = progress;

  glideTrainTo(
    pointAlongPath(state.model.path, progress),
    TRAIN_GLIDE_MS
  );

}


// Places / moves the train marker for the given model.
function startTrainAnimation(model, data) {

  const state = trainMapState;

  if (!state) {
    return;
  }

  // Clean up any earlier loop/timer before starting again.
  stopTrainAnimation();

  const target =
    model.path
      ? pointAlongPath(model.path, model.targetProgress)
      : model.restLatLng;

  // Nothing known about where the train is: show the route only.
  if (!target) {

    if (state.trainMarker) {
      state.map.removeLayer(state.trainMarker);
      state.trainMarker = null;
    }

    state.displayed = null;

    updateTrainLines(null);

    return;

  }

  // First placement: start at the current station (or the rest
  // position) and then glide toward the estimated position.
  if (!state.displayed) {

    state.displayed =
      model.path
        ? model.path[0]
        : target;

  }

  if (!state.trainMarker) {

    state.trainMarker =
      L.marker(
        state.displayed,
        {
          icon:
            L.divIcon({
              className: "leaflet-blink-icon",
              html: `<div class="blink-dot"></div>`,
              iconSize: [22, 22]
            }),
          zIndexOffset: 1000,
          keyboard: false
        }
      )
        .bindPopup(trainPopupHtml(data, model))
        .addTo(state.map);

  } else {

    state.trainMarker.setPopupContent(
      trainPopupHtml(data, model)
    );

  }

  updateTrainLines(state.displayed);

  glideTrainTo(target, TRAIN_GLIDE_MS);

  // Only a train that is on a current -> next leg keeps updating.
  if (model.path) {

    state.refreshTimer =
      setInterval(
        refreshTrainProgress,
        TRAIN_PROGRESS_REFRESH_MS
      );

  }

}


// Applies a model to the existing map: reuses the map, polylines
// and train marker; only the station markers are redrawn.
function applyTrainMapModel(model, data) {

  const state = trainMapState;

  if (!state) {
    return;
  }

  const signatureChanged =
    state.signature !== model.signature;

  state.model = model;
  state.data = data;
  state.signature = model.signature;

  drawStationMarkers(model, data);

  if (signatureChanged) {

    const boundsPoints =
      model.points.map((p) => p.latlng);

    if (model.currentLL) {
      boundsPoints.push(model.currentLL);
    }

    if (model.nextLL) {
      boundsPoints.push(model.nextLL);
    }

    if (boundsPoints.length > 0) {

      state.map.invalidateSize();

      state.map.fitBounds(
        L.latLngBounds(boundsPoints),
        {
          padding: [30, 30],
          maxZoom: 9
        }
      );

    }

  }

  startTrainAnimation(model, data);

}


// Update an existing map in place.
function updateTrainMap(data) {

  if (!trainMapState || !leafletMapInstance) {
    return false;
  }

  const model = buildTrainMapModel(data);

  if (model.points.length === 0 && !model.currentLL && !model.nextLL) {

    // Nothing drawable any more.
    destroyTrainMap();

    const container =
      document.getElementById("leafletMap");

    if (container) {
      container.innerHTML = mapUnavailableHtml();
    }

    return false;

  }

  applyTrainMapModel(model, data);

  return true;

}


function mapUnavailableHtml() {

  return `
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

}


// ============================================================
// BUILD LEAFLET MAP
// ============================================================

function buildLeafletMap(data) {

  const container =
    document.getElementById("leafletMap");

  if (!container || !data) {
    return;
  }

  // Map already exists: update it, never create a second one.
  if (leafletMapInstance && trainMapState) {

    updateTrainMap(data);

    return;

  }

  // Stale instance without state (should not happen): clean it.
  destroyTrainMap();

  const model = buildTrainMapModel(data);

  if (
    model.points.length === 0 &&
    !model.currentLL &&
    !model.nextLL
  ) {

    container.innerHTML = mapUnavailableHtml();

    return;

  }

  container.innerHTML = "";

  leafletMapInstance =
    L.map(
      "leafletMap",
      {
        scrollWheelZoom: true
      }
    );

  // CRITICAL: give the map a real center/zoom BEFORE any vector
  // layer (circle markers, polylines) is added to it. Without this,
  // Leaflet has no _pixelOrigin yet; drawStationMarkers() below adds
  // CircleMarkers, and the fitBounds() call further down then
  // throws "Cannot read properties of undefined (reading
  // 'intersects')" deep inside Leaflet while trying to render them,
  // aborting the whole draw before the route/train marker ever
  // appear. fitBounds() still runs right after and immediately
  // replaces this default view with the real route bounds.
  leafletMapInstance.setView(
    DEFAULT_MAP_CENTER,
    DEFAULT_MAP_ZOOM
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

  // The modal's open transition may still be running when this
  // runs (see openMapModal's 50ms delay); re-measure on the next
  // paint and once more shortly after as a safety net. The
  // transitionend listener above covers slower transitions.
  requestAnimationFrame(ensureMapSized);
  setTimeout(ensureMapSized, 300);
 
  trainMapState = { 
 
    map: leafletMapInstance, 
 
    stationLayer: 
      L.layerGroup().addTo(leafletMapInstance), 
 
    coveredLine: 
      L.polyline( 
        [], 
        { 
          color: "#2E7D32", 
          weight: 5, 
          opacity: 0.9 
        } 
      ).addTo(leafletMapInstance), 
 
    remainingLine: 
      L.polyline( 
        [], 
        { 
          color: "#1565C0", 
          weight: 4, 
          opacity: 0.7, 
          dashArray: "2 8" 
        } 
      ).addTo(leafletMapInstance), 
 
    trainMarker: null, 
    displayed: null, 
    model: null, 
    data: null, 
    signature: "", 
    rafId: null, 
    refreshTimer: null 
 
  }; 
 
  applyTrainMapModel(model, data); 
 
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