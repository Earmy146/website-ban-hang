import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import pagesContent from '../data/pages-content.json';

export default function PageRenderer() {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  let path = location.pathname;
  if (path === '/') path = '/overview';

  const pageData = pagesContent[path] || pagesContent['/overview'];

  // Cập nhật Document Title
  useEffect(() => {
    if (pageData?.title) {
      document.title = pageData.title;
    }
  }, [pageData]);

  // Intercept tất cả các link nội bộ để navigate bằng React Router
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleLinkClick(e) {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (href && (href.startsWith('/') || href.startsWith(window.location.origin))) {
        e.preventDefault();
        const targetPath = href.replace(window.location.origin, '');
        navigate(targetPath);
      }
    }

    container.addEventListener('click', handleLinkClick);
    return () => container.removeEventListener('click', handleLinkClick);
  }, [navigate]);

  // Khởi tạo Canvas Charts nếu có trên trang (ví dụ Overview)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mini Sales Chart
    const salesCanvas = container.querySelector('canvas[data-chart="sales"]');
    if (salesCanvas) {
      const ctx = salesCanvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const width = salesCanvas.clientWidth || 120;
      const height = salesCanvas.clientHeight || 42;
      salesCanvas.width = width * dpr;
      salesCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const data = [35, 45, 30, 65, 50, 85, 95, 75, 90, 100];
      const barWidth = 6;
      const gap = (width - data.length * barWidth) / (data.length - 1);

      data.forEach((val, i) => {
        const barHeight = (val / 100) * (height - 6);
        const x = i * (barWidth + gap);
        const y = height - barHeight;

        ctx.fillStyle = i === data.length - 1 ? '#b45309' : '#d97706aa';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();
      });
    }

    // Revenue Trend Chart
    const revenueCanvas = container.querySelector('canvas[data-chart="revenue"]');
    if (revenueCanvas) {
      const ctx = revenueCanvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const width = revenueCanvas.clientWidth || 600;
      const height = revenueCanvas.clientHeight || 220;
      revenueCanvas.width = width * dpr;
      revenueCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const thisPeriod = [24, 28, 35, 42, 38, 55, 62, 58, 72, 80, 88, 95];
      const lastPeriod = [20, 22, 28, 30, 32, 40, 45, 42, 50, 56, 60, 68];

      const drawLine = (data, strokeColor, fillColor) => {
        ctx.beginPath();
        const stepX = width / (data.length - 1);
        data.forEach((val, i) => {
          const x = i * stepX;
          const y = height - 20 - (val / 100) * (height - 40);
          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = (i - 1) * stepX;
            const prevY = height - 20 - (data[i - 1] / 100) * (height - 40);
            const cpX = (prevX + x) / 2;
            ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
          }
        });

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        if (fillColor) {
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
      };

      // Draw Last period line (màu xám nhạt)
      drawLine(lastPeriod, '#9ca3af', 'rgba(156, 163, 175, 0.08)');

      // Draw This period line (Amber gradient)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(217, 119, 6, 0.25)');
      gradient.addColorStop(1, 'rgba(217, 119, 6, 0.0)');
      drawLine(thisPeriod, '#d97706', gradient);
    }
  }, [path, pageData]);

  if (!pageData) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Không tìm thấy trang</h2>
        <p style={{ color: '#685947', marginBottom: '20px' }}>Trang "{path}" hiện chưa có dữ liệu hoặc không tồn tại.</p>
        <button 
          type="button" 
          onClick={() => navigate('/overview')}
          style={{ 
            padding: '10px 20px', 
            borderRadius: '10px', 
            backgroundColor: '#25211d', 
            color: '#fff', 
            border: 'none', 
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Quay lại trang Tổng quan
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: pageData.mainHtml }} 
    />
  );
}
