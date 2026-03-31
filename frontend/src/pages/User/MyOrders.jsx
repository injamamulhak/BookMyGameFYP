import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import orderService from '../../services/orderService';
import toast from 'react-hot-toast';

function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await orderService.getMyOrders();
            setOrders(res.data.data.orders);
        } catch (error) {
            console.error('Fetch orders error:', error);
            toast.error('Failed to load your orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container-custom py-10">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-gray-900">My Orders</h1>
                        <p className="text-gray-500 mt-1">View and track your shop purchases</p>
                    </div>
                    <Link to="/shop" className="btn-primary">
                        Continue Shopping
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse bg-white rounded-xl h-48 w-full"></div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">No orders found</h3>
                        <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
                        <Link to="/shop" className="btn-primary">
                            Browse Shop
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Order Placed</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'long', day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Amount</p>
                                            <p className="text-sm font-medium text-gray-900">Rs. {parseFloat(order.totalAmount).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-4 min-w-[200px]">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500 mb-1">
                                                <span className="font-medium">Order ID:</span> {order.id.slice(0, 8).toUpperCase()}
                                            </p>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <Link 
                                            to={`/my-orders/${order.id}`}
                                            className="ml-4 p-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors font-medium text-sm border border-transparent hover:border-primary-200"
                                            title="View Details"
                                        >
                                            View Details &rarr;
                                        </Link>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <ul className="divide-y divide-gray-100">
                                        {order.items.map((item) => (
                                            <li key={item.id} className="py-4 flex flex-col sm:flex-row gap-4">
                                                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-100">
                                                    {item.product.imageUrl ? (
                                                        <img
                                                            src={item.product.imageUrl.startsWith('http') ? item.product.imageUrl : `http://localhost:5000${item.product.imageUrl}`}
                                                            alt={item.product.name}
                                                            className="h-full w-full object-cover object-center"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                                            <span className="text-xs text-gray-400">No Img</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <h4 className="text-base font-medium text-gray-900">
                                                                <Link to={`/shop/${item.product.id}`} className="hover:text-primary-600 transition-colors">
                                                                    {item.product.name}
                                                                </Link>
                                                            </h4>
                                                            <p className="mt-1 text-sm text-gray-500">{item.product.category}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                                        <p className="text-sm font-medium text-gray-900">Rs. {parseFloat(item.price).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyOrders;
