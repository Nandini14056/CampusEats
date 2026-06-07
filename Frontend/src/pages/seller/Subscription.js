import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import styles from './Subscription.module.css';

export default function SellerSubscription() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('monthly');

  const plans = [
    {
      id: 'monthly',
      icon: '📅',
      name: 'Monthly Flat',
      price: '₹499',
      period: 'per month, fixed',
      popular: true,
      features: [
        'Unlimited product listings',
        '0% commission on sales',
        'Priority placement in feed',
        'Full analytics dashboard',
        'Priority customer support',
        'Custom restaurant profile',
      ],
      detail: 'Pay a fixed ₹499 every month. Best for sellers with consistent high revenue. Break-even at just ₹4,990/month in sales if you save on 10% commission.',
      tip: '💡 Most popular among campus sellers',
    },
    {
      id: 'revenue_share',
      icon: '💰',
      name: 'Revenue Share',
      price: '10%',
      period: 'of monthly income only',
      popular: false,
      features: [
        'No upfront cost',
        'Pay only when you earn',
        'Unlimited product listings',
        'Standard listing placement',
        'Basic analytics',
        'Email support',
      ],
      detail: 'No upfront cost — CampusEats deducts 10% of what you earn each month. Perfect for new sellers or those just starting out.',
      tip: '💡 If you earn ₹3,000/month, you pay just ₹300',
    },
  ];

  const selectedPlan = plans.find(p => p.id === selected);

  const handleContinue = () => {
    if (selected === 'monthly') {
      navigate('/seller/payment', { state: { plan: selected } });
    } else {
      // Revenue share — no payment, activate directly
      navigate('/seller/payment', { state: { plan: selected } });
    }
  };

  return (
    <div className="page">
      {user?.subscription?.isActive && <Sidebar />}
      <main className={user?.subscription?.isActive ? 'main-content' : ''} style={{ padding: '40px 28px', maxWidth: 860, margin: '0 auto', width: '100%' }}>
        <div className={styles.intro}>
          <div className={styles.introIcon}>🚀</div>
          <h1 className={styles.introTitle}>Choose Your Plan</h1>
          <p className={styles.introSub}>Pick a subscription that fits your business. No hidden fees, cancel anytime.</p>
        </div>

        <div className={styles.plansGrid}>
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`${styles.planCard} ${selected === plan.id ? styles.planSelected : ''} ${plan.popular ? styles.planPopular : ''}`}
              onClick={() => setSelected(plan.id)}
            >
              {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}
              <div className={styles.planIcon}>{plan.icon}</div>
              <div className={styles.planName}>{plan.name}</div>
              <div className={styles.planPrice}>{plan.price}</div>
              <div className={styles.planPeriod}>{plan.period}</div>
              <ul className={styles.planFeats}>
                {plan.features.map(f => <li key={f}><span className={styles.check}>✓</span>{f}</li>)}
              </ul>
              <div className={`${styles.planRadio} ${selected === plan.id ? styles.planRadioSelected : ''}`}>
                {selected === plan.id && <div className={styles.planRadioDot} />}
              </div>
            </div>
          ))}
        </div>

        {selectedPlan && (
          <div className={styles.detailBox}>
            <div className={styles.detailHeader}>
              <span>{selectedPlan.icon}</span>
              <strong>{selectedPlan.name}</strong>
            </div>
            <p className={styles.detailText}>{selectedPlan.detail}</p>
            <div className={styles.detailTip}>{selectedPlan.tip}</div>
          </div>
        )}

        <button className={`btn btn-primary btn-full btn-lg ${styles.ctaBtn}`} onClick={handleContinue}>
          Continue with {selectedPlan?.name} →
        </button>

        {user?.subscription?.isActive && (
          <button className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => navigate('/seller')}>
            ← Back to Dashboard
          </button>
        )}
      </main>
    </div>
  );
}
