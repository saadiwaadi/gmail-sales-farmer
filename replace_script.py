import os

# Paths
mockup_path = r"d:\Vs arsenal\Autobot salefarmer\ledger-crm-mockup.html"
target_path = r"d:\Vs arsenal\Sales Crm for bitlogic\bitlogic-server\public\app.html"

# Read original mockup
with open(mockup_path, "r", encoding="utf-8") as f:
    content = f.read()

# Javascript code to inject
js_code = """
let sidebarCollapsed = false;
function setSidebarCollapsed(collapsed){
  sidebarCollapsed = collapsed;
  const sidebar = document.querySelector('.sidebar-pill');
  if(sidebar){
    sidebar.classList.toggle('collapsed', collapsed);
  }
  document.documentElement.style.setProperty('--sidebar-w', collapsed ? '64px' : '260px');
}

const ICONS = {
  layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  pulse: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"><path d="M13 2L3 14h7l-1 8 11-14h-7l1-6z"/></svg>`,
  envelope: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  tag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.5 7.5 0 0 0 0-3l1.9-1.5-2-3.4-2.3.6a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.3-.6-2 3.4L4.6 10.5a7.5 7.5 0 0 0 0 3L2.7 15l2 3.4 2.3-.6c.76.66 1.64 1.17 2.6 1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.3.6 2-3.4z"/></svg>`
};

/* ---------------- data ---------------- */
let CONTACTS = [];
let AVAILABLE_TONES = [];
let ME = null;

async function loadContacts() {
  try {
    const res = await fetch('/api/contacts');
    if (res.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    const data = await res.json();
    const fetchedContacts = data.contacts || data || [];

    CONTACTS = await Promise.all(fetchedContacts.map(async (c) => {
      try {
        const msgRes = await fetch(`/api/contacts/${c.id}/messages`);
        const msgData = await msgRes.json();
        return {
          ...c,
          messages: msgData.messages || msgData || []
        };
      } catch (err) {
        console.error(`Failed to fetch messages for contact ${c.id}:`, err);
        return { ...c, messages: [] };
      }
    }));

    renderContacts();
    renderKanban();
    renderSignals();
    renderActivity();
    updateDashboardStats();

    // self-healing glow-urgent logic
    if (CONTACTS.some && CONTACTS.some(c => c.ai_status === 'FAILED')) {
      const contactsNavWrap = document.getElementById('contactsNavIconWrap');
      if (contactsNavWrap && !contactsNavWrap.querySelector('.glow-urgent')) {
        contactsNavWrap.insertAdjacentHTML('beforeend', '<span class="glow-urgent" style="position:absolute; top:-3px; right:-3px; width:8px; height:8px; border-radius:50%; background:var(--urgent); z-index:2;"></span>');
      }
    } else {
      const glowUrgent = document.querySelector('#contactsNavIconWrap .glow-urgent');
      if (glowUrgent) {
        glowUrgent.remove();
      }
    }
  } catch (err) {
    console.error('Failed to load contacts:', err);
  }
}

function updateDashboardStats() {
  const totalContacts = CONTACTS.length;
  const aiReady = CONTACTS.filter(c => c.ai_status === 'READY').length;
  
  let repliedThisWeek = 0;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  CONTACTS.forEach(c => {
    if (c.messages) {
      c.messages.forEach(m => {
        if (m.outcome === 'replied' && m.created_at && new Date(m.created_at) >= sevenDaysAgo) {
          repliedThisWeek++;
        }
      });
    }
  });

  const elTotal = document.getElementById('statTotalContacts');
  const elAiReady = document.getElementById('statAiReady');
  const elReplied = document.getElementById('statRepliedThisWeek');
  
  if (elTotal) elTotal.textContent = totalContacts;
  if (elAiReady) elAiReady.textContent = aiReady;
  if (elReplied) elReplied.textContent = repliedThisWeek;
}

const EMAIL_VARIANTS = [
  {
    subject:"A quiet week on the market — here's what moved",
    body:`<p class="greet">Hello,</p>
    <p>Inventory in Northside crept up just slightly this week — three new listings, none of them competing directly with what you've been watching. Rates held flat, which is the closest thing to good news we've had in a month.</p>
    <p>412 Ashwood Ln, the property a few of you asked about, is now scheduled for showings starting Thursday. If you'd like a private walkthrough before the weekend, reply here and I'll hold a slot.</p>
    <p>No pressure, no countdown clocks — just wanted you to hear it from me before it hits the portals.</p>
    <p class="greet">— Saad</p>`
  },
  {
    subject:"Two things worth knowing before the weekend",
    body:`<p class="greet">Hello,</p>
    <p>First: the Harrow St offer closed this morning, three percent over ask. It's a useful data point if you've been waiting for the market to "cool" before making a move — it isn't, not in this pocket.</p>
    <p>Second: I'm holding two private showings Saturday morning before either property goes public. Message me if either sounds worth an hour of your time.</p>
    <p>That's the whole note. Talk soon.</p>
    <p class="greet">— Saad</p>`
  }
];
let emailVariant = 0;
let currentContactId = null;

/* ---------------- API helper ---------------- */
async function api(method, url, body){
  const res = await fetch(url, {
    method,
    headers: body ? {'Content-Type':'application/json'} : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  if(res.status === 401){ window.location.href = '/login.html'; throw new Error('Not signed in'); }
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

/* ---------------- data dynamic builders ---------------- */
function deriveActivity() {
  return CONTACTS
    .filter(c => c.messages && c.messages.length > 0)
    .flatMap(c => c.messages.map(m => ({
      name: c.name,
      date: m.created_at,
      change: `${c.stage || 'Contact'} — ${m.tone_used || 'outreach'}`,
      value: '—',
      pos: m.outcome === 'replied' || m.outcome === 'booked'
    })))
    .slice(0, 5);
}

function deriveSignals() {
  return CONTACTS
    .filter(c => c.ai_status === 'READY')
    .slice(0, 4)
    .map(c => ({
      name: c.name,
      sub: c.extracted_profile?.recent_signals?.[0] || 'AI profile ready',
      score: c.score || '—',
      date: 'recent'
    }));
}

const STAGE_MAPPING = {
  'New Lead': 'Not Contacted',
  'Qualified': 'Research Done',
  'Showing': 'Drafted',
  'Offer': 'Sent',
  'Closed': 'Replied / Booked'
};
function mapStage(dbStage) {
  return STAGE_MAPPING[dbStage] || dbStage;
}

function buildKanbanData() {
  const board = {
    "Not Contacted": [],
    "Research Done": [],
    "Drafted": [],
    "Sent": [],
    "Replied / Booked": []
  };
  
  CONTACTS.forEach(c => {
    let stage = mapStage(c.stage || 'New Lead');
    if (!board[stage]) {
      board[stage] = [];
    }
    board[stage].push({
      name: c.name,
      prop: c.tag || `${c.role || 'Client'} @ ${c.company || 'Home'}`,
      value: c.score ? `$${(c.score * 10000).toLocaleString()}` : '$0'
    });
  });
  
  return board;
}

/* ---------------- render helpers ---------------- */
function fmtDelta(pos, value){ return pos ? `<span class="amt-pos">${value}</span>` : `<span class="amt-neg">${value}</span>`; }

function renderActivity(){
  const tbody = document.getElementById('activityTable');
  const activityData = deriveActivity();
  if (activityData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:2rem; opacity:0.25;">
      <div style="margin-bottom:0.5rem;">${ICONS.pulse.replace('style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"', 'style="width:32px; height:32px; display:block; margin:0 auto; color:var(--text-3);"')}</div>
      <div class="cell-muted">No recent activity</div>
    </td></tr>`;
    return;
  }
  tbody.innerHTML = activityData.map(a => `
    <tr data-open-contact="${a.name}">
      <td class="cell-primary">${a.name}</td>
      <td class="cell-muted">${a.date ? new Date(a.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'Recent'}</td>
      <td>${a.change}</td>
      <td style="text-align:right">${fmtDelta(a.pos, a.value)}</td>
    </tr>
  `).join('');
}

function renderSignals(){
  const wrap = document.getElementById('signalsList');
  const signalsData = deriveSignals();
  if (signalsData.length === 0) {
    wrap.innerHTML = `<div style="text-align:center; padding:2rem; opacity:0.25;">
      <div style="margin-bottom:0.5rem;">${ICONS.bolt.replace('style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"', 'style="width:32px; height:32px; display:block; margin:0 auto; color:var(--text-3);"')}</div>
      <div class="cell-muted">No signals recorded</div>
    </div>`;
    return;
  }
  wrap.innerHTML = signalsData.map(s => `
    <div class="signal-row" data-open-contact="${s.name}">
      <div class="signal-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2L3 14h7l-1 8 11-14h-7l1-6z"/></svg>
      </div>
      <div class="signal-mid">
        <div class="signal-name">${s.name}</div>
        <div class="signal-sub">${s.sub}</div>
      </div>
      <div class="signal-right">
        <div class="signal-score">${s.score}</div>
        <div class="signal-date">${s.date}</div>
      </div>
    </div>
  `).join('');
}

const AI_STATUS_LABELS = {
  "NOT_STARTED": "Not started",
  "PROCESSING": "Generating…",
  "READY": "Ready",
  "FAILED": "Failed",
  "QUEUED": "Queued"
};

function aiStatusBadge(status){
  const cls = (status || 'NOT_STARTED').toLowerCase();
  const glow = (status === 'PROCESSING' || status === 'QUEUED') ? ' glow-amber' : '';
  return `<span class="ai-status-badge ${cls}${glow}"><span class="sdot"></span>${AI_STATUS_LABELS[status] || status}</span>`;
}

function renderContacts(filter='all'){
  const tbody = document.getElementById('contactsTable');
  const rows = CONTACTS.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'replied') {
      return c.messages && c.messages.some(m => m.outcome === 'replied');
    }
    const typeMapping = {
      'cold': 'buyer',
      'warm': 'seller',
      'active': 'nurture'
    };
    return c.type === (typeMapping[filter] || filter);
  });
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; opacity:0.25;">
      <div style="margin-bottom:0.5rem;">${ICONS.user.replace('style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"', 'style="width:32px; height:32px; display:block; margin:0 auto; color:var(--text-3);"')}</div>
      <div class="cell-muted">No contacts found</div>
    </td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(c => `
    <tr data-open-contact="${c.name}">
      <td>${aiStatusBadge(c.ai_status || 'NOT_STARTED')}</td>
      <td class="cell-primary">${c.name}</td>
      <td class="cell-muted" style="text-transform:capitalize">${c.type || 'buyer'}</td>
      <td>${mapStage(c.stage || 'New Lead')}</td>
      <td class="cell-muted">${c.last || 'Never'}</td>
      <td style="text-align:right" class="cell-muted">${c.score || 50}</td>
    </tr>
  `).join('');
}

function renderKanban(filter='all'){
  const board = document.getElementById('kanbanBoard');
  const kanbanData = buildKanbanData();
  board.innerHTML = Object.entries(kanbanData).map(([stage, cards]) => {
    const filteredCards = cards.filter(card => {
      if (filter === 'all') return true;
      const contact = CONTACTS.find(ct => ct.name === card.name);
      if (!contact) return false;
      if (filter === 'replied') {
        return contact.messages && contact.messages.some(m => m.outcome === 'replied');
      }
      const typeMapping = {
        'cold': 'buyer',
        'warm': 'seller',
        'active': 'nurture'
      };
      return contact.type === (typeMapping[filter] || filter);
    });
    
    const total = filteredCards.reduce((s,c) => s + Number(c.value.replace(/[$,]/g,'')), 0);
    const cardsHtml = filteredCards.length === 0 ? `
      <div style="text-align:center; padding:1.5rem; opacity:0.25; border:1px dashed var(--border); border-radius:var(--radius-m); margin-bottom:0.5rem;">
        <div style="margin-bottom:0.5rem;">${ICONS.tag.replace('style="width:14px; height:14px; display:inline-block; color:var(--text-3); vertical-align:middle; margin-right:0.4rem;"', 'style="width:32px; height:32px; display:block; margin:0 auto; color:var(--text-3);"')}</div>
        <div style="font-size:0.72rem;" class="cell-muted">No active deals</div>
      </div>` : filteredCards.map(c => {
        const contact = CONTACTS.find(ct => ct.name === c.name);
        const isFailed = contact && contact.ai_status === 'FAILED';
        const failTag = isFailed ? `<span class="glow-rust" style="position:absolute; top:0.7rem; right:0.7rem; width:12px; height:12px; border-radius:50%; background:var(--rust); z-index:2;" title="AI Pipeline Failed"></span>` : '';
        return `
        <div class="kcard glass" data-open-contact="${c.name}">
          <div class="glass-edge"></div>
          ${failTag}
          <div class="kcard-name">${c.name}</div>
          <div class="kcard-prop">${c.prop}</div>
          <div class="kcard-foot">
            <span class="kcard-value">${c.value}</span>
            <span class="status ready"><span class="sdot"></span></span>
          </div>
        </div>`;
      }).join('');
    return `
    <div class="kcol">
      <div class="kcol-head">
        <div class="kcol-title" style="display:flex; align-items:center;">${ICONS.tag}${stage}</div>
        <div class="kcol-value">$${total.toLocaleString()}</div>
      </div>
      ${cardsHtml}
      <button class="kcol-add" data-add-stage="${stage}">+ Add deal</button>
    </div>`;
  }).join('');
  applyGlowAndGlass(board);
}

function renderBars(){
  const data = [
    {m:"Feb", v:38}, {m:"Mar", v:52}, {m:"Apr", v:41}, {m:"May", v:66},
    {m:"Jun", v:58}, {m:"Jul", v:74}, {m:"Aug", v:47},
  ];
  const max = Math.max(...data.map(d=>d.v));
  const wrap = document.getElementById('barsChart');
  wrap.innerHTML = data.map(d => `
    <div class="bar-col" data-toast="ready|${d.m}: $${(d.v*61).toLocaleString()}0 closed across ${Math.round(d.v/12)} deals.">
      <div class="bar-fill" style="height:${(d.v/max*100)}%"></div>
      <div class="bar-label">${d.m}</div>
    </div>
  `).join('');
}

/* ---------------- toasts ---------------- */
function toast(kind, msg){
  const box = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast';
  const color = kind==='attn' ? 'var(--rust)' : kind==='processing' ? 'var(--amber)' : 'var(--accent)';
  el.innerHTML = `<span class="sdot" style="background:${color}"></span><span>${msg}</span>`;
  box.appendChild(el);
  setTimeout(()=>{ el.classList.add('leaving'); setTimeout(()=>el.remove(), 320); }, 3200);
}

/* ---------------- slideover / modal ---------------- */
const overlay = document.getElementById('overlay');
const slideover = document.getElementById('slideover');
const modalWrap = document.getElementById('modalWrap');

function openSlideover(title, sub, html){
  const actions = document.getElementById('soHeadActions');
  if(actions) actions.innerHTML = '';
  document.getElementById('soTitle').textContent = title;
  document.getElementById('soSub').textContent = sub || '';
  document.getElementById('soBody').innerHTML = html;
  overlay.classList.add('show');
  slideover.classList.add('show');
  applyGlowAndGlass(slideover);
}
function closeSlideover(){
  overlay.classList.remove('show');
  slideover.classList.remove('show');
}
function openModal(html){
  document.getElementById('modalInner').innerHTML = html;
  overlay.classList.add('show');
  modalWrap.classList.add('show');
  applyGlowAndGlass(modalWrap);
}
function closeModal(){
  overlay.classList.remove('show');
  modalWrap.classList.remove('show');
}
overlay.addEventListener('click', ()=>{ closeSlideover(); closeModal(); });
document.getElementById('soClose').addEventListener('click', closeSlideover);

function renderToneSelect(c) {
  const sanitizedName = c.name.replace(/[^a-zA-Z0-9]/g, '-');
  const toneOptions = AVAILABLE_TONES.map(tone => {
    return `<option value="${tone}" ${c.tone_note === tone ? 'selected' : ''}>${tone}</option>`;
  }).join('');
  return `
    <div class="field" style="margin-top:0.9rem;">
      <label style="display:block; font-size:0.7rem; color:var(--text-3); margin-bottom:0.4rem;">Tone note</label>
      <select class="tone-select" data-tone-for="${c.name}">
        <option value="" ${!c.tone_note ? 'selected' : ''}>Not set</option>
        ${toneOptions}
      </select>
      <div id="tonePill-${sanitizedName}" class="${c.tone_note ? '' : 'hidden'}" style="display:inline-block; margin-top:0.4rem; background:var(--accent-dim); color:var(--accent); border-radius:99px; padding:0.25rem 0.6rem; font-size:0.68rem; pointer-events:none;">
        ${c.tone_note || ''}
      </div>
    </div>
  `;
}

/* ---------------- contact profile ---------------- */
async function openContact(name){
  const found = CONTACTS.find(x=>x.name===name);
  if (!found) return;
  
  try {
    const res = await api('GET', `/api/contacts/${found.id}`);
    const c = res.contact;
    const idx = CONTACTS.findIndex(x => x.id === c.id);
    if (idx !== -1) {
      CONTACTS[idx] = c;
    }
    
    openSlideover(c.name, `${c.type ? c.type.toUpperCase() : 'BUYER'} · ${mapStage(c.stage || 'New Lead')} · Score: ${c.score || 50}`, `
      <div class="profile-name">${c.name}</div>
      <div style="margin-bottom:0.5rem;" class="ai-status-container">${aiStatusBadge(c.ai_status || 'NOT_STARTED')}</div>
      <div class="profile-tag">${c.role ? c.role + ' @ ' + c.company : c.company}</div>

      <div class="kv-row"><span class="k">Stage</span><span>${mapStage(c.stage || 'New Lead')}</span></div>
      <div class="kv-row"><span class="k">Lead score</span><span>${c.score || 50}</span></div>
      <div class="kv-row"><span class="k">Last contact</span><span>${c.last || 'Never'}</span></div>
      <div class="kv-row"><span class="k">Email</span><span>${c.email || '—'}</span></div>

      ${renderToneSelect(c)}

      <div class="divider-label"><span>Activity</span><div class="rule"></div></div>
      <div class="timeline">
        <div class="tl-item mint"><div><div class="tl-text">Profile loaded from database</div><div class="tl-date">Just now</div></div></div>
        <div class="tl-item"><div><div class="tl-text">AI Pipeline status: ${c.ai_status || 'NOT_STARTED'}</div><div class="tl-date">Sync status</div></div></div>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" data-gen-followup="${c.name}">Generate follow-up</button>
        <button class="btn btn-outline" data-extract-profile="${c.id}">AI Extract Profile</button>
        <button class="btn btn-ghost" data-copy="${c.email || ''}">Copy email</button>
      </div>
    `);
    
    const actions = document.getElementById('soHeadActions');
    if(actions){
      actions.innerHTML = `<button class="btn btn-outline" data-open-full="${c.name}" style="padding:0.35rem 0.6rem; font-size:0.72rem;">Open full profile →</button>`;
    }
  } catch (err) {
    console.error('Error loading contact details:', err);
    toast('attn', 'Failed to load contact details.');
  }
}

let returnToView = 'dashboard';

async function openFullProfile(name){
  const found = CONTACTS.find(x => x.name === name);
  if(!found) return;
  
  try {
    const res = await api('GET', `/api/contacts/${found.id}`);
    const c = res.contact;
    currentContactId = c.id;
    const idx = CONTACTS.findIndex(x => x.id === c.id);
    if (idx !== -1) {
      CONTACTS[idx] = c;
    }

    // Track origin view
    const activeNav = document.querySelector('.nav-item.active:not(.segment-item)');
    if(activeNav) {
      const actV = activeNav.dataset.view;
      if (actV !== 'contact-full') {
        returnToView = actV;
      }
    }

    document.getElementById('fpName').textContent = c.name;
    document.getElementById('fpTag').textContent = `${(c.type || 'buyer').toUpperCase()} · ${mapStage(c.stage || 'New Lead')} · Score: ${c.score || 50}`;
    document.getElementById('fpStatus').innerHTML = aiStatusBadge(c.ai_status);
    
    // Render panels
    document.getElementById('fp-profile').innerHTML = renderFpProfile(c);
    document.getElementById('fp-outreach').innerHTML = renderFpOutreach(c);
    document.getElementById('fp-history').innerHTML = renderFpHistory(c);
    
    // Activate default profile tab
    document.querySelectorAll('.fp-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === 'profile');
    });
    document.querySelectorAll('.fp-panel').forEach(panel => {
      panel.classList.toggle('hidden', panel.id !== 'fp-profile');
    });

    // Hide all other views
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-contact-full').classList.remove('hidden');
    
    // Update view title and subtitle
    document.getElementById('viewTitle').textContent = "Full Profile";
    document.getElementById('viewSub').textContent = `Details, message logs, and activity timeline for ${c.name}`;
    
    closeSlideover();
  } catch (err) {
    console.error('Error loading full profile:', err);
    toast('attn', 'Failed to load full profile.');
  }
}

function renderFpProfile(c) {
  const renderChips = (arr) => {
    if (!arr || arr.length === 0) return '<span class="cell-muted">—</span>';
    return arr.map(txt => `<span class="chip active" style="margin-right:0.3rem; margin-bottom:0.3rem; display:inline-block; border-radius:99px; padding:0.25rem 0.6rem; font-size:0.68rem; border:none; background:var(--accent-dim); color:var(--accent); cursor:default;">${txt}</span>`).join('');
  };
  const ep = c.extracted_profile || { pain_points_inferred: [], recent_signals: [], tone_of_voice: "—", credibility_signals: [], likely_priorities: [], avoid_mentioning: [] };
  
  return `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; align-items: start; margin-bottom: 1.5rem;">
      <div class="card glass" style="padding:1.4rem; display:flex; flex-direction:column; gap:1.1rem;">
        <div class="glass-edge"></div>
        <div class="kv-row"><span class="k">Tone of voice</span><span>${ep.tone_of_voice || '—'}</span></div>
        <div class="kv-row" style="flex-direction:column; align-items:flex-start; gap:0.4rem;">
          <span class="k">Inferred Pain Points</span>
          <div>${renderChips(ep.pain_points_inferred)}</div>
        </div>
        <div class="kv-row" style="flex-direction:column; align-items:flex-start; gap:0.4rem;">
          <span class="k">Recent Signals</span>
          <div>${renderChips(ep.recent_signals)}</div>
        </div>
        <div class="kv-row" style="flex-direction:column; align-items:flex-start; gap:0.4rem;">
          <span class="k">Credibility Signals</span>
          <div>${renderChips(ep.pitch_points_used || ep.credibility_signals)}</div>
        </div>
        <div class="kv-row" style="flex-direction:column; align-items:flex-start; gap:0.4rem;">
          <span class="k">Likely Priorities</span>
          <div>${renderChips(ep.likely_priorities)}</div>
        </div>
        <div class="kv-row" style="flex-direction:column; align-items:flex-start; gap:0.4rem;">
          <span class="k">Avoid Mentioning</span>
          <div>${renderChips(ep.avoid_mentioning)}</div>
        </div>
        
        ${renderToneSelect(c)}
      </div>

      <div class="card glass" style="padding:1.4rem; display:flex; flex-direction:column; gap:1.1rem;">
        <div class="glass-edge"></div>
        <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-1);">Raw Research Dump</div>
        <textarea id="fpRawDumpTextarea" style="width:100%; height:250px; background:var(--panel-sunk); border:1px solid var(--border); border-radius:var(--radius-s); padding:0.7rem; color:var(--text-1); font-family:var(--mono); font-size:0.75rem; line-height:1.4; outline:none; resize:none;">${c.raw_dump || c.raw_research_dump || ''}</textarea>
        <div style="display:flex; gap:0.75rem; margin-top:0.5rem;">
          <button class="btn btn-primary" id="saveRawDumpBtn" data-contact-id="${c.id}" style="flex:1; justify-content:center;">Save Dump</button>
          <button class="btn btn-outline" id="reextractAiBtn" data-contact-id="${c.id}" style="flex:1; justify-content:center;">Re-extract via AI</button>
        </div>
      </div>
    </div>
  `;
}

function renderFpOutreach(c) {
  const latestMessage = c.messages && c.messages.length > 0 ? c.messages[0] : null;
  const isDraft = latestMessage && (latestMessage.outcome === 'no_response' || !latestMessage.outcome);
  const subjectText = isDraft ? (latestMessage.subject_line || latestMessage.subject || '') : '';
  const bodyText = isDraft ? (latestMessage.body || '') : '';

  if (isDraft) {
    return `
      <div class="card glass" style="padding:1.4rem; display:flex; flex-direction:column; gap:1rem; margin-bottom:1.5rem;">
        <div class="glass-edge"></div>
        <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-1);">Outreach Draft Composer</div>
        <div class="field">
          <label>Subject Line</label>
          <input id="fpOutreachSubject" value="${subjectText}" placeholder="Enter subject line..." style="width: 100%; padding: 0.5rem; background: var(--panel-sunk); border: 1px solid var(--border); border-radius: var(--radius-s); color: var(--text-1); outline: none;" />
        </div>
        <div class="field">
          <label>Email Body</label>
          <textarea id="fpOutreachBody" style="width: 100%; height: 14rem; background: var(--panel-sunk); border: 1px solid var(--border); border-radius: var(--radius-s); color: var(--text-1); font-family: var(--sans); font-size: 0.82rem; line-height: 1.5; padding: 0.8rem; resize: vertical; outline: none;" placeholder="Enter email body...">${bodyText}</textarea>
        </div>
        <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
          <button class="btn btn-primary" id="saveDraftBtn" data-msg-id="${latestMessage.id}" style="flex:1; justify-content:center;">Save Draft</button>
          <button class="btn btn-outline" id="regenerateDraftBtn" data-contact-id="${c.id}" data-tone="${c.tone_note || ''}" style="flex:1; justify-content:center;">Regenerate Draft</button>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="card glass" style="padding:3rem; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1.2rem; margin-bottom:1.5rem;">
        <div class="glass-edge"></div>
        <div style="color:var(--text-3); font-size:0.9rem; text-align:center;">
          No active outreach draft exists for this contact.
        </div>
        <button class="btn btn-primary" id="regenerateDraftBtn" data-contact-id="${c.id}" data-tone="${c.tone_note || ''}" style="justify-content:center;">
          Generate Email Draft
        </button>
      </div>
    `;
  }
}

function renderFpHistory(c) {
  const badgeColors = {
    booked: 'background:var(--accent-dim); color:var(--accent);',
    replied: 'background:var(--accent-dim); color:var(--accent);',
    opened: 'background:var(--amber-dim); color:var(--amber);',
    no_response: 'background:var(--border-soft); color:var(--text-3);',
    rejected: 'background:var(--rust-dim); color:var(--rust);'
  };

  const outcomeOptions = [
    { value: 'no_response', label: 'No response' },
    { value: 'opened', label: 'Opened' },
    { value: 'replied', label: 'Replied' },
    { value: 'booked', label: 'Booked' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const msgList = (c.messages || []).map(msg => {
    const icon = ICONS.envelope;
    const outcomeVal = msg.outcome || 'no_response';
    const badgeStyle = badgeColors[outcomeVal] || badgeColors.no_response;
    const subject = msg.subject || msg.subject_line || 'No Subject';
    const dateStr = msg.created_at ? new Date(msg.created_at).toLocaleDateString() : 'Just now';
    const outcomeSyncedStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : 'Just now';

    const selectOptions = outcomeOptions.map(opt => `
      <option value="${opt.value}" ${outcomeVal === opt.value ? 'selected' : ''} style="background:var(--panel-raised); color:var(--text-1);">
        ${opt.label}
      </option>
    `).join('');
    
    return `
      <div class="card glass msg-row" style="margin-bottom:0.7rem; padding:0.85rem;" data-msg-id="${msg.id}">
        <div class="glass-edge"></div>
        <div class="msg-row-summary" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer; gap:0.6rem;">
          <div style="display:flex; align-items:center; gap:0.65rem; min-width:0; flex:1;">
            <span style="color:var(--text-3); flex-shrink:0; display:inline-flex; align-items:center;">${icon}</span>
            <span style="font-weight:500; font-size:0.8rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${subject}</span>
          </div>
          <div style="display:flex; align-items:center; gap:0.65rem; flex-shrink:0;">
            <select class="msg-outcome-select" onclick="event.stopPropagation()" data-msg-id="${msg.id}" style="border:none; outline:none; cursor:pointer; border-radius:99px; padding:0.15rem 0.5rem; font-size:0.65rem; ${badgeStyle}">
              ${selectOptions}
            </select>
            <span style="font-size:0.68rem; color:var(--text-3); font-family:var(--mono);">${dateStr}</span>
          </div>
        </div>
        <div class="msg-row-details hidden" style="margin-top:1rem; border-top:1px solid var(--border-soft); padding-top:0.9rem;">
          <div class="read-block" style="font-size:0.85rem; line-height:1.5; margin-bottom:0.9rem;">
            ${msg.body}
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.7rem;">
            <span class="cell-muted">Synced: ${outcomeSyncedStr}</span>
            <button class="btn btn-outline resync-msg-btn" data-msg-id="${msg.id}" style="padding:0.25rem 0.45rem; font-size:0.65rem;">
              Force resync
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="display:flex; flex-direction:column; gap:1.5rem; margin-bottom:1.5rem;">
      <div class="card glass" style="padding:1.4rem;">
        <div class="glass-edge"></div>
        <div class="card-title" style="margin-bottom:1.2rem;">Message Logs & Outcomes</div>
        <div class="msg-history-list">
          ${msgList || '<div class="cell-muted" style="text-align:center; padding:2rem;">No messages sent.</div>'}
        </div>
      </div>

      <div class="card glass" style="padding:1.4rem;">
        <div class="glass-edge"></div>
        <div class="card-title" style="margin-bottom:1.2rem;">Activity Timeline</div>
        <div class="timeline" style="margin-left:1.5rem;">
          <div class="tl-item mint"><div><div class="tl-text">Profile loaded from DB</div><div class="tl-date">Just now</div></div></div>
          <div class="tl-item mint"><div><div class="tl-text">AI status synced: ${c.ai_status}</div><div class="tl-date">Status update</div></div></div>
          <div class="tl-item"><div><div class="tl-text">Registered as active ${c.type || 'buyer'} stage: ${mapStage(c.stage || 'New Lead')}</div><div class="tl-date">Created</div></div></div>
        </div>
      </div>
    </div>
  `;
}

/* ---------------- CSV lead import ---------------- */
function parseCSV(text) {
  const lines = text.split('\\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((h, idx) => {
      let key = h;
      if (h.includes('name')) key = 'name';
      else if (h.includes('company')) key = 'company';
      else if (h.includes('role')) key = 'role';
      else if (h.includes('industry')) key = 'industry';
      else if (h.includes('email')) key = 'email';
      else if (h.includes('type')) key = 'type';
      else if (h.includes('stage')) key = 'stage';
      else if (h.includes('score')) key = 'score';
      else if (h.includes('dump') || h.includes('raw')) key = 'raw_dump';
      
      row[key] = values[idx] || '';
    });
    row.role = row.role || '';
    row.industry = row.industry || '';
    
    if (!row.name && values[0]) {
      row.name = values[0];
      row.company = values[1] || 'Unknown';
      row.email = values[2] || '';
      row.type = values[3] || 'buyer';
      row.stage = values[4] || 'New Lead';
      row.score = Number(values[5]) || 50;
      row.raw_dump = values[6] || `Imported contact: ${row.name}`;
    }
    
    if (!row.name) continue;
    rows.push(row);
  }
  return rows;
}

function openImportWizard() {
  openModal(`
    <div class="card-title" style="margin-bottom:1rem; display:flex; align-items:center;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px; height:14px; margin-right:0.4rem; color:var(--accent);"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>
      Import Leads
    </div>
    <div class="import-dropzone" id="importDropzone" style="margin-bottom:1rem; border:1px dashed var(--border); border-radius:var(--radius-m); padding:2rem; text-align:center; cursor:pointer;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:28px; height:28px; color:var(--text-3); margin-bottom:0.5rem;"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>
      <div style="font-size:0.8rem; font-weight:500;">Click to upload CSV file</div>
      <div class="cell-muted" style="font-size:0.68rem; margin-top:0.2rem;">Or paste CSV text below</div>
      <input type="file" id="csvFileInput" accept=".csv" style="display:none;">
    </div>
    <div class="field">
      <textarea id="csvInput" placeholder="name,company,email,type,stage,score,raw_dump\\nAlex Rivera,Westside relocator,alex@mail.com,buyer,New Lead,64,Relocating to Westside condo" style="width:100%; height:120px; background:var(--panel-sunk); border:1px solid var(--border); border-radius:var(--radius-s); padding:0.6rem; color:var(--text-1); font-family:var(--mono); font-size:0.75rem; outline:none; resize:none;"></textarea>
    </div>
    <div class="btn-row" style="justify-content:flex-end; gap:0.5rem;">
      <button class="btn btn-primary" id="confirmImportBtn">Parse &amp; Import</button>
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    </div>
  `);
  
  const dropzone = document.getElementById('importDropzone');
  const fileInput = document.getElementById('csvFileInput');
  if (dropzone && fileInput) {
    dropzone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          document.getElementById('csvInput').value = evt.target.result;
        };
        reader.readAsText(file);
      }
    };
  }
}

/* ---------------- generate AI follow-up draft ---------------- */
async function generateAiDraft(contactId, tone) {
  const contact = CONTACTS.find(c => c.id === contactId);
  if (!contact) return;

  contact.ai_status = 'PROCESSING';
  refreshAll();
  const fpStatus = document.getElementById('fpStatus');
  if (fpStatus) fpStatus.innerHTML = aiStatusBadge('PROCESSING');

  openModal(`
    <div class="card-head" style="margin-bottom:0.6rem;">
      <div class="status processing" id="genStatus"><span class="sdot"></span>AI is drafting email…</div>
      <button class="icon-btn" onclick="closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div style="font-size:0.7rem; color:var(--text-3); margin-bottom:0.4rem;">Subject</div>
    <div style="font-family:var(--serif); font-size:1.05rem; margin-bottom:1rem;" id="genSubject">Generating subject line...</div>
    <div class="read-block" id="genBody" style="opacity:0.3; min-height:100px;">Please wait while the AI generates a draft using the "${tone}" tone. This may take 5-15 seconds...</div>
    <div class="btn-row">
      <button class="btn btn-primary" id="sendDraftBtn" style="display:none;" onclick="closeModal()">Send to ${contact.name}</button>
      <button class="btn btn-outline" id="regenBtn" data-regen-for="${contact.name}" style="display:none;">Regenerate</button>
      <button class="btn btn-ghost" id="copyDraftBtn" style="display:none;">Copy text</button>
    </div>
  `);

  try {
    const res = await api('POST', `/api/contacts/${contactId}/draft`, { tone });
    
    const status = document.getElementById('genStatus');
    const subjectEl = document.getElementById('genSubject');
    const bodyEl = document.getElementById('genBody');
    const sendBtn = document.getElementById('sendDraftBtn');
    const regenBtn = document.getElementById('regenBtn');
    const copyBtn = document.getElementById('copyDraftBtn');

    if (status) {
      status.className = 'status ready';
      status.innerHTML = '<span class="sdot"></span>Ready to send';
    }
    if (subjectEl) {
      subjectEl.textContent = res.subject;
    }
    if (bodyEl) {
      bodyEl.innerHTML = res.body;
      bodyEl.style.transition = 'opacity 0.5s ease';
      bodyEl.style.opacity = '1';
    }
    
    if (sendBtn) {
      sendBtn.style.display = 'inline-flex';
      sendBtn.onclick = () => {
        closeModal();
        toast('ready', `Email sent to ${contact.name}.`);
      };
    }
    if (regenBtn) {
      regenBtn.style.display = 'inline-flex';
    }
    if (copyBtn) {
      copyBtn.style.display = 'inline-flex';
      copyBtn.dataset.copy = `${res.subject}\\n\\n${res.body.replace(/<[^>]*>/g, '')}`;
    }

    await loadContacts();
    
    const fullProfileView = document.getElementById('view-contact-full');
    if (fullProfileView && !fullProfileView.classList.contains('hidden')) {
      const detailsRes = await api('GET', `/api/contacts/${contactId}`);
      const updatedContact = detailsRes.contact;
      const idx = CONTACTS.findIndex(x => x.id === updatedContact.id);
      if (idx !== -1) {
        CONTACTS[idx] = updatedContact;
      }
      document.getElementById('fp-messages').innerHTML = renderFpMessages(updatedContact);
    }
  } catch (err) {
    console.error('Draft generation error:', err);
    const bodyEl = document.getElementById('genBody');
    const status = document.getElementById('genStatus');
    if (status) {
      status.className = 'status attn';
      status.innerHTML = '<span class="sdot"></span>Failed to generate';
    }
    if (bodyEl) {
      bodyEl.innerHTML = `<p style="color:var(--rust)">Error generating email draft: ${err.message || err}</p>`;
      bodyEl.style.opacity = '1';
    }
  }
}

async function triggerExtraction(contactId) {
  toast('processing', 'Starting AI Profile Extraction...');
  try {
    await api('POST', `/api/contacts/${contactId}/extract`);
    toast('ready', 'Extraction started in background.');
    await loadContacts();
    const found = CONTACTS.find(x => x.id == contactId);
    if (found) {
      openContact(found.name);
    }
  } catch (err) {
    console.error('Extraction error:', err);
    toast('attn', 'Failed to trigger extraction.');
  }
}

function openModalForNewDeal(presetStage = 'New Lead') {
  openModal(`
    <div class="card-title" style="margin-bottom:1rem; display:flex; align-items:center;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px; height:14px; margin-right:0.4rem; color:var(--accent);"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
      New Contact / Deal
    </div>
    <div class="field"><label>Full Name *</label><input placeholder="e.g. Jordan Blake" id="newDealName"></div>
    <div class="field"><label>Company *</label><input placeholder="e.g. Blake Holdings" id="newDealCompany"></div>
    <div class="field"><label>Email Address</label><input placeholder="e.g. jordan@mail.com" id="newDealEmail"></div>
    <div class="field">
      <label>Type</label>
      <select class="tone-select" id="newDealType">
        <option value="buyer">Buyer</option>
        <option value="seller">Seller</option>
        <option value="nurture">Nurture</option>
      </select>
    </div>
    <div class="field">
      <label>Stage</label>
      <select class="tone-select" id="newDealStage">
        <option value="New Lead" ${presetStage === 'New Lead' ? 'selected' : ''}>New Lead</option>
        <option value="Qualified" ${presetStage === 'Qualified' ? 'selected' : ''}>Qualified</option>
        <option value="Showing" ${presetStage === 'Showing' ? 'selected' : ''}>Showing</option>
        <option value="Offer" ${presetStage === 'Offer' ? 'selected' : ''}>Offer</option>
        <option value="Closed" ${presetStage === 'Closed' ? 'selected' : ''}>Closed</option>
      </select>
    </div>
    <div class="field"><label>Lead Score (1-100)</label><input type="number" value="50" id="newDealScore"></div>
    <div class="field"><label>Raw Info / Notes *</label><textarea placeholder="Add any background context, properties of interest, etc..." id="newDealRaw" style="width:100%; height:80px; background:var(--panel-sunk); border:1px solid var(--border); border-radius:var(--radius-s); padding:0.5rem; color:var(--text-1); outline:none; resize:none;"></textarea></div>
    <div class="btn-row">
      <button class="btn btn-primary" id="createDealBtn">Create Lead</button>
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function renderEmailModal(contactName = null, subject = null, body = null){
  let displaySubject, displayBody;
  if (subject && body) {
    displaySubject = subject;
    displayBody = body;
  } else {
    const v = EMAIL_VARIANTS[emailVariant];
    const firstName = contactName ? contactName.split(' ')[0] : '';
    displaySubject = contactName ? `${firstName}: ${v.subject}` : v.subject;
    displayBody = contactName ? v.body.replace('Hello,', `Hello ${firstName},`) : v.body;
  }
  const sendLabel = contactName ? `Send to ${contactName}` : `Send to all contacts`;
  const toastMsg = contactName ? `Sent to ${contactName}.` : `Sent to all contacts in this segment.`;
  
  openModal(`
    <div class="card-head" style="margin-bottom:0.6rem;">
      <div class="status processing" id="genStatus"><span class="sdot"></span>Drafting…</div>
      <button class="icon-btn" onclick="closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div style="font-size:0.7rem; color:var(--text-3); margin-bottom:0.4rem;">Subject</div>
    <div style="font-family:var(--serif); font-size:1.05rem; margin-bottom:1rem;">${displaySubject}</div>
    <div class="read-block" id="genBody" style="opacity:0.3;">${displayBody}</div>
    <div class="btn-row">
      <button class="btn btn-primary" data-toast="ready|${toastMsg}" onclick="closeModal()">${sendLabel}</button>
      <button class="btn btn-outline" id="regenBtn" data-regen-for="${contactName || ''}">Regenerate</button>
      <button class="btn btn-ghost" data-copy="${displaySubject}">Copy text</button>
    </div>
  `);
  setTimeout(()=>{
    const status = document.getElementById('genStatus');
    const body = document.getElementById('genBody');
    if(status){ status.className = 'status ready'; status.innerHTML = '<span class="sdot"></span>Ready to send'; }
    if(body){ body.style.transition='opacity 0.5s ease'; body.style.opacity='1'; }
  }, 700);
}

/* ---------------- events ---------------- */
document.addEventListener('click', async (e)=>{

  const collapseBtn = e.target.closest('#sidebarCollapseBtn');
  if(collapseBtn){
    setSidebarCollapsed(!sidebarCollapsed);
    return;
  }

  const navBtn = e.target.closest('.nav-item:not(.segment-item)');
  if(navBtn){
    document.querySelectorAll('.nav-item:not(.segment-item)').forEach(n=>n.classList.remove('active'));
    navBtn.classList.add('active');
    const view = navBtn.dataset.view;
    document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
    document.getElementById('view-'+view).classList.remove('hidden');
    const titles = {
      dashboard:["Dashboard","Tuesday, August 4 — everything as of this morning"],
      pipeline:["Pipeline","Active deals in motion"],
      contacts:["Contacts","CRM people across buyers, sellers, and nurture"],
      reports:["Reports","Performance across the current quarter"],
      settings:["Settings","Profile, notifications, and workspace preferences"],
      'contact-full':["Full Profile",""]
    };
    document.getElementById('viewTitle').textContent = titles[view][0];
    document.getElementById('viewSub').textContent = titles[view][1];

    const rail = document.getElementById('segmentsRail');
    if(view === 'contacts' || view === 'pipeline'){
      document.querySelector('.workspace').classList.add('has-segments');
      if(rail){
        rail.classList.remove('hidden');
        rail.querySelectorAll('.segment-item').forEach(b => b.classList.toggle('active', b.dataset.segment === 'all'));
      }
      if(view === 'contacts'){
        renderContacts('all');
      } else {
        renderKanban('all');
      }
    } else {
      document.querySelector('.workspace').classList.remove('has-segments');
      if(rail) rail.classList.add('hidden');
    }
    return;
  }

  const toastEl = e.target.closest('[data-toast]');
  if(toastEl){
    const [kind, msg] = toastEl.dataset.toast.split('|');
    toast(kind, msg);
  }

  const copyEl = e.target.closest('[data-copy]');
  if(copyEl){
    const text = copyEl.dataset.copy;
    if(navigator.clipboard){ navigator.clipboard.writeText(text).catch(()=>{}); }
    toast('ready', 'Copied to clipboard.');
  }

  const treeToggle = e.target.closest('[data-toggle-tree]');
  if(treeToggle){
    treeToggle.classList.toggle('open');
  }

  const openC = e.target.closest('[data-open-contact]');
  if(openC && !e.target.closest('[data-toggle-tree]')){
    openContact(openC.dataset.openContact);
  }

  const genF = e.target.closest('[data-gen-followup]');
  if(genF){
    const contact = CONTACTS.find(x => x.name === genF.dataset.genFollowup);
    if (contact) {
      let tone = contact.tone_note;
      if (!tone || !AVAILABLE_TONES.includes(tone)) {
        tone = AVAILABLE_TONES.length > 0 ? AVAILABLE_TONES[0] : 'curiosity';
      }
      generateAiDraft(contact.id, tone);
    }
  }
  
  const extractEl = e.target.closest('[data-extract-profile]');
  if(extractEl){
    const contactId = extractEl.dataset.extractProfile;
    triggerExtraction(contactId);
  }

  if(e.target.closest('#addListingBtn')){
    openModalForNewDeal('Showing');
  }

  const addStage = e.target.closest('[data-add-stage]');
  if(addStage){
    const stage = addStage.dataset.addStage;
    openModalForNewDeal(stage);
  }

  const segCollapseBtn = e.target.closest('#segmentsCollapseBtn');
  if(segCollapseBtn){
    const rail = document.getElementById('segmentsRail');
    if(rail){
      rail.classList.toggle('collapsed');
    }
    return;
  }

  const segmentBtn = e.target.closest('.segment-item');
  if(segmentBtn){
    const rail = document.getElementById('segmentsRail');
    if(rail){
      rail.querySelectorAll('.segment-item').forEach(b => b.classList.remove('active'));
    }
    segmentBtn.classList.add('active');
    const segment = segmentBtn.dataset.segment;
    const activeNav = document.querySelector('.nav-item.active:not(.segment-item)');
    const activeView = activeNav ? activeNav.dataset.view : 'contacts';
    if(activeView === 'contacts'){
      renderContacts(segment);
    } else if(activeView === 'pipeline'){
      renderKanban(segment);
    }
    return;
  }

  const chip = e.target.closest('#contactChips .chip');
  if(chip){
    document.querySelectorAll('#contactChips .chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    renderContacts(chip.dataset.filter);
  }

  if(e.target.closest('#importLeadsBtn')){
    openImportWizard();
    return;
  }
  
  if (e.target.closest('#confirmImportBtn')) {
    const csvInputEl = document.getElementById('csvInput');
    const csvText = csvInputEl ? csvInputEl.value : '';
    if (!csvText.trim()) {
      toast('attn', 'Please paste CSV content or upload a file.');
      return;
    }
    
    toast('processing', 'Importing leads...');
    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      toast('attn', 'No valid rows found in CSV.');
      return;
    }
    
    // Render progress step UI inside modal
    openModal(`
      <div class="card-title" style="margin-bottom: 1rem">Importing Leads</div>
      <div class="card glass" style="padding: 1.4rem; display: flex; flex-direction: column; gap: 1rem;" id="importLogContainer">
        <div class="glass-edge"></div>
        <div id="step-1" style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem; transition: opacity 0.2s; opacity: 0.35;">
          <span class="status pending"><span class="sdot" style="background: var(--text-3); display: inline-block; width: 6px; height: 6px; border-radius: 50%;"></span></span>
          <span>Reading rows…</span>
        </div>
        <div id="step-2" style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem; transition: opacity 0.2s; opacity: 0.35;">
          <span class="status pending"><span class="sdot" style="background: var(--text-3); display: inline-block; width: 6px; height: 6px; border-radius: 50%;"></span></span>
          <span>Scoring lead quality…</span>
        </div>
        <div id="step-3" style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem; transition: opacity 0.2s; opacity: 0.35;">
          <span class="status pending"><span class="sdot" style="background: var(--text-3); display: inline-block; width: 6px; height: 6px; border-radius: 50%;"></span></span>
          <span>Matching to nearest pipeline stage…</span>
        </div>
        <div id="step-4" style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem; transition: opacity 0.2s; opacity: 0.35;">
          <span class="status pending"><span class="sdot" style="background: var(--text-3); display: inline-block; width: 6px; height: 6px; border-radius: 50%;"></span></span>
          <span>Assigning owner…</span>
        </div>
      </div>
    `);

    const setStepState = (stepNum, state) => {
      const el = document.getElementById(`step-${stepNum}`);
      if (!el) return;
      el.style.opacity = state === 'pending' ? '0.35' : '1';
      const statusSpan = el.querySelector('.status');
      if (!statusSpan) return;
      if (state === 'ready') {
        statusSpan.className = 'status ready';
        statusSpan.innerHTML = '<span class="sdot" style="background: var(--accent); display: inline-block; width: 6px; height: 6px; border-radius: 50%;"></span>';
      } else if (state === 'processing') {
        statusSpan.className = 'status processing';
        statusSpan.innerHTML = '<span class="sdot" style="background: var(--amber); display: inline-block; width: 6px; height: 6px; border-radius: 50%; animation: pulse 1.8s ease-in-out infinite;"></span>';
      } else {
        statusSpan.className = 'status pending';
        statusSpan.innerHTML = '<span class="sdot" style="background: var(--text-3); display: inline-block; width: 6px; height: 6px; border-radius: 50%;"></span>';
      }
    };

    const runSteps = () => {
      return new Promise((resolve) => {
        let currentStep = 1;
        const next = () => {
          if (currentStep > 1) {
            setStepState(currentStep - 1, 'ready');
          }
          if (currentStep <= 4) {
            setStepState(currentStep, 'processing');
            currentStep++;
            setTimeout(next, 500);
          } else {
            resolve();
          }
        };
        next();
      });
    };

    try {
      await runSteps();
      const res = await api('POST', '/api/contacts/import', { rows });
      closeModal();
      
      openModal(`
        <div class="card-title" style="margin-bottom:1rem;">Import Summary</div>
        <div class="stat-trio" style="margin-bottom:1.2rem;">
          <div class="stat"><div class="n" style="font-size:1.6rem; font-weight:600; color:var(--accent);">${res.summary.total}</div><div class="l">Rows read</div></div>
          <div class="stat"><div class="n" style="font-size:1.6rem; font-weight:600; color:var(--accent);">${res.summary.imported}</div><div class="l">Imported</div></div>
          <div class="stat"><div class="n" style="font-size:1.6rem; font-weight:600; color:var(--rust);">${res.summary.duplicates}</div><div class="l">Duplicates</div></div>
        </div>
        <div class="read-block" style="font-size:0.8rem; margin-bottom:1.5rem;">
          Leads successfully imported. AI Profile extraction has been queued for all new leads in the background.
        </div>
        <div class="btn-row" style="justify-content:flex-end;">
          <button class="btn btn-primary" onclick="closeModal()">Done</button>
        </div>
      `);
      
      await loadContacts();
    } catch (err) {
      console.error('Import error:', err);
      toast('attn', 'Failed to import leads.');
      closeModal();
    }
    return;
  }

  const toggleSub = e.target.closest('[data-toggle-sub]');
  if(toggleSub){
    const targetId = toggleSub.dataset.toggleSub;
    const details = document.getElementById('sub-' + targetId);
    if(details) details.classList.toggle('hidden');
    return;
  }

  if(e.target.closest('#bellBtn')){
    openSlideover('Notifications', '1 unread', `
      <div class="tl-item mint"><div><div class="tl-text">AI integration active</div><div class="tl-date">Just now</div></div></div>
      <div class="btn-row"><button class="btn btn-outline" data-toast="ready|All notifications marked read.">Mark all read</button></div>
    `);
  }

  if(e.target.closest('#quickAddBtn')){
    openModalForNewDeal();
  }
  
  if(e.target.closest('#createDealBtn')){
    const name = document.getElementById('newDealName').value.trim();
    const company = document.getElementById('newDealCompany').value.trim();
    const email = document.getElementById('newDealEmail').value.trim();
    const type = document.getElementById('newDealType').value;
    const stage = document.getElementById('newDealStage').value;
    const score = Number(document.getElementById('newDealScore').value) || 50;
    const raw_dump = document.getElementById('newDealRaw').value.trim();
    
    if(!name || !company || !raw_dump){
      toast('attn', 'Name, Company, and Raw Info/Notes are required.');
      return;
    }
    
    try {
      const res = await api('POST', '/api/contacts', {
        name, company, email, type, stage, score, raw_dump
      });
      closeModal();
      toast('ready', `${name} created successfully.`);
      await loadContacts();
      triggerExtraction(res.contact.id);
    } catch (err) {
      console.error('Error creating contact:', err);
      toast('attn', 'Failed to create lead.');
    }
  }

  if(e.target.closest('#generateEmailBtn')){
    renderEmailModal();
  }
  if(e.target.closest('#regenBtn')){
    emailVariant = (emailVariant + 1) % EMAIL_VARIANTS.length;
    const btn = e.target.closest('#regenBtn');
    const contactName = btn.dataset.regenFor;
    renderEmailModal(contactName || null);
  }

  if(e.target.closest('#exportReportBtn')){
    toast('processing', 'Preparing report…');
    setTimeout(()=>toast('ready', 'Report exported — check your downloads.'), 1100);
  }

  if(e.target.closest('#saveSettingsBtn')){
    toast('ready', 'Settings saved.');
  }

  const sw = e.target.closest('[data-switch]');
  if(sw){ sw.classList.toggle('on'); }

  if(e.target.closest('#densityToggle')){
    const el = document.getElementById('densityToggle');
    el.classList.toggle('on');
    const comfortable = !el.classList.contains('on');
    document.documentElement.classList.toggle('comfortable', comfortable);
    toast('ready', comfortable ? 'Switched to comfortable reading size.' : 'Switched to compact density.');
  }

  const openFullBtn = e.target.closest('[data-open-full]');
  if(openFullBtn){
    openFullProfile(openFullBtn.dataset.openFull);
    return;
  }

  if(e.target.closest('#fullPageBack')){
    const targetNav = document.querySelector(`.nav-item[data-view="${returnToView}"]`);
    if(targetNav){
      document.querySelectorAll('.nav-item:not(.segment-item)').forEach(n=>n.classList.remove('active'));
      targetNav.classList.add('active');
    }
    document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
    document.getElementById('view-'+returnToView).classList.remove('hidden');
    
    const rail = document.getElementById('segmentsRail');
    if(returnToView === 'contacts' || returnToView === 'pipeline'){
      document.querySelector('.workspace').classList.add('has-segments');
      if(rail) rail.classList.remove('hidden');
    } else {
      document.querySelector('.workspace').classList.remove('has-segments');
      if(rail) rail.classList.add('hidden');
    }
    
    const titles = {
      dashboard:["Dashboard","Tuesday, August 4 — everything as of this morning"],
      pipeline:["Pipeline","Active deals in motion"],
      contacts:["Contacts","CRM people across buyers, sellers, and nurture"],
      reports:["Reports","Performance across the current quarter"],
      settings:["Settings","Profile, notifications, and workspace preferences"],
    };
    if (titles[returnToView]) {
      document.getElementById('viewTitle').textContent = titles[returnToView][0];
      document.getElementById('viewSub').textContent = titles[returnToView][1];
    }
    return;
  }

  const fpTab = e.target.closest('.fp-tab');
  if(fpTab){
    document.querySelectorAll('.fp-tab').forEach(b => b.classList.remove('active'));
    fpTab.classList.add('active');
    const tabName = fpTab.dataset.tab;
    document.querySelectorAll('.fp-panel').forEach(panel => panel.classList.add('hidden'));
    document.getElementById('fp-'+tabName).classList.remove('hidden');

    const contact = CONTACTS.find(x => x.id === currentContactId);
    if (contact) {
      if (tabName === 'profile') {
        document.getElementById('fp-profile').innerHTML = renderFpProfile(contact);
      } else if (tabName === 'outreach') {
        document.getElementById('fp-outreach').innerHTML = renderFpOutreach(contact);
      } else if (tabName === 'history') {
        document.getElementById('fp-history').innerHTML = renderFpHistory(contact);
      }
    }
    return;
  }

  const saveRawDumpBtn = e.target.closest('#saveRawDumpBtn');
  if(saveRawDumpBtn){
    const contactId = saveRawDumpBtn.dataset.contactId;
    const value = document.getElementById('fpRawDumpTextarea').value;
    toast('processing', 'Saving dump...');
    try {
      await api('PATCH', `/api/contacts/${contactId}/raw_dump`, { raw_dump: value });
      toast('ready', 'Raw research dump updated.');
      await loadContacts();
      const contact = CONTACTS.find(x => x.id === currentContactId);
      if (contact) {
        document.getElementById('fp-profile').innerHTML = renderFpProfile(contact);
      }
    } catch (err) {
      console.error(err);
      toast('attn', 'Failed to save raw dump.');
    }
    return;
  }

  const reextractAiBtn = e.target.closest('#reextractAiBtn');
  if(reextractAiBtn){
    const contactId = reextractAiBtn.dataset.contactId;
    toast('processing', 'Triggering AI extraction...');
    try {
      await api('POST', `/api/contacts/${contactId}/extract`);
      toast('ready', 'Re-extraction started in background.');
      await loadContacts();
      const contact = CONTACTS.find(x => x.id === currentContactId);
      if (contact) {
        document.getElementById('fp-profile').innerHTML = renderFpProfile(contact);
        document.getElementById('fpStatus').innerHTML = aiStatusBadge(contact.ai_status);
      }
    } catch (err) {
      console.error(err);
      toast('attn', 'Failed to trigger re-extraction.');
    }
    return;
  }

  const saveDraftBtn = e.target.closest('#saveDraftBtn');
  if(saveDraftBtn){
    const msgId = saveDraftBtn.dataset.msgId;
    const subject_line = document.getElementById('fpOutreachSubject').value;
    const body = document.getElementById('fpOutreachBody').value;
    toast('processing', 'Saving draft...');
    try {
      await api('PATCH', `/api/messages/${msgId}`, { subject_line, body });
      toast('ready', 'Message draft saved.');
      await loadContacts();
      const contact = CONTACTS.find(x => x.id === currentContactId);
      if (contact) {
        document.getElementById('fp-outreach').innerHTML = renderFpOutreach(contact);
      }
    } catch (err) {
      console.error(err);
      toast('attn', 'Failed to save draft.');
    }
    return;
  }

  const regenerateDraftBtn = e.target.closest('#regenerateDraftBtn');
  if(regenerateDraftBtn){
    const contactId = regenerateDraftBtn.dataset.contactId;
    const contact = CONTACTS.find(x => x.id === contactId);
    const tone = contact?.tone_note || 'curiosity';
    toast('processing', 'Regenerating draft...');
    try {
      await api('POST', `/api/contacts/${contactId}/draft`, { tone });
      toast('ready', 'New draft generated.');
      await loadContacts();
      const updatedContact = CONTACTS.find(x => x.id === contactId);
      if (updatedContact) {
        document.getElementById('fp-outreach').innerHTML = renderFpOutreach(updatedContact);
        document.getElementById('fpStatus').innerHTML = aiStatusBadge(updatedContact.ai_status);
      }
    } catch (err) {
      console.error(err);
      toast('attn', 'Failed to regenerate draft.');
    }
    return;
  }

  const msgRowSummary = e.target.closest('.msg-row-summary');
  if(msgRowSummary){
    const row = msgRowSummary.closest('.msg-row');
    if(row){
      const details = row.querySelector('.msg-row-details');
      if(details) details.classList.toggle('hidden');
    }
    return;
  }

  const resyncBtn = e.target.closest('.resync-msg-btn');
  if(resyncBtn){
    toast('processing', 'Resyncing…');
    setTimeout(() => {
      toast('ready', 'Outcome confirmed — no change.');
    }, 800);
    return;
  }

  const inspectFpSourceBtn = e.target.closest('#inspectFpSourceBtn');
  if(inspectFpSourceBtn){
    const name = inspectFpSourceBtn.dataset.sourceFor;
    const contact = CONTACTS.find(x => x.name === name);
    if(contact){
      openModal(`
        <div class="card-head" style="margin-bottom:0.8rem;">
          <div class="card-title" style="display:flex; align-items:center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px; height:14px; margin-right:0.4rem; color:var(--text-3);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
            Source Dump: ${contact.name}
          </div>
          <button class="icon-btn" onclick="closeModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <pre style="font-family:var(--mono); font-size:0.78rem; white-space:pre-wrap; background:var(--panel-sunk); border:1px solid var(--border); border-radius:var(--radius-s); padding:1rem; max-height:22rem; overflow-y:auto; margin:0; color:var(--text-2);">${contact.raw_dump}</pre>
        <div class="btn-row" style="justify-content:flex-end;">
          <button class="btn btn-outline" onclick="closeModal()">Close</button>
        </div>
      `);
    }
    return;
  }

  if(e.target.closest('#userCard')){
    openModal(`
      <div class="card-title" style="margin-bottom:1rem; display:flex; align-items:center;">Log Out</div>
      <div class="read-block" style="font-size:0.85rem; margin-bottom:1.5rem;">
        Are you sure you want to log out of your session?
      </div>
      <div class="btn-row" style="justify-content:flex-end;">
        <button class="btn btn-primary" id="confirmLogoutBtn">Log out</button>
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      </div>
    `);
  }
  
  if(e.target.closest('#confirmLogoutBtn')){
    try {
      await api('POST','/api/auth/logout');
    } catch(err){}
    window.location.href='/login.html';
  }

}, false);

document.addEventListener('change', async (e) => {
  const toneSelect = e.target.closest('.tone-select');
  if(toneSelect){
    const name = toneSelect.dataset.toneFor;
    const value = toneSelect.value;
    const contact = CONTACTS.find(c => c.name === name);
    if(contact){
      try {
        await fetch(`/api/contacts/${contact.id}/tone_note`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tone_note: value })
        });
        contact.tone_note = value || null;
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '-');
        const pill = document.getElementById(`tonePill-${sanitizedName}`);
        if(pill){
          if(value){
            pill.textContent = value;
            pill.classList.remove('hidden');
          } else {
            pill.textContent = '';
            pill.classList.add('hidden');
          }
        }
        toast('ready', `Tone note set to "${value}" for ${name}.`);
        await loadContacts();
      } catch (err) {
        console.error('Error saving tone note:', err);
        toast('attn', 'Failed to save tone note.');
      }
    }
    return;
  }

  const outcomeSelect = e.target.closest('.msg-outcome-select');
  if (outcomeSelect) {
    const msgId = outcomeSelect.dataset.msgId;
    const value = outcomeSelect.value;
    toast('processing', 'Saving outcome...');
    try {
      await api('PATCH', `/api/messages/${msgId}/outcome`, { outcome: value });
      toast('ready', 'Outcome updated.');
      
      const badgeColors = {
        booked: 'background:var(--accent-dim); color:var(--accent);',
        replied: 'background:var(--accent-dim); color:var(--accent);',
        opened: 'background:var(--amber-dim); color:var(--amber);',
        no_response: 'background:var(--border-soft); color:var(--text-3);',
        rejected: 'background:var(--rust-dim); color:var(--rust);'
      };
      outcomeSelect.style = `border:none; outline:none; cursor:pointer; border-radius:99px; padding:0.15rem 0.5rem; font-size:0.65rem; ${badgeColors[value] || badgeColors.no_response}`;
      
      await loadContacts();
    } catch (err) {
      console.error(err);
      toast('attn', 'Failed to update outcome.');
    }
    return;
  }
}, false);

document.getElementById('searchInput').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && e.target.value.trim()){
    const q = e.target.value.trim().toLowerCase();
    const count = CONTACTS.filter(c => c.name.toLowerCase().includes(q) || (c.company && c.company.toLowerCase().includes(q))).length;
    toast('ready', `${count} results for "${e.target.value.trim()}."`);
  }
});

function applyCardIcons(root = document) {
  root.querySelectorAll('.card-title').forEach(titleEl => {
    if (titleEl.querySelector('svg')) return;
    const textNode = Array.from(titleEl.childNodes).find(n => n.nodeType === 3);
    const text = textNode ? textNode.textContent.trim() : titleEl.textContent.trim();
    let icon = '';
    if (text.startsWith('Portfolio')) {
      icon = ICONS.layers;
    } else if (text.startsWith('This week')) {
      icon = ICONS.clock;
    } else if (text.startsWith('Recent activity')) {
      icon = ICONS.pulse;
    } else if (text.startsWith('Latest signals')) {
      icon = ICONS.bolt;
    } else if (text.startsWith('Closed volume by month')) {
      icon = ICONS.pulse;
    } else if (text.startsWith('Profile')) {
      icon = ICONS.user;
    } else if (text.startsWith('Preferences')) {
      icon = ICONS.settings;
    }
    if (icon) {
      const countEl = titleEl.querySelector('.count');
      const countHtml = countEl ? countEl.outerHTML : '';
      titleEl.innerHTML = icon + text + (countHtml ? ' ' + countHtml : '');
      titleEl.style.display = 'flex';
      titleEl.style.alignItems = 'center';
    }
  });
}

function applyGlowAndGlass(root = document) {
  root.querySelectorAll('.card, .modal, .slideover').forEach(el => {
    if (el.querySelector('.card-glow')) return;
    if (!el.classList.contains('glass')) {
      el.classList.add('glass');
    }
    el.insertAdjacentHTML('afterbegin', '<div class="card-glow"></div><div class="glass-edge"></div>');
  });
}

async function loadTones() {
  try {
    const res = await fetch('/api/tones');
    const data = await res.json();
    AVAILABLE_TONES = Array.isArray(data) ? data : (data.tones || []);
    if (AVAILABLE_TONES.length === 0) AVAILABLE_TONES = ['curiosity'];
  } catch(err) {
    AVAILABLE_TONES = ['curiosity'];
  }
}

async function loadContactMessages(id) {
  try {
    const res = await fetch(`/api/contacts/${id}/messages`);
    const msgs = await res.json();
    const contact = CONTACTS.find(x => x.id === id);
    if(contact) contact.messages = msgs.messages || msgs;
  } catch (err) {
    console.error('Failed to load contact messages:', err);
  }
}

async function boot(){
  try{
    const meRes = await api('GET', '/api/auth/me');
    ME = meRes.user;
  }catch(e){ return; }

  const userCard = document.getElementById('userCard');
  if (userCard && ME) {
    userCard.querySelector('.avatar').textContent = ME.avatar || ME.name.slice(0, 2).toUpperCase();
    userCard.querySelector('.avatar').style.background = ME.color || 'var(--accent)';
    userCard.querySelector('.user-name').textContent = ME.name;
    userCard.querySelector('.user-role').textContent = ME.role || 'Agent';
    
    const sName = document.getElementById('settingsName');
    const sEmail = document.getElementById('settingsEmail');
    if (sName) sName.value = ME.name;
    if (sEmail) sEmail.value = ME.email;
  }

  await loadTones();
  await loadContacts();
  
  applyGlowAndGlass();
  applyCardIcons();
  
  setInterval(loadContacts, 10000);
}

boot();
"""

# Find script indexes
start_marker = "<script>"
end_marker = "</script>"

start_idx = content.find(start_marker)
if start_idx == -1:
    print("Error: <script> not found")
    exit(1)

end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("Error: </script> not found")
    exit(1)

# Construct new content
new_content = content[:start_idx + len(start_marker)] + "\n" + js_code + "\n" + content[end_idx:]

# Save mockup
with open(mockup_path, "w", encoding="utf-8") as f:
    f.write(new_content)
print(f"Mockup updated successfully: {mockup_path}")

# Ensure destination directory exists
os.makedirs(os.path.dirname(target_path), exist_ok=True)

# Save target app.html
with open(target_path, "w", encoding="utf-8") as f:
    f.write(new_content)
print(f"Target app.html updated successfully: {target_path}")
