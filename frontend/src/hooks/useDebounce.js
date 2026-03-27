import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * Delays updating the returned value until after the specified delay
 * has passed since the last time the input value changed.
 * 
 * Usage:
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 300);
 *   
 *   useEffect(() => {
 *       // API call with debouncedSearch
 *   }, [debouncedSearch]);
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {any} The debounced value
 */
export function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default useDebounce;
