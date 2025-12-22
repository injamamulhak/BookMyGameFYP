import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

/**
 * BookingCalendar - Interactive calendar view of bookings for operators
 * Shows venue availability and bookings at a glance
 */
function BookingCalendar() {
    const [venues, setVenues] = useState([]);
    const [selectedVenueId, setSelectedVenueId] = useState('');
    const [calendarData, setCalendarData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);

    useEffect(() => {
        fetchVenues();
    }, []);

    useEffect(() => {
        if (selectedVenueId) {
            fetchCalendarData();
        }
    }, [selectedVenueId, currentDate]);

    const fetchVenues = async () => {
        try {
            const response = await api.get('/venues/operator/my-venues');
            if (response.data.success) {
                setVenues(response.data.data);
                if (response.data.data.length > 0) {
                    setSelectedVenueId(response.data.data[0].id);
                } else {
                    setIsLoading(false);
                }
            }
        } catch (err) {
            console.error('Error fetching venues:', err);
            setError('Failed to load venues');
            setIsLoading(false);
        }
    };

    const fetchCalendarData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Get first and last day of the month
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startDate = new Date(year, month, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

            const response = await api.get(
                `/bookings/operator/calendar/${selectedVenueId}?startDate=${startDate}&endDate=${endDate}`
            );

            if (response.data.success) {
                setCalendarData(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching calendar:', err);
            setError('Failed to load calendar data');
        } finally {
            setIsLoading(false);
        }
    };

    // Group time slots by date
    const slotsByDate = useMemo(() => {
        const grouped = {};
        calendarData.forEach(slot => {
            const dateKey = new Date(slot.date).toISOString().split('T')[0];
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(slot);
        });
        return grouped;
    }, [calendarData]);

    // Helper function to check if a date is today
    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Calendar grid generation
    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const grid = [];
        let dayCounter = 1;

        // Fill in the weeks
        for (let week = 0; week < 6; week++) {
            const weekDays = [];
            for (let day = 0; day < 7; day++) {
                if ((week === 0 && day < startingDayOfWeek) || dayCounter > daysInMonth) {
                    weekDays.push(null);
                } else {
                    const date = new Date(year, month, dayCounter);
                    const dateKey = date.toISOString().split('T')[0];
                    const slots = slotsByDate[dateKey] || [];
                    const bookings = slots.flatMap(s => s.bookings || []);

                    weekDays.push({
                        day: dayCounter,
                        date,
                        dateKey,
                        slots,
                        bookings,
                        hasBookings: bookings.length > 0,
                        confirmedCount: bookings.filter(b => b.status === 'confirmed').length,
                        pendingCount: bookings.filter(b => b.status === 'pending').length,
                        isToday: isToday(date),
                        isPast: date < new Date(new Date().setHours(0, 0, 0, 0)),
                    });
                    dayCounter++;
                }
            }
            grid.push(weekDays);
            if (dayCounter > daysInMonth) break;
        }

        return grid;
    }, [currentDate, slotsByDate]);

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + direction);
            return newDate;
        });
        setSelectedDay(null);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDay(null);
    };

    const formatTime = (timeString) => {
        if (!timeString) return '-';
        return new Date(timeString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-400',
            confirmed: 'bg-green-500',
            cancelled: 'bg-red-400',
        };
        return colors[status] || 'bg-gray-400';
    };

    const selectedVenue = venues.find(v => v.id === selectedVenueId);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Booking Calendar</h1>
                    <p className="text-gray-600 mt-1">View your venue schedule at a glance</p>
                </div>
                <Link
                    to="/operator/bookings"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    List View
                </Link>
            </div>

            {/* Venue Selector & Month Navigation */}
            <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Venue Selector */}
                    <div className="flex-1 max-w-xs">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Venue</label>
                        <select
                            value={selectedVenueId}
                            onChange={(e) => {
                                setSelectedVenueId(e.target.value);
                                setSelectedDay(null);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            {venues.length === 0 ? (
                                <option value="">No venues available</option>
                            ) : (
                                venues.map(venue => (
                                    <option key={venue.id} value={venue.id}>{venue.name}</option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                        >
                            Today
                        </button>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => navigateMonth(-1)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </span>
                            <button
                                onClick={() => navigateMonth(1)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={fetchCalendarData} className="underline hover:no-underline">
                        Retry
                    </button>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-gray-600">Confirmed</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                    <span className="text-gray-600">Pending</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                    <span className="text-gray-600">Past Days</span>
                </div>
            </div>

            {/* Calendar Grid and Day Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
                    {isLoading && !calendarData.length ? (
                        <div className="flex items-center justify-center h-96">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    ) : venues.length === 0 ? (
                        <div className="p-12 text-center">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900">No Venues</h3>
                            <p className="text-gray-500 mt-1">Add a venue to see its calendar</p>
                            <Link
                                to="/operator/venues/new"
                                className="inline-flex items-center mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                Add Venue
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Day Names Header */}
                            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                                {dayNames.map(day => (
                                    <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="divide-y divide-gray-100">
                                {calendarGrid.map((week, weekIndex) => (
                                    <div key={weekIndex} className="grid grid-cols-7 divide-x divide-gray-100">
                                        {week.map((dayData, dayIndex) => (
                                            <div
                                                key={dayIndex}
                                                onClick={() => dayData && setSelectedDay(dayData)}
                                                className={`min-h-[100px] p-2 transition-colors ${dayData
                                                    ? dayData.isPast
                                                        ? 'bg-gray-50 cursor-pointer hover:bg-gray-100'
                                                        : 'cursor-pointer hover:bg-primary-50'
                                                    : 'bg-gray-25'
                                                    } ${selectedDay?.dateKey === dayData?.dateKey ? 'bg-primary-50 ring-2 ring-inset ring-primary-500' : ''
                                                    }`}
                                            >
                                                {dayData && (
                                                    <>
                                                        <div className={`text-sm font-medium mb-1 ${dayData.isToday
                                                            ? 'w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center'
                                                            : dayData.isPast
                                                                ? 'text-gray-400'
                                                                : 'text-gray-900'
                                                            }`}>
                                                            {dayData.day}
                                                        </div>

                                                        {/* Booking indicators */}
                                                        {dayData.hasBookings && (
                                                            <div className="space-y-1">
                                                                {dayData.confirmedCount > 0 && (
                                                                    <div className="flex items-center text-xs">
                                                                        <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                                                                        <span className="text-gray-600 truncate">
                                                                            {dayData.confirmedCount} confirmed
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {dayData.pendingCount > 0 && (
                                                                    <div className="flex items-center text-xs">
                                                                        <div className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></div>
                                                                        <span className="text-gray-600 truncate">
                                                                            {dayData.pendingCount} pending
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Slots count */}
                                                        {dayData.slots.length > 0 && !dayData.hasBookings && (
                                                            <div className="text-xs text-gray-400">
                                                                {dayData.slots.length} slots
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Day Detail Panel */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    {selectedDay ? (
                        <>
                            <div className="mb-4 pb-4 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {selectedDay.date.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{selectedVenue?.name}</p>
                            </div>

                            {selectedDay.slots.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-gray-500">No time slots for this day</p>
                                    <Link
                                        to={`/operator/venues/${selectedVenueId}`}
                                        className="text-primary-600 text-sm hover:underline mt-2 inline-block"
                                    >
                                        Generate time slots
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {selectedDay.slots.map(slot => (
                                        <div
                                            key={slot.id}
                                            className={`p-3 rounded-lg border ${slot.bookings?.length > 0
                                                ? 'bg-primary-50 border-primary-200'
                                                : 'bg-gray-50 border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-900">
                                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    Rs. {parseFloat(slot.price).toLocaleString()}
                                                </span>
                                            </div>

                                            {slot.bookings?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {slot.bookings.map(booking => (
                                                        <Link
                                                            key={booking.id}
                                                            to={`/operator/bookings/${booking.id}`}
                                                            className="flex items-center justify-between p-2 bg-white rounded-lg hover:shadow-sm transition-shadow"
                                                        >
                                                            <div className="flex items-center">
                                                                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(booking.status)}`}></div>
                                                                <span className="text-sm text-gray-800">
                                                                    {booking.user?.fullName || 'Customer'}
                                                                </span>
                                                            </div>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${booking.status === 'confirmed'
                                                                ? 'bg-green-100 text-green-700'
                                                                : booking.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-700'
                                                                    : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {booking.status}
                                                            </span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">Available</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Select a Day</h3>
                            <p className="text-gray-500">Click on a day to view time slots and bookings</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BookingCalendar;
