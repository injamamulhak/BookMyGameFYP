import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';
import api from '../../../services/api';

// Helper to format a date nicely
const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function TopReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopReviews = async () => {
            try {
                // Fetch top-rated venues and grab their latest reviews
                const venueRes = await api.get('/venues?sort=rating&limit=5&approvalStatus=approved&isActive=true');
                const topVenues = venueRes.data?.data || [];

                const reviewPromises = topVenues
                    .filter(v => v.totalReviews > 0)
                    .slice(0, 4)
                    .map(v =>
                        api.get(`/reviews/venue/${v.id}?sort=highest&limit=1`).then(r => ({
                            review: r.data.data?.[0],
                            venue: v,
                        }))
                    );

                const results = await Promise.all(reviewPromises);
                const valid = results.filter(r => r.review);
                setReviews(valid);
            } catch (err) {
                console.error('TopReviews: failed to fetch', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTopReviews();
    }, []);

    if (loading || reviews.length === 0) return null;

    return (
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <div className="container-custom">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full mb-4 uppercase tracking-wide">
                        Reviews
                    </span>
                    <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-3">
                        What Players Are Saying
                    </h2>
                    <p className="text-gray-500 text-lg max-w-xl mx-auto">
                        Real experiences from verified players at our top-rated venues.
                    </p>
                </div>

                {/* Reviews Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                    {reviews.map(({ review, venue }, idx) => {
                        const primaryImage =
                            venue.images?.find(img => img.isPrimary)?.imageUrl ||
                            venue.images?.[0]?.imageUrl ||
                            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200';

                        return (
                            <div
                                key={review.id}
                                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col"
                            >
                                {/* Quote icon */}
                                <FaQuoteLeft className="text-primary-200 text-3xl mb-4" />

                                {/* Star rating */}
                                <div className="flex text-yellow-400 mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar
                                            key={i}
                                            className={i < review.rating ? 'text-yellow-400' : 'text-gray-200'}
                                        />
                                    ))}
                                </div>

                                {/* Comment text */}
                                <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-5 line-clamp-4">
                                    {review.comment || 'Great experience overall — highly recommended!'}
                                </p>

                                {/* Reviewer */}
                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                    <img
                                        src={review.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.fullName)}&background=random`}
                                        alt={review.user?.fullName}
                                        className="w-9 h-9 rounded-full object-cover"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">
                                            {review.user?.fullName}
                                        </p>
                                        <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                                    </div>
                                </div>

                                {/* Venue link */}
                                <Link
                                    to={`/venues/${venue.id}`}
                                    className="mt-3 flex items-center gap-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    <img src={primaryImage} alt="" className="w-5 h-5 rounded object-cover" />
                                    {venue.name}
                                </Link>
                            </div>
                        );
                    })}
                </div>

                <div className="text-center mt-10">
                    <Link to="/venues" className="btn-outline">
                        Explore All Venues
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default TopReviews;
