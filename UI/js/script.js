// ============================================
// GATIDRISHTI — FRONTEND LOGIC
//
// This version adds:
// 1. Two more demo trains: 22503/22504 Vivek Express (Dibrugarh-Kanniyakumari)
//    and 12521/12522 Raptisagar Express (Barauni-Ernakulam). Route/timing/
//    distance/platform values are based on publicly published timetables
//    (Wikipedia, erail.in, railroute.in, goibibo) for realism, but are still
//    DEMO data for this prototype, not a live feed.
// 2. Full Schedule + Coach Composition demo data for all 5 trains.
// 3. Five demo PNRs covering Confirmed / Waiting List / RAC / Cancelled.
// 4. Coach diagrams redrawn as SVG train-car shapes (rounded ends, windows,
//    wheels) instead of plain rectangles.
// 5. Clickable "Available trains" / "Try these PNRs" chips on every tab.
// 6. Help button now opens a real Help/FAQ modal (see helpModalOverlay).
//
// Header nav no longer links to PNR/Schedule/Coach — those are reached only
// via the hero tabs, per latest instructions.
// ============================================

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

let currentResultData = null;
let currentTab = "eta";
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
  "Tundla Jn": [27.2226, 78.2379],
  "Dibrugarh (DBRG)": [27.4728, 94.9120],
  "New Tinsukia (NTSK)": [27.4924, 95.3590],
  "Furkating Jn (FKG)": [26.3833, 94.4667],
  "New Bongaigaon (NBQ)": [26.4770, 90.5590],
  "New Jalpaiguri (NJP)": [26.6839, 88.4340],
  "Malda Town (MLDT)": [25.0180, 88.1420],
  "Kharagpur Jn (KGP)": [22.3460, 87.2320],
  "Kanniyakumari (CAPE)": [8.0883, 77.5385],
  "Barauni Jn (BJU)": [25.5610, 86.0230],
  "Samastipur Jn (SPJ)": [25.8580, 85.7810],
  "Muzaffarpur Jn (MFP)": [26.1225, 85.3906],
  "Hajipur Jn (HJP)": [25.6880, 85.2100],
  "Gorakhpur (GKP)": [26.7606, 83.3732],
  "Erode Jn (ED)": [11.3410, 77.7172],
  "Thrissur (TCR)": [10.5276, 76.2144],
  "Aluva (AWY)": [10.1075, 76.3516],
  "Ernakulam Jn (ERS)": [9.9816, 76.2999]
};

