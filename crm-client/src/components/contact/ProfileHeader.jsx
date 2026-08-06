import React from 'react';
import Badge from '../ui/Badge';

export default function ProfileHeader({ name, tag, status }) {
  return (
    <div className="profile-header" style={{ marginBottom: '1rem' }}>
      <div className="profile-name" style={{ fontSize: '1.8rem', fontFamily: 'var(--serif)', marginBottom: '0.3rem' }}>
        {name}
      </div>
      <div className="profile-tag" style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '0.8rem' }}>
        {tag}
      </div>
      <div>
        <Badge status={status} />
      </div>
    </div>
  );
}
