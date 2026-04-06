import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import productService from '../../services/productService'

function AddEditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    originalPrice: '',
    stock: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [error, setError] = useState('')

  const apiUrl =
    import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

  const categories = [
    'Football',
    'Basketball',
    'Cricket',
    'Tennis',
    'Badminton',
    'Swimming',
    'Running',
    'Gym',
    'Volleyball',
    'Table Tennis',
    'Boxing',
    'Yoga',
    'Training',
    'Accessories',
    'Other',
  ]

  useEffect(() => {
    if (isEdit) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      const res = await productService.getProductById(id)
      const product = res.data.data.product
      setForm({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        stock: product.stock || '',
      })
      if (product.imageUrl) {
        setImagePreview(
          product.imageUrl.startsWith('http')
            ? product.imageUrl
            : `${apiUrl}${product.imageUrl}`,
        )
      }
    } catch (err) {
      setError('Failed to load product')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.category || !form.price) {
      setError('Name, category, and price are required')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('description', form.description)
      formData.append('category', form.category)
      formData.append('price', form.price)
      if (form.originalPrice)
        formData.append('originalPrice', form.originalPrice)
      formData.append('stock', form.stock || '0')
      if (imageFile) formData.append('image', imageFile)

      if (isEdit) {
        await productService.updateProduct(id, formData)
      } else {
        await productService.createProduct(formData)
      }

      navigate('/operator/products')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className='max-w-2xl mx-auto'>
        <div className='animate-pulse space-y-6'>
          <div className='h-8 bg-gray-200 rounded w-1/3' />
          <div className='bg-white rounded-xl p-6 space-y-4'>
            <div className='h-10 bg-gray-200 rounded' />
            <div className='h-10 bg-gray-200 rounded' />
            <div className='h-32 bg-gray-200 rounded' />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-2xl mx-auto'>
      <div className='mb-8'>
        <h1 className='font-heading font-bold text-2xl text-gray-900'>
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className='text-gray-600 mt-1'>
          {isEdit
            ? 'Update your product details'
            : 'Fill in the details to list your product'}
        </p>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6'>
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className='bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6'
      >
        {/* Product Name */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Product Name <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            name='name'
            value={form.name}
            onChange={handleChange}
            placeholder='e.g. Professional Football'
            className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Category <span className='text-red-500'>*</span>
          </label>
          <select
            name='category'
            value={form.category}
            onChange={handleChange}
            className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
            required
          >
            <option value=''>Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Description
          </label>
          <textarea
            name='description'
            value={form.description}
            onChange={handleChange}
            placeholder='Describe your product...'
            rows={4}
            className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none'
          />
        </div>

        {/* Price Fields */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Price (Rs.) <span className='text-red-500'>*</span>
            </label>
            <input
              type='number'
              name='price'
              value={form.price}
              onChange={handleChange}
              placeholder='0.00'
              min='0'
              step='0.01'
              className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Original Price (Rs.)
            </label>
            <input
              type='number'
              name='originalPrice'
              value={form.originalPrice}
              onChange={handleChange}
              placeholder='0.00 (for showing discount)'
              min='0'
              step='0.01'
              className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
            />
          </div>
        </div>

        {/* Stock */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Stock Quantity
          </label>
          <input
            type='number'
            name='stock'
            value={form.stock}
            onChange={handleChange}
            placeholder='0'
            min='0'
            className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Product Image
          </label>
          <div className='flex items-start gap-4'>
            {imagePreview && (
              <div className='w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                <img
                  src={imagePreview}
                  alt='Preview'
                  className='w-full h-full object-cover'
                />
              </div>
            )}
            <div className='flex-1'>
              <input
                type='file'
                accept='image/jpeg,image/png,image/webp'
                onChange={handleImageChange}
                className='w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100'
              />
              <p className='text-xs text-gray-400 mt-1'>
                JPEG, PNG, or WebP. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-3 pt-4 border-t border-gray-100'>
          <button
            type='submit'
            disabled={loading}
            className='btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
          </button>
          <button
            type='button'
            onClick={() => navigate('/operator/products')}
            className='px-6 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium'
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddEditProduct
