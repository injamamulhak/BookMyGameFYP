/**
 * LoadingSpinner Component
 * Reusable loading indicator with configurable size and color
 * 
 * @param {string} size - 'sm', 'md', or 'lg' (default: 'md')
 * @param {string} className - Additional CSS classes
 * @param {string} message - Optional loading message
 */
const LoadingSpinner = ({ size = 'md', className = '', message }) => {
    const sizes = {
        sm: 'h-6 w-6 border-2',
        md: 'h-12 w-12 border-4',
        lg: 'h-16 w-16 border-4',
    };

    return (
        <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
            <div
                className={`animate-spin rounded-full border-primary-600 border-t-transparent ${sizes[size]}`}
            />
            {message && (
                <p className="mt-4 text-gray-500 text-sm">{message}</p>
            )}
        </div>
    );
};

export default LoadingSpinner;
