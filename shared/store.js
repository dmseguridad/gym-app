/* Capa de datos de la app.
   Hoy guarda todo en localStorage (modo demo, datos de ejemplo).
   Para producción se reemplaza el almacenamiento por Supabase manteniendo
   estas mismas funciones, así las pantallas no cambian. */
(function () {
  const pad = n => String(n).padStart(2, '0');
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

  const U = {
    uid: () => Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 8),
    today: () => toISO(new Date()),
    nowHM: () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; },
    toISO, parseISO,
    addDays: (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return toISO(d); },
    diffDays: (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000),
    weekday: s => parseISO(s).getDay(),
    month: s => s.slice(0, 7),
    shiftMonth: (m, n) => { const [y, mm] = m.split('-').map(Number); const d = new Date(y, mm - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; },
    fmtDate: (s, opts = { day: 'numeric', month: 'short' }) => parseISO(s).toLocaleDateString('es-EC', opts),
    fmtLong: s => parseISO(s).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }),
    monthName: m => { const [y, mm] = m.split('-').map(Number); return new Date(y, mm - 1, 1).toLocaleDateString('es-EC', { month: 'long' }); },
    monthYear: m => { const [y, mm] = m.split('-').map(Number); return new Date(y, mm - 1, 1).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }); },
    money: n => '$' + Number(n || 0).toFixed(2),
    num: n => (Math.round(n * 10) / 10).toString(),
    esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    cap: s => s ? s[0].toUpperCase() + s.slice(1) : s,
    first: name => String(name || '').split(' ')[0],
    initials: name => String(name || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(),
    DAYS: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    DAYS_SHORT: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  };
  window.U = U;

  const KEY = 'gymapp_db_v1';
  const LEVELS = [
    { min: 0, name: 'Novato' },
    { min: 100, name: 'Constante' },
    { min: 250, name: 'Atleta' },
    { min: 500, name: 'Guerrero' },
    { min: 900, name: 'Élite' },
    { min: 1400, name: 'Leyenda' },
  ];
  const POINTS = { checkin: 10, log: 5, goal: 100, reto: 50 };
  const EXERCISES = ['Sentadilla', 'Press banca', 'Peso muerto', 'Press militar', 'Remo con barra', 'Hip thrust', 'Dominadas', 'Curl de bíceps'];
  const GOAL_TYPES = { bajar_peso: 'Bajar de peso', subir_peso: 'Subir de peso', fuerza: 'Aumentar fuerza' };
  // Qué mide cada reto; el progreso se calcula solo con los datos de la app
  const CHALLENGE_METRICS = {
    dias: { label: 'Días entrenados', unit: 'días' },
    clases: { label: 'Clases asistidas', unit: 'clases' },
    registros: { label: 'Registros de entrenamiento', unit: 'registros' },
    metas: { label: 'Metas mensuales cumplidas', unit: 'metas' },
    puntos: { label: 'Puntos ganados', unit: 'pts' },
  };

  function seedChallenges(today) {
    const month = U.month(today), year = today.slice(0, 4);
    return [
      { id: 'ch1', period: 'mes', key: month, title: 'Primer paso', description: 'Registra tu entrenamiento 5 veces este mes.', metric: 'registros', target: 5, reward: 'Shaker deportivo', sponsor: 'NutriFit Suplementos', sponsorLogo: null, limit: 30, color: '#3ddc97' },
      { id: 'ch2', period: 'mes', key: month, title: `${U.cap(U.monthName(month))} constante`, description: 'Entrena al menos 12 días este mes.', metric: 'dias', target: 12, reward: '10% de descuento en Marathon Sports', sponsor: 'Marathon Sports', sponsorLogo: null, limit: 20, color: '#ff6b35' },
      { id: 'ch3', period: 'mes', key: month, title: 'Clase tras clase', description: 'Asiste a 8 clases grupales.', metric: 'clases', target: 8, reward: 'Toalla de microfibra', sponsor: 'SportZone', sponsorLogo: null, limit: 10, color: '#4cc9f0' },
      { id: 'ch4', period: 'mes', key: month, title: 'Meta cumplida', description: 'Cumple tu meta personal del mes.', metric: 'metas', target: 1, reward: '20% de descuento en suplementos', sponsor: 'NutriFit Suplementos', sponsorLogo: null, limit: 0, color: '#c77dff' },
      { id: 'ch5', period: 'año', key: year, title: `Reto anual ${year}`, description: 'Cumple tu meta personal en 4 meses distintos del año.', metric: 'metas', target: 4, reward: '1 mes de membresía gratis + kit deportivo', sponsor: 'SportZone', sponsorLogo: null, limit: 5, color: '#f5c542' },
    ];
  }
  /* Liga KadaMeta: ranking mensual entre gimnasios, solo con puntos verificados */
  const LEAGUE_POINTS = { checkin: 10, clase: 5, reto: 50 };
  const DIVISIONS = [
    { key: 'bronce', name: 'Bronce', min: 1, max: 2, color: '#cd7f32' },
    { key: 'plata', name: 'Plata', min: 3, max: 4, color: '#c9ced6' },
    { key: 'oro', name: 'Oro', min: 5, max: 6, color: '#f5c542' },
  ];
  // Gimnasios de ejemplo para la demo (en producción vienen de la base de datos)
  const RIVAL_GYMS = ['Titán Fitness', 'Power House', 'Zona Fit', 'Atlas Gym', 'Fénix Training'];
  const RIVAL_NAMES = ['Andrea', 'Carlos', 'Valeria', 'Luis', 'María', 'Jorge', 'Daniela', 'Pedro', 'Fernanda', 'Kevin', 'Gabriela', 'Diego', 'Sofía', 'Javier', 'Paola', 'Bryan', 'Camila', 'Ricardo', 'Lucía', 'Esteban', 'Nicole', 'Adrián', 'Karen', 'Santiago', 'Melany', 'Joel', 'Emilia', 'Iván'];
  const shortName = name => { const p = String(name || '').trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[1][0]}.` : p[0]; };
  function rivals(month, dayFactor) {
    let s = [...month].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) | 0;
    const rnd = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    const A = window.Avatar ? Avatar.OPTIONS : null;
    const out = [];
    RIVAL_GYMS.forEach((gym, gi) => {
      const n = 12 + Math.floor(rnd() * 16), strength = 0.75 + rnd() * 0.5;
      for (let k = 0; k < n; k++) {
        const level = pick([1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 6]);
        const points = Math.round(dayFactor * (2 + rnd() * 13) * (0.7 + level * 0.1) * strength / 5) * 5;
        out.push({
          id: `r${gi}-${k}`, name: `${pick(RIVAL_NAMES)} ${'ABCDEGHLMNPRSTVZ'[Math.floor(rnd() * 16)]}.`, gym, level, points, mine: false,
          avatar: A ? { skin: pick(A.skin), hair: pick(A.hair), hairColor: pick(A.hairColor), shirt: pick(A.shirt), accessory: level >= 4 && rnd() < .5 ? 'medalla' : 'ninguno' } : {},
        });
      }
    });
    return out;
  }
  const claimCode = () => 'R-' + Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

  /* ---------- Datos de ejemplo (relativos a la fecha de hoy) ---------- */
  function seed() {
    let s = 20261012;
    const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    let n = 0; const id = p => p + (++n).toString(36);
    const today = U.today();
    const month = U.month(today);
    const firstDay = month + '-01';
    const span = U.diffDays(firstDay, today);

    const plans = [
      { id: 'p1', name: 'Mensual', price: 30, days: 30 },
      { id: 'p2', name: 'Trimestral', price: 80, days: 90 },
      { id: 'p3', name: 'Anual', price: 280, days: 365 },
      { id: 'p4', name: 'Quincenal', price: 18, days: 15 },
    ];
    const staff = [
      { id: 's1', name: 'Carlos Andrade', role: 'Entrenador', specialty: 'Funcional / Crossfit', phone: '0987654321', active: true },
      { id: 's2', name: 'María José Vera', role: 'Instructora', specialty: 'Spinning / Yoga', phone: '0998765432', active: true },
      { id: 's3', name: 'Diego Torres', role: 'Entrenador', specialty: 'Pesas / Hipertrofia', phone: '0976543210', active: true },
      { id: 's4', name: 'Andrea Ruiz', role: 'Recepción', specialty: 'Atención y cobros', phone: '0965432109', active: true },
    ];
    const classes = [];
    const addC = (name, staffId, days, time, duration, capacity, color) =>
      days.forEach(weekday => classes.push({ id: id('c'), name, staffId, weekday, time, duration, capacity, color }));
    addC('Crossfit', 's1', [1, 3, 5], '06:00', 60, 15, '#ff6b35');
    addC('Funcional', 's1', [1, 2, 3, 4, 5], '19:00', 60, 20, '#f7c548');
    addC('Spinning', 's2', [2, 4], '18:00', 45, 16, '#4cc9f0');
    addC('Yoga', 's2', [6], '09:00', 60, 12, '#3ddc97');
    addC('Pesas guiadas', 's3', [1, 2, 3, 4, 5], '17:00', 60, 10, '#c77dff');
    addC('Glúteos y piernas', 's3', [2, 4, 6], '08:00', 50, 14, '#ff70a6');

    const names = ['Mateo Rodríguez', 'Sofía Mendoza', 'José Cedeño', 'Gabriela Intriago', 'Luis Alcívar', 'Karla Pincay', 'Andrés Vélez', 'Paola Macías', 'Fernando Loor', 'Camila Bravo', 'Ricardo Moreira', 'Diana Ponce', 'Jorge Cevallos', 'Melissa Chávez', 'Kevin Delgado', 'Nathaly Palma', 'Bryan Mero', 'Doménica García', 'Steven Rivera', 'Tatiana Solórzano', 'Javier Anchundia', 'Mishell Vera', 'Cristian López', 'Lucía Torres'];
    const A = window.Avatar ? Avatar.OPTIONS : { skin: ['#f1c27d'], hairColor: ['#3b2314'], shirt: ['#ff6b35'] };

    const members = names.map((name, i) => {
      const female = i % 2 === 1;
      const plan = i % 7 === 3 ? plans[1] : (i % 11 === 5 ? plans[2] : plans[0]);
      let end;
      if (i === 0) end = U.addDays(today, 18);
      else if (i % 6 === 2) end = U.addDays(today, -ri(2, 25));
      else if (i % 6 === 4) end = U.addDays(today, ri(0, 5));
      else end = U.addDays(today, ri(6, plan.days - 1));
      const start = U.addDays(end, -plan.days);
      return {
        id: 'm' + (i + 1), name,
        phone: i === 0 ? '0991234567' : '09' + ri(10000000, 99999999),
        pin: '1234', code: String(1001 + i), planId: plan.id,
        startDate: start, endDate: end, joined: U.addDays(start, -ri(0, 200)),
        goals: {},
        avatar: {
          skin: pick(A.skin), hairColor: pick(A.hairColor), shirt: pick(A.shirt), accessory: 'ninguno',
          hair: female ? pick(['largo', 'moño', 'rizado']) : pick(['corto', 'rapado', 'cresta']),
        },
      };
    });

    // Progreso diario y metas para los primeros 12 socios
    const logs = [];
    members.slice(0, 12).forEach((m, i) => {
      const female = i % 2 === 1;
      const type = ['bajar_peso', 'fuerza', 'subir_peso'][i % 3];
      const effort = i === 0 ? 1.15 : 0.45 + rnd() * 0.8;
      const w0 = female ? ri(56, 76) : ri(70, 96);
      const sq0 = female ? ri(30, 50) : ri(50, 80), bp0 = female ? ri(20, 35) : ri(40, 70), dl0 = female ? ri(40, 65) : ri(70, 110);
      const wTarget = type === 'bajar_peso' ? w0 - ri(3, 5) : (type === 'subir_peso' ? w0 + ri(2, 3) : w0);
      const sqTarget = sq0 + ri(10, 20);
      const wRate = (wTarget - w0) / 30 * effort;
      const sRate = type === 'fuerza' ? (sqTarget - sq0) / 30 * effort : 0.25;
      // Antes de este mes el avance fue más lento (más realista)
      const pace = d => (d < 0 ? d * 0.4 : d);
      const w = d => Math.round((w0 + wRate * pace(d) + (rnd() - 0.5) * 0.6) * 10) / 10;
      const sq = d => Math.max(20, Math.round((sq0 + sRate * pace(d)) / 2.5) * 2.5);
      const lift = (b, d) => Math.max(15, Math.round((b + 0.2 * d) / 2.5) * 2.5);

      m.goals[month] = type === 'fuerza'
        ? { type, exercise: 'Sentadilla', start: sq0, target: sqTarget, completed: false }
        : { type, start: w0, target: wTarget, completed: false };
      if (i % 2 === 0) {
        const pm = U.shiftMonth(month, -1);
        const st = type === 'fuerza' ? sq(-30) : w(-30);
        const en = type === 'fuerza' ? sq(-1) : w(-1);
        m.goals[pm] = { type, exercise: type === 'fuerza' ? 'Sentadilla' : undefined, start: st, target: Math.round((st + (en - st) * 0.85) * 10) / 10, completed: true };
      }
      for (let d = -40; d <= span; d += ri(1, 3)) {
        logs.push({
          id: id('l'), memberId: m.id, date: U.addDays(firstDay, d), weight: w(d), notes: '',
          exercises: [
            { name: 'Sentadilla', kg: sq(d), reps: 10 },
            { name: 'Press banca', kg: lift(bp0, d), reps: 10 },
            { name: 'Peso muerto', kg: lift(dl0, d), reps: 8 },
          ],
        });
      }
    });

    // Asistencias de los últimos 45 días
    const hours = [6, 6, 7, 7, 8, 9, 10, 12, 16, 17, 17, 18, 18, 18, 19, 19, 20];
    const checkins = [];
    members.forEach((m, i) => {
      const p = i === 0 ? 0.7 : 0.2 + rnd() * 0.45;
      for (let d = -45; d <= 0; d++) {
        const date = U.addDays(today, d);
        if (date > m.endDate || date < m.joined) continue;
        if (rnd() < p) {
          const h = d === 0 ? Math.min(pick(hours), Math.max(6, new Date().getHours())) : pick(hours);
          checkins.push({ id: id('k'), memberId: m.id, date, time: `${pad(h)}:${pad(ri(0, 59))}` });
        }
      }
    });

    // Reservas: 14 días atrás y 6 adelante
    const bookings = [];
    for (let d = -14; d <= 6; d++) {
      const date = U.addDays(today, d);
      classes.filter(c => c.weekday === U.weekday(date)).forEach(c => {
        const pool = members.filter(m => (d < 0 || m.id !== 'm1') && m.endDate >= date);
        const count = Math.min(pool.length, d < 0 ? ri(Math.ceil(c.capacity * 0.35), Math.ceil(c.capacity * 0.95)) : ri(Math.ceil(c.capacity * 0.2), Math.ceil(c.capacity * 0.7)));
        const chosen = [...pool].sort(() => rnd() - 0.5).slice(0, count);
        chosen.forEach(m => bookings.push({ id: id('b'), classId: c.id, date, memberId: m.id, status: d < 0 ? (rnd() < 0.86 ? 'asistio' : 'falta') : 'reservado' }));
      });
    }
    // Reservas del socio demo
    let added = 0;
    for (let d = 1; d <= 6 && added < 2; d++) {
      const date = U.addDays(today, d);
      const c = classes.find(c => c.weekday === U.weekday(date) && c.time >= '17:00');
      if (c) { bookings.push({ id: id('b'), classId: c.id, date, memberId: 'm1', status: 'reservado' }); added++; }
    }

    // Historial de pagos (6 meses)
    const payments = [];
    const methods = ['Efectivo', 'Efectivo', 'Transferencia', 'DeUna', 'Tarjeta'];
    members.forEach(m => {
      const plan = plans.find(p => p.id === m.planId);
      for (let k = 0; k < 12; k++) {
        const date = U.addDays(m.endDate, -plan.days * (k + 1));
        if (date < U.addDays(today, -190) || date < m.joined) break;
        payments.push({ id: id('y'), memberId: m.id, planId: plan.id, amount: plan.price, method: pick(methods), date: date > today ? today : date });
      }
    });

    // Liga: la mayoría de socios de ejemplo ya participa; el socio demo (m1) decide si se une
    members.forEach((m, i) => { m.league = i !== 0 && i % 5 !== 0; });

    // Algunos socios ya reclamaron el reto "Primer paso" (para la demo del panel)
    const claims = [];
    members.slice(1, 12).forEach((m, i) => {
      const count = logs.filter(l => l.memberId === m.id && U.month(l.date) === month).length;
      if (count >= 5 && i % 3 !== 2) claims.push({ id: id('r'), challengeId: 'ch1', memberId: m.id, code: claimCode(), date: U.addDays(today, -ri(0, 3)), status: i % 2 ? 'entregado' : 'pendiente' });
    });

    return {
      version: 3,
      settings: { gymName: 'Iron Gym', adminPin: '1234', league: true },
      plans, staff, classes, members, payments, bookings, checkins, logs,
      challenges: seedChallenges(today), claims,
    };
  }

  /* ---------- Persistencia ---------- */
  let db;
  const listeners = [];
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) db = JSON.parse(raw); } catch (e) { /* sin almacenamiento */ }
    if (!db) { db = seed(); save(); return; }
    // Datos guardados con una versión anterior de la app: se agregan los retos
    if (!db.challenges) { db.challenges = seedChallenges(U.today()); db.claims = []; save(); }
    // v2: el reto principal del mes de ejemplo pasa a ser de Marathon Sports
    if ((db.version || 1) < 2) {
      const c = db.challenges.find(x => x.id === 'ch2');
      if (c && c.sponsor === 'NutriFit Suplementos') { c.sponsor = 'Marathon Sports'; c.reward = '10% de descuento en Marathon Sports'; c.sponsorLogo = null; }
      db.version = 2; save();
    }
    // v3: Liga KadaMeta (participación voluntaria)
    if (db.version < 3) {
      if (db.settings.league === undefined) db.settings.league = true;
      db.members.forEach((m, i) => { if (m.league === undefined) m.league = m.id !== 'm1' && i % 5 !== 0; });
      db.version = 3; save();
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) { window.dispatchEvent(new CustomEvent('gymdb-save-error')); return false; }
  }
  // Sincroniza entre pestañas (panel y app del socio abiertos a la vez)
  window.addEventListener('storage', e => {
    if (e.key === KEY && e.newValue) { db = JSON.parse(e.newValue); listeners.forEach(f => f()); }
  });
  load();

  const byId = (col, id) => db[col].find(x => x.id === id);
  function upsert(col, obj) {
    if (!obj.id) obj.id = U.uid();
    const i = db[col].findIndex(x => x.id === obj.id);
    if (i >= 0) db[col][i] = { ...db[col][i], ...obj }; else db[col].push(obj);
    save();
    return obj.id;
  }
  function remove(col, id) { db[col] = db[col].filter(x => x.id !== id); save(); }
  const maxKg = (logs, name) => {
    const v = logs.flatMap(l => (l.exercises || []).filter(e => e.name === name && +e.kg > 0).map(e => +e.kg));
    return v.length ? Math.max(...v) : null;
  };

  const DB = {
    LEVELS, POINTS, EXERCISES, GOAL_TYPES,
    get settings() { return db.settings; },
    saveSettings(patch) { Object.assign(db.settings, patch); return save(); },
    onChange(f) { listeners.push(f); },
    reset() { db = seed(); save(); },
    exportJSON() { return JSON.stringify(db, null, 2); },

    /* Planes */
    plans: () => db.plans,
    plan: id => byId('plans', id),
    savePlan: p => upsert('plans', p),
    removePlan: id => remove('plans', id),

    /* Personal */
    staff: () => db.staff,
    staffMember: id => byId('staff', id),
    saveStaff: s => upsert('staff', s),
    removeStaff(id) { db.classes.forEach(c => { if (c.staffId === id) c.staffId = ''; }); remove('staff', id); },

    /* Socios */
    members: () => db.members,
    member: id => byId('members', id),
    saveMember: m => upsert('members', m),
    removeMember(id) {
      ['bookings', 'logs', 'checkins', 'payments', 'claims'].forEach(c => { db[c] = db[c].filter(x => x.memberId !== id); });
      remove('members', id);
    },
    nextCode() { return String(Math.max(1000, ...db.members.map(m => +m.code || 0)) + 1); },
    phoneTaken(phone, exceptId) { return db.members.some(m => m.phone === phone && m.id !== exceptId); },
    login(phone, pin) { return db.members.find(m => m.phone === String(phone).trim() && m.pin === String(pin).trim()) || null; },
    findByCode(code) { return db.members.find(m => m.code === String(code).trim()) || null; },
    status(m) {
      const d = U.diffDays(U.today(), m.endDate);
      if (d < 0) return { key: 'vencido', label: 'Vencido', cls: 'bad', days: d };
      if (d <= 5) return { key: 'por_vencer', label: d === 0 ? 'Vence hoy' : `Vence en ${d} d`, cls: 'warn', days: d };
      return { key: 'activo', label: 'Activo', cls: 'ok', days: d };
    },

    /* Pagos */
    payments: memberId => (memberId ? db.payments.filter(p => p.memberId === memberId) : db.payments).slice().sort((a, b) => a.date.localeCompare(b.date)),
    previewEnd(memberId, planId) {
      const m = byId('members', memberId), plan = byId('plans', planId), today = U.today();
      return U.addDays(m.endDate >= today ? m.endDate : today, plan.days);
    },
    registerPayment(memberId, planId, amount, method) {
      const m = byId('members', memberId), today = U.today();
      const newEnd = this.previewEnd(memberId, planId);
      if (m.endDate < today) m.startDate = today;
      m.endDate = newEnd; m.planId = planId;
      db.payments.push({ id: U.uid(), memberId, planId, amount: +amount, method, date: today });
      save();
      return newEnd;
    },

    /* Clases y reservas */
    classes: () => db.classes,
    cls: id => byId('classes', id),
    saveClass: c => upsert('classes', c),
    removeClass(id) { const t = U.today(); db.bookings = db.bookings.filter(b => !(b.classId === id && b.date >= t)); remove('classes', id); },
    classesOn: date => db.classes.filter(c => c.weekday === U.weekday(date)).sort((a, b) => a.time.localeCompare(b.time)),
    nextDateFor(weekday) { let d = U.today(); while (U.weekday(d) !== weekday) d = U.addDays(d, 1); return d; },
    isPast: (date, time) => date < U.today() || (date === U.today() && time <= U.nowHM()),
    bookingsFor: (classId, date) => db.bookings.filter(b => b.classId === classId && b.date === date && b.status !== 'cancelado'),
    memberBooking: (memberId, classId, date) => db.bookings.find(b => b.memberId === memberId && b.classId === classId && b.date === date && b.status !== 'cancelado'),
    book(memberId, classId, date) {
      const m = byId('members', memberId), c = byId('classes', classId);
      if (!m || !c) return { ok: false, error: 'Clase no encontrada' };
      if (this.status(m).key === 'vencido') return { ok: false, error: 'Tu membresía está vencida. Renueva en recepción.' };
      if (date > m.endDate) return { ok: false, error: 'Esa fecha es posterior al vencimiento de tu membresía.' };
      if (this.isPast(date, c.time)) return { ok: false, error: 'Esta clase ya empezó.' };
      if (this.memberBooking(memberId, classId, date)) return { ok: false, error: 'Ya tienes esta clase reservada.' };
      if (this.bookingsFor(classId, date).length >= c.capacity) return { ok: false, error: 'La clase está llena.' };
      db.bookings.push({ id: U.uid(), classId, date, memberId, status: 'reservado' });
      save();
      return { ok: true };
    },
    cancelBooking(id) { const b = byId('bookings', id); if (b) { b.status = 'cancelado'; save(); } },
    upcomingBookings(memberId) {
      return db.bookings
        .filter(b => b.memberId === memberId && b.status === 'reservado' && byId('classes', b.classId) && !this.isPast(b.date, byId('classes', b.classId).time))
        .sort((a, b) => (a.date + byId('classes', a.classId).time).localeCompare(b.date + byId('classes', b.classId).time));
    },

    /* Asistencia */
    checkins: date => (date ? db.checkins.filter(c => c.date === date) : db.checkins).slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    checkin(memberId) {
      const m = byId('members', memberId), today = U.today();
      if (!m) return { ok: false, error: 'Socio no encontrado' };
      if (db.checkins.some(c => c.memberId === memberId && c.date === today)) return { ok: false, error: `${m.name} ya registró su entrada hoy` };
      db.checkins.push({ id: U.uid(), memberId, date: today, time: U.nowHM() });
      db.bookings.forEach(b => { if (b.memberId === memberId && b.date === today && b.status === 'reservado') b.status = 'asistio'; });
      save();
      const st = this.status(m);
      return { ok: true, warn: st.key === 'vencido' ? 'membresía vencida' : (st.key === 'por_vencer' ? st.label.toLowerCase() : null) };
    },

    /* Progreso */
    logs: memberId => db.logs.filter(l => l.memberId === memberId).sort((a, b) => a.date.localeCompare(b.date)),
    saveLog(memberId, entry) {
      const before = this.level(byId('members', memberId)).level;
      const same = db.logs.find(l => l.memberId === memberId && l.date === entry.date && l.id !== entry.id);
      if (same) {
        // Un solo registro por día: si se cambió la fecha a un día que ya tenía registro, se fusionan.
        if (entry.id) db.logs = db.logs.filter(l => l.id !== entry.id);
        entry.id = same.id;
      }
      upsert('logs', { ...entry, memberId });
      const m = byId('members', memberId);
      const month = U.month(entry.date);
      const gp = this.goalProgress(m, month);
      let completed = false;
      if (gp && gp.pct >= 1 && !gp.goal.completed) { m.goals[month].completed = true; completed = true; save(); }
      const after = this.level(m).level;
      return { completed, levelUp: after > before ? after : null };
    },
    removeLog: id => remove('logs', id),
    setGoal(memberId, g) {
      const m = byId('members', memberId);
      m.goals = m.goals || {};
      m.goals[U.month(U.today())] = { ...g, completed: false };
      save();
    },
    goalLabel(g) {
      if (!g) return '';
      if (g.type === 'fuerza') return `${g.exercise}: ${U.num(g.target)} kg`;
      return `${g.type === 'bajar_peso' ? 'Bajar' : 'Subir'} a ${U.num(g.target)} kg`;
    },
    metricFor: g => (g && g.type === 'fuerza' ? g.exercise : 'peso'),
    series(memberId, metric, month) {
      let logs = this.logs(memberId);
      if (month) logs = logs.filter(l => U.month(l.date) === month);
      if (metric === 'peso') return logs.filter(l => +l.weight > 0).map(l => ({ date: l.date, value: +l.weight }));
      return logs.map(l => ({ date: l.date, value: maxKg([l], metric) })).filter(p => p.value != null);
    },
    goalProgress(m, month = U.month(U.today())) {
      const g = m.goals && m.goals[month];
      if (!g) return null;
      const s = this.series(m.id, this.metricFor(g), month);
      let current;
      if (g.type === 'fuerza') current = s.length ? Math.max(...s.map(p => p.value)) : g.start;
      else current = s.length ? s[s.length - 1].value : g.start;
      const total = g.target - g.start;
      const pct = g.completed ? 1 : (total === 0 ? 1 : Math.max(0, Math.min(1, (current - g.start) / total)));
      return { goal: g, current, pct, remaining: Math.round(Math.abs(g.target - current) * 10) / 10, series: s };
    },

    /* Gamificación */
    points(m) {
      const c = db.checkins.filter(x => x.memberId === m.id).length;
      const l = db.logs.filter(x => x.memberId === m.id).length;
      const g = Object.values(m.goals || {}).filter(x => x.completed).length;
      const r = (db.claims || []).filter(x => x.memberId === m.id).length;
      return c * POINTS.checkin + l * POINTS.log + g * POINTS.goal + r * POINTS.reto;
    },

    /* Retos con patrocinador (mensuales y anuales) */
    CHALLENGE_METRICS,
    challenges: () => db.challenges,
    challenge: id => byId('challenges', id),
    currentChallenges() {
      const t = U.today();
      return db.challenges.filter(c => c.key === U.month(t) || c.key === t.slice(0, 4))
        .sort((a, b) => (a.period === b.period ? 0 : a.period === 'mes' ? -1 : 1));
    },
    saveChallenge: c => upsert('challenges', c),
    removeChallenge(id) { db.claims = db.claims.filter(x => x.challengeId !== id); remove('challenges', id); },
    challengeEnd(c) {
      if (c.period === 'año') return c.key + '-12-31';
      const [y, m] = c.key.split('-').map(Number);
      return `${c.key}-${pad(new Date(y, m, 0).getDate())}`;
    },
    periodLabel: c => (c.period === 'año' ? `Año ${c.key}` : U.cap(U.monthYear(c.key))),
    // Valor del socio en el periodo (sirve igual para '2026-10' o '2026')
    metricValue(m, metric, key) {
      const inP = d => d.startsWith(key);
      const days = () => new Set(db.checkins.filter(c => c.memberId === m.id && inP(c.date)).map(c => c.date)).size;
      const logs = () => db.logs.filter(l => l.memberId === m.id && inP(l.date)).length;
      const goals = () => Object.entries(m.goals || {}).filter(([k, g]) => k.startsWith(key) && g.completed).length;
      switch (metric) {
        case 'dias': return days();
        case 'clases': return db.bookings.filter(b => b.memberId === m.id && b.status === 'asistio' && inP(b.date)).length;
        case 'registros': return logs();
        case 'metas': return goals();
        case 'puntos': return db.checkins.filter(c => c.memberId === m.id && inP(c.date)).length * POINTS.checkin + logs() * POINTS.log + goals() * POINTS.goal;
        default: return 0;
      }
    },
    challengeProgress(m, c) {
      const value = this.metricValue(m, c.metric, c.key);
      return { value, target: c.target, pct: Math.min(1, value / c.target), done: value >= c.target };
    },
    claims: () => db.claims.slice().sort((a, b) => b.date.localeCompare(a.date)),
    claimsFor: id => db.claims.filter(x => x.challengeId === id),
    memberClaim: (memberId, challengeId) => db.claims.find(x => x.memberId === memberId && x.challengeId === challengeId),
    memberClaims: memberId => db.claims.filter(x => x.memberId === memberId).sort((a, b) => b.date.localeCompare(a.date)),
    prizesLeft(c) { return c.limit ? Math.max(0, c.limit - this.claimsFor(c.id).length) : null; },
    claim(memberId, challengeId) {
      const m = byId('members', memberId), c = byId('challenges', challengeId);
      if (!m || !c) return { ok: false, error: 'Reto no encontrado' };
      if (this.memberClaim(memberId, challengeId)) return { ok: false, error: 'Ya reclamaste este premio' };
      if (U.today() > this.challengeEnd(c)) return { ok: false, error: 'Este reto ya terminó' };
      if (!this.challengeProgress(m, c).done) return { ok: false, error: 'Aún no completas el reto' };
      if (this.prizesLeft(c) === 0) return { ok: false, error: 'Se agotaron los premios de este reto' };
      let code; do { code = claimCode(); } while (db.claims.some(x => x.code === code));
      const claim = { id: U.uid(), challengeId, memberId, code, date: U.today(), status: 'pendiente' };
      db.claims.push(claim); save();
      return { ok: true, claim };
    },
    /* Liga KadaMeta */
    LEAGUE_POINTS, DIVISIONS,
    shortName,
    divisionOf: level => DIVISIONS.find(d => level >= d.min && level <= d.max) || DIVISIONS[0],
    leaguePoints(m, month = U.month(U.today())) {
      const inM = x => U.month(x.date) === month;
      return db.checkins.filter(c => c.memberId === m.id && inM(c)).length * LEAGUE_POINTS.checkin
        + db.bookings.filter(b => b.memberId === m.id && b.status === 'asistio' && inM(b)).length * LEAGUE_POINTS.clase
        + db.claims.filter(c => c.memberId === m.id && inM(c)).length * LEAGUE_POINTS.reto;
    },
    league(month = U.month(U.today())) {
      const today = U.today();
      const [y, mm] = month.split('-').map(Number);
      const daysInMonth = new Date(y, mm, 0).getDate();
      const day = month === U.month(today) ? U.parseISO(today).getDate() : daysInMonth;
      const own = db.settings.league
        ? db.members.filter(m => m.league && this.status(m).key !== 'vencido').map(m => ({
          id: m.id, name: shortName(m.name), gym: db.settings.gymName, level: this.level(m).level,
          points: this.leaguePoints(m, month), avatar: m.avatar, mine: true,
        }))
        : [];
      const entries = [...own, ...rivals(month, day)];
      const byGym = {};
      entries.forEach(e => { (byGym[e.gym] = byGym[e.gym] || []).push(e.points); });
      const gyms = Object.entries(byGym).map(([name, pts]) => ({
        name, members: pts.length, avg: Math.round(pts.reduce((a, b) => a + b, 0) / pts.length), mine: name === db.settings.gymName,
      })).sort((a, b) => b.avg - a.avg);
      return { month, entries, gyms, daysLeft: daysInMonth - day };
    },
    // Ranking de una división, ordenado de mayor a menor puntaje
    leagueRanking(divKey, month) {
      return this.league(month).entries.filter(e => this.divisionOf(e.level).key === divKey).sort((a, b) => b.points - a.points);
    },

    findClaim: code => db.claims.find(x => x.code === String(code).trim().toUpperCase().replace(/^(?!R-)/, 'R-')),
    deliverClaim(id) { const x = byId('claims', id); if (x) { x.status = 'entregado'; x.deliveredDate = U.today(); save(); } },
    level(m) {
      const points = this.points(m);
      let i = 0; while (i < LEVELS.length - 1 && points >= LEVELS[i + 1].min) i++;
      const next = LEVELS[i + 1];
      return {
        level: i + 1, name: LEVELS[i].name, points, next: next ? next.min : null,
        pctToNext: next ? (points - LEVELS[i].min) / (next.min - LEVELS[i].min) : 1,
      };
    },

    /* Reporte mensual del socio */
    monthlyReport(m, month) {
      const today = U.today();
      const inMonth = x => U.month(x.date) === month;
      const days = new Set(db.checkins.filter(c => c.memberId === m.id && inMonth(c)).map(c => c.date)).size;
      const classes = db.bookings.filter(b => b.memberId === m.id && inMonth(b) && b.status === 'asistio').length;
      const logs = this.logs(m.id).filter(inMonth);
      const prevLogs = this.logs(m.id).filter(l => U.month(l.date) === U.shiftMonth(month, -1));
      const weights = logs.filter(l => +l.weight > 0).map(l => +l.weight);
      const weightChange = weights.length >= 2 ? Math.round((weights[weights.length - 1] - weights[0]) * 10) / 10 : null;
      const best = EXERCISES.map(name => {
        const cur = maxKg(logs, name); if (cur == null) return null;
        const prev = maxKg(prevLogs, name);
        return { name, cur, prev, diff: prev != null ? Math.round((cur - prev) * 10) / 10 : null };
      }).filter(Boolean);
      const goal = this.goalProgress(m, month);
      const [y, mm] = month.split('-').map(Number);
      const daysInMonth = new Date(y, mm, 0).getDate();
      const isCurrent = month === U.month(today);
      const dayOfMonth = isCurrent ? U.parseISO(today).getDate() : daysInMonth;
      let projection = null;
      if (goal && isCurrent && dayOfMonth >= 3 && !goal.goal.completed) {
        const rate = (goal.current - goal.goal.start) / dayOfMonth;
        projection = Math.round((goal.goal.start + rate * daysInMonth) * 10) / 10;
      }
      return { month, days, classes, logsCount: logs.length, weightChange, best, goal, projection, daysInMonth, dayOfMonth, isCurrent, daysLeft: daysInMonth - dayOfMonth };
    },

    /* Estadísticas del administrador */
    dashboard() {
      const today = U.today(), month = U.month(today), prev = U.shiftMonth(month, -1);
      const st = db.members.map(m => ({ m, s: this.status(m) }));
      // El mes anterior se compara hasta el mismo día, para que la comparación sea justa
      const day = today.slice(8);
      const sum = (mo, upToDay) => db.payments.filter(p => U.month(p.date) === mo && (!upToDay || p.date.slice(8) <= upToDay)).reduce((a, p) => a + p.amount, 0);
      return {
        active: st.filter(x => x.s.key !== 'vencido').length,
        porVencer: st.filter(x => x.s.key === 'por_vencer').sort((a, b) => a.s.days - b.s.days),
        vencidos: st.filter(x => x.s.key === 'vencido' && x.s.days >= -30).sort((a, b) => b.s.days - a.s.days),
        rev: sum(month), revPrev: sum(prev, day),
        checkinsToday: this.checkins(today),
        todayClasses: this.classesOn(today).map(c => ({ c, n: this.bookingsFor(c.id, today).length })),
        newMembers: db.members.filter(m => U.month(m.joined) === month).length,
      };
    },
    revenueByMonth(n = 6) {
      const cur = U.month(U.today());
      return Array.from({ length: n }, (_, i) => {
        const mo = U.shiftMonth(cur, i - n + 1);
        return { month: mo, value: db.payments.filter(p => U.month(p.date) === mo).reduce((a, p) => a + p.amount, 0) };
      });
    },
    checkinsByWeekday(days = 30) {
      const from = U.addDays(U.today(), -days), counts = [0, 0, 0, 0, 0, 0, 0];
      db.checkins.filter(c => c.date > from).forEach(c => counts[U.weekday(c.date)]++);
      return [1, 2, 3, 4, 5, 6, 0].map(d => ({ label: U.DAYS_SHORT[d], value: counts[d] }));
    },
    checkinsByHour(days = 30) {
      const from = U.addDays(U.today(), -days), counts = {};
      for (let h = 5; h <= 22; h++) counts[h] = 0;
      db.checkins.filter(c => c.date > from).forEach(c => { const h = +c.time.slice(0, 2); if (h in counts) counts[h]++; });
      return Object.entries(counts).map(([h, v]) => ({ label: h + 'h', value: v }));
    },
    classStats(days = 30) {
      const today = U.today(), from = U.addDays(today, -days);
      return db.classes.map(c => {
        let sessions = 0;
        for (let d = from; d < today; d = U.addDays(d, 1)) if (U.weekday(d) === c.weekday) sessions++;
        const att = db.bookings.filter(b => b.classId === c.id && b.date >= from && b.date < today && b.status === 'asistio').length;
        return { c, sessions, att, avg: sessions ? att / sessions : 0, occ: sessions ? att / (sessions * c.capacity) : 0 };
      }).sort((a, b) => b.occ - a.occ);
    },
  };
  window.GymDB = DB;
})();
