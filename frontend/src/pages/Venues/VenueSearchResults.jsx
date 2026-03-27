import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getVenues, getSports } from '../../services/venueService';
import { useDebounce } from '../../hooks/useDebounce';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import logo from '../../assets/logo.png';

function VenueCard({ venue }) {
    const primaryImage = venue.images?.find(img => img.isPrimary)?.imageUrl
        || venue.images?.[0]?.imageUrl
        || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500';

    const sportName = venue.sport?.name || 'Sports';

    return (
        <Link
            to={`/venues/${venue.id}`}
            className="card group hover:-translate-y-1 p-0 overflow-hidden flex flex-col sm:flex-row"
        >
            <div className="relative w-full sm:w-48 h-48 sm:h-auto overflow-hidden flex-shrink-0">
                <img
                    src={primaryImage}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {venue.isActive ? (
                    <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                        Available
                    </div>
                ) : (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                        Unavailable
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-md text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {venue.rating ? Number(venue.rating).toFixed(1) : 'New'}
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex-1">
                    <h3 className="font-heading font-bold text-lg text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {venue.name}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{venue.address}{venue.city ? `, ${venue.city}` : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                            {sportName}
                        </span>
                    </div>
                    {venue.amenities && venue.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {venue.amenities.slice(0, 3).map((amenity) => (
                                <span key={amenity} className="text-xs text-gray-600 flex items-center gap-1">
                                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {amenity}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                        <span className="text-xl font-bold text-gray-900">Rs. {venue.pricePerHour?.toLocaleString()}</span>
                        <span className="text-gray-500 text-sm">/hour</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        {venue._count?.reviews || 0} reviews
                    </div>
                </div>
            </div>
        </Link>
    );
}

function FilterSidebar({ filters, setFilters, onClear, sports }) {
    const amenities = ['Parking', 'Showers', 'Lighting', 'Cafe', 'Equipment Rental', 'Changing Rooms'];

    return (
        <div className="bg-white rounded-xl shadow-soft p-5 sticky top-24">
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading font-bold text-lg text-gray-900">Filters</h3>
                <button
                    onClick={onClear}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    Clear All
                </button>
            </div>

            <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Sport Type</h4>
                <div className="space-y-2">
                    {sports.map((sport) => (
                        <label key={sport.id} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.sport === sport.name}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFilters({ ...filters, sport: sport.name });
                                    } else {
                                        setFilters({ ...filters, sport: '' });
                                    }
                                }}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-gray-700 group-hover:text-gray-900">{sport.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Max Price</h4>
                <div className="px-1">
                    <input
                        type="range"
                        min="500"
                        max="10000"
                        step="500"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                        <span>Rs. 500</span>
                        <span className="font-medium text-primary-600">Rs. {filters.maxPrice.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Amenities</h4>
                <div className="space-y-2">
                    {amenities.map((amenity) => (
                        <label key={amenity} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.amenities.includes(amenity)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFilters({ ...filters, amenities: [...filters.amenities, amenity] });
                                    } else {
                                        setFilters({ ...filters, amenities: filters.amenities.filter(a => a !== amenity) });
                                    }
                                }}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-gray-700 group-hover:text-gray-900">{amenity}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Minimum Rating</h4>
                <div className="flex gap-2">
                    {[0, 3, 4, 4.5].map((rating) => (
                        <button
                            key={rating}
                            onClick={() => setFilters({ ...filters, minRating: rating })}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.minRating === rating
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {rating === 0 ? (
                                'Any'
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    {rating}+
                                </>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MapView({ venues }) {
    return (
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl h-full min-h-[400px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
                <svg className="w-full h-full" viewBox="0 0 400 300">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#667eea" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>
            <div className="absolute inset-0">
                {venues.slice(0, 5).map((venue, index) => (
                    <div
                        key={venue.id}
                        className="absolute animate-bounce"
                        style={{
                            left: `${20 + (index * 15)}%`,
                            top: `${30 + (index % 3) * 20}%`,
                            animationDelay: `${index * 0.2}s`
                        }}
                    >
                        <div className="bg-primary-600 text-white p-2 rounded-full shadow-lg">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
            <div className="relative z-10 text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                </div>
                <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">
                    Interactive Map View
                </h3>
                <p className="text-gray-600 text-sm max-w-xs mx-auto">
                    {venues.length} venues found in your area. Full map integration coming soon!
                </p>
            </div>
        </div>
    );
}

function VenueSearchResults() {
    // 1. Core State
    const [searchParams, setSearchParams] = useSearchParams();
    const [viewMode, setViewMode] = useState('list');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const debouncedSearch = useDebounce(searchQuery.trim(), 800); // 800ms debounce to accommodate slower typing
    const [currentPage, setCurrentPage] = useState(1);
    const [retryCount, setRetryCount] = useState(0);

    const [venues, setVenues] = useState([]);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const [filters, setFilters] = useState({
        sport: searchParams.get('sport') || '',
        maxPrice: parseInt(searchParams.get('maxPrice')) || 10000,
        amenities: [],
        minRating: 0,
    });
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // 2. Fetch Sports (Once on mount)
    useEffect(() => {
        const fetchSports = async () => {
            try {
                const response = await getSports();
                if (response.success) setSports(response.data);
            } catch (err) {
                console.error('Failed to fetch sports:', err);
            }
        };
        fetchSports();
    }, []);

    // 3. Reset page to 1 when filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, filters.sport, filters.maxPrice, filters.minRating, filters.amenities.length]);

    // 4. Data Fetching Effect (Declarative)
    useEffect(() => {
        const fetchVenues = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = {
                    search: debouncedSearch || undefined,
                    sport: filters.sport || undefined,
                    maxPrice: filters.maxPrice < 10000 ? filters.maxPrice : undefined,
                    page: currentPage,
                    limit: 10,
                };

                const response = await getVenues(params);
                if (response.success) {
                    let filteredVenues = response.data;
                    if (filters.minRating > 0) {
                        filteredVenues = filteredVenues.filter(v => (v.rating || 0) >= filters.minRating);
                    }
                    if (filters.amenities.length > 0) {
                        filteredVenues = filteredVenues.filter(v =>
                            filters.amenities.every(a => v.amenities?.includes(a))
                        );
                    }
                    setVenues(filteredVenues);
                    setPagination(response.pagination);
                }
            } catch (err) {
                console.error('Failed to fetch venues:', err);
                setError('Failed to load venues. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchVenues();
    }, [debouncedSearch, currentPage, filters.sport, filters.maxPrice, filters.minRating, filters.amenities.length, retryCount]);

    // 5. Update URL Params (Sync state to URL)
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (filters.sport) params.set('sport', filters.sport);
        setSearchParams(params, { replace: true });
    }, [debouncedSearch, filters.sport, setSearchParams]);

    // Handlers
    const clearFilters = () => {
        setFilters({ sport: '', maxPrice: 10000, amenities: [], minRating: 0 });
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="container-custom py-4">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center flex-shrink-0">
                            <img src={logo} alt="BookMyGame" className="h-14 w-auto" />
                        </Link>

                        <div className="flex-1 max-w-2xl">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search venues..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container-custom py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="font-heading font-bold text-2xl text-gray-900">
                            Sports Venues
                        </h1>
                        <p className="text-gray-600">
                            {loading ? 'Loading...' : `${venues.length} venues found`}
                        </p>
                    </div>

                    <select className="hidden md:block px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                        <option>Sort by: Relevance</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                        <option>Rating: High to Low</option>
                    </select>
                </div>

                <div className="flex gap-6">
                    <aside className="hidden md:block w-72 flex-shrink-0">
                        <FilterSidebar
                            filters={filters}
                            setFilters={setFilters}
                            onClear={clearFilters}
                            sports={sports}
                        />
                    </aside>

                    {showMobileFilters && (
                        <div className="fixed inset-0 z-50 md:hidden">
                            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
                            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto">
                                <div className="p-4 border-b flex items-center justify-between">
                                    <h3 className="font-bold text-lg">Filters</h3>
                                    <button onClick={() => setShowMobileFilters(false)}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-4">
                                    <FilterSidebar
                                        filters={filters}
                                        setFilters={setFilters}
                                        onClear={clearFilters}
                                        sports={sports}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1">
                        {error ? (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-heading font-bold text-xl text-gray-900 mb-2">
                                    Error Loading Venues
                                </h3>
                                <p className="text-gray-600 mb-4">{error}</p>
                                <button onClick={() => setRetryCount(r => r + 1)} className="btn-primary">
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                {viewMode === 'list' ? (
                                    <div className="space-y-4">
                                        {venues.length > 0 ? (
                                            venues.map((venue) => (
                                                <VenueCard key={venue.id} venue={venue} />
                                            ))
                                        ) : (
                                            <EmptyState
                                                icon="venue"
                                                title="No venues found"
                                                message="Try adjusting your filters to see more results"
                                                actionLabel="Clear All Filters"
                                                onAction={clearFilters}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <MapView venues={venues} />
                                )}

                                {!loading && pagination.pages > 1 && (
                                    <Pagination
                                        currentPage={pagination.page}
                                        totalPages={pagination.pages}
                                        onPageChange={(newPage) => setCurrentPage(newPage)}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default VenueSearchResults;
