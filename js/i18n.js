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
    navPNR: "PNR Status",
    navSchedule: "Train Schedule",
    helplineCall: "CALL 139",
    helplineSub: "for security/medical assistance",
    heroKicker: "Dynamic ETA Forecast",
    heroTitle: "Know exactly when your train will arrive",
    heroSubtitle: "Live, self-updating ETA predictions for coaching trains — powered by real-time location, signalling and historical running data.",
    tabEta: "Live ETA",
    tabPnr: "PNR Status",
    tabSchedule: "Train Schedule",
    searchPlaceholder: "Enter Train No. or Name (e.g., 12951, Rajdhani Express)",
    searchBtn: "Get Live ETA",
    pnrPlaceholder: "Enter 10-digit PNR Number",
    pnrBtn: "Check PNR Status",
    schedulePlaceholder: "Enter Train No. or Name for full timetable",
    scheduleBtn: "View Schedule",
    tryLabel: "Try:",
    myTrains: "My Trains",
    recentSearches: "Recent Searches",
    heroNote: "Data sources: GPS feeds, signal aspects, historical delay patterns, weather & congestion data.",
    emptyState: "Search a train above to see its live dynamic ETA, delay status and route timeline.",
    emptyStatePnr: "Enter a 10-digit PNR number above to check booking status.",
    emptyStateSchedule: "Enter a train number or name above to view its full station-wise timetable.",
    fetching: "Fetching live ETA for",
    notFound: "No live data found for",
    notFoundHint: "Try a train number like 12951, 12301 or 12259 (demo data only).",
    pnrInvalid: "Please enter a valid 10-digit PNR number.",
    pnrLookupFor: "PNR Lookup —",
    pnrNotConnectedText: "This prototype does not fabricate PNR results. There is no free official public API for PNR status — real-time PNR data sits behind IRCTC's paid agent access or licensed third-party APIs.",
    pnrOption1: "Option A: Integrate a licensed third-party PNR API (e.g. an IRCTC-authorized provider) — requires a paid API key.",
    pnrOption2: "Option B: Apply for official IRCTC/CRIS agent access (requires agreement + certificate).",
    pnrOption3: "Option C: For the hackathon demo only, simulate PNR responses clearly labeled as simulated — never as live data.",
    scheduleLookupFor: "Schedule Lookup —",
    scheduleNotConnectedText: "This prototype does not fabricate train timetables. Indian Railways publishes a timetable dataset on data.gov.in, but it is a static downloadable file, not a live query API.",
    scheduleOption1: "Option A: Download the data.gov.in Indian Railways Time Table dataset and serve it from your own backend/database.",
    scheduleOption2: "Option B: Integrate a licensed third-party schedule API for always-current data.",
    noDataFabricated: "No data fabricated — awaiting real source",
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
    navPNR: "पीएनआर स्थिति",
    navSchedule: "ट्रेन शेड्यूल",
    helplineCall: "139 पर कॉल करें",
    helplineSub: "सुरक्षा/चिकित्सा सहायता के लिए",
    heroKicker: "डायनामिक ETA पूर्वानुमान",
    heroTitle: "जानिए आपकी ट्रेन कब पहुँचेगी",
    heroSubtitle: "कोचिंग ट्रेनों के लिए लाइव, स्वतः-अपडेट होने वाला ETA पूर्वानुमान — रीयल-टाइम लोकेशन, सिग्नलिंग और ऐतिहासिक डेटा पर आधारित।",
    tabEta: "लाइव ETA",
    tabPnr: "पीएनआर स्थिति",
    tabSchedule: "ट्रेन शेड्यूल",
    searchPlaceholder: "ट्रेन नंबर या नाम दर्ज करें (जैसे, 12951, राजधानी एक्सप्रेस)",
    searchBtn: "लाइव ETA देखें",
    pnrPlaceholder: "10 अंकों का पीएनआर नंबर दर्ज करें",
    pnrBtn: "पीएनआर स्थिति जांचें",
    schedulePlaceholder: "पूर्ण समय-सारिणी हेतु ट्रेन नंबर या नाम दर्ज करें",
    scheduleBtn: "शेड्यूल देखें",
    tryLabel: "उदाहरण:",
    myTrains: "मेरी ट्रेनें",
    recentSearches: "हाल की खोजें",
    heroNote: "डेटा स्रोत: जीपीएस फीड, सिग्नल पहलू, ऐतिहासिक विलंब पैटर्न, मौसम और भीड़भाड़ डेटा।",
    emptyState: "अपनी ट्रेन का लाइव ETA, विलंब स्थिति और रूट टाइमलाइन देखने के लिए ऊपर खोजें।",
    emptyStatePnr: "बुकिंग स्थिति जांचने के लिए ऊपर 10 अंकों का पीएनआर नंबर दर्ज करें।",
    emptyStateSchedule: "पूरी स्टेशन-वार समय-सारिणी देखने के लिए ऊपर ट्रेन नंबर या नाम दर्ज करें।",
    fetching: "के लिए लाइव ETA प्राप्त किया जा रहा है",
    notFound: "के लिए कोई लाइव डेटा नहीं मिला",
    notFoundHint: "12951, 12301 या 12259 जैसा ट्रेन नंबर आज़माएँ (केवल डेमो डेटा)।",
    pnrInvalid: "कृपया मान्य 10 अंकों का पीएनआर नंबर दर्ज करें।",
    pnrLookupFor: "पीएनआर खोज —",
    pnrNotConnectedText: "यह प्रोटोटाइप पीएनआर परिणाम नहीं बनाता। पीएनआर स्थिति के लिए कोई निःशुल्क आधिकारिक सार्वजनिक एपीआई नहीं है — रीयल-टाइम डेटा आईआरसीटीसी के सशुल्क एजेंट एक्सेस या लाइसेंस प्राप्त तृतीय-पक्ष एपीआई के पीछे है।",
    pnrOption1: "विकल्प A: लाइसेंस प्राप्त तृतीय-पक्ष पीएनआर एपीआई जोड़ें — सशुल्क एपीआई कुंजी आवश्यक।",
    pnrOption2: "विकल्प B: आधिकारिक आईआरसीटीसी/सीआरआईएस एजेंट एक्सेस हेतु आवेदन करें।",
    pnrOption3: "विकल्प C: केवल हैकाथॉन डेमो हेतु, स्पष्ट रूप से 'सिम्युलेटेड' लेबल किए गए पीएनआर परिणाम दिखाएँ — कभी लाइव डेटा के रूप में नहीं।",
    scheduleLookupFor: "शेड्यूल खोज —",
    scheduleNotConnectedText: "यह प्रोटोटाइप ट्रेन समय-सारिणी नहीं बनाता। भारतीय रेल data.gov.in पर एक समय-सारिणी डेटासेट प्रकाशित करता है, लेकिन यह एक स्थिर डाउनलोड योग्य फ़ाइल है, लाइव क्वेरी एपीआई नहीं।",
    scheduleOption1: "विकल्प A: data.gov.in से भारतीय रेल समय-सारिणी डेटासेट डाउनलोड करें और अपने बैकएंड/डेटाबेस से सर्व करें।",
    scheduleOption2: "विकल्प B: सदैव अद्यतन डेटा हेतु लाइसेंस प्राप्त तृतीय-पक्ष शेड्यूल एपीआई जोड़ें।",
    noDataFabricated: "कोई डेटा नहीं बनाया गया — वास्तविक स्रोत की प्रतीक्षा",
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
    navPNR: "পিএনআর স্ট্যাটাস",
    navSchedule: "ট্রেন সময়সূচী",
    helplineCall: "139 নম্বরে কল করুন",
    helplineSub: "সুরক্ষা/চিকিৎসা সহায়তার জন্য",
    heroKicker: "ডাইনামিক ETA পূর্বাভাস",
    heroTitle: "জেনে নিন আপনার ট্রেন কখন পৌঁছাবে",
    heroSubtitle: "কোচিং ট্রেনের জন্য লাইভ, স্বয়ংক্রিয়ভাবে আপডেট হওয়া ETA পূর্বাভাস — রিয়েল-টাইম অবস্থান, সিগন্যালিং ও ঐতিহাসিক তথ্যের উপর ভিত্তি করে।",
    tabEta: "লাইভ ETA",
    tabPnr: "পিএনআর স্ট্যাটাস",
    tabSchedule: "ট্রেন সময়সূচী",
    searchPlaceholder: "ট্রেন নম্বর বা নাম লিখুন (যেমন, 12951, রাজধানী এক্সপ্রেস)",
    searchBtn: "লাইভ ETA দেখুন",
    pnrPlaceholder: "10-সংখ্যার পিএনআর নম্বর লিখুন",
    pnrBtn: "পিএনআর স্ট্যাটাস চেক করুন",
    schedulePlaceholder: "সম্পূর্ণ সময়সূচীর জন্য ট্রেন নম্বর বা নাম লিখুন",
    scheduleBtn: "সময়সূচী দেখুন",
    tryLabel: "উদাহরণ:",
    myTrains: "আমার ট্রেন",
    recentSearches: "সাম্প্রতিক অনুসন্ধান",
    heroNote: "ডেটা উৎস: জিপিএস ফিড, সিগন্যাল অ্যাসপেক্ট, ঐতিহাসিক বিলম্ব প্যাটার্ন, আবহাওয়া ও যানজট তথ্য।",
    emptyState: "আপনার ট্রেনের লাইভ ETA, বিলম্বের অবস্থা এবং রুট টাইমলাইন দেখতে উপরে অনুসন্ধান করুন।",
    emptyStatePnr: "বুকিং স্ট্যাটাস দেখতে উপরে 10-সংখ্যার পিএনআর নম্বর লিখুন।",
    emptyStateSchedule: "সম্পূর্ণ স্টেশন-ভিত্তিক সময়সূচী দেখতে উপরে ট্রেন নম্বর বা নাম লিখুন।",
    fetching: "এর জন্য লাইভ ETA আনা হচ্ছে",
    notFound: "এর জন্য কোনো লাইভ তথ্য পাওয়া যায়নি",
    notFoundHint: "12951, 12301 বা 12259 এর মতো একটি ট্রেন নম্বর চেষ্টা করুন (শুধু ডেমো তথ্য)।",
    pnrInvalid: "অনুগ্রহ করে একটি বৈধ 10-সংখ্যার পিএনআর নম্বর লিখুন।",
    pnrLookupFor: "পিএনআর অনুসন্ধান —",
    pnrNotConnectedText: "এই প্রোটোটাইপ পিএনআর ফলাফল তৈরি করে না। পিএনআর স্ট্যাটাসের জন্য কোনো নিখরচায় সরকারি পাবলিক এপিআই নেই — রিয়েল-টাইম তথ্য আইআরসিটিসির পেইড এজেন্ট অ্যাক্সেস বা লাইসেন্সপ্রাপ্ত তৃতীয়-পক্ষ এপিআইয়ের আড়ালে থাকে।",
    pnrOption1: "অপশন A: একটি লাইসেন্সপ্রাপ্ত তৃতীয়-পক্ষ পিএনআর এপিআই যুক্ত করুন — পেইড এপিআই কী প্রয়োজন।",
    pnrOption2: "অপশন B: অফিসিয়াল আইআরসিটিসি/সিআরআইএস এজেন্ট অ্যাক্সেসের জন্য আবেদন করুন।",
    pnrOption3: "অপশন C: শুধুমাত্র হ্যাকাথন ডেমোর জন্য, স্পষ্টভাবে 'সিমুলেটেড' লেবেলযুক্ত পিএনআর ফলাফল দেখান — কখনও লাইভ তথ্য হিসেবে নয়।",
    scheduleLookupFor: "সময়সূচী অনুসন্ধান —",
    scheduleNotConnectedText: "এই প্রোটোটাইপ ট্রেনের সময়সূচী তৈরি করে না। ভারতীয় রেল data.gov.in-এ একটি সময়সূচী ডেটাসেট প্রকাশ করে, কিন্তু এটি একটি স্ট্যাটিক ডাউনলোডযোগ্য ফাইল, লাইভ কোয়েরি এপিআই নয়।",
    scheduleOption1: "অপশন A: data.gov.in থেকে ভারতীয় রেল সময়সূচী ডেটাসেট ডাউনলোড করুন এবং নিজের ব্যাকএন্ড/ডেটাবেস থেকে পরিবেশন করুন।",
    scheduleOption2: "অপশন B: সর্বদা আপ-টু-ডেট তথ্যের জন্য একটি লাইসেন্সপ্রাপ্ত তৃতীয়-পক্ষ সময়সূচী এপিআই যুক্ত করুন।",
    noDataFabricated: "কোনো তথ্য তৈরি করা হয়নি — বাস্তব উৎসের অপেক্ষায়",
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
