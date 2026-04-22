import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CheckoutProvider } from './context/CheckoutContext';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';
import ProductList from './pages/ProductList';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import AdminReviews from './pages/AdminReviews';
import Home from './pages/Home';
import Products from './pages/Products';
import Collections from './pages/Collections';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import Reviews from './pages/Reviews';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import Addresses from './pages/Addresses';
import MyReviews from './pages/MyReviews';
import MyFavorites from './pages/MyFavorites';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import Messages from './pages/Messages';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { isLoggedIn, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark p-8 space-y-8">
        <div className="flex justify-between items-center animate-pulse">
          <div className="h-10 w-48 bg-primary/10 rounded-xl"></div>
          <div className="h-10 w-32 bg-primary/5 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
          <div className="h-64 bg-primary/5 rounded-3xl"></div>
          <div className="h-64 bg-primary/5 rounded-3xl"></div>
          <div className="h-64 bg-primary/5 rounded-3xl"></div>
        </div>
        <div className="h-96 w-full bg-primary/5 rounded-3xl animate-pulse"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && userProfile?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <CheckoutProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/collections" element={<Collections />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/change-password" element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            } />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            } />
            <Route path="/orders/:orderNumber" element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/addresses" element={
              <ProtectedRoute>
                <Addresses />
              </ProtectedRoute>
            } />
            <Route path="/my-reviews" element={
              <ProtectedRoute>
                <MyReviews />
              </ProtectedRoute>
            } />
            <Route path="/my-favorites" element={
              <ProtectedRoute>
                <MyFavorites />
              </ProtectedRoute>
            } />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <Routes>
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="products" element={<ProductList />} />
                      <Route path="products/add" element={<AddProduct />} />
                      <Route path="products/edit/:slug" element={<EditProduct />} />
                      <Route path="orders" element={<Orders />} />
                      <Route path="sales" element={<Sales />} />
                      <Route path="customers" element={<Customers />} />
                      <Route path="reviews" element={<AdminReviews />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CheckoutProvider>
    </CartProvider>
  </AuthProvider>
</ThemeProvider>
);
}
