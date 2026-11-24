/* RANK UP: simple offline gym tracker with a game layer. All data stays on this phone (localStorage + IndexedDB). */
'use strict';
const { EX, WORKOUTS, UPPER, LOWER } = DATA;
const KEY = 'gymApp.v1';
const DAYS = ['الحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
const LABEL = { A: 'Workout A', B: 'Workout B', U: 'Upper Day', L: 'Lower Day' };
const UPPER_KEYS = ['chestpress', 'row', 'machinerow', 'facepull', 'pulldown', 'vbar', 'dbbench', 'revfly', 'triceps', 'triext', 'curl', 'dbcurl'];
const BODYWEIGHT = ['deadbug', 'plank', 'bridge'];
// The alternative for each exercise (tap "بديل" to swap it for today).
const ALT = {
  legpress: 'goblet', goblet: 'legpress', chestpress: 'dbbench', dbbench: 'chestpress', row: 'machinerow', machinerow: 'row',
  legcurl: 'lyingcurl', lyingcurl: 'legcurl', facepull: 'revfly', revfly: 'facepull', deadbug: 'plank', plank: 'deadbug',
  pulldown: 'vbar', vbar: 'pulldown', backext: 'bridge', bridge: 'backext', triceps: 'triext', triext: 'triceps',
  curl: 'dbcurl', dbcurl: 'curl', legext: 'legpress',
};

// Warm-up and cool-down moves, each with a start and an end picture.
const WARM = [
  ['Bicycling_Stationary', 'عجلة أو مشي', 'Bike / Treadmill', '5 دقايق، مجهود خفيف'],
  ['Cat_Stretch', 'القطة والجمل', 'Cat-Cow', '8 مرات ببطء: قوّس ضهرك لفوق، وبعدين نزّله لتحت'],
  ['Shoulder_Circles', 'لف الكتف لورا', 'Shoulder Rolls', '10 مرات: ارفع كتافك ولفّهم لورا ولتحت'],
  ['chin_tuck', 'شد الدقن لورا', 'Chin Tucks', '8 مرات: رجّع دقنك لورا بخط مستقيم واثبت 3 ثواني، من غير ألم'],
];
const COOL = [
  ['Kneeling_Hip_Flexor', 'مقدمة الحوض', 'Kneeling Hip Flexor', 'ركبة على الأرض وادفع الحوض لقدام بهدوء • 30 ثانية لكل رجل'],
  ['Hamstring_Stretch', 'الفخذ الخلفي', 'Hamstring Stretch', 'ضهرك مفرود وميل من الحوض لحد ما تحس شد خفيف • 30 ثانية'],
  ['Dynamic_Chest_Stretch', 'فتح الصدر', 'Chest Opener', 'افتح دراعاتك لورا بهدوء وارجع • 10 مرات'],
  ['Side_Neck_Stretch', 'جانب الرقبة', 'Side Neck Stretch', 'ميّل راسك للجنب بهدوء، إيدك بتسند بس • 20 ثانية كل ناحية. لو بتوجع ← وقّف'],
];
// Activities you can log on any day, with minutes.
const ACTS = [['walk', 'مشي', 'walk'], ['run', 'جري', 'bolt'], ['football', 'كورة', 'target'], ['swim', 'سباحة', 'swim'], ['bike', 'عجلة', 'bike'], ['other', 'تاني', 'plus']];
const actName = a => a.type === 'other' ? (a.name || 'نشاط') : (ACTS.find(x => x[0] === a.type) || ACTS[5])[1];

// ------------------------------------------------------------------ icons (inline SVG)
const P = {
  dumbbell: '<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
  chart: '<path d="M4 20h16"/><path d="M7 16v-4M12 16V7M17 16v-6"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M9 6l6 6-6 6"/>',
  chev: '<path d="M15 6l-6 6 6 6"/>',
  flame: '<path d="M12 2.5c.8 3.2 5.5 5.3 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2.4 1.2-4 2.4-5 .1 2 1 3.2 2.3 3.4-.4-3.2.2-6.2.8-8.9z"/>',
  bolt: '<path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z"/>',
  scale: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 10a4 4 0 0 1 8 0M12 10l1.8-2"/>',
  ruler: '<path d="M3 16.5L16.5 3 21 7.5 7.5 21z"/><path d="M7.5 12.5l2 2M10.5 9.5l2 2M13.5 6.5l2 2"/>',
  msg: '<path d="M4 5h16v11H9l-5 4z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  walk: '<circle cx="13" cy="4.5" r="2"/><path d="M9.5 21l2-6.5 3 2.5v4M8 12.5l2.2-4 3.8 1 2 3.2M11.5 14.5L10.6 10"/>',
  moon: '<path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a6.6 6.6 0 0 0 10 10z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
  down: '<path d="M12 3.5v12M7 10.5l5 5 5-5M5 20.5h14"/>',
  up: '<path d="M12 20.5v-12M7 13.5l5-5 5 5M5 3.5h14"/>',
  book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/>',
  shield: '<path d="M12 3l7.5 3v6c0 4.8-3.3 7.8-7.5 9-4.2-1.2-7.5-4.2-7.5-9V6z"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  edit: '<path d="M4 20h4L19.5 8.5l-4-4L4 16z"/>',
  swap: '<path d="M7 7h13M17 4l3 3-3 3M17 17H4M7 14l-3 3 3 3"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  food: '<path d="M7 3v7.5a2 2 0 0 0 4 0V3M9 12.5V21M17 21V3c-2.2 0-3.5 2.6-3.5 6s1.3 4.5 3.5 4.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  copy: '<rect x="8" y="8" width="12.5" height="12.5" rx="3"/><path d="M16 8V5.5A2 2 0 0 0 14 3.5H5.5a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2H8"/>',
  share: '<path d="M12 15V3.5M7.5 8L12 3.5 16.5 8"/><path d="M5 12v7.5h14V12"/>',
  rules: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  images: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8.5 8.5"/>',
  save: '<path d="M5 3.5h11l3.5 3.5v13.5h-14.5z"/><path d="M8 3.5V8h7M8 20.5V14h8v6.5"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11.5H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  skip: '<path d="M6 5l9 7-9 7z"/><path d="M18 5v14"/>',
  bike: '<circle cx="6" cy="16.5" r="3.5"/><circle cx="18" cy="16.5" r="3.5"/><path d="M6 16.5l4-8h5l3 8M10 8.5h-2M13 8.5l-3 8"/>',
  swim: '<path d="M2.5 18c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 3-1.5"/><path d="M7 14l4-6 3 3 3-2"/><circle cx="17" cy="6" r="1.8"/>',
  drop: '<path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.5 6-10.5z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

// Profile fields. The values are NOT in the code (the code is public): they come from the
// personal file imported once ("استرجاع نسخة"), or are typed in "تعديل".
const PROFILE = [
  ['بياناتي', [['age', 'السن'], ['sex', 'النوع'], ['height', 'الطول'], ['startW', 'وزن البداية'], ['bmi', 'BMI'], ['goal12', 'هدف 12 أسبوع'], ['goalFar', 'الهدف البعيد']]],
  ['الصحة', [['neck', 'الرقبة'], ['meds', 'أدوية'], ['allergy', 'حساسية أكل']]],
  ['حياتي', [['job', 'الشغل'], ['activity', 'النشاط'], ['sleep', 'النوم'], ['exp', 'الخبرة'], ['challenge', 'أكبر تحدي']]],
  ['أكلي', [['kcal', 'السعرات'], ['protein', 'البروتين'], ['fat', 'الدهون'], ['carbs', 'الكربوهيدرات'], ['water', 'المية'], ['bmr', 'BMR'], ['tdee', 'TDEE'], ['usual', 'أكلي المعتاد']]],
  ['تمريني', [['days', 'الأيام'], ['split', 'النظام'], ['session', 'مدة الجلسة'], ['gym', 'الجيم']]],
];

// ------------------------------------------------------------------ storage
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* ignore */ }
  s = Object.assign({ start: '2026-11-28', logs: {}, weights: {}, weekly: {}, profile: {}, meas: [], walks: {}, acts: [], custom: {}, theme: 'dark' }, s || {});
  // older versions stored walks as {date: 1}; turn them into activities (45 min)
  Object.entries(s.walks || {}).forEach(([d, v]) => { if (v) s.acts.push({ id: 'w' + d, d, type: 'walk', min: v === 1 ? 45 : +v }); });
  s.walks = {};
  return s;
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('مش قادر أحفظ'); } }
function applyTheme() {
  document.documentElement.setAttribute('data-theme', S.theme || 'dark');
  const dark = S.theme === 'dark' || (S.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#0b0d12' : '#f4f5f9';
}
applyTheme();

// ------------------------------------------------------------------ helpers
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return iso(d); };
const diffDays = (a, b) => Math.round((parseD(a) - parseD(b)) / 864e5);
const today = () => iso(new Date());
const nice = s => { const d = parseD(s); return DAYS[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1); };
const short = s => { const d = parseD(s); return d.getDate() + '/' + (d.getMonth() + 1); };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NUM = /(\d[\d.,]*%?(?:\s*[×–]\s*\d[\d.,]*%?)+)/g;
const nr = s => String(s).split(/(<[^>]+>)/).map(p => p.startsWith('<') ? p : p.replace(NUM, '<span class="nr">$1</span>')).join('');
const en = s => `<span class="en">${s}</span>`;
const num = v => { const x = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isNaN(x) ? null : x; };
const fmt = x => (Math.round(x * 10) / 10).toString();
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const img = (name, n = 0) => name === 'chin_tuck' ? `img/chin_tuck_${n}.svg` : `img/${name}_${n}.jpg`;
// a picture that switches between the start and the end position
const media = (name, title = '', sub = '', cls = '') => name
  ? `<div class="media flipper ${cls}"><span class="chip glass cap">البداية</span><img class="a" src="${img(name)}" alt=""><img class="b" src="${img(name, 1)}" alt="">
     ${title ? `<div class="ttl">${sub ? `<div class="s">${sub}</div>` : ''}<div class="n">${title}</div></div>` : ''}</div>`
  : `<div class="media noimg ${cls}">${ic('dumbbell')}${title ? `<div class="ttl"><div class="n">${title}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>` : ''}</div>`;
function startFlip() {
  clearInterval(animInt);
  if (!$('.flipper')) return;
  animInt = setInterval(() => $$('.flipper').forEach(m => {
    m.classList.toggle('flip'); const c = m.querySelector('.cap'); if (c) c.textContent = m.classList.contains('flip') ? 'النهاية' : 'البداية';
  }), 1700);
}
// library exercise, or one you added by name
function exInfo(k) {
  return EX[k] || { name: (S.custom && S.custom[k]) || 'تمرين', ar: 'تمرين من عندك', img: null, machine: '', muscles: '', sets: '3 × 10–12', rest: '60 ث', steps: [], avoid: [], neck: '', alt: '' };
}
function actXP(d) {   // ~2 XP for every 3 minutes, max 100 a day
  const mins = (S.acts || []).filter(a => a.d === d).reduce((t, a) => t + (+a.min || 0), 0);
  return Math.min(100, Math.round(mins * 2 / 3));
}
const xpT = n => `<span class="ltr" style="font-weight:800">+${n} XP</span>`;

function startWeight() {   // number in the profile's start weight, otherwise the first weight recorded
  const p = num(String(S.profile && S.profile.startW || '').replace(/[^\d.,]/g, ''));
  if (p != null) return p;
  const ds = Object.keys(S.weights).sort();
  return ds.length ? S.weights[ds[0]] : null;
}
// calWeek = calendar week since the start (for weekly reports, averages, streaks).
// weekOf  = program week (which workouts/sets): it stays behind when you repeat a week.
function calWeek(d) { return Math.floor(diffDays(d, S.start) / 7) + 1; }
function weekOf(d) {
  let n = diffDays(d, S.start);
  (S.shifts || []).forEach(s => { if (d >= s.from) n -= s.days; });
  return Math.floor(n / 7) + 1;
}
const totalShiftWeeks = () => (S.shifts || []).reduce((t, s) => t + s.days, 0) / 7;
const programEnd = () => addDays(S.start, (12 + totalShiftWeeks()) * 7 - 1);
function progWeek(d) { return Math.min(12, Math.max(1, weekOf(d))); }
function rotation(w) { return w <= 8 ? (w % 2 ? ['A', 'B', 'A'] : ['B', 'A', 'B']) : (w % 2 ? ['U', 'L', 'U'] : ['L', 'U', 'L']); }
function cardioFor(w) { return w <= 2 ? [15, '3–4%'] : w <= 4 ? [20, '4–5%'] : w <= 8 ? [25, '5–7%'] : [30, '6–8%']; }
function parseSets(s) {
  const m = s.match(/^(\d+)\s*×\s*(.+)$/);
  const nums = m[2].match(/\d+/g) || [];
  return { n: +m[1], reps: m[2], top: +nums[nums.length - 1], time: /ث/.test(m[2]) };
}
function planFor(type, w) {
  let items;
  if (type === 'U' || type === 'L') items = (type === 'U' ? UPPER : LOWER).map(([k, s]) => ({ k, s }));
  else {
    const keys = WORKOUTS[type].slice();
    if (w >= 5) keys.push(type === 'A' ? 'triceps' : 'curl');
    items = keys.map(k => ({ k, s: EX[k].sets }));
  }
  return items.map(({ k, s }) => {
    const p = parseSets(s);
    if (w <= 2 && type !== 'U' && type !== 'L') p.n = Math.min(2, p.n);
    return Object.assign({ k, orig: k, s: p.n + ' × ' + p.reps, bw: BODYWEIGHT.includes(k) }, p);
  });
}
// today's plan with any swaps applied (the swapped exercise keeps the same sets and reps)
function sessionPlan(d, type) {
  const l = S.logs[d] || {}, sw = l.swap || {};
  const plan = planFor(type || l.w || currentType(d) || 'A', progWeek(d)).map(it => sw[it.k] ? Object.assign({}, it, { k: sw[it.k], bw: BODYWEIGHT.includes(sw[it.k]) }) : it);
  // exercises you added yourself today
  (l.extra || []).forEach(x => {
    const p = parseSets(x.n + ' × ' + x.reps);
    plan.push(Object.assign({ k: x.k, orig: x.k, s: x.n + ' × ' + x.reps, bw: BODYWEIGHT.includes(x.k), extra: true }, p));
  });
  return plan;
}
function hasDone(d) { const l = S.logs[d]; return !!(l && l.ex && Object.values(l.ex).some(a => a.some(x => x.d))); }
function scheduled(d) {
  const w = progWeek(d), rot = rotation(w), wd = parseD(d).getDay();
  if (wd === 6) return { type: rot[0] };
  if (wd === 1) return { type: rot[1] };
  if (wd === 3) return { type: rot[2] };
  // a red-neck walking day also counts, so it isn't offered again as a makeup
  if (weekOf(d) >= 1 && wd === 0 && !isWorkout(addDays(d, -1))) return { type: rot[0], note: 'تعويض السبت' };
  if (weekOf(d) >= 1 && wd === 2 && !isWorkout(addDays(d, -1))) return { type: rot[1], note: 'تعويض الاتنين' };
  return null;
}
function currentType(d) { const l = S.logs[d]; if (l && l.w) return l.w; const s = scheduled(d); return s ? s.type : null; }
function getLog(d) { if (!S.logs[d]) S.logs[d] = { ex: {} }; if (!S.logs[d].ex) S.logs[d].ex = {}; return S.logs[d]; }
function setsFor(log, it) { const a = log.ex[it.k] || (log.ex[it.k] = []); while (a.length < it.n) a.push({ d: 0, kg: '', r: '' }); return a; }
function lastFor(k, before) {
  const ds = Object.keys(S.logs).filter(d => d < before).sort().reverse();
  for (const d of ds) { const a = S.logs[d].ex && S.logs[d].ex[k]; if (a && a.some(x => x.d)) return a.filter(x => x.d); }
  return null;
}
function lastKg(k, before) {
  const last = lastFor(k, before);
  const kgs = last ? last.map(x => num(x.kg)).filter(x => x != null) : [];
  return kgs.length ? Math.max(...kgs) : null;
}
function hintFor(it, d) {
  const last = lastFor(it.k, d);
  if (!last) return it.bw ? '' : `<div class="hint">${ic('info')}<span>أول مرة؟ اختار وزن تخلّص بيه ${nr(it.reps)} ولسه فاضلك 3.</span></div>`;
  const kg = lastKg(it.k, d);
  const allTop = last.length >= it.n && last.every(x => (num(x.r) || 0) >= it.top);
  if (!it.bw && !it.time && allTop && kg != null) return `<div class="hint up">${ic('up')}<span>آخر مرة كسّرتها! زوّد أصغر درجة النهارده.</span></div>`;
  return `<div class="hint">${ic('undo')}<span>آخر مرة: ${kg != null ? `<span class="ltr">${fmt(kg)} kg</span> • ` : ''}<span class="ltr">${last.map(x => esc(x.r || '—')).join(' / ')}</span></span></div>`;
}

