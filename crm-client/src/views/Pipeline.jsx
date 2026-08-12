import React, { useState } from 'react';
import { addToast } from '../hooks/useToast';
import Toggle from '../components/ui/Toggle';

export default function Pipeline({
  kanbanData = {},
  contactsList = [],
  activeSegment = 'all',
  onOpenContact,
  onEditContact,
  onDeleteMultiple,
  onToggleOverrideLock
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

      {/* Unified Fixed Header */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1.2fr 1.6fr 1.2fr 2.4fr 1.2fr 1.2fr 0.6fr', 
          gap: '1rem', 
          alignItems: 'center', 
          padding: '10px 24px', 
          marginBottom: '8px', 
          borderBottom: '1px solid var(--card-glass-border)',
          color: 'var(--text-3)',
          fontSize: '0.72rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: 'var(--mono)',
          position: 'sticky',
          top: '-24px',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
          zIndex: 10
        }}
      >
        <div>Name</div>
        <div>Stage</div>
        <div>Company Name</div>
        <div>Role</div>
        <div>Mail</div>
        <div>Source</div>
        <div>Automation</div>
        <div></div> {/* Actions column - empty header */}
      </div>
 
      <div className="flex flex-col gap-3 w-full" id="kanbanBoard">
        {filteredDeals.map((deal, idx) => {
          const contact = contactsList.find(c => c.name === deal.name) || {};
          const contactId = deal.id || contact.id;
          const isSelected = selectedIds.has(contactId);
          
          const getContactSource = (rawDump) => {
            if (!rawDump) return '—';
            const match = rawDump.match(/Source:\s*([^\r\n]*)/i);
            return match ? match[1].trim() : '—';
          };

          return (
            <div
              key={idx}
              className={`group cursor-pointer surface-card w-full transition-all hover:border-[#1c5a41] hover:-translate-y-0.5 ${
                isSelected ? 'border-red-500/50 bg-red-500/5' : ''
              }`}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.2fr 1.6fr 1.2fr 2.4fr 1.2fr 1.2fr 0.6fr',
                gap: '1rem',
                alignItems: 'center',
                padding: '14px 24px'
              }}
              onClick={() => {
                if (selectMode) {
                  handleToggleSelect(contactId);
                } else {
                  onOpenContact(deal.name);
                }
              }}
            >
              {/* Left Column: Checkbox & Name (Left-aligned) */}
              <div className="flex items-center gap-3 min-w-0">
                {selectMode && (
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleToggleSelect(contactId)}
                    onClick={(e) => e.stopPropagation()} 
                    className="accent-red-500 cursor-pointer h-4 w-4 rounded border-gray-300 flex-shrink-0"
                  />
                )}
                <span className="text-white font-semibold text-sm truncate select-none" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {deal.name}
                  {contact.is_manually_overridden ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px', color: 'var(--amber)', flexShrink: 0 }} title="Manual Override Active">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  ) : null}
                </span>
              </div>

              {/* Stage (Left-aligned) */}
              <div className="text-white text-xs truncate font-medium">
                {deal.stage || '—'}
              </div>

              {/* Company Name (Left-aligned) */}
              <div className="text-white text-xs truncate font-medium">
                {contact.company || '—'}
              </div>

              {/* Role (Left-aligned) */}
              <div className="text-gray-300 text-xs truncate">
                {contact.role || '—'}
              </div>

              {/* Mail (Left-aligned) */}
              <div className="text-gray-300 text-xs truncate">
                {contact.email || '—'}
              </div>

              {/* Source (Left-aligned) */}
              <div className="text-gray-300 text-xs truncate">
                {getContactSource(contact.raw_dump)}
              </div>

              {/* Automation (Left-aligned) */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <span style={{ fontSize: '11px', color: contact.is_manually_overridden ? 'var(--text-3)' : 'var(--accent)' }}>
                  {contact.is_manually_overridden ? 'Paused' : 'Active'}
                </span>
                <Toggle 
                  on={!contact.is_manually_overridden} 
                  onChange={() => onToggleOverrideLock(contactId, !contact.is_manually_overridden)}
                />
              </div>

              {/* Edit Button (Extreme right dedicated column) */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {!selectMode ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditContact(contact);
                    }}
                    title="Edit Contact"
                    className="opacity-60 hover:opacity-100 p-1.5 rounded transition-opacity bg-white/5 hover:bg-white/10"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-300">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                ) : (
                  <div style={{ width: '26px' }}></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
