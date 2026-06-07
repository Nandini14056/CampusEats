import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SelectRole.module.css';

const roles = [
  { id: 'customer', icon: '🛍️', title: 'Customer', desc: 'Browse restaurants, order food & track delivery in real time' },
  { id: 'seller', icon: '🏪', title: 'Seller / Restaurant', desc: 'List your menu, manage orders & grow your campus food business' },
  { id: 'delivery', icon: '🛵', title: 'Delivery Partner', desc: 'Accept deliveries, navigate with GPS & track your earnings' },
];

export default function SelectRole() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🍽️</span>
          <div>
            <div className={styles.brandName}>Campus <span>Canteen</span></div>
            <div className={styles.brandTag}>Campus Delivery Platform</div>
          </div>
        </div>
        <h1 className={styles.headline}>Fresh food,<br />delivered fast 🚀</h1>
        <p className={styles.sub}>Order from campus canteens & restaurants. Track live. Enjoy fresh.</p>
        <div className={styles.stats}>
          <div className={styles.stat}><strong>500+</strong><span>Orders daily</span></div>
          <div className={styles.stat}><strong>15 min</strong><span>Avg delivery</span></div>
          <div className={styles.stat}><strong>4.8 ⭐</strong><span>Avg rating</span></div>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Welcome! Who are you?</h2>
          <p className={styles.cardSub}>Select your role to get started</p>
          <div className={styles.roles}>
            {roles.map(r => (
              <div key={r.id} className={styles.roleCard} onClick={() => navigate(`/login?role=${r.id}`)}>
                <span className={styles.roleIcon}>{r.icon}</span>
                <div>
                  <div className={styles.roleName}>{r.title}</div>
                  <div className={styles.roleDesc}>{r.desc}</div>
                </div>
                <span className={styles.arrow}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
