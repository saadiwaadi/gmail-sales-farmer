import React from 'react';
import Button from '../ui/Button';
import { CloseIcon } from '../ui/icons';
import { addToast } from '../../hooks/useToast';

export default function EmailComposer({ contactName, emailDraft, onSend, onRegenerate, onClose }) {
  const drafting = emailDraft?.loading;
  const displaySubject = emailDraft?.subject || (drafting ? 'Generating...' : 'No draft generated');
  const displayBody = emailDraft?.body || (drafting ? '<p>Generating outreach draft...</p>' : (emailDraft?.error ? `<p style="color:var(--rust)">${emailDraft.error}</p>` : '<p>No draft generated</p>'));
  const sendLabel = contactName ? `Send to ${contactName}` : `Send to all contacts`;

  const handleCopyText = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(displaySubject + "\n\n" + displayBody.replace(/<[^>]*>/g, '')).catch(() => {});
    }
    addToast('ready', 'Copied to clipboard.');
  };

  return (
    <div>
      <div className="card-head" style={{ marginBottom: '0.6rem' }}>
        {drafting ? (
          <div className="status processing" id="genStatus">
            <span className="sdot"></span>Drafting…
          </div>
        ) : (
          <div className="status ready" id="genStatus">
            <span className="sdot" style={{ background: 'var(--accent)' }}></span>Ready to send
          </div>
        )}
        <button className="icon-btn" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.4rem' }}>Subject</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', marginBottom: '1rem' }}>
        {displaySubject}
      </div>

      <div
        className="read-block"
        id="genBody"
        style={{
          opacity: drafting ? 0.3 : 1,
          transition: 'opacity 0.5s ease'
        }}
        dangerouslySetInnerHTML={{ __html: displayBody }}
      />

      <div className="btn-row" style={{ marginTop: '1.2rem' }}>
        <Button variant="primary" disabled={drafting} onClick={() => onSend(contactName)}>
          {sendLabel}
        </Button>
        <Button variant="outline" id="regenBtn" disabled={drafting} onClick={() => onRegenerate(contactName)}>
          Regenerate
        </Button>
        <Button variant="ghost" disabled={drafting} onClick={handleCopyText}>
          Copy text
        </Button>
      </div>
    </div>
  );
}

