import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/layout/Sidebar';
import SegmentsRail from './components/layout/SegmentsRail';
import Topbar from './components/layout/Topbar';
import ToastContainer from './components/ui/ToastContainer';
import Modal from './components/ui/Modal';
import Slideover from './components/ui/Slideover';
import Badge from './components/ui/Badge';
import Button from './components/ui/Button';
import ToneSelect from './components/ui/ToneSelect';
import Toggle from './components/ui/Toggle';

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

function ThingsToAvoidCollapse({ value }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
          Things to avoid
        </span>
        <button 
          onClick={() => setShow(!show)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
            fontWeight: 600,
            outline: 'none'
          }}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {show && (
        <div style={{ fontSize: '0.88rem', color: '#ffb3b3', lineHeight: '1.4', padding: '8px 12px', background: 'rgba(226, 88, 94, 0.08)', border: '1px solid rgba(226, 88, 94, 0.2)', borderRadius: '8px' }}>
          {value}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeSegment, setActiveSegment] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [segmentsCollapsed, setSegmentsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [densityCompact, setDensityCompact] = useState(true);
  const [returnToView, setReturnToView] = useState('dashboard');
  const [activeContactName, setActiveContactName] = useState(null);

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

  const activeContactId = contacts.find(c => c.name === activeContactName)?.id;

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
        change: `${(() => {
          const mapping = {
            'New Lead': 'Not Contacted',
            'Qualified': 'Research Done',
            'Showing': 'Drafted',
            'Offer': 'Sent',
            'Closed': 'Replied / Booked'
          };
          return mapping[c.stage] || c.stage || 'Not Contacted';
        })()} — ${m.tone_used || 'outreach'}`,
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
      "Not Contacted": [],
      "Research Done": [],
      "Drafted": [],
      "Sent": [],
      "Replied / Booked": []
    };
    const mapStage = (s) => {
      const mapping = {
        'New Lead': 'Not Contacted',
        'Qualified': 'Research Done',
        'Showing': 'Drafted',
        'Offer': 'Sent',
        'Closed': 'Replied / Booked'
      };
      return mapping[s] || s || 'Not Contacted';
    };
    contacts.forEach(c => {
      let stage = mapStage(c.stage);
      if (!board[stage]) {
        board[stage] = [];
      }
      board[stage].push({
        id: c.id,
        name: c.name,
        stage: stage,
        prop: c.role ? `${c.role} @ ${c.company}` : `${c.company}`,
        value: c.score ? `$${(c.score * 10000).toLocaleString()}` : '$0'
      });
    });
    setKanban(board);
  }, [contacts]);

  // Inline edit states for Contact Detail Card
  const lastInitializedContact = useRef(null);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [localLinks, setLocalLinks] = useState([]);
  const [linksCollapsed, setLinksCollapsed] = useState(true);
  const [linkedInInput, setLinkedInInput] = useState('');
  const [addingCustomLink, setAddingCustomLink] = useState(false);
  const [customPlatform, setCustomPlatform] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  
  const [settingReminder, setSettingReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderNote, setReminderNote] = useState('');

  useEffect(() => {
    if (modal.type === 'contact-details' && modal.show) {
      const c = contacts.find(x => x.name === modal.data);
      if (c && lastInitializedContact.current !== c.id) {
        setEmailInput(c.email || '');
        const links = c.social_links || [];
        setLocalLinks(links);
        setLinksCollapsed(links.length === 0);
        setReminderDate(c.reminder_at || '');
        setReminderNote(c.reminder_note || '');
        lastInitializedContact.current = c.id;
        
        setEditingEmail(false);
        setLinkedInInput('');
        setAddingCustomLink(false);
        setCustomPlatform('');
        setCustomUrl('');
        setSettingReminder(false);
      }
    } else {
      lastInitializedContact.current = null;
    }
  }, [modal.type, modal.show, modal.data, contacts]);

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
    setActiveContactName(name);
    setModal({
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

  const handleOpenEmailComposer = async (contactName) => {
    const contact = contacts.find(c => c.name === contactName);
    if (!contact) return;

    setEmailDraft({ subject: '', body: '', loading: true, error: null });
    addToast('processing', `Drafting message for ${contactName}...`);
    try {
      const res = await api('POST', `/api/contacts/${contact.id}/draft`, {
        tone: contact.tone_note || 'curiosity'
      });
      setEmailDraft({ subject: res.subject, body: res.body, loading: false, error: null });
      setSlideover({
        show: true,
        type: 'follow-up',
        data: contact.name
      });
      addToast('ready', 'Email draft ready.');
      await loadContacts();
    } catch (err) {
      console.error('Draft generation error:', err);
      setEmailDraft({ subject: '', body: '', loading: false, error: err.message || 'Failed to generate draft' });
      addToast('attn', 'Failed to generate draft.');
    }
  };

  const handleResyncMessage = (msgId) => {
    addToast('processing', 'Resyncing…');
    setTimeout(() => {
      addToast('ready', 'Outcome confirmed — no change.');
    }, 800);
  };

  const handleSaveRawDump = async (contactId, raw_dump) => {
    try {
      await api('PATCH', `/api/contacts/${contactId}/raw_dump`, { raw_dump });
      addToast('ready', 'Raw research dump updated.');
      await loadContacts();
    } catch (err) {
      console.error('Error saving raw dump:', err);
      addToast('attn', 'Failed to save raw dump.');
    }
  };

  const handleReextractProfile = async (contactId) => {
    try {
      await api('POST', `/api/contacts/${contactId}/extract`);
      addToast('ready', 'Re-extraction triggered via AI bot.');
      await loadContacts();
    } catch (err) {
      console.error('Error re-extracting profile:', err);
      addToast('attn', 'Failed to trigger re-extraction.');
    }
  };

  const handleSaveMessageDraft = async (msgId, subject_line, body) => {
    try {
      await api('PATCH', `/api/messages/${msgId}`, { subject_line, body });
      addToast('ready', 'Message draft saved.');
      await loadContacts();
    } catch (err) {
      console.error('Error saving message:', err);
      addToast('attn', 'Failed to save message draft.');
    }
  };

  const handleUpdateMessageOutcome = async (msgId, outcome) => {
    try {
      await api('PATCH', `/api/messages/${msgId}/outcome`, { outcome });
      addToast('ready', 'Outcome updated.');
      await loadContacts();
    } catch (err) {
      console.error('Error updating outcome:', err);
      addToast('attn', 'Failed to update outcome.');
    }
  };

  const handleRegenerateDraftDirect = async (contactId, tone) => {
    addToast('processing', 'Regenerating draft...');
    try {
      await api('POST', `/api/contacts/${contactId}/draft`, { tone: tone || 'curiosity' });
      addToast('ready', 'New draft generated.');
      await loadContacts();
    } catch (err) {
      console.error('Draft generation error:', err);
      addToast('attn', 'Failed to regenerate draft.');
    }
  };

  const handleGenerateDraftInline = async (contactId, tone, instruction) => {
    const res = await api('POST', `/api/contacts/${contactId}/draft`, { tone, custom_instruction: instruction });
    await loadContacts();
    return { subject: res.subject, body: res.body };
  };

  const handleInspectSource = (contactName) => {
    setModal({
      show: true,
      type: 'inspect-source',
      data: contactName
    });
  };

  // Add Deal stage kanban list
  const handleAddContact = (stage) => {
    setModal({
      show: true,
      type: 'new-contact',
      data: stage
    });
  };

  const handleCreateContactConfirm = async (stage, data, shouldExtract) => {
    const name = data.name.trim() || 'New Contact';
    const company = data.company.trim() || 'Details pending';
    const role = data.role.trim() || '';
    const email = data.email.trim() || '';
    const raw_dump = data.raw_dump.trim() || `Name: ${name} | Company: ${company}`;

    if (shouldExtract) {
      addToast('processing', 'Creating contact and extracting profile...');
    } else {
      addToast('processing', 'Creating contact...');
    }

    try {
      const res = await api('POST', '/api/contacts', {
        name,
        company,
        role,
        email,
        raw_dump,
        type: 'cold',
        stage: stage || 'Not Contacted',
        score: 50
      });

      const newId = res.contact?.id;

      setModal({ show: false, type: null, data: null });

      if (shouldExtract && newId) {
        api('POST', `/api/contacts/${newId}/extract`).then(async () => {
          addToast('ready', 'Contact created. AI extraction queued.');
          await loadContacts();
        }).catch((err) => {
          console.error('Extraction trigger error:', err);
          addToast('attn', 'Contact created but AI extraction failed to start.');
          loadContacts();
        });
      } else {
        addToast('ready', 'Contact created.');
        await loadContacts();
      }
    } catch (err) {
      console.error('Error creating contact:', err);
      addToast('attn', 'Failed to save contact.');
    }
  };

  const handleEditContactConfirm = async (contactId, updatedData) => {
    try {
      const res = await api('PATCH', `/api/contacts/${contactId}`, updatedData);
      if (res.success) {
        addToast('ready', 'Contact details updated successfully.');
        await loadContacts(); // reload contacts to refresh state
        setModal({ show: false, type: null, data: null });
      }
    } catch (err) {
      console.error(err);
      addToast('attn', 'Failed to update contact details.');
    }
  };
  const handleToggleOverrideLock = async (contactId, isLocked) => {
    try {
      const res = await api('PATCH', `/api/contacts/${contactId}`, { is_manually_overridden: isLocked });
      if (res.success) {
        addToast('ready', isLocked ? 'Automation paused/locked.' : 'Automation resumed.');
        await loadContacts();
      }
    } catch (err) {
      console.error(err);
      addToast('attn', 'Failed to update lock status.');
    }
  };
  const handleDeleteContactConfirm = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact? This will remove all message logs.')) {
      return;
    }
    try {
      const res = await api('DELETE', `/api/contacts/${contactId}`);
      if (res.success) {
        addToast('ready', 'Contact deleted successfully.');
        await loadContacts(); // reload contacts to refresh state
        setModal({ show: false, type: null, data: null });
      }
    } catch (err) {
      console.error(err);
      addToast('attn', 'Failed to delete contact.');
    }
  };

  const handleDeleteMultipleContacts = async (ids) => {
    if (!window.confirm(`Are you sure you want to delete ${ids.length} selected contact(s)? This will remove all associated message logs.`)) {
      return false;
    }
    try {
      const res = await api('POST', '/api/contacts/delete-multiple', { ids });
      if (res.success) {
        addToast('ready', `${ids.length} contact(s) deleted successfully.`);
        await loadContacts();
        return true;
      }
    } catch (err) {
      console.error(err);
      addToast('attn', 'Failed to delete selected contacts.');
      return false;
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

  // Contacts Detail Card renderer
  const renderContactDetailsCard = () => {
    const contactName = modal.data;
    const c = contacts.find(x => x.name === contactName);
    if (!c) return null;

    const handleSaveEmail = async () => {
      if (!emailInput.trim()) return;
      try {
        const res = await api('PATCH', `/api/contacts/${c.id}`, {
          email: emailInput.trim()
        });
        if (res.success) {
          addToast('ready', 'Email updated successfully.');
          setEditingEmail(false);
          await loadContacts();
        }
      } catch (err) {
        console.error(err);
        addToast('attn', 'Failed to update email.');
      }
    };

    const handleCopyEmail = () => {
      if (!c.email) return;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(c.email).catch(() => {});
      }
      addToast('ready', 'Copied email to clipboard.');
    };

    const handleSaveLinks = async (updatedLinks) => {
      try {
        const res = await api('PATCH', `/api/contacts/${c.id}`, {
          social_links: updatedLinks
        });
        if (res.success) {
          setLocalLinks(updatedLinks);
          await loadContacts();
        }
      } catch (err) {
        console.error(err);
        addToast('attn', 'Failed to save social links.');
      }
    };

    const handleAddDefaultLinkedIn = async () => {
      if (!linkedInInput.trim()) return;
      const updated = [...localLinks, { platform: 'LinkedIn', url: linkedInInput.trim() }];
      await handleSaveLinks(updated);
      setLinkedInInput('');
    };

    const handleAddCustomLink = async () => {
      if (!customPlatform.trim() || !customUrl.trim()) {
        addToast('attn', 'Platform and URL are required.');
        return;
      }
      const updated = [...localLinks, { platform: customPlatform.trim(), url: customUrl.trim() }];
      await handleSaveLinks(updated);
      setCustomPlatform('');
      setCustomUrl('');
      setAddingCustomLink(false);
    };

    const handleRemoveLink = async (indexToRemove) => {
      const updated = localLinks.filter((_, idx) => idx !== indexToRemove);
      await handleSaveLinks(updated);
    };

    const handleSaveReminder = async () => {
      try {
        const res = await api('PATCH', `/api/contacts/${c.id}`, {
          reminder_at: reminderDate,
          reminder_note: reminderNote
        });
        if (res.success) {
          addToast('ready', 'Reminder scheduled successfully.');
          setSettingReminder(false);
          await loadContacts();
        }
      } catch (err) {
        console.error(err);
        addToast('attn', 'Failed to save reminder.');
      }
    };

    const parseNotes = (notesText) => {
      if (!notesText) return [];
      const lines = notesText.split('\n');
      const parsed = [];
      lines.forEach(line => {
        const colIdx = line.indexOf(':');
        if (colIdx !== -1) {
          const label = line.substring(0, colIdx).trim();
          const value = line.substring(colIdx + 1).trim();
          if (label && value) {
            parsed.push({ label, value });
          }
        }
      });
      return parsed;
    };

    const renderParsedNotes = (notesText) => {
      const items = parseNotes(notesText);
      if (items.length === 0) {
        return <div style={{ color: 'var(--text-3)', fontStyle: 'italic', fontSize: '0.85rem' }}>No research notes available.</div>;
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.6rem' }}>
          {items.map((item, idx) => {
            if (item.label.toLowerCase() === 'confidence level') {
              const isHigh = item.value.toLowerCase() === 'high';
              const isMedium = item.value.toLowerCase() === 'medium';
              const badgeBg = isHigh ? 'rgba(63, 178, 127, 0.15)' : isMedium ? 'rgba(201, 162, 75, 0.15)' : 'rgba(255, 255, 255, 0.08)';
              const badgeColor = isHigh ? '#3FB27F' : isMedium ? '#C9A24B' : 'var(--text-3)';
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
                    {item.label}
                  </span>
                  <span style={{
                    background: badgeBg,
                    color: badgeColor,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {item.value}
                  </span>
                </div>
              );
            }

            if (item.label.toLowerCase() === 'things to avoid') {
              return (
                <ThingsToAvoidCollapse key={idx} value={item.value} />
              );
            }

            const isKeyHook = item.label.toLowerCase() === 'strongest personalization angle';

            return (
              <div 
                key={idx} 
                style={{
                  paddingLeft: isKeyHook ? '10px' : '0',
                  borderLeft: isKeyHook ? '3px solid rgba(63, 178, 127, 0.4)' : 'none',
                  background: isKeyHook ? 'rgba(63, 178, 127, 0.02)' : 'none',
                  paddingTop: isKeyHook ? '6px' : '0',
                  paddingBottom: isKeyHook ? '6px' : '0'
                }}
              >
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, marginBottom: '2px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-1)', lineHeight: '1.4' }}>
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    const hasLinkedIn = localLinks.some(l => l.platform.toLowerCase() === 'linkedin');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#fff', position: 'relative' }}>
        
        {/* X Close Button in top right */}
        <button 
          onClick={() => setModal({ show: false, type: null, data: null })}
          style={{
            position: 'absolute',
            top: '-15px',
            right: '-15px',
            background: 'none',
            border: 'none',
            color: 'var(--text-3)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none'
          }}
          title="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="head-icon-wrap" style={{ alignSelf: 'center', marginBottom: '0.2rem' }}>
          <div className="head-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>

        <h1 className="wizard-title" style={{ textAlign: 'center', margin: 0 }}>Client details</h1>
        <p className="wizard-subtitle" style={{ textAlign: 'center', margin: '0 0 0.2rem', color: 'var(--text-3)' }}>
          Profile and status overview for this contact.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{c.name}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginTop: '2px' }}>
              {c.role || 'No Role Specified'}
            </div>
          </div>
          <Badge status={c.ai_status} />
        </div>

        {/* General Meta Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
            <div className="field">
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>Company</label>
              <div style={{ fontSize: '0.92rem', color: 'var(--text-1)', padding: '6px 0' }}>{c.company || '—'}</div>
            </div>
            <div className="field">
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>Industry</label>
              <div style={{ fontSize: '0.92rem', color: 'var(--text-1)', padding: '6px 0' }}>
                {c.industry ? c.industry : <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Not specified</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
            <div className="field">
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>Stage / Status</label>
              <div style={{ fontSize: '0.92rem', color: 'var(--text-1)', padding: '6px 0' }}>
                <span style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  {c.stage || 'Not Contacted'}
                </span>
              </div>
            </div>
            <div className="field">
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>Last Contacted</label>
              <div style={{ fontSize: '0.92rem', color: 'var(--text-1)', padding: '6px 0' }}>{c.last ? new Date(c.last).toLocaleDateString() : 'Never'}</div>
            </div>
          </div>

          {/* Email Field with manual Add & Clipboard Copy */}
          <div className="field">
            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>Email</label>
            {c.email ? (
              <div 
                onClick={handleCopyEmail}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.9rem', 
                  color: 'var(--text-1)',
                  marginTop: '4px'
                }}
              >
                <span>{c.email}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)' }}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </div>
            ) : (
              <div>
                {editingEmail ? (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <input 
                      type="email"
                      placeholder="Enter email address"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'var(--panel-sunk)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-1)',
                        padding: '6px 10px',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          await handleSaveEmail();
                        }
                      }}
                    />
                    <button 
                      onClick={handleSaveEmail}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', background: 'var(--accent)', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setEditingEmail(false)}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>No email on file</span>
                    <button 
                      onClick={() => {
                        setEmailInput('');
                        setEditingEmail(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textDecoration: 'underline'
                      }}
                    >
                      + Add
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Social / Links Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.8rem' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>Social / Links</span>
              <button 
                onClick={() => setLinksCollapsed(!linksCollapsed)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'underline'
                }}
              >
                {linksCollapsed ? 'Expand' : 'Collapse'}
              </button>
            </div>

            {!linksCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '4px 0' }}>
                
                {/* Default LinkedIn Input Row if not already added */}
                {!hasLinkedIn && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', width: '80px', color: 'var(--text-2)', fontWeight: 600 }}>LinkedIn</span>
                    <input 
                      type="text"
                      placeholder="+ Add URL"
                      value={linkedInInput}
                      onChange={(e) => setLinkedInInput(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'var(--panel-sunk)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-1)',
                        padding: '4px 8px',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          await handleAddDefaultLinkedIn();
                        }
                      }}
                    />
                    <button 
                      onClick={handleAddDefaultLinkedIn}
                      style={{
                        background: 'var(--accent)',
                        border: 'none',
                        color: '#000',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      + Add
                    </button>
                  </div>
                )}

                {/* Render Existing Links */}
                {localLinks.map((link, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'rgba(255,255,255,0.01)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-2)' }}>{link.platform}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-3)', wordBreak: 'break-all' }}>{link.url}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <a 
                        href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}
                        title="Open Link"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                      <button 
                        onClick={() => handleRemoveLink(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                        title="Remove Link"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Custom Link Input Row */}
                {addingCustomLink ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                    <input 
                      type="text"
                      placeholder="Platform (e.g. X, Web)"
                      value={customPlatform}
                      onChange={(e) => setCustomPlatform(e.target.value)}
                      style={{
                        width: '100px',
                        background: 'var(--panel-sunk)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-1)',
                        padding: '4px 8px',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                    />
                    <input 
                      type="text"
                      placeholder="Paste URL"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'var(--panel-sunk)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-1)',
                        padding: '4px 8px',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          await handleAddCustomLink();
                        }
                      }}
                    />
                    <button 
                      onClick={handleAddCustomLink}
                      style={{
                        background: 'var(--accent)',
                        border: 'none',
                        color: '#000',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setAddingCustomLink(false)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        color: 'var(--text-2)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setAddingCustomLink(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '4px',
                      textDecoration: 'underline'
                    }}
                  >
                    + Add another link
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Inline Reminder Setup */}
          {settingReminder && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'rgba(255,255,255,0.02)', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-2)' }}>Schedule Follow-up Reminder</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="datetime-local" 
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.target.showPicker();
                    } catch (err) {}
                  }}
                  onFocus={(e) => {
                    try {
                      e.target.showPicker();
                    } catch (err) {}
                  }}
                  style={{
                    background: 'var(--panel-sunk)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-1)',
                    padding: '6px 8px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <input 
                type="text" 
                placeholder="Reminder notes (e.g. Call about dental CRM integration)"
                value={reminderNote}
                onChange={(e) => setReminderNote(e.target.value)}
                style={{
                  background: 'var(--panel-sunk)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-1)',
                  padding: '6px 8px',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button 
                  className="primary-btn" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', background: 'var(--accent)', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  onClick={handleSaveReminder}
                >
                  Save Reminder
                </button>
                <button 
                  className="secondary-btn" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}
                  onClick={() => setSettingReminder(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Parsed Notes / AI Synthesis Section */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>Research Notes</span>
            {renderParsedNotes(c.notes || '')}
          </div>

        </div>

        {/* Bottom Action Strip */}
        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem', width: '100%', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button 
            className="primary-btn" 
            style={{ 
              flex: 1.5, 
              padding: '12px', 
              background: '#3FB27F', 
              borderColor: '#3FB27F', 
              color: '#000', 
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
            onClick={async () => {
              setModal({ show: false, type: null, data: null });
              await handleOpenEmailComposer(c.name);
            }}
          >
            Generate Draft
          </button>
          <button 
            className="secondary-btn" 
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: 'none', 
              border: '1px solid var(--border)', 
              color: 'var(--text-1)', 
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
            onClick={() => setSettingReminder(true)}
          >
            Set Reminder
          </button>
          <button 
            className="secondary-btn" 
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: 'none', 
              border: '1px solid var(--border)', 
              color: 'var(--text-1)', 
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
            onClick={() => setModal({ show: true, type: 'edit-contact', data: c })}
          >
            Edit
          </button>
          <button 
            className="secondary-btn" 
            style={{ 
              flex: 0.9, 
              padding: '12px', 
              background: 'rgba(239, 68, 68, 0.05)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              color: '#ef4444', 
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => setModal({ show: true, type: 'edit-contact', data: c, startWithDeleteConfirm: true })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '-1px' }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    );
  };

  const renderFollowupSlideover = () => {
    const name = slideover.data;
    const bodyContent = emailDraft.body || `Hi ${name.split(' ')[0]},\n\n(No draft generated)`;
    const subjectContent = emailDraft.subject || '';

    const handleCopyFollowup = () => {
      if (navigator.clipboard) {
        const textToCopy = subjectContent ? `Subject: ${subjectContent}\n\n${bodyContent}` : bodyContent;
        navigator.clipboard.writeText(textToCopy).catch(() => {});
      }
      addToast('ready', 'Copied to clipboard.');
    };

    return (
      <div>
        <div className="status ready" style={{ marginBottom: '1rem' }}>
          <span className="sdot" style={{ background: 'var(--accent)' }}></span>Ready to send
        </div>
        <div className="read-block" style={{ fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {bodyContent}
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
    const notificationsList = [];
    contacts.forEach(c => {
      if (c.reminder_at) {
        const reminderDate = new Date(c.reminder_at);
        const isOverdue = reminderDate < new Date();
        notificationsList.push({
          id: `reminder-${c.id}`,
          text: isOverdue 
            ? `Follow-up due for ${c.name} (${c.company || 'Client'})` 
            : `Follow-up scheduled for ${c.name} (${c.company || 'Client'})`,
          date: isOverdue ? 'Overdue' : reminderDate.toLocaleString(),
          isMint: isOverdue,
          contactName: c.name
        });
      }
      if (c.stage === 'Replied' || c.stage === 'Replied / Booked') {
        notificationsList.push({
          id: `replied-${c.id}`,
          text: `${c.name} replied or booked. Check inbox!`,
          date: 'Recent',
          isMint: true,
          contactName: c.name
        });
      }
    });

    notificationsList.sort((a, b) => {
      if (a.isMint && !b.isMint) return -1;
      if (!a.isMint && b.isMint) return 1;
      return 0;
    });

    const handleNotificationClick = (contactName) => {
      setSlideover({ show: false, type: null, data: null });
      handleOpenContact(contactName);
    };

    return (
      <div>
        <div className="timeline">
          {notificationsList.map((n) => (
            <div 
              key={n.id} 
              className={`tl-item ${n.isMint ? 'mint' : ''}`}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '8px' }}
              onClick={() => handleNotificationClick(n.contactName)}
            >
              <div className="tl-text" style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{n.text}</div>
              <div className="tl-date" style={{ fontSize: '11px', color: n.isMint ? 'var(--accent)' : 'var(--text-3)' }}>{n.date}</div>
            </div>
          ))}
          {notificationsList.length === 0 && (
            <div style={{ padding: '20px 8px', fontSize: '12.5px', color: 'var(--text-2)', textAlign: 'center' }}>
              No notifications at this time.
            </div>
          )}
        </div>
        <div className="btn-row" style={{ marginTop: '1.5rem' }}>
          <Button variant="outline" onClick={() => addToast('ready', 'All notifications caught up.')}>
            Mark all read
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="liquid-glass-bg">
      {/* Ambient background layers */}
      <div className="ambient">
        <div className="ambient-blob blob-a"></div>
        <div className="ambient-blob blob-b"></div>
        <div className="ambient-blob blob-c"></div>
        <div className="ambient-blob blob-d"></div>
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
             contactNameForFullProfile={activeContactName || (currentView === 'contact-full' ? returnToView : '')}
             searchQuery={searchQuery}
             onSearchQueryChange={setSearchQuery}
             onShowNotifications={() => setSlideover({ show: true, type: 'notification', data: null })}
             onOpenImport={() => setModal({ show: true, type: 'import', data: null })}
             onOpenNewContact={() => setModal({ show: true, type: 'new-contact', data: 'Not Contacted' })}
             hasNotifications={contacts.some(c => c.reminder_at && new Date(c.reminder_at) < new Date())}
             contactsCount={contacts.length}
          />

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Segments Secondary rail */}
            <SegmentsRail
              show={currentView === 'pipeline'}
              currentView={currentView}
              activeSegment={activeSegment}
              onSegmentChange={setActiveSegment}
              collapsed={segmentsCollapsed}
              onToggleCollapse={() => setSegmentsCollapsed(!segmentsCollapsed)}
            />

            {/* View router container */}
            <main
              className={currentView === 'contacts' ? '' : 'dashboard-pill'}
              style={currentView === 'contacts' ? { flex: 1, display: 'flex', overflow: 'hidden', padding: 0 } : { flex: 1, overflowY: 'auto', padding: '24px' }}
            >
              
              {currentView === 'dashboard' && (
                <Dashboard
                  contactsList={contacts}
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
                  onAddDeal={handleAddContact}
                  onEditContact={(contact) => setModal({ show: true, type: 'edit-contact', data: contact })}
                  onDeleteMultiple={handleDeleteMultipleContacts}
                  onToggleOverrideLock={handleToggleOverrideLock}
                />
              )}

              {currentView === 'contacts' && (
                <Contacts
                  contactsList={contacts}
                  activeSegment={activeSegment}
                  onOpenContact={handleOpenContact}
                  onToneChange={handleToneChange}
                  onUpdateMessageOutcome={handleUpdateMessageOutcome}
                  onGenerateDraftInline={handleGenerateDraftInline}
                  availableTones={availableTones}
                  loadContacts={loadContacts}
                  onToggleOverrideLock={handleToggleOverrideLock}
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
                  contact={contacts.find(x => x.name === activeContactName) 
                    || contacts.find(x => x.id === activeContactId) 
                    || null}
                  onBack={() => setCurrentView(returnToView)}
                  onToneChange={handleToneChange}
                  onGenerateDraft={handleOpenEmailComposer}
                  onResyncMessage={handleResyncMessage}
                  onInspectSource={(name) => setModal({ show: true, type: 'inspect-source', data: name })}
                  availableTones={availableTones}
                  onSaveRawDump={handleSaveRawDump}
                  onReextractProfile={handleReextractProfile}
                  onSaveMessageDraft={handleSaveMessageDraft}
                  onUpdateMessageOutcome={handleUpdateMessageOutcome}
                  onRegenerateDraftDirect={handleRegenerateDraftDirect}
                  onGenerateDraftInline={handleGenerateDraftInline}
                  onToggleOverrideLock={handleToggleOverrideLock}
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
          ''
        }
        subtitle={
          slideover.type === 'notification' ? `${contacts.filter(c => c.reminder_at && new Date(c.reminder_at) < new Date()).length} due` :
          slideover.type === 'follow-up' ? `Drafted for ${activeContactName || slideover.data}` :
          ''
        }
        headerActions={null}
      >
        {slideover.type === 'follow-up' && renderFollowupSlideover()}
        {slideover.type === 'notification' && renderNotificationsSlideover()}
      </Slideover>

      {/* Global Modal wrapper */}
      <Modal
        show={modal.show}
        onClose={() => setModal({ show: false, type: null, data: null })}
        className={modal.type === 'new-contact' || modal.type === 'edit-contact' || modal.type === 'contact-details' ? 'wizard-card-bg' : ''}
        style={
          modal.type === 'contact-details' || modal.type === 'edit-contact'
            ? { width: '580px', padding: '38px 34px 30px', borderRadius: '28px', position: 'relative' }
            : modal.type === 'new-contact'
            ? { width: '480px', padding: '34px 30px 26px', borderRadius: '28px' }
            : {}
        }
      >
        {modal.type === 'contact-details' && renderContactDetailsCard()}

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

        {modal.type === 'new-contact' && (
          <NewContactForm
            stage={modal.data}
            onCreate={(data, shouldExtract) => handleCreateContactConfirm(modal.data, data, shouldExtract)}
            onConfirmImport={handleAutoDistributeLeads}
            onCancel={() => setModal({ show: false, type: null, data: null })}
          />
        )}

        {modal.type === 'edit-contact' && (
          <EditContactForm
            contact={modal.data}
            onSave={handleEditContactConfirm}
            onDelete={handleDeleteContactConfirm}
            onCancel={() => setModal({ show: false, type: null, data: null })}
            startWithDeleteConfirm={modal.startWithDeleteConfirm}
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

// Inline Sub-component for New Contact Form (Stepped Wizard Flow)
function NewContactForm({ stage, onCreate, onConfirmImport, onCancel }) {
  const [step, setStep] = useState(0);
  
  // Step 1: Manual Form Fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedStage, setSelectedStage] = useState(stage || 'Not Contacted');
  const [notes, setNotes] = useState('');
  const [rawContext, setRawContext] = useState('');
  const [shouldExtract, setShouldExtract] = useState(true);
  
  // Step 5: Scrape Account Fields
  const [role, setRole] = useState('Client');
  const [industry, setIndustry] = useState('');
  const [scrapeText, setScrapeText] = useState('');
  const [scraping, setScraping] = useState(false);
  
  // Step 2: File Import State
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Sync stage prop if it changes
  useEffect(() => {
    if (stage) {
      setSelectedStage(stage);
    }
  }, [stage]);

  const handleManualFormSubmit = () => {
    if (!name || !company) {
      addToast('attn', 'Name and Company are required.');
      return;
    }
    setStep(4);
  };

  const handleManualSave = async () => {
    setLoading(true);
    // Combine phone, source, notes, and rawContext into raw_dump
    const rawDumpParts = [];
    if (phone) rawDumpParts.push(`Phone: ${phone}`);
    if (source) rawDumpParts.push(`Source: ${source}`);
    if (notes) rawDumpParts.push(`Notes: ${notes}`);
    if (rawContext) rawDumpParts.push(`Context:\n${rawContext}`);
    const rawDump = rawDumpParts.join('\n\n') || 'Manual entry contact created.';

    try {
      await onCreate({
        name,
        company,
        role: role || 'Client',
        industry: industry || '',
        email,
        raw_dump: rawDump,
        score: 50,
        stage: selectedStage
      }, shouldExtract);
      setLoading(false);
      setStep(3); // success step
    } catch (err) {
      setLoading(false);
    }
  };

  const handleScrapeSubmit = async () => {
    if (!scrapeText || !scrapeText.trim()) {
      addToast('attn', 'Please paste some text to scrape.');
      return;
    }
    setScraping(true);
    try {
      const response = await fetch('/api/contacts/scrape-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: scrapeText })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze text.');
      }
      
      const fields = data.data;
      setName(fields.name || fields.company || '');
      setCompany(fields.company || '');
      setRole(fields.role || 'Client');
      setIndustry(fields.industry || '');
      setEmail(fields.email || '');
      setPhone(fields.phone || '');
      setSource(fields.source || '');
      setNotes(fields.notes || '');
      setRawContext(scrapeText);
      
      addToast('ready', 'Gemini successfully parsed and pre-filled the contact details.');
      setStep(1); // Transition to manual review
    } catch (err) {
      console.error(err);
      addToast('attn', err.message || 'Failed to analyze profile.');
    } finally {
      setScraping(false);
    }
  };

  const handleBulkImport = async () => {
    setLoading(true);
    try {
      await onConfirmImport();
      setLoading(false);
      setStep(3); // success step
    } catch (err) {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Progress Dots */}
      <div className="progress">
        {step === 2 ? (
          <>
            <span className={`dot ${step === 0 ? 'active' : 'done'}`}></span>
            <span className={`dot ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}></span>
            <span className={`dot ${step === 3 ? 'active' : ''}`}></span>
          </>
        ) : (
          <>
            <span className={`dot ${step === 0 ? 'active' : 'done'}`}></span>
            <span className={`dot ${step === 1 || step === 5 ? 'active' : (step === 4 || step === 3) ? 'done' : ''}`}></span>
            <span className={`dot ${step === 4 ? 'active' : step === 3 ? 'done' : ''}`}></span>
            <span className={`dot ${step === 3 ? 'active' : ''}`}></span>
          </>
        )}
      </div>

      <div id="steps">
        {/* STEP 0: choose entry method */}
        <div className={`step ${step === 0 ? 'active' : ''}`}>
          <div className="head-icon-wrap">
            <div className="head-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <h1 className="wizard-title">Add a client</h1>
          <p className="wizard-subtitle">How would you like to bring this client into your pipeline?</p>

          <div className="option-row" onClick={() => setStep(1)}>
            <div className="row-ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div className="row-text">
              <div className="t">Manual entry</div>
              <div className="s">Fill in client &amp; deal details yourself</div>
            </div>
            <div className="row-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </div>

          <div className="option-row" onClick={() => setStep(5)}>
            <div className="row-ico" style={{ color: 'var(--accent)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="row-text">
              <div className="t">Scrape account</div>
              <div className="s">Extract details from copy-pasted text using AI</div>
            </div>
            <div className="row-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </div>

          <div className="option-row" onClick={() => setStep(2)}>
            <div className="row-ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <div className="row-text">
              <div className="t">Bulk import</div>
              <div className="s">Drop a spreadsheet of leads or clients</div>
            </div>
            <div className="row-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </div>
        </div>

        {/* STEP 1: manual form */}
        <div className={`step ${step === 1 ? 'active' : ''}`}>
          <div className="head-icon-wrap">
            <div className="head-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
          <h1 className="wizard-title">Client details</h1>
          <p className="wizard-subtitle">Basic info so this lead lands in the right stage.</p>

          <div className="field">
            <label>Client name</label>
            <input type="text" placeholder="e.g. Sarah Ahmed" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Company</label>
              <input type="text" placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Source</label>
              <input type="text" placeholder="e.g. LinkedIn, Email" value={source} onChange={(e) => setSource(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Role</label>
              <input type="text" placeholder="e.g. VP of Engineering" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Industry</label>
              <input type="text" placeholder="e.g. SaaS, Logistics" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Email</label>
              <input type="email" placeholder="client@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Phone</label>
              <input type="tel" placeholder="+92 300 0000000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Pipeline stage</label>
            <select className="tone-select" value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)}>
              <option value="Not Contacted">Not Contacted</option>
              <option value="Research Done">Research Done</option>
              <option value="Drafted">Drafted</option>
              <option value="Sent">Sent</option>
              <option value="Replied / Booked">Replied / Booked</option>
            </select>
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea 
              rows={4}
              placeholder="Any context worth remembering..." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              style={{ width: '100%', background: 'var(--panel-sunk)', border: '1px solid var(--border)', borderRadius: 'var(--radius-s)', color: 'var(--text-1)', padding: '0.6rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.8rem', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>Trigger AI Extraction</span>
              <span style={{ fontSize: '0.70rem', color: 'var(--text-2)' }}>Automatically extract structured data using LLM</span>
            </div>
            <Toggle on={shouldExtract} onChange={() => setShouldExtract(!shouldExtract)} />
          </div>

          <button className="primary-btn" onClick={handleManualFormSubmit}>
            Continue
          </button>
        </div>

        {/* STEP 4: optional context window */}
        <div className={`step ${step === 4 ? 'active' : ''}`}>
          <div className="head-icon-wrap">
            <div className="head-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
          </div>
          <h1 className="wizard-title">Add context</h1>
          <p className="wizard-subtitle">Paste biography, LinkedIn profile, or email thread (Optional).</p>

          <div className="field">
            <label>Raw text / Context</label>
            <textarea 
              rows={8}
              placeholder="Paste large copy/pasted bio or research here... AI extraction will extract additional info automatically." 
              value={rawContext} 
              onChange={(e) => setRawContext(e.target.value)} 
              style={{ width: '100%', background: 'var(--panel-sunk)', border: '1px solid var(--border)', borderRadius: 'var(--radius-s)', color: 'var(--text-1)', padding: '0.6rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.85rem' }}
            />
          </div>

          <button className="primary-btn" onClick={handleManualSave} disabled={loading}>
            {loading ? 'Saving client...' : 'Save & continue'}
          </button>
        </div>

        {/* STEP 5: Scrape Account (Gemini AI Extraction) */}
        <div className={`step ${step === 5 ? 'active' : ''}`}>
          <div className="head-icon-wrap">
            <div className="head-icon" style={{ background: 'rgba(91, 141, 239, 0.15)', color: '#5B8DEF' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <h1 className="wizard-title">Scrape account</h1>
          <p className="wizard-subtitle">Paste a LinkedIn bio, resume, biography, or conversation history below. Gemini will sort and pre-fill the details.</p>

          <div className="field">
            <label>Raw Copy-Pasted Account Data</label>
            <textarea 
              rows={8}
              placeholder="Paste LinkedIn profile text, bio, or email dump here..." 
              value={scrapeText} 
              onChange={(e) => setScrapeText(e.target.value)} 
              style={{ width: '100%', background: 'var(--panel-sunk)', border: '1px solid var(--border)', borderRadius: 'var(--radius-s)', color: 'var(--text-1)', padding: '0.6rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.85rem' }}
            />
          </div>

          <button className="primary-btn" onClick={handleScrapeSubmit} disabled={scraping}>
            {scraping ? 'Analyzing with Gemini...' : 'Analyze & Populate'}
          </button>
        </div>

        {/* STEP 2: bulk import / dropzone */}
        <div className={`step ${step === 2 ? 'active' : ''}`}>
          <div className="head-icon-wrap">
            <div className="head-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
          </div>
          <h1 className="wizard-title">Bulk import</h1>
          <p className="wizard-subtitle">Drop a spreadsheet and we'll map the columns for you.</p>

          <div 
            className={`dropzone ${dragActive ? 'drag' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="dz-ico">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="dz-title">Drop your file here</div>
            <div className="dz-sub">or <b>click to browse</b> — .xlsx, .csv up to 10MB</div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".csv,.xlsx,.xls" 
            onChange={handleFileChange}
          />

          <div className={`file-chip ${selectedFile ? 'show' : ''}`}>
            <div className="fc-ico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="fc-info">
              <div className="fc-name">{selectedFile?.name || ''}</div>
              <div className="fc-size">{selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : ''}</div>
            </div>
            <div className="fc-remove" onClick={removeFile}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>

          <button className="primary-btn" onClick={handleBulkImport} disabled={loading || !selectedFile}>
            {loading ? 'Importing leads...' : 'Import & continue'}
          </button>
        </div>

        {/* STEP 3: success */}
        <div className={`step ${step === 3 ? 'active' : ''}`}>
          <div className="success-state">
            <div className="s-ico">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="wizard-title">Client added</h1>
            <p className="wizard-subtitle" style={{ marginBottom: '22px' }}>This lead now lives in your pipeline. You can edit it any time.</p>
            <button className="primary-btn" onClick={onCancel}>Done</button>
          </div>
        </div>
      </div>

      {step !== 3 && (
        <div className="footer" style={{ marginTop: '22px', display: 'flex', justifyContent: 'space-between' }}>
          <button className="pill-btn" onClick={() => {
            if (step === 0) onCancel();
            else if (step === 4) setStep(1);
            else if (step === 5) setStep(0);
            else if (step === 1 && scrapeText) setStep(5);
            else setStep(0);
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          {step === 4 ? (
            <button className="pill-btn" onClick={handleManualSave} disabled={loading}>
              Skip &amp; Save
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ) : (
            <button className="pill-btn" onClick={onCancel}>
              Skip
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EditContactForm({ contact, onSave, onDelete, onCancel, startWithDeleteConfirm = false }) {
  const [name, setName] = useState(contact.name || '');
  const [company, setCompany] = useState(contact.company || '');
  const [role, setRole] = useState(contact.role || '');
  const [industry, setIndustry] = useState(contact.industry || '');
  const [email, setEmail] = useState(contact.email || '');
  const [source, setSource] = useState(() => {
    if (!contact.raw_dump) return '';
    const match = contact.raw_dump.match(/Source:\s*([^\r\n]*)/i);
    return match ? match[1].trim() : '';
  });
  const [stage, setStage] = useState(contact.stage || 'New Lead');
  const [rawDump, setRawDump] = useState(contact.raw_dump || '');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(startWithDeleteConfirm);

  const handleSave = async () => {
    if (!name || !company) {
      addToast('attn', 'Name and Company are required.');
      return;
    }

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);

    // Update the Source header inside raw_dump
    let finalRawDump = rawDump;
    const sourceRegex = /Source:\s*[^\r\n]*/i;
    if (sourceRegex.test(finalRawDump)) {
      if (source) {
        finalRawDump = finalRawDump.replace(sourceRegex, `Source: ${source}`);
      } else {
        finalRawDump = finalRawDump.replace(sourceRegex, '').trim();
      }
    } else {
      if (source) {
        finalRawDump = `Source: ${source}\n\n${finalRawDump}`.trim();
      }
    }

    try {
      await onSave(contact.id, {
        name,
        company,
        role,
        industry,
        email,
        score: contact.score || 50,
        stage,
        raw_dump: finalRawDump,
        social_links: contact.social_links // PRESERVE
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const mapStageToSelect = (s) => {
    const mapping = {
      'New Lead': 'New Lead',
      'Not Contacted': 'New Lead',
      'Qualified': 'Qualified',
      'Research Done': 'Qualified',
      'Showing': 'Showing',
      'Drafted': 'Showing',
      'Offer': 'Offer',
      'Sent': 'Offer',
      'Closed': 'Closed',
      'Replied / Booked': 'Closed'
    };
    return mapping[s] || 'New Lead';
  };

  const [selectedStage, setSelectedStage] = useState(mapStageToSelect(stage));

  const handleSelectStage = (val) => {
    setSelectedStage(val);
    const mapping = {
      'New Lead': 'New Lead',
      'Qualified': 'Qualified',
      'Showing': 'Showing',
      'Offer': 'Offer',
      'Closed': 'Closed'
    };
    setStage(mapping[val] || val);
  };

  if (showDeleteConfirm) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', color: '#fff', textAlign: 'center', padding: '10px 0' }}>
        <div className="head-icon-wrap" style={{ alignSelf: 'center', marginBottom: '0.4rem' }}>
          <div className="head-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        <h1 className="wizard-title" style={{ margin: 0, fontSize: '1.4rem' }}>Confirm Deletion</h1>
        <p className="wizard-subtitle" style={{ color: 'var(--text-2)', lineHeight: 1.5, fontSize: '0.9rem' }}>
          Are you sure you want to permanently delete <strong>{name}</strong>? This action cannot be undone and will delete all associated outreach drafts, messaging history, and personalized context.
        </p>

        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', width: '100%' }}>
          <button 
            className="primary-btn" 
            style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={async () => {
              setLoading(true);
              try {
                await onDelete(contact.id);
              } catch (err) {
                console.error(err);
              } finally {
                setLoading(false);
                setShowDeleteConfirm(false);
              }
            }}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Confirm Delete'}
          </button>
          <button 
            className="secondary-btn" 
            style={{ 
              flex: 1, 
              padding: '10px', 
              background: 'none', 
              border: '1px solid var(--border)', 
              color: 'var(--text-1)', 
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
            onClick={() => {
              setShowDeleteConfirm(false);
              if (startWithDeleteConfirm) {
                onCancel();
              }
            }}
            disabled={loading}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', color: '#fff', textAlign: 'center', padding: '10px 0' }}>
        <div className="head-icon-wrap" style={{ alignSelf: 'center', marginBottom: '0.4rem' }}>
          <div className="head-icon" style={{ background: 'rgba(226, 88, 94, 0.1)', color: '#ef4444' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        <h1 className="wizard-title" style={{ margin: 0, fontSize: '1.4rem' }}>Confirm Changes</h1>
        <p className="wizard-subtitle" style={{ color: 'var(--text-2)', lineHeight: 1.5, fontSize: '0.9rem' }}>
          Saving these changes will modify the contact record. If the background context, role, or company details are changed, it will directly affect the personalized outreach and follow-up messaging for this contact.
        </p>

        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', width: '100%' }}>
          <button 
            className="primary-btn" 
            style={{ flex: 1, padding: '10px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Confirm Save'}
          </button>
          <button 
            className="secondary-btn" 
            style={{ 
              flex: 1, 
              padding: '10px', 
              background: 'none', 
              border: '1px solid var(--border)', 
              color: 'var(--text-1)', 
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
            onClick={() => setShowConfirm(false)}
            disabled={loading}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card-head" style={{ marginBottom: '0.4rem' }}>
        <div className="card-title">Edit Contact</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="field">
          <label>Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Company</label>
          <input value={company} onChange={e => setCompany(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="field">
          <label>Role</label>
          <input value={role} onChange={e => setRole(e.target.value)} />
        </div>
        <div className="field">
          <label>Industry</label>
          <input value={industry} onChange={e => setIndustry(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="field">
          <label>Email Address</label>
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Source</label>
          <input placeholder="e.g. LinkedIn, Email" value={source} onChange={e => setSource(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Pipeline Stage</label>
        <select value={selectedStage} onChange={e => handleSelectStage(e.target.value)} className="select-input" style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--panel-sunk)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
          <option value="New Lead">New Lead (Not Contacted)</option>
          <option value="Qualified">Qualified (Research Done)</option>
          <option value="Showing">Showing (Drafted)</option>
          <option value="Offer">Offer (Sent)</option>
          <option value="Closed">Closed (Replied / Booked)</option>
        </select>
      </div>

      <div className="field">
        <label>Raw Research Dump / Notes</label>
        <textarea
          style={{ height: '7rem', resize: 'vertical', width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--panel-sunk)', border: '1px solid var(--border)', color: 'var(--text-1)', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}
          value={rawDump}
          onChange={e => setRawDump(e.target.value)}
        />
      </div>

      <div className="btn-row" style={{ justifyContent: 'space-between', marginTop: '1.2rem' }}>
        <Button 
          variant="outline" 
          style={{ borderColor: '#ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }} 
          onClick={() => setShowDeleteConfirm(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '-1px' }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Delete Contact
        </Button>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
