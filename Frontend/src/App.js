import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import SelectRole      from './pages/SelectRole';
import Login           from './pages/Login';
import Register        from './pages/Register';
import CustomerHome    from './pages/customer/Home';
import CustomerCart    from './pages/customer/Cart';
import CustomerOrders  from './pages/customer/Orders';
import CustomerTracking from './pages/customer/Tracking';
import SellerDashboard from './pages/seller/Dashboard';
import SellerProducts  from './pages/seller/Products';
import SellerAddProduct from './pages/seller/AddProduct';
import SellerSubscription from './pages/seller/Subscription';
import SellerPayment   from './pages/seller/Payment';
import SellerOrders    from './pages/seller/Orders';
import DeliveryDashboard from './pages/delivery/Dashboard';
import DeliveryNavigation from './pages/delivery/Navigation';

import './index.css';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16 }}>
      <div className="spinner" style={{ width:40, height:40 }} />
      <p style={{ color:'var(--text-muted)', fontSize:14 }}>Loading CampusEats...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const defaultRoute = () => {
    if (!user) return '/';
    if (user.role === 'seller') return '/seller';
    if (user.role === 'delivery') return '/delivery';
    return '/home';
  };
  return (
    <Routes>
      <Route path="/"       element={!user ? <SelectRole /> : <Navigate to={defaultRoute()} />} />
      <Route path="/login"  element={!user ? <Login /> : <Navigate to={defaultRoute()} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={defaultRoute()} />} />

      {/* Customer */}
      <Route path="/home"   element={<PrivateRoute roles={['customer']}><CustomerHome /></PrivateRoute>} />
      <Route path="/cart"   element={<PrivateRoute roles={['customer']}><CustomerCart /></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute roles={['customer']}><CustomerOrders /></PrivateRoute>} />
      <Route path="/track/:orderId" element={<PrivateRoute roles={['customer']}><CustomerTracking /></PrivateRoute>} />

      {/* Seller */}
      <Route path="/seller"                element={<PrivateRoute roles={['seller']}><SellerDashboard /></PrivateRoute>} />
      <Route path="/seller/orders"         element={<PrivateRoute roles={['seller']}><SellerOrders /></PrivateRoute>} />
      <Route path="/seller/products"       element={<PrivateRoute roles={['seller']}><SellerProducts /></PrivateRoute>} />
      <Route path="/seller/products/add"   element={<PrivateRoute roles={['seller']}><SellerAddProduct /></PrivateRoute>} />
      <Route path="/seller/subscription"   element={<PrivateRoute roles={['seller']}><SellerSubscription /></PrivateRoute>} />
      <Route path="/seller/payment"        element={<PrivateRoute roles={['seller']}><SellerPayment /></PrivateRoute>} />

      {/* Delivery */}
      <Route path="/delivery"                        element={<PrivateRoute roles={['delivery']}><DeliveryDashboard /></PrivateRoute>} />
      <Route path="/delivery/navigate/:orderId"      element={<PrivateRoute roles={['delivery']}><DeliveryNavigation /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                style: { fontFamily:'Inter,sans-serif', fontSize:14, borderRadius:12, padding:'12px 16px', maxWidth:380 },
                success: { iconTheme:{ primary:'#4A8C7F', secondary:'#fff' } },
                duration: 4000,
              }}
            />
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