// ------------------------------------------------------------------ PHOTOS (IndexedDB; S.photos only keeps {id, date})
let dbp = null;
function pdb() {
  return dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('gymPhotos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('p', { keyPath: 'id' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
}
function ptx(mode, fn) {
  return pdb().then(db => new Promise((res, rej) => {
    const t = db.transaction('p', mode), q = fn(t.objectStore('p'));
    t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error);
  }));
}
const pput = o => ptx('readwrite', s => s.put(o));
const pget = id => ptx('readonly', s => s.get(id));
const pdel = id => ptx('readwrite', s => s.delete(id));
const pall = () => ptx('readonly', s => s.getAll());
function shrink(file) {   // max 1080px JPEG, ~200 KB
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1080 / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', 0.82));
    };
    im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('img')); };
    im.src = u;
  });
}
function addPhoto(file) {
  return shrink(file).then(data => {
    const id = Date.now().toString(36), d = today();
    return pput({ id, d, data }).then(() => { S.photos = (S.photos || []).concat([{ id, d }]); save(); });
  });
}
function fillPhotos() { $$('img[data-pid]').forEach(el => pget(el.dataset.pid).then(p => { if (p) el.src = p.data; }).catch(() => {})); }
const photoBtn = (id, cls, label) => `<label class="btn ${cls}">${ic('camera')}${label}<input type="file" id="${id}" accept="image/*" hidden></label>`;
function bindPhotoInput(id, after) {
  const inp = $('#' + id); if (!inp) return;
  inp.addEventListener('change', () => { const f = inp.files[0]; if (f) addPhoto(f).then(after).catch(() => toast('مقدرتش أحفظ الصورة')); });
}
function viewPhoto(id) {
  pget(id).then(p => {
    if (!p) return;
    sheet(`<img class="viewimg" src="${p.data}" alt=""><div class="sheet-row"><b>${nice(p.d)}</b>
      <button class="btn ghost sm danger" id="pdel">${ic('trash')}مسح</button></div>`, (m, close) => {
      m.querySelector('#pdel').addEventListener('click', () => {
        if (!confirm('تمسح الصورة دي؟ مش هتقدر ترجّعها.')) return;
        pdel(id).then(() => { S.photos = (S.photos || []).filter(x => x.id !== id); save(); close(); render(true); });
      });
    });
  });
}

// ------------------------------------------------------------------ GAME (XP, levels, ranks, trophies)
// XP is recalculated from your real data, so undoing a set also removes its XP.
const XP = { set: 10, step: 20, full: 100, smart: 60, walk: 30, weight: 10, meas: 50, report: 30, pr: 25, photo: 20, protein: 20, water: 10 };
const RANKS = [[1, 'E', 'مبتدئ', '#6b7385', '#a3abbd'], [5, 'D', 'متدرب', '#16a34a', '#6ee7a8'], [10, 'C', 'ثابت', '#2563eb', '#60c2ff'],
  [15, 'B', 'قوي', '#7c3aed', '#d08bff'], [20, 'A', 'وحش', '#ea580c', '#ffb36b'], [27, 'S', 'أسطورة', '#d97706', '#ffe14d']];
