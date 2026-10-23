import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { api, getToken, setToken } from './api';
import { PawPrint, LayoutDashboard, ListChecks, Store, ChartNoAxesCombined, Settings, LogOut, Plus, Check, Trash2, Heart, Coins, Sparkles, ShoppingBag, Utensils, Cat, Moon, Sun, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const speciesEmoji = { cat: '🐱', fox: '🦊', bunny: '🐰' };
const foodOptions = [{ name: 'Berry Snack', emoji: '🍓', price: 5 }, { name: 'Crunchy Biscuit', emoji: '🍪', price: 8 }];
const todayLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

function Auth({ mode, onAuth }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify({ name, email, password }) });
      setToken(data.token); onAuth(data.user); nav('/');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="auth-wrap"><div className="auth-card">
    <div className="brand-mark large"><PawPrint size={28}/></div><p className="eyebrow">YOUR LITTLE DAILY COMPANION</p>
    <h1>{mode === 'register' ? 'Start your cozy journey' : 'Welcome back!'}</h1>
    <p className="muted">{mode === 'register' ? 'Build gentle habits, one paw at a time.' : 'Your pet has been waiting for you.'}</p>
    <form onSubmit={submit} className="stack-form">
      {mode === 'register' && <label>Your name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Mochi friend" required minLength={2}/></label>}
      <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8}/></label>
      {error && <p className="error">{error}</p>}
      <button className="btn primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create my account' : 'Log in'} <Sparkles size={16}/></button>
    </form>
    <p className="auth-switch">{mode === 'register' ? 'Already have an account?' : 'New to PetPal?'} <NavLink to={mode === 'register' ? '/login' : '/register'}>{mode === 'register' ? 'Log in' : 'Create an account'}</NavLink></p>
  </div><div className="auth-art"><div className="sun-glow"/><span className="floating-heart">♡</span><div className="big-pet">🐱</div><div className="speech">“Small steps are still progress!”</div><div className="tiny-stars">✦　✧　✦</div></div></div>;
}

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState('');
  const nav = useNavigate();
  useEffect(() => {
    if (!getToken()) { setChecking(false); return; }
    api('/auth/me').then(d=>setUser(d.user)).catch(()=>setToken(null)).finally(()=>setChecking(false));
  }, []);
  useEffect(() => { if (toast) { const t=setTimeout(()=>setToast(''), 2800); return ()=>clearTimeout(t); } }, [toast]);
  function logout() { setToken(null); setUser(null); nav('/login'); }
  if (checking) return <div className="loading-screen"><span className="loader-paw">🐾</span><p>Waking up your pet…</p></div>;
  return <div className={dark ? 'app-shell dark' : 'app-shell'}>
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace/> : <Auth mode="login" onAuth={setUser}/>}/>
      <Route path="/register" element={user ? <Navigate to="/" replace/> : <Auth mode="register" onAuth={setUser}/>}/>
      <Route path="/*" element={user ? <MainApp user={user} onUser={setUser} onLogout={logout} dark={dark} setDark={setDark} notify={setToast}/> : <Navigate to="/login" replace/>}/>
    </Routes>
    {toast && <div className="toast"><Sparkles size={17}/>{toast}</div>}
  </div>;
}

