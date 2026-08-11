import React from 'react';
import {
  LayersIcon,
  TagIcon,
  UserIcon,
  SettingsIcon,
  PulseIcon
} from '../ui/icons';

export default function Sidebar({
  currentView,
  onViewChange,
  me,
  onLogout
}) {
  const handleUserCardClick = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      onLogout();
    }
  };

  return (
    <aside className="sidebar-rail">
      {/* Brand mark (top) */}
      <div className="brand-mark-rail">
        L
      </div>

      {/* Nav items */}
      <div className="nav-items-rail">
        <button
          className={`nav-item-rail ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
        >
          <LayersIcon />
          <span className="tooltip">Dashboard</span>
        </button>
        <button
          className={`nav-item-rail ${currentView === 'pipeline' ? 'active' : ''}`}
          onClick={() => onViewChange('pipeline')}
        >
          <TagIcon />
          <span className="tooltip">Pipeline</span>
        </button>
        <button
          className={`nav-item-rail ${currentView === 'contacts' ? 'active' : ''}`}
          onClick={() => onViewChange('contacts')}
        >
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <UserIcon />
          </span>
          <span className="tooltip">Contacts</span>
        </button>
        <button
          className={`nav-item-rail ${currentView === 'reports' ? 'active' : ''}`}
          onClick={() => onViewChange('reports')}
        >
          <PulseIcon />
          <span className="tooltip">Reports</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="rail-spacer"></div>

      {/* Bottom items */}
      <div className="nav-items-rail">
        <button
          className={`nav-item-rail ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => onViewChange('settings')}
        >
          <SettingsIcon />
          <span className="tooltip">Settings</span>
        </button>
        
        {/* Profile / Logout */}
        <button
          className="nav-item-rail profile-btn-rail"
          onClick={handleUserCardClick}
        >
          <div className="avatar-rail" style={{ backgroundColor: me?.color || '#C9A24B' }}>
            {me?.avatar || 'SA'}
          </div>
          <span className="tooltip">Logout ({me?.name || 'Saad Ahmad'})</span>
        </button>
      </div>
    </aside>
  );
}
