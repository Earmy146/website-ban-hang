import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';

// Các trang thành phần độc lập (Modular React Pages)
import OverviewPage from './pages/overview/OverviewPage';
import ProductsPage from './pages/commerce/products/ProductsPage';
import OrdersPage from './pages/commerce/orders/OrdersPage';
import CustomersPage from './pages/commerce/customers/CustomersPage';
import StockPage from './pages/commerce/inventory/StockPage';
import CouponsPage from './pages/commerce/discounts/CouponsPage';
import ReviewsPage from './pages/commerce/reviews/ReviewsPage';
import FulfillmentPage from './pages/commerce/fulfillment/FulfillmentPage';
import TransactionsPage from './pages/commerce/transactions/TransactionsPage';
import GeneralSettingsPage from './pages/commerce/settings/GeneralSettingsPage';

// Trình tải trang động cho các tuyến đường chuyên sâu khác
import DynamicPage from './pages/common/DynamicPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        {/* Điều hướng mặc định */}
        <Route path="/" element={<Navigate to="/overview" replace />} />

        {/* Các trang nghiệp vụ cốt lõi */}
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/commerce/products" element={<ProductsPage />} />
        <Route path="/commerce/orders" element={<OrdersPage />} />
        <Route path="/commerce/customers" element={<CustomersPage />} />
        <Route path="/commerce/stock" element={<StockPage />} />
        <Route path="/commerce/coupons" element={<CouponsPage />} />
        <Route path="/commerce/reviews" element={<ReviewsPage />} />
        <Route path="/commerce/fulfillment" element={<FulfillmentPage />} />
        <Route path="/commerce/transactions" element={<TransactionsPage />} />
        <Route path="/commerce/settings-general" element={<GeneralSettingsPage />} />

        {/* Điều hướng động cho tất cả 87 tuyến đường còn lại */}
        <Route path="/*" element={<DynamicPage />} />
      </Routes>
    </AppShell>
  );
}
