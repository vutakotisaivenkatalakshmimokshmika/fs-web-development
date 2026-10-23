// PetPal front-end in plain JavaScript (no frameworks).
// A single `state` object holds everything; render functions turn it into HTML.
// Routing uses the browser History API, and all clicks are handled by event delegation.
import { api, getToken, setToken } from './api.js';
import { icon } from './icons.js';
import { drawCharts } from './chart.js';

const speciesEmoji = { cat: '🐱', fox: '🦊', bunny: '🐰' };
const categoryEmoji = { Study: '📚', Health: '💧', Productivity: '✨', 'Self-care': '🌷', Other: '🌱' };
const todayLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

const navItems = [
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
  { label: 'My Habits', path: '/habits', icon: 'ListChecks' },
  { label: 'Pet Care', path: '/pet', icon: 'Heart' },
  { label: 'Rewards Shop', path: '/shop', icon: 'Store' },
  { label: 'My Progress', path: '/progress', icon: 'ChartNoAxesCombined' },
  { label: 'Settings', path: '/settings', icon: 'Settings' }
];
const titles = { '/': 'Your cozy dashboard', '/habits': 'Little steps, big progress', '/pet': 'A little care goes a long way', '/shop': 'Treat your tiny companion', '/progress': 'Look how far you’ve come', '/settings': 'Make PetPal yours' };

/* ------------------------------------------------------------------ state */

const freshAuth = () => ({ name: '', email: '', password: '', error: '', busy: false });
const freshMain = () => ({
  started: false, pet: null, habits: [], analytics: null, items: [], loading: true,
  showAdd: false, newTitle: '', newCategory: 'Study', petName: '', petSpecies: 'cat', editingPet: false,
  busyId: '', error: '', petAction: 'idle', activeFood: '🍓'
});

const state = { user: null, checking: true, dark: false, toast: '', auth: freshAuth(), main: freshMain() };

/* ---------------------------------------------------------------- helpers */

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const path = () => window.location.pathname;
const initial = (name) => esc(name?.[0]?.toUpperCase() || '');

let toastTimer;
function notify(message) {
  state.toast = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { state.toast = ''; renderToast(); }, 2800);
  renderToast();
}

function navigate(to, replace = false) {
  if (to !== path()) history[replace ? 'replaceState' : 'pushState']({}, '', to);
  render();
}

/* ------------------------------------------------------------ app shell */

const root = document.getElementById('root');
root.innerHTML = '<div class="app-shell"><div id="view"></div><div id="modal-root"></div><div id="toast-root"></div></div>';
const shell = root.firstElementChild;
const view = document.getElementById('view');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');

function render() {
  shell.className = state.dark ? 'app-shell dark' : 'app-shell';
  renderView();
  renderModals();
  renderToast();
}

function renderToast() {
  toastRoot.innerHTML = state.toast ? `<div class="toast">${icon('Sparkles', 17)}${esc(state.toast)}</div>` : '';
}

function renderView() {
  if (state.checking) {
    view.innerHTML = '<div class="loading-screen"><span class="loader-paw">🐾</span><p>Waking up your pet…</p></div>';
    return;
  }
  const p = path();
  if (p === '/login' || p === '/register') {
    if (state.user) return navigate('/', true);
    view.innerHTML = authView(p === '/register' ? 'register' : 'login');
    return;
  }
  if (!state.user) return navigate('/login', true);
  if (!titles[p]) return navigate('/', true);
  if (!state.main.started) { state.main.started = true; refresh(); return; }
  view.innerHTML = mainView();
  drawCharts(view);
}

/* ------------------------------------------------------------------ auth */

