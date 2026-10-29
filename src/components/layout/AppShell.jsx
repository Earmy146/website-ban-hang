import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  const toggleMobileNav = () => {
    setIsMobileNavOpen(prev => !prev);
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  return (
    <div className={`app-shell ${isCollapsed ? 'collapsed' : ''} ${isMobileNavOpen ? 'mobile-nav-open' : ''}`}>
      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleCollapse={toggleCollapse} 
        closeMobileNav={closeMobileNav}
      />
      
      <button 
        type="button" 
        className="sidebar-scrim" 
        data-action="close-sidebar" 
        aria-label="Close navigation"
        onClick={closeMobileNav}
      />

      <div className="workspace">
        <Topbar toggleMobileNav={toggleMobileNav} />
        <main id="main-content" tabIndex="-1">
          {children}
        </main>
      </div>
    </div>
  );
}
