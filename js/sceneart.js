// Cartoon scene illustrations for the Basic 850 section: hand-drawn SVG
// backgrounds plus emoji "actors" that idle-animate. Actors linked to a word
// are tappable and can be put in focus (pop + ring + label). Everything is
// drawn in a 400x250 viewBox and scales to its container.
const SceneArt = (() => {
  let uid = 0;

  const esc = (s) => Util.escapeHtml(String(s));

  const BACKGROUNDS = {
    bedroom: () => `
      <rect width="400" height="250" fill="#FFE8C7"/>
      <g fill="#FFD9A8">${dots(18, 20, 380, 180, 40)}</g>
      <rect y="196" width="400" height="54" fill="#E2A86E"/>
      <rect y="192" width="400" height="6" fill="#C98A55"/>
      <ellipse cx="210" cy="232" rx="120" ry="14" fill="#F7A1B5" opacity=".7"/>
      <rect x="168" y="38" width="44" height="46" rx="6" fill="#fff" stroke="#E8B47C" stroke-width="4"/>`,
    bathroom: () => `
      <rect width="400" height="250" fill="#D6F0FA"/>
      <g stroke="#BFE3F2" stroke-width="2">${grid(0, 0, 400, 200, 25)}</g>
      <rect y="200" width="400" height="50" fill="#F1F4F8"/>
      <rect x="140" y="22" width="76" height="96" rx="14" fill="#EAF8FF" stroke="#fff" stroke-width="6"/>
      <path d="M150 40 l18 -10 M152 54 l30 -18" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
    clothesline: () => `
      <rect width="400" height="250" fill="#EDE7FF"/>
      <rect y="202" width="400" height="48" fill="#D9C6F2"/>
      <rect y="198" width="400" height="5" fill="#BCA4E3"/>
      <path d="M10 60 Q200 82 390 60" stroke="#8B6FC9" stroke-width="3" fill="none"/>
      <circle cx="10" cy="60" r="5" fill="#8B6FC9"/><circle cx="390" cy="60" r="5" fill="#8B6FC9"/>
      <rect x="330" y="100" width="44" height="6" rx="3" fill="#B08968"/>`,
    kitchen: () => `
      <rect width="400" height="250" fill="#FFF4C2"/>
      <g fill="#FFE58A">${checker(0, 104, 400, 40, 20)}</g>
      <rect x="232" y="93" width="156" height="8" rx="3" fill="#B07A4F"/>
      <rect y="214" width="400" height="36" fill="#E9C9A0"/>`,
    street: (id) => `
      <defs><linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD3FF"/><stop offset="1" stop-color="#E3F6FF"/></linearGradient></defs>
      <rect width="400" height="250" fill="url(#sky${id})"/>
      <g class="anim-drift">${cloud(150, 40, 1)}${cloud(240, 28, .7)}</g>
      <rect x="200" y="90" width="38" height="80" rx="4" fill="#FFC6D3"/><rect x="236" y="70" width="30" height="100" rx="4" fill="#C8B6FF"/>
      <path d="M0 150 Q40 132 80 150 Q120 168 160 150" fill="#8FD0FF" opacity=".6"/>
      <rect y="168" width="400" height="22" fill="#EADFCC"/>
      <rect y="190" width="400" height="60" fill="#8C8F99"/>
      <g fill="#fff">${[0, 1, 2, 3, 4].map((i) => `<rect x="${158 + i * 18}" y="196" width="10" height="48" rx="2"/>`).join("")}</g>`,
    classroom: () => `
      <rect width="400" height="250" fill="#E6F7E9"/>
      <rect y="200" width="400" height="50" fill="#D8B48A"/>
      <rect x="40" y="220" width="240" height="10" rx="4" fill="#A86F45"/>`,
    park: (id) => `
      <defs><linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CCBFF"/><stop offset="1" stop-color="#DDF4FF"/></linearGradient></defs>
      <rect width="400" height="250" fill="url(#sky${id})"/>
      <circle cx="372" cy="28" r="18" fill="#FFD84D"/>
      <g class="anim-drift">${cloud(200, 34, .9)}</g>
      <ellipse cx="90" cy="230" rx="220" ry="90" fill="#7ED36F"/>
      <ellipse cx="330" cy="236" rx="200" ry="80" fill="#93DE7F"/>
      <path d="M150 250 Q200 200 300 190 Q360 186 400 176 L400 196 Q350 206 300 212 Q230 222 196 250 Z" fill="#F3DFA8"/>`,
    body: (id) => `
      <defs><linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE3EC"/><stop offset="1" stop-color="#FFF3D6"/></linearGradient></defs>
      <rect width="400" height="250" fill="url(#bg${id})"/>
      <g stroke="#FFD0B0" stroke-width="14" stroke-linecap="round">
        <path d="M172 126 L122 146"/><path d="M228 126 L280 134"/>
      </g>
      <rect x="178" y="170" width="18" height="60" rx="8" fill="#3A5BA0"/><rect x="204" y="170" width="18" height="60" rx="8" fill="#3A5BA0"/>
      <rect x="166" y="108" width="68" height="72" rx="20" fill="#6EA8FF"/>
      <circle cx="200" cy="66" r="44" fill="#FFD6B0"/>
      <path d="M156 60 Q160 14 200 18 Q242 14 246 58 Q232 34 200 36 Q170 34 156 60 Z" fill="#6B4226"/>
      <circle cx="176" cy="84" r="7" fill="#FFB0B0" opacity=".7"/><circle cx="224" cy="84" r="7" fill="#FFB0B0" opacity=".7"/>`,
    farm: (id) => `
      <defs><linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ED8FF"/><stop offset="1" stop-color="#E8F7FF"/></linearGradient></defs>
      <rect width="400" height="250" fill="url(#sky${id})"/>
      <g class="anim-drift">${cloud(220, 30, .8)}</g>
      <rect y="118" width="400" height="132" fill="#8BD46B"/>
      <path d="M40 150 L40 82 L90 46 L140 82 L140 150 Z" fill="#D9473E"/>
      <path d="M36 84 L90 42 L144 84" stroke="#fff" stroke-width="6" fill="none" stroke-linejoin="round"/>
      <rect x="72" y="110" width="36" height="40" fill="#fff"/><path d="M72 110 L108 150 M108 110 L72 150" stroke="#D9473E" stroke-width="4"/>
      <g fill="#C08A56">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<rect x="${170 + i * 24}" y="160" width="6" height="34" rx="2"/>`).join("")}<rect x="166" y="168" width="234" height="5"/><rect x="166" y="182" width="234" height="5"/></g>`,
    weather: (id) => `
      <defs><linearGradient id="sky${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B9C7DA"/><stop offset=".55" stop-color="#D7E6F7"/><stop offset="1" stop-color="#EAF4FF"/></linearGradient></defs>
      <rect width="400" height="250" fill="url(#sky${id})"/>
      <rect y="206" width="400" height="44" fill="#9AD58A"/>
      <path d="M290 206 Q330 196 400 202 L400 250 L290 250 Z" fill="#fff"/>
      <ellipse cx="196" cy="236" rx="44" ry="9" fill="#7FB8F0"/>
      <g stroke="#5A8FD6" stroke-width="3" stroke-linecap="round">${[0, 1, 2, 3, 4].map((i) => `<line class="anim-fall" style="animation-delay:-${i * 0.23}s" x1="${138 + i * 10}" y1="80" x2="${134 + i * 10}" y2="92"/>`).join("")}</g>
      <g fill="#fff">${[0, 1, 2, 3].map((i) => `<circle class="anim-snowfall" style="animation-delay:-${i * 0.6}s" cx="${320 + i * 14}" cy="84" r="3"/>`).join("")}</g>`,
  };

  function dots(n, x0, x1, y1, step) {
    let s = "";
    for (let y = 20; y < y1; y += step) for (let x = x0; x < x1; x += step) s += `<circle cx="${x + ((y / step) % 2) * step / 2}" cy="${y}" r="3"/>`;
    return s;
  }
  function grid(x0, y0, w, h, step) {
    let s = "";
    for (let x = x0; x <= w; x += step) s += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${h}"/>`;
    for (let y = y0; y <= h; y += step) s += `<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`;
    return s;
  }
  function checker(x0, y0, w, h, step) {
    let s = "";
    for (let y = y0; y < y0 + h; y += step) for (let x = x0; x < w; x += step) if (((x + y) / step) % 2 === 0) s += `<rect x="${x}" y="${y}" width="${step}" height="${step}"/>`;
    return s;
  }
  function cloud(x, y, k) {
    return `<g transform="translate(${x} ${y}) scale(${k})" fill="#fff"><circle cx="0" cy="8" r="14"/><circle cx="16" cy="0" r="18"/><circle cx="34" cy="8" r="14"/><rect x="0" y="8" width="34" height="14"/></g>`;
  }

  // Drawn props for things without a good emoji. Centered on (0,0), sized by s.
  const ICONS = {
    curtain: (s) => `
      <rect x="${-s / 2}" y="${-s * 0.46}" width="${s}" height="5" rx="2" fill="#B07A4F"/>
      <path d="M${-s / 2} ${-s * 0.43} L${-s * 0.26} ${-s * 0.43} Q${-s * 0.36} ${-s * 0.05} ${-s * 0.28} ${s * 0.42} L${-s / 2} ${s * 0.42} Z" fill="#FF8FB1"/>
      <path d="M${s / 2} ${-s * 0.43} L${s * 0.26} ${-s * 0.43} Q${s * 0.36} ${-s * 0.05} ${s * 0.28} ${s * 0.42} L${s / 2} ${s * 0.42} Z" fill="#FF8FB1"/>
      <path d="M${-s * 0.44} ${-s * 0.4} L${-s * 0.44} ${s * 0.4} M${s * 0.44} ${-s * 0.4} L${s * 0.44} ${s * 0.4}" stroke="#FFC2D4" stroke-width="4"/>`,
    board: (s) => `
      <rect x="${-s / 2}" y="${-s * 0.25}" width="${s}" height="${s * 0.5}" rx="6" fill="#2E6B4F" stroke="#A86F45" stroke-width="7"/>
      <rect x="${-s * 0.46}" y="${s * 0.25}" width="${s * 0.92}" height="6" rx="2" fill="#A86F45"/>
      <path d="M${-s * 0.4} ${-s * 0.1} q12 -14 24 0 t24 0" stroke="#EAF7EE" stroke-width="3" fill="none" opacity=".8"/>
      <text x="${s * 0.18}" y="${s * 0.02}" font-size="${s * 0.12}" fill="#EAF7EE" font-family="sans-serif" font-weight="700">ABC</text>`,
    chalk: (s) => `<g transform="rotate(-18)"><rect x="${-s * 0.32}" y="${-s * 0.09}" width="${s * 0.64}" height="${s * 0.18}" rx="${s * 0.06}" fill="#fff" stroke="#D5D5D5" stroke-width="1.5"/></g>`,
    table: (s) => `
      <rect x="${-s / 2}" y="-22" width="${s}" height="14" rx="5" fill="#C98A55"/>
      <rect x="${-s / 2 + 14}" y="-8" width="12" height="52" rx="3" fill="#A86F45"/>
      <rect x="${s / 2 - 26}" y="-8" width="12" height="52" rx="3" fill="#A86F45"/>`,
    spot: (s) => `<circle r="${s / 2}" fill="transparent"/>`,
  };

  function contentFor(pic, size) {
    if (pic.startsWith("@")) return (ICONS[pic.slice(1)] || ICONS.spot)(size);
    return `<text font-size="${size}" text-anchor="middle" dominant-baseline="central">${esc(pic)}</text>`;
  }

  function hitRadius(a) {
    if (a.pic === "@board") return a.size * 0.36;
    if (a.pic === "@table") return a.size * 0.2;
    return a.size * 0.55;
  }

  function actorSvg(a, words, interactive) {
    const w = a.word && words[a.word];
    const r = hitRadius(a);
    const label = w ? w.en : "";
    const lw = label.length * 9 + 22;
    const ly = a.pic === "@table" ? -46 : -r - 18;
    return `
      <g class="actor${w ? " has-word" : ""}" ${w ? `data-w="${esc(a.word)}"` : ""} ${w && interactive ? `role="button" tabindex="0" aria-label="${esc(w.en)}"` : ""} transform="translate(${a.x} ${a.y})">
        ${w ? `<circle class="focus-ring" r="${r + 4}"/>` : ""}
        <g class="actor-pop"><g class="${a.anim ? `anim-${a.anim}` : ""}">${contentFor(a.pic, a.size)}</g></g>
        ${w ? `<circle class="hit" r="${r}"/>` : ""}
        ${w ? `<g class="focus-label" transform="translate(0 ${ly})"><rect x="${-lw / 2}" y="-13" width="${lw}" height="26" rx="13"/><text text-anchor="middle" dominant-baseline="central">${esc(label)}</text></g>` : ""}
      </g>`;
  }

  // scene: {theme, actors}; words: map id -> word
  function render(scene, words, { className = "", interactive = true } = {}) {
    const id = `${scene.id}-${++uid}`;
    const bg = (BACKGROUNDS[scene.theme] || BACKGROUNDS.bedroom)(id);
    return `<svg class="scene-svg ${className}" viewBox="0 0 400 250" role="img" aria-label="${esc(scene.title_en)}">${bg}${scene.actors.map((a) => actorSvg(a, words, interactive)).join("")}</svg>`;
  }

  // Small standalone picture for a word (used on cards and quizzes).
  function wordPic(w, size = 96) {
    if (w.pic.startsWith("@")) {
      return `<svg class="word-pic-svg" viewBox="-60 -60 120 120" width="${size}" height="${size}">${contentFor(w.pic, w.pic === "@table" || w.pic === "@board" ? 110 : 90)}</svg>`;
    }
    return `<span class="word-pic-emoji" style="font-size:${size * 0.8}px">${esc(w.pic)}</span>`;
  }

  function focus(svg, wordId, { label = true } = {}) {
    svg.querySelectorAll(".actor.focus").forEach((g) => g.classList.remove("focus", "no-label"));
    if (!wordId) return;
    const g = svg.querySelector(`.actor[data-w="${CSS.escape(wordId)}"]`);
    if (!g) return;
    g.classList.add("focus");
    g.classList.toggle("no-label", !label);
    g.parentNode.appendChild(g); // draw on top
  }

  return { render, wordPic, focus };
})();
