
import { useNavigate } from 'react-router-dom';
import {
  useState, useEffect, useRef, useCallback, useMemo, memo
} from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, ReferenceLine, Legend
} from "recharts";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import TutorialModal from './TutorialModal';


// Fix Leaflet default marker icons broken by webpack/bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api` 
  : "/api";

const WS_BASE = process.env.REACT_APP_WS_URL 
  ? process.env.REACT_APP_WS_URL 
  : (window.__NIHSA_WS__ || "ws://localhost:8001");

const ATLAS_BASE = process.env.REACT_APP_NFFS_ATLAS 
  ? process.env.REACT_APP_NFFS_ATLAS
  : "https://nihsadocuments.com/nffs/atlas";
  
// ─── i18n TRANSLATION SYSTEM ──────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    map:'Map', dashboard:'Dashboard', forecast:'AI Forecast',
    marshals:'Flood Marshals', assistant:'AI Assistant', alerts:'Alerts',
    signIn:'Sign In', register:'Register', continueGuest:'Continue as Guest',
    email:'Email address', password:'Password', fullName:'Full Name',
    forgotPassword:'Forgot Password?', createAccount:'Create Account',
    iAmFloodMarshal:'I am a Flood Marshal',
    marshalPending:'Marshal status pending verification by NIHSA',
    signInGoogle:'Continue with Google',
    searchPlaceholder:'Search community, LGA, state or landmark...',
    search:'Search', reportFlood:'Report Flood',
    floodOutlook:'Flood Outlook — Next 7 Days',
    peakExpected:'Peak expected', whatToDo:'What you should do',
    noFloodRisk:'No flood risk at this time',
    NONE:'Normal', WATCH:'Watch', WARNING:'Warning', SEVERE:'Severe', EXTREME:'Extreme',
    evacuateNow:'EVACUATE NOW if you are near the river.',
    moveValuables:'Move valuables to higher ground.',
    stayAlert:'Monitor NIHSA updates. Avoid travel near rivers.',
    noAction:'No action needed. Stay informed.',
    chatPlaceholder:'Send a message...',
    viewOnly:'You can read messages. Sign in to participate.',
    send:'Send', floodDepth:'Estimated flood depth',
    description:'Describe what you see',
    submitReport:'Submit Report', reportSuccess:'Report submitted. Thank you!',
    liveAlerts:'LIVE ALERTS', allBasins:'All Monitored Stations',
    lagdoActive:'Lagdo Dam Release Active',
    simulationMode:'SIMULATION MODE — model validation in progress',
    liveMode:'LIVE — NFFS MODEL OUTPUT',
    channels:'Channels', secureNetwork:'Secure Flood Marshals Network',
    activeAlerts:'Active Alerts', basinsMonitored:'Basins Monitored',
    gaugesOnline:'Gauges Online', stationsKPI:'Stations',
    fieldReports:'Field Reports', peopleDisplaced:'People Displaced',
    activeFloodAlerts:'Active Flood Alerts', noAlerts:'No active alerts at this time',
    liveGaugeReadings:'Live Gauge Readings', mapLayers:'Map Layers', legend:'Legend',
    stationsLayer:'Stations', lstmGauges:'LSTM Gauges', reportFloodBtn:'Report Flood',
    signInNetwork:'Sign in to view messages and participate in the Flood Marshals coordination network.',
    searchBtn:'Search', signOut:'Sign out', tapToZoom:'Tap to zoom to location',
    askPlaceholder:'Ask about flood risk, gauges, forecasts, emergency procedures...',
    askBtn:'Ask', analysingData:'Analysing flood data…',
    affectedLGAs:'Affected LGAs', recommendedActions:'Recommended Actions',
    noAlertsNormal:'No active alerts at this time. All river levels within normal range.',
    lagdoWarning:'Lagdo Dam Release Active',
    lagdoDesc:'Water released upstream in Cameroon is flowing downstream. It will reach this station within 2–3 days, significantly raising flood risk.',
    active:'Active', sevenDayOutlook:'7-Day Outlook', annualOutlook:'Annual Outlook',
    alert_templates: {
      'Verified Flood Report': 'Verified Flood Report',
      'Flood Warning': 'Flood Warning',
      'River': 'River',
      'rising': 'rising',
      'at': 'at',
      'critical': 'critical',
      'meters': 'meters',
      'evacuation': 'evacuation',
      'advised': 'advised',
      'flooding': 'flooding',
      'expected': 'expected',
      'heavy': 'heavy',
      'rainfall': 'rainfall',
      'alert': 'alert',
      'watch': 'watch',
      'warning': 'warning',
      'severe': 'severe',
      'extreme': 'extreme',
      'normal': 'normal',
    },
    mapLayers: 'Map Layers',
    annualForecast: 'Annual Forecast — AFO 2026',
    annualForecastDesc: 'Annual Flood Outlook maps & model outputs — Full year forecast',
    floodAnimation: 'Flood Animation 2026',
    floodExtentDepth: 'Flood Extent & Depth',
    populationAtRisk: 'Population at Risk',
    communitiesAtRisk: 'Communities at Risk',
    healthFacilities: 'Health Facilities',
    schoolsAtRisk: 'Schools at Risk',
    farmlandExposure: 'Farmland Exposure',
    roadNetworkAtRisk: 'Road Network at Risk',
    surfaceWater: 'Surface Water',
    surfaceWaterDesc: 'Real-time river levels, alerts & flood reports',
    riverGaugeStations: 'River Gauge Stations (358)',
    activeFloodAlertsLayer: 'Active Flood Alerts',
    citizenFloodReports: 'Citizen Flood Reports',
    satelliteFloodExtent: 'Satellite Flood Extent',
    stationSituationUpdates: 'Station Situation Updates',
    weeklyForecast: 'Weekly Forecast',
    weeklyForecastDesc: '7-day flood outlook — upload weekly CSV data via Admin',
    groundwater: 'Groundwater',
    groundwaterDesc: 'Borehole levels, aquifer & recharge zones',
    groundwaterLevels: 'Groundwater Levels',
    aquiferZones: 'Aquifer Zones',
    rechargeAreas: 'Recharge Areas',
    waterQuality: 'Water Quality',
    waterQualityDesc: 'WQI, turbidity & post-flood contamination risk',
    waterQualityIndex: 'Water Quality Index',
    turbiditySediment: 'Turbidity / Sediment',
    contaminationRiskZones: 'Contamination Risk Zones',
    coastalMarine: 'Coastal & Marine',
    coastalMarineDesc: 'Storm surge, erosion & mangrove buffer zones',
    coastalFloodRisk: 'Coastal Flood Risk',
    stormSurgeZones: 'Storm Surge Zones',
    coastalErosionRisk: 'Coastal Erosion Risk',
    mangroveBufferZones: 'Mangrove Buffer Zones',
    dataComingSoon: 'Data coming soon',
    layerGroupDevelopment: 'This layer group is currently under development. Data will be available in a future NIHSA update.',
    soon: 'SOON',
    allClear: 'ALL CLEAR',
    
    // Dashboard
    floodForecast: 'Flood Forecast',
    annualAFO2026: '📊 Annual (AFO 2026)',
    weekly: '📅 Weekly',
    annualFloodOutlook2026: 'Annual Flood Outlook 2026 — Exposure Summary',
    nffsVersion: 'NFFS v3.0 · 17 exposure layers · Full Year · Issued 15 April 2026',
    allNigeria: 'All Nigeria',
    communities: 'Communities',
    population: 'Population',
    healthCentres: 'Health Centres',
    schools: 'Schools',
    farmland: 'Farmland (ha)',
    roads: 'Roads',
    electricity: 'Electricity',
    markets: 'Markets',
    atRisk: 'at risk',
    stateBreakdown: 'STATE — BREAKDOWN',
    floodAnimationLink: 'Flood Animation',
    floodExtentMap: 'Flood Extent Map',
    atlasDataUnavailable: 'Atlas data unavailable — the backend must be running to load NFFS data',
    noWeeklyForecastData: 'No Weekly Forecast Data',
    weeklyForecastUploadPrompt: 'Weekly forecast layers have not been uploaded yet.',
    goToAdminMapLayers: 'Go to Admin → Map Layers → Weekly Forecast and upload a CSV for each layer.',
    weeklyFloodForecast: 'Weekly Flood Forecast — Exposure Summary',
    current7DayOutlook: 'Current 7-day outlook · Upload new weekly data via Admin',
    breakdown: 'breakdown',
    criticalExtreme: 'Critical / Extreme',
    highRisk: 'High Risk',
    lowRisk: 'Low Risk',
    legend: 'Legend',
    alert: 'Alert',
    
    // Alerts Tab
    nationalAlertHeatmap: 'National Alert Heatmap',
    liveAlertStatus: 'Live alert status across affected states',
    noActiveAlertsAllNormal: 'No active alerts — all states normal',
    normal: 'Normal',
    watch: 'Watch',
    warning: 'Warning',
    severe: 'Severe',
    extreme: 'Extreme',
    allStatesNormal: 'All States Normal',
    statesWithActiveAlerts: 'state(s) with active alerts',
    noActiveFloodAlerts: 'No active flood alerts at this time',
    location: 'Location',
    affectedZone: 'Affected zone',
    radius: 'radius',
    lowRisk: 'Low Risk',
    highRisk: 'High Risk',
    criticalExtreme: 'Critical / Extreme',
    estimatedImpact: 'ESTIMATED IMPACT',
    peopleAtRisk: 'People at risk',
    healthFacilitiesAtRisk: 'Health facilities',
    farmlandAtRisk: 'Farmland',
    roadsAtRisk: 'Roads',

    // Report Modal
    reportFlooding: '🚨 Report Flooding',
    yourLocation: '📍 YOUR LOCATION — DRAG PIN TO ADJUST',
    locationNameCoords: '📍 LOCATION NAME & COORDINATES',
    locationPlaceholder: 'Search community, LGA, landmark, or drag pin on map...',
    waterDepth: '💧 WATER DEPTH (OPTIONAL)',
    selectDepth: 'Select depth...',
    describeWhatYouSee: '📝 DESCRIBE WHAT YOU SEE (OPTIONAL)',
    describePlaceholder: 'Describe the flooding: are roads blocked? Are homes affected? Are people stranded? Any injuries?',
    mediaRequired: '📸 MEDIA — AT LEAST ONE REQUIRED',
    mediaHint: 'You must attach at least one photo, voice recording, or video.',
    takePhoto: 'Take Photo',
    photoAdded: 'Photo added',
    recordVoice: 'Record Voice',
    voiceRecorded: 'Voice recorded',
    tapToStop: 'Tap to stop',
    tapToReRecord: 'Tap to re-record',
    recordVideo: 'Record Video',
    videoAdded: 'Video added',
    recordingInProgress: '🔴 Recording in progress...',
    submitFloodReport: 'Submit Flood Report',
    submitting: 'Submitting...',
    reportReviewNote: 'Reports are reviewed by NIHSA coordinators before publishing',
    reportSubmitted: 'Report Submitted',
    reportSubmittedDesc: 'Your report is now pending verification by NIHSA coordinators. Thank you for helping protect your community.',
    done: 'Done',
    fetchingAddress: 'Fetching address...',
    dragPinHint: '📍 Drag the pin to adjust your exact location',
    mediaRequiredError: 'Please attach at least one photo, voice recording, or video before submitting.',

  },
  ha: {
    criticalExtreme: 'Matsananci / Mai Tsanani',
    highRisk: 'Babban Haɗari',
    lowRisk: 'Ƙananan Haɗari',
    legend: 'Bayani',
    alert: 'Faɗakarwa',
    map:'Taswira', dashboard:'Allon Bayanai', forecast:'Hasashen AI',
    marshals:'Masu Kiyaye Ambaliya', assistant:'Mataimaki na AI', alerts:'Fadakarwa',
    signIn:'Shiga', register:'Yi Rajista', continueGuest:'Ci gaba a matsayin Bako',
    email:'Adireshin Imel', password:'Kalmar Sirri', fullName:'Cikakken Suna',
    forgotPassword:'Manta Kalmar Sirri?', createAccount:'Kirkiri Asusun',
    iAmFloodMarshal:'Ni ne Mai Kiyaye Ambaliya',
    marshalPending:'Ana tabbatar da matsayin Marshal daga NIHSA',
    signInGoogle:'Ci gaba da Google',
    searchPlaceholder:'Nemi al\'umma, LGA, jiha ko wuri...',
    search:'Nemo', reportFlood:'Rahoton Ambaliya',
    floodOutlook:'Hasashen Ambaliya — Kwanaki 7 masu zuwa',
    peakExpected:'Ana sa ran kololuwa', whatToDo:'Abin da ya kamata ku yi',
    noFloodRisk:'Babu hadarin ambaliya a yanzu',
    NONE:'Al\'ada', WATCH:'Kallo', WARNING:'Gargadi', SEVERE:'Mai tsanani', EXTREME:'Mai karfi',
    evacuateNow:'TAFI YANZU idan kuna kusa da kogin.',
    moveValuables:'Dauki kayan daraja zuwa wuri mafi tsayi.',
    stayAlert:'Biyo labarai na NIHSA. Guji tafiya kusa da koguna.',
    noAction:'Babu aiki da ake bukata. Kasance da labari.',
    chatPlaceholder:'Aika sako...', viewOnly:'Kuna iya karanta sakonnni. Shiga don shiga tattaunawar.',
    send:'Aika', floodDepth:'Kimanin zurfin ambaliya',
    description:'Bayyana abin da kuke gani',
    submitReport:'Aika Rahoto', reportSuccess:'An aika rahoto. Na gode!',
    liveAlerts:'FADAKARWA MASU RAI', allBasins:'Dukkan Tashar da ake Sa ido',
    lagdoActive:'An Saki Ruwa daga Madatsar Lagdo',
    simulationMode:'YANAYIN KWAIKWAYO — ana tabbatar da samfurin',
    liveMode:'YANA AIKI — FITARWAR SAMFURIN NFFS',
    channels:'Tasoshin', secureNetwork:'Hanyar Sadarwa ta Tsaro ta Masu Kiyaye Ambaliya',
    activeAlerts:'Fadakarwa Masu Aiki', basinsMonitored:'Kwararun da Ake Kallo',
    gaugesOnline:'Ma\'auna Mai Sadarwa', stationsKPI:'Tashar',
    fieldReports:'Rahotannin Filin', peopleDisplaced:'Mutane da Aka Kore',
    activeFloodAlerts:'Fadakarwar Ambaliya Masu Aiki', noAlerts:'Babu fadakarwa a yanzu',
    liveGaugeReadings:'Ma\'aunin Kogin Masu Rai', mapLayers:'Matakan Taswira', legend:'Bayani',
    stationsLayer:'Tashar', lstmGauges:'Ma\'aunin LSTM', reportFloodBtn:'Rahoton Ambaliya',
    signInNetwork:'Shiga don duba sakonnni da shiga hanyar sadarwa ta Masu Kiyaye Ambaliya.',
    searchBtn:'Nemo', signOut:'Fita', tapToZoom:'Matsa don ganin wurin',
    askPlaceholder:'Tambaya game da haɗarin ambaliya, ma\'auni, hasashe...',
    askBtn:'Tambaya', analysingData:'Ana nazarin bayanan ambaliya…',
    affectedLGAs:'Larduna da Abin Ya Shafa', recommendedActions:'Ayyukan da Ake Bada Shawara',
    noAlertsNormal:'Babu fadakarwa a yanzu. Dukkan koguna suna cikin matakan al\'ada.',
    lagdoWarning:'An Saki Ruwa daga Madatsar Lagdo',
    lagdoDesc:'An saki ruwa daga Kamaru yana zuwa. Zai isa wannan tashar cikin kwanaki 2-3.',
    active:'Aiki', sevenDayOutlook:'Hasashen Kwanaki 7', annualOutlook:'Hasashen Shekara',
    alert_templates: {
      'Verified Flood Report': 'Tabbataccen Rahoton Ambaliya',
      'Flood Warning': 'Gargadin Ambaliya',
      'River': 'Kogi',
      'rising': 'yana tashi',
      'at': 'a',
      'critical': 'mai tsanani',
      'meters': 'mita',
      'evacuation': 'ƙaura',
      'advised': 'an bada shawara',
      'flooding': 'ambaliya',
      'expected': 'ana sa ran',
      'heavy': 'mai yawa',
      'rainfall': 'ruwan sama',
      'alert': 'faɗakarwa',
      'watch': 'kallo',
      'warning': 'gargadi',
      'severe': 'mai tsanani',
      'extreme': 'matsananci',
      'normal': 'al\'ada',
    },
    allClear: 'DUKA LAFIYA',
    mapLayers: 'Matakan Taswira',
    annualForecast: 'Hasashen Shekara — AFO 2026',
    annualForecastDesc: 'Taswirorin Hasashen Ambaliya na Shekara — Cikakken Hasashen Shekara',
    floodAnimation: 'Motsin Ambaliya 2026',
    floodExtentDepth: 'Girman Ambaliya & Zurfi',
    populationAtRisk: 'Yawan Jama\'a da ke Cikin Hatsari',
    communitiesAtRisk: 'Al\'ummomin da ke Cikin Hatsari',
    healthFacilities: 'Cibiyoyin Lafiya',
    schoolsAtRisk: 'Makarantu da ke Cikin Hatsari',
    farmlandExposure: 'Filayen Noma da ke Cikin Hatsari',
    roadNetworkAtRisk: 'Hanyoyi da ke Cikin Hatsari',
    surfaceWater: 'Ruwan Sama',
    surfaceWaterDesc: 'Matakan koguna na lokaci-lokaci, faɗakarwa & rahotannin ambaliya',
    riverGaugeStations: 'Tashoshin Auna Koguna (358)',
    activeFloodAlertsLayer: 'Faɗakarwar Ambaliya Masu Aiki',
    citizenFloodReports: 'Rahotannin Ambaliya na Jama\'a',
    satelliteFloodExtent: 'Girman Ambaliya daga Tauraron Dan Adam',
    stationSituationUpdates: 'Sabunta Halin Tashoshi',
    weeklyForecast: 'Hasashen Mako',
    weeklyForecastDesc: 'Hasashen ambaliya na kwanaki 7 — loda bayanan CSV na mako ta Admin',
    groundwater: 'Ruwan Ƙasa',
    groundwaterDesc: 'Matakan rijiyoyi, wuraren ruwa & wuraren cikawa',
    groundwaterLevels: 'Matakan Ruwan Ƙasa',
    aquiferZones: 'Yankunan Ruwan Ƙasa',
    rechargeAreas: 'Wuraren Cikawa',
    waterQuality: 'Ingancin Ruwa',
    waterQualityDesc: 'WQI, turbidity & haɗarin gurɓata bayan ambaliya',
    waterQualityIndex: 'Ma\'aunin Ingancin Ruwa',
    turbiditySediment: 'Turbidity / Laka',
    contaminationRiskZones: 'Yankunan Haɗarin Gurɓata',
    coastalMarine: 'Teku & Ruwan Gishiri',
    coastalMarineDesc: 'Guguwar ruwa, zaizaye & wuraren mangwaro',
    coastalFloodRisk: 'Haɗarin Ambaliyar Teku',
    stormSurgeZones: 'Yankunan Guguwar Ruwa',
    coastalErosionRisk: 'Haɗarin Zaizayen Teku',
    mangroveBufferZones: 'Yankunan Mangwaro',
    dataComingSoon: 'Bayanai na zuwa nan ba da jimawa',
    layerGroupDevelopment: 'Wannan rukunin yana kan ci gaba. Bayanai za su kasance a sabuntawar NIHSA mai zuwa.',
    soon: 'NAN BA DA JIMAWA',
    
    // Dashboard
    floodForecast: 'Hasashen Ambaliya',
    annualAFO2026: '📊 Shekara (AFO 2026)',
    weekly: '📅 Mako',
    annualFloodOutlook2026: 'Hasashen Ambaliya na Shekara 2026 — Taƙaitaccen Bayani',
    nffsVersion: 'NFFS v3.0 · 17 matakan bayanai · Cikakken Shekara · An Bayar 15 Afrilu 2026',
    allNigeria: 'Dukkan Najeriya',
    communities: 'Al\'ummomi',
    population: 'Yawan Jama\'a',
    healthCentres: 'Cibiyoyin Lafiya',
    schools: 'Makarantu',
    farmland: 'Filayen Noma (ha)',
    roads: 'Hanyoyi',
    electricity: 'Wutar Lantarki',
    markets: 'Kasuwanni',
    atRisk: 'cikin hatsari',
    stateBreakdown: 'JIHA — CIKAKKEN BAYANI',
    floodAnimationLink: 'Motsin Ambaliya',
    floodExtentMap: 'Taswirar Girman Ambaliya',
    atlasDataUnavailable: 'Bayanan Atlas ba su samuwa — dole ne a kunna backend don loda bayanan NFFS',
    noWeeklyForecastData: 'Babu Bayanan Hasashen Mako',
    weeklyForecastUploadPrompt: 'Ba a loda bayanan hasashen mako ba tukuna.',
    goToAdminMapLayers: 'Je zuwa Admin → Map Layers → Weekly Forecast kuma loda CSV ga kowane mataki.',
    weeklyFloodForecast: 'Hasashen Ambaliya na Mako — Taƙaitaccen Bayani',
    current7DayOutlook: 'Hasashen kwanaki 7 na yanzu · Loda sabbin bayanan mako ta Admin',
    breakdown: 'cikakken bayani',
    
    // Alerts Tab
    nationalAlertHeatmap: 'Taswirar Faɗakarwa ta Ƙasa',
    liveAlertStatus: 'Matsayin faɗakarwa kai tsaye a jihohin da abin ya shafa',
    noActiveAlertsAllNormal: 'Babu faɗakarwa masu aiki — duk jihohi na al\'ada',
    normal: 'Al\'ada',
    watch: 'Kallo',
    warning: 'Gargadi',
    severe: 'Mai Tsanani',
    extreme: 'Matsananci',
    allStatesNormal: 'Duk Jihohi na Al\'ada',
    statesWithActiveAlerts: 'jiha/jihohi da ke da faɗakarwa masu aiki',
    noActiveFloodAlerts: 'Babu faɗakarwar ambaliya a wannan lokacin',
    location: 'Wuri',
    affectedZone: 'Yankin da abin ya shafa',
    radius: 'radius',
    lowRisk: 'Ƙananan Haɗari',
    highRisk: 'Babban Haɗari',
    criticalExtreme: 'Matsananci / Mai Tsanani',
    estimatedImpact: 'KIYASI TASIRI',
    peopleAtRisk: 'Mutane cikin hatsari',
    healthFacilitiesAtRisk: 'Cibiyoyin lafiya',
    farmlandAtRisk: 'Filayen noma',
    roadsAtRisk: 'Hanyoyi',
    reportFlooding: '🚨 Rahoton Ambaliya',
    yourLocation: '📍 WURIN DA KUKE — JA PIN DON GYARAWA',
    locationNameCoords: '📍 SUNA NA WURI & COORDINATES',
    locationPlaceholder: 'Nemi al\'umma, LGA, wuri, ko jaka pin akan taswira...',
    waterDepth: '💧 ZURFIN RUWA (BA TILAS BA)',
    selectDepth: 'Zaɓi zurfin...',
    describeWhatYouSee: '📝 BAYYANA ABIN DA KUKE GANI (BA TILAS BA)',
    describePlaceholder: 'Bayyana ambaliya: shin hanyoyi an toshe? Shin gidaje sun shafa? Mutane sun makale? Wani raunin?',
    mediaRequired: '📸 KAFOFIN WATSA LABARAI — A KALLA ƊAYA YA ZAMA DOLE',
    mediaHint: 'Dole ne ku haɗa kalla ɗaya hoto, rikodiyar murya, ko bidiyo.',
    takePhoto: 'Ɗauki Hoto',
    photoAdded: 'An ƙara hoto',
    recordVoice: 'Yi Rikodi',
    voiceRecorded: 'An yi rikodi',
    tapToStop: 'Danna don tsayawa',
    tapToReRecord: 'Danna don sake yin rikodi',
    recordVideo: 'Yi Rikodi Bidiyo',
    videoAdded: 'An ƙara bidiyo',
    recordingInProgress: '🔴 Rikodi yana gudana...',
    submitFloodReport: 'Aika Rahoto na Ambaliya',
    submitting: 'Ana aika...',
    reportReviewNote: 'Masu duba NIHSA na duba rahotanni kafin wallafawa',
    reportSubmitted: 'An Aika Rahoto',
    reportSubmittedDesc: 'Rahoton ku yanzu yana jiran tabbatarwa daga masu duba NIHSA. Na gode don taimakawa wajen kare al\'ummarku.',
    done: 'An Gama',
    fetchingAddress: 'Ana nemo adireshi...',
    dragPinHint: '📍 Ja pin don daidaita wurin ku daidai',
    mediaRequiredError: 'Da fatan za a haɗa kalla ɗaya hoto, rikodiyar murya, ko bidiyo kafin aika.',
  },
  yo: {
    criticalExtreme: 'Líle Koko / Líle',
    highRisk: 'Ewu Gíga',
    lowRisk: 'Ewu Kékeré',
    legend: 'Àlàyé',
    alert: 'Ìkìlọ̀',
    map:'Maapu', dashboard:'Paali Alaye', forecast:'Asotele AI',
    marshals:'Awon Oluso Iṣan-omi', assistant:'Oluranlowo AI', alerts:'Ifokanbalẹ',
    signIn:'Wole', register:'Forukosile', continueGuest:'Tesiwaju bi Alejo',
    email:'Adiresi Imeeli', password:'Ọrọigbaniwọle', fullName:'Oruko Kikun',
    forgotPassword:'Gbagbe Ọrọigbaniwọle?', createAccount:'Sẹda Akoọle',
    iAmFloodMarshal:'Mo je Oluso Iṣan-omi',
    marshalPending:'Ipo Marshal n duro idanilowo lati NIHSA',
    signInGoogle:'Tesiwaju pelu Google',
    searchPlaceholder:'Wa agbegbe, LGA, ipinle tabi aami...',
    search:'Wa', reportFlood:'Ijabo Iṣan-omi',
    floodOutlook:'Ireti Iṣan-omi — Ojo 7 Tokan',
    peakExpected:'Opin ti a reti', whatToDo:'Ohun ti o ye ki o se',
    noFloodRisk:'Ko si ewu iṣan-omi ni bayi',
    NONE:'Deede', WATCH:'So', WARNING:'Ikilo', SEVERE:'Lile', EXTREME:'Uje nla',
    evacuateNow:'KU KURO BAYI ti o ba wa nitosi odo.',
    moveValuables:'Gbe awon ohun iyebiye lo si oke.',
    stayAlert:'Tele awon imudojuiwon NIHSA. Yago fun irin-ajo nitosi odo.',
    noAction:'Ko si ise ti o nilo. Wa ni imo.',
    chatPlaceholder:'Fi ifiransẹ ransẹ...', viewOnly:'O le ka awon ifiransẹ. Wole lati kopa.',
    send:'Firansẹ', floodDepth:'Ijinle iṣan-omi ti ifoju',
    description:'Se apejuwe ohun ti o ri',
    submitReport:'Fi Ijabo Ransẹ', reportSuccess:'Ijabo ti firansẹ. E dupe!',
    liveAlerts:'IFOKANBALẸ LAAYE', allBasins:'Gbogbo Ibudo ti a Se atele',
    lagdoActive:'Itusilẹ Damu Lagdo Sisẹ',
    simulationMode:'IPO ADASẸ — n jerisi awosẹ',
    liveMode:'LAAYE — ISEJADE AWOSẸ NFFS',
    channels:'Awon ikanni', secureNetwork:'Nẹtiwoki Ailewu ti Awon Oluso Iṣan-omi',
    activeAlerts:'Ifokanbalẹ Ti n Ṣiṣẹ', basinsMonitored:'Awon Omi Ti a Nse Atele',
    gaugesOnline:'Awon Gauji Lori Ila', stationsKPI:'Awon Ibudo',
    fieldReports:'Awon Ijabo Pẹpẹ', peopleDisplaced:'Eniyan Ti a Ti Ri Gbe',
    activeFloodAlerts:'Ifokanbalẹ Iṣan-omi Ti n Ṣiṣẹ', noAlerts:'Ko si ifokanbalẹ ni bayi',
    liveGaugeReadings:'Awon Kika Gauji Laaye', mapLayers:'Awon Fẹlẹfẹlẹ Maapu', legend:'Alaye',
    stationsLayer:'Awon Ibudo', lstmGauges:'Gauji LSTM', reportFloodBtn:'Ijabo Iṣan-omi',
    signInNetwork:'Wole lati wo awon ifiransẹ ki o kopa ninu nẹtiwoki Oluso Iṣan-omi.',
    searchBtn:'Wa', signOut:'Jade', tapToZoom:'Tẹ lati lo si ipo naa',
    askPlaceholder:'Beere nipa ewu iṣan-omi, gauji, asotele...',
    askBtn:'Beere', analysingData:'N ṣe itupalẹ data iṣan-omi…',
    affectedLGAs:'Awon LGA Ti o Kan', recommendedActions:'Awon Igbese Ti a Gbaniyanju',
    noAlertsNormal:'Ko si ifokanbalẹ lọwọlọwọ. Gbogbo odo wa ni ipo deede.',
    lagdoWarning:'Itusilẹ Damu Lagdo Sisẹ',
    lagdoDesc:'Omi ti a tu silẹ ni Cameroon n lọ si isalẹ. Yoo de ibudo yii laarin ọjọ 2-3.',
    active:'Siṣẹ', sevenDayOutlook:'Ireti Ọjọ 7', annualOutlook:'Ireti Ọdọọdun',
    alert_templates: {
      'Verified Flood Report': 'Ìjábọ̀ Ìkún-omi Tí A Fọwọ́sí',
      'Flood Warning': 'Ìkìlọ̀ Ìkún-omi',
      'River': 'Odò',
      'rising': 'ń gòkè',
      'at': 'ní',
      'critical': 'tó le koko',
      'meters': 'mítà',
      'evacuation': 'ìṣíkúrò',
      'advised': 'a gbà nímọ̀ràn',
      'flooding': 'ìkún-omi',
      'expected': 'a retí',
      'heavy': 'ńlá',
      'rainfall': 'òjò',
      'alert': 'ìfọ̀kànbalẹ̀',
      'watch': 'ṣọ́',
      'warning': 'ìkìlọ̀',
      'severe': 'tó le',
      'extreme': 'tó le koko',
      'normal': 'déédé',
    },
    allClear: 'GBOGBBO WÀ NÍ ÀLÀÁFÍÀ',
    mapLayers: 'Àwọn Fẹlẹfẹlẹ Maapu',
    annualForecast: 'Àsọtẹ́lẹ̀ Ọdọọdún — AFO 2026',
    annualForecastDesc: 'Àwọn maapu Ìkún-omi Ọdọọdún & àwọn àbájáde awoṣe — Àsọtẹ́lẹ̀ Ọdún Kíkún',
    floodAnimation: 'Ìṣípayá Ìkún-omi 2026',
    floodExtentDepth: 'Ìtóbi Ìkún-omi & Jíjìn',
    populationAtRisk: 'Olùgbé tí ó wà nínú Ewu',
    communitiesAtRisk: 'Àwọn Àgbègbè tí ó wà nínú Ewu',
    healthFacilities: 'Àwọn Ilé Ìtọ́jú Ìlera',
    schoolsAtRisk: 'Àwọn Ilé-ìwé tí ó wà nínú Ewu',
    farmlandExposure: 'Ilẹ̀ Oko tí ó wà nínú Ewu',
    roadNetworkAtRisk: 'Àwọn Òpópónà tí ó wà nínú Ewu',
    surfaceWater: 'Omi Lókè',
    surfaceWaterDesc: 'Ìpele odò àkókò-gidi, ìkìlọ̀ & àwọn ìjábọ̀ ìkún-omi',
    riverGaugeStations: 'Àwọn Ibùdó Ìwọ̀n Odò (358)',
    activeFloodAlertsLayer: 'Àwọn Ìkìlọ̀ Ìkún-omi Tí Ń Ṣiṣẹ́',
    citizenFloodReports: 'Àwọn Ìjábọ̀ Ìkún-omi Aráàlú',
    satelliteFloodExtent: 'Ìtóbi Ìkún-omi Láti Sátẹ́láìtì',
    stationSituationUpdates: 'Ìmúdójúìwọ̀n Ipò Ibùdó',
    weeklyForecast: 'Àsọtẹ́lẹ̀ Ọ̀sẹ̀',
    weeklyForecastDesc: 'Ìfojúsọ́nà ìkún-omi ọlọ́jọ́ 7 — gbé àwọn ìsọfúnni CSV ọ̀sẹ̀ gòkè nípasẹ̀ Alámòójútó',
    groundwater: 'Omi Inú Ilẹ̀',
    groundwaterDesc: 'Ìpele kànga, àwọn agbègbè omi inú ilẹ̀ & àwọn agbègbè ìkúnlọ́wọ́',
    groundwaterLevels: 'Àwọn Ìpele Omi Inú Ilẹ̀',
    aquiferZones: 'Àwọn Agbègbè Omi Inú Ilẹ̀',
    rechargeAreas: 'Àwọn Agbègbè Ìkúnlọ́wọ́',
    waterQuality: 'Dídára Omi',
    waterQualityDesc: 'WQI, turbidity & ewu ìbànújẹ́ lẹ́yìn ìkún-omi',
    waterQualityIndex: 'Atọ́ka Dídára Omi',
    turbiditySediment: 'Turbidity / Èròjà',
    contaminationRiskZones: 'Àwọn Agbègbè Ewu Ìbànújẹ́',
    coastalMarine: 'Etíkun & Omi Òkun',
    coastalMarineDesc: 'Ìjì omi, ìbàjẹ́ & àwọn agbègbè mangrove',
    coastalFloodRisk: 'Ewu Ìkún-omi Etíkun',
    stormSurgeZones: 'Àwọn Agbègbè Ìjì Omi',
    coastalErosionRisk: 'Ewu Ìbàjẹ́ Etíkun',
    mangroveBufferZones: 'Àwọn Agbègbè Mangrove',
    dataComingSoon: 'Ìsọfúnni ń bọ̀ láìpẹ́',
    layerGroupDevelopment: 'Ẹ̀ka yìí wà lábẹ́ ìdàgbàsókè. Ìsọfúnni yóò wà nínú ìmúdójúìwọ̀n NIHSA iwájú.',
    soon: 'LÁÌPẸ́',
    
    // Dashboard
    floodForecast: 'Àsọtẹ́lẹ̀ Ìkún-omi',
    annualAFO2026: '📊 Ọdọọdún (AFO 2026)',
    weekly: '📅 Ọ̀sẹ̀',
    annualFloodOutlook2026: 'Ìfojúsọ́nà Ìkún-omi Ọdún 2026 — Àkópọ̀ Ìṣípayá',
    nffsVersion: 'NFFS v3.0 · 17 àwọn fẹlẹfẹlẹ ìṣípayá · Odún Kíkún · Ti gbé jáde 15 Kẹrin 2026',
    allNigeria: 'Gbogbo Nàìjíríà',
    communities: 'Àwọn Àgbègbè',
    population: 'Olùgbé',
    healthCentres: 'Àwọn Ilé Ìtọ́jú Ìlera',
    schools: 'Àwọn Ilé-ìwé',
    farmland: 'Ilẹ̀ Oko (ha)',
    roads: 'Àwọn Òpópónà',
    electricity: 'Iná Mànàmáná',
    markets: 'Àwọn Ọjà',
    atRisk: 'nínú ewu',
    stateBreakdown: 'ÌPÍNLẸ̀ — ÀLÀYÉ KÍKÚN',
    floodAnimationLink: 'Ìṣípayá Ìkún-omi',
    floodExtentMap: 'Maapu Ìtóbi Ìkún-omi',
    atlasDataUnavailable: 'Ìsọfúnni Atlas kò sí — a gbọ́dọ̀ ṣiṣẹ́ backend láti gbé ìsọfúnni NFFS',
    noWeeklyForecastData: 'Kò Sí Ìsọfúnni Àsọtẹ́lẹ̀ Ọ̀sẹ̀',
    weeklyForecastUploadPrompt: 'A kò tíì gbé àwọn fẹlẹfẹlẹ àfọwọ́sọtẹ́lẹ̀ ọ̀sẹ̀ sókè.',
    goToAdminMapLayers: 'Lọ sí Alámòójútó → Map Layers → Weekly Forecast kí o sì gbé CSV sókè fún fẹlẹfẹlẹ kọ̀ọ̀kan.',
    weeklyFloodForecast: 'Àsọtẹ́lẹ̀ Ìkún-omi Ọ̀sẹ̀ — Àkópọ̀ Ìṣípayá',
    current7DayOutlook: 'Ìfojúsọ́nà ọlọ́jọ́ 7 lọ́wọ́lọ́wọ́ · Gbé ìsọfúnni ọ̀sẹ̀ tuntun gòkè nípasẹ̀ Alámòójútó',
    breakdown: 'àlàyé kíkún',
    
    // Alerts Tab
    nationalAlertHeatmap: 'Maapu Ìkìlọ̀ Orílẹ̀-èdè',
    liveAlertStatus: 'Ipò ìkìlọ̀ àkókò-gidi káàkiri àwọn ìpínlẹ̀ tí ó kan',
    noActiveAlertsAllNormal: 'Kò sí ìkìlọ̀ tí ó ṣiṣẹ́ — gbogbo ìpínlẹ̀ wà ní déédé',
    normal: 'Déédé',
    watch: 'Ṣọ́',
    warning: 'Ìkìlọ̀',
    severe: 'Líle',
    extreme: 'Líle Koko',
    allStatesNormal: 'Gbogbo Ìpínlẹ̀ Wà ní Déédé',
    statesWithActiveAlerts: 'ìpínlẹ̀ pẹ̀lú ìkìlọ̀ tí ó ṣiṣẹ́',
    noActiveFloodAlerts: 'Kò sí ìkìlọ̀ ìkún-omi tí ó ṣiṣẹ́ ní àkókò yìí',
    location: 'Ibùdó',
    affectedZone: 'Agbègbè tí ó kan',
    radius: 'radius',
    lowRisk: 'Ewu Kékeré',
    highRisk: 'Ewu Gíga',
    criticalExtreme: 'Líle Koko / Líle',
    estimatedImpact: 'ÌKÓWÓ ÌPÁDÉ',
    peopleAtRisk: 'Àwọn èèyàn nínú ewu',
    healthFacilitiesAtRisk: 'Àwọn ilé ìtọ́jú ìlera',
    farmlandAtRisk: 'Ilẹ̀ oko',
    roadsAtRisk: 'Àwọn òpópónà',
    reportFlooding: '🚨 Jabo Iṣan-omi',
    yourLocation: '📍 IBỌ RẸ — FA PIN LATl ṢATUNṢE',
    locationNameCoords: '📍 ORUKỌ IBO & COORDINATES',
    locationPlaceholder: 'Wa agbegbe, LGA, aami-ilẹ, tabi fa pin lori maapu...',
    waterDepth: '💧 IJINLẸ OMI (KO ṢE DANDAN)',
    selectDepth: 'Yan ijinlẹ...',
    describeWhatYouSee: '📝 ṢE APEJUWE OHUN TI O RI (KO ṢE DANDAN)',
    describePlaceholder: 'Ṣapejuwe iṣan-omi: njẹ awọn opopona ti wa ni dina? Ṣe awọn ile ti kan? Ṣe awọn eniyan ti di ni ọwọ? Eyikeyi ipalara?',
    mediaRequired: '📸 MEDIA — O KERE JU ỌKAN NI A NILO',
    mediaHint: 'O gbọdọ so o kere ju fọto kan, igbasilẹ ohun, tabi fidio.',
    takePhoto: 'Ya Fọto',
    photoAdded: 'Fọto ti fi kun',
    recordVoice: 'Gba Ohun',
    voiceRecorded: 'Ohun ti gbasilẹ',
    tapToStop: 'Tẹ lati duro',
    tapToReRecord: 'Tẹ lati tun gbasilẹ',
    recordVideo: 'Gba Fidio',
    videoAdded: 'Fidio ti fi kun',
    recordingInProgress: '🔴 Igbasilẹ n lọ...',
    submitFloodReport: 'Fi Ìjàbọ̀ Iṣan-omi Sí',
    submitting: 'Nfiransẹ...',
    reportReviewNote: 'Awọn alakoso NIHSA ṣe atunyẹwo awọn ijabọ ṣaaju titẹjade',
    reportSubmitted: 'Ìjàbọ̀ Ti Fi Ránṣẹ́',
    reportSubmittedDesc: 'Ijabọ rẹ wa ni idaduro fun ijẹrisi nipasẹ awọn alakoso NIHSA. E dupe fun iranlọwọ lati daabobo agbegbe rẹ.',
    done: 'Pari',
    fetchingAddress: 'Nwa adirẹsi...',
    dragPinHint: '📍 Fa pin lati ṣatunṣe ipo rẹ gangan',
    mediaRequiredError: 'Jọwọ so o kere ju fọto kan, igbasilẹ ohun, tabi fidio ṣaaju fifun.',
  },
  ig: {
    criticalExtreme: 'Dị Oké Njọ / Siri Ike',
    highRisk: 'Nnukwu Ihe Ize Ndụ',
    lowRisk: 'Obere Ihe Ize Ndụ',
    legend: 'Nkọwa',
    alert: 'Ọkwa',
    map:'Maapu', dashboard:'Penu Ozi', forecast:'Amuama AI',
    marshals:'Ndi Nlekota Mmiri Ozuzo', assistant:'Onye Enyemaka AI', alerts:'Okwa',
    signIn:'Banye', register:'Debanye Aha', continueGuest:'Gaa n\'ihu di ka Obiia',
    email:'Adreesi Ozi-e', password:'Okwuntughe', fullName:'Aha Zuru Oke',
    forgotPassword:'Chefuo Okwuntughe?', createAccount:'Mepu Akauntu',
    iAmFloodMarshal:'Abu m Onye Nlekota Mmiri Ozuzo',
    marshalPending:'Onodu Marshal na-ato n\'aka NIHSA',
    signInGoogle:'Gaa n\'ihu na Google',
    searchPlaceholder:'Choo obodo, LGA, steeti ma o bu ebe...',
    search:'Choo', reportFlood:'Koo Mmiri Ozuzo',
    floodOutlook:'Ntuleghari Mmiri Ozuzo — Ubochi 7 Na-abia',
    peakExpected:'A na-ato onu ogugu kachia elu', whatToDo:'Ihe i kwesiri ime',
    noFloodRisk:'Enweghị ihe egwu mmiri ozuzo ugbu a',
    NONE:'Nkiti', WATCH:'Lekoo anya', WARNING:'Okwa Ihe Egwu', SEVERE:'Siri ike', EXTREME:'Di njoo nnoo',
    evacuateNow:'PUO UGBU A o buru na i no n\'akuku osimiri.',
    moveValuables:'Bughari ihe ndi di onuahia n\'elu ala.',
    stayAlert:'Soro mmelite NIHSA. Zochie njem n\'akuku odo mmiri.',
    noAction:'O dighi ihe o bula di mkpa ime. Noro n\'omumu ihe.',
    chatPlaceholder:'Ziga ozi...', viewOnly:'I nwere ike ighu ozi. Banye iji sonye.',
    send:'Ziga', floodDepth:'Omimi mmiri ozuzo a tuputa',
    description:'Koo ihe i huru',
    submitReport:'Nyefee Akuko', reportSuccess:'Ezigara akuko. Daalu!',
    liveAlerts:'OKWA NDU', allBasins:'Ulo Oru Niile A Na-elekota',
    lagdoActive:'Ntohapuu Dam Lagdo Na-aru Oru',
    simulationMode:'ONODU NWAPU — na-enyocha udi',
    liveMode:'NDU — NTOHAPUU UDI NFFS',
    channels:'Usoro', secureNetwork:'Nkwonkwo Nchekwa nke Ndi Nlekota Mmiri Ozuzo',
    activeAlerts:'Okwa Na-arụ ọrụ', basinsMonitored:'Iyi Odo A Na-elekota',
    gaugesOnline:'Ihe Nzụta Dị Online', stationsKPI:'Ulo Oru',
    fieldReports:'Akuko Ubi', peopleDisplaced:'Ndi Nzuchara Ala',
    activeFloodAlerts:'Okwa Mmiri Ozuzo Na-arụ ọrụ', noAlerts:'Enweghị okwa ugbu a',
    liveGaugeReadings:'Ogụgụ Ihe Nzụta Ndị Ndụ', mapLayers:'Ọtụtụ Ihe Maapu', legend:'Nkọwa',
    stationsLayer:'Ulo Oru', lstmGauges:'LSTM Ihe Nzụta', reportFloodBtn:'Koo Mmiri Ozuzo',
    signInNetwork:'Banye iji hụ ozi ma sonye na nkwonkwo nke Ndi Nlekota Mmiri Ozuzo.',
    searchBtn:'Choo', signOut:'Pụọ', tapToZoom:'Pịa iji hazie ebe ahụ',
    askPlaceholder:'Jụọ maka ihe egwu mmiri ozuzo, ihe nzụta, amụma...',
    askBtn:'Jụọ', analysingData:'Na-nyocha data mmiri ozuzo…',
    affectedLGAs:'LGA Ndị Metụtara', recommendedActions:'Omume A Na-atụ Aro',
    noAlertsNormal:'Enweghị okwa ugbu a. Odo mmiri niile dị n\'ọnọdụ nkịtị.',
    lagdoWarning:'Ntohapuu Dam Lagdo Na-aru Oru',
    lagdoDesc:'Emepụtara mmiri n\'Cameroon na-aba n\'ala. Ọ ga-eru ebe a n\'ime ụbọchị 2-3.',
    active:'Na-arụ ọrụ', sevenDayOutlook:'Ntuleghari Ụbọchị 7', annualOutlook:'Ntuleghari Aro',
    alert_templates: {
      'Verified Flood Report': 'Akụkọ Iju Mmiri Ekwenyesiri Ike',
      'Flood Warning': 'Ịdọ Aka Ná Ntị Iju Mmiri',
      'River': 'Osimiri',
      'rising': 'na-arị elu',
      'at': 'na',
      'critical': 'dị oke egwu',
      'meters': 'mita',
      'evacuation': 'mpụpụ',
      'advised': 'a dụrụ ọdụ',
      'flooding': 'iju mmiri',
      'expected': 'a na-atụ anya',
      'heavy': 'oke',
      'rainfall': 'mmiri ozuzo',
      'alert': 'ọkwa',
      'watch': 'lelee anya',
      'warning': 'ịdọ aka ná ntị',
      'severe': 'siri ike',
      'extreme': 'dị oke njọ',
      'normal': 'nkịtị',
    },
    mapLayers: 'Ọtụtụ Ihe Maapu',
    annualForecast: 'Amụma Afọ — AFO 2026',
    annualForecastDesc: 'Maapu Amụma Iju Mmiri Afọ & Ihe Nlereanya — Amụma Afọ Zuru Oke',
    floodAnimation: 'Mmegharị Iju Mmiri 2026',
    floodExtentDepth: 'Ókè Iju Mmiri & Omimi',
    populationAtRisk: 'Ndị Bi n\'Ihe Ize Ndụ',
    communitiesAtRisk: 'Obodo Ndị nọ n\'Ihe Ize Ndụ',
    healthFacilities: 'Ụlọ Ọgwụ',
    schoolsAtRisk: 'Ụlọ Akwụkwọ Ndị nọ n\'Ihe Ize Ndụ',
    farmlandExposure: 'Ala Ugbo nọ n\'Ihe Ize Ndụ',
    roadNetworkAtRisk: 'Okporo Ụzọ Ndị nọ n\'Ihe Ize Ndụ',
    surfaceWater: 'Mmiri Elu',
    surfaceWaterDesc: 'Ọkwa osimiri ozugbo, ọkwa & akụkọ iju mmiri',
    riverGaugeStations: 'Ọdụ Ụgbọ Osimiri (358)',
    activeFloodAlertsLayer: 'Ọkwa Iju Mmiri Na-arụ Ọrụ',
    citizenFloodReports: 'Akụkọ Iju Mmiri Ndị Obodo',
    satelliteFloodExtent: 'Ókè Iju Mmiri Satịlaịt',
    stationSituationUpdates: 'Mmelite Ọnọdụ Ọdụ Ụgbọ',
    weeklyForecast: 'Amụma Izu',
    weeklyForecastDesc: 'Amụma iju mmiri ụbọchị 7 — bulite data CSV izu site na Admin',
    groundwater: 'Mmiri Ala',
    groundwaterDesc: 'Ọkwa olulu mmiri, ebe mmiri ala & ebe njuputa',
    groundwaterLevels: 'Ọkwa Mmiri Ala',
    aquiferZones: 'Mpaghara Mmiri Ala',
    rechargeAreas: 'Ebe Njuputa',
    waterQuality: 'Ịdị Mma Mmiri',
    waterQualityDesc: 'WQI, turbidity & ihe ize ndụ mmetọ mgbe iju mmiri gasịrị',
    waterQualityIndex: 'Ndekọ Ịdị Mma Mmiri',
    turbiditySediment: 'Turbidity / Sedimenti',
    contaminationRiskZones: 'Mpaghara Ihe Ize Ndụ Mmetọ',
    coastalMarine: 'Ụsọ Oké Osimiri & Mmiri Nnu',
    coastalMarineDesc: 'Oké ifufe, mbuze & ebe mangrove',
    coastalFloodRisk: 'Ihe Ize Ndụ Iju Mmiri Ụsọ Oké Osimiri',
    stormSurgeZones: 'Mpaghara Oké Ifufe',
    coastalErosionRisk: 'Ihe Ize Ndụ Mbuze Ụsọ Oké Osimiri',
    mangroveBufferZones: 'Mpaghara Mangrove',
    dataComingSoon: 'Data na-abịa n\'oge na-adịghị anya',
    layerGroupDevelopment: 'Otu a ka nọ n\'ọrụ. Data ga-adị na mmelite NIHSA n\'ọdịnihu.',
    soon: 'N\'OGE NA-ADỊGHỊ ANYA',
    allClear: 'IHE NIILE DỊ MMA',
    
    // Dashboard
    floodForecast: 'Amụma Iju Mmiri',
    annualAFO2026: '📊 Afọ (AFO 2026)',
    weekly: '📅 Izu',
    annualFloodOutlook2026: 'Amụma Iju Mmiri Afọ 2026 — Nchịkọta Ngosipụta',
    nffsVersion: 'NFFS v3.0 · 17 ọkwa ngosipụta · Afọ Zuru Oke · E nyere 15 Eprel 2026',
    allNigeria: 'Naịjirịa Niile',
    communities: 'Obodo',
    population: 'Ndị Bi',
    healthCentres: 'Ụlọ Ahụike',
    schools: 'Ụlọ Akwụkwọ',
    farmland: 'Ala Ugbo (ha)',
    roads: 'Okporo Ụzọ',
    electricity: 'Ọkụ Lattrịk',
    markets: 'Ahịa',
    atRisk: 'n\'ihe ize ndụ',
    stateBreakdown: 'STEETI — NKỌWAPỤTA',
    floodAnimationLink: 'Mmegharị Iju Mmiri',
    floodExtentMap: 'Maapu Ókè Iju Mmiri',
    atlasDataUnavailable: 'Data Atlas adịghị — a ga-agbanye backend iji buo data NFFS',
    noWeeklyForecastData: 'Enweghị Data Amụma Izu',
    weeklyForecastUploadPrompt: 'Ebulitebeghị ọkwa amụma izu.',
    goToAdminMapLayers: 'Gaa na Admin → Map Layers → Weekly Forecast wee bulite CSV maka ọkwa ọ bụla.',
    weeklyFloodForecast: 'Amụma Iju Mmiri Izu — Nchịkọta Ngosipụta',
    current7DayOutlook: 'Amụma ụbọchị 7 dị ugbu a · Bulite data izu ọhụrụ site na Admin',
    breakdown: 'nkọwapụta',
    
    // Alerts Tab
    nationalAlertHeatmap: 'Maapu Ọkwa Mba',
    liveAlertStatus: 'Ọnọdụ ọkwa ozugbo n\'ofe steeti emetụtara',
    noActiveAlertsAllNormal: 'Enweghị ọkwa na-arụ ọrụ — steeti niile dị nkịtị',
    normal: 'Nkịtị',
    watch: 'Lebanye Anya',
    warning: 'Ịdọ Aka ná Ntị',
    severe: 'Siri Ike',
    extreme: 'Dị Oké Njọ',
    allStatesNormal: 'Steeti Niile Dị Nkịtị',
    statesWithActiveAlerts: 'steeti nwere ọkwa na-arụ ọrụ',
    noActiveFloodAlerts: 'Enweghị ọkwa iju mmiri na-arụ ọrụ n\'oge a',
    location: 'Ebe',
    affectedZone: 'Mpaghara Emetụtara',
    radius: 'radius',
    lowRisk: 'Obere Ihe Ize Ndụ',
    highRisk: 'Nnukwu Ihe Ize Ndụ',
    criticalExtreme: 'Dị Oké Njọ / Siri Ike',
    estimatedImpact: 'Mmetụta E Mere Atụmatụ',
    peopleAtRisk: 'Ndị mmadụ n\'ihe ize ndụ',
    healthFacilitiesAtRisk: 'Ụlọ ahụike',
    farmlandAtRisk: 'Ala ugbo',
    roadsAtRisk: 'Okporo ụzọ',
    reportFlooding: '🚨 Kọọ Mmiri Ozuzo',
    yourLocation: '📍 ỌNỌDỤ GỊ — DỌKPỤ PIN IGO MGBANWE',
    locationNameCoords: '📍 AHA ỌNỌDỤ & COORDINATES',
    locationPlaceholder: 'Chọọ obodo, LGA, ihe mkpuchi, ma ọ bụ dọkpụ pin n\'ime maapu...',
    waterDepth: '💧 OMIMI MMiRI (ỌDỊGHỊ ACHỌRỌ)',
    selectDepth: 'Họọ omimi...',
    describeWhatYouSee: '📝 KOO IHE I HỤRỤ (ỌDỊGHỊ ACHỌRỌ)',
    describePlaceholder: 'Kọọ mmiri ozuzo: ụzọ etinye? Ụlọ emetụtara? Ndị mmadụ machibidoro? Ọ dị ọnjọ ọ bụla?',
    mediaRequired: '📸 MGBASA OZI — ỌKARA OTU ACHỌRỌ',
    mediaHint: 'Ị kwesịrị itinye ma ọ bụrụ otu foto, ndekọ olu, ma ọ bụ vidiyo.',
    takePhoto: 'Were Foto',
    photoAdded: 'Etinyego foto',
    recordVoice: 'Dekọọ Olu',
    voiceRecorded: 'Edekọọgo olu',
    tapToStop: 'Kụọ ka ọ kwụsị',
    tapToReRecord: 'Kụọ ka idekọọ ọzọ',
    recordVideo: 'Dekọọ Vidiyo',
    videoAdded: 'Etinyego vidiyo',
    recordingInProgress: '🔴 Ndekọ na-aga...',
    submitFloodReport: 'Nyefee Akụkọ Mmiri Ozuzo',
    submitting: 'Na-eziga...',
    reportReviewNote: 'Ndị nhazi NIHSA na-nyocha akụkọ tupu ebipụta',
    reportSubmitted: 'Ezigara Akụkọ',
    reportSubmittedDesc: 'Akụkọ gị na-atọ ndị nhazi NIHSA nkwenye ugbu a. Daalu maka inyere aka ichekwa obodo gị.',
    done: 'Emechaa',
    fetchingAddress: 'Na-achọ adreesị...',
    dragPinHint: '📍 Dọkpụ pin igo hazie ọnọdụ gị kpọmkwem',
    mediaRequiredError: 'Biko tinye ma ọ bụrụ otu foto, ndekọ olu, ma ọ bụ vidiyo tupu iziga.',
  },
  fr: {
    criticalExtreme: 'Critique / Extrême',
    highRisk: 'Risque Élevé',
    lowRisk: 'Faible Risque',
    legend: 'Légende',
    alert: 'Alerte',
    map:'Carte', dashboard:'Tableau de Bord', forecast:'Prevision IA',
    marshals:'Marechaux des Crues', assistant:'Assistant IA', alerts:'Alertes',
    signIn:'Se Connecter', register:'S\'inscrire', continueGuest:'Continuer en tant qu\'Invite',
    email:'Adresse E-mail', password:'Mot de passe', fullName:'Nom complet',
    forgotPassword:'Mot de passe oublie?', createAccount:'Creer un compte',
    iAmFloodMarshal:'Je suis un Marechal des Crues',
    marshalPending:'Statut Marechal en attente de verification par NIHSA',
    signInGoogle:'Continuer avec Google',
    searchPlaceholder:'Rechercher une communaute, LGA, etat ou lieu...',
    search:'Rechercher', reportFlood:'Signaler une Inondation',
    floodOutlook:'Perspectives d\'Inondation — 7 Prochains Jours',
    peakExpected:'Pic prevu', whatToDo:'Ce que vous devez faire',
    noFloodRisk:'Aucun risque d\'inondation pour le moment',
    NONE:'Normal', WATCH:'Surveillance', WARNING:'Avertissement', SEVERE:'Grave', EXTREME:'Extreme',
    evacuateNow:'EVACUEZ MAINTENANT si vous etes pres de la riviere.',
    moveValuables:'Deplacez les objets de valeur en hauteur.',
    stayAlert:'Suivez les mises a jour NIHSA. Evitez les deplacements pres des cours d\'eau.',
    noAction:'Aucune action necessaire. Restez informe.',
    chatPlaceholder:'Envoyer un message...', viewOnly:'Vous pouvez lire les messages. Connectez-vous pour participer.',
    send:'Envoyer', floodDepth:'Profondeur estimee de l\'inondation',
    description:'Decrivez ce que vous voyez',
    submitReport:'Soumettre le Rapport', reportSuccess:'Rapport soumis. Merci!',
    liveAlerts:'ALERTES EN DIRECT', allBasins:'Toutes les Stations Surveillees',
    lagdoActive:'Lacher du Barrage Lagdo Actif',
    simulationMode:'MODE SIMULATION — validation du modele en cours',
    liveMode:'EN DIRECT — SORTIE DU MODELE NFFS',
    channels:'Canaux', secureNetwork:'Reseau Securise des Marechaux des Crues',
    activeAlerts:'Alertes Actives', basinsMonitored:'Bassins Surveilles',
    gaugesOnline:'Jauges en Ligne', stationsKPI:'Stations',
    fieldReports:'Rapports de Terrain', peopleDisplaced:'Personnes Deplacees',
    activeFloodAlerts:'Alertes Inondation Actives', noAlerts:'Aucune alerte active en ce moment',
    liveGaugeReadings:'Lectures de Jauges en Direct', mapLayers:'Couches de Carte', legend:'Legende',
    stationsLayer:'Stations', lstmGauges:'Jauges LSTM', reportFloodBtn:'Signaler une Inondation',
    signInNetwork:'Connectez-vous pour voir les messages et participer au reseau des Marechaux des Crues.',
    searchBtn:'Rechercher', signOut:'Se deconnecter', tapToZoom:'Appuyez pour zoomer',
    askPlaceholder:'Posez une question sur le risque d\'inondation, les jauges, les previsions...',
    askBtn:'Demander', analysingData:'Analyse des donnees d\'inondation…',
    affectedLGAs:'LGAs Affectees', recommendedActions:'Actions Recommandees',
    noAlertsNormal:'Aucune alerte active. Tous les niveaux de riviere sont normaux.',
    lagdoWarning:'Lacher du Barrage Lagdo Actif',
    lagdoDesc:'L\'eau lachee en amont au Cameroun coule vers l\'aval. Elle atteindra cette station dans 2-3 jours.',
    active:'Actif', sevenDayOutlook:'Previsions 7 Jours', annualOutlook:'Previsions Annuelles',
    alert_templates: {
      'Verified Flood Report': 'Rapport d\'Inondation Vérifié',
      'Flood Warning': 'Alerte Inondation',
      'River': 'Rivière',
      'rising': 'en hausse',
      'at': 'à',
      'critical': 'critique',
      'meters': 'mètres',
      'evacuation': 'évacuation',
      'advised': 'conseillée',
      'flooding': 'inondation',
      'expected': 'prévue',
      'heavy': 'fortes',
      'rainfall': 'précipitations',
      'alert': 'alerte',
      'watch': 'surveillance',
      'warning': 'avertissement',
      'severe': 'sévère',
      'extreme': 'extrême',
      'normal': 'normal',
    },
    mapLayers: 'Couches de Carte',
    annualForecast: 'Prévision Annuelle — AFO 2026',
    annualForecastDesc: 'Cartes de prévision annuelle des inondations et sorties de modèle — Prévision annuelle complète',
    floodAnimation: 'Animation d\'Inondation 2026',
    floodExtentDepth: 'Étendue et Profondeur d\'Inondation',
    populationAtRisk: 'Population à Risque',
    communitiesAtRisk: 'Communautés à Risque',
    healthFacilities: 'Établissements de Santé',
    schoolsAtRisk: 'Écoles à Risque',
    farmlandExposure: 'Exposition des Terres Agricoles',
    roadNetworkAtRisk: 'Réseau Routier à Risque',
    surfaceWater: 'Eaux de Surface',
    surfaceWaterDesc: 'Niveaux des rivières en temps réel, alertes et rapports d\'inondation',
    riverGaugeStations: 'Stations de Jaugeage (358)',
    activeFloodAlertsLayer: 'Alertes d\'Inondation Actives',
    citizenFloodReports: 'Rapports d\'Inondation Citoyens',
    satelliteFloodExtent: 'Étendue d\'Inondation Satellite',
    stationSituationUpdates: 'Mises à Jour de Situation des Stations',
    weeklyForecast: 'Prévision Hebdomadaire',
    weeklyForecastDesc: 'Perspectives d\'inondation sur 7 jours — Téléchargez les données CSV hebdomadaires via Admin',
    groundwater: 'Eaux Souterraines',
    groundwaterDesc: 'Niveaux des forages, zones aquifères et zones de recharge',
    groundwaterLevels: 'Niveaux des Eaux Souterraines',
    aquiferZones: 'Zones Aquifères',
    rechargeAreas: 'Zones de Recharge',
    waterQuality: 'Qualité de l\'Eau',
    waterQualityDesc: 'IQE, turbidité et risque de contamination post-inondation',
    waterQualityIndex: 'Indice de Qualité de l\'Eau',
    turbiditySediment: 'Turbidité / Sédiments',
    contaminationRiskZones: 'Zones à Risque de Contamination',
    coastalMarine: 'Côtier & Marin',
    coastalMarineDesc: 'Ondes de tempête, érosion et zones tampons de mangrove',
    coastalFloodRisk: 'Risque d\'Inondation Côtière',
    stormSurgeZones: 'Zones d\'Ondes de Tempête',
    coastalErosionRisk: 'Risque d\'Érosion Côtière',
    mangroveBufferZones: 'Zones Tampons de Mangrove',
    dataComingSoon: 'Données à venir bientôt',
    layerGroupDevelopment: 'Ce groupe est en cours de développement. Les données seront disponibles dans une future mise à jour de NIHSA.',
    soon: 'BIENTÔT',
    
    // Dashboard
    floodForecast: 'Prévision d\'Inondation',
    annualAFO2026: '📊 Annuel (AFO 2026)',
    weekly: '📅 Hebdomadaire',
    annualFloodOutlook2026: 'Perspectives Annuelles d\'Inondation 2026 — Résumé d\'Exposition',
    nffsVersion: 'NFFS v3.0 · 17 couches d\'exposition · Année Complète · Publié le 15 Avril 2026',
    allNigeria: 'Tout le Nigéria',
    communities: 'Communautés',
    population: 'Population',
    healthCentres: 'Centres de Santé',
    schools: 'Écoles',
    farmland: 'Terres Agricoles (ha)',
    roads: 'Routes',
    electricity: 'Électricité',
    markets: 'Marchés',
    atRisk: 'à risque',
    stateBreakdown: 'ÉTAT — RÉPARTITION',
    floodAnimationLink: 'Animation d\'Inondation',
    floodExtentMap: 'Carte d\'Étendue d\'Inondation',
    atlasDataUnavailable: 'Données Atlas indisponibles — le backend doit être en cours d\'exécution pour charger les données NFFS',
    noWeeklyForecastData: 'Aucune Donnée de Prévision Hebdomadaire',
    weeklyForecastUploadPrompt: 'Les couches de prévision hebdomadaire n\'ont pas encore été téléchargées.',
    goToAdminMapLayers: 'Allez dans Admin → Map Layers → Weekly Forecast et téléchargez un CSV pour chaque couche.',
    weeklyFloodForecast: 'Prévision Hebdomadaire d\'Inondation — Résumé d\'Exposition',
    current7DayOutlook: 'Perspectives actuelles sur 7 jours · Téléchargez de nouvelles données hebdomadaires via Admin',
    breakdown: 'répartition',
    
    // Alerts Tab
    nationalAlertHeatmap: 'Carte d\'Alerte Nationale',
    liveAlertStatus: 'Statut d\'alerte en direct dans les états concernés',
    noActiveAlertsAllNormal: 'Aucune alerte active — tous les états sont normaux',
    normal: 'Normal',
    watch: 'Surveillance',
    warning: 'Avertissement',
    severe: 'Sévère',
    extreme: 'Extrême',
    allStatesNormal: 'Tous les États Normaux',
    statesWithActiveAlerts: 'état(s) avec alertes actives',
    noActiveFloodAlerts: 'Aucune alerte d\'inondation active pour le moment',
    location: 'Emplacement',
    affectedZone: 'Zone affectée',
    radius: 'rayon',
    lowRisk: 'Faible Risque',
    highRisk: 'Risque Élevé',
    criticalExtreme: 'Critique / Extrême',
    estimatedImpact: 'IMPACT ESTIMÉ',
    peopleAtRisk: 'Personnes à risque',
    healthFacilitiesAtRisk: 'Établissements de santé',
    farmlandAtRisk: 'Terres agricoles',
    roadsAtRisk: 'Routes',
    allClear: 'TOUT EST CLAIR',
    reportFlooding: '🚨 Signaler une Inondation',
    yourLocation: '📍 VOTRE EMPLACEMENT — FAITES GLISSER LE PIN POUR AJUSTER',
    locationNameCoords: '📍 NOM DU LIEU & COORDONNÉES',
    locationPlaceholder: 'Rechercher une communauté, LGA, repère ou faites glisser le pin...',
    waterDepth: '💧 PROFONDEUR DE L\'EAU (OPTIONNEL)',
    selectDepth: 'Sélectionner la profondeur...',
    describeWhatYouSee: '📝 DÉCRIVEZ CE QUE VOUS VOYEZ (OPTIONNEL)',
    describePlaceholder: 'Décrivez l\'inondation: les routes sont-elles bloquées? Des maisons sont-elles touchées? Des personnes sont-elles bloquées? Des blessés?',
    mediaRequired: '📸 MÉDIA — AU MOINS UN REQUIS',
    mediaHint: 'Vous devez joindre au moins une photo, un enregistrement vocal ou une vidéo.',
    takePhoto: 'Prendre une Photo',
    photoAdded: 'Photo ajoutée',
    recordVoice: 'Enregistrer la Voix',
    voiceRecorded: 'Voix enregistrée',
    tapToStop: 'Appuyer pour arrêter',
    tapToReRecord: 'Appuyer pour ré-enregistrer',
    recordVideo: 'Enregistrer une Vidéo',
    videoAdded: 'Vidéo ajoutée',
    recordingInProgress: '🔴 Enregistrement en cours...',
    submitFloodReport: 'Soumettre le Rapport d\'Inondation',
    submitting: 'Envoi en cours...',
    reportReviewNote: 'Les rapports sont examinés par les coordinateurs NIHSA avant publication',
    reportSubmitted: 'Rapport Soumis',
    reportSubmittedDesc: 'Votre rapport est en attente de vérification par les coordinateurs NIHSA. Merci d\'aider à protéger votre communauté.',
    done: 'Terminé',
    fetchingAddress: 'Récupération de l\'adresse...',
    dragPinHint: '📍 Faites glisser le pin pour ajuster votre position exacte',
    mediaRequiredError: 'Veuillez joindre au moins une photo, un enregistrement vocal ou une vidéo avant de soumettre.',
  },
};

let _currentLang = 'en';
try { _currentLang = localStorage.getItem('nihsa_lang') || 'en'; } catch {}
const t = (key) => (TRANSLATIONS[_currentLang] || TRANSLATIONS.en)[key] || TRANSLATIONS.en[key] || key;
const translateAlert = (text, lang = _currentLang) => {
  if (!text) return '';
  
  const templates = TRANSLATIONS[lang]?.alert_templates || TRANSLATIONS.en.alert_templates;
  
  // Try exact match first
  if (templates[text]) return templates[text];
  
  // Translate word by word for mixed content
  let translated = text;
  Object.entries(templates).forEach(([en, local]) => {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, local);
  });
  
  return translated;
};

// ─── LANGUAGE SELECTOR ─────────────────────────────────────────────────────────
const LANG_OPTIONS = [
  {code:'en',label:'English',flag:'🇬🇧'},
  {code:'ha',label:'Hausa',  flag:'🇳🇬'},
  {code:'yo',label:'Yoruba', flag:'🇳🇬'},
  {code:'ig',label:'Igbo',   flag:'🇳🇬'},
  {code:'fr',label:'Francais',flag:'🇫🇷'},
];
const LangSelector = ({ lang, setLang }) => {
  const [open, setOpen] = useState(false);
  const cur = LANG_OPTIONS.find(l=>l.code===lang) || LANG_OPTIONS[0];
  return (
    <div style={{position:'relative'}}>
      <button onClick={()=>setOpen(p=>!p)}
        style={{padding:'5px 10px',background:C.s2,border:`1px solid ${C.border}`,
          borderRadius:8,color:C.text,cursor:'pointer',fontSize:12,
          display:'flex',alignItems:'center',gap:6}}>
        <span>{cur.flag}</span>
        <span style={{fontWeight:600}}>{cur.label}</span>
        <span style={{fontSize:9,color:C.muted}}>▼</span>
      </button>
      {open && (
        <div style={{position:'absolute',top:'110%',right:0,background:C.surface,
          border:`1px solid ${C.border}`,borderRadius:10,zIndex:9999,
          boxShadow:'0 8px 24px #0008',minWidth:140,overflow:'hidden'}}>
          {LANG_OPTIONS.map(l=>(
            <button key={l.code} onClick={()=>{
              setLang(l.code); _currentLang=l.code;
              try{localStorage.setItem('nihsa_lang',l.code);}catch{}
              setOpen(false);
            }} style={{display:'flex',alignItems:'center',gap:8,width:'100%',
              padding:'9px 14px',background:lang===l.code?`${C.primary}18`:'transparent',
              border:'none',color:lang===l.code?C.accent:C.text,
              cursor:'pointer',fontSize:13,fontWeight:lang===l.code?700:400}}>
              <span>{l.flag}</span><span>{l.label}</span>
              {lang===l.code&&<span style={{marginLeft:'auto',fontSize:10}}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Inject global CSS for animations
if (!document.getElementById('nihsa-global-css')) {
  const s = document.createElement('style');
  s.id = 'nihsa-global-css';
  s.textContent = `
    @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
    @keyframes ticker  { 0% { transform:translateX(0); } 100% { transform:translateX(-33.33%); } }
    @keyframes pulse   { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.15); } }
    @keyframes recPulse { 0%,100% { box-shadow:0 0 0 0 rgba(239,68,68,0.4); } 70% { box-shadow:0 0 0 8px rgba(239,68,68,0); } }
    @keyframes ping { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
  `;
  document.head.appendChild(s);
}
const POLL_MS    = 30_000;   
const TOKEN_KEY  = "nihsa_token";
const USER_KEY   = "nihsa_user";

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C = {
  bg:      '#04111F',
  surface: '#071E33',
  s2:      '#0A2540',
  s3:      '#0D2E4A',
  border:  '#143D5C',
  primary: '#0EA5E9',
  accent:  '#38BDF8',
  gold:    '#F59E0B',
  text:    '#CBD5E1',
  bright:  '#F1F5F9',
  muted:   '#4A7A9B',
  danger:  '#EF4444',
  warning: '#F97316',
  success: '#10B981',
  info:    '#6366F1',
};

const RISK_COLOR  = r => ({CRITICAL:'#EF4444',HIGH:'#F97316',MEDIUM:'#EAB308',WATCH:'#EAB308',NORMAL:'#10B981'}[r]||'#4A7A9B');
// HTML-escape helper — used in Leaflet popup templates to prevent XSS from user/API content
const _esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const RISK_BG     = r => ({CRITICAL:'#EF444418',HIGH:'#F9731618',MEDIUM:'#F59E0B18',WATCH:'#EAB30818',NORMAL:'#10B98118'}[r]||'#4A7A9B18');
const RISK_LABEL  = {CRITICAL:'CRITICAL',HIGH:'HIGH',MEDIUM:'MEDIUM',WATCH:'WATCH',NORMAL:'NORMAL'};

// ─── HA (HYDROLOGICAL AREA) COLOURS ────────────────────────────────────────────
const HA_COL = {1:'#0EA5E9',2:'#38BDF8',3:'#0284C7',4:'#0369A1',5:'#075985',6:'#0C4A6E',7:'#155E75',8:'#164E63'};

// ─── REAL GEODATA (358 STATIONS + RIVERS + BASIN) ──────────────────────────────
const STATIONS_REAL=[
[4.25057,11.52278,1,'Kende','Sokoto'], [4.12687,11.38076,1,'Jidere Bode','Niger'], [4.37122,12.20977,1,'Jega','Zamfara'], [4.30491,12.52909,1,'Argungu','Rima'], [6.10563,13.59355,1,'Unguwar Lalle','Rima'], [6.55726,12.25888,1,'Bungudu','Sokoto'], [7.27754,12.84032,1,'Batsari','Gada'], [6.77972,12.77164,1,'Zurmi','Bunsuru'], [6.50525,12.70941,1,'Gidan Goga','Gagare'], [6.36146,13.52963,1,'Sabon Birni','Rima'], [7.23,11.23,1,'Zobe','Karaduwa'], [4.23,11.4,1,'Fokku','Ka'], [6.43,12.21,1,'Rumah','Gada'], [5.09052,13.03022,1,'Wamakko','Sokoto'], [5.247,13.12249,1,'Sokoto (Illela Bridge)','Rima'], [5.26311,13.07053,1,'Sokoto','Sokoto'], [6.62859,12.50044,1,'Kaura-Namoda','Gagare'], [5.37442,13.08356,1,'Gidan Doka','Sokoto'], [6.43,12.21,1,'Maru','Kadusa'], [4.20964,12.33136,1,'Kalgo','Shella'], [4.16085,11.32114,1,'Kende','Rima'], [5.1076,12.15406,1,'Gummi','Zamfara'], [7.35259,10.08404,2,'Kad/Abuja Road','SarkinPawa'], [7.2333,10.6167,2,'ML20 Lagos Road','Tubo'], [7.4833,10.5,2,'Kaduna North','Kaduna'], [7.4333,10.6667,2,'Kaduna South','Kaduna'], [6.6833,9.08333,2,'Kuta','Kura'], [7.0986,10.05045,2,'Sarkin Pawa','Sarkin Pawa'], [4.8,10.47,2,'Malendo','Malendo'], [6.2833,9.01667,2,'Agaie','Barogi'], [8.25,10.9,2,'Kuzunta','Galma'], [8.1,11.0833,2,'Rubunshi','Galma'], [7.7166,11.8,2,'Zariak W/W','Galma'], [8.13,10.55,2,'Kauru','Karam'], [7.9667,9.9667,2,'Kachia','Kachia/Gurara'], [8.4,9.8,2,'Bakinkogi','Chalwatunga'], [7.75,11.15,2,'Zaria-Kano road','Shika'], [8.2833,9.7667,2,'Zonkwa','Kwasau'], [8.05,9.8167,2,'Manchok','Kajim'], [8.3333,9.7667,2,'Fadan Kate','F/Kajde'], [8.0333,9.3667,2,'Kachia-Kwoi Rd','Gebia'], [8.4,9.6167,2,'Ungwa-Rimi','Kagum'], [8.0833,9.3333,2,'Kwoi','Sabam'], [5.75,8.75,2,'Badegi','Niger'], [5.85,9.1667,2,'Wuya','Kaduna'], [7.15,8.5333,2,'GwaGwalada','Usman'], [7.0166,9.2333,2,'Izom','Gurara'], [6.2833,7.0166,2,'Agaie','Bankogi'], [6.6,9.5333,2,'Minna','Chanchaga'], [7.1833,9.1667,2,'Suleja','Iku'], [4.55,8.4833,2,'Ilorin Pumping Station','Asa'], [4.85,8.2833,2,'Esie','Oshin'], [4.9,9.0667,2,'Bacita','Adafa'], [4.8333,8.1667,2,'Igbonla','Oyun'], [8.55,10.4,2,'Lere','Karam'], [8.2,9.35,2,'Jagindi','Kogun'], [8.55,9.667,2,'Manchor','Agoi'], [7.233,10.6,2,'Afaka Forest','Resa'], [8.267,9.75,2,'Zutrung','Zutrung'], [8.167,9.8,2,'Lenak','Lenak'], [8.383,9.8,2,'Gidan Waya','Gimi'], [6.767,8.067,2,'Jamatu','Niger'], [7.8,10.8,2,'UK/S Ribogi','Galma Ribako'], [8.133,10.55,2,'Kauru','Karam'], [8.55,10.4,2,'Lere','Karam'], [8.683,10.417,2,'Saminara','Karam'], [8.4,9.45,2,"Jama'a",'Aisala'], [8.0,10.983,2,'Soba','Jamaa'], [8.367,9.483,2,'Godogodo','Godogodo'], [8.4,9.417,2,'Fadan Karshi','F/Karshi'], [8.517,9.333,2,'Sabon Gida','Tanga'], [6.033,10.083,2,'Mariga','Mariga'], [6.067,9.533,2,'Tung-Kawo','Bankogi'], [5.117,8.767,2,'Egbom','Niger'], [6.65,10.35,2,'K. Gurmana','Kaduna'], [6.717,9.083,2,'Lapai','Estswan'], [6.383,8.583,2,'Baro','Niger'], [6.717,8.267,2,'Gerinya','Gurara'], [6.267,9.217,2,'Railway Bridge','Ebba'], [7.283,9.733,2,'Kad/ABJ Road','Dinya'], [6.117,9.083,2,'Badeggi','Gbako'], [6.133,8.917,2,'Railway Bridge','Bankogi'], [6.183,9.533,2,'Momma W/WKS','Bhan Chang'], [6.967,9.167,2,'Pa 1','Iku'], [5.35,9.0667,2,'Lafiagi','Egwa'], [5.7667,8.75,2,'Eche Bridge','Eche'], [6.8333,8.75,2,'Idugegu','Akunama'], [5.3333,8.7333,2,'Gbaza','Egwa'], [6.0667,8.3333,2,'Kabba','Osse'], [5.6,7.8333,2,'Lade','Daku'], [6.74868,7.79996,2,'Lokoja','Niger'], [4.81822,9.12898,2,'Jebba','Niger'], [4.6156,9.85173,2,'Kainji','Niger'], [6.7,8.4833,2,'Lokoja Bridge','Mimi'], [5.2,8.2833,2,'Oro Agor','Akayo'], [5.05,8.3333,2,'Rore','Orisa'], [12.79327,9.38438,3,'Wuro Boki','Benue'], [12.02381,9.67531,3,'Kiri Dam','Gongola'], [11.52,10.32,3,'Dadin Kowa Dam','Gongola'], [11.51457,10.29932,3,'Dadin Kowa Bridge','Gongola'], [10.45007,8.52017,3,'Gassol','Taraba'], [10.02225,8.15985,3,'Tapare','Donga'], [11.24531,9.19992,3,'Lau','Benue'], [9.72,8.18,3,'Ibbi','Benue'], [12.47,9.28,3,'Jimeta Treatment Plant','Benue'], [12.46423,9.28832,3,'Jimeta Bridge','Benue'], [12.03312,9.47502,3,'Numan','Benue'], [11.94,9.38,3,'Gada','Mayo'], [12.91456,9.25073,3,'Chikito','Faro'], [11.97,9.29,3,'Ngorore','Maini'], [10.14561,10.23994,3,'Dindima','Gongola'], [10.01395,10.34565,3,'Waya Dam Site','Waya'], [10.02382,7.86913,3,'Gindin Dorowa','Donga'], [12.75383,9.55017,3,'Loko','Loko'], [12.04874,9.53219,3,'Bilachi','Tiel'], [8.2518,9.00951,4,'Tede','Mada'], [8.55254,8.93602,4,'Gudi Bridge','Mada'], [8.28624,8.91479,4,'Mada WW','Mada'], [8.3166,8.8833,4,'Richa','Mada'], [8.49477,9.49032,4,'Lafia','Amba'], [8.54242,8.52882,4,'Kurikyo','Kurikyo'], [8.52834,8.82003,4,'Nasarawa Eggon WW','Dep'], [8.34872,8.38364,4,'Doma','Ohina'], [8.22256,8.43917,4,'Ruttu','Mada'], [9.38428,9.19216,4,'Chip West','Gwalang'], [9.3777,9.1805,4,'Dansak Dam site','Dansak'], [9.31943,9.07144,4,'DokanTofa','Shemanka'], [9.6416,8.56512,4,'Lakushi','Shendam'], [9.6667,9.35,4,'Amber','Amber'], [9.9452,9.0855,4,'Wase','Wase'], [7.88,7.16,4,'Ekenobi','Okpokwu'], [9.20825,7.4615,4,'Buruku','Katsina-Ala'], [8.86999,9.55508,4,'Akunni','Akunni'], [8.95261,8.62018,4,'Sabongida','Dep'], [7.36466,7.29942,4,'Egane','Anambra'], [9.44703,8.89688,4,'Shendam','Shendam'], [7.88,7.53,4,'Uga-Ukpaya','Okpokwu'], [8.75308,9.5997,4,'Hoss','Werram'], [9.67597,9.05235,4,'Gidan-Lifidi','Koelong'], [9.28829,7.15102,4,'Katsina Ala','Katsina Ala'], [8.53213,7.74618,4,'Makurdi','Benue'], [7.18451,8.00275,4,'Umaisha','Benue'], [7.93314,7.11298,4,'Ajide-Eke','Ajide-Eke'], [9.22918,7.14269,4,'Dura Bridge','Daura'], [8.70463,7.75779,4,'Guma dam','Baka'], [8.24889,7.25473,4,'Taraku','Ugbaya'], [8.52159,8.93027,4,'Buruku','Buku'], [8.55058,8.93009,4,'Gbata','Gbata'], [8.49112,9.11702,4,'Randa','Randa'], [6.5,6.45,5,'Uburubu','Utor'], [5.64922,6.34629,5,'Benin City','Ikpoba'], [6.3833,7.3667,5,'Agbede','Edion'], [6.23925,7.03574,5,'Auchi','Orle'], [6.4667,5.9167,5,'Ossissa','Adofi'], [6.13151,5.84522,5,'Abraka','Ethiope'], [5.66288,6.05258,5,'Ologbo','Ossiomo'], [6.04102,6.29708,5,'Abudu','Ossiomo'], [6.2667,6.9333,5,'Auchi','Edion'], [5.76839,6.76176,5,'Owan Village','Osse'], [5.15,6.75,5,'Ofusu','Ofusu'], [6.70416,7.11175,5,'Agor','Niger'], [6.832,6.32412,5,'Umueze-Anam','Anambra'], [6.65692,5.07422,5,'Ahoada','Orashi'], [6.753,5.6458,5,'Oguta','Imo'], [6.0835,4.8075,5,'Oporoma','Nun'], [6.19311,5.22548,5,'Patani','Forcados'], [5.4465,5.99738,5,'Koko','Ethiope'], [6.83934,6.34029,5,'Otuocha II','Anambra'], [6.8119,6.09429,5,'Obosi','Idemili'], [7.11411,5.41819,5,'Ulakwo','Oramirukwa'], [7.28755,5.30821,5,'Umuopara','Imo'], [7.87251,4.87251,5,'Akwete','Imo'], [7.01944,5.43979,5,'Nekede','Otamiri'], [7.05653,4.99395,5,'Chokocho','Otamiri'], [6.77548,6.1625,5,'Onitsha','Niger'], [7.0,6.5333,5,'Igbagbada','Anambra'], [7.43019,5.609,5,'Ugwu Nkpa','Eme'], [7.17027,6.63936,5,'Ukpata','Adada'], [7.25,6.6333,5,'Ndimoko','Imo'], [6.4667,5.5333,5,'Imezi-Olo','Ivo'], [7.2167,6.1833,5,'Aguobu-Umumba','Ajali'], [7.7167,7.8,5,'Akaeze','Ezeaku'], [6.6333,5.9167,5,'Umulokpa','Anambra/Adada'], [7.15,7.1833,5,'Amaberiba','Asu/Ivo'], [7.3667,6.45,6,'Edion','Agbede'], [5.3833,7.2667,6,'Ogbesse Village','Ogbesse'], [5.3333,7.6,6,'Aduloju','Ogbesse'], [5.8,6.7833,6,'Owan Village','Osse'], [5.0167,7.2,6,'Owena Village','Owena'], [5.7667,6.7667,6,'Owan Village','Owan'], [5.9667,7.2167,6,'Imafun','Onyami'], [5.3,6.65,6,'Lagos-Benin Road','Oha'], [8.0,6.65,6,'Ero Dam','Ero'], [5.4667,7.9666,6,'Oye Dam Itopaji','Oye'], [5.4667,6.4833,6,'Iguoriakhi','Osse'], [3.9333,6.8167,6,'Ijebu-Ode','Yemoja'], [4.15,7.4667,6,'Iwo/Ibadan Road','Oba'], [2.9,6.8333,6,'Ebute Igboro','Yewa'], [2.9,7.1833,6,'Ijaka-Oke','Yewa'], [2.9167,7.05,6,'Eggua','Yewa'], [2.9167,6.7,6,'Ajilete','Yewa'], [3.05,7.9833,6,'Ilaji-Ile','Oyan'], [3.6167,6.9667,6,'Ajura','Ibu'], [4.2,6.85,6,'Apoje Water Work','Oshun'], [4.4333,7.75,6,'Ede','Oshun'], [3.9167,7.4833,6,'Sasa Village','Ona'], [3.85,7.4167,6,'Eleyele Dam','Ona'], [3.8667,7.2333,6,'Idi Ayure Ibadan','Ona'], [3.9833,7.35,6,'Akanran Rd Ibadan','Ona'], [3.9,7.3667,6,'Sec. Road','Ogunpa'], [3.9167,7.3833,6,'Alafara Ibadan','Kudeti'], [3.65,7.35,6,'Ife/Ondo Road','Owena'], [3.65,8.6333,6,'Sepeteri','Ogun'], [3.9167,7.7167,6,'Odo Ogun','Ogun'], [3.3167,8.4667,6,'Ofiki Town','Ofiki'], [3.3333,6.6833,6,'Iju W/W','Ogun Adiyan'], [3.8667,6.75,6,'Ala','Asasa'], [3.8,6.6333,6,'Itoikin','Aye'], [3.35,6.7667,6,'Ibaragun','Ogun'], [3.3333,7.3333,6,'Abidokun','Opeki'], [5.1833,8.0,6,'Ero Dam','Ero'], [5.4667,7.9667,6,'Oye Dam Itopaji','Oye'], [2.85,7.45,6,'Meko','Opotoko'], [2.9,6.8666,6,'Oke Odan','Ojum'], [3.0333,7.2333,6,'Aiyetoro','Ayibo'], [5.4167,9.0,6,'Bagbu','Oro'], [5.1667,9.2,6,'Share','Oyi'], [4.3333,8.6667,6,'Luma','Menai'], [3.9167,8.8,6,'Yeahi','Moshi'], [5.8667,10.3333,6,'Rogun','Kampe'], [5.1167,9.3333,6,'Omuaran','Orisa'], [5.6833,8.15,6,'Kuye Bridge','Kuyi'], [8.8,5.8,7,'Okoroba','Cross'], [7.9333,5.8333,7,'Afikpo Ndibe beach','Cross'], [6.25,8.75,7,'Ikom','Cross'], [5.85,8.05,7,'Itigidi','Cross'], [5.1333,8.23,7,'Itu','Cross'], [6.05,8.25,7,'Obubra','Cross'], [6.5167,9.1167,7,'Ogoja','Aya'], [5.0,7.5,7,'Abak','Abak'], [4.3833,5.7833,7,'Apen Beach','Calabar'], [4.4167,5.9167,7,'EPZ','Calabar'], [4.55,5.7833,7,'Atimbo','Great Kwa River'], [6.8833,8.8167,7,'Ijegu Yala','Okpanku'], [4.7833,7.9833,7,'OnnaEket','Qua Iboe'], [4.7833,7.8333,7,'Ekpene Ukpa','Qua Iboe'], [6.5833,8.9167,7,'Boki','Debokim'], [6.8167,6.3333,7,'Otuocha','Oda'], [7.1833,6.3333,7,'Ugururu','Anambra'], [7.15,6.25,7,'Amansea','Mamu'], [7.3,5.7833,7,'Umuna-Okigwe','Imo'], [7.0333,5.4333,7,'Nekede','Otamiri'], [6.4667,6.1833,7,'Imezi-Olo','Ivo'], [7.2833,5.3333,7,'Owerrinta Bridge','Imo'], [6.7,7.8,7,'Ezillo','Ebonyi'], [7.7167,5.9167,7,'Akaeze','Ezeaku'], [4.4167,5.9167,7,'Adiabo Tinapa','Calabar'], [5.0667,7.6,7,'Ibiaku Uruan','Ikpa'], [10.04,12.26,8,'Hadejia Bridge','Hadejia'], [9.1,12.09,8,'Ringim','Hadejia'], [8.3,11.8,8,'Wudil','Kano'], [8.32,11.5,8,'Tamburawa','Kano'], [8.23,11.37,8,'Chiromawa','Kano'], [9.96,12.08,8,'Dabi','Kano'], [8.07,11.74,8,'Karaye','Challawa'], [8.26,11.53,8,'Challawa','Challawa'], [8.89,12.03,8,'Joda','Hadejia'], [9.92,12.26,8,'Kafin Hausa','Kafin Hausa'], [10.33,11.15,8,'Kari','Gana'], [9.58,11.25,8,'Foggo','Jamaare'], [8.24,11.57,8,'Gwazo Bridge','Watari'], [9.15,12.01,8,'Chai-Chai','Gaya'], [9.2,11.32,8,'Iggi','Iggi'], [11.03,12.26,8,'Gashua','Komadugu-Yobe'], [11.5,12.49,8,'Dapchi','Komadugu-Yobe'], [11.55,12.53,8,'Geidam','Komadugu-Yobe'], [13.1,11.51,8,'Maiduguri','Ngadda'], [10.46,12.48,8,'Ngurru','Hadejia'], [12.31,13.08,8,'Damasak','Komadugu-Yobe'], [13.15,13.34,8,'Yau','Komadugu-Yobe'], [12.48,13.22,8,'Gashager','Komadugu-Yobe'], [13.1,12.42,8,'Alau Dam','Alau Lake'], [13.1,11.42,8,'Lojeri Village','Alau Lake'], [13.27,11.3,8,'Bama','Yedesaram'], [14.05,12.05,8,'Mbuli','Yedesaram'], [11.5,11.3,8,'Katarko','Annuma'], [13.14,11.3,8,'Sambissa','Ngadda'], [12.5,10.31,8,'Askira','Rafin Gatamarawa'], [13.5,12.24,8,'Kirinowa Intake Channel','Lake Chad'], [13.4,12.58,8,'Baga Intake','Lake Chad'], [14.21,12.22,8,'Gamboru','Ebeji'], [14.04,12.33,8,'Wulgo/Tunukalia','Ebeji'], [14.21,12.22,8,'Gamboru Pump House','Ebeji'], [14.07,12.29,8,'Gamboru/Wulgo','Ebeji'], [10.09,11.55,8,'Walali','Jemari'], [9.38,11.04,8,'Bunga','Jemari'], [9.32,11.22,8,'Birnin Kudu','Dogwala'], [10.02,12.26,8,'Hadejia Ferry Site','Hadejia'], [9.02,11.37,8,'Gaya','Dudurun'], [8.2,12.06,8,'Dawakin Tofa','Watari'], [8.41,12.09,8,'Gewaza','Jekara'], [8.32,12.19,8,'Babaruga','Tomas'], [8.27,12.35,8,'Jekarade','Gari']
];

// ─── STATIC MODEL DATA ─────────────────────────────────────────────────────────
const GAUGES_STATIC = [
  { id:'G001', name:'Lokoja', river:'Niger', state:'Kogi', lat:7.800, lng:6.740,
    level:9.8, warnLevel:7.5, dangerLevel:9.0, status:'CRITICAL', flow:12400, nse:0.989,
    fc:[{d:'+1d',q05:10200,q50:12800,q95:16200},{d:'+2d',q05:9800,q50:13400,q95:17400},
        {d:'+3d',q05:9100,q50:13900,q95:18600},{d:'+4d',q05:8400,q50:13200,q95:18100},
        {d:'+5d',q05:7800,q50:12100,q95:17200},{d:'+6d',q05:7200,q50:10900,q95:15800},{d:'+7d',q05:6600,q50:9800,q95:14100}]},
  { id:'G002', name:'Makurdi', river:'Benue', state:'Benue', lat:7.730, lng:8.522,
    level:8.9, warnLevel:6.0, dangerLevel:8.0, status:'HIGH', flow:8900, nse:0.995,
    fc:[{d:'+1d',q05:7800,q50:9400,q95:12200},{d:'+2d',q05:7200,q50:9800,q95:13100},
        {d:'+3d',q05:6900,q50:9600,q95:13400},{d:'+4d',q05:6400,q50:8900,q95:12800},
        {d:'+5d',q05:5900,q50:8100,q95:11600},{d:'+6d',q05:5400,q50:7400,q95:10400},{d:'+7d',q05:4900,q50:6600,q95:9100}]},
  { id:'G003', name:'Wuroboki', river:'Taraba', state:'Taraba', lat:8.022, lng:10.201,
    level:4.8, warnLevel:5.5, dangerLevel:7.0, status:'WATCH', flow:3200, nse:0.996,
    fc:[{d:'+1d',q05:2900,q50:3400,q95:4200},{d:'+2d',q05:2700,q50:3600,q95:4600},
        {d:'+3d',q05:2600,q50:3500,q95:4500},{d:'+4d',q05:2400,q50:3200,q95:4100},
        {d:'+5d',q05:2200,q50:2900,q95:3700},{d:'+6d',q05:2000,q50:2700,q95:3400},{d:'+7d',q05:1900,q50:2500,q95:3200}]},
];

const HYDRO_STATIC = [
  {m:'Jan',d:820,q95:1180},{m:'Feb',d:650,q95:980},{m:'Mar',d:780,q95:1140},
  {m:'Apr',d:1320,q95:1960},{m:'May',d:2580,q95:3800},{m:'Jun',d:4600,q95:6800},
  {m:'Jul',d:7400,q95:10800},{m:'Aug',d:11200,q95:15900},{m:'Sep',d:9800,q95:13800},
  {m:'Oct',d:6700,q95:9600},{m:'Nov',d:3200,q95:4600},{m:'Dec',d:1400,q95:2100},
];


// ─── ML FORECAST SIMULATION DATA (falls back to real files when available) ─────
// Real data path: D:/AI Flood forecast 2026/data/processed/alerts/
// When backend serves /api/forecast/ml/alerts, this is replaced automatically
const ML_BASINS = [
  { id: 1050022420, name: 'Lokoja',    river: 'Niger',   state: 'Kogi',    lat: 7.80,  lng: 6.75 },
  { id: 1050892990, name: 'Makurdi',   river: 'Benue',   state: 'Benue',   lat: 7.75,  lng: 8.53 },
  { id: 1050909900, name: 'Wuroboki',  river: 'Taraba',  state: 'Taraba',  lat: 8.02,  lng: 10.20 },
  { id: 1050030000, name: 'Onitsha',   river: 'Niger',   state: 'Anambra', lat: 6.16,  lng: 6.78 },
  { id: 1050040000, name: 'Baro',      river: 'Niger',   state: 'Niger',   lat: 8.58,  lng: 6.38 },
  { id: 1050050000, name: 'Kainji',    river: 'Niger',   state: 'Niger',   lat: 9.85,  lng: 4.62 },
  { id: 1050060000, name: 'Umaisha',   river: 'Benue',   state: 'Nasarawa',lat: 8.00,  lng: 7.18 },
  { id: 1050070000, name: 'Jebba',     river: 'Niger',   state: 'Kwara',   lat: 9.13,  lng: 4.82 },
];

// Simulated 7-day outlook per basin — replaced by real forecast files when ready
const SIM_OUTLOOK = (basinId, seed=1) => {
  const rng = (n) => ((Math.sin(basinId * 0.00001 + n * seed) + 1) / 2);
  const levels = ['calm','calm','elevated','elevated','high','high','settling'];
  const base = rng(0);
  const peakDay = 3 + Math.floor(rng(1) * 3);
  const isWarning = base > 0.55;
  const isSevere  = base > 0.78;
  return {
    alert: isSevere ? 'SEVERE' : isWarning ? 'WARNING' : base > 0.35 ? 'WATCH' : 'NORMAL',
    peakDay,
    lagdoActive: basinId === 1050892990 && rng(2) > 0.4,
    days: Array.from({length:7},(_,i) => {
      const intensity = Math.max(0, Math.min(10, (i < peakDay ? i/peakDay : (7-i)/(7-peakDay)) * 10 * base + rng(i)*1.5));
      return {
        label: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
        intensity: Math.round(intensity * 10) / 10,
        status: intensity > 7 ? 'high' : intensity > 4 ? 'elevated' : 'calm',
      };
    }),
    impact: {
      population: Math.round(50000 + rng(10) * 200000),
      schools: Math.round(2 + rng(11) * 20),
      healthFacilities: Math.round(1 + rng(12) * 8),
      farmlandHa: Math.round(500 + rng(13) * 5000),
      roadsKm: Math.round(10 + rng(14) * 80),
    },
  };
};



// ─── API SERVICE ───────────────────────────────────────────────────────────────

const REFRESH_TOKEN_KEY = "nihsa_refresh_token";
const TOKEN_EXPIRY_KEY = "nihsa_token_expiry";

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
}

const api = {
  token: () => localStorage.getItem(TOKEN_KEY),
  
  refreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  
  headers: () => ({
    'Content-Type': 'application/json',
    ...(localStorage.getItem(TOKEN_KEY) ? { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` } : {}),
  }),

  async refreshAccessToken() {
    if (isRefreshing) {
      // Wait for the ongoing refresh to complete
      return new Promise(resolve => {
        subscribeTokenRefresh(resolve);
      });
    }
    
    isRefreshing = true;
    
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const r = await fetch(API_BASE + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      if (!r.ok) {
        throw new Error('Refresh failed');
      }
      
      const data = await r.json();
      
      // Store new tokens
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user || {}));
      localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + data.expires_in * 1000));
      
      onTokenRefreshed(data.access_token);
      isRefreshing = false;
      
      return data.access_token;
    } catch (e) {
      isRefreshing = false;
      // Refresh failed - clear everything and force re-login
      api.logout();
      throw e;
    }
  },

  async fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    // Check if token is expired or about to expire (within 5 minutes)
    if (expiry && Date.now() > parseInt(expiry) - 300000) {
      try {
        const newToken = await this.refreshAccessToken();
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${newToken}`
        };
      } catch (e) {
        // Refresh failed, proceed with original token (might fail with 401)
      }
    }
    
    if (!options.headers) {
      options.headers = {};
    }
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`
    };
    
    let response = await fetch(url, options);
    
    // If still got 401, try to refresh once
    if (response.status === 401) {
      try {
        const newToken = await this.refreshAccessToken();
        options.headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, options);
      } catch (e) {
        // Refresh failed, propagate the 401
      }
    }
    
    return response;
  },

  async get(path) {
    const r = await this.fetchWithAuth(API_BASE + path, { headers: {} });
    if (r.status === 401) { 
      api.logout(); 
      return null; 
    }
    if (!r.ok) throw new Error(`API ${r.status}`);
    return r.json();
  },

  async post(path, body) {
    const r = await this.fetchWithAuth(API_BASE + path, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body) 
    });
    if (!r.ok) { 
      const e = await r.json().catch(() => ({ detail: 'Error' })); 
      throw new Error(e.detail || 'Error'); 
    }
    return r.json();
  },

  async login(email, password) {
    const form = new URLSearchParams({ username: email, password });
    const r = await fetch(API_BASE + '/auth/login', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
      body: form 
    });
    if (!r.ok) { 
      const e = await r.json().catch(() => ({ detail: 'Invalid credentials' })); 
      throw new Error(e.detail || 'Login failed'); 
    }
    const data = await r.json();
    
    // ✅ Store both tokens and expiry
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user || {}));
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + data.expires_in * 1000));
    
    return data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    window.location.reload();
  },

  currentUser() {
    try { 
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); 
    } catch { 
      return null; 
    }
  },

  async nominatim(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ng&limit=5&addressdetails=1&accept-language=en`;
    const r = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!r.ok) throw new Error('Search failed');
    return r.json();
  },
};

// ─── HOOK: LIVE DATA WITH POLLING ─────────────────────────────────────────────
function useLiveData(path, fallback, deps=[]) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetch_ = useCallback(async () => {
    try {
      const d = await api.get(path);
      if (d !== null) { setData(d); setError(null); }
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => clearInterval(id);
  }, [fetch_, ...deps]);

  return { data, loading, error, refetch: fetch_ };
}

// ─── HOOK: WEBSOCKET ──────────────────────────────────────────────────────────
function useWebSocket(path, onMessage, enabled=true) {
  const wsRef = useRef(null);
  const reconnRef = useRef(null);

  const connect = useCallback(() => {
    if (!enabled) return;
    try {
      const ws = new WebSocket(WS_BASE + path);
      wsRef.current = ws;
      ws.onmessage = e => { try { onMessage(JSON.parse(e.data)); } catch {} };
      ws.onclose = () => { reconnRef.current = setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    } catch {}
  }, [path, enabled, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === 1) wsRef.current.send(JSON.stringify(msg));
  }, []);

  return { send };
}

// ─── UI PRIMITIVES ─────────────────────────────────────────────────────────────
const Spinner = ({size=20}) => (
  <div style={{width:size,height:size,borderRadius:'50%',border:`2px solid ${C.border}`,borderTopColor:C.primary,animation:'spin 0.8s linear infinite'}} />
);

const Badge = ({level, children}) => (
  <span style={{
    display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px',
    borderRadius:4, fontSize:11, fontWeight:700, letterSpacing:'0.06em',
    background: RISK_BG(level), color: RISK_COLOR(level),
    border: `1px solid ${RISK_COLOR(level)}40`,
  }}>{children || level}</span>
);

const Card = ({children, style={}}) => (
  <div style={{background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:16, ...style}}>
    {children}
  </div>
);

const Skeleton = ({h=16, w='100%', r=6}) => (
  <div style={{height:h, width:w, borderRadius:r, background:`linear-gradient(90deg,${C.s2} 25%,${C.s3} 50%,${C.s2} 75%)`, backgroundSize:'400% 100%', animation:'shimmer 1.4s ease infinite'}} />
);

const ErrorBanner = ({msg}) => msg ? (
  <div style={{padding:'10px 14px', background:'#EF444418', border:'1px solid #EF444430', borderRadius:8, color:'#FCA5A5', fontSize:13, marginBottom:12}}>
    ⚠ Unable to connect to NIHSA services — showing last known data. {msg}
  </div>
) : null;

const EmptyState = ({icon='📭', msg}) => (
  <div style={{textAlign:'center', padding:'40px 20px', color:C.muted}}>
    <div style={{fontSize:32, marginBottom:8}}>{icon}</div>
    <div style={{fontSize:14}}>{msg}</div>
  </div>
);

// ─── AUTH MODAL ────────────────────────────────────────────────────────────────
// ─── IN-APP LEGAL DOCUMENT OVERLAY ────────────────────────────────────────────
const LegalDocOverlay = ({ url, title, onClose }) => (
  <div style={{position:'fixed',inset:0,zIndex:12000,background:'rgba(0,0,0,0.85)',display:'flex',flexDirection:'column'}}>
    <div style={{padding:'10px 16px',background:'#061828',borderBottom:'1px solid #123450',
      display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
      <span style={{fontSize:14,fontWeight:700,color:'#F1F5F9'}}>{title}</span>
      <button onClick={onClose}
        style={{background:'#EF444430',border:'1px solid #EF444450',borderRadius:6,
          color:'#EF4444',fontSize:13,fontWeight:700,padding:'4px 14px',cursor:'pointer'}}>
        ✕ Close
      </button>
    </div>
    <iframe src={url} title={title}
      style={{flex:1,border:'none',width:'100%',background:'#fff'}} />
  </div>
);

const AuthModal = ({ onClose, onAuth }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [isFloodMarshal, setIsFloodMarshal] = useState(false);
  const [marshalData, setMarshalData] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [legalDoc, setLegalDoc] = useState(null); // { url, title }
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Rate limiting: track failed attempts
  const attemptsRef = useRef(0);
  const lockUntilRef = useRef(0);

  const submit = async () => {
    // Client-side rate limiting
    const now = Date.now();
    if (now < lockUntilRef.current) {
      const wait = Math.ceil((lockUntilRef.current - now) / 1000);
      setErr(`Too many attempts. Please wait ${wait} seconds before trying again.`);
      return;
    }
    // Basic input validation
    if (mode === 'register' || mode === 'login') {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErr('Please enter a valid email address.'); return;
      }
      if (!password || password.length < 8) {
        setErr('Password must be at least 8 characters.'); return;
      }
    }
    if (mode === 'register') {
      if (!name.trim() || name.trim().length < 2) {
        setErr('Please enter your full name (at least 2 characters).'); return;
      }
      if (isFloodMarshal && !marshalData.organisation?.trim()) {
        setErr('Organisation name is required for Flood Marshal registration.'); return;
      }
      if (!agreedToTerms) {
        setErr('You must agree to the Terms of Service and Privacy Policy to register.'); return;
      }
    }
    setErr(''); setLoading(true);
    try {
      if (mode === 'forgot') {
        await api.post('/auth/forgot-password', { email });
        setForgotSent(true);
        setLoading(false);
        return;
      }
      if (mode === 'login') {
        await api.login(email, password);
      } else {
        await api.post('/auth/register', {
          name,
          email,
          password,
          phone_number: marshalData.phone || undefined,
          state: marshalData.state || undefined,
          lga: marshalData.lga || undefined,
        });
        await api.login(email, password);
      }
      onAuth(api.currentUser());
      onClose();
    } catch(e) {
      attemptsRef.current += 1;
      if (attemptsRef.current >= 5) {
        lockUntilRef.current = Date.now() + 30000; // lock 30s
        attemptsRef.current = 0;
        setErr('Too many failed attempts. Please wait 30 seconds.');
      } else {
        // Show generic message, don't leak details for login
        setErr(mode === 'login' ? 'Incorrect email or password.' : e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width:'100%', padding:'10px 12px', background:C.s2, border:`1px solid ${C.border}`,
    borderRadius:8, color:C.bright, fontSize:14, outline:'none', boxSizing:'border-box',
  };

  return (
    <div style={{position:'fixed',inset:0,background:'#000000CC',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:32,width:380,maxWidth:'calc(100vw - 40px)',position:'relative',maxHeight:'calc(100vh - 40px)',overflowY:'auto'}}>

        {/* ✕ Close button */}
        <button onClick={onClose}
          style={{position:'absolute',top:14,right:14,background:'none',border:'none',
            color:C.muted,cursor:'pointer',fontSize:20,lineHeight:1,padding:'2px 6px',
            borderRadius:6}}>✕</button>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:20}}>
          <img src="/nihsa-logo.png" alt="NIHSA" style={{width:64,height:64,objectFit:'contain',margin:'0 auto 12px',display:'block'}}
            onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='flex';}}
          />
          <div style={{width:48,height:48,borderRadius:12,background:`linear-gradient(135deg,${C.primary},${C.info})`,margin:'0 auto 12px',alignItems:'center',justifyContent:'center',fontSize:22,display:'none'}}>🌊</div>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:20,fontWeight:700,color:C.bright,letterSpacing:'0.05em'}}>NIHSA FLOOD INTELLIGENCE</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>National Flood Intelligence Platform</div>
        </div>

        {/* Tabs */}
        {mode !== 'forgot' && (
          <div style={{display:'flex',background:C.bg,borderRadius:8,padding:3,marginBottom:16}}>
            {['login','register'].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setErr('');setForgotSent(false);}}
                style={{flex:1,padding:'7px',borderRadius:6,border:'none',cursor:'pointer',
                  fontSize:13,fontWeight:600,transition:'all 0.2s',
                  background:mode===m?C.primary:'transparent',
                  color:mode===m?'#fff':C.muted}}>
                {m==='login'?t('signIn'):t('register')}
              </button>
            ))}
          </div>
        )}

        {/* Forgot password */}
        {mode === 'forgot' && (
          <div style={{marginBottom:8}}>
            <div style={{fontSize:15,fontWeight:700,color:C.bright,marginBottom:4}}>{t('resetPassword')}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:14}}>{t('resetPasswordDesc')}</div>
            {forgotSent
              ? <div style={{padding:'12px',background:'#10B98120',border:`1px solid ${C.success}`,borderRadius:8,fontSize:13,color:C.success,textAlign:'center'}}>
                  {t('resetLinkSent')}
                </div>
              : <>
                  <input placeholder={t('email')} type="email" value={email}
                    onChange={e=>setEmail(e.target.value)}
                    style={{...inp,marginBottom:10}} />
                  {err && <div style={{color:'#FCA5A5',fontSize:12,marginBottom:8,padding:'6px 10px',background:'#EF444415',borderRadius:6}}>{err}</div>}
                  <button onClick={submit} disabled={loading}
                    style={{width:'100%',padding:'11px',background:`linear-gradient(135deg,${C.primary},#0284C7)`,
                      border:'none',borderRadius:8,color:'#fff',fontSize:14,fontWeight:700,
                      cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1}}>
                    {loading?t('sending'):t('sendResetLink')}
                  </button>
                </>
            }
            <button onClick={()=>{setMode('login');setErr('');setForgotSent(false);}}
              style={{width:'100%',marginTop:10,padding:'9px',background:'transparent',
                border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,fontSize:13,cursor:'pointer'}}>
              {t('backToSignIn')}
            </button>
          </div>
        )}

        {/* Normal login/register fields */}
        {mode !== 'forgot' && (
          <>
            {mode==='register' && (
              <input placeholder={t('fullName')} value={name}
                onChange={e=>setName(e.target.value)}
                style={{...inp,marginBottom:10}} />
            )}
            <input placeholder="Email address (e.g. name@example.com)" type="email" value={email}
              onChange={e=>setEmail(e.target.value)}
              style={{...inp,marginBottom:10}} />
            <div style={{position: 'relative', marginBottom: 10}}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder={t('password')} 
                value={password}
                onChange={e=>setPassword(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&submit()}
                style={{...inp, paddingRight: '45px'}} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '5px',
                  color: C.muted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            

            {/* Flood Marshal declaration + extended form */}
            {mode==='register' && (
              <>
                <div onClick={()=>setIsFloodMarshal(p=>!p)}
                  style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',
                    background: isFloodMarshal?`${C.primary}18`:C.s2,
                    border:`1px solid ${isFloodMarshal?C.primary:C.border}`,
                    borderRadius:8,cursor:'pointer',marginBottom:isFloodMarshal?8:10,transition:'all 0.2s'}}>
                  <div style={{width:18,height:18,borderRadius:4,flexShrink:0,marginTop:1,
                    background:isFloodMarshal?C.primary:C.s3,
                    border:`2px solid ${isFloodMarshal?C.primary:C.border}`,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:11,color:'#fff',transition:'all 0.2s'}}>
                    {isFloodMarshal?'✓':''}
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:C.bright}}>🦺 {t('iAmFloodMarshal')}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2,lineHeight:1.4}}>{t('marshalPending')}</div>
                  </div>
                </div>

                {/* Extended marshal fields — only shown when checkbox is ticked */}
                {isFloodMarshal && (
                  <div style={{background:C.s2,border:`1px solid ${C.primary}30`,
                    borderRadius:10,padding:'12px',marginBottom:10}}>
                    <div style={{fontSize:11,color:C.primary,fontWeight:700,
                      letterSpacing:'0.06em',marginBottom:10}}>🦺 {t('floodMarshalDetails')}</div>
                    {[
                      ['phone',       t('phoneNumber'),       'tel',    '0801 234 5678'],
                      ['state',       t('stateOfOperation'),  'text',   'e.g. Kogi State'],
                      ['lga',         t('lgaOfOperation'),    'text',   'e.g. Lokoja'],
                      ['organisation',t('organisation') + ' *',  'text',   'e.g. NIHSA, NEMA, Red Cross (required)'],
                      ['role_in_org', t('roleInOrg'),         'text',   'e.g. Staff, Volunteer, Leader'],
                      ['experience',  t('yearsExperience'),   'number', 'e.g. 3'],
                      ['heard_from',  t('heardFrom'),         'text',   'e.g. Social Media, NIHSA Office'],
                    ].map(([field, label, type, ph]) => (
                      <div key={field} style={{marginBottom:8}}>
                        <label style={{fontSize:10,color:C.muted,display:'block',
                          marginBottom:4,fontWeight:700,letterSpacing:'0.05em'}}>
                          {label.toUpperCase()}
                        </label>
                        <input type={type} placeholder={ph}
                          value={marshalData[field]||''}
                          onChange={e=>setMarshalData(p=>({...p,[field]:e.target.value}))}
                          style={{...inp,padding:'8px 10px',fontSize:12}} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Forgot password link */}
            {mode==='login' && (
              <div style={{textAlign:'right',marginBottom:10}}>
                <button onClick={()=>{setMode('forgot');setErr('');}}
                  style={{background:'none',border:'none',color:C.primary,
                    fontSize:12,cursor:'pointer',fontWeight:600}}>
                  {t('forgotPassword')}
                </button>
              </div>
            )}

            {/* Terms & Conditions — shown only on register */}
            {mode === 'register' && (
              <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:12,
                padding:'10px',background:'#ffffff08',borderRadius:8,border:`1px solid ${C.border}`}}>
                <input type="checkbox" id="terms-agree" checked={agreedToTerms}
                  onChange={e=>setAgreedToTerms(e.target.checked)}
                  style={{marginTop:2,accentColor:C.primary,cursor:'pointer',flexShrink:0}} />
                <label htmlFor="terms-agree"
                  style={{fontSize:12,color:C.muted,lineHeight:1.5,cursor:'pointer'}}>
                  I have read and agree to the{' '}
                  <button onClick={e=>{e.preventDefault();setLegalDoc({url:'/terms-of-service.html',title:'Terms of Service'});}}
                    style={{background:'none',border:'none',padding:0,color:C.primary,fontWeight:600,fontSize:12,cursor:'pointer',textDecoration:'underline'}}>
                    Terms of Service
                  </button>
                  {' '}and{' '}
                  <button onClick={e=>{e.preventDefault();setLegalDoc({url:'/privacy-policy.html',title:'Privacy Policy'});}}
                    style={{background:'none',border:'none',padding:0,color:C.primary,fontWeight:600,fontSize:12,cursor:'pointer',textDecoration:'underline'}}>
                    Privacy Policy
                  </button>
                  {' '}of the NIHSA Flood Intelligence Platform.
                </label>
              </div>
            )}

            {err && <div style={{color:'#FCA5A5',fontSize:12,marginBottom:10,padding:'6px 10px',background:'#EF444415',borderRadius:6}}>{err}</div>}

            <button onClick={submit} disabled={loading}
              style={{width:'100%',padding:'11px',background:`linear-gradient(135deg,${C.primary},#0284C7)`,
                border:'none',borderRadius:8,color:'#fff',fontSize:14,fontWeight:700,
                cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1}}>
              {loading?'...':(mode==='login'?t('signIn'):t('createAccount'))}
            </button>

            <button onClick={onClose}
              style={{width:'100%',marginTop:10,padding:'9px',background:'transparent',
                border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,fontSize:13,cursor:'pointer'}}>
              {t('continueGuest')}
            </button>

            <div style={{fontSize:11,color:C.muted,textAlign:'center',marginTop:12}}>
              Secure access · NIHSA National Flood Intelligence Platform
            </div>
            <div style={{fontSize:10,color:C.muted,textAlign:'center',marginTop:6,opacity:0.6}}>
              Developed by <span style={{color:C.accent,fontWeight:600}}>Tuna</span>
            </div>
          </>
        )}
      </div>
      {/* In-app legal doc viewer */}
      {legalDoc && <LegalDocOverlay url={legalDoc.url} title={legalDoc.title} onClose={()=>setLegalDoc(null)} />}
    </div>
  );
};

