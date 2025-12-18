import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authService from '../../services/authService';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) {
            verifyEmail();
        } else {
            setStatus('error');
            setMessage('No verification token provided');
        }
    }, [token]);

    const verifyEmail = async () => {
        try {
            const response = await authService.verifyEmail(token);
            if (response.success) {
                setStatus('success');
                setMessage(response.message);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Verification failed');
        }
    };

    const handleResend = async () => {
        // This would require getting the email from somewhere
        // For now, we'll just navigate to login
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Verification</h1>
                </div>

                {/* Status Display */}
                {status === 'verifying' && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Verifying your email...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl text-green-600">✓</span>
                        </div>
                        <Alert type="success" message={message} className="mb-4" />
                        <p className="text-gray-600 text-sm">Redirecting to login...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl text-red-600">✕</span>
                        </div>
                        <Alert type="error" message={message} className="mb-6" />
                        <div className="space-y-3">
                            <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
                                Go to Login
                            </Button>
                            <Link to="/signup" className="block text-purple-600 hover:text-purple-700 text-sm font-semibold">
                                Create New Account
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
