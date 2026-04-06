import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

function EventListings() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [deleting, setDeleting] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, eventId: null });

    useEffect(() => {
        fetchEvents();
    }, [filter]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? `?status=${filter}` : '';
            const response = await api.get(`/events/operator/my-events${params}`);
            if (response.data.success) {
                setEvents(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (eventId) => {
        setConfirmModal({ open: true, eventId });
    };

    const confirmDelete = async () => {
        const { eventId } = confirmModal;
        setConfirmModal({ open: false, eventId: null });
        try {
            setDeleting(eventId);
            await api.delete(`/events/${eventId}`);
            toast.success('Event deleted successfully');
            fetchEvents();
        } catch (err) {
            console.error('Error deleting event:', err);
            toast.error(err.response?.data?.message || 'Failed to delete event');
        } finally {
            setDeleting(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getEventTypeLabel = (type) => {
        const labels = { tournament: 'Tournament', league: 'League', training: 'Training' };
        return labels[type] || type;
    };

    const getEventTypeBadge = (type) => {
        const badges = {
            tournament: 'bg-purple-100 text-purple-700',
            league: 'bg-blue-100 text-blue-700',
            training: 'bg-green-100 text-green-700'
        };
        return badges[type] || 'bg-gray-100 text-gray-700';
    };

    const isPast = (endDate) => new Date(endDate) < new Date();

    return (
        <div className="space-y-6">
            <ConfirmModal
                isOpen={confirmModal.open}
                title='Delete Event?'
                message='Are you sure you want to delete this event? This will also remove all registrations and cannot be undone.'
                confirmText='Delete Event'
                confirmVariant='danger'
                onConfirm={confirmDelete}
                onCancel={() => setConfirmModal({ open: false, eventId: null })}
            />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
                    <p className="text-gray-600 mt-1">Manage tournaments, leagues, and training sessions</p>
                </div>
                <Link
                    to="/operator/events/new"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Event
                </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
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
                    <button onClick={fetchEvents} className="text-primary-600 hover:underline">
                        Try again
                    </button>
                </div>
            ) : events.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
                    <p className="text-gray-600 mb-6">
                        Create your first event to attract participants to your venues!
                    </p>
                    <Link
                        to="/operator/events/new"
                        className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Your First Event
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrations</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {events.map((event) => (
                                <tr key={event.id} className={`hover:bg-gray-50 ${isPast(event.endDate) ? 'opacity-60' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img
                                                    className="h-10 w-10 rounded-lg object-cover"
                                                    src={event.imageUrl || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=100'}
                                                    alt={event.title}
                                                />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{event.title}</div>
                                                <div className="text-sm text-gray-500">{event.venue?.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeBadge(event.eventType)}`}>
                                            {getEventTypeLabel(event.eventType)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatDate(event.startDate)}</div>
                                        {event.startDate !== event.endDate && (
                                            <div className="text-sm text-gray-500">to {formatDate(event.endDate)}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {event.registrationCount}
                                            {event.maxParticipants && ` / ${event.maxParticipants}`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {parseFloat(event.registrationFee) === 0 ? (
                                                <span className="text-green-600">Free</span>
                                            ) : (
                                                `Rs. ${parseFloat(event.registrationFee).toLocaleString()}`
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isPast(event.endDate) ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Completed</span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">Active</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                to={`/operator/events/${event.id}`}
                                                className="text-primary-600 hover:text-primary-900"
                                                title="View Registrations"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </Link>
                                            <Link
                                                to={`/operator/events/${event.id}/edit`}
                                                className="text-gray-600 hover:text-gray-900"
                                                title="Edit Event"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                disabled={deleting === event.id}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                title="Delete Event"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default EventListings;
