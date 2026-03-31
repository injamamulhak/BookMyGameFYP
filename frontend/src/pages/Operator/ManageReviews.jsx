import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaStar, FaFlag, FaReply, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StarDisplay = ({ rating }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <FaStar key={i} className={`text-xs ${i <= rating ? 'text-yellow-400' : 'text-gray-200'}`} />
        ))}
        <span className="ml-1 text-xs font-medium text-gray-600">{rating}/5</span>
    </div>
);

function ManageReviews() {
    const [reviews, setReviews] = useState([]);
    const [venues, setVenues] = useState([]);
    const [selectedVenue, setSelectedVenue] = useState('all');
    const [filterFlag, setFilterFlag] = useState('all'); // all | flagged | unflagged
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null); // reviewId being replied to
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            // 1. Get operator's venues
            const venuesRes = await api.get('/venues/operator/my-venues');
            const myVenues = venuesRes.data?.data || [];
            setVenues(myVenues);

            // 2. For each venue, fetch reviews (parallel)
            const allReviewsPromises = myVenues.map(v =>
                api.get(`/reviews/venue/${v.id}?limit=100`).then(r =>
                    (r.data.data || []).map(rev => ({ ...rev, venueName: v.name, venueId: v.id }))
                ).catch(() => [])
            );
            const results = await Promise.all(allReviewsPromises);
            setReviews(results.flat());
        } catch (err) {
            console.error('Error fetching reviews:', err);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleToggleFlag = async (review) => {
        try {
            const res = await api.patch(`/reviews/${review.id}/flag`);
            if (res.data.success) {
                toast.success(res.data.message);
                setReviews(prev =>
                    prev.map(r => r.id === review.id ? { ...r, isFlagged: !r.isFlagged } : r)
                );
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to flag review');
        }
    };

    const handleSubmitReply = async (reviewId) => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/reviews/${reviewId}/replies`, { comment: replyText.trim() });
            if (res.data.success) {
                toast.success('Reply posted!');
                setReplyingTo(null);
                setReplyText('');
                fetchReviews(); // refresh to show new reply
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to post reply');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReply = async (replyId) => {
        if (!window.confirm('Delete this reply?')) return;
        try {
            await api.delete(`/reviews/replies/${replyId}`);
            toast.success('Reply deleted');
            fetchReviews();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete reply');
        }
    };

    // Apply filters
    const filtered = reviews.filter(r => {
        const venueMatch = selectedVenue === 'all' || r.venueId === selectedVenue;
        const flagMatch = filterFlag === 'all' || (filterFlag === 'flagged' ? r.isFlagged : !r.isFlagged);
        return venueMatch && flagMatch;
    });

    const flaggedCount = reviews.filter(r => r.isFlagged).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Reviews</h1>
                    <p className="text-gray-500 mt-1">
                        {reviews.length} total reviews across {venues.length} venue{venues.length !== 1 ? 's' : ''}.
                        {flaggedCount > 0 && (
                            <span className="ml-2 text-red-500 font-medium">
                                {flaggedCount} flagged
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Venue</label>
                    <select
                        value={selectedVenue}
                        onChange={e => setSelectedVenue(e.target.value)}
                        className="text-sm border-gray-200 rounded-lg focus:ring-primary-500"
                    >
                        <option value="all">All Venues</option>
                        {venues.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <div className="flex rounded-lg overflow-hidden border border-gray-200">
                        {[['all', 'All'], ['unflagged', 'Active'], ['flagged', 'Flagged']].map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setFilterFlag(val)}
                                className={`px-3 py-1.5 text-sm font-medium transition ${filterFlag === val
                                    ? val === 'flagged'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-primary-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                    <FaStar className="text-gray-200 text-5xl mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No reviews found</p>
                    <p className="text-sm text-gray-400 mt-1">
                        {filterFlag === 'flagged' ? 'No flagged reviews.' : 'Reviews will appear here once customers leave them.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(review => (
                        <div
                            key={review.id}
                            className={`bg-white rounded-xl p-5 shadow-sm border transition ${review.isFlagged ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}
                        >
                            {/* Review Header */}
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
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
                                <div className="flex items-center gap-2">
                                    {review.isFlagged && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                                            <FaFlag size={10} /> Flagged
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400">
                                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                    </span>
                                    <Link
                                        to={`/venues/${review.venueId}`}
                                        className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                        title="View on public page"
                                    >
                                        <FaExternalLinkAlt size={10} /> {review.venueName}
                                    </Link>
                                </div>
                            </div>

                            {/* Comment */}
                            <p className="text-gray-600 text-sm mb-4 pl-1 border-l-2 border-gray-200 ml-1">
                                {review.comment || <em className="text-gray-400">No comment provided</em>}
                            </p>

                            {/* Existing Replies */}
                            {review.replies && review.replies.length > 0 && (
                                <div className="ml-4 mt-2 mb-3 space-y-2">
                                    {review.replies.map(reply => {
                                        const isOperatorReply = reply.user?.role === 'operator';
                                        return (
                                            <div
                                                key={reply.id}
                                                className={`flex gap-2 p-3 rounded-lg text-sm ${isOperatorReply ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50'}`}
                                            >
                                                <img
                                                    src={reply.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user?.fullName || 'U')}&background=random`}
                                                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                                    alt=""
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-gray-700 text-xs">{reply.user?.fullName}</span>
                                                            {isOperatorReply && (
                                                                <span className="bg-primary-100 text-primary-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">You</span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteReply(reply.id)}
                                                            className="text-gray-400 hover:text-red-500 transition flex-shrink-0"
                                                            title="Delete reply"
                                                        >
                                                            <FaTrash size={10} />
                                                        </button>
                                                    </div>
                                                    <p className="text-gray-600 mt-0.5 text-xs">{reply.comment}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 mt-1 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => handleToggleFlag(review)}
                                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition ${review.isFlagged
                                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                >
                                    <FaFlag size={11} />
                                    {review.isFlagged ? 'Unflag' : 'Flag as False'}
                                </button>
                                {!review.isFlagged && (
                                    <button
                                        onClick={() => {
                                            setReplyingTo(review.id);
                                            setReplyText('');
                                        }}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition"
                                    >
                                        <FaReply size={11} /> Reply
                                    </button>
                                )}
                            </div>

                            {/* Reply Form */}
                            {replyingTo === review.id && (
                                <div className="mt-3 p-3 bg-primary-50/50 rounded-lg border border-primary-100">
                                    <p className="text-xs font-medium text-primary-700 mb-2">Reply as Operator</p>
                                    <textarea
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        className="w-full text-sm border-primary-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white resize-none"
                                        rows="2"
                                        placeholder="Type your response to the customer..."
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button
                                            onClick={() => setReplyingTo(null)}
                                            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleSubmitReply(review.id)}
                                            disabled={submitting || !replyText.trim()}
                                            className="text-xs bg-primary-600 text-white px-4 py-1.5 rounded-md hover:bg-primary-700 disabled:opacity-50 transition"
                                        >
                                            {submitting ? 'Posting...' : 'Post Reply'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ManageReviews;
