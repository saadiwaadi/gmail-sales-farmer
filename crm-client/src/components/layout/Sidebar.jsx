import React from 'react';
import {
  LayersIcon,
  TagIcon,
  UserIcon,
  SettingsIcon,
  ChevronLeftIcon,
  PulseIcon
} from '../ui/icons';
import { addToast } from '../../hooks/useToast';

export default function Sidebar({
  currentView,
  onViewChange,
  collapsed,
  onToggleCollapse,
  me,
  onLogout
}) {
  const handleUserCardClick = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      onLogout();
    }
  };

  return (
    <aside className={`sidebar-pill ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-mark">L</div>
        {!collapsed && (
          <div>
            <div className="brand-name">Ledger</div>
            <div className="brand-sub">Field &amp; Book</div>
          </div>
        )}
        <button
          className="icon-btn"
          id="sidebarCollapseBtn"
          style={{ marginLeft: collapsed ? '0' : 'auto' }}
          onClick={onToggleCollapse}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <ChevronLeftIcon />
        </button>
      </div>

      <div className="nav-group">
        <div className="nav-label">Workspace</div>
        <button
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
          title="Dashboard"
        >
          <LayersIcon />
          <span>Dashboard</span>
        </button>
        <button
          className={`nav-item ${currentView === 'pipeline' ? 'active' : ''}`}
          onClick={() => onViewChange('pipeline')}
          title="Pipeline"
        >
          <TagIcon />
          <span>Pipeline</span>
        </button>
        <button
          className={`nav-item ${currentView === 'contacts' ? 'active' : ''}`}
          onClick={() => onViewChange('contacts')}
          title="Contacts"
        >
          <span style={{ position: 'relative', display: 'inline-flex' }} id="contactsNavIconWrap">
            <UserIcon />
          </span>
          <span>Contacts</span>
        </button>
        <button
          className={`nav-item ${currentView === 'reports' ? 'active' : ''}`}
          onClick={() => onViewChange('reports')}
          title="Reports"
        >
          <PulseIcon />
          <span>Reports</span>
        </button>
      </div>

      <div className="nav-group">
        <div className="nav-label">Configure</div>
        <button
          className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => onViewChange('settings')}
          title="Settings"
        >
          <SettingsIcon />
          <span>Settings</span>
        </button>
      </div>

      <div className="sidebar-foot">
        <div className="sync-row">
          <span className="dot pulse"></span>
          <span>Synced · Just now</span>
        </div>
        <div className="user-card" id="userCard" onClick={handleUserCardClick} style={{ cursor: 'pointer' }}>
          <div className="avatar" style={{ backgroundColor: me?.color || '#C9A24B' }}>
            {me?.avatar || 'SA'}
          </div>
          <div className="user-meta">
            <div className="user-name">{me?.name || 'Saad Ahmad'}</div>
            <div className="user-role">{me?.role || 'Principal Agent'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

