// TutorialModal.jsx — NIHSA Flood Intelligence Platform
// Fully local tutorial content — no API call needed
// Mobile-first, Capacitor-ready

import { useState } from 'react';

const C = {
  bg: '#04111F', surface: '#071E33', s2: '#0A2540', s3: '#0D2E4A',
  border: '#143D5C', primary: '#0EA5E9', accent: '#38BDF8',
  text: '#CBD5E1', bright: '#F1F5F9', muted: '#4A7A9B',
  danger: '#EF4444', warning: '#F97316', success: '#10B981', info: '#6366F1',
};

// ── All tutorial content, fully reflecting the real app ───────────────────────
const CONTENT = {
  general: {
    icon: '📱',
    title: { en:'App Overview', ha:'Bayanin Manhaja', yo:'Akopọ Ohun Elo', ig:'Nchọpụta Ngwa', fr:'Aperçu de l\'Application' },
    steps: {
      en: [
        { icon:'🗺️', title:'Map Tab', body:'View live flood conditions across Nigeria. See 358+ river gauge stations, active flood alerts, citizen reports, and NFFS forecast layers. Tap any marker for details. Drag the pin on the map to explore. Use the 📍 button to jump to your GPS location.' },
        { icon:'📊', title:'Dashboard Tab', body:'See the Annual Flood Outlook 2026 (AFO 2026) — nationwide exposure data across 17 layers including communities, population, health centres, schools, farmland, roads, electricity, and markets at risk. Switch between Annual and Weekly views.' },
        { icon:'🦺', title:'Flood Marshals (Vanguard) Tab', body:'Secure coordination network for verified Flood Marshals and NIHSA staff. Browse state channels (all 36 states + FCT + National). Verified personnel can post situational updates. Citizens can view messages.' },
        { icon:'🤖', title:'AI Assistant Tab', body:'Ask NIHSA FloodAI about flood risk, river gauges, evacuation routes, and emergency procedures. Use the 🎤 microphone button to speak your question — it transcribes and sends automatically. Supports Hausa, Yoruba, Igbo, and French. Use for hydrology and flood topics only.' },
        { icon:'🔔', title:'Alerts Tab', body:'Browse all active flood warnings nationwide. See a live heatmap of alert severity by state. Each alert shows the affected zone, estimated impact on people, health facilities, farmland, and roads. Alerts are issued and verified by NIHSA coordinators.' },
        { icon:'🚨', title:'Report Flooding', body:'Tap the red 🚨 Report Flood button (top-right or bottom of screen) to submit a citizen flood report. You must attach at least one photo, voice recording, or video. Location is captured automatically via GPS. Reports are reviewed by NIHSA before publishing.' },
        { icon:'🌐', title:'Languages', body:'Tap the language selector in the top bar to switch between English, Hausa (هَوُسَ), Yoruba, Igbo, and French. The AI Assistant also auto-detects and responds in your language.' },
      ],
      ha: [
        { icon:'🗺️', title:'Tab na Taswira', body:'Duba yanayin ambaliya a Najeriya kai tsaye. Duba tashar aunawa 358+, faɗakarwar ambaliya, rahotannin ɗan ƙasa, da matakan hasashe na NFFS. Danna kowane alamar don cikakkun bayanai. Yi amfani da maɓallin 📍 don komawa wurin GPS ɗinku.' },
        { icon:'📊', title:'Tab na Allon Bayanai', body:'Duba Hasashen Ambaliya na Shekara 2026 (AFO 2026) — bayanan fallasa a duk faɗin ƙasar a cikin yadudduka 17 ciki har da al\'umma, yawan jama\'a, cibiyoyin lafiya, makarantu, gonaki, hanyoyi, wutar lantarki, da kasuwanni cikin haɗari.' },
        { icon:'🦺', title:'Tab na Masu Kiyaye Ambaliya', body:'Hanyar sadarwa mai tsaro ga Masu Kiyaye Ambaliya da ma\'aikatan NIHSA. Duba tasoshin jiha (jihohi 36 + FCT + Na Ƙasa). Ma\'aikata masu tabbaci na iya aika sabuntawa. Ɗan ƙasa na iya kallon sakonni.' },
        { icon:'🤖', title:'Tab na Mataimaki na AI', body:'Tambayi NIHSA FloodAI game da haɗarin ambaliya, aunawa, hanyoyin tserewa, da ka\'idojin gaggawa. Yi amfani da maɓallin 🎤 don magana — zai fassara kuma aika kai tsaye. Yana tallafawa Hausa, Yoruba, Igbo, da Faransanci.' },
        { icon:'🔔', title:'Tab na Faɗakarwa', body:'Duba duk faɗakarwar ambaliya masu aiki a duk faɗin ƙasa. Duba taswirar zafi na tsananin faɗakarwa ta jiha. Kowace faɗakarwa tana nuna yankin da aka shafa da tasirinsa kan mutane da cibiyoyin lafiya.' },
        { icon:'🚨', title:'Rahoton Ambaliya', body:'Danna maɓallin jan 🚨 don aika rahoto. Dole ne ka haɗa aƙalla hoto ɗaya, rikodiyar murya, ko bidiyo. Ana ɗaukar wuri ta GPS kai tsaye. Ma\'aikatan NIHSA suna duba rahotanni kafin wallafawa.' },
        { icon:'🌐', title:'Harsunan', body:'Danna zaɓin harshe a sandar sama don canza tsakanin Turanci, Hausa, Yoruba, Igbo, da Faransanci.' },
      ],
      yo: [
        { icon:'🗺️', title:'Tab Maapu', body:'Wo ipo iṣan-omi laaye kọja Naijiria. Wo awọn ibudo wiwọn 358+, awọn ìkìlọ̀ iṣan-omi, awọn ìjàbọ̀ ara ilu, ati awọn fẹlẹfẹlẹ asọtẹlẹ NFFS. Tẹ eyikeyi aami fun awọn alaye. Lo bọtini 📍 lati fo si ipo GPS rẹ.' },
        { icon:'📊', title:'Tab Paali Alaye', body:'Wo Asọtẹlẹ Iṣan-omi Lọdọọdún 2026 (AFO 2026) — data ifihan ti orilẹ-ede kọja awọn fẹlẹfẹlẹ 17 pẹlu awọn agbegbe, eniyan, awọn ile itọju ilera, awọn ile-iwe, ilẹ oko, awọn opopona, ina mọnamọna, ati awọn ọja ninu ewu.' },
        { icon:'🦺', title:'Tab Awọn Oluso Iṣan-omi', body:'Nẹtiwọọki isọdọkan aabo fun Awọn Oluso Iṣan-omi ati oṣiṣẹ NIHSA ti a fọwọsi. Wo awọn ikanni ipinlẹ (ipinlẹ 36 + FCT + Orílẹ̀-èdè). Oṣiṣẹ ti a fọwọsi le firanṣẹ awọn imudojuiwọn.' },
        { icon:'🤖', title:'Tab Oluranlowo AI', body:'Beere NIHSA FloodAI nipa eewu iṣan-omi, awọn gauge odò, awọn ọna iṣapá, ati awọn ilana pajawiri. Lo bọtini 🎤 lati sọrọ ibeere rẹ — yoo tumọ rẹ ki o fi ranṣẹ laifọwọyi. Ṣe atilẹyin Hausa, Yoruba, Igbo, ati Faranse.' },
        { icon:'🔔', title:'Tab Ifokanbalẹ', body:'Wo gbogbo awọn ikilọ iṣan-omi ti nṣiṣẹ ni orilẹ-ede. Wo heatmap laaye ti buru ikilọ nipasẹ ipinlẹ. Ikilọ kọọkan fihan agbegbe ti o kan ati ipa rẹ lori eniyan.' },
        { icon:'🚨', title:'Jabo Iṣan-omi', body:'Tẹ bọtini pupa 🚨 lati fi ijabọ silẹ. O gbọdọ so o kere ju fọto kan, igbasilẹ ohun, tabi fidio. GPS gba ipo laifọwọyi. Awọn oṣiṣẹ NIHSA ṣe atunyẹwo awọn ijabọ.' },
        { icon:'🌐', title:'Awọn Ede', body:'Tẹ oluyan ede ni ọpá oke lati yipada laarin Gẹẹsi, Hausa, Yoruba, Igbo, ati Faranse.' },
      ],
      ig: [
        { icon:'🗺️', title:'Tab Maapu', body:'Lee ọnọdụ mmiri ozuzo ndụ n\'elu Naịjirịa. Lee ọdụ ngụkọ 358+, ọkwa mmiri ozuzo na-arụ ọrụ, akụkọ ndị ọchịchọ, na ọkwa ntọala NFFS. Kụọ ihe nchọpụta ọ bụla maka nkọwa. Jiri bọtịn 📍 wụọ ọnọdụ GPS gị.' },
        { icon:'📊', title:'Tab Penu Ozi', body:'Lee Atụmatụ Mmiri Ozuzo Ọdụn 2026 (AFO 2026) — data mficha mba n\'elu ọkwa 17 gụnyere obodo, ndị mmadụ, ụlọ ọgwụ, ụlọ akwụkwọ, ala ugbo, okporo ụzọ, ọkụ eletrik, na ahia n\'ihe ize ndụ.' },
        { icon:'🦺', title:'Tab Ndi Nlekota Mmiri Ozuzo', body:'Netwọk nhazi echekwara maka Ndị Nlekota Mmiri Ozuzo na ndị ọrụ NIHSA. Lelee ọwa steeti (steeti 36 + FCT + Mba). Ndị ọrụ kwadoro nwere ike izipu mmelite.' },
        { icon:'🤖', title:'Tab Onye Enyemaka AI', body:'Jụọ NIHSA FloodAI maka ihe ize ndụ mmiri ozuzo, ngụkọ osimiri, ụzọ nnarị, na usoro ihe mberede. Jiri bọtịn 🎤 ikwu ajụjụ gị — ọ ga-atụgharịa ma zigaa ozugbo. Na-akwado Hausa, Yoruba, Igbo, na Faransị.' },
        { icon:'🔔', title:'Tab Okwa', body:'Lelee ọkwa mmiri ozuzo niile na-arụ ọrụ n\'elu mba. Lee heatmap ndụ nke ike ọkwa site n\'ọchịchọ steeti. Ọkwa ọ bụla na-egosi mpaghara metụtara ya.' },
        { icon:'🚨', title:'Kọọ Mmiri Ozuzo', body:'Kụọ bọtịn ọbara ọbara 🚨 iziga akụkọ. Ị kwesịrị itinye ma ọ bụrụ otu foto, ndekọ olu, ma ọ bụ vidiyo. GPS na-eji ọnọdụ ozugbo. Ndị ọrụ NIHSA na-nyocha akụkọ.' },
        { icon:'🌐', title:'Asụsụ', body:'Kụọ nhọrọ asụsụ n\'elu bar iji gbanwee n\'etiti Bekee, Hausa, Yoruba, Igbo, na Faransị.' },
      ],
      fr: [
        { icon:'🗺️', title:'Onglet Carte', body:'Visualisez les conditions d\'inondation en direct à travers le Nigeria. Voir 358+ stations de jaugeage, les alertes actives, les rapports citoyens et les couches de prévision NFFS. Appuyez sur un marqueur pour les détails. Utilisez le bouton 📍 pour votre position GPS.' },
        { icon:'📊', title:'Onglet Tableau de Bord', body:'Consultez les Perspectives Annuelles d\'Inondation 2026 (AFO 2026) — données d\'exposition nationales sur 17 couches incluant les communautés, la population, les centres de santé, les écoles, les terres agricoles, les routes, l\'électricité et les marchés à risque.' },
        { icon:'🦺', title:'Onglet Gardes des Inondations', body:'Réseau de coordination sécurisé pour les Gardes des Inondations vérifiés et le personnel NIHSA. Parcourez les canaux d\'État (36 États + FCT + National). Le personnel vérifié peut poster des mises à jour de situation.' },
        { icon:'🤖', title:'Onglet Assistant IA', body:'Interrogez NIHSA FloodAI sur les risques d\'inondation, les jauges fluviales, les voies d\'évacuation et les procédures d\'urgence. Utilisez le bouton 🎤 pour parler votre question — elle sera transcrite et envoyée automatiquement. Supporte le Haoussa, le Yoruba, l\'Igbo et le Français.' },
        { icon:'🔔', title:'Onglet Alertes', body:'Parcourez toutes les alertes d\'inondation actives à l\'échelle nationale. Visualisez une carte thermique en direct de la sévérité des alertes par État. Chaque alerte indique la zone touchée et son impact estimé.' },
        { icon:'🚨', title:'Signaler une Inondation', body:'Appuyez sur le bouton rouge 🚨 pour soumettre un rapport. Vous devez joindre au moins une photo, un enregistrement vocal ou une vidéo. La position GPS est capturée automatiquement. Les agents NIHSA examinent les rapports.' },
        { icon:'🌐', title:'Langues', body:'Appuyez sur le sélecteur de langue dans la barre supérieure pour basculer entre l\'Anglais, le Haoussa, le Yoruba, l\'Igbo et le Français.' },
      ],
    },
  },

  map: {
    icon: '🗺️',
    title: { en:'Using the Map', ha:'Amfani da Taswira', yo:'Lilo Maapu', ig:'Iji Maapu', fr:'Utiliser la Carte' },
    steps: {
      en: [
        { icon:'📍', title:'Your GPS Location', body:'Tap the 📍 location button (top-right of map) to fly to your GPS position. A pulsing blue dot marks your location. On the Android app, location permission must be granted — go to Settings → App Permissions → Location → Allow.' },
        { icon:'🔍', title:'Search & Navigate', body:'Use the search bar at the top to find any community, LGA, state, or landmark across Nigeria. Results show instantly — tap to fly the map to that location. Works offline for previously loaded tiles.' },
        { icon:'🌊', title:'River Gauge Stations', body:'Blue circle markers show NIHSA\'s 358 river gauge stations. Colour indicates risk level: green = normal, yellow = watch, orange = high, red = critical. Tap a station to see its name, river, state, and latest readings.' },
        { icon:'⚠️', title:'Flood Alerts', body:'Alert markers appear where NIHSA has issued an active warning. Red = critical/extreme, orange = high, yellow = watch/medium. Tap to read the full alert message, affected LGAs, and recommended actions.' },
        { icon:'📸', title:'Citizen Reports', body:'Toggle "Citizen Flood Reports" in Map Layers to see verified citizen flood reports on the map. Each marker shows water depth and a description. Reports must be NIHSA-verified before appearing.' },
        { icon:'🗂️', title:'Map Layers Panel', body:'Open the 🗂️ Map Layers panel (top-left) to toggle advanced data layers: Annual Forecast (AFO 2026) flood extent, population at risk, health facilities, schools, farmland, roads, surface water alerts, and more. Layers marked SOON are under development.' },
        { icon:'🚨', title:'Report from Map', body:'Tap the red 🚨 Report Flood button at the top-right of the map to submit a flood report. Your GPS location is automatically pinned — drag the map pin to adjust. Attach at least one photo, voice, or video file.' },
      ],
      ha: [
        { icon:'📍', title:'Wurin GPS Ɗinku', body:'Danna maɓallin 📍 don tashi zuwa wurin GPS ɗinku. A kan manhaja Android, dole ne ka ba da izinin wurin — Je zuwa Settings → Izinin App → Wuri → Yarda.' },
        { icon:'🔍', title:'Bincike & Tafiya', body:'Yi amfani da sandar bincike a sama don nemo wata al\'umma, LGA, jiha, ko wuri a Najeriya. Taɓa sakamakon don tashin taswira zuwa wannan wuri.' },
        { icon:'🌊', title:'Tashar Aunawa na Kogi', body:'Alamomin da\'ira launin shuɗi suna nuna tashar aunawa 358 na NIHSA. Launi yana nuna matsayin haɗari. Taɓa tashar don cikakkun bayanai.' },
        { icon:'⚠️', title:'Faɗakarwar Ambaliya', body:'Alamomin faɗakarwa suna bayyana inda NIHSA ta ba da gargaɗi mai aiki. Ja = mai tsanani, orange = babba, rawaya = kallo. Taɓa don karanta cikakken sakon.' },
        { icon:'📸', title:'Rahotannin Ɗan Ƙasa', body:'Kunna "Rahotannin Ambaliya na Ɗan Ƙasa" a Matakan Taswira don duba rahotannin da aka tabbatar. Kowane alamar yana nuna zurfin ruwa da bayani.' },
        { icon:'🗂️', title:'Panel na Matakan Taswira', body:'Buɗe panel na Matakan Taswira 🗂️ don kunna layers na bayanai: Hasashen Shekara, yawan jama\'a cikin haɗari, cibiyoyin lafiya, makarantu, gonaki, da ƙari.' },
        { icon:'🚨', title:'Rahoto daga Taswira', body:'Danna maɓallin jan 🚨 don aika rahoto. Ana pintawa GPS ɗinku kai tsaye — ja pin don gyarawa. Haɗa aƙalla hoto ɗaya, murya, ko bidiyo.' },
      ],
      yo: [
        { icon:'📍', title:'Ipo GPS Rẹ', body:'Tẹ bọtini 📍 lati fo si ipo GPS rẹ. Lori app Android, igbanilaaye ipo gbọdọ fun — Lọ si Eto → Awọn Igbanilaaye App → Ipo → Gba.' },
        { icon:'🔍', title:'Wiwa & Lilọ', body:'Lo ọpa wiwa ni oke lati wa agbegbe, LGA, ipinlẹ, tabi aami-ilẹ ni Naijiria. Tẹ abajade lati fo maapu si ipo yẹn.' },
        { icon:'🌊', title:'Awọn Ibudo Wiwọn Odò', body:'Awọn aami iyika buluu fihan awọn ibudo wiwọn 358 NIHSA. Awọ fihan ipele ewu. Tẹ ibudo fun awọn alaye.' },
        { icon:'⚠️', title:'Awọn Ìkìlọ̀ Iṣan-omi', body:'Awọn aami ìkìlọ̀ han nibiti NIHSA ti ṣe ikilọ ti nṣiṣẹ. Pupa = pataki, osan = giga, ofeefee = wiwo. Tẹ lati ka ifiranṣẹ kikun.' },
        { icon:'📸', title:'Awọn Ìjàbọ̀ Ara Ilu', body:'Yipada "Awọn Ìjàbọ̀ Iṣan-omi Ara Ilu" ni Awọn Fẹlẹfẹlẹ Maapu lati wo awọn ìjàbọ̀ ti a fọwọsi.' },
        { icon:'🗂️', title:'Panẹli Awọn Fẹlẹfẹlẹ Maapu', body:'Ṣii panẹli 🗂️ lati yipada awọn fẹlẹfẹlẹ data: Asọtẹlẹ Ọdọọdún, olugbe ninu ewu, awọn ile itọju ilera, awọn ile-iwe, ati diẹ sii.' },
        { icon:'🚨', title:'Jabo lati Maapu', body:'Tẹ bọtini pupa 🚨 lati fi ijabọ silẹ. GPS rẹ jẹ pinned laifọwọyi — fa aami lati ṣatunṣe. So o kere ju fọto kan, ohun, tabi fidio.' },
      ],
      ig: [
        { icon:'📍', title:'Ọnọdụ GPS Gị', body:'Kụọ bọtịn 📍 iji wụọ ọnọdụ GPS gị. N\'ngwa Android, ikike ọnọdụ ga-adị mkpa — Gaa Settings → Ikike Ngwa → Ọnọdụ → Kwe.' },
        { icon:'🔍', title:'Chọọ & Gaa', body:'Jiri ọwa ọchọ n\'elu iji chọọ obodo, LGA, steeti ma ọ bụ akara n\'Naịjirịa. Kụọ nsonaazụ iji gbaa maapu n\'ọnọdụ ahụ.' },
        { icon:'🌊', title:'Ọdụ Ngụkọ Osimiri', body:'Ihe nchọpụta okirikiri ojii na-egosi ọdụ ngụkọ 358 NIHSA. Agba na-egosi ọkwa ihe ize ndụ. Kụọ ọdụ maka nkọwa.' },
        { icon:'⚠️', title:'Ọkwa Mmiri Ozuzo', body:'Ihe nchọpụta ọkwa na-apụta ebe NIHSA nyere ọkwa na-arụ ọrụ. Ọbara ọbara = siri ike, oji = elu, odo edo = ele anya. Kụọ iji gụọ ozi zuru oke.' },
        { icon:'📸', title:'Akụkọ Ndị Ọchịchọ', body:'Gbanwee "Akụkọ Mmiri Ozuzo Ndị Ọchịchọ" na Ọtụtụ Ihe Maapu iji hụ akụkọ kwadoro.' },
        { icon:'🗂️', title:'Panẹl Ọtụtụ Ihe Maapu', body:'Mepee panẹl 🗂️ iji tụgharịa ọkwa data: Atụmatụ Ọdụn, ndị mmadụ n\'ihe ize ndụ, ụlọ ọgwụ, ụlọ akwụkwọ, na ndị ọzọ.' },
        { icon:'🚨', title:'Kọọ site na Maapu', body:'Kụọ bọtịn ọbara ọbara 🚨 iziga akụkọ. GPS gị na-ejikọ ozugbo — dọkpụ pin igo dozie. Tinye ma ọ bụrụ foto, olu, ma ọ bụ vidiyo.' },
      ],
      fr: [
        { icon:'📍', title:'Votre Position GPS', body:'Appuyez sur le bouton 📍 pour voler à votre position GPS. Sur l\'app Android, la permission de localisation doit être accordée — Allez dans Paramètres → Autorisations → Localisation → Autoriser.' },
        { icon:'🔍', title:'Recherche & Navigation', body:'Utilisez la barre de recherche en haut pour trouver une communauté, LGA, État ou repère au Nigeria. Appuyez sur un résultat pour faire voler la carte vers cet endroit.' },
        { icon:'🌊', title:'Stations de Jaugeage', body:'Les marqueurs cercles bleus indiquent les 358 stations de jaugeage NIHSA. La couleur indique le niveau de risque. Appuyez sur une station pour les détails.' },
        { icon:'⚠️', title:'Alertes d\'Inondation', body:'Les marqueurs d\'alerte apparaissent là où la NIHSA a émis un avertissement actif. Rouge = critique, orange = élevé, jaune = surveillance. Appuyez pour lire le message complet.' },
        { icon:'📸', title:'Rapports Citoyens', body:'Activez "Rapports d\'Inondation Citoyens" dans Couches de Carte pour voir les rapports vérifiés sur la carte.' },
        { icon:'🗂️', title:'Panneau des Couches de Carte', body:'Ouvrez le panneau 🗂️ pour activer les couches de données avancées : Prévision Annuelle, population à risque, établissements de santé, écoles, terres agricoles, et plus.' },
        { icon:'🚨', title:'Signaler depuis la Carte', body:'Appuyez sur le bouton rouge 🚨 pour soumettre un rapport. Votre GPS est épinglé automatiquement — faites glisser le pin pour ajuster. Joignez au moins une photo, voix ou vidéo.' },
      ],
    },
  },

  reporting: {
    icon: '🚨',
    title: { en:'Flood Reporting', ha:'Rahoton Ambaliya', yo:'Ìjàbọ̀ Iṣan-omi', ig:'Kọọ Mmiri Ozuzo', fr:'Signalement d\'Inondation' },
    steps: {
      en: [
        { icon:'📍', title:'Step 1 — Your Location', body:'When you open the Report Flood form, your GPS location is automatically detected and shown on a draggable map. Drag the pin to adjust your exact location. You can also search for a place name manually.' },
        { icon:'💧', title:'Step 2 — Water Depth (Optional)', body:'Select the approximate flood depth if known: ankle-deep (0.1m), knee-deep (0.4m), waist-deep (0.8m), chest-deep (1.2m), or impassable (2.0m). If you skip this, the system records the minimum level. This helps NIHSA prioritise responses.' },
        { icon:'📝', title:'Step 3 — Description (Optional)', body:'Describe what you see — are roads blocked? Are homes affected? Are people stranded? Any injuries? If you leave this blank, the system records "this person needs help, check the files they sent" so NIHSA still receives your media.' },
        { icon:'📸', title:'Step 4 — Media (Required)', body:'You MUST attach at least one of: Photo (tap 📷 to use your camera), Voice recording (tap 🎤 to record up to 60 seconds), or Video (tap 🎥 to record from your camera). Without media, the report cannot be submitted.' },
        { icon:'✅', title:'Step 5 — Submit', body:'Tap "Submit Flood Report". Your report goes directly to NIHSA coordinators for verification. Verified reports appear on the map and can trigger public flood alerts for your area.' },
        { icon:'🔒', title:'Tip — Sign In First', body:'Sign in before reporting so NIHSA can contact you for follow-up if needed. Guest reports are accepted but are harder to verify. Your personal information is never publicly shown.' },
      ],
      ha: [
        { icon:'📍', title:'Matakin 1 — Wurinku', body:'Da zarar ka buɗe fom na Rahoton Ambaliya, GPS ɗinku zai gano wurinka kai tsaye kuma ya nuna shi akan taswira mai amfani. Ja pin don daidaita wurin daidai.' },
        { icon:'💧', title:'Matakin 2 — Zurfin Ruwa (Ba Tilas Ba)', body:'Zaɓi kimanin zurfin ambaliya idan ka sani. Idan ka tsallake wannan, tsarin zai rubuta mafi ƙarancin matakin.' },
        { icon:'📝', title:'Matakin 3 — Bayani (Ba Tilas Ba)', body:'Bayyana abin da kuke gani. Idan ka bar wannan fanko, tsarin zai rubuta "wannan mutumin yana buƙatar taimako, duba fayilolin da ya aika".' },
        { icon:'📸', title:'Matakin 4 — Kafofin Watsa Labarai (Ana Buƙata)', body:'Dole ne ka haɗa aƙalla ɗayan: Hoto (📷), Rikodiyar Murya (🎤 — har zuwa dakika 60), ko Bidiyo (🎥). Ba tare da kafofin watsa labarai ba, ba za a iya aika rahoto ba.' },
        { icon:'✅', title:'Matakin 5 — Aika', body:'Danna "Aika Rahoto na Ambaliya". Rahoto ɗinku zai kai ga masu duba NIHSA kai tsaye. Rahotannin da aka tabbatar suna bayyana akan taswira.' },
        { icon:'🔒', title:'Shawarar — Shiga Da Farko', body:'Shiga kafin ka aika rahoto don NIHSA ta iya tuntuɓar ka idan ana buƙata.' },
      ],
      yo: [
        { icon:'📍', title:'Igbese 1 — Ipo Rẹ', body:'Nigbati o ba ṣii fọọmu Ìjàbọ̀ Iṣan-omi, GPS rẹ yoo wa ipo rẹ laifọwọyi ki o si fihan rẹ lori maapu. Fa pin lati ṣatunṣe ipo gangan rẹ.' },
        { icon:'💧', title:'Igbese 2 — Ijinlẹ Omi (Kii ṣe Dandan)', body:'Yan ijinlẹ iṣan-omi isunmọ ti a ba mọ. Ti o ba foju kọ eyi, eto naa gbasilẹ ipele ti o kere ju.' },
        { icon:'📝', title:'Igbese 3 — Apejuwe (Kii ṣe Dandan)', body:'Ṣapejuwe ohun ti o ri. Ti o ba jẹ ki eyi ṣofo, eto naa gbasilẹ "eniyan yii nilo iranlọwọ, ṣayẹwo awọn faili ti o fi ranṣẹ".' },
        { icon:'📸', title:'Igbese 4 — Media (A Nilo)', body:'O GBỌDỌ so o kere ju ọkan ninu: Fọto (📷), Igbasilẹ Ohun (🎤 — to iṣẹju 60), tabi Fidio (🎥). Laisi media, a ko le fi ijabọ silẹ.' },
        { icon:'✅', title:'Igbese 5 — Firanṣẹ', body:'Tẹ "Fi Ìjàbọ̀ Iṣan-omi Sí". Ìjàbọ̀ rẹ lọ taara si awọn alakoso NIHSA fun ijẹrisi.' },
        { icon:'🔒', title:'Imọran — Wọle Akọkọ', body:'Wọle ṣaaju ìjàbọ̀ ki NIHSA le kan si ọ ti o ba jẹ dandan.' },
      ],
      ig: [
        { icon:'📍', title:'Nzọụkwụ 1 — Ọnọdụ Gị', body:'Mgbe ị mepee ụdị Akụkọ Mmiri Ozuzo, GPS gị ga-achọpụta ọnọdụ gị ozugbo wee gosipụta ya n\'elu maapu. Dọkpụ pin igo dozie ọnọdụ.' },
        { icon:'💧', title:'Nzọụkwụ 2 — Omimi Mmiri (Ọdịghị Achọrọ)', body:'Họọ omimi mmiri ozuzo yị ma ọ bụ ama ya. Ọ bụrụ na ị achọ ya, sistemu ga-edekọ ọkwa kacha ala.' },
        { icon:'📝', title:'Nzọụkwụ 3 — Nkọwa (Ọdịghị Achọrọ)', body:'Kọọ ihe i hụrụ. Ọ bụrụ na ị hapụ nke a n\'efu, sistemu ga-edekọ "onye a chọrọ enyemaka, lelee faịlụ o zigara".' },
        { icon:'📸', title:'Nzọụkwụ 4 — Mgbasa Ozi (Achọrọ)', body:'Ị KWESỊRỊ itinye ma ọ bụrụ otu: Foto (📷), Ndekọ Olu (🎤 — rue sekọnd 60), ma ọ bụ Vidiyo (🎥). Na-enweghị mgbasa ozi, a gaghị enweta akụkọ.' },
        { icon:'✅', title:'Nzọụkwụ 5 — Zipu', body:'Kụọ "Nyefee Akụkọ Mmiri Ozuzo". Akụkọ gị ga-aga n\'ozugbo ndị nhazi NIHSA maka nkwenye.' },
        { icon:'🔒', title:'Ndụmọdụ — Banye Mbụ', body:'Banye tupu i zipu akụkọ ka NIHSA nwee ike ịkpọtụrụ gị ma ọ dị mkpa.' },
      ],
      fr: [
        { icon:'📍', title:'Étape 1 — Votre Position', body:'Lorsque vous ouvrez le formulaire, votre GPS détecte automatiquement votre position et l\'affiche sur une carte. Faites glisser le pin pour ajuster votre emplacement exact.' },
        { icon:'💧', title:'Étape 2 — Profondeur de l\'eau (Optionnel)', body:'Sélectionnez la profondeur approximative si connue. Si vous sautez ceci, le système enregistre le niveau minimum.' },
        { icon:'📝', title:'Étape 3 — Description (Optionnel)', body:'Décrivez ce que vous voyez. Si vous laissez ceci vide, le système enregistre "cette personne a besoin d\'aide, vérifiez les fichiers envoyés".' },
        { icon:'📸', title:'Étape 4 — Média (Requis)', body:'Vous DEVEZ joindre au moins un: Photo (📷), Enregistrement vocal (🎤 — jusqu\'à 60 secondes), ou Vidéo (🎥). Sans média, le rapport ne peut pas être soumis.' },
        { icon:'✅', title:'Étape 5 — Soumettre', body:'Appuyez sur "Soumettre le Rapport". Votre rapport va directement aux coordinateurs NIHSA pour vérification.' },
        { icon:'🔒', title:'Conseil — Connectez-vous d\'abord', body:'Connectez-vous avant de signaler afin que NIHSA puisse vous contacter si nécessaire.' },
      ],
    },
  },

  alerts: {
    icon: '⚠️',
    title: { en:'Understanding Alerts', ha:'Fahimtar Faɗakarwa', yo:'Oye Awọn Ìkìlọ̀', ig:'Ighọta Ọkwa', fr:'Comprendre les Alertes' },
    steps: {
      en: [
        { icon:'🟢', title:'NORMAL — All Clear', body:'River levels are within the safe range. No flood risk at this time. Continue normal activities but stay informed via the NIHSA app.' },
        { icon:'🟡', title:'WATCH — Be Prepared', body:'River levels are rising and conditions could worsen. Prepare your emergency kit, know your evacuation route, and monitor NIHSA updates closely. Do not camp near riverbanks.' },
        { icon:'🟠', title:'HIGH — Take Action', body:'Flooding is likely within 12–24 hours. Move valuables to higher ground, prepare to evacuate, and keep children and elderly away from floodways. Alert your neighbours.' },
        { icon:'🔴', title:'CRITICAL / EXTREME — Evacuate Now', body:'Immediate risk to life. Evacuate NOW if you are near rivers, streams, or low-lying areas. Do not attempt to cross flooded roads. Call emergency services. Your NIHSA alert has the affected LGAs listed.' },
        { icon:'📡', title:'How Alerts Are Generated', body:'NIHSA uses the NFFS (National Flood Forecasting System) — an LSTM deep learning model trained on 70 river basins. Alerts are also triggered by verified citizen reports and manual review by NIHSA hydrologists.' },
        { icon:'🔔', title:'Alert Ticker', body:'Active alerts scroll as a news ticker at the bottom of every screen. Tap the ticker to go directly to the Alerts tab for full details.' },
      ],
      ha: [
        { icon:'🟢', title:'AL\'ADA — Komai Ya Yi Kyau', body:'Matakan kogi suna cikin kewayon aminci. Babu haɗarin ambaliya a yanzu. Ci gaba da ayyukan yau da kullun amma kasance da labari.' },
        { icon:'🟡', title:'KALLO — Shirya', body:'Matakan kogi suna tashi kuma yanayin na iya yin muni. Shirya kayan gaggawa ɗinka, san hanyar tserewarka, kuma kula da sabuntawar NIHSA.' },
        { icon:'🟠', title:'BABBA — Ɗauki Matakin', body:'Ana sa ran ambaliya cikin awanni 12-24. Ɗauki kayan daraja zuwa wurin da ya fi tsayi, shirya ƙaura, kuma ƙaurace wa ɗan yara da tsofaffi daga hanyoyin ruwa.' },
        { icon:'🔴', title:'MATSANANCI — Gudu Yanzu', body:'Haɗari nan take ga rai. Gudu YANZU idan kuna kusa da koguna, rafuka, ko wuraren da suke ƙasa. Kada ku yi ƙoƙarin ketara hanyoyin ruwa.' },
        { icon:'📡', title:'Yadda Ake Samar da Faɗakarwa', body:'NIHSA tana amfani da NFFS — samfurin koyon inji na LSTM da aka horar akan kwandidon kogi 70. Faɗakarwa kuma ana kunna su ta hanyar rahotannin ɗan ƙasa da aka tabbatar.' },
        { icon:'🔔', title:'Tepe na Faɗakarwa', body:'Faɗakarwa masu aiki suna gungura a ƙasan kowace allo. Taɓa tepe don zuwa tab na Faɗakarwa.' },
      ],
      yo: [
        { icon:'🟢', title:'DEEDE — Ohun Gbogbo Dara', body:'Awọn ipele odò wa laarin iwọn ailewu. Ko si eewu iṣan-omi ni bayi. Tẹsiwaju awọn iṣẹ deede ṣugbọn wa alaye nipasẹ app NIHSA.' },
        { icon:'🟡', title:'WIWO — Mura Silẹ', body:'Awọn ipele odò n dide ati awọn ipo le buru sii. Mura apo pajawiri rẹ, mọ ipa ọna iṣapá rẹ, ki o tẹle awọn imudojuiwọn NIHSA.' },
        { icon:'🟠', title:'GIGA — Ṣe Igbese', body:'Iṣan-omi ṣeese laarin wakati 12-24. Gbe awọn ohun iyebiye si ilẹ giga, mura fun iṣapá.' },
        { icon:'🔴', title:'PATAKI — Salọ Bayi', body:'Ewu lẹsẹkẹsẹ si igbesi aye. Salọ BAYI ti o ba wa nitosi awọn odò, ṣiṣan, tabi awọn agbegbe kekere. Maṣe gbiyanju lati rekọja awọn ọna ti iṣan-omi.' },
        { icon:'📡', title:'Bii Awọn Ìkìlọ̀ Ṣe Jẹ Ipilẹṣẹ', body:'NIHSA lo NFFS — awoṣe ẹkọ ijinlẹ LSTM ti a kọ silẹ lori awọn agbada 70 ti odò. Awọn ìkìlọ̀ tun jẹ okunfa nipasẹ awọn ìjàbọ̀ ara ilu ti a fọwọsi.' },
        { icon:'🔔', title:'Aago Ìkìlọ̀', body:'Awọn ìkìlọ̀ ti nṣiṣẹ n yipo bi ago iroyin ni isalẹ gbogbo iboju. Tẹ aago lati lọ taara si tab Awọn Ìkìlọ̀.' },
      ],
      ig: [
        { icon:'🟢', title:'NKỊTỊ — Ihe Niile Dị Mma', body:'Ọkwa osimiri dị n\'ime ogo nchekwa. Enweghị ihe ize ndụ mmiri ozuzo ugbu a. Gaa n\'ihu na ọrụ nkịtị ma nọgide na-ama ozi.' },
        { icon:'🟡', title:'ELE ANYA — Kwado', body:'Ọkwa osimiri na-arị elu ma ọnọdụ nwere ike ịdị njọ. Kwado ngwugwu ihe mberede gị, mara ụzọ nnarị gị, ma soro mmelite NIHSA.' },
        { icon:'🟠', title:'ELU — Mee Ihe', body:'Mmiri ozuzo nwere ike n\'ime awa 12-24. Bugharịa ihe ndị bara uru n\'elu ala, kwado ịnnarị.' },
        { icon:'🔴', title:'SIRI IKE — Narịa Ugbu a', body:'Ihe ize ndụ ozugbo maka ndụ. Narịa UGBU A ọ bụrụ na i nọ n\'akụkụ osimiri, ọmaọma, ma ọ bụ mpaghara dị ala.' },
        { icon:'📡', title:'Otu Ọkwa Si Apụta', body:'NIHSA na-eji NFFS — ihe atụmatụ LSTM mwụkọ mara maka ụzọ mmiri 70. A na-amalite ọkwa site n\'akụkọ ndị ọchịchọ kwadoro.' },
        { icon:'🔔', title:'Ọkwa Ticker', body:'Ọkwa na-arụ ọrụ na-atọgharị dị ka ọkọlọtọ ozi n\'ala ihuenyo ọ bụla. Kụọ ticker iji gaa n\'ozugbo tab Ọkwa.' },
      ],
      fr: [
        { icon:'🟢', title:'NORMAL — Tout est Clair', body:'Les niveaux des rivières sont dans la plage sûre. Pas de risque d\'inondation actuellement. Continuez vos activités normales mais restez informé via l\'app NIHSA.' },
        { icon:'🟡', title:'SURVEILLANCE — Soyez Prêt', body:'Les niveaux des rivières montent et les conditions pourraient s\'aggraver. Préparez votre trousse d\'urgence et connaissez votre itinéraire d\'évacuation.' },
        { icon:'🟠', title:'ÉLEVÉ — Agissez', body:'Une inondation est probable dans les 12 à 24 heures. Mettez les objets de valeur en hauteur, préparez-vous à évacuer.' },
        { icon:'🔴', title:'CRITIQUE — Évacuez Maintenant', body:'Risque immédiat pour la vie. Évacuez MAINTENANT si vous êtes près de rivières ou de zones basses. Ne tentez pas de traverser des routes inondées.' },
        { icon:'📡', title:'Comment les Alertes sont Générées', body:'La NIHSA utilise le NFFS — un modèle d\'apprentissage profond LSTM formé sur 70 bassins fluviaux. Les alertes sont également déclenchées par des rapports citoyens vérifiés.' },
        { icon:'🔔', title:'Bandeau d\'Alertes', body:'Les alertes actives défilent en bandeau en bas de chaque écran. Appuyez sur le bandeau pour aller directement à l\'onglet Alertes.' },
      ],
    },
  },

  vanguard: {
    icon: '🦺',
    title: { en:'Flood Marshals Network', ha:'Hanyar Masu Kiyaye Ambaliya', yo:'Nẹtiwọọki Awọn Oluso Iṣan-omi', ig:'Netwọk Ndị Nlekota Mmiri Ozuzo', fr:'Réseau des Gardes d\'Inondation' },
    steps: {
      en: [
        { icon:'🦺', title:'What is the Vanguard Network?', body:'The Flood Marshals Vanguard is NIHSA\'s real-time coordination network. Verified Flood Marshals, NIHSA staff, and government officials use it to coordinate emergency response during flood events across Nigeria.' },
        { icon:'📡', title:'State & National Channels', body:'There are 38 channels — one for each of Nigeria\'s 36 states, one for FCT (Abuja), and one National command channel. Each channel is a live group chat for coordinators in that region.' },
        { icon:'✍️', title:'Who Can Post?', body:'Only verified Flood Marshals (Vanguard role), NIHSA Staff, government officials, and admins can send messages. Citizens and researchers can view all messages but cannot post.' },
        { icon:'👁️', title:'Viewing Without an Account', body:'Even without signing in, you can view all messages in all channels. This lets affected communities follow official situational updates in real time.' },
        { icon:'🔰', title:'Becoming a Flood Marshal', body:'During registration, check "I am a Flood Marshal" to apply for Vanguard status. NIHSA coordinators review and approve applications. Once approved, you can post in your state\'s channel.' },
        { icon:'📱', title:'Mobile-First Design', body:'The Vanguard chat is designed for field use on mobile. Messages appear instantly (via WebSocket). If the connection is lost, messages reload automatically when you reconnect.' },
      ],
      ha: [
        { icon:'🦺', title:'Menene Hanyar Vanguard?', body:'Masu Kiyaye Ambaliya Vanguard hanyar daidaitawa ta gaskiya ta NIHSA ce. Ana amfani da ita don daidaita martanin gaggawa yayin abubuwan ambaliya a Najeriya.' },
        { icon:'📡', title:'Tasoshin Jiha & Na Ƙasa', body:'Akwai tasoshi 38 — ɗaya ga kowane jiha 36 na Najeriya, ɗaya don FCT (Abuja), da ɗaya Tashar Umarni ta Ƙasa.' },
        { icon:'✍️', title:'Wanene Zai Iya Aika?', body:'Masu Kiyaye Ambaliya da aka tabbatar (Matsayin Vanguard), ma\'aikatan NIHSA, da ma\'aikatan gwamnati kawai za su iya aika sakonni. Ɗan ƙasa da masu bincike na iya duba sakonni kawai.' },
        { icon:'👁️', title:'Kallon Ba Tare da Asusun Ba', body:'Ko ba tare da shiga ba, kuna iya duba duk sakonni a duk tasoshi.' },
        { icon:'🔰', title:'Zama Mai Kiyaye Ambaliya', body:'Yayin rajista, duba "Ni ne Mai Kiyaye Ambaliya" don neman matsayin Vanguard. Masu duba NIHSA suna duba kuma sun amince da aikace-aikace.' },
        { icon:'📱', title:'Ƙirar Da Ta Fara Daga Wayar Hannu', body:'Tattaunawar Vanguard an tsara ta don amfani a filin akan wayar hannu. Sakonni suna bayyana nan take ta WebSocket.' },
      ],
      yo: [
        { icon:'🦺', title:'Kini Nẹtiwọọki Vanguard?', body:'Vanguard Awọn Oluso Iṣan-omi jẹ nẹtiwọọki isọdọkan gidi-akoko NIHSA. A lo lati ṣeto idahun pajawiri lakoko awọn iṣẹlẹ iṣan-omi kọja Naijiria.' },
        { icon:'📡', title:'Awọn Ikanni Ipinlẹ & Orilẹ-ede', body:'Awọn ikanni 38 wa — ọkan fun ipinlẹ kọọkan ninu awọn ipinlẹ 36 Naijiria, ọkan fun FCT (Abuja), ati ọkan Ikanni Aṣẹ Orilẹ-ede.' },
        { icon:'✍️', title:'Tani O Le Firanṣẹ?', body:'Awọn Oluso Iṣan-omi ti a fọwọsi (ipa Vanguard), Oṣiṣẹ NIHSA, ati awọn oṣiṣẹ ijọba nikan le firanṣẹ awọn ifiranṣẹ. Ara ilu le wo gbogbo awọn ifiranṣẹ.' },
        { icon:'👁️', title:'Wiwo Laisi Akaọọnti', body:'Paapaa laisi wiwọle, o le wo gbogbo awọn ifiranṣẹ ni gbogbo awọn ikanni.' },
        { icon:'🔰', title:'Di Oluso Iṣan-omi', body:'Lakoko iforukọsilẹ, samisi "Emi ni Oluso Iṣan-omi" lati wọle si ipo Vanguard. Awọn alakoso NIHSA ṣe atunyẹwo ati fọwọsi awọn ohun elo.' },
        { icon:'📱', title:'Apẹrẹ Alagbeka-Akọkọ', body:'Ibaraẹnisọrọ Vanguard jẹ apẹrẹ fun lilo aaye lori alagbeka. Awọn ifiranṣẹ han lẹsẹkẹsẹ nipasẹ WebSocket.' },
      ],
      ig: [
        { icon:'🦺', title:'Gịnị Bụ Netwọk Vanguard?', body:'Vanguard Ndị Nlekota Mmiri Ozuzo bụ netwọk nhazi oge-ndụ NIHSA. A na-eji ya nhazi nzaghachi ihe mberede n\'oge mmiri ozuzo n\'elu Naịjirịa.' },
        { icon:'📡', title:'Ọwa Steeti & Mba', body:'Ọwa 38 dị — otu maka steeti ọ bụla n\'ime steeti 36 Naịjirịa, otu maka FCT (Abuja), na otu Ọwa Iwu Mba.' },
        { icon:'✍️', title:'Onye Nwere Ike Iziga?', body:'Naanị Ndị Nlekota Mmiri Ozuzo kwadoro (ọrụ Vanguard), ndị ọrụ NIHSA, na ndị ọchịchọ gọọmentị nwere ike iziga ozi. Ndị ọchịchọ nwere ike ilelee ozi niile.' },
        { icon:'👁️', title:'Ilele Na-enweghị Akaụntụ', body:'Ọbụlagodi na-enweghị ịbanye, ị nwere ike ilelee ozi niile n\'ọwa niile.' },
        { icon:'🔰', title:'Ịbụ Onye Nlekota Mmiri Ozuzo', body:'N\'oge ndebanye aha, zaznachụ "Abụ m Onye Nlekota Mmiri Ozuzo" iji arịọ ọrụ Vanguard. Ndị nhazi NIHSA na-nyocha ma kwado ihe arịọ.' },
        { icon:'📱', title:'Nhazi Mbụ-ekwentị', body:'Mkparịta ụka Vanguard e mere ya maka ojiji n\'ebe ọrụ na ekwentị. Ozi na-apụta ozugbo site na WebSocket.' },
      ],
      fr: [
        { icon:'🦺', title:'Qu\'est-ce que le Réseau Vanguard?', body:'Le Vanguard des Gardes des Inondations est le réseau de coordination en temps réel de la NIHSA. Il est utilisé pour coordonner les réponses d\'urgence lors des inondations à travers le Nigeria.' },
        { icon:'📡', title:'Canaux d\'État et Nationaux', body:'Il y a 38 canaux — un pour chacun des 36 États du Nigeria, un pour le FCT (Abuja), et un canal de commandement national.' },
        { icon:'✍️', title:'Qui peut Envoyer?', body:'Seuls les Gardes des Inondations vérifiés (rôle Vanguard), le personnel NIHSA et les fonctionnaires gouvernementaux peuvent envoyer des messages. Les citoyens peuvent voir tous les messages.' },
        { icon:'👁️', title:'Voir sans Compte', body:'Même sans se connecter, vous pouvez voir tous les messages dans tous les canaux.' },
        { icon:'🔰', title:'Devenir Garde des Inondations', body:'Lors de l\'inscription, cochez "Je suis Garde des Inondations" pour demander le statut Vanguard. Les coordinateurs NIHSA examinent et approuvent les candidatures.' },
        { icon:'📱', title:'Conception Mobile d\'abord', body:'La discussion Vanguard est conçue pour une utilisation sur le terrain sur mobile. Les messages apparaissent instantanément via WebSocket.' },
      ],
    },
  },

  dashboard: {
    icon: '📊',
    title: { en:'Dashboard Guide', ha:'Jagoran Allon Bayanai', yo:'Itọsọna Paali Alaye', ig:'Nduzi Penu Ozi', fr:'Guide du Tableau de Bord' },
    steps: {
      en: [
        { icon:'📅', title:'Annual vs Weekly View', body:'Use the toggle at the top of the Dashboard to switch between Annual (AFO 2026) and Weekly forecast views. Annual shows the full-year 2026 flood outlook. Weekly shows the current 7-day forecast (updated when NIHSA uploads new data via Admin).' },
        { icon:'🏘️', title:'Exposure Cards', body:'The grid of cards shows how many communities, people, health centres, schools, hectares of farmland, km of roads, electricity infrastructure, and markets are at flood risk. Tap any card to see more detail.' },
        { icon:'🗺️', title:'State Breakdown', body:'Use the dropdown to filter data by state. Select a state to see only its exposure figures. At-risk links appear for Flood Animation and Flood Extent maps specific to that state.' },
        { icon:'🌊', title:'Flood Animation', body:'Tap "Flood Animation" to open an interactive animated map showing the expected progression of flooding across Nigeria for 2026. This is generated directly from NFFS model output.' },
        { icon:'📊', title:'Flood Extent Map', body:'Tap "Flood Extent Map" to open a detailed map showing which areas are expected to flood, colour-coded by depth (watch, high, critical, extreme). Powered by the P4 Annual NFFS model run.' },
        { icon:'🔄', title:'Data Currency', body:'Annual data comes from the AFO 2026 atlas stored on the NIHSA document server. Weekly data is uploaded by NIHSA administrators via the Admin panel → Map Layers → Weekly Forecast.' },
      ],
      ha: [
        { icon:'📅', title:'Ra\'ayi na Shekara & na Mako', body:'Yi amfani da toggle a sama don canza tsakanin ra\'ayi na Shekara (AFO 2026) da na Mako. Na Shekara yana nuna hasashen ambaliya na shekara 2026 gaba ɗaya. Na Mako yana nuna hasashen kwanaki 7 na yanzu.' },
        { icon:'🏘️', title:'Katunan Bayyanawa', body:'Jakar katunan tana nuna yawan al\'umma, mutane, cibiyoyin lafiya, makarantu, gonaki, hanyoyi, ababen more rayuwa na lantarki, da kasuwanni cikin haɗarin ambaliya.' },
        { icon:'🗺️', title:'Rarraba ta Jiha', body:'Yi amfani da zaɓi don tace bayanan ta jiha. Zaɓi jiha don ganin adadi bayyanarsa kawai.' },
        { icon:'🌊', title:'Motsin Ambaliya', body:'Danna "Motsin Ambaliya" don buɗe taswira mai motsi mai nuna ci gaban ambaliya da ake tsammani a Najeriya.' },
        { icon:'📊', title:'Taswira ta Fadawar Ambaliya', body:'Danna "Taswira ta Fadawar Ambaliya" don buɗe taswira mai cikakken bayani yana nuna wuraren da ake tsammani su yi ambaliya.' },
        { icon:'🔄', title:'Bayanan na Yanzu', body:'Bayanan shekara suna fitowa daga atlas AFO 2026. Bayanan mako ana loda su ta masu kulawa ta Admin panel.' },
      ],
      yo: [
        { icon:'📅', title:'Iwoye Lọdọọdún & Ọsẹ', body:'Lo iyipada ni oke lati yipada laarin Lọdọọdún (AFO 2026) ati awọn iwoye asọtẹlẹ Ọsẹ. Lọdọọdún fihan asọtẹlẹ iṣan-omi ọdun 2026 ni kikun.' },
        { icon:'🏘️', title:'Awọn Kaadi Ifihan', body:'Akoj awọn kaadi fihan melo ni awọn agbegbe, eniyan, awọn ile-iṣẹ ilera, awọn ile-iwe, hektari ilẹ oko, km ti awọn opopona, ati awọn ọja wa ninu ewu iṣan-omi.' },
        { icon:'🗺️', title:'Ipin Ipinlẹ', body:'Lo akojọ silẹ lati ṣàlẹmọ data nipasẹ ipinlẹ. Yan ipinlẹ kan lati wo awọn nọmba ifihan rẹ nikan.' },
        { icon:'🌊', title:'Agbeka Iṣan-omi', body:'Tẹ "Agbeka Iṣan-omi" lati ṣii maapu oni-gbe ti n fihan ilọsiwaju iṣan-omi ti a nireti kọja Naijiria.' },
        { icon:'📊', title:'Maapu Iye Iṣan-omi', body:'Tẹ "Maapu Iye Iṣan-omi" lati ṣii maapu ti o fihan awọn agbegbe ti a nireti lati rì.' },
        { icon:'🔄', title:'Iye Aye Data', body:'Data lọdọọdún wa lati atlas AFO 2026. Data ọsẹ jẹ gbesoke nipasẹ awọn alabojuto NIHSA nipasẹ panẹli Admin.' },
      ],
      ig: [
        { icon:'📅', title:'Ọhụụ Ọdụn & Izu', body:'Jiri toggle n\'elu iji gbanwee n\'etiti ọhụụ Ọdụn (AFO 2026) na Izu. Ọdụn na-egosi atụmatụ mmiri ozuzo 2026 zuru oke. Izu na-egosi atụmatụ ụbọchị 7 ugbu a.' },
        { icon:'🏘️', title:'Kaadị Mficha', body:'Ọnụọgụ kaadị na-egosi ọtụtụ obodo, ndị mmadụ, ụlọ ọgwụ, ụlọ akwụkwọ, hekta ala ugbo, km okporo ụzọ, na ahia dị n\'ihe ize ndụ mmiri ozuzo.' },
        { icon:'🗺️', title:'Nkewa Steeti', body:'Jiri dropụdaụn iji lelee data site n\'steeti. Họọ steeti iji hụ naanị ọnụọgụ mfiche ya.' },
        { icon:'🌊', title:'Ngagharị Mmiri Ozuzo', body:'Kụọ "Ngagharị Mmiri Ozuzo" iji mepee maapu na-akpọ egwu na-egosi usoro mmiri ozuzo a tụ anya na Naịjirịa.' },
        { icon:'📊', title:'Maapu Ọdịdị Mmiri Ozuzo', body:'Kụọ "Maapu Ọdịdị Mmiri Ozuzo" iji mepee maapu zuru oke na-egosi mpaghara a na-atụ anya ọ ga-amiri.' },
        { icon:'🔄', title:'Oge Data', body:'Data ọdụn na-esite n\'atlas AFO 2026. Data izu ndị ọchịchọ NIHSA na-ebutere site na panẹl Admin.' },
      ],
      fr: [
        { icon:'📅', title:'Vue Annuelle et Hebdomadaire', body:'Utilisez le bouton de basculement en haut pour passer entre les vues Annuelle (AFO 2026) et Hebdomadaire. Annuelle montre les perspectives d\'inondation complètes 2026.' },
        { icon:'🏘️', title:'Cartes d\'Exposition', body:'La grille de cartes montre combien de communautés, personnes, centres de santé, écoles, hectares de terres agricoles, km de routes, et marchés sont à risque d\'inondation.' },
        { icon:'🗺️', title:'Répartition par État', body:'Utilisez la liste déroulante pour filtrer les données par État. Sélectionnez un État pour voir uniquement ses chiffres d\'exposition.' },
        { icon:'🌊', title:'Animation d\'Inondation', body:'Appuyez sur "Animation d\'Inondation" pour ouvrir une carte animée interactive montrant la progression attendue des inondations au Nigeria.' },
        { icon:'📊', title:'Carte d\'Étendue des Inondations', body:'Appuyez sur "Carte d\'Étendue des Inondations" pour ouvrir une carte détaillée montrant les zones attendues à inonder, codées par couleur selon la profondeur.' },
        { icon:'🔄', title:'Actualité des Données', body:'Les données annuelles proviennent de l\'atlas AFO 2026. Les données hebdomadaires sont téléchargées par les administrateurs NIHSA via le panneau Admin.' },
      ],
    },
  },
};

