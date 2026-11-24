import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import navData from '../../data/navigation.json';
import { resolveDomainType } from './moduleCatalog';
import ConfigFormView from './ConfigFormView';
import AccessAuditView from './AccessAuditView';
import StorefrontControlView from './StorefrontControlView';
import SpecializedReportView from './SpecializedReportView';
import AiWorkspaceView from './AiWorkspaceView';
import MediaGalleryView from './MediaGalleryView';
import InfrastructureCardsView from './InfrastructureCardsView';
import NotificationsCenterView from './NotificationsCenterView';
import ResourceModuleView from './ResourceModuleView';

/**
 * Smart Domain Router V3 cho toàn bộ 60+ tuyến đường phân hệ con Admin của Veylix.
 * Kết xuất giao diện chuyên biệt trực quan theo đúng bản chất nghiệp vụ từng trang:
 * - Storefront Control & Cá nhân hóa giao diện tinh tế (/commerce/store)
 * - Thư viện Đa phương tiện & Tệp tin trực quan (/commerce/media, /commerce/files)
 * - Lưới Thẻ Hạ tầng có Công tắc & Ping (/commerce/warehouses, carriers, providers, integrations, webhooks)
 * - Trung tâm Thông báo đồng bộ Topbar (/commerce/notifications)
 * - 15 Form Cài đặt & Chính sách chuyên sâu
 * - Ma trận Phân quyền RBAC & Nhật ký Audit
 * - 9 Trang Báo cáo chuyên sâu
 * - Không gian AI Studio thương mại
 * - Bảng quản trị hàng loạt có Tab lọc 1 chạm & Hướng dẫn trực quan
 */
export default function GeneralCommercePage() {
  const location = useLocation();
  const currentPath = location.pathname;

  const slug = useMemo(() => {
    const cleaned = currentPath.replace(/^\/+|\/+$/g, '');
    return (cleaned.split('/').pop() || 'general').toLowerCase();
  }, [currentPath]);

  const navInfo = useMemo(() => {
    let title = 'Nghiệp vụ thương mại';
    let parent = 'Không gian làm việc';

    for (const section of navData) {
      for (const item of section.items) {
        if (item.path === currentPath) {
          return { title: item.title, parent: section.groupTitle };
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.path === currentPath) {
              return { title: child.title, parent: item.title };
            }
          }
        }
      }
    }
    return { title, parent };
  }, [currentPath]);

  const domainType = useMemo(() => resolveDomainType(slug), [slug]);

  if (domainType === 'storefront-control') {
    return <StorefrontControlView key={slug} slug={slug} navInfo={navInfo} />;
  }

  if (domainType === 'notifications-center') {
    return <NotificationsCenterView key={slug} slug={slug} navInfo={navInfo} />;
  }

  if (domainType === 'media-gallery') {
    return <MediaGalleryView key={slug} slug={slug} navInfo={navInfo} />;
  }

  if (domainType === 'infrastructure-cards') {
    return <InfrastructureCardsView key={slug} slug={slug} navInfo={navInfo} />;
  }

  if (domainType === 'config-form') {
    return <ConfigFormView key={slug} slug={slug} navInfo={navInfo} />;
  }

  if (domainType === 'access-audit') {
    return <AccessAuditView key={slug} slug={slug} navInfo={navInfo} />;
  }

  if (domainType === 'specialized-report') {
    return <SpecializedReportView key={slug} slug={slug} navInfo={navInfo} />;
  }

  if (domainType === 'ai-workspace') {
    return <AiWorkspaceView key={slug} slug={slug} navInfo={navInfo} />;
  }

  return <ResourceModuleView key={slug} slug={slug} navInfo={navInfo} />;
}
