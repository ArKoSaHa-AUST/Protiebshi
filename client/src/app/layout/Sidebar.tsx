import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  Home,
  ShoppingBag,
  Building,
  Wrench,
  AlertCircle,
  ShieldCheck,
  Heart,
  MessageSquare,
  MapPin,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { ROUTES } from '@/config/routes.config';

interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
}

const navigation: NavigationItem[] = [
  { id: 'feed', label: 'Feed', icon: Home, path: ROUTES.HOME },
  { id: 'admin-feed', label: 'Admin Feed', icon: ShieldCheck, path: ROUTES.ADMIN_FEED },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, path: ROUTES.MARKETPLACE },
  { id: 'rent', label: 'Rent', icon: Building, path: ROUTES.RENT },
  { id: 'services', label: 'Services', icon: Wrench, path: ROUTES.SERVICES },
  { id: 'complaints', label: 'Complaints', icon: AlertCircle, path: ROUTES.COMPLAINTS },
  { id: 'relief', label: 'Relief', icon: Heart, path: ROUTES.RELIEF },
  { id: 'messages', label: 'Messages', icon: MessageSquare, path: ROUTES.MESSAGES },
];

const INCOMING_CALL_STORAGE_KEY = 'protibeshi.incomingCallSession';
const INCOMING_CALL_EVENT = 'protibeshi-incoming-call-changed';

const containerVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const navItemVariants: Variants = {
  initial: { rotateX: 0, rotateY: 0 },
  hover: {
    rotateX: -2,
    rotateY: 8,
    scale: 1.05,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  tap: {
    scale: 0.95,
    rotateX: 5,
  },
};

export const Sidebar = ({
  isCollapsed = false,
  onToggle,
  isOpen = false,
  onClose,
}: {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}) => {
  const [hasIncomingCall, setHasIncomingCall] = useState(false);

  useEffect(() => {
    const readIncomingCallState = () => {
      if (typeof window === 'undefined') {
        return false;
      }

      return Boolean(window.localStorage.getItem(INCOMING_CALL_STORAGE_KEY));
    };

    setHasIncomingCall(readIncomingCallState());

    const handleChange = () => {
      setHasIncomingCall(readIncomingCallState());
    };

    window.addEventListener('storage', handleChange);
    window.addEventListener(INCOMING_CALL_EVENT, handleChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleChange);
      window.removeEventListener(INCOMING_CALL_EVENT, handleChange as EventListener);
    };
  }, []);

  return (
    <motion.aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isOpen ? styles.open : ''}`} variants={containerVariants} initial="hidden" animate="visible">
      <div className={styles.logoSection}>
        <motion.div className={styles.logo} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <div className={styles.logoIcon}>
            <MapPin className={styles.logoIconSvg} />
          </div>
          {!isCollapsed && (
            <div className={styles.logoText}>
              <h1 className={styles.logoTitle}>Protibeshi</h1>
            </div>
          )}
        </motion.div>
      </div>

      <nav className={styles.navigation}>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isMessagesItem = item.id === 'messages';

          return (
            <motion.div key={item.id} variants={itemVariants} className={styles.navWrapper}>
              {item.path ? (
                <motion.div
                  className={styles.navMotionWrapper}
                  variants={navItemVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <NavLink
                    to={item.path}
                    onClick={() => onClose?.()}
                    className={({ isActive }) =>
                      `${styles.navItem} ${isActive ? styles.navItemActive : ''} ${isMessagesItem && hasIncomingCall ? styles.navItemIncoming : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`${styles.navIcon} ${isActive ? styles.navIconActive : ''}`}>
                          <Icon size={20} />
                        </div>
                        {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                        {isMessagesItem && hasIncomingCall ? <span className={styles.navBlinkDot} aria-hidden="true" /> : null}
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ) : (
                <motion.div
                  className={styles.navMotionWrapper}
                  variants={navItemVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <a href={`#${item.id}`} className={styles.navItem} onClick={() => onClose?.()}>
                    <div className={styles.navIcon}>
                      <Icon size={20} />
                    </div>
                    {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                  </a>
                </motion.div>
              )}
            </motion.div>
          );
        })}

      </nav>

      <div className={styles.accountSection}>
        <motion.div className={styles.navMotionWrapper} variants={navItemVariants} initial="initial" whileHover="hover" whileTap="tap">
          <NavLink to="/account" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`} onClick={() => onClose?.()}>
            {({ isActive }) => (
              <>
                <div className={`${styles.navIcon} ${isActive ? styles.navIconActive : ''}`}>
                  <UserRound size={20} />
                </div>
                {!isCollapsed && <span className={styles.navLabel}>Account</span>}
              </>
            )}
          </NavLink>
        </motion.div>
      </div>

      {onToggle && (
        <button className={styles.toggleButton} onClick={onToggle} aria-label="Toggle sidebar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}
          >
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
      )}
    </motion.aside>
  );
};
