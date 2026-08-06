import React from 'react';
import Card from '../components/ui/Card';
import IconButton from '../components/ui/IconButton';
import { PlusIcon } from '../components/ui/icons';
import { addToast } from '../hooks/useToast';

const STAGES = ["New Lead", "Qualified", "Showing", "Offer", "Closed"];

export default function Pipeline({
  kanbanData = {},
  contactsList = [],
  activeSegment = 'all',
  onOpenContact,
  onAddDeal
}) {
  const getFilteredDeals = (stage) => {
    const deals = kanbanData[stage] || [];
    return deals.filter(deal => {
      if (activeSegment === 'all') return true;
      
      const contact = contactsList.find(c => c.name === deal.name);
      if (!contact) {
        return activeSegment === 'stalled' ? false : true;
      }
      
      if (activeSegment === 'stalled') {
        return contact.score < 50;
      }
      
      return contact.type === activeSegment;
    });
  };

  const handleAllStages = () => {
    addToast('ready', 'Showing every stage of the pipeline.');
  };

  const handleMyDeals = () => {
    addToast('ready', 'Filtered to deals owned by you.');
  };

  const handleStalledDeals = () => {
    addToast('attn', '4 deals have had no movement in 10+ days.');
  };

  return (
    <div className="view" id="view-pipeline">
      {/* Top chip bar */}
      <div className="chip-row" style={{ marginBottom: '1.2rem' }}>
        <button className="chip active" onClick={handleAllStages}>All stages</button>
        <button className="chip" onClick={handleMyDeals}>My deals</button>
        <button className="chip" onClick={handleStalledDeals}>Stalled</button>
      </div>

      <div className="kanban" id="kanbanBoard">
        {STAGES.map(stage => {
          const filteredDeals = getFilteredDeals(stage);
          return (
            <div key={stage} className="kanban-col">
              <div className="kcol-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>{stage}</span>
                  <span className="count">{filteredDeals.length}</span>
                </div>
                <IconButton onClick={() => onAddDeal(stage)} title={`Add deal to ${stage}`}>
                  <PlusIcon style={{ width: '12px', height: '12px' }} />
                </IconButton>
              </div>

              <div className="kcol-body">
                {filteredDeals.map((deal, idx) => (
                  <Card
                    key={idx}
                    glass={true}
                    glow={false}
                    className="kcard"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onOpenContact(deal.name)}
                  >
                    <div className="kcard-name">{deal.name}</div>
                    <div className="kcard-prop">{deal.prop}</div>
                    <div className="kcard-foot">
                      <span className="kcard-val">{deal.value}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
