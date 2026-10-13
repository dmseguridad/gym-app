/* Panel del administrador */
(function () {
  const app = document.getElementById('app');
  const esc = U.esc;
  const $ = s => document.querySelector(s);
  const state = { q: '', filter: 'todos' };
  const SESSION = 'gym_admin_session';

  const NAV = [
    ['inicio', 'Inicio', 'home'], ['socios', 'Socios', 'users'], ['clases', 'Clases', 'calendar'],
    ['personal', 'Personal', 'badge'], ['asistencia', 'Asistencia', 'check'], ['reportes', 'Reportes', 'chart'],
    ['ajustes', 'Ajustes', 'settings'],
  ];
  const FILTERS = { todos: 'Todos', activo: 'Activos', por_vencer: 'Por vencer', vencido: 'Vencidos' };
  const METHODS = ['Efectivo', 'Transferencia', 'DeUna', 'Tarjeta'];
  const ROLES = ['Entrenador', 'Entrenadora', 'Instructor', 'Instructora', 'Recepción', 'Administración', 'Limpieza'];

  const route = () => (location.hash.replace(/^#\/?/, '') || 'inicio').split('?')[0];
  const planName = id => (GymDB.plan(id) || {}).name || '—';
  const staffName = id => (GymDB.staffMember(id) || {}).name || 'Sin asignar';

  function waLink(phone, msg) {
    const p = '593' + String(phone).replace(/\D/g, '').replace(/^0/, '');
    return `https://wa.me/${p}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
  }
  function waReminder(m) {
    const s = GymDB.status(m), gym = GymDB.settings.gymName;
    const date = U.fmtDate(m.endDate, { day: 'numeric', month: 'long' });
    const msg = s.key === 'vencido'
      ? `Hola ${U.first(m.name)}, tu membresía en ${gym} venció el ${date}. ¡Te extrañamos! Renueva y sigue con tu progreso 💪`
      : `Hola ${U.first(m.name)}, te recordamos que tu membresía en ${gym} vence el ${date}. Renueva a tiempo y no pierdas tu avance 💪`;
    return waLink(m.phone, msg);
  }
  const avatarMini = m => `<span class="mini-av">${Avatar.face(m, GymDB.level(m).level, 38)}</span>`;
  const stat = (label, value, sub = '', cls = '') => `<div class="card stat"><div class="label">${label}</div><div class="value">${value}</div><div class="sub ${cls}">${sub}</div></div>`;

  /* ---------------- Render principal ---------------- */
  function render() {
    if (sessionStorage.getItem(SESSION) !== '1') return renderLogin();
    let page = route();
    if (!PAGES[page]) page = 'inicio';
    const scroll = window.scrollY;
    app.innerHTML = `<div class="layout">
      <aside class="sidebar">
        <div class="brand">${UI.logo(36)}${esc(GymDB.settings.gymName)}</div>
        <nav class="nav" aria-label="Secciones">
          ${NAV.map(([k, l, i]) => `<a href="#/${k}" class="${k === page ? 'active' : ''}" ${k === page ? 'aria-current="page"' : ''}>${UI.icon(i, 18)}<span>${l}</span></a>`).join('')}
          <a href="#" class="logout" data-action="logout">${UI.icon('logout', 18)}<span>Salir</span></a>
        </nav>
      </aside>
      <main class="main" id="main">${PAGES[page]()}</main>
    </div>`;
    if (AFTER[page]) AFTER[page]();
    if (render.lastPage === page) window.scrollTo(0, scroll);
    render.lastPage = page;
  }

  function renderLogin() {
    app.innerHTML = `<div class="center-screen"><form class="card login-card stack" data-form="login">
      <div class="brand-lg">${UI.logo(46)}<div><h1>${esc(GymDB.settings.gymName)}</h1><div class="muted small">Panel de administración</div></div></div>
      <div class="field"><label for="pin">PIN de administrador</label><input id="pin" name="pin" type="password" inputmode="numeric" autocomplete="current-password" required autofocus></div>
      <button class="btn btn-primary btn-block btn-lg">Entrar</button>
      <p class="muted small" style="text-align:center">Demo: PIN <strong>1234</strong></p>
    </form></div>`;
  }

  /* ---------------- Páginas ---------------- */
  const AFTER = {};
  const PAGES = {
    inicio() {
      const d = GymDB.dashboard();
      const diff = d.revPrev ? Math.round((d.rev - d.revPrev) / d.revPrev * 100) : null;
      const rbm = GymDB.revenueByMonth(6);
      const attention = [...d.porVencer, ...d.vencidos].slice(0, 8);
      return `
      <div class="page-head"><div><h1>Resumen</h1><div class="muted">${U.cap(U.fmtLong(U.today()))}</div></div>
        <div class="row wrap"><a class="btn" href="#/asistencia">${UI.icon('check', 18)} Registrar entrada</a><button class="btn btn-primary" data-action="new-member">${UI.icon('plus', 18)} Nuevo socio</button></div></div>
      <div class="grid g4">
        ${stat('Socios activos', d.active, `${d.newMembers} nuevos este mes`)}
        ${stat('Ingresos del mes', U.money(d.rev), diff == null ? '' : `${diff >= 0 ? '▲' : '▼'} ${Math.abs(diff)}% vs. mismo corte del mes anterior`, diff >= 0 ? 'ok' : 'bad')}
        ${stat('Entradas hoy', d.checkinsToday.length, 'registradas en recepción')}
        ${stat('Por vencer', d.porVencer.length, `${d.vencidos.length} vencidos en los últimos 30 días`, 'warn')}
      </div>
      <div class="grid g2 mt">
        <section class="card"><div class="row between"><h2>Clases de hoy</h2><a class="small" href="#/clases">Ver horario</a></div>
          ${d.todayClasses.length ? d.todayClasses.map(({ c, n }) => `
            <div class="list-item clickable" data-action="class" data-id="${c.id}">
              <span class="color-dot" style="background:${c.color}"></span>
              <div class="grow"><strong>${esc(c.name)}</strong> <span class="muted small">· ${c.time} · ${esc(staffName(c.staffId))}</span>
                <div class="row" style="margin-top:6px"><div class="grow">${UI.progress(n / c.capacity)}</div><span class="small muted nowrap">${n}/${c.capacity}</span></div></div>
            </div>`).join('') : '<div class="empty">No hay clases programadas hoy</div>'}
        </section>
        <section class="card"><h2>Requieren atención</h2>
          ${attention.length ? attention.map(({ m, s }) => `
            <div class="list-item">
              ${avatarMini(m)}
              <div class="grow"><strong>${esc(m.name)}</strong><div class="small muted">${planName(m.planId)} · ${U.fmtDate(m.endDate)}</div></div>
              ${UI.badge(s)}
              <a class="icon-btn btn-wa" href="${waReminder(m)}" target="_blank" rel="noopener" title="Enviar recordatorio por WhatsApp" aria-label="Recordatorio por WhatsApp">${UI.icon('whatsapp', 18)}</a>
              <button class="btn btn-sm" data-action="pay" data-id="${m.id}">Cobrar</button>
            </div>`).join('') : '<div class="empty">Todo al día 🎉</div>'}
        </section>
      </div>
      <section class="card mt"><h2>Ingresos de los últimos 6 meses</h2>
        ${Charts.bars({ data: rbm.map(r => ({ label: U.cap(U.monthName(r.month).slice(0, 3)), value: r.value })), fmt: v => '$' + Math.round(v), highlightLast: true })}
      </section>`;
    },

    socios() {
      const n = GymDB.members().length;
      return `
      <div class="page-head"><div><h1>Socios</h1><div class="muted">${n} registrados</div></div>
        <button class="btn btn-primary" data-action="new-member">${UI.icon('plus', 18)} Nuevo socio</button></div>
      <div class="card">
        <div class="row wrap toolbar">
          <input type="search" id="q" placeholder="Buscar por nombre, celular o código" value="${esc(state.q)}" aria-label="Buscar socio">
          <div class="chips">${Object.entries(FILTERS).map(([k, l]) => `<button class="chip ${state.filter === k ? 'active' : ''}" data-action="filter" data-k="${k}">${l}</button>`).join('')}</div>
        </div>
        <div id="members-table">${membersTable()}</div>
      </div>`;
    },

    clases() {
      const today = U.today();
      const order = [1, 2, 3, 4, 5, 6, 0];
      const all = GymDB.classes();
      return `
      <div class="page-head"><div><h1>Clases y horarios</h1><div class="muted">${all.length} clases por semana</div></div>
        <button class="btn btn-primary" data-action="new-class">${UI.icon('plus', 18)} Nueva clase</button></div>
      <div class="week">
        ${order.map(d => {
          const list = all.filter(c => c.weekday === d).sort((a, b) => a.time.localeCompare(b.time));
          const date = GymDB.nextDateFor(d);
          return `<div class="day-col ${d === U.weekday(today) ? 'today' : ''}">
            <div class="day-head"><span>${U.DAYS[d]}</span><span class="muted">${U.fmtDate(date)}</span></div>
            ${list.map(c => {
              const n = GymDB.bookingsFor(c.id, date).length;
              return `<button class="class-card" style="--c:${c.color}" data-action="class" data-id="${c.id}">
                <div class="time">${c.time} · ${c.duration} min</div><div class="name">${esc(c.name)}</div>
                <div class="small muted">${esc(U.first(staffName(c.staffId)))} · ${n}/${c.capacity}</div></button>`;
            }).join('') || '<div class="small muted" style="padding:4px">Sin clases</div>'}
          </div>`;
        }).join('')}
      </div>`;
    },

    personal() {
      const staff = GymDB.staff();
      return `
      <div class="page-head"><div><h1>Personal</h1><div class="muted">${staff.length} personas</div></div>
        <button class="btn btn-primary" data-action="new-staff">${UI.icon('plus', 18)} Agregar</button></div>
      <div class="grid g2">
        ${staff.map(s => {
          const cl = GymDB.classes().filter(c => c.staffId === s.id);
          const hours = cl.reduce((a, c) => a + c.duration, 0) / 60;
          return `<div class="card staff-card">
            <div class="initials" style="width:48px;height:48px;font-size:1rem">${U.initials(s.name)}</div>
            <div class="grow">
              <div class="row between"><strong>${esc(s.name)}</strong>${s.active ? '<span class="badge ok">Activo</span>' : '<span class="badge">Inactivo</span>'}</div>
              <div class="small muted">${esc(s.role)}${s.specialty ? ' · ' + esc(s.specialty) : ''}</div>
              <div class="small" style="margin-top:8px">${cl.length ? `${cl.length} clases/semana · ${U.num(hours)} h` : '<span class="muted">Sin clases asignadas</span>'}</div>
              ${cl.length ? `<div class="small muted">${[...new Set(cl.map(c => c.name))].map(esc).join(', ')}</div>` : ''}
              <div class="row" style="margin-top:12px">
                <button class="btn btn-sm" data-action="edit-staff" data-id="${s.id}">${UI.icon('edit', 15)} Editar</button>
                ${s.phone ? `<a class="btn btn-sm btn-wa" href="${waLink(s.phone)}" target="_blank" rel="noopener">${UI.icon('whatsapp', 15)} WhatsApp</a>` : ''}
              </div>
            </div>
          </div>`;
        }).join('') || '<div class="card empty">Aún no registras personal</div>'}
      </div>`;
    },

    asistencia() {
      const list = GymDB.checkins(U.today()).reverse();
      return `
      <div class="page-head"><div><h1>Asistencia</h1><div class="muted">${U.cap(U.fmtLong(U.today()))}</div></div></div>
      <section class="card">
        <h2>Registrar entrada</h2>
        <p class="muted small">Ingresa el código del socio (aparece en su app) o parte de su nombre.</p>
        <form data-form="checkin" class="checkin-box" autocomplete="off">
          <input name="q" id="ck-q" placeholder="Ej. 1001 o Mateo" required aria-label="Código o nombre del socio">
          <button class="btn btn-primary">${UI.icon('check', 18)} Registrar</button>
        </form>
        <div id="ck-result"></div>
      </section>
      <section class="card mt"><h2>Entradas de hoy (${list.length})</h2>
        ${list.length ? `<div class="table-wrap"><table><thead><tr><th>Hora</th><th>Socio</th><th class="hide-sm">Plan</th><th>Membresía</th></tr></thead><tbody>
          ${list.map(c => { const m = GymDB.member(c.memberId); if (!m) return ''; return `<tr class="clickable" data-action="member" data-id="${m.id}"><td class="nowrap">${c.time}</td><td><div class="row">${avatarMini(m)}<strong>${esc(m.name)}</strong></div></td><td class="hide-sm">${planName(m.planId)}</td><td>${UI.badge(GymDB.status(m))}</td></tr>`; }).join('')}
        </tbody></table></div>` : '<div class="empty">Todavía no hay entradas hoy</div>'}
      </section>`;
    },

    reportes() {
      const rbm = GymDB.revenueByMonth(6);
      const total = rbm.reduce((a, r) => a + r.value, 0);
      const cs = GymDB.classStats(30);
      const members = GymDB.members();
      const month = U.month(U.today());
      const withGoal = members.filter(m => m.goals && m.goals[month]);
      const progs = withGoal.map(m => GymDB.goalProgress(m, month));
      const avg = progs.length ? progs.reduce((a, p) => a + p.pct, 0) / progs.length : 0;
      const done = progs.filter(p => p.pct >= 1).length;
      const byPlan = GymDB.plans().map(p => ({ label: p.name, value: members.filter(m => m.planId === p.id && GymDB.status(m).key !== 'vencido').length }));
      return `
      <div class="page-head"><div><h1>Reportes</h1><div class="muted">Últimos 30 días y 6 meses</div></div></div>
      <div class="grid g4">
        ${stat('Ingresos 6 meses', U.money(total), `Promedio ${U.money(total / 6)}/mes`)}
        ${stat('Socios con meta', `${withGoal.length}`, `de ${members.length} socios`)}
        ${stat('Avance promedio', Math.round(avg * 100) + '%', 'de las metas del mes')}
        ${stat('Metas cumplidas', done, 'en ' + U.monthName(month), 'ok')}
      </div>
      <div class="grid g2 mt">
        <section class="card"><h2>Ingresos por mes</h2>${Charts.bars({ data: rbm.map(r => ({ label: U.cap(U.monthName(r.month).slice(0, 3)), value: r.value })), fmt: v => '$' + Math.round(v), highlightLast: true })}</section>
        <section class="card"><h2>Socios activos por plan</h2>${Charts.bars({ data: byPlan })}</section>
        <section class="card"><h2>Entradas por día de la semana</h2>${Charts.bars({ data: GymDB.checkinsByWeekday(30) })}</section>
        <section class="card"><h2>Horas pico</h2>${Charts.bars({ data: GymDB.checkinsByHour(30) })}</section>
      </div>
      <section class="card mt"><h2>Ocupación de clases (30 días)</h2>
        <div class="table-wrap"><table><thead><tr><th>Clase</th><th>Día</th><th class="hide-sm">Instructor</th><th class="right">Sesiones</th><th class="right">Prom. asistentes</th><th style="min-width:140px">Ocupación</th></tr></thead><tbody>
        ${cs.map(r => `<tr><td><div class="row"><span class="color-dot" style="background:${r.c.color}"></span>${esc(r.c.name)}</div></td><td>${U.DAYS_SHORT[r.c.weekday]} ${r.c.time}</td><td class="hide-sm">${esc(staffName(r.c.staffId))}</td><td class="right">${r.sessions}</td><td class="right">${U.num(r.avg)} / ${r.c.capacity}</td><td><div class="row"><div class="grow">${UI.progress(r.occ)}</div><span class="small nowrap">${Math.round(r.occ * 100)}%</span></div></td></tr>`).join('')}
        </tbody></table></div>
      </section>`;
    },

    ajustes() {
      const s = GymDB.settings;
      return `
      <div class="page-head"><div><h1>Ajustes</h1></div></div>
      <div class="grid g2">
        <section class="card"><h2>Gimnasio</h2>
          <div class="row" style="gap:16px;margin-bottom:16px">
            ${UI.logo(72)}
            <div class="grow"><div class="lbl">Logo</div>
              <div class="small muted" style="margin:2px 0 8px">Aparece en el panel y en la app de tus socios.</div>
              <div class="row wrap"><button class="btn btn-sm" data-action="upload-logo">${UI.icon('download', 15)} ${s.logo ? 'Cambiar logo' : 'Subir logo'}</button>
              ${s.logo ? `<button class="btn btn-sm btn-danger" data-action="remove-logo">Quitar</button>` : ''}</div></div>
          </div>
          <form data-form="settings" class="stack">
            <div class="field"><label for="gn">Nombre del gimnasio</label><input id="gn" name="gymName" value="${esc(s.gymName)}" required></div>
            <div class="field"><label for="ap">PIN del administrador</label><input id="ap" name="adminPin" value="${esc(s.adminPin)}" inputmode="numeric" pattern="\\d{4,6}" title="4 a 6 dígitos" required></div>
            <button class="btn btn-primary">Guardar</button>
          </form>
        </section>
        <section class="card"><div class="row between"><h2>Planes de membresía</h2><button class="btn btn-sm" data-action="new-plan">${UI.icon('plus', 15)} Plan</button></div>
          <div class="table-wrap"><table><thead><tr><th>Plan</th><th class="right">Precio</th><th class="right">Días</th><th></th></tr></thead><tbody>
          ${GymDB.plans().map(p => `<tr><td><strong>${esc(p.name)}</strong></td><td class="right">${U.money(p.price)}</td><td class="right">${p.days}</td><td class="actions"><button class="icon-btn" data-action="edit-plan" data-id="${p.id}" aria-label="Editar plan">${UI.icon('edit', 16)}</button></td></tr>`).join('')}
          </tbody></table></div>
        </section>
        <section class="card"><h2>Datos</h2>
          <p class="muted small">Esta es una versión de demostración: los datos se guardan en este navegador. Descarga un respaldo cuando quieras.</p>
          <div class="row wrap"><button class="btn" data-action="export">${UI.icon('download', 16)} Descargar respaldo</button>
          <button class="btn btn-danger" data-action="reset">Restablecer datos de ejemplo</button></div>
        </section>
        <section class="card"><h2>App del socio</h2>
          <p class="muted small">Comparte este enlace con tus socios. Entran con su número de celular y su PIN.</p>
          <div class="note" style="word-break:break-all">${esc(new URL('../socio/', location.href).href)}</div>
          <div class="row mt"><a class="btn" href="../socio/" target="_blank" rel="noopener">Abrir app del socio</a></div>
        </section>
      </div>`;
    },
  };

  AFTER.socios = () => {
    const q = $('#q');
    q.addEventListener('input', () => { state.q = q.value; $('#members-table').innerHTML = membersTable(); });
  };
  AFTER.asistencia = () => { const i = $('#ck-q'); if (i) i.focus(); };

  function membersTable() {
    const q = state.q.trim().toLowerCase();
    const month = U.month(U.today());
    const rows = GymDB.members()
      .map(m => ({ m, s: GymDB.status(m) }))
      .filter(({ m, s }) => (state.filter === 'todos' || s.key === state.filter) &&
        (!q || m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.code === q))
      .sort((a, b) => a.m.name.localeCompare(b.m.name));
    if (!rows.length) return '<div class="empty">No se encontraron socios</div>';
    return `<div class="table-wrap"><table><thead><tr><th>Socio</th><th class="hide-sm">Plan</th><th>Vence</th><th>Estado</th><th class="hide-sm">Meta del mes</th><th></th></tr></thead><tbody>
      ${rows.map(({ m, s }) => {
        const gp = GymDB.goalProgress(m, month);
        return `<tr class="clickable" data-action="member" data-id="${m.id}">
          <td><div class="row">${avatarMini(m)}<div><strong>${esc(m.name)}</strong><div class="small muted">${esc(m.phone)} · #${m.code}</div></div></div></td>
          <td class="hide-sm">${planName(m.planId)}</td>
          <td class="nowrap">${U.fmtDate(m.endDate)}</td>
          <td>${UI.badge(s)}</td>
          <td class="hide-sm goal-cell">${gp ? `<div class="row"><div class="grow">${UI.progress(gp.pct)}</div><span class="small nowrap">${Math.round(gp.pct * 100)}%</span></div>` : '<span class="small muted">Sin meta</span>'}</td>
          <td class="actions"><a class="icon-btn btn-wa" href="${waReminder(m)}" target="_blank" rel="noopener" data-action="noop" title="Recordatorio por WhatsApp" aria-label="Recordatorio por WhatsApp">${UI.icon('whatsapp', 18)}</a>
            <button class="btn btn-sm" data-action="pay" data-id="${m.id}">Cobrar</button></td>
        </tr>`;
      }).join('')}
    </tbody></table></div>`;
  }

  /* ---------------- Modales ---------------- */
  const modalHead = title => `<div class="modal-head"><h2>${title}</h2><button class="icon-btn" data-action="close" aria-label="Cerrar">${UI.icon('close', 20)}</button></div>`;

  function memberDetail(id) {
    const m = GymDB.member(id); if (!m) return;
    const s = GymDB.status(m), lv = GymDB.level(m), month = U.month(U.today());
    const rep = GymDB.monthlyReport(m, month);
    const gp = rep.goal;
    const pays = GymDB.payments(id).slice(-5).reverse();
    UI.modal(`${modalHead(esc(m.name))}
      <div class="det-head"><div class="av">${Avatar.face(m, lv.level, 92)}</div>
        <div class="grow"><div class="row wrap">${UI.badge(s)}<span class="badge info">Nivel ${lv.level} · ${lv.name}</span></div>
          <div class="small" style="margin-top:8px">${planName(m.planId)} · vence el ${U.fmtDate(m.endDate, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div class="small muted">Cel. ${esc(m.phone)} · Código ${m.code} · ${lv.points} pts</div>
          <button class="btn btn-sm" style="margin-top:8px" data-action="member-photo" data-id="${m.id}">${UI.icon('user', 15)} ${m.photo ? 'Cambiar foto' : 'Subir foto'}</button></div></div>
      <div class="grid g3">
        <div class="mini-stat"><div class="value">${rep.days}</div><div class="label">Días este mes</div></div>
        <div class="mini-stat"><div class="value">${rep.classes}</div><div class="label">Clases</div></div>
        <div class="mini-stat"><div class="value">${rep.logsCount}</div><div class="label">Registros</div></div>
      </div>
      <h3>Meta de ${U.monthName(month)}</h3>
      ${gp ? `<div class="row"><strong class="grow">${esc(GymDB.goalLabel(gp.goal))}</strong><span class="small">${Math.round(gp.pct * 100)}%</span></div>
        ${UI.progress(gp.pct)}
        <div class="small muted" style="margin-top:6px">Inicio ${U.num(gp.goal.start)} kg · Actual ${U.num(gp.current)} kg</div>
        ${Charts.line({ points: gp.series, target: gp.goal.target, height: 170 })}` : '<p class="muted small">El socio aún no ha definido su meta este mes.</p>'}
      <h3>Últimos pagos</h3>
      ${pays.length ? pays.map(p => `<div class="list-item"><div class="grow">${U.fmtDate(p.date, { day: 'numeric', month: 'short', year: 'numeric' })} · ${planName(p.planId)}</div><span class="small muted">${esc(p.method)}</span><strong>${U.money(p.amount)}</strong></div>`).join('') : '<p class="muted small">Sin pagos registrados</p>'}
      <div class="modal-actions">
        <button class="btn btn-danger" data-action="delete-member" data-id="${m.id}">${UI.icon('trash', 16)}</button><span class="spacer"></span>
        <a class="btn btn-wa" href="${waReminder(m)}" target="_blank" rel="noopener">${UI.icon('whatsapp', 16)} WhatsApp</a>
        <button class="btn" data-action="edit-member" data-id="${m.id}">${UI.icon('edit', 16)} Editar</button>
        <button class="btn btn-primary" data-action="pay" data-id="${m.id}">${UI.icon('cash', 16)} Registrar pago</button>
      </div>`);
  }

  function memberForm(id) {
    const m = id ? GymDB.member(id) : null;
    const plans = GymDB.plans();
    const pin = m ? m.pin : String(Math.floor(1000 + Math.random() * 9000));
    UI.modal(`${modalHead(m ? 'Editar socio' : 'Nuevo socio')}
      <form data-form="member" class="stack">
        <input type="hidden" name="id" value="${m ? m.id : ''}">
        <div class="form-grid">
          <div class="field" style="grid-column:1/-1"><label for="mn">Nombre completo</label><input id="mn" name="name" value="${esc(m ? m.name : '')}" required autofocus></div>
          <div class="field"><label for="mp">Celular</label><input id="mp" name="phone" value="${esc(m ? m.phone : '')}" inputmode="numeric" pattern="09\\d{8}" title="10 dígitos, empieza con 09" placeholder="09XXXXXXXX" required></div>
          <div class="field"><label for="mpin">PIN de acceso a la app</label><input id="mpin" name="pin" value="${esc(pin)}" inputmode="numeric" pattern="\\d{4}" title="4 dígitos" required></div>
          <div class="field"><label for="mpl">Plan</label><select id="mpl" name="planId">${plans.map(p => `<option value="${p.id}" ${m && m.planId === p.id ? 'selected' : ''}>${esc(p.name)} · ${U.money(p.price)}</option>`).join('')}</select></div>
          ${m ? `<div class="field"><label for="me">Fecha de vencimiento</label><input id="me" type="date" name="endDate" value="${m.endDate}" required></div>`
              : `<label class="check" style="grid-column:1/-1"><input type="checkbox" name="pay" checked> Registrar el primer pago ahora (efectivo)</label>`}
        </div>
        <div class="modal-actions"><button type="button" class="btn" data-action="close">Cancelar</button><button class="btn btn-primary">Guardar</button></div>
      </form>`);
  }

  function payForm(id) {
    const m = GymDB.member(id); if (!m) return;
    const s = GymDB.status(m);
    UI.modal(`${modalHead('Registrar pago')}
      <p class="muted">${esc(m.name)} · ${s.key === 'vencido' ? 'venció' : 'vence'} el ${U.fmtDate(m.endDate, { day: 'numeric', month: 'long' })} ${UI.badge(s)}</p>
      <form data-form="pay" class="stack">
        <input type="hidden" name="id" value="${m.id}">
        <div class="form-grid">
          <div class="field"><label for="pp">Plan</label><select id="pp" name="planId">${GymDB.plans().map(p => `<option value="${p.id}" ${p.id === m.planId ? 'selected' : ''}>${esc(p.name)} (${p.days} días)</option>`).join('')}</select></div>
          <div class="field"><label for="pa">Monto (USD)</label><input id="pa" name="amount" type="number" step="0.01" min="0" required></div>
          <div class="field"><label for="pm">Método</label><select id="pm" name="method">${METHODS.map(x => `<option>${x}</option>`).join('')}</select></div>
        </div>
        <div class="note" id="pay-preview"></div>
        <div class="modal-actions"><button type="button" class="btn" data-action="close">Cancelar</button><button class="btn btn-primary">${UI.icon('cash', 16)} Confirmar pago</button></div>
      </form>`, root => {
      const sel = root.querySelector('#pp'), amt = root.querySelector('#pa'), prev = root.querySelector('#pay-preview');
      const upd = () => {
        amt.value = GymDB.plan(sel.value).price;
        prev.innerHTML = `Nueva fecha de vencimiento: <strong>${U.fmtDate(GymDB.previewEnd(m.id, sel.value), { day: 'numeric', month: 'long', year: 'numeric' })}</strong>`;
      };
      sel.addEventListener('change', upd); upd();
    });
  }

  function classModal(id) {
    const c = id ? GymDB.cls(id) : null;
    const coaches = GymDB.staff().filter(s => s.active && s.role !== 'Recepción' && s.role !== 'Limpieza');
    let occ = '';
    if (c) {
      const date = GymDB.nextDateFor(c.weekday);
      const bk = GymDB.bookingsFor(c.id, date);
      occ = `<div class="note"><div class="row between"><strong>${U.cap(U.fmtLong(date))} · ${c.time}</strong><span class="small">${bk.length}/${c.capacity} reservas</span></div>
        ${UI.progress(bk.length / c.capacity)}
        <div class="small muted" style="margin-top:8px">${bk.length ? bk.map(b => esc((GymDB.member(b.memberId) || {}).name || '')).join(' · ') : 'Aún no hay reservas'}</div></div>`;
    }
    UI.modal(`${modalHead(c ? esc(c.name) : 'Nueva clase')}
      ${occ}
      <form data-form="class" class="stack mt">
        <input type="hidden" name="id" value="${c ? c.id : ''}">
        <div class="form-grid">
          <div class="field"><label for="cn">Nombre</label><input id="cn" name="name" value="${esc(c ? c.name : '')}" placeholder="Ej. Spinning" required></div>
          <div class="field"><label for="cs">Instructor</label><select id="cs" name="staffId"><option value="">Sin asignar</option>${coaches.map(s => `<option value="${s.id}" ${c && c.staffId === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="cw">Día</label><select id="cw" name="weekday">${[1, 2, 3, 4, 5, 6, 0].map(d => `<option value="${d}" ${c && c.weekday === d ? 'selected' : ''}>${U.DAYS[d]}</option>`).join('')}</select></div>
          <div class="field"><label for="ct">Hora</label><input id="ct" type="time" name="time" value="${c ? c.time : '18:00'}" required></div>
          <div class="field"><label for="cd">Duración (min)</label><input id="cd" type="number" name="duration" min="15" max="240" value="${c ? c.duration : 60}" required></div>
          <div class="field"><label for="cc">Cupos</label><input id="cc" type="number" name="capacity" min="1" max="200" value="${c ? c.capacity : 15}" required></div>
          <div class="field"><label for="ccol">Color</label><input id="ccol" type="color" name="color" value="${c ? c.color : '#ff6b35'}"></div>
        </div>
        <div class="modal-actions">${c ? `<button type="button" class="btn btn-danger" data-action="delete-class" data-id="${c.id}">${UI.icon('trash', 16)} Eliminar</button><span class="spacer"></span>` : ''}
          <button type="button" class="btn" data-action="close">Cancelar</button><button class="btn btn-primary">Guardar</button></div>
      </form>`);
  }

  function staffForm(id) {
    const s = id ? GymDB.staffMember(id) : null;
    UI.modal(`${modalHead(s ? 'Editar personal' : 'Agregar personal')}
      <form data-form="staff" class="stack">
        <input type="hidden" name="id" value="${s ? s.id : ''}">
        <div class="form-grid">
          <div class="field" style="grid-column:1/-1"><label for="sn">Nombre</label><input id="sn" name="name" value="${esc(s ? s.name : '')}" required></div>
          <div class="field"><label for="sr">Cargo</label><select id="sr" name="role">${ROLES.map(r => `<option ${s && s.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
          <div class="field"><label for="ssp">Especialidad</label><input id="ssp" name="specialty" value="${esc(s ? s.specialty : '')}" placeholder="Ej. Pesas, Yoga"></div>
          <div class="field"><label for="sp">Celular</label><input id="sp" name="phone" value="${esc(s ? s.phone : '')}" inputmode="numeric" pattern="09\\d{8}" title="10 dígitos, empieza con 09"></div>
          <label class="check"><input type="checkbox" name="active" ${!s || s.active ? 'checked' : ''}> Activo</label>
        </div>
        <div class="modal-actions">${s ? `<button type="button" class="btn btn-danger" data-action="delete-staff" data-id="${s.id}">${UI.icon('trash', 16)} Eliminar</button><span class="spacer"></span>` : ''}
          <button type="button" class="btn" data-action="close">Cancelar</button><button class="btn btn-primary">Guardar</button></div>
      </form>`);
  }

  function planForm(id) {
    const p = id ? GymDB.plan(id) : null;
    const used = p && GymDB.members().some(m => m.planId === p.id);
    UI.modal(`${modalHead(p ? 'Editar plan' : 'Nuevo plan')}
      <form data-form="plan" class="stack">
        <input type="hidden" name="id" value="${p ? p.id : ''}">
        <div class="form-grid">
          <div class="field"><label for="pn">Nombre</label><input id="pn" name="name" value="${esc(p ? p.name : '')}" placeholder="Ej. Mensual" required></div>
          <div class="field"><label for="ppr">Precio (USD)</label><input id="ppr" type="number" step="0.01" min="0" name="price" value="${p ? p.price : ''}" required></div>
          <div class="field"><label for="pd">Duración (días)</label><input id="pd" type="number" min="1" name="days" value="${p ? p.days : 30}" required></div>
        </div>
        <div class="modal-actions">${p && !used ? `<button type="button" class="btn btn-danger" data-action="delete-plan" data-id="${p.id}">${UI.icon('trash', 16)} Eliminar</button><span class="spacer"></span>` : ''}
          <button type="button" class="btn" data-action="close">Cancelar</button><button class="btn btn-primary">Guardar</button></div>
      </form>`);
  }

  function doCheckin(id) {
    const m = GymDB.member(id);
    const r = GymDB.checkin(id);
    if (!r.ok) { UI.toast(r.error, 'bad'); return; }
    UI.toast(r.warn ? `Entrada registrada: ${m.name} (${r.warn})` : `✓ Entrada registrada: ${m.name}`, r.warn ? 'warn' : 'ok');
    render();
  }

  /* ---------------- Acciones ---------------- */
  const ACTIONS = {
    noop() {},
    close: () => UI.closeModal(),
    logout() { sessionStorage.removeItem(SESSION); render(); },
    filter(d) { state.filter = d.k; render(); },
    member: d => memberDetail(d.id),
    'new-member': () => memberForm(),
    'edit-member': d => memberForm(d.id),
    'delete-member'(d) {
      const m = GymDB.member(d.id);
      if (!confirm(`¿Eliminar a ${m.name}? Se borrarán también sus pagos, reservas y progreso.`)) return;
      GymDB.removeMember(d.id); UI.closeModal(); UI.toast('Socio eliminado'); render();
    },
    pay: d => payForm(d.id),
    class: d => classModal(d.id),
    'new-class': () => classModal(),
    'delete-class'(d) { if (!confirm('¿Eliminar esta clase? Se cancelarán sus reservas futuras.')) return; GymDB.removeClass(d.id); UI.closeModal(); UI.toast('Clase eliminada'); render(); },
    'new-staff': () => staffForm(),
    'edit-staff': d => staffForm(d.id),
    'delete-staff'(d) { if (!confirm('¿Eliminar a esta persona? Sus clases quedarán sin instructor.')) return; GymDB.removeStaff(d.id); UI.closeModal(); UI.toast('Registro eliminado'); render(); },
    'new-plan': () => planForm(),
    'edit-plan': d => planForm(d.id),
    'delete-plan'(d) { GymDB.removePlan(d.id); UI.closeModal(); UI.toast('Plan eliminado'); render(); },
    'checkin-member': d => doCheckin(d.id),
    async 'upload-logo'() {
      try {
        const img = await UI.pickImage({ max: 256, type: 'image/png' });
        if (!img) return;
        if (GymDB.saveSettings({ logo: img })) { UI.toast('Logo actualizado'); render(); }
      } catch (e) { UI.toast(e.message, 'bad'); }
    },
    'remove-logo'() { GymDB.saveSettings({ logo: null }); UI.toast('Logo quitado'); render(); },
    async 'member-photo'(d) {
      try {
        const img = await UI.pickImage({ max: 320, square: true });
        if (!img) return;
        GymDB.saveMember({ id: d.id, photo: img });
        render(); memberDetail(d.id); UI.toast('Foto actualizada');
      } catch (e) { UI.toast(e.message, 'bad'); }
    },
    export() { UI.download(`respaldo-gimnasio-${U.today()}.json`, GymDB.exportJSON()); },
    reset() { if (!confirm('Esto reemplaza todos los datos actuales por los datos de ejemplo. ¿Continuar?')) return; GymDB.reset(); UI.toast('Datos de ejemplo restablecidos'); render(); },
  };

  const FORMS = {
    login(d) {
      if (d.pin === GymDB.settings.adminPin) { sessionStorage.setItem(SESSION, '1'); render(); }
      else UI.toast('PIN incorrecto', 'bad');
    },
    member(d) {
      const phone = d.phone.trim();
      if (GymDB.phoneTaken(phone, d.id)) { UI.toast('Ya existe un socio con ese celular', 'bad'); return; }
      if (d.id) {
        GymDB.saveMember({ id: d.id, name: d.name.trim(), phone, pin: d.pin, planId: d.planId, endDate: d.endDate });
        UI.toast('Socio actualizado');
      } else {
        const today = U.today();
        const id = GymDB.saveMember({ name: d.name.trim(), phone, pin: d.pin, code: GymDB.nextCode(), planId: d.planId, startDate: today, endDate: U.addDays(today, -1), joined: today, goals: {}, avatar: Avatar.random() });
        if (d.pay) GymDB.registerPayment(id, d.planId, GymDB.plan(d.planId).price, 'Efectivo');
        const m = GymDB.member(id);
        UI.toast(`Socio creado · Código ${m.code} · PIN ${m.pin}`);
      }
      UI.closeModal(); render();
    },
    pay(d) {
      const end = GymDB.registerPayment(d.id, d.planId, d.amount, d.method);
      UI.closeModal();
      UI.toast(`Pago registrado · vence el ${U.fmtDate(end, { day: 'numeric', month: 'long' })}`);
      render();
    },
    class(d) {
      GymDB.saveClass({ id: d.id || undefined, name: d.name.trim(), staffId: d.staffId, weekday: +d.weekday, time: d.time, duration: +d.duration, capacity: +d.capacity, color: d.color });
      UI.closeModal(); UI.toast('Clase guardada'); render();
    },
    staff(d) {
      GymDB.saveStaff({ id: d.id || undefined, name: d.name.trim(), role: d.role, specialty: d.specialty.trim(), phone: d.phone.trim(), active: !!d.active });
      UI.closeModal(); UI.toast('Personal guardado'); render();
    },
    plan(d) {
      GymDB.savePlan({ id: d.id || undefined, name: d.name.trim(), price: +d.price, days: +d.days });
      UI.closeModal(); UI.toast('Plan guardado'); render();
    },
    settings(d) { GymDB.saveSettings({ gymName: d.gymName.trim(), adminPin: d.adminPin }); UI.toast('Ajustes guardados'); render(); },
    checkin(d, form) {
      const q = d.q.trim(), ql = q.toLowerCase();
      const out = $('#ck-result');
      let m = GymDB.findByCode(q);
      if (!m) {
        const matches = GymDB.members().filter(x => x.name.toLowerCase().includes(ql) || x.phone === q);
        if (matches.length === 1) m = matches[0];
        else if (matches.length > 1) {
          out.innerHTML = `<div class="mt">${matches.slice(0, 8).map(x => `<div class="list-item">${avatarMini(x)}<div class="grow"><strong>${esc(x.name)}</strong><div class="small muted">#${x.code}</div></div>${UI.badge(GymDB.status(x))}<button class="btn btn-sm btn-primary" data-action="checkin-member" data-id="${x.id}">Registrar</button></div>`).join('')}</div>`;
          return;
        } else { out.innerHTML = ''; UI.toast('No se encontró el socio', 'bad'); return; }
      }
      form.reset();
      doCheckin(m.id);
    },
  };

  /* ---------------- Eventos ---------------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
    if (el.dataset.action === 'noop') { e.stopPropagation(); return; }
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