//line 88 to 202 has to be removed later.
// ---------- ETA DEMO DATA (5 trains) ----------
// const DUMMY_TRAINS = {
//   "12951": {
//     number: "12951", name: "Mumbai Rajdhani Express",
//     origin: "Mumbai Central (MMCT)", destination: "New Delhi (NDLS)",
//     route: "Mumbai Central (MMCT) → New Delhi (NDLS)",
//     delayMinutes: 18, confidence: "high",
//     nextStation: "Vadodara Jn (BRC)", nextEtaTime: "14:32", nextPlatform: "3", nextPlatformConfidence: "confirmed",
//     destinationEtaTime: "08:35 (+1 day)", destinationPlatform: "1", destinationPlatformConfidence: "confirmed",
//     lastUpdated: "2 min ago", reason: "Running late due to congestion near Surat; recovered 6 min after last halt.",
//     punctuality30d: 71, totalDistanceKm: 1384, coveredDistanceKm: 490,
//     stops: [
//       { name: "Mumbai Central (MMCT)", sched: "16:00", predicted: "16:00", status: "ontime", delta: "Origin", passed: true, platform: "1", platformConfidence: "confirmed" },
//       { name: "Surat", sched: "12:48", predicted: "13:04", status: "delay", delta: "+16 min", passed: true, platform: "2", platformConfidence: "confirmed" },
//       { name: "Vadodara Jn", sched: "14:14", predicted: "14:32", status: "delay", delta: "+18 min", current: true, platform: "3", platformConfidence: "confirmed" },
//       { name: "Ratlam Jn", sched: "16:42", predicted: "16:55", status: "delay", delta: "+13 min", platform: "1", platformConfidence: "expected" },
//       { name: "Kota Jn", sched: "19:50", predicted: "19:58", status: "ontime", delta: "+8 min", platform: "4", platformConfidence: "expected" },
//       { name: "New Delhi", sched: "08:35", predicted: "08:35", status: "ontime", delta: "On time", platform: "1", platformConfidence: "confirmed" }
//     ],
//     alerts: [
//       { text: "Temporary speed restriction (30 km/h) between Surat–Vadodara due to track maintenance.", time: "Active until 15:00" },
//       { text: "Moderate congestion reported ahead near Ratlam Jn.", time: "Updated 5 min ago" }
//     ]
//   },
//   "12301": {
//     number: "12301", name: "Howrah Rajdhani Express",
//     origin: "Howrah (HWH)", destination: "New Delhi (NDLS)",
//     route: "Howrah (HWH) → New Delhi (NDLS)",
//     delayMinutes: 0, confidence: "high",
//     nextStation: "Dhanbad Jn (DHN)", nextEtaTime: "18:47", nextPlatform: "2", nextPlatformConfidence: "confirmed",
//     destinationEtaTime: "10:00 (+1 day)", destinationPlatform: "1", destinationPlatformConfidence: "confirmed",
//     lastUpdated: "1 min ago", reason: "Running on schedule. No active restrictions on this section.",
//     punctuality30d: 88, totalDistanceKm: 1447, coveredDistanceKm: 165,
//     stops: [
//       { name: "Howrah (HWH)", sched: "16:55", predicted: "16:55", status: "ontime", delta: "Origin", passed: true, platform: "9", platformConfidence: "confirmed" },
//       { name: "Asansol Jn", sched: "17:35", predicted: "17:35", status: "ontime", delta: "On time", passed: true, platform: "3", platformConfidence: "confirmed" },
//       { name: "Dhanbad Jn", sched: "18:47", predicted: "18:47", status: "ontime", delta: "On time", current: true, platform: "2", platformConfidence: "confirmed" },
//       { name: "Gaya Jn", sched: "21:08", predicted: "21:10", status: "ontime", delta: "+2 min", platform: "1", platformConfidence: "expected" },
//       { name: "Mughalsarai", sched: "23:35", predicted: "23:40", status: "ontime", delta: "+5 min", platform: "5", platformConfidence: "expected" },
//       { name: "New Delhi", sched: "10:00", predicted: "10:00", status: "ontime", delta: "On time", platform: "1", platformConfidence: "confirmed" }
//     ],
//     alerts: [ { text: "No active alerts on this route currently.", time: "Checked just now" } ]
//   },
//   "12259": {
//     number: "12259", name: "Sealdah Duronto Express",
//     origin: "Sealdah (SDAH)", destination: "New Delhi (NDLS)",
//     route: "Sealdah (SDAH) → New Delhi (NDLS)",
//     delayMinutes: 42, confidence: "medium",
//     nextStation: "Kanpur Central (CNB)", nextEtaTime: "05:58", nextPlatform: "5", nextPlatformConfidence: "expected",
//     destinationEtaTime: "11:20", destinationPlatform: "2", destinationPlatformConfidence: "expected",
//     lastUpdated: "4 min ago", reason: "Delay accumulated due to a preceding freight movement and one unscheduled signal halt near Allahabad.",
//     punctuality30d: 54, totalDistanceKm: 1450, coveredDistanceKm: 780,
//     stops: [
//       { name: "Sealdah (SDAH)", sched: "23:55", predicted: "23:55", status: "ontime", delta: "Origin", passed: true, platform: "8", platformConfidence: "confirmed" },
//       { name: "Allahabad Jn", sched: "02:20", predicted: "02:58", status: "severe", delta: "+38 min", passed: true, platform: "6", platformConfidence: "confirmed" },
//       { name: "Kanpur Central", sched: "05:16", predicted: "05:58", status: "severe", delta: "+42 min", current: true, platform: "5", platformConfidence: "expected" },
//       { name: "Tundla Jn", sched: "08:05", predicted: "08:40", status: "delay", delta: "+35 min", platform: "2", platformConfidence: "expected" },
//       { name: "New Delhi", sched: "10:40", predicted: "11:20", status: "delay", delta: "+40 min", platform: "2", platformConfidence: "expected" }
//     ],
//     alerts: [
//       { text: "Unscheduled signal halt recorded near Allahabad Jn.", time: "Occurred 45 min ago" },
//       { text: "Preceding freight train causing minor congestion till Kanpur.", time: "Updated 10 min ago" }
//     ]
//   },
//   "22503": {
//     number: "22503", name: "Vivek Superfast Express (Dibrugarh–Kanniyakumari)",
//     origin: "Dibrugarh (DBRG)", destination: "Kanniyakumari (CAPE)",
//     route: "Dibrugarh (DBRG) → Kanniyakumari (CAPE) · India's longest-running train, ~4188 km",
//     delayMinutes: 65, confidence: "medium",
//     nextStation: "Malda Town (MLDT)", nextEtaTime: "20:45", nextPlatform: "3", nextPlatformConfidence: "expected",
//     destinationEtaTime: "22:50 (+3 days)", destinationPlatform: "1", destinationPlatformConfidence: "expected",
//     lastUpdated: "6 min ago", reason: "Delay building up gradually over a 4188 km, multi-day journey through 9 states; typical cumulative drift on this route.",
//     punctuality30d: 48, totalDistanceKm: 4188, coveredDistanceKm: 1250,
//     stops: [
//       { name: "Dibrugarh (DBRG)", sched: "19:00", predicted: "19:00", status: "ontime", delta: "Origin", passed: true, platform: "2", platformConfidence: "confirmed" },
//       { name: "New Tinsukia (NTSK)", sched: "19:50", predicted: "20:05", status: "delay", delta: "+15 min", passed: true, platform: "1", platformConfidence: "confirmed" },
//       { name: "Furkating Jn (FKG)", sched: "23:48", predicted: "00:20", status: "delay", delta: "+32 min", passed: true, platform: "3", platformConfidence: "confirmed" },
//       { name: "New Bongaigaon (NBQ)", sched: "10:10", predicted: "10:55", status: "delay", delta: "+45 min", passed: true, platform: "1", platformConfidence: "confirmed" },
//       { name: "New Jalpaiguri (NJP)", sched: "15:35", predicted: "16:25", status: "delay", delta: "+50 min", passed: true, platform: "6", platformConfidence: "confirmed" },
//       { name: "Malda Town (MLDT)", sched: "20:20", predicted: "20:45", status: "delay", delta: "+65 min", current: true, platform: "3", platformConfidence: "expected" },
//       { name: "Kharagpur Jn (KGP)", sched: "03:10", predicted: "04:10", status: "delay", delta: "+60 min", platform: "4", platformConfidence: "expected" },
//       { name: "Kanniyakumari (CAPE)", sched: "21:45", predicted: "22:50", status: "delay", delta: "+65 min", platform: "1", platformConfidence: "expected" }
//     ],
//     alerts: [
//       { text: "Cumulative minor delays across Assam–West Bengal sections due to multiple crossings on a single-line stretch.", time: "Ongoing" },
//       { text: "No major disruption reported; delay expected to stay stable through the remaining route.", time: "Updated 6 min ago" }
//     ]
//   },
//   "12521": {
//     number: "12521", name: "Raptisagar Express (Barauni–Ernakulam)",
//     origin: "Barauni Jn (BJU)", destination: "Ernakulam Jn (ERS)",
//     route: "Barauni Jn (BJU) → Ernakulam Jn (ERS) · North-Central to Deep South, ~3437 km",
//     delayMinutes: 25, confidence: "medium",
//     nextStation: "Gorakhpur (GKP)", nextEtaTime: "06:15", nextPlatform: "3", nextPlatformConfidence: "expected",
//     destinationEtaTime: "12:05 (+2 days)", destinationPlatform: "1", destinationPlatformConfidence: "expected",
//     lastUpdated: "3 min ago", reason: "Short delay picked up near Muzaffarpur due to platform congestion; being monitored on the Gorakhpur–Erode stretch.",
//     punctuality30d: 62, totalDistanceKm: 3437, coveredDistanceKm: 350,
//     stops: [
//       { name: "Barauni Jn (BJU)", sched: "SRC", predicted: "SRC", status: "ontime", delta: "Origin", passed: true, platform: "1", platformConfidence: "confirmed" },
//       { name: "Samastipur Jn (SPJ)", sched: "23:35", predicted: "23:40", status: "delay", delta: "+5 min", passed: true, platform: "2", platformConfidence: "confirmed" },
//       { name: "Muzaffarpur Jn (MFP)", sched: "00:35", predicted: "00:55", status: "delay", delta: "+20 min", passed: true, platform: "1", platformConfidence: "confirmed" },
//       { name: "Hajipur Jn (HJP)", sched: "01:30", predicted: "01:55", status: "delay", delta: "+25 min", passed: true, platform: "1", platformConfidence: "confirmed" },
//       { name: "Gorakhpur (GKP)", sched: "05:50", predicted: "06:15", status: "delay", delta: "+25 min", current: true, platform: "3", platformConfidence: "expected" },
//       { name: "Erode Jn (ED)", sched: "16:55", predicted: "17:20", status: "delay", delta: "+25 min", platform: "2", platformConfidence: "expected" },
//       { name: "Thrissur (TCR)", sched: "09:40", predicted: "10:05", status: "delay", delta: "+25 min", platform: "1", platformConfidence: "expected" },
//       { name: "Aluva (AWY)", sched: "11:10", predicted: "11:35", status: "delay", delta: "+25 min", platform: "1", platformConfidence: "expected" },
//       { name: "Ernakulam Jn (ERS)", sched: "11:40", predicted: "12:05", status: "delay", delta: "+25 min", platform: "1", platformConfidence: "expected" }
//     ],
//     alerts: [
//       { text: "Platform congestion caused a short hold near Muzaffarpur Jn.", time: "Occurred 2 hr ago" },
//       { text: "Delay expected to remain steady through Gorakhpur and onward.", time: "Updated 3 min ago" }
//     ]
//   }
// };

