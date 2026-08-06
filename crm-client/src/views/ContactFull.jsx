import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { ChevronLeftIcon } from '../components/ui/icons';
import ProfileOverview from '../components/contact/ProfileOverview';
import ProfileMessages from '../components/contact/ProfileMessages';
import ProfileActivity from '../components/contact/ProfileActivity';
import ProfileSource from '../components/contact/ProfileSource';

export default function ContactFull({
  contact,
  onBack,
  onToneChange,
  onGenerateDraft,
  onResyncMessage,
  onInspectSource,
  availableTones = []
}) {
  const [activeTab, setActiveTab] = useState('overview');

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
          className={`chip ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`chip ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages
        </button>
        <button
          className={`chip ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
        <button
          className={`chip ${activeTab === 'source' ? 'active' : ''}`}
          onClick={() => setActiveTab('source')}
        >
          Source
        </button>
      </div>

      <div className="fp-panel">
        {activeTab === 'overview' && (
          <ProfileOverview
            contact={contact}
            onToneChange={onToneChange}
            availableTones={availableTones}
          />
        )}
        {activeTab === 'messages' && (
          <ProfileMessages
            contact={contact}
            onGenerateDraft={onGenerateDraft}
            onResyncMessage={onResyncMessage}
          />
        )}
        {activeTab === 'activity' && (
          <ProfileActivity
            contact={contact}
          />
        )}
        {activeTab === 'source' && (
          <ProfileSource
            contact={contact}
            onInspectSource={onInspectSource}
          />
        )}
      </div>
    </div>
  );
}
