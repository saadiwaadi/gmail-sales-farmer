import React from 'react';
import { SearchIcon, BellIcon, ImportIcon, PlusIcon } from '../ui/icons';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';

const TITLES = {
  dashboard: ["Dashboard", "Tuesday, August 4 — everything as of this morning"],
  pipeline: ["Pipeline", "23 active deals, $2.84M in motion"],
  contacts: ["Contacts", "142 people across buyers, sellers, and nurture"],
  reports: ["Reports", "Performance across the current quarter"],
  settings: ["Settings", "Profile, notifications, and workspace preferences"],
  'contact-full': ["Full Profile", ""]
};

export default function Topbar({
  currentView,
  contactNameForFullProfile,
  searchQuery,
  onSearchQueryChange,
  onShowNotifications,
  onOpenImport,
  onOpenNewContact,
  contactsCount = 0,
  hasNotifications = false
}) {
  let [title, sub] = TITLES[currentView] || ["Dashboard", ""];

  if (currentView === 'contacts') {
    sub = `${contactsCount} contacts in pipeline`;
  }

  if (currentView === 'contact-full' && contactNameForFullProfile) {
    sub = `Details, message logs, and activity timeline for ${contactNameForFullProfile}`;
  }

  return (
    <header className="topbar-pill">
      <div className="topbar-left">
        <div className="view-title" id="viewTitle">{title}</div>
        <div className="view-sub" id="viewSub">{sub}</div>
      </div>
      <div className="topbar-right">
        <div className="search">
          <SearchIcon />
          <input
            id="searchInput"
            placeholder="Search contacts, deals, addresses…"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
          />
        </div>
        <IconButton id="bellBtn" ping={hasNotifications} onClick={onShowNotifications} title="Notifications">
          <BellIcon />
        </IconButton>
        <Button variant="outline" id="importLeadsBtn" onClick={onOpenImport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ImportIcon style={{ width: '14px', height: '14px' }} />
          Import leads
        </Button>
        <Button variant="primary" id="quickAddBtn" onClick={onOpenNewContact}>
          <PlusIcon />
          New Contact
        </Button>
      </div>
    </header>
  );
}
