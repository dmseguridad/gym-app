/* App del socio */
(function () {
  const app = document.getElementById('app');
  const esc = U.esc;
  const SESSION = 'gym_member_session';
  const st = { day: U.today(), metric: null, month: U.month(U.today()) };
  let me = null;

  const TABS = [['inicio', 'Inicio', 'home'], ['reservar', 'Reservar', 'calendar'], ['progreso', 'Progreso', 'trend'], ['mes', 'Mi mes', 'trophy'], ['avatar', 'Avatar', 'user']];
  const route = () => (location.hash.replace(/^#\/?/, '') || 'inicio');
  const staffName = id => (GymDB.staffMember(id) || {}).name || '';
  const modalHead = title => `<div class="modal-head"><h2>${title}</h2><button class="icon-btn" data-action="close" aria-label="Cerrar">${UI.icon('close', 20)}</button></div>`;

  function render() {
    const id = localStorage.getItem(SESSION);
    me = id ? GymDB.member(id) : null;
    if (!me) return renderLogin();
    let page = route();
    if (!PAGES[page]) page = 'inicio';
    const lv = GymDB.level(me);
    const scroll = window.scrollY;
    app.innerHTML = `<div class="m-app">
      <header class="m-header"><div class="row"><span class="logo-box">${UI.icon('dumbbell', 18)}</span><strong>${esc(GymDB.settings.gymName)}</strong></div>
        <button class="m-av" data-action="profile" aria-label="Mi perfil">${Avatar.svg(me.avatar, lv.level, 40)}</button></header>
      <main class="m-main">${PAGES[page]()}</main>
      <nav class="tabbar" aria-label="Secciones"><div class="tabbar-inner">${TABS.map(([k, l, i]) => `<a href="#/${k}" class="${k === page ? 'active' : ''}" ${k === page ? 'aria-current="page"' : ''}>${UI.icon(i, 22)}<span>${l}</span></a>`).join('')}</div></nav>
    </div>`;
    if (render.lastPage === page) window.scrollTo(0, scroll); else window.scrollTo(0, 0);
    render.lastPage = page;
  }

  function renderLogin() {
    app.innerHTML = `<div class="center-screen"><form class="card login-card stack" data-form="login">
      <div class="brand-lg"><span class="logo-box">${UI.icon('dumbbell', 24)}</span><div><h1>${esc(GymDB.settings.gymName)}</h1><div class="muted small">Tu entrenamiento, tu progreso</div></div></div>
      <div class="field"><label for="ph">Celular</label><input id="ph" name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="09XXXXXXXX" required></div>
      <div class="field"><label for="pin">PIN</label><input id="pin" name="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="current-password" required></div>
      <button class="btn btn-primary btn-block btn-lg">Entrar</button>
      <p class="muted small" style="text-align:center">¿No tienes PIN? Pídelo en recepción.<br>Demo: <strong>0991234567</strong> · PIN <strong>1234</strong></p>
    </form></div>`;
  }

  /* ---------------- Componentes ---------------- */
  function bookingItem(b) {
    const c = GymDB.cls(b.classId);
    return `<div class="list-item"><span class="color-dot" style="background:${c.color}"></span>
      <div class="grow"><strong>${esc(c.name)}</strong><div class="muted small">${U.cap(U.fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short' }))} · ${c.time} · ${esc(U.first(staffName(c.staffId)))}</div></div>
      <button class="btn btn-sm" data-action="cancel" data-id="${b.id}">Cancelar</button></div>`;
  }
  function goalMessage(gp) {
    if (gp.pct >= 1) return '¡Meta cumplida! 🏆 Eres un ejemplo de constancia.';
    if (gp.pct >= 0.6) return '¡Vas muy bien! Mantén el ritmo 🔥';
    if (gp.pct >= 0.3) return 'Buen avance. Un empujón más cada semana 💪';
    return 'Recién empiezas: la constancia hace la diferencia.';
  }
  const mini = (label, value) => `<div class="mini-stat"><div class="value">${value}</div><div class="label">${label}</div></div>`;

  /* ---------------- Páginas ---------------- */
  const PAGES = {
    inicio() {
      const lv = GymDB.level(me), s = GymDB.status(me), month = U.month(U.today());
      const gp = GymDB.goalProgress(me, month);
      const up = GymDB.upcomingBookings(me.id).slice(0, 3);
      const rep = GymDB.monthlyReport(me, month);
      const todayLog = GymDB.logs(me.id).find(l => l.date === U.today());
      return `
      ${s.key !== 'activo' ? `<div class="alert ${s.cls}">${s.key === 'vencido'
        ? `Tu membresía venció el ${U.fmtDate(me.endDate, { day: 'numeric', month: 'long' })}. Acércate a recepción para renovarla.`
        : `Tu membresía vence ${s.days === 0 ? 'hoy' : `en ${s.days} ${s.days === 1 ? 'día' : 'días'}`}. Renueva a tiempo para no perder tus reservas.`}</div>` : ''}
      <section class="card hero">
        <div class="hero-av">${Avatar.svg(me.avatar, lv.level, 104)}</div>
        <div class="grow"><div class="muted small">Hola,</div><h1>${esc(U.first(me.name))}</h1>
          <div class="lvl">Nivel ${lv.level} · ${lv.name}</div>
          ${UI.progress(lv.pctToNext)}
          <div class="muted small" style="margin-top:5px">${lv.next ? `${lv.next - lv.points} pts para el nivel ${lv.level + 1}` : 'Nivel máximo alcanzado 👑'}</div></div>
      </section>
      <section class="card">
        <div class="row between"><h2>Mi meta de ${U.monthName(month)}</h2>${gp && !gp.goal.completed ? '<button class="btn btn-sm" data-action="goal">Cambiar</button>' : ''}</div>
        ${gp ? `<div class="goal-row">${Charts.ring(gp.pct, 104)}<div class="grow">
            <strong>${esc(GymDB.goalLabel(gp.goal))}</strong>
            <div class="muted small">Empezaste en ${U.num(gp.goal.start)} kg · hoy ${U.num(gp.current)} kg</div>
            <div class="small" style="margin-top:6px">${gp.pct >= 1 ? '¡Lo lograste! 🏆' : `Te faltan <strong>${U.num(gp.remaining)} kg</strong>`}</div>
            <a class="small" href="#/mes">Ver mi avance del mes →</a></div></div>`
        : `<p class="muted">Define qué quieres lograr este mes y te mostraremos tu avance día a día.</p><button class="btn btn-primary" data-action="goal">Definir mi meta</button>`}
      </section>
      <button class="btn btn-primary btn-block btn-lg" data-action="log">${todayLog ? `${UI.icon('edit', 18)} Editar mi registro de hoy` : `${UI.icon('plus', 20)} Registrar mi entrenamiento de hoy`}</button>
      <section class="card"><div class="row between"><h2>Próximas clases</h2><a href="#/reservar" class="small">Reservar</a></div>
        ${up.length ? up.map(bookingItem).join('') : '<p class="muted small" style="margin:0">No tienes clases reservadas.</p>'}
      </section>
      <section class="grid g3">${mini('Días entrenados', rep.days)}${mini('Clases', rep.classes)}${mini('Registros', rep.logsCount)}</section>
      <section class="card code-card"><div class="muted small">Tu código de entrada</div><div class="code">${me.code}</div><div class="muted small">Díctalo en recepción para registrar tu asistencia (+${GymDB.POINTS.checkin} pts)</div></section>`;
    },

    reservar() {
      const today = U.today();
      const days = Array.from({ length: 7 }, (_, i) => U.addDays(today, i));
      if (!days.includes(st.day)) st.day = today;
      const list = GymDB.classesOn(st.day);
      return `
      <h1>Reservar clase</h1>
      <div class="chips" role="tablist">${days.map((d, i) => `<button class="chip ${d === st.day ? 'active' : ''}" data-action="day" data-d="${d}" role="tab" aria-selected="${d === st.day}">${i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : U.DAYS_SHORT[U.weekday(d)]}<small>${U.fmtDate(d)}</small></button>`).join('')}</div>
      <div>${list.length ? list.map(c => {
        const n = GymDB.bookingsFor(c.id, st.day).length;
        const mine = GymDB.memberBooking(me.id, c.id, st.day);
        const past = GymDB.isPast(st.day, c.time);
        const full = n >= c.capacity;
        const left = c.capacity - n;
        let btn;
        if (mine) btn = past ? '<span class="badge ok">Reservada</span>' : `<button class="btn btn-sm" data-action="cancel" data-id="${mine.id}">Cancelar</button>`;
        else if (past) btn = '<span class="badge">Finalizada</span>';
        else if (full) btn = '<span class="badge bad">Llena</span>';
        else btn = `<button class="btn btn-sm btn-primary" data-action="book" data-c="${c.id}">Reservar</button>`;
        return `<div class="class-row ${mine ? 'mine' : ''}" style="--c:${c.color}">
          <div class="time">${c.time}</div>
          <div class="grow"><strong>${esc(c.name)}</strong>${mine ? ' <span class="badge ok">Tu reserva</span>' : ''}
            <div class="muted small">${esc(staffName(c.staffId))} · ${c.duration} min</div>
            <div class="row" style="margin-top:6px"><div class="grow">${UI.progress(n / c.capacity)}</div><span class="small muted nowrap">${full ? 'Sin cupos' : `${left} ${left === 1 ? 'cupo' : 'cupos'}`}</span></div></div>
          ${btn}</div>`;
      }).join('') : '<div class="card empty">No hay clases este día</div>'}</div>`;
    },

    progreso() {
      const logs = GymDB.logs(me.id);
      const gp = GymDB.goalProgress(me);
      const used = new Set(logs.flatMap(l => (l.exercises || []).map(e => e.name)));
      const metrics = ['peso', ...GymDB.EXERCISES.filter(e => used.has(e))];
      if (!st.metric || !metrics.includes(st.metric)) st.metric = gp ? GymDB.metricFor(gp.goal) : 'peso';
      const series = GymDB.series(me.id, st.metric).slice(-30);
      const target = gp && GymDB.metricFor(gp.goal) === st.metric ? gp.goal.target : null;
      const first = series[0], last = series[series.length - 1];
      const delta = first && last && series.length > 1 ? Math.round((last.value - first.value) * 10) / 10 : null;
      return `
      <div class="row between"><h1 style="margin:0">Mi progreso</h1><button class="btn btn-primary btn-sm" data-action="log">${UI.icon('plus', 16)} Registrar</button></div>
      <div class="chips">${metrics.map(m => `<button class="chip ${m === st.metric ? 'active' : ''}" data-action="metric" data-m="${esc(m)}">${m === 'peso' ? 'Peso corporal' : esc(m)}</button>`).join('')}</div>
      <section class="card">
        <div class="row between"><h2>${st.metric === 'peso' ? 'Peso corporal' : esc(st.metric) + ' (máx.)'}</h2>
          ${delta != null ? `<span class="badge ${(st.metric === 'peso' ? (gp && gp.goal.type === 'subir_peso' ? delta >= 0 : delta <= 0) : delta >= 0) ? 'ok' : 'warn'}">${delta > 0 ? '+' : ''}${U.num(delta)} kg</span>` : ''}</div>
        ${Charts.line({ points: series, target })}
        <p class="muted small" style="margin:6px 0 0">Últimos ${series.length} registros</p>
      </section>
      <section class="card"><h2>Historial</h2>
        ${logs.length ? logs.slice().reverse().slice(0, 25).map(l => `
          <div class="list-item clickable" data-action="log" data-id="${l.id}">
            <div style="min-width:54px"><strong>${U.fmtDate(l.date)}</strong><div class="small muted">${U.DAYS_SHORT[U.weekday(l.date)]}</div></div>
            <div class="grow small">${(l.exercises || []).map(e => `${esc(e.name)} <strong>${U.num(e.kg)}</strong>kg×${e.reps}`).join(' · ') || '<span class="muted">Sin ejercicios</span>'}</div>
            ${l.weight ? `<span class="badge info">${U.num(l.weight)} kg</span>` : ''}
          </div>`).join('') : '<div class="empty">Aún no tienes registros. ¡Empieza hoy!</div>'}
      </section>`;
    },

    mes() {
      const cur = U.month(U.today());
      const months = [cur, U.shiftMonth(cur, -1), U.shiftMonth(cur, -2)];
      if (!months.includes(st.month)) st.month = cur;
      const r = GymDB.monthlyReport(me, st.month);
      const gp = r.goal;
      const prevGoal = GymDB.goalProgress(me, U.shiftMonth(st.month, -1));
      let projTxt = '';
      if (r.projection != null && gp) {
        const g = gp.goal;
        const reaches = g.target >= g.start ? r.projection >= g.target : r.projection <= g.target;
        projTxt = `<div class="proj">${UI.icon('trend', 16)} A este ritmo cerrarás ${U.monthName(st.month)} en <strong>${U.num(r.projection)} kg</strong>. ${reaches ? '¡Alcanzarías tu meta! 🎯' : `Necesitas acelerar un poco para llegar a ${U.num(g.target)} kg.`}</div>`;
      }
      return `
      <h1>Mi avance del mes</h1>
      <div class="chips">${months.map(m => `<button class="chip ${m === st.month ? 'active' : ''}" data-action="month" data-m="${m}">${U.cap(U.monthName(m))}</button>`).join('')}</div>
      <section class="card">
        <div class="row between"><h2>${U.cap(U.monthYear(st.month))}</h2>${r.isCurrent ? `<span class="badge info">Faltan ${r.daysLeft} días</span>` : '<span class="badge">Cerrado</span>'}</div>
        ${gp ? `
          <div class="goal-row" style="margin-top:8px">${Charts.ring(gp.pct, 120)}
            <div class="grow"><div class="muted small">Meta</div><strong style="font-size:1.1rem">${esc(GymDB.goalLabel(gp.goal))}</strong>
            <div class="msg">${goalMessage(gp)}</div></div></div>
          <div class="trio"><div><div class="v">${U.num(gp.goal.start)}</div><div class="l">Inicio (kg)</div></div>
            <div><div class="v" style="color:var(--accent)">${U.num(gp.current)}</div><div class="l">${r.isCurrent ? 'Hoy' : 'Final'} (kg)</div></div>
            <div><div class="v" style="color:var(--ok)">${U.num(gp.goal.target)}</div><div class="l">Meta (kg)</div></div></div>
          ${projTxt}
          ${Charts.line({ points: gp.series, target: gp.goal.target, height: 170 })}`
        : r.isCurrent ? `<p class="muted">Aún no defines tu meta de este mes. Ponte un objetivo y al final del mes verás cuánto lograste.</p><button class="btn btn-primary" data-action="goal">Definir mi meta</button>`
          : '<p class="muted">No definiste una meta este mes.</p>'}
      </section>
      <section class="grid g3">${mini('Días entrenados', r.days)}${mini('Clases', r.classes)}${mini('Cambio de peso', r.weightChange == null ? '—' : (r.weightChange > 0 ? '+' : '') + U.num(r.weightChange))}</section>
      <section class="card"><h2>Mejores marcas del mes</h2>
        ${r.best.length ? r.best.map(b => `<div class="list-item"><div class="grow"><strong>${esc(b.name)}</strong>${b.prev != null ? `<div class="small muted">Mes anterior: ${U.num(b.prev)} kg</div>` : ''}</div>
          ${b.diff != null && b.diff !== 0 ? `<span class="small ${b.diff > 0 ? 'best-up' : 'muted'}">${b.diff > 0 ? '▲ +' : '▼ '}${U.num(b.diff)} kg</span>` : ''}<span class="badge info">${U.num(b.cur)} kg</span></div>`).join('')
        : '<p class="muted small" style="margin:0">Registra tus ejercicios para ver tus mejores marcas.</p>'}
      </section>
      ${prevGoal && st.month === cur ? `<section class="card"><div class="row between"><div><div class="muted small">Mes anterior</div><strong>${esc(GymDB.goalLabel(prevGoal.goal))}</strong></div>${prevGoal.pct >= 1 ? '<span class="badge ok">🏆 Cumplida</span>' : `<span class="badge warn">${Math.round(prevGoal.pct * 100)}%</span>`}</div></section>` : ''}`;
    },

    avatar() {
      const lv = GymDB.level(me), a = me.avatar || {};
      const O = Avatar.OPTIONS, L = Avatar.LABELS;
      const sw = (k, list) => `<div class="opts">${list.map(v => `<button class="opt swatch ${a[k] === v ? 'active' : ''}" style="background:${v}" data-action="av" data-k="${k}" data-v="${v}" aria-label="Color ${v}" aria-pressed="${a[k] === v}"></button>`).join('')}</div>`;
      return `
      <h1>Mi avatar</h1>
      <section class="card">
        <div class="av-stage"><div>${Avatar.svg(a, lv.level, 190)}</div></div>
        <div style="text-align:center"><div class="lvl" style="margin:8px 0 4px">Nivel ${lv.level} · ${lv.name} · ${lv.points} pts</div>
          <div style="max-width:280px;margin:0 auto">${UI.progress(lv.pctToNext)}</div>
          <div class="muted small" style="margin-top:6px">${lv.next ? `Te faltan ${lv.next - lv.points} pts para el nivel ${lv.level + 1}: tu avatar se verá más fuerte` : '¡Nivel máximo! Desbloqueaste la corona 👑'}</div></div>
      </section>
      <section class="card stack">
        <div><div class="lbl">Piel</div>${sw('skin', O.skin)}</div>
        <div><div class="lbl">Cabello</div><div class="opts">${O.hair.map(v => `<button class="opt ${a.hair === v ? 'active' : ''}" data-action="av" data-k="hair" data-v="${v}" aria-pressed="${a.hair === v}">${L.hair[v]}</button>`).join('')}</div></div>
        <div><div class="lbl">Color de cabello</div>${sw('hairColor', O.hairColor)}</div>
        <div><div class="lbl">Camiseta</div>${sw('shirt', O.shirt)}</div>
        <div><div class="lbl">Accesorios</div><div class="opts">${O.accessory.map(v => {
          const need = Avatar.UNLOCK[v], locked = lv.level < need;
          return `<button class="opt ${a.accessory === v ? 'active' : ''}" data-action="av" data-k="accessory" data-v="${v}" ${locked ? 'disabled' : ''} aria-pressed="${a.accessory === v}">${locked ? UI.icon('lock', 14) : ''}${L.accessory[v]}${locked ? ` <span class="small muted">Nv ${need}</span>` : ''}</button>`;
        }).join('')}</div></div>
      </section>
      <section class="card"><h2>Cómo subir de nivel</h2>
        <div class="list-item"><span class="grow">Entrada registrada en el gimnasio</span><strong>+${GymDB.POINTS.checkin}</strong></div>
        <div class="list-item"><span class="grow">Registrar tu entrenamiento del día</span><strong>+${GymDB.POINTS.log}</strong></div>
        <div class="list-item"><span class="grow">Cumplir tu meta del mes</span><strong>+${GymDB.POINTS.goal}</strong></div>
      </section>
      <section class="card ladder"><h2>Niveles</h2>
        ${GymDB.LEVELS.map((l, i) => `<div class="list-item"><span class="${lv.level > i ? 'done' : 'muted'}">${lv.level > i ? '✓' : '○'}</span><span class="grow"><strong>${i + 1}. ${l.name}</strong></span><span class="small muted">${l.min} pts</span></div>`).join('')}
      </section>`;
    },
  };

  /* ---------------- Modales ---------------- */
  const exRow = (e = {}) => `<div class="ex-row">
    <select name="ex_name" aria-label="Ejercicio">${GymDB.EXERCISES.map(x => `<option ${e.name === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
    <input name="ex_kg" type="number" step="0.5" min="0" placeholder="kg" value="${e.kg ?? ''}" inputmode="decimal" aria-label="Kilos">
    <input name="ex_reps" type="number" min="0" placeholder="reps" value="${e.reps ?? ''}" inputmode="numeric" aria-label="Repeticiones">
    <button type="button" class="icon-btn" data-action="rm-ex" aria-label="Quitar ejercicio">${UI.icon('close', 16)}</button></div>`;

  function logModal(id) {
    const logs = GymDB.logs(me.id);
    const l = id ? logs.find(x => x.id === id) : logs.find(x => x.date === U.today());
    const lastW = [...logs].reverse().find(x => x.weight);
    const ex = l && l.exercises && l.exercises.length ? l.exercises
      : (logs.length ? logs[logs.length - 1].exercises.map(e => ({ name: e.name, kg: e.kg, reps: e.reps })) : [{ name: 'Sentadilla' }]);
    UI.modal(`${modalHead(l ? 'Editar registro' : 'Registro de hoy')}
      <form data-form="log" class="stack">
        <input type="hidden" name="id" value="${l ? l.id : ''}">
        <div class="form-grid">
          <div class="field"><label for="ld">Fecha</label><input id="ld" type="date" name="date" max="${U.today()}" value="${l ? l.date : U.today()}" required></div>
          <div class="field"><label for="lw">Peso corporal (kg)</label><input id="lw" type="number" step="0.1" min="20" max="300" name="weight" inputmode="decimal" value="${l && l.weight ? l.weight : ''}" placeholder="${lastW ? 'Último: ' + U.num(lastW.weight) : 'Opcional'}"></div>
        </div>
        <div><div class="row between"><span class="lbl">Ejercicios (kg · repeticiones)</span><button type="button" class="btn btn-sm" data-action="add-ex">${UI.icon('plus', 14)} Ejercicio</button></div>
          <div id="ex-rows">${ex.map(exRow).join('')}</div></div>
        <div class="field"><label for="ln">Notas</label><textarea id="ln" name="notes" rows="2" placeholder="¿Cómo te sentiste?">${esc(l ? l.notes : '')}</textarea></div>
        <div class="modal-actions">${l ? `<button type="button" class="btn btn-danger" data-action="del-log" data-id="${l.id}">${UI.icon('trash', 16)}</button><span class="spacer"></span>` : ''}
          <button type="button" class="btn" data-action="close">Cancelar</button><button class="btn btn-primary">Guardar (+${GymDB.POINTS.log} pts)</button></div>
      </form>`);
  }

  function goalModal() {
    const month = U.month(U.today());
    const g = me.goals && me.goals[month];
    const logs = GymDB.logs(me.id);
    const lastW = [...logs].reverse().find(x => x.weight);
    const bestOf = name => { const s = GymDB.series(me.id, name); return s.length ? Math.max(...s.map(p => p.value)) : ''; };
    UI.modal(`${modalHead(`Mi meta de ${U.monthName(month)}`)}
      <p class="muted small">Elige qué quieres lograr hasta fin de mes. Al cerrar el mes verás tu resultado.</p>
      <form data-form="goal" class="stack">
        <div class="form-grid">
          <div class="field" style="grid-column:1/-1"><label for="gt">Objetivo</label><select id="gt" name="type">${Object.entries(GymDB.GOAL_TYPES).map(([k, v]) => `<option value="${k}" ${g && g.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="field" id="g-ex-wrap" style="grid-column:1/-1"><label for="ge">Ejercicio</label><select id="ge" name="exercise">${GymDB.EXERCISES.map(x => `<option ${g && g.exercise === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
          <div class="field"><label for="gs" id="gs-l">Valor actual (kg)</label><input id="gs" name="start" type="number" step="0.1" min="1" inputmode="decimal" required></div>
          <div class="field"><label for="gtg">Meta (kg)</label><input id="gtg" name="target" type="number" step="0.1" min="1" inputmode="decimal" value="${g ? g.target : ''}" required></div>
        </div>
        <div class="modal-actions"><button type="button" class="btn" data-action="close">Cancelar</button><button class="btn btn-primary">Guardar meta</button></div>
      </form>`, root => {
      const type = root.querySelector('#gt'), ex = root.querySelector('#ge'), wrap = root.querySelector('#g-ex-wrap'), start = root.querySelector('#gs'), lbl = root.querySelector('#gs-l');
      let first = true;
      const upd = () => {
        const f = type.value === 'fuerza';
        wrap.style.display = f ? '' : 'none';
        lbl.textContent = f ? 'Tu máximo actual (kg)' : 'Tu peso actual (kg)';
        if (first && g && g.type === type.value) start.value = g.start;
        else start.value = f ? bestOf(ex.value) : (lastW ? lastW.weight : '');
        first = false;
      };
      type.addEventListener('change', upd); ex.addEventListener('change', upd); upd();
    });
  }

  function profileModal() {
    const s = GymDB.status(me), plan = GymDB.plan(me.planId);
    UI.modal(`${modalHead('Mi perfil')}
      <div class="list-item"><span class="grow muted">Nombre</span><strong>${esc(me.name)}</strong></div>
      <div class="list-item"><span class="grow muted">Celular</span><strong>${esc(me.phone)}</strong></div>
      <div class="list-item"><span class="grow muted">Plan</span><strong>${esc(plan ? plan.name : '—')}</strong></div>
      <div class="list-item"><span class="grow muted">Vence</span><strong>${U.fmtDate(me.endDate, { day: 'numeric', month: 'long', year: 'numeric' })}</strong> ${UI.badge(s)}</div>
      <div class="list-item"><span class="grow muted">Código de entrada</span><strong>${me.code}</strong></div>
      <div class="modal-actions"><button class="btn btn-danger" data-action="logout">${UI.icon('logout', 16)} Cerrar sesión</button></div>`);
  }

  function celebrate(title, text, big) {
    UI.modal(`<div class="celebrate"><div class="big">${big}</div><h2>${title}</h2><p class="muted">${text}</p>
      <div style="display:flex;justify-content:center;margin:10px 0">${Avatar.svg(me.avatar, GymDB.level(me).level, 120)}</div>
      <button class="btn btn-primary btn-block" data-action="close">¡Genial!</button></div>`);
  }

  /* ---------------- Acciones ---------------- */
  const ACTIONS = {
    close: () => UI.closeModal(),
    profile: () => profileModal(),
    logout() { localStorage.removeItem(SESSION); UI.closeModal(); location.hash = ''; render(); },
    day(d) { st.day = d.d; render(); },
    metric(d) { st.metric = d.m; render(); },
    month(d) { st.month = d.m; render(); },
    book(d) {
      const r = GymDB.book(me.id, d.c, st.day);
      if (!r.ok) { UI.toast(r.error, 'bad'); return; }
      UI.toast('✓ Clase reservada'); render();
    },
    cancel(d) {
      if (!confirm('¿Cancelar esta reserva?')) return;
      GymDB.cancelBooking(d.id); UI.toast('Reserva cancelada'); render();
    },
    log: d => logModal(d.id),
    goal: () => goalModal(),
    'add-ex'() { document.getElementById('ex-rows').insertAdjacentHTML('beforeend', exRow()); },
    'rm-ex'(d, el) { el.closest('.ex-row').remove(); },
    'del-log'(d) { if (!confirm('¿Eliminar este registro?')) return; GymDB.removeLog(d.id); UI.closeModal(); UI.toast('Registro eliminado'); render(); },
    av(d) {
      if (d.k === 'accessory' && GymDB.level(me).level < Avatar.UNLOCK[d.v]) return;
      GymDB.saveMember({ id: me.id, avatar: { ...me.avatar, [d.k]: d.v } });
      render();
    },
  };

  const FORMS = {
    login(d) {
      const m = GymDB.login(d.phone, d.pin);
      if (!m) { UI.toast('Celular o PIN incorrecto', 'bad'); return; }
      localStorage.setItem(SESSION, m.id); location.hash = '#/inicio'; render();
    },
    log(d, form) {
      const fd = new FormData(form);
      const names = fd.getAll('ex_name'), kgs = fd.getAll('ex_kg'), reps = fd.getAll('ex_reps');
      const exercises = names.map((n, i) => ({ name: n, kg: +kgs[i] || 0, reps: +reps[i] || 0 })).filter(e => e.kg > 0 || e.reps > 0);
      const weight = d.weight ? +d.weight : null;
      if (!weight && !exercises.length) { UI.toast('Ingresa tu peso o al menos un ejercicio', 'bad'); return; }
      const r = GymDB.saveLog(me.id, { id: d.id || undefined, date: d.date, weight, exercises, notes: d.notes.trim() });
      UI.closeModal(); render();
      if (r.completed) celebrate('¡Meta cumplida!', `Lograste tu meta del mes. Ganaste +${GymDB.POINTS.goal} pts.`, '🏆');
      else if (r.levelUp) celebrate(`¡Subiste al nivel ${r.levelUp}!`, `Ahora eres ${GymDB.LEVELS[r.levelUp - 1].name}. Tu avatar se ve más fuerte.`, '⚡');
      else UI.toast(`✓ Registro guardado (+${GymDB.POINTS.log} pts)`);
    },
    goal(d) {
      const start = +d.start, target = +d.target;
      if (d.type === 'bajar_peso' && target >= start) { UI.toast('Para bajar de peso, la meta debe ser menor a tu peso actual', 'bad'); return; }
      if (d.type !== 'bajar_peso' && target <= start) { UI.toast('La meta debe ser mayor a tu valor actual', 'bad'); return; }
      GymDB.setGoal(me.id, { type: d.type, exercise: d.type === 'fuerza' ? d.exercise : undefined, start, target });
      UI.closeModal(); UI.toast('🎯 Meta guardada. ¡A por ella!'); render();
    },
  };

  /* ---------------- Eventos ---------------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = ACTIONS[el.dataset.action];
    if (fn) fn(el.dataset, el, e);
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('form[data-form]');
    if (!f) return;
    e.preventDefault();
    FORMS[f.dataset.form](UI.formData(f), f);
  });
  window.addEventListener('hashchange', () => { UI.closeModal(); render(); });
  GymDB.onChange(() => { if (!UI.isModalOpen()) render(); });
  render();
})();