// ---------- FULL SCHEDULE DEMO DATA (station-wise timetable, all 5 trains) ----------
// Distances/times are based on published timetables for realism (see code
// comments in the data-source note rendered on the schedule card) but this
// remains DEMO data for the prototype, not a live-query API result.
const SCHEDULE_DATA = {
  "12951": {
    number: "12951", name: "Mumbai Rajdhani Express", runsOn: "Daily",
    stations: [
      { name: "Mumbai Central", code: "MMCT", arr: "—", dep: "16:00", day: 1, dist: 0, platform: "1" },
      { name: "Surat", code: "ST", arr: "12:48", dep: "13:04", day: 1, dist: 263, platform: "2" },
      { name: "Vadodara Jn", code: "BRC", arr: "14:14", dep: "14:19", day: 1, dist: 392, platform: "3" },
      { name: "Ratlam Jn", code: "RTM", arr: "16:42", dep: "16:47", day: 1, dist: 570, platform: "1" },
      { name: "Kota Jn", code: "KOTA", arr: "19:50", dep: "19:55", day: 1, dist: 713, platform: "4" },
      { name: "New Delhi", code: "NDLS", arr: "08:35", dep: "—", day: 2, dist: 1384, platform: "1" }
    ]
  },
  "12301": {
    number: "12301", name: "Howrah Rajdhani Express", runsOn: "Daily",
    stations: [
      { name: "Howrah Jn", code: "HWH", arr: "—", dep: "16:55", day: 1, dist: 0, platform: "9" },
      { name: "Asansol Jn", code: "ASN", arr: "17:35", dep: "17:40", day: 1, dist: 214, platform: "3" },
      { name: "Dhanbad Jn", code: "DHN", arr: "18:47", dep: "18:52", day: 1, dist: 262, platform: "2" },
      { name: "Gaya Jn", code: "GAYA", arr: "21:08", dep: "21:13", day: 1, dist: 462, platform: "1" },
      { name: "Mughalsarai Jn", code: "MGS", arr: "23:35", dep: "23:40", day: 1, dist: 587, platform: "5" },
      { name: "New Delhi", code: "NDLS", arr: "10:00", dep: "—", day: 2, dist: 1447, platform: "1" }
    ]
  },
  "12259": {
    number: "12259", name: "Sealdah Duronto Express", runsOn: "Daily",
    stations: [
      { name: "Sealdah", code: "SDAH", arr: "—", dep: "23:55", day: 1, dist: 0, platform: "8" },
      { name: "Allahabad Jn", code: "ALD", arr: "02:20", dep: "02:25", day: 2, dist: 720, platform: "6" },
      { name: "Kanpur Central", code: "CNB", arr: "05:16", dep: "05:21", day: 2, dist: 900, platform: "5" },
      { name: "Tundla Jn", code: "TDL", arr: "08:05", dep: "08:10", day: 2, dist: 1120, platform: "2" },
      { name: "New Delhi", code: "NDLS", arr: "10:40", dep: "—", day: 2, dist: 1450, platform: "2" }
    ]
  },
  "22503": {
    number: "22503", name: "Vivek Superfast Express", runsOn: "Daily",
    stations: [
      { name: "Dibrugarh", code: "DBRG", arr: "—", dep: "19:00", day: 1, dist: 0, platform: "2" },
      { name: "New Tinsukia Jn", code: "NTSK", arr: "19:50", dep: "20:00", day: 1, dist: 42, platform: "1" },
      { name: "Naharkatiya", code: "NHK", arr: "20:28", dep: "20:30", day: 1, dist: 67, platform: "1" },
      { name: "Furkating Jn", code: "FKG", arr: "23:48", dep: "23:50", day: 1, dist: 237, platform: "3" },
      { name: "New Bongaigaon", code: "NBQ", arr: "10:10", dep: "10:20", day: 2, dist: 765, platform: "1" },
      { name: "New Jalpaiguri", code: "NJP", arr: "15:35", dep: "15:45", day: 2, dist: 1017, platform: "6" },
      { name: "Malda Town", code: "MLDT", arr: "20:20", dep: "20:30", day: 2, dist: 1250, platform: "3" },
      { name: "Kharagpur Jn", code: "KGP", arr: "03:10", dep: "03:20", day: 3, dist: 1750, platform: "4" },
      { name: "Kanniyakumari", code: "CAPE", arr: "21:45", dep: "—", day: 4, dist: 4188, platform: "1" }
    ]
  },
  "12521": {
    number: "12521", name: "Raptisagar Express", runsOn: "Weekly (check specific day)",
    stations: [
      { name: "Barauni Jn", code: "BJU", arr: "—", dep: "SRC", day: 1, dist: 0, platform: "1" },
      { name: "Samastipur Jn", code: "SPJ", arr: "23:35", dep: "23:40", day: 1, dist: 51, platform: "2" },
      { name: "Muzaffarpur Jn", code: "MFP", arr: "00:35", dep: "00:40", day: 2, dist: 103, platform: "1" },
      { name: "Hajipur Jn", code: "HJP", arr: "01:30", dep: "01:35", day: 2, dist: 157, platform: "1" },
      { name: "Gorakhpur", code: "GKP", arr: "05:50", dep: "06:00", day: 2, dist: 350, platform: "3" },
      { name: "Erode Jn", code: "ED", arr: "16:55", dep: "17:05", day: 3, dist: 3130, platform: "2" },
      { name: "Thrissur", code: "TCR", arr: "09:40", dep: "09:42", day: 3, dist: 3350, platform: "1" },
      { name: "Aluva", code: "AWY", arr: "11:10", dep: "11:12", day: 3, dist: 3400, platform: "1" },
      { name: "Ernakulam Jn", code: "ERS", arr: "11:40", dep: "—", day: 3, dist: 3437, platform: "1" }
    ]
  }
};

