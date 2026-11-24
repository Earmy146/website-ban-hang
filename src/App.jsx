import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AppShell from './components/layout/AppShell';

// Giao diện Cửa hàng phía Người dùng mua sắm (Customer Storefront)
import StorefrontApp from './pages/storefront/StorefrontApp';

// Các trang thành phần độc lập của Admin (Modular 100% React JSX Pages)
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

// Bộ điều phối chuyên sâu cho 45+ tuyến đường con của Admin
import GeneralCommercePage from './pages/common/GeneralCommercePage';

function AdminWorkspaceLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Giao diện Cửa hàng trực tuyến cho Người dùng cuối (độc lập ngoài AppShell) */}
      <Route path="/store/*" element={<StorefrontApp />} />

      {/* Không gian Quản trị viên (Admin Dashboard) */}
      <Route element={<AdminWorkspaceLayout />}>
        <Route path="/" element={<Navigate to="/overview" replace />} />
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
        <Route path="/commerce/report-sales" element={<ReportsPage />} />
        <Route path="/commerce/marketplace" element={<MarketplacePage />} />
        <Route path="/commerce/chat" element={<ChatPage />} />
        <Route path="/commerce/ai-workflows" element={<AiWorkflowsPage />} />
        <Route path="/commerce/users" element={<UsersPage />} />
        <Route path="/commerce/settings-general" element={<GeneralSettingsPage />} />

        {/* Bộ điều phối thông minh cho 45+ tuyến đường phân hệ con */}
        <Route path="*" element={<GeneralCommercePage />} />
      </Route>
    </Routes>
  );
}
