import React from 'react';

export default function ProfileActivity({ contact }) {
  // Static timeline data as shown in the original mockup
  const activities = [
    { text: "Opened your last follow-up email", date: "2 days ago", active: true },
    { text: "Viewed listing details for 412 Ashwood Lane, twice", date: "4 days ago", active: true },
    { text: "Called — left voicemail regarding showing slots", date: "9 days ago", active: false },
    { text: "Email communication: confirmed relocation timeline details", date: "2 weeks ago", active: false },
    { text: "Staged photo album shared on social media portal link", date: "3 weeks ago", active: false },
    { text: "Inbound message: requested Northside price stats guide", date: "1 month ago", active: false },
    { text: "Contact registered on site landing page via referral source", date: "1 month ago", active: false }
  ];

  return (
    <div className="timeline" style={{ marginLeft: '1.5rem' }}>
      {activities.map((act, idx) => (
        <div key={idx} className={`tl-item ${act.active ? 'mint' : ''}`}>
          <div>
            <div className="tl-text">{act.text}</div>
            <div className="tl-date">{act.date}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
