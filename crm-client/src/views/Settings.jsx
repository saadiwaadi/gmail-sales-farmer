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
  const [autoFollow, setAutoFollow] = useState(true);

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

          <div className="toggle-row">
            <div className="toggle-meta">
              <div className="t">Auto follow-up</div>
              <div className="d">Draft (not send) a note after 5 quiet days.</div>
            </div>
            <Toggle on={autoFollow} onChange={() => setAutoFollow(!autoFollow)} />
          </div>
        </Card>
      </div>
    </div>
  );
}