// ---------- COACH COMPOSITION DEMO DATA (all 5 trains) ----------
const COACH_COMPOSITION = {
  "12951": [
    ["ENG","loco"],["PWR","power"],["H1","ac1"],["A1","ac2"],["A2","ac2"],
    ["B1","ac3"],["B2","ac3"],["B3","ac3"],["PC","pantry"],["B4","ac3"],
    ["B5","ac3"],["B6","ac3"],["GRD","guard"]
  ],
  "12301": [
    ["ENG","loco"],["PWR","power"],["H1","ac1"],["A1","ac2"],["A2","ac2"],["A3","ac2"],
    ["B1","ac3"],["B2","ac3"],["B3","ac3"],["PC","pantry"],["B4","ac3"],
    ["B5","ac3"],["B6","ac3"],["B7","ac3"],["GRD","guard"]
  ],
  "12259": [
    ["ENG","loco"],["HCP","luggage"],["GN","general"],["GN","general"],
    ["S1","sleeper"],["S2","sleeper"],["S3","sleeper"],["S4","sleeper"],
    ["B1","ac3"],["B2","ac3"],["A1","ac2"],["PC","pantry"],
    ["S5","sleeper"],["GN","general"],["GN","general"],["GRD","guard"]
  ],
  "22503": [
    ["ENG","loco"],["HCP","luggage"],["GN","general"],["GN","general"],
    ["S1","sleeper"],["S2","sleeper"],["S3","sleeper"],["S4","sleeper"],["S5","sleeper"],
    ["B1","ac3"],["B2","ac3"],["A1","ac2"],["PC","pantry"],
    ["S6","sleeper"],["S7","sleeper"],["GN","general"],["GN","general"],["GRD","guard"]
  ],
  "12521": [
    ["ENG","loco"],["HCP","luggage"],["GN","general"],
    ["S1","sleeper"],["S2","sleeper"],["S3","sleeper"],["S4","sleeper"],
    ["B1","ac3"],["A1","ac2"],["PC","pantry"],
    ["S5","sleeper"],["S6","sleeper"],["GN","general"],["GRD","guard"]
  ]
};

const COACH_CLASS_LABELS = {
  loco: "labelLoco", power: "labelPower", guard: "labelGuard", luggage: "labelLuggage",
  general: "labelGeneral", sleeper: "labelSleeper", ac3: "labelAc3", ac2: "labelAc2",
  ac1: "labelAc1", pantry: "labelPantry"
};

