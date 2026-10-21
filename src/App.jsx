import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { StoreProvider } from './contexts/StoreContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import StoreLayout from './components/layout/StoreLayout';
import Home from './pages/Home';
import { PageLoader } from './components/ui/States';

const Shop = lazy(() => import('./pages/Shop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const ContentPage = lazy(() => import('./pages/ContentPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
// Admin is a separate bundle that customers never download unless they visit /admin.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/admin/*" element={<AdminApp />} />
            <Route
              element={
                <StoreProvider>
                  <WishlistProvider>
                    <CartProvider>
                      <Suspense fallback={<PageLoader />}><StoreLayout /></Suspense>
                    </CartProvider>
                  </WishlistProvider>
                </StoreProvider>
              }
            >
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="product/:slug" element={<ProductDetails />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="order/:number" element={<OrderConfirmation />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="page/:slug" element={<ContentPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </MotionConfig>
    </BrowserRouter>
  );
}
