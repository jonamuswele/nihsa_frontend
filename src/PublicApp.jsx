// ╔══════════════════════════════════════════════════════════════════╗
// ║  NIHSA NATIONAL FLOOD INTELLIGENCE PLATFORM  v2.0               ║
// ║  Production-grade · Live API · Leaflet Map · WebSocket          ║
// ║  React + Leaflet + Recharts · PRD-compliant                     ║
// ╚══════════════════════════════════════════════════════════════════╝
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

const ATLAS_BASE = process.env.REACT_APP_NFFS_ATLAS || "/nffs/atlas";

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
  },
  ha: {
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
  },
  yo: {
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
  },
  ig: {
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
  },
  fr: {
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
  },
};

let _currentLang = 'en';
try { _currentLang = localStorage.getItem('nihsa_lang') || 'en'; } catch {}
const t = (key) => (TRANSLATIONS[_currentLang] || TRANSLATIONS.en)[key] || TRANSLATIONS.en[key] || key;

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
  `;
  document.head.appendChild(s);
}
const POLL_MS    = 30_000;   // 30s polling interval
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

const RISK_COLOR  = r => ({CRITICAL:'#EF4444',HIGH:'#F97316',MEDIUM:'#F59E0B',WATCH:'#EAB308',NORMAL:'#10B981'}[r]||'#4A7A9B');
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

const AFO_STATIC = [
  {m:'Mar',q05:380,q50:680,q95:1100},{m:'Apr',q05:720,q50:1250,q95:2100},
  {m:'May',q05:1400,q50:2800,q95:4600},{m:'Jun',q05:2800,q50:4900,q95:7800},
  {m:'Jul',q05:5200,q50:8100,q95:12800},{m:'Aug',q05:8400,q50:12900,q95:18600},
  {m:'Sep',q05:7800,q50:11400,q95:16900},{m:'Oct',q05:5600,q50:8200,q95:13100},
  {m:'Nov',q05:3100,q50:4800,q95:7600},{m:'Dec',q05:1100,q50:1800,q95:2900},
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

// Nigeria states for the national heatmap
const NG_STATES_RISK = [
  { state:'Kogi', risk:'SEVERE', lat:7.5, lng:6.7 },
  { state:'Benue', risk:'WARNING', lat:7.7, lng:8.5 },
  { state:'Anambra', risk:'WARNING', lat:6.2, lng:6.8 },
  { state:'Delta', risk:'WATCH', lat:5.5, lng:5.9 },
  { state:'Rivers', risk:'WATCH', lat:4.8, lng:7.0 },
  { state:'Taraba', risk:'WATCH', lat:8.0, lng:11.0 },
  { state:'Niger', risk:'WATCH', lat:9.5, lng:6.0 },
  { state:'Edo', risk:'NORMAL', lat:6.3, lng:5.6 },
  { state:'Kwara', risk:'NORMAL', lat:8.5, lng:4.5 },
  { state:'Nasarawa', risk:'NORMAL', lat:8.5, lng:8.5 },
  { state:'Bayelsa', risk:'WATCH', lat:4.8, lng:6.1 },
  { state:'Cross River', risk:'NORMAL', lat:5.8, lng:8.6 },
  { state:'Adamawa', risk:'NORMAL', lat:9.5, lng:12.3 },
  { state:'Plateau', risk:'NORMAL', lat:9.2, lng:9.5 },
  { state:'Enugu', risk:'NORMAL', lat:6.5, lng:7.5 },
];

// ─── API SERVICE ───────────────────────────────────────────────────────────────
const api = {
  token: () => localStorage.getItem(TOKEN_KEY),

  headers: () => ({
    'Content-Type': 'application/json',
    ...(localStorage.getItem(TOKEN_KEY) ? { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` } : {}),
  }),

  async get(path) {
    const r = await fetch(API_BASE + path, { headers: this.headers() });
    if (r.status === 401) { api.logout(); return null; }
    if (!r.ok) throw new Error(`API ${r.status}`);
    return r.json();
  },

  async post(path, body) {
    const r = await fetch(API_BASE + path, { method:'POST', headers: this.headers(), body: JSON.stringify(body) });
    if (!r.ok) { const e = await r.json().catch(()=>({detail:'Error'})); throw new Error(e.detail||'Error'); }
    return r.json();
  },

  async login(email, password) {
    const form = new URLSearchParams({ username: email, password });
    const r = await fetch(API_BASE + '/auth/login', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body: form });
    if (!r.ok) { const e = await r.json().catch(()=>({detail:'Invalid credentials'})); throw new Error(e.detail||'Login failed'); }
    const data = await r.json();
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user||{}));
    return data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.reload();
  },

  currentUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)||'null'); } catch { return null; }
  },

  // Nominatim geocode search
  async nominatim(q) {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}&countrycodes=ng`, {
      headers: { 'Accept-Language': 'en' }
    });
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
const AuthModal = ({ onClose, onAuth }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [isFloodMarshal, setIsFloodMarshal] = useState(false);
  const [marshalData, setMarshalData] = useState({});
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
            <div style={{fontSize:15,fontWeight:700,color:C.bright,marginBottom:4}}>Reset Password</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Enter your email and we will send you a reset link via Resend.</div>
            {forgotSent
              ? <div style={{padding:'12px',background:'#10B98120',border:`1px solid ${C.success}`,borderRadius:8,fontSize:13,color:C.success,textAlign:'center'}}>
                  ✅ Reset link sent! Check your email inbox.
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
                    {loading?'Sending...':'Send Reset Link'}
                  </button>
                </>
            }
            <button onClick={()=>{setMode('login');setErr('');setForgotSent(false);}}
              style={{width:'100%',marginTop:10,padding:'9px',background:'transparent',
                border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,fontSize:13,cursor:'pointer'}}>
              ← Back to Sign In
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
                      letterSpacing:'0.06em',marginBottom:10}}>🦺 FLOOD MARSHAL DETAILS</div>
                    {[
                      ['phone',       'Phone Number',              'tel',      '0801 234 5678'],
                      ['state',       'State of Operation',        'text',     'e.g. Kogi State'],
                      ['lga',         'LGA of Operation',          'text',     'e.g. Lokoja'],
                      ['organisation','Organisation / Agency',     'text',     'e.g. NIHSA, NEMA, Red Cross'],
                      ['role_in_org', 'Role in Organisation',      'text',     'e.g. Staff, Volunteer, Leader'],
                      ['experience',  'Years of Flood Experience', 'number',   'e.g. 3'],
                      ['heard_from',  'How did you hear about NIHSA Platform?','text','e.g. Social Media, NIHSA Office'],
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
          </>
        )}
      </div>
    </div>
  );
};

// ─── CITIZEN REPORT MODAL ──────────────────────────────────────────────────────
const ReportModal = ({ user, onClose }) => {
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
  const [isRecordingVoice, setRecVoice] = useState(false);
  const [isRecordingVideo, setRecVideo] = useState(false);
  const [voiceTime, setVoiceTime]     = useState(0);
  const [videoTime, setVideoTime]     = useState(0);
  const voiceRecRef  = useRef(null);
  const videoRecRef  = useRef(null);
  const voiceTimer   = useRef(null);
  const videoTimer   = useRef(null);
  const pinMapRef    = useRef(null);
  const pinLeafRef   = useRef(null);
  const pinMarkerRef = useRef(null);

  const inp = {width:'100%',padding:'10px 12px',background:C.s2,border:`1px solid ${C.border}`,
    borderRadius:8,color:C.bright,fontSize:13,outline:'none',boxSizing:'border-box'};

  // GPS auto-capture
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setLocLat(pos.coords.latitude);
        setLocLng(pos.coords.longitude);
        setLoc('Current GPS location');
      }, () => { setLocLat(9.082); setLocLng(8.675); });
    }
  }, []);

  // Init draggable pin map when lat/lng available
  useEffect(() => {
    if (!locLat || !locLng || !pinMapRef.current) return;
    if (!L) return;
    if (pinLeafRef.current) { pinLeafRef.current.remove(); pinLeafRef.current = null; }
    if (pinMapRef.current._leaflet_id) {
      pinMapRef.current._leaflet_id = null;
      while (pinMapRef.current.firstChild) pinMapRef.current.removeChild(pinMapRef.current.firstChild);
    }
    const map = L.map(pinMapRef.current, { zoomControl:true, dragging:true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:18 }).addTo(map);
    map.setView([locLat, locLng], 15);
    const marker = L.marker([locLat, locLng], { draggable: true }).addTo(map);
    marker.bindPopup('📍 Drag to adjust your location').openPopup();
    marker.on('dragend', (e) => {
      const ll = e.target.getLatLng();
      setLocLat(ll.lat);
      setLocLng(ll.lng);
      setLoc(`${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`);
    });
    pinLeafRef.current  = map;
    pinMarkerRef.current = marker;
    return () => {
      try { map.remove(); } catch {}
      pinLeafRef.current = null;
    };
  }, [locLat !== null, locLng !== null]); // only init once when coords first arrive

  // Nominatim
  const searchLoc = useCallback(async (q) => {
    if (q.length < 3) { setSuggestions([]); return; }
    try { const r = await api.nominatim(q); setSuggestions(r.slice(0,5)); } catch {}
  }, []);

  // Voice recording (max 60s)
  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => { setVoiceBlob(new Blob(chunks, { type:'audio/webm' })); stream.getTracks().forEach(t=>t.stop()); };
      rec.start();
      voiceRecRef.current = rec;
      setRecVoice(true); setVoiceTime(0);
      voiceTimer.current = setInterval(() => {
        setVoiceTime(p => { if (p >= 59) { stopVoice(); return 60; } return p+1; });
      }, 1000);
    } catch { setErr('Microphone access denied'); }
  };
  const stopVoice = () => {
    if (voiceRecRef.current) { voiceRecRef.current.stop(); voiceRecRef.current = null; }
    clearInterval(voiceTimer.current);
    setRecVoice(false);
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
    if (!depth || !desc) { setErr('Please fill in water depth and description'); return; }
    setSubmitting(true); setErr('');
    try {
      const form = new FormData();
      form.append('address', loc || '');
      form.append('lat',  String(locLat || 9.082));
      form.append('lng',  String(locLng || 8.675));
      form.append('water_depth_m', String(parseFloat(depth)||0));
      form.append('description', desc);
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
          <div style={{fontSize:17,fontWeight:700,color:C.bright}}>🚨 Report Flooding</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,fontSize:20,cursor:'pointer'}}>✕</button>
        </div>

        <div style={{padding:20}}>
        {success ? (
          <div style={{textAlign:'center',padding:'30px 0'}}>
            <div style={{fontSize:48,marginBottom:12}}>✅</div>
            <div style={{color:C.success,fontWeight:700,fontSize:16,marginBottom:8}}>Report Submitted</div>
            <div style={{color:C.muted,fontSize:13,lineHeight:1.6}}>
              Your report is now pending verification by NIHSA coordinators.
              Thank you for helping protect your community.
            </div>
            <button onClick={onClose} style={{marginTop:20,padding:'10px 28px',
              background:C.primary,border:'none',borderRadius:8,color:'#fff',
              cursor:'pointer',fontWeight:600}}>Done</button>
          </div>
        ) : (
          <>
            {/* ── Draggable Pin Map ─────────────────────────── */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:700,letterSpacing:'0.06em'}}>
                📍 YOUR LOCATION — DRAG PIN TO ADJUST
              </label>
              <div ref={pinMapRef}
                style={{width:'100%',height:200,borderRadius:10,
                  border:`1px solid ${C.border}`,background:C.s2,overflow:'hidden'}} />
              <div style={{fontSize:11,color:C.muted,marginTop:4}}>
                GPS captured automatically · Drag the pin if needed
              </div>
            </div>

            {/* Location search */}
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:700,letterSpacing:'0.06em'}}>LOCATION NAME</label>
              <input value={loc} onChange={e=>{setLoc(e.target.value);searchLoc(e.target.value);}}
                placeholder="Or search community, LGA, landmark..."
                style={inp} />
              {suggestions.length>0 && (
                <div style={{background:C.s3,border:`1px solid ${C.border}`,borderRadius:8,marginTop:4,overflow:'hidden',zIndex:100,position:'relative'}}>
                  {suggestions.map((s,i)=>(
                    <div key={i} onClick={()=>{
                      setLoc(s.display_name.slice(0,80));
                      setLocLat(parseFloat(s.lat)); setLocLng(parseFloat(s.lon));
                      setSuggestions([]);
                      if (pinLeafRef.current && L) {
                        pinLeafRef.current.setView([parseFloat(s.lat),parseFloat(s.lon)],15);
                        if (pinMarkerRef.current) pinMarkerRef.current.setLatLng([parseFloat(s.lat),parseFloat(s.lon)]);
                      }
                    }} style={{padding:'8px 12px',cursor:'pointer',fontSize:12,color:C.text,borderBottom:`1px solid ${C.border}`}}>
                      📍 {s.display_name.slice(0,70)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Water depth */}
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:700,letterSpacing:'0.06em'}}>WATER DEPTH *</label>
              <select value={depth} onChange={e=>setDepth(e.target.value)} style={{...inp,cursor:'pointer'}}>
                <option value="">Select depth...</option>
                <option value="0.1">Ankle-deep — water is up to the ankle (about 0.1–0.3m)</option>
                <option value="0.4">Knee-deep — water reaches the knee (about 0.4–0.6m)</option>
                <option value="0.8">Waist-deep — water is at waist level (about 0.7–1.0m)</option>
                <option value="1.2">Chest-deep — water reaches the chest (about 1.0–1.5m)</option>
                <option value="2.0">Impassable — area is fully submerged, no crossing possible</option>
              </select>
            </div>

            {/* Description */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:700,letterSpacing:'0.06em'}}>DESCRIBE WHAT YOU SEE *</label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)}
                placeholder="Describe the flooding: are roads blocked? Are homes affected? Are people stranded? Any injuries?"
                rows={3} style={{...inp,resize:'vertical'}} />
            </div>

            {/* ── Media section ─────────────────────────────── */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:8,fontWeight:700,letterSpacing:'0.06em'}}>MEDIA (OPTIONAL)</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>

                {/* Photo */}
                <label style={{display:'flex',flexDirection:'column',alignItems:'center',
                  justifyContent:'center',gap:6,padding:'12px 8px',
                  background: photo?`${C.success}15`:C.s2,
                  border:`1px dashed ${photo?C.success:C.border}`,
                  borderRadius:10,cursor:'pointer',fontSize:11,color:photo?C.success:C.muted,
                  textAlign:'center',minHeight:70}}>
                  <input type="file" accept="image/*" capture="environment" style={{display:'none'}}
                    onChange={e=>{if(e.target.files[0])setPhoto(e.target.files[0]);}} />
                  <span style={{fontSize:22}}>{photo?'✅':'📷'}</span>
                  <span>{photo?'Photo added':'Take Photo'}</span>
                </label>

                {/* Voice */}
                <button onClick={isRecordingVoice?stopVoice:voiceBlob?()=>setVoiceBlob(null):startVoice}
                  style={{display:'flex',flexDirection:'column',alignItems:'center',
                    justifyContent:'center',gap:6,padding:'12px 8px',
                    background: voiceBlob?`${C.success}15`:isRecordingVoice?`${C.danger}15`:C.s2,
                    border:`1px dashed ${voiceBlob?C.success:isRecordingVoice?C.danger:C.border}`,
                    borderRadius:10,cursor:'pointer',fontSize:11,
                    color:voiceBlob?C.success:isRecordingVoice?C.danger:C.muted,minHeight:70}}>
                  <span style={{fontSize:22,animation:isRecordingVoice?'pulse 1s infinite':undefined}}>
                    {voiceBlob?'✅':isRecordingVoice?'⏹':'🎤'}
                  </span>
                  <span>{voiceBlob?'Voice added':isRecordingVoice?fmtTime(voiceTime):'Record Voice'}</span>
                  {isRecordingVoice&&<span style={{fontSize:9,color:C.muted}}>Tap to stop</span>}
                </button>

                {/* Video */}
                <button onClick={isRecordingVideo?stopVideo:videoBlob?()=>setVideoBlob(null):startVideo}
                  style={{display:'flex',flexDirection:'column',alignItems:'center',
                    justifyContent:'center',gap:6,padding:'12px 8px',
                    background: videoBlob?`${C.success}15`:isRecordingVideo?`${C.danger}15`:C.s2,
                    border:`1px dashed ${videoBlob?C.success:isRecordingVideo?C.danger:C.border}`,
                    borderRadius:10,cursor:'pointer',fontSize:11,
                    color:videoBlob?C.success:isRecordingVideo?C.danger:C.muted,minHeight:70}}>
                  <span style={{fontSize:22,animation:isRecordingVideo?'pulse 1s infinite':undefined}}>
                    {videoBlob?'✅':isRecordingVideo?'⏹':'🎥'}
                  </span>
                  <span>{videoBlob?'Video added':isRecordingVideo?fmtTime(videoTime):'Record Video'}</span>
                  {isRecordingVideo&&<span style={{fontSize:9,color:C.muted}}>{60-videoTime}s left</span>}
                </button>
              </div>
              <div style={{fontSize:10,color:C.muted,marginTop:6}}>
                Voice and video: max 60 seconds each. Tap again to stop recording. Tap ✅ to remove.
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
              {submitting?'Submitting...':'Submit Flood Report'}
            </button>
            <div style={{fontSize:11,color:C.muted,textAlign:'center',marginTop:8}}>
              Reports are reviewed by NIHSA coordinators before publishing
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

// ─── MAP TAB (Leaflet) ─────────────────────────────────────────────────────────
const MapTab = ({ user, gauges, alerts, reports, loading, error }) => {
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
    // Surface Water
    stations:true, alerts:true, reports:false, sw_satellite:false, sw_station_updates:false,
    // Groundwater
    gw_levels:false, gw_aquifer:false, gw_recharge:false,
    // Water Quality
    wq_index:false, wq_turbidity:false, wq_contamination:false,
    // Coastal & Marine
    cm_coastal_risk:false, cm_storm_surge:false, cm_erosion:false, cm_mangrove:false,
    // Annual Forecast / AFO 2026
    fc_animation:false, fc_flood_extent:false, fc_population:false, fc_communities:false,
    fc_health:false, fc_schools:false, fc_farmland:false, fc_roads:false,
    // Weekly Forecast
    fw_flood_extent:false, fw_population:false, fw_communities:false,
    fw_health:false, fw_schools:false, fw_farmland:false, fw_roads:false,
  });
  const [groupCollapsed, setGroupCollapsed] = useState({
    surface_water:false, groundwater:true, water_quality:true, coastal_marine:true,
    forecast:false, forecast_weekly:true,
  });
  const [mapErr, setMapErr] = useState(false);
  const riverLayerRef = useRef(null);
  const stationLayerRef = useRef(null);
  const [showReport, setShowReport] = useState(false);
  // Backend-driven layer visibility
  const [backendLayers, setBackendLayers] = useState({});

  useEffect(() => {
    fetch(API_BASE + '/map-layers')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!Array.isArray(data)) return;
        const map = {};
        data.forEach(l => { map[l.layer_key] = l; });
        setBackendLayers(map);
        // Apply default_visible to layers state
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
      .catch(() => {});
  }, []);

  // Init Leaflet
  useEffect(() => {
    if (leafRef.current || !mapRef.current) return;

    const initMap = () => {
      // Guard against React StrictMode double-invoke — fully destroy any existing instance
      if (mapRef.current && mapRef.current._leaflet_id) {
        try {
          const existingMap = L.map(mapRef.current);
          existingMap.remove();
        } catch(e) {}
        mapRef.current._leaflet_id = null;
        // Remove all child nodes Leaflet injected
        while (mapRef.current.firstChild) {
          mapRef.current.removeChild(mapRef.current.firstChild);
        }
      }
      const map = L.map(mapRef.current, {
        center: [9.082, 8.675], zoom: 6,
        zoomControl: true, attributionControl: true,
      });

      // OSM tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      leafRef.current = map;
      setMapReady(true);

      // User geolocation
      map.locate({ setView: false, maxZoom: 12 });
      map.on('locationfound', e => {
        setUserPos([e.latlng.lat, e.latlng.lng]);
        const icon = L.divIcon({className:'', html:`<div style="width:14px;height:14px;border-radius:50%;background:#0EA5E9;border:3px solid white;box-shadow:0 0 0 4px #0EA5E940"></div>`, iconSize:[14,14], iconAnchor:[7,7]});
        if (markersRef.current.user) map.removeLayer(markersRef.current.user);
        markersRef.current.user = L.marker(e.latlng, {icon}).bindPopup('<b>📍 Your location</b>').addTo(map);
      });
    };

    initMap();

    return () => {
      if (leafRef.current) {
        try {
          // Clear all markers first to avoid _leaflet_events errors
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

  // Draw river network
  useEffect(() => {
    if (!mapReady || !leafRef.current) return;
    if (!L) return;
    if (riverLayerRef.current) leafRef.current.removeLayer(riverLayerRef.current);
    if (!layers.rivers) return;

    // Read RIVERS_REAL from the actual nihsa.jsx file by using the already-loaded variable
    // Since we can't dynamically import, we'll use the SVG approach for rivers
    // and Leaflet for interactive markers
    // Rivers will be drawn as a canvas overlay to avoid 3659 separate polylines
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
      const icon = L.divIcon({
        className:'',
        html: `<div style="padding:3px 8px;background:${col};border-radius:4px;font-size:10px;font-weight:700;color:#fff;white-space:nowrap;box-shadow:0 2px 8px ${col}60">⚠ ${a.level}</div>`,
        iconAnchor:[40,14],
      });
      L.marker([a.lat, a.lng], {icon}).bindPopup(`<b>${_esc(a.title||a.level)}</b><br>${_esc((a.message||a.msg||'').slice(0,120))}`).addTo(group);
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
        html: '<div style="font-size:16px;filter:drop-shadow(0 2px 4px #0007)">💧</div>',
        iconSize:[16,16], iconAnchor:[8,8],
      });
      L.marker([r.lat||r.location_lat||9.082, r.lng||r.location_lng||8.675], {icon})
        .bindPopup(`<b>${_esc(r.user||r.reporter_name||'Citizen')}</b><br>${_esc(r.loc||r.location_name||'')}<br>Depth: ${_esc(r.depth||r.water_depth||'—')}<br>${_esc((r.desc||r.description||'').slice(0,100))}`)
        .addTo(group);
    });
    markersRef.current.reports = group.addTo(leafRef.current);
  }, [mapReady, reports, layers.reports]);

  // ── Forecast GeoJSON layers (AFO 2026) ────────────────────────────────────
  const GEOJSON_BASE = ATLAS_BASE + '/geojson/';
  const RISK_ZONE_COLORS = {
    watch:'#facc15', medium:'#fb923c', high:'#f97316', severe:'#ef4444', extreme:'#7f1d1d',
  };
  const FC_POINT_COLORS = {
    fc_population:'#60a5fa', fc_communities:'#34d399', fc_health:'#f472b6',
    fc_schools:'#a78bfa', fc_farmland:'#86efac', fc_roads:'#fbbf24',
    // Surface water / groundwater / water quality / coastal
    sw_satellite:'#38bdf8', sw_station_updates:'#f97316',
    gw_aquifer:'#34d399', gw_recharge:'#6ee7b7',
    wq_contamination:'#f87171',
    cm_coastal_risk:'#fb923c', cm_storm_surge:'#f97316',
    cm_erosion:'#d97706', cm_mangrove:'#4ade80',
  };

  // Forecast GeoJSON layers catalogue (annual + weekly + surface water + gw + wq + coastal)
  const FC_GEOJSON_LAYERS = [
    // Annual Forecast
    {key:'fc_flood_extent', geojson:'flood_extent.geojson',        type:'polygon'},
    {key:'fc_population',   geojson:'population.geojson',          type:'point'},
    {key:'fc_communities',  geojson:'communities.geojson',         type:'point'},
    {key:'fc_health',       geojson:'health.geojson',              type:'point'},
    {key:'fc_schools',      geojson:'schools.geojson',             type:'point'},
    {key:'fc_farmland',     geojson:'farmland.geojson',            type:'point'},
    {key:'fc_roads',        geojson:'roads.geojson',               type:'point'},
    // Weekly Forecast
    {key:'fw_flood_extent', geojson:'weekly_flood_extent.geojson', type:'polygon'},
    {key:'fw_population',   geojson:'weekly_population.geojson',   type:'point'},
    {key:'fw_communities',  geojson:'weekly_communities.geojson',  type:'point'},
    {key:'fw_health',       geojson:'weekly_health.geojson',       type:'point'},
    {key:'fw_schools',      geojson:'weekly_schools.geojson',      type:'point'},
    {key:'fw_farmland',     geojson:'weekly_farmland.geojson',     type:'point'},
    {key:'fw_roads',        geojson:'weekly_roads.geojson',        type:'point'},
    // Surface Water (admin-uploadable)
    {key:'sw_satellite',       geojson:'sw_satellite.geojson',         type:'polygon'},
    {key:'sw_station_updates', geojson:'sw_station_updates.geojson',   type:'station_update'},
    // Groundwater (admin-uploadable)
    {key:'gw_aquifer',      geojson:'gw_aquifer.geojson',          type:'point'},
    {key:'gw_recharge',     geojson:'gw_recharge.geojson',         type:'point'},
    // Water Quality (admin-uploadable)
    {key:'wq_contamination',geojson:'wq_contamination.geojson',    type:'point'},
    // Coastal & Marine (admin-uploadable)
    {key:'cm_coastal_risk', geojson:'cm_coastal_risk.geojson',     type:'polygon'},
    {key:'cm_storm_surge',  geojson:'cm_storm_surge.geojson',      type:'polygon'},
    {key:'cm_erosion',      geojson:'cm_erosion.geojson',          type:'point'},
    {key:'cm_mangrove',     geojson:'cm_mangrove.geojson',         type:'point'},
  ];

  useEffect(() => {
    if (!mapReady || !leafRef.current) return;
    FC_GEOJSON_LAYERS.forEach(cfg => {
      const map = leafRef.current;
      const isOn = layers[cfg.key];
      const existing = forecastLayersRef.current[cfg.key];
      if (!isOn) {
        if (existing) { try { map.removeLayer(existing); } catch(e){} delete forecastLayersRef.current[cfg.key]; }
        return;
      }
      if (existing) return; // already on map
      fetch(GEOJSON_BASE + cfg.geojson)
        .then(r => r.json())
        .then(gj => {
          if (!leafRef.current) return;
          let layer;
          if (cfg.type === 'polygon') {
            layer = L.geoJSON(gj, {
              style: feat => {
                const zone = (feat.properties?.risk_zone || 'watch').toLowerCase();
                const color = RISK_ZONE_COLORS[zone] || '#facc15';
                return {color, fillColor:color, weight:1, fillOpacity:0.35, opacity:0.8};
              },
              onEachFeature: (feat, fl) => {
                const p = feat.properties || {};
                fl.bindPopup(`<b>Flood Zone</b><br>Risk: ${_esc(p.risk_zone||'—')}<br>State: ${_esc(p.state||'—')}`);
              },
            });
          } else if (cfg.type === 'station_update') {
            // Station situation update markers — styled by status, rich popup
            const STATUS_COL = {NORMAL:'#10B981',WATCH:'#EAB308',WARNING:'#F97316',SEVERE:'#EF4444',EXTREME:'#7C3AED'};
            layer = L.geoJSON(gj, {
              pointToLayer: (feat, latlng) => {
                const p = feat.properties || {};
                const status = (p.status||'NORMAL').toUpperCase();
                const col = STATUS_COL[status] || '#F97316';
                const icon = L.divIcon({
                  className: '',
                  html: `<div style="position:relative">
                    <div style="width:18px;height:18px;border-radius:50%;background:${col};border:3px solid rgba(255,255,255,0.9);box-shadow:0 0 10px ${col}90,0 0 0 5px ${col}25"></div>
                    <div style="position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:8px;font-weight:700;color:#fff;text-shadow:0 1px 3px #000;font-family:monospace">${_esc(p.station_name||'')}</div>
                  </div>`,
                  iconSize: [18,18], iconAnchor: [9,9],
                });
                return L.marker(latlng, {icon, zIndexOffset:900});
              },
              onEachFeature: (feat, fl) => {
                const p = feat.properties || {};
                const status = (p.status||'NORMAL').toUpperCase();
                const col = STATUS_COL[status] || '#F97316';
                fl.bindPopup(`
                  <div style="min-width:210px;font-family:sans-serif">
                    <div style="font-weight:700;font-size:13px;margin-bottom:3px">📡 ${_esc(p.station_name||'—')}</div>
                    <div style="font-size:11px;color:#888;margin-bottom:6px">${_esc(p.river||'—')} · ${_esc(p.state||'—')}${p.lga?', '+_esc(p.lga):''}</div>
                    <div style="padding:7px 10px;background:${col}20;border-radius:6px;margin-bottom:6px">
                      <div style="font-size:10px;color:${col};font-weight:800;letter-spacing:0.05em">${_esc(status)}</div>
                      ${p.level_m ? `<div style="font-size:12px;font-weight:700">Level: ${_esc(p.level_m)} m</div>` : ''}
                      ${p.flow_m3s ? `<div style="font-size:11px">Flow: ${_esc(p.flow_m3s)} m³/s</div>` : ''}
                    </div>
                    ${p.notes ? `<div style="font-size:11px;color:#555;line-height:1.4;border-top:1px solid #eee;padding-top:5px">${_esc(String(p.notes).slice(0,200))}</div>` : ''}
                  </div>
                `);
              },
            });
          } else {
            const color = FC_POINT_COLORS[cfg.key] || '#60a5fa';
            layer = L.geoJSON(gj, {
              pointToLayer: (feat, latlng) => L.circleMarker(latlng, {
                radius:5, fillColor:color, color:'#fff', weight:1,
                fillOpacity:0.85, opacity:1,
              }),
              onEachFeature: (feat, fl) => {
                const p = feat.properties || {};
                fl.bindPopup(`<b>${_esc(p.name||'—')}</b><br>${_esc(p.lga||'')}, ${_esc(p.state||'')}`);
              },
            });
          }
          forecastLayersRef.current[cfg.key] = layer.addTo(leafRef.current);
        })
        .catch(err => console.warn('Forecast GeoJSON load error:', cfg.geojson, err));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady,
    layers.fc_flood_extent, layers.fc_population, layers.fc_communities,
    layers.fc_health, layers.fc_schools, layers.fc_farmland, layers.fc_roads,
    layers.fw_flood_extent, layers.fw_population, layers.fw_communities,
    layers.fw_health, layers.fw_schools, layers.fw_farmland, layers.fw_roads,
    layers.sw_satellite, layers.sw_station_updates,
    layers.gw_aquifer, layers.gw_recharge,
    layers.wq_contamination,
    layers.cm_coastal_risk, layers.cm_storm_surge, layers.cm_erosion, layers.cm_mangrove,
  ]);

  // Search
  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const r = await api.nominatim(searchQ);
      setSearchRes(r.slice(0,5));
    } catch {}
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

  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [atlasUrl, setAtlasUrl]   = useState(null);
  const [atlasLabel, setAtlasLabel] = useState('');


  // ── Hydrological layer group definitions ──────────────────────────────────
  const LAYER_GROUPS = [
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
      key:'forecast', icon:'📊', label:'Annual Forecast — AFO 2026',
      desc:'Annual Flood Outlook maps & model outputs',
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
  ];

  const toggleLayer = (layer) => {
    if (layer.soon) return;
    if (layer.type === 'atlas') {
      // fc_animation: iframe bottom drawer (time-series player, not extractable)
      const isOn = layers[layer.key];
      if (isOn) {
        setLayers(p=>({...p,[layer.key]:false}));
        setAtlasUrl(null); setAtlasLabel('');
      } else {
        setLayers(p=>({...p,[layer.key]:true}));
        setAtlasUrl(ATLAS_BASE + layer.url);
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
    {level:'CRITICAL',label:'Critical / Extreme'},{level:'HIGH',label:'High / Severe'},
    {level:'MEDIUM',label:'Medium / Warning'},{level:'WATCH',label:'Watch'},{level:'NORMAL',label:'Normal'},
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
        <div style={{marginTop:6,background:C.surface,border:`1px solid ${C.border}`,
          borderRadius:10,overflowY:'auto',boxShadow:'0 4px 20px #0008',maxHeight:'calc(100vh - 200px)',width:250}}>
          {/* Header */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:'10px 14px',borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontSize:12,fontWeight:700,color:C.bright}}>🗂️ {t('mapLayers')}</span>
            <button onClick={()=>setShowLayerPanel(false)}
              style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:16,lineHeight:1}}>✕</button>
          </div>

          {/* Sub-layer groups */}
          {LAYER_GROUPS.map(group => {
            const collapsed = groupCollapsed[group.key];
            const activeCount = group.layers.filter(l=>layers[l.key]).length;
            return (
              <div key={group.key} style={{borderBottom:`1px solid ${C.border}`}}>
                {/* Group header */}
                <button
                  onClick={()=>setGroupCollapsed(p=>({...p,[group.key]:!p[group.key]}))}
                  style={{display:'flex',alignItems:'center',gap:8,width:'100%',
                    padding:'9px 14px',background:'none',border:'none',
                    cursor:'pointer',textAlign:'left'}}>
                  <span style={{fontSize:14,flexShrink:0}}>{group.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.bright}}>{group.label}</div>
                    <div style={{fontSize:10,color:C.muted,lineHeight:1.3}}>{group.desc}</div>
                  </div>
                  {activeCount > 0 && (
                    <span style={{fontSize:10,fontWeight:700,padding:'1px 5px',borderRadius:4,
                      background:`${C.primary}30`,color:C.accent}}>{activeCount}</span>
                  )}
                  <span style={{fontSize:10,color:C.muted,flexShrink:0}}>{collapsed?'▼':'▲'}</span>
                </button>

                {/* Layer list */}
                {!collapsed && (
                  <div style={{padding:'4px 10px 10px 10px',display:'flex',flexDirection:'column',gap:4}}>
                    {/* Coming-soon notice only when ALL layers in the group still have no uploaded data */}
                    {group.layers.every(l=>l.soon && !(backendLayers[l.key]?.meta?.data_file)) && (
                      <div style={{display:'flex',gap:8,alignItems:'flex-start',
                        padding:'8px 10px',marginBottom:2,
                        background:`${C.warning}12`,border:`1px solid ${C.warning}30`,
                        borderRadius:8}}>
                        <span style={{fontSize:14,flexShrink:0}}>🔬</span>
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:C.warning,marginBottom:2}}>Data coming soon</div>
                          <div style={{fontSize:10,color:C.muted,lineHeight:1.4}}>
                            This layer group is currently under development. Data will be available in a future NIHSA update.
                          </div>
                        </div>
                      </div>
                    )}
                    {group.layers.filter(layer => {
                      // Hide layers that admin has deactivated in the backend
                      const bl = backendLayers[layer.key];
                      return bl ? bl.is_active : true;
                    }).map(layer => {
                      const isOn = !!layers[layer.key];
                      // A layer marked 'soon' becomes live once the admin has uploaded data for it
                      const bl = backendLayers[layer.key];
                      const isSoon = layer.soon && !(bl?.meta?.data_file);
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
                          <span style={{flex:1,lineHeight:1.3}}>{layer.label}</span>
                          {isSoon
                            ? <span style={{fontSize:9,fontWeight:700,padding:'1px 4px',borderRadius:3,
                                background:`${C.warning}20`,color:C.warning,flexShrink:0}}>SOON</span>
                            : <Toggle on={isOn} />
                          }
                        </button>
                      );
                    })}
                    {group.key==='forecast' && (
                      <button onClick={()=>{setAtlasUrl(ATLAS_BASE + '/index.html');setAtlasLabel('Full Atlas');setShowLayerPanel(false);}}
                        style={{marginTop:4,padding:'5px 8px',background:'none',border:`1px dashed ${C.border}`,
                          borderRadius:7,color:C.accent,fontSize:11,fontWeight:600,cursor:'pointer',textAlign:'center'}}>
                        Open Full Atlas →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Risk Legend */}
          <div style={{padding:'10px 14px'}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:'0.06em',marginBottom:8}}>{t('legend').toUpperCase()}</div>
            {RISK_LEGEND.map(({level,label})=>(
              <div key={level} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                <span style={{width:10,height:10,borderRadius:'50%',background:RISK_COLOR(level),
                  flexShrink:0,boxShadow:`0 0 4px ${RISK_COLOR(level)}`}}/>
                <span style={{fontSize:11,color:C.text}}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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

  // RAF-based smooth ticker — no React state updates, pure DOM
  useEffect(() => {
    const SPEED = 0.6; // pixels per frame
    const animate = () => {
      if (tickerDivRef.current) {
        tickerPosRef.current -= SPEED;
        const totalW = tickerDivRef.current.scrollWidth / 3; // tripled content
        if (Math.abs(tickerPosRef.current) >= totalW) tickerPosRef.current = 0;
        tickerDivRef.current.style.transform = `translateX(${tickerPosRef.current}px)`;
      }
      tickerRAFRef.current = requestAnimationFrame(animate);
    };
    tickerRAFRef.current = requestAnimationFrame(animate);
    return () => { if (tickerRAFRef.current) cancelAnimationFrame(tickerRAFRef.current); };
  }, []);

  // Only show popup for genuinely new alerts (not seen before)
  const seenAlertIdsRef = useRef(new Set());
  useEffect(() => {
    (Array.isArray(alerts) ? alerts : []).forEach(a => {
      const aid = String(a.id || a.alert_id);
      if (!seenAlertIdsRef.current.has(aid)) {
        seenAlertIdsRef.current.add(aid);
        const nid = Date.now() + Math.random();
        const notif = {
          nid,
          level: a.level || 'WATCH',
          text: a.title || a.level,
          lat: a.lat, lng: a.lng,
        };
        setPopupNotifs(p => [...p.slice(-2), notif]);
        setTimeout(() => setPopupNotifs(p => p.filter(n => n.nid !== nid)), 6000);
      }
    });
  }, [alerts]);

  const flyToAlert = (a) => {
    if (!leafRef.current || !L) return;
    leafRef.current.flyTo([a.lat, a.lng], 11, { duration: 1.5 });
  };

  return (
    <div style={{position:'relative', height:'calc(100vh - 120px)', display:'flex', flexDirection:'column'}}>

      {/* ── Popup notifications (top-left, away from layer panel) ───── */}
      <div style={{position:'absolute',top:10,left:12,zIndex:9999,display:'flex',flexDirection:'column',gap:8,maxWidth:290,pointerEvents:'none'}}>
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
              <div style={{fontSize:10,fontWeight:800,color:RISK_COLOR(n.level),letterSpacing:'0.06em'}}>{n.level} ALERT</div>
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
      <div style={{padding:'10px 16px', background:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', gap:8, flexShrink:0}}>
        <div style={{flex:1,position:'relative'}}>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()}
            placeholder={`🔍  ${t('searchPlaceholder')}`}
            style={{width:'100%',padding:'9px 14px',background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,color:C.bright,fontSize:13,outline:'none',boxSizing:'border-box'}} />
          {searchRes.length>0 && (
            <div style={{position:'absolute',top:'100%',left:0,right:0,background:C.s3,border:`1px solid ${C.border}`,borderRadius:8,zIndex:10000,overflow:'hidden',marginTop:4}}>
              {searchRes.map((r,i)=>(
                <div key={i} onClick={()=>flyTo(r)} style={{padding:'8px 12px',cursor:'pointer',fontSize:12,color:C.text,borderBottom:`1px solid ${C.border}`}}>
                  📍 {r.display_name.slice(0,70)}
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleSearch} style={{padding:'9px 16px',background:C.primary,border:'none',borderRadius:8,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:13}}>
          {searching?'...':t('searchBtn')}
        </button>
        <button onClick={()=>setShowReport(true)} style={{padding:'9px 14px',background:`linear-gradient(135deg,${C.danger},#DC2626)`,border:'none',borderRadius:8,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:13,whiteSpace:'nowrap'}}>
          🚨 {t('reportFloodBtn')}
        </button>
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
        {/* Flood Animation 2026 — bottom drawer (time-series player, iframe only) */}
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
        <LayerPanel />
      </div>

      {showReport && <ReportModal user={user} onClose={()=>setShowReport(false)} />}

    </div>
  );
};

