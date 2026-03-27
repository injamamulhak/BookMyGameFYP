import api from './api';

/**
 * Review Service
 * Handles all review-related API calls
 */

// Get all reviews for a venue (public)
export const getVenueReviews = async (venueId, options = {}) => {
    const { page = 1, limit = 10, sort = 'newest' } = options;
    const response = await api.get(`/reviews/venue/${venueId}`, {
        params: { page, limit, sort },
    });
    return response.data;
};

// Check if current user can review a venue (authenticated)
export const canReviewVenue = async (venueId) => {
    const response = await api.get(`/reviews/can-review/${venueId}`);
    return response.data;
};

// Submit a new review (authenticated)
export const createReview = async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
};

// Update own review (authenticated)
export const updateReview = async (reviewId, reviewData) => {
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
};

// Delete own review (authenticated)
export const deleteReview = async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
};