const TROPHIES = [
  ['first', '🥇', 'أول خطوة', 'أول تمرين', s => s.workouts >= 1],
  ['full1', '✅', 'تمرين كامل', 'من الإحماء للتبريد', s => s.full >= 1],
  ['week1', '🔥', 'أسبوع كامل', '3 تمارين في أسبوع', s => s.fullWeeks >= 1],
  ['pr1', '⬆️', 'أول رقم قياسي', 'زوّد الوزن مرة', s => s.prs >= 1],
  ['meas', '📏', 'بالمقاس', 'سجّل مقاساتك', s => s.meas >= 1],
  ['photo1', '📸', 'قبل وبعد', 'أول صورة تقدّم', s => s.photos >= 1],
  ['protein7', '🍗', 'بروتين كامل', 'هدف البروتين 7 أيام', s => s.proteinDays >= 7],
  ['smart', '🛡️', 'قرار ذكي', 'ريّحت رقبتك', s => s.smart >= 1],
  ['weigh7', '⚖️', 'منضبط', 'وزن 7 أيام ورا بعض', s => s.wBest >= 7],
  ['walk10', '🚶', 'المشّاء', '10 أيام مشي', s => s.walks >= 10],
  ['w10', '💪', '10 تمارين', 'خلّص 10 تمارين', s => s.workouts >= 10],
  ['kg2', '📉', 'أول 2 كيلو', 'نزلت 2 كيلو', s => s.lost >= 2],
  ['report4', '📩', 'ملتزم', '4 رسايل متابعة', s => s.reports >= 4],
  ['streak4', '🗓️', 'شهر حديد', '4 أسابيع ورا بعض', s => s.bestStreak >= 4],
  ['pr10', '🏋️', '10 أرقام قياسية', 'زوّد الوزن 10 مرات', s => s.prs >= 10],
  ['kg5', '🔻', '5 كيلو', 'نزلت 5 كيلو', s => s.lost >= 5],
  ['rankA', '🅰️', 'رتبة A', 'مستوى 20', s => s.level >= 20],
  ['w25', '🦾', '25 تمرين', 'خلّص 25 تمرين', s => s.workouts >= 25],
  ['goal', '🎯', 'الهدف', 'نزلت 8 كيلو', s => s.lost >= 8],
  ['rankS', '⭐', 'رتبة S', 'مستوى 27', s => s.level >= 27],
  ['all12', '👑', 'الأسطورة', '12 أسبوع كاملين', s => s.fullWeeks >= 12],
];
const needFor = l => 50 + 25 * l;
function levelFrom(xp) { let l = 1, rest = xp; while (l < 50 && rest >= needFor(l)) { rest -= needFor(l); l++; } return { level: l, into: rest, need: needFor(l) }; }
function rankOf(l) { let r = RANKS[0]; RANKS.forEach(x => { if (l >= x[0]) r = x; }); return r; }
function isFull(d) {
  const l = S.logs[d]; if (!l || !l.w || !l.ex) return false;
  return !!(l.warm && l.cardio && l.cool) && sessionPlan(d).every(it => (l.ex[it.k] || []).filter(x => x.d).length >= it.n);
}
const isSmart = d => { const l = S.logs[d]; return !!(l && l.neck === 'r' && l.cardio); };
const isWorkout = d => hasDone(d) || isSmart(d);
function dayXP(d) {
  const l = S.logs[d]; if (!l) return 0;
  const sets = Object.values(l.ex || {}).reduce((a, arr) => a + arr.filter(x => x.d).length, 0);
  const extraCardio = l.cardio && l.cardioMin ? Math.max(0, l.cardioMin - cardioFor(progWeek(d))[0]) : 0;   // walked longer than planned
  return sets * XP.set + ['warm', 'cardio', 'cool'].filter(k => l[k]).length * XP.step + (isFull(d) ? XP.full : 0) + (isSmart(d) ? XP.smart : 0)
    + Math.min(60, Math.round(extraCardio * 2 / 3));
}
function stats() {
  let xp = 0, prs = 0, workouts = 0, full = 0, smart = 0;
  const best = {}, wk = {};
  Object.keys(S.logs).sort().forEach(d => {
    const l = S.logs[d];
    xp += dayXP(d);
    if (isWorkout(d)) { workouts++; const w = calWeek(d); if (w >= 1) wk[w] = (wk[w] || 0) + 1; }
    if (isFull(d)) full++;
    if (isSmart(d)) smart++;
    Object.entries(l.ex || {}).forEach(([k, a]) => {
      const kgs = a.filter(x => x.d).map(x => num(x.kg)).filter(x => x != null);
      if (!kgs.length) return;
      const m = Math.max(...kgs);
      if (best[k] != null && m > best[k]) prs++;
      if (best[k] == null || m > best[k]) best[k] = m;
    });
  });
  const actDays = [...new Set((S.acts || []).map(a => a.d))];
  const walks = new Set((S.acts || []).filter(a => a.type === 'walk' && a.min >= 20).map(a => a.d)).size;
  const reports = Object.values(S.weekly).filter(m => m && m.sent).length;
  const wds = Object.keys(S.weights).sort();
  const photos = new Set((S.photos || []).map(p => p.d)).size;
  const foodDays = Object.keys(S.food || {});
  const proteinDays = foodDays.filter(d => foodOf(d).p >= proteinTarget()).length, waterDays = foodDays.filter(d => foodOf(d).w >= waterTarget()).length;
  xp += proteinDays * XP.protein + waterDays * XP.water;
  xp += prs * XP.pr + actDays.reduce((t, d) => t + actXP(d), 0) + wds.length * XP.weight + S.meas.length * XP.meas + reports * XP.report + photos * XP.photo;
  const fullWeeks = Object.keys(wk).filter(w => wk[w] >= 3).length;
  const cw = calWeek(today());
  let streak = 0, w = (wk[cw] || 0) >= 3 ? cw : cw - 1;
  while (w >= 1 && (wk[w] || 0) >= 3) { streak++; w--; }
  let bestStreak = 0, run = 0;
  for (let i = 1; i <= 12 + totalShiftWeeks(); i++) { run = (wk[i] || 0) >= 3 ? run + 1 : 0; bestStreak = Math.max(bestStreak, run); }
  let wBest = 0, wRun = 0, pd = null;
  wds.forEach(d => { wRun = pd && diffDays(d, pd) === 1 ? wRun + 1 : 1; wBest = Math.max(wBest, wRun); pd = d; });
  const lv = levelFrom(xp);
  const latest = wds.length ? S.weights[wds[wds.length - 1]] : null, sw = startWeight();
  return Object.assign({ xp, prs, workouts, full, smart, walks, reports, fullWeeks, photos, proteinDays, streak, bestStreak, wBest, latest,
    meas: S.meas.length, lost: latest != null && sw != null ? sw - latest : 0, rank: rankOf(lv.level) }, lv);
}
const rankBadge = (r, cls = '') => `<div class="rank ${cls}" style="--c1:${r[3]};--c2:${r[4]}">${r[1]}</div>`;
function playerBar(s) {
  return `<button class="player" data-go="trophies">${rankBadge(s.rank)}<div class="pinfo">
    <div class="lvl"><b>LV ${s.level}</b><span class="rn">${s.rank[2]}</span>${s.streak ? `<span class="streak">${ic('flame')}${s.streak}</span>` : ''}</div>
    <div class="xpbar"><i style="width:${Math.round(s.into / s.need * 100)}%"></i></div>
    <div class="xpt"><span class="ltr">${s.into} / ${s.need} XP</span> للمستوى الجاي</div></div></button>`;
}
const QUEUE = [];
function award() {
  const s = stats();
  if (!S.trophies || S.seenLevel == null) {
    S.trophies = S.trophies || {};
    TROPHIES.forEach(t => { if (t[4](s) && !S.trophies[t[0]]) S.trophies[t[0]] = today(); });
    S.seenLevel = s.level; S.lastXP = s.xp; save(); return;
  }
  if (s.xp > (S.lastXP || 0)) xpPop(s.xp - (S.lastXP || 0));
  S.lastXP = s.xp;
  if (s.level > S.seenLevel) {
    const r = rankOf(s.level), old = rankOf(S.seenLevel);
    QUEUE.push(r[1] !== old[1] ? { badge: r, t: 'رتبة جديدة!', sub: `رتبة ${r[1]} • ${r[2]}` } : { lv: 1, t: '<span class="ltr">LEVEL UP</span>', sub: 'وصلت مستوى ' + s.level });
    S.seenLevel = s.level;
  }
  TROPHIES.forEach(t => { if (!S.trophies[t[0]] && t[4](s)) { S.trophies[t[0]] = today(); QUEUE.push({ e: t[1], t: t[2], sub: 'كأس جديد • ' + t[3] }); } });
  save(); showQueue();
}
function showQueue() {
  if (!QUEUE.length || $('.modal')) return;
  const q = QUEUE.shift(), m = document.createElement('div');
  m.className = 'modal';
  const top = q.badge ? rankBadge(q.badge, 'big') : q.lv ? `<div class="memo lv">${ic('up')}</div>` : `<div class="memo">${q.e}</div>`;
  m.innerHTML = `<div class="mbox">${top}<div class="mtt">${q.t}</div><div class="mss">${q.sub}</div><button class="btn gold">يلا!</button></div>`;
  m.querySelector('button').addEventListener('click', () => { m.remove(); showQueue(); });
  document.body.appendChild(m);
  if (navigator.vibrate) navigator.vibrate(80);
}
function xpPop(n) {
  const el = document.createElement('div'); el.className = 'xp-pop'; el.innerHTML = `${ic('bolt')}+${n} XP`; document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ------------------------------------------------------------------ bottom sheet
function sheet(html, onMount) {
  const m = document.createElement('div');
  m.className = 'sheet-bg';
  m.innerHTML = `<div class="sheet" role="dialog"><div class="grab"></div>${html}</div>`;
  document.body.appendChild(m);
  requestAnimationFrame(() => m.classList.add('open'));
  const close = () => { m.classList.remove('open'); setTimeout(() => m.remove(), 220); };
  m.addEventListener('click', e => { if (e.target === m) close(); });
  m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  if (onMount) onMount(m, close);
  return close;
}

// ------------------------------------------------------------------ routing (each screen remembers where you scrolled)
const NAV = { today: ['dumbbell', 'النهارده'], progress: ['chart', 'تقدّمي'], trophies: ['trophy', 'الإنجازات'], me: ['user', 'أنا'] };
const TAB_OF = { flow: 'today', meas: 'progress', edit: 'me' };
let exiFrom = 'me';
let route = 'today';
const scrollMem = {};
$$('nav button').forEach(b => {
  const [i, l] = NAV[b.dataset.tab]; b.innerHTML = ic(i) + l;
  b.addEventListener('click', () => go(b.dataset.tab, { top: route === b.dataset.tab }));   // tap the open tab again = back to top
});
function go(r, opt = {}) {
  if (r.startsWith('exi:') && !route.startsWith('exi:')) exiFrom = route;
  scrollMem[route] = window.scrollY;
  route = r; stopTimers(); render();
  window.scrollTo(0, opt.top || r.startsWith('flow') ? 0 : (scrollMem[r] || 0));
}
function render(keepScroll) {
  const y = window.scrollY;
  const [name, arg] = route.split(':');
  const tab = name === 'exi' ? (TAB_OF[exiFrom.split(':')[0]] || exiFrom.split(':')[0]) : (TAB_OF[name] || name);
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  document.body.classList.toggle('focus', name === 'flow');
  keepAwake(name === 'flow');
  const v = { today: vToday, flow: vFlow, progress: vProgress, meas: vMeas, me: vMe, edit: vEdit, exi: vExi, trophies: vTrophies }[name] || vToday;
  $('#app').innerHTML = v(arg);
  $$('#app [data-go]').forEach(el => el.addEventListener('click', () => { if (el.dataset.ptab) progTab = el.dataset.ptab; go(el.dataset.go); }));
  const b = BIND[name]; if (b) b(arg);
  if (keepScroll) window.scrollTo(0, y);
  award();
}
const BIND = {};
const header = (title, right = '') => `<div class="ph"><h1>${title}</h1>${right}</div>`;
const segs = (id, cur, items) => `<div class="seg" id="${id}">${items.map(([v, l]) => `<button data-v="${v}" class="${cur === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
function bindSeg(id, set) { $$('#' + id + ' button').forEach(b => b.addEventListener('click', () => { set(b.dataset.v); window.scrollTo(0, 0); render(); })); }

// ------------------------------------------------------------------ TODAY
function flowSteps(d) {
  const plan = sessionPlan(d, currentType(d));
  return [{ id: 'neck' }, { id: 'warm' }, ...plan.map(it => ({ id: 'ex', it })), { id: 'cardio' }, { id: 'cool' }, { id: 'done' }];
}
function stepDone(st, log) {
  if (!log) return false;
  if (st.id === 'neck') return !!log.neck;
  if (st.id === 'ex') return (log.ex[st.it.k] || []).filter(x => x.d).length >= st.it.n || !!(log.skip || {})[st.it.k];
  if (st.id === 'done') return false;
  return !!log[st.id];
}
function started(d) { const l = S.logs[d]; return !!(l && (l.neck || l.warm || l.cardio || hasDone(d))); }
function cancelWorkout(d) {
  if (!confirm('هيتمسح كل اللي سجّلته في تمرين النهارده. متأكد؟')) return false;
  delete S.logs[d]; save(); toast('اتلغى تمرين النهارده'); return true;
}
function row(i, st, log, w, nextIdx) {
  const dn = stepDone(st, log);
  let th, t, sub, tag = '';
  if (st.id === 'ex') {
    const e = exInfo(st.it.k);
    th = e.img ? `<img class="th" src="${img(e.img)}" alt="">` : `<span class="th">${ic('dumbbell')}</span>`; t = en(esc(e.name)); sub = nr(st.it.s);
    if (st.it.k !== st.it.orig) tag = '<span class="tag">بديل</span>';
    if (st.it.extra) tag = '<span class="tag">إضافي</span>';
    if ((log && log.skip || {})[st.it.k]) tag = '<span class="tag">اتخطّى</span>';
  } else {
    const m = { neck: ['الرقبة النهارده', 'سؤال واحد', null, 'shield'], warm: ['الإحماء', '7 دقايق', 'Bicycling_Stationary'],
      cardio: ['مشي تريدميل', cardioFor(w)[0] + ' دقيقة', 'Walking_Treadmill'], cool: ['التبريد', '5 دقايق', 'Kneeling_Hip_Flexor'] }[st.id];
    th = m[2] ? `<img class="th" src="${img(m[2])}" alt="">` : `<span class="th">${ic(m[3])}</span>`; t = m[0]; sub = m[1];
  }
  return `<li class="${dn ? 'done' : ''} ${i === nextIdx ? 'next' : ''}" data-go="flow:${i}">${th}<span class="nm">${t}${tag}<small>${sub}</small></span><span class="st">${dn ? ic('check') : ''}</span></li>`;
}
function vToday() {
  const d = today(), w0 = weekOf(d), w = progWeek(d), type = currentType(d), s = stats();
  let h = `<div class="topbar"><div><div class="brand">RANK UP</div><div class="d">${nice(d)}</div></div><button class="chip" id="weekChip">${ic('cal')}أسبوع ${w} من 12${isRepeat(d) ? ' • تكرار' : ''}</button></div>`;
  h += playerBar(s);
  if (w0 < 1) h += `<p class="small center" style="margin:10px 0 0">البرنامج بيبدأ ${nice(S.start)} • تقدر تجرّب من دلوقتي</p>`;
  if (s.workouts >= 1 && (!S.lastBackup || diffDays(d, S.lastBackup) >= 14))
    h += `<div class="note warn"><span class="ic">${ic('save')}</span><span>بقالك أسبوعين من غير نسخة احتياطية</span><button class="go" id="backupNow">احفظ</button></div>`;

  if (!type) {   // walk / rest day
    const wd = parseD(d).getDay(), walk = wd === 0 || wd === 2;
    const walked = (S.acts || []).filter(a => a.d === d && a.type === 'walk').reduce((t, a) => t + (+a.min || 0), 0);
    h += `<div class="quest" style="--bg-img:url(${img('Walking_Treadmill')})">
      <span class="chip glass lab">${ic('target')}مهمة النهارده</span>
      <div class="t">${walk ? 'امشي' : 'يوم راحة'}</div>
      <div class="meta"><span class="chip glass">${ic('walk')}${walk ? 'على الأقل 30 دقيقة' : 'مشي خفيف لو حابب'}</span><span class="chip gold">${ic('bolt')}كل ما تمشي أكتر XP أكتر</span></div>
      <button class="btn ${walked ? 'ok' : 'white'}" id="walk">${walked ? ic('check') + `مشيت ${walked} دقيقة` : ic('walk') + 'سجّل المشي'}</button></div>`;
    h += foodCard(d);
    h += actsBlock(d);
    h += '<h2>مهام صغيرة</h2>';
    h += `<button class="task" data-go="progress" data-ptab="weight">${ic('scale')}<span>سجّل وزنك النهارده</span>${S.weights[d] ? `<span class="ok-ic">${ic('check')}</span>` : xpT(10)}</button>`;
    if (wd === 4) h += `<button class="task" data-go="progress" data-ptab="week">${ic('msg')}<span>ابعت متابعة الأسبوع</span>${xpT(30)}</button>`;
    h += `<button class="task" data-pick="${rotation(w)[0]}">${ic('dumbbell')}<span>اتمرنت النهارده برضه؟</span>${ic('chev')}</button>`;
    return h;
  }

  const log = S.logs[d], steps = flowSteps(d), real = steps.filter(x => x.id !== 'done');
  const nDone = real.filter(x => stepDone(x, log)).length, finished = nDone === real.length;
  const exIdx = steps.map((x, i) => x.id === 'ex' ? i : -1).filter(i => i >= 0);
  const sch = scheduled(d), nextIdx = steps.findIndex(x => x.id !== 'done' && !stepDone(x, log));
  const maxXP = exIdx.reduce((a, i) => a + steps[i].it.n * XP.set, 0) + 3 * XP.step + XP.full;
  h += `<div class="quest" style="--bg-img:url(${img(EX[steps[exIdx[0]].it.k].img)})">
    <span class="chip glass lab">${ic('target')}${sch && sch.note && !(log && log.w) ? sch.note : 'مهمة النهارده'}</span>
    <div class="t en2">${LABEL[type]}</div>
    <div class="meta"><span class="chip glass">${ic('dumbbell')}${exIdx.length} تمارين</span><span class="chip glass">${ic('cal')}60 د</span><span class="chip gold">${ic('bolt')}${xpT(maxXP)}</span></div>
    <div class="bar"><i style="width:${Math.round(nDone / real.length * 100)}%"></i></div>
    <button class="btn white play" id="startBtn">${finished ? ic('trophy') + 'شوف النتيجة' : ic('play') + (started(d) ? 'كمّل' : 'ابدأ')}</button>
    ${started(d) && !finished ? `<button class="qlink" id="cancelW">${ic('x')}إلغاء التمرين</button>`
      : !sch && log && log.w ? `<button class="qlink" id="closeW">${ic('x')}اقفل التمرين (رجوع ليوم ${parseD(d).getDay() === 0 || parseD(d).getDay() === 2 ? 'المشي' : 'الراحة'})</button>` : ''}</div>`;
  const group = (title, ids) => `<h2>${title}</h2><ul class="tl">${ids.map(i => row(i, steps[i], log, w, nextIdx)).join('')}</ul>`;
  h += foodCard(d);
  h += group('قبل التمرين', [0, 1]);
  h += group(`التمارين • ${exIdx.length}`, exIdx);
  h += `<button class="addrow" id="addEx">${ic('plus')}أضف تمرين</button>`;
  h += group('بعد التمرين', [steps.length - 3, steps.length - 2]);
  h += actsBlock(d);
  if (!started(d)) {
    const other = (w <= 8 ? ['A', 'B'] : ['U', 'L']).find(x => x !== type);
    h += `<p class="center"><button class="tlink" data-pick="${other}">${ic('swap')}بدّل لـ ${en(LABEL[other])}</button></p>`;
  }
  return h;
}
BIND.today = () => {
  const d = today();
  const sb = $('#startBtn');
  if (sb) sb.addEventListener('click', () => {
    const log = S.logs[d], steps = flowSteps(d), i = steps.findIndex(x => x.id !== 'done' && !stepDone(x, log));
    go('flow:' + (i < 0 ? steps.length - 1 : i));
  });
  const cw = $('#cancelW'); if (cw) cw.addEventListener('click', () => { if (cancelWorkout(d)) render(true); });
  const clw = $('#closeW'); if (clw) clw.addEventListener('click', () => { delete S.logs[d]; save(); render(true); });
  $$('[data-pick]').forEach(b => b.addEventListener('click', () => { getLog(d).w = b.dataset.pick; save(); render(true); }));
  const wk = $('#walk'); if (wk) wk.addEventListener('click', () => actSheet(d, 'walk'));
  const bk = $('#backupNow'); if (bk) bk.addEventListener('click', exportData);
  const ae = $('#addEx'); if (ae) ae.addEventListener('click', () => addExSheet(d));
  bindActs(d);
  bindFood(d);
  const wc = $('#weekChip'); if (wc) wc.addEventListener('click', weekSheet);
};

// ------------------------------------------------------------------ week control (repeat a week, the program waits for you)
const isRepeat = d => calWeek(d) >= 1 && weekOf(d) >= 1 && weekOf(d) === weekOf(addDays(d, -7));
function weekSheet() {
  const d = today(), cw = calWeek(d);
  if (cw < 1) return toast('البرنامج لسه مبدأش');
  const k = diffDays(d, S.start) % 7, thisStart = addDays(d, -k), nextStart = addDays(thisStart, 7), w = progWeek(d);
  sheet(`<h3 class="sh-t">أسبوع ${w} من 12</h3>
    <p class="small">البرنامج بيخلص يوم ${nice(programEnd())}. لو أسبوع فاتك أو كان صعب، كرره بدل ما تتنقل للأصعب.</p>
    <button class="btn" id="repNext">${ic('undo')}كرر الأسبوع ده الأسبوع الجاي</button>
    ${w > 1 ? `<button class="btn ghost" id="repBack">${ic('back')}فاتني الأسبوع اللي فات: ارجع أسبوع من النهارده</button>` : ''}
    ${(S.shifts || []).length ? `<button class="btn ghost" id="repUndo">${ic('x')}الغي آخر تكرار</button>` : ''}`, (m, close) => {
    const done = msg => { save(); close(); toast(msg); render(true); };
    m.querySelector('#repNext').addEventListener('click', () => { (S.shifts = S.shifts || []).push({ from: nextStart, days: 7 }); done('الأسبوع الجاي هيبقى أسبوع ' + w + ' تاني'); });
    const rb = m.querySelector('#repBack'); if (rb) rb.addEventListener('click', () => { (S.shifts = S.shifts || []).push({ from: thisStart, days: 7 }); done('رجعنا أسبوع ' + (w - 1)); });
    const ru = m.querySelector('#repUndo'); if (ru) ru.addEventListener('click', () => { S.shifts.pop(); done('اتلغى'); });
  });
}

// ------------------------------------------------------------------ protein & water (quick taps, estimates)
const FOODS = [['egg', 'بيضة', 6], ['chicken', 'صدر فراخ 100 جم', 31], ['areesh', 'جبنة قريش 100 جم', 14], ['greek', 'زبادي يوناني كوباية', 17],
  ['tuna', 'علبة تونة', 25], ['meat', 'لحمة أو كفتة 100 جم', 26], ['fish', 'سمك 100 جم', 22], ['milk', 'كوباية لبن أو رايب', 8],
  ['yogurt', 'زبادي عادي', 5], ['foul', 'طبق فول', 13], ['lentil', 'طبق عدس', 18], ['bread', 'رغيف بلدي', 8]];
const proteinTarget = () => num(String(S.profile && S.profile.protein || '').replace(/[^\d.]/g, '')) || 150;
const waterTarget = () => { const v = num(String(S.profile && S.profile.water || '').replace(/[^\d.]/g, '')); return v ? (v < 20 ? v * 1000 : v) : 3000; };
function foodOf(d) { const f = (S.food || {})[d] || {}; const items = f.items || []; return { items, p: items.reduce((t, x) => t + (+x.p || 0), 0), w: +f.water || 0 }; }
function foodRec(d) { S.food = S.food || {}; return S.food[d] || (S.food[d] = { items: [], water: 0 }); }
function foodCard(d) {
  const f = foodOf(d), pt = proteinTarget(), wt = waterTarget();
  const bar = (v, t) => `<div class="fbar"><i style="width:${Math.min(100, Math.round(v / t * 100))}%"></i></div>`;
  return `<div class="foodcard">
    <button class="frow" id="addProt"><span class="fic">${ic('food')}</span><span class="fmain"><b>بروتين <span class="ltr">${f.p} / ${pt}</span> جم</b>${bar(f.p, pt)}</span><span class="fplus">${ic('plus')}</span></button>
    <div class="frow"><span class="fic water">${ic('drop')}</span><span class="fmain"><b>مية <span class="ltr">${fmt(f.w / 1000)} / ${fmt(wt / 1000)}</span> لتر</b>${bar(f.w, wt)}</span>
      ${f.w ? `<button class="fminus" id="subWater" aria-label="شيل كوباية">${ic('minus')}</button>` : ''}<button class="fplus" id="addWater">${ic('plus')}<small>كوباية</small></button></div>
  </div>`;
}
function foodSheet(d) {
  const draw = m => {
    const f = foodOf(d);
    m.querySelector('#fsum').innerHTML = `<b class="ltr">${f.p} / ${proteinTarget()} جم</b> ${f.p >= proteinTarget() ? '✅' : ''}`;
    m.querySelector('#flist').innerHTML = f.items.length ? f.items.map(x => `<div class="actrow"><b>${esc(x.n)}</b><span class="ltr">+${x.p} g</span><button class="iconbtn" data-delf="${x.id}">${ic('x')}</button></div>`).join('')
      : '<p class="small center">لسه مسجلتش حاجة النهارده</p>';
    m.querySelectorAll('[data-delf]').forEach(b => b.addEventListener('click', () => { const r = foodRec(d); r.items = r.items.filter(x => x.id !== b.dataset.delf); save(); draw(m); }));
  };
  const add = (m, n, p) => { foodRec(d).items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), n, p }); save(); draw(m); toast('+' + p + ' جم بروتين'); };
  sheet(`<h3 class="sh-t">بروتين النهارده</h3><div id="fsum" class="small"></div>
    <p class="small">دوس على اللي أكلته (الأرقام تقريبية):</p>
    <div class="foods">${FOODS.map(([k, n, p]) => `<button data-food="${k}"><b>${n}</b><span class="ltr">+${p} g</span></button>`).join('')}</div>
    <div class="field"><input class="wide" id="fname" placeholder="حاجة تانية (اختياري)"><input id="fgr" inputmode="numeric" placeholder="جم" style="width:80px"><button class="btn sm" id="fadd">${ic('plus')}</button></div>
    <h3 style="margin-top:12px">اللي سجّلته</h3><div id="flist"></div>
    <button class="btn" data-close>تمام</button>`, (m, close) => {
    draw(m);
    m.querySelectorAll('[data-food]').forEach(b => b.addEventListener('click', () => { const x = FOODS.find(f => f[0] === b.dataset.food); add(m, x[1], x[2]); }));
    m.querySelector('#fadd').addEventListener('click', () => {
      const p = Math.round(num(m.querySelector('#fgr').value) || 0);
      if (p < 1 || p > 200) return toast('اكتب الجرامات صح');
      add(m, m.querySelector('#fname').value.trim() || 'بروتين', p); m.querySelector('#fgr').value = ''; m.querySelector('#fname').value = '';
    });
    m.addEventListener('click', e => { if (e.target === m) render(true); });
    m.querySelector('[data-close]').addEventListener('click', () => render(true));
  });
}
function bindFood(d) {
  const ap = $('#addProt'); if (ap) ap.addEventListener('click', () => foodSheet(d));
  const aw = $('#addWater'); if (aw) aw.addEventListener('click', () => { foodRec(d).water = (+foodRec(d).water || 0) + 250; save(); toast('+250 مل مية'); render(true); });
  const sw = $('#subWater'); if (sw) sw.addEventListener('click', () => { foodRec(d).water = Math.max(0, (+foodRec(d).water || 0) - 250); save(); toast('اتشالت كوباية'); render(true); });
}

