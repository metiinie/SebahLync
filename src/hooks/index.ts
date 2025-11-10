import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for managing loading states
 */
export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  
  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);
  
  return { loading, setLoading, startLoading, stopLoading };
};

/**
 * Custom hook for managing error states
 */
export const useError = () => {
  const [error, setError] = useState<string | null>(null);
  
  const setErrorMessage = useCallback((message: string) => {
    setError(message);
    toast.error(message);
  }, []);
  
  const clearError = useCallback(() => setError(null), []);
  
  return { error, setError, setErrorMessage, clearError };
};

/**
 * Custom hook for managing async operations with loading and error states
 */
export const useAsyncOperation = <T = unknown>() => {
  const { loading, startLoading, stopLoading } = useLoading();
  const { error, setErrorMessage, clearError } = useError();
  const [data, setData] = useState<T | null>(null);
  
  const execute = useCallback(async (operation: () => Promise<T>) => {
    try {
      startLoading();
      clearError();
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(message);
      throw err;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading, clearError, setErrorMessage]);
  
  return { loading, error, data, execute, setData };
};

/**
 * Custom hook for managing pagination
 */
export const usePagination = (initialPage = 1, initialLimit = 12) => {
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
  });
  
  const nextPage = useCallback(() => {
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  }, []);
  
  const prevPage = useCallback(() => {
    setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  }, []);
  
  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page: Math.max(1, page) }));
  }, []);
  
  const resetPagination = useCallback(() => {
    setPagination({ page: initialPage, limit: initialLimit });
  }, [initialPage, initialLimit]);
  
  return {
    pagination,
    setPagination,
    nextPage,
    prevPage,
    goToPage,
    resetPagination,
  };
};

/**
 * Custom hook for managing search and filters
 */
export const useSearchFilters = <T extends Record<string, unknown>>(initialFilters: T) => {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [searchTerm, setSearchTerm] = useState('');
  
  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchTerm('');
  }, [initialFilters]);
  
  const applySearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);
  
  return {
    filters,
    searchTerm,
    setFilters,
    setSearchTerm,
    updateFilter,
    clearFilters,
    applySearch,
  };
};

/**
 * Custom hook for managing confirmation dialogs
 */
export const useConfirmation = () => {
  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const result = window.confirm(message);
      resolve(result);
    });
  }, []);
  
  return { confirm };
};

/**
 * Custom hook for managing local storage
 */
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue] as const;
};

/**
 * Custom hook for managing debounced values
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

/**
 * Custom hook for managing window dimensions
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return windowSize;
};
