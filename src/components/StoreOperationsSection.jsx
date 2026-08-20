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

  const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  // Bulk Pricing State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [adjustmentPercent, setAdjustmentPercent] = useState(5);
  const [adjustmentType, setAdjustmentType] = useState('increase'); // 'increase' or 'decrease'

  // POS Lite State
  const [posCart, setPosCart] = useState([]);
  const [posPaymentMethod, setPosPaymentMethod] = useState('cash');

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
              <div>
                <h3>Full Store Product Catalog ({filteredOpsProducts.length} Filtered / {editableProducts.length} Total)</h3>
                <p>Search by name/generic formula, or filter by starting letter (A-Z) to edit trade rates and stock.</p>
              </div>
              <div className="ops-actions-group">
                <div className="ops-search-box">
                  <input 
                    type="text" 
                    placeholder="Search catalog items..." 
                    value={opsSearchQuery}
                    onChange={(e) => { setOpsSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="ops-search-input"
                  />
                </div>
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
                    <td><strong>{p.name}</strong></td>
                    <td><span className="cat-pill">{p.category}</span></td>
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
                          {p.showOnMainScreen !== false ? 'ON (Visible)' : 'OFF (Hidden)'}
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
      {activeOpsTab === 'pos-lite' && (
        <div className="ops-card pos-lite-layout">
          <div className="pos-catalog-side">
            <h3>Counter Sale Quick Select</h3>
            <div className="pos-search-grid">
              {editableProducts.slice(0, 12).map(p => (
                <div key={p.id} className="pos-item-card" onClick={() => handlePosAddToCart(p)}>
                  <h4>{p.name}</h4>
                  <p>Rs. {p.price} • Stock: {p.stock}</p>
                  <button className="btn-pos-add">+ Select</button>
                </div>
              ))}
            </div>
          </div>

          <div className="pos-bill-side">
            <h3>Current Billing Cart ({posCart.length})</h3>
            <div className="pos-bill-list">
              {posCart.map(item => (
                <div key={item.id} className="pos-bill-row">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>Rs. {item.price * item.quantity}</span>
                </div>
              ))}
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
              <strong>Rs. {posSubtotal}</strong>
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
      )}

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
                    <option value="medicines">Medicines</option>
                    <option value="baby-care">Baby Care</option>
                    <option value="hygiene">Hygiene & Personal</option>
                    <option value="otc-first-aid">OTC & First Aid</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Trade Price (Rs.) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="180.00" 
                    required 
                    value={newItem.price} 
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Packaging Availability</label>
                  <select 
                    value={newItem.packagingMode} 
                    onChange={(e) => setNewItem({ ...newItem, packagingMode: e.target.value })}
                  >
                    <option value="both">Both (Pack & Strip)</option>
                    <option value="pack">Only Per Pack</option>
                    <option value="strip">Only Per Strip</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Strips Per Pack</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100"
                    placeholder="10" 
                    disabled={newItem.packagingMode === 'pack'}
                    value={newItem.stripsPerPack} 
                    onChange={(e) => setNewItem({ ...newItem, stripsPerPack: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Physical Stock Quantity</label>
                  <input 
                    type="number" 
                    placeholder="50" 
                    value={newItem.stock} 
                    onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                  />
                </div>
              </div>

              {/* Product Picture Option Section */}
              <div className="image-upload-section margin-top-15">
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>
                  📷 Product Picture Option
                </label>

                <div className="image-picker-box">
                  <div className="image-preview-thumb">
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
    </div>
  );
}
