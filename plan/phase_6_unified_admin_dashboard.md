# 👑 Phase 6: Unified Admin Dashboard Blueprint

This phase describes the configuration of the nested admin panel (`/admin`), the master layout sidebar, sub-route viewports, and dashboard operational elements.

---

## 1. Unified Sidebar Shell Layout

Create the main layout at `frontend/src/admin/main/AdminLayout.js`:

```javascript
import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import PortfolioCMS from '../portfolio/PortfolioCMS';
import StoreAdmin from '../store/StoreAdmin';
import MessagesAdmin from '../main/MessagesAdmin';
import SettingsAdmin from '../main/SettingsAdmin';
import '../../styles/admin.css';

const AdminLayout = () => {
  const location = useLocation();
  const activePath = location.pathname;

  return (
    <div className="admin-container">
      {/* Admin Control Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <i className="fa-light fa-sharp fa-lock" />
          <span>HIMALIX ADMIN</span>
        </div>
        <nav className="admin-nav">
          <Link 
            to="/admin/portfolio" 
            className={`nav-item ${activePath.startsWith('/admin/portfolio') ? 'active' : ''}`}
          >
            <i className="fa-light fa-sharp fa-window" /> General CMS
          </Link>
          <Link 
            to="/admin/store" 
            className={`nav-item ${activePath.startsWith('/admin/store') ? 'active' : ''}`}
          >
            <i className="fa-light fa-sharp fa-bag-shopping" /> Store E-Commerce
          </Link>
          <Link 
            to="/admin/messages" 
            className={`nav-item ${activePath.startsWith('/admin/messages') ? 'active' : ''}`}
          >
            <i className="fa-light fa-sharp fa-envelope" /> Contact Leads
          </Link>
          <Link 
            to="/admin/settings" 
            className={`nav-item ${activePath.startsWith('/admin/settings') ? 'active' : ''}`}
          >
            <i className="fa-light fa-sharp fa-gears" /> Global Configuration
          </Link>
        </nav>
        <div className="admin-footer">
          <a href="/store" className="nav-item return-store">
            <i className="fa-light fa-sharp fa-arrow-left" /> Back to Store
          </a>
        </div>
      </aside>

      {/* Main Viewport Outlet */}
      <main className="admin-viewport">
        <Routes>
          <Route path="portfolio" element={<PortfolioCMS />} />
          <Route path="store/*" element={<StoreAdmin />} />
          <Route path="messages" element={<MessagesAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="*" element={
            <div className="admin-fallback">
              <h2>Select an administrative sub-module from the sidebar to manage configurations.</h2>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default AdminLayout;
```

---

## 2. Dashboard Sub-module Frameworks

### A. General Portfolio CMS
Implements controls to update landing page contents:
1. **CMS Sections Grid:** Input fields to edit hero headlines, subheadlines, and copyright strings.
2. **Services CRUD:** CRUD data table to manage core services, customize FontAwesome icon tags (`icon_class`), select active state parameters, and order listings.
3. **Founders Details:** CRUD controls to alter names, designations, biographies, social links, and update profiles.
4. **Testimonials Grid:** Displays customer reviews, enables order sequence adjustments, and provides moderation buttons.

### B. Store E-Commerce Management
A nested dashboard containing detailed e-commerce tabs:
* **Analytics Tab:** Graph summaries displaying total store revenue, order category metrics, average cart counts, and daily performance metrics.
* **Products Catalog:** CRUD listings for store components. Allows catalog uploads, specification additions, stock updates, cost-price analysis, and category modifications.
* **Carts Auditor:** Audits active customer carts to track pending selections and manage outreach.
* **Orders Control Desk:** Manages order flows (Pending $\rightarrow$ Processing $\rightarrow$ Shipped $\rightarrow$ Delivered $\rightarrow$ Cancelled). Includes options to input tracking codes, update payment statuses (`unpaid` vs `paid`), and view address logs.
* **User Accounts & Roles:** Displays customer profiles. Administrative tools allow role elevations (`user` $\leftrightarrow$ `admin`), password overrides, and manual account credits deposits (e.g. transfers via eSewa).
* **Auditing Logs:** Tab view to track wallet transaction histories and social claim attempts across platforms.

### C. Contact Messaging Panel
Displays contact inquiries from potential leads:
- Unread messages are marked with solid accent indicators.
- Admin options to toggle read status, delete files, and send responses.
