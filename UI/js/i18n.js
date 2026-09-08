// ============================================
// i18n.js — Language dictionary + apply logic
// Add more languages by adding a new key (e.g. "ta", "te", "mr")
// with the same field names as "en".
// ============================================

const TRANSLATIONS = {
  en: {
    brandTitle: "GatiDrishti",
    brandSubtitle: "Connecting India, On Time.",
    navNTES: "NTES",
    navIRCTC: "IRCTC",
    navRailMadad: "Rail Madad",
    navHelp: "Help",
    helplineCall: "CALL 139",
    helplineSub: "for security/medical assistance",
    heroKicker: "Dynamic ETA Forecast",
    heroTitle: "Know exactly when your train will arrive",
    heroSubtitle: "Live, self-updating ETA predictions for coaching trains — powered by real-time location, signalling and historical running data.",
    tabEta: "Live ETA",
    tabPnr: "PNR Status",
    tabSchedule: "Train Schedule",
    tabCoach: "Coach Position",
    searchPlaceholder: "Enter Train No. or Name (e.g., 12951, Rajdhani Express)",
    searchBtn: "Get Live ETA",
    pnrPlaceholder: "Enter 10-digit PNR Number",
    pnrBtn: "Check PNR Status",
    schedulePlaceholder: "Enter Train No. or Name for full timetable",
    scheduleBtn: "View Schedule",
    coachPlaceholder: "Enter Train No. to view coach position (e.g., 12951)",
    coachBtn: "View Coach Position",
    tryLabel: "Available trains — click to try:",
    tryPnrLabel: "Try these PNRs:",
    myTrains: "My Trains",
    recentSearches: "Recent Searches",
    heroNote: "Data sources: GPS feeds, signal aspects, historical delay patterns, weather & congestion data.",
    emptyState: "Search a train above to see its live dynamic ETA, delay status and route timeline.",
    emptyStatePnr: "Enter a 10-digit PNR number above to check booking status.",
    emptyStateSchedule: "Enter a train number or name above to view its full station-wise timetable.",
    emptyStateCoach: "Enter a train number above to see its coach order from the engine.",
    fetching: "Fetching live ETA for",
    notFound: "No live data found for",
    notFoundHint: "Try a train number like 12951, 12301, 12259, 22503 or 12521 (demo data only).",
    pnrInvalid: "Please enter a valid 10-digit PNR number.",
    pnrLookupFor: "PNR Lookup —",
    pnrLabel: "PNR",
    pnrDemoOnlyText: "This PNR isn't in our demo dataset. Try one of the 5 sample PNRs shown below the search box.",
    pnrDemoNote: "This is DEMO PNR data built for this prototype (5 sample PNRs covering Confirmed, Waiting List, RAC and Cancelled statuses). Real PNR status requires a licensed IRCTC/CRIS-connected data source — there is no free official public API for this.",
    pnrStatusCnf: "CONFIRMED",
    pnrStatusWl: "WAITING LIST",
    pnrStatusRac: "RAC",
    pnrStatusCan: "CANCELLED",
    pnrFrom: "From",
    pnrTo: "To",
    pnrDate: "Journey Date",
    pnrClass: "Class",
    pnrCoach: "Coach",
    pnrSeat: "Seat / Berth",
    pnrPassengers: "Passengers",
    pnrChart: "Chart Status",
    nextStationEta: "Next Station ETA",
    destinationEta: "Destination ETA",
    updated: "Updated",
    upcomingStations: "Upcoming Stations",
    routeOverview: "Route Overview",
    activeAlerts: "Active Alerts",
    punctuality30: "Historical Punctuality (Last 30 days)",
    punctualityText: "On-time at destination on {pct}% of days in the last 30 days.",
    actions: "Actions",
    setAlert: "Set Arrival Alert",
    shareEta: "Share ETA",
    showOnMap: "Show on Map",
    mapModalTitle: "Live Route Map",
    legendCovered: "Distance covered",
    legendRemaining: "Distance remaining",
    legendLive: "Live position",
    mapDataNote: "Station coordinates and live position shown here use demo data for this prototype. A production version needs a licensed GNSS/RTIS feed or NTES-equivalent live position source.",
    onTime: "On time",
    runningLate: "Running {min} min late",
    confHigh: "High confidence",
    confMedium: "Medium confidence",
    confLow: "Low confidence",
    platformShort: "PF",
    platformConfirmed: "Confirmed platform",
    platformExpected: "Expected — may change",
    runsOn: "Runs on",
    schedStation: "Station",
    schedArr: "Arrival",
    schedDep: "Departure",
    schedDay: "Day",
    schedDist: "Distance",
    schedPlatform: "Platform",
    scheduleDemoBadge: "Demo timetable",
    scheduleDataNote: "Station names, timings, distances and platforms shown are DEMO data built for this prototype, based on typical published timetables. A production version needs data sourced from data.gov.in's Indian Railways Time Table dataset or a licensed schedule API, kept current with real-time updates.",
    coachDemoBadge: "Standard composition — demo data",
    coachDirectionHint: "Coach order shown from engine (loco) to guard van (last coach).",
    coachDataNote: "This shows a TYPICAL/STANDARD coach composition for this train category, not a live per-day feed. Actual coach order can vary by date due to rake changes or coach augmentation/de-augmentation. A production version needs composition data sourced from CRIS (Centralized Railway Information System) or a licensed rail-data API, refreshed per train per day.",
    labelLoco: "Locomotive",
    labelPower: "Power Car",
    labelGuard: "Guard / Brake Van",
    labelLuggage: "Luggage / Parcel Van",
    labelGeneral: "General (Unreserved)",
    labelSleeper: "Sleeper Class",
    labelAc3: "AC 3 Tier",
    labelAc2: "AC 2 Tier",
    labelAc1: "AC First Class",
    labelPantry: "Pantry Car",
    helpModalTitle: "Help & Support",
    helpFaq1Q: "How do I check my train's live ETA?",
    helpFaq1A: "Go to the \"Live ETA\" tab, type your train number or name, and press Get Live ETA. Try one of the sample trains shown as quick chips.",
    helpFaq2Q: "Is the data shown here real?",
    helpFaq2A: "This is a Smart India Hackathon 2026 prototype. ETA, schedule, PNR and coach data shown are demo/reference values used to illustrate the design — not live official data.",
    helpFaq3Q: "Who do I contact for real railway complaints?",
    helpFaq3A: "For official assistance, use Rail Madad, call 139 (security/medical), or visit the NTES/IRCTC links in the header.",
    helpContactTitle: "Need more help?",
    footerTagline: "A Smart India Hackathon 2026 prototype for real-time, data-driven ETA prediction of Indian Railways coaching trains.",
    footerQuickLinks: "Quick Links",
    footerNTES: "NTES — National Train Enquiry",
    footerPunctuality: "Zone-wise Punctuality",
    footerDataIntegration: "Data & Integration",
    footerApiDocs: "Public API Docs",
    footerControlRoom: "Control Room Dashboard",
    footerStationDisplay: "Station Display Feed",
    footerPrivacy: "Privacy & Terms",
    footerBottom: "Prototype UI for Smart India Hackathon 2026 · Not an official Indian Railways product"
  },

  hi: {
    brandTitle: "गतिदृष्टि",
    brandSubtitle: "कनेक्टिंग इंडिया, ऑन टाइम।",
    navNTES: "एनटीईएस",
    navIRCTC: "आईआरसीटीसी",
    navRailMadad: "रेल मदद",
    navHelp: "सहायता",
    helplineCall: "139 पर कॉल करें",
    helplineSub: "सुरक्षा/चिकित्सा सहायता के लिए",
    heroKicker: "डायनामिक ETA पूर्वानुमान",
    heroTitle: "जानिए आपकी ट्रेन कब पहुँचेगी",
    heroSubtitle: "कोचिंग ट्रेनों के लिए लाइव, स्वतः-अपडेट होने वाला ETA पूर्वानुमान — रीयल-टाइम लोकेशन, सिग्नलिंग और ऐतिहासिक डेटा पर आधारित।",
    tabEta: "लाइव ETA",
    tabPnr: "पीएनआर स्थिति",
    tabSchedule: "ट्रेन शेड्यूल",
    tabCoach: "कोच पोजीशन",
    searchPlaceholder: "ट्रेन नंबर या नाम दर्ज करें (जैसे, 12951, राजधानी एक्सप्रेस)",
    searchBtn: "लाइव ETA देखें",
    pnrPlaceholder: "10 अंकों का पीएनआर नंबर दर्ज करें",
    pnrBtn: "पीएनआर स्थिति जांचें",
    schedulePlaceholder: "पूर्ण समय-सारिणी हेतु ट्रेन नंबर या नाम दर्ज करें",
    scheduleBtn: "शेड्यूल देखें",
    coachPlaceholder: "कोच पोजीशन देखने हेतु ट्रेन नंबर दर्ज करें (जैसे, 12951)",
    coachBtn: "कोच पोजीशन देखें",
    tryLabel: "उपलब्ध ट्रेनें — आज़माने हेतु क्लिक करें:",
    tryPnrLabel: "ये पीएनआर आज़माएँ:",
    myTrains: "मेरी ट्रेनें",
    recentSearches: "हाल की खोजें",
    heroNote: "डेटा स्रोत: जीपीएस फीड, सिग्नल पहलू, ऐतिहासिक विलंब पैटर्न, मौसम और भीड़भाड़ डेटा।",
    emptyState: "अपनी ट्रेन का लाइव ETA, विलंब स्थिति और रूट टाइमलाइन देखने के लिए ऊपर खोजें।",
    emptyStatePnr: "बुकिंग स्थिति जांचने के लिए ऊपर 10 अंकों का पीएनआर नंबर दर्ज करें।",
    emptyStateSchedule: "पूरी स्टेशन-वार समय-सारिणी देखने के लिए ऊपर ट्रेन नंबर या नाम दर्ज करें।",
    emptyStateCoach: "इंजन से कोच क्रम देखने के लिए ऊपर ट्रेन नंबर दर्ज करें।",
    fetching: "के लिए लाइव ETA प्राप्त किया जा रहा है",
    notFound: "के लिए कोई लाइव डेटा नहीं मिला",
    notFoundHint: "12951, 12301, 12259, 22503 या 12521 जैसा ट्रेन नंबर आज़माएँ (केवल डेमो डेटा)।",
    pnrInvalid: "कृपया मान्य 10 अंकों का पीएनआर नंबर दर्ज करें।",
    pnrLookupFor: "पीएनआर खोज —",
    pnrLabel: "पीएनआर",
    pnrDemoOnlyText: "यह पीएनआर हमारे डेमो डेटा में नहीं है। कृपया नीचे दिखाए गए 5 उदाहरण पीएनआर में से एक आज़माएँ।",
    pnrDemoNote: "यह इस प्रोटोटाइप हेतु बनाया गया डेमो पीएनआर डेटा है (5 उदाहरण पीएनआर, जो कन्फर्म्ड, वेटिंग लिस्ट, आरएसी और रद्द स्थितियों को दर्शाते हैं)। वास्तविक पीएनआर स्थिति हेतु लाइसेंस प्राप्त आईआरसीटीसी/सीआरआईएस-जुड़े डेटा स्रोत की आवश्यकता है — इसके लिए कोई निःशुल्क आधिकारिक सार्वजनिक एपीआई नहीं है।",
    pnrStatusCnf: "कन्फर्म्ड",
    pnrStatusWl: "वेटिंग लिस्ट",
    pnrStatusRac: "आरएसी",
    pnrStatusCan: "रद्द",
    pnrFrom: "से",
    pnrTo: "तक",
    pnrDate: "यात्रा तिथि",
    pnrClass: "श्रेणी",
    pnrCoach: "कोच",
    pnrSeat: "सीट / बर्थ",
    pnrPassengers: "यात्री",
    pnrChart: "चार्ट स्थिति",
    nextStationEta: "अगले स्टेशन का ETA",
    destinationEta: "गंतव्य ETA",
    updated: "अपडेट किया गया",
    upcomingStations: "आगामी स्टेशन",
    routeOverview: "रूट ओवरव्यू",
    activeAlerts: "सक्रिय अलर्ट",
    punctuality30: "ऐतिहासिक समय-पालन (पिछले 30 दिन)",
    punctualityText: "पिछले 30 दिनों में {pct}% दिन गंतव्य पर समय पर पहुँची।",
    actions: "कार्रवाइयाँ",
    setAlert: "आगमन अलर्ट सेट करें",
    shareEta: "ETA शेयर करें",
    showOnMap: "मानचित्र पर देखें",
    mapModalTitle: "लाइव रूट मानचित्र",
    legendCovered: "तय की गई दूरी",
    legendRemaining: "शेष दूरी",
    legendLive: "लाइव स्थिति",
    mapDataNote: "यहाँ दिखाए गए स्टेशन निर्देशांक और लाइव स्थिति इस प्रोटोटाइप हेतु डेमो डेटा का उपयोग करते हैं। उत्पादन संस्करण हेतु लाइसेंस प्राप्त GNSS/RTIS फ़ीड या NTES-समान लाइव स्थिति स्रोत आवश्यक है।",
    onTime: "समय पर",
    runningLate: "{min} मिनट लेट चल रही है",
    confHigh: "उच्च विश्वसनीयता",
    confMedium: "मध्यम विश्वसनीयता",
    confLow: "निम्न विश्वसनीयता",
    platformShort: "प्लेटफ़ॉर्म",
    platformConfirmed: "पुष्टि किया गया प्लेटफ़ॉर्म",
    platformExpected: "संभावित — बदल सकता है",
    runsOn: "चलती है",
    schedStation: "स्टेशन",
    schedArr: "आगमन",
    schedDep: "प्रस्थान",
    schedDay: "दिन",
    schedDist: "दूरी",
    schedPlatform: "प्लेटफ़ॉर्म",
    scheduleDemoBadge: "डेमो समय-सारिणी",
    scheduleDataNote: "दिखाए गए स्टेशन नाम, समय, दूरी और प्लेटफ़ॉर्म इस प्रोटोटाइप हेतु बनाए गए डेमो डेटा हैं, जो सामान्यतः प्रकाशित समय-सारिणी पर आधारित हैं। उत्पादन संस्करण हेतु data.gov.in के भारतीय रेल समय-सारिणी डेटासेट या लाइसेंस प्राप्त शेड्यूल एपीआई से डेटा आवश्यक है, जो रीयल-टाइम अपडेट के साथ अद्यतन रहे।",
    coachDemoBadge: "मानक संरचना — डेमो डेटा",
    coachDirectionHint: "कोच क्रम इंजन से गार्ड वैन (अंतिम कोच) तक दिखाया गया है।",
    coachDataNote: "यह इस ट्रेन श्रेणी की सामान्य/मानक कोच संरचना दिखाता है, न कि रोज़ की लाइव फ़ीड। रेक बदलने या कोच जोड़ने/हटाने के कारण वास्तविक कोच क्रम तिथि के अनुसार बदल सकता है। उत्पादन संस्करण हेतु CRIS (केंद्रीकृत रेलवे सूचना प्रणाली) या लाइसेंस प्राप्त रेल-डेटा एपीआई से प्रतिदिन अपडेट होने वाला डेटा आवश्यक है।",
    labelLoco: "इंजन",
    labelPower: "पावर कार",
    labelGuard: "गार्ड / ब्रेक वैन",
    labelLuggage: "लगेज / पार्सल वैन",
    labelGeneral: "जनरल (अनारक्षित)",
    labelSleeper: "स्लीपर क्लास",
    labelAc3: "एसी 3 टियर",
    labelAc2: "एसी 2 टियर",
    labelAc1: "एसी फर्स्ट क्लास",
    labelPantry: "पैंट्री कार",
    helpModalTitle: "सहायता एवं समर्थन",
    helpFaq1Q: "मैं अपनी ट्रेन का लाइव ETA कैसे देखूँ?",
    helpFaq1A: "\"लाइव ETA\" टैब पर जाएँ, अपना ट्रेन नंबर या नाम टाइप करें, और लाइव ETA देखें दबाएँ। नमूना ट्रेन में से एक आज़माएँ।",
    helpFaq2Q: "क्या यहाँ दिखाया गया डेटा वास्तविक है?",
    helpFaq2A: "यह स्मार्ट इंडिया हैकाथॉन 2026 का एक प्रोटोटाइप है। दिखाया गया ETA, शेड्यूल, पीएनआर और कोच डेटा डिज़ाइन दर्शाने हेतु डेमो/संदर्भ मान हैं — यह लाइव आधिकारिक डेटा नहीं है।",
    helpFaq3Q: "वास्तविक रेलवे शिकायतों हेतु मैं किससे संपर्क करूँ?",
    helpFaq3A: "आधिकारिक सहायता हेतु रेल मदद का उपयोग करें, 139 (सुरक्षा/चिकित्सा) पर कॉल करें, या हेडर में NTES/IRCTC लिंक देखें।",
    helpContactTitle: "और सहायता चाहिए?",
    footerTagline: "भारतीय रेल की कोचिंग ट्रेनों के लिए रीयल-टाइम, डेटा-संचालित ETA पूर्वानुमान हेतु स्मार्ट इंडिया हैकाथॉन 2026 प्रोटोटाइप।",
    footerQuickLinks: "त्वरित लिंक",
    footerNTES: "एनटीईएस — राष्ट्रीय ट्रेन पूछताछ",
    footerPunctuality: "क्षेत्रवार समय-पालन",
    footerDataIntegration: "डेटा और एकीकरण",
    footerApiDocs: "सार्वजनिक एपीआई दस्तावेज़",
    footerControlRoom: "कंट्रोल रूम डैशबोर्ड",
    footerStationDisplay: "स्टेशन डिस्प्ले फ़ीड",
    footerPrivacy: "गोपनीयता और शर्तें",
    footerBottom: "स्मार्ट इंडिया हैकाथॉन 2026 के लिए प्रोटोटाइप यूआई · यह भारतीय रेल का आधिकारिक उत्पाद नहीं है"
  },

  bn: {
    brandTitle: "গতিদৃষ্টি",
    brandSubtitle: "কানেক্টিং ইন্ডিয়া, অন টাইম।",
    navNTES: "এনটিইএস",
    navIRCTC: "আইআরসিটিসি",
    navRailMadad: "রেল মদদ",
    navHelp: "সহায়তা",
    helplineCall: "139 নম্বরে কল করুন",
    helplineSub: "সুরক্ষা/চিকিৎসা সহায়তার জন্য",
    heroKicker: "ডাইনামিক ETA পূর্বাভাস",
    heroTitle: "জেনে নিন আপনার ট্রেন কখন পৌঁছাবে",
    heroSubtitle: "কোচিং ট্রেনের জন্য লাইভ, স্বয়ংক্রিয়ভাবে আপডেট হওয়া ETA পূর্বাভাস — রিয়েল-টাইম অবস্থান, সিগন্যালিং ও ঐতিহাসিক তথ্যের উপর ভিত্তি করে।",
    tabEta: "লাইভ ETA",
    tabPnr: "পিএনআর স্ট্যাটাস",
    tabSchedule: "ট্রেন সময়সূচী",
    tabCoach: "কোচ পজিশন",
    searchPlaceholder: "ট্রেন নম্বর বা নাম লিখুন (যেমন, 12951, রাজধানী এক্সপ্রেস)",
    searchBtn: "লাইভ ETA দেখুন",
    pnrPlaceholder: "10-সংখ্যার পিএনআর নম্বর লিখুন",
    pnrBtn: "পিএনআর স্ট্যাটাস চেক করুন",
    schedulePlaceholder: "সম্পূর্ণ সময়সূচীর জন্য ট্রেন নম্বর বা নাম লিখুন",
    scheduleBtn: "সময়সূচী দেখুন",
    coachPlaceholder: "কোচ পজিশন দেখতে ট্রেন নম্বর লিখুন (যেমন, 12951)",
    coachBtn: "কোচ পজিশন দেখুন",
    tryLabel: "উপলব্ধ ট্রেন — চেষ্টা করতে ক্লিক করুন:",
    tryPnrLabel: "এই পিএনআরগুলি চেষ্টা করুন:",
    myTrains: "আমার ট্রেন",
    recentSearches: "সাম্প্রতিক অনুসন্ধান",
    heroNote: "ডেটা উৎস: জিপিএস ফিড, সিগন্যাল অ্যাসপেক্ট, ঐতিহাসিক বিলম্ব প্যাটার্ন, আবহাওয়া ও যানজট তথ্য।",
    emptyState: "আপনার ট্রেনের লাইভ ETA, বিলম্বের অবস্থা এবং রুট টাইমলাইন দেখতে উপরে অনুসন্ধান করুন।",
    emptyStatePnr: "বুকিং স্ট্যাটাস দেখতে উপরে 10-সংখ্যার পিএনআর নম্বর লিখুন।",
    emptyStateSchedule: "সম্পূর্ণ স্টেশন-ভিত্তিক সময়সূচী দেখতে উপরে ট্রেন নম্বর বা নাম লিখুন।",
    emptyStateCoach: "ইঞ্জিন থেকে কোচের ক্রম দেখতে উপরে ট্রেন নম্বর লিখুন।",
    fetching: "এর জন্য লাইভ ETA আনা হচ্ছে",
    notFound: "এর জন্য কোনো লাইভ তথ্য পাওয়া যায়নি",
    notFoundHint: "12951, 12301, 12259, 22503 বা 12521 এর মতো একটি ট্রেন নম্বর চেষ্টা করুন (শুধু ডেমো তথ্য)।",
    pnrInvalid: "অনুগ্রহ করে একটি বৈধ 10-সংখ্যার পিএনআর নম্বর লিখুন।",
    pnrLookupFor: "পিএনআর অনুসন্ধান —",
    pnrLabel: "পিএনআর",
    pnrDemoOnlyText: "এই পিএনআরটি আমাদের ডেমো ডেটাসেটে নেই। নিচে দেখানো 5টি নমুনা পিএনআরের মধ্যে একটি চেষ্টা করুন।",
    pnrDemoNote: "এটি এই প্রোটোটাইপের জন্য তৈরি ডেমো পিএনআর তথ্য (৫টি নমুনা পিএনআর, যা নিশ্চিত, ওয়েটিং লিস্ট, আরএসি এবং বাতিল অবস্থা দেখায়)। প্রকৃত পিএনআর স্ট্যাটাসের জন্য একটি লাইসেন্সপ্রাপ্ত আইআরসিটিসি/সিআরআইএস-সংযুক্ত ডেটা উৎস প্রয়োজন — এর জন্য কোনো নিখরচায় সরকারি পাবলিক এপিআই নেই।",
    pnrStatusCnf: "নিশ্চিত",
    pnrStatusWl: "ওয়েটিং লিস্ট",
    pnrStatusRac: "আরএসি",
    pnrStatusCan: "বাতিল",
    pnrFrom: "থেকে",
    pnrTo: "পর্যন্ত",
    pnrDate: "যাত্রার তারিখ",
    pnrClass: "শ্রেণী",
    pnrCoach: "কোচ",
    pnrSeat: "সিট / বার্থ",
    pnrPassengers: "যাত্রী",
    pnrChart: "চার্ট স্ট্যাটাস",
    nextStationEta: "পরবর্তী স্টেশনের ETA",
    destinationEta: "গন্তব্যের ETA",
    updated: "আপডেট হয়েছে",
    upcomingStations: "আগামী স্টেশনসমূহ",
    routeOverview: "রুট ওভারভিউ",
    activeAlerts: "সক্রিয় সতর্কতা",
    punctuality30: "ঐতিহাসিক সময়ানুবর্তিতা (গত ৩০ দিন)",
    punctualityText: "গত ৩০ দিনের মধ্যে {pct}% দিন গন্তব্যে সময়মতো পৌঁছেছে।",
    actions: "কার্যক্রম",
    setAlert: "আগমন সতর্কতা সেট করুন",
    shareEta: "ETA শেয়ার করুন",
    showOnMap: "মানচিত্রে দেখুন",
    mapModalTitle: "লাইভ রুট মানচিত্র",
    legendCovered: "অতিক্রান্ত দূরত্ব",
    legendRemaining: "অবশিষ্ট দূরত্ব",
    legendLive: "লাইভ অবস্থান",
    mapDataNote: "এখানে দেখানো স্টেশন স্থানাংক ও লাইভ অবস্থান এই প্রোটোটাইপের জন্য ডেমো তথ্য ব্যবহার করে। একটি প্রোডাকশন সংস্করণের জন্য লাইসেন্সপ্রাপ্ত GNSS/RTIS ফিড বা NTES-সমতুল্য লাইভ পজিশন উৎস প্রয়োজন।",
    onTime: "সময়মতো",
    runningLate: "{min} মিনিট বিলম্বে চলছে",
    confHigh: "উচ্চ নির্ভরযোগ্যতা",
    confMedium: "মধ্যম নির্ভরযোগ্যতা",
    confLow: "নিম্ন নির্ভরযোগ্যতা",
    platformShort: "প্ল্যাটফর্ম",
    platformConfirmed: "নিশ্চিত প্ল্যাটফর্ম",
    platformExpected: "সম্ভাব্য — পরিবর্তন হতে পারে",
    runsOn: "চলে",
    schedStation: "স্টেশন",
    schedArr: "আগমন",
    schedDep: "প্রস্থান",
    schedDay: "দিন",
    schedDist: "দূরত্ব",
    schedPlatform: "প্ল্যাটফর্ম",
    scheduleDemoBadge: "ডেমো সময়সূচী",
    scheduleDataNote: "দেখানো স্টেশনের নাম, সময়, দূরত্ব এবং প্ল্যাটফর্ম এই প্রোটোটাইপের জন্য তৈরি ডেমো তথ্য, যা সাধারণত প্রকাশিত সময়সূচীর উপর ভিত্তি করে তৈরি। একটি প্রোডাকশন সংস্করণের জন্য data.gov.in-এর ভারতীয় রেল সময়সূচী ডেটাসেট বা লাইসেন্সপ্রাপ্ত সময়সূচী এপিআই থেকে তথ্য প্রয়োজন, যা রিয়েল-টাইম আপডেটের সাথে বর্তমান থাকে।",
    coachDemoBadge: "আদর্শ কম্পোজিশন — ডেমো তথ্য",
    coachDirectionHint: "কোচের ক্রম ইঞ্জিন থেকে গার্ড ভ্যান (সর্বশেষ কোচ) পর্যন্ত দেখানো হয়েছে।",
    coachDataNote: "এটি এই ট্রেন শ্রেণীর সাধারণ/আদর্শ কোচ কম্পোজিশন দেখাচ্ছে, প্রতিদিনের লাইভ ফিড নয়। রেক পরিবর্তন বা কোচ সংযোজন/বিয়োজনের কারণে বাস্তব কোচ ক্রম তারিখ অনুযায়ী পরিবর্তিত হতে পারে। একটি প্রোডাকশন সংস্করণের জন্য CRIS (কেন্দ্রীভূত রেলওয়ে তথ্য ব্যবস্থা) বা লাইসেন্সপ্রাপ্ত রেল-ডেটা এপিআই থেকে প্রতিদিন আপডেট হওয়া তথ্য প্রয়োজন।",
    labelLoco: "ইঞ্জিন",
    labelPower: "পাওয়ার কার",
    labelGuard: "গার্ড / ব্রেক ভ্যান",
    labelLuggage: "লাগেজ / পার্সেল ভ্যান",
    labelGeneral: "জেনারেল (অসংরক্ষিত)",
    labelSleeper: "স্লিপার ক্লাস",
    labelAc3: "এসি 3 টায়ার",
    labelAc2: "এসি 2 টায়ার",
    labelAc1: "এসি ফার্স্ট ক্লাস",
    labelPantry: "প্যান্ট্রি কার",
    helpModalTitle: "সহায়তা ও সমর্থন",
    helpFaq1Q: "আমি কীভাবে আমার ট্রেনের লাইভ ETA চেক করব?",
    helpFaq1A: "\"লাইভ ETA\" ট্যাবে যান, আপনার ট্রেন নম্বর বা নাম লিখুন, এবং লাইভ ETA দেখুন চাপুন। নমুনা ট্রেনগুলির একটি চেষ্টা করুন।",
    helpFaq2Q: "এখানে দেখানো তথ্য কি বাস্তব?",
    helpFaq2A: "এটি একটি স্মার্ট ইন্ডিয়া হ্যাকাথন ২০২৬ প্রোটোটাইপ। দেখানো ETA, সময়সূচী, পিএনআর এবং কোচ তথ্য ডিজাইন প্রদর্শনের জন্য ডেমো/রেফারেন্স মান — এটি লাইভ অফিসিয়াল তথ্য নয়।",
    helpFaq3Q: "প্রকৃত রেলওয়ে অভিযোগের জন্য আমি কার সাথে যোগাযোগ করব?",
    helpFaq3A: "অফিসিয়াল সহায়তার জন্য রেল মদদ ব্যবহার করুন, 139 (সুরক্ষা/চিকিৎসা) নম্বরে কল করুন, অথবা হেডারে NTES/IRCTC লিংক দেখুন।",
    helpContactTitle: "আরও সহায়তা প্রয়োজন?",
    footerTagline: "ভারতীয় রেলের কোচিং ট্রেনের জন্য রিয়েল-টাইম, তথ্য-চালিত ETA পূর্বাভাসের জন্য স্মার্ট ইন্ডিয়া হ্যাকাথন ২০২৬ প্রোটোটাইপ।",
    footerQuickLinks: "কুইক লিংক",
    footerNTES: "এনটিইএস — জাতীয় ট্রেন অনুসন্ধান",
    footerPunctuality: "অঞ্চল-ভিত্তিক সময়ানুবর্তিতা",
    footerDataIntegration: "তথ্য ও ইন্টিগ্রেশন",
    footerApiDocs: "পাবলিক এপিআই ডকুমেন্টেশন",
    footerControlRoom: "কন্ট্রোল রুম ড্যাশবোর্ড",
    footerStationDisplay: "স্টেশন ডিসপ্লে ফিড",
    footerPrivacy: "প্রাইভেসি ও শর্তাবলী",
    footerBottom: "স্মার্ট ইন্ডিয়া হ্যাকাথন ২০২৬-এর জন্য প্রোটোটাইপ ইউআই · এটি ভারতীয় রেলের অফিসিয়াল পণ্য নয়"
  }
};

