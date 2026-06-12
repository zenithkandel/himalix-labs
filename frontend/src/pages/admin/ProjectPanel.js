import React from 'react';

const ProjectPanel = () => {
  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>Master Projects Database Console</h3>
        <span className="badge">Active Skeletons</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
        Track robotics fabrication pipelines, discrete milestones, assembly schedules, and technical files records.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '15px' }}>Custom RC Chassis CNC Fabrication</h4>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status: Structural Milling completed</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--accent-gold)' }}>100% Completed</span>
        </div>
        
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '15px' }}>Solder Board Component Layout Validation</h4>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status: Awaiting discrete components arrival</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>40% Pending</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectPanel;