// ─── CITIZEN REPORT MODAL ──────────────────────────────────────────────────────
const ReportModal = ({ user, onClose, prefill }) => {
  const [loc, setLoc]         = useState('');
  const [locLat, setLocLat]   = useState(null);
  const [locLng, setLocLng]   = useState(null);
  const [depth, setDepth]     = useState('');
  const [desc, setDesc]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState(false);
  const [err, setErr]                 = useState('');
  const [photo, setPhoto]             = useState(null);
  const [voiceBlob, setVoiceBlob]     = useState(null);
  const [videoBlob, setVideoBlob]     = useState(null);
  const [isRecordingVoice, setIsRecordingVoice ] = useState(false);
  const [isRecordingVideo, setRecVideo] = useState(false);
  const [voiceTime, setVoiceTime]     = useState(0);
  const [videoTime, setVideoTime]     = useState(0);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const voiceRecRef  = useRef(null);
  const videoRecRef  = useRef(null);
  const voiceTimer   = useRef(null);
  const videoTimer   = useRef(null);
  const pinMapRef    = useRef(null);
  const pinLeafRef   = useRef(null);
  const pinMarkerRef = useRef(null);
  const voiceStreamRef = useRef(null);

  
  const inp = {width:'100%',padding:'10px 12px',background:C.s2,border:`1px solid ${C.border}`,
    borderRadius:8,color:C.bright,fontSize:13,outline:'none',boxSizing:'border-box'};

  // geocode coordinates to address
  const reverseGeocode = async (lat, lng) => {
    setIsFetchingLocation(true);
    try {
      // Nominatim to get address from coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        // Extract a name
        const parts = data.display_name.split(',');
        let shortName = '';
        
        // get the most specific location name
        if (data.address) {
          const addr = data.address;
          shortName = [
            addr.road || addr.suburb || addr.village || addr.town || addr.city,
            addr.state_district || addr.county,
            addr.state
          ].filter(Boolean).join(', ');
        }
        
        if (!shortName) {
          // Fallback: take first 3 parts of the full address
          shortName = parts.slice(0, 3).join(', ');
        }
        
        // Add coordinates to the location name
        const formattedLoc = `${shortName} (${lat.toFixed(5)}°, ${lng.toFixed(5)}°)`;
        setLoc(formattedLoc);
      } else {
        setLoc(`${lat.toFixed(5)}°, ${lng.toFixed(5)}°`);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setLoc(`${lat.toFixed(5)}°, ${lng.toFixed(5)}°`);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  // GPS auto-capture with reverse geocoding
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocLat(latitude);
          setLocLng(longitude);
          await reverseGeocode(latitude, longitude);
        }, 
        (error) => {
          console.warn('Geolocation error:', error);
          setLocLat(9.082);
          setLocLng(8.675);
          setLoc(`Default Location (${9.082}°, ${8.675}°)`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocLat(9.082);
      setLocLng(8.675);
      setLoc(`Default Location (${9.082}°, ${8.675}°)`);
    }
  }, []);

  // GET PERMISSION TO USE MICROPHONE
  useEffect(() => {
    // Pre-check microphone permission when modal opens
    const checkMicrophonePermission = async () => {
      try {
        // Just check if we can get permission without actually recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
      } catch (error) {
        console.log('Microphone permission not granted yet');
        
      }
    };
    
    checkMicrophonePermission();
  }, []);

  // Init draggable pin map when lat/lng available
  useEffect(() => {
    if (!locLat || !locLng || !pinMapRef.current) return;
    if (!L) return;
    
    // Clean up existing map
    if (pinLeafRef.current) { 
      pinLeafRef.current.remove(); 
      pinLeafRef.current = null; 
    }
    
    // Clear any existing Leaflet content
    if (pinMapRef.current._leaflet_id) {
      pinMapRef.current._leaflet_id = null;
      while (pinMapRef.current.firstChild) {
        pinMapRef.current.removeChild(pinMapRef.current.firstChild);
      }
    }
    
    // Create new map
    const map = L.map(pinMapRef.current, { zoomControl: true, dragging: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
      maxZoom: 18,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    map.setView([locLat, locLng], 15);
    
    // Create draggable marker
    const marker = L.marker([locLat, locLng], { draggable: true }).addTo(map);
    marker.bindPopup('📍 Drag pin to adjust location').openPopup();
    
    // Handle drag end
    marker.on('dragend', async (e) => {
      const ll = e.target.getLatLng();
      setLocLat(ll.lat);
      setLocLng(ll.lng);
      await reverseGeocode(ll.lat, ll.lng);
    });
    
    pinLeafRef.current = map;
    pinMarkerRef.current = marker;
    
    return () => {
      try { 
        if (pinLeafRef.current) {
          pinLeafRef.current.remove();
        }
      } catch(e) {}
      pinLeafRef.current = null;
    };
  }, [locLat, locLng]); 

  useEffect(() => {
    if (prefill) {
      if (prefill.location) {
        setLoc(prefill.location);
      }
      if (prefill.description) {
        setDesc(prefill.description);
      }
    }
  }, [prefill]);

  // (for android)Force microphone permission request through WebView
  useEffect(() => {
    const forceMicrophonePermission = async () => {
      try {
        // This triggers the WebView's permission request dialog
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted via WebView');
      } catch (err) {
        console.log('Microphone permission error:', err);
        // Show a helpful message
        setErr('Please check: Go to App Settings → Permissions → Microphone → Allow, then restart the app');
      }
    };
    
    // Only run this once when modal opens
    forceMicrophonePermission();
  }, []);
  // Nominatim search for location search
  const searchLoc = useCallback(async (q) => {
    if (q.length < 3) { setSuggestions([]); return; }
    try { 
      const r = await api.nominatim(q); 
      setSuggestions(r.slice(0,5)); 
    } catch {}
  }, []);

  // Voice recording (max 60s)
  const startVoice = async () => {
    try {
      setErr(''); // Clear previous errors
      setErr('🔍 Checking microphone...');
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErr('❌ Your device does not support voice recording');
        return;
      }

      setErr('🎤 Requesting microphone permission...');
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setErr('✅ Microphone granted! Starting recording...');
      
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (audioChunks.length === 0) {
          setErr('❌ No audio was recorded. Please try again.');
          return;
        }
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setVoiceBlob(audioBlob);
        setErr('✅ Voice recorded successfully!');
        // Clear error after 2 seconds
        setTimeout(() => setErr(''), 2000);
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.onerror = (event) => {
        setErr('❌ Recording error occurred');
        console.error('MediaRecorder error:', event);
      };
      
      // Start recording
      mediaRecorder.start();
      voiceRecRef.current = mediaRecorder;
      setIsRecordingVoice(true);
      setVoiceTime(0);
      setErr('🔴 Recording in progress...');
      
      // Timer for max 60 seconds
      voiceTimer.current = setInterval(() => {
        setVoiceTime(prev => {
          if (prev >= 59) {
            if (voiceRecRef.current && voiceRecRef.current.state === 'recording') {
              voiceRecRef.current.stop();
            }
            setIsRecordingVoice(false);
            if (voiceTimer.current) clearInterval(voiceTimer.current);
            setErr('⏹️ Recording stopped (60 second limit)');
            setTimeout(() => setErr(''), 2000);
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Voice recording error:', error);
      
      // Show user-friendly error messages
      if (error.name === 'NotAllowedError') {
        setErr('❌ Microphone access denied. Please check:\n1. App permissions in Settings\n2. Grant microphone permission and restart app');
      } else if (error.name === 'NotFoundError') {
        setErr('❌ No microphone found on this device');
      } else if (error.name === 'NotReadableError') {
        setErr('❌ Microphone is already in use by another app');
      } else if (error.name === 'SecurityError') {
        setErr('❌ Security error. Make sure you are using HTTPS or localhost');
      } else {
        setErr(`❌ Error: ${error.message || 'Unknown error'}`);
      }
      setIsRecordingVoice(false);
    }
  };
  const stopVoice = () => {
    console.log('Stop voice called, current state:', voiceRecRef.current?.state);
    
    if (voiceRecRef.current && voiceRecRef.current.state === 'recording') {
      voiceRecRef.current.stop();
      console.log('MediaRecorder stopped');
    }
    
    if (voiceTimer.current) {
      clearInterval(voiceTimer.current);
      voiceTimer.current = null;
    }
    
    setIsRecordingVoice(false);
  };

  // Video recording (max 60s)
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => { setVideoBlob(new Blob(chunks, { type:'video/webm' })); stream.getTracks().forEach(t=>t.stop()); };
      rec.start();
      videoRecRef.current = rec;
      setRecVideo(true); setVideoTime(0);
      videoTimer.current = setInterval(() => {
        setVideoTime(p => { if (p >= 59) { stopVideo(); return 60; } return p+1; });
      }, 1000);
    } catch { setErr('Camera access denied'); }
  };
  const stopVideo = () => {
    if (videoRecRef.current) { videoRecRef.current.stop(); videoRecRef.current = null; }
    clearInterval(videoTimer.current);
    setRecVideo(false);
  };

  const submit = async () => {
    const hasMedia = photo || voiceBlob || videoBlob;
    if (!hasMedia) { setErr(t('mediaRequiredError')); return; }
    setSubmitting(true); setErr('');
    try {
      const form = new FormData();
      form.append('address', loc || '');
      form.append('lat',  String(locLat || 9.082));
      form.append('lng',  String(locLng || 8.675));
      form.append('water_depth_m', String(parseFloat(depth) || 0.1));
      form.append('description', desc.trim() || 'This person needs help, check the files they sent.');
      if (photo)      form.append('image',  photo, 'photo.jpg');
      if (voiceBlob)  form.append('voice',  voiceBlob, 'voice.webm');
      if (videoBlob)  form.append('video',  videoBlob, 'video.webm');
      const r = await fetch(API_BASE + '/reports/media', {
        method:'POST',
        headers: api.token() ? { Authorization:`Bearer ${api.token()}` } : {},
        body: form,
      });
      if (!r.ok) {
        throw new Error(`Report submission failed (${r.status})`);
      }
      setSuccess(true);
    } catch(e) {
      setErr(e.message||'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{position:'fixed',inset:0,background:'#000000CC',zIndex:9000,
      display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{background:C.surface,borderTopLeftRadius:20,borderTopRightRadius:20,
        width:'100%',maxWidth:560,maxHeight:'92vh',overflowY:'auto'}}>

        {/* Header */}
        <div style={{position:'sticky',top:0,background:C.surface,padding:'16px 20px',
          borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',
          alignItems:'center',zIndex:2}}>
          <div style={{fontSize:17,fontWeight:700,color:C.bright}}>🚨 {t('reportFlooding').replace('🚨 ','')}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,fontSize:20,cursor:'pointer'}}>✕</button>
        </div>

        <div style={{padding:20}}>
        {success ? (
          <div style={{textAlign:'center',padding:'30px 0'}}>
            <div style={{fontSize:48,marginBottom:12}}>✅</div>
            <div style={{color:C.success,fontWeight:700,fontSize:16,marginBottom:8}}>{t('reportSubmitted')}</div>
            <div style={{color:C.muted,fontSize:13,lineHeight:1.6}}>
              {t('reportSubmittedDesc')}
            </div>
            <button onClick={onClose} style={{marginTop:20,padding:'10px 28px',
              background:C.primary,border:'none',borderRadius:8,color:'#fff',
              cursor:'pointer',fontWeight:600}}>{t('done')}</button>
          </div>
        ) : (
          <>
            {/* ── Draggable Pin Map ─────────────────────────── */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:700,letterSpacing:'0.06em'}}>
                {t('yourLocation')}
              </label>
              <div ref={pinMapRef}
                style={{width:'100%',height:200,borderRadius:10,
                  border:`1px solid ${C.border}`,background:C.s2,overflow:'hidden'}} />
              <div style={{fontSize:11,color:C.muted,marginTop:4,display:'flex',justifyContent:'space-between'}}>
                <span>{t('dragPinHint')}</span>
                {isFetchingLocation && <span style={{fontSize:10,color:C.accent}}>{t('fetchingAddress')}</span>}
              </div>
            </div>

            {/* Location search - now shows full address with coordinates */}
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:700,letterSpacing:'0.06em'}}>
                {t('locationNameCoords')}
              </label>
              <input 
                value={loc} 
                onChange={e=>{setLoc(e.target.value);searchLoc(e.target.value);}}
                placeholder={t('locationPlaceholder')}
                style={inp} 
              />
              <div style={{fontSize:10,color:C.muted,marginTop:4,display:'flex',gap:8,flexWrap:'wrap'}}>
                <span>📍 Lat: {locLat?.toFixed(6) || '---'}°</span>
                <span>📍 Lng: {locLng?.toFixed(6) || '---'}°</span>
              </div>
              {suggestions.length>0 && (
                <div style={{background:C.s3,border:`1px solid ${C.border}`,borderRadius:8,marginTop:4,overflow:'hidden',zIndex:100,position:'relative'}}>
                  {suggestions.map((s,i)=>(
                    <div key={i} onClick={()=>{
                      const lat = parseFloat(s.lat);
                      const lon = parseFloat(s.lon);
                      setLoc(s.display_name.slice(0,100));
                      setLocLat(lat);
                      setLocLng(lon);
                      setSuggestions([]);
                      if (pinLeafRef.current && L) {
                        pinLeafRef.current.setView([lat, lon], 15);
                        if (pinMarkerRef.current) pinMarkerRef.current.setLatLng([lat, lon]);
                      }
                    }} style={{padding:'8px 12px',cursor:'pointer',fontSize:12,color:C.text,borderBottom:`1px solid ${C.border}`}}>
                      📍 {s.display_name.slice(0,70)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Water depth - optional */}
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:700,letterSpacing:'0.06em'}}>{t('waterDepth')}</label>
              <select value={depth} onChange={e=>setDepth(e.target.value)} style={{...inp,cursor:'pointer'}}>
                <option value="">{t('selectDepth')}</option>
                <option value="0.1">Ankle-deep — water is up to the ankle (about 0.1–0.3m)</option>
                <option value="0.4">Knee-deep — water reaches the knee (about 0.4–0.6m)</option>
                <option value="0.8">Waist-deep — water is at waist level (about 0.7–1.0m)</option>
                <option value="1.2">Chest-deep — water reaches the chest (about 1.0–1.5m)</option>
                <option value="2.0">Impassable — area is fully submerged, no crossing possible</option>
              </select>
            </div>

            {/* Description - optional */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:700,letterSpacing:'0.06em'}}>{t('describeWhatYouSee')}</label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)}
                placeholder={t('describePlaceholder')}
                rows={3} style={{...inp,resize:'vertical'}} />
            </div>

            {/* ── Media section ─────────────────────────────── */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4,fontWeight:700,letterSpacing:'0.06em'}}>{t('mediaRequired')}</label>
              <div style={{fontSize:11,color:C.accent,marginBottom:8}}>{t('mediaHint')}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>

                {/* Photo - uses camera intent */}
                <label style={{display:'flex',flexDirection:'column',alignItems:'center',
                  justifyContent:'center',gap:6,padding:'12px 8px',
                  background: photo?`${C.success}15`:C.s2,
                  border:`1px dashed ${photo?C.success:C.border}`,
                  borderRadius:10,cursor:'pointer',fontSize:11,color:photo?C.success:C.muted,
                  textAlign:'center',minHeight:70}}>
                  <input type="file" accept="image/*" capture="environment" style={{display:'none'}}
                    onChange={e=>{if(e.target.files[0])setPhoto(e.target.files[0]);}} />
                  <span style={{fontSize:22}}>{photo?'✅':'📷'}</span>
                  <span>{photo?t('photoAdded'):t('takePhoto')}</span>
                </label>

                {/* Voice recording */}
                <button 
                  onClick={() => {
                    console.log('Button clicked - isRecordingVoice:', isRecordingVoice, 'voiceBlob:', voiceBlob);
                    
                    if (isRecordingVoice) {
                      // Stop recording
                      console.log('Stopping recording');
                      stopVoice();
                    } else if (voiceBlob) {
                      // Remove existing recording
                      console.log('Removing existing recording');
                      setVoiceBlob(null);
                      setVoiceTime(0);
                    } else {
                      // Start recording
                      console.log('Starting new recording');
                      startVoice();
                    }
                  }}
                  style={{display:'flex',flexDirection:'column',alignItems:'center',
                    justifyContent:'center',gap:6,padding:'12px 8px',
                    background: voiceBlob?`${C.success}15`:isRecordingVoice?`${C.danger}15`:C.s2,
                    border:`1px dashed ${voiceBlob?C.success:isRecordingVoice?C.danger:C.border}`,
                    borderRadius:10,cursor:'pointer',fontSize:11,
                    color:voiceBlob?C.success:isRecordingVoice?C.danger:C.muted,minHeight:70,width:'100%'}}>
                  <span style={{fontSize:22,animation:isRecordingVoice?'pulse 1s infinite':undefined}}>
                    {voiceBlob?'✅':isRecordingVoice?'⏹':'🎤'}
                  </span>
                  <span>
                    {voiceBlob ? t('voiceRecorded') : (isRecordingVoice ? `🔴 ${t('recordingInProgress').replace('🔴 ','')}` : t('recordVoice'))}
                  </span>
                  {isRecordingVoice && <span style={{fontSize:9,color:C.muted}}>{t('tapToStop')}</span>}
                  {voiceBlob && !isRecordingVoice && <span style={{fontSize:9,color:C.success}}>{t('tapToReRecord')}</span>}
                </button>

                {/* Video recording */}
                <label style={{display:'flex',flexDirection:'column',alignItems:'center',
                  justifyContent:'center',gap:6,padding:'12px 8px',
                  background: videoBlob?`${C.success}15`:C.s2,
                  border:`1px dashed ${videoBlob?C.success:C.border}`,
                  borderRadius:10,cursor:'pointer',fontSize:11,color:videoBlob?C.success:C.muted,
                  textAlign:'center',minHeight:70}}>
                  <input type="file" accept="video/*" capture="camcorder" style={{display:'none'}}
                    onChange={e=>{if(e.target.files[0])setVideoBlob(e.target.files[0]);}} />
                  <span style={{fontSize:22}}>{videoBlob?'✅':'🎥'}</span>
                  <span>{videoBlob?t('videoAdded'):t('recordVideo')}</span>
                </label>
              </div>
              <div style={{fontSize:10,color:C.muted,marginTop:6}}>
                {t('tapToStop').replace('Tap','Tap a button')} {t('recordVoice').toLowerCase()} or {t('recordVideo').toLowerCase()}. After recording, the file will be attached to your report.
              </div>
            </div>

            {err && <div style={{color:'#FCA5A5',fontSize:12,marginBottom:10,
              padding:'8px 12px',background:'#EF444415',borderRadius:8}}>{err}</div>}

            <button onClick={submit} disabled={submitting}
              style={{width:'100%',padding:13,
                background:`linear-gradient(135deg,${C.danger},#DC2626)`,
                border:'none',borderRadius:10,color:'#fff',fontSize:14,
                fontWeight:700,cursor:submitting?'not-allowed':'pointer',
                opacity:submitting?0.7:1}}>
              {submitting ? t('submitting') : t('submitFloodReport')}
            </button>
            <div style={{fontSize:11,color:C.muted,textAlign:'center',marginTop:8}}>
              {t('reportReviewNote')}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

// ─── MAP TAB (Leaflet) ─────────────────────────────────────────────────────────
const MapTab = ({ user, gauges, alerts, reports, loading, error, showReport, setShowReport, reportPrefill }) => {
  const mapRef = useRef(null);
  const leafRef = useRef(null);
  const markersRef = useRef({gauges:null, alerts:null, reports:null, user:null});
  const forecastLayersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const [searching, setSearching] = useState(false);
  
  const [layers, setLayers] = useState({
    stations:true, alerts:true, reports:false, sw_satellite:false, sw_station_updates:false,
    gw_levels:false, gw_aquifer:false, gw_recharge:false,
    wq_index:false, wq_turbidity:false, wq_contamination:false,
    cm_coastal_risk:false, cm_storm_surge:false, cm_erosion:false, cm_mangrove:false,
    fc_animation:false, fc_flood_extent:false, fc_population:false, fc_communities:false,
    fc_health:false, fc_schools:false, fc_farmland:false, fc_roads:false,
    fw_flood_extent:false, fw_population:false, fw_communities:false,
    fw_health:false, fw_schools:false, fw_farmland:false, fw_roads:false,
  });
  const [groupCollapsed, setGroupCollapsed] = useState({
    surface_water:true, groundwater:true, water_quality:true, coastal_marine:true,
    forecast:true, forecast_weekly:true,
  });
  const [mapErr, setMapErr] = useState(false);
  const riverLayerRef = useRef(null);
  const stationLayerRef = useRef(null);
  
  const [showLegend, setShowLegend] = useState(true); // New state for legend visibility
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [atlasUrl, setAtlasUrl]   = useState(null);
  const [atlasLabel, setAtlasLabel] = useState('');
  // Backend-driven layer visibility
  const [backendLayers, setBackendLayers] = useState({});

  useEffect(() => {
    fetch(API_BASE + '/map-layers')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!Array.isArray(data)) return;
        
        const map = {};
        data.forEach(l => { 
          map[l.layer_key] = l;
        });
        setBackendLayers(map);
        
        setLayers(prev => {
          const updated = {...prev};
          data.forEach(l => {
            if (l.layer_key in prev) {
              updated[l.layer_key] = !!l.default_visible;
            }
          });
          return updated;
        });
      })
      .catch(err => {
        console.error('Failed to fetch map-layers:', err);
      });
  }, []);

  // Init Leaflet
  useEffect(() => {
    if (leafRef.current || !mapRef.current) return;

    const initMap = () => {
      if (mapRef.current && mapRef.current._leaflet_id) {
        try {
          const existingMap = L.map(mapRef.current);
          existingMap.remove();
        } catch(e) {}
        mapRef.current._leaflet_id = null;
        while (mapRef.current.firstChild) {
          mapRef.current.removeChild(mapRef.current.firstChild);
        }
      }
      const map = L.map(mapRef.current, {
        center: [9.082, 8.675], 
        zoom: 6,
        zoomControl: true, 
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      leafRef.current = map;
      setMapReady(true);

      if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            setUserPos([latitude, longitude]);
            
            const userIcon = L.divIcon({
              className: 'user-location-marker',
              html: `<div style="position: relative;">
                <div style="width: 16px; height: 16px; background: #0EA5E9; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.4);"></div>
                <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: rgba(0,0,0,0.7); color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">
                  📍 You
                </div>
              </div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
              popupAnchor: [0, -10]
            });
            
            if (markersRef.current.user) {
              leafRef.current.removeLayer(markersRef.current.user);
            }
            
            markersRef.current.user = L.marker([latitude, longitude], { icon: userIcon })
              .bindPopup(`
                <b>📍 Your Location</b><br>
                Accuracy: ±${Math.round(accuracy)} meters<br>
                <small>Tap the 📍 button to center map</small>
              `)
              .addTo(leafRef.current);
            
            if (markersRef.current.accuracyCircle) {
              leafRef.current.removeLayer(markersRef.current.accuracyCircle);
            }
            markersRef.current.accuracyCircle = L.circle([latitude, longitude], {
              radius: accuracy,
              color: '#0EA5E9',
              fillColor: '#0EA5E9',
              fillOpacity: 0.1,
              weight: 1,
              opacity: 0.3
            }).addTo(leafRef.current);
            
            if (!window._nihsa_first_location_centered) {
              leafRef.current.flyTo([latitude, longitude], 12, { duration: 1.5 });
              window._nihsa_first_location_centered = true;
            }
          },
          (error) => {
            console.warn('Geolocation error:', error);
            setUserPos([9.082, 8.675]);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
        
        return () => {
          if (watchId) navigator.geolocation.clearWatch(watchId);
        };
      } else {
        setUserPos([9.082, 8.675]);
      }
    };

    initMap();

    return () => {
      if (leafRef.current) {
        try {
          Object.values(markersRef.current).forEach(m => {
            if (m && leafRef.current) {
              try { leafRef.current.removeLayer(m); } catch(e) {}
            }
          });
          markersRef.current = {};
          leafRef.current.off();
          leafRef.current.remove();
        } catch(e) {}
        leafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleMapSearch = (e) => {
      const { query } = e.detail || {};
      if (query && leafRef.current) {
        setSearchQ(query);
        // Trigger search
        api.nominatim(query).then(results => {
          if (results && results.length > 0) {
            const first = results[0];
            const lat = parseFloat(first.lat);
            const lng = parseFloat(first.lon);
            leafRef.current.flyTo([lat, lng], 12, { duration: 1.5 });
            L.popup()
              .setLatLng([lat, lng])
              .setContent(`<b>${first.display_name.slice(0, 80)}</b>`)
              .openOn(leafRef.current);
          }
        }).catch(() => {});
      }
    };
    
    window.addEventListener('nihsa:map-search', handleMapSearch);
    return () => window.removeEventListener('nihsa:map-search', handleMapSearch);
  }, []);

  // Draw river network
  useEffect(() => {
    if (!mapReady || !leafRef.current) return;
    if (!L) return;
    if (riverLayerRef.current) leafRef.current.removeLayer(riverLayerRef.current);
    if (!layers.rivers) return;
  }, [mapReady, layers.rivers]);

  // Draw all 358 stations
  useEffect(() => {
    if (!mapReady || !leafRef.current) return;
    if (!L) return;
    if (stationLayerRef.current) leafRef.current.removeLayer(stationLayerRef.current);
    if (!layers.stations) return;

    const group = L.layerGroup();
    STATIONS_REAL.forEach(([lng, lat, ha, name, river]) => {
      const col = HA_COL[ha] || '#4A7A9B';
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:6px;height:6px;border-radius:50%;background:${col};border:1px solid rgba(255,255,255,0.4);opacity:0.85"></div>`,
        iconSize: [6,6], iconAnchor: [3,3],
      });
      L.marker([lat, lng], {icon})
        .bindPopup(`<b>${name}</b><br>River: ${river}<br>HA-${ha}`)
        .addTo(group);
    });
    stationLayerRef.current = group.addTo(leafRef.current);
  }, [mapReady, layers.stations]);

  // Draw LSTM gauge markers
  useEffect(() => {
    if (!mapReady || !leafRef.current) return;
    if (!L) return;
    if (markersRef.current.gauges) leafRef.current.removeLayer(markersRef.current.gauges);
    if (!layers.gauges) return;

    const data = gauges.length ? gauges : GAUGES_STATIC;
    const group = L.layerGroup();
    data.forEach(g => {
      const col = RISK_COLOR(g.status || g.risk_level || 'NORMAL');
      const icon = L.divIcon({
        className:'',
        html: `<div style="position:relative">
          <div style="width:16px;height:16px;border-radius:50%;background:${col};border:3px solid rgba(255,255,255,0.9);box-shadow:0 0 8px ${col}80,0 0 0 4px ${col}30"></div>
          <div style="position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:9px;font-weight:700;color:#fff;text-shadow:0 1px 3px #000;font-family:monospace">${_esc(g.name||g.station_name)}</div>
        </div>`,
        iconSize:[16,16], iconAnchor:[8,8],
      });
      L.marker([g.lat, g.lng], {icon, zIndexOffset:1000})
        .bindPopup(`
          <div style="min-width:200px;font-family:sans-serif">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">📍 ${_esc(g.name||g.station_name)}</div>
            <div style="font-size:11px;color:#888">River: ${_esc(g.river||'—')} · ${_esc(g.state||'—')}</div>
            <div style="margin-top:8px;padding:8px;background:${col}20;border-radius:6px;margin-bottom:8px">
              <div style="font-size:10px;color:${col};font-weight:800;letter-spacing:0.05em">${_esc(g.status||g.risk_level||'NORMAL')}</div>
              <div style="font-size:13px;font-weight:700">Level: ${_esc(g.level||'—')}m</div>
              <div style="font-size:11px">Flow: ${g.flow ? (g.flow/1000).toFixed(1)+'k' : '—'} m³/s</div>
            </div>
            ${(g.status||g.risk_level||'NORMAL') !== 'NORMAL' ? `
            <div style="font-size:11px;color:#666;border-top:1px solid #eee;padding-top:6px">
              <b style="color:#333">Estimated impact:</b><br>
              👥 ${Math.round(50000 + (g.lat * 10000) % 150000).toLocaleString()} people at risk<br>
              🌾 ${Math.round(500 + (g.lng * 1000) % 4000).toLocaleString()} ha farmland<br>
              🛣️ ${Math.round(10 + (g.lat * 100) % 70)} km roads affected
            </div>` : ''}
          </div>
        `)
        .addTo(group);
    });
    markersRef.current.gauges = group.addTo(leafRef.current);
  }, [mapReady, gauges, layers.gauges]);

  // Draw active alerts
  useEffect(() => {
    if (!mapReady || !leafRef.current) return;
    if (!L) return;
    if (markersRef.current.alerts) leafRef.current.removeLayer(markersRef.current.alerts);
    if (!layers.alerts || !alerts.length) return;

    const group = L.layerGroup();
    
    alerts.forEach(a => {
      if (!a.lat && !a.lng) return;
      
      const col = RISK_COLOR(a.level);
      const level = a.level || 'WATCH';
      
      // Calculate radius based on severity (in meters)
      const getRadius = (level) => {
        switch(level) {
          case 'CRITICAL':
          case 'EXTREME':
          case 'SEVERE': return 2000; 
          case 'HIGH':
          case 'WARNING': return 1500;   
          case 'MEDIUM':
          case 'WATCH': return 1000;     
          default: return 750;           
        }
      };
      
      const radius = getRadius(level);
      
      // Add transparent circle (zone)
      const circle = L.circle([a.lat, a.lng], {
        radius: radius,
        color: col,
        fillColor: col,
        fillOpacity: 0.25,
        weight: 2,
        opacity: 0.6
      }).addTo(group);
      
      // Add star marker at the center
      const pulseIcon = L.divIcon({
        className: '',
        html: `<div style="
          position: relative;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 14px;
            height: 14px;
            background: ${col};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 10px ${col};
            animation: pulse 1.5s ease infinite;
          "></div>
          <div style="
            position: absolute;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: transparent;
            border: 1px solid ${col}80;
            animation: ping 1.5s ease infinite;
          "></div>
        </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
      });

      const marker = L.marker([a.lat, a.lng], { icon: pulseIcon, zIndexOffset: 500 })
        .bindPopup(`
          <div style="min-width: 220px; font-family: sans-serif;">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
              padding-bottom: 8px;
              border-bottom: 1px solid #eee;
            ">
              <span style="font-size: 20px;">⚠️</span>
              <div>
                <div style="font-weight: 700; font-size: 13px; color: #333;">
                  ${_esc(translateAlert(a.title || a.level))}
                </div>
                <div style="
                  display: inline-block;
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 10px;
                  font-weight: 700;
                  background: ${col}20;
                  color: ${col};
                  margin-top: 4px;
                ">
                  ${level}
                </div>
              </div>
            </div>
            
            <div style="font-size: 12px; color: #555; line-height: 1.5; margin-bottom: 8px;">
              ${_esc(translateAlert((a.message || a.msg || '').slice(0, 150)))}
            </div>
            
            ${a.state ? `
              <div style="
                font-size: 11px;
                color: #665;
                padding: 6px 8px;
                background: #f5f5f5;
                border-radius: 6px;
                margin-top: 8px;
              ">
                <span style="font-weight: 700;">📍 ${t('location')}:</span> ${_esc(a.state)}${a.lgas && a.lgas.length ? ` · ${_esc(a.lgas[0])}` : ''}
              </div>
            ` : ''}
            
            <div style="
              font-size: 10px;
              color: #999;
              margin-top: 8px;
              text-align: center;
              border-top: 1px solid #eee;
              padding-top: 8px;
            ">
              ⚠️ ${t('affectedZone')}: ${(radius / 1000).toFixed(1)}km radius
            </div>
          </div>
        `)
        .addTo(group);
        
      // Bind popup to circle as well
      circle.bindPopup(marker.getPopup());
    });
    
    markersRef.current.alerts = group.addTo(leafRef.current);
  }, [mapReady, alerts, layers.alerts]);

  // Draw verified reports
  useEffect(() => {
    if (!mapReady || !leafRef.current) return;
    if (!L) return;
    if (markersRef.current.reports) leafRef.current.removeLayer(markersRef.current.reports);
    if (!layers.reports || !reports.length) return;

    const group = L.layerGroup();
    reports.filter(r=>r.status==='VERIFIED'||r.ok).forEach(r => {
      const icon = L.divIcon({
        className:'',
        html: '<div style="font-size:20px;filter:drop-shadow(0 2px 4px #0007)">💧</div>',
        iconSize:[20,20], iconAnchor:[10,10],
      });
      
      // Build media preview HTML if media exists
      let mediaHtml = '';
      if (r.media_urls && r.media_urls.length > 0) {
        const firstMedia = r.media_urls[0];
        const isImage = firstMedia.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        if (isImage) {
          mediaHtml = `<div style="margin-top:8px"><img src="${firstMedia}" style="width:100%;max-width:150px;border-radius:6px;border:1px solid #ccc"/></div>`;
        } else if (firstMedia.includes('voice')) {
          mediaHtml = `<div style="margin-top:8px"><audio controls style="width:100%" src="${firstMedia}"></audio></div>`;
        }
      }
      
      L.marker([r.lat||r.location_lat||9.082, r.lng||r.location_lng||8.675], {icon})
        .bindPopup(`
          <div style="min-width:200px;font-family:sans-serif">
            <b>${_esc(r.user||r.reporter_name||'Citizen')}</b><br>
            📍 ${_esc(r.loc||r.location_name||r.address||'')}<br>
            💧 Depth: ${_esc(r.depth||r.water_depth||'—')}m<br>
            📝 ${_esc((r.desc||r.description||'').slice(0,100))}
            ${mediaHtml}
            ${r.media_urls && r.media_urls.length > 1 ? `<div style="margin-top:4px;font-size:10px;color:#666">📎 +${r.media_urls.length-1} more file(s)</div>` : ''}
          </div>
        `)
        .addTo(group);
    });
    markersRef.current.reports = group.addTo(leafRef.current);
  }, [mapReady, reports, layers.reports]);

  // ── Forecast GeoJSON layers (AFO 2026) ────────────────────────────────────
  
  const RISK_ZONE_COLORS = {
    watch:'#facc15', medium:'#fb923c', high:'#f97316', severe:'#ef4444', extreme:'#7f1d1d',
  };
  const FC_POINT_COLORS = {
    fc_population:'#60a5fa', fc_communities:'#34d399', fc_health:'#f472b6',
    fc_schools:'#a78bfa', fc_farmland:'#86efac', fc_roads:'#fbbf24',
    sw_satellite:'#38bdf8', sw_station_updates:'#f97316',
    gw_aquifer:'#34d399', gw_recharge:'#6ee7b7',
    wq_contamination:'#f87171',
    cm_coastal_risk:'#fb923c', cm_storm_surge:'#f97316',
    cm_erosion:'#d97706', cm_mangrove:'#4ade80',
  };


  useEffect(() => {
    if (!mapReady || !leafRef.current) {
      return;
    }
    
    if (!backendLayers || Object.keys(backendLayers).length === 0) {
      return;
    }

    const map = leafRef.current;

    // Get all geojson_fc layers from backend
    const geojsonLayers = Object.values(backendLayers).filter(
      layer => (layer.layer_type === 'geojson_fc' || layer.layer_type === 'geojson') && layer.is_active
    );

    geojsonLayers.forEach(layer => {
      const layerKey = layer.layer_key;
      const isOn = layers[layerKey];
      const existing = forecastLayersRef.current[layerKey];

      // Remove layer if toggled off
      if (!isOn) {
        if (existing) {
          try {
            map.removeLayer(existing);
          } catch (e) {}
          delete forecastLayersRef.current[layerKey];
        }
        return;
      }

      // Already loaded
      if (existing) return;

      // Use the source_url from backend
      let sourceUrl = layer.source_url;
      if (!sourceUrl) {
        console.warn(`Map layer ${layerKey}: No URL`);
        return;
      }

      // Fix relative URLs
      if (sourceUrl.startsWith('geojson/') || sourceUrl.startsWith('/geojson/')) {
        sourceUrl = `${ATLAS_BASE}/${sourceUrl}`;
      }

      const proxyUrl = `${API_BASE}/proxy/geojson?url=${encodeURIComponent(sourceUrl)}`;
      
      fetch(proxyUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.json();
        })
        .then(geojsonData => {
          if (!leafRef.current) return;

          // Validate GeoJSON
          if (!geojsonData || geojsonData.type !== 'FeatureCollection') {
            throw new Error('Invalid GeoJSON structure');
          }

          const featureCount = geojsonData.features?.length || 0;
          if (featureCount === 0) return;

          const firstFeature = geojsonData.features?.[0];
          const geometryType = firstFeature?.geometry?.type;

          // Color function
          const getColorFromDepthZone = (zone) => {
            const colors = {
              'watch': '#EAB308',
              'warning': '#EAB308', 
              'severe': '#F97316',
              'extreme': '#EF4444',
              'normal': '#10b981'
            };
            return colors[zone?.toLowerCase()] || '#facc15';
          };

          let leafletLayer;

          if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
            leafletLayer = L.geoJSON(geojsonData, {
              style: (feature) => {
                const zone = feature?.properties?.depth_zone || feature?.properties?.risk_zone || 'watch';
                const color = getColorFromDepthZone(zone);
                return {
                  color: color,
                  fillColor: color,
                  weight: 1,
                  fillOpacity: 0.35,
                  opacity: 0.8
                };
              },
              onEachFeature: (feature, l) => {
                const props = feature.properties || {};
                let popup = `<b>${props.name || layer.name || layerKey}</b>`;
                if (props.depth_m) popup += `<br>💧 Depth: ${props.depth_m}m`;
                if (props.depth_zone) popup += `<br>⚠️ Risk: ${props.depth_zone.toUpperCase()}`;
                if (props.state) popup += `<br>🏛️ ${props.state}`;
                if (props.lga) popup += `<br>📌 ${props.lga}`;
                l.bindPopup(popup);
              }
            });
          } else {
            leafletLayer = L.geoJSON(geojsonData, {
              pointToLayer: (feature, latlng) => {
                if (!latlng || isNaN(latlng.lat) || isNaN(latlng.lng)) {
                  return L.circleMarker([0, 0], { radius: 0 });
                }
                
                const zone = feature?.properties?.depth_zone || 'watch';
                const depth = feature?.properties?.depth_m || 0;
                
                let radius = 3;
                if (depth > 2.0) radius = 6;
                else if (depth > 1.0) radius = 5;
                
                const color = getColorFromDepthZone(zone);
                
                return L.circleMarker(latlng, {
                  radius: radius,
                  fillColor: color,
                  color: '#ffffff',
                  weight: 1.5,
                  fillOpacity: 0.85,
                  opacity: 1
                });
              },
              filter: (feature) => {
                if (feature.geometry && feature.geometry.coordinates) {
                  const coords = feature.geometry.coordinates;
                  return Array.isArray(coords) && coords.length >= 2 && 
                        !isNaN(coords[0]) && !isNaN(coords[1]) &&
                        coords[1] >= 4 && coords[1] <= 14 &&
                        coords[0] >= 2 && coords[0] <= 15;
                }
                return false;
              },
              onEachFeature: (feature, l) => {
                const props = feature.properties || {};
                let popup = `<b>${props.name || 'Location'}</b>`;
                if (props.depth_m) popup += `<br>💧 Depth: ${props.depth_m}m`;
                if (props.depth_zone) {
                  const zoneColor = getColorFromDepthZone(props.depth_zone);
                  popup += `<br>⚠️ Risk: <span style="color:${zoneColor};font-weight:bold">${props.depth_zone.toUpperCase()}</span>`;
                }
                if (props.state) popup += `<br>🏛️ ${props.state}`;
                if (props.lga) popup += `<br>📌 ${props.lga}`;
                l.bindPopup(popup);
              }
            });
          }

          if (leafletLayer) {
            if (forecastLayersRef.current[layerKey]) {
              map.removeLayer(forecastLayersRef.current[layerKey]);
            }
            forecastLayersRef.current[layerKey] = leafletLayer;
            leafletLayer.addTo(map);
            console.log(`✅ ${layerKey}: ${featureCount} points rendered`);
          }
        })
        .catch(err => {
          console.error(`${layerKey} fetch error:`, err);
        });
    });
    
  }, [mapReady, layers, backendLayers]);

  // Search
  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const r = await api.nominatim(searchQ);
      const results = r.slice(0, 5);
      setSearchRes(results);
      // Auto-fly if exactly one result
      if (results.length === 1) flyTo(results[0]);
    } catch {
      setSearchRes([]);
    }
    setSearching(false);
  };

  const flyTo = (r) => {
    if (!leafRef.current || !L) return;
    const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
    leafRef.current.flyTo([lat, lng], 12, {duration:1.5});
    L.popup().setLatLng([lat,lng]).setContent(`<b>${_esc(r.display_name.slice(0,80))}</b>`).openOn(leafRef.current);
    setSearchRes([]);
    setSearchQ('');
  };

  // My Location handler
  const handleMyLocation = () => {
    if (leafRef.current && userPos) {
      leafRef.current.flyTo(userPos, 14, { duration: 1 });
      if (markersRef.current.user) {
        const markerEl = markersRef.current.user.getElement();
        if (markerEl) {
          markerEl.style.animation = 'pulse 0.5s ease 2';
          setTimeout(() => {
            if (markerEl) markerEl.style.animation = '';
          }, 1000);
        }
      }
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            leafRef.current.flyTo([latitude, longitude], 14, { duration: 1 });
          },
          () => alert('Unable to get your location. Please enable GPS.')
        );
      } else {
        alert('Geolocation is not supported by your device.');
      }
    }
  };

  // ── Hydrological layer group definitions ──────────────────────────────────
  const LAYER_GROUPS = [
    {
      key:'forecast', icon:'📊', label:'Annual Forecast — AFO 2026',
      desc:'Annual Flood Outlook maps & model outputs — Full year forecast',
      layers:[
        {key:'fc_animation',    icon:'🎬', label:'Flood Animation 2026',    type:'atlas',    url:'flood_animation.html'},
        {key:'fc_flood_extent', icon:'💧', label:'Flood Extent & Depth',    type:'geojson_fc', geojson:'flood_extent.geojson'},
        {key:'fc_population',   icon:'👥', label:'Population at Risk',      type:'geojson_fc', geojson:'population.geojson'},
        {key:'fc_communities',  icon:'🏘️', label:'Communities at Risk',     type:'geojson_fc', geojson:'communities.geojson'},
        {key:'fc_health',       icon:'🏥', label:'Health Facilities',       type:'geojson_fc', geojson:'health.geojson'},
        {key:'fc_schools',      icon:'🏫', label:'Schools at Risk',         type:'geojson_fc', geojson:'schools.geojson'},
        {key:'fc_farmland',     icon:'🌾', label:'Farmland Exposure',       type:'geojson_fc', geojson:'farmland.geojson'},
        {key:'fc_roads',        icon:'🛣️', label:'Road Network at Risk',    type:'geojson_fc', geojson:'roads.geojson'},
      ],
    },
    {
      key:'surface_water', icon:'🌊', label:'Surface Water',
      desc:'Real-time river levels, alerts & flood reports',
      layers:[
        {key:'stations',     icon:'📍', label:'River Gauge Stations (358)', type:'toggle'},
        {key:'alerts',       icon:'⚠️', label:'Active Flood Alerts',        type:'toggle'},
        {key:'reports',      icon:'💧', label:'Citizen Flood Reports',      type:'toggle'},
        {key:'sw_satellite',       icon:'🛰️', label:'Satellite Flood Extent',      type:'geojson_fc', soon:true},
        {key:'sw_station_updates', icon:'📡', label:'Station Situation Updates',   type:'geojson_fc'},
      ],
    },
    {
      key:'forecast_weekly', icon:'📅', label:'Weekly Forecast',
      desc:'7-day flood outlook — upload weekly CSV data via Admin',
      layers:[
        {key:'fw_flood_extent', icon:'💧', label:'Flood Extent & Depth',  type:'geojson_fc', geojson:'weekly_flood_extent.geojson'},
        {key:'fw_population',   icon:'👥', label:'Population at Risk',    type:'geojson_fc', geojson:'weekly_population.geojson'},
        {key:'fw_communities',  icon:'🏘️', label:'Communities at Risk',   type:'geojson_fc', geojson:'weekly_communities.geojson'},
        {key:'fw_health',       icon:'🏥', label:'Health Facilities',     type:'geojson_fc', geojson:'weekly_health.geojson'},
        {key:'fw_schools',      icon:'🏫', label:'Schools at Risk',       type:'geojson_fc', geojson:'weekly_schools.geojson'},
        {key:'fw_farmland',     icon:'🌾', label:'Farmland Exposure',     type:'geojson_fc', geojson:'weekly_farmland.geojson'},
        {key:'fw_roads',        icon:'🛣️', label:'Road Network at Risk',  type:'geojson_fc', geojson:'weekly_roads.geojson'},
      ],
    },
    {
      key:'groundwater', icon:'🔵', label:'Groundwater',
      desc:'Borehole levels, aquifer & recharge zones',
      layers:[
        {key:'gw_levels',   icon:'🔵', label:'Groundwater Levels',  type:'toggle', soon:true},
        {key:'gw_aquifer',  icon:'🗺️', label:'Aquifer Zones',        type:'geojson', soon:true},
        {key:'gw_recharge', icon:'♻️', label:'Recharge Areas',       type:'geojson', soon:true},
      ],
    },
    {
      key:'water_quality', icon:'🧪', label:'Water Quality',
      desc:'WQI, turbidity & post-flood contamination risk',
      layers:[
        {key:'wq_index',         icon:'🧪', label:'Water Quality Index',      type:'toggle', soon:true},
        {key:'wq_turbidity',     icon:'🌊', label:'Turbidity / Sediment',     type:'toggle', soon:true},
        {key:'wq_contamination', icon:'⚗️', label:'Contamination Risk Zones', type:'geojson', soon:true},
      ],
    },
    {
      key:'coastal_marine', icon:'🏖️', label:'Coastal & Marine',
      desc:'Storm surge, erosion & mangrove buffer zones',
      layers:[
        {key:'cm_coastal_risk', icon:'🏖️', label:'Coastal Flood Risk',   type:'geojson', soon:true},
        {key:'cm_storm_surge',  icon:'🌀', label:'Storm Surge Zones',    type:'geojson', soon:true},
        {key:'cm_erosion',      icon:'⛰️', label:'Coastal Erosion Risk', type:'geojson', soon:true},
        {key:'cm_mangrove',     icon:'🌿', label:'Mangrove Buffer Zones',type:'geojson', soon:true},
      ],
    },
  ];

  const toggleLayer = (layer) => {
    if (layer.soon) return;
    if (layer.type === 'atlas') {
      const isOn = layers[layer.key];
      if (isOn) {
        setLayers(p=>({...p,[layer.key]:false}));
        setAtlasUrl(null); setAtlasLabel('');
      } else {
        setLayers(p=>({...p,[layer.key]:true}));
        setAtlasUrl(`${API_BASE}/proxy/html?url=${encodeURIComponent(ATLAS_BASE + '/' + layer.url)}`);
        setAtlasLabel(layer.label);
        setShowLayerPanel(false);
      }
    } else {
      setLayers(p=>({...p,[layer.key]:!p[layer.key]}));
    }
  };

  const Toggle = ({on, disabled}) => (
    <span style={{width:28,height:16,borderRadius:8,
      background:disabled?C.s2:on?C.primary:C.border,
      display:'inline-flex',alignItems:'center',
      justifyContent:on?'flex-end':'flex-start',
      padding:'0 2px',transition:'background 0.2s',flexShrink:0,opacity:disabled?0.4:1}}>
      <span style={{width:12,height:12,borderRadius:'50%',background:'#fff',display:'block'}}/>
    </span>
  );

  const RISK_LEGEND = [
    {level:'CRITICAL',label:'Critical / Extreme'},
    {level:'HIGH',label:'High Risk'},
    {level:'MEDIUM',label:'Low Risk'},
    {level:'WATCH',label:'Low Risk'},
  ];

  const LayerPanel = () => (
    <div style={{position:'absolute',top:10,left:10,zIndex:1000,minWidth:230}}>
      <button onClick={()=>setShowLayerPanel(p=>!p)}
        style={{display:'flex',alignItems:'center',gap:6,padding:'7px 12px',
          background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,
          color:C.bright,fontSize:12,fontWeight:700,cursor:'pointer',
          boxShadow:'0 2px 12px #0006',whiteSpace:'nowrap'}}>
        🗂️ {t('mapLayers')}
        <span style={{marginLeft:'auto',fontSize:10,color:C.muted}}>{showLayerPanel?'▲':'▼'}</span>
      </button>
      {showLayerPanel && (
        <div style={{
          marginTop:6,
          background:C.surface,
          border:`1px solid ${C.border}`,
          borderRadius:10,
          overflowY:'auto',
          boxShadow:'0 4px 20px #0008',
          maxHeight:'calc(100vh - 200px)',
          width:280,
          maxWidth:'calc(100vw - 40px)',
        }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:'10px 14px',borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontSize:12,fontWeight:700,color:C.bright}}>🗂️ {t('mapLayers')}</span>
            <button onClick={()=>setShowLayerPanel(false)}
              style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:16,lineHeight:1}}>✕</button>
          </div>

          {/* Tutorial button at top of panel */}
          <button
            onClick={() => {
              setShowLayerPanel(false);
              window.dispatchEvent(new CustomEvent('nihsa:show-tutorial', { detail: { topic: 'map' } }));
            }}
            style={{
              display:'flex', alignItems:'center', gap:8,
              width:'100%', padding:'10px 14px',
              background:`${C.primary}12`, border:'none',
              borderBottom:`1px solid ${C.border}`,
              color:C.accent, fontSize:12, fontWeight:700,
              cursor:'pointer', textAlign:'left',
            }}>
            <span style={{fontSize:14}}>❓</span>
            <span>How to use the Map & Layers</span>
            <span style={{marginLeft:'auto', fontSize:10, color:C.muted}}>Tutorial →</span>
          </button>

          {LAYER_GROUPS.map(group => {
            const collapsed = groupCollapsed[group.key];
            const activeCount = group.layers.filter(l=>layers[l.key]).length;
            return (
              <div key={group.key} style={{borderBottom:`1px solid ${C.border}`}}>
                <button
                  onClick={()=>setGroupCollapsed(p=>({...p,[group.key]:!p[group.key]}))}
                  style={{display:'flex',alignItems:'center',gap:8,width:'100%',
                    padding:'9px 14px',background:'none',border:'none',
                    cursor:'pointer',textAlign:'left'}}>
                  <span style={{fontSize:14,flexShrink:0}}>{group.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.bright}}>
                      {t(group.key === 'forecast' ? 'annualForecast' : 
                        group.key === 'surface_water' ? 'surfaceWater' :
                        group.key === 'forecast_weekly' ? 'weeklyForecast' :
                        group.key === 'groundwater' ? 'groundwater' :
                        group.key === 'water_quality' ? 'waterQuality' : 'coastalMarine')}
                    </div>
                    <div style={{fontSize:10,color:C.muted,lineHeight:1.3}}>
                      {t(group.key === 'forecast' ? 'annualForecastDesc' : 
                        group.key === 'surface_water' ? 'surfaceWaterDesc' :
                        group.key === 'forecast_weekly' ? 'weeklyForecastDesc' :
                        group.key === 'groundwater' ? 'groundwaterDesc' :
                        group.key === 'water_quality' ? 'waterQualityDesc' : 'coastalMarineDesc')}
                    </div>
                  </div>
                  {activeCount > 0 && (
                    <span style={{fontSize:10,fontWeight:700,padding:'1px 5px',borderRadius:4,
                      background:`${C.primary}30`,color:C.accent}}>{activeCount}</span>
                  )}
                  <span style={{fontSize:10,color:C.muted,flexShrink:0}}>{collapsed?'▼':'▲'}</span>
                </button>

                {!collapsed && (
                  <div style={{padding:'4px 10px 10px 10px',display:'flex',flexDirection:'column',gap:4}}>
                    {group.layers.every(l=>l.soon && !(backendLayers[l.key]?.meta?.data_file)) && (
                      <div style={{display:'flex',gap:8,alignItems:'flex-start',
                        padding:'8px 10px',marginBottom:2,
                        background:`${C.warning}12`,border:`1px solid ${C.warning}30`,
                        borderRadius:8}}>
                        <span style={{fontSize:14,flexShrink:0}}>🔬</span>
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:C.warning,marginBottom:2}}>{t('dataComingSoon')}</div>
                          <div style={{fontSize:10,color:C.muted,lineHeight:1.4}}>{t('layerGroupDevelopment')}</div>
                        </div>
                      </div>
                    )}
                    {group.layers.filter(layer => {
                      const bl = backendLayers[layer.key];
                      return bl ? bl.is_active : true;
                    }).map(layer => {
                      const isOn = !!layers[layer.key];
                      const bl = backendLayers[layer.key];
                      const isSoon = layer.soon && !(bl?.meta?.data_file);
                      
                      const getLayerLabel = (key) => {
                        const mapping = {
                          'fc_animation': 'floodAnimation',
                          'fc_flood_extent': 'floodExtentDepth',
                          'fc_population': 'populationAtRisk',
                          'fc_communities': 'communitiesAtRisk',
                          'fc_health': 'healthFacilities',
                          'fc_schools': 'schoolsAtRisk',
                          'fc_farmland': 'farmlandExposure',
                          'fc_roads': 'roadNetworkAtRisk',
                          'stations': 'riverGaugeStations',
                          'alerts': 'activeFloodAlertsLayer',
                          'reports': 'citizenFloodReports',
                          'sw_satellite': 'satelliteFloodExtent',
                          'sw_station_updates': 'stationSituationUpdates',
                          'fw_flood_extent': 'floodExtentDepth',
                          'fw_population': 'populationAtRisk',
                          'fw_communities': 'communitiesAtRisk',
                          'fw_health': 'healthFacilities',
                          'fw_schools': 'schoolsAtRisk',
                          'fw_farmland': 'farmlandExposure',
                          'fw_roads': 'roadNetworkAtRisk',
                          'gw_levels': 'groundwaterLevels',
                          'gw_aquifer': 'aquiferZones',
                          'gw_recharge': 'rechargeAreas',
                          'wq_index': 'waterQualityIndex',
                          'wq_turbidity': 'turbiditySediment',
                          'wq_contamination': 'contaminationRiskZones',
                          'cm_coastal_risk': 'coastalFloodRisk',
                          'cm_storm_surge': 'stormSurgeZones',
                          'cm_erosion': 'coastalErosionRisk',
                          'cm_mangrove': 'mangroveBufferZones',
                        };
                        return t(mapping[key] || key);
                      };
                      
                      return (
                        <button key={layer.key}
                          onClick={()=>toggleLayer(layer)}
                          disabled={isSoon}
                          style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',
                            borderRadius:7,border:`1px solid ${isOn?C.primary:C.border}`,
                            background:isOn?`${C.primary}18`:'transparent',
                            color:isSoon?C.muted:isOn?C.accent:C.text,
                            cursor:isSoon?'default':'pointer',
                            fontSize:11,fontWeight:isOn?700:500,textAlign:'left',
                            opacity:isSoon?0.6:1}}>
                          <span style={{fontSize:13,flexShrink:0}}>{layer.icon}</span>
                          <span style={{flex:1,lineHeight:1.3}}>{getLayerLabel(layer.key)}</span>
                          {isSoon
                            ? <span style={{fontSize:9,fontWeight:700,padding:'1px 4px',borderRadius:3,
                                background:`${C.warning}20`,color:C.warning,flexShrink:0}}>{t('soon')}</span>
                            : <Toggle on={isOn} />
                          }
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Floating Legend Component (separate from Layer Panel) ──
  const FloatingLegend = () => {
    
    const legendItems = [
      {level:'CRITICAL', label: t('criticalExtreme')},
      {level:'HIGH', label: t('highRisk')},
      {level:'MEDIUM', label: t('lowRisk')},
    ];

    return (
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 10,
        zIndex: 1000,
        minWidth: 160,
        maxWidth: 200,
      }}>
        {showLegend && (
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: `${C.primary}15`,
              borderBottom: `1px solid ${C.border}`,
              cursor: 'pointer',
            }} onClick={() => setShowLegend(false)}>
              <span style={{fontSize: 11, fontWeight: 700, color: C.bright}}>📖 {t('legend')}</span>
              <span style={{fontSize: 12, color: C.muted, cursor: 'pointer'}}>✕</span>
            </div>
            <div style={{padding: '10px 12px'}}>
              {legendItems.map(({level, label}) => (
                <div key={level} style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: RISK_COLOR(level),
                    flexShrink: 0,
                    boxShadow: `0 0 4px ${RISK_COLOR(level)}`
                  }}/>
                  <span style={{fontSize: 10, color: C.text}}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            style={{
              padding: '8px 12px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.bright,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
            }}
          >
            📖 {t('legend')}
          </button>
        )}
      </div>
    );
  };

  // ── Floating My Location Button ──
  const FloatingMyLocation = () => (
    <div style={{
      position: 'absolute',
      bottom: showLegend ? 200 : 80,
      right: 10,
      zIndex: 1000,
    }}>
      <button
        onClick={handleMyLocation}
        style={{
          width: 44,
          height: 44,
          borderRadius: 44,
          background: C.surface,
          border: `1px solid ${C.border}`,
          color: C.accent,
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = C.s2}
        onMouseLeave={e => e.currentTarget.style.background = C.surface}
        title={t('myLocation')}
      >
        📍
      </button>
    </div>
  );

  // ── Alert ticker & popup notifications state ──
  const [tickerAlerts, setTickerAlerts] = useState([
    { id:1, level:'SEVERE',  text:'Flood Warning — Lokoja, Kogi State',    lat:7.80, lng:6.75 },
    { id:2, level:'WARNING', text:'River Benue Rising — Makurdi',           lat:7.75, lng:8.53 },
    { id:3, level:'WARNING', text:'Heavy Rainfall Alert — Onitsha',         lat:6.16, lng:6.78 },
    { id:4, level:'WATCH',   text:'River Watch — Wuroboki, Taraba State',   lat:8.02, lng:10.20 },
    { id:5, level:'WATCH',   text:'River Niger Rising — Baro, Niger State', lat:8.58, lng:6.38 },
  ]);
  const [popupNotifs, setPopupNotifs] = useState([]);
  const tickerPosRef = useRef(0);
  const tickerRAFRef = useRef(null);
  const tickerDivRef = useRef(null);

  // Load live ML alerts into ticker when available
  useEffect(() => {
    fetch(API_BASE + '/forecast/ml/alerts')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.alerts) {
          const live = d.alerts
            .filter(a => a.nffs_level !== 'NONE')
            .map((a,i) => ({
              id: i+1,
              level: a.app_level,
              text: `${a.headline} — ${a.station_name}${a.state ? `, ${a.state} State` : ''}`,
              lat: a.lat, lng: a.lon,
            }));
          if (live.length > 0) setTickerAlerts(live);
        }
      })
      .catch(() => {});
  }, []);

  // RAF-based smooth ticker
  useEffect(() => {
    const SPEED = 0.6;
    const animate = () => {
      if (tickerDivRef.current) {
        tickerPosRef.current -= SPEED;
        const totalW = tickerDivRef.current.scrollWidth / 3;
        if (Math.abs(tickerPosRef.current) >= totalW) tickerPosRef.current = 0;
        tickerDivRef.current.style.transform = `translateX(${tickerPosRef.current}px)`;
      }
      tickerRAFRef.current = requestAnimationFrame(animate);
    };
    tickerRAFRef.current = requestAnimationFrame(animate);
    return () => { if (tickerRAFRef.current) cancelAnimationFrame(tickerRAFRef.current); };
  }, []);

  // Only show popup for genuinely new alerts
  const seenAlertIdsRef = useRef(new Set());
  const lastPopupTimeRef = useRef(Date.now());
  const currentAlertIndexRef = useRef(0);

  useEffect(() => {
    const showNextAlertPopup = () => {
      const now = Date.now();
      // Only show if at least 30 seconds have passed
      if (now - lastPopupTimeRef.current < 10000) return;
      
      const activeAlerts = (Array.isArray(alerts) ? alerts : []).filter(a => 
        a.is_active !== false && (a.lat || a.lng)
      );
      
      if (activeAlerts.length === 0) return;
      
      // Cycle through all active alerts
      const alertIndex = currentAlertIndexRef.current % activeAlerts.length;
      const nextAlert = activeAlerts[alertIndex];
      
      const nid = Date.now() + Math.random();
      const notif = {
        nid,
        level: nextAlert.level || 'WATCH',
        text: translateAlert(nextAlert.title || nextAlert.level),
        lat: nextAlert.lat,
        lng: nextAlert.lng,
      };
      
      setPopupNotifs(p => [...p.slice(-2), notif]);
      lastPopupTimeRef.current = now;
      currentAlertIndexRef.current = alertIndex + 1;
      
      // Auto-remove after 6 seconds
      setTimeout(() => setPopupNotifs(p => p.filter(n => n.nid !== nid)), 8000);
    };
    
    // Reset index when alerts change
    currentAlertIndexRef.current = 0;
    
    // Show first alert after 2 seconds
    const initialTimer = setTimeout(showNextAlertPopup, 2000);
    
    // Then cycle every 30 seconds
    const interval = setInterval(showNextAlertPopup, 30000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [alerts]);

  const flyToAlert = (a) => {
    if (!leafRef.current || !L) return;
    leafRef.current.flyTo([a.lat, a.lng], 11, { duration: 1.5 });
  };

  return (
    <div style={{position:'relative', height:'calc(100vh - 120px)', display:'flex', flexDirection:'column'}}>

      {/* ── Popup notifications (top-left) ───── */}
      <div style={{
        position:'absolute',
        top:10,
        right:12,  
        zIndex:9999,
        display:'flex',
        flexDirection:'column',
        gap:8,
        maxWidth:290,
        pointerEvents:'none'
      }}>
        {popupNotifs.map(n => (
          <div key={n.nid}
            style={{background:C.surface,border:`1px solid ${RISK_COLOR(n.level)}`,
              borderLeft:`4px solid ${RISK_COLOR(n.level)}`,
              borderRadius:10,padding:'10px 14px',
              boxShadow:'0 4px 20px #0008',animation:'slideIn 0.3s ease',
              display:'flex',gap:10,alignItems:'flex-start',pointerEvents:'auto'}}>
            <span style={{fontSize:18,flexShrink:0,cursor:'pointer'}} onClick={() => flyToAlert(n)}>
              {n.level==='SEVERE'||n.level==='HIGH'?'🔴':n.level==='WARNING'||n.level==='MEDIUM'?'⚠️':'👀'}
            </span>
            <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={() => flyToAlert(n)}>
              <div style={{fontSize:10,fontWeight:800,color:RISK_COLOR(n.level),letterSpacing:'0.06em'}}>
                {n.level === 'CRITICAL' || n.level === 'EXTREME' || n.level === 'SEVERE' ? t('criticalExtreme').toUpperCase() : 
                n.level === 'HIGH' || n.level === 'WARNING' ? t('highRisk').toUpperCase() : 
                t('lowRisk').toUpperCase()} {t('alert').toUpperCase()}
              </div>
              <div style={{fontSize:12,color:C.bright,marginTop:2,lineHeight:1.4}}>{n.text}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:3}}>{t('tapToZoom')}</div>
            </div>
            <button onClick={() => setPopupNotifs(p => p.filter(x => x.nid !== n.nid))}
              style={{background:'none',border:'none',color:C.muted,cursor:'pointer',
                fontSize:16,lineHeight:1,padding:'0 2px',flexShrink:0,alignSelf:'flex-start'}}>
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ 
        padding: '10px 16px', 
        background: C.surface, 
        borderBottom: `1px solid ${C.border}`, 
        display: 'flex', 
        gap: 8, 
        flexShrink: 0,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search input */}
        <div style={{ 
          flex: '1 1 200px',
          minWidth: '150px',
          position: 'relative'
        }}>
          <input 
            value={searchQ} 
            onChange={e=>setSearchQ(e.target.value)} 
            onKeyDown={e=>e.key==='Enter'&&handleSearch()}
            placeholder={`🔍  ${t('searchPlaceholder')}`}
            style={{
              width: '100%',
              padding: '9px 14px',
              background: C.s2,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.bright,
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box'
            }} 
          />
          {searchRes.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: C.s3,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              zIndex: 10000,
              overflow: 'hidden',
              marginTop: 4
            }}>
              {searchRes.map((r, i) => (
                <div 
                  key={i} 
                  onClick={() => flyTo(r)} 
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: C.text,
                    borderBottom: `1px solid ${C.border}`
                  }}
                >
                  📍 {r.display_name.slice(0, 70)}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Button group */}
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          flexWrap: 'wrap',
          flexShrink: 0
        }}>
          {/* Search button */}
          <button 
            onClick={handleSearch} 
            style={{
              padding: '9px 16px',
              background: C.primary,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 13,
              whiteSpace: 'nowrap'
            }}
          >
            {searching ? '...' : t('searchBtn')}
          </button>
          
          {/* Report Flood button */}
          <button 
            onClick={() => setShowReport(true)} 
            style={{
              padding: '9px 14px',
              background: `linear-gradient(135deg,${C.danger},#DC2626)`,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 13,
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            🚨 {t('reportFloodBtn')}
          </button>
        </div>
      </div>

      {/* Map container */}
      <div style={{flex:1, position:'relative'}}>
        {mapErr ? (
          <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,background:C.bg}}>
            <div style={{fontSize:32}}>🗺️</div>
            <div style={{color:C.muted,fontSize:13,textAlign:'center'}}>Map unavailable — network required for OpenStreetMap tiles<br/>All other platform features remain fully operational</div>
          </div>
        ) : (
          <div ref={mapRef} style={{height:'100%', width:'100%', background:C.bg}} />
        )}
        {!mapReady && !mapErr && (
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:C.bg,flexDirection:'column',gap:12}}>
            <Spinner size={32} />
            <div style={{color:C.muted,fontSize:13}}>Loading map…</div>
          </div>
        )}
        
        {/* Flood Animation 2026 — bottom drawer */}
        {atlasUrl && (
          <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:2000,
            height:'56%',display:'flex',flexDirection:'column',
            borderTop:`2px solid ${C.primary}`,boxShadow:'0 -4px 28px #0009'}}>
            <div style={{padding:'6px 14px',background:C.surface,
              display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0,gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:12,fontWeight:700,color:C.bright}}>🎬 AFO 2026 — Flood Animation</span>
                <span style={{fontSize:10,color:C.muted,padding:'1px 6px',background:`${C.primary}20`,borderRadius:4}}>Monthly Player</span>
              </div>
              <button onClick={()=>{
                setAtlasUrl(null); setAtlasLabel('');
                setLayers(p=>({...p, fc_animation:false}));
              }}
                style={{padding:'4px 10px',background:`${C.danger}18`,border:`1px solid ${C.danger}30`,
                  borderRadius:6,color:C.danger,fontSize:11,fontWeight:700,cursor:'pointer',flexShrink:0}}>
                ✕ Close
              </button>
            </div>
            <iframe src={atlasUrl} style={{flex:1,border:'none',width:'100%',background:C.bg}} title="Flood Animation" />
          </div>
        )}
        
        {/* Layer Panel */}
        <LayerPanel />
        
        {/* Floating Legend */}
        <FloatingLegend />
        
        {/* Floating My Location Button */}
        <FloatingMyLocation />
        
        
        
      </div>

      {showReport && <ReportModal user={user} onClose={()=>setShowReport(false)} />}

    
    </div>
  );
};

// ─── ALERT TICKER (always-visible news-style bar) ──────────────────────────────


const AlertTicker = ({ alerts }) => {
  const tickerPosRef = useRef(0);
  const tickerRAFRef = useRef(null);
  const tickerDivRef = useRef(null);

  // Check if there are any real alerts
  const hasAlerts = alerts && alerts.length > 0;
  
  const items = hasAlerts
  ? alerts.map((a) => ({
      level: a.level || a.risk_level || 'WATCH',
      text: translateAlert(`${a.title || a.msg || a.message || ''} — ${a.state || ''}`.trim().replace(/— $/, '')),
    }))
  : [{ level: 'NORMAL', text: '✅ ' + t('noAlertsNormal') }];

  useEffect(() => {
    const SPEED = 0.5;
    const animate = () => {
      if (tickerDivRef.current) {
        tickerPosRef.current -= SPEED;
        const totalW = tickerDivRef.current.scrollWidth / 3;
        // Guard: only reset when we have real width (layout complete)
        if (totalW > 0 && Math.abs(tickerPosRef.current) >= totalW) {
          tickerPosRef.current = 0;
        }
        tickerDivRef.current.style.transform = `translateX(${tickerPosRef.current}px)`;
      }
      tickerRAFRef.current = requestAnimationFrame(animate);
    };
    // Small delay so layout is computed before animation starts
    const t0 = setTimeout(() => {
      tickerRAFRef.current = requestAnimationFrame(animate);
    }, 100);
    return () => {
      clearTimeout(t0);
      if (tickerRAFRef.current) cancelAnimationFrame(tickerRAFRef.current);
    };
  }, []);

  return (
    <div style={{
      height: 36,
      background: hasAlerts ? '#0D1117' : '#10B981',  // ← Green when no alerts, dark when alerts exist
      borderTop: `1px solid ${C.border}`,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{
        background: hasAlerts ? C.danger : '#047857',  // ← Darker green for the label
        padding: '0 12px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 2,
        fontSize: 11,
        fontWeight: 800,
        color: '#fff',
        letterSpacing: '0.06em',
        gap: 5,
        whiteSpace: 'nowrap'
      }}>
        <span style={{
          animation: hasAlerts ? 'pulse 1.5s ease infinite' : 'none',
          display: 'inline-block'
        }}>
          {hasAlerts ? '⚠' : '✅'}
        </span>
        {hasAlerts ? t('liveAlerts') : t('allClear')}
      </div>
      <div style={{flex: 1, overflow: 'hidden', position: 'relative', height: '100%'}}>
        <div ref={tickerDivRef}
          style={{
            display: 'inline-flex',
            position: 'absolute',
            top: 0,
            left: 0,
            whiteSpace: 'nowrap',
            willChange: 'transform',
            height: '100%',
            alignItems: 'center'
          }}>
          {(hasAlerts ? [...items, ...items, ...items] : items).map((a, i) => (
            <div key={i} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 28px',
              borderRight: `1px solid ${C.border}30`,
              height: 36,
              flexShrink: 0
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: hasAlerts ? RISK_COLOR(a.level) : '#34D399',
                display: 'inline-block',
                flexShrink: 0,
                boxShadow: hasAlerts ? `0 0 6px ${RISK_COLOR(a.level)}` : 'none'
              }}/>
              <span style={{
                fontSize: 12,
                color: hasAlerts ? C.bright : '#064E3B',
                fontWeight: 600
              }}>
                {a.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD TAB ─────────────────────────────────────────────────────────────
// ─── NFFS ANNUAL ATLAS PANEL ───────────────────────────────────────────────────
const ATLAS_LAYERS_DEF = [
  { key:'communities', icon:'🏘️', label:'Communities',   file:'P4_Annual_communities_table.csv', mapFile:'P4_Annual_communities_map.html' },
  { key:'health',      icon:'🏥', label:'Health Centres',file:'P4_Annual_health_table.csv',      mapFile:'P4_Annual_health_map.html' },
  { key:'education',   icon:'🏫', label:'Schools',        file:'P4_Annual_education_table.csv',   mapFile:'P4_Annual_education_map.html' },
  { key:'farmland',    icon:'🌾', label:'Farmland (ha)',  file:'P4_Annual_farmland_table.csv',    mapFile:'P4_Annual_farmland_map.html' },
  { key:'roads',       icon:'🛣️', label:'Roads',          file:'P4_Annual_roads_table.csv',       mapFile:'P4_Annual_roads_map.html' },
  { key:'electricity', icon:'⚡', label:'Electricity',   file:'P4_Annual_electricity_table.csv', mapFile:'P4_Annual_electricity_map.html' },
  { key:'markets',     icon:'🏪', label:'Markets',        file:'P4_Annual_markets_table.csv',     mapFile:'P4_Annual_markets_map.html' },
];

const AtlasAnnualPanel = () => {
  const [data, setData] = useState(null);
  const [states, setStates] = useState([]);
  const [filter, setFilter] = useState('');
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    Promise.all(
      ATLAS_LAYERS_DEF.map(l =>
        fetch(`${API_BASE}/proxy/csv?url=${encodeURIComponent(`${ATLAS_BASE}/${l.file}`)}`)
          .then(r => r.ok ? r.text() : Promise.reject(new Error('not ok')))
          .then(txt => {
            const lines = txt.trim().split('\n').slice(1);
            const map = {};
            lines.forEach(row => {
              const cols = row.split(',');
              const state = cols[2]?.trim();
              const count = parseInt(cols[4]) || 0;
              if (state) map[state] = (map[state] || 0) + count;
            });
            return { key: l.key, map };
          })
      )
    ).then(results => {
      const agg = {};
      const allStates = new Set();
      results.forEach(({ key, map }) => {
        Object.entries(map).forEach(([state, total]) => {
          allStates.add(state);
          if (!agg[state]) agg[state] = {};
          agg[state][key] = (agg[state][key] || 0) + total;
        });
      });
      setData(agg);
      setStates([t('allNigeria'), ...Array.from(allStates).sort()]);
    }).catch(() => setLoadErr(true));
  }, []);

  const isAll = !filter || filter === t('allNigeria');
  const displayData = isAll ? (data || {}) : (data ? { [filter]: data[filter] || {} } : {});
  const totals = {};
  ATLAS_LAYERS_DEF.forEach(l => { totals[l.key] = 0; });
  Object.values(displayData).forEach(sd => {
    ATLAS_LAYERS_DEF.forEach(l => { totals[l.key] += sd[l.key] || 0; });
  });

  return (
    <Card style={{marginBottom:16}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.bright}}>{t('annualFloodOutlook2026')}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{t('nffsVersion')}</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <select value={filter} onChange={e=>setFilter(e.target.value)}
            style={{padding:'6px 10px',background:C.s2,border:`1px solid ${C.border}`,
              borderRadius:6,color:C.bright,fontSize:12,cursor:'pointer',minWidth:140}}>
            {(states.length ? states : [t('allNigeria')]).map(s => (
              <option key={s} value={s === t('allNigeria') ? '' : s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {loadErr ? (
        <div style={{padding:'24px',textAlign:'center',color:C.muted,fontSize:12,background:C.s2,borderRadius:8}}>
          {t('atlasDataUnavailable')}
        </div>
      ) : !data ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10}}>
          {ATLAS_LAYERS_DEF.map(l => <Skeleton key={l.key} h={80} r={10} />)}
        </div>
      ) : (
        <>
          <div className="dashboard-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10, marginBottom:16}}>
            {ATLAS_LAYERS_DEF.map(l => {
              const labelMapping = {
                'communities': 'communities',
                'health': 'healthCentres',
                'education': 'schools',
                'farmland': 'farmland',
                'roads': 'roads',
                'electricity': 'electricity',
                'markets': 'markets',
              };
              return (
                <div key={l.key} style={{textDecoration:'none',color:'inherit'}}>
                  <div style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:10,
                    padding:'12px 14px',cursor:'pointer',transition:'border-color 0.15s'}}
                    onMouseOver={e=>e.currentTarget.style.borderColor=C.primary}
                    onMouseOut={e=>e.currentTarget.style.borderColor=C.border}>
                    <div style={{fontSize:20,marginBottom:5}}>{l.icon}</div>
                    <div style={{fontSize:10,fontWeight:600,color:C.muted,marginBottom:4,lineHeight:1.3}}>{t(labelMapping[l.key] || l.key)}</div>
                    <div style={{fontSize:22,fontWeight:900,color:C.danger,fontFamily:'Rajdhani,sans-serif',lineHeight:1}}>
                      {(totals[l.key] || 0).toLocaleString()}
                    </div>
                    <div style={{fontSize:9,color:C.muted,marginTop:3}}>{t('atRisk')}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {!isAll && (
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.06em',marginBottom:8}}>
                {filter.toUpperCase()} {t('stateBreakdown')}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
                {ATLAS_LAYERS_DEF.map(l => {
                  const labelMapping = {
                    'communities': 'communities',
                    'health': 'healthCentres',
                    'education': 'schools',
                    'farmland': 'farmland',
                    'roads': 'roads',
                  };
                  return (
                    <div key={l.key} style={{display:'flex',justifyContent:'space-between',
                      padding:'6px 10px',background:C.s2,borderRadius:6,fontSize:12}}>
                      <span style={{color:C.muted}}>{l.icon} {t(labelMapping[l.key] || l.key)}</span>
                      <span style={{fontWeight:700,color:C.bright}}>
                        {(data[filter]?.[l.key] || 0).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[
                  { label: t('floodAnimationLink'), url: `${ATLAS_BASE}/flood_animation.html` },
                  { label: t('floodExtentMap'), url: `${ATLAS_BASE}/P4_Annual_flood_extent_map.html` },
                ].map(link => (
                  <a key={link.label} href={link.url} target="_blank" rel="noreferrer"
                    style={{padding:'5px 12px',background:C.s2,border:`1px solid ${C.border}`,
                      borderRadius:6,color:C.accent,fontSize:11,fontWeight:600,textDecoration:'none'}}>
                    {link.label} ↗
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

const AtlasWeeklyPanel = () => {
  const [data, setData] = useState(null);
  const [states, setStates] = useState([]);
  const [filter, setFilter] = useState('');
  const [loadErr, setLoadErr] = useState(false);

  const WEEKLY_LAYERS_DEF = [
    { key:'communities', icon:'🏘️', label:'Communities',   geojson:'weekly_communities.geojson' },
    { key:'population',  icon:'👥', label:'Population',    geojson:'weekly_population.geojson' },
    { key:'health',      icon:'🏥', label:'Health Centres',geojson:'weekly_health.geojson' },
    { key:'education',   icon:'🏫', label:'Schools',        geojson:'weekly_schools.geojson' },
    { key:'farmland',    icon:'🌾', label:'Farmland',       geojson:'weekly_farmland.geojson' },
    { key:'roads',       icon:'🛣️', label:'Roads',          geojson:'weekly_roads.geojson' },
  ];

  useEffect(() => {
    Promise.all(
      WEEKLY_LAYERS_DEF.map(l =>
        fetch(`${ATLAS_BASE}/geojson/${l.geojson}`)
          .then(r => r.ok ? r.json() : Promise.reject())
          .then(fc => {
            const map = {};
            (fc.features || []).forEach(f => {
              const state = f.properties?.state || 'Unknown';
              map[state] = (map[state] || 0) + 1;
            });
            return { key: l.key, map };
          })
          .catch(() => ({ key: l.key, map: {} }))
      )
    ).then(results => {
      const agg = {};
      const allStates = new Set();
      results.forEach(({ key, map }) => {
        Object.entries(map).forEach(([state, total]) => {
          allStates.add(state);
          if (!agg[state]) agg[state] = {};
          agg[state][key] = (agg[state][key] || 0) + total;
        });
      });
      if (Object.keys(agg).length === 0) { setLoadErr(true); return; }
      setData(agg);
      setStates([t('allNigeria'), ...Array.from(allStates).sort()]);
    }).catch(() => setLoadErr(true));
  }, []);

  const isAll = !filter || filter === t('allNigeria');
  const displayData = isAll ? (data || {}) : (data ? { [filter]: data[filter] || {} } : {});
  const totals = {};
  WEEKLY_LAYERS_DEF.forEach(l => { totals[l.key] = 0; });
  Object.values(displayData).forEach(sd => {
    WEEKLY_LAYERS_DEF.forEach(l => { totals[l.key] += sd[l.key] || 0; });
  });

  if (loadErr || !data) return (
    <Card>
      <div style={{textAlign:'center',padding:32,color:C.muted}}>
        <div style={{fontSize:28,marginBottom:8}}>📅</div>
        <div style={{fontSize:13,fontWeight:600,color:C.bright,marginBottom:6}}>{t('noWeeklyForecastData')}</div>
        <div style={{fontSize:12,lineHeight:1.6}}>
          {t('weeklyForecastUploadPrompt')}<br/>
          <b>{t('goToAdminMapLayers')}</b>
        </div>
      </div>
    </Card>
  );

  return (
    <Card style={{marginBottom:16}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.bright}}>{t('weeklyFloodForecast')}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{t('current7DayOutlook')}</div>
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          style={{padding:'6px 10px',background:C.s2,border:`1px solid ${C.border}`,
            borderRadius:6,color:C.bright,fontSize:12,cursor:'pointer',minWidth:140}}>
          {(states.length ? states : [t('allNigeria')]).map(s => (
            <option key={s} value={s === t('allNigeria') ? '' : s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="dashboard-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10, marginBottom:16}}>
        {WEEKLY_LAYERS_DEF.map(l => {
          const labelMapping = {
            'communities': 'communities',
            'health': 'healthCentres',
            'education': 'schools',
            'farmland': 'farmland',
            'roads': 'roads',
          };
          return (
            <div key={l.key} style={{background:C.s2,borderRadius:10,padding:'12px 14px',textAlign:'center',
              border:`1px solid ${C.border}`}}>
              <div style={{fontSize:20,marginBottom:4}}>{l.icon}</div>
              <div style={{fontSize:18,fontWeight:800,color:C.bright}}>{(totals[l.key]||0).toLocaleString()}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>{t(labelMapping[l.key] || l.key)}</div>
            </div>
          );
        })}
      </div>
      {!isAll && data?.[filter] && (
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
          <div style={{fontSize:11,fontWeight:700,color:C.bright,marginBottom:8}}>{filter} {t('breakdown')}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {WEEKLY_LAYERS_DEF.map(l => {
              const labelMapping = {
                'communities': 'communities',
                'health': 'healthCentres',
                'education': 'schools',
                'farmland': 'farmland',
                'roads': 'roads',
              };
              return (
                <div key={l.key} style={{fontSize:11,padding:'4px 10px',background:C.s3,borderRadius:16,
                  border:`1px solid ${C.border}`,color:C.text}}>
                  {l.icon} {t(labelMapping[l.key] || l.key)}: <b style={{color:C.bright}}>{(data[filter][l.key]||0).toLocaleString()}</b>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};

const DashboardTab = () => {
  const [forecastPeriod, setForecastPeriod] = useState('annual');
  return (
    <div style={{ 
      padding: '20px 0', 
      maxWidth: 1200, 
      margin: '0 auto',
      width: '100%'
    }}>
      {/* Period toggle - centered */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 10, 
        marginBottom: 24,
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.bright }}>Flood Forecast</span>
        <div style={{
          display: 'flex',
          background: C.s2,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          overflow: 'hidden'
        }}>
          {[{ id: 'annual', label: t('annualAFO2026') }, { id: 'weekly', label: t('weekly') }].map(opt => (
            <button key={opt.id} onClick={() => setForecastPeriod(opt.id)}
              style={{
                padding: '7px 16px',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                background: forecastPeriod === opt.id ? C.primary : 'transparent',
                color: forecastPeriod === opt.id ? '#fff' : C.muted,
                transition: 'all 0.15s'
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {forecastPeriod === 'annual' ? <AtlasAnnualPanel /> : <AtlasWeeklyPanel />}
    </div>
  );
};

// ─── AI FORECAST TAB ───────────────────────────────────────────────────────────
// ─── FLOOD THERMOMETER — plain-English day bar ────────────────────────────────
const FloodThermometer = ({ days, peakDay }) => {
  const statusColor = s => s==='high'?C.danger:s==='elevated'?C.warning:C.success;
  const statusLabel = (s,i,peak) => {
    if (i===peak-1) return 'Peak';
    return s==='high'?'High Risk':s==='elevated'?'Rising':'Calm';
  };
  return (
    <div style={{display:'flex',gap:4,alignItems:'flex-end',height:80}}>
      {days.map((d,i) => {
        const col = statusColor(d.status);
        const h = Math.max(12, Math.round(d.intensity * 7));
        const isPeak = i === peakDay - 1;
        return (
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            {isPeak && <div style={{fontSize:9,color:C.danger,fontWeight:800}}>▲</div>}
            <div style={{
              width:'100%', height:h, borderRadius:4, background:col,
              opacity: isPeak ? 1 : 0.65,
              boxShadow: isPeak ? `0 0 8px ${col}` : 'none',
              transition:'all 0.3s',
            }}/>
            <div style={{fontSize:9,color:C.muted,textAlign:'center'}}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
};

// ─── IMPACT SUMMARY CHIPS ─────────────────────────────────────────────────────
const ImpactChips = ({ impact, alert }) => {
  if (!impact || Object.keys(impact).length === 0) return null;
  // Show for WATCH and above (not NONE/NORMAL)
  if (alert === 'NONE' || alert === 'NORMAL') return null;
  const pop = impact.population_at_risk || impact.population || 0;
  const schools = impact.schools_affected || impact.schools || 0;
  const health = impact.health_facilities || impact.healthFacilities || 0;
  const farms = impact.farmland_ha || impact.farmlandHa || 0;
  const roads = impact.roads_km || impact.roadsKm || 0;
  const chips = [
    { icon:'👥', val: pop > 0 ? pop.toLocaleString() : '—', label:'People at risk' },
    { icon:'🏫', val: schools > 0 ? schools : '—', label:'Schools' },
    { icon:'🏥', val: health > 0 ? health : '—', label:'Health facilities' },
    { icon:'🌾', val: farms > 0 ? `${farms.toLocaleString()} ha` : '—', label:'Farmland' },
    { icon:'🛣️', val: roads > 0 ? `${roads} km` : '—', label:'Roads' },
  ].filter(c => c.val !== '—');
  if (chips.length === 0) return null;
  return (
    <div>
      <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:'0.06em',marginBottom:6}}>ESTIMATED IMPACT</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {chips.map((c,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',
            background:C.s2,border:`1px solid ${C.border}`,borderRadius:20,fontSize:11}}>
            <span>{c.icon}</span>
            <span style={{fontWeight:700,color:C.bright}}>{c.val}</span>
            <span style={{color:C.muted}}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── ALERT ACTION GUIDE ───────────────────────────────────────────────────────
const ACTION_GUIDE = {
  SEVERE:  { emoji:'🔴', headline:'Significant flooding expected', action:'Riverbank communities should prepare to evacuate. Move valuables to higher ground now.' },
  WARNING: { emoji:'⚠️', headline:'Flooding likely in low-lying areas', action:'Move valuables to higher ground. Avoid crossing rivers or flood-prone roads.' },
  WATCH:   { emoji:'👀', headline:'Rivers are rising. Stay alert.', action:'Monitor NIHSA updates. Avoid unnecessary travel near rivers and streams.' },
  NORMAL:  { emoji:'✅', headline:'No flood risk at this time', action:'Conditions are normal. Continue to monitor for updates during rainy season.' },
};

const ForecastTab = ({ gauges }) => {
  const [selId, setSelId]       = useState(null);
  const [mlData, setMlData]       = useState(null);
  const [dataSource, setSource]   = useState('simulation');
  const [loading, setLoading]     = useState(true);
  const [forecastView, setForecastView] = useState('weekly');
  const [stationSearch, setStationSearch] = useState('');
  const [showAllGrid, setShowAllGrid]   = useState(false);

  // Fetch from NFFS integration endpoint
  useEffect(() => {
    setLoading(true);
    fetch(API_BASE + '/forecast/ml/alerts')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.alerts && d.alerts.length > 0) {
          setMlData(d.alerts);
          setSource(d.data_source || 'simulation');
          setSelId(d.alerts[0]?.station_id || null);
        } else {
          // Build from simulation constants
          const sim = ML_BASINS.map(b => {
            const o = SIM_OUTLOOK(b.id, b.id % 7);
            return { station_id: String(b.id), station_name: b.name, river: b.river,
              state: b.state, lat: b.lat, lon: b.lng,
              nffs_level: o.alert, app_level: o.alert === 'SEVERE' ? 'HIGH' : o.alert,
              priority: ['NONE','WATCH','WARNING','SEVERE','EXTREME'].indexOf(o.alert),
              emoji: (ACTION_GUIDE[o.alert]||ACTION_GUIDE.NORMAL).emoji,
              headline: (ACTION_GUIDE[o.alert]||ACTION_GUIDE.NORMAL).headline,
              body: '', action: (ACTION_GUIDE[o.alert]||ACTION_GUIDE.NORMAL).action,
              peak_day: o.peakDay, days: o.days.map(d=>({...d, intensity: d.intensity})),
              impact: o.impact, lagdo_cascade: o.lagdoActive, data_source: 'simulation',
            };
          });
          setMlData(sim);
          setSelId(sim[0]?.station_id || null);
          setSource('simulation');
        }
      })
      .catch(() => setSource('simulation'))
      .finally(() => setLoading(false));
  }, []);

  const stations = mlData || [];
  const sel      = stations.find(s => s.station_id === selId) || stations[0];

  // For the station selector: show top 20 by priority, filtered by search
  const filteredStations = stationSearch
    ? stations.filter(s =>
        s.station_name.toLowerCase().includes(stationSearch.toLowerCase()) ||
        (s.river||'').toLowerCase().includes(stationSearch.toLowerCase()) ||
        (s.state||'').toLowerCase().includes(stationSearch.toLowerCase()))
    : stations.slice(0, 20);
  const totalStations = stations.length;
  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>;
  if (!sel)    return <EmptyState icon="🧠" msg="Forecast data loading..." />;

  const alertCol = RISK_COLOR(sel.app_level || 'NORMAL');

  return (
    <div style={{padding:16,maxWidth:1100,margin:'0 auto'}}>

      {/* ── Top bar: toggle + data source badge ─────── */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        {/* Weekly / Annual toggle */}
        <div style={{display:'flex',background:C.s2,borderRadius:10,padding:3,border:`1px solid ${C.border}`}}>
          {['weekly','annual'].map(v=>(
            <button key={v} onClick={()=>setForecastView(v)}
              style={{padding:'6px 18px',borderRadius:8,border:'none',cursor:'pointer',
                fontSize:12,fontWeight:700,transition:'all 0.2s',
                background:forecastView===v?C.primary:'transparent',
                color:forecastView===v?'#fff':C.muted}}>
              {v==='weekly'?'📅 '+t('sevenDayOutlook'):'📆 '+t('annualOutlook')}
            </button>
          ))}
        </div>
        <div style={{fontSize:10,padding:'3px 10px',borderRadius:12,
          background: dataSource==='nffs_live' ? '#10B98120' : `${C.warning}20`,
          border: `1px solid ${dataSource==='nffs_live' ? C.success : C.warning}`,
          color: dataSource==='nffs_live' ? C.success : C.warning, fontWeight:700}}>
          {dataSource==='nffs_live' ? '🟢 '+t('liveMode') : '🟡 '+t('simulationMode')}
        </div>
      </div>

      {/* ── Annual Outlook ───────────────────────────── */}
      {forecastView === 'annual' && (
        <div style={{marginBottom:16}}>
          <Card style={{marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:C.bright,marginBottom:4}}>Annual Flood Outlook 2026 — Niger Basin</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:14}}>Seasonal flood probability · Based on NFFS ensemble + historical climatology</div>
            <div className="forecast-cards" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:8}}>
              {[
                {m:'Jan',prob:5,risk:'NORMAL'},{m:'Feb',prob:8,risk:'NORMAL'},
                {m:'Mar',prob:15,risk:'WATCH'},{m:'Apr',prob:28,risk:'WATCH'},
                {m:'May',prob:45,risk:'WARNING'},{m:'Jun',prob:62,risk:'WARNING'},
                {m:'Jul',prob:78,risk:'SEVERE'},{m:'Aug',prob:88,risk:'SEVERE'},
                {m:'Sep',prob:82,risk:'SEVERE'},{m:'Oct',prob:65,risk:'WARNING'},
                {m:'Nov',prob:35,risk:'WATCH'},{m:'Dec',prob:14,risk:'WATCH'},
              ].map(({m,prob,risk}) => {
                const col = RISK_COLOR(risk);
                return (
                  <div key={m} style={{textAlign:'center',padding:'10px 6px',
                    background:`${col}15`,border:`1px solid ${col}30`,borderRadius:8}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:6}}>{m}</div>
                    <div style={{height:60,display:'flex',alignItems:'flex-end',justifyContent:'center',marginBottom:6}}>
                      <div style={{width:32,borderRadius:'4px 4px 0 0',background:col,
                        height:`${Math.round(prob*0.6)}px`,opacity:0.85}}/>
                    </div>
                    <div style={{fontSize:11,fontWeight:700,color:col}}>{prob}%</div>
                    <div style={{fontSize:9,color:C.muted}}>flood risk</div>
                  </div>
                );
              })}
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:12,textAlign:'center'}}>
              Peak flood season: July–September · Lagdo Dam releases amplify risk in August–October
            </div>
          </Card>
          <Card>
            <div style={{fontSize:13,fontWeight:700,color:C.bright,marginBottom:4}}>What to Expect in 2026</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
              {[
                {season:'Apr–Jun',label:'Early Rains',level:'WATCH',desc:'River levels begin rising. Pre-position resources. Check evacuation routes.'},
                {season:'Jul–Aug',label:'Peak Season',level:'SEVERE',desc:'Highest flood risk. Communities near rivers should be on high alert.'},
                {season:'Sep–Oct',label:'Lagdo Period',level:'SEVERE',desc:'Lagdo Dam releases amplify Benue/Niger flooding. Makurdi and Lokoja at greatest risk.'},
                {season:'Nov–Dec',label:'Recession',level:'WATCH',desc:'Flood waters recede but remain above normal. Continue monitoring.'},
              ].map(({season,label,level,desc}) => {
                const col = RISK_COLOR(level === 'SEVERE' ? 'HIGH' : level);
                return (
                  <div key={season} style={{padding:12,background:C.s2,
                    border:`1px solid ${col}30`,borderRadius:10}}>
                    <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{season}</div>
                    <div style={{fontSize:13,fontWeight:700,color:C.bright,marginBottom:4}}>{label}</div>
                    <div style={{display:'inline-block',padding:'2px 8px',borderRadius:10,
                      background:`${col}20`,color:col,fontSize:10,fontWeight:700,marginBottom:6}}>{level}</div>
                    <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{desc}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
      

      {/* ── Weekly outlook (existing) ─────────────────── */}
      {forecastView === 'weekly' && (
        <>

          {/* ── Station selector ─────────────────────────── */}
      <div style={{marginBottom:16}}>
        {/* Search bar + count */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <input
            value={stationSearch}
            onChange={e=>setStationSearch(e.target.value)}
            placeholder={`Search ${totalStations} monitored stations...`}
            style={{flex:1,padding:'7px 12px',borderRadius:8,border:`1px solid ${C.border}`,
              background:C.surface,color:C.text,fontSize:12,outline:'none'}}
          />
          {stationSearch && (
            <button onClick={()=>setStationSearch('')}
              style={{padding:'7px 10px',borderRadius:8,border:`1px solid ${C.border}`,
                background:C.s2,color:C.muted,cursor:'pointer',fontSize:11}}>✕</button>
          )}
          <span style={{fontSize:11,color:C.muted,whiteSpace:'nowrap',flexShrink:0}}>
            {stationSearch ? `${filteredStations.length} found` : `Top ${Math.min(20,totalStations)} of ${totalStations}`}
          </span>
        </div>
        {/* Station buttons */}
        <div style={{overflowX:'auto'}}>
          <div style={{display:'flex',gap:8,paddingBottom:4}}>
            {filteredStations.map((s, i) => {
              const col = RISK_COLOR(s.app_level || 'NORMAL');
              return (
                <button key={`${s.station_id}-${i}`} onClick={() => setSelId(s.station_id)}
                  style={{padding:'8px 14px',borderRadius:8,flexShrink:0,
                    border:`2px solid ${selId===s.station_id ? col : C.border}`,
                    background: selId===s.station_id ? `${col}18` : C.surface,
                    color: selId===s.station_id ? col : C.muted,
                    cursor:'pointer',fontSize:12,fontWeight:700,whiteSpace:'nowrap',
                    transition:'all 0.15s'}}>
                  <div>{s.station_name}</div>
                  <div style={{fontSize:10,fontWeight:400,marginTop:2,opacity:0.8}}>
                    {s.river}{s.state ? ` · ${s.state}` : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
          
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        {/* ── Alert card ────────────────────────────────── */}
        <Card style={{borderLeft:`4px solid ${alertCol}`}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <span style={{fontSize:28}}>{sel.emoji}</span>
            <div>
              <div style={{fontSize:11,fontWeight:800,color:alertCol,letterSpacing:'0.08em'}}>
                {sel.nffs_level} — {sel.station_name}{sel.state ? `, ${sel.state} State` : ''}
              </div>
              <div style={{fontSize:15,fontWeight:700,color:C.bright,marginTop:2}}>{sel.headline}</div>
            </div>
          </div>

          {sel.lagdo_cascade && (
            <div style={{padding:'8px 12px',background:'#7B1FA220',border:'1px solid #7B1FA2',
              borderRadius:8,marginBottom:12,fontSize:12,color:'#CE93D8',lineHeight:1.5}}>
              🚨 <b>{t('lagdoWarning')}</b> — {t('lagdoDesc')}
            </div>
          )}

          <div style={{padding:'10px 14px',background:C.s2,borderRadius:8,
            fontSize:13,color:C.text,lineHeight:1.6,marginBottom:12}}>
            <b>What you should do:</b> {sel.action}
          </div>

          <ImpactChips impact={sel.impact} alert={sel.nffs_level} />
        </Card>
           
        {/* ── 7-day thermometer ─────────────────────────── */}
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:C.bright,marginBottom:4}}>
            Flood Outlook — {sel.station_name} — Next 7 Days
          </div>
          <div style={{fontSize:11,color:C.muted,marginBottom:16}}>
            Peak expected: <b style={{color:C.bright}}>
              {sel.days && sel.days[sel.peak_day-1] ? sel.days[sel.peak_day-1].label : `Day ${sel.peak_day}`}
            </b> · River {sel.river}
          </div>
          <FloodThermometer days={sel.days || []} peakDay={sel.peak_day} />
          <div style={{display:'flex',gap:12,marginTop:12,justifyContent:'center'}}>
            {[['#10B981','Calm'],['#F59E0B','Rising'],['#EF4444','High Risk']].map(([col,lbl])=>(
              <div key={lbl} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.muted}}>
                <div style={{width:10,height:10,borderRadius:2,background:col}}/>
                {lbl}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── All basins overview ───────────────────────── */}
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
          <div style={{fontSize:13,fontWeight:700,color:C.bright}}>All Monitored River Stations — Flood Status</div>
          <div style={{fontSize:11,color:C.muted}}>{totalStations} stations</div>
        </div>
        <div style={{fontSize:11,color:C.muted,marginBottom:16}}>Tap a station to view its detailed 7-day outlook</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
          {(stationSearch ? filteredStations : showAllGrid ? stations : stations.slice(0,48)).map((s, i) => {
            const col = RISK_COLOR(s.app_level || 'NORMAL');
            return (
              <div key={`${s.station_id}-grid-${i}`} onClick={() => setSelId(s.station_id)}
                style={{padding:'12px 14px',
                  background: selId===s.station_id ? `${col}15` : C.s2,
                  border:`1px solid ${selId===s.station_id ? col : C.border}`,
                  borderRadius:10,cursor:'pointer',transition:'all 0.15s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.bright}}>{s.station_name}</div>
                  <span style={{fontSize:14}}>{s.emoji}</span>
                </div>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>
                  {s.river}{s.state ? ` · ${s.state}` : ''}
                </div>
                <div style={{fontSize:11,fontWeight:700,color:col}}>{s.nffs_level}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                  Peak: {s.days && s.days[s.peak_day-1] ? s.days[s.peak_day-1].label : '—'}
                </div>
                {s.lagdo_cascade && (
                  <div style={{fontSize:10,color:'#CE93D8',marginTop:4,fontWeight:700}}>⚡ Lagdo Active</div>
                )}
              </div>
            );
          })}
        </div>
        {!stationSearch && totalStations > 48 && (
          <button onClick={()=>setShowAllGrid(p=>!p)}
            style={{marginTop:14,width:'100%',padding:'8px',borderRadius:8,border:`1px solid ${C.border}`,
              background:C.s2,color:C.muted,cursor:'pointer',fontSize:12}}>
            {showAllGrid ? '▲ Show fewer stations' : `▼ Show all ${totalStations} stations`}
          </button>
        )}
      </Card>
        </>
      )}
    </div>
  );
};

// ─── VANGUARD CHAT TAB ─────────────────────────────────────────────────────────
const VanguardTab = ({ user, onSignIn }) => {
  const [channel, setChannel] = useState('national');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const [showStateChannels, setShowStateChannels] = useState(false);

  const channels = [
    {id:'national', label:'🌍 National', color:C.primary},
  ];

  const stateChannels = [
    {id:'abia', label:'Abia'}, {id:'adamawa', label:'Adamawa'},
    {id:'akwa-ibom', label:'Akwa Ibom'}, {id:'anambra', label:'Anambra'},
    {id:'bauchi', label:'Bauchi'}, {id:'bayelsa', label:'Bayelsa'},
    {id:'benue', label:'Benue'}, {id:'borno', label:'Borno'},
    {id:'cross-river', label:'Cross River'}, {id:'delta', label:'Delta'},
    {id:'ebonyi', label:'Ebonyi'}, {id:'edo', label:'Edo'},
    {id:'ekiti', label:'Ekiti'}, {id:'enugu', label:'Enugu'},
    {id:'fct', label:'FCT — Abuja'}, {id:'gombe', label:'Gombe'},
    {id:'imo', label:'Imo'}, {id:'jigawa', label:'Jigawa'},
    {id:'kaduna', label:'Kaduna'}, {id:'kano', label:'Kano'},
    {id:'katsina', label:'Katsina'}, {id:'kebbi', label:'Kebbi'},
    {id:'kogi', label:'Kogi'}, {id:'kwara', label:'Kwara'},
    {id:'lagos', label:'Lagos'}, {id:'nasarawa', label:'Nasarawa'},
    {id:'niger', label:'Niger'}, {id:'ogun', label:'Ogun'},
    {id:'ondo', label:'Ondo'}, {id:'osun', label:'Osun'},
    {id:'oyo', label:'Oyo'}, {id:'plateau', label:'Plateau'},
    {id:'rivers', label:'Rivers'}, {id:'sokoto', label:'Sokoto'},
    {id:'taraba', label:'Taraba'}, {id:'yobe', label:'Yobe'},
    {id:'zamfara', label:'Zamfara'},
  ].map(s => ({...s, label:`📍 ${s.label}`, color:C.muted}));

  // Fetch history — visible to all, login not required
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetch(API_BASE + `/chat/${channel}/messages`, {
      headers: api.token() ? { Authorization: `Bearer ${api.token()}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => setMessages(Array.isArray(d) ? d : (d.messages||[])))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [channel]);

  // WebSocket for real-time
  const onWsMsg = useCallback((msg) => {
    if (msg.channel === channel) setMessages(p => [...p, msg]);
  }, [channel]);

  const { send } = useWebSocket(`/ws/chat/${channel}`, onWsMsg, !!user);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  const sendMsg = async () => {
    if (!input.trim() || !user) return;
    setSending(true);
    const optimistic = {
      id: Date.now(), message: input.trim(), channel_id: channel,
      user_name: user.full_name||user.name||'User', user_role: user.role||'vanguard',
      created_at: new Date().toISOString(),
    };
    setInput('');
    setMessages(p=>[...p, optimistic]);
    try {
      const r = await fetch(API_BASE + `/chat/${channel}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(api.token() ? {Authorization:`Bearer ${api.token()}`} : {}) },
        body: JSON.stringify({message: optimistic.message, message_type:'text'}),
      });
      if (r.ok) {
        const sent = await r.json();
        setMessages(p => p.map(m => m.id===optimistic.id ? sent : m));
        send({...sent, channel});
      }
    } catch {
      // keep optimistic message shown
    }
    setSending(false);
  };

  const roleColor = r => ({director:'#A855F7',coordinator:C.warning,vanguard:C.primary}[r]||C.muted);

  // Only verified vanguards / staff / admin can send messages; everyone else is view-only
  const canChat = user && ['vanguard','nihsa_staff','government','admin','coordinator'].includes(
    (user.role||'').toLowerCase()
  );

  return (
    <div className="vanguard-container" style={{
      display: 'flex',
      height: 'calc(100vh - 160px)',
      overflow: 'hidden',
      maxWidth: 1400,
      margin: '0 auto',
      width: '100%',
      background: C.surface,
      borderRadius: 12,
      border: `1px solid ${C.border}`
    }}>
      {/* Channel list */}
      <div className="vanguard-channels" style={{width:220,flexShrink:0,background:C.surface,borderRight:`1px solid ${C.border}`,overflowY:'auto'}}>
        <div style={{padding:'12px 14px',fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.06em'}}>{t('channels').toUpperCase()}</div>
        {channels.map(ch=>(
          <button key={ch.id} onClick={()=>setChannel(ch.id)} style={{display:'block',width:'100%',padding:'9px 14px',textAlign:'left',border:'none',background:channel===ch.id?`${ch.color}18`:'transparent',color:channel===ch.id?ch.color:C.muted,cursor:'pointer',fontSize:13,fontWeight:channel===ch.id?700:400,borderLeft:channel===ch.id?`3px solid ${ch.color}`:'3px solid transparent'}}>
            {ch.label}
          </button>
        ))}
        {/* State channels section */}
        <button onClick={()=>setShowStateChannels(p=>!p)}
          style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',
            padding:'10px 14px',background:'none',border:'none',borderTop:`1px solid ${C.border}`,
            color:C.muted,cursor:'pointer',fontSize:11,fontWeight:700,letterSpacing:'0.06em'}}>
          <span>STATE CHANNELS</span>
          <span style={{fontSize:10}}>{showStateChannels?'▲':'▼'}</span>
        </button>
        {showStateChannels && stateChannels.map(ch=>(
          <button key={ch.id} onClick={()=>setChannel(ch.id)}
            style={{display:'block',width:'100%',padding:'7px 14px 7px 20px',textAlign:'left',border:'none',
              background:channel===ch.id?`${C.primary}18`:'transparent',
              color:channel===ch.id?C.accent:C.muted,cursor:'pointer',fontSize:12,
              fontWeight:channel===ch.id?700:400,
              borderLeft:channel===ch.id?`3px solid ${C.primary}`:'3px solid transparent'}}>
            {ch.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 16px',background:C.surface,borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:700,color:C.bright}}>
          {[...channels,...stateChannels].find(c=>c.id===channel)?.label} — {t('secureNetwork')}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>
          {loading ? <div style={{display:'flex',justifyContent:'center',padding:20}}><Spinner /></div> : (
            messages.length > 0 ? messages.map((m,i)=>(
              <div key={m.id||i} style={{display:'flex',gap:10,alignItems:'flex-start',position:'relative'}}
                className="chat-msg">
                <div style={{width:32,height:32,borderRadius:8,background:`${roleColor(m.user_role||m.role)}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0,fontWeight:700,color:roleColor(m.user_role||m.role)}}>
                  {(m.user_name||m.sender_name||'?')[0]?.toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:8,alignItems:'baseline',marginBottom:3}}>
                    <span style={{fontSize:12,fontWeight:700,color:roleColor(m.user_role||m.role)}}>{m.user_name||m.sender_name}</span>
                    {(m.user_role||m.role) && <span style={{fontSize:10,color:C.muted}}>{m.user_role||m.role}</span>}
                    <span style={{fontSize:10,color:C.muted,marginLeft:'auto'}}>{m.created_at ? new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''}</span>
                    {/* Admin delete button */}
                    {user && ['admin'].includes((user.role||'').toLowerCase()) && m.id && (
                      <button onClick={async()=>{
                        if(!window.confirm('Delete this message?')) return;
                        await fetch(API_BASE+`/chat/${channel}/messages/${m.id}`,{
                          method:'DELETE',
                          headers:{Authorization:`Bearer ${api.token()}`},
                        });
                        setMessages(p=>p.filter(x=>x.id!==m.id));
                      }} style={{background:'none',border:'none',color:'#EF4444',cursor:'pointer',fontSize:11,padding:'1px 5px',opacity:0.6,lineHeight:1}}
                        title="Delete message">🗑</button>
                    )}
                  </div>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.5,padding:'8px 10px',background:C.s2,borderRadius:'4px 12px 12px 12px',border:`1px solid ${C.border}`}}>
                    {m.message||m.content}
                  </div>
                </div>
              </div>
            )) : <EmptyState icon="💬" msg={`No messages in #${channel} yet`} />
          )}
          <div ref={bottomRef} />
        </div>

        {canChat ? (
          <div style={{padding:'10px 16px',background:C.surface,borderTop:`1px solid ${C.border}`,display:'flex',gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMsg()}
              placeholder={t('chatPlaceholder')}
              style={{flex:1,padding:'10px 14px',background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,color:C.bright,fontSize:13,outline:'none'}} />
            <button onClick={sendMsg} disabled={sending||!input.trim()}
              style={{padding:'10px 18px',background:C.primary,border:'none',borderRadius:8,
                color:'#fff',fontWeight:700,cursor:'pointer',fontSize:13,
                opacity:sending||!input.trim()?0.5:1}}>
              {t('send')}
            </button>
          </div>
        ) : (
          <div style={{padding:'10px 16px',background:C.surface,borderTop:`1px solid ${C.border}`,
            display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
            <span style={{fontSize:12,color:C.muted}}>
              👁 View only — verified Flood Marshals & NIHSA staff can send messages
            </span>
            {!user && (
              <button onClick={onSignIn}
                style={{padding:'6px 16px',background:`linear-gradient(135deg,${C.primary},#0284C7)`,
                  border:'none',borderRadius:6,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
                Sign In
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── AI ASSISTANT TAB ──────────────────────────────────────────────────────────
const AssistantTab = ({ user, onSignIn, alerts = [], gauges = [] }) => {
  // AI service URL - update with your deployed wrapper URL
  const AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || "https://nihsachatbox.onrender.com";
  
  const [mlAlerts, setMlAlerts] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [detectedLang, setDetectedLang] = useState('en');

  // User GPS location — captured on mount and used for contextual AI responses
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, address }
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Quota tracking
  const [quota, setQuota] = useState({ 
  remaining: null, 
  limit: 5, 
  loading: true,
  role: null,
  authenticated: false 
});
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // TTS states
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  
  const bottomRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Role badge colors
  const roleColors = {
    admin: '#EF4444',
    sub_admin: '#F97316',
    nihsa_staff: '#0EA5E9',
    government: '#10B981',
    researcher: '#8B5CF6',
    vanguard: '#F59E0B',
    citizen: C.muted
  };
  
  const roleLabels = {
    admin: 'Admin',
    sub_admin: 'Sub-Admin',
    nihsa_staff: 'NIHSA',
    government: 'Govt',
    researcher: 'Research',
    vanguard: 'Marshal',
    citizen: 'Citizen'
  };

  // Fetch quota on mount and when user changes
  const fetchQuota = useCallback(async () => {
    if (!user) {
      setQuota({ 
        remaining: 0, 
        limit: 0, 
        loading: false, 
        authenticated: false,
        role: null 
      });
      return;
    }
    
    try {
      const token = localStorage.getItem("nihsa_token");
      // ✅ Use the AI service URL with proper auth
      const res = await fetch(`${AI_SERVICE_URL}/ai/quota`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Quota response:', data);
        setQuota({ 
          ...data, 
          loading: false,
          remaining: data.remaining !== undefined ? data.remaining : data.limit,
          limit: data.limit || 5
        });
      } else if (res.status === 401) {
        // Token might be expired, try to refresh
        try {
          await api.refreshAccessToken();
          // Retry the quota fetch
          const newToken = localStorage.getItem("nihsa_token");
          const retryRes = await fetch(`${AI_SERVICE_URL}/ai/quota`, {
            headers: { Authorization: `Bearer ${newToken}` }
          });
          if (retryRes.ok) {
            const data = await retryRes.json();
            setQuota({ ...data, loading: false });
            return;
          }
        } catch (e) {
          console.error('Token refresh failed:', e);
        }
        setQuota(prev => ({ ...prev, loading: false, authenticated: false }));
      } else {
        setQuota(prev => ({ ...prev, loading: false, authenticated: false }));
      }
    } catch (err) {
      console.error('❌ Failed to fetch quota:', err);
      setQuota(prev => ({ ...prev, loading: false, authenticated: false }));
    }
  }, [user]);

  // Capture user GPS location silently on mount — used for contextual flood risk advice
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Reverse geocode to get a readable address
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1&accept-language=en`
          );
          const d = await r.json();
          const addr = d.address || {};
          const placeName = [
            addr.suburb || addr.village || addr.town || addr.city || addr.road,
            addr.state_district || addr.county,
            addr.state,
          ].filter(Boolean).join(', ');
          setUserLocation({ lat, lng, address: placeName || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°` });
        } catch {
          setUserLocation({ lat, lng, address: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E` });
        }
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // Load live NFFS context and initial greeting
  useEffect(() => {
    fetch(`${API_BASE}/forecast/ml/alerts`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const live = d?.alerts || [];
        setMlAlerts(live);
        const active = live.filter(a => a.nffs_level !== 'NONE');
        const severe = live.filter(a => ['SEVERE', 'EXTREME'].includes(a.nffs_level));
        const lagdo = live.some(a => a.lagdo_cascade);
        const src = d?.data_source === 'nffs_live' ? 'LIVE NFFS model output' : 'simulation data';
        
        let greeting;
        if (user) {
          // ✅ Don't reference quota here - it's not loaded yet
          const roleLabel = roleLabels[user.role] || 'User';
          greeting = `**NIHSA FloodAI** — Nigeria's official flood intelligence assistant.\n\n**Your plan:** ${roleLabel}\n\n⚠️ **Please use this assistant for hydrology and flood-related questions only.** Use the 🚨 button to report active flooding in your area. Your reports help NIHSA save lives.` +
            (userLocation ? `\n\n📍 **Your location:** ${userLocation.address} — I'll tailor flood risk information to your area.` : '');
        } else {
          greeting = `**NIHSA FloodAI** — Nigeria's official flood intelligence assistant.\n\n⚠️ **This assistant is for hydrology and flood reporting only.** Please keep all questions related to flood risk, river gauges, safety procedures, and emergency response.\n\n🚨 **See flooding?** Use the Report Flood button to alert NIHSA and help protect your community.\n\n**🔒 Sign in to unlock:**\n• 5–20 free prompts per day (based on your role)\n• Voice input & text-to-speech\n• Personalized flood risk information`;
        }
        setMsgs([{ role: 'assistant', content: greeting, id: Date.now() }]);
      })
      .catch(() => {
        const greeting = user 
          ? `**NIHSA FloodAI** — Nigeria's official flood intelligence assistant.\n\n⚠️ Please use this assistant for hydrology and flood-related questions only. Use the 🚨 button to report active flooding in your area.`
          : `**NIHSA FloodAI** — Nigeria's official flood intelligence assistant.\n\n⚠️ This assistant is for hydrology and flood reporting only. Sign in to get free daily prompts.`;
        setMsgs([{ role: 'assistant', content: greeting, id: Date.now() }]);
      });
      
    fetchQuota(); // This will update the quota state and trigger the QuotaIndicator
  }, [fetchQuota, user]); // ✅ Add user to dependencies

  // Fix 2: Only show quota exhausted message when quota is actually loaded AND remaining is 0
  useEffect(() => {
    // ✅ Only check when ALL conditions are met
    if (quota.loading) return; // Still loading
    if (!user) return; // Not logged in
    if (!quota.authenticated) return; // API didn't confirm authentication
    if (quota.remaining > 0) return; // Still have prompts left
    
    // At this point, we know: user is logged in, quota is loaded, authenticated=true, remaining=0
    
    // Check if we already showed this message
    const alreadyShown = msgs.some(m => 
      m.role === 'assistant' && m.content.includes('used all')
    );
    
    if (!alreadyShown) {
      const roleMsg = quota.role === 'admin' ? 'Admin quota' : 
                      quota.role === 'vanguard' ? 'Flood Marshal quota' : 'Daily quota';
      
      setMsgs(p => [...p, {
        role: 'assistant',
        content: `⚠️ You've used all ${quota.limit} of your ${roleMsg.toLowerCase()} prompts. Your quota will reset tomorrow.`,
        id: Date.now()
      }]);
    }
  }, [quota.remaining, quota.loading, quota.limit, quota.role, quota.authenticated, user, msgs]);

  // Fix 3: Add debug logging to see what's happening
  

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  // Handle action from AI response
  const handleAction = (action) => {
    if (!action) return;
    
    switch (action.type) {
      case 'navigate_to_report':
        window.dispatchEvent(new CustomEvent('nihsa:open-report', {
          detail: {
            prefill_location: action.params?.prefill_location,
            prefill_description: action.params?.prefill_description
          }
        }));
        break;
        
      case 'navigate_to_tab':
        window.dispatchEvent(new CustomEvent('nihsa:navigate', {
          detail: { tab: action.params?.tab }
        }));
        break;
        
      case 'show_tutorial':
        window.dispatchEvent(new CustomEvent('nihsa:show-tutorial', {
          detail: { topic: action.params?.topic }
        }));
        break;
        
      case 'search_location':
        window.dispatchEvent(new CustomEvent('nihsa:search-location', {
          detail: { query: action.params?.query }
        }));
        break;
        
      case 'escalate_to_human':
        setMsgs(p => [...p, {
          role: 'assistant',
          content: '📞 Your request has been flagged for NIHSA coordinator review. Opening the flood report form — please submit any photos, video, or voice recording of the flooding so our team can respond faster.',
          id: Date.now()
        }]);
        // Open the report form pre-filled with user's location
        window.dispatchEvent(new CustomEvent('nihsa:open-report', {
          detail: {
            prefill_location: userLocation?.address || '',
            prefill_description: action.params?.reason || 'User requested human assistance via AI chat.',
          }
        }));
        break;
    }
  };

  const send = async (overrideText) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : input;
    if (!textToSend.trim() || loading) return;
    
    // Check if user is logged in
    if (!user) {
      onSignIn();
      return;
    }
    
    // Check quota
    if (!quota.loading && quota.remaining !== null && quota.remaining <= 0) {
      setMsgs(p => [...p, {
        role: 'assistant',
        content: `⚠️ You've used all ${quota.limit} of your daily prompts. Please try again tomorrow.`,
        id: Date.now()
      }]);
      return;
    }
    
    const q = textToSend.trim();
    setInput('');
    
    const userMsg = { role: 'user', content: q, id: Date.now() };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setLoading(true);
    
    try {
      const token = localStorage.getItem("nihsa_token");
      const res = await fetch(`${AI_SERVICE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          session_id: sessionId,
          language: detectedLang,
          user_location: userLocation || null,
          active_alerts: (alerts || [])
            .filter(a => a.is_published && a.is_active)
            .slice(0, 10)
            .map(a => ({
              title: a.title,
              level: a.level,
              state: a.state,
              lgas: a.lgas || [],
              message: (a.message || '').slice(0, 200),
            })),
        })
      });
      
      if (res.status === 401) {
        setMsgs(p => [...p, {
          role: 'assistant',
          content: '🔒 Your session has expired. Please sign in again.',
          id: Date.now()
        }]);
        onSignIn();
        return;
      }
      
      if (res.status === 429) {
        const errorData = await res.json().catch(() => ({}));
        setMsgs(p => [...p, {
          role: 'assistant',
          content: errorData.detail || `⚠️ Daily limit of ${quota.limit} prompts reached. Try again tomorrow.`,
          id: Date.now()
        }]);
        await fetchQuota();
        return;
      }
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      const d = await res.json();
      
      if (d.detected_language) {
        setDetectedLang(d.detected_language);
      }
      
      const assistantMsg = {
        role: 'assistant',
        content: d.reply,
        id: Date.now() + 1
      };
      
      setMsgs(p => [...p, assistantMsg]);
      
      // Refresh quota after successful message
      await fetchQuota();
      
      if (d.action) {
        handleAction(d.action);
      }
      
    } catch (e) {
      setMsgs(p => [...p, {
        role: 'assistant',
        content: '⚠ Unable to reach the NIHSA AI service. Please try again shortly.',
        id: Date.now()
      }]);
    }
    setLoading(false);
  };

  // ========== VOICE RECORDING ==========
  const startRecording = async () => {
    if (!user) {
      onSignIn();
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });
      
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      
      const recorder = new MediaRecorder(stream, selectedMimeType ? { mimeType: selectedMimeType } : {});
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      recorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          setIsRecording(false);
          setRecordingTime(0);
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType || 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingTime(0);
        
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        if (audioBlob.size > 100) {
          await transcribeAudio(audioBlob);
        }
      };
      
      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          if (prevTime >= 29) {
            if (recorder && recorder.state === 'recording') recorder.stop();
            return 30;
          }
          return prevTime + 1;
        });
      }, 1000);
      
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        alert('Microphone access denied. Please enable microphone permissions.');
      } else {
        alert(`Recording failed: ${err.message}`);
      }
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('session_id', sessionId);
      
      const token = localStorage.getItem("nihsa_token");
      const res = await fetch(`${AI_SERVICE_URL}/ai/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (res.status === 401) {
        onSignIn();
        return;
      }
      
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
      const data = await res.json();
      
      if (data.text) {
        if (data.detected_language) {
          setDetectedLang(data.detected_language);
        }

        // ── Distress detection ─────────────────────────────────────────────
        // If voice contains distress keywords AND we have the user's GPS,
        // silently file an emergency report with the audio for NIHSA review.
        // This happens BEFORE the AI responds so coordinators see it immediately.
        const DISTRESS_KEYWORDS = [
          'help', 'emergency', 'flood', 'stuck', 'trapped', 'stranded', 'danger', 'sinking', 'drowning',
          'taimako', 'gaggawa', 'ambaliya', 'gudu',         // Hausa
          'iranlowo', 'pajawiri', 'iṣan', 'ewu',            // Yoruba
          'enyemaka', 'ihe mberede', 'mmiri', 'ize ndụ',    // Igbo
          'aide', 'urgence', 'inondation', 'piégé', 'secours', // French
        ];
        const textLower = data.text.toLowerCase();
        const isDistress = DISTRESS_KEYWORDS.some(kw => textLower.includes(kw));

        if (isDistress && userLocation) {
          try {
            const authToken = localStorage.getItem('nihsa_token');
            const reportForm = new FormData();
            reportForm.append('lat', String(userLocation.lat));
            reportForm.append('lng', String(userLocation.lng));
            reportForm.append('address', userLocation.address || '');
            reportForm.append('water_depth_m', '0.1');
            reportForm.append('description',
              `⚠️ EMERGENCY — AI Assistant voice distress call.\n` +
              `Transcribed message: "${data.text}"\n` +
              `Location: ${userLocation.address || 'see coordinates'}\n` +
              `Submitted automatically from NIHSA FloodAI chat.`
            );
            reportForm.append('voice', audioBlob, 'emergency_voice.webm');
            // Fire-and-forget — do not await, do not block the AI response
            fetch(`${API_BASE}/reports/media`, {
              method: 'POST',
              headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
              body: reportForm,
            }).catch(e => console.warn('Emergency auto-report silently failed:', e));
          } catch (e) {
            console.warn('Emergency report setup error:', e);
          }
        }

        // Auto-send transcribed text directly to AI
        await send(data.text);
      } else {
        alert('No speech detected. Please try again.');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      alert('Voice transcription failed. Please type your message instead.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // ========== TEXT-TO-SPEECH ==========
  const playTTS = async (messageId, text, lang) => {
    if (playingMessageId === messageId && audioElement) {
      audioElement.pause();
      setPlayingMessageId(null);
      setAudioElement(null);
      return;
    }
    
    if (audioElement) {
      audioElement.pause();
    }
    
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('language', lang || detectedLang || 'en');
      formData.append('session_id', sessionId);
      
      const token = localStorage.getItem("nihsa_token");
      const res = await fetch(`${AI_SERVICE_URL}/ai/speak`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) throw new Error('TTS failed');
      
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setPlayingMessageId(null);
        setAudioElement(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setPlayingMessageId(null);
        setAudioElement(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      setAudioElement(audio);
      setPlayingMessageId(messageId);
      await audio.play();
      
    } catch (err) {
      console.error('TTS error:', err);
      setPlayingMessageId(null);
    }
  };

  const escHtml = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const renderMsg = (content) => escHtml(content).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>');

  const suggestions = [
    'Which areas are at highest flood risk right now?',
    'How do I report flooding in my community?',
    'Show me Makurdi on the map',
    'What should I do during a flood warning?',
    'Help me understand the app features',
  ];

  // Quota Indicator Component
  const QuotaIndicator = () => {
    if (quota.loading) {
      return (
        <div style={{ fontSize: 10, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Spinner size={10} />
          <span>Loading...</span>
        </div>
      );
    }
    
    // ✅ Don't render if not authenticated or remaining is null
    if (!quota.authenticated || quota.remaining === null) {
      return null;
    }
    
    const percentage = (quota.remaining / quota.limit) * 100;
    const color = percentage > 50 ? C.success : percentage > 20 ? C.warning : C.danger;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {quota.role && quota.role !== 'citizen' && (
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            background: `${roleColors[quota.role] || C.muted}20`,
            color: roleColors[quota.role] || C.muted,
            border: `1px solid ${roleColors[quota.role] || C.muted}40`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {roleLabels[quota.role] || quota.role}
          </span>
        )}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: C.s2,
          borderRadius: 20,
          border: `1px solid ${C.border}`
        }}>
          <span style={{ fontSize: 12 }}>💬</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color }}>
              {quota.remaining}/{quota.limit}
            </span>
            <div style={{
              width: 40,
              height: 4,
              background: C.border,
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${percentage}%`,
                height: '100%',
                background: color,
                borderRadius: 2,
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="assistant-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 160px)',
      maxWidth: 900,
      margin: '0 auto',
      width: '100%',
      background: C.surface,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      overflow: 'hidden'
    }}>
      {/* Header with quota indicator */}
      <div style={{
        padding: '12px 20px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: `${C.primary}08`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🌊</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.bright }}>NIHSA AI Assistant</span>
          {/* GPS location pill */}
          {userLocation && (
            <span style={{
              fontSize: 10, color: C.success, background: `${C.success}15`,
              border: `1px solid ${C.success}40`, borderRadius: 10,
              padding: '2px 8px', maxWidth: 180, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }} title={`Your location: ${userLocation.address}`}>
              📍 {userLocation.address.split(',')[0]}
            </span>
          )}
          {locationLoading && (
            <span style={{ fontSize: 10, color: C.muted }}>📍 locating…</span>
          )}
        </div>
        {user && <QuotaIndicator />}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {msgs.map((m) => (
            <div key={m.id} style={{ display: 'flex', gap: 10, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && (
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `linear-gradient(135deg,${C.primary},${C.info})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0
                }}>🌊</div>
              )}
              <div style={{ position: 'relative' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                  background: m.role === 'user' ? `linear-gradient(135deg,${C.primary},#0284C7)` : C.s2,
                  border: m.role === 'user' ? 'none' : `1px solid ${C.border}`,
                  fontSize: 13, lineHeight: 1.6, color: '#fff',
                  paddingRight: m.role === 'assistant' ? '36px' : '14px'
                }} dangerouslySetInnerHTML={{ __html: renderMsg(m.content) }} />
                
                {m.role === 'assistant' && user && (
                  <button
                    onClick={() => playTTS(m.id, m.content, detectedLang)}
                    style={{
                      position: 'absolute',
                      right: 8,
                      bottom: 8,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      background: playingMessageId === m.id ? C.primary : 'transparent',
                      border: `1px solid ${playingMessageId === m.id ? C.primary : C.border}`,
                      color: playingMessageId === m.id ? '#fff' : C.muted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      transition: 'all 0.15s'
                    }}
                    title={playingMessageId === m.id ? "Stop" : "Listen"}
                  >
                    {playingMessageId === m.id ? '⏹' : '🔊'}
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {(loading || isTranscribing) && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `linear-gradient(135deg,${C.primary},${C.info})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
              }}>🌊</div>
              <div style={{
                padding: '10px 16px', background: C.s2, border: `1px solid ${C.border}`,
                borderRadius: '4px 12px 12px 12px', color: C.muted, fontSize: 13
              }}>
                {isTranscribing ? '🎤 Transcribing your voice...' : t('analysingData')}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Login wall - shown when not authenticated */}
      {!user && (
        <div style={{
          padding: '20px',
          background: `linear-gradient(135deg, ${C.primary}15, ${C.info}10)`,
          borderTop: `1px solid ${C.border}`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.bright, marginBottom: 6 }}>
            Sign in to use NIHSA AI
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
            Get 5 free prompts per day as a citizen.<br />
            
          </div>
          <button
            onClick={onSignIn}
            style={{
              padding: '12px 32px',
              background: `linear-gradient(135deg, ${C.primary}, #0284C7)`,
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer'
            }}>
            Sign In to Continue
          </button>
        </div>
      )}

      {/* Suggestions - only shown when logged in and few messages */}
      {user && msgs.length <= 2 && !isRecording && (
        <div style={{
          padding: '0 20px 12px',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
          borderTop: `1px solid ${C.border}`,
          paddingTop: 12
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setInput(s)}
              disabled={quota.remaining <= 0}
              style={{
                padding: '6px 14px',
                background: C.s2,
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                color: C.text,
                fontSize: 11,
                cursor: quota.remaining <= 0 ? 'not-allowed' : 'pointer',
                opacity: quota.remaining <= 0 ? 0.5 : 1
              }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area - only shown when authenticated */}
      {user && (
        <div style={{
          padding: '16px 20px',
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          gap: 10,
          maxWidth: 760,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          alignItems: 'center'
        }}>
          {isRecording ? (
            <div style={{
              flex: 1,
              padding: '12px 16px',
              background: `${C.danger}15`,
              border: `1px solid ${C.danger}`,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <span style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: C.danger,
                animation: 'pulse 1s infinite'
              }} />
              <span style={{ color: C.danger, fontSize: 13, fontWeight: 600 }}>
                Recording...
              </span>
              <button
                onClick={stopRecording}
                style={{
                  marginLeft: 'auto',
                  padding: '6px 16px',
                  background: C.danger,
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>
                Stop
              </button>
              <button
                onClick={cancelRecording}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  color: C.muted,
                  fontSize: 12,
                  cursor: 'pointer'
                }}>
                Cancel
              </button>
            </div>
          ) : (
            <>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={quota.remaining > 0 ? t('askPlaceholder') : 'Daily limit reached. Try again tomorrow.'}
                disabled={quota.remaining <= 0}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: C.s2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  color: C.bright,
                  fontSize: 13,
                  outline: 'none',
                  opacity: quota.remaining <= 0 ? 0.5 : 1
                }}
              />
              
              <button
                onClick={startRecording}
                disabled={isTranscribing || loading || quota.remaining <= 0}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  background: C.s2,
                  border: `1px solid ${C.border}`,
                  color: C.primary,
                  fontSize: 20,
                  cursor: (isTranscribing || loading || quota.remaining <= 0) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  opacity: (isTranscribing || loading || quota.remaining <= 0) ? 0.5 : 1,
                  flexShrink: 0
                }}
                title="Record voice message">
                🎤
              </button>
              
              <button
                onClick={send}
                disabled={loading || isTranscribing || !input.trim() || quota.remaining <= 0}
                style={{
                  padding: '12px 24px',
                  background: `linear-gradient(135deg,${C.primary},#0284C7)`,
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                  opacity: loading || isTranscribing || !input.trim() || quota.remaining <= 0 ? 0.5 : 1,
                  flexShrink: 0
                }}>
                {loading ? '...' : t('askBtn')}
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Detected language indicator */}
      {detectedLang !== 'en' && user && (
        <div style={{
          padding: '4px 20px 8px',
          fontSize: 10,
          color: C.muted,
          textAlign: 'center'
        }}>
          Responding in {detectedLang === 'ha' ? 'Hausa' : detectedLang === 'yo' ? 'Yoruba' : detectedLang === 'ig' ? 'Igbo' : detectedLang === 'fr' ? 'French' : 'English'}
        </div>
      )}
    </div>
  );
};

// ─── NIGERIA NATIONAL HEATMAP (SVG choropleth) ────────────────────────────────
const NationalHeatmap = ({ alerts }) => {
  // Nigeria states with their center coordinates
  const statePositions = [
    ['Sokoto', 13.07, 5.25], ['Zamfara', 12.17, 6.67], ['Katsina', 12.99, 7.60], 
    ['Kano', 11.99, 8.52], ['Jigawa', 12.17, 9.33], ['Yobe', 11.75, 11.96], 
    ['Borno', 11.83, 13.16], ['Adamawa', 9.21, 12.48], ['Taraba', 8.00, 10.50],
    ['Gombe', 10.29, 11.17], ['Bauchi', 10.31, 9.84], ['Plateau', 9.92, 8.89],
    ['Kaduna', 10.52, 7.44], ['Niger', 9.61, 6.56], ['Kebbi', 12.45, 4.20],
    ['Kwara', 8.50, 4.55], ['FCT', 9.05, 7.39], ['Nasarawa', 8.49, 8.52],
    ['Kogi', 7.80, 6.75], ['Benue', 7.73, 8.52], ['Enugu', 6.44, 7.49],
    ['Ebonyi', 6.33, 8.12], ['Cross River', 5.87, 8.60], ['Akwa Ibom', 5.03, 7.93],
    ['Rivers', 4.82, 7.03], ['Bayelsa', 4.92, 6.27], ['Delta', 5.50, 5.90],
    ['Edo', 6.34, 5.63], ['Ondo', 7.25, 5.19], ['Ekiti', 7.63, 5.22],
    ['Anambra', 6.21, 7.07], ['Imo', 5.48, 7.03], ['Abia', 5.54, 7.49],
    ['Lagos', 6.45, 3.40], ['Ogun', 7.16, 3.35], ['Oyo', 7.38, 3.93],
    ['Osun', 7.76, 4.56],
  ];

  // List of all Nigerian states for text matching
  const stateNames = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
    'Yobe', 'Zamfara', 'Abuja'
  ];

  // Helper: Find state from coordinates
  const findStateFromCoords = (lat, lng) => {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
    
    let closestState = null;
    let minDistance = Infinity;
    
    statePositions.forEach(([state, stateLat, stateLng]) => {
      const distance = Math.sqrt(
        Math.pow(lat - stateLat, 2) + Math.pow(lng - stateLng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestState = state;
      }
    });
    
    // Return if within reasonable distance (~200km in coordinate units)
    return minDistance < 2.5 ? closestState : null;
  };

  // Helper: Extract state from address string
  const extractStateFromAddress = (address) => {
    if (!address) return null;
    
    const addressLower = address.toLowerCase();
    
    // Try to find state name in address
    for (const state of stateNames) {
      const stateLower = state.toLowerCase();
      if (addressLower.includes(stateLower)) {
        return state;
      }
      // Check for "X State" pattern
      if (addressLower.includes(stateLower + ' state')) {
        return state;
      }
    }
    
    // Check for common abbreviations
    if (addressLower.includes('fct') || addressLower.includes('abuja')) return 'FCT';
    
    return null;
  };

  // Build state risk map from alerts
  const stateRisk = {};
  
  alerts.forEach(a => {
    let state = null;
    
    // Method 1: Direct state field
    if (a.state) {
      state = a.state.replace(/ State$/i, '').trim();
    }
    
    // Method 2: Extract from address
    if (!state && a.address) {
      state = extractStateFromAddress(a.address);
    }
    if (!state && a.location_name) {
      state = extractStateFromAddress(a.location_name);
    }
    if (!state && a.loc) {
      state = extractStateFromAddress(a.loc);
    }
    
    // Method 3: Use coordinates
    if (!state) {
      const lat = a.lat || a.latitude || a.location_lat;
      const lng = a.lng || a.longitude || a.location_lng;
      if (lat && lng) {
        state = findStateFromCoords(parseFloat(lat), parseFloat(lng));
      }
    }
    
    // Method 4: Check affected_states field
    if (!state && a.affected_states) {
      state = a.affected_states.replace(/ State$/i, '').trim();
    }
    
    if (state) {
      const level = a.level || a.risk_level || a.nffs_level || 'WATCH';
      // Risk priority (higher number = more severe)
      const riskOrder = { 
        'NONE': 0, 'NORMAL': 0, 
        'WATCH': 1, 
        'MEDIUM': 2, 'WARNING': 2, 
        'HIGH': 3, 'SEVERE': 4, 
        'CRITICAL': 5, 'EXTREME': 5 
      };
      
      const existingLevel = stateRisk[state];
      if (!existingLevel || (riskOrder[level] || 1) > (riskOrder[existingLevel] || 1)) {
        stateRisk[state] = level;
      }
    }
  });

  const hasAlerts = Object.keys(stateRisk).length > 0;

  // Debug log
  console.log('🔥 Heatmap - Alerts received:', alerts.length);
  console.log('🔥 Heatmap - State risk map:', stateRisk);

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: 16,
      width: '100%',
      overflow: 'hidden'
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.bright, marginBottom: 4 }}>
        {t('nationalAlertHeatmap')}
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
        {hasAlerts 
          ? t('liveAlertStatus') 
          : t('noActiveAlertsAllNormal')}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {[
          {level:'CRITICAL', label: t('criticalExtreme')},
          {level:'HIGH', label: t('highRisk')},
          {level:'MEDIUM', label: t('lowRisk')},
        ].map(({level, label}) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: RISK_COLOR(level) }} />
            <span style={{ color: C.muted }}>{label}</span>
          </div>
        ))}
      </div>

      {/* SVG Map */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox="0 0 200 200" style={{ width: '100%', maxHeight: 300, minWidth: 200 }}>
          <rect x="5" y="5" width="190" height="190" rx="4" fill={C.s2} stroke={C.border} strokeWidth="0.5"/>
          <text x="100" y="100" textAnchor="middle" fontSize="8" fill={`${C.muted}40`} fontWeight="bold">NIGERIA</text>

          {/* State dots */}
          {hasAlerts && statePositions.map(([state, lat, lng]) => {
            const risk = stateRisk[state];
            if (!risk) return null;
            
            const x = ((lng - 3) / 12) * 180 + 10;
            const y = 190 - ((lat - 4) / 10) * 180;
            const col = RISK_COLOR(
              risk === 'SEVERE' ? 'CRITICAL' : 
              risk === 'EXTREME' ? 'CRITICAL' : 
              risk === 'WARNING' ? 'MEDIUM' : 
              risk
            );
            
            return (
              <g key={state}>
                <circle cx={x} cy={y} r={10} fill={col} opacity={0.15}/>
                <circle cx={x} cy={y} 
                  r={risk === 'HIGH' || risk === 'CRITICAL' || risk === 'SEVERE' || risk === 'EXTREME' ? 5 : 
                     risk === 'MEDIUM' || risk === 'WARNING' ? 4 : 3.5}
                  fill={col} opacity={0.85} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
                <text x={x} y={y + 9} textAnchor="middle" fontSize="4" fill={C.muted} opacity={0.7}>
                  {state.length > 8 ? state.slice(0, 7) + '.' : state}
                </text>
              </g>
            );
          })}

          {!hasAlerts && (
            <text x="100" y="140" textAnchor="middle" fontSize="6" fill={C.success} fontWeight="bold">
              {t('allStatesNormal')}
            </text>
          )}

          {/* Rivers */}
          <path d="M 85,25 Q 70,60 60,90 Q 55,115 60,135 Q 65,155 75,170" 
            stroke="#1E90FF" strokeWidth="1.5" fill="none" opacity="0.3" strokeDasharray="3 2"/>
          <path d="M 140,80 Q 120,95 100,105 Q 80,115 60,135" 
            stroke="#1E90FF" strokeWidth="1.2" fill="none" opacity="0.3" strokeDasharray="3 2"/>
        </svg>
      </div>

      <div style={{ marginTop: 8, fontSize: 11, color: C.muted, textAlign: 'center' }}>
        {hasAlerts 
          ? `${Object.keys(stateRisk).length} state${Object.keys(stateRisk).length !== 1 ? 's' : ''} with active alerts`
          : `✅ ${t('noActiveFloodAlerts')}`}
      </div>
    </div>
  );
};
// ─── ALERTS TAB ───────────────────────────────────────────────────────────────
const AlertsTab = ({ alerts, loading, error }) => {
  const [sel, setSel] = useState(null);
  const detailRef = useRef(null);
  const data = alerts.length ? alerts : [];

  useEffect(() => {
    if (sel && detailRef.current) {
      setTimeout(() => {
        detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [sel]);

  const staticAlerts = [];

  const display = data.length ? data : staticAlerts;
  const selected = sel !== null ? display.find(a=>(a.id||a.alert_id)===sel)||display[sel] : null;

  return (
    <div style={{
      padding: '16px 0',
      maxWidth: 1200,
      margin: '0 auto',
      width: '100%',
      overflowX: 'hidden'
    }}>
      <ErrorBanner msg={error} />
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner size={32} />
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          width: '100%',
          overflowX: 'hidden'
        }}>
          {/* Heatmap - Always visible at top on mobile */}
          <div style={{ 
            width: '100%',
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <NationalHeatmap alerts={display} />
          </div>

          {/* Alert List - Scrollable */}
          <div style={{ 
            width: '100%',
            minWidth: 0,
            overflowX: 'hidden',
            maxHeight: selected ? '400px' : 'none',
            overflowY: selected ? 'auto' : 'visible'
          }}>
            {display.length ? display.map((a, i) => (
              <div 
                key={a.id || i} 
                onClick={() => setSel(sel === (a.id || i) ? null : (a.id || i))}
                style={{
                  padding: '16px',
                  background: sel === (a.id || i) ? RISK_BG(a.level) : C.surface,
                  border: `1px solid ${sel === (a.id || i) ? RISK_COLOR(a.level) : C.border}`,
                  borderRadius: 10,
                  marginBottom: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  wordBreak: 'break-word'
                }}>
                <div style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  gap: 10, 
                  marginBottom: 6, 
                  flexWrap: 'wrap'
                }}>
                  <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
                    <Badge level={a.level}/>
                    <span style={{fontSize: 13, fontWeight: 700, color: C.bright}}>
                      {translateAlert(a.title || a.level)}
                    </span>
                  </div>
                  {a.is_active && (
                    <span style={{
                      fontSize: 10, 
                      color: C.success, 
                      fontWeight: 700, 
                      background: '#10B98120', 
                      padding: '2px 6px', 
                      borderRadius: 4, 
                      whiteSpace: 'nowrap'
                    }}>
                      {t('active').toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={{fontSize: 12, color: C.muted, marginBottom: 4}}>
                  {a.state || a.affected_states}
                </div>
                <div style={{
                  fontSize: 12, 
                  color: C.text, 
                  lineHeight: 1.4, 
                  overflow: 'hidden', 
                  display: '-webkit-box', 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: 'vertical'
                }}>
                  {translateAlert(a.message || a.msg)}
                </div>
                {a.affected_lgas && (
                  <div style={{fontSize: 11, color: C.muted, marginTop: 6}}>
                    LGAs: {a.affected_lgas}
                  </div>
                )}
              </div>
            )) : (
              <EmptyState icon="✅" msg={t('noAlertsNormal')} />
            )}
          </div>

          {/* Detail Panel - Slides up from bottom on mobile */}
          {selected && (
            <Card 
              ref={detailRef}
              style={{ 
                marginTop: 8,
                marginBottom: 20,
                wordBreak: 'break-word',
                width: '100%',
                maxHeight: '60vh',
                overflowY: 'auto'
              }}>
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 12,
                position: 'sticky',
                top: 0,
                background: C.surface,
                paddingBottom: 8,
                borderBottom: `1px solid ${C.border}`
              }}>
                <Badge level={selected.level}/>
                <button 
                  onClick={() => setSel(null)} 
                  style={{
                    background: 'none', 
                    border: 'none', 
                    color: C.muted, 
                    cursor: 'pointer', 
                    fontSize: 18,
                    padding: '4px 8px'
                  }}>
                  ✕
                </button>
              </div>
              
              <div style={{fontSize: 16, fontWeight: 700, color: C.bright, marginBottom: 4}}>
                {translateAlert(selected.title || selected.level)}
              </div>
              
              <div style={{fontSize: 12, color: C.muted, marginBottom: 12}}>
                {selected.state} · {selected.start_date ? new Date(selected.start_date).toLocaleDateString() : t('active')}
              </div>
              
              <div style={{
                fontSize: 13, 
                color: C.text, 
                lineHeight: 1.6, 
                marginBottom: 16,
                padding: '10px 12px',
                background: C.s2,
                borderRadius: 8,
                border: `1px solid ${C.border}`
              }}>
                {translateAlert(selected.message || selected.msg)}
              </div>
              
              {selected.affected_lgas && (
                <div style={{marginBottom: 12}}>
                  <div style={{
                    fontSize: 11, 
                    color: C.muted, 
                    fontWeight: 700, 
                    letterSpacing: '0.06em', 
                    marginBottom: 6
                  }}>
                    📍 {t('affectedLGAs').toUpperCase()}
                  </div>
                  <div style={{
                    fontSize: 12, 
                    color: C.text,
                    padding: '8px 12px',
                    background: C.s2,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`
                  }}>
                    {selected.affected_lgas}
                  </div>
                </div>
              )}
              
              {selected.recommended_actions && (
                <div>
                  <div style={{
                    fontSize: 11, 
                    color: C.muted, 
                    fontWeight: 700, 
                    letterSpacing: '0.06em', 
                    marginBottom: 6
                  }}>
                    ✅ {t('recommendedActions').toUpperCase()}
                  </div>
                  {selected.recommended_actions.split('\n').filter(Boolean).map((a, i) => (
                    <div key={i} style={{
                      fontSize: 12, 
                      color: C.text, 
                      padding: '8px 12px', 
                      background: C.s2, 
                      borderRadius: 6, 
                      marginBottom: 4,
                      border: `1px solid ${C.border}`
                    }}>
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────
const ProfileModal = ({ user, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_BASE + '/auth/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('nihsa_token')}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProfile(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const info = profile || user;

  return (
    <div style={{position:'fixed',inset:0,background:'#0009',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:20}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,maxWidth:420,width:'100%',boxShadow:'0 8px 40px #000a',overflow:'hidden'}}>
        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${C.primary}20,${C.info}10)`,padding:'24px 24px 16px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:56,height:56,borderRadius:14,background:`linear-gradient(135deg,${C.primary},${C.info})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:800,color:'#fff',flexShrink:0}}>
              {(info.full_name||info.name||info.email||'U')[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:17,fontWeight:700,color:C.bright}}>{info.full_name||info.name||'User'}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2,textTransform:'capitalize'}}>{info.role?.replace('_',' ')||'Citizen'}</div>
            </div>
            <button onClick={onClose} style={{marginLeft:'auto',background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:20,lineHeight:1}}>×</button>
          </div>
        </div>
        {/* Details */}
        <div style={{padding:24}}>
          {loading ? (
            <div style={{textAlign:'center',padding:20,color:C.muted}}>Loading…</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[
                {icon:'✉️', label:'Email', value:info.email},
                {icon:'📱', label:'Phone', value:info.phone_number||info.phone},
                {icon:'📍', label:'State', value:info.state},
                {icon:'🏘️', label:'LGA', value:info.lga},
                {icon:'✅', label:'Verified', value:info.is_verified?'Yes':'No'},
                {icon:'📅', label:'Member since', value:info.created_at?new Date(info.created_at).toLocaleDateString('en-NG',{year:'numeric',month:'long',day:'numeric'}):null},
              ].filter(r => r.value).map(r => (
                <div key={r.label} style={{display:'flex',gap:12,alignItems:'center',padding:'10px 12px',background:C.s2,borderRadius:8,border:`1px solid ${C.border}`}}>
                  <span style={{fontSize:16,flexShrink:0}}>{r.icon}</span>
                  <div>
                    <div style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase'}}>{r.label}</div>
                    <div style={{fontSize:13,color:C.bright,marginTop:1}}>{r.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function PublicApp() {
  const [tab, setTab] = useState('map');
  const [user, setUser] = useState(() => api.currentUser());
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('nihsa_lang')||'en'; } catch { return 'en'; } });
  const [tutorialModal, setTutorialModal] = useState({ show: false, topic: 'general' });
  const [reportPrefill, setReportPrefill] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const navigate = useNavigate();
  // Update translation lang when user changes language
  const handleLangChange = (l) => { setLang(l); _currentLang = l; };

  useEffect(() => {
    // Listen for AI navigation requests
    const handleNavigate = (e) => {
      const { tab } = e.detail;
      if (['map', 'dashboard', 'vanguard', 'assistant', 'alerts'].includes(tab)) {
        setTab(tab);
      }
    };
    
    // Listen for report modal open
    const handleOpenReport = (e) => {
      const { prefill_location, prefill_description } = e.detail || {};
      setShowReport(true);
      setReportPrefill({ location: prefill_location, description: prefill_description });
    };
    
    // Listen for tutorial requests
    const handleShowTutorial = (e) => {
      const { topic } = e.detail || {};
      setTutorialModal({ show: true, topic: topic || 'general' });
    };
    
    // Listen for location search
    const handleSearchLocation = (e) => {
      const { query } = e.detail || {};
      setTab('map');
      // Dispatch to MapTab to perform search
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('nihsa:map-search', { detail: { query } }));
      }, 100);
    };
    
    window.addEventListener('nihsa:navigate', handleNavigate);
    window.addEventListener('nihsa:open-report', handleOpenReport);
    window.addEventListener('nihsa:show-tutorial', handleShowTutorial);
    window.addEventListener('nihsa:search-location', handleSearchLocation);
    
    return () => {
      window.removeEventListener('nihsa:navigate', handleNavigate);
      window.removeEventListener('nihsa:open-report', handleOpenReport);
      window.removeEventListener('nihsa:show-tutorial', handleShowTutorial);
      window.removeEventListener('nihsa:search-location', handleSearchLocation);
    };
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (token && refreshToken) {
        try {
          // Try to refresh to ensure we have a valid session
          await api.refreshAccessToken();
          setUser(api.currentUser());
        } catch (e) {
          // Refresh failed - user needs to log in again
          console.log('Session expired, please log in again');
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
        }
      }
      setIsInitialized(true);
    };
    
    initializeAuth();
  }, []);
  // Live data
  const { data: gauges, loading: gaugesLoading, error: gaugesErr } = useLiveData('/gauges', []);
  const { data: alertsRaw, loading: alertsLoading, error: alertsErr } = useLiveData('/alerts?active_only=true&published_only=true', []);
  const { data: reports, loading: reportsLoading } = useLiveData('/reports?status=VERIFIED', []);
  const { data: stats, loading: statsLoading } = useLiveData('/dashboard/stats', null);

  const alerts = Array.isArray(alertsRaw) ? alertsRaw : (alertsRaw?.items || []);

  const tabs = [
    { id:'map',       label:t('map'),        icon:'🗺️' },
    { id:'dashboard', label:t('dashboard'),  icon:'📊' },
    { id:'vanguard',  label:t('marshals'),   icon:'🦺' },
    { id:'assistant', label:t('assistant'),  icon:'💬' },
    { id:'alerts',    label:t('alerts'),     icon:'⚠️' },
  ];

  const criticalCount = (alerts.length ? alerts : []).filter(a=>a.level==='CRITICAL').length;

  return (
    <div style={{background:C.bg, minHeight:'100vh', color:C.text, fontFamily:'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin:0; background:${C.bg}; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:${C.bg}; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:3px; }
        .leaflet-popup-content-wrapper { background:${C.s2}!important; color:${C.text}!important; border:1px solid ${C.border}!important; border-radius:10px!important; }
        .leaflet-popup-tip { background:${C.s2}!important; }
        .leaflet-control-zoom a { background:${C.s2}!important; color:${C.text}!important; border-color:${C.border}!important; }
        .leaflet-bar { border-color:${C.border}!important; }
        input::placeholder { color:${C.muted}; }
        textarea::placeholder { color:${C.muted}; }
        select option { background:${C.s2}; color:${C.bright}; }
        @media (max-width: 768px) {
          .alerts-grid {
            grid-template-columns: 1fr !important;
          }
          .desktop-nav {
            display: none !important;
          }
          
          /* Show mobile tab bar */
          .mobile-tabs {
            display: flex !important;
          }
          
          /* Add padding to main content to account for fixed bottom bar */
          main {
            padding-bottom: 80px !important;
          }
          
          /* Adjust other responsive styles */
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
          .alerts-grid {
            grid-template-columns: 1fr !important;
          }
          .vanguard-container {
            flex-direction: column !important;
            height: auto !important;
          }
          .vanguard-channels {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid ${C.border} !important;
            overflow-x: auto !important;
            display: flex !important;
            flex-direction: row !important;
          }
          .assistant-container {
            margin: 0 12px !important;
          }
        }

        @media (max-width: 640px) {
          main > div {
            padding: 0 12px !important;
          }
          .forecast-cards {
            grid-template-columns: 1fr !important;
          }
          .desktop-only { 
            display: none !important; 
          }
        }

        @media (max-width: 480px) {
          .mobile-tabs button {
            padding: 4px 8px !important;
          }
          .mobile-tabs span:first-child {
            font-size: 18px !important;
          }
          .mobile-tabs span:last-child {
            font-size: 9px !important;
          }
          .map-toolbar-buttons {
            flex-wrap: wrap !important;
          }
          .map-toolbar-buttons button {
            flex: 1 !important;
            justify-content: center !important;
          }
        }
      `}</style>

      {/* Header */}
      <header style={{
        background: C.surface, 
        borderBottom: `1px solid ${C.border}`, 
        padding: '8px 12px', 
        display: 'flex', 
        flexWrap: 'wrap',  
        alignItems: 'center', 
        justifyContent: 'space-between',  
        position: 'sticky', 
        top: 0, 
        zIndex: 1000, 
        gap: 8
      }}>
        
        {/* Logo - always visible, stays on left */}
        <div onClick={() => setTab('map')} style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          flexShrink: 0, 
          cursor: 'pointer'
        }}>
          <img src="/nihsa-logo.png" alt="NIHSA"
            style={{width: 36, height: 36, objectFit: 'contain'}}
            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
          />
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `linear-gradient(135deg,${C.primary},${C.info})`,
            alignItems: 'center', justifyContent: 'center', fontSize: 16,
            display: 'none'
          }}>🌊</div>
          <div>
            <div style={{
              fontFamily: 'Rajdhani,sans-serif',
              fontSize: 14, fontWeight: 700, color: C.bright,
              letterSpacing: '0.04em', lineHeight: 1.2
            }}>NIHSA</div>
            <div style={{
              fontSize: 8, color: C.muted,
              letterSpacing: '0.06em', lineHeight: 1.2
            }}>FLOOD INTELLIGENCE</div>
          </div>
        </div>

        {/* Right section - wraps everything together */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          flex: '1 1 auto',
          justifyContent: 'flex-end'
        }}>
          
          {/* Nav tabs - wrap on small screens */}
          <nav className="desktop-nav" style={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                background: tab === t.id ? `${C.primary}20` : 'transparent',
                color: tab === t.id ? C.accent : C.muted,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: tab === t.id ? 700 : 400,
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap'
              }}>
                <span style={{fontSize: 14}}>{t.icon}</span>
                <span style={{fontSize: 11}} className="nav-label">{t.label}</span>
                {t.id === 'alerts' && criticalCount > 0 && 
                  <span style={{width: 6, height: 6, borderRadius: '50%', background: C.danger, animation: 'pulse 2s ease infinite'}} />
                }
              </button>
            ))}
          </nav>

          {/* User/Language section */}
          <div style={{display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0}}>
            
            {user ? (
              <div style={{display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, position: 'relative'}}>
                <LangSelector lang={lang} setLang={handleLangChange} />
                <button 
                  onClick={() => setShowUserMenu(prev => !prev)} 
                  style={{
                    width: 32, 
                    height: 32, 
                    borderRadius: 8,
                    background: `${C.primary}30`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: C.primary,
                    border: `2px solid ${showUserMenu ? C.primary : 'transparent'}`,
                    cursor: 'pointer'
                  }}
                >
                  {(user.full_name || user.name || user.email || 'U')[0].toUpperCase()}
                </button>
                
                {/* User Menu Popup - Fixed positioning */}
                {showUserMenu && (
                  <>
                    {/* Backdrop to close when clicking outside */}
                    <div 
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9998,
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 8,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                      minWidth: 200,
                      zIndex: 9999,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '12px',
                        borderBottom: `1px solid ${C.border}`,
                        background: `${C.primary}10`
                      }}>
                        <div style={{fontSize: 13, fontWeight: 700, color: C.bright}}>
                          {user.full_name || user.name || user.email}
                        </div>
                        <div style={{fontSize: 11, color: C.muted, marginTop: 2, textTransform: 'capitalize'}}>
                          {user.role?.replace('_', ' ') || 'User'}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowProfile(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          background: 'transparent',
                          border: 'none',
                          color: C.text,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = C.s2}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        👤 View Profile
                      </button>
                      
                      {['admin', 'sub_admin', 'nihsa_staff', 'government'].includes(user.role) && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/admin');
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            background: 'transparent',
                            border: 'none',
                            color: C.primary,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = C.s2}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          🏛 Admin Panel
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          api.logout();
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          background: 'transparent',
                          border: 'none',
                          borderTop: `1px solid ${C.border}`,
                          color: C.danger,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = `${C.danger}15`}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0}}>
                <LangSelector lang={lang} setLang={handleLangChange} />
                <button onClick={() => setShowAuth(true)} style={{
                  padding: '5px 12px',
                  background: `linear-gradient(135deg,${C.primary},#0284C7)`,
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}>
                  {t('signIn')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile tab bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        zIndex: 999,
        padding: '8px 0',
        display: 'none',  
        justifyContent: 'space-around'
      }} className="mobile-tabs">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: tab === t.id ? C.primary : C.muted,
            fontSize: 10,
            fontWeight: tab === t.id ? 700 : 400,
            borderRadius: 8,
            transition: 'all 0.15s'
          }}>
            <span style={{fontSize: 20}}>{t.icon}</span>
            <span>{t.label}</span>
            {t.id === 'alerts' && criticalCount > 0 && 
              <span style={{
                position: 'absolute',
                top: 4,
                right: 12,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: C.danger,
                animation: 'pulse 2s ease infinite'
              }} />
            }
          </button>
        ))}
      </div>

      {/* Main content */}
      <main style={{ 
        paddingBottom: 120, 
        maxWidth: '100%',
        margin: '0 auto',
        minHeight: 'calc(100vh - 120px)'
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%',
          padding: '0 16px'
        }}>
          {tab === 'map' && <MapTab 
            user={user} 
            gauges={gauges} 
            alerts={alerts} 
            reports={reports} 
            loading={gaugesLoading} 
            error={gaugesErr}
            showReport={showReport}
            setShowReport={setShowReport}
            reportPrefill={reportPrefill}
            />}
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'vanguard' && <VanguardTab user={user} onSignIn={() => setShowAuth(true)} />}
          {tab === 'assistant' && <AssistantTab 
            gauges={gauges} 
            alerts={alerts} 
            user={user} 
            onSignIn={() => setShowAuth(true)} 
          />}
          {tab === 'alerts' && <AlertsTab alerts={alerts} loading={alertsLoading} error={alertsErr} />}
        </div>
      </main>

      {/* ── Always-visible news-style alert ticker ── */}
      <div style={{
        position: 'fixed', 
        bottom: '60px',  // ← Move up to sit above mobile tab bar
        left: 0, 
        right: 0, 
        zIndex: 900
      }}>
        <AlertTicker alerts={alerts} />
      </div>

      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onAuth={u=>{setUser(u);setShowAuth(false);}} />}
      {showProfile && user && <ProfileModal user={user} onClose={()=>setShowProfile(false)} />}

      {tutorialModal.show && (
        <TutorialModal 
          topic={tutorialModal.topic} 
          language={lang}
          onClose={() => setTutorialModal({ show: false, topic: 'general' })} 
        />
      )}
      
      {/* Report Modal - now controlled at PublicApp level */}
      {showReport && (
        <ReportModal 
          user={user} 
          onClose={() => {
            setShowReport(false);
            setReportPrefill(null);
          }}
          prefill={reportPrefill}
        />
      )}
    
    </div>
  );
}
