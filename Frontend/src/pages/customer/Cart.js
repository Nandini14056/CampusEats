import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import RazorpayModal from '../../components/RazorpayModal';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import styles from './Cart.module.css';

export default function CustomerCart() {
  const { cart, changeQty, clearCart, subtotal, deliveryFee, tax, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [payMethod, setPayMethod] = useState('online');
  const [loading, setLoading]     = useState(false);
  const [showRzp, setShowRzp]     = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);

  // ── COD: place order directly ─────────────────────────────────────────────
  const placeCodOrder = async () => {
    setLoading(true);
    try {
      const { data: order } = await api.post('/orders', {
        items: cart.map(i => ({ productId: i.productId, qty: i.qty })),
        paymentMethod: 'cod',
        deliveryAddress: user.address || user.block || 'Campus',
        deliveryBlock: user.block || 'Block A',
      });
      clearCart();
      toast.success('Order placed! Pay cash on delivery.');
      navigate(`/track/${order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally { setLoading(false); }
  };

  // ── Online: create order, then open our custom Razorpay UI ───────────────
  const initiateOnlinePayment = async () => {
    setLoading(true);
    try {
      const { data: order } = await api.post('/orders', {
        items: cart.map(i => ({ productId: i.productId, qty: i.qty })),
        paymentMethod: 'upi',
        deliveryAddress: user.address || user.block || 'Campus',
        deliveryBlock: user.block || 'Block A',
      });
      setPendingOrderId(order._id);
      setShowRzp(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally { setLoading(false); }
  };

  // ── Razorpay modal success callback ──────────────────────────────────────
  const handlePaymentSuccess = async (txnId) => {
    setShowRzp(false);
    try {
      // Mark order as paid in our DB (simulated verify)
      await api.patch(`/payment/confirm-order`, { orderId: pendingOrderId, txnId });
      clearCart();
      toast.success('Payment successful! Order confirmed 🎉');
      navigate(`/track/${pendingOrderId}`);
    } catch {
      toast.success('Payment done! Redirecting...');
      clearCart();
      navigate(`/track/${pendingOrderId}`);
    }
  };

  const handlePaymentDismiss = () => {
    setShowRzp(false);
    toast('Payment cancelled', { icon: '⚠️' });
    // Order still in DB as 'placed' — can be cleaned up later or retried
  };

  const handlePlaceOrder = () => {
    if (!cart.length) return;
    if (payMethod === 'cod') placeCodOrder();
    else initiateOnlinePayment();
  };

  return (
    <div className="page">
      <Sidebar />
      <main className={`main-content ${styles.main}`}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/home')}>←</button>
          <h1>Your Cart 🛒</h1>
          {cart.length > 0 && <button className={styles.clearBtn} onClick={clearCart}>Clear all</button>}
        </div>

        {cart.length === 0 ? (
          <div className={styles.empty}>
            <span>🛒</span>
            <h3>Your cart is empty</h3>
            <p>Add items from our restaurants to get started</p>
            <button className="btn btn-primary" onClick={() => navigate('/home')}>Browse Restaurants</button>
          </div>
        ) : (
          <div className={styles.layout}>
            {/* Cart items */}
            <div className={styles.cartItems}>
              {cart.map(item => (
                <div key={item.productId} className={styles.cartItem}>
                  <div className={styles.itemImg}>
                    {item.image ? <img src={item.image} alt={item.name} /> : <span>🍱</span>}
                  </div>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemRest}>{item.sellerName}</div>
                    <div className={styles.itemPrice}>₹ {item.price}</div>
                  </div>
                  <div className={styles.qtyCtrl}>
                    <button onClick={() => changeQty(item.productId, -1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => changeQty(item.productId, 1)}>+</button>
                  </div>
                  <div className={styles.itemTotal}>₹ {item.price * item.qty}</div>
                </div>
              ))}
            </div>

            {/* Right panel */}
            <div className={styles.sidePanel}>
              {/* Summary */}
              <div className={styles.summaryCard}>
                <h3>Order Summary</h3>
                <div className={styles.rows}>
                  <div className={styles.row}><span>Subtotal</span><span>₹ {subtotal}</span></div>
                  <div className={styles.row}>
                    <span>Delivery fee</span>
                    <span>{deliveryFee === 0 ? <span style={{color:'var(--green)'}}>FREE</span> : `₹ ${deliveryFee}`}</span>
                  </div>
                  <div className={styles.row}><span>GST (5%)</span><span>₹ {tax}</span></div>
                  <div className={`${styles.row} ${styles.total}`}><span>Total</span><span>₹ {total}</span></div>
                </div>
              </div>

              {/* Payment method selector */}
              <div className={styles.payCard}>
                <h3>Payment Method</h3>

                {/* Online (Razorpay UI) */}
                <div className={`${styles.payOpt} ${payMethod==='online'?styles.selected:''}`}
                  onClick={() => setPayMethod('online')}>
                  <div className={styles.payIcon}>💳</div>
                  <div className={styles.payInfo}>
                    <div className={styles.payLabel}>Pay Online</div>
                    <div className={styles.payDesc}>UPI, Cards, Net Banking, Wallets</div>
                    {payMethod === 'online' && (
                      <div className={styles.rzpBadge}>
                        <span>⚡</span> Powered by Razorpay · 100% Secure
                      </div>
                    )}
                  </div>
                  <div className={styles.radio}>{payMethod==='online' && <div className={styles.radioDot}/>}</div>
                </div>

                {/* COD */}
                <div className={`${styles.payOpt} ${payMethod==='cod'?styles.selected:''}`}
                  onClick={() => setPayMethod('cod')}>
                  <div className={styles.payIcon}>💵</div>
                  <div className={styles.payInfo}>
                    <div className={styles.payLabel}>Cash on Delivery</div>
                    <div className={styles.payDesc}>Pay cash when your order arrives</div>
                  </div>
                  <div className={styles.radio}>{payMethod==='cod' && <div className={styles.radioDot}/>}</div>
                </div>
              </div>

              <button className="btn btn-primary btn-full btn-lg" onClick={handlePlaceOrder} disabled={loading}>
                {loading
                  ? <span style={{display:'flex',alignItems:'center',gap:8}}><span className="spinner" style={{width:18,height:18,borderWidth:2}}/> Processing...</span>
                  : payMethod === 'online'
                    ? `Pay ₹ ${total} →`
                    : `Place Order · ₹ ${total}`
                }
              </button>

              {payMethod === 'online' && (
                <p style={{fontSize:11,color:'var(--text-light)',textAlign:'center',marginTop:6}}>
                  Razorpay secure checkout — UPI / Card / Net Banking / Wallet
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Custom Razorpay-like payment modal */}
      {showRzp && (
        <RazorpayModal
          amount={total}
          orderId={pendingOrderId}
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