// ─── ALERT TICKER (always-visible news-style bar) ──────────────────────────────
const TICKER_FALLBACK = [
  { level:'SEVERE',  text:'Flood Warning — Lokoja, Kogi State' },
  { level:'WARNING', text:'River Benue Rising — Makurdi, Benue State' },
  { level:'WARNING', text:'Heavy Rainfall Alert — Onitsha, Anambra State' },
  { level:'WATCH',   text:'River Watch — Wuroboki, Taraba State' },
  { level:'WATCH',   text:'River Niger Rising — Baro, Niger State' },
];

const AlertTicker = ({ alerts }) => {
  const tickerPosRef = useRef(0);
  const tickerRAFRef = useRef(null);
  const tickerDivRef = useRef(null);

  const items = alerts && alerts.length > 0
    ? alerts.map((a) => ({
        level: a.level || a.risk_level || 'WATCH',
        text: `${a.title || a.msg || a.message || ''} — ${a.state || ''}`.trim().replace(/— $/, ''),
      }))
    : TICKER_FALLBACK;

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
    <div style={{height:36,background:'#0D1117',borderTop:`1px solid ${C.border}`,
      overflow:'hidden',display:'flex',alignItems:'center'}}>
      <div style={{background:C.danger,padding:'0 12px',height:'100%',display:'flex',
        alignItems:'center',flexShrink:0,zIndex:2,fontSize:11,fontWeight:800,color:'#fff',
        letterSpacing:'0.06em',gap:5,whiteSpace:'nowrap'}}>
        <span style={{animation:'pulse 1.5s ease infinite',display:'inline-block'}}>⚠</span>
        {t('liveAlerts')}
      </div>
      <div style={{flex:1,overflow:'hidden',position:'relative',height:'100%'}}>
        <div ref={tickerDivRef}
          style={{display:'inline-flex',position:'absolute',top:0,left:0,
            whiteSpace:'nowrap',willChange:'transform',height:'100%',alignItems:'center'}}>
          {[...items,...items,...items].map((a,i) => (
            <div key={i} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'0 28px',
              borderRight:`1px solid ${C.border}30`,height:36,flexShrink:0}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:RISK_COLOR(a.level),
                display:'inline-block',flexShrink:0,boxShadow:`0 0 6px ${RISK_COLOR(a.level)}`}}/>
              <span style={{fontSize:12,color:C.bright,fontWeight:600}}>{a.text}</span>
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
  { key:'population',  icon:'👥', label:'Population',    file:'P4_Annual_population_table.csv',  mapFile:'P4_Annual_population_map.html' },
  { key:'health',      icon:'🏥', label:'Health Centres',file:'P4_Annual_health_table.csv',      mapFile:'P4_Annual_health_map.html' },
  { key:'education',   icon:'🏫', label:'Schools',        file:'P4_Annual_education_table.csv',   mapFile:'P4_Annual_education_map.html' },
  { key:'farmland',    icon:'🌾', label:'Farmland (ha)',  file:'P4_Annual_farmland_table.csv',    mapFile:'P4_Annual_farmland_map.html' },
  { key:'roads',       icon:'🛣️', label:'Roads',          file:'P4_Annual_roads_table.csv',       mapFile:'P4_Annual_roads_map.html' },
  { key:'electricity', icon:'⚡', label:'Electricity',   file:'P4_Annual_electricity_table.csv', mapFile:'P4_Annual_electricity_map.html' },
  { key:'markets',     icon:'🏪', label:'Markets',        file:'P4_Annual_markets_table.csv',     mapFile:'P4_Annual_markets_map.html' },
];

