/* ========== STATE ========== */
const state = {
  session: { sessionName:"", nickname:"", role:null, duration:90, pronouns:[] },
  safety: {
    trafficLight:false, safeword:"", gesture:"",
    nuditySelf:[], nudityPartner:[],
    painDesired:0, painTolerable:0,
    marksPolicy:[], photoPolicy:[],
    hardLimits:"", healthPhysical:"", healthMental:""
  },
  refinements:{}, // per group
  text:{ sensitivityAreas:"", forbiddenSub:"", forbiddenDom:"" },
  sets:{
    roleplayScenes:[], domLanguage:[], nicknamesSub:[],
    subLanguage:[], titlesDom:[],
    aftercareNeeds:[], aftercareDuration:[], postSession:[]
  },
  activities:{},
  consent: { name:"", date:"", signatureDataUrl:"" }
};
const STORAGE_KEY = 'planner_sessions_v1';
const SESSION_SCHEMA_VERSION = 1;
const urlParams = new URLSearchParams(window.location.search);
const sessionIdFromUrl = urlParams.get('sessionId') || '';
const startChapterFromUrl = urlParams.get('startChapter') || '';
const autoShareFromUrl = urlParams.get('autoShare') || '';
const modeFromUrl = urlParams.get('mode') || '';
const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
const sharedPayloadFromUrl = urlParams.get('shared') || hashParams.get('shared') || '';
const shareIdFromUrl = urlParams.get('shareId') || '';
let activeSessionId = sessionIdFromUrl || `planner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* ========== HELPERS ========== */
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const clamp = (n,min,max)=> Math.max(min, Math.min(max,n));
function encodeSharePayload(payload){
  try {
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  } catch {
    return '';
  }
}
function decodeSharePayload(raw){
  if (!raw) return null;
  try {
    const input = String(raw).replace(/-/g, '+').replace(/_/g, '/');
    const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch {
    return null;
  }
}
async function createServerShareId(payload){
  try {
    const endpoint = new URL('../api/planner-share', window.location.href);
    const resp = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload })
    });
    if (!resp.ok) return '';
    const data = await resp.json().catch(() => null);
    return data && typeof data.id === 'string' ? data.id : '';
  } catch {
    return '';
  }
}
async function fetchSharedPayloadById(shareId){
  if (!shareId) return null;
  try {
    const endpoint = new URL('../api/planner-share', window.location.href);
    endpoint.searchParams.set('id', shareId);
    const resp = await fetch(endpoint.toString(), { method: 'GET' });
    if (!resp.ok) return null;
    const data = await resp.json().catch(() => null);
    return data && data.payload && typeof data.payload === 'object' ? data.payload : null;
  } catch {
    return null;
  }
}
function pruneObject(value){
  if (Array.isArray(value)) {
    const arr = value
      .map(pruneObject)
      .filter(v => !(v == null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)));
    return arr.length ? arr : null;
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const pv = pruneObject(v);
      if (pv == null || pv === '' || (Array.isArray(pv) && pv.length === 0) || (typeof pv === 'object' && !Array.isArray(pv) && Object.keys(pv).length === 0)) continue;
      out[k] = pv;
    }
    return Object.keys(out).length ? out : null;
  }
  return value;
}
function buildPortablePlannerState(){
  const compactActivities = {};
  for (const [id, item] of Object.entries(state.activities || {})) {
    if (!item || typeof item !== 'object') continue;
    const status = item.status ?? null;
    const intensity = Number(item.intensity || 0);
    const notes = String(item.notes || '').trim();
    if (status == null && intensity <= 0 && !notes) continue;
    compactActivities[id] = {
      ...(status != null ? { status } : {}),
      ...(intensity > 0 ? { intensity } : {}),
      ...(notes ? { notes } : {})
    };
  }
  const compact = {
    session: state.session,
    safety: state.safety,
    refinements: state.refinements,
    text: state.text,
    sets: state.sets,
    activities: compactActivities,
    consent: {
      name: state.consent?.name || '',
      date: state.consent?.date || ''
    }
  };
  return pruneObject(compact) || {};
}
function buildSharePayload(){
  const fullState = JSON.parse(JSON.stringify(state));
  return {
    plannerState: fullState
  };
}

function perspectiveText(){
  if (state.session.role === 'dom') return '• לתת';
  if (state.session.role === 'sub') return '• לקבל';
  return '';
}
function updatePerspectiveBadges(){
  $$('.section-title .perspective').forEach(el => el.textContent = perspectiveText());
}

/* ========== NAVIGATION ========== */
function showChapter(id){
  $$('.chapter').forEach(sec => sec.classList.remove('visible'));
  const el = document.getElementById(id);
  if (el){ el.classList.add('visible'); window.scrollTo({top:0, behavior:'smooth'}); }
  $$('.step-btn').forEach(b => b.classList.toggle('active', b.dataset.target===id));
  if (id==='chapter-8') {
    renderSummary();
    initializeSignaturePad(true);
  }
}
function setupStepper(){
  $$('.step-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const target = btn.dataset.target;
      showChapter(target);
      setTimeout(()=>{ const el = document.getElementById(target); el && el.focus(); }, 250);
    });
  });
}
function setupPrevNext(){
  $$('.chapter').forEach((sec, idx, arr)=>{
    const prevBtn = sec.querySelector('[data-prev]');
    const nextBtn = sec.querySelector('[data-next]');
    if (prevBtn) prevBtn.addEventListener('click', ()=> showChapter(arr[clamp(idx-1,0,arr.length-1)].id));
    if (nextBtn) nextBtn.addEventListener('click', ()=> showChapter(arr[clamp(idx+1,0,arr.length-1)].id));
  });
}
function setupCollapsibleSubsections(){
  $$('.activity-group').forEach(group => {
    const titleLine = group.querySelector('.title-line');
    if (!titleLine) return;
    if (titleLine.dataset.collapsibleBound === 'true') return;
    titleLine.dataset.collapsibleBound = 'true';
    titleLine.setAttribute('role', 'button');
    titleLine.setAttribute('tabindex', '0');
    titleLine.setAttribute('aria-expanded', 'false');
    const sectionText = titleLine.textContent.replace(/\s+/g, ' ').trim();
    titleLine.setAttribute('aria-label', `פתיחה או סגירה של מקטע: ${sectionText}`);
    const controlledIds = [];
    Array.from(group.children).forEach((child, idx) => {
      if (child === titleLine) return;
      if (!child.id) child.id = `${group.id || group.dataset.group || 'group'}-content-${idx}`;
      controlledIds.push(child.id);
    });
    if (controlledIds.length) titleLine.setAttribute('aria-controls', controlledIds.join(' '));
    group.classList.add('is-collapsed');
    const toggle = () => {
      const willOpen = group.classList.contains('is-collapsed');
      group.classList.toggle('is-collapsed', !willOpen);
      titleLine.setAttribute('aria-expanded', String(willOpen));
    };
    titleLine.addEventListener('click', toggle);
    titleLine.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });
}

function listSessions(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(validateSessionRecord)
      .filter(Boolean);
  } catch {
    return [];
  }
}
function saveSessions(rows){
  const clean = Array.isArray(rows) ? rows.slice(0, 100) : [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
}
function loadSessionById(id){
  if (!id) return null;
  return listSessions().find(s => s && s.id === id) || null;
}
function validateSessionRecord(input){
  if (!input || typeof input !== 'object') return null;
  const migrated = migrateLegacySessionRecord(input);
  if (!migrated || typeof migrated !== 'object') return null;
  if (typeof migrated.id !== 'string' || !migrated.id.trim()) return null;
  if (!migrated.plannerState || typeof migrated.plannerState !== 'object') return null;
  const rawVersion = migrated.schemaVersion == null ? 1 : Number(migrated.schemaVersion);
  if (Number.isFinite(rawVersion) && rawVersion > SESSION_SCHEMA_VERSION) return null;
  const now = new Date().toISOString();
  return {
    ...migrated,
    id: String(migrated.id),
    schemaVersion: Number.isFinite(rawVersion) ? rawVersion : 1,
    createdAt: typeof migrated.createdAt === 'string' ? migrated.createdAt : now,
    updatedAt: typeof migrated.updatedAt === 'string' ? migrated.updatedAt : (typeof migrated.createdAt === 'string' ? migrated.createdAt : now)
  };
}
function migrateLegacySessionRecord(saved){
  if (!saved || typeof saved !== 'object') return saved;
  if (!saved.plannerState || typeof saved.plannerState !== 'object') return saved;
  const out = { ...saved };
  const nestedSession = out.plannerState.session && typeof out.plannerState.session === 'object'
    ? out.plannerState.session
    : {};
  if (!out.sessionName && nestedSession.sessionName) out.sessionName = String(nestedSession.sessionName).trim();
  if (!out.nickname && nestedSession.nickname) out.nickname = String(nestedSession.nickname).trim();
  if (!out.role && nestedSession.role) out.role = nestedSession.role;
  if (!Number.isFinite(Number(out.duration)) && Number.isFinite(Number(nestedSession.duration))) out.duration = Number(nestedSession.duration);
  return out;
}
function mergeStateFromSaved(saved){
  if (!saved || typeof saved !== 'object') return;
  if (saved.session && typeof saved.session === 'object') Object.assign(state.session, saved.session);
  if (saved.safety && typeof saved.safety === 'object') Object.assign(state.safety, saved.safety);
  if (saved.refinements && typeof saved.refinements === 'object') Object.assign(state.refinements, saved.refinements);
  if (saved.text && typeof saved.text === 'object') Object.assign(state.text, saved.text);
  if (saved.sets && typeof saved.sets === 'object') Object.assign(state.sets, saved.sets);
  if (saved.activities && typeof saved.activities === 'object') state.activities = saved.activities;
  if (saved.consent && typeof saved.consent === 'object') Object.assign(state.consent, saved.consent);
  // Defensive normalization for older/partial session payloads.
  if (!Array.isArray(state.session.pronouns)) state.session.pronouns = [];
  if (!Number.isFinite(state.session.duration)) state.session.duration = 90;
  ['nuditySelf','nudityPartner','marksPolicy','photoPolicy'].forEach(k => {
    if (!Array.isArray(state.safety[k])) state.safety[k] = [];
  });
  ['roleplayScenes','domLanguage','nicknamesSub','subLanguage','titlesDom','aftercareNeeds','aftercareDuration','postSession'].forEach(k => {
    if (!Array.isArray(state.sets[k])) state.sets[k] = [];
  });
  if (!state.activities || typeof state.activities !== 'object') state.activities = {};
}
function applyStateToUi(){
  $('#sessionName').value = state.session.sessionName || '';
  $('#nickname').value = state.session.nickname || '';
  $('#duration').value = Number.isFinite(state.session.duration) ? state.session.duration : 90;
  $('#trafficLightChk').checked = !!state.safety.trafficLight;
  $('#safeword').value = state.safety.safeword || '';
  $('#safegesture').value = state.safety.gesture || '';
  $('#hardLimits').value = state.safety.hardLimits || '';
  $('#healthPhysical').value = state.safety.healthPhysical || '';
  $('#healthMental').value = state.safety.healthMental || '';
  $('#sensitivityAreas').value = state.text.sensitivityAreas || '';
  $('#forbiddenSub').value = state.text.forbiddenSub || '';
  $('#forbiddenDom').value = state.text.forbiddenDom || '';
  ['painDesired','painTolerable'].forEach(id=>{
    const input = document.getElementById(id);
    const out = document.querySelector(`.intensity-value[data-for="${id}"]`);
    const val = id === 'painDesired' ? state.safety.painDesired : state.safety.painTolerable;
    if (input) input.value = String(Number.isFinite(val) ? val : 0);
    if (out) out.textContent = `${Number.isFinite(val) ? val : 0}/10`;
  });
  hydrateChipGroupsFromState();
  updatePerspectiveBadges();
  const consentNameInput = document.getElementById('consentName');
  const consentDateInput = document.getElementById('consentDate');
  if (consentNameInput) {
    consentNameInput.value = state.consent.name || state.session.nickname || '';
  }
  if (consentDateInput) {
    consentDateInput.value = state.consent.date || currentDateDDMMYYYY();
  }
}
function selectedValuesForField(field){
  if (field === 'role') return state.session.role ? [state.session.role] : [];
  if (Array.isArray(state.session[field])) return state.session[field];
  if (Array.isArray(state.safety[field])) return state.safety[field];
  if (Array.isArray(state.sets[field])) return state.sets[field];
  return [];
}
function ensureChipExists(group, value){
  const existing = Array.from(group.querySelectorAll('.chip')).find(ch => ch.dataset.value === value);
  if (existing) return existing;
  const otherBtn = group.querySelector('.chip[data-value="__other__"]');
  if (!otherBtn) return null;
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.dataset.value = value;
  chip.textContent = value;
  otherBtn.insertAdjacentElement('beforebegin', chip);
  return chip;
}
function hydrateChipGroupsFromState(){
  $$('.chip-group').forEach(group => {
    const field = group.dataset.field;
    if (!field || field === 'summaryFilter') return;
    const selected = selectedValuesForField(field).map(v => String(v)).filter(Boolean);
    group.querySelectorAll('.chip.active').forEach(ch => ch.classList.remove('active'));
    selected.forEach(value => {
      const chip = ensureChipExists(group, value);
      if (chip) chip.classList.add('active');
    });
  });
}
function saveActiveSession(){
  const sessions = listSessions();
  const ix = sessions.findIndex(s => s && s.id === activeSessionId);
  const now = new Date().toISOString();
  const consentName = (document.getElementById('consentName')?.value || '').trim();
  const consentDate = (document.getElementById('consentDate')?.value || '').trim();
  const signatureDataUrl = (() => {
    try {
      const canvas = document.getElementById('signatureCanvas');
      return canvas && typeof canvas.toDataURL === 'function' ? canvas.toDataURL('image/png') : '';
    } catch {
      return '';
    }
  })();
  state.consent.name = consentName;
  state.consent.date = consentDate;
  state.consent.signatureDataUrl = signatureDataUrl;
  const payload = {
    id: activeSessionId,
    schemaVersion: SESSION_SCHEMA_VERSION,
    title: (state.session.sessionName || state.session.nickname || 'סשן ללא כותרת').trim(),
    sessionName: (state.session.sessionName || '').trim(),
    nickname: (state.session.nickname || '').trim(),
    role: state.session.role || null,
    duration: Number.isFinite(state.session.duration) ? state.session.duration : 90,
    createdAt: ix >= 0 ? sessions[ix].createdAt : now,
    updatedAt: now,
    summarySnapshot: {
      role: state.session.role || null,
      duration: Number.isFinite(state.session.duration) ? state.session.duration : 0
    },
    plannerState: {
      session: state.session,
      safety: state.safety,
      refinements: state.refinements,
      text: state.text,
      sets: state.sets,
      activities: state.activities,
      consent: state.consent
    }
  };
  if (ix >= 0) sessions[ix] = payload; else sessions.push(payload);
  saveSessions(sessions);
}

/* ========== INFO TEXTS (EXACT CONTENT) ========== */
const infoTexts = {
  trafficLight: 'שיטת תקשורת פשוטה ויעילה לשימוש תוך כדי סשן. ירוק (Green) מאשר שהכל בסדר, צהוב (Yellow) מסמן צורך בהאטה או בדיקה, ואדום (Red) הוא עצירה מוחלטת.',
  safeword: 'מילה מוסכמת מראש שעוצרת את הסצנה באופן מיידי, ללא שאלות. היא חיונית כדי להבדיל בין התנגדות שהיא חלק מהמשחק לבין רצון אמיתי לעצור.',
  gesture: 'סימן פיזי מוסכם שמשמש כמילת ביטחון כשאי אפשר לדבר (למשל, עם גאג). חשוב לבחור מחווה ברורה כמו שלוש טפיחות מכוונות.',
  pain: 'סף רצוי הוא רמת הכאב המהנה. סף נסבל הוא הגבול העליון המוחלט של כאב. הגדרת שניהם מסייעת לנווט את הסשן בצורה בטוחה.',
  hardLimits: '"לא" מוחלט ובלתי ניתן למשא ומתן. אלו פעולות, מילים או סיטואציות שאינך מוכן/ה להשתתף בהן בשום תנאי.',
  health: 'שיתוף מידע רפואי (אסתמה, אלרגיות, פציעות) ונפשי (טריגרים, טראומות) הוא קריטי לבטיחות וניהול סשן רגיש ואחראי.',
  impact: 'כל משחק הכולל הכאה או הצלפה מבוקרת על הגוף ליצירת תחושה פיזית ופסיכולוגית.',
  paddle: 'כלי שטוח ורחב היוצר תחושת "חבטה" (Thud) שטחית.',
  caning: 'מקל דק וגמיש היוצר כאב חד, צורב וממוקד. זוהי פרקטיקה מתקדמת הדורשת דיוק רב.',
  spreader: 'מוט קשיח המגביל תנועה על ידי החזקת הגפיים במצב פשוק, ומגביר תחושת פגיעות וחשיפה.',
  ballgag: 'אביזר ריסון המונע דיבור. בטיחות קריטית: יש לוודא נשימה פתוחה מהאף ומחווה פיזית לעצירה.',
  pinwheel: 'גלגל עם מחטים קטנות היוצר תחושה "חשמלית" ודוקרנית על העור, אך אינו מיועד לחדור אותו.',
  eStim: 'שימוש במכשירי גירוי חשמלי ייעודיים. פרקטיקה בסיכון גבוה: יש להשתמש רק בציוד תקני ולעולם לא מעל קו המותניים.',
  needles: 'פרקטיקה מתקדמת של החדרת מחטים סטריליות לשכבת העור העליונה. דורשת ידע והקפדה מוחלטת על היגיינה.',
  breath: 'פרקטיקה בסיכון גבוה ביותר העלולה לגרום לנזק מוחי או מוות. דורשת ניסיון רב, אמון מוחלט ופרוטוקול בטיחות נוקשה.',
  choking: 'פרקטיקה בסיכון גבוה הכוללת לחץ על הצוואר ואינה מומלצת למתחילים כלל.',
  cnc: 'משחק תפקידים מתקדם בו "לא" הוא חלק מהסצנה, אך מילת הביטחון האמיתית תמיד עוצרת הכל. דורש אמון ותיאום ציפיות מוחלט.',
  cuck: 'פנטזיה או פרקטיקה של עוררות מינית מצפייה בפרטנר/ית עם אדם אחר, לרוב בהקשר של השפלה.',
  discipline: 'מערכת כללים מוסכמת שהפרתם מובילה ל"ענישה". המטרה היא לרוב אימון וחיזוק הדינמיקה.',
  punishment: 'התוצאה של הפרת כלל. יכולה להיות "כיפית" (Funishment) או ענישה אמיתית, לפי מה שסוכם מראש.',
  groupScenes: 'סצנה המערבת יותר משני אנשים. דורשת רמה גבוהה של תקשורת ותיאום הסכמות מול כל המעורבים.',
  primal: 'פריימל הוא סגנון דינמי המבוסס על אינסטינקטים בסיסיים ולעיתים מאבקי כוח טבעיים. יכול לכלול התגוששות, נהמות או נשיכות - רק במסגרת הסכמה ברורה.',
  mummification: 'ממיפיקציה היא עטיפה מלאה של הגוף (לרוב בניילון נצמד או טייפ). זו פרקטיקה מגבילה מאוד ודורשת בדיקות נשימה, זרימת דם ובטיחות מתקדמת.',
  cutting: 'חיתוך הוא פגיעה מכוונת בעור כחלק ממשחק. זו פרקטיקה בסיכון גבוה מאוד הדורשת ידע רפואי, סטריליות מוחלטת והבנת סיכונים פיזיים ורגשיים.',
  aftercare: 'תהליך התמיכה הפיזית והרגשית לאחר סיום הסשן. חלק חיוני ובלתי נפרד ממשחק אחראי.',
  postSession: 'תיאום ציפיות לגבי התקשורת לאחר סיום המפגש, למניעת אי-הבנות וניהול רגשי בריא.',
  summary: 'ריכוז כל ההסכמות מהטופס. מומלץ לעבור עליו יחד כצ\'ק-אין אחרון לפני תחילת הסשן.'
};

function setupInfoButtons(){
  const infoAriaLabels = {
    trafficLightInfo: 'מידע על תקשורת רמזור',
    safewordInfo: 'מידע על מילת ביטחון',
    gestureInfo: 'מידע על מחווה לעצירה',
    painInfo: 'מידע על ספי כאב',
    hardLimitsInfo: 'מידע על גבולות קשיחים',
    healthInfo: 'מידע על בריאות פיזית ונפשית',
    impactInfo: 'מידע על אימפקט',
    groupScenesInfo: 'מידע על סצנות מרובות משתתפים',
    aftercareInfoTop: 'מידע כללי על אפטר-קר',
    aftercareInfo: 'מידע על ציפיות אחרי מפגש',
    summaryInfo: 'מידע על מסך הסיכום'
  };
  const infoById = {
    trafficLightInfo: 'trafficLight',
    safewordInfo: 'safeword',
    gestureInfo: 'gesture',
    painInfo: 'pain',
    hardLimitsInfo: 'hardLimits',
    healthInfo: 'health',
    impactInfo: 'impact',
    groupScenesInfo: 'groupScenes',
    aftercareInfoTop: 'aftercare',
    aftercareInfo: 'postSession',
    summaryInfo: 'summary'
  };
  Object.entries(infoById).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = infoTexts[key] || '';
  });

  $$('.info-btn').forEach(btn=>{
    const id = btn.dataset.infoTarget;
    const panel = id ? document.getElementById(id) : null;
    if (panel && !panel.textContent.trim()) {
      panel.textContent = 'מידע נוסף יתווסף בהמשך.';
      console.warn('[planner-he] missing info text for target:', id);
    }
    if (id) btn.setAttribute('aria-controls', id);
    btn.setAttribute('aria-label', infoAriaLabels[id] || 'מידע נוסף');
    btn.setAttribute('aria-expanded', panel && !panel.hidden ? 'true' : 'false');
    if (panel) {
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-live', 'polite');
    }
    btn.addEventListener('click', (event)=>{
      event.stopPropagation();
      if (!panel) return;
      panel.hidden = !panel.hidden;
      btn.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
    });
  });
}

/* ========== BASIC INPUTS & SLIDERS ========== */
function bindBasicInputs(){
  $('#sessionName').addEventListener('input', e => state.session.sessionName = e.target.value.trim());
  $('#nickname').addEventListener('input', e => state.session.nickname = e.target.value.trim());
  $('#duration').addEventListener('input', e => state.session.duration = parseInt(e.target.value||'0',10));

  $('#trafficLightChk').addEventListener('change', e => state.safety.trafficLight = e.target.checked);
  $('#safeword').addEventListener('input', e => state.safety.safeword = e.target.value.trim());
  $('#safegesture').addEventListener('input', e => state.safety.gesture = e.target.value.trim());
  $('#hardLimits').addEventListener('input', e => state.safety.hardLimits = e.target.value);
  $('#healthPhysical').addEventListener('input', e => state.safety.healthPhysical = e.target.value);
  $('#healthMental').addEventListener('input', e => state.safety.healthMental = e.target.value);

  $('#sensitivityAreas').addEventListener('input', e => state.text.sensitivityAreas = e.target.value);
  $('#forbiddenSub').addEventListener('input', e => state.text.forbiddenSub = e.target.value);
  $('#forbiddenDom').addEventListener('input', e => state.text.forbiddenDom = e.target.value);
  const consentNameInput = $('#consentName');
  if (consentNameInput) {
    consentNameInput.addEventListener('input', e => state.consent.name = e.target.value.trim());
  }
  const consentDateInput = $('#consentDate');
  if (consentDateInput) {
    consentDateInput.addEventListener('input', e => state.consent.date = e.target.value.trim());
  }
}

function setupPainSliders(){
  const desired = document.getElementById('painDesired');
  const tolerable = document.getElementById('painTolerable');
  const desiredOut = document.querySelector('.intensity-value[data-for="painDesired"]');
  const tolerableOut = document.querySelector('.intensity-value[data-for="painTolerable"]');
  if (!desired || !tolerable || !desiredOut || !tolerableOut) return;

  desired.min = '0'; desired.max = '10';
  tolerable.min = '0'; tolerable.max = '10';
  desired.value = String(clamp(parseInt(state.safety.painDesired || 0, 10), 0, 10));
  tolerable.value = String(clamp(parseInt(state.safety.painTolerable || 0, 10), 0, 10));

  function syncDesired(){
    const d = clamp(parseInt(desired.value || '0', 10), 0, 10);
    desired.value = String(d);
    desiredOut.textContent = `${d}/10`;
    state.safety.painDesired = d;
    const t = clamp(parseInt(tolerable.value || '0', 10), 0, 10);
    if (d > t) {
      tolerable.value = String(d);
      tolerableOut.textContent = `${d}/10`;
      state.safety.painTolerable = d;
    }
  }
  function syncTolerable(){
    const d = clamp(parseInt(desired.value || '0', 10), 0, 10);
    let t = clamp(parseInt(tolerable.value || '0', 10), 0, 10);
    if (t < d) t = d;
    tolerable.value = String(t);
    tolerableOut.textContent = `${t}/10`;
    state.safety.painTolerable = t;
  }

  desired.addEventListener('input', syncDesired);
  tolerable.addEventListener('input', syncTolerable);
  syncDesired();
  syncTolerable();
}

/* ========== CHIPS (incl. Other -> active) ========== */
function setupChipGroups(){
  $$('.chip-group').forEach(group=>{
    const field = group.dataset.field;
    const single = group.dataset.single === 'true';

    function deselectAll(){ group.querySelectorAll('.chip.active').forEach(c=> c.classList.remove('active')); }
    function syncPressed(){
      group.querySelectorAll('.chip').forEach(ch => {
        ch.setAttribute('aria-pressed', ch.classList.contains('active') ? 'true' : 'false');
      });
    }

    function writeSelection(){
      const selected = Array.from(group.querySelectorAll('.chip.active'))
        .map(c=> c.dataset.value)
        .filter(v=> v !== '__other__');
      if (field === 'role'){
        state.session.role = selected[0] || null;
        updatePerspectiveBadges();
        return;
      }
      if (Array.isArray(state.session[field]))      state.session[field] = selected;
      else if (Array.isArray(state.safety[field]))  state.safety[field]  = selected;
      else if (Array.isArray(state.sets[field]))    state.sets[field]    = selected;
      else                                          state[field]         = selected;
    }

    function handleChip(btn){
      const value = btn.dataset.value;
      if (value === '__other__'){
        const input = document.createElement('input');
        input.type='text'; input.className='text-input'; input.placeholder='הוספת ערך חדש… Enter לאישור';
        input.style.maxWidth='280px';
        btn.insertAdjacentElement('afterend', input);
        input.focus();
        const commit = ()=>{
          const v = input.value.trim(); input.remove();
          if (!v) return;
          const chip = document.createElement('button');
          chip.type='button'; chip.className='chip'; chip.dataset.value=v; chip.textContent=v;
          btn.insertAdjacentElement('beforebegin', chip);
          // activate immediately
          if (single){ deselectAll(); chip.classList.add('active'); }
          else { chip.classList.add('active'); }
          writeSelection();
          syncPressed();
        };
        input.addEventListener('keydown', e=>{ if (e.key==='Enter'){ e.preventDefault(); commit(); } });
        input.addEventListener('blur', commit);
        return;
      }

      if (single){
        if (btn.classList.contains('active')) btn.classList.remove('active');
        else { deselectAll(); btn.classList.add('active'); }
      } else {
        btn.classList.toggle('active');
      }
      writeSelection();
      syncPressed();
    }

    group.addEventListener('click', e=>{
      const btn = e.target.closest('.chip'); if (!btn) return;
      handleChip(btn);
    });
    syncPressed();
  });
}

/* ========== ACTIVITIES (only ℹ️ where allowed) ========== */
const activityDefs = {
  gentle: [
    {id:'face', he:'פנים', en:'Face'},
    {id:'hair', he:'שיער', en:'Hair'},
    {id:'neck', he:'צוואר', en:'Neck'},
    {id:'shoulders', he:'כתפיים', en:'Shoulders'},
    {id:'back', he:'גב', en:'Back'},
    {id:'chest', he:'חזה/שדיים ופטמות', en:'Chest/Breasts & nipples'},
    {id:'buttocks', he:'ישבן', en:'Buttocks'},
    {id:'clitpen', he:'דגדגן/פין', en:'Clitoris/Penis'},
    {id:'vagtest', he:'נרתיק/אשכים', en:'Vagina/Testicles'},
    {id:'anus', he:'פי הטבעת', en:'Anus'},
    {id:'other', he:'אחר', en:'Other', other:true}
  ],
  rough: [
    {id:'face', he:'פנים', en:'Face'},
    {id:'hair', he:'שיער', en:'Hair'},
    {id:'neck', he:'צוואר', en:'Neck'},
    {id:'shoulders', he:'כתפיים', en:'Shoulders'},
    {id:'back', he:'גב', en:'Back'},
    {id:'chest', he:'חזה/שדיים ופטמות', en:'Chest/Breasts & nipples'},
    {id:'buttocks', he:'ישבן', en:'Buttocks'},
    {id:'clitpen', he:'דגדגן/פין', en:'Clitoris/Penis'},
    {id:'vagtest', he:'נרתיק/אשכים', en:'Vagina/Testicles'},
    {id:'anus', he:'פי הטבעת', en:'Anus'},
    {id:'other', he:'אחר', en:'Other', other:true}
  ],
  kisses: [
    {id:'neck', he:'צוואר', en:'Neck'},
    {id:'shoulders', he:'כתפיים', en:'Shoulders'},
    {id:'chest', he:'חזה/שדיים ופטמות', en:'Chest/Breasts & nipples'},
    {id:'buttocks', he:'ישבן', en:'Buttocks'},
    {id:'belly', he:'בטן', en:'Belly'},
    {id:'limbs', he:'גפיים', en:'Limbs'},
    {id:'kissMouth', he:'נשיקות על הפה', en:'Kissing on mouth'},
    {id:'frenchKiss', he:'נשיקות עם לשון', en:'French kiss'},
    {id:'other', he:'אחר', en:'Other', other:true}
  ],
  impact: [
    // ℹ️ לקבוצה עצמה (Impact), לא לפריטים כמו Spanking/Flogger
    {id:'spanking', he:'ספנקינג', en:'Spanking'},
    {id:'paddle', he:'פאדל', en:'Paddle', info: infoTexts.paddle},
    {id:'flogger', he:'שוט רך/פלאוגר', en:'Flogger'},
    {id:'caning', he:'קיינינג', en:'Caning', info: infoTexts.caning},
    {id:'slapChest', he:'סטירה לחזה/שדיים', en:'Slap chest/breasts'},
    {id:'slapFace', he:'סטירה לפנים', en:'Face slap'},
    {id:'slapGenitals', he:'סטירה לפות/לפין', en:'Slap vulva/penis'},
    {id:'other', he:'אחר', en:'Other', other:true}
  ],
  restraints: [
    {id:'rope', he:'חבלים', en:'Rope'},
    {id:'cuffs', he:'אזיקים', en:'Cuffs'},
    {id:'spreader', he:'מוט פישוק', en:'Spreader bar', info: infoTexts.spreader},
    {id:'ballgag', he:'גאג כדורי', en:'Ball gag', info: infoTexts.ballgag},
    {id:'mummification', he:'ממיפיקציה', en:'Mummification', info: infoTexts.mummification},
    {id:'cage', he:'כלוב', en:'Cage'},
    {id:'collar', he:'קולר', en:'Collar'},
    {id:'leash', he:'רצועה', en:'Leash'},
    {id:'blindfold', he:'כיסוי עיניים', en:'Blindfold'},
    {id:'other', he:'אחר', en:'Other', other:true}
  ],
  sensory: [
    {id:'fur', he:'פרווה', en:'Fur'},
    {id:'pinwheel', he:'גלגל מחטים (פינוויל)', en:'Wartenberg wheel', info: infoTexts.pinwheel},
    {id:'knife', he:'סכין (ללא חיתוך)', en:'Knife (no cutting)'},
    {id:'nipClamps', he:'מצבטי פטמות', en:'Nipple clamps'},
    {id:'wax', he:'שעווה', en:'Wax'},
    {id:'ice', he:'קרח', en:'Ice'},
    {id:'fire', he:'אש', en:'Fire'},
    {id:'food', he:'אוכל', en:'Food play'},
    {id:'electric', he:'חשמל', en:'Electricity (E-Stim)', info: infoTexts.eStim},
    {id:'needles', he:'מחטים', en:'Needles', info: infoTexts.needles},
    {id:'scratches', he:'שריטות', en:'Scratches'},
    {id:'other', he:'אחר', en:'Other', other:true}
  ],
  somatic: [
    {id:'breath', he:'עצירת נשימה', en:'Breath play', info: infoTexts.breath},
    {id:'choking', he:'חנק', en:'Choking', info: infoTexts.choking},
    {id:'gagging', he:'גאגינג', en:'Gagging'},
    {id:'spitBody', he:'יריקה על הגוף', en:'Spitting (body)'},
    {id:'spitFace', he:'יריקה על הפנים', en:'Spitting (face)'},
    {id:'golden', he:'גולדאן שאוור (מתן/קבלת שתן)', en:'Golden shower (giving/receiving)'},
    {id:'cutting', he:'חיתוך', en:'Cutting', info: infoTexts.cutting},
    {id:'other', he:'אחר', en:'Other', other:true}
  ],
  objectification: [
    {id:'pose', he:'לשהות בתנוחה להנאה ויזואלית', en:'Hold a pose'},
    {id:'beObject', he:'להפוך לרהיט/חפץ', en:'Become furniture/object'},
    {id:'publicExposure', he:'חשיפה ציבורית', en:'Public exposure'},
    {id:'sexualObj', he:'אובייקטיפיקציה מינית', en:'Sexual objectification'},
    {id:'other', he:'אחר', en:'Other', other:true}
  ],
  esteem: [
    {id:'diminish', he:'הקטנה', en:'Diminishment'},
    {id:'humiliation', he:'השפלה', en:'Humiliation'},
    {id:'verbalHum', he:'השפלה מילולית', en:'Verbal humiliation'},
    {id:'primal', he:'פריימל', en:'Primal', info: infoTexts.primal},
    {id:'empower', he:'העצמה', en:'Empowerment'},
    {id:'worship', he:'סגידה והערצה', en:'Worship'},
    {id:'other', he:'אחר', en:'Other', other:true}
  ],
  psych: [
    {id:'ddlg', he:'DDLG/הורה-ילד', en:'Caregiver/Little'},
    {id:'cnc', he:'CNC (משחק חציית הסכמה בהסכמה)', en:'Consensual Non-Consent', info: infoTexts.cnc},
    {id:'fear', he:'איום ופחד', en:'Fear play'},
    {id:'cuckolding', he:'קוקולדינג', en:'Cuckolding', info: infoTexts.cuck},
    {id:'exclusion', he:'הדרה/נידוי', en:'Exclusion'},
    {id:'discipline', he:'משמעת', en:'Discipline', info: infoTexts.discipline},
    {id:'punishment', he:'ענישה', en:'Punishment', info: infoTexts.punishment},
    {id:'bodyWriting', he:'כתיבה על הגוף', en:'Body writing'},
    {id:'finEx', he:'ניצול כלכלי', en:'Financial exploitation'},
    {id:'sexEx', he:'ניצול מיני', en:'Sexual exploitation'},
    {id:'physEx', he:'ניצול פיזי', en:'Physical exploitation'},
    {id:'other', he:'אחר', en:'Other', other:true}
  ],
  groupScenes: [
    {id:'visible', he:'להיות בחשיפה לאחרים', en:'Visible to others'}, // הוסר ℹ️ מרמת פריט
    {id:'nonSexPublic', he:'אינטראקציה לא מינית לעיני אחרים', en:'Non-sexual interaction in public'},
    {id:'sexPublic', he:'אינטראקציה מינית לעיני אחרים', en:'Sexual interaction in public'},
    {id:'othersTouch', he:'לאפשר מגע של אחרים', en:'Allow others to touch me'},
    {id:'othersSex', he:'לאפשר לאחרים אינטראקציה מינית איתי', en:'Allow others sexual interaction with me'},
    {id:'other', he:'אחר', en:'Other', other:true}
  ],
  intimacy: [
    {id:'emotional', he:'חיבור אינטימי ורגשי'},
    {id:'sensual', he:'חיבור חושני'},
    {id:'sexual', he:'חיבור מיני'},
    {id:'distant', he:'חיבור מרוחק ומכני'},
    {id:'personal', he:'חיבור אישי'},
    {id:'warm', he:'חיבור חם'},
    {id:'cold', he:'חיבור קר'},
    {id:'transpersonal', he:'חיבור טראנס-פרסונלי וארכיטיפי'},
    {id:'other', he:'אחר', other:true}
  ],
  penetration: [
    {id:'nonSexTouch', he:'מגע שאינו מיני', en:'Non-sexual touch'},
    {id:'manualGen', he:'גירוי ידני של איברי המין', en:'Manual genital stimulation'},
    {id:'toyStim', he:'גירוי עם צעצוע/כלי של איברי המין', en:'Toy/device stimulation'},
    {id:'vagFingers', he:'חדירה וגינלית עם אצבעות', en:'Vaginal fingering'},
    {id:'analFingers', he:'חדירה אנאלית עם אצבעות', en:'Anal fingering'},
    {id:'vagToy', he:'חדירה וגינלית עם ויברטור/צעצוע', en:'Vaginal toy/dildo'},
    {id:'analToy', he:'חדירה אנאלית בבאט-פלאג/דילדו', en:'Anal plug/dildo'},
    {id:'vagInter', he:'חדירה וגינלית עם זין', en:'Vaginal intercourse'},
    {id:'analInter', he:'חדירה אנאלית עם זין', en:'Anal intercourse'},
    {id:'oral', he:'מין אוראלי (ליקוק פות/מציצת פין)', en:'Oral sex'},
    {id:'faceF', he:'Face-f*cking', en:'Face-f*cking'},
    {id:'semenSwallow', he:'בליעת זרע', en:'Semen swallowing'},
    {id:'other', he:'אחר', en:'Other', other:true}
  ],
  erotic: [
    {id:'orgControl', he:'שליטה באורגזמה', en:'Orgasm control'},
    {id:'orgDenial', he:'מניעת אורגזמה', en:'Orgasm denial'},
    {id:'forcedOrg', he:'אילוץ אורגזמה', en:'Forced orgasm'},
    {id:'sexualObj', he:'החפצה מינית', en:'Sexual objectification'},
    {id:'publicSex', he:'חשיפה ציבורית', en:'Public sexual exposure'},
    {id:'ravishing', he:'“להיטרף” מינית', en:'Consensual Ravishing'},
    {id:'beingUsed', he:'להיות משומש מינית', en:'Being sexually used'},
    {id:'other', he:'אחר', en:'Other', other:true}
  ]
};

function buildActivities(){
  Object.entries(activityDefs).forEach(([groupKey, items])=>{
    state.activities[groupKey] = {};
    const container = document.querySelector(`.activity-list[data-rows="${groupKey}"]`);
    if (!container) return;

    items.forEach(item=>{
      if (item.other){
        // "Other" inline creator
        const row = document.createElement('div');
        row.className = 'activity-row';
        const label = document.createElement('div');
        label.className = 'activity-label';
        label.innerHTML = `<span class="lang-he"><strong>אחר</strong></span><span class="lang-en">Other</span>`;
        const controls = document.createElement('div');
        controls.className = 'controls-wrap';
        const otherInput = document.createElement('input');
        otherInput.className = 'text-input';
        otherInput.placeholder = 'הוספת סעיף חדש… Enter לאישור';
        otherInput.style.maxWidth = '320px';
        controls.appendChild(otherInput);
        row.append(label, controls);
        container.appendChild(row);

        const commit = ()=>{
          const v = otherInput.value.trim(); if (!v) return;
          otherInput.value = '';
          addDynamicActivityRow(container, groupKey, v);
        };
        otherInput.addEventListener('keydown', e=>{ if (e.key==='Enter'){ e.preventDefault(); commit(); } });
        otherInput.addEventListener('blur', commit);
        return;
      }

      const row = createActivityRow(groupKey, item);
      container.appendChild(row);
      state.activities[groupKey][item.id] = { status:null, intensity:0, name:item.he };
    });
  });
}

function addDynamicActivityRow(container, groupKey, labelText){
  const id = `dyn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
  return addDynamicActivityRowWithId(container, groupKey, labelText, id);
}
function addDynamicActivityRowWithId(container, groupKey, labelText, forcedId){
  const id = forcedId || `dyn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
  const item = { id, he: labelText, en:'' };
  const row = createActivityRow(groupKey, item);
  container.insertBefore(row, container.lastElementChild);
  state.activities[groupKey][id] = { status:null, intensity:0, name:labelText };
  return id;
}

function createActivityRow(groupKey, item){
  const row = document.createElement('div');
  row.className = 'activity-row';
  row.dataset.groupKey = groupKey;
  row.dataset.itemId = item.id;

  const label = document.createElement('div');
  label.className = 'activity-label';
  label.id = `label-${groupKey}-${item.id}`;
  label.innerHTML = `<span class="lang-he"><strong>${item.he}</strong></span>` + (item.en?`<span class="lang-en">${item.en}</span>`:'');
  if (item.info){
    const infoBtn = document.createElement('button');
    infoBtn.className='info-btn'; infoBtn.type='button'; infoBtn.textContent='ℹ️';
    const info = document.createElement('div'); info.className='info-text'; info.hidden=true; info.textContent=item.info;
    info.id = `info-${groupKey}-${item.id}`;
    info.setAttribute('role', 'region');
    info.setAttribute('aria-live', 'polite');
    infoBtn.setAttribute('aria-controls', info.id);
    infoBtn.setAttribute('aria-expanded', 'false');
    infoBtn.setAttribute('aria-label', `מידע נוסף: ${item.he}`);
    infoBtn.addEventListener('click', (event)=> {
      event.stopPropagation();
      info.hidden = !info.hidden;
      infoBtn.setAttribute('aria-expanded', info.hidden ? 'false' : 'true');
    });
    label.append(infoBtn, info);
  }

  const controls = document.createElement('div');
  controls.className = 'controls-wrap';

  const choice = document.createElement('div');
  choice.className = 'choice-group';
  const bYes = document.createElement('button'); bYes.type='button'; bYes.className='choice-btn yes'; bYes.textContent='כן'; bYes.dataset.choice='yes';
  const bMaybe = document.createElement('button'); bMaybe.type='button'; bMaybe.className='choice-btn maybe'; bMaybe.textContent='אולי'; bMaybe.dataset.choice='maybe';
  const bNo = document.createElement('button'); bNo.type='button'; bNo.className='choice-btn no'; bNo.textContent='לא'; bNo.dataset.choice='no';
  [bYes, bMaybe, bNo].forEach(btn => btn.setAttribute('aria-pressed', 'false'));
  choice.append(bYes,bMaybe,bNo);

  const sliderWrap = document.createElement('div');
  sliderWrap.className = 'slider-container disabled';
  const slider = document.createElement('input');
  slider.type='range'; slider.min='0'; slider.max='10'; slider.value='0'; slider.className='intensity-slider'; slider.dataset.slider='intensity';
  slider.id = `slider-${groupKey}-${item.id}`;
  slider.setAttribute('aria-labelledby', label.id);
  slider.setAttribute('aria-label', `עצימות עבור ${item.he}`);
  const sval = document.createElement('span'); sval.className='intensity-value'; sval.textContent='0/10';
  sliderWrap.append(slider,sval);

  controls.append(choice, sliderWrap);

  function setActive(btn){
    [bYes,bMaybe,bNo].forEach(b=> b.classList.remove('active'));
    btn.classList.add('active');
    [bYes,bMaybe,bNo].forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
  }
  function setStatus(stat){
    const entry = state.activities[groupKey][item.id] || (state.activities[groupKey][item.id]={status:null,intensity:0,name:item.he});
    entry.status = stat;
  }
  bYes.addEventListener('click', ()=>{ setActive(bYes); setStatus('yes'); sliderWrap.classList.remove('disabled'); });
  bMaybe.addEventListener('click', ()=>{ setActive(bMaybe); setStatus('maybe'); sliderWrap.classList.remove('disabled'); });
  bNo.addEventListener('click', ()=>{ setActive(bNo); setStatus('no'); sliderWrap.classList.add('disabled'); slider.value='0'; sval.textContent='0/10'; (state.activities[groupKey][item.id]||{}).intensity=0; });

  function applyStatusFromSliderValue(){
    const numeric = parseInt(slider.value, 10) || 0;
    sliderWrap.classList.remove('disabled');
    if (numeric <= 4) {
      setActive(bMaybe);
      setStatus('maybe');
    } else {
      setActive(bYes);
      setStatus('yes');
    }
  }
  slider.addEventListener('pointerdown', ()=>{
    applyStatusFromSliderValue();
  });
  slider.addEventListener('mousedown', ()=>{
    applyStatusFromSliderValue();
  });
  slider.addEventListener('touchstart', ()=>{
    applyStatusFromSliderValue();
  }, { passive: true });
  slider.addEventListener('input', ()=>{
    sval.textContent = `${slider.value}/10`;
    const entry = state.activities[groupKey][item.id] || (state.activities[groupKey][item.id]={status:null,intensity:0,name:item.he});
    applyStatusFromSliderValue();
    entry.intensity = parseInt(slider.value,10);
  });

  row.append(label, controls);
  return row;
}

function restoreDynamicRowsFromState(){
  Object.entries(state.activities || {}).forEach(([groupKey, group]) => {
    const container = document.querySelector(`.activity-list[data-rows="${groupKey}"]`);
    if (!container || !group || typeof group !== 'object') return;
    Object.entries(group).forEach(([id, entry]) => {
      if (!id || !String(id).startsWith('dyn_')) return;
      if (!entry || typeof entry !== 'object') return;
      if (container.querySelector(`.activity-row[data-item-id="${id}"]`)) return;
      const name = String(entry.name || '').trim();
      if (!name) return;
      addDynamicActivityRowWithId(container, groupKey, name, id);
    });
  });
}

function applyActivitiesStateToUi(){
  $$('.activity-row[data-group-key][data-item-id]').forEach(row => {
    const groupKey = row.dataset.groupKey;
    const itemId = row.dataset.itemId;
    const entry = (((state.activities || {})[groupKey]) || {})[itemId];
    if (!entry) return;
    const status = entry.status || null;
    const intensity = Number.isFinite(entry.intensity) ? entry.intensity : 0;
    const yes = row.querySelector('.choice-btn.yes');
    const maybe = row.querySelector('.choice-btn.maybe');
    const no = row.querySelector('.choice-btn.no');
    const sliderWrap = row.querySelector('.slider-container');
    const slider = row.querySelector('.intensity-slider');
    const val = row.querySelector('.intensity-value');
    [yes, maybe, no].forEach(b => b && b.classList.remove('active'));
    if (status === 'yes' && yes) yes.classList.add('active');
    if (status === 'maybe' && maybe) maybe.classList.add('active');
    if (status === 'no' && no) no.classList.add('active');
    if (sliderWrap) {
      const disabled = !status || status === 'no';
      sliderWrap.classList.toggle('disabled', disabled);
    }
    if (slider) slider.value = String(clamp(intensity, 0, 10));
    if (val) val.textContent = `${clamp(intensity, 0, 10)}/10`;
  });
}

/* Refinements */
function setupRefinements(){
  $$('textarea[data-refine]').forEach(t=>{
    t.addEventListener('input',()=> state.refinements[t.dataset.refine] = t.value );
  });
}

/* ========== SUMMARY (now shows YES/MAYBE/NO) ========== */
let sortMode = 'power';
function getSummaryFilterOptions(){
  const activeValues = Array.from(document.querySelectorAll('.chip-group[data-field="summaryFilter"] .chip.active'))
    .map(el => el.dataset.value);
  const options = {
    allForm: activeValues.includes('all_form'),
    answers: activeValues.includes('answers') || activeValues.length === 0,
    yes: activeValues.includes('yes'),
    maybe: activeValues.includes('maybe'),
    no: activeValues.includes('no'),
    unanswered: activeValues.includes('unanswered')
  };
  if (options.allForm) {
    options.answers = false;
    options.yes = false;
    options.maybe = false;
    options.no = false;
    options.unanswered = false;
  }
  return options;
}
function renderSummary(){
  // Top session box
  $('#sumSessionName').textContent  = state.session.sessionName || '—';
  $('#sumNickname').textContent     = state.session.nickname || '—';
  $('#sumRole').textContent         = state.session.role ? ({dom:'דום',sub:'סאב','switch':'סוויץ׳'}[state.session.role]) : '—';
  $('#sumDuration').textContent     = state.session.duration ? `${state.session.duration} דק׳` : '—';
  $('#sumPronouns').textContent     = (state.session.pronouns||[]).join(' • ') || '—';
  $('#sumHardLimits').textContent   = state.safety.hardLimits || '—';
  $('#sumHealthPhysical').textContent = state.safety.healthPhysical || '—';
  $('#sumHealthMental').textContent   = state.safety.healthMental || '—';
  $('#sumPainDesired').textContent  = `${state.safety.painDesired}/10`;
  $('#sumPainTolerable').textContent= `${state.safety.painTolerable}/10`;
  const safetyBits=[];
  if (state.safety.trafficLight) safetyBits.push('רמזור');
  if (state.safety.safeword)     safetyBits.push(`מילת ביטחון: ${state.safety.safeword}`);
  if (state.safety.gesture)      safetyBits.push(`מחווה: ${state.safety.gesture}`);
  $('#sumSafetyComms').textContent = safetyBits.join(' • ') || '—';

  const filterOptions = getSummaryFilterOptions();
  const root = $('#summaryContent');
  root.innerHTML = '';

  const chapters = [
    { title:'🤲 סוגי מגע', groups:[
      { key:'gentle',  title:'🫳🏼 מגע עדין' },
      { key:'rough',   title:'💪🏼 מגע אינטנסיבי' },
      { key:'kisses',  title:'👄 נשיקות/ליקוקים/נשיכות' },
      { key:'impact',  title:'🏓 אימפקט' }
    ], extras:[
      {label:'🎯 אזורים עם רגישות ספציפית', text: state.text.sensitivityAreas }
    ]},
    { title:'⛓️ ריתוק/קשירות/תחושות', groups:[
      { key:'restraints', title:'🪢 קשירות וריתוק' },
      { key:'sensory',    title:'🔥🧊 משחקי תחושות' },
      { key:'somatic',    title:'⚠️ קצוות סומטיים' }
    ]},
    { title:'🎭 דינמיקות ושפה', groups:[
      { key:'objectification', title:'🧸 החפצה' },
      { key:'esteem',          title:'🤯 ערך וזהות' },
      { key:'psych',           title:'🧠 משחק פסיכולוגי' },
      { key:'groupScenes',     title:'👥 ריבוי משתתפים' }
    ], chips:[
      {label:'🎬 משחקי תפקידים וסצנות', items: state.sets.roleplayScenes, refine: state.refinements.roleplay},
      {label:'🗣️ סגנון שפה של הדום',   items: state.sets.domLanguage},
      {label:'🏷️ כינויים רצויים לסאב',  items: state.sets.nicknamesSub},
      {label:'🚫 מילים אסורות לסאב', items: state.text.forbiddenSub ? [state.text.forbiddenSub] : []},
      {label:'🗣️ סגנון שפה של הסאב',   items: state.sets.subLanguage},
      {label:'🏷️ כינויים רצויים לדום', items: state.sets.titlesDom},
      {label:'🚫 מילים אסורות לדום', items: state.text.forbiddenDom ? [state.text.forbiddenDom] : []}
    ]},
    { title:'❤️ מיניות ואינטימיות', groups:[
      { key:'intimacy',    title:'🤍 אינטימיות וחיבור רצוי' },
      { key:'penetration', title:'🍑 חדירות וגירוי מיני' },
      { key:'erotic',      title:'🔥 דינמיקה מינית/ארוטית' }
    ]},
    { title:'🫶 אפטר־קר', groups:[], chips:[
      {label:'🧴 צרכים מיידיים', items: state.sets.aftercareNeeds, refine: state.refinements.aftercare},
      {label:'⏳ משך אפטר־קר',  items: state.sets.aftercareDuration},
      {label:'📬 ציפיות אחרי המפגש', items: state.sets.postSession}
    ]}
  ];

  function sortRows(rows){
    if (sortMode === 'questionnaire') return rows;
    return rows.sort((a,b)=> (b.intensity||0)-(a.intensity||0) || a.name.localeCompare(b.name,'he'));
  }

  // collect with status grouping (yes -> maybe -> no)
  function collect(groupKey){
    const group = state.activities[groupKey] || {};
    let rows = Object.values(group).map(e=> ({
      name:e.name,
      status:e.status || 'unanswered',
      intensity:e.intensity||0
    }));
    if (filterOptions.allForm){
      const ys = sortRows(rows.filter(r=>r.status==='yes'));
      const ms = sortRows(rows.filter(r=>r.status==='maybe'));
      const ns = sortRows(rows.filter(r=>r.status==='no'));
      const us = sortRows(rows.filter(r=>r.status==='unanswered'));
      return [...ys, ...ms, ...ns, ...us];
    }
    if (filterOptions.answers){
      rows = rows.filter(r => r.status !== 'unanswered');
    } else if (filterOptions.yes || filterOptions.maybe || filterOptions.no || filterOptions.unanswered){
      rows = rows.filter(r => {
        if (r.status === 'yes' && filterOptions.yes) return true;
        if (r.status === 'maybe' && filterOptions.maybe) return true;
        if (r.status === 'no' && filterOptions.no) return true;
        if (r.status === 'unanswered' && filterOptions.unanswered) return true;
        return false;
      });
    } else {
      rows = rows.filter(r => r.status !== 'unanswered');
    }
    return sortRows(rows);
  }

  chapters.forEach(ch=>{
    const card = document.createElement('div');
    card.className = 'summary-card';
    const h = document.createElement('h4'); h.textContent = ch.title; card.appendChild(h);

    (ch.groups||[]).forEach(g=>{
      const data = collect(g.key);
      const hasRef = state.refinements[g.key] && state.refinements[g.key].trim();
      if (!data.length && !hasRef) return;

      const sub = document.createElement('div');
      const st = document.createElement('div'); st.className = 'summary-subtitle'; st.textContent = g.title;
      sub.appendChild(st);

      if (data.length){
        const list = document.createElement('div'); list.className='summary-tags';
        data.forEach(it=>{
          const tag = document.createElement('div');
          tag.className = `summary-tag ${it.status==='unanswered' ? '' : `summary-tag-${it.status}`}`.trim();
          tag.textContent = it.intensity>0 ? `${it.name} (${it.intensity}/10)` : it.name;
          list.appendChild(tag);
        });
        sub.appendChild(list);
      }
      if (hasRef){
        const ref = document.createElement('div'); ref.className='summary-tags';
        const tag = document.createElement('div'); tag.className='summary-tag';
        tag.textContent = `הוספת דיוקים - ${titleForGroup(g.key)}: ${state.refinements[g.key].trim()}`;
        ref.appendChild(tag);
        sub.appendChild(ref);
      }
      card.appendChild(sub);
    });

    (ch.chips||[]).forEach(block=>{
      if ((block.items && block.items.length) || block.refine || block.extra){
        const sub = document.createElement('div');
        const st = document.createElement('div'); st.className='summary-subtitle'; st.textContent=block.label;
        sub.appendChild(st);

        if (block.items && block.items.length){
          const list = document.createElement('div'); list.className='summary-tags';
          block.items.forEach(v=>{
            const t = document.createElement('div'); t.className='summary-tag'; t.textContent=v; list.appendChild(t);
          });
          sub.appendChild(list);
        }
        if (block.refine && block.refine.trim()){
          const list = document.createElement('div'); list.className='summary-tags';
          const t = document.createElement('div'); t.className='summary-tag'; t.textContent=`הוספת דיוקים - ${block.label.replace(/^[^ ]+ /,'')}: ${block.refine.trim()}`;
          list.appendChild(t); sub.appendChild(list);
        }
        if (block.extra){
          const ex = document.createElement('div'); ex.className='summary-tags';
          const t = document.createElement('div'); t.className='summary-tag'; t.textContent=block.extra;
          ex.appendChild(t); sub.appendChild(ex);
        }
        card.appendChild(sub);
      }
    });

    if (card.childNodes.length>1) root.appendChild(card);
  });

}

function titleForGroup(k){
  const map = {
    gentle:'מגע עדין', rough:'מגע אינטנסיבי', kisses:'נשיקות/ליקוקים/נשיכות', impact:'אימפקט',
    restraints:'קשירות וריתוק', sensory:'משחקי תחושות', somatic:'קצוות סומטיים',
    objectification:'החפצה', esteem:'ערך וזהות', psych:'משחק פסיכולוגי', groupScenes:'ריבוי משתתפים',
    intimacy:'אינטימיות', penetration:'חדירות וגירוי מיני', erotic:'דינמיקה מינית/ארוטית',
    roleplay:'משחקי תפקידים', aftercare:'אחרי סשן'
  };
  return map[k] || k;
}

function setupSummaryControls(){
  const group = document.querySelector('.chip-group[data-field="summaryFilter"]');
  group.addEventListener('click', e=>{
    const chip = e.target.closest('.chip'); if (!chip) return;
    const value = chip.dataset.value;
    const selected = chip.classList.contains('active');
    if (value === 'all_form') {
      group.querySelectorAll('.chip').forEach(c=> c.classList.remove('active'));
      chip.classList.add('active');
    } else {
      const allFormChip = group.querySelector('.chip[data-value="all_form"]');
      allFormChip?.classList.remove('active');
      if (value === 'answers') {
        group.querySelectorAll('.chip[data-value="yes"], .chip[data-value="maybe"], .chip[data-value="no"], .chip[data-value="unanswered"]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      } else {
        const answersChip = group.querySelector('.chip[data-value="answers"]');
        answersChip?.classList.remove('active');
        chip.classList.toggle('active', !selected);
        const hasAnyStatus = group.querySelector('.chip[data-value="yes"].active, .chip[data-value="maybe"].active, .chip[data-value="no"].active, .chip[data-value="unanswered"].active');
        if (!hasAnyStatus) {
          answersChip?.classList.add('active');
        }
      }
    }
    renderSummary();
  });
  const sortBtn = $('#sortToggle');
  sortBtn.addEventListener('click', ()=>{
    sortMode = (sortMode==='power') ? 'questionnaire' : 'power';
    sortBtn.textContent = sortMode==='power' ? 'מיין לפי סדר שאלות' : 'מיין לפי עוצמה';
    renderSummary();
  });
  sortBtn.textContent = sortMode==='power' ? 'מיין לפי סדר שאלות' : 'מיין לפי עוצמה';
}

/* ========== SIGNATURE PAD ========== */
function initializeSignaturePad(forceResize = false) {
  const canvas = document.getElementById('signatureCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.style.touchAction = 'none';
  const statePad = (canvas.__padState ||= { drawing:false, bound:false });

  const drawSignatureFromState = () => {
    const src = String(state.consent.signatureDataUrl || '').trim();
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.clientWidth || canvas.width, canvas.clientHeight || canvas.height);
    };
    img.src = src;
  };
  const persistSignatureToState = () => {
    try {
      state.consent.signatureDataUrl = canvas.toDataURL('image/png');
    } catch (_) {}
  };
  const resize = (forceResize = false) => {
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const w = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
    const h = canvas.clientHeight || 180;
    if (!forceResize && canvas.width === Math.floor(w*dpr) && canvas.height === Math.floor(h*dpr)) return;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';
    drawSignatureFromState();
  };
  resize(forceResize);

  const pos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };
  const start = (e) => {
    e.preventDefault();
    const p = pos(e);
    statePad.drawing = true;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    canvas.setPointerCapture?.(e.pointerId || 0);
  };
  const move = (e) => {
    if (!statePad.drawing) return;
    e.preventDefault();
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const end = (e) => {
    statePad.drawing = false;
    canvas.releasePointerCapture?.(e.pointerId || 0);
    persistSignatureToState();
  };

  if (!statePad.bound) {
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointerleave', end);
    statePad.bound = true;
  }

  const clearBtn = document.getElementById('clearSignatureBtn');
  if (clearBtn && !clearBtn.__bound) {
    clearBtn.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      state.consent.signatureDataUrl = '';
    });
    clearBtn.__bound = true;
  }

  if (!canvas.__resizeBound) {
    window.addEventListener('resize', () => initializeSignaturePad(true));
    canvas.__resizeBound = true;
  }
}
// Call the function to set up the signature pad
// initializeSignaturePad(); -> נקרא מתוך init()

/* ========== TOP ACTIONS ========== */
function setupTopActions(){
  async function buildSummaryShareUrl(){
    const base = new URL('../scene-planner-embed-he.html', window.location.href);
    base.searchParams.set('sessionId', activeSessionId);
    base.searchParams.set('startChapter', 'chapter-8');
    base.searchParams.set('mode', 'existing');
    const payload = buildSharePayload();
    const shareId = await createServerShareId(payload);
    if (shareId) {
      base.searchParams.set('shareId', shareId);
      base.searchParams.set('v', '2026-04-24-sharefix3');
      return base.toString();
    }
    throw new Error('share_service_unavailable');
  }
  function runWithBusyState(button, busyText, errorText, work){
    if (!button) return Promise.resolve();
    const original = button.textContent;
    button.disabled = true;
    button.textContent = busyText;
    return Promise.resolve()
      .then(work)
      .catch((err) => {
        console.error('[planner-he] action failed', err);
        alert(errorText || 'הפעולה נכשלה. נסו שוב.');
        return null;
      })
      .finally(() => {
        button.disabled = false;
        button.textContent = original;
      });
  }
  const whatsappBtn = $('#shareWhatsApp');
  if (whatsappBtn) whatsappBtn.addEventListener('click', ()=>{
    runWithBusyState(whatsappBtn, 'פותח שיתוף...', 'לא ניתן היה לפתוח שיתוף ל-WhatsApp.', () => {
      saveActiveSession();
      return buildSummaryShareUrl().then((shareUrl) => {
        if (navigator.share) {
          return navigator.share({ title: 'סיכום מצפן התשוקות', url: shareUrl }).catch(() => {
            const encoded = encodeURIComponent(shareUrl);
            const popup = window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener');
            if (!popup) {
              return navigator.clipboard.writeText(shareUrl)
                .then(() => alert('הלינק הועתק ללוח. אפשר להדביק ולשתף ידנית.'))
                .catch(() => alert('לא ניתן היה לפתוח שיתוף אוטומטי. נסו שוב.'));
            }
            return null;
          });
        }
        const encoded = encodeURIComponent(shareUrl);
        const popup = window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener');
        if (!popup) {
          return navigator.clipboard.writeText(shareUrl)
            .then(() => alert('הלינק הועתק ללוח. אפשר להדביק ולשתף ידנית.'))
            .catch(() => alert('לא ניתן היה לפתוח שיתוף אוטומטי. נסו שוב.'));
        }
        return null;
      });
    });
  });
  const downloadPdfBtn = $('#downloadPdf');
  if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', ()=> {
    runWithBusyState(downloadPdfBtn, 'מכין PDF...', 'לא ניתן היה להכין הדפסה כרגע.', () => {
      saveActiveSession();
      window.print();
    });
  });
  const finishBtn = $('#finishSessionBottom');
  if (finishBtn) finishBtn.addEventListener('click', ()=> {
    runWithBusyState(finishBtn, 'שומר ומסיים...', 'השמירה נכשלה. נסו שוב.', () => {
      saveActiveSession();
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'planner_open_sessions', sessionId: activeSessionId }, window.location.origin);
      } else {
        window.location.href = '../index.html';
      }
    });
  });
}

/* ========== INIT ========== */
function currentDateDDMMYYYY(){
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

async function init(){
  setupStepper();
  setupPrevNext();
  setupInfoButtons();
  bindBasicInputs();
  setupPainSliders();
  setupChipGroups();
  buildActivities();
  setupCollapsibleSubsections();
  if (sessionIdFromUrl || sharedPayloadFromUrl || shareIdFromUrl) {
    if (shareIdFromUrl) {
      const remote = await fetchSharedPayloadById(shareIdFromUrl);
      if (remote && remote.plannerState) {
        mergeStateFromSaved(remote.plannerState);
      } else {
        const isExistingSessionFlow = modeFromUrl === 'existing';
        if (isExistingSessionFlow) {
          console.warn('[planner-he] session could not be loaded safely:', sessionIdFromUrl || shareIdFromUrl);
        }
      }
    } else {
    const saved = loadSessionById(sessionIdFromUrl);
    if (saved && saved.plannerState) {
      activeSessionId = saved.id;
      mergeStateFromSaved(saved.plannerState);
    } else {
      const shared = decodeSharePayload(sharedPayloadFromUrl);
      if (shared && shared.plannerState) {
        mergeStateFromSaved(shared.plannerState);
      } else if (shareIdFromUrl) {
        const remote = await fetchSharedPayloadById(shareIdFromUrl);
        if (remote && remote.plannerState) {
          mergeStateFromSaved(remote.plannerState);
        } else {
          const isExistingSessionFlow = modeFromUrl === 'existing';
          if (isExistingSessionFlow) {
            console.warn('[planner-he] session could not be loaded safely:', sessionIdFromUrl || shareIdFromUrl);
          }
        }
      } else {
      const isExistingSessionFlow = modeFromUrl === 'existing';
      if (isExistingSessionFlow) {
        console.warn('[planner-he] session could not be loaded safely:', sessionIdFromUrl);
        const host = document.querySelector('.site-header');
        if (host) {
          const warn = document.createElement('div');
          warn.className = 'info-text';
          warn.style.marginTop = '0.6rem';
          warn.style.padding = '0.55rem 0.7rem';
          warn.style.border = '1px solid var(--border)';
          warn.style.borderRadius = '10px';
          warn.style.background = 'rgba(255,255,255,0.06)';
          warn.innerHTML = `
            לא ניתן היה לטעון את הסשן המבוקש. ייתכן שנמחק מהמכשיר.
            <div style="margin-top:0.5rem; display:flex; gap:0.4rem; flex-wrap:wrap;">
              <button type="button" class="btn ghost" id="goSessionsBtn">חזרה לסשנים</button>
              <button type="button" class="btn" id="startNewBtn">סשן חדש</button>
            </div>
          `;
          host.appendChild(warn);
          const goSessionsBtn = document.getElementById('goSessionsBtn');
          const startNewBtn = document.getElementById('startNewBtn');
          if (goSessionsBtn) goSessionsBtn.addEventListener('click', () => {
            window.parent?.postMessage?.({ type: 'planner_open_sessions' }, window.location.origin);
          });
          if (startNewBtn) startNewBtn.addEventListener('click', () => {
            window.parent?.postMessage?.({ type: 'planner_open_new' }, window.location.origin);
          });
        }
      }
      }
    }
    }
  }
  restoreDynamicRowsFromState();
  applyStateToUi();
  applyActivitiesStateToUi();
  setupRefinements();
  setupSummaryControls();
  setupTopActions();
  updatePerspectiveBadges();
  initializeSignaturePad();

  document.querySelector('.step-btn[data-target="chapter-1"]').classList.add('active');
  $('#nickname').addEventListener('input', ()=>{ if ($('#chapter-8').classList.contains('visible')) renderSummary(); });
  if (startChapterFromUrl) showChapter(startChapterFromUrl);
  if (autoShareFromUrl === 'pdf') {
    setTimeout(() => {
      showChapter('chapter-8');
      setTimeout(() => window.print(), 350);
    }, 200);
  }
  window.addEventListener('message', (e) => {
    if (e.origin !== window.location.origin) return;
    const data = e && e.data ? e.data : null;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'planner_request_save') {
      saveActiveSession();
      window.parent?.postMessage?.({ type: 'planner_session_finished', sessionId: activeSessionId }, window.location.origin);
    }
  });
}
document.addEventListener('DOMContentLoaded', init);
