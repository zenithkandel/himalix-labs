import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const CartView = () => {
  const {
    cartItems,
    loading,
    updateCartQuantity,
    removeFromCart,
    getSubtotal
  } = useCart();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '60vh',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-secondary)'
      }}>
        <i className="fa-light fa-sharp fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Syncing cart inventory...
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container store-container" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <i className="fa-light fa-sharp fa-shopping-basket" style={{ fontSize: '64px', color: 'var(--border-color)' }}></i>
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)' }}>Your Cart is Empty</h2>
        <p style={{ margin: '20px 0', color: 'var(--text-secondary)', fontSize: '15px' }}>
          Explore our component catalog to add hardware parts to your order.
        </p>
        <Link to="/store" className="btn">Browse Storefront</Link>
      </div>
    );
  }

  const subtotal = getSubtotal();

  return (
    <div className="container store-container">
      <div className="store-header">
        <h1>Your Shopping Cart</h1>
      </div>

      <div className="cart-table-wrapper">
        <table className="cart-table">
          <thead>
            <tr>
              <th>Product Details</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th>Total</th>
              <th style={{ width: '80px' }}></th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item) => (
              <tr key={item.cart_item_id}>
                <td>
                  <div className="cart-product">
                    {item.image_url ? (
                      <img src={item.image_url} className="cart-product-img" alt={item.name} />
                    ) : (
                      <div className="cart-product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
                        <i className="fa-light fa-sharp fa-microchip" style={{ color: 'var(--text-secondary)' }}></i>
                      </div>
                    )}
                    <div>
                      <h4 className="cart-product-title">
                        <Link to={`/store/product/${item.product_id}`}>{item.name}</Link>
                      </h4>
                      <span className="cart-product-sku">SKU: {item.sku}</span>
                    </div>
                  </div>
                </td>
                <td className="cart-price">Rs. {parseFloat(item.price).toFixed(2)}</td>
                <td>
                  <div className="quantity-picker" style={{ maxWidth: '120px' }}>
                    <button 
                      type="button" 
                      onClick={() => updateCartQuantity(item.cart_item_id, item.quantity - 1)}
                    >
                      <i className="fa-light fa-sharp fa-minus"></i>
                    </button>
                    <input 
                      type="text" 
                      value={item.quantity} 
                      readOnly 
                    />
                    <button 
                      type="button" 
                      onClick={() => updateCartQuantity(item.cart_item_id, item.quantity + 1)}
                    >
                      <i className="fa-light fa-sharp fa-plus"></i>
                    </button>
                  </div>
                </td>
                <td className="cart-price" style={{ fontWeight: 600 }}>
                  Rs. {(parseFloat(item.price) * item.quantity).toFixed(2)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    onClick={() => removeFromCart(item.cart_item_id)} 
                    className="btn-secondary" 
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', color: '#ef4444' }}
                    title="Remove item"
                  >
                    <i className="fa-light fa-sharp fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cart-total-section">
        <div>
          <Link to="/store" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-light fa-sharp fa-arrow-left"></i> Continue Shopping
          </Link>
        </div>
        
        <div className="cart-summary-card">
          <h3>Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            * Taxes, shipping charges, and ETAs are calculated during checkout based on recipient location coordinates.
          </div>
          <Link 
            to="/checkout" 
            className="btn" 
            style={{ width: '100%', display: 'inline-flex', justifyContent: 'center', backgroundColor: 'var(--accent-gold)', color: '#0a0a0a' }}
          >
            Proceed to Checkout <i className="fa-light fa-sharp fa-arrow-right" style={{ marginLeft: '8px' }}></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartView;
