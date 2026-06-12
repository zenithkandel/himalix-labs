import React from 'react';
import { useParams } from 'react-router-dom';

const ProductDetail = () => {
  const { id } = useParams();
  return (
    <div className="container store-container">
      <h1>Product Specifications</h1>
      <p style={{ fontFamily: 'var(--font-mono)' }}>SKU Identifier: {id}</p>
    </div>
  );
};

export default ProductDetail;
