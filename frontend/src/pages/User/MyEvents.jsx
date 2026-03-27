import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

function MyEvents() {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
    const [cancelling, setCancelling] = useState(null);

    useEffect(() => {
        fetchRegistrations();
    }, [filter]);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? `?status=${filter}` : '';
            const response = await api.get(`/events/my-registrations${params}`);
            if (response.data.success) {
                setRegistrations(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching registrations:', err);
            setError('Failed to load your events');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRegistration = async (eventId) => {
        if (!confirm('Are you sure you want to cancel your registration?')) return;

        try {
            setCancelling(eventId);
            await api.delete(`/events/${eventId}/register`);
            fetchRegistrations();
        } catch (err) {
            console.error('Error cancelling:', err);
            alert(err.response?.data?.message || 'Failed to cancel registration');
        } finally {
            setCancelling(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getEventTypeLabel = (type) => {
        const labels = {
            tournament: 'Tournament',
            league: 'League',
            training: 'Training'
        };
        return labels[type] || type;
    };

    const isPast = (endDate) => new Date(endDate) < new Date();

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Events</h1>
                    <p className="text-gray-600">View and manage your event registrations</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: 'all', label: 'All Events' },
                        { key: 'upcoming', label: 'Upcoming' },
                        { key: 'past', label: 'Past' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === tab.key
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center">
                        <p className="mb-4">{error}</p>
                        <button onClick={fetchRegistrations} className="text-primary-600 hover:underline">
                            Try again
                        </button>
                    </div>
                ) : registrations.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No event registrations yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Browse upcoming events and register to participate!
                        </p>
                        <Link
                            to="/events"
                            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Browse Events
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {registrations.map((reg) => (
                            <div
                                key={reg.id}
                                className={`bg-white rounded-xl shadow-sm overflow-hidden ${isPast(reg.event.endDate) ? 'opacity-75' : ''}`}
                            >
                                <div className="flex flex-col md:flex-row">
                                    {/* Event Image */}
                                    <div className="md:w-48 h-40 md:h-auto flex-shrink-0">
                                        <img
                                            src={reg.event.imageUrl || reg.event.venue?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500'}
                                            alt={reg.event.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Event Details */}
                                    <div className="flex-1 p-6">
                                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                                                        {getEventTypeLabel(reg.event.eventType)}
                                                    </span>
                                                    {isPast(reg.event.endDate) && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                                            Completed
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                                    <Link to={`/events/${reg.event.id}`} className="hover:text-primary-600">
                                                        {reg.event.title}
                                                    </Link>
                                                </h3>
                                                <p className="text-gray-600">
                                                    {reg.event.venue?.name} • {reg.event.venue?.city}
                                                </p>
                                            </div>

                                            {/* Price */}
                                            <div className="text-right">
                                                {parseFloat(reg.event.registrationFee) > 0 ? (
                                                    <p className="text-xl font-bold text-gray-900">
                                                        Rs. {parseFloat(reg.event.registrationFee).toLocaleString()}
                                                    </p>
                                                ) : (
                                                    <p className="text-xl font-bold text-green-600">Free</p>
                                                )}
                                                <p className={`text-sm ${reg.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {reg.paymentStatus === 'completed' ? '✓ Paid' : '⏳ Payment Pending'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Date & Time */}
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {formatDate(reg.event.startDate)}
                                                {reg.event.startDate !== reg.event.endDate && (
                                                    <span> - {formatDate(reg.event.endDate)}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Registered {new Date(reg.registeredAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3">
                                            <Link
                                                to={`/events/${reg.event.id}`}
                                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                                            >
                                                View Event
                                            </Link>
                                            {!isPast(reg.event.startDate) && (
                                                <button
                                                    onClick={() => handleCancelRegistration(reg.event.id)}
                                                    disabled={cancelling === reg.event.id}
                                                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                                                >
                                                    {cancelling === reg.event.id ? 'Cancelling...' : 'Cancel Registration'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Back Link */}
                <div className="mt-8">
                    <Link
                        to="/events"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Browse All Events
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default MyEvents;
