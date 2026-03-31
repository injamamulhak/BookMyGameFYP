import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getVenueById } from '../../services/venueService'
import {
  getVenueReviews,
  createReview,
  canReviewVenue,
} from '../../services/reviewService'
import { useAuth } from '../../context/AuthContext'
import { formatTime } from '../../utils/timeUtils'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import ReviewSection from '../../components/Reviews/ReviewSection'

// Fix Leaflet default icon paths in bundled environments
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Mini-map component for venue location
function VenueMiniMap({ lat, lng, name, address }) {
  return (
    <div className='bg-white rounded-xl shadow-soft overflow-hidden mt-6'>
      <div className='px-6 pt-5 pb-3'>
        <h2 className='text-lg font-bold text-gray-900 flex items-center gap-2'>
          <svg className='w-5 h-5 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
          </svg>
          Location
        </h2>
      </div>
      <div style={{ height: 220 }}>
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          <Marker position={[lat, lng]}>
            <Popup>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{address}</div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      <div className='px-6 py-3 border-t border-gray-100'>
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
          </svg>
          Open in Google Maps
        </a>
      </div>
    </div>
  )
}

// Amenity icons mapping
const amenityIcons = {
  'Changing Rooms': '🚿',
  Parking: '🅿️',
  Floodlights: '💡',
  'First Aid': '🏥',
  Cafeteria: '☕',
  WiFi: '📶',
  'Equipment Rental': '🏀',
  'Seating Area': '💺',
  Restrooms: '🚻',
  'Locker Room': '🔐',
  Showers: '🚿',
  'Water Fountain': '💧',
  'Water Dispenser': '💧',
  Lockers: '🔐',
  Security: '🔒',
  CCTV: '📹',
  'Air Conditioning': '❄️',
  'Sound System': '🔊',
  Scoreboard: '📊',
}

// Day names for operating hours
const dayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

// Star Rating Component
function StarRating({
  rating,
  onRatingChange,
  interactive = false,
  size = 'md',
}) {
  const [hoverRating, setHoverRating] = useState(0)
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <div className='flex'>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type='button'
          disabled={!interactive}
          onClick={() => interactive && onRatingChange(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={
            interactive
              ? 'cursor-pointer transition-transform hover:scale-110'
              : 'cursor-default'
          }
        >
          <svg
            className={`${sizeClasses[size]} ${
              star <= (hoverRating || rating)
                ? 'text-yellow-400'
                : 'text-gray-200'
            }`}
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
          </svg>
        </button>
      ))}
    </div>
  )
}

