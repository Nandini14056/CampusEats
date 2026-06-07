import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RazorpayModal from '../../components/RazorpayModal';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import styles from './Payment.module.css';

export default function SellerPayment() {
  const { state }         = useLocation();
  const plan              = state?.plan || 'monthly';
  const isMonthly         = plan === 'monthly';
  const { user, updateUser } = useAuth();
  const navigate          = useNavigate();

  const [showRzp, setShowRzp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid]       = useState(false);
  const [txnId, setTxnId]     = useState('');

  // ── Revenue Share: free, no payment modal needed ─────────────────────────
  const activateFree = async () => {
    setLoading(true);
    try {
      await api.post('/subscription/activate', { plan: 'revenue_share', paymentMethod: 'free', transactionId: `FREE_${Date.now()}` });
      updateUser({ subscription: { plan:'revenue_share', isActive:true } });
      setPaid(true);
      toast.success('Revenue Share plan activated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Activation failed');
    } finally { setLoading(false); }
  };

  // ── Monthly: open our custom Razorpay-like modal ──────────────────────────
  const openPaymentModal = () => setShowRzp(true);

  // ── Called after simulated payment success ────────────────────────────────
  const handlePaymentSuccess = async (generatedTxnId) => {
    setShowRzp(false);
    setLoading(true);
    try {
      await api.post('/subscription/activate', {
        plan: 'monthly',
        paymentMethod: 'online',
        transactionId: generatedTxnId,
      });
      updateUser({ subscription: { plan:'monthly', isActive:true } });
      setTxnId(generatedTxnId);
      setPaid(true);
      toast.success('Payment successful! Monthly plan activated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Activation failed');
    } finally { setLoading(false); }
  };

  const handlePaymentDismiss = () => {
    setShowRzp(false);
    toast('Payment cancelled', { icon: '⚠️' });
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (paid) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>🎉</div>
          <h2 className={styles.successTitle}>{isMonthly ? 'Payment Successful!' : 'Plan Activated!'}</h2>
          <p className={styles.successSub}>
            {isMonthly
              ? 'Monthly Flat plan (₹499/month) is now active. Start listing your products!'
              : 'Revenue Share plan (10% of monthly earnings) is now active!'}
          </p>
          <div className={styles.successDetails}>
            <div className={styles.successRow}><span>Plan</span><span>{isMonthly ? 'Monthly Flat' : 'Revenue Share'}</span></div>
            {isMonthly && <div className={styles.successRow}><span>Amount Paid</span><span style={{color:'var(--primary-dark)',fontWeight:700}}>₹ 499</span></div>}
            <div className={styles.successRow}>
              <span>Valid Until</span>
              <span>{new Date(Date.now()+30*24*60*60*1000).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</span>
            </div>
            {txnId && <div className={styles.successRow}><span>Transaction ID</span><span style={{fontSize:11,fontFamily:'monospace'}}>{txnId}</span></div>}
          </div>
          <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/seller/products/add')}>
            ➕ Add Your First Product
          </button>
          <button className="btn btn-ghost btn-full" style={{marginTop:8}} onClick={() => navigate('/seller')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Payment page ───────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Left summary */}
      <div className={styles.left}>
        <div className={styles.brand}><span>🍽️</span><span className={styles.brandName}>Campus <em>Canteen</em></span></div>
        <h2 className={styles.leftTitle}>{isMonthly ? 'Complete Payment' : 'Activate Plan'}</h2>

        <div className={styles.orderBox}>
          <h3>Order Summary</h3>
          <div className={styles.sumRow}><span>{isMonthly ? 'Monthly Flat Subscription' : 'Revenue Share Plan'}</span><span>{isMonthly ? '₹499' : 'Free'}</span></div>
          {isMonthly && <>
            <div className={styles.sumRow}><span>GST (18%)</span><span>Included</span></div>
            <div className={`${styles.sumRow} ${styles.sumTotal}`}><span>Total</span><span>₹499</span></div>
          </>}
          <div className={styles.planHl}>
            <span>{isMonthly ? '📅' : '💰'}</span>
            <div>
              <strong>{isMonthly ? 'Monthly Flat · ₹499/mo' : 'Revenue Share · 10%'}</strong>
              <p>Valid 30 days · Cancel anytime</p>
            </div>
          </div>
        </div>

        <div className={styles.secureNote}>🔒 Payments secured by Razorpay</div>
      </div>

      {/* Right action */}
      <div className={styles.right}>
        <div className={styles.payCard}>
          {isMonthly ? (
            <>
              <h2 className={styles.payTitle}>Pay ₹499 via Razorpay</h2>
              <p className={styles.payDesc}>
                Razorpay supports UPI, all credit / debit cards, net banking, and wallets — all in one secure checkout.
              </p>

              <div className={styles.methodIcons}>
                {['📱 UPI', '💳 Cards', '🏦 Net Banking', '👛 Wallets'].map(m => (
                  <div key={m} className={styles.methodChip}>{m}</div>
                ))}
              </div>

              <div className={styles.rzpFeatures}>
                <div className={styles.rzpFeat}><span>🔒</span> 256-bit SSL encryption</div>
                <div className={styles.rzpFeat}><span>✅</span> PCI DSS compliant</div>
                <div className={styles.rzpFeat}><span>⚡</span> Instant activation on payment</div>
              </div>

              <button className="btn btn-primary btn-full btn-lg" onClick={openPaymentModal} style={{marginTop:24}}>
                💳 Pay ₹499 via Razorpay
              </button>
              <p style={{fontSize:11,color:'var(--text-light)',textAlign:'center',marginTop:8}}>
                A secure Razorpay checkout will open
              </p>
            </>
          ) : (
            <>
              <div className={styles.freeSection}>
                <span>🎉</span>
                <h3>No Payment Required!</h3>
                <p>Revenue Share has no upfront cost. We only deduct <strong>10%</strong> of your monthly earnings automatically.</p>
                <div className={styles.example}>
                  <strong>How it works:</strong>
                  <div>Earn ₹5,000/month → Pay ₹500</div>
                  <div>Earn ₹10,000/month → Pay ₹1,000</div>
                  <div>Earn ₹0 → Pay ₹0</div>
                </div>
              </div>
              <button className="btn btn-primary btn-full btn-lg" onClick={activateFree} disabled={loading}>
                {loading ? 'Activating...' : 'Activate Revenue Share Plan'}
              </button>
            </>
          )}

          <button className="btn btn-ghost btn-full" style={{marginTop:10}} onClick={() => navigate('/seller/subscription')}>
            ← Change Plan
          </button>
        </div>
      </div>

      {/* Custom Razorpay modal for subscription payment */}
      {showRzp && (
        <RazorpayModal
          amount={499}
          orderId={`SUB_${user._id?.slice(-6)?.toUpperCase()}`}
          customerName={user.name}
          customerEmail={user.email}
          customerPhone={user.phone}
          onSuccess={handlePaymentSuccess}
          onDismiss={handlePaymentDismiss}
        />
      )}
    </div>
  );
}
