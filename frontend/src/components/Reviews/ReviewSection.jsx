import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ReviewItem from './ReviewItem';
import { FaStar } from 'react-icons/fa';

const ReviewSection = ({ venueId, currentUser }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
    
    // Eligibility & state
    const [canReview, setCanReview] = useState(false);
    const [existingReview, setExistingReview] = useState(null);
    const [eligibleBookingId, setEligibleBookingId] = useState(null);
    const [isOperator, setIsOperator] = useState(false);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/reviews/venue/${venueId}?limit=50`);
            setReviews(response.data.data);
            
            // Calculate simple stats from data
            if (response.data.data.length > 0) {
                const total = response.data.data.reduce((acc, curr) => acc + curr.rating, 0);
                setStats({
                    averageRating: (total / response.data.data.length).toFixed(1),
                    totalReviews: response.data.data.length
                });
            } else {
                setStats({ averageRating: 0, totalReviews: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setLoading(false);
        }
    };

    const checkEligibility = async () => {
        if (!currentUser) return;
        try {
            const response = await api.get(`/reviews/can-review/${venueId}`);
            
            if (response.data.success) {
                const data = response.data.data;
                setCanReview(data.canReview);
                setEligibleBookingId(data.eligibleBookingId);
                
                if (data.hasReviewed) {
                    // Try to find the user's review in the fetched list or fetch it specifically
                    // For now, we'll wait for the review list to populate and find it there
                }
            }
            
            // Check if current user is venue operator
            const venueCheck = await api.get(`/venues/${venueId}`);
            if (venueCheck.data.success && venueCheck.data.data.operatorId === currentUser.id) {
                setIsOperator(true);
            }
        } catch (error) {
            console.error('Eligibility check failed', error);
        }
    };

    useEffect(() => {
        if (venueId) {
            fetchReviews();
            checkEligibility();
        }
    }, [venueId, currentUser]);

    // Find existing review when reviews list updates
    useEffect(() => {
        if (currentUser && reviews.length > 0) {
            const myReview = reviews.find(r => r.userId === currentUser.id);
            if (myReview) {
                setExistingReview(myReview);
                setCanReview(false); // They already reviewed
            }
        }
    }, [reviews, currentUser]);

    const handleOpenEdit = () => {
        setRating(existingReview.rating);
        setComment(existingReview.comment || '');
        setIsEditing(true);
        setShowForm(true);
    };

    const handleOpenNew = () => {
        setRating(5);
        setComment('');
        setIsEditing(false);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating < 1 || rating > 5) {
             toast.error("Please provide a valid rating (1-5)");
             return;
        }

        setIsSubmitting(true);
        try {
            if (isEditing) {
                await api.put(`/reviews/${existingReview.id}`, { rating, comment });
                toast.success('Review updated successfully!');
            } else {
                await api.post('/reviews', { 
                    venueId, 
                    rating, 
                    comment,
                    bookingId: eligibleBookingId 
                });
                toast.success('Review published successfully!');
            }
            setShowForm(false);
            setComment('');
            fetchReviews(); // refresh
            checkEligibility(); // re-eval
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReviewDeleted = (id) => {
        setReviews(reviews.filter(r => r.id !== id));
        if (existingReview?.id === id) {
            setExistingReview(null);
            checkEligibility(); // Re-eval to allow new review
        }
    };

    if (loading) return <div className="py-8 text-center text-gray-500">Loading reviews...</div>;

    return (
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Reviews & Ratings</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <FaStar className="text-yellow-400 text-lg" />
                        <span className="font-bold text-lg">{stats.averageRating}</span>
                        <span className="text-gray-500 text-sm">({stats.totalReviews} reviews)</span>
                    </div>
                </div>

                {!isOperator && canReview && !existingReview && !showForm && (
                     <button 
                        onClick={handleOpenNew}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition"
                     >
                         Write a Review
                     </button>
                )}
                {!isOperator && existingReview && !showForm && (
                    <button 
                        onClick={handleOpenEdit}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                    >
                        Edit Your Review
                    </button>
                )}
            </div>

            {/* Review Form */}
            {showForm && (
                <div className="mb-8 bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <h4 className="font-semibold text-gray-800 mb-4">
                        {isEditing ? 'Edit Your Review' : 'Rate Your Experience'}
                    </h4>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none"
                                    >
                                        <FaStar className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 p-3"
                                rows="3"
                                placeholder="Share details of your own experience at this venue"
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Publish Review'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Review List */}
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        No reviews yet. Be the first to play and review!
                    </div>
                ) : (
                    reviews.map(review => (
                        <ReviewItem 
                            key={review.id} 
                            review={review} 
                            currentUser={currentUser} 
                            isOperator={isOperator} 
                            onReviewDeleted={handleReviewDeleted}
                            onReviewChanged={fetchReviews}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewSection;
