import React from 'react';
import { ChevronLeftIcon } from '../ui/icons';

export default function SegmentsRail({
  show,
  activeSegment,
  onSegmentChange,
  collapsed,
  onToggleCollapse,
  currentView
}) {
  if (!show) return null;

  const isPipeline = currentView === 'pipeline';

  return (
    <aside className={`segments-rail ${collapsed ? 'collapsed' : ''}`} id="segmentsRail">
      <div className="segments-head">
        <span>{isPipeline ? 'Filters' : 'Views'}</span>
        <button className="icon-btn" id="segmentsCollapseBtn" onClick={onToggleCollapse}>
          <ChevronLeftIcon />
        </button>
      </div>
      <div className="segments-list">
        {isPipeline ? (
          <>
            <button
              className={`nav-item segment-item ${activeSegment === 'all' ? 'active' : ''}`}
              onClick={() => onSegmentChange('all')}
            >
              <span>All stages</span>
            </button>
            <button
              className={`nav-item segment-item ${activeSegment === 'contacted' ? 'active' : ''}`}
              onClick={() => onSegmentChange('contacted')}
            >
              <span>Contacted</span>
            </button>
            <button
              className={`nav-item segment-item ${activeSegment === 'not-contacted' ? 'active' : ''}`}
              onClick={() => onSegmentChange('not-contacted')}
            >
              <span>Not contacted</span>
            </button>
            <button
              className={`nav-item segment-item ${activeSegment === 'follow-up' ? 'active' : ''}`}
              onClick={() => onSegmentChange('follow-up')}
            >
              <span>Follow up</span>
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </aside>
  );
}