function MainApp({ user, onUser, onLogout, dark, setDark, notify }) {
  const [pet, setPet] = useState(null);
  const [habits, setHabits] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Study');
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState('cat');
  const [editingPet, setEditingPet] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [page, setPage] = useState('Dashboard');
  const [error, setError] = useState('');
  const [petAction, setPetAction] = useState('idle');
  const [activeFood, setActiveFood] = useState('🍓');
  const nav = useNavigate();

  async function refresh() {
    setLoading(true);
    try {
      const [h, p, a, s] = await Promise.all([api('/habits'), api('/pet'), api('/analytics'), api('/shop')]);
      setHabits(h.habits); setPet(p.pet); setPetName(p.pet.name); setPetSpecies(p.pet.species); setAnalytics(a); setItems(s.items);
      onUser(prev => prev ? { ...prev, coins: p.coins ?? prev.coins } : prev);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ refresh(); }, []);
  async function addHabit(e) {
    e.preventDefault(); if (!newTitle.trim()) return;
    try { await api('/habits', { method:'POST', body:JSON.stringify({ title:newTitle, category:newCategory }) }); setNewTitle(''); setShowAdd(false); await refresh(); notify('A new habit joined your journey!'); }
    catch(e) { notify(e.message); }
  }
  async function completeHabit(habit) {
    if (habit.completedToday || busyId) return;
    setBusyId(habit._id);
    try { const result = await api(`/habits/${habit._id}/complete`, { method:'POST', body:JSON.stringify({}) }); notify(result.message); await refresh(); }
    catch(e) { notify(e.message); }
    finally { setBusyId(''); }
  }
  async function deleteHabit(id) {
    if (!window.confirm('Remove this habit from your list?')) return;
    try { await api(`/habits/${id}`, { method:'DELETE' }); await refresh(); notify('Habit removed.'); } catch(e) { notify(e.message); }
  }
  async function feedPet(food='🍓') {
    setActiveFood(food); setPetAction('eating');
    try { const d=await api('/pet/feed',{method:'POST',body:JSON.stringify({})}); setPet(d.pet); onUser({...user,coins:d.coins}); notify(`${pet?.name || 'Your pet'} is happily eating ${food}!`); } catch(e){notify(e.message); setPetAction('idle'); return;}
    window.setTimeout(()=>setPetAction('idle'), 2400);
  }
  function playPet() { setPetAction('playing'); notify(`${pet?.name || 'Your pet'} is chasing the toy!`); window.setTimeout(()=>setPetAction('idle'), 2800); }
  function petCuddle() { setPetAction('loved'); notify(`♡ ${pet?.name || 'Your pet'} feels loved! Petting is always free.`); window.setTimeout(()=>setPetAction('idle'), 2600); }
  function restPet() { setPetAction('sleeping'); notify(`${pet?.name || 'Your pet'} is taking a cozy nap.`); window.setTimeout(()=>setPetAction('idle'), 3200); }
  async function savePet(e) {
    e.preventDefault();
    try { const d=await api('/pet',{method:'PATCH',body:JSON.stringify({name:petName,species:petSpecies})}); setPet(d.pet); setEditingPet(false); notify('Your pet’s profile has been updated!'); } catch(e){notify(e.message);}
  }
  async function buy(item) {
    try { const d=await api(`/shop/buy/${item._id}`,{method:'POST',body:JSON.stringify({})}); setPet(d.pet); onUser({...user,coins:d.coins}); if(item.category==='food'){setActiveFood(item.emoji||'🍓');setPetAction('eating');window.setTimeout(()=>setPetAction('idle'),2400);notify(`${pet?.name || 'Your pet'} is eating ${item.name}!`);} else {notify(d.message);} await refresh(); } catch(e){notify(e.message);}
  }
  const done = habits.filter(h=>h.completedToday).length;
  const rate = habits.length ? Math.round(done/habits.length*100) : 0;
  const owned = new Set((pet?.inventory || []).map(i=>typeof i === 'string' ? i : i._id));
  const navItems = [
    {label:'Dashboard', path:'/', icon:LayoutDashboard},
    {label:'My Habits', path:'/habits', icon:ListChecks},
    {label:'Pet Care', path:'/pet', icon:Heart},
    {label:'Rewards Shop', path:'/shop', icon:Store},
    {label:'My Progress', path:'/progress', icon:ChartNoAxesCombined},
    {label:'Settings', path:'/settings', icon:Settings}
  ];
  const titles = { '/':'Your cozy dashboard', '/habits':'Little steps, big progress', '/pet':'A little care goes a long way', '/shop':'Treat your tiny companion', '/progress':'Look how far you’ve come', '/settings':'Make PetPal yours' };
  return <div className="layout">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><PawPrint size={22}/></div><div><strong>petpal</strong><small>grow with your habits</small></div></div>
      <div className="side-profile"><div className="avatar">{user.name?.[0]?.toUpperCase() || 'F'}</div><div><strong>{user.name}</strong><small>Little steps club</small></div><span className="online-dot"/></div>
      <nav>{navItems.map(n=><NavLink key={n.path} to={n.path} end={n.path==='/'} className={({isActive})=>`nav-link ${isActive?'active':''}`}><n.icon size={18}/><span>{n.label}</span>{n.label==='My Habits'&&<span className="nav-count">{habits.length}</span>}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="mini-quote">“You don’t have to do it all. Just begin.”<span>♡</span></div><button className="nav-link plain" onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}<span>{dark?'Light mode':'Dark mode'}</span></button><button className="nav-link plain" onClick={onLogout}><LogOut size={18}/><span>Log out</span></button></div>
      <div className="sidebar-footer">made with ♡ for your growth</div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="mobile-brand"><PawPrint/> petpal</div><div className="breadcrumbs">Home <span>/</span> <strong>{navItems.find(n=>n.path===window.location.pathname)?.label || 'Dashboard'}</strong></div><div className="top-actions"><span className="date-pill">{todayLabel}</span><div className="coin-pill"><span>🪙</span><strong>{user.coins ?? 0}</strong></div><div className="avatar small">{user.name?.[0]?.toUpperCase()}</div></div></header>
      <div className="page-content">
        <div className="page-heading"><div><p className="eyebrow">A LITTLE PROGRESS EVERY DAY ✦</p><h1>{titles[window.location.pathname] || 'Your cozy dashboard'}</h1><p className="muted">Hi {user.name?.split(' ')[0]}, you’re doing better than you think. 🌷</p></div>{window.location.pathname!=='/settings'&&<button className="btn primary" onClick={()=>{setPage('add');setShowAdd(true)}}><Plus size={17}/> Add a habit</button>}</div>
        {error && <div className="inline-error">{error} <button onClick={()=>setError('')}><X size={14}/></button></div>}
        {loading ? <div className="loading-card">Gathering your little wins… 🐾</div> : <Routes>
          <Route path="/" element={<Dashboard user={user} pet={pet} habits={habits} analytics={analytics} rate={rate} done={done} completeHabit={completeHabit} busyId={busyId} onPetEdit={()=>setEditingPet(true)} onFeed={feedPet} petAction={petAction} activeFood={activeFood} onPlay={playPet} onCuddle={petCuddle} onRest={restPet} onAdd={()=>setShowAdd(true)} onShop={()=>nav('/shop')}/>}/>
          <Route path="/habits" element={<HabitsPage habits={habits} onComplete={completeHabit} onDelete={deleteHabit} busyId={busyId} onAdd={()=>setShowAdd(true)}/>}/>
          <Route path="/pet" element={<PetPage pet={pet} onEdit={()=>setEditingPet(true)} onFeed={feedPet} onPlay={playPet} onCuddle={petCuddle} onRest={restPet} petAction={petAction} activeFood={activeFood} coins={user.coins||0}/>}/>
          <Route path="/shop" element={<ShopPage items={items} owned={owned} onBuy={buy} coins={user.coins||0}/>}/>
          <Route path="/progress" element={<ProgressPage analytics={analytics} habits={habits}/>}/>
          <Route path="/settings" element={<SettingsPage user={user} pet={pet} onEdit={()=>setEditingPet(true)} onDark={()=>setDark(!dark)} dark={dark} onLogout={onLogout}/>}/>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>}
      </div>
      <footer className="main-footer">Remember: progress, not perfection. <span>♡</span></footer>
    </main>
    {showAdd && <Modal title="Add a little habit" onClose={()=>setShowAdd(false)}><form className="stack-form" onSubmit={addHabit}><label>Habit name<input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="e.g. Read for 20 minutes" maxLength={100} required/></label><label>Category<select value={newCategory} onChange={e=>setNewCategory(e.target.value)}><option>Study</option><option>Health</option><option>Productivity</option><option>Self-care</option><option>Other</option></select></label><button className="btn primary full"><Plus size={16}/> Create habit</button></form></Modal>}
    {editingPet && <Modal title="Your pet, your way" onClose={()=>setEditingPet(false)}><form className="stack-form" onSubmit={savePet}><label>Pet name<input value={petName} onChange={e=>setPetName(e.target.value)} maxLength={30} required/></label><label>Choose your companion<select value={petSpecies} onChange={e=>setPetSpecies(e.target.value)}><option value="cat">🐱 Cat</option><option value="fox">🦊 Fox</option><option value="bunny">🐰 Bunny</option></select></label><button className="btn primary full">Save my pet ✨</button></form></Modal>}
  </div>;
}

function Dashboard({user,pet,habits,analytics,rate,done,completeHabit,busyId,onPetEdit,onFeed,petAction,activeFood,onPlay,onCuddle,onRest,onAdd,onShop}) {
  const remaining = Math.max(0, habits.length-done);
  return <div className="dashboard-grid">
    <section className="welcome-banner"><div className="banner-copy"><span className="banner-chip"><Sparkles size={13}/> YOUR DAILY MAGIC</span><h2>Small steps.<br/><em>Big dreams.</em></h2><p>Every little thing you do helps you and your pet grow.</p><button className="btn light" onClick={onAdd}><Plus size={16}/> Add a habit</button></div><div className="banner-pet"><div className="pet-orbit orbit-one"/><div className="pet-orbit orbit-two"/><span className="banner-star star-a">✦</span><span className="banner-star star-b">✧</span><div className="hero-pet">{speciesEmoji[pet?.species||'cat']}</div><div className="pet-caption"><strong>{pet?.name||'Mochi'}</strong><span>your tiny cheerleader</span></div></div></section>
    <section className="stat-row">
      <Stat icon={<Check/>} label="Today's progress" value={`${rate}%`} note={`${done} of ${habits.length} habits`} color="pink"/>
      <Stat icon={<Sparkles/>} label="Pet level" value={pet?.level||1} note={`${pet?.xp||0} XP collected`} color="purple"/>
      <Stat icon={<Coins/>} label="Your coins" value={user.coins||0} note="Little rewards add up" color="yellow"/>
      <Stat icon={<Heart/>} label="Pet happiness" value={`${pet?.happiness??75}%`} note="Keep showing some love" color="mint"/>
    </section>
    <section className="panel habits-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR CHECKLIST</p><h3>Today's little wins</h3></div><button className="text-button" onClick={()=>window.location.href='/habits'}>See all →</button></div>
      {habits.length===0 ? <Empty title="A fresh little start" text="Add your first habit and begin collecting wins." action={onAdd}/> : <div className="habit-list">{habits.slice(0,5).map(h=><HabitRow key={h._id} habit={h} onComplete={()=>completeHabit(h)} busy={busyId===h._id}/>)}</div>}
      <div className="checklist-foot"><span>🌱 {remaining===0?'You did it!':`${remaining} more ${remaining===1?'habit':'habits'} to go`}</span><div className="progress-track"><span style={{width:`${rate}%`}}/></div><strong>{rate}%</strong></div>
    </section>
    <section className="panel pet-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR COMPANION</p><h3>Pet care corner</h3></div><button className="icon-btn" onClick={onPetEdit} aria-label="Edit pet"><Settings size={17}/></button></div><PetRoom pet={pet} action={petAction} food={activeFood} onFeed={onFeed} onPlay={onPlay} onCuddle={onCuddle} onRest={onRest} onShop={onShop}/></section>
    <section className="panel weekly-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR MOMENTUM</p><h3>This week</h3></div><span className="soft-badge">Last 7 days</span></div><div className="weekly-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={(analytics?.weekly||[]).map(d=>({...d,label:new Date(d.day+'T12:00:00').toLocaleDateString('en',{weekday:'short'})}))}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:11}}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:11}} width={24}/><Tooltip cursor={{fill:'var(--chart-hover)'}} contentStyle={{borderRadius:12,border:'1px solid var(--line)',background:'var(--panel)',color:'var(--text)'}}/><Bar dataKey="completed" name="Habits completed" fill="#a995f5" radius={[6,6,0,0]} maxBarSize={28}/></BarChart></ResponsiveContainer></div></section>
    <section className="quote-card"><span>✧</span><p>“You are allowed to grow at your own pace.”</p><small>A little reminder from PetPal</small></section>
  </div>;
}
function Stat({icon,label,value,note,color}) { return <div className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><small>{note}</small></div></div>; }
function HabitRow({habit,onComplete,busy,onDelete}) { return <div className={`habit-row ${habit.completedToday?'is-done':''}`}><button className={`check-circle ${habit.completedToday?'checked':''}`} onClick={onComplete} disabled={habit.completedToday||busy} aria-label={`Complete ${habit.title}`}>{habit.completedToday?<Check size={17}/>:busy?'…':null}</button><div className="habit-emoji">{({Study:'📚',Health:'💧',Productivity:'✨','Self-care':'🌷',Other:'🌱'})[habit.category]||'🌱'}</div><div className="habit-main"><strong>{habit.title}</strong><small>{habit.category}{habit.targetMinutes?` · ${habit.targetMinutes} min`:''}</small></div><span className="reward-label">+10 🪙</span>{onDelete&&<button className="icon-btn delete-btn" onClick={()=>onDelete(habit._id)} aria-label="Delete habit"><Trash2 size={16}/></button>}</div>; }
function HabitsPage({habits,onComplete,onDelete,busyId,onAdd}) { const done=habits.filter(h=>h.completedToday).length; return <div className="single-column"><div className="inline-summary"><div><strong>{done}/{habits.length}</strong><span>habits completed today</span></div><div className="summary-progress"><div className="progress-track"><span style={{width:`${habits.length?done/habits.length*100:0}%`}}/></div></div></div><section className="panel"><div className="panel-heading"><div><p className="eyebrow">ONE STEP AT A TIME</p><h3>Your daily habits</h3></div><button className="btn primary" onClick={onAdd}><Plus size={16}/> New habit</button></div>{habits.length?<div className="habit-list">{habits.map(h=><HabitRow key={h._id} habit={h} onComplete={()=>onComplete(h)} onDelete={onDelete} busy={busyId===h._id}/>)}</div>:<Empty title="Nothing on your list yet" text="Create a small habit to get started." action={onAdd}/>}</section><div className="gentle-note">🌼 <span>Gentle reminder: missing a day doesn't erase your progress. Start again whenever you're ready.</span></div></div>; }
function PetRoom({pet,action='idle',food='🍓',onFeed,onPlay,onCuddle,onRest,onShop}) {
  const messages={idle:'Come play with me? ♡',eating:'Nom nom… so yummy!',playing:'Catch me if you can!',loved:'Purrs and happy wiggles!',sleeping:'Zzz… sweet dreams'};
  return <div className="pet-game">
    <div className="pet-room-top"><div><span className="eyebrow">MOCHI’S LITTLE WORLD</span><h3>{pet?.name||'Mochi'}’s cozy room</h3></div><span className="pet-mood">{messages[action]||messages.idle}</span></div>
    <div className={`animated-room action-${action}`}><div className="room-window"><span>☀</span><i/><i/><i/></div><div className="room-shelf">✦　📚　🌱</div><div className="room-rug"/><div className={`living-pet species-${pet?.species||'cat'}`} aria-label={`${pet?.species||'cat'} pet animation`}><div className="pet-shadow"/><div className="pet-tail"/><div className="pet-body"/><div className="pet-head"><i className="ear ear-left"/><i className="ear ear-right"/><i className="eye eye-left"/><i className="eye eye-right"/><i className="pet-nose"/><i className="pet-mouth"/><i className="whisker whisker-left"/><i className="whisker whisker-right"/></div><div className="pet-leg leg-left"/><div className="pet-leg leg-right"/><span className="pet-cheek cheek-left"/><span className="pet-cheek cheek-right"/></div>{action==='eating'&&<div className="food-float">{food}<small>nom nom!</small></div>}{action==='playing'&&<div className="toy-ball">🧶</div>}{action==='loved'&&<><div className="love-float">♡　♥　♡</div><div className="love-float love-float-two">💗　💕</div><div className="love-note">I love you!</div></>}{action==='sleeping'&&<div className="sleep-float">Z z Z</div>}<div className="room-bowl">🥣<small>food bowl</small></div><div className="room-plush">🧸</div><div className="room-caption">{pet?.name||'Mochi'} <span>✦</span></div></div>
    <div className="pet-game-stats"><Meter label="Happiness" value={pet?.happiness??75} color="pink"/><Meter label="Energy" value={pet?.energy??70} color="purple"/></div>
    <div className="pet-game-actions"><button className="btn primary" onClick={()=>onFeed('🍓')}><Utensils size={16}/> Feed berry · 5 🪙</button><button className="btn secondary" onClick={onPlay}>🧶 Play</button><button className="btn outline cuddle-btn" onClick={onCuddle}>♡ Pet & cuddle · Free</button><button className="btn outline" onClick={onRest}>☾ Sleep</button><button className="btn outline" onClick={onShop}><ShoppingBag size={16}/> Shop</button></div>
  </div>;
}
function PetPage({pet,onEdit,onFeed,onPlay,onCuddle,onRest,petAction,activeFood,coins}) { return <div className="single-column"><PetRoom pet={pet} action={petAction} food={activeFood} onFeed={onFeed} onPlay={onPlay} onCuddle={onCuddle} onRest={onRest} onShop={()=>window.location.href='/shop'}/><section className="panel pet-profile-extra"><div className="panel-heading"><div><p className="eyebrow">YOUR LITTLE COMPANION</p><h3>Meet {pet?.name||'Mochi'}</h3></div><button className="btn outline" onClick={onEdit}>Change pet</button></div><div className="pet-level">✨ Level {pet?.level||1}<span>{pet?.xp||0} XP total</span></div><p className="muted">You have {coins} coins. Petting and cuddles are always free 💗. Complete your genuine daily habits to earn coins for snacks and toys.</p></section><section className="panel"><div className="panel-heading"><div><p className="eyebrow">A LITTLE LOVE</p><h3>How to care for your pet</h3></div></div><div className="care-tips"><div><span>📚</span><strong>Complete a habit</strong><p>Earn XP and make your pet happier.</p></div><div><span>🍓</span><strong>Feed your friend</strong><p>Watch the eating animation and see your pet react.</p></div><div><span>🎀</span><strong>Make it yours</strong><p>Choose a cat, fox, or bunny in Customize pet.</p></div></div></section></div>; }
function ShopPage({items,owned,onBuy,coins}) { return <div className="single-column"><div className="shop-banner"><div><p className="eyebrow">A LITTLE SOMETHING SPECIAL</p><h2>Little treats, big smiles ✨</h2><p>Food can be bought again whenever you have enough coins. Toys and accessories stay in your collection.</p></div><div className="shop-wallet">🪙 <strong>{coins}</strong><small>available coins</small></div></div><div className="shop-grid">{items.map(item=>{const isOwned=owned.has(item._id)&&item.category!=='food';return <div className="shop-item" key={item._id}><div className="shop-item-art">{item.emoji||'🎁'}{item.category==='food'&&<span className="owned-label">Consumable · repeat buy</span>}{isOwned&&<span className="owned-label">Owned ✓</span>}</div><div className="shop-item-info"><span className="item-category">{item.category}</span><h3>{item.name}</h3><p>{item.description}</p><div className="shop-item-bottom"><strong>🪙 {item.price}</strong><button className={`btn ${isOwned?'secondary':'primary'} small`} disabled={isOwned||coins<item.price} onClick={()=>onBuy(item)}>{isOwned?'Owned':coins<item.price?'Need coins':item.category==='food'?'Buy & feed':'Get item'}</button></div></div></div>})}</div>{!items.length&&<Empty title="The shelves are getting ready" text="Run the server seed command to add shop items."/>}</div>; }
function ProgressPage({analytics,habits}) { return <div className="single-column"><div className="stat-row progress-stats"><Stat icon={<Check/>} label="Completed today" value={analytics?.completedToday||0} note="little wins today" color="pink"/><Stat icon={<ListChecks/>} label="Active habits" value={analytics?.totalHabits||0} note="habits in your routine" color="purple"/><Stat icon={<Sparkles/>} label="All-time completions" value={analytics?.totalCompletions||0} note="every step counts" color="mint"/></div><section className="panel"><div className="panel-heading"><div><p className="eyebrow">YOUR WEEKLY STORY</p><h3>Habit completions</h3></div><span className="soft-badge">7 days</span></div><div className="large-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={(analytics?.weekly||[]).map(d=>({...d,label:new Date(d.day+'T12:00:00').toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})}))}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:12}}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:12}}/><Tooltip contentStyle={{borderRadius:12,border:'1px solid var(--line)',background:'var(--panel)',color:'var(--text)'}}/><Bar dataKey="completed" name="Completed habits" fill="#a995f5" radius={[7,7,0,0]} maxBarSize={45}/></BarChart></ResponsiveContainer></div></section><section className="panel"><div className="panel-heading"><div><p className="eyebrow">YOUR ROUTINE</p><h3>Habit list</h3></div></div>{habits.map(h=><div className="history-row" key={h._id}><span className="history-dot"/><div><strong>{h.title}</strong><small>{h.category}</small></div><span className={`status-pill ${h.completedToday?'complete':'pending'}`}>{h.completedToday?'Done today':'Still time'}</span></div>)}</section></div>; }
function SettingsPage({user,pet,onEdit,onDark,dark,onLogout}) { return <div className="single-column"><section className="panel settings-panel"><div className="settings-avatar">{user.name?.[0]?.toUpperCase()}</div><h2>{user.name}</h2><p className="muted">{user.email}</p><div className="settings-line"><div><strong>Pet profile</strong><small>{pet?.name||'Mochi'} · {pet?.species||'cat'}</small></div><button className="btn outline small" onClick={onEdit}>Edit</button></div><div className="settings-line"><div><strong>Appearance</strong><small>Switch between cozy light and dark themes</small></div><button className="btn secondary small" onClick={onDark}>{dark?'Light mode':'Dark mode'}</button></div><div className="settings-line"><div><strong>Account</strong><small>Sign out of your PetPal account</small></div><button className="btn outline small" onClick={onLogout}>Log out</button></div></section><div className="gentle-note">🔒 Your habits and pet are private to your account.</div></div>; }
function Meter({label,value,color}) { return <div className="meter"><div><span>{label}</span><strong>{value}%</strong></div><div className="meter-track"><span className={color} style={{width:`${value}%`}}/></div></div>; }
function Empty({title,text,action}) { return <div className="empty-state"><span>🌱</span><h3>{title}</h3><p>{text}</p>{action&&<button className="btn primary" onClick={action}><Plus size={16}/> Get started</button>}</div>; }
function Modal({title,children,onClose}) { return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal"><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>{children}</div></div>; }

export default App;
