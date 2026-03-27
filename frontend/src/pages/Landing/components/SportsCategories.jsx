import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSportsWithVenueCounts } from '../../../services/venueService'

// Sport icons mapping
const sportIcons = {
  Football: (
    <svg className='w-12 h-12' fill='currentColor' viewBox='0 0 24 24'>
      <circle
        cx='12'
        cy='12'
        r='10'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 13v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' />
    </svg>
  ),
  Futsal: (
    <svg className='w-12 h-12' fill='currentColor' viewBox='0 0 24 24'>
      <circle
        cx='12'
        cy='12'
        r='10'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 13v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' />
    </svg>
  ),
  Basketball: (
    <svg className='w-12 h-12' fill='currentColor' viewBox='0 0 24 24'>
      <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM5.23 7.75C6.1 8.62 6.7 9.74 6.91 11H4.07c.15-1.18.57-2.27 1.16-3.25zM4.07 13h2.84c-.21 1.26-.81 2.38-1.68 3.25-.59-.98-1.01-2.07-1.16-3.25zm1.64 4.68c.87-.87 1.47-1.99 1.68-3.25h2.84c-.15 1.18-.57 2.27-1.16 3.25-.59.98-1.36 1.74-2.36 2.09-.37-.58-.69-1.32-.99-2.09h-.01zm6.29.25c-.21-1.26-.81-2.38-1.68-3.25-.59.98-1.01 2.07-1.16 3.25h2.84zm.93-2H11c.21-1.26.81-2.38 1.68-3.25.59.98 1.01 2.07 1.16 3.25h.09zm1.07-4c-.15 1.18-.57 2.27-1.16 3.25-.87-.87-1.47-1.99-1.68-3.25h2.84zm4.93 1h-2.84c.21-1.26.81-2.38 1.68-3.25.59.98 1.01 2.07 1.16 3.25z' />
    </svg>
  ),
  Cricket: (
    <svg className='w-12 h-12' fill='currentColor' viewBox='0 0 24 24'>
      <path d='M15.04 4.15l-.01.01c-.39-.39-1.03-.39-1.42 0l-1.18 1.18 3.18 3.18 1.18-1.18c.39-.39.39-1.03 0-1.42l-1.75-1.77zm-6.94 6.94l-4.07 6.35c-.26.41-.08.95.37 1.13l1.13.45.45 1.13c.18.45.72.63 1.13.37l6.35-4.07-5.36-5.36z' />
    </svg>
  ),
  Tennis: (
    <svg
      className='w-12 h-12'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <circle cx='12' cy='12' r='9' strokeWidth='2' />
      <path d='M12 3c-2.5 3.5-2.5 7.5 0 11s2.5 7.5 0 7' strokeWidth='2' />
      <path d='M3 12h18' strokeWidth='2' />
    </svg>
  ),
  Badminton: (
    <svg className='w-12 h-12' fill='currentColor' viewBox='0 0 24 24'>
      <path d='M12.5 3L3 12.5l8.5 8.5 9.5-9.5-8.5-8.5zm0 2.83L19.67 13 12.5 20.17 4.83 12.5 12.5 5.83z' />
      <circle cx='12.5' cy='12.5' r='2.5' />
    </svg>
  ),
  Swimming: (
    <svg className='w-12 h-12' fill='currentColor' viewBox='0 0 24 24'>
      <path d='M22 21c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.08.64-2.19.64-1.11 0-1.73-.37-2.18-.64-.37-.23-.6-.36-1.15-.36s-.78.13-1.15.36c-.46.27-1.08.64-2.19.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.6.36 1.15.36.56 0 .78-.13 1.15-.36.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.23.6.36 1.15.36v2zM8.67 12c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36s.78-.13 1.15-.36c.12-.07.26-.15.41-.23L10.48 5C8.93 3.45 7.5 2.99 5 3v2.5c1.82-.01 2.89.39 4 1.5l1 1-3.25 3.25c.31.12.56.27.77.39.37.23.59.36 1.15.36z' />
      <circle cx='10.5' cy='7.5' r='2.5' />
    </svg>
  ),
}

// Color gradients for sports
const sportColors = {
  Football: 'from-green-400 to-green-600',
  Futsal: 'from-green-500 to-emerald-600',
  Basketball: 'from-orange-400 to-orange-600',
  Cricket: 'from-blue-400 to-blue-600',
  Tennis: 'from-yellow-400 to-yellow-600',
  Badminton: 'from-purple-400 to-purple-600',
  Swimming: 'from-cyan-400 to-cyan-600',
}

// Default icon for sports without specific icon
const defaultIcon = (
  <svg
    className='w-12 h-12'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
    />
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
)

function SportsCategories() {
  const navigate = useNavigate()
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSports = async () => {
      try {
        setLoading(true)
        const response = await getSportsWithVenueCounts()
        if (response.success) {
          setSports(response.data)
        }
      } catch (err) {
        console.error('Failed to fetch sports:', err)
        setError('Failed to load sports')
      } finally {
        setLoading(false)
      }
    }
    fetchSports()
  }, [])

  const handleSportClick = (sportName) => {
    navigate(`/venues?sport=${sportName.toLowerCase()}`)
  }

  // Loading skeleton
  if (loading) {
    return (
      <section className='py-16 md:py-24 bg-gray-50'>
        <div className='container-custom'>
          <div className='text-center mb-12'>
            <h2 className='font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-4'>
              Popular Sports Categories
            </h2>
            <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
              Choose your favorite sport and discover amazing venues near you
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='card animate-pulse'>
                <div className='w-20 h-20 rounded-2xl bg-gray-200 mb-6'></div>
                <div className='h-6 bg-gray-200 rounded w-1/2 mb-2'></div>
                <div className='h-4 bg-gray-200 rounded w-3/4 mb-4'></div>
                <div className='h-4 bg-gray-200 rounded w-1/3'></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Don't show section if error or no sports
  if (error || sports.length === 0) {
    return null
  }

  return (
    <section className='py-16 md:py-24 bg-gray-50'>
      <div className='container-custom'>
        {/* Section Header */}
        <div className='text-center mb-12'>
          <h2 className='font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-4'>
            Popular Sports Categories
          </h2>
          <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
            Choose your favorite sport and discover amazing venues near you
          </p>
        </div>

        {/* Sports Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8'>
          {sports.map((sport) => {
            const icon = sportIcons[sport.name] || defaultIcon
            const color =
              sportColors[sport.name] || 'from-primary-400 to-primary-600'

            return (
              <button
                key={sport.id}
                onClick={() => handleSportClick(sport.name)}
                className='card group hover:-translate-y-2 cursor-pointer text-left'
              >
                {/* Icon Container */}
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 text-white`}
                >
                  {icon}
                </div>

                {/* Content */}
                <h3 className='font-heading font-bold text-2xl text-gray-900 mb-2'>
                  {sport.name}
                </h3>
                <p className='text-gray-600 mb-4'>
                  {sport.description || `Book ${sport.name} venues`}
                </p>

                {/* Venue Count */}
                <div className='flex items-center text-primary-600 font-medium'>
                  <span>
                    {sport.venueCount > 0
                      ? `${sport.venueCount} Venue${sport.venueCount !== 1 ? 's' : ''}`
                      : 'Coming Soon'}
                  </span>
                  <svg
                    className='w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform'
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
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default SportsCategories
