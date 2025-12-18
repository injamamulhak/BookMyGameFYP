import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import VerifyEmailPage from './pages/Auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        {/* Additional routes will be added here */}
                        {/* <Route path="/venues" element={<VenuesPage />} /> */}
                        {/* <Route path="/venues/:id" element={<VenueDetailsPage />} /> */}
                        {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
                        {/* <Route path="/booking/:courtId" element={<BookingPage />} /> */}
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
