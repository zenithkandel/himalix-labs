import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'General CMS', path: '/admin/portfolio', icon: 'fa-briefcase' },
    { name: 'Store', path: '/admin/store', icon: 'fa-shopping-cart' },
    { name: '3D Models', path: '/admin/3d', icon: 'fa-cube' },
    { name: 'Web Dev', path: '/admin/web', icon: 'fa-code' },
    { name: 'Projects', path: '/admin/project', icon: 'fa-tasks' }
  ];

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <i className="fa-light fa-sharp fa-cog fa-spin"></i>
          <h2>Himalix Admin</h2>
        </div>
        <ul className="admin-menu">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.path} className={`admin-menu-item ${isActive ? 'active' : ''}`}>
                <Link to={item.path}>
                  <i className={`fa-light fa-sharp ${item.icon}`}></i>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div style={{ marginTop: 'auto', padding: '24px' }}>
          <button className="btn-secondary" onClick={logout} style={{ width: '100%' }}>
            <i className="fa-light fa-sharp fa-sign-out"></i> Log Out
          </button>
        </div>
      </div>
      <div className="admin-main">
        <div className="admin-navbar">
          <div className="admin-navbar-title">Dashboard Controller</div>
          <div className="admin-user-profile">
            <span>Logged in as: <b>{user?.email}</b></span>
          </div>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
