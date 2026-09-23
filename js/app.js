import { MODULES, getModule, getLesson, TOTAL_ITEMS, FIELD_NOTES, PHOTO_CREDITS } from './data/index.js';
import { mountWidget } from './widgets.js';
import { initAuth, onAuth, getUser, api, openAuthModal } from './auth.js';
import { viewCollage } from './collage.js';

const app = document.getElementById('app');

/* ---------------- progress store (account-backed) ---------------- */
// Progress belongs to the signed-in user. The old guest localStorage key is
// migrated into the account on first login, then removed.
const LEGACY_KEY = 'darkroom-progress-v1';
const EMPTY = () => ({ lessons: {}, quizzes: {}, last: null });
let progress = EMPTY();

function takeLegacyLocal() {
  try {
    const p = JSON.parse(localStorage.getItem(LEGACY_KEY));
    localStorage.removeItem(LEGACY_KEY);
    return p || null;
  } catch { return null; }
}

// union-merge two progress objects (never lose work from either side)
function mergeProgress(a, b) {
  const x = a || EMPTY(), y = b || EMPTY();
  const quizzes = { ...y.quizzes };
  for (const [mod, q] of Object.entries(x.quizzes || {})) {
    const cur = quizzes[mod];
    quizzes[mod] = cur ? { best: Math.max(cur.best, q.best), total: q.total } : q;
  }
  return { lessons: { ...y.lessons, ...x.lessons }, quizzes, last: x.last || y.last || null };
}

let syncTimer = null;
function saveProgress(p) {
  if (!getUser()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    api('/api/progress', { method: 'PUT', body: JSON.stringify({ progress: p }) }).catch(() => {});
  }, 600);
}

function adoptServerProgress(serverProgress) {
  const legacy = takeLegacyLocal();
  progress = legacy ? mergeProgress(legacy, serverProgress) : (serverProgress || EMPTY());
  if (legacy) saveProgress(progress);
}

let pendingHash = null;
onAuth('login', (serverProgress) => {
  adoptServerProgress(serverProgress);
  if (pendingHash && pendingHash !== location.hash) {
    const h = pendingHash; pendingHash = null;
    location.hash = h;                       // hashchange re-routes
  } else {
    pendingHash = null;
    route();
  }
});

onAuth('logout', () => {
  progress = EMPTY();
  location.hash = '#/';
  route();
});

const lessonKey = (m, l) => `${m}/${l}`;
const isLessonDone = (m, l) => !!progress.lessons[lessonKey(m, l)];
const isQuizDone = (m) => !!progress.quizzes[m];

function moduleStats(mod) {
  const done = mod.lessons.filter(l => isLessonDone(mod.id, l.id)).length + (isQuizDone(mod.id) ? 1 : 0);
  const total = mod.lessons.length + 1;
  return { done, total, pct: Math.round(done / total * 100) };
}
function courseStats() {
  const done = Object.keys(progress.lessons).length + Object.keys(progress.quizzes).length;
  return { done, total: TOTAL_ITEMS, pct: Math.round(done / TOTAL_ITEMS * 100) };
}

/* ---------------- helpers ---------------- */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function renderBlocks(blocks) {
  return blocks.map(b => {
    switch (b.type) {
      case 'p': return `<p>${b.html}</p>`;
      case 'h2': return `<h2>${b.html}</h2>`;
      case 'list': return `<ul>${b.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
      case 'olist': return `<ol>${b.items.map(i => `<li>${i}</li>`).join('')}</ol>`;
      case 'tip': return `<div class="callout"><span class="callout-label">${b.label || 'Pro tip'}</span><p>${b.html}</p></div>`;
      case 'recipe': return `<div class="callout recipe"><span class="callout-label">${b.label || 'Recipe'}</span><p>${b.html}</p></div>`;
      case 'assignment': return `<div class="callout assignment"><span class="callout-label">📷 Field assignment</span><p>${b.html}</p></div>`;
      case 'table': return `<div style="overflow-x:auto"><table class="spec"><thead><tr>${b.head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      case 'widget': return `<div data-widget="${b.widget}"></div>`;
      default: return '';
    }
  }).join('');
}

function mountWidgets(root) {
  root.querySelectorAll('[data-widget]').forEach(elm => mountWidget(elm.dataset.widget, elm));
}

function updateTopbar() {
  const { pct } = courseStats();
  document.getElementById('topbarProgress').textContent = pct > 0 ? `${pct}% DEVELOPED` : '';
}

function setNav(name) {
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === name));
}

