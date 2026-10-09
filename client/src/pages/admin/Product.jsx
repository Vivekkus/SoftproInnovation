import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const Product = () => {
  const [data, setData] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStock, setSelectedStock] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [productToDelete, setProductToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [alertMsg, setAlertMsg] = useState(null)

  const handleFetch = async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get('http://localhost:5000/api/product'),
        axios.get('http://localhost:5000/api/category')
      ])
      setData(prodRes.data.data || [])
      setCategories(catRes.data.data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      showAlert('Failed to load products.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleFetch()
  }, [])

  const showAlert = (text, type = 'success') => {
    setAlertMsg({ text, type })
    setTimeout(() => setAlertMsg(null), 4000)
  }

  const handleDelete = async () => {
    if (!productToDelete) return
    setDeleting(true)
    try {
      const res = await axios.delete(`http://localhost:5000/api/product/${productToDelete._id}`)
      showAlert(res.data?.msg || 'Product removed successfully!')
      setData(prev => prev.filter(item => item._id !== productToDelete._id))
      setProductToDelete(null)
    } catch (err) {
      console.error('Error deleting product:', err)
      showAlert('Failed to delete product. Please try again.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const getProductImageUrl = (item) => {
    if (!item?.images) return null
    if (item.images.startsWith('http')) return item.images
    const filename = item.images.replace(/\\/g, '/').split('/').pop()
    return `http://localhost:5000/api/product/${filename}`
  }

  const getDiscountedPrice = (actualPrice, discount) => {
    const p = parseFloat(actualPrice) || 0
    const d = parseFloat(discount) || 0
    if (d <= 0) return Math.round(p)
    return Math.round(p - (p * d / 100))
  }

  // Filter & Sort
  const filteredData = useMemo(() => {
    let result = [...data]
    const q = search.trim().toLowerCase()

    if (q) {
      result = result.filter(item =>
        String(item.name || '').toLowerCase().includes(q) ||
        String(item.brandName || '').toLowerCase().includes(q) ||
        String(item.tag || '').toLowerCase().includes(q) ||
        String(item.category?.category || '').toLowerCase().includes(q)
      )
    }

    if (selectedCategory !== 'all') {
      result = result.filter(item => {
        const catId = item.category?._id || item.category
        return catId === selectedCategory
      })
    }

    if (selectedStock === 'inStock') {
      result = result.filter(item => item.stockStatus === 'inStock' || Number(item.stock) > 0)
    } else if (selectedStock === 'outOfStock') {
      result = result.filter(item => item.stockStatus === 'outOfStock' || Number(item.stock) <= 0)
    }

    // Sort
    if (sortBy === 'priceAsc') {
      result.sort((a, b) => (parseFloat(a.actualPrice) || 0) - (parseFloat(b.actualPrice) || 0))
    } else if (sortBy === 'priceDesc') {
      result.sort((a, b) => (parseFloat(b.actualPrice) || 0) - (parseFloat(a.actualPrice) || 0))
    } else if (sortBy === 'name') {
      result.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    }

    return result
  }, [data, search, selectedCategory, selectedStock, sortBy])

  // Stats
  const stats = useMemo(() => {
    const total = data.length
    const inStock = data.filter(p => p.stockStatus === 'inStock' || Number(p.stock) > 0).length
    const outOfStock = total - inStock
    const totalUnits = data.reduce((acc, p) => acc + (parseInt(p.stock) || 0), 0)
    return { total, inStock, outOfStock, totalUnits }
  }, [data])

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Product <span>Catalog</span></h1>
          <p className="dash-page-subtitle">Manage store products, tech specifications, stock, and live pricing</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="dash-btn-outline" onClick={handleFetch} title="Reload product inventory">
            🔄 Refresh
          </button>
          <Link to="/admin/dashboard/addproduct" className="dash-btn-primary" style={{ textDecoration: 'none' }}>
            ➕ Add Product
          </Link>
        </div>
      </div>

      {/* ── Alert Notification ── */}
      {alertMsg && (
        <div className={`dash-alert ${alertMsg.type}`}>
          <span>{alertMsg.type === 'error' ? '⚠️' : '✅'}</span>
          <div>{alertMsg.text}</div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Products', num: stats.total, cls: 's1', icon: '📦' },
          { label: 'In Stock Items', num: stats.inStock, cls: 's3', icon: '✅' },
          { label: 'Out of Stock / Alert', num: stats.outOfStock, cls: 's4', icon: '⚠️' },
          { label: 'Total Units Available', num: stats.totalUnits, cls: 's2', icon: '📊' },
        ].map(s => (
          <div className="col-6 col-lg-3" key={s.label}>
            <div className={`dash-stat-card ${s.cls}`}>
              <span className="dash-stat-icon">{s.icon}</span>
              <div className="dash-stat-num">{s.num}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Controls Toolbar ── */}
      <div className="dash-card mb-4">
        <div className="dash-card-body" style={{ padding: '1.2rem' }}>
          <div className="row g-2 align-items-center">

            {/* Search */}
            <div className="col-12 col-md-4">
              <div style={{ position: 'relative' }}>
                <svg
                  style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search name, brand, tag…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '2.2rem',
                    background: 'var(--dash-input-bg)',
                    border: '1.5px solid var(--dash-input-border)',
                    borderRadius: 9,
                    padding: '0.55rem 0.8rem 0.55rem 2.2rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="col-6 col-md-3">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--dash-input-bg)',
                  border: '1.5px solid var(--dash-input-border)',
                  borderRadius: 9,
                  padding: '0.55rem 0.8rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.category}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div className="col-6 col-md-2">
              <select
                value={selectedStock}
                onChange={e => setSelectedStock(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--dash-input-bg)',
                  border: '1.5px solid var(--dash-input-border)',
                  borderRadius: 9,
                  padding: '0.55rem 0.8rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="all">Stock: All</option>
                <option value="inStock">In Stock</option>
                <option value="outOfStock">Out of Stock</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="col-12 col-md-3">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--dash-input-bg)',
                  border: '1.5px solid var(--dash-input-border)',
                  borderRadius: 9,
                  padding: '0.55rem 0.8rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="newest">Sort: Newest First</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* ── Products Table Card ── */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">Inventory Directory</h2>
          <span className="dash-badge-brand">
            Showing {filteredData.length} of {data.length} Products
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4.5rem 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⏳</div>
            <p>Loading hardware inventory catalog…</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>📦</div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>
              {search || selectedCategory !== 'all' || selectedStock !== 'all' ? 'No Matching Products Found' : 'No Products In Catalog'}
            </h3>
            <p style={{ maxWidth: 420, margin: '0 auto 1.5rem', fontSize: '0.88rem' }}>
              {search || selectedCategory !== 'all' || selectedStock !== 'all'
                ? 'Try broadening your search term or reset active category and stock filters.'
                : 'Get started by creating your first product listing with pricing, image, and inventory quantities.'}
            </p>
            {search || selectedCategory !== 'all' || selectedStock !== 'all' ? (
              <button
                className="dash-btn-outline"
                onClick={() => {
                  setSearch('')
                  setSelectedCategory('all')
                  setSelectedStock('all')
                }}
              >
                Reset Filters
              </button>
            ) : (
              <Link to="/admin/dashboard/addproduct" className="dash-btn-primary" style={{ textDecoration: 'none' }}>
                ➕ Create First Product
              </Link>
            )}
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: 45 }}>#</th>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Pricing</th>
                  <th>Inventory</th>
                  <th>Features</th>
                  <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, i) => {
                  const imgUrl = getProductImageUrl(item)
                  const actualP = parseFloat(item.actualPrice) || 0
                  const discountP = parseFloat(item.discount) || 0
                  const finalP = getDiscountedPrice(actualP, discountP)
                  const isInStock = item.stockStatus === 'inStock' || Number(item.stock) > 0

                  return (
                    <tr key={item._id || i}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>

                      {/* Product Thumbnail + Name + Brand */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="dash-thumb">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={item.name}
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.parentElement.innerHTML = '<span class="dash-thumb-fallback">🔌</span>'
                                }}
                              />
                            ) : (
                              <span className="dash-thumb-fallback">🔌</span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.name}
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                              {item.brandName && (
                                <span className="dash-badge-brand">{item.brandName}</span>
                              )}
                              {item.tag && (
                                <span className="dash-badge-tag">{item.tag}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="dash-badge-cat">
                          🏷️ {item.category?.category || 'General'}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.95rem' }}>
                            ₹{finalP.toLocaleString('en-IN')}
                          </span>
                          {discountP > 0 && (
                            <span style={{ fontSize: '0.78rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                              ₹{Math.round(actualP).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {discountP > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#28a745', fontWeight: 600, marginTop: 2 }}>
                            {discountP}% OFF
                          </div>
                        )}
                      </td>

                      {/* Stock & Status */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {item.stock ?? 0} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>units</span>
                        </div>
                        <span className={`dash-pill ${isInStock ? 'delivered' : 'cancelled'}`} style={{ marginTop: 4 }}>
                          {isInStock ? '● In Stock' : '✕ Out of Stock'}
                        </span>
                      </td>

                      {/* Features / Policies */}
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {item.isCod === 'Yes' && (
                            <span title="Cash on Delivery Available" style={{ fontSize: '0.72rem', background: 'var(--dash-input-bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--dash-table-border)' }}>
                              💵 COD
                            </span>
                          )}
                          {item.freeDelivery === 'Yes' && (
                            <span title="Free Delivery" style={{ fontSize: '0.72rem', background: 'var(--dash-input-bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--dash-table-border)' }}>
                              🚚 Free
                            </span>
                          )}
                          {item.refundPolicy === 'Yes' && (
                            <span title="Refund Available" style={{ fontSize: '0.72rem', background: 'var(--dash-input-bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--dash-table-border)' }}>
                              🛡️ Refund
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <Link
                            to={`/admin/dashboard/addproduct/${item._id}`}
                            className="dash-action-btn edit"
                            title="Edit product"
                          >
                            ✏️ Edit
                          </Link>
                          <button
                            type="button"
                            className="dash-action-btn delete"
                            onClick={() => setProductToDelete(item)}
                            title="Delete product"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {productToDelete && (
        <div className="dash-modal-overlay" onClick={() => !deleting && setProductToDelete(null)}>
          <div className="dash-modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>⚠️</div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                Delete Product?
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                Are you sure you want to permanently delete <strong>"{productToDelete.name}"</strong>?
                This action will delete the item from the online store catalog.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="dash-btn-outline"
                onClick={() => setProductToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dash-btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Product