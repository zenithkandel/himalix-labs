# 🎨 Phase 4: Frontend Framework & Contexts Blueprint

This phase configures the React client layout, modular CSS files, state contexts (Theme, Auth, and Cart), and protected routing modules.

---

## 1. Client Runtime Configuration

Create a [package.json](file:///c:/xampp/htdocs/codes/himalix-labs/frontend/package.json) file under the `/frontend` directory:

```json
{
  "name": "himalix-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

---

## 2. Design System & Modular Stylesheets

Create the modular styling directory under `frontend/src/styles/`:

### A. Core Color Tokens: [theme.css](file:///c:/xampp/htdocs/codes/himalix-labs/frontend/src/styles/theme.css)
Declares theme-specific parameters (dark as default, light toggleable):

```css
:root {
  /* Fonts */
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-serif: 'Playfair Display', serif;

  /* Accent Highlight */
  --accent-gold: #d4a017;
  --accent-gold-hover: #b8960c;
  --transition-speed: 0.15s;
}

/* Default Dark Theme */
[data-theme="dark"], :root:not([data-theme="light"]) {
  --bg-primary: #0a0a0a;
  --bg-secondary: #121212;
  --bg-tertiary: #181818;
  --text-primary: #f5f5f5;
  --text-secondary: #a3a3a3;
  --border-color: #262626;
  --input-bg: #121212;
  --shadow-color: rgba(0, 0, 0, 0.8);
}

/* Light Theme */
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #e9ecef;
  --text-primary: #171717;
  --text-secondary: #525252;
  --border-color: #dee2e6;
  --input-bg: #ffffff;
  --shadow-color: rgba(0, 0, 0, 0.05);
}
```

### B. Global Reset: [reset.css](file:///c:/xampp/htdocs/codes/himalix-labs/frontend/src/styles/reset.css)
Enforces global box model parameters and strict zero border-radius overrides:

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border-radius: 0 !important; /* Global Zero Border-Radius Override */
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

button, input, textarea, select {
  font-family: inherit;
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  outline: none;
}

button {
  cursor: pointer;
  transition: background-color var(--transition-speed), color var(--transition-speed);
}
```

---

## 3. Global Context State Providers

Implement contexts under `frontend/src/context/`:

### A. `ThemeContext`
Toggles visual themes and writes to local cache:

```javascript
import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### B. `AuthContext`
Manages token authentication, Google OAuth integrations, and updates wallet credit totals:

```javascript
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [systemConfig, setSystemConfig] = useState({});

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/auth/config');
      const data = await res.json();
      setSystemConfig(data);
    } catch (err) {
      console.error('Failed to load site configurations:', err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        logout();
      }
    } catch (err) {
      logout();
    }
  };

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setToken(data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, systemConfig, login, logout, fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### C. `CartContext`
Synchronizes the local cart with backend tables:

```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (token) fetchCart();
    else setItems([]);
  }, [token]);

  const fetchCart = async () => {
    const res = await fetch('/api/store/cart', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || []);
    }
  };

  const addToCart = async (productId, quantity) => {
    await fetch('/api/store/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId, quantity })
    });
    fetchCart();
  };

  const removeFromCart = async (id) => {
    await fetch(`/api/store/cart/remove/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchCart();
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);

  return (
    <CartContext.Provider value={{ items, cartCount, cartTotal, addToCart, removeFromCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};
```

---

## 4. Protected Route Guards

Implement routing middleware components inside `frontend/src/components/store/`:

### A. Private Route Guard (`PrivateRoute.js`)
```javascript
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { token } = useContext(AuthContext);
  return token ? children : <Navigate to="/signin" replace />;
};

export default PrivateRoute;
```

### B. Admin Route Guard (`AdminRoute.js`)
```javascript
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  
  if (!token) return <Navigate to="/signin" replace />;
  if (user && user.role !== 'admin') return <Navigate to="/store" replace />;
  
  return children;
};

export default AdminRoute;
```
