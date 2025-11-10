import React from 'react';
import { motion } from 'framer-motion';

interface PageLayoutProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl';
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  title, 
  description, 
  children, 
  maxWidth = '4xl' 
}) => {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl'
  }[maxWidth];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-gray-600 mb-6">
            {description}
          </p>
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default PageLayout;
