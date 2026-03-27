import { useAuth } from '../../../context/AuthContext';

const steps = [
    {
        id: 1,
        icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
        title: 'Search Venues',
        description: 'Browse through hundreds of sports venues in your area. Filter by sport, location, and availability.',
    },
    {
        id: 2,
        icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
        title: 'Book Your Slot',
        description: 'Choose your preferred time slot and court. Get instant confirmation with flexible hourly bookings.',
    },
    {
        id: 3,
        icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
        title: 'Secure Payment',
        description: 'Pay securely with Khalti. Get instant receipts and booking confirmations via email.',
    },
    {
        id: 4,
        icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        title: 'Play & Enjoy',
        description: 'Show up and play! Rate your experience and help others find great venues.',
    },
];

function HowItWorks() {
    const { isAuthenticated } = useAuth();

    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="container-custom">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-4">
                        How It Works
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Booking your favorite sports venue is easy! Follow these simple steps
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <div key={step.id} className="relative">
                            {/* Connector Line (hidden on mobile and last item) */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-200 to-transparent" />
                            )}

                            <div className="relative text-center">
                                {/* Icon Circle */}
                                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white mb-6 shadow-lg mx-auto">
                                    <span className="text-4xl">{step.icon}</span>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-primary-600 font-bold text-sm flex items-center justify-center shadow-md">
                                        {step.id}
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className="font-heading font-bold text-xl text-gray-900 mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA Button - Show different text/link based on auth state */}
                <div className="text-center mt-12">
                    <a href={isAuthenticated ? "/venues" : "/signup"} className="btn-primary inline-flex items-center">
                        <span>{isAuthenticated ? "Find Venues" : "Get Started Now"}</span>
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
}

export default HowItWorks;