/* ---------------- views ---------------- */
function viewHome() {
  setNav('home');
  const { done, pct } = courseStats();
  const quizCount = Object.keys(progress.quizzes).length;
  const C = 2 * Math.PI * 52;

  let resumeHtml = '';
  if (progress.last) {
    const [mid, lid] = progress.last.split('/');
    const mod = getModule(mid); const les = getLesson(mid, lid);
    if (mod && les) resumeHtml = `
      <div class="dash-resume">
        <span class="mono">Continue where you left off</span>
        <a class="btn btn-ghost btn-small" href="#/lesson/${mid}/${lid}">▸ ${mod.num} · ${esc(les.title)}</a>
      </div>`;
  }

  const dashHtml = getUser() ? `
    <section class="dash">
      <div class="ring">
        <svg width="118" height="118" viewBox="0 0 118 118">
          <circle class="track" cx="59" cy="59" r="52" fill="none" stroke-width="7"/>
          <circle class="fill" cx="59" cy="59" r="52" fill="none" stroke-width="7"
            stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - pct / 100)).toFixed(1)}"/>
        </svg>
        <div class="ring-label"><div><b>${pct}%</b><span>developed</span></div></div>
      </div>
      <div class="dash-stats">
        <div class="dash-stat"><b>${Object.keys(progress.lessons).length}</b><span>lessons completed</span></div>
        <div class="dash-stat"><b>${quizCount}<span style="color:var(--paper-faint)">/${MODULES.length}</span></b><span>quizzes passed</span></div>
        <div class="dash-stat"><b>${MODULES.filter(m => moduleStats(m).pct === 100).length}</b><span>modules mastered</span></div>
      </div>
      ${resumeHtml}
    </section>` : `
    <section class="dash dash-cta">
      <div>
        <span class="mono" style="color:var(--amber)">FREE MEMBERSHIP</span>
        <p>Create an account to start the course. Every lesson you finish and every quiz you pass is saved to your account — pick up exactly where you left off, on any device.</p>
      </div>
      <div class="hero-cta" style="margin:0">
        <button class="btn btn-primary" data-cta-register>Create free account</button>
        <button class="btn btn-ghost" data-cta-signin>Sign in</button>
      </div>
    </section>`;

  app.innerHTML = `
  <div class="view">
    <section class="hero stagger">
      <div>
        <div class="hero-kicker mono">A complete course · 10 modules · ${TOTAL_ITEMS - MODULES.length} lessons · 5 labs</div>
        <h1>Learn to see.<br>Then learn to <em>develop</em> what you saw.</h1>
        <p class="lede">A working photographer's curriculum — exposure, light, composition, and the digital darkroom — taught with hands-on simulators, field assignments, and quizzes. No gear worship. No fluff. Just the craft.</p>
        <div class="hero-cta">
          <a class="btn btn-primary" href="#/module/${firstUnfinishedModule()}">${done > 0 ? 'Continue the course' : 'Start Module 01'}</a>
          <a class="btn btn-ghost" href="#/syllabus">View full syllabus</a>
        </div>
      </div>
      <figure class="hero-print">
        <img class="ph" src="img/hero.jpg" alt="A photograph pinned up in the studio">
        <figcaption><span>The Darkroom</span><span>Print № 01</span></figcaption>
      </figure>
    </section>

    ${dashHtml}

    <div class="section-head"><h2>The Contact Sheet</h2><span class="mono">choose a module</span></div>
    <section class="sheet stagger">
      ${MODULES.map(m => {
        const st = moduleStats(m);
        return `
        <a class="module-card" href="#/module/${m.id}">
          <div class="module-thumb"><img class="ph" loading="lazy" src="img/${m.id}.jpg" alt="${m.title} module photograph"></div>
          ${st.pct === 100 ? '<span class="badge-done">DEVELOPED</span>' : ''}
          <div class="module-num"><span>MODULE ${m.num}</span><span>${m.lessons.length} LESSONS + QUIZ</span></div>
          <h3>${m.title}</h3>
          <p>${m.description}</p>
          <div class="module-meta">
            <div class="module-bar"><i class="${st.pct === 100 ? 'done' : ''}" style="width:${st.pct}%"></i></div>
            <span class="module-pct">${st.done}/${st.total} · ${st.pct}%</span>
          </div>
        </a>`;
      }).join('')}
    </section>

    <section class="pt-promo">
      <div>
        <span class="mono" style="color:var(--amber)">NEW · MEMBERS' TOOL</span>
        <h3>The Print Table — themed collages, print-ready</h3>
        <p>Newborn, birthday, graduation, wedding, maternity or classic darkroom: pick a theme and a layout, drop in your photos, add the words, and download a 300-DPI file. Everything stays on your device.</p>
      </div>
      <a class="btn btn-primary" href="#/collage">Open the Print Table</a>
    </section>
  </div>`;

  app.querySelector('[data-cta-register]')?.addEventListener('click', () => openAuthModal('register'));
  app.querySelector('[data-cta-signin]')?.addEventListener('click', () => openAuthModal('signin'));
}

