import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { formatTime, formatDateLong } from '../../utils/timeUtils';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

function BookingSuccess() {
    const { bookingId } = useParams();
    const [searchParams] = useSearchParams();
    const bookingCount = parseInt(searchParams.get('count')) || 1;
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const response = await api.get(`/bookings/my-bookings`);
                if (response.data.success) {
                    const found = response.data.data.find(b => b.id === bookingId);
                    if (found) {
                        setBooking(found);
                    } else {
                        setError('Booking not found');
                    }
                }
            } catch (err) {
                console.error('Error fetching booking:', err);
                setError('Failed to load booking details');
            } finally {
                setLoading(false);
            }
        };

        if (bookingId) {
            fetchBooking();
        }
    }, [bookingId]);



    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container-custom py-16 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container-custom py-12">
                <div className="max-w-2xl mx-auto">
                    {error ? (
                        <div className="bg-white rounded-xl p-8 shadow-soft text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                            <p className="text-gray-600 mb-6">{error}</p>
                            <Link to="/venues" className="btn-primary">Browse Venues</Link>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl p-8 shadow-soft">
                            {/* Success Icon */}
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                                    {bookingCount > 1 ? `${bookingCount} Bookings Confirmed!` : 'Booking Confirmed!'}
                                </h1>
                                <p className="text-gray-600">
                                    {bookingCount > 1
                                        ? `Your ${bookingCount} bookings have been successfully placed.`
                                        : 'Your booking has been successfully placed.'
                                    }
                                </p>
                            </div>

                            {/* Booking ID */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
                                <p className="text-sm text-gray-500 mb-1">
                                    {bookingCount > 1 ? 'Primary Booking ID' : 'Booking ID'}
                                </p>
                                <p className="font-mono text-lg font-bold text-gray-900">{booking?.id?.slice(0, 12)}...</p>
                                {bookingCount > 1 && (
                                    <p className="text-xs text-gray-500 mt-1">+ {bookingCount - 1} more booking{bookingCount > 2 ? 's' : ''}</p>
                                )}
                            </div>

                            {/* Booking Details */}
                            <div className="space-y-4 border-y border-gray-100 py-6 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Venue</span>
                                    <span className="font-medium text-gray-900">{booking?.venue?.name || booking?.slot?.venue?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Date</span>
                                    <span className="font-medium text-gray-900">
                                        {booking?.bookingDate ? formatDateLong(booking.bookingDate) : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Time</span>
                                    <span className="font-medium text-gray-900">
                                        {booking?.slot ?
                                            `${formatTime(booking.slot.startTime)} - ${formatTime(booking.slot.endTime)}`
                                            : booking?.timeSlot ?
                                                `${formatTime(booking.timeSlot.startTime)} - ${formatTime(booking.timeSlot.endTime)}`
                                                : 'N/A'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Amount</span>
                                    <span className="font-bold text-primary-600">Rs. {booking?.totalPrice?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status</span>
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                        {booking?.status || 'Pending'}
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-blue-50 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium">What's Next?</p>
                                        <ul className="mt-1 space-y-1 text-blue-700">
                                            <li>• The venue operator will confirm your booking</li>
                                            <li>• You'll be notified once confirmed</li>
                                            <li>• Pay at the venue on your booking date</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link to="/my-bookings" className="flex-1 btn-primary text-center py-3">
                                    View My Bookings
                                </Link>
                                <Link to="/" className="flex-1 btn-outline text-center py-3">
                                    Return Home
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default BookingSuccess;
