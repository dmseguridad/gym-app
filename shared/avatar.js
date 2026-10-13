/* Avatar 2D por capas. Evoluciona con el nivel del socio:
   más hombros/brazos, aura dorada desde nivel 4 y accesorios que se desbloquean. */
window.Avatar = (function () {
  const OPTIONS = {
    skin: ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e'],
    hair: ['corto', 'largo', 'moño', 'rizado', 'rapado', 'cresta'],
    hairColor: ['#1a1a1a', '#3b2314', '#6b4423', '#a0662f', '#d9a441', '#b03a2e'],
    shirt: ['#ff6b35', '#4cc9f0', '#c77dff', '#3ddc97', '#f7c548', '#ff70a6', '#3a4150'],
    accessory: ['ninguno', 'lentes', 'banda', 'gorra', 'audifonos', 'medalla', 'corona'],
  };
  const UNLOCK = { ninguno: 1, lentes: 1, banda: 2, gorra: 2, audifonos: 3, medalla: 4, corona: 6 };
  const LABELS = {
    hair: { corto: 'Corto', largo: 'Largo', 'moño': 'Moño', rizado: 'Rizado', rapado: 'Rapado', cresta: 'Cresta' },
    accessory: { ninguno: 'Ninguno', lentes: 'Lentes', banda: 'Banda', gorra: 'Gorra', audifonos: 'Audífonos', medalla: 'Medalla', corona: 'Corona' },
  };
  const LEVEL_BG = ['#262b36', '#1d3557', '#3c2a5c', '#5a2626', '#5a4716', '#145a43'];
  const DEFAULT = { skin: '#f1c27d', hair: 'corto', hairColor: '#3b2314', shirt: '#ff6b35', accessory: 'ninguno' };

  function hairFront(style, c) {
    switch (style) {
      case 'largo': return `<path d="M66 88 Q60 44 100 44 Q140 44 134 88 Q124 58 94 60 Q76 64 66 88Z" fill="${c}"/>`;
      case 'moño': return `<circle cx="100" cy="40" r="15" fill="${c}"/><path d="M66 84 Q64 46 100 46 Q136 46 134 84 Q126 62 100 61 Q74 62 66 84Z" fill="${c}"/>`;
      case 'rizado': return [64, 76, 88, 100, 112, 124, 136].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 50 : 58}" r="${i === 0 || i === 6 ? 11 : 14}" fill="${c}"/>`).join('');
      case 'rapado': return `<path d="M66 82 Q64 48 100 48 Q136 48 134 82 Q126 62 100 61 Q74 62 66 82Z" fill="${c}" fill-opacity=".45"/>`;
      case 'cresta': return `<path d="M66 82 Q64 48 100 48 Q136 48 134 82 Q126 62 100 61 Q74 62 66 82Z" fill="${c}" fill-opacity=".4"/><path d="M90 62 Q94 30 100 24 Q106 30 110 62Z" fill="${c}"/>`;
      default: return `<path d="M66 84 Q63 44 100 44 Q137 44 134 84 Q127 62 100 60 Q73 62 66 84Z" fill="${c}"/>`;
    }
  }

  function accessory(kind) {
    switch (kind) {
      case 'lentes': return `<g fill="none" stroke="#111" stroke-width="3"><circle cx="87" cy="88" r="9"/><circle cx="113" cy="88" r="9"/><path d="M96 88h8M78 86l-11-3M122 86l11-3"/></g>`;
      case 'banda': return `<rect x="65" y="64" width="70" height="10" rx="5" fill="#ffffff"/><rect x="65" y="67.5" width="70" height="3" fill="#ff6b35"/>`;
      case 'gorra': return `<path d="M64 78 Q64 42 100 42 Q136 42 136 78Z" fill="#1f2430"/><path d="M118 72 Q150 70 160 80 Q140 84 120 80Z" fill="#11141b"/><circle cx="100" cy="44" r="3" fill="#ff6b35"/>`;
      case 'audifonos': return `<path d="M62 90 Q60 36 100 36 Q140 36 138 90" fill="none" stroke="#1f2430" stroke-width="7"/><rect x="54" y="78" width="14" height="24" rx="6" fill="#ff6b35"/><rect x="132" y="78" width="14" height="24" rx="6" fill="#ff6b35"/>`;
      case 'medalla': return `<path d="M90 134 L100 160 L110 134" stroke="#c0392b" stroke-width="6" fill="none"/><circle cx="100" cy="168" r="10" fill="#f5c542" stroke="#b7950b" stroke-width="2.5"/><text x="100" y="172" text-anchor="middle" font-size="11" font-weight="800" fill="#7a5c00">1</text>`;
      case 'corona': return `<path d="M70 54 L76 28 L89 44 L100 22 L111 44 L124 28 L130 54Z" fill="#f5c542" stroke="#b7950b" stroke-width="2.5" stroke-linejoin="round"/><circle cx="100" cy="40" r="3.5" fill="#e74c3c"/>`;
      default: return '';
    }
  }

  function svg(a, level = 1, size = 160) {
    a = { ...DEFAULT, ...(a || {}) };
    level = Math.max(1, Math.min(6, level || 1));
    const m = 1 + (level - 1) * 0.08;
    const sw = 48 * m, armR = 14 * m, cx = 100;
    const acc = level >= (UNLOCK[a.accessory] || 99) ? a.accessory : 'ninguno';
    let s = `<svg viewBox="0 0 200 220" width="${size}" height="${Math.round(size * 1.1)}" role="img" aria-label="Avatar nivel ${level}" xmlns="http://www.w3.org/2000/svg">`;
    s += `<rect width="200" height="220" rx="30" fill="${LEVEL_BG[level - 1]}"/>`;
    if (level >= 4) s += `<circle cx="100" cy="112" r="86" fill="none" stroke="#f5c542" stroke-opacity=".35" stroke-width="6"/><circle cx="100" cy="112" r="94" fill="none" stroke="#f5c542" stroke-opacity=".15" stroke-width="4"/>`;
    if (a.hair === 'largo') s += `<path d="M60 88 Q56 40 100 40 Q144 40 140 88 L146 150 Q100 162 54 150Z" fill="${a.hairColor}"/>`;
    // brazos
    s += `<ellipse cx="${cx - sw + 4}" cy="192" rx="${armR}" ry="38" fill="${a.skin}"/><ellipse cx="${cx + sw - 4}" cy="192" rx="${armR}" ry="38" fill="${a.skin}"/>`;
    // torso
    s += `<path d="M${cx - sw + 14} 222 L${cx - sw + 8} 162 Q${cx - sw + 2} 138 ${cx - sw + 24} 134 L${cx + sw - 24} 134 Q${cx + sw - 2} 138 ${cx + sw - 8} 162 L${cx + sw - 14} 222Z" fill="${a.shirt}"/>`;
    s += `<ellipse cx="${cx - sw + 8}" cy="158" rx="${armR + 4}" ry="20" fill="${a.shirt}"/><ellipse cx="${cx + sw - 8}" cy="158" rx="${armR + 4}" ry="20" fill="${a.shirt}"/>`;
    if (level >= 3) s += `<path d="M${cx - 24} 168 Q${cx - 12} 178 ${cx} 168 Q${cx + 12} 178 ${cx + 24} 168" stroke="rgba(0,0,0,.18)" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    if (level >= 5) s += `<path d="M${cx} 180 V212 M${cx - 12} 192 h24 M${cx - 12} 204 h24" stroke="rgba(0,0,0,.14)" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    // cuello y cabeza
    s += `<rect x="89" y="110" width="22" height="30" rx="9" fill="${a.skin}"/><path d="M89 132 L100 146 L111 132Z" fill="${a.skin}"/>`;
    s += `<rect x="89" y="118" width="22" height="6" fill="rgba(0,0,0,.08)"/>`;
    s += `<circle cx="66" cy="90" r="8" fill="${a.skin}"/><circle cx="134" cy="90" r="8" fill="${a.skin}"/>`;
    s += `<ellipse cx="100" cy="86" rx="34" ry="38" fill="${a.skin}"/>`;
    s += hairFront(a.hair, a.hairColor);
    // cara
    s += `<path d="M80 78 Q87 74 94 78M106 78 Q113 74 120 78" stroke="${a.hairColor}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    s += `<circle cx="87" cy="89" r="3.8" fill="#1b1b1b"/><circle cx="113" cy="89" r="3.8" fill="#1b1b1b"/><circle cx="88.3" cy="87.7" r="1.2" fill="#fff"/><circle cx="114.3" cy="87.7" r="1.2" fill="#fff"/>`;
    s += `<circle cx="79" cy="100" r="5" fill="#ff7b7b" fill-opacity=".25"/><circle cx="121" cy="100" r="5" fill="#ff7b7b" fill-opacity=".25"/>`;
    s += `<path d="M89 103 Q100 ${level >= 3 ? 114 : 110} 111 103" stroke="#7a2e1f" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    s += accessory(acc);
    // insignia de nivel
    s += `<circle cx="172" cy="28" r="17" fill="#ff6b35" stroke="#fff" stroke-opacity=".9" stroke-width="2"/><text x="172" y="33.5" text-anchor="middle" font-size="16" font-weight="800" fill="#fff" font-family="system-ui,sans-serif">${level}</text>`;
    return s + '</svg>';
  }

  function random() {
    const p = arr => arr[Math.floor(Math.random() * arr.length)];
    return { skin: p(OPTIONS.skin), hair: p(OPTIONS.hair), hairColor: p(OPTIONS.hairColor), shirt: p(OPTIONS.shirt), accessory: 'ninguno' };
  }

  // Foto del socio si la subió; si no, su avatar
  function face(m, level, size) {
    if (m && m.photo) return `<img class="photo" src="${m.photo}" alt="" style="width:${size}px;height:${size}px;object-fit:cover;display:block">`;
    return svg(m && m.avatar, level, size);
  }

  return { OPTIONS, UNLOCK, LABELS, svg, face, random };
})();