const COACH_CLASS_COLORS = {
  loco: "#4A4A4A", power: "#7C8B99", guard: "#7C8B99", luggage: "#9C8B6E",
  general: "#E0A100", sleeper: "#2E8B57", ac3: "#1565C0", ac2: "#0D47A1",
  ac1: "#6A1B9A", pantry: "#C41230"
};

// ---------- PNR DEMO DATA (5 PNRs, covering CNF / WL / RAC / Cancelled) ----------
const PNR_DEMO_DATA = {
  "9512876351": {
    status: "CNF", statusKey: "pnrStatusCnf",
    train: "12951 Mumbai Rajdhani Express", cls: "3A", from: "Mumbai Central", to: "New Delhi",
    journeyDate: "12-Sep-2026", coach: "B2", seat: "34 (Lower)", passengers: 1,
    chartStatus: "Chart not prepared"
  },
  "8734519206": {
    status: "WL", statusKey: "pnrStatusWl",
    train: "12301 Howrah Rajdhani Express", cls: "2A", from: "Howrah Jn", to: "New Delhi",
    journeyDate: "14-Sep-2026", coach: "—", seat: "WL 12 (GNWL)", passengers: 2,
    chartStatus: "Chart not prepared"
  },
  "6120984753": {
    status: "RAC", statusKey: "pnrStatusRac",
    train: "12259 Sealdah Duronto Express", cls: "SL", from: "Sealdah", to: "New Delhi",
    journeyDate: "10-Sep-2026", coach: "S4", seat: "RAC 3 (Side Lower)", passengers: 1,
    chartStatus: "Chart prepared"
  },
  "7345612890": {
    status: "CAN", statusKey: "pnrStatusCan",
    train: "22503 Vivek Superfast Express", cls: "SL", from: "Dibrugarh", to: "Kanniyakumari",
    journeyDate: "08-Sep-2026", coach: "—", seat: "N/A — refund processed", passengers: 1,
    chartStatus: "Not applicable"
  },
  "5029348671": {
    status: "CNF", statusKey: "pnrStatusCnf",
    train: "12521 Raptisagar Express", cls: "2A", from: "Barauni Jn", to: "Ernakulam Jn",
    journeyDate: "16-Sep-2026", coach: "A1", seat: "12 (Upper)", passengers: 1,
    chartStatus: "Chart prepared"
  }
};

const AVAILABLE_TRAIN_NUMBERS = ["12951", "12301", "12259", "22503", "12521"];

// ---------- TAB SWITCHING (ETA / PNR / Schedule / Coach) ----------

lookupTabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.getAttribute("data-tab")));
});

function activateTab(tabName) {
  currentTab = tabName;
  lookupTabs.forEach((tab) => tab.classList.toggle("active", tab.getAttribute("data-tab") === tabName));
  lookupPanels.forEach((panel) => panel.classList.toggle("active", panel.getAttribute("data-panel") === tabName));
  resultsContainer.innerHTML = getEmptyStateForTab(tabName);
  renderQuickChips(tabName);
}

function getEmptyStateForTab(tabName) {
  if (tabName === "pnr") return `<div class="empty-state"><div class="empty-icon">🎫</div><p>${t("emptyStatePnr")}</p></div>`;
  if (tabName === "schedule") return `<div class="empty-state"><div class="empty-icon">🕒</div><p>${t("emptyStateSchedule")}</p></div>`;
  if (tabName === "coach") return `<div class="empty-state"><div class="empty-icon">🚃</div><p>${t("emptyStateCoach")}</p></div>`;
  return `<div class="empty-state"><div class="empty-icon">🚉</div><p>${t("emptyState")}</p></div>`;
}

// ---------- QUICK-TRY CHIPS (per active tab, so judges can just click) ----------

function renderQuickChips(tabName) {
  quickChipsRow.innerHTML = "";

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

  // ETA / Schedule / Coach all use train numbers
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
      if (tabName === "eta") { trainInput.value = num; handleEtaSearch(num); }
      if (tabName === "schedule") { scheduleInput.value = num; handleScheduleSearch(num); }
      if (tabName === "coach") { coachInput.value = num; handleCoachSearch(num); }
    });
    quickChipsRow.appendChild(chip);
  });

  if (tabName === "eta") {
    const myTrainsChip = document.createElement("button");
    myTrainsChip.className = "chip chip-secondary";
    myTrainsChip.textContent = t("myTrains");
    myTrainsChip.addEventListener("click", () => console.log("My Trains — requires login/backend, not yet implemented."));
    quickChipsRow.appendChild(myTrainsChip);

    const recentChip = document.createElement("button");
    recentChip.className = "chip chip-secondary";
    recentChip.textContent = t("recentSearches");
    recentChip.addEventListener("click", () => console.log("Recent Searches — requires localStorage/backend wiring, not yet implemented."));
    quickChipsRow.appendChild(recentChip);
  }
}

function shortName(fullName) {
  return fullName.split(" (")[0].split(" Express")[0].split(" Superfast")[0];
}

// ---------- ETA SEARCH ----------

searchForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const query = trainInput.value.trim();
  if (!query) { trainInput.focus(); return; }
  handleEtaSearch(query);
});

// earlie function not connected to database ;
// function handleEtaSearch(query) {
//   const key = query.trim();
//   resultsContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">🚆</div><p>${t("fetching")} <strong>${escapeHtml(key)}</strong>...</p></div>`;
//   setTimeout(() => {
//     const data = fetchTrainData(key);
//     if (!data) { currentResultData = null; renderNotFound(key); return; }
//     currentResultData = data;
//     renderResultCard(data);
//   }, 500);
// }

// function fetchTrainData(query) {
//   const normalized = query.trim().toLowerCase();
//   return Object.values(DUMMY_TRAINS).find(
//     (tr) => tr.number === normalized || tr.name.toLowerCase().includes(normalized)
//   );
// }

