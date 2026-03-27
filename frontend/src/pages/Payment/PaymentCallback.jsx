import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

function PaymentCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, failed
    const [message, setMessage] = useState('Verifying your payment...');
    const [paymentData, setPaymentData] = useState(null);

    // Detect whether this is an event registration payment
    const paymentType = searchParams.get('type'); // 'event' | null (venue booking)

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Get Khalti callback parameters
                const pidx = searchParams.get('pidx');
                const txnId = searchParams.get('transaction_id');
                const khaltiStatus = searchParams.get('status');
                const purchaseOrderId = searchParams.get('purchase_order_id');

                if (!pidx) {
                    setStatus('failed');
                    setMessage('Invalid payment callback. Missing payment identifier.');
                    return;
                }

                // Check if payment was cancelled on Khalti side
                if (khaltiStatus === 'Canceled' || khaltiStatus === 'User canceled') {
                    // We don't return early here. We want the backend API to be called
                    // so it can clean up any pending bookings or event registrations.
                }

                // Verify payment with backend
                const response = await api.get('/payments/khalti/verify', {
                    params: { pidx, transaction_id: txnId, status: khaltiStatus, purchase_order_id: purchaseOrderId }
                });

                if (response.data.success && response.data.data.status === 'completed') {
                    setStatus('success');
                    setMessage(
                        paymentType === 'event'
                            ? 'Payment successful! Your event registration is confirmed.'
                            : 'Payment successful! Your booking is confirmed.'
                    );
                    setPaymentData(response.data.data);

                    // Clear cart from localStorage
                    localStorage.removeItem('bookingCart');
                    sessionStorage.removeItem('pendingBooking');
                } else if (response.data.data?.status === 'pending') {
                    setStatus('verifying');
                    setMessage('Payment is being processed. Please wait...');
                    // Retry after 3 seconds
                    setTimeout(verifyPayment, 3000);
                } else {
                    setStatus('failed');
                    setMessage(response.data.message || 'Payment verification failed.');
                }
            } catch (error) {
                console.error('Payment verification error:', error);
                setStatus('failed');
                setMessage(error.response?.data?.message || 'Failed to verify payment. Please contact support.');
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container-custom py-16">
                <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-soft text-center">
                    {status === 'verifying' && (
                        <>
                            <div className="animate-spin w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
                            <p className="text-gray-600">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h1>
                            <p className="text-gray-600 mb-6">{message}</p>

                            {paymentData?.transactionId && (
                                <p className="text-sm text-gray-500 mb-4">
                                    Transaction ID: <span className="font-mono">{paymentData.transactionId}</span>
                                </p>
                            )}

                            <div className="space-y-3">
                                {paymentType === 'event' ? (
                                    <>
                                        <Link
                                            to="/my-registrations"
                                            className="block w-full py-3 rounded-lg font-semibold btn-primary"
                                        >
                                            View My Events
                                        </Link>
                                        <Link
                                            to="/events"
                                            className="block w-full py-3 text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            Browse More Events
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/my-bookings"
                                            className="block w-full py-3 rounded-lg font-semibold btn-primary"
                                        >
                                            View My Bookings
                                        </Link>
                                        <Link
                                            to="/venues"
                                            className="block w-full py-3 text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            Browse More Venues
                                        </Link>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {status === 'failed' && (
                        <>
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h1>
                            <p className="text-gray-600 mb-6">{message}</p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="block w-full py-3 rounded-lg font-semibold btn-primary"
                                >
                                    Try Again
                                </button>
                                <Link
                                    to="/venues"
                                    className="block w-full py-3 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    Back to Venues
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default PaymentCallback;