function firstUnfinishedModule() {
  for (const m of MODULES) if (moduleStats(m).pct < 100) return m.id;
  return MODULES[0].id;
}

function viewSyllabus() {
  setNav('syllabus');
  app.innerHTML = `
  <div class="view">
    <div class="section-head"><h2>Full Syllabus</h2><span class="mono">the whole roll</span></div>
    ${MODULES.map(m => `
      <div class="syllabus-row">
        <span class="num">${m.num}</span>
        <span class="syllabus-thumb"><img class="ph" loading="lazy" src="img/${m.id}.jpg" alt=""></span>
        <div>
          <h3><a href="#/module/${m.id}">${m.title}</a> <span class="mono" style="color:var(--amber)">· ${m.tagline}</span></h3>
          <p>${m.lessons.map(l => l.title).join('  ·  ')}</p>
        </div>
        <span class="mono">${moduleStats(m).pct}%</span>
      </div>`).join('')}
  </div>`;
}

function viewFieldNotes() {
  setNav('fieldnotes');
  app.innerHTML = `
  <div class="view">
    <div class="section-head"><h2>Field Notes</h2><span class="mono">pocket wisdom — screenshot these</span></div>
    <div class="filmstrip slim notes-banner"><img class="ph" src="img/notes.jpg" alt="Film negatives on a lightbox"></div>
    <div class="notes-grid stagger">
      ${FIELD_NOTES.map((n, i) => `
        <div class="note-card">
          <span class="mono">№ ${String(i + 1).padStart(2, '0')} · ${n.tag}</span>
          <h3>${n.title}</h3>
          <p>${n.body}</p>
        </div>`).join('')}
    </div>
    <div class="credits">
      <span class="mono">Photography on this site</span>
      <p>${PHOTO_CREDITS.map(c => `<a href="${c.link}" target="_blank" rel="noopener">${c.creator}</a> (${c.license}, ${c.use})`).join(' · ')}</p>
    </div>
  </div>`;
}

function viewModule(id) {
  const mod = getModule(id);
  if (!mod) return viewHome();
  setNav('syllabus');
  const st = moduleStats(mod);
  app.innerHTML = `
  <div class="view">
    <div class="crumbs"><a href="#/">Studio</a> / <span>Module ${mod.num}</span></div>
    <div class="filmstrip module-hero-media"><img class="ph" src="img/${mod.id}.jpg" alt="${mod.title} module photograph"></div>
    <div class="module-hero">
      <span class="mono">MODULE ${mod.num} · ${mod.tagline} · ${st.pct}% developed</span>
      <h1>${mod.title}</h1>
      <p>${mod.description}</p>
    </div>
    <div class="lesson-list">
      ${mod.lessons.map((l, i) => `
        <a class="lesson-row" href="#/lesson/${mod.id}/${l.id}">
          <span class="idx">${mod.num}.${i + 1}</span>
          <span class="t">${l.title}</span>
          <span class="dur">${l.duration}</span>
          <span class="check ${isLessonDone(mod.id, l.id) ? 'on' : ''}">✓</span>
        </a>`).join('')}
      <a class="lesson-row quiz-row" href="#/quiz/${mod.id}">
        <span class="idx">◆</span>
        <span class="t">Module Quiz — ${mod.quiz.length} questions</span>
        <span class="dur">${isQuizDone(mod.id) ? `BEST ${progress.quizzes[mod.id].best}/${mod.quiz.length}` : 'NOT TAKEN'}</span>
        <span class="check ${isQuizDone(mod.id) ? 'on' : ''}">✓</span>
      </a>
    </div>
  </div>`;
}

