// ============================================================
// Interactive teaching widgets. mountWidget(name, el) renders
// a self-contained simulator into el.
// ============================================================

const APERTURES = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
const SHUTTERS = [
  { t: 1/2000, label: '1/2000' }, { t: 1/1000, label: '1/1000' }, { t: 1/500, label: '1/500' },
  { t: 1/250, label: '1/250' }, { t: 1/125, label: '1/125' }, { t: 1/60, label: '1/60' },
  { t: 1/30, label: '1/30' }, { t: 1/15, label: '1/15' }, { t: 1/8, label: '1/8' },
  { t: 1/4, label: '1/4' }, { t: 0.5, label: '0.5s' }, { t: 1, label: '1s' },
];
const ISOS = [100, 200, 400, 800, 1600, 3200, 6400, 12800];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };

function widgetShell(container, title, sub, bodyHtml) {
  const w = el(`
    <div class="widget">
      <div class="widget-head">
        <span class="mono">${title}</span>
        <span class="mono" style="color:var(--paper-faint)">${sub}</span>
      </div>
      <div class="widget-body">${bodyHtml}</div>
    </div>`);
  container.appendChild(w);
  return w;
}

/* ============================================================
   1. EXPOSURE TRIANGLE SIMULATOR
   ============================================================ */
function mountExposure(container) {
  const w = widgetShell(container, 'Lab · Exposure Simulator', 'balance the triangle', `
    <div class="preset-row" data-scenes>
      <button class="chip on" data-scene="sunny">☀ Sunny day</button>
      <button class="chip" data-scene="overcast">☁ Overcast</button>
      <button class="chip" data-scene="indoor">⌂ Indoors</button>
      <button class="chip" data-scene="night">☾ Night street</button>
    </div>
    <div class="widget-canvas" style="margin-top:1rem">
      <svg viewBox="0 0 700 340" role="img" aria-label="Exposure simulator scene">
        <defs>
          <linearGradient id="ex-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#7db4d8"/><stop offset="1" stop-color="#d9e6ce"/>
          </linearGradient>
          <linearGradient id="ex-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#8aa15f"/><stop offset="1" stop-color="#5d7042"/>
          </linearGradient>
          <filter id="ex-bgblur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur data-bgblur stdDeviation="0"/>
          </filter>
          <filter id="ex-motion" x="-60%" y="-20%" width="220%" height="140%">
            <feGaussianBlur data-motion stdDeviation="0,0"/>
          </filter>
          <filter id="ex-noisef"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" result="n"/>
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.9  0 0 0 0 0.9  0 0 0 0 0.85  0 0 0 0.9 0"/>
          </filter>
        </defs>
        <g data-photo>
          <rect width="700" height="230" fill="url(#ex-sky)"/>
          <circle cx="580" cy="60" r="26" fill="#fff3c9" opacity=".95"/>
          <g filter="url(#ex-bgblur)">
            <path d="M0 230 L90 130 L170 200 L260 110 L360 215 L430 150 L520 225 L610 140 L700 210 L700 230 Z" fill="#4c6a57"/>
            <path d="M0 230 L60 180 L140 228 L230 170 L330 230 L420 185 L540 230 L620 190 L700 226 L700 230 Z" fill="#3a5344"/>
            <g fill="#2f4636">
              <path d="M120 230 l14 -44 l14 44 z"/><path d="M150 230 l12 -34 l12 34 z"/>
              <path d="M560 230 l15 -48 l15 48 z"/><path d="M596 230 l11 -32 l11 32 z"/>
            </g>
          </g>
          <rect y="228" width="700" height="112" fill="url(#ex-ground)"/>
          <g data-rider filter="url(#ex-motion)">
            <g fill="#23231f">
              <circle cx="0" cy="296" r="16" fill="none" stroke="#23231f" stroke-width="4"/>
              <circle cx="46" cy="296" r="16" fill="none" stroke="#23231f" stroke-width="4"/>
              <path d="M0 296 L20 268 L46 296 M20 268 L34 268" stroke="#23231f" stroke-width="4" fill="none"/>
              <path d="M14 268 C 18 250, 34 246, 40 258 L34 268 Z"/>
              <circle cx="42" cy="242" r="9"/>
              <path d="M40 252 L30 270 L22 266" stroke="#23231f" stroke-width="5" fill="none" stroke-linecap="round"/>
            </g>
          </g>
        </g>
        <rect data-noise width="700" height="340" filter="url(#ex-noisef)" opacity="0" style="mix-blend-mode:overlay"/>
      </svg>
    </div>
    <div class="meter">
      <div class="meter-scale" data-meter>
        <div class="tick" style="left:16.66%"></div><div class="tick" style="left:33.33%"></div>
        <div class="tick mid" style="left:50%"></div>
        <div class="tick" style="left:66.66%"></div><div class="tick" style="left:83.33%"></div>
        <div class="meter-needle" data-needle style="left:50%"></div>
      </div>
      <span class="meter-label" data-verdict>metering…</span>
    </div>
    <div class="ctl-grid">
      <div class="ctl"><label>Aperture</label><input type="range" data-ap min="0" max="${APERTURES.length-1}" value="5" step="1"><output data-ap-out>f/8</output></div>
      <div class="ctl"><label>Shutter</label><input type="range" data-sh min="0" max="${SHUTTERS.length-1}" value="2" step="1"><output data-sh-out>1/500</output></div>
      <div class="ctl"><label>ISO</label><input type="range" data-iso min="0" max="${ISOS.length-1}" value="0" step="1"><output data-iso-out>ISO 100</output></div>
    </div>
    <div class="exif-strip" data-exif></div>
    <p class="widget-hint">Watch three things: overall brightness, the background blur (aperture), the cyclist's motion blur (shutter), and the grain (ISO). Center the meter for a correct exposure — then notice how many different correct combinations exist.</p>
  `);

  const SCENES = { sunny: 3, overcast: 0, indoor: -6, night: -10 };
  const SCENE_LOOK = {
    sunny:   { sky: ['#7db4d8', '#d9e6ce'], sun: .95 },
    overcast:{ sky: ['#9aa5ab', '#c9cec7'], sun: .15 },
    indoor:  { sky: ['#6e6257', '#8a7a66'], sun: 0 },
    night:   { sky: ['#1d2742', '#3a3f5c'], sun: 0 },
  };
  let scene = 'sunny';

  const $ = (s) => w.querySelector(s);
  const ap = $('[data-ap]'), sh = $('[data-sh]'), iso = $('[data-iso]');

  // rider pedals back and forth
  const rider = $('[data-rider]');
  let x = 80, dir = 1, raf;
  (function ride() {
    x += dir * 1.6;
    if (x > 620) { dir = -1; } if (x < 40) { dir = 1; }
    rider.setAttribute('transform', `translate(${x},0) scale(${dir},1) ${dir < 0 ? 'translate(-46,0)' : ''}`);
    raf = requestAnimationFrame(ride);
  })();
  // stop animating when detached
  const obs = new MutationObserver(() => { if (!document.contains(w)) { cancelAnimationFrame(raf); obs.disconnect(); } });
  obs.observe(document.body, { childList: true, subtree: true });

  function render() {
    const N = APERTURES[+ap.value];
    const S = SHUTTERS[+sh.value];
    const I = ISOS[+iso.value];
    const stops = Math.log2(I / 100) + Math.log2(S.t * 125) - 2 * Math.log2(N / 5.6) + SCENES[scene];

    const bright = Math.pow(2, clamp(stops, -4.2, 4.2) * 0.55);
    $('[data-photo]').style.filter = `brightness(${bright.toFixed(3)}) contrast(${(1 - Math.abs(clamp(stops,-4,4)) * 0.04).toFixed(3)})`;

    $('[data-bgblur]').setAttribute('stdDeviation', Math.max(0, 15 / (N / 1.4) - 0.9).toFixed(2));
    $('[data-motion]').setAttribute('stdDeviation', `${clamp(S.t * 260, 0.1, 46).toFixed(1)},0`);
    $('[data-noise]').setAttribute('opacity', (Math.log2(I / 100) / 7 * 0.5).toFixed(3));

    // scene look
    const look = SCENE_LOOK[scene];
    const stopsEls = w.querySelectorAll('#ex-sky stop');
    stopsEls[0].setAttribute('stop-color', look.sky[0]);
    stopsEls[1].setAttribute('stop-color', look.sky[1]);
    w.querySelector('circle[cx="580"]').setAttribute('opacity', look.sun);

    $('[data-ap-out]').textContent = `f/${N}`;
    $('[data-sh-out]').textContent = S.label;
    $('[data-iso-out]').textContent = `ISO ${I}`;

    const needle = $('[data-needle]');
    needle.style.left = `${((clamp(stops, -3, 3) + 3) / 6 * 100).toFixed(1)}%`;
    const verdict = $('[data-verdict]');
    if (Math.abs(stops) < 0.34) {
      verdict.textContent = '● correct exposure'; verdict.classList.add('good');
      needle.style.background = 'var(--green)';
    } else {
      verdict.classList.remove('good');
      needle.style.background = Math.abs(stops) > 3 ? 'var(--red)' : 'var(--amber)';
      verdict.textContent = `${stops > 0 ? '+' : '−'}${Math.abs(stops).toFixed(1)} EV ${stops > 0 ? 'over' : 'under'}`;
    }

    $('[data-exif]').innerHTML =
      `<span><b>f/${N}</b> aperture</span><span><b>${S.label}</b> shutter</span><span><b>ISO ${I}</b></span>` +
      `<span>DoF <b>${N <= 2 ? 'paper thin' : N <= 4 ? 'shallow' : N <= 8 ? 'moderate' : 'deep'}</b></span>` +
      `<span>motion <b>${S.t <= 1/500 ? 'frozen' : S.t <= 1/60 ? 'mostly sharp' : 'blurred'}</b></span>`;
  }

  [ap, sh, iso].forEach(r => r.addEventListener('input', render));
  w.querySelectorAll('[data-scene]').forEach(btn => btn.addEventListener('click', () => {
    scene = btn.dataset.scene;
    w.querySelectorAll('[data-scene]').forEach(b => b.classList.toggle('on', b === btn));
    render();
  }));
  render();
}

