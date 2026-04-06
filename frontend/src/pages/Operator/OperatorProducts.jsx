import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import productService from '../../services/productService'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/common/ConfirmModal'

function OperatorProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sellerStatus, setSellerStatus] = useState(null)
  const [requesting, setRequesting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [confirmModal, setConfirmModal] = useState({ open: false, productId: null })

  const apiUrl =
    import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

  useEffect(() => {
    fetchSellerStatus()
  }, [])

  const fetchSellerStatus = async () => {
    try {
      const res = await productService.getSellerStatus()
      setSellerStatus(res.data.data)

      // Only fetch products if approved
      if (res.data.data.canSellProducts) {
        fetchProducts()
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error('Failed to fetch seller status:', err)
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await productService.getMyProducts()
      setProducts(res.data.data.products)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestSeller = async () => {
    setRequesting(true)
    setStatusMessage('')
    try {
      const res = await productService.requestSeller()
      setStatusMessage(res.data.message)
      fetchSellerStatus()
    } catch (err) {
      setStatusMessage(
        err.response?.data?.message || 'Failed to submit request',
      )
    } finally {
      setRequesting(false)
    }
  }

  const handleDelete = (id) => {
    setConfirmModal({ open: true, productId: id })
  }

  const confirmDelete = async () => {
    const { productId } = confirmModal
    setConfirmModal({ open: false, productId: null })
    try {
      await productService.deleteProduct(productId)
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (err) {
      console.error('Failed to delete product:', err)
      toast.error(err.response?.data?.message || 'Failed to delete product')
    }
  }

  // Not yet approved as seller — show request UI
  if (sellerStatus && !sellerStatus.canSellProducts) {
    return (
      <div>
        <div className='mb-8'>
          <h1 className='font-heading font-bold text-2xl text-gray-900'>
            My Products
          </h1>
          <p className='text-gray-600 mt-1'>Manage your marketplace products</p>
        </div>

        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12 text-center max-w-lg mx-auto'>
          {sellerStatus.sellerRequestStatus === 'pending' ? (
            <>
              <div className='w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-8 h-8 text-yellow-600'
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
              <h3 className='font-heading font-bold text-xl text-gray-900 mb-2'>
                Request Pending
              </h3>
              <p className='text-gray-500'>
                Your seller request is being reviewed by the admin. You'll be
                able to list products once your request is approved.
              </p>
            </>
          ) : sellerStatus.sellerRequestStatus === 'rejected' ? (
            <>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-8 h-8 text-red-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </div>
              <h3 className='font-heading font-bold text-xl text-gray-900 mb-2'>
                Request Rejected
              </h3>
              <p className='text-gray-500 mb-6'>
                Your seller request was rejected by the admin. You can submit a
                new request.
              </p>
              <button
                onClick={handleRequestSeller}
                disabled={requesting}
                className='btn-primary disabled:opacity-50'
              >
                {requesting ? 'Submitting...' : 'Request Again'}
              </button>
            </>
          ) : (
            <>
              <div className='w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4'>
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
              <h3 className='font-heading font-bold text-xl text-gray-900 mb-2'>
                Start Selling Products
              </h3>
              <p className='text-gray-500 mb-6'>
                Want to list and sell sports equipment on BookMyGame? Submit a
                request to become a seller and start listing products once
                approved.
              </p>
              <button
                onClick={handleRequestSeller}
                disabled={requesting}
                className='btn-primary disabled:opacity-50'
              >
                {requesting ? 'Submitting...' : 'Request to Become a Seller'}
              </button>
            </>
          )}

          {statusMessage && (
            <p className='mt-4 text-sm text-green-600 font-medium'>
              {statusMessage}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <ConfirmModal
        isOpen={confirmModal.open}
        title='Delete Product?'
        message='Are you sure you want to delete this product? This action cannot be undone.'
        confirmText='Delete Product'
        confirmVariant='danger'
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ open: false, productId: null })}
      />
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h1 className='font-heading font-bold text-2xl text-gray-900'>
            My Products
          </h1>
          <p className='text-gray-600 mt-1'>Manage your marketplace products</p>
        </div>
        <Link to='/operator/products/new' className='btn-primary text-sm'>
          + Add Product
        </Link>
      </div>

      {loading ? (
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500'>
          Loading...
        </div>
      ) : products.length === 0 ? (
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center'>
          <svg
            className='w-16 h-16 text-gray-300 mx-auto mb-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
            />
          </svg>
          <h3 className='font-heading font-bold text-xl text-gray-900 mb-2'>
            No products yet
          </h3>
          <p className='text-gray-500 mb-6'>
            Start selling by adding your first product
          </p>
          <Link to='/operator/products/new' className='btn-primary text-sm'>
            + Add Product
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
          {products.map((product) => (
            <div
              key={product.id}
              className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'
            >
              <div className='relative h-48 bg-gray-100'>
                {product.imageUrl ? (
                  <img
                    src={
                      product.imageUrl.startsWith('http')
                        ? product.imageUrl
                        : `${apiUrl}${product.imageUrl}`
                    }
                    alt={product.name}
                    className='w-full h-full object-cover'
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
                <div className='absolute top-3 right-3'>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      product.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className='p-4'>
                <span className='text-xs text-primary-600 font-medium uppercase tracking-wide'>
                  {product.category}
                </span>
                <h3 className='font-heading font-semibold text-gray-900 mt-1 mb-1'>
                  {product.name}
                </h3>
                <div className='flex items-baseline gap-2 mb-3'>
                  <span className='font-bold text-lg text-gray-900'>
                    Rs. {parseFloat(product.price).toLocaleString()}
                  </span>
                  {product.originalPrice &&
                    parseFloat(product.originalPrice) >
                      parseFloat(product.price) && (
                      <span className='text-sm text-gray-400 line-through'>
                        Rs. {parseFloat(product.originalPrice).toLocaleString()}
                      </span>
                    )}
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span
                    className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    Stock: {product.stock}
                  </span>
                </div>
                <div className='flex gap-2 mt-4 pt-4 border-t border-gray-100'>
                  <Link
                    to={`/operator/products/${product.id}/edit`}
                    className='flex-1 text-center px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors'
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className='px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors'
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OperatorProducts
