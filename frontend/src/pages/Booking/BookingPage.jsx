import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getVenueById } from '../../services/venueService';
import api from '../../services/api';
import { formatTime } from '../../utils/timeUtils';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import VenueSlotCalendar from '../../components/common/VenueSlotCalendar';

// Cart key for localStorage
const CART_KEY = 'bookingCart';

function BookingPage() {
    const { venueId } = useParams();
    const navigate = useNavigate();

    const [venue, setVenue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cart state - array of { date, slot, venueId, venueName, sportName, venueImage, dateDisplay }
    const [cart, setCart] = useState([]);
    
    // Slot locking and timer state
    const [lockExpiry, setLockExpiry] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef(null);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem(CART_KEY);
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                if (parsed.venueId === venueId && parsed.items?.length > 0) {
                    // Check if lock is still valid
                    if (parsed.lockExpiry && new Date(parsed.lockExpiry) > new Date()) {
                        setCart(parsed.items);
                        setLockExpiry(parsed.lockExpiry);
                    } else {
                        // Lock expired, clear
                        localStorage.removeItem(CART_KEY);
                        alert('Your reservation time expired. Please select slots again.');
                    }
                } else if (parsed.venueId !== venueId && parsed.items?.length > 0) {
                    if (window.confirm(`You have ${parsed.items.length} slot(s) in your cart from "${parsed.venueName}". Switching venue will clear your cart. Continue?`)) {
                        localStorage.removeItem(CART_KEY);
                        setCart([]);
                    } else {
                        navigate(`/booking/${parsed.venueId}`);
                        return;
                    }
                }
            } catch (e) {
                console.error('Error loading cart:', e);
                localStorage.removeItem(CART_KEY);
            }
        }
    }, [venueId, navigate]);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (venue && cart.length > 0) {
            localStorage.setItem(CART_KEY, JSON.stringify({
                venueId: venue.id,
                venueName: venue.name,
                items: cart,
                lockExpiry
            }));
        } else if (cart.length === 0) {
            localStorage.removeItem(CART_KEY);
            setLockExpiry(null);
        }
    }, [cart, venue, lockExpiry]);

    // Timer logic
    useEffect(() => {
        if (lockExpiry) {
            timerRef.current = setInterval(() => {
                const now = new Date();
                const expiry = new Date(lockExpiry);
                const diff = Math.floor((expiry - now) / 1000);
                
                if (diff <= 0) {
                    clearInterval(timerRef.current);
                    setTimeLeft(0);
                    clearCart();
                    alert('Reservation time expired. Slotes have been released.');
                } else {
                    setTimeLeft(diff);
                }
            }, 1000);
        } else {
            setTimeLeft(0);
        }
        return () => clearInterval(timerRef.current);
    }, [lockExpiry]);

    // Fetch venue details
    useEffect(() => {
        const fetchVenue = async () => {
            try {
                setLoading(true);
                const response = await getVenueById(venueId);
                if (response.success) {
                    setVenue(response.data);
                } else {
                    setError('Venue not found');
                }
            } catch (err) {
                console.error('Error fetching venue:', err);
                setError('Failed to load venue');
            } finally {
                setLoading(false);
            }
        };

        if (venueId) {
            fetchVenue();
        }
    }, [venueId]);

    // Toggle slot in cart (called by VenueSlotCalendar)
    const toggleSlotInCart = useCallback(async (slot, dateStr, meta) => {
        const cartItem = {
            date: dateStr,
            dateDisplay: meta.dateDisplay,
            slot: { ...slot },
            venueId: venue.id,
            venueName: venue.name,
            sportName: venue.sport?.name,
            venueImage: venue.images?.[0]?.imageUrl,
        };

        const existingIndex = cart.findIndex(item =>
            item.date === dateStr && item.slot.startTime === slot.startTime
        );

        if (existingIndex >= 0) {
            // Unlocking
            try {
                const itemInCart = cart[existingIndex];
                await api.post(`/timeslots/${itemInCart.slot.id}/unlock`);
                setCart(prev => prev.filter((_, i) => i !== existingIndex));
            } catch (err) {
                console.error('Failed to unlock slot', err);
                setCart(prev => prev.filter((_, i) => i !== existingIndex));
            }
        } else {
            // Locking
            try {
                const res = await api.post(`/timeslots/${slot.id}/lock`, {
                    venueId: venue.id,
                    date: dateStr,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    price: slot.price
                });
                if (res.data.success) {
                    setLockExpiry(res.data.data.lockedUntil);
                    
                    // Replace the dynamic ID with the actual DB ID if created by backend
                    if (res.data.data.lockedSlotId) {
                        cartItem.slot.id = res.data.data.lockedSlotId;
                    }

                    setCart(prev => [...prev, cartItem]);
                }
            } catch (err) {
                if (err.response?.status === 409) {
                    alert(err.response.data.message);
                } else {
                    alert('Failed to lock slot. It may be unavailable.');
                }
            }
        }
    }, [venue, cart]);

    // Remove item from cart
    const removeFromCart = useCallback(async (index) => {
        const item = cart[index];
        if (item) {
            try {
                await api.post(`/timeslots/${item.slot.id}/unlock`);
            } catch (e) {
                console.error('Unlock failed', e);
            }
        }
        setCart(prevCart => prevCart.filter((_, i) => i !== index));
    }, [cart]);

    // Clear entire cart
    const clearCart = useCallback(async () => {
        // Unlock all
        for (const item of cart) {
            try {
                await api.post(`/timeslots/${item.slot.id}/unlock`);
            } catch (e) {
                console.error('Unlock failed', e);
            }
        }
        setCart([]);
        setLockExpiry(null);
        localStorage.removeItem(CART_KEY);
    }, [cart]);

    // Calculate total price
    const totalPrice = useMemo(() => {
        return cart.reduce((sum, item) => sum + (parseFloat(item.slot.price) || 0), 0);
    }, [cart]);

    // Calculate total duration
    const totalDuration = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.slot.duration || 60), 0);
    }, [cart]);

    // Handle continue to checkout
    const handleContinue = () => {
        if (cart.length === 0) return;

        const bookingData = {
            venueId: venue.id,
            venueName: venue.name,
            venueImage: venue.images?.[0]?.imageUrl,
            sportName: venue.sport?.name,
            items: cart,
            totalPrice,
            totalDuration,
        };

        sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
        navigate(`/booking/${venueId}/checkout`);
    };

    // Custom slot label for cart indicator
    const slotLabel = (slot, { booked, blockedByEvent, past, selected }) => {
        if (blockedByEvent) return <span className="text-orange-500">🏆 Event</span>;
        if (booked) return <span className="text-red-500">Booked</span>;
        if (past) return <span className="text-gray-400">Past</span>;
        if (selected) return <span className="text-green-600">✓ In Cart</span>;
        return <span className="text-gray-500">{slot.duration} min</span>;
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container-custom py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
                            <div className="h-64 bg-gray-200 rounded-xl"></div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Error state
    if (error || !venue) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container-custom py-16 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue Not Found</h1>
                    <Link to="/venues" className="btn-primary">Browse Venues</Link>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container-custom py-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link to="/" className="hover:text-primary-600">Home</Link>
                    <span>/</span>
                    <Link to="/venues" className="hover:text-primary-600">Venues</Link>
                    <span>/</span>
                    <Link to={`/venues/${venue.id}`} className="hover:text-primary-600">{venue.name}</Link>
                    <span>/</span>
                    <span className="text-gray-900">Book</span>
                </nav>

                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">
                    Book {venue.name}
                </h1>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Calendar & Slots (shared component) */}
                    <div className="lg:col-span-2">
                        <VenueSlotCalendar
                            venue={venue}
                            onSlotClick={toggleSlotInCart}
                            selectedSlots={cart}
                            slotLabel={slotLabel}
                        />
                    </div>

                    {/* Right Column - Cart Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl p-6 shadow-soft sticky top-24">
                            {/* Venue Info */}
                            <div className="flex items-start gap-4 pb-4 border-b border-gray-100 mb-4">
                                <img
                                    src={venue.images?.[0]?.imageUrl || 'https://via.placeholder.com/80'}
                                    alt={venue.name}
                                    className="w-20 h-20 rounded-lg object-cover"
                                />
                                <div>
                                    <h3 className="font-bold text-gray-900">{venue.name}</h3>
                                    <p className="text-sm text-gray-500">{venue.sport?.name}</p>
                                    <p className="text-sm text-gray-500">{venue.address}</p>
                                </div>
                            </div>

                            {/* Cart Header */}
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-gray-900">
                                    Your Cart ({cart.length} slot{cart.length !== 1 ? 's' : ''})
                                </h3>
                                {cart.length > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="text-sm text-red-600 hover:text-red-700"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            
                            {/* Timer */}
                            {cart.length > 0 && timeLeft > 0 && (
                                <div className="mb-4 bg-amber-50 text-amber-800 text-sm p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">Slots reserved for checkout</span>
                                    </div>
                                    <span className="font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded">
                                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            )}

                            {/* Cart Items */}
                            {cart.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="font-medium">No slots selected</p>
                                    <p className="text-sm mt-1">Click on available time slots to add them</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                                    {cart.map((item, index) => (
                                        <div
                                            key={`${item.date}-${item.slot.startTime}`}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {formatTime(item.slot.startTime)} - {formatTime(item.slot.endTime)}
                                                </p>
                                                <p className="text-xs text-gray-500">{item.dateDisplay}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-gray-900">
                                                    Rs. {parseFloat(item.slot.price).toLocaleString()}
                                                </span>
                                                <button
                                                    onClick={() => removeFromCart(index)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Summary */}
                            {cart.length > 0 && (
                                <div className="space-y-2 py-4 border-y border-gray-100 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Total Duration</span>
                                        <span className="font-medium text-gray-900">{totalDuration} minutes</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Price per slot</span>
                                        <span className="font-medium text-gray-900">Rs. {parseFloat(venue.pricePerHour).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            {/* Price */}
                            <div className="flex justify-between items-center py-4 border-b border-gray-100 mb-6">
                                <span className="text-lg font-bold text-gray-900">Total</span>
                                <span className="text-2xl font-bold text-primary-600">
                                    Rs. {totalPrice.toLocaleString()}
                                </span>
                            </div>

                            {/* Continue Button */}
                            <button
                                onClick={handleContinue}
                                disabled={cart.length === 0}
                                className={`w-full py-4 rounded-lg font-semibold transition-all ${cart.length > 0
                                    ? 'btn-primary'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {cart.length > 0 ? `Continue to Checkout (${cart.length} slot${cart.length !== 1 ? 's' : ''})` : 'Select Time Slots'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default BookingPage;
