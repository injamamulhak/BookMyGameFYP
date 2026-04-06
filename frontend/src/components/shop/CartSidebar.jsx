import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

function CartSidebar() {
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    cartTotal,
    removeFromCart,
    updateQuantity,
  } = useCart()
  const navigate = useNavigate()
  const sidebarRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsCartOpen(false)
      }
    }
    if (isCartOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCartOpen, setIsCartOpen])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isCartOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isCartOpen])

  const handleCheckout = () => {
    setIsCartOpen(false)
    navigate('/shop/checkout')
  }

  if (!isCartOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className='fixed inset-0 bg-gray-500 bg-opacity-75 z-40 transition-opacity' />

      {/* Sidebar Panel */}
      <div className='fixed inset-0 z-50 flex justify-end pointer-events-none'>
        <div
          ref={sidebarRef}
          className='pointer-events-auto w-full max-w-md flex flex-col bg-white shadow-xl h-full'
        >
          {/* Header */}
          <div className='flex items-start justify-between border-b border-gray-200 px-4 py-6 sm:px-6'>
            <h2 className='text-xl font-heading font-bold text-gray-900'>
              Shopping Cart
            </h2>
            <button
              type='button'
              className='relative -m-2 p-2 text-gray-400 hover:text-gray-500 cursor-pointer'
              onClick={() => setIsCartOpen(false)}
            >
              <span className='sr-only'>Close panel</span>
              <svg
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='1.5'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className='flex-1 overflow-y-auto px-4 py-6 sm:px-6'>
            {cartItems.length === 0 ? (
              <div className='text-center py-12'>
                <svg
                  className='mx-auto h-12 w-12 text-gray-400 mb-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1}
                    d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
                <h3 className='text-lg font-medium text-gray-900'>
                  Your cart is empty
                </h3>
                <p className='mt-1 text-gray-500'>
                  Looks like you haven't added anything yet.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className='mt-6 text-primary-600 hover:text-primary-500 font-medium cursor-pointer'
                >
                  Continue Shopping &rarr;
                </button>
              </div>
            ) : (
              <ul className='-my-6 divide-y divide-gray-200'>
                {cartItems.map((item) => (
                  <li key={item.product.id} className='flex py-6'>
                    <div className='h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200'>
                      {item.product.imageUrl ? (
                        <img
                          src={
                            item.product.imageUrl.startsWith('http')
                              ? item.product.imageUrl
                              : `http://localhost:5000${item.product.imageUrl}`
                          }
                          alt={item.product.name}
                          className='h-full w-full object-cover object-center'
                        />
                      ) : (
                        <div className='h-full w-full bg-gray-100 flex items-center justify-center'>
                          <span className='text-gray-400 text-xs'>
                            No Image
                          </span>
                        </div>
                      )}
                    </div>

                    <div className='ml-4 flex flex-1 flex-col'>
                      <div>
                        <div className='flex justify-between text-base font-medium text-gray-900'>
                          <h3>
                            <Link
                              onClick={() => setIsCartOpen(false)}
                              to={`/shop/${item.product.id}`}
                            >
                              {item.product.name}
                            </Link>
                          </h3>
                          <p className='ml-4'>
                            Rs.{' '}
                            {(
                              item.product.price * item.quantity
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className='flex flex-1 items-end justify-between text-sm mt-2'>
                        <div className='flex items-center border border-gray-300 rounded-md'>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className='px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md cursor-pointer disabled:opacity-50'
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className='px-3 border-x border-gray-300'>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className='px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md cursor-pointer disabled:opacity-50'
                            disabled={item.quantity >= item.product.stock}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type='button'
                          onClick={() => removeFromCart(item.product.id)}
                          className='font-medium text-red-600 hover:text-red-500 cursor-pointer'
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className='border-t border-gray-200 px-4 py-6 sm:px-6'>
              <div className='flex justify-between text-base font-medium text-gray-900 mb-4'>
                <p>Subtotal</p>
                <p>Rs. {cartTotal.toLocaleString()}</p>
              </div>
              <p className='text-sm text-gray-500 mb-6'>
                Shipping and taxes calculated at checkout.
              </p>
              <button
                onClick={handleCheckout}
                className='flex w-full items-center justify-center rounded-md border border-transparent bg-primary-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700 cursor-pointer'
              >
                Checkout
              </button>
              <div className='mt-6 flex justify-center text-center text-sm text-gray-500'>
                <p>
                  or{' '}
                  <button
                    type='button'
                    className='font-medium text-primary-600 hover:text-primary-500 cursor-pointer'
                    onClick={() => setIsCartOpen(false)}
                  >
                    Continue Shopping <span aria-hidden='true'>&rarr;</span>
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default CartSidebar
