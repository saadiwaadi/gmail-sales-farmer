import React from 'react';

export const LayersIcon = ({ className, style, strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);

export const ClockIcon = ({ className, style, strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

export const PulseIcon = ({ className, style, strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

export const BoltIcon = ({ className, style, strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M13 2L3 14h7l-1 8 11-14h-7l1-6z"/>
  </svg>
);

export const EnvelopeIcon = ({ className, style, strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <path d="M22 6l-10 7L2 6"/>
  </svg>
);

export const ChatIcon = ({ className, style, strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

export const PhoneIcon = ({ className, style, strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

export const TagIcon = ({ className, style, strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

export const UserIcon = ({ className, style, strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export const SettingsIcon = ({ className, style, strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 13.5a7.5 7.5 0 0 0 0-3l1.9-1.5-2-3.4-2.3.6a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.3-.6-2 3.4L4.6 10.5a7.5 7.5 0 0 0 0 3L2.7 15l2 3.4 2.3-.6c.76.66 1.64 1.17 2.6 1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.3.6 2-3.4z"/>
  </svg>
);

export const SearchIcon = ({ className, style, strokeWidth = 1.8 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <circle cx="11" cy="11" r="7"/>
    <path d="M21 21l-4.3-4.3"/>
  </svg>
);

export const BellIcon = ({ className, style, strokeWidth = 1.6 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M18 8a6 6 0 0 0-12 0c0 5-2 6-2 6h16s-2-1-2-6"/>
    <path d="M10 20a2 2 0 0 0 4 0"/>
  </svg>
);

export const ImportIcon = ({ className, style, strokeWidth = 1.8 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>
  </svg>
);

export const PlusIcon = ({ className, style, strokeWidth = 2 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

export const ChevronLeftIcon = ({ className, style, strokeWidth = 1.8 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M15 19l-7-7 7-7"/>
  </svg>
);

export const ChevronRightIcon = ({ className, style, strokeWidth = 1.8 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M9 5l7 7-7 7"/>
  </svg>
);

export const CloseIcon = ({ className, style, strokeWidth = 1.8 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

export const MoreHorizontalIcon = ({ className, style, strokeWidth = 1.8 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <circle cx="5" cy="12" r="1.2"/>
    <circle cx="12" cy="12" r="1.2"/>
    <circle cx="19" cy="12" r="1.2"/>
  </svg>
);

export const FilterIcon = ({ className, style, strokeWidth = 1.7 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M4 6h16M7 12h10M10 18h4"/>
  </svg>
);