// ── Topic definitions for the selector ────────────────────────────────────────
const TOPICS = [
  { key:'general',   icon:'📱' },
  { key:'map',       icon:'🗺️' },
  { key:'reporting', icon:'🚨' },
  { key:'alerts',    icon:'⚠️' },
  { key:'vanguard',  icon:'🦺' },
  { key:'dashboard', icon:'📊' },
];

// ── UI chrome translations (buttons and subtitle) ─────────────────────────────
const UI_LABELS = {
  en: { back:'← Back', next:'Next →', done:'✓ Got it', subtitle:'NIHSA Flood Intelligence Platform', stepOf:'of' },
  ha: { back:'← Baya', next:'Gaba →', done:'✓ Na Fahimta', subtitle:'NIHSA Tsarin Hankali na Ambaliya', stepOf:'na' },
  yo: { back:'← Sẹ́yìn', next:'Iwaju →', done:'✓ Mo Gbọ', subtitle:'NIHSA Eto Oye Iṣan-omi', stepOf:'ninu' },
  ig: { back:'← Azụ', next:'Ihu →', done:'✓ Aghọtara M', subtitle:'NIHSA Sistemụ Amamịhe Mmiri Ozuzo', stepOf:'n\'ime' },
  fr: { back:'← Retour', next:'Suivant →', done:'✓ Compris', subtitle:'NIHSA Intelligence des Inondations', stepOf:'sur' },
};