function authView(mode) {
  const a = state.auth;
  const reg = mode === 'register';
  return `<div class="auth-wrap"><div class="auth-card">
    <div class="brand-mark large">${icon('PawPrint', 28)}</div><p class="eyebrow">YOUR LITTLE DAILY COMPANION</p>
    <h1>${reg ? 'Start your cozy journey' : 'Welcome back!'}</h1>
    <p class="muted">${reg ? 'Build gentle habits, one paw at a time.' : 'Your pet has been waiting for you.'}</p>
    <form class="stack-form" data-form="auth" data-mode="${mode}">
      ${reg ? `<label>Your name<input data-model="auth.name" value="${esc(a.name)}" placeholder="Mochi friend" required minlength="2"/></label>` : ''}
      <label>Email address<input type="email" data-model="auth.email" value="${esc(a.email)}" placeholder="you@example.com" required/></label>
      <label>Password<input type="password" data-model="auth.password" value="${esc(a.password)}" placeholder="At least 8 characters" required minlength="8"/></label>
      ${a.error ? `<p class="error">${esc(a.error)}</p>` : ''}
      <button class="btn primary full" ${a.busy ? 'disabled' : ''}>${a.busy ? 'Please wait…' : reg ? 'Create my account' : 'Log in'} ${icon('Sparkles', 16)}</button>
    </form>
    <p class="auth-switch">${reg ? 'Already have an account?' : 'New to PetPal?'} <a href="${reg ? '/login' : '/register'}" data-link>${reg ? 'Log in' : 'Create an account'}</a></p>
  </div><div class="auth-art"><div class="sun-glow"></div><span class="floating-heart">♡</span><div class="big-pet">🐱</div><div class="speech">“Small steps are still progress!”</div><div class="tiny-stars">✦　✧　✦</div></div></div>`;
}

async function submitAuth(form) {
  const mode = form.dataset.mode;
  const a = state.auth;
  a.error = ''; a.busy = true; renderView();
  try {
    const data = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify({ name: a.name, email: a.email, password: a.password }) });
    setToken(data.token);
    state.user = data.user;
    state.auth = freshAuth();
    state.main = freshMain();
    navigate('/');
  } catch (err) {
    a.error = err.message; a.busy = false; renderView();
  }
}

function logout() {
  setToken(null);
  state.user = null;
  state.main = freshMain();
  navigate('/login');
  renderModals();
}

/* ------------------------------------------------------------- main data */

async function refresh() {
  const m = state.main;
  m.loading = true;
  renderView();
  try {
    const [h, p, a, s] = await Promise.all([api('/habits'), api('/pet'), api('/analytics'), api('/shop')]);
    m.habits = h.habits; m.pet = p.pet; m.petName = p.pet.name; m.petSpecies = p.pet.species; m.analytics = a; m.items = s.items;
    if (state.user) state.user = { ...state.user, coins: p.coins ?? state.user.coins };
  } catch (e) {
    m.error = e.message;
  } finally {
    m.loading = false;
    if (state.main === m) renderView();
  }
}

async function addHabit() {
  const m = state.main;
  if (!m.newTitle.trim()) return;
  try {
    await api('/habits', { method: 'POST', body: JSON.stringify({ title: m.newTitle, category: m.newCategory }) });
    m.newTitle = ''; m.showAdd = false; renderModals();
    await refresh();
    notify('A new habit joined your journey!');
  } catch (e) { notify(e.message); }
}

async function completeHabit(id) {
  const m = state.main;
  const habit = m.habits.find((h) => h._id === id);
  if (!habit || habit.completedToday || m.busyId) return;
  m.busyId = id; renderView();
  try {
    const result = await api(`/habits/${id}/complete`, { method: 'POST', body: JSON.stringify({}) });
    notify(result.message);
    await refresh();
  } catch (e) { notify(e.message); }
  finally { m.busyId = ''; renderView(); }
}

async function deleteHabit(id) {
  if (!window.confirm('Remove this habit from your list?')) return;
  try { await api(`/habits/${id}`, { method: 'DELETE' }); await refresh(); notify('Habit removed.'); }
  catch (e) { notify(e.message); }
}

function setPetAction(action) {
  state.main.petAction = action;
  renderView();
}
const petLabel = () => state.main.pet?.name || 'Your pet';