async function handleEtaSearch(query) {
  const normalized = query.trim().toLowerCase();
  
  try {
    // 1. Make the HTTP GET request to your backend URL
    // encodeURIComponent ensures spaces/special characters are URL-safe
    const response = await fetch(`https://gatidristhi.onrender.com/api/trains?search=${encodeURIComponent(normalized)}`);
    
    // 2. Check if the server responded successfully (status 200-299)
    if (!response.ok) {
      console.warn("Train not found or server error");
      return null; 
    }

    // 3. Convert the response to a usable JavaScript object
    const data = await response.json();
    return renderResultCard(data);
//   }, 500); 
    
  } catch (error) {
    // 4. Handle network failures (e.g., user is offline, server is down)
    console.error("Network error while fetching train data:", error);
    return null;
  }
}

window.rerenderCurrentResult = function () {
  if (currentResultData && currentTab === "eta") renderResultCard(currentResultData);
};

// ---------- PNR STATUS (5 demo PNRs, all real status types) ----------

pnrForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const pnr = pnrInput.value.trim();
  if (!/^\d{10}$/.test(pnr)) { renderPnrValidationError(); return; }
  handlePnrLookup(pnr);
});

function handlePnrLookup(pnr) {
  resultsContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">🎫</div><p>${t("fetching")} PNR <strong>${escapeHtml(pnr)}</strong>...</p></div>`;
  setTimeout(() => {
    const record = PNR_DEMO_DATA[pnr];
    if (!record) { renderPnrNotFound(pnr); return; }
    renderPnrResult(pnr, record);
  }, 450);
}

function renderPnrValidationError() {
  resultsContainer.innerHTML = `<div class="empty-state warn"><div class="empty-icon">⚠️</div><p>${t("pnrInvalid")}</p></div>`;
}

function renderPnrNotFound(pnr) {
  resultsContainer.innerHTML = `
    <div class="not-connected-card">
      <div class="not-connected-icon">🎫</div>
      <h3>${t("pnrLookupFor")} ${escapeHtml(pnr)}</h3>
      <p class="not-connected-text">${t("pnrDemoOnlyText")}</p>
      <div class="not-connected-badge">${t("noDataFabricated")}</div>
    </div>
  `;
}

function renderPnrResult(pnr, record) {
  const statusClassMap = { CNF: "pnr-cnf", WL: "pnr-wl", RAC: "pnr-rac", CAN: "pnr-can" };
  const statusCls = statusClassMap[record.status] || "";

  resultsContainer.innerHTML = `
    <div class="result-card">
      <div class="result-header">
        <div>
          <div class="train-id">${t("pnrLabel")} ${escapeHtml(pnr)}</div>
          <div class="train-route">${escapeHtml(record.train)}</div>
        </div>
        <span class="pnr-status-badge ${statusCls}">${t(record.statusKey)}</span>
      </div>
      <div class="pnr-details-grid">
        <div class="pnr-detail-item"><span class="pnr-detail-label">${t("pnrFrom")}</span><span class="pnr-detail-value">${escapeHtml(record.from)}</span></div>
        <div class="pnr-detail-item"><span class="pnr-detail-label">${t("pnrTo")}</span><span class="pnr-detail-value">${escapeHtml(record.to)}</span></div>
        <div class="pnr-detail-item"><span class="pnr-detail-label">${t("pnrDate")}</span><span class="pnr-detail-value">${escapeHtml(record.journeyDate)}</span></div>
        <div class="pnr-detail-item"><span class="pnr-detail-label">${t("pnrClass")}</span><span class="pnr-detail-value">${escapeHtml(record.cls)}</span></div>
        <div class="pnr-detail-item"><span class="pnr-detail-label">${t("pnrCoach")}</span><span class="pnr-detail-value">${escapeHtml(record.coach)}</span></div>
        <div class="pnr-detail-item"><span class="pnr-detail-label">${t("pnrSeat")}</span><span class="pnr-detail-value">${escapeHtml(record.seat)}</span></div>
        <div class="pnr-detail-item"><span class="pnr-detail-label">${t("pnrPassengers")}</span><span class="pnr-detail-value">${record.passengers}</span></div>
        <div class="pnr-detail-item"><span class="pnr-detail-label">${t("pnrChart")}</span><span class="pnr-detail-value">${escapeHtml(record.chartStatus)}</span></div>
      </div>
      <div class="coach-note">${t("pnrDemoNote")}</div>
    </div>
  `;
}

// ---------- TRAIN SCHEDULE (full demo timetable, all 5 trains) ----------

scheduleForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const query = scheduleInput.value.trim();
  if (!query) { scheduleInput.focus(); return; }
  handleScheduleSearch(query);
});

function handleScheduleSearch(query) {
  const normalized = query.trim().toLowerCase();
  const matchedNumber = Object.keys(SCHEDULE_DATA).find((num) => {
    const sched = SCHEDULE_DATA[num];
    return num === normalized || sched.name.toLowerCase().includes(normalized);
  });

  if (!matchedNumber) {
    resultsContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">❓</div><p>${t("notFound")} "<strong>${escapeHtml(query)}</strong>". ${t("notFoundHint")}</p></div>`;
    return;
  }
  renderSchedule(matchedNumber);
}

