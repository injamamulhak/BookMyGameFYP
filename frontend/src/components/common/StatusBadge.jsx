/**
 * StatusBadge Component
 * Reusable status indicator badge with color coding
 * 
 * @param {string} status - Status value (e.g., 'approved', 'pending', 'rejected', 'active', etc.)
 * @param {string} className - Additional CSS classes
 */

const STATUS_STYLES = {
    // Approval statuses
    approved: 'bg-green-100 text-green-700',
    active: 'bg-green-100 text-green-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-green-100 text-green-700',
    verified: 'bg-green-100 text-green-700',

    // Pending statuses
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-amber-100 text-amber-700',

    // Negative statuses
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-red-100 text-red-700',
    inactive: 'bg-red-100 text-red-700',
    failed: 'bg-red-100 text-red-700',

    // Info statuses
    admin: 'bg-purple-100 text-purple-700',
    operator: 'bg-blue-100 text-blue-700',
    user: 'bg-gray-100 text-gray-700',
};

const StatusBadge = ({ status, className = '' }) => {
    const normalizedStatus = status?.toLowerCase() || 'unknown';
    const style = STATUS_STYLES[normalizedStatus] || 'bg-gray-100 text-gray-700';
    const displayText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${style} ${className}`}>
            {displayText}
        </span>
    );
};

export default StatusBadge;
