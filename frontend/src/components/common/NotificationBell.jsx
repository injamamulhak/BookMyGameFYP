import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MAX_NOTIFICATIONS = 20;

const TYPE_ICONS = {
    event_registration: '🎫',
    booking_confirmed: '✅',
    booking_cancelled: '❌',
    venue_approved: '🏟️',
    venue_rejected: '🚫',
    seller_approved: '🛒',
    seller_rejected: '❌',
    default: '🔔',
};

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Only show for authenticated users
    if (!user) return null;

    // Connect to WebSocket for real-time notifications
    useEffect(() => {
        // Initial fetch on mount
        fetchUnreadCount();

        // Strip '/api' from the baseURL if present to get the root server URL
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const socketUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

        const socket = io(socketUrl, {
            withCredentials: true
        });

        socket.on('connect', () => {
            // Join our personal room for targeted notifications
            socket.emit('join_user_room', user.id);
        });

        socket.on('new_notification', (newNotif) => {
            setUnreadCount(prev => prev + 1);
            
            // If dropdown is already open or has loaded notifications, push to top
            setNotifications(prev => {
                // Prevent duplicates
                if (prev.some(n => n.id === newNotif.id)) return prev;
                return [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS);
            });
        });

        return () => socket.disconnect();
    }, [user.id]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            if (res.data.success) setUnreadCount(res.data.unreadCount);
        } catch (err) {
            // silently fail — not critical
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications', { params: { limit: MAX_NOTIFICATIONS } });
            if (res.data.success) {
                setNotifications(res.data.data);
                setUnreadCount(res.data.unreadCount);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setOpen(prev => {
            if (!prev) fetchNotifications();
            return !prev;
        });
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            const deleted = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (deleted && !deleted.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={handleOpen}
                className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Notifications"
                title="Notifications"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        {notifications.some(n => !n.isRead) && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-primary-600 hover:text-primary-800 font-semibold"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <div className="text-4xl mb-3">🔔</div>
                                <p className="font-medium text-gray-700 mb-1">No notifications yet</p>
                                <p className="text-sm text-gray-500">We'll alert you about bookings, events, and more.</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.isRead && markAsRead(n.id)}
                                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/60' : ''}`}
                                >
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${!n.isRead ? 'bg-primary-100' : 'bg-gray-100'}`}>
                                        {TYPE_ICONS[n.type] || TYPE_ICONS.default}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold text-gray-900 ${!n.isRead ? 'font-bold' : ''}`}>
                                            {n.title}
                                            {!n.isRead && (
                                                <span className="ml-2 inline-block w-2 h-2 bg-primary-600 rounded-full align-middle" />
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={(e) => deleteNotification(n.id, e)}
                                        className="flex-shrink-0 p-1 text-gray-300 hover:text-gray-500 transition-colors"
                                        title="Dismiss"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-500">Showing last {notifications.length} notifications</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
