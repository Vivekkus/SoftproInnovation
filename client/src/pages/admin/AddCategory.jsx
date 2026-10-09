import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axios from 'axios'

const AddCategory = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [existingImgUrl, setExistingImgUrl] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [data, setData] = useState({
    category: '',
    picture: null,
    description: '',
    status: 'active'
  })

  useEffect(() => {
    if (id) {
      const fetchCategory = async () => {
        setFetching(true)
        try {
          const res = await axios.get('http://localhost:5000/api/category')
          const found = res.data.data?.find(c => c._id === id)
          if (found) {
            setData({
              category: found.category || '',
              picture: null,
              description: found.description || '',
              status: found.status || 'active'
            })
            if (found.picture) {
              const filename = found.picture.replace(/\\/g, '/').split('/').pop()
              setExistingImgUrl(`http://localhost:5000/api/category/${filename}`)
            }
          } else {
            setErrorMsg('Category not found.')
          }
        } catch (err) {
          console.error('Error fetching category details:', err)
          setErrorMsg('Failed to fetch existing category details.')
        } finally {
          setFetching(false)
        }
      }
      fetchCategory()
    }
  }, [id])

  const handleFile = (file) => {
    if (!file) return
    setData(prev => ({ ...prev, picture: file }))
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setErrorMsg('')
  }

  const handleChange = (e) => {
    setErrorMsg('')
    if (e.target.type === 'file') {
      handleFile(e.target.files[0])
    } else {
      setData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleRemoveImage = (e) => {
    e.stopPropagation()
    setData(prev => ({ ...prev, picture: null }))
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!data.category.trim()) {
      setErrorMsg('Please enter a category title.')
      return
    }

    if (!isEdit && !data.picture) {
      setErrorMsg('Please upload a category picture.')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('category', data.category.trim())
    formData.append('description', data.description.trim())
    formData.append('status', data.status || 'active')
    if (data.picture) {
      formData.append('picture', data.picture)
    }

    try {
      if (isEdit) {
        await axios.put(`http://localhost:5000/api/category/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setSuccessMsg('Category updated successfully!')
      } else {
        await axios.post('http://localhost:5000/api/category', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setSuccessMsg('Category created successfully!')
      }
      setTimeout(() => {
        navigate('/admin/dashboard/category')
      }, 700)
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.msg || err.response?.data || (isEdit ? 'Failed to update category.' : 'Failed to create category.')
      setErrorMsg(typeof msg === 'string' ? msg : 'Error processing request.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⏳</div>
        <p>Loading category details…</p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Breadcrumb ── */}
      <div className="dash-breadcrumb">
        <Link to="/admin/dashboard">Dashboard</Link>
        <span className="dash-breadcrumb-sep">/</span>
        <Link to="/admin/dashboard/category">Categories</Link>
        <span className="dash-breadcrumb-sep">/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {isEdit ? 'Edit Category' : 'Add Category'}
        </span>
      </div>

      {/* ── Header ── */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">{isEdit ? 'Edit' : 'Add'} <span>Category</span></h1>
          <p className="dash-page-subtitle">
            {isEdit ? 'Modify existing catalog classification details' : 'Define a new component classification for your catalog'}
          </p>
        </div>
        <Link to="/admin/dashboard/category" className="dash-btn-outline" style={{ textDecoration: 'none' }}>
          ← Back to Categories
        </Link>
      </div>

      {/* ── Alerts ── */}
      {errorMsg && (
        <div className="dash-alert error">
          <span>⚠️</span>
          <div>{errorMsg}</div>
        </div>
      )}
      {successMsg && (
        <div className="dash-alert success">
          <span>✅</span>
          <div>{successMsg}</div>
        </div>
      )}

      {/* ── Main Form Card ── */}
      <div className="dash-card" style={{ maxWidth: 720 }}>
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            {isEdit ? `Editing: ${data.category || 'Category'}` : 'New Category Details'}
          </h2>
          <span className="dash-badge-cat">{isEdit ? 'Update Mode' : 'Creation Mode'}</span>
        </div>

        <div className="dash-card-body">
          <form onSubmit={handleSubmit}>

            {/* Category Title */}
            <div className="dash-field">
              <label htmlFor="category">Category Title *</label>
              <input
                id="category"
                type="text"
                name="category"
                value={data.category}
                onChange={handleChange}
                placeholder="e.g. Microcontrollers, Sensors, Robotics Kits"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="dash-field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={data.description}
                onChange={handleChange}
                placeholder="Write a clear summary of what types of boards, modules or hardware belong in this category..."
                rows="4"
                style={{
                  width: '100%',
                  background: 'var(--dash-input-bg)',
                  border: '1.5px solid var(--dash-input-border)',
                  borderRadius: 10,
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'var(--font-body)'
                }}
              />
            </div>

            {/* Status (If editing) */}
            {isEdit && (
              <div className="dash-field">
                <label htmlFor="status">Category Status</label>
                <select
                  id="status"
                  name="status"
                  value={data.status}
                  onChange={handleChange}
                >
                  <option value="active">Active (Visible in store)</option>
                  <option value="inactive">Inactive (Hidden from customers)</option>
                </select>
              </div>
            )}

            {/* Image Upload Zone */}
            <div className="dash-field">
              <label>
                Category Cover Image {isEdit ? '(Optional - upload to replace current)' : '*'}
              </label>

              <input
                ref={fileInputRef}
                id="picture"
                type="file"
                name="picture"
                accept="image/*"
                onChange={handleChange}
                style={{ display: 'none' }}
              />

              <div
                className={`dash-upload-box${dragActive ? ' drag-over' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📁</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                  Click to select file or drag &amp; drop image here
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  PNG, JPG, WEBP or SVG up to 5MB
                </div>
              </div>

              {/* Live Preview of New Selected Image */}
              {previewUrl && (
                <div className="dash-preview-wrap">
                  <img src={previewUrl} alt="New Preview" className="dash-preview-img" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>
                      NEW IMAGE SELECTED
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {data.picture?.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {(data.picture?.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    type="button"
                    className="dash-action-btn delete"
                    onClick={handleRemoveImage}
                    title="Remove selected image"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}

              {/* Preview of Existing Image when in Edit mode and no new preview yet */}
              {!previewUrl && existingImgUrl && (
                <div className="dash-preview-wrap">
                  <img
                    src={existingImgUrl}
                    alt="Current Image"
                    className="dash-preview-img"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML += '<div style="font-size:0.8rem; color:var(--text-muted);">Current image preview unavailable</div>'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      CURRENT IMAGE ACTIVE
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Click the upload box above if you want to replace it.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '2rem', alignItems: 'center' }}>
              <button type="submit" className="dash-btn-primary" disabled={loading}>
                {loading ? 'Processing…' : (isEdit ? '💾 Update Category' : '➕ Create Category')}
              </button>
              <button
                type="button"
                className="dash-btn-outline"
                onClick={() => navigate('/admin/dashboard/category')}
                disabled={loading}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

export default AddCategory
