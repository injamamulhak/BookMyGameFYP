import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authService from '../../services/authService';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Input from '../../components/common/Input';

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const urlToken = searchParams.get('token');

    const [otp, setOtp] = useState('');
    const [status, setStatus] = useState('pending'); // pending, verifying, success, error
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (urlToken) {
            verifyEmail(urlToken);
        }
    }, [urlToken]);

    const verifyEmail = async (tokenToVerify) => {
        if (!tokenToVerify) {
            setStatus('error');
            setMessage('Please enter your 6-digit verification code.');
            return;
        }

        setStatus('verifying');
        setLoading(true);
        try {
            const response = await authService.verifyEmail(tokenToVerify);
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
            setMessage(err.response?.data?.message || 'Verification failed. The code may be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = (e) => {
        e.preventDefault();
        verifyEmail(otp.trim());
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Verification</h1>
                    <p className="text-gray-600">Enter the 6-digit code sent to your email</p>
                </div>

                {/* Status Display */}
                {status === 'verifying' && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Verifying your code...</p>
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

                {(status === 'pending' || status === 'error') && (
                    <div className="py-4">
                        {status === 'error' && (
                            <Alert type="error" message={message} className="mb-6" />
                        )}
                        
                        <form onSubmit={handleOtpSubmit} className="space-y-6">
                            <Input
                                label="Verification Code"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                maxLength={6}
                                className="text-center text-2xl tracking-[0.5em] font-bold"
                                required
                            />
                            
                            <Button 
                                type="submit" 
                                variant="primary" 
                                fullWidth 
                                loading={loading}
                            >
                                Verify Email
                            </Button>
                        </form>
                        
                        <div className="mt-6 space-y-3 text-center">
                            <Link to="/login" className="block text-purple-600 hover:text-purple-700 text-sm font-semibold">
                                Back to Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
