import React, { useState, useEffect } from 'react';
import { addToast } from '../hooks/useToast';

export default function Contacts({
  contactsList = [],
  activeSegment = 'all',
  onOpenContact,
  onToneChange,
  onUpdateMessageOutcome,
  onGenerateDraftInline,
  availableTones = [],
  loadContacts
}) {
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [threadCollapsed, setThreadCollapsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeContactId, setActiveContactId] = useState(null);
  
  // local drafts state: { [contactId]: { subject, body } }
  const [drafts, setDrafts] = useState({});
  const [refineInstructions, setRefineInstructions] = useState({});
  const [generating, setGenerating] = useState(false);
  const [openPillMenuId, setOpenPillMenuId] = useState(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Sync activeContactId when contactsList loads
  useEffect(() => {
    if (contactsList.length > 0 && !activeContactId) {
      setActiveContactId(contactsList[0].id);
    }
  }, [contactsList, activeContactId]);

  const activeContact = contactsList.find(c => c.id === activeContactId) || contactsList[0] || null;

  // Initialize draft when switching contacts
  useEffect(() => {
    if (activeContact && !drafts[activeContact.id]) {
      // Set default draft
      setDrafts(prev => ({
        ...prev,
        [activeContact.id]: {
          subject: activeContact.messages?.[0]?.subject_line || 'Confirming your training session',
          body: activeContact.messages?.[0]?.body || 'Hi there,\n\nWe\'d love to schedule a session.\n\nBest,\nOutreach Team'
        }
      }));
    }
  }, [activeContact]);

  const getFilteredContacts = () => {
    return contactsList.filter(c => {
      const term = searchQuery.trim().toLowerCase();
      const matchesSearch = !term || 
        c.name.toLowerCase().includes(term) || 
        (c.company && c.company.toLowerCase().includes(term));
      
      let matchesFilter = true;
      if (activeFilter === 'drafted') {
        matchesFilter = c.stage === 'Drafted';
      } else if (activeFilter === 'sent') {
        matchesFilter = c.stage === 'Sent';
      } else if (activeFilter === 'replied') {
        matchesFilter = c.stage === 'Replied' || c.stage === 'Replied / Booked';
      }
      return matchesSearch && matchesFilter;
    });
  };

  const filteredContacts = getFilteredContacts();

  // Helper for status classes
  const getAiClass = (status) => {
    if (status === 'READY') return 'active';
    if (status === 'PROCESSING') return 'review';
    return 'idle';
  };

  // Helper for message outcome classes
  const getOutcomeClass = (outcome) => {
    if (!outcome) return 'Sent';
    const low = outcome.toLowerCase();
    if (low.includes('no_response') || low.includes('no-response') || low.includes('reject')) return 'No-response';
    if (low.includes('replied') || low.includes('booked')) return 'Replied';
    if (low.includes('opened')) return 'Opened';
    return 'Sent';
  };

  const getOutcomeLabel = (outcome) => {
    if (!outcome) return 'Sent';
    const low = outcome.toLowerCase();
    if (low.includes('no_response') || low.includes('no-response')) return 'No response';
    if (low.includes('replied')) return 'Replied';
    if (low.includes('booked')) return 'Booked';
    if (low.includes('opened')) return 'Opened';
    if (low.includes('reject')) return 'Rejected';
    return 'Sent';
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Switch contacts with a fade effect
  const selectContact = (id) => {
    if (id === activeContactId) return;
    setSwitching(true);
    setTimeout(() => {
      setActiveContactId(id);
      setSwitching(false);
      setRefineOpen(false);
    }, 190);
  };

  // Generate Draft
  const handleGenerate = async (isRegenerate) => {
    if (!activeContact) return;
    setGenerating(true);
    addToast('processing', isRegenerate ? 'Regenerating draft...' : 'Generating draft...');
    try {
      const instruction = refineInstructions[activeContact.id] || '';
      const tone = activeContact.tone_note || 'curiosity';
      const result = await onGenerateDraftInline(activeContact.id, tone, instruction);
      
      setDrafts(prev => ({
        ...prev,
        [activeContact.id]: {
          subject: result.subject || 'Follow-up proposal',
          body: result.body || 'Hi,\n\nHere is your generated message.'
        }
      }));
      
      addToast('ready', 'Draft generated successfully.');
    } catch (err) {
      console.error('Draft generation failed:', err);
      addToast('attn', 'Failed to generate draft.');
    } finally {
      setGenerating(false);
    }
  };

  // Copy Draft
  const handleCopy = () => {
    const draft = drafts[activeContact?.id];
    if (!draft) return;
    const text = `Subject: ${draft.subject}\n\n${draft.body}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    addToast('ready', 'Draft copied to clipboard.');
  };

  // Log as Sent
  const handleLogAsSent = async () => {
    if (!activeContact) return;
    const draft = drafts[activeContact.id];
    if (!draft) return;

    addToast('processing', 'Logging outreach message...');
    try {
      const res = await fetch(`/api/contacts/${activeContact.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: 'outbound',
          tone_used: activeContact.tone_note || 'curiosity',
          subject_line: draft.subject,
          body: draft.body,
          outcome: 'Sent'
        })
      });
      if (!res.ok) throw new Error('Failed to log message');
      
      addToast('ready', 'Message logged as sent.');
      if (loadContacts) {
        await loadContacts();
      }
    } catch (err) {
      console.error(err);
      addToast('attn', 'Failed to log message.');
    }
  };

  // Update outcome dropdown selection
  const handleOutcomeSelect = async (msgId, outcome) => {
    setOpenPillMenuId(null);
    try {
      await onUpdateMessageOutcome(msgId, outcome);
      if (loadContacts) {
        await loadContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Close menus on click outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenPillMenuId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const currentDraft = drafts[activeContact?.id] || { subject: '', body: '' };

  const handleSubjectChange = (val) => {
    setDrafts(prev => ({
      ...prev,
      [activeContact.id]: {
        ...prev[activeContact.id],
        subject: val
      }
    }));
  };

  const handleBodyChange = (val) => {
    setDrafts(prev => ({
      ...prev,
      [activeContact.id]: {
        ...prev[activeContact.id],
        body: val
      }
    }));
  };

  return (
    <div className="chat-app-wrapper" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .chat-app-wrapper {
          --bg: #08090a;
          --panel-0: #131415;
          --panel-1: #0c0d0e;
          --line: rgba(255,255,255,0.07);
          --line-soft: rgba(255,255,255,0.045);
          --text-0: #f2f2f2;
          --text-1: #9a9a9a;
          --text-2: #6a6a6a;
          --accent: #3ddc84;
          --accent-dim: rgba(61,220,132,0.13);
          --accent-line: rgba(61,220,132,0.32);
          --amber: #fbbf24;
          --amber-dim: rgba(251,191,36,0.12);
          --red: #f4776b;
          --red-dim: rgba(244,119,107,0.12);
          --row-hover: rgba(255,255,255,0.035);
        }
        
        .chat-app-container {
          position: relative;
          z-index: 1;
          display: flex;
          height: calc(100vh - 120px);
          width: 100%;
          gap: 12px;
        }

        .chat-panel {
          background: linear-gradient(170deg, var(--panel-0), var(--panel-1) 80%);
          border: 1px solid var(--line);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.015) inset;
        }

        /* collapse handles */
        .chat-collapse-btn {
          position: absolute;
          top: 18px;
          right: -13px;
          width: 26px; height: 26px;
          border-radius: 50%;
          background: #1a1b1c;
          border: 1px solid var(--line);
          color: var(--text-1);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          z-index: 5;
          transition: background .2s ease, color .2s ease, transform .3s cubic-bezier(.16,1,.3,1);
        }
        .chat-collapse-btn:hover { background: #212223; color: var(--text-0); }
        .chat-collapse-btn svg { transition: transform .35s cubic-bezier(.16,1,.3,1); }
        .chat-rail.collapsed .chat-collapse-btn svg,
        .chat-thread-panel.collapsed .chat-collapse-btn svg { transform: rotate(180deg); }

        /* RAIL (left) */
        .chat-rail {
          width: 272px;
          flex-shrink: 0;
          padding: 18px 14px;
          transition: width .38s cubic-bezier(.16,1,.3,1), padding .38s cubic-bezier(.16,1,.3,1);
        }
        .chat-rail.collapsed { width: 78px; padding: 18px 12px; }

        .chat-rail-search {
          display: flex; align-items: center; gap: 9px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--line-soft);
          border-radius: 12px;
          padding: 9px 12px;
          margin-bottom: 14px;
          transition: opacity .25s ease, height .25s ease, margin .25s ease, padding .25s ease;
        }
        .chat-rail-search input {
          background: none; border: none; outline: none;
          color: var(--text-0); font-family: inherit; font-size: 13px; width: 100%;
        }
        .chat-rail-search input::placeholder { color: var(--text-2); }
        .chat-rail-search svg { color: var(--text-2); flex-shrink: 0; }
        .chat-rail.collapsed .chat-rail-search { opacity: 0; height: 0; padding: 0; margin: 0; overflow: hidden; border: none; pointer-events: none; }

        .chat-chips { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; transition: opacity .2s ease, height .2s ease, margin .2s ease; }
        .chat-rail.collapsed .chat-chips { opacity: 0; height: 0; margin: 0; overflow: hidden; pointer-events: none; }
        .chat-chip {
          font-size: 11.5px; font-weight: 600;
          padding: 6px 11px; border-radius: 100px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--line-soft);
          color: var(--text-1);
          cursor: pointer;
          transition: all .2s ease;
          white-space: nowrap;
        }
        .chat-chip:hover { color: var(--text-0); border-color: rgba(255,255,255,0.15); }
        .chat-chip.active { background: var(--accent-dim); border-color: var(--accent-line); color: var(--accent); }

        .chat-rail-label {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase;
          color: var(--text-2); margin: 2px 4px 8px;
          transition: opacity .2s ease;
        }
        .chat-rail.collapsed .chat-rail-label { opacity: 0; height: 0; margin: 0; overflow: hidden; }

        .chat-contact-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 3px; margin: 0 -6px; padding: 0 6px; }
        .chat-contact-list::-webkit-scrollbar { width: 4px; }
        .chat-contact-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }

        .chat-contact-row {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 8px; border-radius: 13px;
          cursor: pointer;
          transition: background .2s ease;
          position: relative;
        }
        .chat-contact-row:hover { background: var(--row-hover); }
        .chat-contact-row.active { background: var(--accent-dim); }
        .chat-contact-row.active .chat-c-name { color: var(--text-0); }
        .chat-rail.collapsed .chat-contact-row { justify-content: center; padding: 8px 0; }

        .chat-avatar {
          width: 36px; height: 36px; border-radius: 11px; flex-shrink: 0;
          background: linear-gradient(155deg,#242526,#121213);
          border: 1px solid var(--line);
          display: flex; align-items: center; justify-content: center;
          font-size: 12.5px; font-weight: 700; color: var(--text-0);
          position: relative;
        }
        .chat-status-dot {
          position: absolute; bottom: -2px; right: -2px;
          width: 10px; height: 10px; border-radius: 50%;
          border: 2px solid var(--panel-0);
        }
        .chat-status-dot.active { background: var(--accent); }
        .chat-status-dot.idle { background: #4a4a4a; }
        .chat-status-dot.review { background: var(--amber); }
        .chat-status-dot.active::after {
          content: ""; position: absolute; inset: -4px; border-radius: 50%;
          border: 1.5px solid var(--accent); opacity: 0.55;
          animation: pulseRing 1.8s ease-out infinite;
        }
        @keyframes pulseRing {
          0% { transform: scale(0.7); opacity: 0.6; }
          100% { transform: scale(1.9); opacity: 0; }
        }

        .chat-c-text { flex: 1; min-width: 0; transition: opacity .18s ease; }
        .chat-rail.collapsed .chat-c-text { display: none; }
        .chat-c-top { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; }
        .chat-c-name { font-size: 13.5px; font-weight: 600; color: var(--text-0); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-c-company { font-size: 11px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .chat-c-preview { font-size: 11.5px; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* THREAD PANEL (middle) */
        .chat-thread-panel {
          width: 392px;
          flex-shrink: 0;
          padding: 20px 18px;
          transition: width .38s cubic-bezier(.16,1,.3,1), padding .38s cubic-bezier(.16,1,.3,1);
        }
        .chat-thread-panel.collapsed { width: 52px; padding: 18px 8px; }

        .chat-thread-content { display: flex; flex-direction: column; height: 100%; opacity: 1; transition: opacity .2s ease; }
        .chat-thread-panel.collapsed .chat-thread-content { display: none; }

        .chat-collapsed-strip {
          display: none; flex-direction: column; align-items: center; justify-content: center;
          height: 100%; gap: 16px; color: var(--text-2); cursor: pointer;
        }
        .chat-thread-panel.collapsed .chat-collapsed-strip { display: flex; }
        .chat-collapsed-strip span {
          writing-mode: vertical-rl; transform: rotate(180deg);
          font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
        }

        .chat-thread-header { margin-bottom: 16px; }
        .chat-thread-header .th-name { font-size: 16px; font-weight: 800; letter-spacing: -0.2px; }
        .chat-thread-header .th-sub { font-size: 12px; color: var(--text-1); margin-top: 2px; }

        .chat-timeline { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0; margin: 0 -4px; padding: 0 4px 4px; position: relative; }
        .chat-timeline::-webkit-scrollbar { width: 4px; }
        .chat-timeline::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }

        .chat-msg-card {
          position: relative;
          padding: 13px 14px 13px 20px;
          margin-bottom: 10px;
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--line-soft);
          border-radius: 14px;
          animation: cardIn .35s cubic-bezier(.16,1,.3,1);
        }
        @keyframes cardIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        
        .chat-msg-card::before {
          content: ""; position: absolute; left: 6px; top: 16px; width: 6px; height: 6px;
          border-radius: 50%; background: var(--text-2);
        }
        .chat-msg-card:not(:last-child)::after {
          content: ""; position: absolute; left: 8.5px; top: 24px; bottom: -10px; width: 1px;
          background: var(--line);
        }
        .chat-msg-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 5px; }
        .chat-msg-subject { font-size: 13.5px; font-weight: 700; line-height: 1.35; }
        .chat-msg-time { font-size: 10.5px; color: var(--text-2); white-space: nowrap; margin-top: 2px; }
        .chat-msg-body { font-size: 12px; color: var(--text-1); line-height: 1.5; margin-bottom: 9px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        .chat-pill-wrap { position: relative; display: inline-block; }
        .chat-pill {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.2px;
          padding: 4px 10px; border-radius: 100px; cursor: pointer;
          display: inline-flex; align-items: center; gap: 5px;
          transition: filter .2s ease;
        }
        .chat-pill:hover { filter: brightness(1.15); }
        .chat-pill.Sent { background: rgba(255,255,255,0.06); color: #d0d0d0; }
        .chat-pill.Opened { background: var(--amber-dim); color: var(--amber); }
        .chat-pill.Replied { background: var(--accent-dim); color: var(--accent); }
        .chat-pill.No-response { background: var(--red-dim); color: var(--red); }

        .chat-pill-menu {
          position: absolute; top: calc(100% + 6px); right: 0;
          background: #1a1b1c; border: 1px solid var(--line);
          border-radius: 11px; padding: 5px; display: none; flex-direction: column;
          gap: 2px; min-width: 120px; z-index: 10;
          box-shadow: 0 10px 26px rgba(0,0,0,0.5);
        }
        .chat-pill-menu.open { display: flex; animation: menuIn .16s ease; }
        @keyframes menuIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .chat-pill-menu button {
          text-align: left; background: none; border: none; color: var(--text-1);
          font-family: inherit; font-size: 11.5px; font-weight: 600; padding: 6px 8px; border-radius: 7px; cursor: pointer;
        }
        .chat-pill-menu button:hover { background: rgba(255,255,255,0.06); color: var(--text-0); }

        .chat-followup {
          margin-top: 12px; padding: 11px 13px;
          background: rgba(61,220,132,0.045);
          border: 1px dashed var(--accent-line);
          border-radius: 12px;
          font-size: 11.5px; color: var(--text-1); line-height: 1.5;
          display: flex; gap: 8px; align-items: flex-start;
        }
        .chat-followup svg { color: var(--accent); flex-shrink: 0; margin-top: 1px; }
        .chat-followup b { color: var(--text-0); font-weight: 700; }

        /* COMPOSE PANEL (right / main) */
        .chat-compose-panel { flex: 1; min-width: 0; padding: 22px 26px; overflow-y: auto; }
        .chat-compose-panel::-webkit-scrollbar { width: 5px; }
        .chat-compose-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }

        .chat-compose-inner { transition: opacity .22s cubic-bezier(.16,1,.3,1), transform .22s cubic-bezier(.16,1,.3,1); max-width: 640px; }
        .chat-compose-inner.switching { opacity: 0; transform: translateY(8px); }

        .chat-compose-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
        .chat-compose-who { display: flex; align-items: center; gap: 12px; }
        .chat-compose-who .chat-avatar { width: 44px; height: 44px; border-radius: 13px; font-size: 14px; }
        .chat-compose-who .cw-name { font-size: 17px; font-weight: 800; letter-spacing: -0.2px; }
        .chat-compose-who .cw-meta { display: flex; align-items: center; gap: 7px; margin-top: 3px; }
        
        .chat-ai-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; color: var(--text-1);
          background: rgba(255,255,255,0.04); border: 1px solid var(--line-soft);
          padding: 3px 9px 3px 7px; border-radius: 100px;
        }
        .chat-ai-badge .dot { width: 6px; height: 6px; border-radius: 50%; }
        .chat-ai-badge.active .dot { background: var(--accent); }
        .chat-ai-badge.idle .dot { background: #4a4a4a; }
        .chat-ai-badge.review .dot { background: var(--amber); }
        .chat-ai-badge.active { color: var(--accent); border-color: var(--accent-line); background: var(--accent-dim); }
        .chat-ai-badge.review { color: var(--amber); border-color: rgba(251,191,36,0.3); background: var(--amber-dim); }

        .chat-generate-row { margin-bottom: 16px; }
        .chat-generate-btn {
          display: inline-flex; align-items: center; gap: 9px;
          padding: 11px 20px;
          border-radius: 13px; border: none;
          background: linear-gradient(180deg,#4de896,var(--accent));
          color: #062b16; font-family: inherit; font-size: 13.5px; font-weight: 700;
          cursor: pointer; box-shadow: 0 10px 22px rgba(61,220,132,0.16);
          transition: transform .2s ease, filter .2s ease, opacity .2s ease;
        }
        .chat-generate-btn:hover { transform: translateY(-1px); filter: brightness(1.04); }
        .chat-generate-btn:active { transform: translateY(0) scale(0.98); }
        .chat-generate-btn:disabled { opacity: 0.65; cursor: default; transform: none; }
        .chat-generate-btn svg { flex-shrink: 0; }
        .chat-spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .chat-draft-box {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--line-soft);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color .2s ease;
        }
        .chat-draft-box:focus-within { border-color: var(--accent-line); }
        
        .chat-action-row { display: flex; align-items: center; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
        .chat-act-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 15px; border-radius: 11px;
          background: rgba(255,255,255,0.03); border: 1px solid var(--line-soft);
          color: var(--text-1); font-family: inherit; font-size: 12.5px; font-weight: 600;
          cursor: pointer; transition: all .2s ease;
        }
        .chat-act-btn:hover { color: var(--text-0); border-color: rgba(255,255,255,0.16); background: rgba(255,255,255,0.05); }
        .chat-act-btn.primary { background: var(--accent-dim); border-color: var(--accent-line); color: var(--accent); margin-left: auto; }
        .chat-act-btn.primary:hover { background: rgba(61,220,132,0.2); }

        .chat-refine-link {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 600; color: var(--text-2);
          margin-top: 16px; cursor: pointer; transition: color .2s ease;
        }
        .chat-refine-link:hover { color: var(--accent); }
        .chat-refine-box {
          max-height: 0; opacity: 0; overflow: hidden;
          transition: max-height .32s cubic-bezier(.16,1,.3,1), opacity .25s ease, margin .25s ease;
          margin-top: 0;
        }
        .chat-refine-box.open { max-height: 160px; opacity: 1; margin-top: 12px; }
        .chat-refine-box textarea {
          width: 100%; min-height: 70px; resize: none;
          background: rgba(255,255,255,0.03); border: 1px solid var(--line-soft); border-radius: 12px;
          padding: 11px 13px; color: var(--text-0); font-family: inherit; font-size: 12.5px; outline: none;
          margin-bottom: 9px;
        }
        .chat-refine-box textarea:focus { border-color: var(--accent-line); }
        .chat-refine-box textarea::placeholder { color: var(--text-2); }
        
        .chat-apply-refine {
          padding: 8px 15px; border-radius: 10px; border: none;
          background: var(--accent); color: #062b16; font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer;
        }

        .chat-call-script-btn {
          display: flex; align-items: center; justify-content: center; gap: 9px;
          width: 100%; margin-top: 22px;
          padding: 13px; border-radius: 13px;
          background: rgba(255,255,255,0.02); border: 1px dashed var(--line);
          color: var(--text-2); font-family: inherit; font-size: 12.5px; font-weight: 600;
          cursor: not-allowed;
        }
        .chat-call-script-btn .soon {
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
          background: rgba(255,255,255,0.06); color: var(--text-1);
          padding: 2px 7px; border-radius: 100px;
        }

        input.compose-subject-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--line-soft);
          padding: 15px 17px 13px;
          font-size: 14.5px;
          font-weight: 700;
          color: var(--text-0);
          outline: none;
          line-height: 1.4;
          font-family: inherit;
        }
        textarea.compose-body-textarea {
          width: 100%;
          background: transparent;
          border: none;
          padding: 15px 17px 17px;
          font-size: 13px;
          line-height: 1.65;
          color: #dcdcdc;
          min-height: 240px;
          outline: none;
          resize: vertical;
          font-family: inherit;
        }

        select.tone-select {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--line-soft);
          color: var(--text-0);
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 600;
          padding: 7px 12px;
          border-radius: 10px;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        select.tone-select:hover {
          border-color: rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.05);
        }
        select.tone-select option {
          background: #131415;
          color: var(--text-0);
        }
      `}</style>

      <div className="chat-app-container">
        {/* LEFT RAIL */}
        <aside className={`chat-panel chat-rail ${railCollapsed ? 'collapsed' : ''}`}>
          <button 
            className="chat-collapse-btn" 
            onClick={() => setRailCollapsed(!railCollapsed)} 
            title={railCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div className="chat-rail-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="chat-chips">
            {['all', 'drafted', 'sent', 'replied'].map((f) => (
              <span 
                key={f}
                className={`chat-chip ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </span>
            ))}
          </div>

          <div className="chat-rail-label">Contacts</div>
          
          <div className="chat-contact-list">
            {filteredContacts.map((c) => {
              const preview = c.messages?.[0]?.body || c.raw_dump || 'No previous communication';
              const aiClass = getAiClass(c.ai_status);
              
              return (
                <div 
                  key={c.id}
                  className={`chat-contact-row ${c.id === activeContactId ? 'active' : ''}`}
                  onClick={() => selectContact(c.id)}
                >
                  <div className="chat-avatar">
                    {getInitials(c.name)}
                    <span className={`chat-status-dot ${aiClass}`}></span>
                  </div>
                  <div className="chat-c-text">
                    <div className="chat-c-top">
                      <span className="chat-c-name">{c.name}</span>
                    </div>
                    <div className="chat-c-company">{c.company}</div>
                    <div className="chat-c-preview">{preview}</div>
                  </div>
                </div>
              );
            })}
            {filteredContacts.length === 0 && (
              <div style={{ padding: '20px 8px', fontSize: '12.5px', color: 'var(--text-2)', textAlign: 'center' }}>
                No contacts match
              </div>
            )}
          </div>
        </aside>

        {/* MIDDLE THREAD PANEL */}
        <section className={`chat-panel chat-thread-panel ${threadCollapsed ? 'collapsed' : ''}`}>
          <button 
            className="chat-collapse-btn" 
            onClick={() => setThreadCollapsed(!threadCollapsed)}
            title={threadCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div className="chat-collapsed-strip" onClick={() => setThreadCollapsed(false)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Thread</span>
          </div>

          <div className="chat-thread-content">
            {activeContact ? (
              <>
                <div className="chat-thread-header">
                  <div className="th-name">{activeContact.name}</div>
                  <div className="th-sub">
                    {activeContact.company} · {activeContact.messages?.length || 0} message{(activeContact.messages?.length !== 1) ? 's' : ''}
                  </div>
                </div>
                
                <div className="chat-timeline">
                  {(activeContact.messages || []).map((m) => {
                    const outcomeClass = getOutcomeClass(m.outcome);
                    const outcomeLabel = getOutcomeLabel(m.outcome);
                    
                    return (
                      <div className="chat-msg-card" key={m.id}>
                        <div className="chat-msg-top">
                          <div className="chat-msg-subject">{m.subject_line}</div>
                          <div className="chat-msg-time">
                            {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'recent'}
                          </div>
                        </div>
                        <div className="chat-msg-body">{m.body}</div>
                        <div className="chat-pill-wrap">
                          <span 
                            className={`chat-pill ${outcomeClass}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenPillMenuId(openPillMenuId === m.id ? null : m.id);
                            }}
                          >
                            {outcomeLabel}
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </span>
                          
                          <div className={`chat-pill-menu ${openPillMenuId === m.id ? 'open' : ''}`}>
                            {['Sent', 'Opened', 'Replied', 'No response'].map((o) => (
                              <button 
                                key={o} 
                                onClick={() => handleOutcomeSelect(m.id, o)}
                              >
                                {o}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {(!activeContact.messages || activeContact.messages.length === 0) && (
                    <div style={{ padding: '20px 8px', fontSize: '12.5px', color: 'var(--text-2)', textAlign: 'center' }}>
                      No outreach history yet.
                    </div>
                  )}
                </div>

                <div className="chat-followup">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>
                    <b>Next follow-up —</b> {activeContact.tone_note ? `AI draft queued with custom settings: ${activeContact.tone_note}` : 'AI draft ready based on default preferences.'}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-2)' }}>
                Select a contact to view thread.
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COMPOSE PANEL */}
        <main className="chat-panel chat-compose-panel">
          {activeContact ? (
            <div className={`chat-compose-inner ${switching ? 'switching' : ''}`}>
              <div className="chat-compose-head">
                <div className="chat-compose-who">
                  <div className="chat-avatar">{getInitials(activeContact.name)}</div>
                  <div>
                    <div className="cw-name">{activeContact.name}</div>
                    <div className="cw-meta">
                      <span className={`chat-ai-badge ${getAiClass(activeContact.ai_status)}`}>
                        <span className="dot"></span>
                        {activeContact.ai_status === 'READY' ? 'AI assist active' : activeContact.ai_status === 'PROCESSING' ? 'Needs review' : 'AI assist idle'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <select 
                  className="tone-select" 
                  value={activeContact.tone_note || ''} 
                  onChange={(e) => onToneChange(activeContact.name, e.target.value)}
                >
                  <option value="" disabled>Select tone</option>
                  {(availableTones.length > 0 ? availableTones : ['Professional', 'Friendly', 'Direct', 'Casual']).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="chat-generate-row">
                <button 
                  className="chat-generate-btn" 
                  disabled={generating}
                  onClick={() => handleGenerate(false)}
                >
                  {generating ? (
                    <>
                      <svg className="chat-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ marginRight: '8px' }}>
                        <path d="M21 12a9 9 0 1 1-9-9"/>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Generate draft
                    </>
                  )}
                </button>
              </div>

              <div className="chat-draft-box">
                <input 
                  type="text" 
                  className="compose-subject-input"
                  placeholder="Subject line"
                  value={currentDraft.subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                />
                <textarea 
                  className="compose-body-textarea"
                  placeholder="Your draft will appear here..."
                  value={currentDraft.body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                />
              </div>

              <div className="chat-action-row">
                <button className="chat-act-btn" onClick={handleCopy}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy
                </button>
                <button className="chat-act-btn" disabled={generating} onClick={() => handleGenerate(true)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                    <polyline points="23 4 23 10 17 10"/>
                    <polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  Regenerate
                </button>
                <button className="chat-act-btn primary" onClick={handleLogAsSent}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Log as sent
                </button>
              </div>

              <div className="chat-refine-link" onClick={() => setRefineOpen(!refineOpen)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Refine tone or instructions
              </div>
              <div className={`chat-refine-box ${refineOpen ? 'open' : ''}`}>
                <textarea 
                  placeholder="e.g. Mention the pricing update, keep it under 80 words..."
                  value={refineInstructions[activeContact.id] || ''}
                  onChange={(e) => setRefineInstructions({
                    ...refineInstructions,
                    [activeContact.id]: e.target.value
                  })}
                />
                <button className="chat-apply-refine" onClick={() => handleGenerate(true)}>
                  Apply &amp; regenerate
                </button>
              </div>

              <button className="chat-call-script-btn" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Call script <span className="soon">Coming soon</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-2)' }}>
              Select a contact to start drafting.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
