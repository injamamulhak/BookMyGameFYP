import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaStar, FaFlag, FaTrash, FaCheck, FaExternalLinkAlt } from 'react-icons/fa';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

const StarDisplay = ({ rating }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <FaStar key={i} className={`text-xs ${i <= rating ? 'text-yellow-400' : 'text-gray-200'}`} />
        ))}
        <span className="ml-1 text-xs text-gray-500">{rating}/5</span>
    </div>
);

function FlaggedReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ open: false, reviewId: null });

    // Fetch all flagged reviews across all venues (admin can see everything)
    const fetchFlagged = useCallback(async () => {
        try {
            setLoading(true);
            // Admin route to get all venues
            const venuesRes = await api.get('/admin/venues?limit=100&approvalStatus=approved');
            const allVenues = venuesRes.data?.data || venuesRes.data?.venues || [];

            const reviewPromises = allVenues.map(v =>
                api.get(`/reviews/venue/${v.id}?limit=100`).then(r =>
                    (r.data.data || [])
                        .filter(rev => rev.isFlagged)
                        .map(rev => ({ ...rev, venueName: v.name, venueId: v.id, operatorName: v.operator?.fullName }))
                ).catch(() => [])
            );
            const results = await Promise.all(reviewPromises);
            setReviews(results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            console.error('Error fetching flagged reviews:', err);
            toast.error('Failed to load flagged reviews');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFlagged();
    }, [fetchFlagged]);

    const handleDeleteReview = (reviewId) => {
        setConfirmModal({ open: true, reviewId });
    };

    const confirmDeleteReview = async () => {
        const { reviewId } = confirmModal;
        setConfirmModal({ open: false, reviewId: null });
        try {
            await api.delete(`/reviews/${reviewId}`);
            toast.success('Review deleted successfully');
            setReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete review');
        }
    };

    const handleUnflagReview = async (reviewId) => {
        try {
            const res = await api.patch(`/reviews/${reviewId}/flag`);
            if (res.data.success) {
                toast.success('Review unflagged — it will now display normally');
                setReviews(prev => prev.filter(r => r.id !== reviewId));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to unflag review');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ConfirmModal
                isOpen={confirmModal.open}
                title='Permanently Delete Review?'
                message='This will permanently delete this review and all its replies. This action cannot be undone.'
                confirmText='Delete Review'
                confirmVariant='danger'
                onConfirm={confirmDeleteReview}
                onCancel={() => setConfirmModal({ open: false, reviewId: null })}
            />
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Flagged Reviews</h1>
                <p className="text-gray-500 mt-1">
                    These reviews have been flagged by venue operators as potentially false or inappropriate.
                    You can <strong>delete</strong> them if they violate policy, or <strong>unflag</strong> them if they are valid.
                </p>
            </div>

            {/* Alert Banner */}
            {reviews.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <FaFlag className="text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 font-medium">
                        {reviews.length} review{reviews.length > 1 ? 's' : ''} pending moderation decision.
                    </p>
                </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaCheck className="text-green-500 text-2xl" />
                    </div>
                    <p className="text-gray-700 font-semibold text-lg">All clear!</p>
                    <p className="text-sm text-gray-400 mt-1">No flagged reviews at the moment.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-red-400 border border-red-100">
                            {/* Top row */}
                            <div className="flex flex-wrap gap-3 justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={review.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.fullName || 'U')}&background=random`}
                                        className="w-10 h-10 rounded-full object-cover"
                                        alt={review.user?.fullName}
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-800">{review.user?.fullName}</p>
                                        <StarDisplay rating={review.rating} />
                                    </div>
                                </div>
                                <div className="text-right text-xs text-gray-400">
                                    <p>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</p>
                                    <Link
                                        to={`/venues/${review.venueId}`}
                                        className="text-primary-600 hover:underline inline-flex items-center gap-1 mt-1"
                                    >
                                        <FaExternalLinkAlt size={9} /> {review.venueName}
                                    </Link>
                                    <p className="text-gray-400 mt-0.5">Operator: {review.operatorName || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Review comment */}
                            <div className="bg-red-50/50 rounded-lg p-3 mb-4 border border-red-100">
                                <p className="text-gray-700 text-sm">
                                    {review.comment || <em className="text-gray-400">No comment provided</em>}
                                </p>
                            </div>

                            {/* Existing replies (for context) */}
                            {review.replies && review.replies.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs text-gray-400 uppercase font-medium mb-2">Replies ({review.replies.length})</p>
                                    <div className="space-y-2 pl-3 border-l-2 border-gray-100">
                                        {review.replies.map(reply => (
                                            <div key={reply.id} className="text-xs text-gray-600">
                                                <span className="font-semibold">{reply.user?.fullName}</span>
                                                {reply.user?.role === 'operator' && (
                                                    <span className="ml-1 bg-primary-100 text-primary-700 text-[9px] font-bold px-1 py-0.5 rounded-full uppercase">Operator</span>
                                                )}
                                                : {reply.comment}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Admin Action Buttons */}
                            <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => handleUnflagReview(review.id)}
                                    className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition"
                                >
                                    <FaCheck size={12} />
                                    Keep Review (Unflag)
                                </button>
                                <button
                                    onClick={() => handleDeleteReview(review.id)}
                                    className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                >
                                    <FaTrash size={12} />
                                    Delete Review
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FlaggedReviews;