// Review Form Component
function ReviewForm({ venueId, onReviewSubmitted, eligibleBookingId }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await createReview({
        venueId,
        rating,
        comment: comment.trim(),
        bookingId: eligibleBookingId,
      })
      setRating(0)
      setComment('')
      onReviewSubmitted()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='bg-gray-50 rounded-lg p-4 mb-6'>
      <h3 className='font-semibold text-gray-900 mb-3'>Write a Review</h3>

      <div className='mb-4'>
        <label className='block text-sm text-gray-600 mb-2'>Your Rating</label>
        <StarRating
          rating={rating}
          onRatingChange={setRating}
          interactive={true}
          size='lg'
        />
      </div>

      <div className='mb-4'>
        <label className='block text-sm text-gray-600 mb-2'>
          Your Review (Optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder='Share your experience at this venue...'
          rows={3}
          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none'
        />
      </div>

      {error && <div className='mb-3 text-sm text-red-600'>{error}</div>}

      <button
        type='submit'
        disabled={submitting || rating === 0}
        className='btn-primary py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}

function VenueDetail() {
  const { id } = useParams()
  const { isAuthenticated, user } = useAuth()
  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)

  // Review states
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [eligibleBookingId, setEligibleBookingId] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsPagination, setReviewsPagination] = useState({
    pages: 1,
    total: 0,
  })

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getVenueById(id)
        if (response.success) {
          setVenue(response.data)
        } else {
          setError('Venue not found')
        }
      } catch (err) {
        console.error('Error fetching venue:', err)
        setError(err.response?.data?.message || 'Failed to load venue')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchVenue()
    }
  }, [id])

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return
      setReviewsLoading(true)
      try {
        const response = await getVenueReviews(id, {
          page: reviewsPage,
          limit: 5,
        })
        if (response.success) {
          setReviews(response.data)
          setReviewsPagination(response.pagination)
        }
      } catch (err) {
        console.error('Error fetching reviews:', err)
      } finally {
        setReviewsLoading(false)
      }
    }

    fetchReviews()
  }, [id, reviewsPage])

  // Check if user can review
  useEffect(() => {
    const checkCanReview = async () => {
      if (!isAuthenticated || !id) return
      try {
        const response = await canReviewVenue(id)
        if (response.success) {
          setCanReview(response.data.canReview)
          setEligibleBookingId(response.data.eligibleBookingId)
        }
      } catch (err) {
        console.error('Error checking review eligibility:', err)
      }
    }

    checkCanReview()
  }, [isAuthenticated, id])

  // Handle review submitted
  const handleReviewSubmitted = async () => {
    setShowReviewForm(false)
    setCanReview(false)
    setReviewsPage(1)
    // Refetch venue to update rating
    try {
      const response = await getVenueById(id)
      if (response.success) {
        setVenue(response.data)
      }
    } catch (err) {
      console.error('Error refetching venue:', err)
    }
    // Refetch reviews
    try {
      const response = await getVenueReviews(id, { page: 1, limit: 5 })
      if (response.success) {
        setReviews(response.data)
        setReviewsPagination(response.pagination)
      }
    } catch (err) {
      console.error('Error refetching reviews:', err)
    }
  }

  // Get primary image or first image
  const images = venue?.images || []
  const primaryImage =
    images.find((img) => img.isPrimary)?.imageUrl ||
    images[0]?.imageUrl ||
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'

  // Loading skeleton
  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Header />
        <main className='container-custom py-8'>
          <div className='animate-pulse'>
            <div className='grid lg:grid-cols-3 gap-6 mb-8'>
              <div className='lg:col-span-2 h-[400px] bg-gray-200 rounded-xl'></div>
              <div className='h-[400px] bg-gray-200 rounded-xl'></div>
            </div>
            <div className='space-y-4'>
              <div className='h-10 bg-gray-200 rounded w-3/4'></div>
              <div className='h-6 bg-gray-200 rounded w-1/2'></div>
              <div className='h-32 bg-gray-200 rounded'></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Error state
  if (error || !venue) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Header />
        <main className='container-custom py-16 text-center'>
          <div className='max-w-md mx-auto'>
            <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'>
              <svg
                className='w-10 h-10 text-red-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            </div>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              Venue Not Found
            </h1>
            <p className='text-gray-600 mb-6'>
              {error ||
                'The venue you are looking for does not exist or has been removed.'}
            </p>
            <Link to='/venues' className='btn-primary'>
              Browse All Venues
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />

      <main className='container-custom py-6'>
        {/* Breadcrumb */}
        <nav className='flex items-center gap-2 text-sm text-gray-500 mb-4'>
          <Link to='/' className='hover:text-primary-600'>
            Home
          </Link>
          <span>/</span>
          <Link to='/venues' className='hover:text-primary-600'>
            Venues
          </Link>
          <span>/</span>
          <span className='text-gray-900'>{venue.name}</span>
        </nav>

        {/* Hero Section - Image + Booking Card Side by Side */}
        <div className='grid lg:grid-cols-3 gap-6 mb-8'>
          {/* Image Section */}
          <div className='lg:col-span-2'>
            {/* Main Image */}
            <div className='relative h-[350px] lg:h-[420px] rounded-xl overflow-hidden mb-3'>
              <img
                src={images[selectedImage]?.imageUrl || primaryImage}
                alt={venue.name}
                className='w-full h-full object-cover'
              />
              {/* Sport Badge */}
              <div className='absolute top-4 left-4'>
                <span className='px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-full'>
                  {venue.sport?.name || 'Sports'}
                </span>
              </div>
              {/* Rating Badge */}
              <div className='absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-1'>
                <svg
                  className='w-5 h-5 text-yellow-400'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                </svg>
                <span className='font-semibold text-gray-900'>
                  {venue.rating ? Number(venue.rating).toFixed(1) : 'New'}
                </span>
                <span className='text-gray-500 text-sm'>
                  ({venue._count?.reviews || venue.totalReviews || 0})
                </span>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className='flex gap-2 overflow-x-auto pb-2'>
                {images.slice(0, 6).map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden transition-all ${
                      selectedImage === index
                        ? 'ring-2 ring-primary-600'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={`${venue.name} ${index + 1}`}
                      className='w-full h-full object-cover'
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Booking Card - Right Side */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-xl p-6 shadow-lg h-full'>
              {/* Price */}
              <div className='text-center mb-6 pb-6 border-b border-gray-100'>
                <span className='text-4xl font-bold text-gray-900'>
                  Rs. {venue.pricePerHour?.toLocaleString()}
                </span>
                <span className='text-gray-500'>/hour</span>
              </div>

              {/* Book Now Button */}
              <Link
                to={`/booking/${venue.id}`}
                className='block w-full btn-primary py-4 text-lg font-semibold mb-4 text-center'
              >
                Book Now
              </Link>

              <p className='text-center text-sm text-gray-500 mb-6'>
                No payment required to reserve
              </p>

              {/* Quick Info */}
              <div className='space-y-4 pt-4 border-t border-gray-100'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-primary-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Slot Duration</p>
                    <p className='font-semibold text-gray-900'>
                      {venue.slotDuration || 60} minutes
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-green-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>
                      Instant Confirmation
                    </p>
                    <p className='font-semibold text-gray-900'>Book and play</p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-blue-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                      />
                    </svg>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Contact</p>
                    <p className='font-semibold text-gray-900'>
                      {venue.operator?.phone || 'Contact venue'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Venue Title & Location */}
        <div className='mb-8'>
          <h1 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-3'>
            {venue.name}
          </h1>
          <div className='flex items-center text-gray-600 gap-2'>
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
              />
            </svg>
            <span>
              {venue.address}, {venue.city}
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Left Column - Details */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Description */}
            <div className='bg-white rounded-xl p-6 shadow-soft'>
              <h2 className='text-xl font-bold text-gray-900 mb-4'>
                About this venue
              </h2>
              <p className='text-gray-600 leading-relaxed whitespace-pre-line'>
                {venue.description ||
                  'No description available for this venue.'}
              </p>
            </div>

            {/* Amenities */}
            {venue.amenities && venue.amenities.length > 0 && (
              <div className='bg-white rounded-xl p-6 shadow-soft'>
                <h2 className='text-xl font-bold text-gray-900 mb-4'>
                  Amenities
                </h2>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                  {venue.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'
                    >
                      <span className='text-xl'>
                        {amenityIcons[amenity] || '✓'}
                      </span>
                      <span className='text-gray-700 text-sm font-medium'>
                        {amenity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section using new dynamic component */}
            <ReviewSection venueId={venue.id} currentUser={user} />
          </div>

          {/* Right Column - Operating Hours + Mini Map */}
          <div className='lg:col-span-1'>
            <div className='sticky top-24 space-y-0'>
              {venue.operatingHours && venue.operatingHours.length > 0 && (
                <div className='bg-white rounded-xl p-6 shadow-soft'>
                  <h2 className='text-lg font-bold text-gray-900 mb-4'>
                    Operating Hours
                  </h2>
                  <div className='divide-y divide-gray-100'>
                    {venue.operatingHours.map((hours) => (
                      <div key={hours.id} className='flex justify-between py-3'>
                        <span className='text-gray-600 text-sm'>
                          {dayNames[hours.dayOfWeek]}
                        </span>
                        {hours.isClosed ? (
                          <span className='text-red-500 text-sm font-medium'>
                            Closed
                          </span>
                        ) : (
                          <span className='text-gray-900 text-sm font-medium'>
                            {formatTime(hours.openingTime)} -{' '}
                            {formatTime(hours.closingTime)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mini Map — only shown when coordinates are available */}
              {venue.latitude && venue.longitude && (
                <VenueMiniMap
                  lat={Number(venue.latitude)}
                  lng={Number(venue.longitude)}
                  name={venue.name}
                  address={`${venue.address}${venue.city ? ', ' + venue.city : ''}`}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default VenueDetail