// ------------------------------------------------------------------ strength history
function exHistory(k) {
  return Object.keys(S.logs).sort().map(d => {
    const done = ((S.logs[d].ex || {})[k] || []).filter(x => x.d);
    if (!done.length) return null;
    const kgs = done.map(x => num(x.kg)).filter(x => x != null);
    return { d, kg: kgs.length ? Math.max(...kgs) : null, reps: done.map(x => x.r || '?').join('/') };
  }).filter(Boolean);
}
function lineChart(vs, h = 100, small = false) {
  if (vs.length < 2) return '';
  const mn = Math.min(...vs) - .5, mx = Math.max(...vs) + .5, W = 320, H = h;
  const pts = vs.map((v, i) => [i / (vs.length - 1) * W, H - (v - mn) / (mx - mn) * H]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return `<div class="chart ${small ? 'spark' : ''}"><svg viewBox="0 -8 ${W} ${H + 16}" preserveAspectRatio="none">
    <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c5cff" stop-opacity=".35"/><stop offset="1" stop-color="#7c5cff" stop-opacity="0"/></linearGradient>
    <linearGradient id="cl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#3fa9ff"/></linearGradient></defs>
    ${small ? '' : `<path d="${line} L${W} ${H + 8} L0 ${H + 8} Z" fill="url(#cg)"/>`}
    <path d="${line}" fill="none" stroke="url(#cl)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="${small ? 4 : 5}" fill="#3fa9ff" stroke="var(--surface)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></div>`;
}
function pStrength() {
  const keys = [...new Set(Object.values(S.logs).flatMap(l => Object.keys(l.ex || {})))].filter(k => exHistory(k).length);
  if (!keys.length) return `<div class="empty">${ic('dumbbell')}<b>لسه مفيش تمارين متسجلة</b><span>بعد أول تمرين هتشوف هنا قوتك بتزيد إزاي في كل تمرين.</span></div>`;
  const rows = keys.map(k => { const hs = exHistory(k), kgs = hs.map(x => x.kg).filter(x => x != null); return { k, hs, kgs, last: hs[hs.length - 1].d }; })
    .sort((a, b) => a.last < b.last ? 1 : -1);
  return `<p class="small">أعلى وزن في كل جلسة. دوس على أي تمرين تشوف التفاصيل.</p>` + rows.map(({ k, hs, kgs }) => {
    const e = exInfo(k), first = kgs[0], best = kgs.length ? Math.max(...kgs) : null;
    return `<button class="strow" data-go="exi:${k}">${e.img ? `<img src="${img(e.img)}" alt="">` : `<span class="th">${ic('dumbbell')}</span>`}
      <span class="stx"><b class="ltr">${esc(e.name)}</b><small>${best != null ? `<span class="ltr">${fmt(first)} → ${fmt(best)} kg</span>` : 'وزن الجسم'} • ${hs.length} ${hs.length === 1 ? 'جلسة' : hs.length <= 10 ? 'جلسات' : 'جلسة'}</small></span>
      <span class="stc">${kgs.length >= 2 ? lineChart(kgs, 40, true) : ''}</span></button>`;
  }).join('');
}
function strengthCard(k) {
  const hs = exHistory(k); if (!hs.length) return '';
  const kgs = hs.map(x => x.kg).filter(x => x != null);
  return `<h2>تقدّمك في التمرين ده</h2><div class="card">${kgs.length >= 2 ? lineChart(kgs) : ''}
    <div class="list-plain flat">${hs.slice().reverse().slice(0, 10).map(x => `<div class="r"><span class="k">${nice(x.d)}</span><span class="v ltr">${x.kg != null ? fmt(x.kg) + ' kg × ' : ''}${esc(x.reps)}</span></div>`).join('')}</div></div>`;
}

// ------------------------------------------------------------------ neck trend
function neckCard() {
  const days = Object.keys(S.logs).sort().filter(d => S.logs[d].neck).slice(-28);
  const wk = Object.keys(S.weekly).map(Number).sort((a, b) => a - b).map(w => num(S.weekly[w].neck)).filter(x => x != null);
  if (!days.length && !wk.length) return `<h2>الرقبة</h2><div class="empty">${ic('shield')}<b>لسه مفيش بيانات</b><span>كل تمرين بيسألك عن رقبتك، وهنا هتشوف بتتحسن ولا لأ.</span></div>`;
  const cnt = c => days.filter(d => S.logs[d].neck === c).length;
  const score = c => ({ g: 1, y: 2, r: 3 }[c]);
  const half = Math.floor(days.length / 2), avg = a => a.reduce((t, d) => t + score(S.logs[d].neck), 0) / (a.length || 1);
  let trend = '';
  if (days.length >= 6) { const a = avg(days.slice(0, half)), b = avg(days.slice(half)); trend = b < a - .15 ? '📉 بتتحسن' : b > a + .15 ? '📈 بتزيد، قولّي' : '➖ ثابتة'; }
  return `<h2>الرقبة</h2><div class="card">
    <div class="neckdots">${days.map(d => `<i class="n-${S.logs[d].neck}" title="${d}"></i>`).join('')}</div>
    <div class="necksum"><span>🟢 ${cnt('g')}</span><span>🟡 ${cnt('y')}</span><span>🔴 ${cnt('r')}</span>${trend ? `<b>${trend}</b>` : ''}</div>
    ${wk.length >= 2 ? `<div class="small" style="margin-top:8px">تقييمك كل خميس (من 10):</div>${lineChart(wk, 60)}` : ''}</div>`;
}

// ------------------------------------------------------------------ activities (walk, football, swim... with minutes)
function actsBlock(d) {
  const list = (S.acts || []).filter(a => a.d === d);
  return `<h2>نشاط النهارده</h2>${list.map(a => `<div class="actrow">${ic((ACTS.find(x => x[0] === a.type) || ACTS[5])[2])}
    <b>${esc(actName(a))}</b><span class="ltr">${a.min} min</span><button class="iconbtn" data-delact="${a.id}" aria-label="مسح">${ic('x')}</button></div>`).join('')}
    <button class="addrow" id="addAct">${ic('plus')}سجّل نشاط (مشي، كورة، سباحة...)</button>`;
}
function bindActs(d) {
  const b = $('#addAct'); if (b) b.addEventListener('click', () => actSheet(d));
  $$('[data-delact]').forEach(x => x.addEventListener('click', () => {
    if (!confirm('تمسح النشاط ده؟')) return;
    S.acts = S.acts.filter(a => a.id !== x.dataset.delact); save(); render(true);
  }));
}
function actSheet(d, preset) {
  let type = preset || 'walk', min = 45;
  sheet(`<h3 class="sh-t">سجّل نشاط</h3><p class="small">كل 3 دقايق = 2 XP (لحد 100 XP في اليوم)</p>
    <div class="pills" id="atype">${ACTS.map(([v, l, i]) => `<button data-v="${v}" class="${v === type ? 'on' : ''}">${ic(i)}${l}</button>`).join('')}</div>
    <div class="field col" id="aname" style="display:none"><label>اسم النشاط</label><input class="wide" id="anameIn" placeholder="مثلًا: تنس، يوجا..."></div>
    <div class="small" style="margin-top:12px">كام دقيقة؟</div>
    <div class="pills" id="amin">${[15, 30, 45, 60, 90, 120].map(v => `<button data-v="${v}" class="${v === min ? 'on' : ''}"><span class="ltr">${v}</span></button>`).join('')}</div>
    <div class="picker" style="margin-top:10px"><div class="l">أو اكتب الدقايق</div><input id="aminIn" inputmode="numeric" value="${min}">
    <div class="pm"><button data-astep="-5">${ic('minus')}</button><button data-astep="5">${ic('plus')}</button></div></div>
    <button class="btn" id="aSave">${ic('check')}حفظ</button>`, (m, close) => {
    const minIn = m.querySelector('#aminIn');
    const pick = (box, v) => m.querySelectorAll(box + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
    m.querySelectorAll('#atype button').forEach(b => b.addEventListener('click', () => {
      type = b.dataset.v; pick('#atype', type); m.querySelector('#aname').style.display = type === 'other' ? '' : 'none';
    }));
    m.querySelectorAll('#amin button').forEach(b => b.addEventListener('click', () => { minIn.value = b.dataset.v; pick('#amin', b.dataset.v); }));
    m.querySelectorAll('[data-astep]').forEach(b => b.addEventListener('click', () => {
      minIn.value = Math.max(5, (num(minIn.value) || 0) + +b.dataset.astep); pick('#amin', minIn.value);
    }));
    minIn.addEventListener('input', () => pick('#amin', minIn.value));
    m.querySelector('#aSave').addEventListener('click', () => {
      const v = Math.round(num(minIn.value) || 0);
      if (v < 1 || v > 600) return toast('اكتب عدد دقايق صح');
      const a = { id: Date.now().toString(36), d, type, min: v };
      if (type === 'other') a.name = m.querySelector('#anameIn').value.trim() || 'نشاط';
      S.acts = (S.acts || []).concat([a]); save(); close(); render(true);
    });
  });
}

// ------------------------------------------------------------------ add an exercise to today's workout
function addExSheet(d) {
  let n = 3;
  const inPlan = sessionPlan(d).map(it => it.k);
  const lib = Object.keys(EX).filter(k => !inPlan.includes(k));
  sheet(`<h3 class="sh-t">أضف تمرين للنهارده</h3>
    <div class="small">عدد المجموعات</div>
    <div class="pills" id="xn">${[2, 3, 4].map(v => `<button data-v="${v}" class="${v === n ? 'on' : ''}"><span class="ltr">${v}</span></button>`).join('')}</div>
    <div class="field"><label>العدات</label><input id="xreps" value="10–12" style="width:120px"></div>
    <h3 style="margin-top:14px">من مكتبة التمارين</h3>
    <div class="searchbox">${ic('search')}<input id="xq" placeholder="دوّر على تمرين..."></div>
    <div class="exlist">${lib.map(k => `<button class="exrow" data-add="${k}"><img src="${img(EX[k].img)}" alt=""><div class="n"><b>${EX[k].name}</b><span>${EX[k].ar}</span></div><span class="addic">${ic('plus')}</span></button>`).join('')}</div>
    <h3 style="margin-top:14px">أو تمرين باسم من عندك</h3>
    <div class="field"><input class="wide" id="xname" placeholder="مثلًا: Hip Abduction Machine"><button class="btn sm" id="xcustom">${ic('plus')}أضف</button></div>`, (m, close) => {
    m.querySelectorAll('#xn button').forEach(b => b.addEventListener('click', () => {
      n = +b.dataset.v; m.querySelectorAll('#xn button').forEach(x => x.classList.toggle('on', x === b));
    }));
    const add = k => {
      const reps = (m.querySelector('#xreps').value.trim() || '10–12').replace(/-/g, '–');
      const l = getLog(d); if (!l.w) l.w = currentType(d);
      l.extra = (l.extra || []).concat([{ k, n, reps }]); save(); close(); render(true); toast('اتضاف للتمارين');
    };
    m.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => add(b.dataset.add)));
    m.querySelector('#xq').addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      m.querySelectorAll('[data-add]').forEach(b => { const x = EX[b.dataset.add]; b.style.display = !q || (x.name + ' ' + x.ar).toLowerCase().includes(q) ? '' : 'none'; });
    });
    m.querySelector('#xcustom').addEventListener('click', () => {
      const name = m.querySelector('#xname').value.trim();
      if (!name) return toast('اكتب اسم التمرين');
      const k = 'c_' + name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w؀-ۿ_]/g, '').slice(0, 40);
      S.custom = S.custom || {}; S.custom[k] = name;
      add(k);
    });
  });
}

