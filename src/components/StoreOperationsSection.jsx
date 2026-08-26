import React, { useState, useEffect } from 'react';
import { 
  Table, Edit3, Save, AlertTriangle, ShoppingCart, Plus, Upload, 
  Percent, FileSpreadsheet, AlertCircle, ShieldAlert, Truck, DollarSign, Check
} from 'lucide-react';
import { INITIAL_EXPIRY_BATCHES, SUPPLIERS } from '../storeOpsData';

export default function StoreOperationsSection({ catalog, onUpdateCatalog }) {
  const [activeOpsTab, setActiveOpsTab] = useState('quick-edit'); // 'quick-edit', 'pos-lite', 'expiry-alerts', 'bulk-price', 'suppliers'
  
  // Local catalog copy for inline table edit (Full Store Catalog)
  const [editableProducts, setEditableProducts] = useState(catalog);

  useEffect(() => {
    setEditableProducts(catalog);
  }, [catalog]);

  const [opsSearchQuery, setOpsSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [editingTitleId, setEditingTitleId] = useState(null);

  const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  // Custom Categories & Category Creation State
  const [customCategories, setCustomCategories] = useState(['medicines', 'hygiene', 'baby-care', 'surgical', 'supplements', 'skincare']);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Dynamically compute all unique categories from catalog + custom list
  const allCategories = React.useMemo(() => {
    const catSet = new Set([...customCategories]);
    (editableProducts || []).forEach(p => {
      if (p.category) catSet.add(p.category.toLowerCase().trim());
    });
    return Array.from(catSet);
  }, [customCategories, editableProducts]);

  const handleCreateCategory = (e) => {
    e.preventDefault();
    const clean = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!clean) return;
    if (!customCategories.includes(clean)) {
      setCustomCategories(prev => [...prev, clean]);
    }
    setNewCategoryName('');
    setIsAddCategoryModalOpen(false);
    setSaveSuccessMsg(`✅ Category "${clean.toUpperCase()}" created successfully!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Handle Inline Name & Category Quick-Edit
  const handleNameChange = (id, newName) => {
    setEditableProducts(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleCategoryChange = (id, newCategory) => {
    setEditableProducts(prev => prev.map(p => p.id === id ? { ...p, category: newCategory } : p));
  };

  // Bulk Pricing State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [adjustmentPercent, setAdjustmentPercent] = useState(5);
  const [adjustmentType, setAdjustmentType] = useState('increase'); // 'increase' or 'decrease'

  // POS Lite State
  const [posCart, setPosCart] = useState([]);
  const [posPaymentMethod, setPosPaymentMethod] = useState('cash');
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [posCategoryFilter, setPosCategoryFilter] = useState('ALL');

  // Single Item Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    code: '', name: '', genericName: '', price: '', stock: '50', category: 'medicines', packagingMode: 'both', stripsPerPack: '10', requiresPrescription: false, image: ''
  });

  const generateAutoCode = () => {
    const numericCodes = editableProducts
      .map(p => parseInt(p.code))
      .filter(n => !isNaN(n));
    const maxCode = numericCodes.length > 0 ? Math.max(...numericCodes) : 628;
    const nextNum = maxCode + 1;
    return nextNum < 1000 ? `0${nextNum}` : `${nextNum}`;
  };

  const handleOpenAddModal = () => {
    const autoCode = generateAutoCode();
    setNewItem({
      code: autoCode,
      name: '',
      genericName: '',
      price: '',
      stock: '50',
      category: 'medicines',
      packagingMode: 'both',
      stripsPerPack: '10',
      requiresPrescription: false,
      image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&q=80'
    });
    setIsAddModalOpen(true);
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNewItem = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.price) {
      alert('Please enter product title and trade price!');
      return;
    }

    const priceNum = parseFloat(newItem.price) || 0;
    const stripsNum = Math.max(1, parseInt(newItem.stripsPerPack) || 10);
    const mode = newItem.packagingMode || 'both';

    const createdProduct = {
      id: `offer_m_add_${Date.now()}`,
      code: newItem.code || generateAutoCode(),
      name: newItem.name.trim(),
      genericName: newItem.genericName.trim() || newItem.name.trim(),
      category: newItem.category,
      price: priceNum,
      originalPrice: priceNum ? Math.round(priceNum * 1.15 * 100) / 100 : null,
      discountPercent: 15,
      packagingMode: mode,
      stripsPerPack: stripsNum,
      hasStripOption: mode === 'both' || mode === 'strip',
      stripPrice: (mode === 'both' || mode === 'strip') ? Math.round((priceNum / stripsNum) * 100) / 100 : null,
      unit: mode === 'pack' ? 'Per Pack' : 'Pack / Strip',
      stock: parseInt(newItem.stock) || 30,
      requiresPrescription: newItem.requiresPrescription,
      coldStorage: newItem.name.toUpperCase().includes('INJ'),
      showOnMainScreen: true,
      image: newItem.image || 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&q=80'
    };

    // Save newly created product to MongoDB Atlas Cloud Database
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdProduct)
      });
    } catch (err) {
      console.warn('⚠️ Server offline, saved to local state fallback:', err.message);
    }

    const updatedCatalog = [createdProduct, ...editableProducts];
    setEditableProducts(updatedCatalog);
    onUpdateCatalog(updatedCatalog);
    setIsAddModalOpen(false);
    setSaveSuccessMsg(`✅ Added "${createdProduct.name}" (Code: ${createdProduct.code}) to catalog & MongoDB Atlas!`);
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  // Handle Inline Quick-Edit
  const handlePriceChange = (id, newPrice) => {
    setEditableProducts(prev => prev.map(p => p.id === id ? { ...p, price: parseFloat(newPrice) || 0 } : p));
  };

  const handlePackagingModeChange = (id, newMode) => {
    setEditableProducts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          packagingMode: newMode,
          hasStripOption: newMode === 'both' || newMode === 'strip'
        };
      }
      return p;
    }));
  };

  const handleStripsPerPackChange = (id, newStrips) => {
    const strips = Math.max(1, parseInt(newStrips) || 1);
    setEditableProducts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          stripsPerPack: strips,
          stripPrice: Math.round((p.price / strips) * 100) / 100
        };
      }
      return p;
    }));
  };

  const handleStockChange = (id, newStock) => {
    setEditableProducts(prev => prev.map(p => p.id === id ? { ...p, stock: parseInt(newStock) || 0 } : p));
  };

  const handleDiscountChange = (id, newDiscount) => {
    const disc = parseFloat(newDiscount) || 0;
    setEditableProducts(prev => prev.map(p => {
      if (p.id === id) {
        const orig = disc > 0 ? Math.round((p.price / (1 - disc / 100)) * 100) / 100 : null;
        return { ...p, discountPercent: disc, originalPrice: orig };
      }
      return p;
    }));
  };

  const handleToggleStorefrontVisibility = (id) => {
    setEditableProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          const currentVis = p.showOnMainScreen !== false;
          return { ...p, showOnMainScreen: !currentVis };
        }
        return p;
      });
      onUpdateCatalog(updated);
      return updated;
    });
  };

  const handleSaveQuickEdit = () => {
    onUpdateCatalog(editableProducts);
    setSaveSuccessMsg('✅ Rates & Stock updated instantly!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Bulk Category Adjustment
  const handleApplyBulkPricing = () => {
    const updated = editableProducts.map(p => {
      if (selectedCategory === 'all' || p.category === selectedCategory) {
        const factor = adjustmentType === 'increase' ? (1 + adjustmentPercent / 100) : (1 - adjustmentPercent / 100);
        return { ...p, price: Math.round(p.price * factor * 100) / 100 };
      }
      return p;
    });
    setEditableProducts(updated);
    onUpdateCatalog(updated);
    setSaveSuccessMsg(`✅ Applied ${adjustmentPercent}% ${adjustmentType} across ${selectedCategory}!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // POS Lite Quick Deduct
  const handlePosAddToCart = (product) => {
    setPosCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handlePosQuantityChange = (id, delta) => {
    setPosCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handlePosRemoveItem = (id) => {
    setPosCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCompletePosSale = () => {
    // Deduct stock
    const updated = editableProducts.map(p => {
      const posItem = posCart.find(i => i.id === p.id);
      if (posItem) {
        return { ...p, stock: Math.max(0, p.stock - posItem.quantity) };
      }
      return p;
    });
    setEditableProducts(updated);
    onUpdateCatalog(updated);
    alert(`Counter Sale Completed (${posPaymentMethod.toUpperCase()})! Physical inventory deducted.`);
    setPosCart([]);
  };

  const posSubtotal = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="store-ops-container">
      {/* Store Operations Header Tabs */}
      <div className="ops-header-tabs">
        <button 
          className={`ops-tab-btn ${activeOpsTab === 'quick-edit' ? 'active' : ''}`}
          onClick={() => setActiveOpsTab('quick-edit')}
        >
          <Table size={16} /> Quick-Edit Rate Table
        </button>

        <button 
          className={`ops-tab-btn ${activeOpsTab === 'pos-lite' ? 'active' : ''}`}
          onClick={() => setActiveOpsTab('pos-lite')}
        >
          <ShoppingCart size={16} /> POS Lite (Counter Sale)
        </button>

        <button 
          className={`ops-tab-btn ${activeOpsTab === 'expiry-alerts' ? 'active' : ''}`}
          onClick={() => setActiveOpsTab('expiry-alerts')}
        >
          <AlertTriangle size={16} /> Expiry & Batch Alerts
        </button>

        <button 
          className={`ops-tab-btn ${activeOpsTab === 'bulk-price' ? 'active' : ''}`}
          onClick={() => setActiveOpsTab('bulk-price')}
        >
          <Percent size={16} /> Bulk Category Pricing
        </button>

        <button 
          className={`ops-tab-btn ${activeOpsTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveOpsTab('suppliers')}
        >
          <Truck size={16} /> Supplier Directory
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="ops-success-banner">
          <Check size={16} /> {saveSuccessMsg}
        </div>
      )}

      {/* TAB 1: Quick-Edit Rate & Stock Table */}
      {activeOpsTab === 'quick-edit' && (() => {
        const filteredOpsProducts = editableProducts
          .filter(p => {
            const matchesLetter = selectedLetter === 'ALL' || p.name.trim().toUpperCase().startsWith(selectedLetter);
            const query = opsSearchQuery.toLowerCase();
            const matchesSearch = 
              p.name.toLowerCase().includes(query) ||
              (p.code && p.code.toLowerCase().includes(query)) ||
              (p.genericName && p.genericName.toLowerCase().includes(query));
            return matchesLetter && matchesSearch;
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        const totalPages = Math.ceil(filteredOpsProducts.length / itemsPerPage) || 1;
        const currentItems = filteredOpsProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        return (
          <div className="ops-card">
            <div className="ops-card-header">
              <div className="ops-header-title-block">
                <h3>
                  Full Store Product Catalog 
                  <span className="ops-count-pill">{filteredOpsProducts.length} Filtered / {editableProducts.length} Total</span>
                </h3>
                <p>Search by name/generic formula, or filter by starting letter (A-Z) to edit trade rates and stock.</p>
              </div>
              
              <div className="ops-toolbar-row">
                <div className="ops-search-box">
                  <input 
                    type="text" 
                    placeholder="Search catalog items..." 
                    value={opsSearchQuery}
                    onChange={(e) => { setOpsSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="ops-search-input"
                  />
                </div>
                <button className="btn-add-category" onClick={() => setIsAddCategoryModalOpen(true)}>
                  <Plus size={14} /> Add Category
                </button>
                <button className="btn-add-item" onClick={handleOpenAddModal}>
                  <Plus size={14} /> Add Single Item
                </button>
                <button className="btn-save-edit" onClick={handleSaveQuickEdit}>
                  <Save size={14} /> Save All Changes
                </button>
              </div>
            </div>

            {/* Alphabetical A-Z Letter Filter Bar */}
            <div className="alphabet-bar ops-alphabet-bar">
              <span className="alphabet-title">Browse by Letter (A-Z):</span>
              <div className="alphabet-pills">
                {ALPHABET.map(letter => (
                  <button
                    key={letter}
                    className={`alphabet-btn ${selectedLetter === letter ? 'active' : ''}`}
                    onClick={() => { setSelectedLetter(letter); setCurrentPage(1); }}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            <div className="ops-table-wrapper">
              <table className="admin-table ops-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Product Title</th>
                    <th>Category</th>
                    <th>Trade Price (Rs.)</th>
                    <th>Packaging Option</th>
                    <th>Discount %</th>
                    <th>Physical Stock</th>
                    <th>Rx Required</th>
                    <th>Show on Storefront</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(p => (
                    <tr key={p.id}>
                      <td><code>{p.code || 'N/A'}</code></td>
                      <td>
                        {editingTitleId === p.id ? (
                          <input 
                            type="text" 
                            className="inline-input title-input-active"
                            value={p.name}
                            onChange={(e) => handleNameChange(p.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Escape') setEditingTitleId(null);
                            }}
                            onBlur={() => setEditingTitleId(null)}
                            autoFocus
                            placeholder="Medicine Name..."
                          />
                        ) : (
                          <div 
                            className="title-display-box" 
                            onDoubleClick={() => setEditingTitleId(p.id)}
                            title="Double-click or click pencil icon to edit title"
                          >
                            <strong className="title-display-text">{p.name}</strong>
                            <button 
                              type="button" 
                              className="btn-title-edit-trigger" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTitleId(p.id);
                              }}
                              title="Edit title"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <select 
                          className="inline-select category-select"
                          value={(p.category || 'medicines').toLowerCase()}
                          onChange={(e) => handleCategoryChange(p.id, e.target.value)}
                          title="Select category"
                        >
                          {allCategories.map(cat => (
                            <option key={cat} value={cat}>
                              {cat.toUpperCase().replace('-', ' ')}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="inline-input price-input"
                          value={p.price}
                          onChange={(e) => handlePriceChange(p.id, e.target.value)}
                        />
                      </td>
                      <td>
                        <select 
                          className="inline-select packaging-select"
                          value={p.packagingMode || (p.hasStripOption ? 'both' : 'pack')}
                          onChange={(e) => handlePackagingModeChange(p.id, e.target.value)}
                        >
                          <option value="both">Both (Pack & Strip)</option>
                          <option value="pack">Only Per Pack</option>
                          <option value="strip">Only Per Strip</option>
                        </select>
                      </td>
                      <td>
                        <div className="discount-input-wrapper">
                          <input 
                            type="number" 
                            min="0" 
                            max="90"
                            className="inline-input discount-input"
                            value={p.discountPercent || 0}
                            onChange={(e) => handleDiscountChange(p.id, e.target.value)}
                          />
                          <span className="percent-symbol">%</span>
                        </div>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className={`inline-input stock-input ${p.stock < 10 ? 'low-stock-alert' : ''}`}
                          value={p.stock}
                          onChange={(e) => handleStockChange(p.id, e.target.value)}
                        />
                      </td>
                      <td>{p.requiresPrescription ? '⚠️ Yes' : 'No'}</td>
                      <td>
                        <div 
                          className={`radio-switch-wrapper ${p.showOnMainScreen !== false ? 'is-on' : 'is-off'}`}
                          onClick={() => handleToggleStorefrontVisibility(p.id)}
                          title={p.showOnMainScreen !== false ? 'Click to HIDE product from Customer Main Screen' : 'Click to SHOW product on Customer Main Screen'}
                        >
                          <div className="radio-switch-track">
                            <div className="radio-switch-knob"></div>
                          </div>
                          <span className="radio-switch-status">
                            {p.showOnMainScreen !== false ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button className="btn-row-save" onClick={handleSaveQuickEdit}>
                          Save Row
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Catalog Pagination Controls */}
            <div className="ops-pagination">
              <span>Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredOpsProducts.length)} of {filteredOpsProducts.length} items</span>
              <div className="pagination-buttons">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="btn-page"
                >
                  Prev
                </button>
                <span className="page-indicator">Page {currentPage} of {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="btn-page"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 2: POS Lite Counter Sale */}
      {activeOpsTab === 'pos-lite' && (() => {
        const filteredPosProducts = editableProducts.filter(p => {
          const catMatch = posCategoryFilter === 'ALL' || (p.category && p.category.toLowerCase() === posCategoryFilter.toLowerCase());
          const query = posSearchQuery.trim().toLowerCase();
          const searchMatch = !query || 
            p.name.toLowerCase().includes(query) ||
            (p.code && p.code.toLowerCase().includes(query)) ||
            (p.genericName && p.genericName.toLowerCase().includes(query));
          return catMatch && searchMatch;
        });

        const displayedPosProducts = filteredPosProducts.slice(0, 30);

        return (
          <div className="ops-card pos-lite-layout">
            <div className="pos-catalog-side">
              <div className="pos-header-bar">
                <div className="pos-header-title">
                  <h3>Counter Sale Quick Select ({filteredPosProducts.length} Available)</h3>
                  <p>Search any medicine across full store catalog or filter by category for quick billing.</p>
                </div>

                {/* Instant Search Bar */}
                <div className="pos-search-wrapper">
                  <input 
                    type="text" 
                    className="pos-search-input-field"
                    placeholder="🔍 Search medicine name, formula, or code..."
                    value={posSearchQuery}
                    onChange={(e) => setPosSearchQuery(e.target.value)}
                  />
                  {posSearchQuery && (
                    <button className="btn-clear-pos-search" onClick={() => setPosSearchQuery('')}>×</button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="pos-category-pills-bar">
                  <button 
                    className={`pos-cat-pill ${posCategoryFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setPosCategoryFilter('ALL')}
                  >
                    ALL ({editableProducts.length})
                  </button>
                  {allCategories.map(cat => (
                    <button 
                      key={cat}
                      className={`pos-cat-pill ${posCategoryFilter === cat ? 'active' : ''}`}
                      onClick={() => setPosCategoryFilter(cat)}
                    >
                      {cat.toUpperCase().replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              <div className="pos-search-grid">
                {displayedPosProducts.length > 0 ? (
                  displayedPosProducts.map(p => (
                    <div key={p.id} className="pos-item-card" onClick={() => handlePosAddToCart(p)}>
                      <span className="pos-cat-tag">{p.category ? p.category.toUpperCase().replace('-', ' ') : 'MEDICINES'}</span>
                      <h4>{p.name}</h4>
                      <p>
                        <strong>Rs. {p.price.toFixed(2)}</strong> &bull; <small className={p.stock < 10 ? 'low-stock-txt' : ''}>Stock: {p.stock}</small>
                      </p>
                      <button className="btn-pos-add">+ Add to Bill</button>
                    </div>
                  ))
                ) : (
                  <div className="pos-empty-results">
                    <p>No products matching "<strong>{posSearchQuery}</strong>" in <span>{posCategoryFilter}</span>.</p>
                  </div>
                )}
              </div>
            </div>

            {/* POS Billing Cart Side */}
            <div className="pos-bill-side">
              <div className="pos-bill-header-row">
                <h3>Current Billing Cart ({posCart.length})</h3>
                {posCart.length > 0 && (
                  <button className="pos-clear-cart-btn" onClick={() => setPosCart([])}>Clear</button>
                )}
              </div>

              <div className="pos-bill-list">
                {posCart.length > 0 ? (
                  posCart.map(item => (
                    <div key={item.id} className="pos-bill-row">
                      <div className="pos-bill-item-info">
                        <strong>{item.name}</strong>
                        <small>Rs. {item.price} per unit</small>
                      </div>
                      <div className="pos-bill-qty-controls">
                        <button type="button" onClick={() => handlePosQuantityChange(item.id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => handlePosQuantityChange(item.id, 1)}>+</button>
                        <button type="button" className="pos-remove-btn" onClick={() => handlePosRemoveItem(item.id)} title="Remove item">🗑️</button>
                      </div>
                      <strong className="pos-item-subtotal">Rs. {(item.price * item.quantity).toFixed(2)}</strong>
                    </div>
                  ))
                ) : (
                  <div className="pos-empty-cart-state">
                    <ShoppingCart size={32} color="#cbd5e1" />
                    <p>Click any product on the left grid to add to counter bill</p>
                  </div>
                )}
              </div>

              <div className="pos-payment-selector">
                <label>Payment Method:</label>
                <select value={posPaymentMethod} onChange={(e) => setPosPaymentMethod(e.target.value)}>
                  <option value="cash">Cash on Counter</option>
                  <option value="easypaisa">EasyPaisa / JazzCash QR</option>
                  <option value="card">Debit / Credit Card</option>
                </select>
              </div>

              <div className="pos-bill-total">
                <span>Grand Total:</span>
                <strong>Rs. {posSubtotal.toFixed(2)}</strong>
              </div>

              <button 
                className="btn-complete-pos" 
                disabled={posCart.length === 0}
                onClick={handleCompletePosSale}
              >
                Complete Counter Sale & Print Receipt
              </button>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: Expiry & Batch Alerts */}
      {activeOpsTab === 'expiry-alerts' && (
        <div className="ops-card">
          <div className="ops-card-header">
            <div>
              <h3>Expiry Date & Batch Alert System</h3>
              <p>Automated warnings for batch items expiring within 30, 60, or 90 days to prevent inventory loss.</p>
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Batch #</th>
                <th>Medicine Name</th>
                <th>Supplier</th>
                <th>Expiry Date</th>
                <th>Days Remaining</th>
                <th>Stock</th>
                <th>Alert Status</th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_EXPIRY_BATCHES.map(b => (
                <tr key={b.batchNo}>
                  <td><code>{b.batchNo}</code></td>
                  <td><strong>{b.productName}</strong></td>
                  <td>{b.supplier}</td>
                  <td>{b.expiryDate}</td>
                  <td><strong className="red-text">{b.daysRemaining} Days</strong></td>
                  <td>{b.stock} Units</td>
                  <td>
                    <span className="expiry-warning-pill">
                      ⚠️ Expiring Soon
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: Bulk Category Pricing */}
      {activeOpsTab === 'bulk-price' && (
        <div className="ops-card">
          <div className="ops-card-header">
            <div>
              <h3>Bulk Category Pricing Tool</h3>
              <p>Apply percentage price increases or decreases across entire categories at once.</p>
            </div>
          </div>

          <div className="bulk-pricing-form">
            <div className="form-group">
              <label>Select Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">All Product Categories</option>
                <option value="medicines">Medicines</option>
                <option value="baby-care">Baby Care</option>
                <option value="hygiene">Hygiene & Personal</option>
                <option value="otc-first-aid">OTC & First Aid</option>
              </select>
            </div>

            <div className="form-group">
              <label>Adjustment Type</label>
              <select value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value)}>
                <option value="increase">Price Increase (+%)</option>
                <option value="decrease">Price Discount (-%)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Percentage Amount (%)</label>
              <input 
                type="number" 
                value={adjustmentPercent} 
                onChange={(e) => setAdjustmentPercent(parseFloat(e.target.value) || 0)}
              />
            </div>

            <button className="btn-apply-bulk" onClick={handleApplyBulkPricing}>
              Apply Rate Adjustment Across Category
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: Supplier Directory */}
      {activeOpsTab === 'suppliers' && (
        <div className="ops-card">
          <div className="ops-card-header">
            <div>
              <h3>Supplier Directory & Restock Contacts</h3>
              <p>Pharmaceutical distributor contact directory and restock purchase order details.</p>
            </div>
          </div>

          <div className="suppliers-grid">
            {SUPPLIERS.map(s => (
              <div key={s.id} className="supplier-card">
                <h4>{s.name}</h4>
                <p><strong>Contact:</strong> {s.contact}</p>
                <p><strong>Distribution Hub:</strong> {s.city}</p>
                <small>Total Purchase Orders: {s.totalOrders}</small>
                <button className="btn-restock-order">Auto-Generate Restock List</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Single Item Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-container add-item-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Add Single Item to Catalog</h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Item code is automatically assigned sequentially.</p>
              </div>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleAddNewItem} className="modal-body add-item-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Item Code <span className="auto-badge">⚡ Auto-Assigned</span>
                  </label>
                  <input 
                    type="text" 
                    value={newItem.code} 
                    readOnly
                    className="auto-code-input"
                  />
                </div>

                <div className="form-group">
                  <label>Product Title *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. PANADOL EXTRA 500MG" 
                    required 
                    value={newItem.name} 
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Generic Formula Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Paracetamol + Caffeine" 
                    value={newItem.genericName} 
                    onChange={(e) => setNewItem({ ...newItem, genericName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={newItem.category} 
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.toUpperCase().replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Trade Price (Rs.) *</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="e.g. 165.50" 
                    value={newItem.price} 
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row grid-3">
                <div className="form-group">
                  <label>Packaging Mode</label>
                  <select 
                    value={newItem.packagingMode} 
                    onChange={(e) => setNewItem({ ...newItem, packagingMode: e.target.value })}
                  >
                    <option value="both">Both (Per Pack & Per Strip)</option>
                    <option value="pack">Only Per Full Pack</option>
                    <option value="strip">Only Per Strip</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Strips Per Pack</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={newItem.stripsPerPack} 
                    onChange={(e) => setNewItem({ ...newItem, stripsPerPack: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Initial Physical Stock</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={newItem.stock} 
                    onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group margin-top-10">
                <label>Product Image</label>
                <div className="image-picker-container">
                  <div className="image-preview-box">
                    {newItem.image ? (
                      <img src={newItem.image} alt="Preview" />
                    ) : (
                      <div className="no-image-placeholder">No Image</div>
                    )}
                  </div>

                  <div className="image-picker-controls">
                    <div className="file-upload-wrapper">
                      <label className="btn-file-upload">
                        <Upload size={14} /> Upload Custom Photo File
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageFileUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    <div className="preset-photos">
                      <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Or Choose Medical Photo Template:</span>
                      <div className="preset-buttons">
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setNewItem({ ...newItem, image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&q=80' })}
                        >
                          💊 Tablets
                        </button>
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setNewItem({ ...newItem, image: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&q=80' })}
                        >
                          🧪 Liquids
                        </button>
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setNewItem({ ...newItem, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80' })}
                        >
                          🧴 Creams
                        </button>
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setNewItem({ ...newItem, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80' })}
                        >
                          👁️ Eye Drops
                        </button>
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setNewItem({ ...newItem, image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&q=80' })}
                        >
                          💉 Injections
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-checkbox-group margin-top-15">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={newItem.requiresPrescription} 
                    onChange={(e) => setNewItem({ ...newItem, requiresPrescription: e.target.checked })}
                  />
                  <span>⚠️ Requires Doctor Prescription (Pharmacist Verification Tag)</span>
                </label>
              </div>

              <div className="modal-actions margin-top-20">
                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save-item">
                  <Plus size={16} /> Save Product to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW CATEGORY MODAL */}
      {isAddCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCategoryModalOpen(false)}>
          <div className="modal-container add-category-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '24px' }}>
            <div className="modal-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#0d9488" /> Create New Category
              </h3>
              <button className="close-btn" onClick={() => setIsAddCategoryModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>New Category Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Surgical, Skin Care, Anti-Biotic, Cardiac..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  style={{ padding: '8px 16px', border: '1.5px solid #cbd5e1', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-save-item"
                  style={{ padding: '8px 18px', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)', color: '#ffffff', fontWeight: 800, cursor: 'pointer' }}
                >
                  + Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
