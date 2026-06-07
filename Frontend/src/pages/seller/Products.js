import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import styles from './Products.module.css';

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products/seller').then(r => { setProducts(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggleAvailability = async (id, current) => {
    try {
      await api.patch(`/products/${id}`, { isAvailable: !current });
      setProducts(p => p.map(x => x._id === id ? { ...x, isAvailable: !current } : x));
      toast.success(`Product ${!current ? 'enabled' : 'disabled'}`);
    } catch { toast.error('Update failed'); }
  };

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(p => p.filter(x => x._id !== id));
      toast.success('Product deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="page">
      <Sidebar />
      <main className={`main-content ${styles.main}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Products 🍱</h1>
          <button className="btn btn-primary" onClick={() => navigate('/seller/products/add')}>+ Add Product</button>
        </div>

        {loading ? <div style={{display:'flex',justifyContent:'center',padding:60}}><div className="spinner"/></div>
          : products.length === 0 ? (
            <div className={styles.empty}>
              <span>🍱</span>
              <h3>No products yet</h3>
              <p>Add your first product to start selling on CampusEats</p>
              <button className="btn btn-primary" onClick={() => navigate('/seller/products/add')}>+ Add First Product</button>
            </div>
          ) : (
            <div className={styles.grid}>
              {products.map(p => (
                <div key={p._id} className={`${styles.card} ${!p.isAvailable ? styles.cardDisabled : ''}`}>
                  <div className={styles.cardImg}>
                    <img
                      src={p.image || `https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop&auto=format`}
                      alt={p.name}
                      style={{width:'100%',height:'100%',objectFit:'cover'}}
                      onError={e => { e.target.onerror=null; e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                    />
                    <span style={{display:'none',alignItems:'center',justifyContent:'center',fontSize:48,width:'100%',height:'100%'}}>🍽️</span>
                    <div className={`${styles.availBadge} ${p.isAvailable ? styles.availOn : styles.availOff}`}>
                      {p.isAvailable ? 'Available' : 'Unavailable'}
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardName}>{p.name}</div>
                    <div className={styles.cardCat}>{p.category}</div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardPrice}>₹ {p.price}</span>
                      <span className={styles.cardQty}>Qty: {p.availableQty}</span>
                      {p.rating > 0 && <span className="stars">⭐ {p.rating.toFixed(1)}</span>}
                    </div>
                    <div className={styles.cardActions}>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleAvailability(p._id, p.isAvailable)}>
                        {p.isAvailable ? '🔴 Disable' : '🟢 Enable'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p._id, p.name)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </main>
    </div>
  );
}
