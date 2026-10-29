import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';

// Các trang thành phần độc lập (Modular 100% React JSX Pages)
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

// Các phân hệ mở rộng hoàn chỉnh
import CategoriesPage from './pages/commerce/catalog/CategoriesPage';
import BrandsPage from './pages/commerce/catalog/BrandsPage';
import SegmentsPage from './pages/commerce/customers/SegmentsPage';
import ReportsPage from './pages/commerce/reports/ReportsPage';
import MarketplacePage from './pages/commerce/marketplace/MarketplacePage';
import ChatPage from './pages/commerce/support/ChatPage';
import AiWorkflowsPage from './pages/commerce/ai/AiWorkflowsPage';
import UsersPage from './pages/commerce/team/UsersPage';

// Bộ kết xuất nghiệp vụ chuẩn mực React JSX cho các tuyến đường con còn lại
import GeneralCommercePage from './pages/common/GeneralCommercePage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        {/* Điều hướng mặc định */}
        <Route path="/" element={<Navigate to="/overview" replace />} />

        {/* Các trang nghiệp vụ cốt lõi 100% React JSX */}
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/commerce/products" element={<ProductsPage />} />
        <Route path="/commerce/categories" element={<CategoriesPage />} />
        <Route path="/commerce/brands" element={<BrandsPage />} />
        <Route path="/commerce/orders" element={<OrdersPage />} />
        <Route path="/commerce/fulfillment" element={<FulfillmentPage />} />
        <Route path="/commerce/customers" element={<CustomersPage />} />
        <Route path="/commerce/segments" element={<SegmentsPage />} />
        <Route path="/commerce/stock" element={<StockPage />} />
        <Route path="/commerce/coupons" element={<CouponsPage />} />
        <Route path="/commerce/reviews" element={<ReviewsPage />} />
        <Route path="/commerce/transactions" element={<TransactionsPage />} />
        <Route path="/commerce/reports" element={<ReportsPage />} />
        <Route path="/commerce/marketplace" element={<MarketplacePage />} />
        <Route path="/commerce/chat" element={<ChatPage />} />
        <Route path="/commerce/ai-workflows" element={<AiWorkflowsPage />} />
        <Route path="/commerce/users" element={<UsersPage />} />
        <Route path="/commerce/settings-general" element={<GeneralSettingsPage />} />

        {/* Bộ điều phối chuẩn React JSX cho mọi tuyến đường con chuyên sâu khác */}
        <Route path="/*" element={<GeneralCommercePage />} />
      </Routes>
    </AppShell>
  );
}
