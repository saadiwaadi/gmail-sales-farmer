import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function ProfileSource({ contact, onSaveRawDump, onReextractProfile }) {
  const [localRawDump, setLocalRawDump] = useState(contact?.raw_dump || '');

  useEffect(() => {
    setLocalRawDump(contact?.raw_dump || '');
  }, [contact?.id, contact?.raw_dump]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Card glass={true} glow={false} style={{ padding: '1.4rem' }}>
        <div className="card-title" style={{ marginBottom: '0.8rem' }}>Current research dump</div>
        <pre
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '0.78rem',
            whiteSpace: 'pre-wrap',
            background: 'var(--panel-sunk)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-s)',
            padding: '1rem',
            maxHeight: '14rem',
            overflowY: 'auto',
            margin: 0,
            color: 'var(--text-2)'
          }}
        >
          {contact.raw_dump || 'No research dump available.'}
        </pre>
      </Card>

      <Card glass={true} glow={false} style={{ padding: '1.4rem' }}>
        <div className="divider-label" style={{ marginBottom: '1.2rem' }}>
          <span>Update research</span>
          <div className="rule"></div>
        </div>

        <div className="field" style={{ marginBottom: '1.2rem' }}>
          <textarea
            value={localRawDump}
            onChange={(e) => setLocalRawDump(e.target.value)}
            rows={10}
            placeholder="Paste updated or additional research here..."
            style={{
              width: '100%',
              background: 'var(--panel-sunk)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-s)',
              color: 'var(--text-1)',
              fontFamily: 'var(--mono)',
              fontSize: '0.78rem',
              padding: '0.6rem',
              resize: 'vertical',
              outline: 'none'
            }}
          />
        </div>

        <div className="btn-row" style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="primary"
            onClick={async () => {
              await onSaveRawDump(contact.id, localRawDump);
              await onReextractProfile(contact.id);
            }}
          >
            Save & Re-extract
          </Button>
          <Button
            variant="outline"
            onClick={() => onSaveRawDump(contact.id, localRawDump)}
          >
            Save only
          </Button>
        </div>
      </Card>
    </div>
  );
}