// ── Main component ─────────────────────────────────────────────────────────────
const TutorialModal = ({ topic: initialTopic = 'general', language = 'en', onClose }) => {
  const [topic, setTopic]   = useState(initialTopic);
  const [step,  setStep]    = useState(0);

  const lang = CONTENT[topic]?.steps?.[language] ? language : 'en';
  const data  = CONTENT[topic];
  const steps = data?.steps?.[lang] || [];
  const title = data?.title?.[lang] || data?.title?.en || topic;
  const currentStep = steps[step] || {};
  const totalSteps  = steps.length;

  // Reset step when topic changes
  const changeTopic = (t) => { setTopic(t); setStep(0); };

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'rgba(0,0,0,0.85)',
      backdropFilter:'blur(6px)',
      zIndex:10000,
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:16,
    }}>
      <div style={{
        background:C.surface,
        border:`1px solid ${C.border}`,
        borderRadius:20,
        maxWidth:480,
        width:'100%',
        maxHeight:'88vh',
        display:'flex', flexDirection:'column',
        boxShadow:'0 24px 64px rgba(0,0,0,0.6)',
        overflow:'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding:'16px 20px',
          borderBottom:`1px solid ${C.border}`,
          background:`linear-gradient(135deg,${C.primary}12,${C.info}06)`,
          display:'flex', alignItems:'center', gap:12,
        }}>
          <span style={{fontSize:28}}>{data?.icon || '📖'}</span>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:15,fontWeight:700,color:C.bright,lineHeight:1.2}}>{title}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:2}}>{(UI_LABELS[lang] || UI_LABELS.en).subtitle}</div>
          </div>
          <button onClick={onClose} style={{
            background:'none',border:'none',color:C.muted,
            fontSize:22,cursor:'pointer',padding:'2px 6px',
            borderRadius:6,flexShrink:0,
          }}>✕</button>
        </div>

        {/* ── Topic selector ── */}
        <div style={{
          display:'flex', gap:6, padding:'10px 14px',
          overflowX:'auto', borderBottom:`1px solid ${C.border}`,
          scrollbarWidth:'none',
        }}>
          {TOPICS.map(tp => (
            <button key={tp.key} onClick={() => changeTopic(tp.key)}
              style={{
                display:'flex', alignItems:'center', gap:4,
                padding:'5px 10px', borderRadius:20, border:'none',
                background: topic===tp.key ? C.primary : C.s2,
                color: topic===tp.key ? '#fff' : C.muted,
                fontSize:11, fontWeight: topic===tp.key ? 700 : 400,
                cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
                transition:'all 0.15s',
              }}>
              {tp.icon}
            </button>
          ))}
        </div>

        {/* ── Step content ── */}
        <div style={{flex:1, overflowY:'auto', padding:'20px 20px 8px'}}>
          {/* Progress dots */}
          <div style={{display:'flex', justifyContent:'center', gap:6, marginBottom:16}}>
            {steps.map((_,i) => (
              <button key={i} onClick={()=>setStep(i)} style={{
                width: i===step ? 20 : 8,
                height:8, borderRadius:4, border:'none',
                background: i===step ? C.primary : C.border,
                cursor:'pointer', transition:'all 0.2s', padding:0,
              }}/>
            ))}
          </div>

          {/* Step card */}
          <div style={{
            background:C.s2, borderRadius:14,
            border:`1px solid ${C.border}`, padding:'18px 18px',
            marginBottom:12, minHeight:160,
          }}>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12}}>
              <span style={{
                fontSize:28, width:44, height:44, borderRadius:12,
                background:`${C.primary}18`, display:'flex',
                alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>{currentStep.icon}</span>
              <div style={{fontSize:14, fontWeight:700, color:C.accent, lineHeight:1.3}}>
                {currentStep.title}
              </div>
            </div>
            <div style={{fontSize:13, color:C.text, lineHeight:1.65}}>
              {currentStep.body}
            </div>
          </div>

          {/* Step counter */}
          <div style={{textAlign:'center', fontSize:11, color:C.muted, marginBottom:8}}>
            {step+1} {(UI_LABELS[lang] || UI_LABELS.en).stepOf} {totalSteps}
          </div>
        </div>

        {/* ── Footer navigation ── */}
        <div style={{
          padding:'12px 20px',
          borderTop:`1px solid ${C.border}`,
          display:'flex', gap:10,
        }}>
          <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step===0}
            style={{
              flex:1, padding:'11px 0',
              background: step===0 ? C.s2 : C.s3,
              border:`1px solid ${C.border}`, borderRadius:10,
              color: step===0 ? C.muted : C.text,
              fontSize:13, fontWeight:600, cursor: step===0 ? 'default' : 'pointer',
              transition:'all 0.15s',
            }}>
            {(UI_LABELS[lang] || UI_LABELS.en).back}
          </button>

          {step < totalSteps - 1 ? (
            <button onClick={() => setStep(s => Math.min(totalSteps-1, s+1))}
              style={{
                flex:2, padding:'11px 0',
                background:`linear-gradient(135deg,${C.primary},#0284C7)`,
                border:'none', borderRadius:10,
                color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
              }}>
              {(UI_LABELS[lang] || UI_LABELS.en).next}
            </button>
          ) : (
            <button onClick={onClose}
              style={{
                flex:2, padding:'11px 0',
                background:`linear-gradient(135deg,${C.success},#059669)`,
                border:'none', borderRadius:10,
                color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
              }}>
              {(UI_LABELS[lang] || UI_LABELS.en).done}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
