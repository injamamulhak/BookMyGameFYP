/**
 * Time formatting utilities for BookMyGame
 * Centralized functions to handle time formatting across the application
 */

/**
 * Format time for display (e.g., "11:00 AM")
 * Handles both "HH:mm" strings and ISO datetime strings
 * @param {string|Date} timeValue - Time value to format
 * @returns {string} Formatted time string
 */
export const formatTime = (timeValue) => {
    if (!timeValue) return '';

    let hours, minutes;

    if (typeof timeValue === 'string') {
        // Check if it's an ISO datetime string (contains 'T')
        if (timeValue.includes('T')) {
            const date = new Date(timeValue);
            hours = date.getUTCHours();
            minutes = date.getUTCMinutes();
        } else {
            // Simple HH:mm format
            [hours, minutes] = timeValue.split(':').map(Number);
        }
    } else if (timeValue instanceof Date) {
        hours = timeValue.getHours();
        minutes = timeValue.getMinutes();
    } else {
        return '';
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

/**
 * Get hour and minute components from a time value
 * Useful for time slot generation and calculations
 * @param {string|Date} timeValue - Time value to parse
 * @returns {{h: number, m: number}} Object with hours and minutes
 */
export const getTimeComponents = (timeValue) => {
    if (!timeValue) return { h: 0, m: 0 };

    if (typeof timeValue === 'string') {
        // Check if it's an ISO datetime string
        if (timeValue.includes('T')) {
            const d = new Date(timeValue);
            return { h: d.getUTCHours(), m: d.getUTCMinutes() };
        }
        // Simple HH:mm format
        const parts = timeValue.split(':');
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        return { h, m };
    }

    if (timeValue instanceof Date) {
        return { h: timeValue.getHours(), m: timeValue.getMinutes() };
    }

    return { h: 0, m: 0 };
};

/**
 * Format date for display
 * @param {string|Date} dateValue - Date value to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateValue, options = {}) => {
    if (!dateValue) return '';

    const defaultOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...options
    };

    return new Date(dateValue).toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format date for long display
 * @param {string|Date} dateValue - Date value to format
 * @returns {string} Formatted date string (e.g., "Thursday, December 26, 2024")
 */
export const formatDateLong = (dateValue) => {
    return formatDate(dateValue, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Convert minutes to time format (e.g., 660 -> "11:00")
 * @param {number} totalMinutes - Total minutes from midnight
 * @returns {string} Time in HH:mm format
 */
export const minutesToTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Convert time to total minutes from midnight
 * @param {string} timeString - Time in HH:mm format
 * @returns {number} Total minutes from midnight
 */
export const timeToMinutes = (timeString) => {
    const { h, m } = getTimeComponents(timeString);
    return h * 60 + m;
};
