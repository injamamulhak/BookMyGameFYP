import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import orderService from '../../services/orderService';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

function UserOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Editing states
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [editedAddress, setEditedAddress] = useState("");
    const [updateLoading, setUpdateLoading] = useState(false);
    const [cancelModal, setCancelModal] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const res = await orderService.getOrderById(id);
            if (res.data.success) {
                setOrder(res.data.data.order);
            }
        } catch (err) {
            console.error('Fetch order details error:', err);
            setError('Failed to load order details');
            toast.error('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAddress = async () => {
        if (!editedAddress.trim()) {
            toast.error('Address cannot be empty');
            return;
        }
        
        try {
            setUpdateLoading(true);
            const res = await orderService.updateMyOrder(id, { shippingAddress: editedAddress });
            if (res.success || res.status === 200 || res.data) {
                // If the response is wrapped
                const updatedOrder = res.data?.order || res.order || res.data?.data?.order;
                if (updatedOrder) setOrder(prev => ({ ...prev, shippingAddress: updatedOrder.shippingAddress }));
                else fetchOrderDetails(); // fallback

                setIsEditingAddress(false);
                toast.success('Shipping address updated successfully');
            }
        } catch (err) {
            console.error('Update address error:', err);
            toast.error(err.response?.data?.message || 'Failed to update address');
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        setCancelModal(false);
        try {
            setUpdateLoading(true);
            const res = await orderService.updateMyOrder(id, { status: 'cancelled' });
            if (res.success || res.status === 200 || res.data) {
                setOrder(prev => ({ ...prev, status: 'cancelled' }));
                toast.success('Order cancelled successfully');
            }
        } catch (err) {
            console.error('Cancel order error:', err);
            toast.error(err.response?.data?.message || 'Failed to cancel order');
        } finally {
            setUpdateLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container-custom py-10 flex items-center justify-center min-h-[500px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container-custom py-10 text-center">
                    <div className="bg-red-50 text-red-600 p-6 rounded-xl inline-block max-w-md w-full">
                        <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-bold mb-2">Oops!</h3>
                        <p>{error || 'Order not found'}</p>
                        <button onClick={() => navigate('/my-orders')} className="mt-6 btn-primary w-full">
                            Back to My Orders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <Header />
            <ConfirmModal
                isOpen={cancelModal}
                title='Cancel Order?'
                message='Are you sure you want to cancel this order? This action cannot be undone.'
                confirmText='Cancel Order'
                confirmVariant='danger'
                onConfirm={handleCancelOrder}
                onCancel={() => setCancelModal(false)}
            />
            <div className="container-custom mt-8">
                {/* Top Navigation */}
                <div className="mb-6">
                    <Link to="/my-orders" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
                        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to My Orders
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header Details */}
                    <div className="bg-gray-50 p-6 sm:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-heading">
                                Order #{order.id.slice(-6).toUpperCase()}
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2">
                            <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full border shadow-sm uppercase tracking-wide ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                                Total: <span className="text-gray-900 font-bold text-lg">Rs. {parseFloat(order.totalAmount).toLocaleString()}</span>
                            </span>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-gray-100 pb-8">
                            {/* Contact Info */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 font-heading">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Customer Details
                                </h3>
                                <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p><span className="font-medium text-gray-900 mr-2">Name:</span> {order.user?.fullName}</p>
                                    <p><span className="font-medium text-gray-900 mr-2">Email:</span> {order.user?.email}</p>
                                    {order.user?.phone && <p><span className="font-medium text-gray-900 mr-2">Phone:</span> {order.user?.phone}</p>}
                                </div>
                            </div>

                            {/* Shipping Info */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 font-heading">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        Shipping Address
                                    </h3>
                                    {order.status === 'pending' && !isEditingAddress && (
                                        <button 
                                            onClick={() => {
                                                setEditedAddress(order.shippingAddress || "");
                                                setIsEditingAddress(true);
                                            }}
                                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                                
                                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 h-[calc(100%-2.5rem)]">
                                    {isEditingAddress ? (
                                        <div className="flex flex-col h-full">
                                            <textarea
                                                value={editedAddress}
                                                onChange={(e) => setEditedAddress(e.target.value)}
                                                className="w-full p-2 border border-primary-300 rounded focus:ring-1 focus:ring-primary-500 outline-none flex-grow mb-3 min-h-[80px]"
                                                placeholder="Enter your full shipping address..."
                                                disabled={updateLoading}
                                            />
                                            <div className="flex justify-end gap-2 mt-auto">
                                                <button 
                                                    onClick={() => setIsEditingAddress(false)} 
                                                    disabled={updateLoading}
                                                    className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleUpdateAddress}
                                                    disabled={updateLoading}
                                                    className="btn-primary px-3 py-1.5 text-xs flex items-center gap-2"
                                                >
                                                    {updateLoading ? 'Saving...' : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {order.shippingAddress ? (
                                                <p className="whitespace-pre-wrap leading-relaxed">{order.shippingAddress}</p>
                                            ) : (
                                                <p className="italic text-gray-400">No shipping address provided</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-6 font-heading border-l-4 border-primary-500 pl-3">
                                Ordered Items
                            </h3>
                            <div className="space-y-6">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row gap-6 p-4 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                                        {/* Image */}
                                        <Link to={`/shop/${item.product.id}`} className="block h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
                                            {item.product?.imageUrl ? (
                                                <img 
                                                    src={item.product.imageUrl} 
                                                    alt={item.product.name} 
                                                    className="h-full w-full object-cover object-center"
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-gray-50 flex items-center justify-center">
                                                    <span className="text-xs text-gray-400">No Img</span>
                                                </div>
                                            )}
                                        </Link>
                                        
                                        {/* Details */}
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Link to={`/shop/${item.product.id}`} className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors">
                                                        {item.product?.name || 'Unknown Product'}
                                                    </Link>
                                                    <p className="mt-1 text-sm font-medium text-gray-500">
                                                        {item.product?.category || 'General'}
                                                    </p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="text-lg font-bold text-gray-900">
                                                        Rs. {(item.quantity * parseFloat(item.price)).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center text-sm">
                                                <span className="text-gray-500">Price: <span className="font-medium text-gray-700">Rs. {parseFloat(item.price).toLocaleString()}</span></span>
                                                <span className="mx-3 text-gray-300">|</span>
                                                <span className="text-gray-500">Quantity: <span className="font-medium text-gray-700">{item.quantity}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Actions / Footer */}
                        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <p className="text-sm text-gray-500 flex items-center">
                                <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Need help with this order? <a href="mailto:support@bookmygame.com" className="ml-1 text-primary-600 hover:underline">Contact Support</a>
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                {order.status === 'pending' && (
                                    <button 
                                        onClick={() => setCancelModal(true)} 
                                        disabled={updateLoading}
                                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-transparent hover:border-red-200 disabled:opacity-50 flex justify-center items-center"
                                    >
                                        Cancel Order
                                    </button>
                                )}
                                <button onClick={() => navigate('/shop')} className="btn-secondary whitespace-nowrap">
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserOrderDetail;
