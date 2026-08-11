import React, { useState } from 'react';
import Card from '../components/ui/Card';
import IconButton from '../components/ui/IconButton';
import Button from '../components/ui/Button';
import { MoreHorizontalIcon, FilterIcon, BoltIcon, PulseIcon } from '../components/ui/icons';
import { addToast } from '../hooks/useToast';
import '../styles/status-cards.css';

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

  // Additional status card calculations
  const aiReadyPct = totalContacts ? Math.round((aiReadyContacts / totalContacts) * 100) : 0;
  const contactedCount = contactsList ? contactsList.filter(c => ['Sent', 'Replied / Booked', 'Offer', 'Closed'].includes(c.stage)).length : 0;
  const contactedPct = totalContacts ? Math.round((contactedCount / totalContacts) * 100) : 0;

  return (
    <div className="view" id="view-dashboard">
      {/* Dynamic Stat Cards */}
      <div className="stat-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '1.5rem' }}>
        
        {/* Card 1: Hero Outreach Status */}
        <div className="status-hero-card">
          <div className="status-head">
            <div>
              <h1>Status.</h1>
              <p>Fully self-sufficient.</p>
            </div>
            <div className="status-mark">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <div className="status-hero">
            <div className="status-hero-value">
              {aiReadyPct}<span className="pct">%</span>
            </div>
            <div className="status-hero-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </div>
          </div>

          <div className="status-pills">
            <span className="status-pill">{aiReadyPct}% AI Ready</span>
            <span className="status-pill">{contactedPct}% Contacted</span>
          </div>
        </div>

        {/* Card 2: Featured Outreach Card */}
        <div className="status-feature">
          <div className="status-feature-top">
            <span className="status-feature-label">Research Status.</span>
            <span className="status-feature-meta">{aiReadyContacts} profiles</span>
          </div>
          <div className="status-feature-value">Active</div>
        </div>

        {/* Card 3: Two-Up Stat Grid */}
        <div className="status-grid2">
          <div className="status-stat-card">
            <div className="status-stat-top">
              <span className="status-stat-meta">{repliedThisWeek} replies</span>
            </div>
            <div className="status-stat-icon">
              {/* Sun SVG */}
              <svg viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4"></circle>
                <line x1="12" y1="2" x2="12" y2="4"></line>
                <line x1="12" y1="20" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line>
                <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="4" y2="12"></line>
                <line x1="20" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"></line>
                <line x1="17.66" y1="6.34" x2="19.07" y2="4.93"></line>
              </svg>
            </div>
            <span className="status-stat-label">Replies.</span>
            <span className="status-stat-value">{repliedThisWeek} this week</span>
          </div>

          <div className="status-stat-card">
            <div className="status-stat-top">
              <span className="status-stat-meta">{contactedCount} contacted</span>
            </div>
            <div className="status-stat-icon">
              {/* Battery SVG */}
              <svg viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2" strokeLinecap="round">
                <rect x="7" y="4" width="10" height="18" rx="2"></rect>
                <line x1="10" y1="1" x2="14" y2="1"></line>
                <rect x="9" y="12" width="6" height="7" fill="#3ecf8e" stroke="none"></rect>
              </svg>
            </div>
            <span className="status-stat-label">Outreach.</span>
            <span className="status-stat-value">{contactedPct}%</span>
          </div>
        </div>

      </div>

      <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', alignItems: 'start' }}>
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
