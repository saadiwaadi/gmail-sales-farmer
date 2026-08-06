import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import SegmentsRail from './components/layout/SegmentsRail';
import Topbar from './components/layout/Topbar';
import ToastContainer from './components/ui/ToastContainer';
import Modal from './components/ui/Modal';
import Slideover from './components/ui/Slideover';
import Badge from './components/ui/Badge';
import Button from './components/ui/Button';
import ToneSelect from './components/ui/ToneSelect';

// Views
import Dashboard from './views/Dashboard';
import Pipeline from './views/Pipeline';
import Contacts from './views/Contacts';
import Reports from './views/Reports';
import Settings from './views/Settings';
import ContactFull from './views/ContactFull';

// Modals/Composers
import EmailComposer from './components/email/EmailComposer';
import ImportWizard from './components/import/ImportWizard';

import { addToast } from './hooks/useToast';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeSegment, setActiveSegment] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [segmentsCollapsed, setSegmentsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [densityCompact, setDensityCompact] = useState(true);
  const [returnToView, setReturnToView] = useState('dashboard');

  // Auth state
  const [me, setMe] = useState(null);

  // Business States
  const [contacts, setContacts] = useState([]);
  const [availableTones, setAvailableTones] = useState([]);
  const [activity, setActivity] = useState([]);
  const [signals, setSignals] = useState([]);
  const [kanban, setKanban] = useState({});
  const [emailVariant, setEmailVariant] = useState(0);
  const [emailDraft, setEmailDraft] = useState({ subject: '', body: '', loading: false, error: null });

  // Overlay States
  const [slideover, setSlideover] = useState({
    show: false,
    type: null, // 'notification', 'contact-details', 'follow-up'
    data: null  // contact name, notification status, etc.
  });

  const [modal, setModal] = useState({
    show: false,
    type: null, // 'import', 'new-deal', 'email-composer', 'inspect-source'
    data: null  // extra metadata
  });

  // API helper
  const api = async (method, url, body) => {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 401) {
      window.location.href = '/login.html';
      throw new Error('Not signed in');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    return data;
  };

  const loadContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.status === 401) {
        window.location.href = '/login.html';
        return;
      }
      const data = await res.json();
      const fetchedContacts = data.contacts || data || [];

      // Fetch messages for each contact in parallel to get outcomes and outreach logs
      const contactsWithMessages = await Promise.all(fetchedContacts.map(async (c) => {
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

      setContacts(contactsWithMessages);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  const loadTones = async () => {
    try {
      const res = await fetch('/api/tones');
      const data = await res.json();
      setAvailableTones(Array.isArray(data) ? data : (data.tones || []));
    } catch (err) {
      console.error('Failed to load tones:', err);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.status === 401) {
        window.location.href = '/login.html';
        return;
      }
      const data = await res.json();
      if (data.success && data.user) {
        setMe(data.user);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await api('POST', '/api/auth/logout');
      window.location.href = '/login.html';
    } catch (err) {
      console.error('Logout failed:', err);
      window.location.href = '/login.html';
    }
  };

  // Run initial checks and set up polling
  useEffect(() => {
    checkAuth();
    loadContacts();
    loadTones();

    const interval = setInterval(loadContacts, 8000);
    return () => clearInterval(interval);
  }, []);

  // Derive other views from contacts state
  useEffect(() => {
    // 1. Derive Activity
    const derivedActivity = contacts
      .filter(c => c.messages && c.messages.length > 0)
      .flatMap(c => c.messages.map(m => ({
        id: m.id,
        name: c.name,
        date: m.created_at || 'recent',
        change: `${c.stage || 'Contact'} — ${m.tone_used || 'outreach'}`,
        value: '—',
        pos: m.outcome === 'replied' || m.outcome === 'booked'
      })))
      .slice(0, 5);
    setActivity(derivedActivity);

    // 2. Derive Signals
    const derivedSignals = contacts
      .filter(c => c.ai_status === 'READY')
      .slice(0, 4)
      .map(c => ({
        name: c.name,
        sub: c.extracted_profile?.recent_signals?.[0] || 'AI profile ready',
        score: c.score || '—',
        date: 'recent'
      }));
    setSignals(derivedSignals);

    // 3. Derive Kanban
    const board = {
      "New Lead": [],
      "Qualified": [],
      "Showing": [],
      "Offer": [],
      "Closed": []
    };
    contacts.forEach(c => {
      let stage = c.stage || 'New Lead';
      if (!board[stage]) {
        board[stage] = [];
      }
      board[stage].push({
        name: c.name,
        prop: c.role ? `${c.role} @ ${c.company}` : `${c.company}`,
        value: c.score ? `$${(c.score * 10000).toLocaleString()}` : '$0'
      });
    });
    setKanban(board);
  }, [contacts]);

  // Handle density toggle layout adjustment
  useEffect(() => {
    if (densityCompact) {
      document.documentElement.classList.remove('comfortable');
    } else {
      document.documentElement.classList.add('comfortable');
    }
  }, [densityCompact]);

  // View titles/routing logic
  const handleViewChange = (view) => {
    if (view === 'contact-full') {
      if (currentView !== 'contact-full') {
        setReturnToView(currentView);
      }
    }
    setCurrentView(view);
  };

  const handleOpenContact = (name) => {
    setSlideover({
      show: true,
      type: 'contact-details',
      data: name
    });
  };

  const handleToneChange = async (contactName, newTone) => {
    const contact = contacts.find(c => c.name === contactName);
    if (!contact) return;
    try {
      await api('PATCH', `/api/contacts/${contact.id}/tone_note`, { tone_note: newTone });
      addToast('ready', `Tone note updated for ${contactName}.`);
      await loadContacts();
    } catch (err) {
      console.error('Error saving tone note:', err);
      addToast('attn', 'Failed to save tone note.');
    }
  };

  const handleOpenEmailComposer = (contactName) => {
    setModal({
      show: true,
      type: 'email-composer',
      data: contactName
    });

    const contact = contacts.find(c => c.name === contactName);
    if (contact) {
      generateEmailDraft(contact);
    }
  };

  const generateEmailDraft = async (contact) => {
    setEmailDraft({ subject: '', body: '', loading: true, error: null });
    try {
      const res = await api('POST', `/api/contacts/${contact.id}/draft`, {
        tone: contact.tone_note || 'curiosity'
      });
      setEmailDraft({ subject: res.subject, body: res.body, loading: false, error: null });
      await loadContacts(); // Reload contacts to display the new draft message
    } catch (err) {
      console.error('Draft generation error:', err);
      setEmailDraft({ subject: '', body: '', loading: false, error: err.message || 'Failed to generate draft' });
    }
  };

  const handleSendEmail = (contactName) => {
    const toastMsg = contactName
      ? `Sent to ${contactName}.`
      : `Sent to all contacts in this segment.`;
    
    setModal({ show: false, type: null, data: null });
    addToast('ready', toastMsg);
  };

  const handleRegenerateEmail = (contactName) => {
    const contact = contacts.find(c => c.name === contactName);
    if (contact) {
      generateEmailDraft(contact);
    }
  };

  const handleResyncMessage = (msgId) => {
    addToast('processing', 'Resyncing…');
    setTimeout(() => {
      addToast('ready', 'Outcome confirmed — no change.');
    }, 800);
  };

  const handleInspectSource = (contactName) => {
    setModal({
      show: true,
      type: 'inspect-source',
      data: contactName
    });
  };

  // Add Deal stage kanban list
  const handleAddDeal = (stage) => {
    // Quick modal deal prompt
    setModal({
      show: true,
      type: 'new-deal',
      data: stage
    });
  };

  const handleCreateDealConfirm = async (stage, contactName, property, value) => {
    const name = contactName.trim() || 'New Contact';
    const propVal = property.trim() || 'Details pending';
    const scoreVal = Math.min(100, Math.max(0, parseInt(value.replace(/[^0-9]/g, '')) / 10000 || 50));

    try {
      await api('POST', '/api/contacts', {
        name,
        company: propVal,
        raw_dump: `Name: ${name} | Stage: ${stage} | Property: ${propVal} | Value: ${value}`,
        type: 'buyer',
        stage,
        score: scoreVal,
        email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@mail.com`
      });
      addToast('ready', `${name} added to Pipeline → ${stage}.`);
      setModal({ show: false, type: null, data: null });
      await loadContacts();
    } catch (err) {
      console.error('Error creating contact/deal:', err);
      addToast('attn', 'Failed to save deal.');
    }
  };

  const handleAutoDistributeLeads = async () => {
    const mockImports = [
      {
        name: "Alex Rivera",
        type: "buyer",
        stage: "New Lead",
        score: 64,
        company: "Westside condo relocator",
        role: "relocator",
        email: "alex.rivera@mail.com",
        raw_dump: "[Imported row — Excel] Name: Alex Rivera | Email: alex.rivera@mail.com | Target: Westside condo relocator. Budget range $450k-500k. Needs pre-approval advice."
      },
      {
        name: "Elena Vance",
        type: "seller",
        stage: "New Lead",
        score: 87,
        company: "Oak Ridge Road single-family home",
        role: "owner",
        email: "elena.vance@mail.com",
        raw_dump: "[Imported row — Excel] Name: Elena Vance | Email: elena.vance@mail.com | Property: 12 Oak Ridge Road single-family home. Ready to list. Expected target value $800k."
      },
      {
        name: "Jordan Blake",
        type: "buyer",
        stage: "New Lead",
        score: 72,
        company: "Suburban 4bd builder",
        role: "builder",
        email: "jordan.blake@mail.com",
        raw_dump: "[Imported row — Excel] Name: Jordan Blake | Email: jordan.blake@mail.com | Target: Suburban 4-bedroom home for growing family. Budget range $700k."
      },
      {
        name: "Taylor Vance",
        type: "nurture",
        stage: "New Lead",
        score: 41,
        company: "Downsizing notes",
        role: "downsizer",
        email: "taylor.vance@mail.com",
        raw_dump: "[Imported row — Excel] Name: Taylor Vance | Email: taylor.vance@mail.com | Notes: Interested in downsizing options next summer. Quiet client."
      }
    ];

    try {
      await api('POST', '/api/contacts/import', { rows: mockImports });
      addToast('ready', '4 leads distributed — 12 to Priya, 32 unassigned.');
      setModal({ show: false, type: null, data: null });
      await loadContacts();
    } catch (err) {
      console.error('Error importing leads:', err);
      addToast('attn', 'Failed to import leads.');
    }
  };

  const handleOpenFollowup = (name) => {
    setSlideover({
      show: true,
      type: 'follow-up',
      data: name
    });
  };

  // Filtered lists based on search bar queries
  const getSearchFilteredContacts = () => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(query) ||
      (c.tag && c.tag.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  };

  const getSearchFilteredActivity = () => {
    if (!searchQuery.trim()) return activity;
    const query = searchQuery.toLowerCase();
    return activity.filter(a =>
      a.name.toLowerCase().includes(query) ||
      a.change.toLowerCase().includes(query)
    );
  };

  const getSearchFilteredSignals = () => {
    if (!searchQuery.trim()) return signals;
    const query = searchQuery.toLowerCase();
    return signals.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.sub.toLowerCase().includes(query)
    );
  };

  // Contacts Detail Slide-over Body renderer
  const renderContactDetailsSlideover = () => {
    const contactName = slideover.data;
    const c = contacts.find(x => x.name === contactName) || {
      name: contactName,
      type: "contact",
      tag: "Active in pipeline",
      email: "—",
      score: "—",
      stage: "—",
      last: "—",
      tone_note: null,
      ai_status: "NOT_STARTED"
    };

    const handleCopyEmail = () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(c.email).catch(() => {});
      }
      addToast('ready', 'Copied to clipboard.');
    };

    return (
      <div>
        <div className="profile-name" style={{ fontSize: '1.4rem', fontFamily: 'var(--serif)', marginBottom: '0.4rem' }}>
          {c.name}
        </div>
        <div style={{ marginBottom: '0.8rem' }}>
          <Badge status={c.ai_status} />
        </div>
        <div className="profile-tag" style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1.2rem' }}>
          {c.tag}
        </div>

        <div className="kv-row"><span className="k">Stage</span><span>{c.stage}</span></div>
        <div className="kv-row"><span className="k">Lead score</span><span>{c.score}</span></div>
        <div className="kv-row"><span className="k">Last contact</span><span>{c.last}</span></div>
        <div className="kv-row"><span className="k">Email</span><span>{c.email}</span></div>

        <ToneSelect
          contactName={c.name}
          toneNote={c.tone_note}
          onChange={handleToneChange}
          availableTones={availableTones}
        />

        <div className="divider-label">
          <span>Activity</span>
          <div className="rule"></div>
        </div>
        <div className="timeline" style={{ marginBottom: '1.5rem' }}>
          <div className="tl-item mint">
            <div>
              <div className="tl-text">Opened your last follow-up email</div>
              <div className="tl-date">2 days ago</div>
            </div>
          </div>
          <div className="tl-item">
            <div>
              <div className="tl-text">Viewed listing details, twice</div>
              <div className="tl-date">4 days ago</div>
            </div>
          </div>
          <div className="tl-item">
            <div>
              <div className="tl-text">Called — left voicemail</div>
              <div className="tl-date">9 days ago</div>
            </div>
          </div>
        </div>

        <div className="btn-row" style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="primary" onClick={() => handleOpenFollowup(c.name)}>
            Generate follow-up
          </Button>
          <Button variant="outline" onClick={() => addToast('ready', `Call logged for ${c.name}.`)}>
            Log call
          </Button>
          <Button variant="ghost" onClick={handleCopyEmail}>
            Copy email
          </Button>
        </div>
      </div>
    );
  };

  const renderFollowupSlideover = () => {
    const name = slideover.data;
    const handleCopyFollowup = () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`Hi ${name.split(' ')[0]},\n\nWanted to check in — it's been a few days since we last spoke...`).catch(() => {});
      }
      addToast('ready', 'Copied to clipboard.');
    };

    return (
      <div>
        <div className="status ready" style={{ marginBottom: '1rem' }}>
          <span className="sdot" style={{ background: 'var(--accent)' }}></span>Ready to send
        </div>
        <div className="read-block" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
          <p className="greet">Hi {name.split(' ')[0]},</p>
          <p>Wanted to check in — it's been a few days since we last spoke, and I know the pace of looking at homes can make details blur together.</p>
          <p>If it's still useful, I can put together a short shortlist based on what you liked most last time, no obligation either way.</p>
          <p className="greet">— Saad</p>
        </div>
        <div className="btn-row" style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem' }}>
          <Button variant="primary" onClick={() => { setSlideover({ show: false, type: null, data: null }); addToast('ready', `Follow-up sent to ${name}.`); }}>
            Send
          </Button>
          <Button variant="outline" onClick={() => addToast('ready', 'Opened in the editor for changes.')}>
            Edit
          </Button>
          <Button variant="ghost" onClick={handleCopyFollowup}>
            Copy text
          </Button>
        </div>
      </div>
    );
  };

  const renderNotificationsSlideover = () => {
    return (
      <div>
        <div className="timeline">
          <div className="tl-item mint">
            <div>
              <div className="tl-text">Priya Nair replied to your last email</div>
              <div className="tl-date">2h ago</div>
            </div>
          </div>
          <div className="tl-item mint">
            <div>
              <div className="tl-text">Offer submitted on 31 Harrow St</div>
              <div className="tl-date">5h ago</div>
            </div>
          </div>
          <div className="tl-item">
            <div>
              <div className="tl-text">Inspection scheduled for 221 Maple Grove</div>
              <div className="tl-date">Yesterday</div>
            </div>
          </div>
          <div className="tl-item">
            <div>
              <div className="tl-text">Weekly report is ready</div>
              <div className="tl-date">2 days ago</div>
            </div>
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: '1.5rem' }}>
          <Button variant="outline" onClick={() => addToast('ready', 'All notifications marked read.')}>
            Mark all read
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="liquid-glass-bg">
      {/* Background orbs */}
      <div className="bg-orbs">
        <div className="bg-orb-1"></div>
        <div className="bg-orb-2"></div>
      </div>

      <div className="workspace">
        {/* Sidebar Nav */}
        <Sidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          me={me}
          onLogout={handleLogout}
        />

        {/* View content wrap */}
        <div className="right-column">
          <Topbar
             currentView={currentView}
             contactNameForFullProfile={slideover.data || (currentView === 'contact-full' ? returnToView : '')}
             searchQuery={searchQuery}
             onSearchQueryChange={setSearchQuery}
             onShowNotifications={() => setSlideover({ show: true, type: 'notification', data: null })}
             onOpenImport={() => setModal({ show: true, type: 'import', data: null })}
             onOpenNewDeal={() => setModal({ show: true, type: 'new-deal', data: 'New Lead' })}
          />

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Segments Secondary rail */}
            <SegmentsRail
              show={currentView === 'contacts' || currentView === 'pipeline'}
              activeSegment={activeSegment}
              onSegmentChange={setActiveSegment}
              collapsed={segmentsCollapsed}
              onToggleCollapse={() => setSegmentsCollapsed(!segmentsCollapsed)}
            />

            {/* View router container */}
            <main className="dashboard-pill" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              
              {currentView === 'dashboard' && (
                <Dashboard
                  activityData={getSearchFilteredActivity()}
                  signalsData={getSearchFilteredSignals()}
                  onOpenContact={handleOpenContact}
                  onGenerateDraft={handleOpenEmailComposer}
                />
              )}

              {currentView === 'pipeline' && (
                <Pipeline
                  kanbanData={kanban}
                  contactsList={contacts}
                  activeSegment={activeSegment}
                  onOpenContact={handleOpenContact}
                  onAddDeal={handleAddDeal}
                />
              )}

              {currentView === 'contacts' && (
                <Contacts
                  contactsList={getSearchFilteredContacts()}
                  activeSegment={activeSegment}
                  onOpenContact={handleOpenContact}
                />
              )}

              {currentView === 'reports' && (
                <Reports />
              )}

              {currentView === 'settings' && (
                <Settings
                  densityCompact={densityCompact}
                  onDensityToggle={() => {
                    const nextMode = !densityCompact;
                    setDensityCompact(nextMode);
                    addToast('ready', nextMode ? 'Switched to compact density.' : 'Switched to comfortable reading size.');
                  }}
                />
              )}

              {currentView === 'contact-full' && (
                <ContactFull
                  contact={contacts.find(x => x.name === slideover.data) || contacts[0]}
                  onBack={() => setCurrentView(returnToView)}
                  onToneChange={handleToneChange}
                  onGenerateDraft={handleOpenEmailComposer}
                  onResyncMessage={handleResyncMessage}
                  onInspectSource={(name) => setModal({ show: true, type: 'inspect-source', data: name })}
                  availableTones={availableTones}
                />
              )}

            </main>
          </div>
        </div>
      </div>

      {/* Global Slide-over panel */}
      <Slideover
        show={slideover.show}
        onClose={() => setSlideover({ show: false, type: null, data: null })}
        title={
          slideover.type === 'notification' ? 'Notifications' :
          slideover.type === 'follow-up' ? `Follow-up · ${slideover.data}` :
          'Contact Details'
        }
        subtitle={
          slideover.type === 'notification' ? '4 unread' :
          slideover.type === 'follow-up' ? 'Drafted just now — reads back in about 20 seconds.' :
          ''
        }
        headerActions={
          slideover.type === 'contact-details' ? (
            <Button
              variant="outline"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem' }}
              onClick={() => {
                // Open full profile view
                handleViewChange('contact-full');
                setSlideover(prev => ({ ...prev, show: false }));
              }}
            >
              Open full profile →
            </Button>
          ) : null
        }
      >
        {slideover.type === 'contact-details' && renderContactDetailsSlideover()}
        {slideover.type === 'follow-up' && renderFollowupSlideover()}
        {slideover.type === 'notification' && renderNotificationsSlideover()}
      </Slideover>

      {/* Global Modal wrapper */}
      <Modal
        show={modal.show}
        onClose={() => setModal({ show: false, type: null, data: null })}
      >
        {modal.type === 'import' && (
          <ImportWizard
            onClose={() => setModal({ show: false, type: null, data: null })}
            onConfirmImport={handleAutoDistributeLeads}
          />
        )}

        {modal.type === 'email-composer' && (
          <EmailComposer
            contactName={modal.data}
            emailDraft={emailDraft}
            onSend={handleSendEmail}
            onRegenerate={handleRegenerateEmail}
            onClose={() => setModal({ show: false, type: null, data: null })}
          />
        )}

        {modal.type === 'new-deal' && (
          <NewDealForm
            stage={modal.data}
            onCreate={(name, prop, val) => handleCreateDealConfirm(modal.data, name, prop, val)}
            onCancel={() => setModal({ show: false, type: null, data: null })}
          />
        )}

        {modal.type === 'inspect-source' && (
          <div>
            <div className="card-head" style={{ marginBottom: '0.8rem' }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: '14px', height: '14px', marginRight: '0.4rem', color: 'var(--text-3)' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                Source Dump: {modal.data}
              </div>
            </div>
            <pre
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '0.78rem',
                whiteSpace: 'pre-wrap',
                background: 'var(--panel-sunk)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-s)',
                padding: '1rem',
                maxHeight: '22rem',
                overflowY: 'auto',
                margin: 0,
                color: 'var(--text-2)'
              }}
            >
              {contacts.find(c => c.name === modal.data)?.raw_dump || ''}
            </pre>
            <div className="btn-row" style={{ justifyContent: 'flex-end', marginTop: '1.2rem' }}>
              <Button variant="outline" onClick={() => setModal({ show: false, type: null, data: null })}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Fixed toast popups */}
      <ToastContainer />
    </div>
  );
}

// Inline Sub-component for New Deal Form
function NewDealForm({ stage, onCreate, onCancel }) {
  const [name, setName] = useState('');
  const [property, setProperty] = useState('');
  const [value, setValue] = useState('');

  return (
    <div>
      <div className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: '16px', height: '16px' }}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
        <span>New deal ({stage})</span>
      </div>
      <div className="field">
        <label>Contact name</label>
        <input placeholder="e.g. Jordan Blake" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>Property address</label>
        <input placeholder="e.g. 88 Sycamore St" value={property} onChange={(e) => setProperty(e.target.value)} />
      </div>
      <div className="field">
        <label>Estimated value</label>
        <input placeholder="e.g. $450,000" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <div className="btn-row" style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem' }}>
        <Button variant="primary" onClick={() => onCreate(name, property, value)}>
          Create deal
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