async function feedPet(food = '🍓') {
  const m = state.main;
  const name = petLabel();
  m.activeFood = food; setPetAction('eating');
  try {
    const d = await api('/pet/feed', { method: 'POST', body: JSON.stringify({}) });
    m.pet = d.pet; state.user = { ...state.user, coins: d.coins };
    renderView();
    notify(`${name} is happily eating ${food}!`);
  } catch (e) { notify(e.message); setPetAction('idle'); return; }
  window.setTimeout(() => setPetAction('idle'), 2400);
}
function playPet() { setPetAction('playing'); notify(`${petLabel()} is chasing the toy!`); window.setTimeout(() => setPetAction('idle'), 2800); }
function petCuddle() { setPetAction('loved'); notify(`♡ ${petLabel()} feels loved! Petting is always free.`); window.setTimeout(() => setPetAction('idle'), 2600); }
function restPet() { setPetAction('sleeping'); notify(`${petLabel()} is taking a cozy nap.`); window.setTimeout(() => setPetAction('idle'), 3200); }

async function savePet() {
  const m = state.main;
  try {
    const d = await api('/pet', { method: 'PATCH', body: JSON.stringify({ name: m.petName, species: m.petSpecies }) });
    m.pet = d.pet; m.editingPet = false; renderModals(); renderView();
    notify('Your pet’s profile has been updated!');
  } catch (e) { notify(e.message); }
}

async function buy(id) {
  const m = state.main;
  const item = m.items.find((i) => i._id === id);
  if (!item) return;
  const name = petLabel();
  try {
    const d = await api(`/shop/buy/${item._id}`, { method: 'POST', body: JSON.stringify({}) });
    m.pet = d.pet; state.user = { ...state.user, coins: d.coins };
    if (item.category === 'food') {
      m.activeFood = item.emoji || '🍓'; setPetAction('eating');
      window.setTimeout(() => setPetAction('idle'), 2400);
      notify(`${name} is eating ${item.name}!`);
    } else {
      renderView();
      notify(d.message);
    }
    await refresh();
  } catch (e) { notify(e.message); }
}

/* ------------------------------------------------------------- main view */

function mainView() {
  const m = state.main;
  const user = state.user;
  const p = path();
  const done = m.habits.filter((h) => h.completedToday).length;
  const rate = m.habits.length ? Math.round(done / m.habits.length * 100) : 0;
  const owned = new Set((m.pet?.inventory || []).map((i) => (typeof i === 'string' ? i : i._id)));

  let page = '';
  if (!m.loading) {
    if (p === '/') page = dashboardPage(rate, done);
    else if (p === '/habits') page = habitsPage();
    else if (p === '/pet') page = petPage();
    else if (p === '/shop') page = shopPage(owned);
    else if (p === '/progress') page = progressPage();
    else if (p === '/settings') page = settingsPage();
  }

  return `<div class="layout">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">${icon('PawPrint', 22)}</div><div><strong>petpal</strong><small>grow with your habits</small></div></div>
      <div class="side-profile"><div class="avatar">${initial(user.name) || 'F'}</div><div><strong>${esc(user.name)}</strong><small>Little steps club</small></div><span class="online-dot"></span></div>
      <nav>${navItems.map((n) => `<a href="${n.path}" data-link class="nav-link ${p === n.path ? 'active' : ''}">${icon(n.icon, 18)}<span>${n.label}</span>${n.label === 'My Habits' ? `<span class="nav-count">${m.habits.length}</span>` : ''}</a>`).join('')}</nav>
      <div class="sidebar-bottom"><div class="mini-quote">“You don’t have to do it all. Just begin.”<span>♡</span></div><button class="nav-link plain" data-action="toggle-dark">${state.dark ? icon('Sun', 18) : icon('Moon', 18)}<span>${state.dark ? 'Light mode' : 'Dark mode'}</span></button><button class="nav-link plain" data-action="logout">${icon('LogOut', 18)}<span>Log out</span></button></div>
      <div class="sidebar-footer">made with ♡ for your growth</div>
    </aside>
    <main class="main">
      <header class="topbar"><div class="mobile-brand">${icon('PawPrint')} petpal</div><div class="breadcrumbs">Home <span>/</span> <strong>${navItems.find((n) => n.path === p)?.label || 'Dashboard'}</strong></div><div class="top-actions"><span class="date-pill">${todayLabel}</span><div class="coin-pill"><span>🪙</span><strong>${user.coins ?? 0}</strong></div><div class="avatar small">${initial(user.name)}</div></div></header>
      <div class="page-content">
        <div class="page-heading"><div><p class="eyebrow">A LITTLE PROGRESS EVERY DAY ✦</p><h1>${titles[p] || 'Your cozy dashboard'}</h1><p class="muted">Hi ${esc(user.name?.split(' ')[0])}, you’re doing better than you think. 🌷</p></div>${p !== '/settings' ? `<button class="btn primary" data-action="open-add">${icon('Plus', 17)} Add a habit</button>` : ''}</div>
        ${m.error ? `<div class="inline-error">${esc(m.error)} <button data-action="dismiss-error">${icon('X', 14)}</button></div>` : ''}
        ${m.loading ? '<div class="loading-card">Gathering your little wins… 🐾</div>' : page}
      </div>
      <footer class="main-footer">Remember: progress, not perfection. <span>♡</span></footer>
    </main>
  </div>`;
}

