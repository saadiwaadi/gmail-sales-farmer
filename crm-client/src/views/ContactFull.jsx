import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { ChevronLeftIcon } from '../components/ui/icons';
import ProfileOverview from '../components/contact/ProfileOverview';
import ProfileActivity from '../components/contact/ProfileActivity';
import MessageRow from '../components/contact/MessageRow';

export default function ContactFull({
  contact,
  onBack,
  onToneChange,
  onGenerateDraft,
  onResyncMessage,
  onInspectSource,
  availableTones = [],
  onSaveRawDump,
  onReextractProfile,
  onSaveMessageDraft,
  onUpdateMessageOutcome,
  onRegenerateDraftDirect
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const [rawDump, setRawDump] = useState(contact?.raw_dump || '');

  // Outreach Draft State
  const latestMessage = contact?.messages && contact.messages.length > 0 ? contact.messages[0] : null;
  const isDraft = latestMessage && (latestMessage.outcome === 'no_response' || !latestMessage.outcome);
  const [subjectText, setSubjectText] = useState('');
  const [bodyText, setBodyText] = useState('');

  useEffect(() => {
    setRawDump(contact?.raw_dump || '');
  }, [contact?.id]);

  useEffect(() => {
    if (isDraft) {
      setSubjectText(latestMessage.subject_line || latestMessage.subject || '');
      setBodyText(latestMessage.body || '');
    } else {
      setSubjectText('');
      setBodyText('');
    }
  }, [latestMessage?.id, isDraft]);

  if (!contact) return null;

  return (
    <div className="view" id="view-contact-full">
      <Button variant="ghost" id="fullPageBack" onClick={onBack} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <ChevronLeftIcon style={{ width: '14px', height: '14px' }} />
        Back
      </Button>
      
      <Card glass={true} glow={false} style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="full-profile-head">
          <div className="profile-name" id="fpName" style={{ fontSize: '1.8rem', fontFamily: 'var(--serif)', marginBottom: '0.3rem' }}>
            {contact.name}
          </div>
          <div className="profile-tag" id="fpTag" style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '0.8rem' }}>
            {contact.type ? contact.type.toUpperCase() : ''} · {contact.stage} · Score: {contact.score}
          </div>
          <div id="fpStatus">
            <Badge status={contact.ai_status} />
          </div>
        </div>
      </Card>

      <div className="full-profile-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
        <button
          className={`chip ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`chip ${activeTab === 'outreach' ? 'active' : ''}`}
          onClick={() => setActiveTab('outreach')}
        >
          Outreach
        </button>
        <button
          className={`chip ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      <div className="fp-panel">
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ProfileOverview
              contact={contact}
              onToneChange={onToneChange}
              availableTones={availableTones}
            />
            <Card glass={true} glow={false} style={{ padding: '1.4rem' }}>
              <div className="card-title" style={{ marginBottom: '1rem' }}>Raw Research Dump</div>
              <textarea
                style={{
                  width: '100%',
                  height: '12rem',
                  background: 'var(--panel-sunk)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-s)',
                  color: 'var(--text-1)',
                  fontFamily: 'var(--mono)',
                  fontSize: '0.78rem',
                  padding: '0.6rem',
                  resize: 'vertical',
                  marginBottom: '1rem',
                  outline: 'none'
                }}
                value={rawDump}
                onChange={(e) => setRawDump(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="primary" onClick={() => onSaveRawDump(contact.id, rawDump)}>
                  Save Dump
                </Button>
                <Button variant="outline" onClick={() => onReextractProfile(contact.id)}>
                  Re-extract profile via AI
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'outreach' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {isDraft ? (
              <Card glass={true} glow={false} style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="card-title">Outreach Draft Composer</div>
                <div className="field">
                  <label>Subject Line</label>
                  <input
                    value={subjectText}
                    onChange={(e) => setSubjectText(e.target.value)}
                    placeholder="Enter subject line..."
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--panel-sunk)', border: '1px solid var(--border)', borderRadius: 'var(--radius-s)', color: 'var(--text-1)', outline: 'none' }}
                  />
                </div>
                <div className="field">
                  <label>Email Body</label>
                  <textarea
                    style={{
                      width: '100%',
                      height: '14rem',
                      background: 'var(--panel-sunk)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-s)',
                      color: 'var(--text-1)',
                      fontFamily: 'var(--sans)',
                      fontSize: '0.82rem',
                      lineHeight: '1.5',
                      padding: '0.8rem',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Enter email body..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Button variant="primary" onClick={() => onSaveMessageDraft(latestMessage.id, subjectText, bodyText)}>
                    Save Draft
                  </Button>
                  <Button variant="outline" onClick={() => onRegenerateDraftDirect(contact.id, contact.tone_note)}>
                    Regenerate Draft
                  </Button>
                </div>
              </Card>
            ) : (
              <Card glass={true} glow={false} style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.2rem' }}>
                <div style={{ color: 'var(--text-3)', fontSize: '0.9rem', textAlign: 'center' }}>
                  No active outreach draft exists for this contact.
                </div>
                <Button variant="primary" onClick={() => onRegenerateDraftDirect(contact.id, contact.tone_note)}>
                  Generate Email Draft
                </Button>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Card glass={true} glow={false} style={{ padding: '1.4rem' }}>
              <div className="card-title" style={{ marginBottom: '1.2rem' }}>Message Logs & Outcomes</div>
              <div className="msg-history-list">
                {contact.messages && contact.messages.length > 0 ? (
                  contact.messages.map(msg => (
                    <MessageRow
                      key={msg.id}
                      msg={msg}
                      onResync={onResyncMessage}
                      onOutcomeChange={onUpdateMessageOutcome}
                    />
                  ))
                ) : (
                  <div className="cell-muted" style={{ textAlign: 'center', padding: '1rem' }}>
                    No messages sent.
                  </div>
                )}
              </div>
            </Card>

            <Card glass={true} glow={false} style={{ padding: '1.4rem' }}>
              <div className="card-title" style={{ marginBottom: '1.2rem' }}>Activity Timeline</div>
              <ProfileActivity contact={contact} />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
