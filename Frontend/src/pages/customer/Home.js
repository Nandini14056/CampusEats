import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import styles from './Home.module.css';

const CATEGORIES = ['Canteen','South Indian','North Indian','Snacks','Beverages','Café','Desserts'];

// ── Category metadata: icon emoji + real food image from Unsplash (free, no auth) ──
const CAT_META = {
  'All':        { emoji:'🍽️', img:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=120&h=120&fit=crop&auto=format' },
  'Canteen':    { emoji:'🍽️', img:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=120&h=120&fit=crop&auto=format' },
  'South Indian':{ emoji:'🫔', img:'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=120&h=120&fit=crop&auto=format' },
  'North Indian':{ emoji:'🍛', img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=120&h=120&fit=crop&auto=format' },
  'Snacks':     { emoji:'🍟', img:'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=120&h=120&fit=crop&auto=format' },
  'Beverages':  { emoji:'🥤', img:'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=120&h=120&fit=crop&auto=format' },
  'Café':       { emoji:'☕', img:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=120&h=120&fit=crop&auto=format' },
  'Desserts':   { emoji:'🍰', img:'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=120&h=120&fit=crop&auto=format' },
};

// ── Fallback food images by category (shown when product has no image) ──────────
const FALLBACK_IMAGES = {
  'Canteen':    [
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=400&h=300&fit=crop&auto=format',
  ],
  'South Indian': [
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop&auto=format',
  ],
  'North Indian': [
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&h=300&fit=crop&auto=format',
  ],
  'Snacks': [
    'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400&h=300&fit=crop&auto=format',
  ],
  'Beverages': [
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=400&h=300&fit=crop&auto=format',
  ],
  'Café': [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&auto=format',
  ],
  'Desserts': [
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&h=300&fit=crop&auto=format',
  ],
};

// Pick a stable fallback based on product name hash so same product always gets same image
function getFallbackImage(product) {
  const pool = FALLBACK_IMAGES[product.category] || FALLBACK_IMAGES['Canteen'];
  const idx = product.name.charCodeAt(0) % pool.length;
  return pool[idx];
}

export default function CustomerHome() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchProducts(); }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'all') params.category = category;
      if (search) params.search = search;
      const { data } = await api.get('/products', { params });
      setProducts(data);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); fetchProducts(); };

  const mostOrdered = products.filter(p => p.rating >= 4.5).slice(0, 6);
  const fastDelivery = products.filter(p => p.prepTime <= 15).slice(0, 6);

  return (
    <div className="page">
      <Sidebar />
      <main className={`main-content ${styles.main}`}>
        {/* Navbar */}
        <header className={styles.navbar}>
          <form className={styles.searchBar} onSubmit={handleSearch}>
            <span className={styles.searchIcon}>🔍</span>
            <input type="text" placeholder="Search for food, drinks, or snacks"
              value={search} onChange={e => setSearch(e.target.value)} />
            <button type="submit" className={styles.micBtn}>🎤</button>
          </form>
          <div className={styles.navRight}>
            <div className={styles.locationBtn}>
              <span className={styles.locationDot}>📍</span>
              <span>{user?.block || 'Block A'}</span>
              <span className={styles.chevron}>▾</span>
            </div>
            <div className={styles.userBtn}>
              <div className={styles.userAvatar}>{user?.name?.slice(0,2).toUpperCase()}</div>
              <span>Hi, {user?.name?.split(' ')[0]}</span>
              <span className={styles.chevron}>▾</span>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          {/* Categories with real images */}
          <div className={styles.categoriesWrap}>
            <CategoryChip label="All" active={category==='all'} onClick={() => setCategory('all')} />
            {CATEGORIES.map(c => (
              <CategoryChip key={c} label={c} active={category===c} onClick={() => setCategory(c)} />
            ))}
          </div>

          {loading ? (
            <div className={styles.loadingWrap}>
              <div className={styles.skeletonGrid}>
                {[...Array(8)].map((_,i) => <div key={i} className={styles.skeleton} />)}
              </div>
            </div>
          ) : (
            <>
              {/* Most Ordered */}
              {mostOrdered.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Most Ordered Today</h2>
                  <div className={styles.productRow}>
                    {mostOrdered.map(p => (
                      <ProductCard key={p._id} product={p}
                        onAdd={() => { addToCart(p); toast.success(`${p.name} added to cart!`); }} />
                    ))}
                  </div>
                </section>
              )}

              {/* Fast Delivery */}
              {fastDelivery.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    Fast Delivery <span className={styles.tag}>(Under 15 mins)</span>
                  </h2>
                  <div className={styles.productRow}>
                    {fastDelivery.map(p => (
                      <ProductCard key={p._id} product={p} fast
                        onAdd={() => { addToCart(p); toast.success(`${p.name} added to cart!`); }} />
                    ))}
                  </div>
                </section>
              )}

              {/* All Products */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{category === 'all' ? 'All Items' : category}</h2>
                {products.length === 0 ? (
                  <div className={styles.empty}>
                    <span>🍽️</span>
                    <p>No products found in this category.</p>
                  </div>
                ) : (
                  <div className={styles.productGrid}>
                    {products.map(p => (
                      <ProductCard key={p._id} product={p} wide
                        onAdd={() => { addToCart(p); toast.success(`${p.name} added to cart!`); }} />
                    ))}
                  </div>
                )}
              </section>

              {/* Offers */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Offers &amp; Combos</h2>
                <div className={styles.offersRow}>
                  <div className={styles.offerCard} style={{background:'linear-gradient(135deg,#E8F5F3,#D4EBE7)'}}>
                    <span className={styles.offerIcon}>🏷️</span>
                    <div>
                      <strong>Flat 20% Off</strong>
                      <p>On orders above ₹200</p>
                      <span className={styles.offerCode}>USE CODE FOOD20</span>
                    </div>
                  </div>
                  <div className={styles.offerCard} style={{background:'linear-gradient(135deg,#FEF9E7,#FEF3C7)'}}>
                    <span className={styles.offerIcon}>🍱</span>
                    <div>
                      <strong>Meal Combo</strong>
                      <p>Dosa + Drink @ ₹90</p>
                      <button className="btn btn-primary btn-sm" style={{marginTop:6}}>Order Now</button>
                    </div>
                  </div>
                  <div className={styles.offerCard} style={{background:'linear-gradient(135deg,#F0F4FF,#E0E7FF)'}}>
                    <span className={styles.offerIcon}>🛵</span>
                    <div>
                      <strong>Free Delivery</strong>
                      <p>Above ₹150</p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Category chip with image ─────────────────────────────────────────────────
function CategoryChip({ label, active, onClick }) {
  const meta = CAT_META[label] || { emoji:'🍽️', img:'' };
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className={`${styles.catChip} ${active ? styles.catActive : ''}`} onClick={onClick}>
      <div className={styles.catImgWrap}>
        {!imgErr && meta.img ? (
          <img src={meta.img} alt={label} className={styles.catImg} onError={() => setImgErr(true)} />
        ) : (
          <span className={styles.catEmoji}>{meta.emoji}</span>
        )}
      </div>
      <span className={styles.catLabel}>{label}</span>
    </div>
  );
}

// ── Product card with smart image fallback ────────────────────────────────────
function ProductCard({ product: p, onAdd, fast, wide }) {
  const [added, setAdded] = useState(false);
  const [imgSrc, setImgSrc] = useState(p.image || null);
  const [imgErr, setImgErr] = useState(false);
  const fallback = getFallbackImage(p);

  const handleAdd = () => { onAdd(); setAdded(true); setTimeout(() => setAdded(false), 1200); };

  // If the stored image URL fails, fall back to category-based Unsplash image
  const handleImgError = () => {
    if (!imgErr) { setImgErr(true); setImgSrc(fallback); }
  };

  const displayImg = imgSrc && !imgErr ? imgSrc : (imgErr ? fallback : fallback);

  return (
    <div className={`${styles.productCard} ${wide ? styles.productCardWide : ''}`}>
      <div className={styles.productImgWrap}>
        <img
          src={displayImg}
          alt={p.name}
          className={styles.productImg}
          onError={handleImgError}
          loading="lazy"
        />
        {p.availableQty <= 5 && p.availableQty > 0 && (
          <div className={styles.lowStock}>Only {p.availableQty} left!</div>
        )}
      </div>
      <div className={styles.productInfo}>
        <div className={styles.productName}>{p.name}</div>
        {p.description && <div className={styles.productDesc}>{p.description}</div>}
        <div className={styles.productMeta}>
          <span className={styles.productPrice}>₹ {p.price}</span>
          {(fast || p.prepTime <= 15) && p.prepTime && (
            <span className={styles.timePill}>🕐 {p.prepTime} mins</span>
          )}
        </div>
        <div className={styles.productFooter}>
          <div className={styles.ratingRow}>
            <span className={styles.star}>⭐</span>
            <span className={styles.ratingVal}>{p.rating > 0 ? p.rating.toFixed(1) : '4.0'}</span>
          </div>
          <button
            className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
            onClick={handleAdd}
          >
            {added ? '✓ Added' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
