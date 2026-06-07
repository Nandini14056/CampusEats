import React, { useState, useEffect, useRef } from 'react';
import styles from './RazorpayModal.module.css';

/* ─────────────────────────────────────────────────────────────────────────────
   RazorpayModal — A pixel-accurate simulation of the Razorpay checkout UI.
   No real SDK is loaded. All steps are handled in React state.
   Props:
     amount      : number (e.g. 240)
     orderId     : string (display only)
     customerName: string
     customerEmail: string
     customerPhone: string
     onSuccess(txnId) : called after simulated "success"
     onDismiss()      : called on close / cancel
───────────────────────────────────────────────────────────────────────────── */
export default function RazorpayModal({ amount, orderId, customerName, customerEmail, customerPhone, onSuccess, onDismiss }) {
  const [tab, setTab]           = useState('upi');      // upi | card | netbanking | wallet
  const [upiId, setUpiId]       = useState('');
  const [upiApp, setUpiApp]     = useState(null);
  const [card, setCard]         = useState({ number:'', expiry:'', cvv:'', name:'' });
  const [bank, setBank]         = useState(null);
  const [wallet, setWallet]     = useState(null);
  const [step, setStep]         = useState('form');     // form | processing | success | failure
  const [error, setError]       = useState('');
  const [timer, setTimer]       = useState(null);
  const timerRef                = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const UPI_APPS = [
    { id:'gpay',    label:'Google Pay',  icon:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Google_Pay_Logo_%282020%29.svg/120px-Google_Pay_Logo_%282020%29.svg.png',  color:'#4285F4' },
    { id:'phonepe', label:'PhonePe',     icon:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/PhonePe_Logo.svg/120px-PhonePe_Logo.svg.png', color:'#5F259F' },
    { id:'paytm',   label:'Paytm',       icon:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/120px-Paytm_Logo_%28standalone%29.svg.png', color:'#00BAF2' },
    { id:'bhim',    label:'BHIM',        icon:'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/BHIM_logo.svg/120px-BHIM_logo.svg.png', color:'#007AA3' },
  ];
  const BANKS = [
    { id:'sbi', name:'State Bank of India', logo:'🏦' },
    { id:'hdfc', name:'HDFC Bank', logo:'🏦' },
    { id:'icici', name:'ICICI Bank', logo:'🏦' },
    { id:'axis', name:'Axis Bank', logo:'🏦' },
    { id:'kotak', name:'Kotak Mahindra', logo:'🏦' },
    { id:'pnb', name:'Punjab National Bank', logo:'🏦' },
    { id:'bob', name:'Bank of Baroda', logo:'🏦' },
    { id:'canara', name:'Canara Bank', logo:'🏦' },
  ];
  const WALLETS = [
    { id:'paytm', name:'Paytm Wallet', icon:'💙' },
    { id:'amazonpay', name:'Amazon Pay', icon:'🟠' },
    { id:'freecharge', name:'FreeCharge', icon:'🟢' },
    { id:'mobikwik', name:'MobiKwik', icon:'🔵' },
  ];

  const fmtCard = v => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const fmtExpiry = v => { const d = v.replace(/\D/g,'').slice(0,4); return d.length >= 3 ? d.slice(0,2)+'/'+d.slice(2) : d; };

  const simulate = () => {
    setError('');
    if (tab === 'upi' && !upiApp && !upiId.includes('@')) { setError('Please select a UPI app or enter a valid UPI ID'); return; }
    if (tab === 'card') {
      if (card.number.replace(/\s/g,'').length < 16) { setError('Enter a valid 16-digit card number'); return; }
      if (!card.expiry.includes('/')) { setError('Enter expiry as MM/YY'); return; }
      if (card.cvv.length < 3) { setError('Enter 3-digit CVV'); return; }
      if (!card.name.trim()) { setError('Enter cardholder name'); return; }
    }
    if (tab === 'netbanking' && !bank) { setError('Please select your bank'); return; }
    if (tab === 'wallet' && !wallet) { setError('Please select a wallet'); return; }

    setStep('processing');
    // simulate 2.5s network delay
    timerRef.current = setTimeout(() => {
      const txnId = `pay_${Math.random().toString(36).slice(2,12).toUpperCase()}`;
      setStep('success');
      setTimeout(() => onSuccess(txnId), 1800);
    }, 2500);
  };

  // ── Processing screen ─────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.rzpLogo}><span className={styles.rzpIcon}>⚡</span><span>Razorpay</span></div>
            </div>
          </div>
          <div className={styles.processingBody}>
            <div className={styles.processingAnim}>
              <div className={styles.ripple} />
              <div className={styles.ripple2} />
              <span className={styles.processingIcon}>
                {tab === 'upi' ? '📱' : tab === 'card' ? '💳' : tab === 'netbanking' ? '🏦' : '👛'}
              </span>
            </div>
            <div className={styles.processingTitle}>Processing payment...</div>
            <div className={styles.processingAmt}>₹ {amount.toLocaleString('en-IN')}</div>
            <div className={styles.processingMethod}>
              {tab === 'upi' && (upiApp ? `via ${UPI_APPS.find(a=>a.id===upiApp)?.label}` : `UPI ID: ${upiId}`)}
              {tab === 'card' && `Card ending ${card.number.replace(/\s/g,'').slice(-4)}`}
              {tab === 'netbanking' && `${BANKS.find(b=>b.id===bank)?.name}`}
              {tab === 'wallet' && `${WALLETS.find(w=>w.id===wallet)?.name}`}
            </div>
            <div className={styles.processingDots}><span/><span/><span/></div>
            <p className={styles.processingNote}>Please don't close or refresh this page</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.successBody}>
            <div className={styles.successCircle}><span>✓</span></div>
            <div className={styles.successTitle}>Payment Successful!</div>
            <div className={styles.successAmt}>₹ {amount.toLocaleString('en-IN')}</div>
            <p className={styles.successNote}>Redirecting to order tracking...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main checkout form ────────────────────────────────────────────────────
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onDismiss()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.rzpLogo}><span className={styles.rzpIcon}>⚡</span><span>Razorpay</span></div>
            <div className={styles.merchantInfo}>
              <div className={styles.merchantName}>Campus Canteen</div>
              <div className={styles.merchantOrder}>Order #{orderId?.slice(-6)?.toUpperCase()}</div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.amountBig}>₹ {amount.toLocaleString('en-IN')}</div>
            <button className={styles.closeBtn} onClick={onDismiss}>✕</button>
          </div>
        </div>

        {/* Customer info bar */}
        <div className={styles.custBar}>
          <span>👤 {customerName}</span>
          <span>·</span>
          <span>📞 {customerPhone}</span>
          <span>·</span>
          <span>✉️ {customerEmail}</span>
        </div>

        {/* Tab bar */}
        <div className={styles.tabBar}>
          {[
            { id:'upi',        label:'UPI',         icon:'📱' },
            { id:'card',       label:'Card',        icon:'💳' },
            { id:'netbanking', label:'Net Banking',  icon:'🏦' },
            { id:'wallet',     label:'Wallet',      icon:'👛' },
          ].map(t => (
            <button key={t.id} className={`${styles.tabBtn} ${tab===t.id?styles.tabActive:''}`} onClick={() => { setTab(t.id); setError(''); }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div className={styles.formBody}>
          {/* ── UPI Tab ────────────────────────────────────────────────────── */}
          {tab === 'upi' && (
            <div className={styles.upiSection}>
              <p className={styles.upiHint}>Pay instantly with any UPI app</p>
              <div className={styles.upiApps}>
                {UPI_APPS.map(app => (
                  <div key={app.id} className={`${styles.upiApp} ${upiApp===app.id?styles.upiAppSelected:''}`}
                    onClick={() => { setUpiApp(app.id); setUpiId(''); }}>
                    <img src={app.icon} alt={app.label} className={styles.upiAppImg} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                    <span className={styles.upiAppFallback} style={{display:'none',background:app.color}}>
                      {app.label[0]}
                    </span>
                    <span className={styles.upiAppName}>{app.label}</span>
                    {upiApp===app.id && <span className={styles.upiTick}>✓</span>}
                  </div>
                ))}
              </div>
              <div className={styles.upiDivider}><span>or enter UPI ID</span></div>
              <div className={styles.upiInputWrap}>
                <input
                  className={`${styles.upiInput} ${upiApp?styles.upiInputDisabled:''}`}
                  placeholder="yourname@upi  e.g. 9876543210@ybl"
                  value={upiId}
                  onChange={e => { setUpiId(e.target.value); setUpiApp(null); }}
                  disabled={!!upiApp}
                />
                {upiId && !upiApp && <span className={styles.upiVerify}>Verify →</span>}
              </div>
              {upiApp && (
                <div className={styles.upiSelectedNote}>
                  <span>📱</span> Tap Pay — you'll get a notification in <strong>{UPI_APPS.find(a=>a.id===upiApp)?.label}</strong>
                </div>
              )}
            </div>
          )}

          {/* ── Card Tab ───────────────────────────────────────────────────── */}
          {tab === 'card' && (
            <div className={styles.cardSection}>
              <div className={styles.cardPreview}>
                <div className={styles.cardChip}>▪▪▪</div>
                <div className={styles.cardNum}>{card.number || '•••• •••• •••• ••••'}</div>
                <div className={styles.cardBottom}>
                  <span>{card.name || 'CARDHOLDER NAME'}</span>
                  <span>{card.expiry || 'MM/YY'}</span>
                </div>
                <div className={styles.cardNetwork}>
                  {card.number.startsWith('4') ? 'VISA' : card.number.startsWith('5') ? 'MASTER' : ''}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Card Number</label>
                <input className={styles.input} placeholder="1234 5678 9012 3456" maxLength={19}
                  value={card.number} onChange={e => setCard({...card, number: fmtCard(e.target.value)})} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Expiry Date</label>
                  <input className={styles.input} placeholder="MM/YY" maxLength={5}
                    value={card.expiry} onChange={e => setCard({...card, expiry: fmtExpiry(e.target.value)})} />
                </div>
                <div className={styles.formGroup}>
                  <label>CVV <span className={styles.cvvHelp} title="3-digit code on back">?</span></label>
                  <input className={styles.input} placeholder="•••" maxLength={3} type="password"
                    value={card.cvv} onChange={e => setCard({...card, cvv: e.target.value.replace(/\D/g,'').slice(0,3)})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Cardholder Name</label>
                <input className={styles.input} placeholder="Name as on card"
                  value={card.name} onChange={e => setCard({...card, name: e.target.value.toUpperCase()})} />
              </div>
              <div className={styles.cardIcons}>
                <span className={styles.cardBrand} style={{background:'#1A1F71',color:'#fff'}}>VISA</span>
                <span className={styles.cardBrand} style={{background:'#EB001B'}}>●</span>
                <span className={styles.cardBrand} style={{background:'#FF5F00'}}>●</span>
                <span className={styles.cardBrand} style={{background:'#007BC1',color:'#fff',fontSize:10}}>RUPAY</span>
              </div>
            </div>
          )}

          {/* ── Net Banking Tab ────────────────────────────────────────────── */}
          {tab === 'netbanking' && (
            <div className={styles.bankSection}>
              <p className={styles.bankHint}>Select your bank</p>
              <div className={styles.bankGrid}>
                {BANKS.map(b => (
                  <div key={b.id} className={`${styles.bankItem} ${bank===b.id?styles.bankSelected:''}`}
                    onClick={() => setBank(b.id)}>
                    <span className={styles.bankLogo}>{b.logo}</span>
                    <span className={styles.bankName}>{b.name}</span>
                    {bank===b.id && <span className={styles.bankTick}>✓</span>}
                  </div>
                ))}
              </div>
              {bank && (
                <div className={styles.bankNote}>
                  You'll be redirected to <strong>{BANKS.find(b2=>b2.id===bank)?.name}</strong>'s secure login page
                </div>
              )}
            </div>
          )}

          {/* ── Wallet Tab ─────────────────────────────────────────────────── */}
          {tab === 'wallet' && (
            <div className={styles.walletSection}>
              <p className={styles.walletHint}>Pay with your digital wallet</p>
              <div className={styles.walletList}>
                {WALLETS.map(w => (
                  <div key={w.id} className={`${styles.walletItem} ${wallet===w.id?styles.walletSelected:''}`}
                    onClick={() => setWallet(w.id)}>
                    <span className={styles.walletIcon}>{w.icon}</span>
                    <span className={styles.walletName}>{w.name}</span>
                    {wallet===w.id && <span className={styles.walletTick}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div className={styles.errorMsg}><span>⚠️</span> {error}</div>}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.payBtn} onClick={simulate}>
            <span>🔒</span> Pay ₹ {amount.toLocaleString('en-IN')}
          </button>
          <div className={styles.secureRow}>
            <span>🔒 Secured by</span>
            <strong> Razorpay</strong>
            <span style={{margin:'0 8px',color:'#ccc'}}>|</span>
            <span>256-bit SSL</span>
            <span style={{margin:'0 8px',color:'#ccc'}}>|</span>
            <span>PCI DSS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
