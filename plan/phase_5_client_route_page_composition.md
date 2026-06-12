# 💻 Phase 5: Client Route & Page Composition Blueprint

This phase outlines client-side routing assembly, portfolio user views (including interactive homepage canvas details), shop interfaces, and checkout components.

---

## 1. Client Routing Assembly (`App.js`)

Assemble routes in [App.js](file:///c:/xampp/htdocs/codes/himalix-labs/frontend/src/App.js) to configure the Single Page Application navigation:

```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Landing from './pages/Landing';
import Store from './pages/Store';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import WalletDashboard from './pages/WalletDashboard';
import Signin from './pages/auth/Signin';
import Signup from './pages/auth/Signup';
import PrivateRoute from './components/store/PrivateRoute';
import AdminRoute from './components/store/AdminRoute';
import AdminLayout from './admin/main/AdminLayout';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Public Portfolio */}
              <Route path="/" element={<Landing />} />
              
              {/* Account Authorization */}
              <Route path="/signin" element={<Signin />} />
              <Route path="/signup" element={<Signup />} />

              {/* Public Storefront */}
              <Route path="/store" element={<Store />} />
              <Route path="/store/product/:id" element={<ProductDetail />} />

              {/* Secure Customer Routing */}
              <Route path="/store/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
              <Route path="/store/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
              <Route path="/store/wallet" element={<PrivateRoute><WalletDashboard /></PrivateRoute>} />

              {/* Secure Nested Admin Portal */}
              <Route path="/admin/*" element={<AdminRoute><AdminLayout /></AdminRoute>} />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
```

---

## 2. Interactive Portfolio Landing Page

Implement the homepage at `frontend/src/pages/Landing.js`. To deliver a premium "Non-AI" look, incorporate an interactive canvas node-grid that renders behind the Hero headline:

```javascript
import React, { useEffect, useRef } from 'react';
import '../styles/landing.css';

const Landing = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Node Variables
    const nodes = [];
    const nodeCount = 60;
    const maxDistance = 120;
    let mouse = { x: null, y: null };

    class Node {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce boundaries
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
    }

    // Initialize
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(new Node());
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#262626';
      ctx.lineWidth = 0.5;

      nodes.forEach((node, idx) => {
        node.update();
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold').trim() || '#d4a017';
        ctx.fill();

        // Connect Nodes
        for (let j = idx + 1; j < nodes.length; j++) {
          const dx = node.x - nodes[j].x;
          const dy = node.y - nodes[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDistance) {
            ctx.strokeStyle = `rgba(212, 160, 23, ${1 - dist / maxDistance})`;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }

        // Connect to Mouse
        if (mouse.x !== null) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDistance * 1.5) {
            ctx.strokeStyle = `rgba(212, 160, 23, ${0.4 * (1 - dist / (maxDistance * 1.5))})`;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="landing-layout">
      <canvas ref={canvasRef} className="interactive-canvas" />
      <header className="hero-section">
        <div className="hero-content">
          <h1>Hardware Solutions &amp; Custom 3D Prototyping</h1>
          <p>Solving scarcity gaps for makers, developers, and engineers across Nepal.</p>
          <div className="hero-actions">
            <a href="/store" className="btn-primary">Browse E-Commerce</a>
            <a href="/3d" className="btn-secondary">Request 3D Print</a>
          </div>
        </div>
      </header>
      {/* Dynamic Services Grid, Team Profiles, Contact forms follow here */}
    </div>
  );
};

export default Landing;
```

---

## 3. Product Directory & Filtering

The page at `frontend/src/pages/Store.js` renders products in an aligned modular grid:
- **Filters panel:** Search text fields, category selectors (Processors, Modules, ICs, Sensors), and sorting select menus (`price_asc`, `price_desc`, `newest`).
- **Cards design:** Crisp sharp borders, category badges, stock warnings, price metrics in fixed-width JetBrains Mono, and shopping cart submission buttons.

---

## 4. Single-Page E-Commerce Checkout

Implement the checkout page at `frontend/src/pages/Checkout.js`. It utilizes live shipping calculations based on geographic inputs:
1. **Shipping Fields:** Renders input text areas for name, email, phone, and district, along with location coordinates (`receivingLocation` e.g. `27.7172, 85.3240`).
2. **Dynamic Cost Modifiers:** Captures changes to coordinate fields and calculates shipping costs dynamically by checking inputs:
   * Triggers an API callback or local estimator using the Haversine calculation to verify the shipping fee against the minimum and per-kilometer rates.
   * Renders subtotal, calculated VAT (13%), calculated shipping, and order totals.
3. **Payment Methods Toggles:** Toggles between Cash on Delivery (COD) and Store Wallet Credits.
4. **Order Submission:** Handles checkout transactions in one click and forwards users to an order success notification displaying their tracking code.