function stat(iconName, label, value, note, color) {
  return `<div class="stat-card"><div class="stat-icon ${color}">${icon(iconName)}</div><div><span class="stat-label">${label}</span><strong class="stat-value">${esc(value)}</strong><small>${esc(note)}</small></div></div>`;
}

function habitRow(habit, withDelete) {
  const busy = state.main.busyId === habit._id;
  return `<div class="habit-row ${habit.completedToday ? 'is-done' : ''}"><button class="check-circle ${habit.completedToday ? 'checked' : ''}" data-action="complete" data-id="${habit._id}" ${habit.completedToday || busy ? 'disabled' : ''} aria-label="Complete ${esc(habit.title)}">${habit.completedToday ? icon('Check', 17) : busy ? '…' : ''}</button><div class="habit-emoji">${categoryEmoji[habit.category] || '🌱'}</div><div class="habit-main"><strong>${esc(habit.title)}</strong><small>${esc(habit.category)}${habit.targetMinutes ? ` · ${habit.targetMinutes} min` : ''}</small></div><span class="reward-label">+10 🪙</span>${withDelete ? `<button class="icon-btn delete-btn" data-action="delete" data-id="${habit._id}" aria-label="Delete habit">${icon('Trash2', 16)}</button>` : ''}</div>`;
}

function empty(title, text, withAction) {
  return `<div class="empty-state"><span>🌱</span><h3>${title}</h3><p>${text}</p>${withAction ? `<button class="btn primary" data-action="open-add">${icon('Plus', 16)} Get started</button>` : ''}</div>`;
}

function meter(label, value, color) {
  return `<div class="meter"><div><span>${label}</span><strong>${value}%</strong></div><div class="meter-track"><span class="${color}" style="width:${value}%"></span></div></div>`;
}

function chart(cls, weekly, labelOptions, opts) {
  const data = (weekly || []).map((d) => ({ ...d, label: new Date(d.day + 'T12:00:00').toLocaleDateString('en', labelOptions) }));
  return `<div class="${cls}" data-chart='${esc(JSON.stringify({ data, ...opts }))}'></div>`;
}

