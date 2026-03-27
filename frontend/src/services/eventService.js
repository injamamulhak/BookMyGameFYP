import apiClient from './api';

/**
 * Event Service
 * Handles all event-related API calls
 */

/**
 * Get all events with optional filters
 * @param {Object} params - Query parameters
 */
export const getEvents = async (params = {}) => {
    const response = await apiClient.get('/events', { params });
    return response.data;
};

/**
 * Get featured events (top upcoming featured events)
 */
export const getFeaturedEvents = async () => {
    const response = await apiClient.get('/events/featured');
    return response.data;
};

/**
 * Get single event details by ID
 * @param {string} id - Event ID
 */
export const getEventById = async (id) => {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
};

export default {
    getEvents,
    getFeaturedEvents,
    getEventById,
};
