import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import Home from './pages/Home';
import Products from './pages/Products';
import Collections from './pages/Collections';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import Reviews from './pages/Reviews';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { isLoggedIn, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/oauth2/callback" element={<AuthCallback />} />
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
      </AuthProvider>
    </ThemeProvider>
  );
}
