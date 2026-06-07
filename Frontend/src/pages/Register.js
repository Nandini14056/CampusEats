import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export default function Register() {
  const [params] = useSearchParams();
  const role = params.get('role') || 'customer';
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', restaurantName: '', block: 'Block A' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleIcons = { customer: '🛍️', seller: '🏪', delivery: '🛵' };
  const roleLabels = { customer: 'Customer', seller: 'Seller / Restaurant', delivery: 'Delivery Partner' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      toast.success(`Welcome to CampusEats, ${user.name}!`);
      if (user.role === 'seller') navigate('/seller/subscription');
      else if (user.role === 'delivery') navigate('/delivery');
      else navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}><span>🍽️</span><span className={styles.brandName}>Campus <em>Canteen</em></span></div>
        <h1>Join us<br />today! 🎓</h1>
        <p>Create your account and start ordering from campus restaurants in minutes.</p>
      </div>
      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.rolePill}>{roleIcons[role]} {roleLabels[role]}</div>
          <h2 className={styles.title}>Create Account</h2>
          <p className={styles.subtitle}>Fill in your details to get started</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">College Email</label>
              <input className="form-input" type="email" placeholder="your@college.edu" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input className="form-input" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} required />
            </div>
            {role === 'seller' && (
              <div className="form-group">
                <label className="form-label">Restaurant / Canteen Name</label>
                <input className="form-input" type="text" placeholder="e.g. Campus Dhaba" value={form.restaurantName} onChange={e => set('restaurantName', e.target.value)} required />
              </div>
            )}
            {role === 'customer' && (
              <div className="form-group">
                <label className="form-label">Your Block / Location</label>
                <select className="form-input form-select" value={form.block} onChange={e => set('block', e.target.value)}>
                  {['Block A','Block B','Block C','Hostel 1','Hostel 2','Library','Sports Complex'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Create a strong password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
            </div>
            {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className={styles.switchLink}>Already have an account? <Link to={`/login?role=${role}`}>Sign In</Link></p>
          <div className={styles.backLink} onClick={() => navigate('/')}>← Back to role selection</div>
        </div>
      </div>
    </div>
  );
}
