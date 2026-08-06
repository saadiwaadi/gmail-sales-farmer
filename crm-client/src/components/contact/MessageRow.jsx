import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { EnvelopeIcon, ChatIcon } from '../ui/icons';

const BADGE_STYLES = {
  booked: { background: 'var(--accent-dim)', color: 'var(--accent)' },
  replied: { background: 'var(--accent-dim)', color: 'var(--accent)' },
  opened: { background: 'var(--amber-dim)', color: 'var(--amber)' },
  no_response: { background: 'var(--border-soft)', color: 'var(--text-3)' },
  rejected: { background: 'var(--rust-dim)', color: 'var(--rust)' }
};

const BADGE_LABELS = {
  booked: 'Booked',
  replied: 'Replied',
  opened: 'Opened',
  no_response: 'No response',
  rejected: 'Rejected'
};

export default function MessageRow({ msg, onResync }) {
  const [expanded, setExpanded] = useState(false);

  const getIcon = (channel) => {
    if (channel === 'chat') return <ChatIcon style={{ width: '14px', height: '14px' }} />;
    return <EnvelopeIcon style={{ width: '14px', height: '14px' }} />;
  };

  const badgeStyle = BADGE_STYLES[msg.outcome] || BADGE_STYLES.no_response;
  const badgeLabel = BADGE_LABELS[msg.outcome] || msg.outcome;

  return (
    <Card glass={true} glow={false} className="msg-row" style={{ marginBottom: '0.7rem', padding: '0.85rem' }}>
      <div
        className="msg-row-summary"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '0.6rem' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
          <span style={{ color: 'var(--text-3)', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
            {getIcon(msg.channel)}
          </span>
          <span style={{ fontWeight: 500, fontSize: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {msg.subject}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          <span style={{ borderRadius: '99px', padding: '0.15rem 0.5rem', fontSize: '0.65rem', ...badgeStyle }}>
            {badgeLabel}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            {msg.date}
          </span>
        </div>
      </div>
      
      {expanded && (
        <div className="msg-row-details" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-soft)', paddingTop: '0.9rem' }}>
          <div
            className="read-block"
            style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.9rem' }}
            dangerouslySetInnerHTML={{ __html: msg.body }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span className="cell-muted">Synced: {msg.outcome_synced}</span>
            <Button
              variant="outline"
              className="resync-msg-btn"
              onClick={() => onResync(msg.id)}
              style={{ padding: '0.25rem 0.45rem', fontSize: '0.65rem' }}
            >
              Force resync
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
