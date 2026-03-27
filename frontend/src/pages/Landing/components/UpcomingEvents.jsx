import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFeaturedEvents } from '../../../services/eventService'

function UpcomingEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await getFeaturedEvents()
        if (response.success) {
          setEvents(response.data)
        }
      } catch (err) {
        console.error('Failed to fetch featured events:', err)
        setError('Failed to load events')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  if (loading) {
    return (
      <section className='py-16 md:py-24 bg-gradient-to-br from-primary-50 to-secondary-50'>
        <div className='container-custom'>
          <div className='flex items-center justify-between mb-12'>
            <div>
              <h2 className='font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-2'>
                Upcoming Events
              </h2>
              <p className='text-gray-600 text-lg'>
                Don't miss out on exciting sports events happening near you
              </p>
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8'>
             {[1, 2].map((i) => (
              <div key={i} className='card p-0 overflow-hidden flex flex-col md:flex-row animate-pulse'>
                <div className='w-full md:w-48 h-48 md:h-auto bg-gray-200 flex-shrink-0'></div>
                <div className='p-6 flex-1'>
                  <div className='h-6 bg-gray-200 rounded w-3/4 mb-4'></div>
                   <div className='h-4 bg-gray-200 rounded w-1/2 mb-2'></div>
                   <div className='h-4 bg-gray-200 rounded w-2/3 mb-4'></div>
                   <div className='h-5 bg-gray-200 rounded w-1/3 mt-4'></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || events.length === 0) {
    return (
      <section className='py-16 md:py-24 bg-gradient-to-br from-primary-50 to-secondary-50'>
        <div className='container-custom'>
          <div className='flex items-center justify-between mb-12'>
            <div>
              <h2 className='font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-2'>
                Upcoming Events
              </h2>
              <p className='text-gray-600 text-lg'>
                Don't miss out on exciting sports events happening near you
              </p>
            </div>
            <Link to='/events' className='hidden md:block btn-outline'>
              View All Events
            </Link>
          </div>
          
          {/* Empty State */}
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Upcoming Events</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {error ? 'Failed to load events. Please try again later.' : 'There are no upcoming featured events at the moment. Check back later for exciting sports events!'}
            </p>
            <Link to='/events' className="btn-primary">
              Browse All Events
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className='py-16 md:py-24 bg-gradient-to-br from-primary-50 to-secondary-50'>
      <div className='container-custom'>
        {/* Section Header */}
        <div className='flex items-center justify-between mb-12'>
          <div>
            <h2 className='font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-2'>
              Upcoming Events
            </h2>
            <p className='text-gray-600 text-lg'>
              Don't miss out on exciting sports events happening near you
            </p>
          </div>
          <Link to='/events' className='hidden md:block btn-outline'>
            View All Events
          </Link>
        </div>

        {/* Events Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8'>
          {events.map((event) => {
            const imageToUse = event.imageUrl || 
                event.venue?.images?.find(img => img.isPrimary)?.imageUrl || 
                event.venue?.images?.[0]?.imageUrl || 
                'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500';
            
            // Format time correctly if startTime exists
            const timeStr = event.startTime ? new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            return (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className='card group hover:-translate-y-2 p-0 overflow-hidden flex flex-col md:flex-row'
              >
                {/* Image */}
                <div className='relative w-full md:w-48 h-48 md:h-auto overflow-hidden flex-shrink-0'>
                  <img
                    src={imageToUse}
                    alt={event.title}
                    className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
                  />
                  {event.isFeatured && (
                    <div className='absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-primary-600'>
                      Featured
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className='p-6 flex-1'>
                  <h3 className='font-heading font-bold text-xl text-gray-900 mb-3'>
                    {event.title}
                  </h3>

                  {/* Venue */}
                  <div className='flex items-center text-gray-600 mb-2'>
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                      />
                    </svg>
                    <span>{event.venue?.name || 'Various Venues'}</span>
                  </div>

                  {/* Date & Time */}
                  <div className='flex items-center text-gray-600 mb-4'>
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                      />
                    </svg>
                    <span>
                      {new Date(event.startDate).toLocaleDateString()} {timeStr && `at ${timeStr}`}
                    </span>
                  </div>

                  {/* CTA */}
                  <div className='flex items-center text-primary-600 font-medium group-hover:translate-x-2 transition-transform'>
                    <span>View Details</span>
                    <svg
                      className='w-5 h-5 ml-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 5l7 7-7 7'
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Mobile View All Button */}
        <div className='mt-8 text-center md:hidden'>
          <Link to='/events' className='btn-outline'>
            View All Events
          </Link>
        </div>
      </div>
    </section>
  )
}

export default UpcomingEvents