function viewLesson(mid, lid) {
  const mod = getModule(mid);
  const les = getLesson(mid, lid);
  if (!mod || !les) return viewHome();
  setNav('syllabus');
  progress.last = lessonKey(mid, lid);
  saveProgress(progress);

  const idx = mod.lessons.indexOf(les);
  const prev = mod.lessons[idx - 1];
  const next = mod.lessons[idx + 1];
  const done = isLessonDone(mid, lid);

  app.innerHTML = `
  <div class="view lesson-shell">
    <div class="crumbs"><a href="#/">Studio</a> / <a href="#/module/${mid}">Module ${mod.num} — ${mod.title}</a> / <span>${mod.num}.${idx + 1}</span></div>
    <div class="filmstrip slim"><img class="ph" src="img/${mid}.jpg" alt="${mod.title} module photograph"></div>
    <div class="lesson-head">
      <span class="mono">LESSON ${mod.num}.${idx + 1} · ${les.duration} · ${mod.title}</span>
      <h1>${les.title}</h1>
    </div>
    <div class="lesson-body">${renderBlocks(les.blocks)}</div>
    <div class="lesson-nav">
      <div>${prev ? `<a class="btn btn-ghost btn-small" href="#/lesson/${mid}/${prev.id}">◂ ${esc(prev.title)}</a>` : `<a class="btn btn-ghost btn-small" href="#/module/${mid}">◂ Module overview</a>`}</div>
      <button class="btn ${done ? 'btn-ghost complete-btn done' : 'btn-primary complete-btn'}" data-complete>${done ? '✓ Completed' : 'Mark complete'}</button>
      <div>${next ? `<a class="btn btn-ghost btn-small" href="#/lesson/${mid}/${next.id}">${esc(next.title)} ▸</a>` : `<a class="btn btn-ghost btn-small" href="#/quiz/${mid}">Take the quiz ▸</a>`}</div>
    </div>
  </div>`;

  mountWidgets(app);

  app.querySelector('[data-complete]').addEventListener('click', (e) => {
    const k = lessonKey(mid, lid);
    if (progress.lessons[k]) delete progress.lessons[k];
    else progress.lessons[k] = true;
    saveProgress(progress);
    const nowDone = !!progress.lessons[k];
    e.target.textContent = nowDone ? '✓ Completed' : 'Mark complete';
    e.target.classList.toggle('done', nowDone);
    e.target.classList.toggle('btn-primary', !nowDone);
    e.target.classList.toggle('btn-ghost', nowDone);
    updateTopbar();
  });
}

/* ---------------- quiz engine ---------------- */
function viewQuiz(mid) {
  const mod = getModule(mid);
  if (!mod) return viewHome();
  setNav('syllabus');
  const questions = mod.quiz;
  let current = 0, score = 0;
  const results = new Array(questions.length).fill(null);

  app.innerHTML = `
  <div class="view quiz-shell">
    <div class="crumbs"><a href="#/">Studio</a> / <a href="#/module/${mid}">Module ${mod.num} — ${mod.title}</a> / <span>Quiz</span></div>
    <div class="filmstrip slim"><img class="ph" src="img/${mid}.jpg" alt="${mod.title} module photograph"></div>
    <span class="mono" style="color:var(--amber)">MODULE ${mod.num} QUIZ · ${questions.length} FRAMES</span>
    <div id="quizBody" style="margin-top:1rem"></div>
  </div>`;

  const body = document.getElementById('quizBody');

  function renderQuestion() {
    const q = questions[current];
    body.innerHTML = `
      <div class="quiz-progress">${questions.map((_, i) =>
        `<i class="${results[i] === true ? 'done' : results[i] === false ? 'wrong' : ''}"></i>`).join('')}</div>
      <div class="quiz-q">${current + 1}. ${q.q}</div>
      <div class="quiz-opts">
        ${q.options.map((o, i) => `<button class="quiz-opt" data-opt="${i}"><span class="key">${'ABCD'[i]}</span><span>${o}</span></button>`).join('')}
      </div>
      <div data-why></div>`;

    body.querySelectorAll('[data-opt]').forEach(btn => btn.addEventListener('click', () => {
      const pick = +btn.dataset.opt;
      const correct = pick === q.answer;
      results[current] = correct;
      if (correct) score++;
      body.querySelectorAll('[data-opt]').forEach((b, i) => {
        b.disabled = true;
        if (i === q.answer) b.classList.add('correct');
        else if (i === pick) b.classList.add('incorrect');
      });
      body.querySelector('[data-why]').innerHTML = `
        <div class="quiz-why"><b style="color:${correct ? 'var(--green)' : 'var(--red)'}">${correct ? 'Correct.' : 'Not quite.'}</b> ${q.why}</div>
        <div style="margin-top:1.4rem;text-align:right">
          <button class="btn btn-primary btn-small" data-next>${current + 1 < questions.length ? 'Next frame ▸' : 'See results ▸'}</button>
        </div>`;
      body.querySelector('[data-next]').addEventListener('click', () => {
        current++;
        if (current < questions.length) renderQuestion();
        else renderResults();
      });
      // re-render progress strip
      body.querySelectorAll('.quiz-progress i').forEach((el2, i) => {
        el2.className = results[i] === true ? 'done' : results[i] === false ? 'wrong' : '';
      });
    }));
  }

  function renderResults() {
    const prev = progress.quizzes[mid];
    const best = Math.max(score, prev ? prev.best : 0);
    progress.quizzes[mid] = { best, total: questions.length };
    saveProgress(progress);
    updateTopbar();
    const pct = score / questions.length;
    const grade = pct === 1 ? 'Flawless roll. Museum print.' :
      pct >= 0.8 ? 'Sharp work — gallery wall material.' :
      pct >= 0.6 ? 'A solid contact sheet. Reshoot a couple of frames.' :
      'Back into the developer tray — reread the module and reshoot.';
    body.innerHTML = `
      <div class="quiz-result">
        <div class="mono" style="color:var(--paper-faint)">DEVELOPED</div>
        <div class="big">${score} / ${questions.length}</div>
        <p>${grade}${prev && prev.best > score ? ` (Your best remains ${best}/${questions.length}.)` : ''}</p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-ghost" data-retry>↺ Retake quiz</button>
          <a class="btn btn-primary" href="#/module/${nextModuleId(mid)}">${nextModuleId(mid) === mid ? 'Back to module' : 'Next module ▸'}</a>
        </div>
      </div>`;
    body.querySelector('[data-retry]').addEventListener('click', () => viewQuiz(mid));
  }

  renderQuestion();
}

