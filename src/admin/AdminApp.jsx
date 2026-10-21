import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { isConfigured } from '../lib/supabase';
import { AdminAuthProvider, RequireAdmin } from './auth';
import { AdminLogin, ForgotPassword, ResetPassword, SetupRequired } from './AdminLogin';
import AdminLayout from './AdminLayout';
import { ToastProvider } from './ui';
import { PageLoader } from '../components/ui/States';
import { useEffect } from 'react';
import { applyTheme } from '../lib/format';

const Dashboard = lazy(() => import('./Dashboard'));
const Products = lazy(() => import('./Products'));
const ProductEditor = lazy(() => import('./ProductEditor'));
const Categories = lazy(() => import('./Categories'));
const Inventory = lazy(() => import('./Inventory'));
const Orders = lazy(() => import('./Orders'));
const OrderDetail = lazy(() => import('./OrderDetail'));
const Customers = lazy(() => import('./Customers'));
const Banners = lazy(() => import('./Banners'));
const Promotions = lazy(() => import('./Promotions'));
const Content = lazy(() => import('./Content'));
const Settings = lazy(() => import('./Settings'));

export default function AdminApp() {
  useEffect(() => { applyTheme('#087BD8'); }, []);
  if (!isConfigured) return <SetupRequired />;
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="login" element={<AdminLogin />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="products/:id" element={<ProductEditor />} />
              <Route path="categories" element={<Categories />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="customers" element={<Customers />} />
              <Route path="banners" element={<Banners />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="content" element={<Content />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
