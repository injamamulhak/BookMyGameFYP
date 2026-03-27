import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import VenueSlotCalendar from '../../components/common/VenueSlotCalendar';

/**
 * BookingCalendar - Operator's dedicated calendar page at /operator/calendar
 * Uses the shared VenueSlotCalendar with a venue selector dropdown.
 * Operators can view slots, generate new ones, and block slots for walk-in guests.
 */
function BookingCalendar() {
    const [venues, setVenues] = useState([]);
    const [selectedVenueId, setSelectedVenueId] = useState('');
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [venueLoading, setVenueLoading] = useState(false);

    // Key to force re-mount of VenueSlotCalendar after generate/booking
    const [calendarKey, setCalendarKey] = useState(0);

    // Fetch operator's venues list on mount
    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const response = await api.get('/venues/operator/my-venues');
                if (response.data.success) {
                    const data = response.data.data;
                    setVenues(data);
                    if (data.length > 0) {
                        setSelectedVenueId(data[0].id);
                    }
                }
            } catch (err) {
                console.error('Error fetching venues:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchVenues();
    }, []);

    // When a venue is selected, fetch its FULL details (includes operatingHours, pricePerHour)
    useEffect(() => {
        if (!selectedVenueId) {
            setSelectedVenue(null);
            return;
        }

        const fetchFullVenue = async () => {
            try {
                setVenueLoading(true);
                const response = await api.get(`/venues/operator/my-venues/${selectedVenueId}`);
                if (response.data.success) {
                    setSelectedVenue(response.data.data);
                }
            } catch (err) {
                console.error('Error fetching venue details:', err);
                setSelectedVenue(null);
            } finally {
                setVenueLoading(false);
            }
        };
        fetchFullVenue();
    }, [selectedVenueId, calendarKey]);

    // Operator: click an available slot to block it for a walk-in guest
    const handleOperatorSlotClick = async (slot, dateStr) => {
        const guestName = prompt('Enter guest / walk-in name for this booking:', 'Walk-in Guest');
        if (!guestName) return;

        try {
            await api.post('/bookings/operator/walk-in', {
                venueId: selectedVenueId,
                date: dateStr,
                startTime: slot.startTime,
                endTime: slot.endTime,
                price: slot.price,
                guestName,
            });
            alert(`Slot ${slot.startTime} – ${slot.endTime} on ${dateStr} has been booked for "${guestName}".`);
            setCalendarKey(prev => prev + 1); // re-mount to refresh
        } catch (err) {
            console.error('Error creating booking:', err);
            alert(err.response?.data?.message || 'Failed to create walk-in booking');
        }
    };



    // Custom operator slot label
    const operatorSlotLabel = (slot, { booked, blockedByEvent, past }) => {
        if (blockedByEvent) return <span className="text-orange-500">🏆 Event</span>;
        if (booked) return <span className="text-red-500">Booked</span>;
        if (past) return <span className="text-gray-400">Past</span>;
        return <span className="text-green-600">Available</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Booking Calendar</h1>
                    <p className="text-gray-600 mt-1">View all bookings and availability at a glance. Click any available slot to add a walk-in booking.</p>
                </div>
                <Link to="/operator/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    ← Back to Bookings List
                </Link>
            </div>

            {/* Venue Selector */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Venue</label>
                <select
                    value={selectedVenueId}
                    onChange={(e) => setSelectedVenueId(e.target.value)}
                    className="w-full sm:w-72 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                    {venues.length === 0 && <option value="">No venues found</option>}
                    {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                            {venue.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Calendar + Slot Grid powered by the shared component */}
            {venueLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                </div>
            ) : selectedVenue ? (
                <VenueSlotCalendar
                    key={calendarKey}
                    venue={selectedVenue}
                    onSlotClick={handleOperatorSlotClick}
                    selectedSlots={[]}
                    hideCartDots={true}
                    slotLabel={operatorSlotLabel}
                    toolbarExtra={
                        <p className="text-sm text-gray-500 italic">
                            Slots are auto-generated from this venue's operating hours. Click any{' '}
                            <span className="font-semibold text-green-600 not-italic">Available</span>{' '}
                            slot to add a walk-in booking.
                        </p>
                    }
                />
            ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No venue selected</h3>
                    <p className="text-gray-500">Please add a venue first to use the booking calendar.</p>
                    <Link
                        to="/operator/venues"
                        className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Go to Venues →
                    </Link>
                </div>
            )}
        </div>
    );
}

export default BookingCalendar;