function petRoom() {
  const { pet, petAction: action, activeFood: food } = state.main;
  const messages = { idle: 'Come play with me? ♡', eating: 'Nom nom… so yummy!', playing: 'Catch me if you can!', loved: 'Purrs and happy wiggles!', sleeping: 'Zzz… sweet dreams' };
  const species = esc(pet?.species || 'cat');
  const name = esc(pet?.name || 'Mochi');
  return `<div class="pet-game">
    <div class="pet-room-top"><div><span class="eyebrow">MOCHI’S LITTLE WORLD</span><h3>${name}’s cozy room</h3></div><span class="pet-mood">${messages[action] || messages.idle}</span></div>
    <div class="animated-room action-${action}"><div class="room-window"><span>☀</span><i></i><i></i><i></i></div><div class="room-shelf">✦　📚　🌱</div><div class="room-rug"></div><div class="living-pet species-${species}" aria-label="${species} pet animation"><div class="pet-shadow"></div><div class="pet-tail"></div><div class="pet-body"></div><div class="pet-head"><i class="ear ear-left"></i><i class="ear ear-right"></i><i class="eye eye-left"></i><i class="eye eye-right"></i><i class="pet-nose"></i><i class="pet-mouth"></i><i class="whisker whisker-left"></i><i class="whisker whisker-right"></i></div><div class="pet-leg leg-left"></div><div class="pet-leg leg-right"></div><span class="pet-cheek cheek-left"></span><span class="pet-cheek cheek-right"></span></div>${action === 'eating' ? `<div class="food-float">${esc(food)}<small>nom nom!</small></div>` : ''}${action === 'playing' ? '<div class="toy-ball">🧶</div>' : ''}${action === 'loved' ? '<div class="love-float">♡　♥　♡</div><div class="love-float love-float-two">💗　💕</div><div class="love-note">I love you!</div>' : ''}${action === 'sleeping' ? '<div class="sleep-float">Z z Z</div>' : ''}<div class="room-bowl">🥣<small>food bowl</small></div><div class="room-plush">🧸</div><div class="room-caption">${name} <span>✦</span></div></div>
    <div class="pet-game-stats">${meter('Happiness', pet?.happiness ?? 75, 'pink')}${meter('Energy', pet?.energy ?? 70, 'purple')}</div>
    <div class="pet-game-actions"><button class="btn primary" data-action="feed" data-food="🍓">${icon('Utensils', 16)} Feed berry · 5 🪙</button><button class="btn secondary" data-action="play">🧶 Play</button><button class="btn outline cuddle-btn" data-action="cuddle">♡ Pet &amp; cuddle · Free</button><button class="btn outline" data-action="rest">☾ Sleep</button><button class="btn outline" data-action="go" data-href="/shop">${icon('ShoppingBag', 16)} Shop</button></div>
  </div>`;
}

