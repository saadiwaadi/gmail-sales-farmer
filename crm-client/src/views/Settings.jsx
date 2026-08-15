import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Toggle from '../components/ui/Toggle';
import { addToast } from '../hooks/useToast';

export default function Settings({ densityCompact, onDensityToggle }) {
  const [profile, setProfile] = useState({
    name: "Saad Ahmad",
    brokerage: "BitLogicHub Realty",
    email: "saad@bitlogichub.com"
  });

  const [emailNotif, setEmailNotif] = useState(true);
  const [smsAlert, setSmsAlert] = useState(false);
  const [autoFollow, setAutoFollow] = useState(() => {
    return localStorage.getItem('auto_follow') !== 'false';
  });
  const [followupDays, setFollowupDays] = useState(() => {
    const saved = localStorage.getItem('followup_days');
    return saved ? parseInt(saved, 10) : 7;
  });

  const handleProfileChange = (field, val) => {
    setProfile(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveSettings = () => {
    addToast('ready', 'Settings saved.');
  };

  return (
    <div className="view" id="view-settings">
      <div className="settings-grid">
        <Card glow={false}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>Profile</div>
          <div className="field">
            <label>Full name</label>
            <input
              value={profile.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Company / Studio</label>
            <input
              value={profile.brokerage}
              onChange={(e) => handleProfileChange('brokerage', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Direct email</label>
            <input
              value={profile.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
            />
          </div>
          <Button variant="primary" id="saveSettingsBtn" onClick={handleSaveSettings}>
            Save changes
          </Button>
        </Card>

        <Card glow={false}>
          <div className="card-title" style={{ marginBottom: '0.4rem' }}>Preferences</div>
          
          <div className="toggle-row">
            <div className="toggle-meta">
              <div className="t">Compact density</div>
              <div className="d">Smaller type and tighter spacing — fit more of the day on screen.</div>
            </div>
            <Toggle on={densityCompact} onChange={onDensityToggle} />
          </div>

          <div className="toggle-row">
            <div className="toggle-meta">
              <div className="t">Email notifications</div>
              <div className="d">Daily digest of follow-ups and new signals.</div>
            </div>
            <Toggle on={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
          </div>

          <div className="toggle-row">
            <div className="toggle-meta">
              <div className="t">SMS alerts</div>
              <div className="d">Only for offers and time-sensitive showings.</div>
            </div>
            <Toggle on={smsAlert} onChange={() => setSmsAlert(!smsAlert)} />
          </div>

          <div className="toggle-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="toggle-meta">
                <div className="t">Auto follow-up</div>
                <div className="d">Draft (not send) a note after quiet days.</div>
              </div>
              <Toggle 
                on={autoFollow} 
                onChange={() => {
                  const nextVal = !autoFollow;
                  setAutoFollow(nextVal);
                  localStorage.setItem('auto_follow', nextVal ? 'true' : 'false');
                }} 
              />
            </div>
            {autoFollow && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', paddingLeft: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Follow-up after</span>
                <input 
                  type="number" 
                  min="1" 
                  max="30"
                  value={followupDays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 7;
                    setFollowupDays(val);
                    localStorage.setItem('followup_days', val);
                  }}
                  style={{
                    width: '60px',
                    background: 'var(--panel-sunk)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-1)',
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>days of no interaction</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