/* ============================================================
   2. DEPTH OF FIELD VISUALIZER (top-down)
   ============================================================ */
function mountDof(container) {
  const w = widgetShell(container, 'Lab · Depth of Field', 'top-down view', `
    <div class="widget-canvas">
      <svg viewBox="0 0 700 240" role="img" aria-label="Depth of field diagram">
        <rect width="700" height="240" fill="#161410"/>
        <g data-scale-ticks font-family="IBM Plex Mono, monospace" font-size="10" fill="#7d7462"></g>
        <line x1="60" y1="200" x2="680" y2="200" stroke="#352f24" stroke-width="1"/>
        <rect data-zone x="0" y="40" height="150" fill="rgba(127,166,80,.18)" stroke="rgba(127,166,80,.7)" stroke-dasharray="4 3"/>
        <g transform="translate(28,96)">
          <rect x="-14" y="-4" width="34" height="46" rx="3" fill="#242019" stroke="#e8a33d"/>
          <rect x="20" y="8" width="18" height="22" rx="2" fill="#242019" stroke="#e8a33d"/>
          <text x="-12" y="62" font-family="IBM Plex Mono, monospace" font-size="10" fill="#e8a33d">CAMERA</text>
        </g>
        <g data-subject>
          <circle cx="0" cy="86" r="9" fill="#ece5d8"/>
          <path d="M0 95 L0 130 M0 105 L-13 118 M0 105 L13 118 M0 130 L-10 152 M0 130 L10 152" stroke="#ece5d8" stroke-width="4" fill="none" stroke-linecap="round"/>
          <text x="-24" y="172" font-family="IBM Plex Mono, monospace" font-size="10" fill="#ece5d8">SUBJECT</text>
        </g>
        <g data-tree>
          <path d="M0 150 l16 -52 l16 52 z M6 118 l10 -34 l10 34 z" fill="#4c6a57"/>
          <rect x="12" y="150" width="8" height="16" fill="#5d4a33"/>
          <text x="-6" y="182" font-family="IBM Plex Mono, monospace" font-size="10" fill="#7d7462">TREE 10m</text>
        </g>
        <text data-readout x="350" y="26" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" fill="#e8a33d"></text>
      </svg>
    </div>
    <div class="ctl-grid">
      <div class="ctl"><label>Aperture</label><input type="range" data-ap min="0" max="${APERTURES.length-1}" value="2" step="1"><output data-ap-out></output></div>
      <div class="ctl"><label>Focal length</label><input type="range" data-fl min="24" max="200" value="50" step="1"><output data-fl-out></output></div>
      <div class="ctl"><label>Subject dist.</label><input type="range" data-d min="1" max="9" value="3" step="0.5"><output data-d-out></output></div>
    </div>
    <p class="widget-hint" data-hint></p>
  `);

  const $ = (s) => w.querySelector(s);
  const PX0 = 60, PXM = 62;   // x = PX0 + meters * PXM  (0–10m across)
  const mToX = (m) => PX0 + m * PXM;

  const ticks = $('[data-scale-ticks]');
  for (let m = 0; m <= 10; m += 2) {
    ticks.innerHTML += `<text x="${mToX(m) - 6}" y="218">${m}m</text><line x1="${mToX(m)}" y1="196" x2="${mToX(m)}" y2="204" stroke="#7d7462"/>`;
  }
  $('[data-tree]').setAttribute('transform', `translate(${mToX(10) - 16}, 24)`);

  function render() {
    const N = APERTURES[+$('[data-ap]').value];
    const f = +$('[data-fl]').value;          // mm
    const s = +$('[data-d]').value;           // m
    const c = 0.03;                            // CoC, full frame, mm
    const H = (f * f) / (N * c) / 1000;       // hyperfocal, m
    const near = (H * s) / (H + s);
    const far = s < H ? (H * s) / (H - s) : Infinity;

    $('[data-subject]').setAttribute('transform', `translate(${mToX(s)}, 24)`);
    const zone = $('[data-zone]');
    const x1 = mToX(near);
    const x2 = far === Infinity ? 700 : Math.min(700, mToX(far));
    zone.setAttribute('x', x1);
    zone.setAttribute('width', Math.max(2, x2 - x1));

    const total = far === Infinity ? '∞' : `${(far - near).toFixed(2)}m`;
    $('[data-readout]').textContent =
      `f/${N} · ${f}mm · subject ${s}m → sharp from ${near.toFixed(2)}m to ${far === Infinity ? '∞' : far.toFixed(2) + 'm'} (DoF ${total})`;
    $('[data-ap-out]').textContent = `f/${N}`;
    $('[data-fl-out]').textContent = `${f}mm`;
    $('[data-d-out]').textContent = `${s}m`;

    const treeSharp = far === Infinity || far >= 10;
    $('[data-hint]').textContent = treeSharp
      ? 'The tree at 10m falls INSIDE the focus zone — background sharp. Notice how a wide aperture, longer lens, or closer subject shrinks the green zone.'
      : `The tree at 10m is OUTSIDE the zone — it will blur. Depth of field here is ${total}. Open wider, zoom longer, or step closer and watch it shrink further.`;
  }
  w.querySelectorAll('input').forEach(r => r.addEventListener('input', render));
  render();
}

