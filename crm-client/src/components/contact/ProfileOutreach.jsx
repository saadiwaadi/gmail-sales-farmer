import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import MessageRow from './MessageRow';
import { addToast } from '../../hooks/useToast';

export default function ProfileOutreach({
  contact,
  onGenerateDraftInline,
  availableTones = [],
  onUpdateMessageOutcome,
  onResyncMessage,
  onSaveRawDump,
  onReextractProfile
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [generating, setGenerating] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [showInstruction, setShowInstruction] = useState(false);
  const [contextUpdate, setContextUpdate] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [savePermanently, setSavePermanently] = useState(true);

  const initialTone = contact.tone_note || (availableTones.length > 0 ? availableTones[0] : 'curiosity');
  const [selectedTone, setSelectedTone] = useState(initialTone);

  // Sync selectedTone when contact changes
  useEffect(() => {
    setSelectedTone(contact.tone_note || (availableTones.length > 0 ? availableTones[0] : 'curiosity'));
  }, [contact.id, contact.tone_note]);

  const handleGenerate = async () => {
    setGenerating(true);
    
    // Check if we need to save context permanently
    if (contextUpdate.trim()) {
      if (savePermanently && onSaveRawDump) {
        const divider = contact.raw_dump ? '\n\n' : '';
        const updatedRawDump = (contact.raw_dump || '') + `${divider}Context Update:\n${contextUpdate.trim()}`;
        try {
          await onSaveRawDump(contact.id, updatedRawDump);
          if (onReextractProfile) {
            onReextractProfile(contact.id); // Trigger in background
            addToast('ready', 'Context saved permanently. Updating profile in background...');
          } else {
            addToast('ready', 'Context saved permanently.');
          }
        } catch (err) {
          console.error('Error saving raw dump:', err);
          addToast('attn', 'Failed to save context permanently.');
        }
      }
    }

    addToast('processing', 'Reading profile and drafting...');
    try {
      const instructionParts = [];
      if (customInstruction.trim()) instructionParts.push(customInstruction.trim());
      if (contextUpdate.trim()) {
        instructionParts.push(`New customer context to incorporate: ${contextUpdate.trim()}`);
      }
      const combinedInstruction = instructionParts.join('\n');

      const res = await onGenerateDraftInline(contact.id, selectedTone, combinedInstruction);
      setSubject(res.subject || '');
      setBody(res.body || '');
      addToast('ready', 'Email draft generated successfully.');
      
      // Clear quick context after generation so it doesn't get submitted twice
      setContextUpdate('');
    } catch (err) {
      console.error('Inline draft generation error:', err);
      addToast('attn', 'Failed to generate email draft.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`).catch(() => {});
    }
    addToast('ready', 'Copied to clipboard.');
  };

  const handleLogAsSent = async () => {
    const latestMsg = contact.messages && contact.messages.length > 0 ? contact.messages[0] : null;
    if (latestMsg) {
      try {
        await onUpdateMessageOutcome(latestMsg.id, 'sent');
        addToast('ready', 'Logged as sent.');
        setSubject('');
        setBody('');
      } catch (err) {
        console.error('Error logging as sent:', err);
        addToast('attn', 'Failed to log message as sent.');
      }
    } else {
      addToast('attn', 'No active message to log as sent.');
    }
  };

  const tonesList = availableTones.length > 0
    ? availableTones
    : ['curiosity', 'direct', 'Short & blunt', 'Warm & consultative', 'Data-driven', 'Formal', 'Curious / exploratory'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* SECTION A — Draft Composer */}
      <Card style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="card-title">Outreach Draft Composer</div>
        
        {/* Row 1: Tone select and small "+ Add instruction" */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '0.4rem' }}>Tone</label>
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'var(--panel-sunk)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-s)',
                color: 'var(--text-1)',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            >
              {tonesList.map(t => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowInstruction(!showInstruction)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              padding: 0,
              marginTop: '1.1rem',
              outline: 'none'
            }}
          >
            {showInstruction ? '- Remove instruction' : '+ Add instruction'}
          </button>
        </div>

        {/* Custom Instruction Textarea */}
        {showInstruction && (
          <div className="field">
            <textarea
              rows={2}
              placeholder="e.g. mention their Chicago expansion, keep it under 100 words, use a casual opener"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--panel-sunk)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-s)',
                color: 'var(--text-1)',
                padding: '0.5rem',
                fontSize: '0.8rem',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        )}

        {/* Separator / Second action: Context update button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.3rem' }}>
          <button
            type="button"
            onClick={() => setShowContext(!showContext)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              padding: 0,
              outline: 'none'
            }}
          >
            {showContext ? '- Remove context update' : '+ Add context update'}
          </button>
        </div>

        {/* Quick Context Update Textarea */}
        {showContext && (
          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-3)' }}>Quick Context Update</label>
            <textarea
              rows={2}
              placeholder="e.g. they just hired a new CTO, or prefers direct communication. Appends to contact's permanent research dump."
              value={contextUpdate}
              onChange={(e) => setContextUpdate(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--panel-sunk)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-s)',
                color: 'var(--text-1)',
                padding: '0.5rem',
                fontSize: '0.8rem',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-2)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={savePermanently}
                onChange={(e) => setSavePermanently(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Save permanently to profile research dump (triggers background re-extraction)
            </label>
          </div>
        )}

        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={generating}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {generating ? 'Reading profile and drafting...' : 'Generate draft'}
        </Button>

        {/* Generated Draft Section */}
        {(subject || body) && (
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div className="divider-label" style={{ margin: '0.5rem 0' }}>
              <span>Generated draft</span>
              <div className="rule"></div>
            </div>

            <div>
              <label style={{ fontSize: '0.68rem', color: 'var(--text-3)', display: 'block', marginBottom: '0.2rem' }}>Subject</label>
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => setSubject(e.target.innerText)}
                style={{
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  padding: '0.5rem',
                  borderBottom: '1px solid var(--border)',
                  outline: 'none',
                  color: 'var(--text-1)',
                  minHeight: '1.8rem'
                }}
              >
                {subject}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.68rem', color: 'var(--text-3)', display: 'block', marginBottom: '0.2rem' }}>Body</label>
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => setBody(e.target.innerText)}
                className="read-block"
                style={{
                  minHeight: '8rem',
                  padding: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-s)',
                  outline: 'none',
                  color: 'var(--text-1)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {body}
              </div>
            </div>

            <div className="btn-row" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <Button variant="outline" onClick={handleCopy}>
                Copy
              </Button>
              <Button variant="ghost" onClick={handleGenerate} disabled={generating}>
                Regenerate
              </Button>
              <Button variant="outline" onClick={handleLogAsSent}>
                Log as sent →
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* SECTION B — Message History */}
      <div>
        <div className="divider-label" style={{ marginBottom: '1.2rem' }}>
          <span>Sent history</span>
          <div className="rule"></div>
        </div>

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
            <div className="cell-muted" style={{ textAlign: 'center', padding: '2rem' }}>
              No messages sent.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
