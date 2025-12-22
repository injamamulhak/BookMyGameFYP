import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

/**
 * BookingDetail - Detailed view of a single booking for operators
 * Shows full booking info with confirm/cancel actions
 */
function BookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        fetchBooking();
    }, [id]);

    const fetchBooking = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/bookings/operator/${id}`);
            if (response.data.success) {
                setBooking(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching booking:', err);
            setError(err.response?.data?.message || 'Failed to load booking details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!confirm('Are you sure you want to confirm this booking? The customer will be notified.')) return;

        try {
            setActionLoading(true);
            const response = await api.put(`/bookings/operator/${id}/confirm`);
            if (response.data.success) {
                setBooking(prev => ({ ...prev, status: 'confirmed' }));
            }
        } catch (err) {
            console.error('Error confirming booking:', err);
            alert(err.response?.data?.message || 'Failed to confirm booking');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        try {
            setActionLoading(true);
            const response = await api.put(`/bookings/operator/${id}/cancel`, { reason: cancelReason });
            if (response.data.success) {
                setBooking(prev => ({ ...prev, status: 'cancelled', notes: cancelReason ? `Cancelled by operator: ${cancelReason}` : 'Cancelled by operator' }));
                setShowCancelModal(false);
                setCancelReason('');
            }
        } catch (err) {
            console.error('Error cancelling booking:', err);
            alert(err.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            confirmed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            completed: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> },
        };
        return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
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

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Error Loading Booking</h3>
                <p>{error}</p>
                <div className="mt-4 flex space-x-3">
                    <button onClick={fetchBooking} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Retry
                    </button>
                    <Link to="/operator/bookings" className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                        Back to Bookings
                    </Link>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Booking not found</p>
                <Link to="/operator/bookings" className="text-primary-600 hover:underline mt-2 inline-block">
                    Back to Bookings
                </Link>
            </div>
        );
    }

    const statusStyle = getStatusBadge(booking.status);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/operator/bookings')}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Booking Details</h1>
                        <p className="text-gray-500 text-sm mt-0.5">ID: {booking.id}</p>
                    </div>
                </div>
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                    <span className="mr-2">{statusStyle.icon}</span>
                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Customer Information
                        </h2>
                        <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                                {booking.user?.profileImage ? (
                                    <img src={booking.user.profileImage} alt={booking.user.fullName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-white font-bold text-xl">
                                        {booking.user?.fullName?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-semibold text-gray-900">{booking.user?.fullName}</h3>
                                <div className="mt-2 space-y-1">
                                    <p className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {booking.user?.email}
                                    </p>
                                    {booking.user?.phone && (
                                        <p className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {booking.user?.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Details Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Booking Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Venue</p>
                                <p className="font-semibold text-gray-900">{booking.slot?.venue?.name}</p>
                                {booking.slot?.venue?.address && (
                                    <p className="text-sm text-gray-600 mt-1">{booking.slot?.venue?.address}</p>
                                )}
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Date</p>
                                <p className="font-semibold text-gray-900">{formatDate(booking.slot?.date)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Time Slot</p>
                                <p className="font-semibold text-gray-900">
                                    {formatTime(booking.slot?.startTime)} - {formatTime(booking.slot?.endTime)}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Booked On</p>
                                <p className="font-semibold text-gray-900">{formatDateTime(booking.createdAt)}</p>
                            </div>
                        </div>

                        {booking.notes && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-700 font-medium mb-1">Notes</p>
                                <p className="text-blue-800">{booking.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Payment Information */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Payment Information
                        </h2>
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                            <div>
                                <p className="text-sm text-emerald-700 mb-1">Total Amount</p>
                                <p className="text-3xl font-bold text-emerald-700">
                                    Rs. {parseFloat(booking.totalPrice).toLocaleString()}
                                </p>
                            </div>
                            {booking.payments && booking.payments.length > 0 ? (
                                <div className="text-right">
                                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${booking.payments[0].status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {booking.payments[0].status === 'completed' ? 'Paid' : 'Pending Payment'}
                                    </span>
                                    <p className="text-sm text-gray-500 mt-1">
                                        via {booking.payments[0].paymentMethod || 'N/A'}
                                    </p>
                                </div>
                            ) : (
                                <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                                    No Payment Record
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    {/* Actions Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                        <div className="space-y-3">
                            {booking.status === 'pending' && (
                                <>
                                    <button
                                        onClick={handleConfirmBooking}
                                        disabled={actionLoading}
                                        className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Confirm Booking
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        disabled={actionLoading}
                                        className="w-full flex items-center justify-center px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Cancel Booking
                                    </button>
                                </>
                            )}

                            {booking.status === 'confirmed' && (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    disabled={actionLoading}
                                    className="w-full flex items-center justify-center px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancel Booking
                                </button>
                            )}

                            {booking.status === 'cancelled' && (
                                <div className="p-4 bg-red-50 rounded-lg text-center">
                                    <p className="text-red-600 font-medium">This booking has been cancelled</p>
                                </div>
                            )}

                            <Link
                                to={`/operator/venues/${booking.slot?.venue?.id}`}
                                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                View Venue
                            </Link>
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
                        <h3 className="font-semibold mb-3">Quick Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="opacity-80">Status</span>
                                <span className="font-medium">{booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-80">Date</span>
                                <span className="font-medium">{formatDate(booking.slot?.date).split(',')[0]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-80">Amount</span>
                                <span className="font-medium">Rs. {parseFloat(booking.totalPrice).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Booking</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to cancel this booking? The customer will be notified.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reason for cancellation (optional)
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Enter reason..."
                            />
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Keep Booking
                            </button>
                            <button
                                onClick={handleCancelBooking}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BookingDetail;
