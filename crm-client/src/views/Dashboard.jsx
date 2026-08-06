import React, { useState } from 'react';
import Card from '../components/ui/Card';
import IconButton from '../components/ui/IconButton';
import Button from '../components/ui/Button';
import { MoreHorizontalIcon, FilterIcon, BoltIcon, PulseIcon } from '../components/ui/icons';
import { addToast } from '../hooks/useToast';

export default function Dashboard({
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

  return (
    <div className="view" id="view-dashboard">
      <div className="dash-grid">
        
        {/* LEFT: Portfolio */}
        <div className="col">
          <Card>
            <div className="card-head">
              <div className="card-title">Portfolio</div>
              <IconButton onClick={handlePortfolioOptions}>
                <MoreHorizontalIcon />
              </IconButton>
            </div>

            <div className="net-worth">
              <div className="label">Net pipeline value</div>
              <div className="value">$2,840,600 <span className="delta">↑ 6.2%</span></div>
            </div>

            <div className="ledger-rule"></div>

            <div className="tree" id="portfolioTree">
              
              {/* Active Listings */}
              <div
                className={`tree-row ${treeOpen.active ? 'open' : ''}`}
                onClick={() => toggleTree('active')}
              >
                <div className="tree-row-left">
                  <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  <span>Active Listings </span>
                  <span className="cell-muted">(12)</span>
                </div>
                <div className="tree-row-right">$1,240,000</div>
              </div>
              {treeOpen.active && (
                <div className="tree-sub">
                  <div className="tree-sub-row" onClick={() => addToast('ready', '412 Ashwood Lane — 3 new views this week.')}>
                    412 Ashwood Ln <span>$620,000</span>
                  </div>
                  <div className="tree-sub-row" onClick={() => addToast('ready', '118 Birchgate Rd — showing booked for Thu.')}>
                    118 Birchgate Rd <span>$340,000</span>
                  </div>
                  <div className="tree-sub-row" onClick={() => addToast('ready', '9 Copperfield Ct — price reviewed Monday.')}>
                    9 Copperfield Ct <span>$280,000</span>
                  </div>
                </div>
              )}

              {/* Under Contract */}
              <div
                className={`tree-row ${treeOpen.contract ? 'open' : ''}`}
                onClick={() => toggleTree('contract')}
              >
                <div className="tree-row-left">
                  <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  <span>Under Contract </span>
                  <span className="cell-muted">(4)</span>
                </div>
                <div className="tree-row-right">$860,000</div>
              </div>
              {treeOpen.contract && (
                <div className="tree-sub">
                  <div className="tree-sub-row" onClick={() => addToast('ready', '221 Maple Grove — inspection cleared.')}>
                    221 Maple Grove <span>$410,000</span>
                  </div>
                  <div className="tree-sub-row" onClick={() => addToast('processing', '31 Harrow St — appraisal pending.')}>
                    31 Harrow St <span>$450,000</span>
                  </div>
                </div>
              )}

              {/* Closed */}
              <div
                className={`tree-row ${treeOpen.closed ? 'open' : ''}`}
                onClick={() => toggleTree('closed')}
              >
                <div className="tree-row-left">
                  <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  <span>Closed, this quarter </span>
                  <span className="cell-muted">(7)</span>
                </div>
                <div className="tree-row-right">$610,600</div>
              </div>
              {treeOpen.closed && (
                <div className="tree-sub">
                  <div className="tree-sub-row" onClick={() => addToast('ready', '54 Pinehollow — closed at asking.')}>
                    54 Pinehollow <span>$298,000</span>
                  </div>
                  <div className="tree-sub-row" onClick={() => addToast('ready', '8 Larkspur Way — closed, 3% over ask.')}>
                    8 Larkspur Way <span>$312,600</span>
                  </div>
                </div>
              )}

              {/* Nurture */}
              <div
                className="tree-row"
                style={{ cursor: 'pointer' }}
                onClick={() => addToast('ready', '23 contacts sit in nurture — none touched in 30+ days.')}
              >
                <div className="tree-row-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ visibility: 'hidden' }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  <span>Nurture </span>
                  <span className="cell-muted">(23 contacts)</span>
                </div>
                <div className="tree-row-right">—</div>
              </div>

            </div>

            <button className="see-all" id="addListingBtn" onClick={handleAddListing}>+ Add listing</button>
          </Card>
        </div>

        {/* CENTER: This Week & Recent Activity */}
        <div className="col">
          <Card>
            <div className="card-head">
              <div className="card-title">This week</div>
              <IconButton onClick={handleFiltersToast}>
                <FilterIcon />
              </IconButton>
            </div>

            <div className="stat-trio">
              <div className="stat"><div className="n">8</div><div className="l">Follow-ups due</div></div>
              <div className="stat"><div className="n">5</div><div className="l">Showings booked</div></div>
              <div className="stat"><div className="n">2</div><div className="l">Offers pending</div></div>
            </div>

            <div className="seg-bar">
              <div className="seg" style={{ width: '52%', background: 'var(--accent)' }}></div>
              <div className="seg" style={{ width: '28%', background: 'var(--amber)' }}></div>
              <div className="seg" style={{ width: '20%', background: 'var(--panel-raised)' }}></div>
            </div>
            <div className="bar-legend">
              <div className="legend-item">
                <span className="legend-swatch" style={{ background: 'var(--accent)' }}></span>Client-facing
              </div>
              <div className="legend-item">
                <span className="legend-swatch" style={{ background: 'var(--amber)' }}></span>Admin
              </div>
              <div className="legend-item">
                <span className="legend-swatch" style={{ background: 'var(--panel-raised)', border: '1px solid var(--border)' }}></span>Travel
              </div>
            </div>

            <div className="ledger-rule"></div>

            <div className="mini-bar-row" style={{ cursor: 'pointer' }} onClick={handleOverdueToast}>
              <div className="mini-bar-head">
                <div className="k">
                  <span className="status attn"><span className="sdot"></span></span>Overdue
                </div>
                <div>3 of 8</div>
              </div>
              <div className="mini-bar">
                <div className="fill rust glow-rust" style={{ width: '38%' }}></div>
              </div>
              <div className="mini-bar-foot"><span>3 contacts</span><span>due already</span></div>
            </div>
            
            <div className="mini-bar-row" style={{ cursor: 'pointer' }} onClick={handleDueTodayToast}>
              <div className="mini-bar-head">
                <div className="k">
                  <span className="status ready"><span className="sdot"></span></span>Due today
                </div>
                <div>5 of 8</div>
              </div>
              <div className="mini-bar">
                <div className="fill mint" style={{ width: '62%' }}></div>
              </div>
              <div className="mini-bar-foot"><span>5 contacts</span><span>on schedule</span></div>
            </div>
          </Card>

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

        {/* RIGHT: Latest signals & Market update */}
        <div className="col">
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