function dashboardPage(rate, done) {
  const { pet, habits, analytics } = state.main;
  const user = state.user;
  const remaining = Math.max(0, habits.length - done);
  return `<div class="dashboard-grid">
    <section class="welcome-banner"><div class="banner-copy"><span class="banner-chip">${icon('Sparkles', 13)} YOUR DAILY MAGIC</span><h2>Small steps.<br/><em>Big dreams.</em></h2><p>Every little thing you do helps you and your pet grow.</p><button class="btn light" data-action="open-add">${icon('Plus', 16)} Add a habit</button></div><div class="banner-pet"><div class="pet-orbit orbit-one"></div><div class="pet-orbit orbit-two"></div><span class="banner-star star-a">✦</span><span class="banner-star star-b">✧</span><div class="hero-pet">${speciesEmoji[pet?.species || 'cat']}</div><div class="pet-caption"><strong>${esc(pet?.name || 'Mochi')}</strong><span>your tiny cheerleader</span></div></div></section>
    <section class="stat-row">
      ${stat('Check', "Today's progress", `${rate}%`, `${done} of ${habits.length} habits`, 'pink')}
      ${stat('Sparkles', 'Pet level', pet?.level || 1, `${pet?.xp || 0} XP collected`, 'purple')}
      ${stat('Coins', 'Your coins', user.coins || 0, 'Little rewards add up', 'yellow')}
      ${stat('Heart', 'Pet happiness', `${pet?.happiness ?? 75}%`, 'Keep showing some love', 'mint')}
    </section>
    <section class="panel habits-panel"><div class="panel-heading"><div><p class="eyebrow">YOUR CHECKLIST</p><h3>Today's little wins</h3></div><button class="text-button" data-action="go" data-href="/habits">See all →</button></div>
      ${habits.length === 0 ? empty('A fresh little start', 'Add your first habit and begin collecting wins.', true) : `<div class="habit-list">${habits.slice(0, 5).map((h) => habitRow(h, false)).join('')}</div>`}
      <div class="checklist-foot"><span>🌱 ${remaining === 0 ? 'You did it!' : `${remaining} more ${remaining === 1 ? 'habit' : 'habits'} to go`}</span><div class="progress-track"><span style="width:${rate}%"></span></div><strong>${rate}%</strong></div>
    </section>
    <section class="panel pet-panel"><div class="panel-heading"><div><p class="eyebrow">YOUR COMPANION</p><h3>Pet care corner</h3></div><button class="icon-btn" data-action="open-edit-pet" aria-label="Edit pet">${icon('Settings', 17)}</button></div>${petRoom()}</section>
    <section class="panel weekly-panel"><div class="panel-heading"><div><p class="eyebrow">YOUR MOMENTUM</p><h3>This week</h3></div><span class="soft-badge">Last 7 days</span></div>${chart('weekly-chart', analytics?.weekly, { weekday: 'short' }, { name: 'Habits completed', maxBar: 28, yWidth: 24, radius: 6, font: 11 })}</section>
    <section class="quote-card"><span>✧</span><p>“You are allowed to grow at your own pace.”</p><small>A little reminder from PetPal</small></section>
  </div>`;
}

function habitsPage() {
  const { habits } = state.main;
  const done = habits.filter((h) => h.completedToday).length;
  return `<div class="single-column"><div class="inline-summary"><div><strong>${done}/${habits.length}</strong><span>habits completed today</span></div><div class="summary-progress"><div class="progress-track"><span style="width:${habits.length ? done / habits.length * 100 : 0}%"></span></div></div></div><section class="panel"><div class="panel-heading"><div><p class="eyebrow">ONE STEP AT A TIME</p><h3>Your daily habits</h3></div><button class="btn primary" data-action="open-add">${icon('Plus', 16)} New habit</button></div>${habits.length ? `<div class="habit-list">${habits.map((h) => habitRow(h, true)).join('')}</div>` : empty('Nothing on your list yet', 'Create a small habit to get started.', true)}</section><div class="gentle-note">🌼 <span>Gentle reminder: missing a day doesn't erase your progress. Start again whenever you're ready.</span></div></div>`;
}

function petPage() {
  const { pet } = state.main;
  const coins = state.user.coins || 0;
  return `<div class="single-column">${petRoom()}<section class="panel pet-profile-extra"><div class="panel-heading"><div><p class="eyebrow">YOUR LITTLE COMPANION</p><h3>Meet ${esc(pet?.name || 'Mochi')}</h3></div><button class="btn outline" data-action="open-edit-pet">Change pet</button></div><div class="pet-level">✨ Level ${pet?.level || 1}<span>${pet?.xp || 0} XP total</span></div><p class="muted">You have ${coins} coins. Petting and cuddles are always free 💗. Complete your genuine daily habits to earn coins for snacks and toys.</p></section><section class="panel"><div class="panel-heading"><div><p class="eyebrow">A LITTLE LOVE</p><h3>How to care for your pet</h3></div></div><div class="care-tips"><div><span>📚</span><strong>Complete a habit</strong><p>Earn XP and make your pet happier.</p></div><div><span>🍓</span><strong>Feed your friend</strong><p>Watch the eating animation and see your pet react.</p></div><div><span>🎀</span><strong>Make it yours</strong><p>Choose a cat, fox, or bunny in Customize pet.</p></div></div></section></div>`;
}