function renderSchedule(trainNumber) {
  const sched = SCHEDULE_DATA[trainNumber];
  const rows = sched.stations.map((s, idx) => `
    <tr class="${idx === 0 ? 'sched-origin' : ''} ${idx === sched.stations.length - 1 ? 'sched-destination' : ''}">
      <td>${idx + 1}</td>
      <td><strong>${escapeHtml(s.name)}</strong> <span class="sched-code">(${escapeHtml(s.code)})</span></td>
      <td>${escapeHtml(s.arr)}</td>
      <td>${escapeHtml(s.dep)}</td>
      <td>Day ${s.day}</td>
      <td>${s.dist} km</td>
      <td>${platformBadgeHtml(s.platform, "confirmed", "")}</td>
    </tr>
  `).join("");

  resultsContainer.innerHTML = `
    <div class="result-card">
      <div class="result-header">
        <div>
          <div class="train-id">${sched.number} · ${escapeHtml(sched.name)}</div>
          <div class="train-route">${t("runsOn")}: ${escapeHtml(sched.runsOn)}</div>
        </div>
        <span class="coach-demo-badge">${t("scheduleDemoBadge")}</span>
      </div>
      <div class="schedule-table-wrap">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>#</th><th>${t("schedStation")}</th><th>${t("schedArr")}</th><th>${t("schedDep")}</th>
              <th>${t("schedDay")}</th><th>${t("schedDist")}</th><th>${t("schedPlatform")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="coach-note">${t("scheduleDataNote")}</div>
    </div>
  `;
}

// ---------- COACH POSITION (SVG train-car shapes, all 5 trains) ----------

coachForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const query = coachInput.value.trim();
  if (!query) { coachInput.focus(); return; }
  handleCoachSearch(query);
});

function handleCoachSearch(query) {
  const normalized = query.trim().toLowerCase();
  const matchedNumber = Object.keys(COACH_COMPOSITION).find((num) => {
    const train = DUMMY_TRAINS[num];
    return num === normalized || (train && train.name.toLowerCase().includes(normalized));
  });

  if (!matchedNumber) {
    resultsContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">❓</div><p>${t("notFound")} "<strong>${escapeHtml(query)}</strong>". ${t("notFoundHint")}</p></div>`;
    return;
  }
  renderCoachPosition(matchedNumber);
}

// Builds a single coach as an SVG train-car shape: rounded body, two
// window rectangles, a door line, and two wheel circles beneath — a more
// realistic look than a plain rectangle box.
function buildCoachSvg(code, cls, isLoco, isGuard) {
  const color = COACH_CLASS_COLORS[cls] || "#888";
  const bodyRx = isLoco ? 8 : 10;

  let frontShape = "";
  if (isLoco) {
    // Locomotive: angled front nose
    frontShape = `<path d="M4,10 L14,4 L70,4 Q76,4 76,10 L76,34 Q76,40 70,40 L14,40 Q4,40 4,34 Z" fill="${color}" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>`;
  } else {
    frontShape = `<rect x="4" y="4" width="72" height="36" rx="${bodyRx}" fill="${color}" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>`;
  }

  const windows = isLoco ? "" : `
    <rect x="12" y="11" width="10" height="9" rx="2" fill="rgba(255,255,255,0.85)"/>
    <rect x="26" y="11" width="10" height="9" rx="2" fill="rgba(255,255,255,0.85)"/>
    <rect x="40" y="11" width="10" height="9" rx="2" fill="rgba(255,255,255,0.85)"/>
    <rect x="54" y="11" width="10" height="9" rx="2" fill="rgba(255,255,255,0.85)"/>
  `;

  const doorLine = isLoco ? "" : `<line x1="40" y1="4" x2="40" y2="40" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>`;

  const label = `<text x="40" y="30" text-anchor="middle" font-size="10" font-weight="700" fill="rgba(255,255,255,0.95)" font-family="Inter, sans-serif">${escapeHtml(code)}</text>`;

  const wheels = `
    <circle cx="20" cy="43" r="4" fill="#2b2b2b"/>
    <circle cx="60" cy="43" r="4" fill="#2b2b2b"/>
  `;

  return `
    <svg viewBox="0 0 80 48" width="72" height="44" class="coach-svg">
      ${frontShape}
      ${windows}
      ${doorLine}
      ${label}
      ${wheels}
    </svg>
  `;
}

function renderCoachPosition(trainNumber) {
  const train = DUMMY_TRAINS[trainNumber];
  const composition = COACH_COMPOSITION[trainNumber];

  const units = composition.map(([code, cls], idx) => {
    const isLoco = cls === "loco";
    const isGuard = cls === "guard";
    return `
      <div class="coach-unit">
        <span class="coach-number">${idx + 1}</span>
        ${buildCoachSvg(code, cls, isLoco, isGuard)}
      </div>
    `;
  }).join(`<div class="coach-coupling" aria-hidden="true"></div>`);

  const usedClasses = [...new Set(composition.map((c) => c[1]))];
  const legend = usedClasses.map((cls) => `
    <span class="coach-legend-item">
      <span class="coach-legend-swatch" style="background:${COACH_CLASS_COLORS[cls]}"></span>
      ${t(COACH_CLASS_LABELS[cls])}
    </span>
  `).join("");

  resultsContainer.innerHTML = `
    <div class="coach-position-card">
      <div class="coach-position-header">
        <div>
          <div class="coach-position-title">${train.number} · ${escapeHtml(train.name)}</div>
          <div class="coach-position-sub">${escapeHtml(train.route)}</div>
        </div>
        <span class="coach-demo-badge">${t("coachDemoBadge")}</span>
      </div>
      <div class="coach-direction-hint">🚂 ${t("coachDirectionHint")}</div>
      <div class="coach-diagram-scroll">
        <div class="coach-diagram-track">${units}</div>
        <div class="coach-rail-track"></div>
      </div>
      <div class="coach-legend">${legend}</div>
      <div class="coach-note">${t("coachDataNote")}</div>
    </div>
  `;
}

