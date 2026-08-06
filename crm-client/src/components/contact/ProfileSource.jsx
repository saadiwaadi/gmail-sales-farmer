import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function ProfileSource({ contact, onInspectSource }) {
  return (
    <Card glass={true} glow={false} style={{ padding: '3rem', display: 'flex', alignItems: 'center', justifycontent: 'center', justifyContent: 'center' }}>
      <Button
        variant="outline"
        id="inspectFpSourceBtn"
        onClick={() => onInspectSource(contact.name)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: '14px', height: '14px' }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
        Inspect source
      </Button>
    </Card>
  );
}
