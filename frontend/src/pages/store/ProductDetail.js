import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProductDetails = async () => {
    try {
      const res = await fetch(`/api/store/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
      }
    } catch (err) {
      console.error('Failed to query product info:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/store/reviews/${id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Failed to query reviews catalog:', err);
    }
  };

  useEffect(() => {
    fetchProductDetails();
    fetchReviews();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addToCart(product, quantity);
    } catch (err) {
      alert('Cart insertion failed: ' + err.message);
    } finally {
      setTimeout(() => setAdding(false), 500);
    }
  };

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!token) return;

    setReviewError('');
    setReviewSuccess('');
    setSubmittingReview(true);

    try {
      const res = await fetch(`/api/store/reviews/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      const data = await res.json();

      if (res.ok) {
        setReviewSuccess(data.message || 'Review submitted successfully.');
        setComment('');
        setRating(5);
        fetchReviews();
      } else {
        setReviewError(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      setReviewError('API gateway connection failure.');
    } finally {
      setSubmittingReview(false);
    }
  };

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
        <i className="fa-light fa-sharp fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Retrieving specifications...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container store-container" style={{ textAlign: 'center' }}>
        <h2>Product Not Found</h2>
        <p style={{ margin: '20px 0', color: 'var(--text-secondary)' }}>The requested hardware part was not found in our catalogs.</p>
        <Link to="/store" className="btn">Return to Storefront</Link>
      </div>
    );
  }

  // Stock status text labels
  let stockLabel = 'In Stock';
  let stockClass = 'in-stock';
  if (product.stock_type === 'outsourced') {
    stockLabel = `Available (Outsourced: ETA ${product.outsource_days} days)`;
    stockClass = 'outsourced';
  } else if (product.stock_type === 'in_stock' && product.stock_quantity === 0) {
    stockLabel = 'Out of Stock / Sold Out';
    stockClass = 'out-of-stock';
  } else if (product.stock_type === 'in_stock') {
    stockLabel = `${product.stock_quantity} Units In Stock`;
    stockClass = 'in-stock';
  }

  return (
    <div className="container store-container">
      <div style={{ marginBottom: '24px' }}>
        <Link to="/store" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <i className="fa-light fa-sharp fa-arrow-left"></i> Back to Catalog
        </Link>
      </div>

      <div className="product-detail-layout">
        {/* Gallery Section */}
        <div className="product-gallery">
          <div className="main-image-preview">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} />
            ) : (
              <i className="fa-light fa-sharp fa-microchip" style={{ fontSize: '120px', color: 'var(--border-color)' }}></i>
            )}
          </div>
        </div>

        {/* Info panel section */}
        <div className="product-info-panel">
          <span className="product-card-category">{product.category}</span>
          <h2>{product.name}</h2>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            SKU: {product.sku}
          </div>

          <div className={`stock-status ${stockClass}`}>
            <i className={`fa-light fa-sharp ${product.stock_type === 'in_stock' && product.stock_quantity === 0 ? 'fa-times-circle' : 'fa-check-circle'}`}></i>
            <span>{stockLabel}</span>
          </div>

          <div className="price">
            Rs. {parseFloat(product.price).toFixed(2)}
          </div>

          <div className="product-description">
            {product.description || 'No detailed descriptive narrative is currently logged for this hardware parameter.'}
          </div>

          {/* Action triggers */}
          <div className="purchase-actions">
            <div className="quantity-picker">
              <button 
                type="button" 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={product.stock_type === 'in_stock' && product.stock_quantity === 0}
              >
                <i className="fa-light fa-sharp fa-minus"></i>
              </button>
              <input
                type="text"
                value={quantity}
                readOnly
                disabled={product.stock_type === 'in_stock' && product.stock_quantity === 0}
              />
              <button 
                type="button" 
                onClick={() => setQuantity(q => q + 1)}
                disabled={product.stock_type === 'in_stock' && product.stock_quantity === 0}
              >
                <i className="fa-light fa-sharp fa-plus"></i>
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding || (product.stock_type === 'in_stock' && product.stock_quantity === 0)}
              style={{ flexGrow: 1 }}
            >
              {adding ? (
                <i className="fa-light fa-sharp fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i className="fa-light fa-sharp fa-shopping-cart"></i> Add to Procurement Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Technical Spec sheet Grid */}
      {product.technical_specs && Object.keys(product.technical_specs).length > 0 && (
        <div className="specs-list">
          <h3>Technical Specifications</h3>
          <div className="specs-grid" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px' }}>
            {Object.entries(product.technical_specs).map(([key, val]) => (
              <React.Fragment key={key}>
                <div className="spec-name">{key}</div>
                <div className="spec-value">{val}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Outlets */}
      <div className="reviews-section">
        <h2>Customer Reviews</h2>

        {/* Review form submissions */}
        {token ? (
          <form onSubmit={handlePostReview} className="review-post-form">
            <h4 style={{ fontFamily: 'var(--font-serif)', marginBottom: '16px' }}>Submit Review</h4>

            {reviewSuccess && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', fontSize: '13px', marginBottom: '20px' }}>
                {reviewSuccess}
              </div>
            )}
            {reviewError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', fontSize: '13px', marginBottom: '20px' }}>
                {reviewError}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                RATING (1-5 STARS)
              </label>
              <select 
                style={{ width: '120px' }} 
                value={rating} 
                onChange={(e) => setRating(parseInt(e.target.value))}
                disabled={submittingReview}
              >
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                COMMENT
              </label>
              <textarea
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experiences with this component specs..."
                disabled={submittingReview}
                style={{ resize: 'none' }}
              />
            </div>

            <button type="submit" disabled={submittingReview} style={{ fontSize: '13px', padding: '10px 20px' }}>
              {submittingReview ? 'Submitting...' : 'Post Review'}
            </button>
          </form>
        ) : (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '40px',
            fontSize: '14px'
          }}>
            Please <Link to="/signin" style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>sign in</Link> to post reviews.
          </div>
        )}

        {/* Reviews Listings */}
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No reviews have been posted for this catalog item yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reviews.map((rev) => (
              <div key={rev.id} className="review-item">
                <div className="review-meta">
                  <span style={{ fontWeight: 600 }}>{rev.email}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="review-stars" style={{ marginBottom: '12px' }}>
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <i key={idx} className="fa-light fa-sharp fa-star"></i>
                  ))}
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