// ---------- HELP MODAL ----------

helpBtn.addEventListener("click", () => {
  helpModalOverlay.classList.add("open");
  document.body.classList.add("modal-open");
});
helpModalClose.addEventListener("click", closeHelpModal);
helpModalOverlay.addEventListener("click", (e) => { if (e.target === helpModalOverlay) closeHelpModal(); });

function closeHelpModal() {
  helpModalOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
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
  resultsContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">❓</div><p>${t("notFound")} "<strong>${escapeHtml(query)}</strong>". ${t("notFoundHint")}</p></div>`;
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
        <span class="confidence-badge ${data.confidence}"><span class="confidence-dot"></span>${t(confKey)}</span>
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
      <div class="eta-reason"><span class="icon">ℹ️</span><span>${escapeHtml(data.reason)}</span></div>
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

  return `<div class="timeline-section"><div class="section-title">${t("upcomingStations")}</div><div class="timeline">${stops}</div></div>`;
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
      <div class="alert-text"><strong>${escapeHtml(a.text)}</strong><span>${escapeHtml(a.time)}</span></div>
    </div>
  `).join("");
  return `<div class="alerts-section"><div class="section-title">${t("activeAlerts")}</div>${items}</div>`;
}

function renderBottomGrid(data) {
  return `
    <div class="bottom-grid">
      <div class="info-card">
        <div class="section-title">${t("punctuality30")}</div>
        <div class="punctuality-bar-track"><div class="punctuality-bar-fill" style="width:${data.punctuality30d}%;"></div></div>
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
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeMapModal(); closeHelpModal(); }
});

function openMapModal(data) {
  mapModalSubtitle.textContent = `${data.number} · ${data.name}`;
  mapModalOverlay.classList.add("open");
  document.body.classList.add("modal-open");
  setTimeout(() => buildLeafletMap(data), 50);
}

function closeMapModal() {
  mapModalOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
  if (leafletMapInstance) { leafletMapInstance.remove(); leafletMapInstance = null; indiaBoundaryLayer = null; }
}

function buildLeafletMap(data) {
  const points = data.stops.map((s) => ({ ...s, latlng: STATION_LATLNG[s.name] })).filter((s) => s.latlng);

  if (points.length === 0) {
    document.getElementById("leafletMap").innerHTML = `<p style="padding:30px;text-align:center;color:#888;">Map data unavailable for this route.</p>`;
    return;
  }

  const currentIdx = points.findIndex((p) => p.current);
  const splitIdx = currentIdx >= 0 ? currentIdx : 0;
  const coveredCoords = points.slice(0, splitIdx + 1).map((p) => p.latlng);
  const remainingCoords = points.slice(splitIdx).map((p) => p.latlng);
  const currentPoint = points[splitIdx];

  if (leafletMapInstance) { leafletMapInstance.remove(); leafletMapInstance = null; indiaBoundaryLayer = null; }

  leafletMapInstance = L.map("leafletMap", { scrollWheelZoom: true });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 12,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | India boundary: Survey of India (via DataMeet)'
  }).addTo(leafletMapInstance);

  L.polyline(coveredCoords, { color: "#2E7D32", weight: 5, opacity: 0.9 }).addTo(leafletMapInstance);
  L.polyline(remainingCoords, { color: "#1565C0", weight: 4, opacity: 0.7, dashArray: "2 8" }).addTo(leafletMapInstance);

  points.forEach((p, i) => {
    const isCurrent = i === splitIdx;
    const isPassed = i < splitIdx;
    const color = isCurrent ? "#C41230" : (isPassed ? "#2E7D32" : "#1565C0");
    const platformText = p.platform ? ` (PF ${p.platform})` : "";
    L.circleMarker(p.latlng, { radius: isCurrent ? 8 : 6, color, fillColor: color, fillOpacity: 0.9, weight: 2 })
      .addTo(leafletMapInstance)
      .bindPopup(`<strong>${escapeHtml(p.name)}</strong>${platformText}<br>${p.sched} → ${p.predicted}`);
  });

  const blinkIcon = L.divIcon({ className: "leaflet-blink-icon", html: `<div class="blink-dot"></div>`, iconSize: [22, 22] });
  L.marker(currentPoint.latlng, { icon: blinkIcon }).addTo(leafletMapInstance);

  const bounds = L.latLngBounds(points.map((p) => p.latlng));
  leafletMapInstance.fitBounds(bounds, { padding: [30, 30] });

  loadIndiaBoundaryOverlay();
}

function loadIndiaBoundaryOverlay() {
  if (indiaBoundaryGeoJsonCache) { drawIndiaBoundary(indiaBoundaryGeoJsonCache); return; }
  fetch(INDIA_BOUNDARY_GEOJSON_URL)
    .then((res) => { if (!res.ok) throw new Error("Boundary fetch failed: " + res.status); return res.json(); })
    .then((geojson) => { indiaBoundaryGeoJsonCache = geojson; drawIndiaBoundary(geojson); })
    .catch((err) => console.warn("Could not load corrected India boundary overlay (offline or GitHub unreachable):", err));
}

function drawIndiaBoundary(geojson) {
  if (!leafletMapInstance) return;
  if (indiaBoundaryLayer) leafletMapInstance.removeLayer(indiaBoundaryLayer);
  indiaBoundaryLayer = L.geoJSON(geojson, { style: { color: "#003366", weight: 2.5, opacity: 0.9, fill: false } }).addTo(leafletMapInstance);
}

// ---------- UTILITIES ----------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- INIT ----------
renderQuickChips("eta");

console.log("GatiDrishti frontend — 5 trains, full schedule+coach demo data, PNR demo data, SVG coach graphics, Help modal loaded.");
