import React from 'react';

export default function OverviewHeading({ onQuickAction }) {
  return (
    <div className="dashboard-heading" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '13px', color: '#776c5b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Không gian điều hành
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: '#2b2316' }}>
            Tổng quan cửa hàng
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className="secondary-button"
            onClick={() => onQuickAction('Tải lại dữ liệu chỉ số thành công')}
          >
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,128a96,96,0,0,1-96,96,95.12,95.12,0,0,1-67.89-28.11L40,176H80a8,8,0,0,0,0-16H24a8,8,0,0,0-8,8v56a8,8,0,0,0,16,0V204.69l20.44,20.43A112,112,0,0,0,240,128a8,8,0,0,0-16,0ZM32,128A96,96,0,0,1,128,32a95.12,95.12,0,0,1,67.89,28.11L216,80H176a8,8,0,0,0,0,16h56a8,8,0,0,0,8-8V32a8,8,0,0,0-16,0V51.31L203.56,30.88A112,112,0,0,0,16,128a8,8,0,0,0,16,0Z"></path>
              </svg>
            </span>
            Làm mới
          </button>
          <button 
            type="button" 
            className="primary-button"
            onClick={() => onQuickAction('Đang xuất báo cáo tổng hợp')}
          >
            Xuất báo cáo
          </button>
        </div>
      </div>
    </div>
  );
}

