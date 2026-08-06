import React from 'react';
import { ChevronLeftIcon } from '../ui/icons';

export default function SegmentsRail({
  show,
  activeSegment,
  onSegmentChange,
  collapsed,
  onToggleCollapse
}) {
  if (!show) return null;

  return (
    <aside className={`segments-rail ${collapsed ? 'collapsed' : ''}`} id="segmentsRail">
      <div className="segments-head">
        <span>Views</span>
        <button className="icon-btn" id="segmentsCollapseBtn" onClick={onToggleCollapse}>
          <ChevronLeftIcon />
        </button>
      </div>
      <div className="segments-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        <button
          className={`nav-item segment-item ${activeSegment === 'all' ? 'active' : ''}`}
          onClick={() => onSegmentChange('all')}
        >
          <span>All</span>
        </button>
        <button
          className={`nav-item segment-item ${activeSegment === 'buyer' ? 'active' : ''}`}
          onClick={() => onSegmentChange('buyer')}
        >
          <span>Cold</span>
        </button>
        <button
          className={`nav-item segment-item ${activeSegment === 'seller' ? 'active' : ''}`}
          onClick={() => onSegmentChange('seller')}
        >
          <span>Warm</span>
        </button>
        <button
          className={`nav-item segment-item ${activeSegment === 'nurture' ? 'active' : ''}`}
          onClick={() => onSegmentChange('nurture')}
        >
          <span>Active</span>
        </button>
        <button
          className={`nav-item segment-item ${activeSegment === 'replied' ? 'active' : ''}`}
          onClick={() => onSegmentChange('replied')}
        >
          <span>Replied</span>
        </button>
        <button
          className={`nav-item segment-item ${activeSegment === 'stalled' ? 'active' : ''}`}
          onClick={() => onSegmentChange('stalled')}
        >
          <span>Stalled</span>
        </button>
      </div>
    </aside>
  );
}
