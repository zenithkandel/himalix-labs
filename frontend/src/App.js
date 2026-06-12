import React from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';

// Import CSS Stylesheets
import './styles/theme.css';
import './styles/reset.css';
import './styles/navigation.css';
import './styles/landing.css';
import './styles/store.css';
import './styles/admin.css';

// Import Guards
import PrivateRoute from './components/store/PrivateRoute';
import AdminRoute from './components/store/AdminRoute';

// Import Client Pages
import Landing from './pages/portfolio/Landing';
import Signin from './pages/auth/Signin';
import Signup from './pages/auth/Signup';
import Catalog from './pages/store/Catalog';
import ProductDetail from './pages/store/ProductDetail';
import CartView from './pages/store/CartView';
import CheckoutView from './pages/store/CheckoutView';
import WalletView from './pages/store/WalletView';

// Import Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import PortfolioPanel from './pages/admin/PortfolioPanel';
import StorePanel from './pages/admin/StorePanel';
import ThreeDPanel from './pages/admin/ThreeDPanel';
import WebPanel from './pages/admin/WebPanel';
import ProjectPanel from './pages/admin/ProjectPanel';

// Client Layout Wrap
const ClientLayout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <header style={{
        height: '70px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        backgroundColor: 'var(--bg-secondary)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <Link to="/" style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700 }}>
            HIMALIX LABS
          </Link>
          <nav style={{ display: 'flex', gap: '24px', fontSize: '14px', fontWeight: 500 }}>
            <Link to="/">Home</Link>
            <Link to="/store">Store</Link>
            {user && <Link to="/wallet">Wallet</Link>}
            {user && user.role === 'admin' && <Link to="/admin/portfolio" style={{ color: 'var(--accent-gold)' }}>Admin Panel</Link>}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Theme Switcher Button */}
          <button 
            onClick={toggleTheme} 
            className="btn-secondary" 
            style={{ padding: '8px 12px', border: '1px solid var(--border-color)' }}
            title="Toggle theme"
          >
            <i className={`fa-light fa-sharp ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
          </button>

          {/* Shopping Cart Button */}
          <Link to="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-light fa-sharp fa-shopping-cart" style={{ fontSize: '18px' }}></i>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              backgroundColor: 'var(--accent-gold)',
              color: '#0a0a0a',
              padding: '2px 6px',
              fontWeight: 600
            }}>
              {getCartCount()}
            </span>
          </Link>

          {/* Authentication State */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Rs. {user.wallet_balance?.toFixed(2) || '0.00'}
              </span>
              <button 
                className="btn-secondary" 
                onClick={handleLogout}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/signin" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center' }}>
                Sign In
              </Link>
              <Link to="/signup" style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: 'var(--accent-gold)', color: '#0a0a0a', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                Register
              </Link>
            </div>
          )}
        </div>
      </header>

      <main style={{ flexGrow: 1 }}>
        {children}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '40px 0',
        backgroundColor: 'var(--bg-secondary)',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        textAlign: 'center'
      }}>
        <div className="container">
          <p>© {new Date().getFullYear()} Himalix Labs & Store. Zero Border-Radius Refactoring Peak Security Version.</p>
        </div>
      </footer>
    </>
  );
};

const AppContent = () => {
  return (
    <Routes>
      {/* Client Facing Routes */}
      <Route path="/" element={<ClientLayout><Landing /></ClientLayout>} />
      <Route path="/signin" element={<ClientLayout><Signin /></ClientLayout>} />
      <Route path="/signup" element={<ClientLayout><Signup /></ClientLayout>} />
      <Route path="/store" element={<ClientLayout><Catalog /></ClientLayout>} />
      <Route path="/store/product/:id" element={<ClientLayout><ProductDetail /></ClientLayout>} />

      {/* Private Customer Routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/cart" element={<ClientLayout><CartView /></ClientLayout>} />
        <Route path="/checkout" element={<ClientLayout><CheckoutView /></ClientLayout>} />
        <Route path="/wallet" element={<ClientLayout><WalletView /></ClientLayout>} />
      </Route>

      {/* Restricted Admin Routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/portfolio" replace />} />
          <Route path="portfolio" element={<PortfolioPanel />} />
          <Route path="store" element={<StorePanel />} />
          <Route path="3d" element={<ThreeDPanel />} />
          <Route path="web" element={<WebPanel />} />
          <Route path="project" element={<ProjectPanel />} />
        </Route>
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
