import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const Catalog = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [addingId, setAddingId] = useState(null);

  // Categories lists
  const categoriesList = [
    { value: '', label: 'All Categories' },
    { value: 'Microcontrollers', label: 'Microcontrollers' },
    { value: 'Sensors', label: 'Sensors' },
    { value: 'Development Boards', label: 'Dev Boards' },
    { value: 'Passives', label: 'Passives & Discrete' },
    { value: 'Connectors', label: 'Connectors' }
  ];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: 8
      });
      if (search) queryParams.append('search', search);
      if (category) queryParams.append('category', category);
      if (sort) queryParams.append('sort', sort);

      const res = await fetch(`/api/store/products?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setPagination({
          page: data.pagination.page,
          pages: data.pagination.pages
        });
      }
    } catch (err) {
      console.error('Failed to retrieve store products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, sort, pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const handleAddToCart = async (product, e) => {
    e.preventDefault(); // Prevents clicking card details navigation
    setAddingId(product.id);
    try {
      await addToCart(product, 1);
    } catch (err) {
      alert('Failed to add item: ' + err.message);
    } finally {
      setTimeout(() => setAddingId(null), 500);
    }
  };

  return (
    <div className="container store-container">
      <div className="store-header">
        <div>
          <h1>Electronic Components</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Procure verified hardware and parts from global and local warehouses.
          </p>
        </div>
      </div>

      {/* Control filters bar */}
      <div className="store-controls">
        <form onSubmit={handleSearchSubmit} className="store-search-wrapper">
          <i className="fa-light fa-sharp fa-search"></i>
          <input
            type="text"
            className="store-search-input"
            placeholder="Search by part name, SKU, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <select
          className="store-select"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        >
          {categoriesList.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>

        <select
          className="store-select"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        >
          <option value="">Sort: Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {loading ? (
        <div style={{
          display: 'flex',
          height: '40vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)'
        }}>
          <i className="fa-light fa-sharp fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Retrieving catalog catalog...
        </div>
      ) : products.length === 0 ? (
        <div style={{
          padding: '60px',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <i className="fa-light fa-sharp fa-box-open" style={{ fontSize: '40px', marginBottom: '16px', color: 'var(--border-color)' }}></i>
          <p>No components matched your search terms or catalog categories.</p>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {products.map(prod => (
              <Link to={`/store/product/${prod.id}`} key={prod.id} className="product-card">
                <div className="product-card-image">
                  {prod.image_url ? (
                    <img src={prod.image_url} alt={prod.name} />
                  ) : (
                    <i className="fa-light fa-sharp fa-microchip" style={{ fontSize: '48px', color: 'var(--border-color)' }}></i>
                  )}
                  {prod.stock_type === 'outsourced' && (
                    <span className="product-tag">Outsource</span>
                  )}
                  {prod.stock_type === 'in_stock' && prod.stock_quantity === 0 && (
                    <span className="product-tag" style={{ borderColor: '#ef4444', color: '#ef4444' }}>Sold Out</span>
                  )}
                </div>
                <div className="product-card-content">
                  <span className="product-card-category">{prod.category}</span>
                  <h3 className="product-card-title">{prod.name}</h3>
                  <span className="product-card-sku">SKU: {prod.sku}</span>
                  <div className="product-card-footer">
                    <span className="product-card-price">Rs. {parseFloat(prod.price).toFixed(2)}</span>
                    <button
                      disabled={prod.stock_type === 'in_stock' && prod.stock_quantity === 0}
                      onClick={(e) => handleAddToCart(prod, e)}
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                    >
                      {addingId === prod.id ? (
                        <i className="fa-light fa-sharp fa-spinner fa-spin"></i>
                      ) : (
                        <>
                          <i className="fa-light fa-sharp fa-cart-plus"></i> Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              marginTop: '40px'
            }}>
              <button
                className="btn-secondary"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                style={{ padding: '8px 16px' }}
              >
                Previous
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="btn-secondary"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                style={{ padding: '8px 16px' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Catalog;
