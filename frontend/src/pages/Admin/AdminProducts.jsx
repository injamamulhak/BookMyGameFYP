import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import productService from '../../services/productService'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/common/ConfirmModal'

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState('all')
  const [pagination, setPagination] = useState({})
  const [page, setPage] = useState(1)
  const [confirmModal, setConfirmModal] = useState({ open: false, productId: null })

  const apiUrl =
    import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

  useEffect(() => {
    fetchProducts()
  }, [page, filterActive])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (search) params.search = search
      if (filterActive !== 'all') params.isActive = filterActive

      const res = await productService.getAllProductsAdmin(params)
      setProducts(res.data.data.products)
      setPagination(res.data.data.pagination)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchProducts()
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

  const handleToggleActive = async (product) => {
    try {
      const formData = new FormData()
      formData.append('isActive', !product.isActive)
      await productService.updateProduct(product.id, formData)
      fetchProducts()
    } catch (err) {
      console.error('Failed to toggle product:', err)
    }
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
            Products
          </h1>
          <p className='text-gray-600 mt-1'>Manage all marketplace products</p>
        </div>
        <Link to='/admin/products' className='btn-primary text-sm'>
          + Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <form onSubmit={handleSearch} className='flex-1 flex'>
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search products...'
              className='flex-1 px-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm'
            />
            <button
              type='submit'
              className='px-4 py-2 bg-primary-600 text-white rounded-r-lg hover:bg-primary-700 transition-colors text-sm'
            >
              Search
            </button>
          </form>
          <select
            value={filterActive}
            onChange={(e) => {
              setFilterActive(e.target.value)
              setPage(1)
            }}
            className='px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm'
          >
            <option value='all'>All Status</option>
            <option value='true'>Active</option>
            <option value='false'>Inactive</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
        {loading ? (
          <div className='p-8 text-center text-gray-500'>Loading...</div>
        ) : products.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            <p className='text-lg font-medium'>No products found</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-100'>
                <tr>
                  <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase'>
                    Product
                  </th>
                  <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase'>
                    Category
                  </th>
                  <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase'>
                    Price
                  </th>
                  <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase'>
                    Stock
                  </th>
                  <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase'>
                    Seller
                  </th>
                  <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase'>
                    Status
                  </th>
                  <th className='text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className='hover:bg-gray-50 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
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
                            <div className='w-full h-full flex items-center justify-center text-gray-400 text-xs'>
                              No img
                            </div>
                          )}
                        </div>
                        <span className='font-medium text-gray-900 text-sm'>
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-600'>
                        {product.category}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm font-medium text-gray-900'>
                        Rs. {parseFloat(product.price).toLocaleString()}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-600'>
                        {product.seller ? product.seller.fullName : 'Admin'}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className='p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
                          title='Delete'
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className='flex justify-center py-4 gap-2 border-t border-gray-100'>
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === i + 1
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminProducts
