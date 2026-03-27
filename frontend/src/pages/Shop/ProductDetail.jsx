import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import productService from '../../services/productService';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const { addToCart, setIsCartOpen } = useCart();

    const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const res = await productService.getProductById(id);
            setProduct(res.data.data.product);
        } catch (err) {
            setError('Product not found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container-custom py-12">
                    <div className="animate-pulse max-w-5xl mx-auto">
                        <div className="flex flex-col lg:flex-row gap-10">
                            <div className="lg:w-1/2 h-96 bg-gray-200 rounded-xl" />
                            <div className="lg:w-1/2 space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-1/4" />
                                <div className="h-8 bg-gray-200 rounded w-3/4" />
                                <div className="h-6 bg-gray-200 rounded w-1/3" />
                                <div className="h-20 bg-gray-200 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container-custom py-16 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="font-heading font-bold text-2xl text-gray-900 mb-2">Product Not Found</h2>
                    <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
                    <Link to="/shop" className="btn-primary">
                        Back to Shop
                    </Link>
                </div>
            </div>
        );
    }

    const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
    const discountPercent = hasDiscount
        ? Math.round((1 - parseFloat(product.price) / parseFloat(product.originalPrice)) * 100)
        : 0;

    const handleAddToCart = () => {
        if (product.stock === 0) {
            toast.error('Product is out of stock');
            return;
        }
        if (quantity > product.stock) {
            toast.error(`Only ${product.stock} items available`);
            return;
        }
        
        addToCart(product, quantity);
        toast.success('Added to cart');
        setIsCartOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
                {/* Breadcrumb */}
                <div className="bg-white border-b border-gray-100">
                    <div className="container-custom py-3">
                        <nav className="flex items-center gap-2 text-sm text-gray-500">
                            <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <Link to="/shop" className="hover:text-primary-600 transition-colors">Shop</Link>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-gray-900 font-medium">{product.name}</span>
                        </nav>
                    </div>
                </div>

                <div className="container-custom py-8 md:py-12">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-col lg:flex-row gap-10">
                            {/* Product Image */}
                            <div className="lg:w-1/2">
                                <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 aspect-square">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl.startsWith('http') ? product.imageUrl : `${apiUrl}${product.imageUrl}`}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    {hasDiscount && (
                                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold text-sm">
                                            -{discountPercent}% OFF
                                        </div>
                                    )}
                                    {product.stock === 0 && (
                                        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold text-sm">
                                            Out of Stock
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="lg:w-1/2">
                                <span className="inline-block bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
                                    {product.category}
                                </span>

                                <h1 className="font-heading font-bold text-3xl text-gray-900 mb-4">
                                    {product.name}
                                </h1>

                                {/* Price */}
                                <div className="flex items-baseline gap-3 mb-6">
                                    <span className="font-bold text-3xl text-gray-900">
                                        Rs. {parseFloat(product.price).toLocaleString()}
                                    </span>
                                    {hasDiscount && (
                                        <span className="text-lg text-gray-400 line-through">
                                            Rs. {parseFloat(product.originalPrice).toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                {/* Stock Status */}
                                <div className="flex items-center gap-2 mb-6">
                                    <div className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className={`font-medium ${product.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                    </span>
                                </div>

                                {/* Add to Cart Actions */}
                                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                    {/* Quantity Selector */}
                                    <div className="flex items-center border border-gray-300 rounded-lg w-max">
                                        <button 
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors disabled:opacity-50"
                                            disabled={quantity <= 1 || product.stock === 0}
                                        >
                                            -
                                        </button>
                                        <span className="px-6 py-3 font-medium text-gray-900 border-x border-gray-300 min-w-[3rem] text-center">
                                            {quantity}
                                        </span>
                                        <button 
                                            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                            className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors disabled:opacity-50"
                                            disabled={quantity >= product.stock || product.stock === 0}
                                        >
                                            +
                                        </button>
                                    </div>
                                    
                                    {/* Add to Cart Button */}
                                    <button 
                                        onClick={handleAddToCart}
                                        disabled={product.stock === 0}
                                        className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                    </button>
                                </div>

                                {/* Description */}
                                {product.description && (
                                    <div className="mb-8">
                                        <h3 className="font-heading font-semibold text-gray-900 mb-2">Description</h3>
                                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                            {product.description}
                                        </p>
                                    </div>
                                )}

                                {/* Seller Info */}
                                {product.seller && (
                                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center overflow-hidden">
                                                {product.seller.profileImage ? (
                                                    <img src={product.seller.profileImage} alt={product.seller.fullName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-white font-semibold text-sm">
                                                        {product.seller.fullName?.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Sold by</p>
                                                <p className="font-medium text-gray-900">{product.seller.fullName}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Back to shop */}
                                <Link
                                    to="/shop"
                                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to Shop
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ProductDetail;
