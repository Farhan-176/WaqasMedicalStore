import React, { useState } from 'react';
import { Pill, AlertCircle, Snowflake, Plus, Check, Store } from 'lucide-react';

export default function ProductCard({ product, onAddToCart, isRetailer = false }) {
  const [selectedPackaging, setSelectedPackaging] = useState('pack'); // 'pack' or 'strip'

  // Determine packaging mode ('both', 'pack', 'strip')
  const mode = product.packagingMode || (product.hasStripOption ? 'both' : 'pack');
  const stripsPerPack = Math.max(1, product.stripsPerPack || 10);
  
  // Dual-Tier Pricing Logic:
  // Logged-in Retailers get wholesale trade price (product.price)
  // Public Consumers get standard Consumer MRP (product.originalPrice || product.price)
  const consumerPackPrice = product.originalPrice || product.price || 100;
  const wholesalePackPrice = product.price || consumerPackPrice;

  const packPrice = isRetailer ? wholesalePackPrice : consumerPackPrice;
  const stripPrice = isRetailer 
    ? (product.stripPrice || Math.round((wholesalePackPrice / stripsPerPack) * 100) / 100)
    : Math.round((consumerPackPrice / stripsPerPack) * 100) / 100;

  // Active price based on selection or forced mode
  const effectivePackaging = mode === 'strip' ? 'strip' : (mode === 'pack' ? 'pack' : selectedPackaging);
  const activePrice = effectivePackaging === 'strip' ? stripPrice : packPrice;

  // Strikethrough Reference (Wholesale shows MRP strikethrough to highlight savings)
  const discountPercent = product.discountPercent || 0;
  const mrpReference = product.originalPrice;

  const handleAdd = () => {
    const itemToAdd = {
      ...product,
      id: effectivePackaging === 'strip' ? `${product.id}_strip` : product.id,
      name: effectivePackaging === 'strip' ? `${product.name} (Per Strip)` : `${product.name} (Per Pack)`,
      unit: effectivePackaging === 'strip' ? 'Per Strip' : 'Per Pack',
      price: activePrice,
      isWholesale: isRetailer
    };
    onAddToCart(itemToAdd);
  };

  return (
    <div className={`product-card ${isRetailer ? 'product-card-retailer' : ''}`}>
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
        
        {/* Tier Pricing Badge */}
        {isRetailer ? (
          <span className="badge badge-retailer-wholesale">
            <Store size={11} /> Wholesale Trade ({discountPercent}% OFF)
          </span>
        ) : (
          <span className="badge badge-retail-price">
            Standard Retail MRP
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
        <div className="card-top-category-row">
          <span className="category-tag">{product.category ? product.category.replace('-', ' ') : 'Medicine'}</span>
          {isRetailer && <span className="b2b-pill-tag">B2B Trade Rate</span>}
        </div>

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
            {isRetailer && mrpReference && mrpReference > activePrice && (
              <span className="original-mrp-strikethrough">
                MRP: Rs. {mrpReference.toFixed(2)}
              </span>
            )}
            {!isRetailer && (
              <span className="price-type-label">Retail Price</span>
            )}
          </div>

          <button className={`add-btn ${isRetailer ? 'add-btn-retailer' : ''}`} onClick={handleAdd}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
