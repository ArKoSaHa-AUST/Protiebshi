import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Auto-close mobile drawer when navigating
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className={styles.layout}>
      <Topbar onMenuClick={() => setIsMobileOpen((prev) => !prev)} />
      <div className={`${styles.container} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
        />
        {isMobileOpen && (
          <button
            type="button"
            className={styles.backdrop}
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close navigation menu"
          />
        )}
        <motion.main
          className={styles.main}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

