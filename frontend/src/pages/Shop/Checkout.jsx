import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/layout/Header';
import orderService from '../../services/orderService';
import toast from 'react-hot-toast';

function Checkout() {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [shippingAddress, setShippingAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container-custom py-16 text-center">
                    <h2 className="text-2xl font-bold font-heading text-gray-900 mb-4">Your cart is empty</h2>
                    <p className="text-gray-500 mb-8">Add items to your cart before proceeding to checkout.</p>
                    <Link to="/shop" className="btn-primary">Return to Shop</Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (shippingAddress.trim().length < 10) {
            toast.error('Please provide a complete shipping address');
            return;
        }

        setIsSubmitting(true);
        try {
            const orderData = {
                shippingAddress,
                items: cartItems.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity
                }))
            };

            await orderService.createOrder(orderData);
            clearCart();
            toast.success('Order placed successfully!');
            navigate('/my-orders');
        } catch (error) {
            console.error('Checkout error', error);
            const msg = error.response?.data?.message || 'Failed to place order';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container-custom py-10">
                <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">Checkout</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Checkout Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-heading font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">
                                Shipping Details
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed" 
                                        value={user?.fullName || ''} 
                                        disabled
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Name tied to your account</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input 
                                        type="email" 
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed" 
                                        value={user?.email || ''} 
                                        disabled
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Complete Shipping Address *
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={shippingAddress}
                                        onChange={(e) => setShippingAddress(e.target.value)}
                                        placeholder="Flat/House no, Street name, City, State, ZIP code"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                    ></textarea>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full btn-primary py-4 text-lg"
                                    >
                                        {isSubmitting ? 'Processing...' : 'Place Order'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h2 className="text-xl font-heading font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">
                                Order Summary
                            </h2>
                            
                            <div className="flow-root mb-6">
                                <ul role="list" className="-my-4 divide-y divide-gray-200">
                                    {cartItems.map((item) => (
                                        <li key={item.product.id} className="flex py-4">
                                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                                {item.product.imageUrl ? (
                                                    <img
                                                        src={item.product.imageUrl.startsWith('http') ? item.product.imageUrl : `http://localhost:5000${item.product.imageUrl}`}
                                                        alt={item.product.name}
                                                        className="h-full w-full object-cover object-center"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                                        <span className="text-xs text-gray-400">No Img</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4 flex flex-1 flex-col">
                                                <div>
                                                    <div className="flex justify-between text-sm font-medium text-gray-900">
                                                        <h3 className="line-clamp-2">{item.product.name}</h3>
                                                        <p className="ml-4 whitespace-nowrap">Rs. {(item.product.price * item.quantity).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-1 items-end justify-between text-sm">
                                                    <p className="text-gray-500">Qty {item.quantity}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-3">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <p>Subtotal</p>
                                    <p>Rs. {cartTotal.toLocaleString()}</p>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <p>Shipping</p>
                                    <p>Free</p>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                                    <p>Total</p>
                                    <p>Rs. {cartTotal.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Checkout;
