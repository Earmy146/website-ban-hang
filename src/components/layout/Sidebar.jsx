import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import navData from '../../data/navigation.json';

export default function Sidebar({ isCollapsed, toggleCollapse, closeMobileNav }) {
  const location = useLocation();
  const currentPath = location.pathname;

  // Quản lý trạng thái mở/đóng của các nhóm menu con
  const [openGroups, setOpenGroups] = useState({});

  // Tự động mở group nếu route hiện tại là con của group đó
  useEffect(() => {
    navData.forEach(section => {
      section.items.forEach(item => {
        if (item.type === 'group' && item.children) {
          const isChildActive = item.children.some(c => c.path === currentPath);
          if (isChildActive) {
            setOpenGroups(prev => ({ ...prev, [item.id]: true }));
          }
        }
      });
    });
  }, [currentPath]);

  const toggleGroup = (id) => {
    setOpenGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <aside className="sidebar" id="sidebar" aria-label="Điều hướng chính">
      <Link 
        className="brand" 
        to="/overview" 
        aria-label="Tổng quan Veylix"
        onClick={closeMobileNav}
      >
        <span className="brand-mark">
          <img 
            src="/assets/images/veylix-mark.svg" 
            alt="Veylix" 
            style={{ display: 'block', width: '30px', height: '30px', objectFit: 'contain' }} 
          />
        </span>
        <span className="brand-name">
          Veylix<small>Thương mại, trong sự hài hòa.</small>
        </span>
      </Link>

      <button 
        type="button" 
        className="sidebar-collapse icon-button" 
        data-action="toggle-sidebar" 
        aria-label={isCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
        aria-expanded={!isCollapsed}
        onClick={toggleCollapse}
      >
        <span className="icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
            <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
          </svg>
        </span>
      </button>

      {/* Lối tắt nổi bật sang Cửa hàng người dùng (/store) */}
      <div style={{ padding: isCollapsed ? '8px 10px 4px' : '8px 16px 4px' }}>
        <Link
          to="/store"
          title="Mở giao diện Cửa hàng người dùng (/store)"
          onClick={closeMobileNav}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '8px',
            padding: isCollapsed ? '9px' : '9px 12px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, #27342b 0%, #374a3d 100%)',
            color: '#fffdf9',
            textDecoration: 'none',
            fontSize: '12.5px',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(39, 52, 43, 0.18)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span className="icon" aria-hidden="true" style={{ width: '16px', height: '16px', color: '#f3c669' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M232,96a7.89,7.89,0,0,0-.3-2.2L217.35,43.6A16.07,16.07,0,0,0,202,32H54A16.07,16.07,0,0,0,38.65,43.6L24.31,93.8A7.89,7.89,0,0,0,24,96h0v16a40,40,0,0,0,16,32v72a8,8,0,0,0,8,8H208a8,8,0,0,0,8-8V144a40,40,0,0,0,16-32V96ZM54,48H202l11.42,40H42.61ZM200,208H56V151.2a40.57,40.57,0,0,0,8,.8,40,40,0,0,0,32-16,40,40,0,0,0,64,0,40,40,0,0,0,32,16,40.57,40.57,0,0,0,8-.8Z"></path>
              </svg>
            </span>
            {!isCollapsed && <span>Xem cửa hàng</span>}
          </span>
          {!isCollapsed && (
            <span style={{ fontSize: '11px', opacity: 0.8, fontWeight: '600' }}>/store &rarr;</span>
          )}
        </Link>
      </div>

      <nav className="navigation">
        {navData.map((section, sIdx) => (
          <section key={sIdx} className="nav-group" aria-label={section.groupTitle}>
            <div className="nav-group-label">
              <span>{section.groupTitle}</span>
            </div>
            <ul>
              {section.items.map((item, iIdx) => {
                if (item.type === 'link') {
                  const isActive = currentPath === item.path || (item.path === '/overview' && currentPath === '/');
                  return (
                    <li key={iIdx}>
                      <Link 
                        className={`nav-link ${isActive ? 'active' : ''}`} 
                        to={item.path} 
                        title={item.title} 
                        aria-current={isActive ? 'page' : undefined}
                        onClick={closeMobileNav}
                      >
                        <span 
                          className="icon" 
                          aria-hidden="true" 
                          dangerouslySetInnerHTML={{ __html: item.iconSvg }} 
                        />
                        <span className="nav-label">{item.title}</span>
                      </Link>
                    </li>
                  );
                }

                const isOpen = Boolean(openGroups[item.id]);
                const isAnyChildActive = item.children?.some(c => c.path === currentPath);

                return (
                  <li key={iIdx}>
                    <button 
                      type="button" 
                      className={`nav-link nav-parent ${isAnyChildActive ? 'child-active' : ''}`} 
                      aria-expanded={isOpen} 
                      aria-controls={item.id} 
                      title={item.title}
                      onClick={() => toggleGroup(item.id)}
                    >
                      <span 
                        className="icon" 
                        aria-hidden="true" 
                        dangerouslySetInnerHTML={{ __html: item.iconSvg }} 
                      />
                      <span className="nav-label">{item.title}</span>
                      <span className="icon nav-chevron" aria-hidden="true" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                          <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                        </svg>
                      </span>
                    </button>

                    <ul 
                      className="nav-children" 
                      id={item.id} 
                      hidden={!isOpen}
                    >
                      {item.children?.map((child, cIdx) => {
                        const isChildActive = currentPath === child.path;
                        return (
                          <li key={cIdx}>
                            <Link 
                              className={`nav-link nav-child ${isChildActive ? 'active' : ''}`} 
                              to={child.path}
                              aria-current={isChildActive ? 'page' : undefined}
                              onClick={closeMobileNav}
                            >
                              <span>{child.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>
    </aside>
  );
}
