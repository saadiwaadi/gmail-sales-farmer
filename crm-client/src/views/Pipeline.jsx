import React, { useState } from 'react';
import Card from '../components/ui/Card';
import { addToast } from '../hooks/useToast';

export default function Pipeline({
  kanbanData = {},
  contactsList = [],
  activeSegment = 'all',
  onOpenContact,
  onEditContact,
  onDeleteMultiple
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const getAllFilteredDeals = () => {
    // Combine all deals from all stages in kanbanData
    const allDeals = Object.keys(kanbanData).reduce((acc, stage) => {
      return [...acc, ...(kanbanData[stage] || [])];
    }, []);

    return allDeals.filter(deal => {
      if (searchQuery && !deal.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (activeSegment === 'all') return true;
      
      const contact = contactsList.find(c => c.name === deal.name);
      if (!contact) {
        return activeSegment === 'stalled' ? false : true;
      }
      
      if (activeSegment === 'stalled') {
        return contact.score < 50;
      }

      if (activeSegment === 'my-deals') {
        return contact.score >= 70;
      }

      if (activeSegment === 'replied') {
        return contact.messages && contact.messages.some(m => m.outcome === 'replied');
      }
      
      return contact.type === activeSegment;
    });
  };

  const handleToggleSelect = (contactId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  };

  const handleExitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const success = await onDeleteMultiple(Array.from(selectedIds));
    if (success) {
      handleExitSelectMode();
    }
  };

  const filteredDeals = getAllFilteredDeals();

  return (
    <div className="view" id="view-pipeline">
      {/* Top chip bar */}
      <div className="chip-row" style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="search" style={{ width: '300px', display: 'flex', alignItems: 'center', background: 'var(--panel-sunk)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '4px 10px', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)' }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            placeholder="Search deals..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-1)', 
              outline: 'none', 
              width: '100%',
              fontSize: '0.85rem'
            }}
          />
        </div>

        <div>
          {selectMode ? (
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button 
                onClick={handleBulkDelete}
                className="pill-btn" 
                style={{ 
                  borderColor: '#ef4444', 
                  color: '#ef4444', 
                  background: 'rgba(239, 68, 68, 0.1)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                disabled={selectedIds.size === 0}
              >
                Delete Selected ({selectedIds.size})
              </button>
              <button className="pill-btn" onClick={handleExitSelectMode} style={{ cursor: 'pointer' }}>Cancel</button>
            </div>
          ) : (
            <button className="pill-btn" onClick={() => setSelectMode(true)} style={{ cursor: 'pointer' }}>Manage Deals</button>
          )}
        </div>
      </div>

      <div className="kanban" id="kanbanBoard" style={{ display: 'flex', flexDirection: 'column', gap: '0px', width: '100%', border: '1px solid var(--border)', borderRadius: '0px' }}>
        {filteredDeals.map((deal, idx) => {
          const contact = contactsList.find(c => c.name === deal.name) || {};
          const contactId = deal.id || contact.id;
          const isSelected = selectedIds.has(contactId);

          return (
            <Card
              key={idx}
              glass={true}
              glow={false}
              className={`kcard ${isSelected ? 'selected' : ''}`}
              style={{ 
                cursor: 'pointer',
                border: 'none',
                borderBottom: idx === filteredDeals.length - 1 ? 'none' : '1px solid var(--border)',
                background: isSelected ? 'rgba(239, 68, 68, 0.05)' : 'var(--card-bg)',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1.2rem',
                gap: '16px',
                width: '100%',
                borderRadius: '0px'
              }}
              onClick={() => {
                if (selectMode) {
                  handleToggleSelect(contactId);
                } else {
                  onOpenContact(deal.name);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '150px', flex: 1.2, overflow: 'hidden' }}>
                {selectMode && (
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleToggleSelect(contactId)}
                    onClick={(e) => e.stopPropagation()} 
                    style={{ accentColor: '#ef4444', cursor: 'pointer' }}
                  />
                )}
                <div className="kcard-name" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.82rem', margin: 0 }}>
                  {deal.name}
                </div>
              </div>

              <div style={{ display: 'flex', flex: 4.5, gap: '24px', fontSize: '0.74rem', fontFamily: 'var(--mono)', opacity: 0.9 }}>
                <div style={{ flex: 1, minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--text-3)', marginRight: '6px' }}>Stage:</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{deal.stage || '—'}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--text-3)', marginRight: '6px' }}>Company:</span>
                  <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{contact.company || '—'}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--text-3)', marginRight: '6px' }}>Role:</span>
                  <span style={{ color: 'var(--text-2)' }}>{contact.role || '—'}</span>
                </div>
                <div style={{ flex: 1.5, minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--text-3)', marginRight: '6px' }}>Email:</span>
                  <span style={{ color: 'var(--text-2)' }}>{contact.email || '—'}</span>
                </div>
                <div style={{ width: '85px', textAlign: 'right' }}>
                  <span style={{ color: 'var(--text-3)', marginRight: '6px' }}>Score:</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{contact.score || '—'}</span>
                </div>
              </div>

              {!selectMode && (
                <div 
                  className="edit-pencil-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditContact(contact);
                  }}
                  title="Edit Contact"
                  style={{
                    opacity: 0.6,
                    padding: '4px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 0.2s',
                    marginLeft: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', color: 'var(--text-2)' }}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