function nextModuleId(mid) {
  const i = MODULES.findIndex(m => m.id === mid);
  return MODULES[i + 1] ? MODULES[i + 1].id : mid;
}

/* ---------------- membership gate ---------------- */
function viewGate() {
  setNav('syllabus');
  pendingHash = location.hash;               // return here after login
  app.innerHTML = `
  <div class="view gate">
    <div class="gate-card">
      <div class="filmstrip"><img class="ph" src="img/hero.jpg" alt="A photograph from the darkroom"></div>
      <span class="mono" style="color:var(--amber)">MEMBERS' DARKROOM</span>
      <h1>Step into the darkroom.</h1>
      <p>The course is free — it just needs a name on the door. Create an account (or sign in) to open the lessons; your progress and quiz scores are saved to your account and follow you on every device.</p>
      <div class="hero-cta" style="justify-content:center">
        <button class="btn btn-primary" data-gate-register>Create free account</button>
        <button class="btn btn-ghost" data-gate-signin>I have an account</button>
      </div>
    </div>
  </div>`;
  app.querySelector('[data-gate-register]').addEventListener('click', () => openAuthModal('register'));
  app.querySelector('[data-gate-signin]').addEventListener('click', () => openAuthModal('signin'));
  openAuthModal('register');
}

/* ---------------- router ---------------- */
const GATED = new Set(['module', 'lesson', 'quiz', 'collage']);

function route() {
  const hash = location.hash.slice(2) || '';
  const parts = hash.split('/').filter(Boolean);
  window.scrollTo({ top: 0 });
  updateTopbar();

  // the Print Table is a full-page workspace (no content column, no footer)
  const workspace = parts[0] === 'collage' && !!getUser();
  app.classList.toggle('pt-full', workspace);
  document.body.classList.toggle('pt-mode', workspace);

  if (GATED.has(parts[0]) && !getUser()) return viewGate();

  if (parts[0] === 'module' && parts[1]) return viewModule(parts[1]);
  if (parts[0] === 'lesson' && parts[1] && parts[2]) return viewLesson(parts[1], parts[2]);
  if (parts[0] === 'quiz' && parts[1]) return viewQuiz(parts[1]);
  if (parts[0] === 'syllabus') return viewSyllabus();
  if (parts[0] === 'fieldnotes') return viewFieldNotes();
  if (parts[0] === 'collage') { setNav('collage'); return viewCollage(app); }
  return viewHome();
}

window.addEventListener('hashchange', route);

(async () => {
  const serverProgress = await initAuth();
  if (getUser()) adoptServerProgress(serverProgress);
  route();
})();
