import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import productService from '../../services/productService'
import { useCart } from '../../context/CartContext'
import toast from 'react-hot-toast'

function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const { addToCart, setIsCartOpen } = useCart()

  const currentCategory = searchParams.get('category') || ''
  const currentPage = parseInt(searchParams.get('page') || '1')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [
    currentCategory,
    currentPage,
    sortBy,
    sortOrder,
    searchParams.get('search'),
  ])

  const fetchCategories = async () => {
    try {
      const res = await productService.getCategories()
      setCategories(res.data.data.categories)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: 12,
        sortBy,
        sortOrder,
      }
      if (currentCategory) params.category = currentCategory
      if (searchParams.get('search')) params.search = searchParams.get('search')

      const res = await productService.getAllProducts(params)
      setProducts(res.data.data.products)
      setPagination(res.data.data.pagination)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryFilter = (cat) => {
    const params = new URLSearchParams(searchParams)
    if (cat) {
      params.set('category', cat)
    } else {
      params.delete('category')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (search.trim()) {
      params.set('search', search.trim())
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleSort = (field, order) => {
    const params = new URLSearchParams(searchParams)
    params.set('sortBy', field)
    params.set('sortOrder', order)
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddToCart = (e, product) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.stock === 0) {
      toast.error('Product is out of stock')
      return
    }
    addToCart(product, 1)
    toast.success('Added to cart')
    setIsCartOpen(true)
  }

  const apiUrl =
    import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />
      <main>
        {/* Hero Banner */}
        <div className='bg-gradient-to-r from-primary-600 to-secondary-600 text-white'>
          <div className='container-custom py-12 md:py-16'>
            <h1 className='font-heading font-bold text-3xl md:text-4xl mb-3'>
              Sports Gear Marketplace
            </h1>
            <p className='text-white/80 text-lg max-w-2xl'>
              Premium sports equipment and gear for every game
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className='mt-6 flex max-w-lg'>
              <input
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search products...'
                className='flex-1 px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50'
              />
              <button
                type='submit'
                className='bg-white/20 hover:bg-white/30 px-6 py-3 rounded-r-lg font-medium transition-colors'
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
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div className='container-custom py-8'>
          <div className='flex flex-col lg:flex-row gap-8'>
            {/* Sidebar Filters */}
            <aside className='lg:w-64 flex-shrink-0'>
              <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24'>
                <h3 className='font-heading font-bold text-gray-900 mb-4'>
                  Categories
                </h3>
                <div className='space-y-1'>
                  <button
                    onClick={() => handleCategoryFilter('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !currentCategory
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryFilter(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentCategory === cat
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Sort Options */}
                <h3 className='font-heading font-bold text-gray-900 mt-6 mb-4'>
                  Sort By
                </h3>
                <div className='space-y-1'>
                  {[
                    { label: 'Newest', field: 'createdAt', order: 'desc' },
                    {
                      label: 'Price: Low to High',
                      field: 'price',
                      order: 'asc',
                    },
                    {
                      label: 'Price: High to Low',
                      field: 'price',
                      order: 'desc',
                    },
                    { label: 'Name: A-Z', field: 'name', order: 'asc' },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleSort(opt.field, opt.order)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === opt.field && sortOrder === opt.order
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className='flex-1'>
              {/* Results info */}
              <div className='flex items-center justify-between mb-6'>
                <p className='text-gray-600'>
                  {pagination.total || 0} products found
                  {currentCategory && (
                    <span className='font-medium'> in "{currentCategory}"</span>
                  )}
                </p>
              </div>

              {loading ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {[...Array(6)].map((_, i) => (
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
              ) : products.length === 0 ? (
                <EmptyState
                  icon='product'
                  title='No products found'
                  message='Try adjusting your filters or search terms'
                />
              ) : (
                <>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className='bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col'
                      >
                        {/* Image */}
                        <Link
                          to={`/shop/${product.id}`}
                          className='relative h-48 overflow-hidden bg-gray-100 block'
                        >
                          {product.imageUrl ? (
                            <img
                              src={
                                product.imageUrl.startsWith('http')
                                  ? product.imageUrl
                                  : `${apiUrl}${product.imageUrl}`
                              }
                              alt={product.name}
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
                          {product.stock === 0 && (
                            <div className='absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold z-10'>
                              Out of Stock
                            </div>
                          )}
                          {product.originalPrice &&
                            parseFloat(product.originalPrice) >
                              parseFloat(product.price) && (
                              <div className='absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold z-10'>
                                -
                                {Math.round(
                                  (1 -
                                    parseFloat(product.price) /
                                      parseFloat(product.originalPrice)) *
                                    100,
                                )}
                                %
                              </div>
                            )}
                        </Link>

                        {/* Content */}
                        <div className='p-4 flex flex-col flex-1'>
                          <Link
                            to={`/shop/${product.id}`}
                            className='block group-hover:text-primary-600 transition-colors'
                          >
                            <span className='text-xs text-primary-600 font-medium uppercase tracking-wide'>
                              {product.category}
                            </span>
                            <h3 className='font-heading font-semibold text-gray-900 mt-1 mb-2 line-clamp-1'>
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className='text-gray-500 text-sm line-clamp-2 mb-3'>
                                {product.description}
                              </p>
                            )}
                          </Link>

                          <div className='mt-auto pt-4 border-t border-gray-100 flex items-center justify-between'>
                            <div className='flex flex-col'>
                              <span className='font-bold text-lg text-gray-900'>
                                Rs. {parseFloat(product.price).toLocaleString()}
                              </span>
                              {product.originalPrice &&
                                parseFloat(product.originalPrice) >
                                  parseFloat(product.price) && (
                                  <span className='text-xs text-gray-400 line-through'>
                                    Rs.{' '}
                                    {parseFloat(
                                      product.originalPrice,
                                    ).toLocaleString()}
                                  </span>
                                )}
                            </div>
                            <button
                              onClick={(e) => handleAddToCart(e, product)}
                              disabled={product.stock === 0}
                              className='p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                              title='Add to Cart'
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
                                  d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={(page) => {
                        handlePageChange(page)
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ShopPage
