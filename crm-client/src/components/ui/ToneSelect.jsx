import React from 'react';

export default function ToneSelect({ contactName, toneNote, onChange, availableTones = [] }) {
  // Use available tones from API if provided; otherwise fall back to default options
  const options = availableTones.length > 0 
    ? availableTones 
    : ['curiosity', 'direct', 'Short & blunt', 'Warm & consultative', 'Data-driven', 'Formal', 'Curious / exploratory'];

  return (
    <div className="field" style={{ marginTop: '0.9rem' }}>
      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.4rem' }}>
        Tone note
      </label>
      <select
        className="tone-select"
        value={toneNote || ''}
        onChange={(e) => onChange(contactName, e.target.value)}
      >
        <option value="">Not set</option>
        {options.map(tone => (
          <option key={tone} value={tone}>
            {tone.charAt(0).toUpperCase() + tone.slice(1)}
          </option>
        ))}
      </select>
      
      {toneNote && (
        <div
          className="tone-pill"
          style={{
            display: 'inline-block',
            marginTop: '0.4rem',
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            borderRadius: '99px',
            padding: '0.25rem 0.6rem',
            fontSize: '0.68rem',
            pointerEvents: 'none'
          }}
        >
          {toneNote}
        </div>
      )}
    </div>
  );
}

