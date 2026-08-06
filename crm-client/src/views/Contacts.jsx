import React from 'react';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { UserIcon } from '../components/ui/icons';

export default function Contacts({
  contactsList = [],
  activeSegment = 'all',
  onOpenContact
}) {
  const getFilteredContacts = () => {
    return contactsList.filter(c => {
      if (activeSegment === 'all') return true;
      if (activeSegment === 'stalled') return c.score < 50;
      return c.type === activeSegment;
    });
  };

  const filteredContacts = getFilteredContacts();

  return (
    <div className="view" id="view-contacts">
      <Card style={{ padding: '0.3rem 1.15rem 0.6rem' }}>
        <table>
          <thead className="t-head">
            <tr>
              <th style={{ width: '8.5rem' }}>AI Status</th>
              <th>Name</th>
              <th>Type</th>
              <th>Stage</th>
              <th>Last contact</th>
              <th style={{ textAlign: 'right' }}>Score</th>
            </tr>
          </thead>
          <tbody className="t-body" id="contactsTable">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact, idx) => (
                <tr
                  key={idx}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onOpenContact(contact.name)}
                >
                  <td>
                    <Badge status={contact.ai_status || 'NOT_STARTED'} />
                  </td>
                  <td className="cell-primary">{contact.name}</td>
                  <td className="cell-muted" style={{ textTransform: 'capitalize' }}>
                    {contact.type}
                  </td>
                  <td>{contact.stage}</td>
                  <td className="cell-muted">{contact.last}</td>
                  <td style={{ textAlign: 'right' }} className="cell-muted">
                    {contact.score}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', opacity: 0.25 }}>
                  <UserIcon style={{ width: '32px', height: '32px', display: 'block', margin: '0 auto' }} />
                  <div className="cell-muted" style={{ marginTop: '0.5rem' }}>No contacts found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
