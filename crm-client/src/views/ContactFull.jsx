import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Toggle from '../components/ui/Toggle';
import { ChevronLeftIcon } from '../components/ui/icons';
import ProfileOverview from '../components/contact/ProfileOverview';
import ProfileActivity from '../components/contact/ProfileActivity';
import MessageRow from '../components/contact/MessageRow';
import ProfileSource from '../components/contact/ProfileSource';
import ProfileOutreach from '../components/contact/ProfileOutreach';

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
  onRegenerateDraftDirect,
  onGenerateDraftInline,
  onToggleOverrideLock
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

  if (!contact) {
    return (
      <div className="view" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-3)' }}>
        <div>Select a contact to view</div>
      </div>
    );
  }

  return (
    <div className="view" id="view-contact-full">
      <Button variant="ghost" id="fullPageBack" onClick={onBack} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <ChevronLeftIcon style={{ width: '14px', height: '14px' }} />
        Back
      </Button>
      
      <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="full-profile-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="profile-name" id="fpName" style={{ fontSize: '1.8rem', fontFamily: 'var(--serif)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {contact.name}
              {contact.is_manually_overridden ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', color: 'var(--amber)' }} title="Manual Override Active">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              ) : null}
            </div>
            <div className="profile-tag" id="fpTag" style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '0.8rem' }}>
              {contact.type ? contact.type.toUpperCase() : ''} · {contact.stage} · Score: {contact.score}
            </div>
            <div id="fpStatus">
              <Badge status={contact.ai_status} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: contact.is_manually_overridden ? 'var(--text-3)' : 'var(--accent)', fontWeight: 600 }}>
              {contact.is_manually_overridden ? 'Automation Paused' : 'Automation Active'}
            </span>
            <Toggle 
              on={!contact.is_manually_overridden} 
              onChange={() => onToggleOverrideLock(contact.id, !contact.is_manually_overridden)}
            />
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
        <button
          className={`chip ${activeTab === 'source' ? 'active' : ''}`}
          onClick={() => setActiveTab('source')}
        >
          Source
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
          </div>
        )}

        {activeTab === 'outreach' && (
          <ProfileOutreach
            contact={contact}
            onGenerateDraftInline={onGenerateDraftInline}
            availableTones={availableTones}
            onUpdateMessageOutcome={onUpdateMessageOutcome}
            onResyncMessage={onResyncMessage}
            onSaveRawDump={onSaveRawDump}
            onReextractProfile={onReextractProfile}
          />
        )}

        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Card style={{ padding: '1.4rem' }}>
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

            <Card style={{ padding: '1.4rem' }}>
              <div className="card-title" style={{ marginBottom: '1.2rem' }}>Activity Timeline</div>
              <ProfileActivity contact={contact} />
            </Card>
          </div>
        )}

        {activeTab === 'source' && (
          <ProfileSource
            contact={contact}
            onSaveRawDump={onSaveRawDump}
            onReextractProfile={onReextractProfile}
          />
        )}
      </div>
    </div>
  );
}