function shopPage(owned) {
  const { items } = state.main;
  const coins = state.user.coins || 0;
  const cards = items.map((item) => {
    const isOwned = owned.has(item._id) && item.category !== 'food';
    const label = isOwned ? 'Owned' : coins < item.price ? 'Need coins' : item.category === 'food' ? 'Buy &amp; feed' : 'Get item';
    return `<div class="shop-item"><div class="shop-item-art">${esc(item.emoji || '🎁')}${item.category === 'food' ? '<span class="owned-label">Consumable · repeat buy</span>' : ''}${isOwned ? '<span class="owned-label">Owned ✓</span>' : ''}</div><div class="shop-item-info"><span class="item-category">${esc(item.category)}</span><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><div class="shop-item-bottom"><strong>🪙 ${item.price}</strong><button class="btn ${isOwned ? 'secondary' : 'primary'} small" data-action="buy" data-id="${item._id}" ${isOwned || coins < item.price ? 'disabled' : ''}>${label}</button></div></div></div>`;
  }).join('');
  return `<div class="single-column"><div class="shop-banner"><div><p class="eyebrow">A LITTLE SOMETHING SPECIAL</p><h2>Little treats, big smiles ✨</h2><p>Food can be bought again whenever you have enough coins. Toys and accessories stay in your collection.</p></div><div class="shop-wallet">🪙 <strong>${coins}</strong><small>available coins</small></div></div><div class="shop-grid">${cards}</div>${!items.length ? empty('The shelves are getting ready', 'Run the server seed command to add shop items.', false) : ''}</div>`;
}

function progressPage() {
  const { analytics, habits } = state.main;
  return `<div class="single-column"><div class="stat-row progress-stats">${stat('Check', 'Completed today', analytics?.completedToday || 0, 'little wins today', 'pink')}${stat('ListChecks', 'Active habits', analytics?.totalHabits || 0, 'habits in your routine', 'purple')}${stat('Sparkles', 'All-time completions', analytics?.totalCompletions || 0, 'every step counts', 'mint')}</div><section class="panel"><div class="panel-heading"><div><p class="eyebrow">YOUR WEEKLY STORY</p><h3>Habit completions</h3></div><span class="soft-badge">7 days</span></div>${chart('large-chart', analytics?.weekly, { weekday: 'short', month: 'short', day: 'numeric' }, { name: 'Completed habits', maxBar: 45, yWidth: 60, radius: 7, font: 12 })}</section><section class="panel"><div class="panel-heading"><div><p class="eyebrow">YOUR ROUTINE</p><h3>Habit list</h3></div></div>${habits.map((h) => `<div class="history-row"><span class="history-dot"></span><div><strong>${esc(h.title)}</strong><small>${esc(h.category)}</small></div><span class="status-pill ${h.completedToday ? 'complete' : 'pending'}">${h.completedToday ? 'Done today' : 'Still time'}</span></div>`).join('')}</section></div>`;
}

function settingsPage() {
  const { pet } = state.main;
  const user = state.user;
  return `<div class="single-column"><section class="panel settings-panel"><div class="settings-avatar">${initial(user.name)}</div><h2>${esc(user.name)}</h2><p class="muted">${esc(user.email)}</p><div class="settings-line"><div><strong>Pet profile</strong><small>${esc(pet?.name || 'Mochi')} · ${esc(pet?.species || 'cat')}</small></div><button class="btn outline small" data-action="open-edit-pet">Edit</button></div><div class="settings-line"><div><strong>Appearance</strong><small>Switch between cozy light and dark themes</small></div><button class="btn secondary small" data-action="toggle-dark">${state.dark ? 'Light mode' : 'Dark mode'}</button></div><div class="settings-line"><div><strong>Account</strong><small>Sign out of your PetPal account</small></div><button class="btn outline small" data-action="logout">Log out</button></div></section><div class="gentle-note">🔒 Your habits and pet are private to your account.</div></div>`;
}

/* ---------------------------------------------------------------- modals */

