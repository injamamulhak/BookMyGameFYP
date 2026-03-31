import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import orderService from '../../services/orderService';
import { formatTime } from '../../utils/timeUtils'; // Used just in case, but formatting usually needs Date methods

/**
 * ManageOrders - Operator's order management page
 * Lists all orders that include products owned by the operator
 */
function ManageOrders() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        status: '',
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
        fetchOrders();
    }, [filters.status, pagination.page]);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit
            };

            if (filters.status) params.status = filters.status;

            const response = await orderService.getOperatorOrders(params);

            if (response.data.success) {
                setOrders(response.data.data.orders);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.pagination.total,
                    pages: response.data.data.pagination.totalPages,
                }));
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load orders');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        if (!confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;

        try {
            setActionLoading(orderId);
            const response = await orderService.updateOperatorOrderStatus(orderId, newStatus);
            if (response.data.success) {
                toast.success(`Order marked as ${newStatus}`);
                fetchOrders();
            }
        } catch (err) {
            console.error('Error updating order:', err);
            toast.error(err.response?.data?.message || 'Failed to update order status');
        } finally {
            setActionLoading(null);
        }
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            search: '',
        });
        setPagination(prev => ({ ...prev, page: 1 }));
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
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter orders by search term (client-side)
    const filteredOrders = orders.filter(order => {
        if (!filters.search) return true;
        const searchLower = filters.search.toLowerCase();
        return (
            order.user?.fullName?.toLowerCase().includes(searchLower) ||
            order.user?.email?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Manage Orders</h1>
                    <p className="text-gray-600 mt-1">View and manage orders for your products</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by customer name or email..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
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
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
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
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Orders', value: pagination.total, color: 'bg-blue-50 text-blue-700' },
                    { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: 'bg-yellow-50 text-yellow-700' },
                    { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: 'bg-green-50 text-green-700' },
                    { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, color: 'bg-red-50 text-red-700' },
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
                    <button onClick={fetchOrders} className="underline hover:no-underline">
                        Retry
                    </button>
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
                        <p className="text-gray-500">
                            {filters.status || filters.search
                                ? 'Try adjusting your filters to see more results.'
                                : 'You have no orders yet.'}
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
                                            Order ID
                                        </th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-gray-900">
                                                    #{order.id.slice(-6).toUpperCase()}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {order.items.length} item(s) • Rs. {parseFloat(order.totalAmount).toLocaleString()} total
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white font-semibold text-sm">
                                                            {order.user?.fullName?.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {order.user?.fullName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {order.user?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900">
                                                    {formatDate(order.createdAt)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadge(order.status)}`}>
                                                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end space-x-2">
                                                    <Link
                                                        to={`/operator/orders/${order.id}`}
                                                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-100"
                                                        title="View Details"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </Link>
                                                    {order.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateStatus(order.id, 'completed')}
                                                                disabled={actionLoading === order.id}
                                                                className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                                            >
                                                                {actionLoading === order.id ? 'Loading...' : 'Complete'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                                                disabled={actionLoading === order.id}
                                                                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                            >
                                                                Cancel
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
                            {filteredOrders.map((order) => (
                                <div key={order.id} className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-sm">
                                                    {order.user?.fullName?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <p className="font-medium text-gray-900">{order.user?.fullName}</p>
                                                <p className="text-xs text-gray-500">#{order.id.slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadge(order.status)}`}>
                                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Date</span>
                                            <span className="text-gray-900">{formatDate(order.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Items Amount</span>
                                            <span className="font-semibold text-gray-900">Rs. {parseFloat(order.totalAmount).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-gray-100">
                                        <Link
                                            to={`/operator/orders/${order.id}`}
                                            className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors mr-auto"
                                        >
                                            View Details
                                        </Link>
                                        {order.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'completed')}
                                                    disabled={actionLoading === order.id}
                                                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === order.id ? 'Loading...' : 'Complete'}
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                                    disabled={actionLoading === order.id}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
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
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
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

export default ManageOrders;
