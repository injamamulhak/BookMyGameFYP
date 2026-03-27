import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedVenues } from '../../../services/venueService';

function FeaturedVenues() {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVenues = async () => {
            try {
                setLoading(true);
                const response = await getFeaturedVenues(6);
                if (response.success) {
                    setVenues(response.data);
                }
            } catch (err) {
                console.error('Failed to fetch featured venues:', err);
                setError('Failed to load venues');
            } finally {
                setLoading(false);
            }
        };
        fetchVenues();
    }, []);

    // Loading skeleton
    if (loading) {
        return (
            <section className="py-16 md:py-24 bg-white">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-2">
                                Featured Venues
                            </h2>
                            <p className="text-gray-600 text-lg">
                                Top-rated sports facilities in your area
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card p-0 overflow-hidden animate-pulse">
                                <div className="h-48 bg-gray-200"></div>
                                <div className="p-6">
                                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div className="flex gap-2 mb-4">
                                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                                    </div>
                                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Don't show section if no venues or error
    if (error || venues.length === 0) {
        return null;
    }

    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="container-custom">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-2">
                            Featured Venues
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Top-rated sports facilities in your area
                        </p>
                    </div>
                    <Link to="/venues" className="hidden md:block btn-outline">
                        View All Venues
                    </Link>
                </div>

                {/* Venues Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {venues.map((venue) => {
                        // Get primary image or first image or use placeholder
                        const primaryImage = venue.images?.find(img => img.isPrimary)?.imageUrl
                            || venue.images?.[0]?.imageUrl
                            || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500';

                        // Get sport name - check for new single sport relation
                        const sportName = venue.sport?.name ||
                            venue.sports?.[0]?.sport?.name ||
                            'Sports';

                        return (
                            <Link
                                key={venue.id}
                                to={`/venues/${venue.id}`}
                                className="card group hover:-translate-y-2 p-0 overflow-hidden"
                            >
                                {/* Image */}
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={primaryImage}
                                        alt={venue.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                                        ⭐ {venue.rating ? Number(venue.rating).toFixed(1) : 'New'}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">
                                        {venue.name}
                                    </h3>

                                    {/* Location */}
                                    <div className="flex items-center text-gray-600 mb-4">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-sm">{venue.city || venue.address}</span>
                                    </div>

                                    {/* Sport Tag */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                                            {sportName}
                                        </span>
                                    </div>

                                    {/* Price and Reviews */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div>
                                            <span className="text-2xl font-bold text-gray-900">
                                                Rs. {venue.pricePerHour?.toLocaleString()}
                                            </span>
                                            <span className="text-gray-600 text-sm">/hour</span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {venue._count?.reviews || 0} reviews
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Mobile View All Button */}
                <div className="mt-8 text-center md:hidden">
                    <Link to="/venues" className="btn-outline">
                        View All Venues
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default FeaturedVenues;
