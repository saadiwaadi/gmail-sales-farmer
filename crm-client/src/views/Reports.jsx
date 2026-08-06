import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { addToast } from '../hooks/useToast';

export default function Reports() {
  const chartData = [
    { m: "Feb", v: 38 },
    { m: "Mar", v: 52 },
    { m: "Apr", v: 41 },
    { m: "May", v: 66 },
    { m: "Jun", v: 58 },
    { m: "Jul", v: 74 },
    { m: "Aug", v: 47 }
  ];

  const maxVal = Math.max(...chartData.map(d => d.v));

  const handleExport = () => {
    addToast('processing', 'Preparing report…');
    setTimeout(() => addToast('ready', 'Report exported — check your downloads.'), 1100);
  };

  const handleBarClick = (d) => {
    const value = (d.v * 61).toLocaleString() + "0";
    const dealsCount = Math.round(d.v / 12);
    addToast('ready', `${d.m}: $${value} closed across ${dealsCount} deals.`);
  };

  return (
    <div className="view" id="view-reports">
      <div className="stat-cards">
        <div className="stat-card">
          <div className="l">Closed volume, YTD</div>
          <div className="n">$4.12M</div>
          <div className="d">↑ 14% vs last year</div>
        </div>
        <div className="stat-card">
          <div className="l">Avg. days to close</div>
          <div className="n">38</div>
          <div className="d down">↓ 6 days faster</div>
        </div>
        <div className="stat-card">
          <div className="l">Lead conversion</div>
          <div className="n">18.4%</div>
          <div className="d">↑ 2.1pt</div>
        </div>
        <div className="stat-card">
          <div className="l">Referral rate</div>
          <div className="n">31%</div>
          <div className="d">↑ steady</div>
        </div>
      </div>

      <Card className="chart-card" glow={false}>
        <div className="card-head">
          <div className="card-title">Closed volume by month</div>
          <Button variant="outline" id="exportReportBtn" onClick={handleExport}>
            Export report
          </Button>
        </div>
        <div className="bars" id="barsChart">
          {chartData.map((d, index) => (
            <div
              key={index}
              className="bar-col"
              onClick={() => handleBarClick(d)}
              style={{ cursor: 'pointer' }}
            >
              <div className="bar-fill" style={{ height: `${(d.v / maxVal) * 100}%` }}></div>
              <div className="bar-label">{d.m}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