/* ============================================================
   3. HISTOGRAM TRAINER
   ============================================================ */
function mountHistogram(container) {
  const w = widgetShell(container, 'Lab · Histogram Trainer', 'read the graph', `
    <div class="preset-row">
      <button class="chip on" data-h-scene="average">Average scene</button>
      <button class="chip" data-h-scene="snow">Snow / bright</button>
      <button class="chip" data-h-scene="night">Night scene</button>
      <button class="chip" data-h-scene="backlit">Backlit / contrasty</button>
    </div>
    <div class="widget-canvas" style="margin-top:1rem">
      <svg viewBox="0 0 700 240" role="img" aria-label="Histogram">
        <rect width="700" height="240" fill="#0b0a08"/>
        <g stroke="#352f24"><line x1="175" y1="0" x2="175" y2="212"/><line x1="350" y1="0" x2="350" y2="212"/><line x1="525" y1="0" x2="525" y2="212"/></g>
        <path data-curve fill="rgba(232,163,61,.75)" stroke="#f6c268" stroke-width="1.5"/>
        <rect data-clip-l x="0" y="0" width="7" height="212" fill="#cf4a2e" opacity="0"/>
        <rect data-clip-r x="693" y="0" width="7" height="212" fill="#cf4a2e" opacity="0"/>
        <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#7d7462">
          <text x="10" y="230">◀ BLACKS</text><text x="255" y="230">MIDTONES</text><text x="612" y="230">WHITES ▶</text>
        </g>
      </svg>
    </div>
    <div class="ctl-grid">
      <div class="ctl"><label>Exposure</label><input type="range" data-ev min="-30" max="30" value="0" step="1"><output data-ev-out>0.0 EV</output></div>
    </div>
    <div class="meter"><div style="flex:1"></div><span class="meter-label" data-h-verdict></span></div>
    <p class="widget-hint">Drag exposure and watch data slide toward the walls. Red bars mean clipping — detail lost forever. Note that each scene has a DIFFERENT healthy shape: there is no single "correct" histogram.</p>
  `);

  const SCENES = {
    average: [[0.45, 0.16, 1]],
    snow:    [[0.78, 0.10, 1]],
    night:   [[0.16, 0.10, 1], [0.75, 0.03, 0.25]],
    backlit: [[0.2, 0.08, 0.9], [0.82, 0.07, 0.8]],
  };
  let scene = 'average';
  const $ = (s) => w.querySelector(s);

  function render() {
    const ev = +$('[data-ev]').value / 10;      // -3..+3
    $('[data-ev-out]').textContent = `${ev >= 0 ? '+' : ''}${ev.toFixed(1)} EV`;
    const BINS = 128;
    const vals = new Array(BINS).fill(0);
    let clipL = 0, clipR = 0, total = 0;
    for (const [mean, sd, amp] of SCENES[scene]) {
      const m = mean + ev * 0.16;
      for (let i = -40; i < BINS + 40; i++) {
        const xx = i / BINS;
        const v = amp * Math.exp(-((xx - m) ** 2) / (2 * sd * sd));
        total += v;
        if (i < 0) clipL += v;
        else if (i >= BINS) clipR += v;
        else vals[i] += v;
      }
    }
    vals[0] += clipL; vals[BINS - 1] += clipR;
    const max = Math.max(...vals) || 1;
    let d = `M0 212 `;
    for (let i = 0; i < BINS; i++) d += `L${(i / (BINS - 1)) * 700} ${212 - (vals[i] / max) * 195} `;
    d += `L700 212 Z`;
    $('[data-curve]').setAttribute('d', d);
    $('[data-clip-l]').setAttribute('opacity', clipL / total > 0.01 ? 0.9 : 0);
    $('[data-clip-r]').setAttribute('opacity', clipR / total > 0.01 ? 0.9 : 0);

    const verdict = $('[data-h-verdict]');
    if (clipR / total > 0.02) { verdict.textContent = '▲ highlights clipping!'; verdict.style.color = 'var(--red)'; }
    else if (clipL / total > 0.02) { verdict.textContent = '▼ shadows blocking up'; verdict.style.color = 'var(--red)'; }
    else { verdict.textContent = '● data safe — detail preserved'; verdict.style.color = 'var(--green)'; }
  }

  $('[data-ev]').addEventListener('input', render);
  w.querySelectorAll('[data-h-scene]').forEach(btn => btn.addEventListener('click', () => {
    scene = btn.dataset.hScene;
    w.querySelectorAll('[data-h-scene]').forEach(b => b.classList.toggle('on', b === btn));
    render();
  }));
  render();
}

