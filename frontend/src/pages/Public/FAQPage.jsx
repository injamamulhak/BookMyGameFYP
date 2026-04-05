import { useState } from 'react';

const faqs = [
    {
        category: 'Booking Venues',
        questions: [
            {
                q: "How do I book a venue?",
                a: "You can book a venue by searching for your desired location and sport, selecting an available time slot, and completing the payment process online. You'll receive a confirmation email with your booking details."
            },
            {
                q: "Can I cancel or reschedule my booking?",
                a: "Yes, you can cancel or reschedule bookings from your 'My Bookings' dashboard. Please note that cancellations must be made at least 24 hours in advance to receive a full refund."
            },
            {
                q: "Is equipment provided at the venues?",
                a: "Equipment provision depends on the specific venue. Some venues offer equipment rentals while others require you to bring your own. You can check the equipment details on the venue's page."
            }
        ]
    },
    {
        category: 'Hosting & Managing Venues',
        questions: [
            {
                q: "How can I list my venue on BookMyGame?",
                a: "To list your venue, sign up and apply to become an 'Operator'. Once your account is approved by an admin, you can access the Operator Dashboard to add and manage your venues, set pricing, and control availability."
            },
            {
                q: "What fees do you charge for venue listings?",
                a: "We charge a small percentage commission on each successful booking made through our platform. There are no upfront setup fees or monthly subscriptions to list your venue."
            }
        ]
    },
    {
        category: 'Events & Tournaments',
        questions: [
            {
                q: "How do I participate in an event?",
                a: "Browse the 'Events' section to find upcoming tournaments or causal matches. Click on an event to view details and register. Some events may require a registration fee."
            },
            {
                q: "Can I organize my own event?",
                a: "Yes! Operators can organize and publish events at their venues. Users will be able to see these events in the Events calendar and register to participate."
            }
        ]
    },
    {
        category: 'Payments & Account',
        questions: [
            {
                q: "What payment methods do you accept?",
                a: "We currently support Khalti as our primary payment gateway, allowing you to pay using Khalti wallet, mobile banking, or connected bank accounts."
            },
            {
                q: "I forgot my password, how do I recover it?",
                a: "Click on 'Forgot Password' on the login page, enter your registered email address, and we will send you a secure link to reset your password."
            }
        ]
    }
];

function FAQItem({ faq }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 bg-white hover:border-primary-300 hover:shadow-md">
            <button
                className="w-full text-left px-6 py-4 flex justify-between items-center focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-semibold text-gray-800 pr-4">{faq.q}</span>
                <div className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            
            <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="px-6 pb-4 text-gray-600 border-t border-gray-100 pt-2">
                    {faq.a}
                </div>
            </div>
        </div>
    );
}

function FAQPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col py-12">
            <div className="container-custom flex-grow max-w-4xl">
                {/* Header Section */}
                <div className="text-center mb-16 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                        Frequently Asked <span className="text-gradient">Questions</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Find answers to common questions about booking venues, managing your account, payments, and more.
                    </p>
                </div>

                {/* Categories & Questions */}
                <div className="space-y-12">
                    {faqs.map((categoryGroup, index) => (
                        <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 font-heading flex items-center">
                                <span className="w-8 h-8 bg-primary-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm">
                                    {index + 1}
                                </span>
                                {categoryGroup.category}
                            </h2>
                            <div className="space-y-4">
                                {categoryGroup.questions.map((faq, idx) => (
                                    <FAQItem key={idx} faq={faq} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Still have questions */}
                <div className="mt-16 text-center bg-white p-8 rounded-2xl shadow-soft border border-primary-100">
                    <h3 className="text-xl font-bold font-heading mb-2 text-gray-800">Still have questions?</h3>
                    <p className="text-gray-600 mb-6">Can't find the answer you're looking for? Reach out to our support team.</p>
                    <a href="/contact" className="btn-primary inline-flex items-center space-x-2">
                        <i className="fas fa-envelope"></i>
                        <span>Contact Support</span>
                    </a>
                </div>
            </div>
        </div>
    );
}

export default FAQPage;
