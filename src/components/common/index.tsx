import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

/**
 * Loading spinner component
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  
  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
  );
};

/**
 * Loading state component
 */
interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => (
  <div className="flex flex-col items-center justify-center py-8">
    <LoadingSpinner size={size} />
    <p className="mt-2 text-sm text-gray-600">{message}</p>
  </div>
);

/**
 * Error state component
 */
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  message, 
  onRetry, 
  retryText = 'Try Again' 
}) => (
  <div className="flex flex-col items-center justify-center py-8">
    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
    <p className="text-red-600 text-center mb-4">{message}</p>
    {onRetry && (
      <Button variant="outline" onClick={onRetry}>
        {retryText}
      </Button>
    )}
  </div>
);

/**
 * Empty state component
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  action 
}) => (
  <div className="flex flex-col items-center justify-center py-12">
    {icon && <div className="text-gray-400 mb-4">{icon}</div>}
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    {description && (
      <p className="text-gray-600 text-center mb-4 max-w-md">{description}</p>
    )}
    {action && action}
  </div>
);

/**
 * Status badge component
 */
interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'verified' | 'unverified';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const statusConfig = {
    pending: { 
      label: 'Pending', 
      className: 'bg-yellow-100 text-yellow-800', 
      icon: <AlertCircle className="h-3 w-3 mr-1" />
    },
    approved: { 
      label: 'Approved', 
      className: 'bg-green-100 text-green-800', 
      icon: <CheckCircle className="h-3 w-3 mr-1" />
    },
    rejected: { 
      label: 'Rejected', 
      className: 'bg-red-100 text-red-800', 
      icon: <XCircle className="h-3 w-3 mr-1" />
    },
    active: { 
      label: 'Active', 
      className: 'bg-green-100 text-green-800', 
      icon: <CheckCircle className="h-3 w-3 mr-1" />
    },
    inactive: { 
      label: 'Inactive', 
      className: 'bg-gray-100 text-gray-800', 
      icon: <XCircle className="h-3 w-3 mr-1" />
    },
    verified: { 
      label: 'Verified', 
      className: 'bg-green-100 text-green-800', 
      icon: <CheckCircle className="h-3 w-3 mr-1" />
    },
    unverified: { 
      label: 'Unverified', 
      className: 'bg-yellow-100 text-yellow-800', 
      icon: <AlertCircle className="h-3 w-3 mr-1" />
    },
  };
  
  const config = statusConfig[status];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1';
  
  return (
    <Badge className={`${config.className} ${sizeClass} flex items-center`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};

/**
 * Animated card component
 */
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  className = '', 
  delay = 0,
  hover = true 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
    className={className}
  >
    <Card className="h-full">
      {children}
    </Card>
  </motion.div>
);

/**
 * Search input component
 */
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: () => void;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  onSearch,
  className = ''
}) => (
  <div className={`flex gap-2 ${className}`}>
    <div className="flex-1 relative">
      <input 
        type="text" 
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10" 
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onSearch?.()}
      />
    </div>
    {onSearch && (
      <Button onClick={onSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-6">
        Search
      </Button>
    )}
  </div>
);

/**
 * Action button group component
 */
interface ActionButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`flex gap-2 ${className}`}>
    {children}
  </div>
);

/**
 * Confirmation dialog component
 */
interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info'
}) => {
  if (!isOpen) return null;
  
  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">{message}</p>
          <ActionButtonGroup className="justify-end">
            <Button variant="outline" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button className={variantClasses[variant]} onClick={onConfirm}>
              {confirmText}
            </Button>
          </ActionButtonGroup>
        </CardContent>
      </Card>
    </div>
  );
};
