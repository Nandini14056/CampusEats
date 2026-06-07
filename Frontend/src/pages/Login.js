import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export default function Login() {
  const [params] = useSearchParams();
  const role = params.get('role') || 'customer';
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleLabels = { customer: 'Customer', seller: 'Seller / Restaurant', delivery: 'Delivery Partner' };
  const roleIcons = { customer: '🛍️', seller: '🏪', delivery: '🛵' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'seller') navigate('/seller');
      else if (user.role === 'delivery') navigate('/delivery');
      else navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <span>🍽️</span>
          <span className={styles.brandName}>Campus <em>Canteen</em></span>
        </div>
        <h1>Good to see<br />you again! 👋</h1>
        <p>Your favourite campus food is just a few clicks away.</p>
      </div>
      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.rolePill}>{roleIcons[role]} {roleLabels[role]}</div>
          <h2 className={styles.title}>Welcome Back!</h2>
          <p className={styles.subtitle}>Sign in to your account</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="form-input-icon">
                <span className="icon">✉️</span>
                <input className="form-input" type="email" placeholder="your@college.edu"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-icon">
                <span className="icon">🔒</span>
                <input className="form-input" type="password" placeholder="Enter your password"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div className={styles.forgot}><a href="#!">Forgot password?</a></div>
            </div>
            {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className={styles.switchLink}>
            Don't have an account?{' '}
            <Link to={`/register?role=${role}`}>Sign Up</Link>
          </p>
          <div className={styles.backLink} onClick={() => navigate('/')}>← Back to role selection</div>
        </div>
      </div>
    </div>
  );
}
