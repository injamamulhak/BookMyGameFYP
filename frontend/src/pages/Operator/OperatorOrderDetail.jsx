import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import orderService from '../../services/orderService';

function OperatorOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setIsLoading(true);
            const response = await orderService.getOperatorOrderById(id);
            if (response.data.success) {
                setOrder(response.data.data.order);
            }
        } catch (err) {
            console.error('Error fetching order details:', err);
            setError('Failed to fetch order details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;

        try {
            setActionLoading(true);
            const response = await orderService.updateOperatorOrderStatus(id, newStatus);
            if (response.data.success) {
                toast.success(`Order marked as ${newStatus}`);
                fetchOrderDetails();
            }
        } catch (err) {
            console.error('Error updating order:', err);
            toast.error(err.response?.data?.message || 'Failed to update order status');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            completed: 'bg-green-100 text-green-800 border-green-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
        };
        return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="text-center py-12">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
                    {error || 'Order not found'}
                </div>
                <div className="mt-4">
                    <button onClick={() => navigate('/operator/orders')} className="text-primary-600 hover:underline">
                        &larr; Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header / Back Link */}
            <div className="flex items-center justify-between">
                <Link
                    to="/operator/orders"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Orders
                </Link>
                <div className="flex items-center space-x-3">
                    {order.status === 'pending' && (
                        <>
                            <button
                                onClick={() => handleUpdateStatus('completed')}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Updating...' : 'Mark Completed'}
                            </button>
                            <button
                                onClick={() => handleUpdateStatus('cancelled')}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel Order
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Order Summary Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Order #{order.id.slice(-6).toUpperCase()}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Placed on {formatDate(order.createdAt)}
                        </p>
                    </div>
                    <div className="flex items-center">
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    {/* Customer Info */}
                    <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Customer Details
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start">
                                <span className="text-gray-500 w-24">Name:</span>
                                <span className="font-medium text-gray-900">{order.user?.fullName}</span>
                            </div>
                            <div className="flex items-start">
                                <span className="text-gray-500 w-24">Email:</span>
                                <span className="text-gray-900">{order.user?.email}</span>
                            </div>
                            <div className="flex items-start">
                                <span className="text-gray-500 w-24">Phone:</span>
                                <span className="text-gray-900">{order.user?.phone || 'Not provided'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="p-6 border-b border-gray-100 md:border-b-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Shipping Details
                        </h3>
                        {order.shippingAddress ? (
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {order.shippingAddress}
                            </p>
                        ) : (
                            <p className="text-gray-500 italic">No shipping address provided</p>
                        )}
                    </div>
                </div>

                {/* Ordered Items */}
                <div className="p-6 border-t border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Ordered Items
                    </h3>
                    <div className="space-y-4">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex items-center py-3 border-b border-gray-50 last:border-0 last:pb-0">
                                {item.product?.imageUrl ? (
                                    <img 
                                        src={item.product.imageUrl} 
                                        alt={item.product.name} 
                                        className="w-16 h-16 object-cover rounded-lg border border-gray-100"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                                <div className="ml-4 flex-1">
                                    <h4 className="text-md font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</h4>
                                    <p className="text-sm text-gray-500">
                                        Qty: {item.quantity} × Rs. {parseFloat(item.price).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                        Rs. {(item.quantity * parseFloat(item.price)).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Total Note */}
                    <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>Rs. {parseFloat(order.totalAmount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-100 pt-3">
                                <span>Total Paid</span>
                                <span>Rs. {parseFloat(order.totalAmount).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OperatorOrderDetail;
