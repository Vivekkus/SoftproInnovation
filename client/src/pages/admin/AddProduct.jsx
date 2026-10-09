import React, { useEffect, useState, useRef, useMemo } from "react"
import axios from "axios"
import { useNavigate, useParams, Link } from "react-router-dom"

const AddProduct = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [categoryList, setCategoryList] = useState([])
  const [previewUrl, setPreviewUrl] = useState(null)
  const [existingImgUrl, setExistingImgUrl] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const [data, setData] = useState({
    name: "",
    category: "",
    description: "",
    brandName: "",
    actualPrice: "",
    discount: "0",
    picture: null,
    tag: "",
    stock: "",
    attributes: "",
    height: "",
    width: "",
    stockStatus: "inStock",
    refundPolicy: "No",
    replacementPolicy: "No",
    freeDelivery: "No",
    returnPolicy: "No",
    isCod: "Yes"
  })

  useEffect(() => {
    const init = async () => {
      await fetchCategories()
      if (id) {
        await fetchProductDetails()
      }
    }
    init()
  }, [id])

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/category")
      setCategoryList(res.data.data || [])
    } catch (err) {
      console.error("Error fetching categories:", err)
      setErrorMsg("Failed to load category list.")
    }
  }

  const fetchProductDetails = async () => {
    setFetching(true)
    try {
      const res = await axios.get(`http://localhost:5000/api/product/details/${id}`)
      const p = res.data.data
      if (p) {
        setData({
          name: p.name || "",
          category: p.category?._id || p.category || "",
          description: p.description || "",
          brandName: p.brandName || "",
          actualPrice: p.actualPrice || "",
          discount: p.discount || "0",
          picture: null,
          tag: p.tag || "",
          stock: p.stock || "",
          attributes: p.attributes || "",
          height: p.height || "",
          width: p.width || "",
          stockStatus: p.stockStatus || "inStock",
          refundPolicy: p.refundPolicy || "No",
          replacementPolicy: p.replacementPolicy || "No",
          freeDelivery: p.freeDelivery || "No",
          returnPolicy: p.returnPolicy || "No",
          isCod: p.isCod || "Yes"
        })
        if (p.images) {
          const filename = p.images.replace(/\\/g, '/').split('/').pop()
          setExistingImgUrl(`http://localhost:5000/api/product/${filename}`)
        }
      } else {
        setErrorMsg("Product details not found.")
      }
    } catch (err) {
      console.error("Error fetching product details:", err)
      setErrorMsg("Failed to load existing product details.")
    } finally {
      setFetching(false)
    }
  }

  const handleFile = (file) => {
    if (!file) return
    setData(prev => ({ ...prev, picture: file }))
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setErrorMsg("")
  }

  const handleChange = (e) => {
    setErrorMsg("")
    const { name, value, type, files } = e.target
    if (type === "file") {
      handleFile(files[0])
    } else {
      setData(prev => {
        const next = { ...prev, [name]: value }
        // Auto update stock status if stock count changed
        if (name === "stock") {
          const num = parseInt(value) || 0
          next.stockStatus = num > 0 ? "inStock" : "outOfStock"
        }
        return next
      })
    }
  }

  const handlePolicyChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
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
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Dynamic pricing calculation preview
  const pricingCalculations = useMemo(() => {
    const actual = parseFloat(data.actualPrice) || 0
    const disc = parseFloat(data.discount) || 0
    const finalPrice = disc > 0 ? Math.round(actual - (actual * disc / 100)) : Math.round(actual)
    const savings = Math.max(0, Math.round(actual - finalPrice))
    return { actual, disc, finalPrice, savings }
  }, [data.actualPrice, data.discount])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")

    if (!data.name.trim()) {
      setErrorMsg("Product name is required.")
      return
    }
    if (!data.category) {
      setErrorMsg("Please select a category for this product.")
      return
    }
    if (!data.actualPrice || Number(data.actualPrice) <= 0) {
      setErrorMsg("Please provide a valid product price.")
      return
    }
    if (!data.stock || Number(data.stock) < 0) {
      setErrorMsg("Please provide valid stock quantity.")
      return
    }
    if (!isEdit && !data.picture) {
      setErrorMsg("Please select a product image.")
      return
    }

    setLoading(true)

    // Build FormData object
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (key === 'picture') {
        if (data.picture instanceof File) {
          formData.append('picture', data.picture)
        }
      } else {
        formData.append(key, data[key] ?? '')
      }
    })

    try {
      if (isEdit) {
        await axios.put(`http://localhost:5000/api/product/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
        setSuccessMsg("Product updated successfully!")
      } else {
        await axios.post("http://localhost:5000/api/product", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
        setSuccessMsg("Product added successfully!")
      }
      setTimeout(() => {
        navigate("/admin/dashboard/product")
      }, 700)
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.msg || err.response?.data?.message || (isEdit ? "Failed to update product." : "Failed to add product.")
      setErrorMsg(typeof msg === 'string' ? msg : "An error occurred while saving product.")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⏳</div>
        <p>Loading product catalog record…</p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Breadcrumb ── */}
      <div className="dash-breadcrumb">
        <Link to="/admin/dashboard">Dashboard</Link>
        <span className="dash-breadcrumb-sep">/</span>
        <Link to="/admin/dashboard/product">Products</Link>
        <span className="dash-breadcrumb-sep">/</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
          {isEdit ? "Edit Product" : "Add Product"}
        </span>
      </div>

      {/* ── Page Header ── */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">{isEdit ? "Edit" : "Add"} <span>Product</span></h1>
          <p className="dash-page-subtitle">
            {isEdit ? "Modify hardware specifications, pricing, stock, and media" : "Publish a new electronic item or hardware component to your store"}
          </p>
        </div>
        <Link to="/admin/dashboard/product" className="dash-btn-outline" style={{ textDecoration: "none" }}>
          ← Back to Catalog
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

      {/* ── Form Card ── */}
      <div className="dash-card" style={{ maxWidth: 900 }}>
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            {isEdit ? `Editing: ${data.name || "Product"}` : "Product Details & Specifications"}
          </h2>
          <span className="dash-badge-brand">{isEdit ? "Update Mode" : "New Item"}</span>
        </div>

        <div className="dash-card-body">
          <form onSubmit={handleSubmit} encType="multipart/form-data">

            {/* ══ SECTION 1: BASIC INFORMATION ══ */}
            <div className="dash-section-divider" style={{ marginTop: 0 }}>
              <span>📦</span> 1. Basic Information
            </div>

            <div className="dash-field-row">
              <div className="dash-field">
                <label htmlFor="name">Product Title / Name *</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={data.name}
                  onChange={handleChange}
                  placeholder="e.g. Raspberry Pi 5 - 8GB Starter Kit"
                  required
                />
              </div>

              <div className="dash-field">
                <label htmlFor="brandName">Brand Name *</label>
                <input
                  id="brandName"
                  type="text"
                  name="brandName"
                  value={data.brandName}
                  onChange={handleChange}
                  placeholder="e.g. Raspberry Pi, Arduino, Espressif"
                  required
                />
              </div>
            </div>

            <div className="dash-field-row">
              <div className="dash-field">
                <label htmlFor="category">Catalog Category *</label>
                <select
                  id="category"
                  name="category"
                  value={data.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a Category</option>
                  {categoryList.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dash-field">
                <label htmlFor="tag">Product Tag / Badge</label>
                <input
                  id="tag"
                  type="text"
                  name="tag"
                  value={data.tag}
                  onChange={handleChange}
                  placeholder="e.g. newArrival, featured, bestseller, hot"
                />
              </div>
            </div>

            {/* ══ SECTION 2: PRODUCT MEDIA ══ */}
            <div className="dash-section-divider">
              <span>🖼️</span> 2. Product Media &amp; Images
            </div>

            <div className="dash-field">
              <label>
                Product Image File {isEdit ? "(Optional - upload to replace current image)" : "*"}
              </label>

              <input
                ref={fileInputRef}
                id="picture"
                type="file"
                name="picture"
                accept="image/*"
                onChange={handleChange}
                style={{ display: "none" }}
              />

              <div
                className={`dash-upload-box${dragActive ? " drag-over" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>📸</div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.92rem" }}>
                  Click to choose file or drag &amp; drop product photo here
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
                  High-resolution PNG, JPG, or WEBP (Square or 4:3 recommended)
                </div>
              </div>

              {/* Live Preview of New Selected Image */}
              {previewUrl && (
                <div className="dash-preview-wrap">
                  <img src={previewUrl} alt="New Preview" className="dash-preview-img" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--accent)" }}>
                      NEW PRODUCT IMAGE SELECTED
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {data.picture?.name}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
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

              {/* Preview of Existing Image in Edit mode */}
              {!previewUrl && existingImgUrl && (
                <div className="dash-preview-wrap">
                  <img
                    src={existingImgUrl}
                    alt="Current Product"
                    className="dash-preview-img"
                    onError={(e) => {
                      e.target.style.display = "none"
                      e.target.parentElement.innerHTML += '<div style="font-size:0.8rem; color:var(--text-muted);">Current image preview unavailable</div>'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>
                      CURRENT ACTIVE PRODUCT IMAGE
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      To replace this photo, select a new file above.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ══ SECTION 3: PRICING & INVENTORY ══ */}
            <div className="dash-section-divider">
              <span>💰</span> 3. Pricing &amp; Stock Availability
            </div>

            <div className="dash-field-row">
              <div className="dash-field">
                <label htmlFor="actualPrice">Original Price (₹ INR) *</label>
                <input
                  id="actualPrice"
                  type="number"
                  min="0"
                  name="actualPrice"
                  value={data.actualPrice}
                  onChange={handleChange}
                  placeholder="e.g. 7499"
                  required
                />
              </div>

              <div className="dash-field">
                <label htmlFor="discount">Discount Percentage (%)</label>
                <input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  name="discount"
                  value={data.discount}
                  onChange={handleChange}
                  placeholder="e.g. 15"
                />
              </div>
            </div>

            {/* Live Pricing Calculator Preview Card */}
            {pricingCalculations.actual > 0 && (
              <div className="dash-calc-box">
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                    Customer Selling Price
                  </div>
                  <div style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--accent)", marginTop: 2 }}>
                    ₹{pricingCalculations.finalPrice.toLocaleString("en-IN")}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Original MRP</div>
                    <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textDecoration: pricingCalculations.disc > 0 ? "line-through" : "none" }}>
                      ₹{pricingCalculations.actual.toLocaleString("en-IN")}
                    </div>
                  </div>

                  {pricingCalculations.disc > 0 && (
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Discount Applied</div>
                      <div style={{ fontSize: "0.9rem", color: "#28a745", fontWeight: 700 }}>
                        {pricingCalculations.disc}% OFF (Save ₹{pricingCalculations.savings.toLocaleString("en-IN")})
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="dash-field-row">
              <div className="dash-field">
                <label htmlFor="stock">Total Stock Quantity *</label>
                <input
                  id="stock"
                  type="number"
                  min="0"
                  name="stock"
                  value={data.stock}
                  onChange={handleChange}
                  placeholder="e.g. 100"
                  required
                />
              </div>

              <div className="dash-field">
                <label htmlFor="stockStatus">Stock Availability Status *</label>
                <select
                  id="stockStatus"
                  name="stockStatus"
                  value={data.stockStatus}
                  onChange={handleChange}
                  required
                >
                  <option value="inStock">In Stock (Available to Order)</option>
                  <option value="outOfStock">Out Of Stock (Sold Out)</option>
                </select>
              </div>
            </div>

            {/* ══ SECTION 4: TECHNICAL SPECIFICATIONS & DIMENSIONS ══ */}
            <div className="dash-section-divider">
              <span>📐</span> 4. Technical Specifications &amp; Details
            </div>

            <div className="dash-field-row">
              <div className="dash-field">
                <label htmlFor="height">Height Dimension</label>
                <input
                  id="height"
                  type="text"
                  name="height"
                  value={data.height}
                  onChange={handleChange}
                  placeholder="e.g. 85mm"
                />
              </div>

              <div className="dash-field">
                <label htmlFor="width">Width Dimension</label>
                <input
                  id="width"
                  type="text"
                  name="width"
                  value={data.width}
                  onChange={handleChange}
                  placeholder="e.g. 56mm"
                />
              </div>
            </div>

            <div className="dash-field">
              <label htmlFor="attributes">Technical Attributes / Chipset Specs</label>
              <input
                id="attributes"
                type="text"
                name="attributes"
                value={data.attributes}
                onChange={handleChange}
                placeholder="e.g. Broadcom BCM2712, 8GB LPDDR4X, Dual 4Kp60 HDMI, PCIe 2.0"
              />
            </div>

            <div className="dash-field">
              <label htmlFor="description">Detailed Description *</label>
              <textarea
                id="description"
                name="description"
                value={data.description}
                onChange={handleChange}
                placeholder="Describe key features, pin diagrams, operating voltages, use cases, package contents..."
                rows="5"
                style={{
                  width: "100%",
                  background: "var(--dash-input-bg)",
                  border: "1.5px solid var(--dash-input-border)",
                  borderRadius: 10,
                  padding: "0.75rem 1rem",
                  fontSize: "0.9rem",
                  color: "var(--text-primary)",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "var(--font-body)"
                }}
                required
              />
            </div>

            {/* ══ SECTION 5: POLICIES & OPTIONS ══ */}
            <div className="dash-section-divider">
              <span>🛡️</span> 5. Store Policies &amp; Options
            </div>

            <div className="row g-3">
              {[
                { field: "isCod", label: "Cash On Delivery (COD)", icon: "💵" },
                { field: "freeDelivery", label: "Free Delivery Eligible", icon: "🚚" },
                { field: "refundPolicy", label: "Refund Policy Supported", icon: "🛡️" },
                { field: "replacementPolicy", label: "Replacement Policy", icon: "🔄" },
                { field: "returnPolicy", label: "Return Policy Supported", icon: "📦" },
              ].map(({ field, label, icon }) => (
                <div className="col-12 col-sm-6 col-md-4" key={field}>
                  <div style={{ marginBottom: "0.35rem", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                    {icon} {label}
                  </div>
                  <div className="dash-policy-tile">
                    <div
                      className={`dash-policy-opt ${data[field] === "Yes" ? "active" : "inactive"}`}
                      onClick={() => handlePolicyChange(field, "Yes")}
                    >
                      Yes
                    </div>
                    <div
                      className={`dash-policy-opt ${data[field] === "No" ? "active" : "inactive"}`}
                      onClick={() => handlePolicyChange(field, "No")}
                    >
                      No
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ══ SUBMIT ACTIONS ══ */}
            <div style={{ display: "flex", gap: "0.85rem", marginTop: "2.5rem", alignItems: "center" }}>
              <button type="submit" className="dash-btn-primary" disabled={loading}>
                {loading ? "Processing…" : (isEdit ? "💾 Update Product" : "➕ Publish Product")}
              </button>
              <button
                type="button"
                className="dash-btn-outline"
                onClick={() => navigate("/admin/dashboard/product")}
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

export default AddProduct