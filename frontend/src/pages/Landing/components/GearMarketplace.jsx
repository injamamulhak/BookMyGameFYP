import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import productService from '../../../services/productService'

function GearMarketplace() {
  const [gear, setGear] = useState([])
  const [loading, setLoading] = useState(true)

  const apiUrl =
    import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productService.getAllProducts({
          limit: 4,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
        setGear(res.data.data.products)
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  if (!loading && gear.length === 0) return null

  return (
    <section className='py-16 md:py-24 bg-white'>
      <div className='container-custom'>
        {/* Section Header */}
        <div className='text-center mb-12'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4'>
            <svg
              className='w-8 h-8 text-primary-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
              />
            </svg>
          </div>
          <h2 className='font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-4'>
            Sports Gear Marketplace
          </h2>
          <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
            Shop premium sports equipment and gear from trusted brands
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className='bg-white rounded-xl overflow-hidden shadow-sm animate-pulse'
              >
                <div className='h-48 bg-gray-200' />
                <div className='p-4 space-y-3'>
                  <div className='h-3 bg-gray-200 rounded w-1/3' />
                  <div className='h-5 bg-gray-200 rounded w-2/3' />
                  <div className='h-4 bg-gray-200 rounded w-1/2' />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Gear Grid */
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {gear.map((item) => (
              <Link
                key={item.id}
                to={`/shop/${item.id}`}
                className='card group hover:-translate-y-2 p-0 overflow-hidden'
              >
                {/* Image */}
                <div className='relative h-48 overflow-hidden bg-gray-100'>
                  {item.imageUrl ? (
                    <img
                      src={
                        item.imageUrl.startsWith('http')
                          ? item.imageUrl
                          : `${apiUrl}${item.imageUrl}`
                      }
                      alt={item.name}
                      className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-gray-400'>
                      <svg
                        className='w-12 h-12'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={1.5}
                          d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                        />
                      </svg>
                    </div>
                  )}
                  {item.originalPrice &&
                    parseFloat(item.originalPrice) > parseFloat(item.price) && (
                      <div className='absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold'>
                        -
                        {Math.round(
                          (1 -
                            parseFloat(item.price) /
                              parseFloat(item.originalPrice)) *
                            100,
                        )}
                        %
                      </div>
                    )}
                </div>

                {/* Content */}
                <div className='p-4'>
                  <span className='text-xs text-primary-600 font-medium uppercase tracking-wide'>
                    {item.category}
                  </span>
                  <h3 className='font-heading font-semibold text-gray-900 mt-1 mb-2 line-clamp-1'>
                    {item.name}
                  </h3>

                  {/* Price */}
                  <div className='flex items-center justify-between'>
                    <div className='flex items-baseline gap-2'>
                      <span className='font-bold text-lg text-gray-900'>
                        Rs. {parseFloat(item.price).toLocaleString()}
                      </span>
                      {item.originalPrice &&
                        parseFloat(item.originalPrice) >
                          parseFloat(item.price) && (
                          <span className='text-sm text-gray-400 line-through'>
                            Rs.{' '}
                            {parseFloat(item.originalPrice).toLocaleString()}
                          </span>
                        )}
                    </div>
                    <div className='p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors'>
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
                          d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* View All CTA */}
        <div className='text-center mt-10'>
          <Link
            to='/shop'
            className='btn-primary inline-flex items-center gap-2'
          >
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
                d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
              />
            </svg>
            Browse All Gear
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
                d='M9 5l7 7-7 7'
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default GearMarketplace
