import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import MessageRow from './MessageRow';

export default function ProfileMessages({ contact, onGenerateDraft, onResyncMessage }) {
  const messages = contact.messages || [];

  return (
    <div>
      <Card glass={true} glow={false} style={{ padding: '1.2rem', marginBottom: '1.2rem' }}>
        <Button
          variant="primary"
          id="genFpDraftBtn"
          onClick={() => onGenerateDraft(contact.name)}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Generate new draft
        </Button>
      </Card>
      
      <div className="divider-label">
        <span>Message History</span>
        <div className="rule"></div>
      </div>
      
      <div className="msg-history-list">
        {messages.length > 0 ? (
          messages.map(msg => (
            <MessageRow
              key={msg.id}
              msg={msg}
              onResync={onResyncMessage}
            />
          ))
        ) : (
          <div className="cell-muted" style={{ textAlign: 'center', padding: '2rem' }}>
            No messages sent.
          </div>
        )}
      </div>
    </div>
  );
}
