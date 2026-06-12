import React from 'react';

const ThreeDPanel = () => {
  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>3D Web Assets Controller</h3>
        <span className="badge">Active Skeletons</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
        Adjust responsive canvas frame ratios, lighting controls, camera positioning vectors, and upload new additive meshes (.gltf, .glb files).
      </p>

      <div className="admin-form-grid" style={{ marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px' }}>
          <h4 style={{ fontFamily: 'var(--font-serif)', marginBottom: '16px' }}>Render Parameters</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Camera FOV</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>45°</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Orbit Controls Constraint</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>Enabled</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Canvas Auto-Rotate speed</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>0.5 rad/s</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px' }}>
          <h4 style={{ fontFamily: 'var(--font-serif)', marginBottom: '16px' }}>Upload GLTF Mesh</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="file" disabled style={{ padding: '8px' }} />
            <button className="btn-secondary" disabled style={{ fontSize: '12px' }}>
              <i className="fa-light fa-sharp fa-upload"></i> Process Mesh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDPanel;