// ------------------------------------------------------------------ WORKOUT (one step at a time)
let restEnd = 0, restTotal = 60, restInt = null, animInt = null;
function stopTimers() { clearInterval(restInt); clearInterval(animInt); restEnd = 0; }
function exitSheet(d) {
  sheet(`<h3 class="sh-t">توقف التمرين؟</h3><p class="small">اللي سجّلته محفوظ. تقدر تكمّل في أي وقت النهارده.</p>
    <button class="btn" data-close>${ic('play')}كمّل التمرين</button>
    <button class="btn ghost" id="pauseW">${ic('pause')}وقّف دلوقتي وارجع</button>
    <button class="btn ghost danger" id="cancelW2">${ic('trash')}إلغاء التمرين ومسح اللي اتسجّل</button>`, (m, close) => {
    m.querySelector('#pauseW').addEventListener('click', () => { close(); go('today'); });
    m.querySelector('#cancelW2').addEventListener('click', () => { if (cancelWorkout(d)) { close(); go('today', { top: true }); } });
  });
}
function howSheet(k) {
  const e = EX[k];
  sheet(`<h3 class="sh-t ltr" style="text-align:right">${e.name}</h3><p class="small">${e.ar} • ${e.muscles}</p>
    <div class="howrow"><img src="${img(e.img)}" alt=""><img src="${img(e.img, 1)}" alt=""></div>
    <h3>الطريقة</h3><ol class="steps-ol">${e.steps.map(x => `<li>${nr(x)}</li>`).join('')}</ol>
    <h3 style="color:var(--bad)">تجنّب</h3><ul class="steps-ol">${e.avoid.map(x => `<li>${x}</li>`).join('')}</ul>
    ${e.neck ? `<div class="callout">${ic('shield')}<span>${e.neck}</span></div>` : ''}
    <button class="btn ghost" data-close>تمام</button>`);
}
function swapSheet(d, it) {
  const log = getLog(d), cur = it.k, orig = it.orig, swapped = cur !== orig, target = swapped ? orig : (ALT[orig] || null);
  if (!target) return toast('مفيش بديل للتمرين ده');
  const e = EX[target], done = (log.ex[cur] || []).some(x => x.d);
  sheet(`<h3 class="sh-t">${swapped ? 'ترجع للتمرين الأصلي؟' : 'الجهاز مشغول؟ اعمل ده بداله'}</h3>
    <div class="altcard"><img src="${img(e.img)}" alt=""><div><b class="ltr" style="display:block;text-align:right">${e.name}</b><span class="small">${e.ar}</span>
    <div class="small">${e.muscles}</div></div></div>
    <p class="small">نفس عدد المجموعات والعدات: ${nr(it.s)}</p>
    ${done ? '<div class="callout">' + ic('info') + '<span>سجّلت مجموعات في التمرين الحالي. لو بدّلت، المجموعات دي هتفضل محسوبة.</span></div>' : ''}
    <button class="btn" id="doSwap">${ic('swap')}${swapped ? 'رجّع ' + en(e.name) : 'بدّل لـ ' + en(e.name)}</button>
    <button class="btn ghost" data-close>لأ، خليه</button>`, (m, close) => {
    m.querySelector('#doSwap').addEventListener('click', () => {
      log.swap = log.swap || {};
      if (swapped) delete log.swap[orig]; else log.swap[orig] = target;
      if (!log.w) log.w = currentType(d);
      save(); close(); stopTimers(); render(); window.scrollTo(0, 0);
    });
  });
}
function vFlow(arg) {
  const d = today(), i = +arg, steps = flowSteps(d), st = steps[i], w = progWeek(d);
  if (!st) return vToday();
  const log = getLog(d); if (!log.w) log.w = currentType(d);
  let h = `<div class="ftop"><button class="x" id="exitW" aria-label="خروج">${ic('x')}</button>
    <div class="segs">${steps.map((s, j) => `<i class="${j === i ? 'cur' : stepDone(s, log) ? 'on' : ''}"></i>`).join('')}</div>
    <span class="fcount">${Math.min(i + 1, steps.length - 1)}/${steps.length - 1}</span></div>`;

  if (st.id === 'neck') {
    return h + `<h1>رقبتك عاملة إيه؟</h1><p class="small">قيّم الألم النهارده من 0 لـ 10</p>
      <button class="choice" data-neck="g"><span class="dot" style="background:var(--ok)">${nr('0–4')}</span><span><b>كويسة</b><small>تمرين عادي</small></span></button>
      <button class="choice" data-neck="y"><span class="dot" style="background:var(--warn)">${nr('5–6')}</span><span><b>فيها شوية ألم</b><small>نص الوزن في تمارين الجزء العلوي</small></span></button>
      <button class="choice" data-neck="r"><span class="dot" style="background:var(--bad)">${nr('7–10')}</span><span><b>وجعاني</b><small>مشي وإطالة بس • ${xpT(60)} على القرار الذكي</small></span></button>`;
  }
  const undoBar = mark => log[mark] ? `<div class="donebar">${ic('check')}<span>اتسجّل إنك خلصته</span><button class="tlink" data-unmark="${mark}">${ic('undo')}الغي</button></div>` : '';
  const moves = (title, sub, items, mark, label) => h + `<h1>${title}</h1><p class="small">${sub}</p>${undoBar(mark)}` +
    items.map(([im, t, e, s], j) => `<div class="item">${media(im, '', '', 'sm')}<div class="tx"><span class="num-badge">${j + 1}</span><div><b>${t}</b> ${en(e)}<div class="small">${nr(s)}</div></div></div></div>`).join('') +
    `<div class="stickybar">${log[mark] ? `<button class="btn" data-go="flow:${i + 1}">كمّل ${ic('chev')}</button>` : `<button class="btn ok" data-mark="${mark}">${ic('check')}${label}</button>`}</div>`;
  if (st.id === 'warm') return moves('الإحماء', '7 دقايق • ' + xpT(20), WARM, 'warm', 'خلصت الإحماء');
  if (st.id === 'cardio') {
    const [cm, inc] = cardioFor(w), done = log.cardioMin || cm;
    return h + `<h1>مشي تريدميل</h1><p class="small">الهدف ${cm} دقيقة • لو مشيت أكتر تاخد XP زيادة</p>${undoBar('cardio')}${media('Walking_Treadmill')}
      <div class="tiles"><div class="tile"><b>${cm}</b><span>دقيقة (الهدف)</span></div><div class="tile"><b>${inc}</b><span>الميل</span></div><div class="tile"><b>4.5–5.5</b><span>كم/س</span></div></div>
      <div class="callout">${ic('info')}<span>تقدر تتكلم بجمل كاملة، بس متقدرش تغني. متمسكش في التريدميل.</span></div>
      <div class="picker" style="margin-top:12px"><div class="l">مشيت كام دقيقة؟</div><input id="cmin" inputmode="numeric" value="${done}">
      <div class="pm"><button data-cstep="-5">${ic('minus')}</button><button data-cstep="5">${ic('plus')}</button></div></div>
      <div class="stickybar"><button class="btn ok" id="cardioDone">${ic('check')}${log.cardio ? 'حفظ الدقايق وكمّل' : 'خلصت المشي'}</button></div>`;
  }
  if (st.id === 'cool') return moves('التبريد', '5 دقايق • ' + xpT(20), COOL, 'cool', 'خلصت');
  if (st.id === 'done') {
    const exs = steps.filter(x => x.id === 'ex'), tp = (S.photos || []).filter(p => p.d === d).pop();
    return h + `<div class="burst">${ic('trophy')}</div><h1 class="center">المهمة خلصت!</h1>
      <div class="bigxp">+${dayXP(d)} XP</div><div style="margin-top:14px">${playerBar(stats())}</div>
      ${tp ? `<h2>صورة النهارده</h2><img class="photo tall" data-pid="${tp.id}" data-photo="${tp.id}" alt="">`
        : photoBtn('phDone', 'gold', 'صوّر نفسك • ' + xpT(20))}
      <h2>اللي عملته</h2><div class="list-plain">${exs.map(x => {
        const a = (log.ex[x.it.k] || []).filter(y => y.d);
        return `<div class="r"><span class="k">${en(esc(exInfo(x.it.k).name))}</span><span class="v ltr">${a.length ? a.map(y => esc((y.kg ? y.kg + '×' : '') + (y.r || '?'))).join('  ') : '—'}</span></div>`;
      }).join('')}${log.cardio ? `<div class="r"><span class="k">مشي تريدميل</span><span class="v ltr">${log.cardioMin || cardioFor(w)[0]} min</span></div>` : ''}</div>
      <div class="note info"><span class="ic">${ic('msg')}</span><span>قولّي على الشات: كان عامل إزاي؟ وهل أي تمرين ضايق رقبتك؟</span></div>
      <button class="btn" data-go="today">رجوع</button>`;
  }
  // exercise
  const it = st.it, e = exInfo(it.k), sets = setsFor(log, it);
  const cur = sets.findIndex((x, j) => j < it.n && !x.d);
  const doneSets = sets.slice(0, it.n).filter(x => x.d);
  const exNo = steps.filter((x, j) => x.id === 'ex' && j <= i).length, exTot = steps.filter(x => x.id === 'ex').length;
  const nx = steps[i + 1], nextName = nx.id === 'ex' ? en(esc(exInfo(nx.it.k).name)) : nx.id === 'cardio' ? 'مشي تريدميل' : 'كمّل';
  const altKey = it.extra ? null : it.k !== it.orig ? it.orig : ALT[it.orig];
  const tagTxt = it.extra ? ' • إضافي' : it.k !== it.orig ? ' • بديل' : '';
  h += media(e.img, esc(e.name), `تمرين ${exNo} من ${exTot}${tagTxt}${e.img ? '' : ' • ' + e.ar}`, 'big')
    + `<div class="actions">
      ${e.steps.length ? `<button class="act" id="howBtn">${ic('book')}<span>الطريقة<small>${e.ar}</small></span></button>` : ''}
      ${altKey ? `<button class="act" id="swapBtn">${ic('swap')}<span>${it.k !== it.orig ? 'رجّع الأصلي' : 'بديل'}<small class="ltr">${EX[altKey].name}</small></span></button>` : ''}
      ${it.extra ? `<button class="act" id="removeEx">${ic('trash')}<span>شيل التمرين<small>من تمرين النهارده</small></span></button>` : ''}
    </div>`;
  if (log.neck === 'y' && UPPER_KEYS.includes(it.k)) h += `<div class="hint y">${ic('shield')}<span>رقبتك النهارده: استخدم نص وزنك العادي.</span></div>`;
  if (!doneSets.length) h += hintFor(it, d);
  h += `<div class="setcard"><div class="sethead"><b>${cur >= 0 ? `مجموعة ${cur + 1} من ${it.n}` : 'خلصت كل المجموعات'}</b>
    <div class="dots">${Array.from({ length: it.n }, (_, j) => `<i class="${sets[j].d ? 'on' : j === cur ? 'cur' : ''}"></i>`).join('')}</div></div>`;
  if (restEnd > Date.now()) {
    const C = 2 * Math.PI * 92;
    h += `<div class="ring"><svg viewBox="0 0 210 210"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#3fa9ff"/></linearGradient></defs>
      <circle class="bgc" cx="105" cy="105" r="92" fill="none" stroke-width="12"/>
      <circle class="fg" id="ringfg" cx="105" cy="105" r="92" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
      <div class="mid"><div class="tm" id="tm"></div><div class="lb">${cur >= 0 ? 'راحة' : 'الجاي: ' + nextName}</div></div></div>
      <button class="btn ghost" id="skipRest">${ic('skip')}${cur >= 0 ? 'تخطّي الراحة' : 'يلا على اللي بعده'}</button>`;
  } else if (cur >= 0) {
    const lk = lastKg(it.k, d);
    const kgDef = sets[cur].kg || (doneSets.length ? doneSets[doneSets.length - 1].kg : (lk != null ? fmt(lk) : ''));
    const rDef = sets[cur].r || it.top;
    const picker = (id, label, val, step, mode) => `<div class="picker"><div class="l">${label}</div>
      <input id="${id}" inputmode="${mode}" value="${esc(val)}" placeholder="0">
      <div class="pm"><button data-step="${id}" data-v="-${step}" aria-label="أقل">${ic('minus')}</button><button data-step="${id}" data-v="${step}" aria-label="أكتر">${ic('plus')}</button></div></div>`;
    h += `<div class="pickers ${it.bw ? 'one' : ''}">${it.bw ? '' : picker('kg', 'الوزن (كجم)', kgDef, 2.5, 'decimal')}${picker('r', it.time ? 'ثواني' : 'عدات • الهدف ' + nr(it.reps), rDef, it.time ? 5 : 1, 'numeric')}</div>
      <button class="btn ok" id="doneSet">${ic('check')}خلصت المجموعة ${xpT(10)}</button>`;
  } else {
    h += `<button class="btn" data-go="flow:${i + 1}">${nx.id === 'ex' ? 'التمرين الجاي' : 'كمّل'} ${ic('chev')}</button>`;
  }
  if (doneSets.length) h += `<div class="logged">${doneSets.map(x => `<span>${x.kg ? esc(x.kg) + 'kg × ' : ''}${esc(x.r)}</span>`).join('')}</div>
    <p class="center" style="margin:6px 0 0"><button class="tlink muted" id="undo">${ic('undo')}الغي آخر مجموعة</button></p>`;
  h += '</div>';
  if ((log.skip || {})[it.k]) h += `<div class="donebar">${ic('skip')}<span>اتخطّيت التمرين ده</span><button class="tlink" id="unskip">${ic('undo')}رجّعه</button></div>`;
  else if (cur >= 0) h += `<p class="center"><button class="tlink muted" id="skipEx">${ic('skip')}تخطّي التمرين ده</button></p>`;
  return h;
}
BIND.flow = arg => {
  const d = today(), i = +arg, steps = flowSteps(d), st = steps[i];
  if (!st) return;
  const log = getLog(d), next = () => go('flow:' + (i + 1));
  $('#exitW').addEventListener('click', () => (st.id === 'done' ? go('today') : exitSheet(d)));
  $$('[data-neck]').forEach(b => b.addEventListener('click', () => {
    log.neck = b.dataset.neck; save();
    if (log.neck === 'r') { toast('النهارده مشي وإطالة بس'); go('flow:' + steps.findIndex(x => x.id === 'cardio')); } else next();
  }));
  $$('[data-mark]').forEach(b => b.addEventListener('click', () => { log[b.dataset.mark] = 1; save(); next(); }));
  $$('[data-unmark]').forEach(b => b.addEventListener('click', () => { log[b.dataset.unmark] = 0; if (b.dataset.unmark === 'cardio') delete log.cardioMin; save(); toast('اتلغى'); render(true); }));
  const us = $('#unskip'); if (us) us.addEventListener('click', () => { delete log.skip[st.it.k]; save(); render(true); });
  startFlip();
  if (st.id === 'cardio') {
    const cin = $('#cmin');
    $$('[data-cstep]').forEach(b => b.addEventListener('click', () => { cin.value = Math.max(0, (num(cin.value) || 0) + +b.dataset.cstep); }));
    $('#cardioDone').addEventListener('click', () => { log.cardio = 1; log.cardioMin = Math.round(num(cin.value) || cardioFor(progWeek(d))[0]); save(); next(); });
  }
  if (st.id === 'done') {
    fillPhotos(); bindPhotoInput('phDone', () => render(true));
    $$('[data-photo]').forEach(el => el.addEventListener('click', () => viewPhoto(el.dataset.photo)));
  }
  if (st.id !== 'ex') return;
  const it = st.it, sets = setsFor(log, it);
  const hb = $('#howBtn'); if (hb) hb.addEventListener('click', () => howSheet(it.k));
  const swb = $('#swapBtn'); if (swb) swb.addEventListener('click', () => swapSheet(d, it));
  const rm = $('#removeEx');
  if (rm) rm.addEventListener('click', () => {
    if (!confirm('تشيل التمرين ده من تمرين النهارده؟')) return;
    const idx = (log.extra || []).findIndex(x => x.k === it.k);
    if (idx >= 0) log.extra.splice(idx, 1);
    delete log.ex[it.k]; save(); stopTimers(); render(); window.scrollTo(0, 0);
  });
  $$('[data-step]').forEach(b => b.addEventListener('click', () => {
    const inp = $('#' + b.dataset.step); inp.value = fmt(Math.max(0, (num(inp.value) || 0) + parseFloat(b.dataset.v)));
  }));
  const rerender = () => { clearInterval(animInt); clearInterval(restInt); render(true); };
  const allDone = () => sets.slice(0, it.n).every(x => x.d);
  const ds = $('#doneSet');
  if (ds) ds.addEventListener('click', () => {
    const cur = sets.findIndex((x, j) => j < it.n && !x.d), kg = $('#kg'), r = $('#r');
    sets[cur] = { d: 1, kg: kg ? kg.value.trim() : '', r: r.value.trim() };
    save();
    restTotal = parseInt(exInfo(it.k).rest, 10) || 60; restEnd = Date.now() + restTotal * 1000;   // rest after every set, then moves on by itself
    rerender();
  });
  const un = $('#undo');
  if (un) un.addEventListener('click', () => {
    const done = sets.map((x, j) => x.d ? j : -1).filter(j => j >= 0);
    if (done.length) { sets[done[done.length - 1]].d = 0; restEnd = 0; save(); rerender(); }
  });
  const se = $('#skipEx'); if (se) se.addEventListener('click', () => { (log.skip = log.skip || {})[it.k] = 1; save(); next(); });
  const afterRest = () => { restEnd = 0; if (allDone()) next(); else rerender(); };
  const sr = $('#skipRest'); if (sr) sr.addEventListener('click', afterRest);
  const tm = $('#tm'), fg = $('#ringfg');
  if (tm) {
    const C = 2 * Math.PI * 92;
    const tick = () => {
      const ms = Math.max(0, restEnd - Date.now()), s = Math.ceil(ms / 1000);
      tm.textContent = Math.floor(s / 60) + ':' + pad(s % 60);
      fg.setAttribute('stroke-dashoffset', String(C * (1 - ms / (restTotal * 1000))));
      if (ms <= 0) { clearInterval(restInt); beep(); afterRest(); }
    };
    tick(); restInt = setInterval(tick, 250);
  }
};

