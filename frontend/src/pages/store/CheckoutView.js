import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const CheckoutView = () => {
  const { user, refreshUser, token } = useAuth();
  const { cartItems, getSubtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [receivingLocation, setReceivingLocation] = useState('27.7172, 85.3240'); // default coordinates inside Kathmandu valley
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');

  // Config metrics
  const [config, setConfig] = useState({
    salesTaxRate: 13,
    deliveryPerKmRate: 15,
    deliveryMinCharge: 50,
    deliveryFreeThreshold: 2000
  });

  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Fetch configs
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/auth/config');
        if (res.ok) {
          const data = await res.json();
          setConfig(prev => ({
            ...prev,
            salesTaxRate: data.salesTaxRate !== undefined ? data.salesTaxRate : prev.salesTaxRate,
            deliveryPerKmRate: data.deliveryPerKmRate !== undefined ? data.deliveryPerKmRate : prev.deliveryPerKmRate,
            deliveryMinCharge: data.deliveryMinCharge !== undefined ? data.deliveryMinCharge : prev.deliveryMinCharge,
            deliveryFreeThreshold: data.deliveryFreeThreshold !== undefined ? data.deliveryFreeThreshold : prev.deliveryFreeThreshold
          }));
        }
      } catch (err) {
        console.error('Failed to retrieve checkout configs:', err);
      }
    };
    fetchConfig();
  }, []);

  // Distance & Charge Calculations (Haversine Formula)
  const calculateFees = () => {
    const subtotal = getSubtotal();
    let distanceKm = 0;
    let shippingFee = 0;

    try {
      const parts = receivingLocation.split(',').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const lat1 = (27.7029 * Math.PI) / 180; // Kathmandu HQ Lat
        const lon1 = (85.3072 * Math.PI) / 180; // Kathmandu HQ Lon
        const lat2 = (parts[0] * Math.PI) / 180;
        const lon2 = (parts[1] * Math.PI) / 180;

        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2)**2;
        const d = 2 * 6371 * Math.asin(Math.sqrt(a));
        distanceKm = d;
      }
    } catch (e) {
      console.warn('Coordinates invalid format:', e.message);
    }

    if (subtotal < config.deliveryFreeThreshold) {
      shippingFee = Math.max(config.deliveryMinCharge, distanceKm * config.deliveryPerKmRate);
    }

    const salesTax = subtotal * (config.salesTaxRate / 100);
    const totalAmount = subtotal + salesTax + shippingFee;

    return {
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      shippingFee: parseFloat(shippingFee.toFixed(2)),
      salesTax: parseFloat(salesTax.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2))
    };
  };

  const fees = calculateFees();

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (!fullName || !email || !phone || !receivingLocation) {
      setCheckoutError('Please populate all required fields.');
      return;
    }

    // Balance checks
    if (paymentMethod === 'store_credit' && user?.wallet_balance < fees.totalAmount) {
      setCheckoutError('Insufficient wallet balance to perform credit checkout.');
      return;
    }

    setCheckoutSubmitting(true);
    setCheckoutError('');
    setOrderSuccess(null);

    const payload = {
      shippingDetails: {
        fullName,
        email,
        phone,
        province,
        district,
        city,
        receivingLocation
      },
      paymentMethod
    };

    try {
      const res = await fetch('/api/store/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setOrderSuccess(data);
        clearCart();
        refreshUser();
      } else {
        setCheckoutError(data.error || 'Checkout transaction failed.');
      }
    } catch (err) {
      setCheckoutError('API Gateway offline. Failed to write order details.');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className="container store-container" style={{ textAlign: 'center' }}>
        <h2>Checkout Unavailable</h2>
        <p style={{ margin: '20px 0', color: 'var(--text-secondary)' }}>No items in cart to checkout.</p>
        <Link to="/store" className="btn">Return to Storefront</Link>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="container store-container" style={{ maxWidth: '600px', textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <i className="fa-light fa-sharp fa-check-circle" style={{ fontSize: '72px', color: '#10b981' }}></i>
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', marginBottom: '16px' }}>Order Placed!</h2>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Thank you for your purchase. Your order details have been registered. An invoice email was dispatched.
        </p>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          padding: '24px',
          textAlign: 'left',
          marginBottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>TRACKING CODE</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--accent-gold)' }}>
              {orderSuccess.trackingCode}
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span>Total Amount Paid</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Rs. {orderSuccess.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link to="/store" className="btn">Back to Catalog</Link>
          <Link to="/wallet" className="btn btn-secondary">Check Wallet Ledger</Link>
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();

  return (
    <div className="container store-container">
      <div className="store-header">
        <h1>Order Checkout</h1>
      </div>

      {checkoutError && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          color: '#ef4444',
          padding: '16px',
          fontSize: '14px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <i className="fa-light fa-sharp fa-exclamation-triangle"></i>
          <span>{checkoutError}</span>
        </div>
      )}

      <div className="checkout-grid">
        {/* Shipping Form Panel */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '40px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', marginBottom: '24px' }}>Shipping Information</h3>
          <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Recipient Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" required disabled={checkoutSubmitting} />
              </div>
              <div className="admin-form-group">
                <label>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required disabled={checkoutSubmitting} />
              </div>
              <div className="admin-form-group">
                <label>Phone Contact</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" required disabled={checkoutSubmitting} />
              </div>
              <div className="admin-form-group">
                <label>Province</label>
                <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="e.g. Bagmati" disabled={checkoutSubmitting} />
              </div>
              <div className="admin-form-group">
                <label>District</label>
                <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Kathmandu" disabled={checkoutSubmitting} />
              </div>
              <div className="admin-form-group">
                <label>City / Town</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lalitpur" disabled={checkoutSubmitting} />
              </div>
              <div className="admin-form-group full-width">
                <label>Geographic Coordinates (GPS Lat, Lng)</label>
                <input 
                  type="text" 
                  value={receivingLocation} 
                  onChange={(e) => setReceivingLocation(e.target.value)} 
                  placeholder="e.g. 27.7172, 85.3240" 
                  required 
                  disabled={checkoutSubmitting}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Used to automatically compute delivery distance in Km from Kathmandu HQ (27.7029, 85.3072).
                </span>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Payment Method Selection
              </label>
              <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="radio"
                    name="payment"
                    value="cash_on_delivery"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={() => setPaymentMethod('cash_on_delivery')}
                    disabled={checkoutSubmitting}
                    style={{ width: 'auto' }}
                  />
                  <span>Cash on Delivery (COD)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="radio"
                    name="payment"
                    value="store_credit"
                    checked={paymentMethod === 'store_credit'}
                    onChange={() => setPaymentMethod('store_credit')}
                    disabled={checkoutSubmitting}
                    style={{ width: 'auto' }}
                  />
                  <span>
                    Deduct Store Credit Balance (Available: <b>Rs. {user?.wallet_balance?.toFixed(2) || '0.00'}</b>)
                  </span>
                </label>
              </div>
            </div>

            <button type="submit" disabled={checkoutSubmitting} style={{ marginTop: '20px' }}>
              {checkoutSubmitting ? 'Processing Transaction...' : 'Place Order & Complete Checkout'}
            </button>
          </form>
        </div>

        {/* Totals Summary panel */}
        <div className="cart-summary-card" style={{ height: 'fit-content' }}>
          <h3>Order Items</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', maxHeight: '240px', overflowY: 'auto', paddingRight: '8px' }}>
            {cartItems.map((item) => (
              <div key={item.cart_item_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Qty: {item.quantity} × Rs. {parseFloat(item.price).toFixed(2)}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)' }}>Rs. {(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', marginBottom: '16px' }} />

          <div className="summary-row">
            <span>Subtotal</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Estimated Delivery Distance</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{fees.distanceKm} Km</span>
          </div>
          <div className="summary-row">
            <span>Shipping & Delivery Fee</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {fees.shippingFee === 0 ? 'FREE' : `Rs. ${fees.shippingFee.toFixed(2)}`}
            </span>
          </div>
          <div className="summary-row">
            <span>Sales Tax (VAT {config.salesTaxRate}%)</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>Rs. {fees.salesTax.toFixed(2)}</span>
          </div>
          
          <div className="summary-row total">
            <span>Grand Total</span>
            <span>Rs. {fees.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutView;
