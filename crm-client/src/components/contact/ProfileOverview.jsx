import React from 'react';
import Card from '../ui/Card';
import ToneSelect from '../ui/ToneSelect';

export default function ProfileOverview({ contact, onToneChange, availableTones = [] }) {
  const ep = contact.extracted_profile || {
    pain_points_inferred: [],
    recent_signals: [],
    tone_of_voice: '—',
    credibility_signals: [],
    likely_priorities: [],
    avoid_mentioning: []
  };

  const renderChips = (arr) => {
    if (!arr || arr.length === 0) {
      return <span className="cell-muted">—</span>;
    }
    return arr.map((txt, idx) => (
      <span
        key={idx}
        className="chip active"
        style={{
          marginRight: '0.3rem',
          marginBottom: '0.3rem',
          display: 'inline-block',
          borderRadius: '99px',
          padding: '0.25rem 0.6rem',
          fontSize: '0.68rem',
          border: 'none',
          background: 'var(--accent-dim)',
          color: 'var(--accent)',
          cursor: 'default'
        }}
      >
        {txt}
      </span>
    ));
  };

  return (
    <Card style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '1.5rem' }}>
      <div className="kv-row">
        <span className="k">Tone of voice</span>
        <span>{ep.tone_of_voice || '—'}</span>
      </div>
      <div className="kv-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
        <span className="k">Inferred Pain Points</span>
        <div>{renderChips(ep.pain_points_inferred)}</div>
      </div>
      <div className="kv-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
        <span className="k">Recent Signals</span>
        <div>{renderChips(ep.recent_signals)}</div>
      </div>
      <div className="kv-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
        <span className="k">Credibility Signals</span>
        <div>{renderChips(ep.credibility_signals)}</div>
      </div>
      <div className="kv-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
        <span className="k">Likely Priorities</span>
        <div>{renderChips(ep.likely_priorities)}</div>
      </div>
      <div className="kv-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
        <span className="k">Avoid Mentioning</span>
        <div>{renderChips(ep.avoid_mentioning)}</div>
      </div>
      
      <ToneSelect
        contactName={contact.name}
        toneNote={contact.tone_note}
        onChange={onToneChange}
        availableTones={availableTones}
      />
    </Card>
  );
}
