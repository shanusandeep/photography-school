// ============================================================
// Auth: session state, sign-in modal, Google SSO, API helper.
// Emits 'login' (with server progress) and 'logout' events.
// ============================================================

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];
export const API_BASE = LOCAL_HOSTS.includes(location.hostname) ? 'http://localhost:8092' : '';

export async function api(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data;
}

let user = null;
let config = { googleClientId: '' };
const listeners = { login: [], logout: [] };

export const getUser = () => user;
export function onAuth(event, cb) { listeners[event].push(cb); }
const emit = (event, arg) => listeners[event].forEach((cb) => cb(arg));

export async function initAuth() {
  try { config = await api('/api/config'); } catch { /* api offline → guest mode */ }
  try {
    const me = await api('/api/me');
    user = me.user;
    renderChip();
    return me.progress;           // caller merges into local progress
  } catch {
    renderChip();
    return null;
  }
}

/* ---------------- topbar chip ---------------- */
function renderChip() {
  const slot = document.getElementById('topbarAuth');
  if (!slot) return;
  if (!user) {
    slot.innerHTML = `<button class="btn btn-ghost btn-small" data-signin>Sign in</button>`;
    slot.querySelector('[data-signin]').addEventListener('click', () => openAuthModal());
    return;
  }
  const initial = (user.name || user.email)[0].toUpperCase();
  slot.innerHTML = `
    <button class="user-chip" data-chip title="${user.email}">
      <span class="user-avatar">${initial}</span>
      <span class="user-name">${user.name.split(' ')[0]}</span>
    </button>
    <div class="user-menu" data-menu hidden>
      <div class="user-menu-head"><b>${user.name}</b><span>${user.email}</span></div>
      <button data-logout>Sign out</button>
    </div>`;
  const menu = slot.querySelector('[data-menu]');
  slot.querySelector('[data-chip]').addEventListener('click', (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; });
  document.addEventListener('click', () => { menu.hidden = true; }, { once: true });
  slot.querySelector('[data-logout]').addEventListener('click', async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
    user = null;
    renderChip();
    emit('logout');
  });
}

/* ---------------- modal ---------------- */
let modal = null;

export function openAuthModal(mode = 'signin') {
  if (!modal) buildModal();
  modal.dataset.mode = mode;
  syncModalMode();
  modal.querySelector('[data-error]').textContent = '';
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('open'));
  modal.querySelector('input[name=email]').focus();
  if (config.googleClientId) mountGoogleButton();
}

function closeAuthModal() {
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => { modal.hidden = true; }, 180);
}

function buildModal() {
  modal = document.createElement('div');
  modal.className = 'auth-overlay';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="auth-card" role="dialog" aria-modal="true" aria-label="Sign in">
      <button class="auth-close" data-close aria-label="Close">✕</button>
      <div class="mono auth-kicker">MEMBERS' DARKROOM</div>
      <div class="auth-tabs">
        <button data-tab="signin">Sign in</button>
        <button data-tab="register">Create account</button>
      </div>
      <form data-form novalidate>
        <div class="field" data-field-name hidden>
          <label>Name</label>
          <input name="name" type="text" autocomplete="name" placeholder="Ansel Adams">
        </div>
        <div class="field">
          <label>Email</label>
          <input name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
        </div>
        <div class="field">
          <label>Password</label>
          <input name="password" type="password" autocomplete="current-password" placeholder="8+ characters" required>
        </div>
        <p class="auth-error" data-error role="alert"></p>
        <button class="btn btn-primary auth-submit" data-submit type="submit">Sign in</button>
      </form>
      <div class="auth-divider" data-gwrap hidden><span>or</span></div>
      <div class="gsi-slot" data-gslot></div>
      <p class="auth-note">Your lesson progress and quiz scores sync to your account on every device.</p>
    </div>`;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => { if (e.target === modal) closeAuthModal(); });
  modal.querySelector('[data-close]').addEventListener('click', closeAuthModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeAuthModal(); });
  modal.querySelectorAll('[data-tab]').forEach((t) => t.addEventListener('click', () => {
    modal.dataset.mode = t.dataset.tab;
    syncModalMode();
  }));

  modal.querySelector('[data-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const errEl = modal.querySelector('[data-error]');
    const btn = modal.querySelector('[data-submit]');
    errEl.textContent = '';
    btn.disabled = true;
    try {
      const mode = modal.dataset.mode;
      const payload = { email: f.email.value, password: f.password.value };
      if (mode === 'register') payload.name = f.name.value;
      const data = await api(mode === 'register' ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST', body: JSON.stringify(payload),
      });
      finishLogin(data);
    } catch (err) {
      errEl.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

function syncModalMode() {
  const mode = modal.dataset.mode;
  modal.querySelectorAll('[data-tab]').forEach((t) => t.classList.toggle('on', t.dataset.tab === mode));
  modal.querySelector('[data-field-name]').hidden = mode !== 'register';
  modal.querySelector('[data-submit]').textContent = mode === 'register' ? 'Create account' : 'Sign in';
  modal.querySelector('input[name=password]').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
}

function finishLogin(data) {
  user = data.user;
  renderChip();
  closeAuthModal();
  emit('login', data.progress);
}

/* ---------------- Google SSO ---------------- */
let gsiLoaded = false;
function mountGoogleButton() {
  modal.querySelector('[data-gwrap]').hidden = false;
  const slot = modal.querySelector('[data-gslot]');
  const render = () => {
    google.accounts.id.initialize({
      client_id: config.googleClientId,
      callback: async ({ credential }) => {
        try {
          const data = await api('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
          finishLogin(data);
        } catch (err) {
          modal.querySelector('[data-error]').textContent = err.message;
        }
      },
    });
    slot.innerHTML = '';
    google.accounts.id.renderButton(slot, { theme: 'filled_black', size: 'large', width: 320, text: 'continue_with' });
  };
  if (gsiLoaded) return render();
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.onload = () => { gsiLoaded = true; render(); };
  document.head.appendChild(s);
}
