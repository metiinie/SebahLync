import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  ShoppingCart, 
  Plus, 
  User, 
  Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const MobileNav = () => {
  const { isAuthenticated, user } = useAuth();
  const { unreadCount } = useNotifications();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Buy', href: '/buy', icon: ShoppingCart },
    { name: 'Rent', href: '/rent', icon: ShoppingCart },
    ...(isAuthenticated ? [
      { name: 'Sell', href: '/sell', icon: Plus },
      { name: 'Profile', href: '/profile', icon: User },
    ] : []),
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden"
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                `flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {item.name === 'Profile' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.name}</span>
            </NavLink>
          </motion.div>
        ))}
      </div>
    </motion.nav>
  );
};

export default MobileNav;
