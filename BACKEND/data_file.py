DUMMY_TRAINS = {
  "12951": {
    "number": "12951", "name": "Mumbai Rajdhani Express",
    "origin": "Mumbai Central (MMCT)", "destination": "New Delhi (NDLS)",
    "route": "Mumbai Central (MMCT) → New Delhi (NDLS)",
    "delayMinutes": 18, "confidence": "high",
    "nextStation": "Vadodara Jn (BRC)", "nextEtaTime": "14:32", "nextPlatform": "3", "nextPlatformConfidence": "confirmed",
    "destinationEtaTime": "08:35 (+1 day)", "destinationPlatform": "1", "destinationPlatformConfidence": "confirmed",
    "lastUpdated": "2 min ago", "reason": "Running late due to congestion near Surat; recovered 6 min after last halt.",
    "punctuality30d": 71, "totalDistanceKm": 1384, "coveredDistanceKm": 490,
    "stops": [
      { "name": "Mumbai Central (MMCT)", "sched": "16:00", "predicted": "16:00", "status": "ontime", "delta": "Origin", "passed": True, "platform": "1", "platformConfidence": "confirmed" },
      { "name": "Surat", "sched": "12:48", "predicted": "13:04", "status": "delay", "delta": "+16 min", "passed": True, "platform": "2", "platformConfidence": "confirmed" },
      { "name": "Vadodara Jn", "sched": "14:14", "predicted": "14:32", "status": "delay", "delta": "+18 min", "current": True, "platform": "3", "platformConfidence": "confirmed" },
      { "name": "Ratlam Jn", "sched": "16:42", "predicted": "16:55", "status": "delay", "delta": "+13 min", "platform": "1", "platformConfidence": "expected" },
      { "name": "Kota Jn", "sched": "19:50", "predicted": "19:58", "status": "ontime", "delta": "+8 min", "platform": "4", "platformConfidence": "expected" },
      { "name": "New Delhi", "sched": "08:35", "predicted": "08:35", "status": "ontime", "delta": "On time", "platform": "1", "platformConfidence": "confirmed" }
    ],
    "alerts": [
      { "text": "Temporary speed restriction (30 km/h) between Surat–Vadodara due to track maintenance.", "time": "Active until 15:00" },
      { "text": "Moderate congestion reported ahead near Ratlam Jn.", "time": "Updated 5 min ago" }
    ]
  },
  "12301": {
    "number": "12301", "name": "Howrah Rajdhani Express",
    "origin": "Howrah (HWH)", "destination": "New Delhi (NDLS)",
    "route": "Howrah (HWH) → New Delhi (NDLS)",
    "delayMinutes": 0, "confidence": "high",
    "nextStation": "Dhanbad Jn (DHN)", "nextEtaTime": "18:47", "nextPlatform": "2", "nextPlatformConfidence": "confirmed",
    "destinationEtaTime": "10:00 (+1 day)", "destinationPlatform": "1", "destinationPlatformConfidence": "confirmed",
    "lastUpdated": "1 min ago", "reason": "Running on schedule. No active restrictions on this section.",
    "punctuality30d": 88, "totalDistanceKm": 1447, "coveredDistanceKm": 165,
    "stops": [
      { "name": "Howrah (HWH)", "sched": "16:55", "predicted": "16:55", "status": "ontime", "delta": "Origin", "passed": True, "platform": "9", "platformConfidence": "confirmed" },
      { "name": "Asansol Jn", "sched": "17:35", "predicted": "17:35", "status": "ontime", "delta": "On time", "passed": True, "platform": "3", "platformConfidence": "confirmed" },
      { "name": "Dhanbad Jn", "sched": "18:47", "predicted": "18:47", "status": "ontime", "delta": "On time", "current": True, "platform": "2", "platformConfidence": "confirmed" },
      { "name": "Gaya Jn", "sched": "21:08", "predicted": "21:10", "status": "ontime", "delta": "+2 min", "platform": "1", "platformConfidence": "expected" },
      { "name": "Mughalsarai", "sched": "23:35", "predicted": "23:40", "status": "ontime", "delta": "+5 min", "platform": "5", "platformConfidence": "expected" },
      { "name": "New Delhi", "sched": "10:00", "predicted": "10:00", "status": "ontime", "delta": "On time", "platform": "1", "platformConfidence": "confirmed" }
    ],
    "alerts": [ { "text": "No active alerts on this route currently.", "time": "Checked just now" } ]
  },
  "12259": {
    "number": "12259", "name": "Sealdah Duronto Express",
    "origin": "Sealdah (SDAH)", "destination": "New Delhi (NDLS)",
    "route": "Sealdah (SDAH) → New Delhi (NDLS)",
    "delayMinutes": 42, "confidence": "medium",
    "nextStation": "Kanpur Central (CNB)", "nextEtaTime": "05:58", "nextPlatform": "5", "nextPlatformConfidence": "expected",
    "destinationEtaTime": "11:20", "destinationPlatform": "2", "destinationPlatformConfidence": "expected",
    "lastUpdated": "4 min ago", "reason": "Delay accumulated due to a preceding freight movement and one unscheduled signal halt near Allahabad.",
    "punctuality30d": 54, "totalDistanceKm": 1450, "coveredDistanceKm": 780,
    "stops": [
      { "name": "Sealdah (SDAH)", "sched": "23:55", "predicted": "23:55", "status": "ontime", "delta": "Origin", "passed": True, "platform": "8", "platformConfidence": "confirmed" },
      { "name": "Allahabad Jn", "sched": "02:20", "predicted": "02:58", "status": "severe", "delta": "+38 min", "passed": True, "platform": "6", "platformConfidence": "confirmed" },
      { "name": "Kanpur Central", "sched": "05:16", "predicted": "05:58", "status": "severe", "delta": "+42 min", "current": True, "platform": "5", "platformConfidence": "expected" },
      { "name": "Tundla Jn", "sched": "08:05", "predicted": "08:40", "status": "delay", "delta": "+35 min", "platform": "2", "platformConfidence": "expected" },
      { "name": "New Delhi", "sched": "10:40", "predicted": "11:20", "status": "delay", "delta": "+40 min", "platform": "2", "platformConfidence": "expected" }
    ],
    "alerts": [
      { "text": "Unscheduled signal halt recorded near Allahabad Jn.", "time": "Occurred 45 min ago" },
      { "text": "Preceding freight train causing minor congestion till Kanpur.", "time": "Updated 10 min ago" }
    ]
  },
  "22503": {
    "number": "22503", "name": "Vivek Superfast Express (Dibrugarh–Kanniyakumari)",
    "origin": "Dibrugarh (DBRG)", "destination": "Kanniyakumari (CAPE)",
    "route": "Dibrugarh (DBRG) → Kanniyakumari (CAPE) · India's longest-running train, ~4188 km",
    "delayMinutes": 65, "confidence": "medium",
    "nextStation": "Malda Town (MLDT)", "nextEtaTime": "20:45", "nextPlatform": "3", "nextPlatformConfidence": "expected",
    "destinationEtaTime": "22:50 (+3 days)", "destinationPlatform": "1", "destinationPlatformConfidence": "expected",
    "lastUpdated": "6 min ago", "reason": "Delay building up gradually over a 4188 km, multi-day journey through 9 states; typical cumulative drift on this route.",
    "punctuality30d": 48, "totalDistanceKm": 4188, "coveredDistanceKm": 1250,
    "stops": [
      { "name": "Dibrugarh (DBRG)", "sched": "19:00", "predicted": "19:00", "status": "ontime", "delta": "Origin", "passed": True, "platform": "2", "platformConfidence": "confirmed" },
      { "name": "New Tinsukia (NTSK)", "sched": "19:50", "predicted": "20:05", "status": "delay", "delta": "+15 min", "passed": True, "platform": "1", "platformConfidence": "confirmed" },
      { "name": "Furkating Jn (FKG)", "sched": "23:48", "predicted": "00:20", "status": "delay", "delta": "+32 min", "passed": True, "platform": "3", "platformConfidence": "confirmed" },
      { "name": "New Bongaigaon (NBQ)", "sched": "10:10", "predicted": "10:55", "status": "delay", "delta": "+45 min", "passed": True, "platform": "1", "platformConfidence": "confirmed" },
      { "name": "New Jalpaiguri (NJP)", "sched": "15:35", "predicted": "16:25", "status": "delay", "delta": "+50 min", "passed": True, "platform": "6", "platformConfidence": "confirmed" },
      { "name": "Malda Town (MLDT)", "sched": "20:20", "predicted": "20:45", "status": "delay", "delta": "+65 min", "current": True, "platform": "3", "platformConfidence": "expected" },
      { "name": "Kharagpur Jn (KGP)", "sched": "03:10", "predicted": "04:10", "status": "delay", "delta": "+60 min", "platform": "4", "platformConfidence": "expected" },
      { "name": "Kanniyakumari (CAPE)", "sched": "21:45", "predicted": "22:50", "status": "delay", "delta": "+65 min", "platform": "1", "platformConfidence": "expected" }
    ],
    "alerts": [
      { "text": "Cumulative minor delays across Assam–West Bengal sections due to multiple crossings on a single-line stretch.", "time": "Ongoing" },
      { "text": "No major disruption reported; delay expected to stay stable through the remaining route.", "time": "Updated 6 min ago" }
    ]
  },
  "12521": {
    "number": "12521", "name": "Raptisagar Express (Barauni–Ernakulam)",
    "origin": "Barauni Jn (BJU)", "destination": "Ernakulam Jn (ERS)",
    "route": "Barauni Jn (BJU) → Ernakulam Jn (ERS) · North-Central to Deep South, ~3437 km",
    "delayMinutes": 25, "confidence": "medium",
    "nextStation": "Gorakhpur (GKP)", "nextEtaTime": "06:15", "nextPlatform": "3", "nextPlatformConfidence": "expected",
    "destinationEtaTime": "12:05 (+2 days)", "destinationPlatform": "1", "destinationPlatformConfidence": "expected",
    "lastUpdated": "3 min ago", "reason": "Short delay picked up near Muzaffarpur due to platform congestion; being monitored on the Gorakhpur–Erode stretch.",
    "punctuality30d": 62, "totalDistanceKm": 3437, "coveredDistanceKm": 350,
    "stops": [
      { "name": "Barauni Jn (BJU)", "sched": "SRC", "predicted": "SRC", "status": "ontime", "delta": "Origin", "passed": True, "platform": "1", "platformConfidence": "confirmed" },
      { "name": "Samastipur Jn (SPJ)", "sched": "23:35", "predicted": "23:40", "status": "delay", "delta": "+5 min", "passed": True, "platform": "2", "platformConfidence": "confirmed" },
      { "name": "Muzaffarpur Jn (MFP)", "sched": "00:35", "predicted": "00:55", "status": "delay", "delta": "+20 min", "passed": True, "platform": "1", "platformConfidence": "confirmed" },
      { "name": "Hajipur Jn (HJP)", "sched": "01:30", "predicted": "01:55", "status": "delay", "delta": "+25 min", "passed": True, "platform": "1", "platformConfidence": "confirmed" },
      { "name": "Gorakhpur (GKP)", "sched": "05:50", "predicted": "06:15", "status": "delay", "delta": "+25 min", "current": True, "platform": "3", "platformConfidence": "expected" },
      { "name": "Erode Jn (ED)", "sched": "16:55", "predicted": "17:20", "status": "delay", "delta": "+25 min", "platform": "2", "platformConfidence": "expected" },
      { "name": "Thrissur (TCR)", "sched": "09:40", "predicted": "10:05", "status": "delay", "delta": "+25 min", "platform": "1", "platformConfidence": "expected" },
      { "name": "Aluva (AWY)", "sched": "11:10", "predicted": "11:35", "status": "delay", "delta": "+25 min", "platform": "1", "platformConfidence": "expected" },
      { "name": "Ernakulam Jn (ERS)", "sched": "11:40", "predicted": "12:05", "status": "delay", "delta": "+25 min", "platform": "1", "platformConfidence": "expected" }
    ],
    "alerts": [
      { "text": "Platform congestion caused a short hold near Muzaffarpur Jn.", "time": "Occurred 2 hr ago" },
      { "text": "Delay expected to remain steady through Gorakhpur and onward.", "time": "Updated 3 min ago" }
    ]
  }
}