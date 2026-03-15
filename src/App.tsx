import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import AdminLayout from './AdminLayout';
import ProductList from './ProductList';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import Dashboard from './Dashboard';
import Orders from './Orders';
import Sales from './Sales';
import Customers from './Customers';
import Settings from './Settings';
import storage from './services/storage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = storage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute>
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
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