// ------------------------------------------------------------------ PROGRESS (4 sections)
let progTab = 'weight';
function weekAvg(w) {
  const vals = Object.entries(S.weights).filter(([d]) => calWeek(d) === w).map(([, v]) => v);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}
const MEAS = [['waist', 'الوسط'], ['chest', 'الصدر'], ['hips', 'الحوض'], ['arm', 'الدراع']];
function chart() {
  const ds = Object.keys(S.weights).sort().slice(-30);
  if (ds.length < 2) return '<p class="small center" style="margin:14px 0 2px">الجراف هيظهر بعد وزنين</p>';
  return lineChart(ds.map(d => S.weights[d]));
}
function vProgress() {
  let h = header('تقدّمي') + segs('ptabs', progTab, [['weight', 'الوزن'], ['strength', 'القوة'], ['body', 'الجسم'], ['photos', 'الصور'], ['week', 'الخميس']]);
  return h + ({ weight: pWeight, strength: pStrength, body: pBody, photos: pPhotos, week: pWeek }[progTab] || pWeight)();
}
function pWeight() {
  const d = today(), w = calWeek(d), cur = weekAvg(w), prv = weekAvg(w - 1);
  const all = Object.keys(S.weights).sort(), lastW = all.length ? S.weights[all[all.length - 1]] : null;
  const delta = (a, b) => a != null && b != null ? `<b class="${a - b > 0 ? 'pos' : 'neg'}">${a - b > 0 ? '+' : ''}${fmt(a - b)}</b>` : '<b>—</b>';
  let h = `<div class="card"><div class="small" style="margin-bottom:8px">وزن النهارده • الصبح قبل الأكل • ${xpT(10)}</div>
    <div class="winput"><input id="wIn" inputmode="decimal" placeholder="—" value="${S.weights[d] != null ? S.weights[d] : ''}"><button class="btn" id="wSave">حفظ</button></div>
    ${chart()}</div>
    <div class="tiles"><div class="tile"><b>${cur ? fmt(cur) : '—'}</b><span>متوسط الأسبوع</span></div>
    <div class="tile">${delta(cur, prv)}<span>عن اللي فات</span></div><div class="tile">${delta(lastW, startWeight())}<span>من البداية</span></div></div>`;
  const ds = all.slice().reverse().slice(0, 14);
  if (ds.length) h += '<h2>آخر الأوزان</h2><div class="list-plain">' + ds.map(x => `<div class="r"><span class="k">${nice(x)}</span>
    <span class="v ltr">${S.weights[x]}</span><button class="iconbtn" data-delw="${x}" aria-label="مسح">${ic('x')}</button></div>`).join('') + '</div>';
  return h;
}
function pBody() {
  let h = '';
  if (!S.meas.length) h += `<div class="empty">${ic('ruler')}<b>لسه مسجلتش مقاساتك</b><span>خدها قبل أول تمرين، وبعدها كل أسبوعين</span></div>`;
  else {
    const f = S.meas[0], l = S.meas[S.meas.length - 1], two = S.meas.length > 1;
    h += `<div class="card"><table class="mt"><tr><th></th><th>البداية</th>${two ? '<th>آخر مرة</th><th>الفرق</th>' : ''}</tr>` +
      MEAS.map(([k, lb]) => {
        const a = num(f[k]), b = num(l[k]), df = a != null && b != null ? b - a : null;
        return `<tr><td>${lb}</td><td>${a != null ? a : '—'}</td>${two ? `<td>${b != null ? b : '—'}</td><td class="ltr ${df < 0 ? 'neg' : df > 0 ? 'pos' : ''}">${df != null ? (df > 0 ? '+' : '') + fmt(df) : ''}</td>` : ''}</tr>`;
      }).join('') + `</table><div class="sheet-row"><span class="small">آخر تسجيل: ${nice(l.d)}</span><button class="tlink muted" id="delMeas">${ic('trash')}امسحه</button></div></div>`;
  }
  return h + `<button class="btn" data-go="meas">${ic('plus')}سجّل مقاسات • ${xpT(50)}</button>` + neckCard();
}
function pPhotos() {
  const ph = (S.photos || []).slice().sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0);
  let h = '';
  if (ph.length >= 2) {
    const a = ph[0], b = ph[ph.length - 1];
    h += `<div class="compare"><figure data-photo="${b.id}"><img data-pid="${b.id}" alt=""><figcaption class="chip glass">دلوقتي • ${short(b.d)}</figcaption></figure>
      <figure data-photo="${a.id}"><img data-pid="${a.id}" alt=""><figcaption class="chip glass">البداية • ${short(a.d)}</figcaption></figure></div>`;
  }
  if (ph.length) h += `<div class="pgrid">${ph.slice().reverse().map(p => `<button class="pth" data-photo="${p.id}"><img data-pid="${p.id}" alt=""><span>${short(p.d)}</span></button>`).join('')}</div>`;
  else h += `<div class="empty">${ic('camera')}<b>مفيش صور لسه</b><span>صوّر نفسك بعد التمرين عشان تشوف الفرق. الصور بتفضل على موبايلك بس.</span></div>`;
  return h + photoBtn('phIn', '', 'صورة جديدة • ' + xpT(20));
}
let viewWeek = null;
function weekDates(w) { const s = addDays(S.start, (w - 1) * 7); return [...Array(7)].map((_, i) => addDays(s, i)); }
function weekMsg(w) {
  const m = S.weekly[w] || {}, dates = weekDates(w);
  const ws = dates.filter(d => S.weights[d] != null).map(d => S.weights[d]);
  const cur = weekAvg(w), prv = weekAvg(w - 1), sessions = dates.filter(isWorkout), st = stats();
  let t = `📩 متابعة الأسبوع ${w}\n\n⚖️ الأوزان: ${ws.length ? ws.join(' • ') : '—'}\n`;
  t += `   المتوسط: ${cur ? fmt(cur) : '—'}${prv ? ' (اللي فات: ' + fmt(prv) + ')' : ''}\n🏋️ التمارين: ${sessions.length} من 3\n`;
  sessions.forEach(d => {
    const l = S.logs[d];
    const first = sessionPlan(d).slice(0, 2).map(it => {
      const a = (l.ex[it.k] || []).filter(x => x.d);
      if (!a.length) return null;
      const kgs = a.map(x => num(x.kg)).filter(x => x != null);
      return `${exInfo(it.k).name} ${kgs.length ? fmt(Math.max(...kgs)) + 'kg' : ''} × ${a.map(x => x.r || '?').join('/')}`;
    }).filter(Boolean);
    const swaps = Object.values(l.swap || {}).map(k => exInfo(k).name);
    const extras = (l.extra || []).map(x => exInfo(x.k).name);
    t += `   • ${nice(d)} ${{ g: '🟢', y: '🟡', r: '🔴' }[l.neck] || ''}: ${first.join('، ') || '—'}${l.cardio ? ` + مشي ${l.cardioMin || cardioFor(w)[0]}د` : ''}`
      + `${swaps.length ? ' (بديل: ' + swaps.join('، ') + ')' : ''}${extras.length ? ' (إضافي: ' + extras.join('، ') + ')' : ''}\n`;
  });
  const acts = (S.acts || []).filter(a => dates.includes(a.d));
  const byType = {};
  acts.forEach(a => { const n = actName(a); byType[n] = (byType[n] || 0) + (+a.min || 0); });
  t += `🚶 النشاط: ${acts.length ? Object.entries(byType).map(([n, mm]) => `${n} ${mm}د`).join(' • ') + ` (المجموع ${acts.reduce((s, a) => s + (+a.min || 0), 0)}د)` : '—'}\n`;
  if (S.meas.length && calWeek(S.meas[S.meas.length - 1].d) === w) t += `📏 الوسط: ${S.meas[S.meas.length - 1].waist || '—'} سم\n`;
  const fd = dates.map(foodOf).filter(f => f.p || f.w);
  if (fd.length) t += `🍗 البروتين: متوسط ${Math.round(fd.reduce((a, f) => a + f.p, 0) / fd.length)} جم/يوم • وصلت للهدف ${dates.filter(x => foodOf(x).p >= proteinTarget()).length} أيام
💧 المية: متوسط ${fmt(fd.reduce((a, f) => a + f.w, 0) / fd.length / 1000)} لتر/يوم
`;
  const nk = sessions.map(x => S.logs[x].neck).filter(Boolean);
  if (nk.length) t += `🦒 الرقبة في التمارين: ${nk.map(x => ({ g: '🟢', y: '🟡', r: '🔴' }[x])).join(' ')}
`;
  t += `👣 متوسط الخطوات: ${m.steps || '—'}\n🍽️ الالتزام بالأكل: ${m.food || '—'}/10\n`;
  t += `⚡ الطاقة: ${m.energy || '—'}/10 • 😋 الجوع: ${m.hunger || '—'}/10\n😴 النوم: ${m.sleep || '—'} ساعات\n🦒 الرقبة: ${m.neck || '—'}/10\n`;
  t += `🎮 مستوى ${st.level} • رتبة ${st.rank[1]}\n`;
  if (m.note) t += `📝 ${m.note}\n`;
  return t;
}
function pWeek() {
  if (viewWeek == null) viewWeek = Math.min(12 + totalShiftWeeks(), Math.max(1, calWeek(today())));
  const w = viewWeek, m = S.weekly[w] || {};
  const f = (k, label, ph) => `<div class="field"><label>${label}</label><input data-wk="${k}" inputmode="decimal" value="${esc(m[k])}" placeholder="${ph}"></div>`;
  return `<div class="weeknav"><button class="iconbtn" id="wkPrev" ${w <= 1 ? 'disabled' : ''}>${ic('back')}</button><b>أسبوع ${w}</b>
    <button class="iconbtn" id="wkNext" ${w >= 12 + totalShiftWeeks() ? 'disabled' : ''}>${ic('chev')}</button></div>
    <p class="small">كل خميس: املا الخانات، انسخ الرسالة، وابعتهالي على الشات.</p>
    <div class="card">${f('steps', 'متوسط الخطوات', '5000')}${f('food', 'الالتزام بالأكل /10', '8')}${f('energy', 'الطاقة /10', '7')}
    ${f('hunger', 'الجوع /10', '5')}${f('sleep', 'النوم (ساعات)', '6.5')}${f('neck', 'الرقبة /10', '5')}
    <div class="field col"><label>ملاحظة</label><input class="wide" data-wk="note" value="${esc(m.note)}" placeholder="أي حاجة عايز تقولها..."></div></div>
    <details class="acc"><summary><span class="ico">${ic('msg')}</span>شوف الرسالة<span class="chev">${ic('chev')}</span></summary><div class="in"><pre class="msg" id="msg">${esc(weekMsg(w))}</pre></div></details>
    <button class="btn" id="copy">${ic('copy')}انسخ الرسالة • ${xpT(30)}</button>
    ${navigator.share ? `<button class="btn ghost" id="share">${ic('share')}ابعت</button>` : ''}`;
}
BIND.progress = () => {
  const d = today();
  bindSeg('ptabs', v => { progTab = v; });
  const dm = $('#delMeas'); if (dm) dm.addEventListener('click', () => { if (confirm('تمسح آخر مقاسات سجّلتها؟')) { S.meas.pop(); save(); render(true); } });
  const ws = $('#wSave');
  if (ws) ws.addEventListener('click', () => {
    const v = num($('#wIn').value);
    if (v == null || v < 30 || v > 300) return toast('اكتب رقم صح');
    S.weights[d] = v; save(); render(true);
  });
  $$('[data-delw]').forEach(b => b.addEventListener('click', () => { if (confirm('امسح الوزن ده؟')) { delete S.weights[b.dataset.delw]; save(); render(true); } }));
  fillPhotos();
  bindPhotoInput('phIn', () => render(true));
  $$('[data-photo]').forEach(el => el.addEventListener('click', () => viewPhoto(el.dataset.photo)));
  if (progTab === 'week') {
    const w = viewWeek;
    $$('[data-wk]').forEach(inp => inp.addEventListener('input', () => {
      (S.weekly[w] = S.weekly[w] || {})[inp.dataset.wk] = inp.value.trim(); save(); $('#msg').textContent = weekMsg(w);
    }));
    $('#wkPrev').addEventListener('click', () => { viewWeek = Math.max(1, w - 1); render(true); });
    $('#wkNext').addEventListener('click', () => { viewWeek = Math.min(12 + totalShiftWeeks(), w + 1); render(true); });
    const sent = () => { (S.weekly[w] = S.weekly[w] || {}).sent = 1; save(); award(); };
    $('#copy').addEventListener('click', () => { copyText(weekMsg(w)); sent(); });
    const sh = $('#share'); if (sh) sh.addEventListener('click', () => navigator.share({ text: weekMsg(w) }).then(sent).catch(() => {}));
  }
};
function vMeas() {
  return `<button class="back" data-go="progress">${ic('back')}رجوع</button>${header('سجّل مقاساتك')}
    <p class="small">بالسم • الصبح • الشريط على الجلد من غير ما تشده</p>
    <div class="card">${MEAS.map(([k, l]) => `<div class="field"><label>${l}</label><input id="m-${k}" inputmode="decimal" placeholder="سم"></div>`).join('')}</div>
    <div class="callout">${ic('camera')}<span>خد كمان صورتين (قدام وجنب) في نفس الإضاءة.</span></div>
    <button class="btn" id="mSave">حفظ • ${xpT(50)}</button>`;
}
BIND.meas = () => {
  $('#mSave').addEventListener('click', () => {
    const m = { d: today() }; let any = false;
    MEAS.forEach(([k]) => { const v = num($('#m-' + k).value); if (v != null) { m[k] = v; any = true; } });
    if (!any) return toast('اكتب مقاس واحد على الأقل');
    S.meas = S.meas.filter(x => x.d !== m.d).concat([m]).sort((a, b) => a.d < b.d ? -1 : 1);
    save(); progTab = 'body'; go('progress');
  });
};