/* ============================================================
   4. COMPOSITION TRAINER (drag the boat)
   ============================================================ */
function mountComposition(container) {
  const w = widgetShell(container, 'Lab · Composition Trainer', 'drag the boat · move the horizon', `
    <div class="widget-canvas">
      <svg data-svg viewBox="0 0 700 400" role="img" aria-label="Composition trainer" style="touch-action:none">
        <defs>
          <linearGradient id="cp-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#e8b46a"/><stop offset="1" stop-color="#e8dcc0"/>
          </linearGradient>
          <linearGradient id="cp-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#5a7a86"/><stop offset="1" stop-color="#33505c"/>
          </linearGradient>
        </defs>
        <g data-world>
          <rect data-sky width="700" height="240" fill="url(#cp-sky)"/>
          <circle data-sun cx="140" cy="140" r="30" fill="#fff0cd" opacity=".9"/>
          <rect data-sea y="240" width="700" height="160" fill="url(#cp-sea)"/>
          <line data-horizon x1="0" y1="240" x2="700" y2="240" stroke="#2b4450" stroke-width="2"/>
        </g>
        <g data-boat style="cursor:grab">
          <path d="M-34 12 L34 12 L22 26 L-22 26 Z" fill="#2a2622"/>
          <path d="M0 12 L0 -34 M0 -34 C 16 -22, 16 -8, 2 -2" stroke="#2a2622" stroke-width="3" fill="#c46a3a"/>
          <path d="M0 -34 C -14 -20, -14 -6, -2 -2" fill="#ece5d8"/>
        </g>
        <g data-grid stroke="rgba(236,229,216,.55)" stroke-width="1" stroke-dasharray="5 4">
          <line x1="233" y1="0" x2="233" y2="400"/><line x1="467" y1="0" x2="467" y2="400"/>
          <line x1="0" y1="133" x2="700" y2="133"/><line x1="0" y1="267" x2="700" y2="267"/>
          <g fill="rgba(232,163,61,.9)" stroke="none">
            <circle cx="233" cy="133" r="4"/><circle cx="467" cy="133" r="4"/>
            <circle cx="233" cy="267" r="4"/><circle cx="467" cy="267" r="4"/>
          </g>
        </g>
      </svg>
    </div>
    <div class="ctl-grid">
      <div class="ctl"><label>Horizon</label><input type="range" data-hz min="80" max="330" value="240" step="1"><output data-hz-out></output></div>
      <div class="ctl"><label>Thirds grid</label>
        <div class="preset-row" style="margin:0"><button class="chip on" data-grid-toggle>Grid on</button></div>
        <output></output>
      </div>
    </div>
    <div class="meter"><div style="flex:1"></div><span class="meter-label" data-cp-verdict style="min-width:100%;text-align:left"></span></div>
    <p class="widget-hint">Targets: horizon on a third line (not the middle), boat on or near a thirds intersection with open water to sail into. Then try deliberate center-symmetry — and feel the difference.</p>
  `);

  const $ = (s) => w.querySelector(s);
  const svg = $('[data-svg]');
  const boat = $('[data-boat]');
  let bx = 350, by = 300, dragging = false;

  const T = [233.33, 466.67], TY = [133.33, 266.67];

  function svgPoint(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function render() {
    const hz = +$('[data-hz]').value;
    $('[data-sky]').setAttribute('height', hz);
    $('[data-sea]').setAttribute('y', hz);
    $('[data-sea]').setAttribute('height', 400 - hz);
    $('[data-horizon]').setAttribute('y1', hz); $('[data-horizon]').setAttribute('y2', hz);
    $('[data-sun]').setAttribute('cy', Math.min(hz - 44, 200));
    by = Math.max(by, hz + 26);                      // keep boat in the water
    boat.setAttribute('transform', `translate(${bx},${by})`);
    const hzPct = (hz / 400 * 100).toFixed(0);
    $('[data-hz-out]').textContent = `${hzPct}% down`;

    // scoring
    const hzThird = Math.min(Math.abs(hz - TY[0]), Math.abs(hz - TY[1])) < 18;
    const hzCenter = Math.abs(hz - 200) < 18;
    let nearest = Infinity;
    for (const tx of T) for (const ty of TY) nearest = Math.min(nearest, Math.hypot(bx - tx, by - ty));
    const boatCenter = Math.hypot(bx - 350, by - 200) < 45;
    const facingSpace = bx < 350 ? (700 - bx) : bx;   // rough leading-room proxy

    const msgs = [];
    if (hzThird) msgs.push('✓ horizon on a third');
    else if (hzCenter) msgs.push('✗ horizon splits the frame in half');
    else msgs.push('~ horizon drifting — aim for a third line');
    if (nearest < 34) msgs.push('✓ boat on a thirds intersection — strong placement');
    else if (boatCenter) msgs.push('✗ boat dead center — static (unless symmetry is the point)');
    else if (nearest < 80) msgs.push('~ boat close to an intersection — nudge it');
    else msgs.push('✗ boat floating in no-man\'s-land');

    const verdict = $('[data-cp-verdict]');
    verdict.textContent = msgs.join('   ·   ');
    const good = hzThird && nearest < 34;
    verdict.style.color = good ? 'var(--green)' : 'var(--paper-dim)';
  }

  boat.addEventListener('pointerdown', (e) => { dragging = true; boat.style.cursor = 'grabbing'; boat.setPointerCapture(e.pointerId); });
  boat.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = svgPoint(e);
    bx = clamp(p.x, 40, 660);
    by = clamp(p.y, +$('[data-hz]').value + 26, 380);
    render();
  });
  boat.addEventListener('pointerup', () => { dragging = false; boat.style.cursor = 'grab'; });
  $('[data-hz]').addEventListener('input', render);
  $('[data-grid-toggle]').addEventListener('click', (e) => {
    const g = $('[data-grid]');
    const on = g.style.display !== 'none';
    g.style.display = on ? 'none' : '';
    e.target.classList.toggle('on', !on);
    e.target.textContent = on ? 'Grid off' : 'Grid on';
  });
  render();
}