function modal(title, closeAction, body) {
  return `<div class="modal-backdrop" data-close="${closeAction}"><div class="modal"><div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-action="${closeAction}">${icon('X', 18)}</button></div>${body}</div></div>`;
}

function renderModals() {
  const m = state.main;
  let html = '';
  if (state.user && m.showAdd) {
    const cats = ['Study', 'Health', 'Productivity', 'Self-care', 'Other'];
    html += modal('Add a little habit', 'close-add', `<form class="stack-form" data-form="add-habit"><label>Habit name<input data-model="main.newTitle" value="${esc(m.newTitle)}" placeholder="e.g. Read for 20 minutes" maxlength="100" required/></label><label>Category<select data-model="main.newCategory">${cats.map((c) => `<option ${c === m.newCategory ? 'selected' : ''}>${c}</option>`).join('')}</select></label><button class="btn primary full">${icon('Plus', 16)} Create habit</button></form>`);
  }
  if (state.user && m.editingPet) {
    const opts = [['cat', '🐱 Cat'], ['fox', '🦊 Fox'], ['bunny', '🐰 Bunny']];
    html += modal('Your pet, your way', 'close-edit-pet', `<form class="stack-form" data-form="edit-pet"><label>Pet name<input data-model="main.petName" value="${esc(m.petName)}" maxlength="30" required/></label><label>Choose your companion<select data-model="main.petSpecies">${opts.map(([v, l]) => `<option value="${v}" ${v === m.petSpecies ? 'selected' : ''}>${l}</option>`).join('')}</select></label><button class="btn primary full">Save my pet ✨</button></form>`);
  }
  modalRoot.innerHTML = html;
  if (state.user && m.showAdd) modalRoot.querySelector('[data-model="main.newTitle"]')?.focus();
}

/* ---------------------------------------------------------------- events */

const actions = {
  'logout': logout,
  'toggle-dark': () => { state.dark = !state.dark; render(); },
  'open-add': () => { state.main.showAdd = true; renderModals(); },
  'close-add': () => { state.main.showAdd = false; renderModals(); },
  'open-edit-pet': () => { state.main.editingPet = true; renderModals(); },
  'close-edit-pet': () => { state.main.editingPet = false; renderModals(); },
  'dismiss-error': () => { state.main.error = ''; renderView(); },
  'complete': (el) => completeHabit(el.dataset.id),
  'delete': (el) => deleteHabit(el.dataset.id),
  'feed': (el) => feedPet(el.dataset.food),
  'play': playPet,
  'cuddle': petCuddle,
  'rest': restPet,
  'buy': (el) => buy(el.dataset.id),
  'go': (el) => navigate(el.dataset.href)
};

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-link]');
  if (link && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
    e.preventDefault();
    navigate(link.getAttribute('href'));
    return;
  }
  const el = e.target.closest('[data-action]');
  if (el && !el.disabled && actions[el.dataset.action]) actions[el.dataset.action](el);
});

// Clicking the dark backdrop (not the dialog itself) closes a modal.
document.addEventListener('mousedown', (e) => {
  if (e.target.classList?.contains('modal-backdrop')) actions[e.target.dataset.close]?.();
});

// Keep form inputs in state without re-rendering (so typing never loses focus).
function syncModel(e) {
  const key = e.target.dataset?.model;
  if (!key) return;
  const [group, field] = key.split('.');
  state[group][field] = e.target.value;
}
document.addEventListener('input', syncModel);
document.addEventListener('change', syncModel);

document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  if (form.dataset.form === 'auth') submitAuth(form);
  if (form.dataset.form === 'add-habit') addHabit();
  if (form.dataset.form === 'edit-pet') savePet();
});

window.addEventListener('popstate', render);

/* ------------------------------------------------------------------ boot */

render();
if (!getToken()) {
  state.checking = false;
  render();
} else {
  api('/auth/me')
    .then((d) => { state.user = d.user; })
    .catch(() => setToken(null))
    .finally(() => { state.checking = false; render(); });
}