// ------------------------------------------------------------------ TROPHIES
function vTrophies() {
  const s = stats(), got = TROPHIES.filter(t => S.trophies && S.trophies[t[0]]).length, nextRank = RANKS.find(r => r[0] > s.level);
  let h = header('الإنجازات') + `<div class="hero-rank" style="--glow:${s.rank[4]}">${rankBadge(s.rank, 'big')}
    <div class="lv">LV ${s.level}</div><div class="rn">رتبة ${s.rank[1]} • ${s.rank[2]}</div>
    <div class="xpbar" style="margin-top:14px"><i style="width:${Math.round(s.into / s.need * 100)}%"></i></div>
    <div class="xpt"><span class="ltr">${s.into} / ${s.need} XP</span>${nextRank ? ` • الرتبة ${nextRank[1]} عند مستوى ${nextRank[0]}` : ' • أعلى رتبة'}</div></div>
    <div class="tiles"><div class="tile"><b>${s.workouts}</b><span>تمارين</span></div><div class="tile"><b>${s.prs}</b><span>أرقام قياسية</span></div><div class="tile"><b>${s.streak}</b><span>أسابيع ورا بعض</span></div></div>
    <h2>الكؤوس • ${got} من ${TROPHIES.length}</h2><div class="tgrid">`;
  h += TROPHIES.map(t => { const on = S.trophies && S.trophies[t[0]]; return `<div class="trophy ${on ? 'on' : ''}"><div class="ti">${t[1]}</div><b>${t[2]}</b><span>${t[3]}</span></div>`; }).join('') + '</div>';
  h += `<details class="acc" style="margin-top:18px"><summary><span class="ico">${ic('layers')}</span>الرتب<span class="chev">${ic('chev')}</span></summary><div class="in">
    <div class="ranks">${RANKS.map(r => `<div>${rankBadge(r, 'sm' + (r[1] === s.rank[1] ? ' cur' : ''))}<span>${r[2]}</span><small>LV ${r[0]}</small></div>`).join('')}</div></div></details>`;
  h += `<details class="acc"><summary><span class="ico">${ic('bolt')}</span>إزاي تجمع XP<span class="chev">${ic('chev')}</span></summary><div class="in">${[['كل مجموعة', 10], ['الإحماء • المشي • التبريد', 20], ['تمرين كامل', 100], ['رقم قياسي', 25], ['أي نشاط: كل 3 دقايق', 2], ['مشي تريدميل أكتر من الهدف: كل 3 دقايق', 2],
    ['تسجيل الوزن', 10], ['وصلت لهدف البروتين', 20], ['وصلت لهدف المية', 10], ['المقاسات', 50], ['صورة تقدّم (مرة في اليوم)', 20], ['رسالة الأسبوع', 30], ['رقبتك وجعتك وريّحتها', 60]].map(([a, b]) => `<div class="xprow"><span>${a}</span><b>+${b}</b></div>`).join('')}</div></details>`;
  return h;
}

// ------------------------------------------------------------------ ME (3 sections)
let meTab = 'profile';
const INFO = [
  ['rules', 'القواعد', `<ol><li><b>الأداء قبل الوزن.</b> الحركة النضيفة البطيئة أهم من التقيل.</li>
    <li><b>سيب عدات في الخزان:</b> وقّف وأنت لسه قادر تعمل 2–3 زيادة.</li>
    <li><b>إمتى تزوّد؟</b> التطبيق هيقولك لما تكسّر العدات كلها.</li>
    <li><b>الجهاز مشغول؟</b> دوس "بديل" في شاشة التمرين.</li>
    <li><b>يوم مش طايق؟</b> الإحماء وأول تمرينين بس.</li>
    <li><b>الراحة:</b> لو التمارين الكبيرة (Leg Press والصدر والضهر) تقيلة عليك، ريّح لحد دقيقتين. عادي.</li></ol>
    <p class="small">إشارة الرقبة دي قاعدة عملية للمتابعة، مش تشخيص طبي:</p>
    <div class="light g">0–4 • تمرين عادي</div><div class="light y">5–6 • نص الوزن في الجزء العلوي</div><div class="light r">7–10 • مشي + إطالة بس</div>`],
  ['cal', 'جدول الأسبوع', `<table class="tb"><tr><td class="day">السبت</td><td>تمرين</td></tr><tr><td class="day">الحد</td><td>مشي (أو تعويض السبت)</td></tr>
    <tr><td class="day">الاتنين</td><td>تمرين</td></tr><tr><td class="day">التلات</td><td>مشي (أو تعويض الاتنين)</td></tr>
    <tr><td class="day">الأربع</td><td>تمرين</td></tr><tr><td class="day">الخميس</td><td>راحة • رسالة المتابعة</td></tr><tr><td class="day">الجمعة</td><td>راحة</td></tr></table>`],
  ['layers', 'مراحل الـ 12 أسبوع', `<table class="tb c"><tr><th>أسبوع</th><th>المجموعات</th><th>تريدميل</th></tr>
    <tr><td>1–2</td><td>2 • خفيف</td><td>15 د</td></tr><tr><td>3–4</td><td>3</td><td>20 د</td></tr>
    <tr><td>5–8</td><td>3 + دراع</td><td>25 د</td></tr><tr><td>9–12</td><td>Upper/Lower</td><td>30 د</td></tr></table>`],
  ['food', 'الأكل', `<p><b>الطبق:</b> ½ خضار وسلطة • ¼ بروتين • ¼ رز أو عيش</p>
    <p class="small">يوم كامل تقريبًا 2,000 سعر و145–150 جم بروتين (تقدير):</p>
    <table class="tb"><tr><td class="day">فطار</td><td>أومليت 3 بيض بمعلقة زيت صغيرة + رغيف بلدي أسمر + خيار وطماطم <span class="small">(~530 سعر • 26 جم)</span></td></tr>
    <tr><td class="day">غدا</td><td>صدر فراخ مشوي 200 جم بعد الطبخ + <b>طبق رز واحد</b> + طبيخ + سلطة <span class="small">(~770 سعر • 65 جم)</span></td></tr>
    <tr><td class="day">سناك</td><td>زبادي يوناني (كوباية ~170 جم) + فاكهة <span class="small">(~200 سعر • 17 جم)</span></td></tr>
    <tr><td class="day">عشا</td><td>جبنة قريش 200 جم + نص رغيف + سلطة • أو علبة تونة مصفّاة <span class="small">(~365 سعر • 30 جم)</span></td></tr></table>
    <p class="small">الشاي بلبن بمعلقة سكر: كوبايتين في اليوم (~140 سعر) • ناقصك بروتين؟ بيضة زيادة أو كوباية لبن أو رايب • دليفري مرتين بالكتير: مشويات وسلطة بدل البطاطس.</p>`],
  ['shield', 'الرقبة والمكتب', `<ol><li>ارفع اللابتوب لمستوى عينك + كيبورد وماوس خارجي.</li><li>كل 45 دقيقة: قوم دقيقة • 8 ${en('Chin Tucks')} • 10 لف كتف.</li>
    <li>المخدة تملا المسافة بين كتفك وراسك.</li><li>ارفع الموبايل لعينك.</li></ol>
    <div class="light r"><b>ممنوع:</b> Shrugs • ضغط فوق الراس • سحب ورا الرقبة • Barbell Squat • Crunches</div>
    <p class="small">دكتور فورًا لو: ضعف أو تنميل في الدراع • صعوبة في المشي • سخونية مع تيبّس.</p>`],
];
const pv = k => String(S.profile[k] == null ? '' : S.profile[k]);
function vMe() {
  let h = header('أنا', meTab === 'profile' ? `<button class="tlink" data-go="edit">${ic('edit')}تعديل</button>` : '') +
    segs('mtabs', meTab, [['profile', 'بياناتي'], ['plan', 'خطتي'], ['settings', 'الإعدادات']]);
  return h + ({ profile: mProfile, plan: mPlan, settings: mSettings }[meTab] || mProfile)();
}
function mProfile() {
  const empty = !PROFILE.some(([, rows]) => rows.some(([k]) => pv(k)));
  const chips = ['age', 'height', 'startW'].map(pv).filter(Boolean);
  let h = `<div class="card"><div class="profile"><div class="avatar">${ic('user')}</div><div><b style="font-size:19px">بياناتي</b>
    <div class="pchips">${chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div></div></div></div>`;
  if (empty) return h + `<div class="empty">${ic('up')}<b>بياناتك لسه مش هنا</b><span>استرجع ملف بياناتك من الإعدادات، أو دوس تعديل.</span>
    <button class="btn" id="goSettings">افتح الإعدادات</button></div>`;
  PROFILE.forEach(([sec, rows], si) => {
    const list = si === 0 ? rows.filter(r => !['age', 'height', 'startW'].includes(r[0])) : rows;
    h += `<h2>${sec}</h2><div class="list-plain">${list.map(([k, l]) => {
      const v = pv(k) || '—', long = v.length > 22;
      return `<div class="r ${long ? 'col' : ''}"><span class="k">${l}</span><span class="v ${long ? 'wrap' : ''}">${nr(esc(v))}</span></div>`;
    }).join('')}</div>`;
  });
  return h;
}
function mPlan() {
  let h = INFO.map(([icn, t, body]) => `<details class="acc"><summary><span class="ico">${ic(icn)}</span>${t}<span class="chev">${ic('chev')}</span></summary><div class="in">${nr(body)}</div></details>`).join('');
  h += `<h2>كل التمارين</h2><div class="card">${Object.keys(EX).map(k => `<button class="exrow" data-go="exi:${k}">
    <img src="${img(EX[k].img)}" alt=""><div class="n"><b>${EX[k].name}</b><span>${EX[k].ar}</span></div><span class="muted">${ic('chev')}</span></button>`).join('')}</div>`;
  return h;
}
function mSettings() {
  return `<div class="card"><div class="small" style="margin-bottom:4px">المظهر</div>
    <div class="seg">${[['dark', 'moon', 'غامق'], ['light', 'sun', 'فاتح'], ['auto', 'auto', 'تلقائي']].map(([v, i, l]) => `<button data-theme-set="${v}" class="${S.theme === v ? 'on' : ''}">${ic(i)}${l}</button>`).join('')}</div>
    <div class="field"><label>أول يوم في البرنامج</label><input type="date" id="start" value="${S.start}" style="width:160px;font-size:15px"></div></div>
    <h2>الإشعارات</h2>${notifCard()}
    <h2>بياناتك</h2>
    <div class="note info"><span class="ic">${ic('info')}</span><span>كل بياناتك وصورك على الموبايل ده بس. احفظ نسخة كل أسبوعين في iCloud Drive.</span></div>
    <button class="btn ghost" id="exp">${ic('down')}حفظ نسخة احتياطية</button>
    <label class="btn ghost">${ic('up')}استرجاع نسخة (أو ملف بياناتك)<input type="file" id="imp" accept=".json,application/json" hidden></label>
    <p class="small center" style="margin-top:20px">صور التمارين من free-exercise-db (Unlicense)<br>التطبيق مش بديل عن الدكتور أو العلاج الطبيعي</p>`;
}
BIND.me = () => {
  bindSeg('mtabs', v => { meTab = v; });
  const gs = $('#goSettings'); if (gs) gs.addEventListener('click', () => { meTab = 'settings'; render(); });
  $$('[data-theme-set]').forEach(b => b.addEventListener('click', () => { S.theme = b.dataset.themeSet; save(); applyTheme(); render(true); }));
  const st = $('#start'); if (st) st.addEventListener('change', e => { if (e.target.value) { S.start = e.target.value; save(); toast('اتحفظ'); syncPush(); } });
  bindNotif();
  const ex = $('#exp'); if (ex) ex.addEventListener('click', exportData);
  const im = $('#imp'); if (im) im.addEventListener('change', importData);
};
function vEdit() {
  let h = `<button class="back" data-go="me">${ic('back')}رجوع</button>${header('تعديل بياناتي')}`;
  PROFILE.forEach(([sec, rows]) => {
    h += `<h2>${sec}</h2><div class="card">` + rows.map(([k, l]) => `<div class="field col"><label>${l}</label><input class="wide" data-pk="${k}" value="${esc(pv(k))}"></div>`).join('') + '</div>';
  });
  return h + `<div class="stickybar"><button class="btn" id="pSave">${ic('check')}حفظ</button></div>`;
}
BIND.edit = () => {
  $('#pSave').addEventListener('click', () => { $$('[data-pk]').forEach(i => { S.profile[i.dataset.pk] = i.value.trim(); }); save(); toast('اتحفظ'); go('me'); });
};
function vExi(k) {
  const e = exInfo(k), back = `<button class="back" data-go="${exiFrom}">${ic('back')}رجوع</button>`;
  if (!EX[k]) return back + media(null, esc(e.name), e.ar, 'big') + (strengthCard(k) || '<p class="small center">لسه مفيش جلسات</p>');   // your own exercise
  return `${back}
    ${media(e.img, e.name, e.ar + ' • ' + e.machine, 'big')}
    ${strengthCard(k)}
    <div class="tiles" style="grid-template-columns:1fr 1fr"><div class="tile"><b>${nr(e.sets)}</b><span>مجموعات</span></div><div class="tile"><b>${nr(e.rest)}</b><span>راحة</span></div></div>
    <div class="card"><div class="small">${e.muscles}</div><ol class="steps-ol">${e.steps.map(x => `<li>${nr(x)}</li>`).join('')}</ol>
    <h3 style="color:var(--bad)">تجنّب</h3><ul class="steps-ol">${e.avoid.map(x => `<li>${x}</li>`).join('')}</ul>
    ${e.neck ? `<div class="callout">${ic('shield')}<span>${e.neck}</span></div>` : ''}
    ${ALT[k] ? `<button class="act wide" data-go="exi:${ALT[k]}">${ic('swap')}<span>البديل<small class="ltr">${EX[ALT[k]].name}</small></span></button>` : ''}</div>`;
}
BIND.exi = () => startFlip();