/* ============================================================
   5. EDITING DESK
   ============================================================ */
function mountEditing(container) {
  const w = widgetShell(container, 'Lab · Editing Desk', 'develop the RAW', `
    <div class="widget-canvas" style="position:relative">
      <svg viewBox="0 0 700 380" role="img" aria-label="Editable photograph">
        <defs>
          <linearGradient id="ed-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#c9885a"/><stop offset=".55" stop-color="#d9a878"/><stop offset="1" stop-color="#e5cfa5"/>
          </linearGradient>
          <linearGradient id="ed-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#b08b62"/><stop offset="1" stop-color="#5f5a4e"/>
          </linearGradient>
          <radialGradient id="ed-vig" cx="0.5" cy="0.5" r="0.72">
            <stop offset=".55" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.85)"/>
          </radialGradient>
        </defs>
        <g data-ed-photo>
          <rect width="700" height="245" fill="url(#ed-sky)"/>
          <circle cx="350" cy="215" r="42" fill="#f3e2b8"/>
          <path d="M0 245 L110 165 L200 235 L290 185 L350 240 L700 245 Z" fill="#6d5a48" opacity=".8"/>
          <path d="M350 245 L470 150 L560 220 L640 175 L700 230 L700 245 Z" fill="#584a3d" opacity=".9"/>
          <rect y="245" width="700" height="135" fill="url(#ed-water)"/>
          <ellipse cx="350" cy="265" rx="44" ry="9" fill="#f3e2b8" opacity=".55"/>
          <ellipse cx="350" cy="285" rx="30" ry="6" fill="#f3e2b8" opacity=".3"/>
          <g stroke="#3c342b" stroke-width="2.5" fill="none" stroke-linecap="round">
            <path d="M150 90 q7 -8 14 0 q7 -8 14 0"/><path d="M196 112 q6 -7 12 0 q6 -7 12 0"/>
            <path d="M520 74 q7 -8 14 0 q7 -8 14 0"/>
          </g>
          <path d="M60 380 L60 300 q0 -14 12 -14 q12 0 12 14 L84 380 Z M40 380 L40 330 q0 -10 9 -10 q9 0 9 10 L58 380 Z" fill="#2e2822"/>
        </g>
        <rect data-ed-vig width="700" height="380" fill="url(#ed-vig)" opacity="0" style="pointer-events:none"/>
        <rect data-ed-fade width="700" height="380" fill="#d8cfc0" opacity="0" style="pointer-events:none;mix-blend-mode:screen"/>
      </svg>
    </div>
    <div class="preset-row">
      <button class="chip on" data-preset="neutral">As shot</button>
      <button class="chip" data-preset="punchy">Punchy</button>
      <button class="chip" data-preset="golden">Golden</button>
      <button class="chip" data-preset="faded">Faded film</button>
      <button class="chip" data-preset="bw">Black &amp; white</button>
      <span style="flex:1"></span>
      <button class="chip hold-compare" data-compare>◉ hold to compare</button>
    </div>
    <div class="ctl-grid" style="margin-top:1rem">
      <div class="ctl"><label>Exposure</label><input type="range" data-e min="-100" max="100" value="0"><output data-e-out>0</output></div>
      <div class="ctl"><label>Contrast</label><input type="range" data-c min="-100" max="100" value="0"><output data-c-out>0</output></div>
      <div class="ctl"><label>Saturation</label><input type="range" data-s min="-100" max="100" value="0"><output data-s-out>0</output></div>
      <div class="ctl"><label>Temperature</label><input type="range" data-t min="-100" max="100" value="0"><output data-t-out>0</output></div>
      <div class="ctl"><label>Fade</label><input type="range" data-f min="0" max="100" value="0"><output data-f-out>0</output></div>
      <div class="ctl"><label>Vignette</label><input type="range" data-v min="0" max="100" value="0"><output data-v-out>0</output></div>
    </div>
    <p class="widget-hint">Every slider here maps to a real Lightroom control. Try the presets, then reverse-engineer them: which sliders moved, and how far? Hold "compare" to flick back to the unedited RAW — pros do this constantly to avoid over-cooking.</p>
  `);

  const $ = (s) => w.querySelector(s);
  const keys = ['e', 'c', 's', 't', 'f', 'v'];
  const PRESETS = {
    neutral: { e: 0, c: 0, s: 0, t: 0, f: 0, v: 0 },
    punchy:  { e: 6, c: 34, s: 26, t: 8, f: 0, v: 24 },
    golden:  { e: 10, c: 12, s: 18, t: 52, f: 8, v: 30 },
    faded:   { e: 8, c: -18, s: -28, t: 12, f: 38, v: 12 },
    bw:      { e: 4, c: 42, s: -100, t: 0, f: 10, v: 34 },
  };

  function apply() {
    const v = {};
    keys.forEach(k => { v[k] = +$(`[data-${k}]`).value; $(`[data-${k}-out]`).textContent = v[k]; });
    const bright = Math.pow(2, v.e / 100);
    const contrast = 1 + v.c / 140;
    const sat = Math.max(0, 1 + v.s / 100);
    let temp = '';
    if (v.t > 0) temp = `sepia(${(v.t / 100 * 0.45).toFixed(3)}) saturate(${(1 + v.t / 260).toFixed(3)})`;
    else if (v.t < 0) temp = `hue-rotate(${(-v.t * 0.22).toFixed(1)}deg) saturate(${(1 + v.t / 400).toFixed(3)})`;
    $('[data-ed-photo]').style.filter =
      `brightness(${bright.toFixed(3)}) contrast(${contrast.toFixed(3)}) saturate(${sat.toFixed(3)}) ${temp}`.trim();
    $('[data-ed-vig]').setAttribute('opacity', (v.v / 100 * 0.75).toFixed(3));
    $('[data-ed-fade]').setAttribute('opacity', (v.f / 100 * 0.22).toFixed(3));
  }

  keys.forEach(k => $(`[data-${k}]`).addEventListener('input', () => {
    w.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('on'));
    apply();
  }));

  w.querySelectorAll('[data-preset]').forEach(btn => btn.addEventListener('click', () => {
    const p = PRESETS[btn.dataset.preset];
    keys.forEach(k => { $(`[data-${k}]`).value = p[k]; });
    w.querySelectorAll('[data-preset]').forEach(b => b.classList.toggle('on', b === btn));
    apply();
  }));

  const cmp = $('[data-compare]');
  const showRaw = () => {
    $('[data-ed-photo]').style.filter = 'none';
    $('[data-ed-vig]').setAttribute('opacity', 0);
    $('[data-ed-fade]').setAttribute('opacity', 0);
    cmp.classList.add('on');
  };
  const showEdit = () => { apply(); cmp.classList.remove('on'); };
  cmp.addEventListener('pointerdown', showRaw);
  cmp.addEventListener('pointerup', showEdit);
  cmp.addEventListener('pointerleave', showEdit);

  apply();
}

const REGISTRY = {
  exposure: mountExposure,
  dof: mountDof,
  histogram: mountHistogram,
  composition: mountComposition,
  editing: mountEditing,
};

export function mountWidget(name, container) {
  const fn = REGISTRY[name];
  if (fn) fn(container);
}
