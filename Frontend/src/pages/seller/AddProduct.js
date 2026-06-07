import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import styles from './AddProduct.module.css';

const CATEGORIES = ['Canteen','South Indian','North Indian','Snacks','Beverages','Café','Desserts'];

export default function SellerAddProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: '', description: '', price: '', category: 'Canteen',
    availableQty: '', prepTime: '15',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = ev => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) { toast.error('Please add a product image'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('image', imageFile);
      await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${form.name} added to your menu!`);
      navigate('/seller/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <Sidebar />
      <main className={`main-content ${styles.main}`}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/seller/products')}>←</button>
          <div>
            <h1 className={styles.title}>Add Product</h1>
            <p className={styles.subtitle}>Add a new item to today's menu</p>
          </div>
        </div>

        <form className={styles.formLayout} onSubmit={handleSubmit}>
          {/* Left — image */}
          <div className={styles.imageSection}>
            <label className={styles.sectionLabel}>Product Image *</label>
            <div
              className={`${styles.dropZone} ${imagePreview ? styles.dropZoneHasImg : ''}`}
              onClick={() => fileRef.current.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="preview" className={styles.previewImg} />
                  <div className={styles.changeOverlay}>
                    <span>📷</span>
                    <span>Change Image</span>
                  </div>
                </>
              ) : (
                <div className={styles.dropPlaceholder}>
                  <span className={styles.dropIcon}>📷</span>
                  <p className={styles.dropText}>Click or drag & drop to upload</p>
                  <p className={styles.dropHint}>JPG, PNG, WebP · Max 5MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />

            {imagePreview && (
              <button type="button" className={styles.removeImg}
                onClick={() => { setImageFile(null); setImagePreview(null); }}>
                ✕ Remove image
              </button>
            )}

            <div className={styles.tips}>
              <h4>📸 Photo Tips</h4>
              <ul>
                <li>Use bright, natural lighting</li>
                <li>Square or landscape works best</li>
                <li>Show the full portion clearly</li>
                <li>Avoid blurry or dark images</li>
              </ul>
            </div>
          </div>

          {/* Right — details */}
          <div className={styles.detailsSection}>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input className="form-input" type="text" placeholder="e.g. Masala Dosa, Veg Biryani"
                value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} placeholder="Brief description of the dish..."
                value={form.description} onChange={e => set('description', e.target.value)}
                style={{ resize: 'vertical' }} />
            </div>

            <div className={styles.twoCol}>
              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input className="form-input" type="number" min="1" placeholder="e.g. 60"
                  value={form.price} onChange={e => set('price', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Today's Quantity *</label>
                <input className="form-input" type="number" min="1" placeholder="e.g. 50"
                  value={form.availableQty} onChange={e => set('availableQty', e.target.value)} required />
              </div>
            </div>

            <div className={styles.twoCol}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-input form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Prep Time (mins)</label>
                <input className="form-input" type="number" min="1" max="60" placeholder="15"
                  value={form.prepTime} onChange={e => set('prepTime', e.target.value)} />
              </div>
            </div>

            {/* Preview Card */}
            {form.name && (
              <div className={styles.previewCard}>
                <div className={styles.previewCardLabel}>Preview</div>
                <div className={styles.previewCardInner}>
                  <div className={styles.previewCardImg}>
                    {imagePreview ? <img src={imagePreview} alt="prev" /> : <span>🍽️</span>}
                  </div>
                  <div className={styles.previewCardInfo}>
                    <div className={styles.previewCardName}>{form.name || 'Product Name'}</div>
                    {form.description && <div className={styles.previewCardDesc}>{form.description}</div>}
                    <div className={styles.previewCardMeta}>
                      {form.price && <span className={styles.previewPrice}>₹ {form.price}</span>}
                      {form.prepTime && <span className={styles.previewTime}>🕐 {form.prepTime} mins</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/seller/products')}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Adding product...' : '✓ Add to Menu'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
