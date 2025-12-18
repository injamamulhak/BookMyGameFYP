import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Mock data - will be replaced with API call
const mockVenues = [
    {
        id: 1,
        name: 'Prime Sports Arena',
        location: 'Kathmandu, Nepal',
        image: 'https://images.unsplash.com/photo-1519865885283-6d3a0f8c0c3e?w=500',
        rating: 4.8,
        reviewCount: 124,
        sports: ['Football', 'Basketball'],
        price: 1500,
    },
    {
        id: 2,
        name: 'Champions Cricket Ground',
        location: 'Lalitpur, Nepal',
        image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500',
        rating: 4.6,
        reviewCount: 89,
        sports: ['Cricket'],
        price: 2000,
    },
    {
        id: 3,
        name: 'Elite Basketball Court',
        location: 'Pokhara, Nepal',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500',
        rating: 4.9,
        reviewCount: 156,
        sports: ['Basketball'],
        price: 1200,
    },
];

function FeaturedVenues() {
    const [venues, setVenues] = useState([]);

    useEffect(() => {
        // TODO: Replace with actual API call
        setVenues(mockVenues);
    }, []);

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
                    {venues.map((venue) => (
                        <Link
                            key={venue.id}
                            to={`/venues/${venue.id}`}
                            className="card group hover:-translate-y-2 p-0 overflow-hidden"
                        >
                            {/* Image */}
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={venue.image}
                                    alt={venue.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                                    ⭐ {venue.rating}
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
                                    <span className="text-sm">{venue.location}</span>
                                </div>

                                {/* Sports Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {venue.sports.map((sport) => (
                                        <span
                                            key={sport}
                                            className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
                                        >
                                            {sport}
                                        </span>
                                    ))}
                                </div>

                                {/* Price and Reviews */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div>
                                        <span className="text-2xl font-bold text-gray-900">
                                            Rs. {venue.price}
                                        </span>
                                        <span className="text-gray-600 text-sm">/hour</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {venue.reviewCount} reviews
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
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