let currentLang = "en";

function t(key, vars) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  let str = dict[key] !== undefined ? dict[key] : (TRANSLATIONS.en[key] || key);
  if (vars) {
    Object.keys(vars).forEach((k) => { str = str.replace(`{${k}}`, vars[k]); });
  }
  return str;
}

function applyStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key] !== undefined) {
      el.textContent = TRANSLATIONS[currentLang][key];
    } else if (TRANSLATIONS.en[key] !== undefined) {
      el.textContent = TRANSLATIONS.en[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", t(key));
  });

  document.documentElement.lang = currentLang;

  const bodyFontClass = currentLang === "hi" ? "font-devanagari" : (currentLang === "bn" ? "font-bengali" : "");
  document.body.classList.remove("font-devanagari", "font-bengali");
  if (bodyFontClass) document.body.classList.add(bodyFontClass);
}

function setLanguage(langCode) {
  if (!TRANSLATIONS[langCode]) return;
  currentLang = langCode;
  localStorage.setItem("eta_lang", langCode);
  applyStaticTranslations();

  const labelMap = { en: "EN", hi: "हि", bn: "বাং" };
  const label = document.getElementById("langCurrentLabel");
  if (label) label.textContent = labelMap[langCode] || langCode.toUpperCase();

  if (typeof window.rerenderCurrentResult === "function") {
    window.rerenderCurrentResult();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("eta_lang");
  if (saved && TRANSLATIONS[saved]) currentLang = saved;
  applyStaticTranslations();

  const labelMap = { en: "EN", hi: "हि", bn: "বাং" };
  const label = document.getElementById("langCurrentLabel");
  if (label) label.textContent = labelMap[currentLang] || currentLang.toUpperCase();

  const langBtn = document.getElementById("langBtn");
  const langDropdown = document.getElementById("langDropdown");

  langBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    langDropdown.classList.toggle("open");
  });

  langDropdown.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      setLanguage(li.getAttribute("data-lang"));
      langDropdown.classList.remove("open");
    });
  });

  document.addEventListener("click", () => {
    langDropdown.classList.remove("open");
  });
});
