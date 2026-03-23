import {useState, useEffect, useCallback} from 'react';
import {
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Settings,
  Tag,
  MapPin,
  Percent,
  Package,
  AlertCircle,
  CheckCircle,
  X,
  Calendar,
} from 'lucide-react';

/**
 * Standalone Admin Page for Tier Pricing Discount Configuration
 * Access at: /admin/tier-pricing
 */

export const meta = () => {
  return [{title: 'Tier Pricing Admin | SGR Store'}];
};

export default function TierPricingAdmin() {
  // Auth state
  const [shop, setShop] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Data state
  const [functions, setFunctions] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  
  // Helper to get current datetime in local format for datetime-local input
  const getCurrentDateTime = () => {
    const now = new Date();
    // Format: YYYY-MM-DDTHH:MM
    return now.toISOString().slice(0, 16);
  };

  // Form state
  const [formData, setFormData] = useState({
    title: 'City Bulk Discount',
    startsAt: getCurrentDateTime(),
    cityRules: [
      {
        city: 'bangalore',
        tiers: [
          {minQty: 3, discountPercent: 10},
          {minQty: 6, discountPercent: 15},
          {minQty: 11, discountPercent: 20},
        ],
      },
    ],
  });

  // Create auth token
  const getAuthToken = useCallback(() => {
    return btoa(`${shop}:${accessToken}`);
  }, [shop, accessToken]);

  // API helper
  const apiCall = useCallback(async (method, body = null, params = '') => {
    const headers = {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    };
    
    const options = {method, headers};
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`/api/admin/discounts${params}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  }, [getAuthToken]);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [functionsData, discountsData] = await Promise.all([
        apiCall('GET', null, '?action=functions'),
        apiCall('GET'),
      ]);
      
      setFunctions(functionsData.functions || []);
      setDiscounts(discountsData.discounts || []);
      
      // Auto-select first function
      if (functionsData.functions?.length > 0 && !selectedFunction) {
        setSelectedFunction(functionsData.functions[0]);
      }
      
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
      if (err.message === 'Unauthorized') {
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, selectedFunction]);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    await loadData();
  };

  // Create discount
  const handleCreate = async () => {
    if (!selectedFunction) {
      setError('Please select a function first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert local datetime to ISO format for API
      const startsAtISO = formData.startsAt 
        ? new Date(formData.startsAt).toISOString() 
        : new Date().toISOString();
      
      await apiCall('POST', {
        title: formData.title,
        functionId: selectedFunction.id,
        cityRules: formData.cityRules,
        startsAt: startsAtISO,
      });
      
      setSuccess('Discount created successfully!');
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update discount
  const handleUpdate = async () => {
    if (!editingDiscount) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert local datetime to ISO format for API
      const startsAtISO = formData.startsAt 
        ? new Date(formData.startsAt).toISOString() 
        : new Date().toISOString();
      
      await apiCall('PUT', {
        discountId: editingDiscount.id,
        title: formData.title,
        cityRules: formData.cityRules,
        startsAt: startsAtISO,
      });
      
      setSuccess('Discount updated successfully!');
      setEditingDiscount(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete discount
  const handleDelete = async (discountId) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await apiCall('DELETE', {discountId});
      setSuccess('Discount deleted successfully!');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle discount status
  const handleToggleStatus = async (discountId, activate) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiCall('PUT', {discountId, activate});
      setSuccess(`Discount ${activate ? 'activated' : 'deactivated'}!`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit discount
  const startEditing = (discount) => {
    const config = discount.metafield?.value 
      ? JSON.parse(discount.metafield.value) 
      : {cityRules: []};
    
    // Convert ISO date to local datetime format for input
    const startsAt = discount.discount?.startsAt 
      ? new Date(discount.discount.startsAt).toISOString().slice(0, 16)
      : getCurrentDateTime();
    
    setFormData({
      title: discount.discount?.title || '',
      startsAt,
      cityRules: config.cityRules || [],
    });
    setEditingDiscount(discount);
    setShowCreateForm(false);
  };

  // Add city rule
  const addCityRule = () => {
    setFormData(prev => ({
      ...prev,
      cityRules: [
        ...prev.cityRules,
        {
          city: '',
          tiers: [{minQty: 3, discountPercent: 10}],
        },
      ],
    }));
  };

  // Remove city rule
  const removeCityRule = (index) => {
    setFormData(prev => ({
      ...prev,
      cityRules: prev.cityRules.filter((_, i) => i !== index),
    }));
  };

  // Update city rule
  const updateCityRule = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      cityRules: prev.cityRules.map((rule, i) => 
        i === index ? {...rule, [field]: value} : rule
      ),
    }));
  };

  // Add tier to city
  const addTier = (cityIndex) => {
    setFormData(prev => ({
      ...prev,
      cityRules: prev.cityRules.map((rule, i) => 
        i === cityIndex 
          ? {...rule, tiers: [...rule.tiers, {minQty: 1, discountPercent: 5}]}
          : rule
      ),
    }));
  };

  // Remove tier from city
  const removeTier = (cityIndex, tierIndex) => {
    setFormData(prev => ({
      ...prev,
      cityRules: prev.cityRules.map((rule, i) => 
        i === cityIndex 
          ? {...rule, tiers: rule.tiers.filter((_, ti) => ti !== tierIndex)}
          : rule
      ),
    }));
  };

  // Update tier
  const updateTier = (cityIndex, tierIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      cityRules: prev.cityRules.map((rule, i) => 
        i === cityIndex 
          ? {
              ...rule, 
              tiers: rule.tiers.map((tier, ti) => 
                ti === tierIndex ? {...tier, [field]: Number(value)} : tier
              ),
            }
          : rule
      ),
    }));
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <style>{adminStyles}</style>
        <div className="admin-container">
          <div className="admin-header">
            <Settings size={32} />
            <h1>Tier Pricing Admin</h1>
          </div>
          
          <div className="admin-card">
            <h2>Connect to Shopify Admin</h2>
            <p className="admin-help-text">
              Enter your store domain and Admin API access token to manage tier pricing discounts.
            </p>
            
            <form onSubmit={handleLogin} className="admin-form">
              <div className="form-group">
                <label>Store Domain</label>
                <input
                  type="text"
                  value={shop}
                  onChange={(e) => setShop(e.target.value)}
                  placeholder="your-store.myshopify.com"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Admin API Access Token</label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="shpat_xxxxx..."
                  required
                />
                <small>
                  Get this from Settings → Apps → Develop apps → Your app → API credentials
                </small>
              </div>
              
              {error && (
                <div className="alert alert-error">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <RefreshCw size={16} className="spin" /> : 'Connect'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main admin UI
  return (
    <div className="admin-page">
      <style>{adminStyles}</style>
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-header-left">
            <Settings size={32} />
            <h1>Tier Pricing Admin</h1>
          </div>
          <div className="admin-header-right">
            <span className="shop-badge">{shop}</span>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setIsAuthenticated(false);
                setShop('');
                setAccessToken('');
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
        
        {/* Alerts */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            {error}
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <CheckCircle size={16} />
            {success}
          </div>
        )}
        
        {/* Function selector */}
        <div className="admin-card">
          <h3>
            <Tag size={18} />
            Discount Function
          </h3>
          
          {functions.length === 0 ? (
            <p className="admin-help-text">
              No discount functions found. Make sure you've deployed the tier-pricing-discount function.
            </p>
          ) : (
            <select 
              value={selectedFunction?.id || ''} 
              onChange={(e) => setSelectedFunction(functions.find(f => f.id === e.target.value))}
              className="select-full"
            >
              {functions.map(fn => (
                <option key={fn.id} value={fn.id}>
                  {fn.title} ({fn.app?.title})
                </option>
              ))}
            </select>
          )}
        </div>
        
        {/* Existing discounts */}
        <div className="admin-card">
          <div className="card-header">
            <h3>
              <Percent size={18} />
              Active Discounts
            </h3>
            <div className="card-actions">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                Refresh
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingDiscount(null);
                  setFormData({
                    title: 'City Bulk Discount',
                    startsAt: getCurrentDateTime(),
                    cityRules: [{
                      city: '',
                      tiers: [{minQty: 3, discountPercent: 10}],
                    }],
                  });
                }}
              >
                <Plus size={14} />
                Create New
              </button>
            </div>
          </div>
          
          {discounts.length === 0 ? (
            <p className="admin-help-text">
              No tier pricing discounts found. Create one to get started.
            </p>
          ) : (
            <div className="discount-list">
              {discounts.map(discount => (
                <div key={discount.id} className="discount-item">
                  <div className="discount-info">
                    <strong>{discount.discount?.title}</strong>
                    <span className={`status-badge status-${discount.discount?.status?.toLowerCase()}`}>
                      {discount.discount?.status}
                    </span>
                  </div>
                  <div className="discount-actions">
                    <button 
                      className="btn btn-secondary btn-xs"
                      onClick={() => startEditing(discount)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleToggleStatus(
                        discount.id, 
                        discount.discount?.status !== 'ACTIVE'
                      )}
                    >
                      {discount.discount?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      className="btn btn-danger btn-xs"
                      onClick={() => handleDelete(discount.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Create/Edit form */}
        {(showCreateForm || editingDiscount) && (
          <div className="admin-card">
            <div className="card-header">
              <h3>
                <MapPin size={18} />
                {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
              </h3>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingDiscount(null);
                }}
              >
                <X size={14} />
                Cancel
              </button>
            </div>
            
            <div className="admin-form">
              <div className="form-group">
                <label>Discount Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                  placeholder="City Bulk Discount"
                />
              </div>
              
              <div className="form-group">
                <label>
                  <Calendar size={14} style={{marginRight: '0.375rem', verticalAlign: 'middle'}} />
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) => setFormData(prev => ({...prev, startsAt: e.target.value}))}
                />
                <small>Leave as current date/time to start immediately</small>
              </div>
              
              <h4>City Rules</h4>
              
              {formData.cityRules.map((cityRule, cityIndex) => (
                <div key={cityIndex} className="city-rule-card">
                  <div className="city-rule-header">
                    <div className="form-group form-group-inline">
                      <label>City Name</label>
                      <input
                        type="text"
                        value={cityRule.city}
                        onChange={(e) => updateCityRule(cityIndex, 'city', e.target.value)}
                        placeholder="bangalore"
                      />
                    </div>
                    <button 
                      className="btn btn-danger btn-xs"
                      onClick={() => removeCityRule(cityIndex)}
                    >
                      <Trash2 size={12} />
                      Remove City
                    </button>
                  </div>
                  
                  <table className="tier-table">
                    <thead>
                      <tr>
                        <th>Min Quantity</th>
                        <th>Discount %</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cityRule.tiers.map((tier, tierIndex) => (
                        <tr key={tierIndex}>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={tier.minQty}
                              onChange={(e) => updateTier(cityIndex, tierIndex, 'minQty', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={tier.discountPercent}
                              onChange={(e) => updateTier(cityIndex, tierIndex, 'discountPercent', e.target.value)}
                            />
                          </td>
                          <td>
                            <button 
                              className="btn btn-danger btn-xs"
                              onClick={() => removeTier(cityIndex, tierIndex)}
                              disabled={cityRule.tiers.length <= 1}
                            >
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <button 
                    className="btn btn-secondary btn-xs"
                    onClick={() => addTier(cityIndex)}
                  >
                    <Plus size={12} />
                    Add Tier
                  </button>
                </div>
              ))}
              
              <button 
                className="btn btn-secondary"
                onClick={addCityRule}
              >
                <Plus size={14} />
                Add City
              </button>
              
              <div className="form-actions">
                <button 
                  className="btn btn-primary"
                  onClick={editingDiscount ? handleUpdate : handleCreate}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw size={16} className="spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      {editingDiscount ? 'Update Discount' : 'Create Discount'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const adminStyles = `
  .admin-page {
    min-height: 100vh;
    background: #f6f6f7;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .admin-container {
    max-width: 900px;
    margin: 0 auto;
  }
  
  .admin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    gap: 1rem;
  }
  
  .admin-header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .admin-header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .admin-header h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .shop-badge {
    background: #e4e5e7;
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  .admin-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  
  .admin-card h2 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
  }
  
  .admin-card h3 {
    margin: 0 0 1rem;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .admin-card h4 {
    margin: 1.5rem 0 1rem;
    font-size: 0.875rem;
    text-transform: uppercase;
    color: #6d7175;
  }
  
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  
  .card-header h3 {
    margin: 0;
  }
  
  .card-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .admin-help-text {
    color: #6d7175;
    font-size: 0.875rem;
    margin: 0;
  }
  
  .admin-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  
  .form-group-inline {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
  }
  
  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .form-group input,
  .form-group select {
    padding: 0.625rem 0.75rem;
    border: 1px solid #c9cccf;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #5c6ac4;
    box-shadow: 0 0 0 1px #5c6ac4;
  }
  
  .form-group small {
    color: #6d7175;
    font-size: 0.75rem;
  }
  
  .select-full {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid #c9cccf;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  .form-actions {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e4e5e7;
  }
  
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.625rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background: #5c6ac4;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #4959bd;
  }
  
  .btn-secondary {
    background: #e4e5e7;
    color: #202223;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #d2d5d8;
  }
  
  .btn-danger {
    background: #d72c0d;
    color: white;
  }
  
  .btn-danger:hover:not(:disabled) {
    background: #bc2200;
  }
  
  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
  
  .btn-xs {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  
  .alert button {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.7;
  }
  
  .alert-error {
    background: #fbeae5;
    color: #d72c0d;
  }
  
  .alert-success {
    background: #e3f1df;
    color: #108043;
  }
  
  .discount-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .discount-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: #f6f6f7;
    border-radius: 4px;
  }
  
  .discount-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .discount-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .status-badge {
    padding: 0.125rem 0.5rem;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }
  
  .status-active {
    background: #aee9d1;
    color: #108043;
  }
  
  .status-scheduled {
    background: #b4e1fa;
    color: #0070c0;
  }
  
  .status-expired, .status-inactive {
    background: #e4e5e7;
    color: #6d7175;
  }
  
  .city-rule-card {
    border: 1px solid #e4e5e7;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .city-rule-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  
  .tier-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0.75rem;
  }
  
  .tier-table th {
    text-align: left;
    padding: 0.5rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #6d7175;
    border-bottom: 1px solid #e4e5e7;
  }
  
  .tier-table td {
    padding: 0.5rem;
  }
  
  .tier-table input {
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: 1px solid #c9cccf;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  .spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @media (max-width: 640px) {
    .admin-page {
      padding: 1rem;
    }
    
    .admin-header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .discount-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
    
    .city-rule-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
  }
`;