// ------------------------------------------------------------------ misc
function copyText(t) {
  const done = () => toast('اتنسخت • ابعتهالي');
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(done).catch(() => fallbackCopy(t, done));
  fallbackCopy(t, done);
}
function fallbackCopy(t, done) {
  const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
  try { document.execCommand('copy'); done(); } catch (e) { toast('انسخها يدوي'); }
  ta.remove();
}
function exportData() {   // backup = all data + the photos
  const ids = new Set((S.photos || []).map(p => p.id));
  pall().catch(() => []).then(all => all.filter(p => ids.has(p.id))).then(photosData => {   // only photos that are in your list
    const name = 'rankup-backup-' + today() + '.json';
    const blob = new Blob([JSON.stringify(Object.assign({}, S, { photosData }))], { type: 'application/json' });
    const file = new File([blob], name, { type: 'application/json' });
    S.lastBackup = today(); save();
    if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file] }).catch(() => {});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
}
function importData(e) {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => {
    const s = JSON.parse(t);
    if (!s || !s.start || !s.logs) throw new Error('bad');
    if (!confirm('ده هيستبدل كل البيانات الحالية بالنسخة دي. تكمّل؟')) return;
    const photos = s.photosData || []; delete s.photosData;
    return Promise.all(photos.map(pput)).then(() => {
      localStorage.setItem(KEY, JSON.stringify(s)); S = load(); applyTheme(); toast('اترجعت'); meTab = 'profile'; render();
    });
  }).catch(() => toast('الملف ده مش نسخة صح'));
}
// screen stays on during a workout (where the phone supports it)
let wake = null, wantWake = false;
function keepAwake(on) {
  wantWake = on;
  if (!('wakeLock' in navigator)) return;
  if (on && !wake) navigator.wakeLock.request('screen').then(l => { wake = l; l.addEventListener('release', () => { wake = null; }); }).catch(() => {});
  if (!on && wake) { wake.release().catch(() => {}); wake = null; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && wantWake) keepAwake(true); });
// short beep when rest ends (iPhone allows sound only after the first tap)
let actx = null;
document.addEventListener('pointerdown', () => {
  try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { /* no audio */ }
}, { passive: true });
function beep() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  if (!actx) return;
  [0, 0.22].forEach(t => {
    const o = actx.createOscillator(), g = actx.createGain(), at = actx.currentTime + t;
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.35, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
    o.connect(g).connect(actx.destination); o.start(at); o.stop(at + 0.2);
  });
}
// ------------------------------------------------------------------ push notifications (sent by the RANK UP push server)
const NOTIF = [['gym', 'الجيم', 'سبت • اتنين • أربع', '18:00', 30], ['walk', 'المشي', 'حد • تلات', '19:00', 0], ['weigh', 'الوزن', 'كل يوم', '10:30', 0],
  ['report', 'رسالة الخميس', 'كل خميس', '20:00', 0], ['backup', 'النسخة الاحتياطية', 'كل أسبوعين (جمعة)', '12:00', 0]];
function notifPrefs() {
  const p = (S.notif && S.notif.prefs) || {}, o = {};
  NOTIF.forEach(([k, , , t, b]) => { o[k] = Object.assign({ on: true, time: t, before: b }, p[k] || {}); });
  return o;
}
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const pushFetch = (path, body) => fetch(self.PUSH_URL + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
function b64uBytes(s) {
  const t = s.split('-').join('+').split('_').join('/');
  const b = atob(t + '='.repeat((4 - t.length % 4) % 4));
  return Uint8Array.from(b, c => c.charCodeAt(0));
}
async function currentSub() { try { return await (await navigator.serviceWorker.ready).pushManager.getSubscription(); } catch (e) { return null; } }
function notifCard() {
  const on = S.notif && S.notif.on;
  if (!self.PUSH_URL) return `<div class="note info"><span class="ic">${ic('info')}</span><span>الإشعارات لسه بتتجهز.</span></div>`;
  if (!pushSupported() || (isIOS() && !standalone()))
    return `<div class="note warn"><span class="ic">${ic('info')}</span><span>${isIOS() ? 'الإشعارات بتشتغل بس لما تفتح RANK UP من أيقونته على الشاشة الرئيسية (مش من Safari).' : 'المتصفح ده مش بيدعم الإشعارات.'}</span></div>`;
  if (Notification.permission === 'denied')
    return `<div class="note warn"><span class="ic">${ic('info')}</span><span>الإشعارات مقفولة. افتحها من إعدادات الآيفون: Settings ← Notifications ← RANK UP.</span></div>`;
  if (!on) return `<div class="card"><p class="small" style="margin-top:0">تفكير بمواعيد الجيم والمشي والوزن ورسالة الخميس، حتى لو التطبيق مقفول.</p><button class="btn" id="nOn">${ic('bolt')}فعّل الإشعارات</button><div class="small ltr" id="nStatus" style="text-align:center;font-size:11.5px"></div></div>`;
  const p = notifPrefs();
  return `<div class="card">${NOTIF.map(([k, l, sub]) => `<div class="nrow">
      <label class="switch"><input type="checkbox" data-non="${k}" ${p[k].on ? 'checked' : ''}><span></span></label>
      <div class="nlab"><b>${l}</b><small>${sub}${k === 'gym' ? ` • قبلها <select data-nbefore="gym">${[0, 15, 30, 60].map(m => `<option value="${m}" ${+p.gym.before === m ? 'selected' : ''}>${m} د</option>`).join('')}</select>` : ''}</small></div>
      <input type="time" data-ntime="${k}" value="${p[k].time}" ${p[k].on ? '' : 'disabled'}></div>`).join('')}
    <button class="btn ghost" id="nTest">${ic('bolt')}جرّب إشعار دلوقتي</button>
    <button class="tlink muted" id="nOff" style="width:100%;justify-content:center">${ic('x')}وقّف كل الإشعارات</button>
    <div class="small ltr" id="nStatus" style="text-align:center;font-size:11.5px"></div></div>`;
}
const APP_VERSION = '2026.11.25-b';
// send a short error report to the push server (no personal data), so problems on the phone can be found
function report(step, e, info = '') {
  if (!self.PUSH_URL) return;
  fetch(self.PUSH_URL + '/log', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ step, err: e ? (e.name || '') + ': ' + (e.message || String(e)) : '', info: APP_VERSION + ' ' + info }) }).catch(() => {});
}
async function syncPush() {
  if (!self.PUSH_URL || !(S.notif && S.notif.on)) return false;
  const sub = await currentSub(); if (!sub) { report('sync', null, 'no subscription on phone'); return false; }
  try {
    const r = await pushFetch('/subscribe', { subscription: sub.toJSON(), prefs: notifPrefs(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone, start: S.start });
    if (!r.ok) throw new Error('server ' + r.status);
    return true;
  } catch (e) { report('sync', e); toast('مقدرتش أوصل لسيرفر الإشعارات: ' + (e.message || e)); return false; }
}
async function enablePush() {
  let step = 'permission';
  try {
    const perm = await Notification.requestPermission();   // must be the first thing after the tap (iPhone rule)
    if (perm !== 'granted') { report('permission', null, 'answer=' + perm); toast('الإشعارات مش مسموحة (' + perm + ')'); render(true); return; }
    step = 'service-worker';
    const reg = await navigator.serviceWorker.ready;
    step = 'server-key';
    const kr = await fetch(self.PUSH_URL + '/vapid'); if (!kr.ok) throw new Error('server ' + kr.status);
    const { key } = await kr.json();
    step = 'subscribe';
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uBytes(key) });
    S.notif = { on: true, prefs: notifPrefs() }; save();
    step = 'register';
    if (await syncPush()) { report('enabled', null, 'ok ' + new URL(sub.endpoint).host); toast('الإشعارات اتفعّلت ✓'); }
    render(true);
  } catch (e) { report(step, e); toast('مشكلة في خطوة ' + step + ': ' + (e.message || e)); render(true); }
}
async function notifStatus() {
  const el = $('#nStatus'); if (!el) return;
  const sub = await currentSub();
  el.textContent = `${APP_VERSION} • الإذن: ${'Notification' in window ? Notification.permission : '—'} • ${sub ? 'متسجّل ✓ ' + new URL(sub.endpoint).host : 'مش متسجّل'}`;
}
async function disablePush() {
  const sub = await currentSub();
  if (sub) { try { await pushFetch('/unsubscribe', { endpoint: sub.endpoint }); } catch (e) { /* offline */ } await sub.unsubscribe().catch(() => {}); }
  S.notif = Object.assign({}, S.notif, { on: false }); save(); toast('الإشعارات اتوقفت'); render(true);
}
let notifTimer = null;
function bindNotif() {
  notifStatus();
  const on = $('#nOn'); if (on) on.addEventListener('click', enablePush);
  const off = $('#nOff'); if (off) off.addEventListener('click', () => { if (confirm('توقف كل الإشعارات؟')) disablePush(); });
  const tst = $('#nTest');
  if (tst) tst.addEventListener('click', async () => {
    const sub = await currentSub(); if (!sub) return toast('فعّل الإشعارات الأول');
    try {
      if (!(await syncPush())) return;
      const r = await (await pushFetch('/test', { endpoint: sub.endpoint })).json();
      if (!r.ok) report('test', null, 'push service ' + r.status + ' ' + (r.error || ''));
      toast(r.ok ? 'اتبعت. اقفل التطبيق وشوف' : 'مقدرتش أبعت (' + (r.status || r.error) + ')');
    } catch (e) { report('test', e); toast('مفيش نت'); }
  });
  const changed = () => { clearTimeout(notifTimer); notifTimer = setTimeout(syncPush, 600); };
  $$('[data-non]').forEach(x => x.addEventListener('change', () => { const p = notifPrefs(); p[x.dataset.non].on = x.checked; S.notif.prefs = p; save(); changed(); render(true); }));
  $$('[data-ntime]').forEach(x => x.addEventListener('change', () => { if (!x.value) return; const p = notifPrefs(); p[x.dataset.ntime].time = x.value; S.notif.prefs = p; save(); changed(); toast('اتحفظ'); }));
  $$('[data-nbefore]').forEach(x => x.addEventListener('change', () => { const p = notifPrefs(); p.gym.before = +x.value; S.notif.prefs = p; save(); changed(); toast('اتحفظ'); }));
}
// open the right screen from a notification (./#weight, ./#week, ./#settings)
function openFromLink(href) {
  const h = (href ? new URL(href).hash : location.hash).replace('#', '');
  if (!h) return;
  if (h === 'weight' || h === 'week') { progTab = h; go('progress', { top: true }); }
  else if (h === 'settings') { meTab = 'settings'; go('me', { top: true }); }
  history.replaceState(null, '', location.pathname + location.search);
}
window.addEventListener('hashchange', () => openFromLink());
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.open) openFromLink(e.data.open); });

function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 1800); }

render();
openFromLink();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
setTimeout(syncPush, 3000);   // keep the server's copy of your reminder times up to date
