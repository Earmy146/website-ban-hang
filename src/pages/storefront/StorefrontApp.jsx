import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import '../../styles/storefront.css';
import { StoreProvider } from '../../components/storefront/StoreContext';
import StorefrontLayout from '../../components/storefront/StorefrontLayout';

import StoreHomePage from './StoreHomePage';
import StoreProductsPage from './StoreProductsPage';
import StoreProductDetailPage from './StoreProductDetailPage';
import StoreDealsPage from './StoreDealsPage';
import StoreCheckoutPage from './StoreCheckoutPage';
import StoreOrderLookupPage from './StoreOrderLookupPage';
import StoreAccountPage from './StoreAccountPage';
import StoreSupportPage from './StoreSupportPage';

export default function StorefrontApp() {
  return (
    <StoreProvider>
      <StorefrontLayout>
        <Routes>
          <Route index element={<StoreHomePage />} />
          <Route path="products" element={<StoreProductsPage />} />
          <Route path="products/:id" element={<StoreProductDetailPage />} />
          <Route path="deals" element={<StoreDealsPage />} />
          <Route path="checkout" element={<StoreCheckoutPage />} />
          <Route path="orders" element={<StoreOrderLookupPage />} />
          <Route path="account" element={<StoreAccountPage />} />
          <Route path="support" element={<StoreSupportPage />} />
          <Route path="*" element={<Navigate to="/store" replace />} />
        </Routes>
      </StorefrontLayout>
    </StoreProvider>
  );
}
