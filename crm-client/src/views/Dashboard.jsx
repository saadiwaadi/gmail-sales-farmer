import React, { useState } from 'react';
import Card from '../components/ui/Card';
import IconButton from '../components/ui/IconButton';
import Button from '../components/ui/Button';
import { MoreHorizontalIcon, FilterIcon, BoltIcon, PulseIcon } from '../components/ui/icons';
import { addToast } from '../hooks/useToast';

export default function Dashboard({
  contactsList = [],
  activityData = [],
  signalsData = [],
  onOpenContact,
  onGenerateDraft
}) {
  // Tree collapse state
  const [treeOpen, setTreeOpen] = useState({
    active: true,
    contract: true,
    closed: true
  });

  const toggleTree = (section) => {
    setTreeOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddListing = () => {
    addToast('ready', 'New listing draft created — finish details in Pipeline.');
  };

  const handlePortfolioOptions = () => {
    addToast('ready', 'Portfolio options — export, resort, or archive.');
  };

  const handleFiltersToast = () => {
    addToast('ready', 'Filters — by agent, property type, and priority.');
  };

  const handleOverdueToast = () => {
    addToast('attn', '3 follow-ups are overdue — Priya, Marcus, and the Chen listing.');
  };

  const handleDueTodayToast = () => {
    addToast('ready', '5 follow-ups queued for today, first at 10:30am.');
  };

  const handleActivityOptions = () => {
    addToast('ready', 'Activity view — table, timeline, or calendar.');
  };

  const handleActivityDateToast = () => {
    addToast('ready', 'Filtered by date range: last 14 days.');
  };

  const handleSeeAllActivity = () => {
    addToast('ready', 'Loading the full 90-day activity log.');
  };

  const handleSignalsOptions = () => {
    addToast('ready', 'Signals — ranked by engagement, most recent first.');
  };

  const handleSeeAllSignals = () => {
    addToast('ready', 'Loading all 41 signals from the last 7 days.');
  };

  const totalContacts = contactsList ? contactsList.length : 0;
  const aiReadyContacts = contactsList ? contactsList.filter(c => c.ai_status === 'READY').length : 0;

  // Calculate Replied this week (outcome === 'replied' in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const repliedThisWeek = contactsList
    ? contactsList.reduce((count, c) => {
        const replies = (c.messages || []).filter(
          m => m.outcome === 'replied' && new Date(m.created_at || m.date) >= sevenDaysAgo
        );
        return count + replies.length;
      }, 0)
    : 0;

  return (
    <div className="view" id="view-dashboard">
      {/* Dynamic Stat Cards */}
      <div className="stat-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem', marginBottom: '1.5rem' }}>
        <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div className="l" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', fontWeight: '500' }}>Total Contacts</div>
          <div className="n" style={{ fontSize: '2.2rem', fontWeight: '600', fontFamily: 'var(--serif)', color: 'var(--accent)' }}>{totalContacts}</div>
          <div className="d" style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Contacts in pipeline</div>
        </Card>
        <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div className="l" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', fontWeight: '500' }}>AI Ready</div>
          <div className="n" style={{ fontSize: '2.2rem', fontWeight: '600', fontFamily: 'var(--serif)', color: 'var(--amber)' }}>{aiReadyContacts}</div>
          <div className="d" style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Extracted research profiles</div>
        </Card>
        <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div className="l" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', fontWeight: '500' }}>Replied This Week</div>
          <div className="n" style={{ fontSize: '2.2rem', fontWeight: '600', fontFamily: 'var(--serif)', color: 'var(--accent)' }}>{repliedThisWeek}</div>
          <div className="d" style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Outreach replies received</div>
        </Card>
      </div>

      <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* LEFT COLUMN: Recent Activity */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <div className="card-head">
              <div className="card-title">Recent activity</div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <IconButton onClick={handleActivityOptions}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: '15px', height: '15px' }}>
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </IconButton>
                <IconButton onClick={handleActivityDateToast}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: '15px', height: '15px' }}>
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M3 10h18M8 3v4M16 3v4" />
                  </svg>
                </IconButton>
              </div>
            </div>

            <table>
              <thead className="t-head">
                <tr>
                  <th>Contact</th>
                  <th>Date</th>
                  <th>Stage change</th>
                  <th style={{ textAlign: 'right' }}>Value</th>
                </tr>
              </thead>
              <tbody className="t-body" id="activityTable">
                {activityData.length > 0 ? (
                  activityData.map((act, index) => (
                    <tr
                      key={index}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onOpenContact(act.name)}
                    >
                      <td className="cell-primary">{act.name}</td>
                      <td className="cell-muted">{act.date}</td>
                      <td>{act.change}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={act.pos ? 'amt-pos' : 'amt-neg'}>{act.value}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', opacity: 0.25 }}>
                      <PulseIcon style={{ width: '32px', height: '32px', display: 'block', margin: '0 auto' }} />
                      <div className="cell-muted">No recent activity</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <button className="see-all" onClick={handleSeeAllActivity}>See all activity</button>
          </Card>
        </div>

        {/* RIGHT COLUMN: Signals & CTA */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <div className="card-head">
              <div className="card-title">Latest signals</div>
              <IconButton onClick={handleSignalsOptions}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: '15px', height: '15px' }}>
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                </svg>
              </IconButton>
            </div>

            <div id="signalsList">
              {signalsData.length > 0 ? (
                signalsData.map((sig, index) => (
                  <div
                    key={index}
                    className="signal-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onOpenContact(sig.name)}
                  >
                    <div className="signal-icon">
                      <BoltIcon />
                    </div>
                    <div className="signal-mid">
                      <div className="signal-name">{sig.name}</div>
                      <div className="signal-sub">{sig.sub}</div>
                    </div>
                    <div className="signal-right">
                      <div className="signal-score">{sig.score}</div>
                      <div className="signal-date">{sig.date}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.25 }}>
                  <BoltIcon style={{ width: '32px', height: '32px', display: 'block', margin: '0 auto' }} />
                  <div className="cell-muted">No signals recorded</div>
                </div>
              )}
            </div>

            <button className="see-all" onClick={handleSeeAllSignals}>See all</button>
          </Card>

          <div className="cta-card">
            <div className="cta-kicker">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                <path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5" />
              </svg>
              MARKET UPDATE
            </div>
            <div className="cta-title">Draft this <em>week's</em> note</div>
            <div className="cta-body">Keep your book warm — a short, well-set update for the 84 contacts still deciding.</div>
            <Button
              variant="primary"
              id="generateEmailBtn"
              onClick={() => onGenerateDraft(null)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Generate draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
