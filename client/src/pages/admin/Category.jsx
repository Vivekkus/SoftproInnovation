import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const Category = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [alertMsg, setAlertMsg] = useState(null)

  const handleFetch = async () => {
    setLoading(true)
    try {
      const res = await axios.get('http://localhost:5000/api/category')
      setData(res.data.data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
      showAlert('Failed to load categories.', 'error')
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
    if (!categoryToDelete) return
    setDeleting(true)
    try {
      const res = await axios.delete(`http://localhost:5000/api/category/${categoryToDelete._id}`)
      showAlert(res.data?.msg || 'Category deleted successfully!')
      setData(prev => prev.filter(item => item._id !== categoryToDelete._id))
      setCategoryToDelete(null)
    } catch (err) {
      console.error('Error deleting category:', err)
      showAlert('Failed to delete category. Please try again.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const getCategoryImageUrl = (item) => {
    if (!item?.picture) return null
    if (item.picture.startsWith('http')) return item.picture
    const filename = item.picture.replace(/\\/g, '/').split('/').pop()
    return `http://localhost:5000/api/category/${filename}`
  }

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter(item =>
      String(item.category || '').toLowerCase().includes(q) ||
      String(item.description || '').toLowerCase().includes(q)
    )
  }, [data, search])

  const stats = useMemo(() => {
    const total = data.length
    const withImg = data.filter(c => !!c.picture).length
    const active = data.filter(c => c.status !== 'inactive').length
    return { total, withImg, active }
  }, [data])

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Category <span>Management</span></h1>
          <p className="dash-page-subtitle">Organize, create, and refine product catalog classifications</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="dash-btn-outline" onClick={handleFetch} title="Reload category directory">
            🔄 Refresh
          </button>
          <Link to="/admin/dashboard/add-category" className="dash-btn-primary" style={{ textDecoration: 'none' }}>
            ➕ Add Category
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

      {/* ── Stats Summary ── */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Categories', num: stats.total, cls: 's1', icon: '🏷️' },
          { label: 'Active Status', num: stats.active, cls: 's2', icon: '⚡' },
          { label: 'With Cover Media', num: stats.withImg, cls: 's3', icon: '🖼️' },
          { label: 'Search Matches', num: filteredData.length, cls: 's4', icon: '🔍' },
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

      {/* ── Search & Filter Controls ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: 260, maxWidth: 380, flex: 1 }}>
          <svg
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by category name or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.3rem',
              background: 'var(--dash-input-bg)',
              border: '1.5px solid var(--dash-input-border)',
              borderRadius: 10,
              padding: '0.65rem 0.9rem 0.65rem 2.3rem',
              fontSize: '0.88rem',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.18s'
            }}
          />
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredData.length}</strong> of <strong>{data.length}</strong> categories
        </div>
      </div>

      {/* ── Category Table / Empty State ── */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">All Catalog Categories</h2>
          <span className="dash-badge-cat">{data.length} Total</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4.5rem 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', animation: 'spin 1.5s linear infinite' }}>⏳</div>
            <p>Loading category registry…</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>🏷️</div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>
              {search ? 'No Matching Categories Found' : 'No Categories Yet'}
            </h3>
            <p style={{ maxWidth: 420, margin: '0 auto 1.5rem', fontSize: '0.88rem' }}>
              {search
                ? `No categories match "${search}". Try checking for spelling or clear your search.`
                : 'Create your first product category to organize hardware components and sensors in your store catalog.'}
            </p>
            {search ? (
              <button className="dash-btn-outline" onClick={() => setSearch('')}>
                Clear Search Filter
              </button>
            ) : (
              <Link to="/admin/dashboard/add-category" className="dash-btn-primary" style={{ textDecoration: 'none' }}>
                ➕ Create First Category
              </Link>
            )}
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th style={{ width: 80 }}>Media</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 150, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, i) => {
                  const imgUrl = getCategoryImageUrl(item)
                  return (
                    <tr key={item._id || i}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                      <td>
                        <div className="dash-thumb">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={item.category}
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.parentElement.innerHTML = '<span class="dash-thumb-fallback">🏷️</span>'
                              }}
                            />
                          ) : (
                            <span className="dash-thumb-fallback">🏷️</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                          {item.category}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          ID: {item._id?.slice(-6) || '—'}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            maxWidth: 380,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem'
                          }}
                          title={item.description}
                        >
                          {item.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`dash-pill ${item.status === 'inactive' ? 'cancelled' : 'delivered'}`}>
                          {item.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <Link
                            to={`/admin/dashboard/add-category/${item._id}`}
                            className="dash-action-btn edit"
                            title="Edit this category"
                          >
                            ✏️ Edit
                          </Link>
                          <button
                            type="button"
                            className="dash-action-btn delete"
                            onClick={() => setCategoryToDelete(item)}
                            title="Delete this category"
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
      {categoryToDelete && (
        <div className="dash-modal-overlay" onClick={() => !deleting && setCategoryToDelete(null)}>
          <div className="dash-modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>⚠️</div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                Delete Category?
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                Are you sure you want to delete category <strong>"{categoryToDelete.category}"</strong>?
                This will soft-delete it from active store classifications.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="dash-btn-outline"
                onClick={() => setCategoryToDelete(null)}
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
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Category