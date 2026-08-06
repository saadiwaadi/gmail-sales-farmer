import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';

export default function ImportWizard({ onClose, onConfirmImport }) {
  const [step, setStep] = useState(1);
  const [logStatus, setLogStatus] = useState({
    1: 'pending',
    2: 'pending',
    3: 'pending',
    4: 'pending'
  });

  const [flaggedExpanded, setFlaggedExpanded] = useState({
    f1: false,
    f2: false,
    f3: false
  });

  const toggleFlagged = (id) => {
    setFlaggedExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (step <= 4) {
      setLogStatus(prev => ({ ...prev, [step]: 'processing' }));
      const timer = setTimeout(() => {
        setLogStatus(prev => ({ ...prev, [step]: 'ready' }));
        setStep(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const showSummary = step > 4;

  if (!showSummary) {
    return (
      <div>
        <div className="card-title" style={{ marginBottom: '1rem' }}>Importing Leads</div>
        <div className="card glass" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} id="importLogContainer">
          <div className="glass-edge"></div>
          
          {/* Step 1 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.82rem',
              transition: 'opacity 0.2s',
              opacity: logStatus[1] === 'pending' ? 0.35 : 1
            }}
          >
            <span className={`status ${logStatus[1]}`}>
              {logStatus[1] === 'ready' ? (
                <span className="sdot" style={{ background: 'var(--accent)' }}></span>
              ) : logStatus[1] === 'processing' ? (
                <span className="sdot"></span>
              ) : (
                <span className="sdot" style={{ background: 'var(--text-3)', display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%' }}></span>
              )}
            </span>
            <span>Reading rows…</span>
          </div>

          {/* Step 2 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.82rem',
              transition: 'opacity 0.2s',
              opacity: logStatus[2] === 'pending' ? 0.35 : 1
            }}
          >
            <span className={`status ${logStatus[2]}`}>
              {logStatus[2] === 'ready' ? (
                <span className="sdot" style={{ background: 'var(--accent)' }}></span>
              ) : logStatus[2] === 'processing' ? (
                <span className="sdot"></span>
              ) : (
                <span className="sdot" style={{ background: 'var(--text-3)', display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%' }}></span>
              )}
            </span>
            <span>Scoring lead quality…</span>
          </div>

          {/* Step 3 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.82rem',
              transition: 'opacity 0.2s',
              opacity: logStatus[3] === 'pending' ? 0.35 : 1
            }}
          >
            <span className={`status ${logStatus[3]}`}>
              {logStatus[3] === 'ready' ? (
                <span className="sdot" style={{ background: 'var(--accent)' }}></span>
              ) : logStatus[3] === 'processing' ? (
                <span className="sdot"></span>
              ) : (
                <span className="sdot" style={{ background: 'var(--text-3)', display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%' }}></span>
              )}
            </span>
            <span>Matching to nearest pipeline stage…</span>
          </div>

          {/* Step 4 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.82rem',
              transition: 'opacity 0.2s',
              opacity: logStatus[4] === 'pending' ? 0.35 : 1
            }}
          >
            <span className={`status ${logStatus[4]}`}>
              {logStatus[4] === 'ready' ? (
                <span className="sdot" style={{ background: 'var(--accent)' }}></span>
              ) : logStatus[4] === 'processing' ? (
                <span className="sdot"></span>
              ) : (
                <span className="sdot" style={{ background: 'var(--text-3)', display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%' }}></span>
              )}
            </span>
            <span>Assigning owner…</span>
          </div>

        </div>
      </div>
    );
  }

  // Summary Step
  return (
    <div>
      <div className="card-title" style={{ marginBottom: '1rem' }}>Import Summary</div>
      <div className="stat-trio" style={{ marginBottom: '1.2rem' }}>
        <div className="stat">
          <div className="n" style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--accent)' }}>58</div>
          <div className="l">Rows read</div>
        </div>
        <div className="stat">
          <div className="n" style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--accent)' }}>44</div>
          <div className="l">Valid</div>
        </div>
        <div className="stat">
          <div className="n" style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--rust)' }}>14</div>
          <div className="l">Flagged</div>
        </div>
      </div>
      
      <div className="divider-label">
        <span>Flagged rows</span>
        <div className="rule"></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '10rem', overflowY: 'auto', paddingRight: '0.2rem', marginBottom: '1.5rem' }}>
        
        {/* Row 12 */}
        <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-s)', padding: '0.5rem 0.6rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
            onClick={() => toggleFlagged('f1')}
          >
            <span>Row 12: Blake Jordan</span>
            <span style={{ color: 'var(--rust)', fontSize: '0.68rem' }}>Missing email address</span>
          </div>
          {flaggedExpanded.f1 && (
            <div className="cell-muted" style={{ fontSize: '0.68rem', marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-soft)' }}>
              Source text was missing standard contact fields. Flagged for review before parsing AI memory.
            </div>
          )}
        </div>

        {/* Row 29 */}
        <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-s)', padding: '0.5rem 0.6rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
            onClick={() => toggleFlagged('f2')}
          >
            <span>Row 29: Taylor Morgan</span>
            <span style={{ color: 'var(--rust)', fontSize: '0.68rem' }}>Duplicate record</span>
          </div>
          {flaggedExpanded.f2 && (
            <div className="cell-muted" style={{ fontSize: '0.68rem', marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-soft)' }}>
              Already exists as an active contact in the CRM pipeline (Marcus Webb duplicate lead signal).
            </div>
          )}
        </div>

        {/* Row 47 */}
        <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-s)', padding: '0.5rem 0.6rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
            onClick={() => toggleFlagged('f3')}
          >
            <span>Row 47: Quinn Alex</span>
            <span style={{ color: 'var(--rust)', fontSize: '0.68rem' }}>Malformed phone formatting</span>
          </div>
          {flaggedExpanded.f3 && (
            <div className="cell-muted" style={{ fontSize: '0.68rem', marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-soft)' }}>
              Value "+99-X-ABC" does not map to standard regional phone patterns. Pre-processing bypassed.
            </div>
          )}
        </div>

      </div>
      
      <div className="btn-row" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
        <Button variant="primary" id="autoDistributeBtn" onClick={onConfirmImport}>
          Auto-distribute 44 leads
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Review later
        </Button>
      </div>
    </div>
  );
}
