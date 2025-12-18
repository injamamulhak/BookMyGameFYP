const Alert = ({ type = 'info', message, onClose, className = '' }) => {
    const types = {
        success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-800',
            icon: '✓',
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800 ',
            icon: '✕',
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            text: 'text-yellow-800',
            icon: '⚠',
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            icon: 'ℹ',
        },
    };

    const style = types[type];

    return (
        <div className={`${style.bg} ${style.border} ${style.text} border-l-4 p-4 rounded-r-lg ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <span className="text-xl mr-3">{style.icon}</span>
                    <p className="text-sm font-medium">{message}</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                        <span className="text-xl">×</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Alert;
