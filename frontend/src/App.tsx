import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { ResultModalProvider } from './context/ResultModalContext';

import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ClientLayout from './components/ClientLayout';
import AdminLayout from './components/AdminLayout';
import ScrollToTop from './components/ScrollToTop';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

import ClientHome from './pages/client/ClientHome';
import Products from './pages/client/Products';
import ProductDetail from './pages/client/ProductDetail';
import Cart from './pages/client/Cart';
import Checkout from './pages/client/Checkout';
import Orders from './pages/client/Orders';
import OrderDetail from './pages/client/OrderDetail';
import Profile from './pages/client/Profile';
import Addresses from './pages/client/Addresses';
import Settings from './pages/client/Settings';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminFeedback from './pages/admin/AdminFeedback';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ResultModalProvider>
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Client (protected) */}
              <Route
                path="/shop"
                element={
                  <ProtectedRoute>
                    <ClientLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ClientHome />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="orders" element={<Orders />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="profile" element={<Profile />} />
                <Route path="addresses" element={<Addresses />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Admin (protected + role-gated) */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="feedback" element={<AdminFeedback />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Landing />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
        </ResultModalProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
