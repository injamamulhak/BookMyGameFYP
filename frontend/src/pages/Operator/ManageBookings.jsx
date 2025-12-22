import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

/**
 * ManageBookings - Operator's booking management page
 * Lists all bookings across operator's venues with filters and actions
 */
function ManageBookings() {
    const [bookings, setBookings] = useState([]);
    const [venues, setVenues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        venueId: '',
        status: '',
        startDate: '',
        endDate: '',
        search: '',
    });

    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
    });

    useEffect(() => {
        fetchVenues();
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [filters.venueId, filters.status, filters.startDate, filters.endDate, pagination.page]);

    const fetchVenues = async () => {
        try {
            const response = await api.get('/venues/operator/my-venues');
            if (response.data.success) {
                setVenues(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching venues:', err);
        }
    };

    const fetchBookings = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();

            if (filters.venueId) params.append('venueId', filters.venueId);
            if (filters.status) params.append('status', filters.status);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            params.append('page', pagination.page);
            params.append('limit', pagination.limit);

            const response = await api.get(`/bookings/operator?${params.toString()}`);

            if (response.data.success) {
                setBookings(response.data.data);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    pages: response.data.pagination.pages,
                }));
            }
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError('Failed to load bookings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleConfirmBooking = async (bookingId) => {
        if (!confirm('Are you sure you want to confirm this booking?')) return;

        try {
            setActionLoading(bookingId);
            const response = await api.put(`/bookings/operator/${bookingId}/confirm`);
            if (response.data.success) {
                fetchBookings();
            }
        } catch (err) {
            console.error('Error confirming booking:', err);
            alert(err.response?.data?.message || 'Failed to confirm booking');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        const reason = prompt('Please provide a reason for cancellation (optional):');
        if (reason === null) return; // User clicked cancel

        try {
            setActionLoading(bookingId);
            const response = await api.put(`/bookings/operator/${bookingId}/cancel`, { reason });
            if (response.data.success) {
                fetchBookings();
            }
        } catch (err) {
            console.error('Error cancelling booking:', err);
            alert(err.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setActionLoading(null);
        }
    };

    const clearFilters = () => {
        setFilters({
            venueId: '',
            status: '',
            startDate: '',
            endDate: '',
            search: '',
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            confirmed: 'bg-green-100 text-green-800 border-green-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
            completed: 'bg-blue-100 text-blue-800 border-blue-200',
        };
        return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '-';
        return new Date(timeString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    // Filter bookings by search term (client-side)
    const filteredBookings = bookings.filter(booking => {
        if (!filters.search) return true;
        const searchLower = filters.search.toLowerCase();
        return (
            booking.user?.fullName?.toLowerCase().includes(searchLower) ||
            booking.user?.email?.toLowerCase().includes(searchLower) ||
            booking.slot?.venue?.name?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Manage Bookings</h1>
                    <p className="text-gray-600 mt-1">View and manage all bookings for your venues</p>
                </div>
                <Link
                    to="/operator/calendar"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Calendar View
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by customer name, email, or venue..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    {/* Venue Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                        <select
                            value={filters.venueId}
                            onChange={(e) => handleFilterChange('venueId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">All Venues</option>
                            {venues.map(venue => (
                                <option key={venue.id} value={venue.id}>{venue.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                        <button
                            onClick={clearFilters}
                            className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Date Range (collapsible on mobile) */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Bookings', value: pagination.total, color: 'bg-blue-50 text-blue-700' },
                    { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: 'bg-yellow-50 text-yellow-700' },
                    { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: 'bg-green-50 text-green-700' },
                    { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: 'bg-red-50 text-red-700' },
                ].map((stat, index) => (
                    <div key={index} className={`${stat.color} rounded-xl p-4`}>
                        <p className="text-sm font-medium opacity-75">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={fetchBookings} className="underline hover:no-underline">
                        Retry
                    </button>
                </div>
            )}

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
                        <p className="text-gray-500">
                            {filters.venueId || filters.status || filters.startDate || filters.endDate
                                ? 'Try adjusting your filters to see more results.'
                                : 'Bookings will appear here when customers book your venues.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Venue
                                        </th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Date & Time
                                        </th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white font-semibold text-sm">
                                                            {booking.user?.fullName?.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {booking.user?.fullName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {booking.user?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {booking.slot?.venue?.name}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900">
                                                    {formatDate(booking.slot?.date)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatTime(booking.slot?.startTime)} - {formatTime(booking.slot?.endTime)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadge(booking.status)}`}>
                                                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    Rs. {parseFloat(booking.totalPrice).toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Link
                                                        to={`/operator/bookings/${booking.id}`}
                                                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </Link>
                                                    {booking.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleConfirmBooking(booking.id)}
                                                                disabled={actionLoading === booking.id}
                                                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Confirm Booking"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancelBooking(booking.id)}
                                                                disabled={actionLoading === booking.id}
                                                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Cancel Booking"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden divide-y divide-gray-100">
                            {filteredBookings.map((booking) => (
                                <div key={booking.id} className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-sm">
                                                    {booking.user?.fullName?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <p className="font-medium text-gray-900">{booking.user?.fullName}</p>
                                                <p className="text-xs text-gray-500">{booking.user?.email}</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadge(booking.status)}`}>
                                            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Venue</span>
                                            <span className="font-medium text-gray-900">{booking.slot?.venue?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Date</span>
                                            <span className="text-gray-900">{formatDate(booking.slot?.date)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Time</span>
                                            <span className="text-gray-900">{formatTime(booking.slot?.startTime)} - {formatTime(booking.slot?.endTime)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Amount</span>
                                            <span className="font-semibold text-gray-900">Rs. {parseFloat(booking.totalPrice).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-gray-100">
                                        <Link
                                            to={`/operator/bookings/${booking.id}`}
                                            className="px-3 py-1.5 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                                        >
                                            View
                                        </Link>
                                        {booking.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleConfirmBooking(booking.id)}
                                                    disabled={actionLoading === booking.id}
                                                    className="px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => handleCancelBooking(booking.id)}
                                                    disabled={actionLoading === booking.id}
                                                    className="px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
                                </p>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded-lg font-medium">
                                        {pagination.page}
                                    </span>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page >= pagination.pages}
                                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default ManageBookings;