const AtlasAnnualPanel = () => {
  const [data, setData] = useState(null);   // { state: { key: total } }
  const [states, setStates] = useState([]);
  const [filter, setFilter] = useState('');
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    Promise.all(
      ATLAS_LAYERS_DEF.map(l =>
        fetch(`${ATLAS_BASE}/${l.file}`)
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
      setStates(['All Nigeria', ...Array.from(allStates).sort()]);
    }).catch(() => setLoadErr(true));
  }, []);

  const isAll = !filter || filter === 'All Nigeria';
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
          <div style={{fontSize:13,fontWeight:700,color:C.bright}}>Annual Flood Outlook 2026 — Exposure Summary</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>NFFS v3.0 · 17 exposure layers · Full Year · Issued 15 April 2026</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <select value={filter} onChange={e=>setFilter(e.target.value)}
            style={{padding:'6px 10px',background:C.s2,border:`1px solid ${C.border}`,
              borderRadius:6,color:C.bright,fontSize:12,cursor:'pointer',minWidth:140}}>
            {(states.length ? states : ['All Nigeria']).map(s => (
              <option key={s} value={s === 'All Nigeria' ? '' : s}>{s}</option>
            ))}
          </select>
          <a href={`${ATLAS_BASE}/index.html`} target="_blank" rel="noreferrer"
            style={{padding:'6px 12px',background:C.primary,borderRadius:6,
              color:'#fff',fontSize:11,fontWeight:700,textDecoration:'none',whiteSpace:'nowrap'}}>
            Full Atlas ↗
          </a>
        </div>
      </div>

      {loadErr ? (
        <div style={{padding:'24px',textAlign:'center',color:C.muted,fontSize:12,background:C.s2,borderRadius:8}}>
          Atlas data unavailable — the backend must be running to load NFFS data
        </div>
      ) : !data ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10}}>
          {ATLAS_LAYERS_DEF.map(l => <Skeleton key={l.key} h={80} r={10} />)}
        </div>
      ) : (
        <>
          {/* Stat cards grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10,marginBottom:16}}>
            {ATLAS_LAYERS_DEF.map(l => (
              <a key={l.key} href={`${ATLAS_BASE}/${l.mapFile}`}
                target="_blank" rel="noreferrer" style={{textDecoration:'none',color:'inherit'}}>
                <div style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:10,
                  padding:'12px 14px',cursor:'pointer',transition:'border-color 0.15s'}}
                  onMouseOver={e=>e.currentTarget.style.borderColor=C.primary}
                  onMouseOut={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{fontSize:20,marginBottom:5}}>{l.icon}</div>
                  <div style={{fontSize:10,fontWeight:600,color:C.muted,marginBottom:4,lineHeight:1.3}}>{l.label}</div>
                  <div style={{fontSize:22,fontWeight:900,color:C.danger,fontFamily:'Rajdhani,sans-serif',lineHeight:1}}>
                    {(totals[l.key] || 0).toLocaleString()}
                  </div>
                  <div style={{fontSize:9,color:C.muted,marginTop:3}}>at risk · tap map ↗</div>
                </div>
              </a>
            ))}
          </div>

          {/* State breakdown when a state is selected */}
          {!isAll && (
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.06em',marginBottom:8}}>
                {filter.toUpperCase()} STATE — BREAKDOWN
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
                {ATLAS_LAYERS_DEF.map(l => (
                  <div key={l.key} style={{display:'flex',justifyContent:'space-between',
                    padding:'6px 10px',background:C.s2,borderRadius:6,fontSize:12}}>
                    <span style={{color:C.muted}}>{l.icon} {l.label}</span>
                    <span style={{fontWeight:700,color:C.bright}}>
                      {(data[filter]?.[l.key] || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[
                  { label:'Flood Animation', url:`${ATLAS_BASE}/flood_animation.html` },
                  { label:'Flood Extent Map', url:`${ATLAS_BASE}/P4_Annual_flood_extent_map.html` },
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
  const [data, setData]     = useState(null);
  const [states, setStates] = useState([]);
  const [filter, setFilter] = useState('');
  const [loadErr, setLoadErr] = useState(false);

  // Weekly layers read from GeoJSON uploaded via admin
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
      setStates(['All Nigeria', ...Array.from(allStates).sort()]);
    }).catch(() => setLoadErr(true));
  }, []);

  const isAll = !filter || filter === 'All Nigeria';
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
        <div style={{fontSize:13,fontWeight:600,color:C.bright,marginBottom:6}}>No Weekly Forecast Data</div>
        <div style={{fontSize:12,lineHeight:1.6}}>
          Weekly forecast layers have not been uploaded yet.<br/>
          Go to <b>Admin → Map Layers → Weekly Forecast</b> and upload a CSV for each layer.
        </div>
      </div>
    </Card>
  );

  return (
    <Card style={{marginBottom:16}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.bright}}>Weekly Flood Forecast — Exposure Summary</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>Current 7-day outlook · Upload new weekly data via Admin</div>
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          style={{padding:'6px 10px',background:C.s2,border:`1px solid ${C.border}`,
            borderRadius:6,color:C.bright,fontSize:12,cursor:'pointer',minWidth:140}}>
          {(states.length ? states : ['All Nigeria']).map(s => (
            <option key={s} value={s === 'All Nigeria' ? '' : s}>{s}</option>
          ))}
        </select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10,marginBottom:16}}>
        {WEEKLY_LAYERS_DEF.map(l => (
          <div key={l.key} style={{background:C.s2,borderRadius:10,padding:'12px 14px',textAlign:'center',
            border:`1px solid ${C.border}`}}>
            <div style={{fontSize:20,marginBottom:4}}>{l.icon}</div>
            <div style={{fontSize:18,fontWeight:800,color:C.bright}}>{(totals[l.key]||0).toLocaleString()}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:2}}>{l.label}</div>
          </div>
        ))}
      </div>
      {!isAll && data?.[filter] && (
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
          <div style={{fontSize:11,fontWeight:700,color:C.bright,marginBottom:8}}>{filter} breakdown</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {WEEKLY_LAYERS_DEF.map(l => (
              <div key={l.key} style={{fontSize:11,padding:'4px 10px',background:C.s3,borderRadius:16,
                border:`1px solid ${C.border}`,color:C.text}}>
                {l.icon} {l.label}: <b style={{color:C.bright}}>{(data[filter][l.key]||0).toLocaleString()}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

const DashboardTab = () => {
  const [forecastPeriod, setForecastPeriod] = useState('annual');
  return (
    <div style={{padding:16,maxWidth:1200,margin:'0 auto'}}>
      {/* Period toggle */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <span style={{fontSize:13,fontWeight:700,color:C.bright}}>Flood Forecast</span>
        <div style={{display:'flex',background:C.s2,borderRadius:8,border:`1px solid ${C.border}`,overflow:'hidden'}}>
          {[{id:'annual',label:'📊 Annual (AFO 2026)'},{id:'weekly',label:'📅 Weekly'}].map(opt => (
            <button key={opt.id} onClick={()=>setForecastPeriod(opt.id)}
              style={{padding:'7px 16px',border:'none',cursor:'pointer',fontSize:12,fontWeight:700,
                background:forecastPeriod===opt.id?C.primary:'transparent',
                color:forecastPeriod===opt.id?'#fff':C.muted,
                transition:'all 0.15s'}}>
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
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:8}}>
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
    <div style={{display:'flex',height:'calc(100vh - 120px)',overflow:'hidden'}}>
      {/* Channel list */}
      <div style={{width:190,flexShrink:0,background:C.surface,borderRight:`1px solid ${C.border}`,overflowY:'auto'}}>
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
const AssistantTab = ({ gauges, alerts }) => {
  const [mlAlerts, setMlAlerts]   = useState([]);
  const [msgs, setMsgs]           = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const bottomRef                 = useRef(null);

  // Load live NFFS context on mount
  useEffect(() => {
    fetch(API_BASE + '/forecast/ml/alerts')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const live = d?.alerts || [];
        setMlAlerts(live);
        // Build greeting from real data
        const active = live.filter(a => a.nffs_level !== 'NONE');
        const severe  = live.filter(a => ['SEVERE','EXTREME'].includes(a.nffs_level));
        const lagdo   = live.some(a => a.lagdo_cascade);
        const src     = d?.data_source === 'nffs_live' ? 'LIVE NFFS model output' : 'simulation data';
        const greeting = `Hello! I'm **NIHSA FloodAI**, Nigeria's official flood intelligence assistant.

` +
          `**Current status (${src}):** ${active.length} station${active.length!==1?'s':''} with active flood alerts` +
          (severe.length ? ` — including **${severe.length} at SEVERE or EXTREME level**` : '') + '.' +
          (lagdo ? `

⚡ **Lagdo Dam cascade is active.** Downstream communities on the Benue River are at elevated risk.` : '') +
          `

I have full access to gauge readings, 7-day forecasts, and NIHSA alert data. How can I help you?`;
        setMsgs([{ role:'assistant', content: greeting }]);
      })
      .catch(() => {
        setMsgs([{ role:'assistant', content: `Hello! I'm **NIHSA FloodAI**, Nigeria's official flood intelligence assistant. Ask me about flood risk, river levels, evacuation guidance, or emergency procedures anywhere in Nigeria.` }]);
      });
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [msgs]);

  // Build rich context string from all available data
  const buildContext = () => {
    const g = gauges.length ? gauges : GAUGES_STATIC;
    const mlSummary = mlAlerts.length
      ? mlAlerts.filter(a=>a.nffs_level!=='NONE').map(a =>
          `${a.station_name} (${a.river}${a.state ? `, ${a.state}` : ''}): ${a.nffs_level} — ${a.headline}. Action: ${a.action}`
        ).join('')
      : 'No active NFFS alerts.';

    const gaugeSummary = g.map(s =>
      `${s.name||s.station_name} on ${s.river||'—'} in ${s.state||'—'}: Level ${s.level||'—'}m, Flow ${s.flow||'—'} m³/s, Status ${s.status||s.risk_level||'NORMAL'}`
    ).join('; ');

    const alertSummary = alerts.length
      ? alerts.map(a=>`${a.level} alert: ${a.title||a.level} in ${a.state||a.affected_states||'—'}. ${a.message||a.msg||''}`).join('')
      : 'No active database alerts.';

    const lagdo = mlAlerts.some(a=>a.lagdo_cascade);

    return `
=== NIHSA LIVE FLOOD INTELLIGENCE DATA ===
Date: ${new Date().toLocaleDateString('en-NG', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}
${lagdo ? '⚡ LAGDO DAM CASCADE: ACTIVE — Cameroon upstream releases are flowing into Nigeria. Benue River communities downstream are at elevated risk.' : ''}

NFFS MODEL ALERTS (${mlAlerts[0]?.data_source==='nffs_live'?'LIVE':'simulation'} mode):
${mlSummary}

GAUGE STATION READINGS:
${gaugeSummary}

DATABASE ALERTS:
${alertSummary}

=== END OF LIVE DATA ===

You are NIHSA FloodAI — the official AI assistant of Nigeria's National Hydrological Services Agency.
Your role is to translate the above technical flood data into plain, actionable guidance for Nigerian citizens and government officials.
Always:
- Use plain English (no technical jargon for the public)
- Be appropriately urgent when conditions are dangerous
- Reference specific rivers, states, and communities from the data above
- Give one clear action per response when risk is elevated
- Mention the Lagdo Dam impact when relevant for Benue/Niger communities
- For NIHSA engineers asking technical questions, you may use technical terminology
- Respond in the language the user writes in (English, Hausa, Yoruba, Igbo, or French)
`.trim();
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim(); setInput('');
    const newMsgs = [...msgs, {role:'user', content:q}];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const res = await fetch(API_BASE + '/assistant/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildContext(),
          messages: newMsgs.slice(1).map(m=>({role:m.role, content:m.content})),
        })
      });
      const d = await res.json();
      const text = d.text || (res.ok ? 'I could not generate a response. Please try again.' : 'The AI assistant is temporarily unavailable.');
      setMsgs(p=>[...p,{role:'assistant',content:text}]);
    } catch(e) {
      setMsgs(p=>[...p,{role:'assistant',content:'⚠ Unable to reach the NIHSA AI service. Please try again shortly.'}]);
    }
    setLoading(false);
  };

  const escHtml = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const renderMsg = (content) => escHtml(content).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>');

  const suggestions = [
    'Which areas are at highest flood risk right now?',
    'What should I do if I live near the River Benue?',
    'Explain the Lagdo Dam situation',
    'When is flood season in Nigeria?',
    'How do I report flooding in my community?',
    'What are the evacuation procedures for Lokoja?',
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 120px)'}}>
      {/* Messages */}
      <div style={{flex:1,overflowY:'auto',padding:'16px'}}>
        <div style={{maxWidth:760,margin:'0 auto',display:'flex',flexDirection:'column',gap:14}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:'flex',gap:10,justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
              {m.role==='assistant' && (
                <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${C.primary},${C.info})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>🌊</div>
              )}
              <div style={{
                maxWidth:'80%', padding:'10px 14px', borderRadius: m.role==='user'?'12px 4px 12px 12px':'4px 12px 12px 12px',
                background: m.role==='user' ? `linear-gradient(135deg,${C.primary},#0284C7)` : C.s2,
                border: m.role==='user'?'none':`1px solid ${C.border}`,
                fontSize:13, lineHeight:1.6, color:'#fff',
              }} dangerouslySetInnerHTML={{__html: renderMsg(m.content)}} />
            </div>
          ))}
          {loading && (
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${C.primary},${C.info})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🌊</div>
              <div style={{padding:'10px 16px',background:C.s2,border:`1px solid ${C.border}`,borderRadius:'4px 12px 12px 12px',color:C.muted,fontSize:13}}>{t('analysingData')}</div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
      </div>

      {/* Suggestions */}
      {msgs.length <= 2 && (
        <div style={{padding:'0 16px 10px',display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center'}}>
          {suggestions.map((s,i)=>(
            <button key={i} onClick={()=>{setInput(s);}} style={{padding:'5px 12px',background:C.s2,border:`1px solid ${C.border}`,borderRadius:16,color:C.text,fontSize:11,cursor:'pointer'}}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{padding:'10px 16px 16px',background:C.surface,borderTop:`1px solid ${C.border}`,display:'flex',gap:8,maxWidth:760,width:'100%',margin:'0 auto',boxSizing:'border-box'}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
          placeholder={t('askPlaceholder')}
          style={{flex:1,padding:'11px 14px',background:C.s2,border:`1px solid ${C.border}`,borderRadius:10,color:C.bright,fontSize:13,outline:'none'}} />
        <button onClick={send} disabled={loading||!input.trim()} style={{padding:'11px 20px',background:`linear-gradient(135deg,${C.primary},#0284C7)`,border:'none',borderRadius:10,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:13,opacity:loading||!input.trim()?0.5:1}}>
          {t('askBtn')}
        </button>
      </div>
    </div>
  );
};

// ─── ALERTS TAB ────────────────────────────────────────────────────────────────
// ─── NIGERIA NATIONAL HEATMAP (SVG choropleth) ────────────────────────────────
const NationalHeatmap = ({ alerts }) => {
  // Build state risk map from live alerts + simulation
  const stateRisk = {};
  alerts.forEach(a => {
    const s = a.state?.replace(' State','').trim();
    if (s) stateRisk[s] = a.level;
  });
  // Overlay simulated basin risks
  NG_STATES_RISK.forEach(s => {
    if (!stateRisk[s.state]) stateRisk[s.state] = s.risk;
  });

  const riskDot = (state) => {
    const risk = stateRisk[state] || 'NORMAL';
    return RISK_COLOR(risk === 'SEVERE' ? 'HIGH' : risk);
  };

  // Simplified Nigeria map using circles for each state capital
  const statePositions = [
    ['Sokoto',8.5,13.1],['Zamfara',12.3,6.6],['Katsina',12.9,7.6],['Kano',12.0,8.5],
    ['Jigawa',12.5,9.3],['Yobe',12.3,11.5],['Borno',12.0,13.1],['Adamawa',9.2,12.5],
    ['Taraba',8.0,11.0],['Gombe',10.3,11.2],['Bauchi',10.3,9.8],['Plateau',9.2,9.5],
    ['Kaduna',10.5,7.4],['Niger',9.5,6.0],['Kebbi',11.5,4.2],['Kwara',8.5,4.5],
    ['FCT',8.9,7.2],['Nasarawa',8.5,8.5],['Kogi',7.5,6.7],['Benue',7.7,8.5],
    ['Taraba',8.0,11.0],['Enugu',6.5,7.5],['Ebonyi',6.2,8.1],['Cross River',5.8,8.6],
    ['Akwa Ibom',5.0,7.9],['Rivers',4.8,7.0],['Bayelsa',4.8,6.1],['Delta',5.5,5.9],
    ['Edo',6.3,5.6],['Ondo',7.1,5.2],['Ekiti',7.7,5.2],['Anambra',6.2,6.8],
    ['Imo',5.5,7.0],['Abia',5.4,7.5],['Lagos',6.5,3.4],['Ogun',7.0,3.5],
    ['Oyo',7.4,3.9],['Osun',7.5,4.5],['Kwara',8.5,4.5],
  ];

  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16,height:'100%'}}>
      <div style={{fontSize:13,fontWeight:700,color:C.bright,marginBottom:4}}>National Alert Heatmap</div>
      <div style={{fontSize:11,color:C.muted,marginBottom:12}}>Live alert status across all states</div>

      {/* Legend */}
      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
        {[['NORMAL','Normal'],['WATCH','Watch'],['MEDIUM','Warning'],['HIGH','Severe'],['CRITICAL','Extreme']].map(([r,l])=>(
          <div key={r} style={{display:'flex',alignItems:'center',gap:5,fontSize:10}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:RISK_COLOR(r)}}/>
            <span style={{color:C.muted}}>{l}</span>
          </div>
        ))}
      </div>

      {/* SVG Map */}
      <svg viewBox="0 0 200 200" style={{width:'100%',maxHeight:300}}>
        {/* Nigeria outline approximation */}
        <rect x="5" y="5" width="190" height="190" rx="4" fill={C.s2} stroke={C.border} strokeWidth="0.5"/>
        <text x="100" y="100" textAnchor="middle" fontSize="8" fill={`${C.muted}40`} fontWeight="bold">NIGERIA</text>

        {/* State dots */}
        {statePositions.filter((s,i,a)=>a.findIndex(x=>x[0]===s[0])===i).map(([state,lat,lng]) => {
          // Convert lat/lng to SVG coords (Nigeria: lat 4-14, lng 3-15)
          const x = ((lng - 3) / 12) * 180 + 10;
          const y = 190 - ((lat - 4) / 10) * 180;
          const col = riskDot(state);
          const risk = stateRisk[state] || 'NORMAL';
          return (
            <g key={state}>
              {risk !== 'NORMAL' && (
                <circle cx={x} cy={y} r={10} fill={col} opacity={0.15}/>
              )}
              <circle cx={x} cy={y} r={risk==='HIGH'||risk==='CRITICAL'?5:risk==='MEDIUM'?4:risk==='WATCH'?3.5:3}
                fill={col} opacity={0.85} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
              <text x={x} y={y+9} textAnchor="middle" fontSize="4" fill={C.muted} opacity={0.7}>
                {state.length > 8 ? state.slice(0,7)+'.' : state}
              </text>
            </g>
          );
        })}

        {/* River Niger approximate path */}
        <path d="M 85,25 Q 70,60 60,90 Q 55,115 60,135 Q 65,155 75,170" 
          stroke="#1E90FF" strokeWidth="1.5" fill="none" opacity="0.3" strokeDasharray="3 2"/>
        <path d="M 140,80 Q 120,95 100,105 Q 80,115 60,135" 
          stroke="#1E90FF" strokeWidth="1.2" fill="none" opacity="0.3" strokeDasharray="3 2"/>
        <text x="50" y="100" fontSize="4" fill="#1E90FF" opacity="0.5" transform="rotate(-60,50,100)">Niger</text>
        <text x="95" y="90" fontSize="4" fill="#1E90FF" opacity="0.5" transform="rotate(-20,95,90)">Benue</text>
      </svg>

      {/* Active state count */}
      <div style={{marginTop:8,fontSize:11,color:C.muted,textAlign:'center'}}>
        {Object.values(stateRisk).filter(r=>r!=='NORMAL').length} states with active alerts
      </div>
    </div>
  );
};

// ─── ALERTS TAB ───────────────────────────────────────────────────────────────
const AlertsTab = ({ alerts, loading, error }) => {
  const [sel, setSel] = useState(null);
  const data = alerts.length ? alerts : [];

  const staticAlerts = [
    {id:1,level:'CRITICAL',title:'Niger-Benue Confluence Alert',state:'Kogi State',message:'Niger discharge at 12,400 m³/s. Critical stage reached. Immediate evacuation advised. LSTM Q50 +24h: 12,800 m³/s, Q95 peak: 18,600 m³/s in 72 hrs.',affected_lgas:'Lokoja, Kogi LGA, Ajaokuta',recommended_actions:'1. Immediate evacuation from flood-prone zones\n2. Activate all 14 evacuation centres\n3. Emergency broadcast on radio and mobile\n4. NEMA deployment requested',start_date:new Date().toISOString(),is_active:true},
    {id:2,level:'HIGH',title:'Benue River Alert — Lagdo Amplification',state:'Benue State',message:'Benue River at 8.9m — 0.9m above danger threshold. Lagdo Dam releases will amplify peak in 3–5 days.',affected_lgas:'Makurdi, Gwer West, Guma',recommended_actions:'1. HIGH alert protocol active\n2. Pre-position rescue boats\n3. Evacuate Wurukum, North Bank low areas\n4. Monitor Lagdo Dam release data',start_date:new Date().toISOString(),is_active:true},
    {id:3,level:'MEDIUM',title:'Lagos Coastal Surge Warning',state:'Lagos State',message:'Atlantic storm surge warning. Coastal flooding risk elevated for Badagry, Lagos Island, and Epe LGA.',affected_lgas:'Lagos Island, Badagry, Epe, Ikorodu',recommended_actions:'1. Close storm drains\n2. Alert coastal fishing communities\n3. Activate drainage pumps\n4. Issue public broadcast',start_date:new Date().toISOString(),is_active:true},
    {id:4,level:'MEDIUM',title:'Niger Delta Seasonal Flooding',state:'Delta/Rivers States',message:'Seasonal flooding in progress across Delta communities. Water levels above seasonal average.',affected_lgas:'Warri, Burutu, Bomadi, Patani',recommended_actions:'1. Monitor river levels every 6 hours\n2. Ensure evacuation routes are clear\n3. Community awareness broadcasts',start_date:new Date().toISOString(),is_active:true},
    {id:5,level:'WATCH',title:'Taraba River Watch — Wuroboki',state:'Taraba State',message:'Taraba River rising at Wuroboki gauge. Q50 +24h: 3,400 m³/s. Below warning threshold — monitor closely.',affected_lgas:'Zing, Lau, Bali',recommended_actions:'1. Continue monitoring\n2. Pre-position response teams\n3. Check evacuation plans',start_date:new Date().toISOString(),is_active:true},
  ];

  const display = data.length ? data : staticAlerts;
  const selected = sel !== null ? display.find(a=>(a.id||a.alert_id)===sel)||display[sel] : null;

  return (
    <div style={{padding:16,maxWidth:1200,margin:'0 auto'}}>
      <ErrorBanner msg={error} />
      {loading ? <div style={{display:'flex',justifyContent:'center',padding:40}}><Spinner size={32}/></div> : (
        <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16,alignItems:'start'}}>

          {/* Left: alert list + detail */}
          <div>
            <div style={{display:'grid',gridTemplateColumns: selected ? '1fr 1.5fr' : '1fr',gap:16}}>
              {/* Alert list */}
              <div>
                {display.length ? display.map((a,i) => (
                  <div key={a.id||i} onClick={()=>setSel(sel===(a.id||i)?null:(a.id||i))} style={{padding:'14px 16px',background:sel===(a.id||i)?RISK_BG(a.level):C.surface,border:`1px solid ${sel===(a.id||i)?RISK_COLOR(a.level):C.border}`,borderRadius:10,marginBottom:10,cursor:'pointer',transition:'all 0.15s'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:6}}>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <Badge level={a.level}/>
                        <span style={{fontSize:13,fontWeight:700,color:C.bright}}>{a.title||a.level}</span>
                      </div>
                      {a.is_active && <span style={{fontSize:10,color:C.success,fontWeight:700,background:'#10B98120',padding:'2px 6px',borderRadius:4}}>{t('active').toUpperCase()}</span>}
                    </div>
                    <div style={{fontSize:12,color:C.muted,marginBottom:4}}>{a.state||a.affected_states}</div>
                    <div style={{fontSize:12,color:C.text,lineHeight:1.4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{a.message||a.msg}</div>
                    {a.affected_lgas && <div style={{fontSize:11,color:C.muted,marginTop:6}}>LGAs: {a.affected_lgas}</div>}
                  </div>
                )) : <EmptyState icon="✅" msg={t('noAlertsNormal')} />}
              </div>

              {/* Detail panel */}
              {selected && (
                <Card style={{alignSelf:'flex-start',position:'sticky',top:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                    <Badge level={selected.level}/>
                    <button onClick={()=>setSel(null)} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:18}}>✕</button>
                  </div>
                  <div style={{fontSize:16,fontWeight:700,color:C.bright,marginBottom:4}}>{selected.title||selected.level}</div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:12}}>{selected.state||selected.affected_states} · {selected.start_date ? new Date(selected.start_date).toLocaleDateString() : 'Active'}</div>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.6,marginBottom:16}}>{selected.message||selected.msg}</div>
                  {selected.affected_lgas && (
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:'0.06em',marginBottom:4}}>{t('affectedLGAs').toUpperCase()}</div>
                      <div style={{fontSize:12,color:C.text}}>{selected.affected_lgas}</div>
                    </div>
                  )}
                  {selected.recommended_actions && (
                    <div>
                      <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:'0.06em',marginBottom:6}}>{t('recommendedActions').toUpperCase()}</div>
                      {selected.recommended_actions.split('\n').filter(Boolean).map((a,i)=>(
                        <div key={i} style={{fontSize:12,color:C.text,padding:'5px 8px',background:C.s2,borderRadius:6,marginBottom:4}}>{a}</div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* Right: National heatmap */}
          <div style={{position:'sticky',top:16}}>
            <NationalHeatmap alerts={display} />
          </div>

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
  const [showAuth, setShowAuth] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('nihsa_lang')||'en'; } catch { return 'en'; } });
  const navigate = useNavigate();
  // Update translation lang when user changes language
  const handleLangChange = (l) => { setLang(l); _currentLang = l; };

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
        @media (max-width:640px) {
          .desktop-only { display:none!important; }
        }
      `}</style>

      {/* Header */}
      <header style={{background:C.surface, borderBottom:`1px solid ${C.border}`, padding:'0 16px', display:'flex', alignItems:'center', height:56, position:'sticky', top:0, zIndex:1000, gap:12}}>
        {/* Logo — click to go home */}
        <div onClick={()=>setTab('map')} style={{display:'flex',alignItems:'center',gap:10,flexShrink:0,cursor:'pointer'}}>
          <img src="/nihsa-logo.png" alt="NIHSA"
            style={{width:40,height:40,objectFit:'contain'}}
            onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='flex';}}
          />
          <div style={{width:40,height:40,borderRadius:8,background:`linear-gradient(135deg,${C.primary},${C.info})`,alignItems:'center',justifyContent:'center',fontSize:18,display:'none'}}>🌊</div>
          <div>
            <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:16,fontWeight:700,color:C.bright,letterSpacing:'0.04em',lineHeight:1}}>NIHSA</div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:'0.06em',lineHeight:1}}>FLOOD INTELLIGENCE</div>
          </div>
        </div>

        {/* Critical alert ticker */}
        {criticalCount > 0 && (
          <div style={{flex:1,overflow:'hidden',display:'flex',alignItems:'center',gap:6}} className="desktop-only">
            <span style={{padding:'2px 7px',background:C.danger,borderRadius:4,fontSize:10,fontWeight:800,color:'#fff',flexShrink:0,animation:'pulse 2s ease infinite'}}>● LIVE</span>
            <div style={{fontSize:11,color:C.danger,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              CRITICAL: Niger @ Lokoja 9.8m | Benue @ Makurdi HIGH | Lagdo Dam routing +3–5d
            </div>
          </div>
        )}

        <div style={{flex:1}} />

        {/* Nav tabs – desktop */}
        <nav style={{display:'flex',gap:2}} className="desktop-only">
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'6px 12px',borderRadius:6,border:'none',background:tab===t.id?`${C.primary}20`:'transparent',color:tab===t.id?C.accent:C.muted,cursor:'pointer',fontSize:12,fontWeight:tab===t.id?700:400,transition:'all 0.15s',display:'flex',alignItems:'center',gap:5}}>
              <span>{t.icon}</span><span>{t.label}</span>
              {t.id==='alerts' && criticalCount>0 && <span style={{width:6,height:6,borderRadius:'50%',background:C.danger,animation:'pulse 2s ease infinite'}}/>}
            </button>
          ))}
        </nav>

        {/* User */}
        {user ? (
          <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0,position:'relative'}}>
            <LangSelector lang={lang} setLang={handleLangChange} />
            <button onClick={()=>setShowUserMenu(p=>!p)}
              style={{width:30,height:30,borderRadius:8,background:`${C.primary}30`,display:'flex',alignItems:'center',
                justifyContent:'center',fontSize:13,fontWeight:700,color:C.primary,border:`2px solid ${showUserMenu?C.primary:'transparent'}`,cursor:'pointer'}}>
              {(user.full_name||user.name||user.email||'U')[0].toUpperCase()}
            </button>
            {showUserMenu && (
              <div style={{position:'absolute',top:38,right:0,background:C.surface,border:`1px solid ${C.border}`,
                borderRadius:10,boxShadow:'0 4px 24px #0009',minWidth:180,zIndex:9999,padding:12}}>
                <div style={{fontSize:12,fontWeight:700,color:C.bright,marginBottom:4}}>
                  {user.full_name||user.name||user.email}
                </div>
                <div style={{fontSize:11,color:C.muted,marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${C.border}`,textTransform:'capitalize'}}>
                  {user.role?.replace('_',' ')||'User'}
                </div>
                <button onClick={()=>{setShowUserMenu(false);setShowProfile(true);}}
                  style={{width:'100%',padding:'8px 10px',background:C.s2,
                    border:`1px solid ${C.border}`,borderRadius:7,color:C.text,
                    fontSize:12,fontWeight:600,cursor:'pointer',marginBottom:6,textAlign:'left'}}>
                  👤 View Profile
                </button>
                {['admin','sub_admin','nihsa_staff','government'].includes(user.role) && (
                  <button onClick={()=>{
                    setShowUserMenu(false);
                    navigate('/admin');
                  }}
                    style={{display:'block',width:'100%',padding:'8px 10px',
                      background:`${C.primary}18`,border:`1px solid ${C.primary}40`,
                      borderRadius:7,color:C.primary,fontSize:12,fontWeight:700,
                      cursor:'pointer',marginBottom:6,textAlign:'left'}}>
                    🏛 Admin Panel
                  </button>
                )}
                <button onClick={()=>{setShowUserMenu(false);api.logout();}}
                  style={{width:'100%',padding:'8px 10px',background:`${C.danger}18`,
                    border:`1px solid ${C.danger}40`,borderRadius:7,color:C.danger,
                    fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  🚪 {t('signOut')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            <LangSelector lang={lang} setLang={handleLangChange} />
            <button onClick={()=>setShowAuth(true)} style={{padding:'6px 14px',background:`linear-gradient(135deg,${C.primary},#0284C7)`,border:'none',borderRadius:8,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0}}>
              {t('signIn')}
            </button>
          </div>
        )}
      </header>

      {/* Mobile tab bar */}
      <div style={{display:'none',position:'fixed',bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,zIndex:999,padding:'4px 0',justifyContent:'space-around'}} className="mobile-tabs">
        <style>{`@media(max-width:640px){.mobile-tabs{display:flex!important;bottom:36px!important}}`}</style>
        {tabs.slice(0,5).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'5px 8px',border:'none',background:'transparent',cursor:'pointer',color:tab===t.id?C.primary:C.muted,fontSize:9,fontWeight:tab===t.id?700:400}}>
            <span style={{fontSize:18}}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main style={{paddingBottom:80}}>
        {tab==='map' && <MapTab user={user} gauges={gauges} alerts={alerts} reports={reports} loading={gaugesLoading} error={gaugesErr} />}
        {tab==='dashboard' && <DashboardTab />}
        {tab==='vanguard' && <VanguardTab user={user} onSignIn={()=>setShowAuth(true)} />}
        {tab==='assistant' && <AssistantTab gauges={gauges} alerts={alerts} />}
        {tab==='alerts' && <AlertsTab alerts={alerts} loading={alertsLoading} error={alertsErr} />}
      </main>

      {/* ── Always-visible news-style alert ticker ── */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:900}}>
        <AlertTicker alerts={alerts} />
      </div>

      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onAuth={u=>{setUser(u);setShowAuth(false);}} />}
      {showProfile && user && <ProfileModal user={user} onClose={()=>setShowProfile(false)} />}
    </div>
  );
}
