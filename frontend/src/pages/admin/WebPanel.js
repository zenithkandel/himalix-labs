import React from 'react';

const WebPanel = () => {
  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>Web Projects Configurations</h3>
        <span className="badge">Active Skeletons</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
        Configure custom react layout frames, API routes reverse proxies, bind domains, and monitor active SSL status.
      </p>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Target Subdomain</th>
              <th>Destination Port</th>
              <th>SSL Encrypted</th>
              <th>Pipeline Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontFamily: 'var(--font-mono)' }}>labs.himalix.com</td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>Port 3000</td>
              <td><span className="badge success">Active SSL</span></td>
              <td><span className="badge success">Idle / Green</span></td>
            </tr>
            <tr>
              <td style={{ fontFamily: 'var(--font-mono)' }}>store.himalix.com</td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>Port 5000</td>
              <td><span className="badge success">Active SSL</span></td>
              <td><span className="badge success">Idle / Green</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WebPanel;
