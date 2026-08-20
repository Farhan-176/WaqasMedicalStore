import React, { useState } from 'react';
import { Pill, AlertCircle, Snowflake, Plus, Check } from 'lucide-react';

export default function ProductCard({ product, onAddToCart }) {
  const [selectedPackaging, setSelectedPackaging] = useState('pack'); // 'pack' or 'strip'

  // Determine packaging mode ('both', 'pack', 'strip')
  const mode = product.packagingMode || (product.hasStripOption ? 'both' : 'pack');
  const stripsPerPack = Math.max(1, product.stripsPerPack || 10);
  
  const packPrice = product.price;
  const stripPrice = product.stripPrice || Math.round((packPrice / stripsPerPack) * 100) / 100;

  // Active price based on selection or forced mode
  const effectivePackaging = mode === 'strip' ? 'strip' : (mode === 'pack' ? 'pack' : selectedPackaging);
  const activePrice = effectivePackaging === 'strip' ? stripPrice : packPrice;

  // Strikethrough Original Price Calculation
  const discountPercent = product.discountPercent || 0;
  const originalPrice = product.originalPrice || (discountPercent > 0 ? Math.round((activePrice / (1 - discountPercent / 100)) * 100) / 100 : null);

  const handleAdd = () => {
    const itemToAdd = {
      ...product,
      id: effectivePackaging === 'strip' ? `${product.id}_strip` : product.id,
      name: effectivePackaging === 'strip' ? `${product.name} (Per Strip)` : `${product.name} (Per Pack)`,
      unit: effectivePackaging === 'strip' ? 'Per Strip' : 'Per Pack',
      price: activePrice
    };
    onAddToCart(itemToAdd);
  };

  return (
    <div className="product-card">
      {/* Product Image & Badges */}
      <div className="image-wrapper">
        <img 
          src={product.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80"} 
          alt={product.name} 
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80";
          }}
        />
        
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="badge badge-discount">
            {discountPercent}% OFF
          </span>
        )}

        {/* Prescription Required Badge */}
        {product.requiresPrescription && (
          <span className="badge badge-rx">
            <AlertCircle size={12} /> Rx Required
          </span>
        )}

        {/* Cold Storage Badge */}
        {product.coldStorage && (
          <span className="badge badge-cold">
            <Snowflake size={12} /> Keep Cold
          </span>
        )}

        {/* Stock Status Pill */}
        <span className={`stock-pill ${product.stock < 10 ? 'low-stock' : 'in-stock'}`}>
          {product.stock < 10 ? `Only ${product.stock} left` : 'In Stock'}
        </span>
      </div>

      {/* Product Details */}
      <div className="product-details">
        <span className="category-tag">{product.category ? product.category.replace('-', ' ') : 'Medicine'}</span>
        <h3 className="product-title">{product.name}</h3>
        <p className="generic-name">Formula: <span>{product.genericName}</span></p>

        {/* Packaging Selection Radio Options (Per Pack / Per Strip) */}
        {mode === 'both' && (
          <div className="packaging-selector-group">
            <label 
              className={`packaging-radio-option ${effectivePackaging === 'pack' ? 'selected' : ''}`}
              onClick={() => setSelectedPackaging('pack')}
            >
              <span className="radio-dot">{effectivePackaging === 'pack' && <span className="radio-inner" />}</span>
              <span className="packaging-label">Per Pack</span>
            </label>

            <label 
              className={`packaging-radio-option ${effectivePackaging === 'strip' ? 'selected' : ''}`}
              onClick={() => setSelectedPackaging('strip')}
            >
              <span className="radio-dot">{effectivePackaging === 'strip' && <span className="radio-inner" />}</span>
              <span className="packaging-label">Per Strip ({stripsPerPack}/pack)</span>
            </label>
          </div>
        )}

        {mode === 'strip' && (
          <div className="single-unit-badge">
            <span className="unit-dot">🟢</span> Per Strip Only ({stripsPerPack}/pack)
          </div>
        )}

        {mode === 'pack' && (
          <div className="single-unit-badge">
            <span className="unit-dot">🟢</span> Per Full Pack Only
          </div>
        )}

        {/* Price & Add to Cart Action */}
        <div className="card-footer">
          <div className="price-block-container">
            <div className="price-main">
              <span className="currency">Rs.</span>
              <span className="amount">{activePrice.toFixed(2)}</span>
            </div>
            {originalPrice && originalPrice > activePrice && (
              <span className="original-mrp-strikethrough">
                Rs. {originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <button className="add-btn" onClick={handleAdd}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
