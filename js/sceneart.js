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
    livingroom: () => `
      <rect width="400" height="250" fill="#FFEFD9"/>
      <g fill="#FFE2BD">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<rect x="${i * 40 + 10}" y="0" width="20" height="186"/>`).join("")}</g>
      <rect y="184" width="400" height="8" fill="#D9A877"/>
      <rect y="192" width="400" height="58" fill="#E3B27A"/>
      <g stroke="#CF9A63" stroke-width="2"><line x1="0" y1="212" x2="400" y2="212"/><line x1="0" y1="232" x2="400" y2="232"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="${i * 56 + 20}" y1="192" x2="${i * 56 + 20}" y2="212"/><line x1="${i * 56 + 48}" y1="212" x2="${i * 56 + 48}" y2="232"/><line x1="${i * 56 + 20}" y1="232" x2="${i * 56 + 20}" y2="250"/>`).join("")}</g>
      <ellipse cx="200" cy="226" rx="140" ry="17" fill="#9ACD9B" opacity=".75"/>
      <ellipse cx="200" cy="226" rx="104" ry="11" fill="#B5DDB5" opacity=".8"/>`,
    sea: (id) => `
      <defs>
        <linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CCBFF"/><stop offset="1" stop-color="#DDF4FF"/></linearGradient>
        <linearGradient id="sea${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FA7E8"/><stop offset="1" stop-color="#8ADCF5"/></linearGradient>
      </defs>
      <rect width="400" height="250" fill="url(#sky${id})"/>
      <circle cx="46" cy="34" r="20" fill="#FFD84D"/>
      <g class="anim-drift">${cloud(220, 30, .9)}${cloud(320, 50, .6)}</g>
      <rect y="92" width="400" height="108" fill="url(#sea${id})"/>
      <g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"><path d="M20 120 q12 -8 24 0 t24 0"/><path d="M180 108 q12 -8 24 0 t24 0"/><path d="M290 140 q12 -8 24 0 t24 0"/><path d="M90 166 q12 -8 24 0 t24 0"/></g>
      <path d="M0 196 Q100 176 200 190 Q300 204 400 184 L400 250 L0 250 Z" fill="#F6E2A8"/>
      <path d="M0 196 Q100 176 200 190 Q300 204 400 184" stroke="#fff" stroke-width="5" fill="none" opacity=".8"/>`,
    workshop: () => `
      <rect width="400" height="250" fill="#F3E3C3"/>
      <rect x="14" y="14" width="372" height="118" rx="8" fill="#E2C28D" stroke="#C9A365" stroke-width="4"/>
      <g fill="#B98F55">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => [0, 1, 2, 3, 4].map((j) => `<circle cx="${34 + i * 21.5}" cy="${34 + j * 22}" r="2.2"/>`).join("")).join("")}</g>
      <rect y="186" width="400" height="14" fill="#B07A4F"/>
      <rect y="200" width="400" height="50" fill="#8C5A35"/>
      <g stroke="#7A4C2B" stroke-width="2"><line x1="100" y1="200" x2="100" y2="250"/><line x1="300" y1="200" x2="300" y2="250"/></g>`,
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
    // --- home and kitchen ---
    room: (s) => `
      <rect x="${-s * .42}" y="${-s * .4}" width="${s * .84}" height="${s * .62}" rx="4" fill="#BFE3FF"/>
      <path d="M${-s * .42} ${s * .22} L${s * .42} ${s * .22} L${s * .5} ${s * .4} L${-s * .5} ${s * .4} Z" fill="#E3B27A"/>
      <rect x="${-s * .3}" y="${-s * .28}" width="${s * .22}" height="${s * .24}" rx="3" fill="#fff" stroke="#8FB8DA" stroke-width="2.5"/>
      <rect x="${s * .12}" y="${-s * .16}" width="${s * .22}" height="${s * .38}" rx="3" fill="#B07A4F"/>
      <circle cx="${s * .29}" cy="${s * .04}" r="${s * .02}" fill="#FFD84D"/>`,
    floor: (s) => `
      <path d="M${-s * .34} ${-s * .2} L${s * .34} ${-s * .2} L${s * .5} ${s * .24} L${-s * .5} ${s * .24} Z" fill="#D9A066" stroke="#B9824B" stroke-width="2.5"/>
      <g stroke="#B9824B" stroke-width="2"><line x1="${-s * .12}" y1="${-s * .2}" x2="${-s * .17}" y2="${s * .24}"/><line x1="${s * .12}" y1="${-s * .2}" x2="${s * .17}" y2="${s * .24}"/><line x1="${-s * .42}" y1="${s * .02}" x2="${s * .42}" y2="${s * .02}"/></g>`,
    roof: (s) => `
      <rect x="${s * .2}" y="${-s * .38}" width="${s * .13}" height="${s * .3}" fill="#B9533E"/>
      <path d="M${-s * .5} ${s * .16} L0 ${-s * .38} L${s * .5} ${s * .16} Z" fill="#E5484D" stroke="#B9533E" stroke-width="3" stroke-linejoin="round"/>
      <path d="M${-s * .3} ${s * .0} L${s * .3} ${s * .0} M${-s * .16} ${-s * .16} L${s * .16} ${-s * .16}" stroke="#B9533E" stroke-width="2.5"/>
      <rect x="${-s * .4}" y="${s * .16}" width="${s * .8}" height="${s * .12}" fill="#F4E4C8"/>`,
    cushion: (s) => `
      <path d="M${-s * .4} ${-s * .3} Q0 ${-s * .42} ${s * .4} ${-s * .3} Q${s * .3} 0 ${s * .4} ${s * .3} Q0 ${s * .42} ${-s * .4} ${s * .3} Q${-s * .3} 0 ${-s * .4} ${-s * .3} Z" fill="#FF8FB1" stroke="#E56F96" stroke-width="3" stroke-linejoin="round"/>
      <circle r="${s * .05}" fill="#E56F96"/>
      <circle cx="${-s * .36}" cy="${-s * .26}" r="${s * .05}" fill="#FFD84D"/><circle cx="${s * .36}" cy="${-s * .26}" r="${s * .05}" fill="#FFD84D"/><circle cx="${-s * .36}" cy="${s * .26}" r="${s * .05}" fill="#FFD84D"/><circle cx="${s * .36}" cy="${s * .26}" r="${s * .05}" fill="#FFD84D"/>`,
    oven: (s) => `
      <rect x="${-s * .44}" y="${-s * .46}" width="${s * .88}" height="${s * .92}" rx="${s * .07}" fill="#E8EBF0" stroke="#B9C0CC" stroke-width="3"/>
      <rect x="${-s * .44}" y="${-s * .46}" width="${s * .88}" height="${s * .16}" rx="${s * .05}" fill="#C7CDD8"/>
      <circle cx="${-s * .26}" cy="${-s * .38}" r="${s * .035}" fill="#7B8496"/><circle cx="0" cy="${-s * .38}" r="${s * .035}" fill="#7B8496"/><circle cx="${s * .26}" cy="${-s * .38}" r="${s * .035}" fill="#7B8496"/>
      <rect x="${-s * .34}" y="${-s * .16}" width="${s * .68}" height="${s * .46}" rx="${s * .05}" fill="#3C4350"/>
      <rect x="${-s * .29}" y="${-s * .1}" width="${s * .58}" height="${s * .34}" rx="${s * .04}" fill="#FFB547" opacity=".9"/>
      <rect x="${-s * .26}" y="${-s * .2}" width="${s * .52}" height="${s * .04}" rx="2" fill="#8C95A6"/>`,
    tray: (s) => `
      <rect x="${-s * .46}" y="${-s * .2}" width="${s * .92}" height="${s * .4}" rx="${s * .08}" fill="#B9763F"/>
      <rect x="${-s * .39}" y="${-s * .14}" width="${s * .78}" height="${s * .26}" rx="${s * .05}" fill="#F0C28A"/>
      <rect x="${-s * .39}" y="${s * .07}" width="${s * .78}" height="${s * .05}" fill="#D9A066"/>
      <rect x="${-s * .24}" y="${-s * .28}" width="${s * .48}" height="${s * .06}" rx="${s * .03}" fill="#8A5A34"/>`,
    sugar: (s) => `
      <path d="M${-s * .34} ${-s * .04} L${-s * .27} ${s * .3} Q0 ${s * .4} ${s * .27} ${s * .3} L${s * .34} ${-s * .04} Z" fill="#fff" stroke="#BCC6D6" stroke-width="3"/>
      <g fill="#fff" stroke="#BCC6D6" stroke-width="2.5" stroke-linejoin="round"><rect x="${-s * .24}" y="${-s * .2}" width="${s * .2}" height="${s * .2}" rx="3"/><rect x="${s * .02}" y="${-s * .22}" width="${s * .2}" height="${s * .2}" rx="3"/><rect x="${-s * .12}" y="${-s * .4}" width="${s * .2}" height="${s * .2}" rx="3"/></g>`,
    jelly: (s) => `
      <ellipse cy="${s * .26}" rx="${s * .46}" ry="${s * .1}" fill="#fff" stroke="#D5D5E8" stroke-width="2.5"/>
      <path d="M${-s * .34} ${s * .24} Q${-s * .36} ${-s * .26} 0 ${-s * .26} Q${s * .36} ${-s * .26} ${s * .34} ${s * .24} Z" fill="#B66DFF" stroke="#8F47D9" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="${-s * .14}" cy="${-s * .1}" rx="${s * .06}" ry="${s * .1}" fill="#fff" opacity=".55" transform="rotate(20 ${-s * .14} ${-s * .1})"/>
      <circle cy="${-s * .32}" r="${s * .06}" fill="#E5484D"/>`,
    smoke: (s) => `
      <g fill="#C9CED8" stroke="#A9B0BE" stroke-width="2"><circle cx="${-s * .06}" cy="${s * .3}" r="${s * .15}"/><circle cx="${s * .1}" cy="${s * .08}" r="${s * .19}"/><circle cx="${-s * .08}" cy="${-s * .14}" r="${s * .15}"/><circle cx="${s * .08}" cy="${-s * .34}" r="${s * .11}"/></g>`,
    match: (s) => `
      <rect x="${-s * .04}" y="${-s * .06}" width="${s * .08}" height="${s * .5}" rx="${s * .03}" fill="#C98A55"/>
      <circle cy="${-s * .08}" r="${s * .09}" fill="#E5484D"/>
      <path d="M0 ${-s * .48} Q${s * .17} ${-s * .3} ${s * .02} ${-s * .14} Q${-s * .16} ${-s * .3} 0 ${-s * .48} Z" fill="#FF9F1C"/>
      <path d="M0 ${-s * .34} Q${s * .07} ${-s * .26} 0 ${-s * .18} Q${-s * .07} ${-s * .26} 0 ${-s * .34} Z" fill="#FFE066"/>`,
    // --- garden and animals ---
    soil: (s) => `
      <rect x="${-s / 2}" y="${-s * .11}" width="${s}" height="${s * .22}" rx="10" fill="#9B6B43"/>
      <g fill="#B98456">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle cx="${-s * .45 + i * s * .13}" cy="${-s * (i % 2 ? .03 : .06)}" r="3"/>`).join("")}</g>`,
    pond: (s) => `
      <ellipse rx="${s / 2}" ry="${s * .2}" fill="#5CB8F5" stroke="#A9DDFB" stroke-width="4"/>
      <ellipse cx="${s * .1}" cy="${s * .02}" rx="${s * .2}" ry="${s * .07}" fill="none" stroke="#fff" stroke-width="2.5" opacity=".7"/>`,
    seed: (s) => `
      <g fill="#7B4A2D" stroke="#5A3420" stroke-width="2"><path d="M${-s * .2} ${-s * .26} Q${-s * .02} ${-s * .12} ${-s * .2} ${s * .06} Q${-s * .36} ${-s * .12} ${-s * .2} ${-s * .26} Z"/><path d="M${s * .22} ${-s * .1} Q${s * .4} ${s * .06} ${s * .22} ${s * .24} Q${s * .06} ${s * .06} ${s * .22} ${-s * .1} Z"/><path d="M${-s * .12} ${s * .14} Q${s * .04} ${s * .26} ${-s * .12} ${s * .4} Q${-s * .26} ${s * .26} ${-s * .12} ${s * .14} Z"/></g>
      <g fill="#fff" opacity=".4"><ellipse cx="${-s * .24}" cy="${-s * .16}" rx="${s * .02}" ry="${s * .05}"/><ellipse cx="${s * .18}" cy="${s * .02}" rx="${s * .02}" ry="${s * .05}"/></g>`,
    root: (s) => `
      <path d="M0 ${-s * .42} L0 ${-s * .3}" stroke="#4DAF50" stroke-width="${s * .07}" stroke-linecap="round"/>
      <path d="M0 ${-s * .3} L0 ${s * .12} M0 ${-s * .12} L${-s * .24} ${s * .18} M0 ${-s * .04} L${s * .22} ${s * .24} M0 ${s * .12} L0 ${s * .44} M${-s * .24} ${s * .18} L${-s * .32} ${s * .36} M${s * .22} ${s * .24} L${s * .3} ${s * .4}" stroke="#B07A4F" stroke-width="${s * .06}" stroke-linecap="round" fill="none"/>`,
    stem: (s) => `
      <path d="M0 ${s * .44} Q${s * .06} ${s * .1} 0 ${-s * .24}" stroke="#4DAF50" stroke-width="${s * .08}" stroke-linecap="round" fill="none"/>
      <ellipse cx="${-s * .14}" cy="${s * .14}" rx="${s * .13}" ry="${s * .06}" fill="#6CC96F" transform="rotate(-30 ${-s * .14} ${s * .14})"/>
      <ellipse cx="${s * .16}" cy="${s * .02}" rx="${s * .13}" ry="${s * .06}" fill="#6CC96F" transform="rotate(30 ${s * .16} ${s * .02})"/>
      <g fill="#FF8FB1"><circle cx="0" cy="${-s * .42}" r="${s * .08}"/><circle cx="${-s * .1}" cy="${-s * .33}" r="${s * .08}"/><circle cx="${s * .1}" cy="${-s * .33}" r="${s * .08}"/></g><circle cy="${-s * .33}" r="${s * .06}" fill="#FFD84D"/>`,
    branch: (s) => `
      <path d="M${-s * .46} ${s * .32} Q${-s * .04} ${s * .14} ${s * .46} ${-s * .24}" stroke="#9B6B43" stroke-width="${s * .07}" stroke-linecap="round" fill="none"/>
      <path d="M${-s * .12} ${s * .2} L${-s * .02} ${-s * .08} M${s * .16} ${-s * .0} L${s * .26} ${s * .22}" stroke="#9B6B43" stroke-width="${s * .045}" stroke-linecap="round"/>
      <g fill="#6CC96F" stroke="#4DAF50" stroke-width="2"><ellipse cx="${-s * .02}" cy="${-s * .16}" rx="${s * .09}" ry="${s * .05}" transform="rotate(-70 ${-s * .02} ${-s * .16})"/><ellipse cx="${s * .28}" cy="${s * .28}" rx="${s * .09}" ry="${s * .05}" transform="rotate(70 ${s * .28} ${s * .28})"/><ellipse cx="${s * .4}" cy="${-s * .32}" rx="${s * .09}" ry="${s * .05}" transform="rotate(-40 ${s * .4} ${-s * .32})"/></g>`,
    spade: (s) => `
      <rect x="${-s * .03}" y="${-s * .44}" width="${s * .06}" height="${s * .46}" rx="3" fill="#B07A4F"/>
      <rect x="${-s * .13}" y="${-s * .48}" width="${s * .26}" height="${s * .06}" rx="3" fill="#B07A4F"/>
      <path d="M${-s * .15} ${-s * .02} L${s * .15} ${-s * .02} L${s * .13} ${s * .26} Q0 ${s * .5} ${-s * .13} ${s * .26} Z" fill="#AEB8C8" stroke="#6C7587" stroke-width="3" stroke-linejoin="round"/>`,
    wing: (s) => `
      <path d="M${-s * .4} ${s * .3} C${-s * .52} ${-s * .1} ${-s * .2} ${-s * .42} ${s * .22} ${-s * .42} C${s * .44} ${-s * .42} ${s * .5} ${-s * .3} ${s * .4} ${-s * .2} C${s * .5} ${-s * .1} ${s * .4} ${s * .02} ${s * .26} ${s * .02} C${s * .32} ${s * .1} ${s * .2} ${s * .2} ${s * .08} ${s * .2} C${s * .1} ${s * .28} ${-s * .1} ${s * .34} ${-s * .4} ${s * .3} Z" fill="#fff" stroke="#B9C6DC" stroke-width="3" stroke-linejoin="round"/>
      <path d="M${-s * .3} ${s * .2} Q${-s * .2} ${-s * .1} ${s * .1} ${-s * .3} M${-s * .1} ${s * .2} Q${s * .0} ${s * .0} ${s * .24} ${-s * .12}" stroke="#B9C6DC" stroke-width="2.5" fill="none"/>`,
    tail: (s) => `
      <path d="M${-s * .4} ${-s * .34} C${s * .3} ${-s * .4} ${s * .36} ${s * .08} ${-s * .06} ${s * .2}" stroke="#C98A55" stroke-width="${s * .08}" stroke-linecap="round" fill="none"/>
      <path d="M${-s * .06} ${s * .12} C${s * .08} ${s * .16} ${s * .08} ${s * .36} ${-s * .08} ${s * .46} C${-s * .24} ${s * .36} ${-s * .2} ${s * .16} ${-s * .06} ${s * .12} Z" fill="#5A3A22"/>`,
    // --- little kid silhouette with one body part marked (body words that have no emoji) ---
    arm: (s) => bodyMark(s, "arm"),
    neck: (s) => bodyMark(s, "neck"),
    chin: (s) => bodyMark(s, "chin"),
    chest: (s) => bodyMark(s, "chest"),
    knee: (s) => bodyMark(s, "knee"),
    toe: (s) => bodyMark(s, "toe"),
    stomach: (s) => bodyMark(s, "stomach"),
    throat: (s) => bodyMark(s, "throat"),
    nerve: (s) => bodyMark(s, "nerve"),
    // --- colors: a splash of paint ---
    red: (s) => paint(s, "#E5484D"),
    yellow: (s) => paint(s, "#FFD21F"),
    white: (s) => paint(s, "#FFFFFF"),
    black: (s) => paint(s, "#2B2D3A"),
    brown: (s) => paint(s, "#8B5A2B"),
    grey: (s) => paint(s, "#9AA0AB"),
    green: (s) => paint(s, "#3DBE5C"),
    blue: (s) => paint(s, "#3B82F6"),
    // --- shapes and sizes ---
    line: (s) => `
      <line x1="${-s * .4}" y1="${s * .3}" x2="${s * .4}" y2="${-s * .3}" stroke="#4C6EF5" stroke-width="${s * .07}" stroke-linecap="round"/>
      <circle cx="${-s * .4}" cy="${s * .3}" r="${s * .06}" fill="#E5484D"/><circle cx="${s * .4}" cy="${-s * .3}" r="${s * .06}" fill="#E5484D"/>`,
    angle: (s) => `
      <path d="M${s * .4} ${s * .3} L${-s * .3} ${s * .3} L${s * .25} ${-s * .35}" stroke="#4C6EF5" stroke-width="${s * .07}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M0 ${s * .3} A${s * .3} ${s * .3} 0 0 0 ${-s * .106} ${s * .071}" stroke="#FF9F1C" stroke-width="${s * .05}" stroke-linecap="round" fill="none"/>`,
    curve: (s) => `<path d="M${-s * .42} ${s * .2} C${-s * .2} ${-s * .44} ${s * .1} ${s * .44} ${s * .42} ${-s * .2}" stroke="#B66DFF" stroke-width="${s * .07}" stroke-linecap="round" fill="none"/>`,
    long: (s) => pencil(s, .7),
    short: (s) => pencil(s, .16),
    narrow: (s) => gap(s, .14),
    wide: (s) => gap(s, .62),
    thick: (s) => slab(s, .46),
    thin: (s) => slab(s, .12),
    elastic: (s) => `
      <g fill="none" stroke-width="${s * .06}"><ellipse rx="${s * .4}" ry="${s * .18}" transform="rotate(-22)" stroke="#FF5C5C"/><ellipse rx="${s * .4}" ry="${s * .18}" transform="rotate(24)" stroke="#FF9F43"/></g>`,
    cube: (s) => `
      <path d="M0 ${-s * .38} L${s * .34} ${-s * .19} L0 0 L${-s * .34} ${-s * .19} Z" fill="#9CCBFF" stroke="#2F6FD6" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M${-s * .34} ${-s * .19} L0 0 L0 ${s * .38} L${-s * .34} ${s * .19} Z" fill="#4C9AFF" stroke="#2F6FD6" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M${s * .34} ${-s * .19} L0 0 L0 ${s * .38} L${s * .34} ${s * .19} Z" fill="#2F6FD6" stroke="#2F6FD6" stroke-width="2.5" stroke-linejoin="round"/>`,
    equal: (s) => `
      <circle r="${s * .42}" fill="#7C5CFF"/>
      <rect x="${-s * .22}" y="${-s * .14}" width="${s * .44}" height="${s * .09}" rx="${s * .04}" fill="#fff"/><rect x="${-s * .22}" y="${s * .05}" width="${s * .44}" height="${s * .09}" rx="${s * .04}" fill="#fff"/>`,
    now: (s) => `
      <path d="M${-s * .12} ${s * .26} L${-s * .22} ${s * .44} L${s * .06} ${s * .26} Z" fill="#FF7A45"/>
      <rect x="${-s * .48}" y="${-s * .26}" width="${s * .96}" height="${s * .54}" rx="${s * .2}" fill="#FF7A45"/>
      <text y="${s * .01}" font-size="${s * .28}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="sans-serif" font-weight="800">NOW!</text>`,
    spot: (s) => `<circle r="${s / 2}" fill="transparent"/>`,
  };

  // Helpers behind the drawn icons above.
  function paint(s, c) {
    return `<g fill="${c}" stroke="rgba(0,0,0,.2)" stroke-width="2.5"><circle r="${s * .34}"/><circle cx="${s * .3}" cy="${-s * .22}" r="${s * .12}"/><circle cx="${-s * .3}" cy="${s * .26}" r="${s * .1}"/><circle cx="${-s * .1}" cy="${-s * .38}" r="${s * .07}"/></g><circle cx="${-s * .1}" cy="${-s * .1}" r="${s * .07}" fill="#fff" opacity=".45"/>`;
  }
  function pencil(s, len) {
    const L = s * len, h = s * .14;
    return `<g transform="rotate(-30)">
      <rect x="${-L / 2 - s * .07}" y="${-h / 2}" width="${s * .07}" height="${h}" rx="3" fill="#F77F8E"/>
      <rect x="${-L / 2}" y="${-h / 2}" width="${L}" height="${h}" fill="#FFC53D"/>
      <path d="M${L / 2} ${-h / 2} L${L / 2 + s * .14} 0 L${L / 2} ${h / 2} Z" fill="#F2D3A5"/>
      <path d="M${L / 2 + s * .09} ${-h * .18} L${L / 2 + s * .14} 0 L${L / 2 + s * .09} ${h * .18} Z" fill="#333"/></g>`;
  }
  function gap(s, g) {
    const w = s * .5 - s * g / 2;
    return `<rect x="${-s * .5}" y="${-s * .36}" width="${w}" height="${s * .72}" rx="5" fill="#B9A58A" stroke="#8F7B60" stroke-width="2.5"/>
      <rect x="${s * g / 2}" y="${-s * .36}" width="${w}" height="${s * .72}" rx="5" fill="#B9A58A" stroke="#8F7B60" stroke-width="2.5"/>
      <path d="M${-s * g / 2 + 2} 0 L${s * g / 2 - 2} 0" stroke="#E5484D" stroke-width="3" stroke-linecap="round"/>`;
  }
  function slab(s, t) {
    const h = s * t, c = Math.max(s * .035, 3);
    return `<rect x="${-s * .42}" y="${-h / 2}" width="${s * .84}" height="${h}" rx="${s * .03}" fill="#fff" stroke="#C9B79C" stroke-width="2.5"/>
      <rect x="${-s * .42}" y="${-h / 2}" width="${s * .84}" height="${c}" fill="#4C6EF5"/><rect x="${-s * .42}" y="${h / 2 - c}" width="${s * .84}" height="${c}" fill="#4C6EF5"/>
      ${t > .3 ? [1, 2, 3, 4].map((i) => `<line x1="${-s * .4}" y1="${-h / 2 + (h * i) / 5}" x2="${s * .4}" y2="${-h / 2 + (h * i) / 5}" stroke="#E4D8C4" stroke-width="2"/>`).join("") : ""}`;
  }
  // A little kid with one body part marked in pink.
  function bodyMark(s, part) {
    const k = s / 100, hl = "#FF5C8A";
    const marks = {
      neck: `<ellipse cx="0" cy="-18" rx="8" ry="4.5" fill="${hl}"/>`,
      chin: `<path d="M-9 -26 Q0 -17 9 -26" stroke="${hl}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
      chest: `<rect x="-11" y="-12" width="22" height="14" rx="6" fill="${hl}"/>`,
      stomach: `<ellipse cx="0" cy="10" rx="9" ry="7" fill="${hl}"/>`,
      arm: `<path d="M12 -11 L27 10" stroke="${hl}" stroke-width="8" stroke-linecap="round"/>`,
      knee: `<circle cx="-6" cy="33" r="5.5" fill="${hl}"/><circle cx="6" cy="33" r="5.5" fill="${hl}"/>`,
      toe: `<ellipse cx="-8" cy="50" rx="7" ry="3.5" fill="${hl}"/><ellipse cx="8" cy="50" rx="7" ry="3.5" fill="${hl}"/>`,
      throat: `<rect x="-3.5" y="-22" width="7" height="12" rx="3.5" fill="${hl}"/>`,
      nerve: `<path d="M0 -42 L-4 -28 L3 -17 L-3 -6 L4 8 L-4 22 L3 36 L-2 48" stroke="#FFC400" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"/>`,
    };
    return `<g transform="scale(${k})">
      <g fill="#FFD6B0" stroke="#FFD6B0"><circle cx="0" cy="-34" r="14"/><rect x="-5" y="-22" width="10" height="8" stroke="none"/><rect x="-12" y="-16" width="24" height="38" rx="9" stroke="none"/><path d="M-12 -11 L-27 10 M12 -11 L27 10" stroke-width="7" stroke-linecap="round" fill="none"/><rect x="-12" y="20" width="10" height="30" rx="4" stroke="none"/><rect x="2" y="20" width="10" height="30" rx="4" stroke="none"/></g>
      ${marks[part]}</g>`;
  }

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
