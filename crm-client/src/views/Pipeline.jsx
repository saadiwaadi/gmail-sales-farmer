import React, { useState } from 'react';
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

      <div className="flex flex-col gap-3 w-full" id="kanbanBoard">
        {filteredDeals.map((deal, idx) => {
          const contact = contactsList.find(c => c.name === deal.name) || {};
          const contactId = deal.id || contact.id;
          const isSelected = selectedIds.has(contactId);

          return (
            <div
              key={idx}
              className={`group cursor-pointer bg-white/5 border border-white/10 rounded-xl backdrop-blur-md flex items-center justify-between w-full gap-4 px-6 py-4 transition-all hover:bg-white/10 ${
                isSelected ? 'border-red-500/50 bg-red-500/5' : ''
              }`}
              onClick={() => {
                if (selectMode) {
                  handleToggleSelect(contactId);
                } else {
                  onOpenContact(deal.name);
                }
              }}
            >
              {/* Left Column: Checkbox & Name */}
              <div className="flex items-center gap-3 min-w-0 flex-shrink-0" style={{ width: '180px' }}>
                {selectMode && (
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleToggleSelect(contactId)}
                    onClick={(e) => e.stopPropagation()} 
                    className="accent-red-500 cursor-pointer h-4 w-4 rounded border-gray-300"
                  />
                )}
                <span className="text-white font-semibold text-sm truncate select-none">
                  {deal.name}
                </span>
              </div>

              {/* Middle Columns: Stage, Company, Role, Email */}
              <div className="flex items-center justify-between flex-1 min-w-0 gap-6">
                {/* Stage */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-gray-400 text-xs font-mono uppercase tracking-wider flex-shrink-0">Stage:</span>
                  <span className="text-white text-xs truncate font-medium">
                    {deal.stage || '—'}
                  </span>
                </div>

                {/* Company */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-gray-400 text-xs font-mono uppercase tracking-wider flex-shrink-0">Co:</span>
                  <span className="text-white text-xs truncate font-medium">
                    {contact.company || '—'}
                  </span>
                </div>

                {/* Role */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-gray-400 text-xs font-mono uppercase tracking-wider flex-shrink-0">Role:</span>
                  <span className="text-gray-300 text-xs truncate">
                    {contact.role || '—'}
                  </span>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 min-w-0 flex-[1.5]">
                  <span className="text-gray-400 text-xs font-mono uppercase tracking-wider flex-shrink-0">Email:</span>
                  <span className="text-gray-300 text-xs truncate">
                    {contact.email || '—'}
                  </span>
                </div>
              </div>

              {/* Right Column: Score & Action Button */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {/* Score */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs font-mono uppercase tracking-wider">Score:</span>
                  <span className="text-emerald-400 font-bold text-xs font-mono">
                    {contact.score || '—'}
                  </span>
                </div>

                {/* Edit Button */}
                {!selectMode && (
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
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
