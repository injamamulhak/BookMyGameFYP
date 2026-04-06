import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const sections = [
    {
        id: 'introduction',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        title: 'Introduction',
        content: `BookMyGame ("we", "our", or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform at BookMyGame, including any other media form, media channel, or mobile website related or connected to it.

Please read this policy carefully. If you disagree with its terms, please discontinue use of the platform. We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date on this page.`,
    },
    {
        id: 'information-collected',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        title: 'Information We Collect',
        content: null,
        subsections: [
            {
                title: 'Personal Information You Provide',
                items: [
                    'Full name and email address when you create an account',
                    'Phone number (optional, used for venue contact purposes)',
                    'Profile photo (optional)',
                    'Billing and payment details via Khalti (we do not store raw card data)',
                ],
            },
            {
                title: 'Information Collected Automatically',
                items: [
                    'IP address and browser type when you access the platform',
                    'Pages visited, time spent, and navigation patterns',
                    'Device information (operating system, screen size)',
                    'Session data stored in secure browser cookies',
                ],
            },
            {
                title: 'Booking & Transaction Data',
                items: [
                    'Venue bookings including dates, time slots, and amounts paid',
                    'Event registrations and associated payment records',
                    'Transaction IDs from Khalti payment gateway',
                    'Review and rating content you submit publicly',
                ],
            },
        ],
    },
    {
        id: 'how-we-use',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        title: 'How We Use Your Information',
        content: 'We use the information we collect or receive for the following purposes:',
        list: [
            'Create and manage your account and authenticate your identity',
            'Process venue bookings and event registrations on your behalf',
            'Send booking confirmations, receipts, and QR codes via email',
            'Deliver real-time in-app notifications about your bookings and payments',
            'Allow venue operators to manage and respond to your reservations',
            'Send administrative communications (password resets, account alerts)',
            'Improve our platform through aggregated usage analytics',
            'Respond to your inquiries submitted via the Contact page',
            'Enforce our Terms & Conditions and prevent fraudulent activity',
        ],
    },
    {
        id: 'data-sharing',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
        ),
        title: 'Sharing Your Information',
        content: 'We do not sell, trade, or rent your personal information to third parties. We may share data in these limited circumstances:',
        list: [
            'Venue Operators — Your name, contact details, and booking information are shared with venue operators so they can fulfil your reservations.',
            'Khalti Payment Gateway — Payment amounts and transaction identifiers are processed securely through Khalti. We never see or store your raw card or wallet credentials.',
            'Email Service (Nodemailer/SMTP) — We use an email delivery service to send you receipts, confirmations, and notifications.',
            'Legal Compliance — We may disclose information if required to do so by law or in response to valid legal requests.',
            'Business Transfer — In the event of a merger or acquisition, your data may be transferred as part of that transaction.',
        ],
    },
    {
        id: 'data-security',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: 'Data Storage & Security',
        content: 'We implement industry-standard security measures to protect your data:',
        list: [
            'All passwords are hashed using bcrypt before being stored — we never store plain-text passwords',
            'Authentication is handled via signed JWT (JSON Web Tokens) with short expiry windows',
            'All API communication is encrypted over HTTPS/TLS',
            'Our PostgreSQL database is hosted with access controls and regular backups',
            'Sensitive environment variables (database URLs, API keys) are never committed to source control',
        ],
        footer: 'Despite these measures, no security system is impenetrable. We encourage you to use a strong, unique password and to contact us immediately if you suspect any unauthorised access.',
    },
    {
        id: 'your-rights',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        title: 'Your Rights',
        content: 'You have the following rights regarding your personal data:',
        list: [
            'Access — Request a copy of the personal data we hold about you',
            'Correction — Ask us to correct inaccurate or incomplete information',
            'Deletion — Request deletion of your account and associated data',
            'Portability — Ask us to export your data in a machine-readable format',
            'Objection — Object to processing of your data for certain purposes',
        ],
        footer: 'To exercise any of these rights, please contact us through our Contact page. We will respond within 30 days.',
    },
    {
        id: 'cookies',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        title: 'Cookies & Local Storage',
        content: 'BookMyGame uses minimal browser storage:',
        list: [
            'Authentication Token — A JWT token is stored in your browser\'s localStorage to keep you logged in across sessions. This token expires automatically.',
            'Session Data — Temporary session data may be kept in memory during your visit for performance purposes.',
            'No Tracking Cookies — We do not use advertising, analytics, or third-party tracking cookies.',
        ],
        footer: 'You can clear your browser\'s localStorage at any time to log out and remove all stored tokens.',
    },
    {
        id: 'third-party',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
        ),
        title: 'Third-Party Services',
        content: 'We integrate with the following third-party services, each governed by their own privacy policies:',
        list: [
            'Khalti — Payment processing for venue bookings and event registrations (khalti.com)',
            'OpenStreetMap — Map tiles used to display venue locations on the detail pages (openstreetmap.org)',
            'Nodemailer/SMTP — Email delivery for booking receipts and notifications',
            'Cloudinary (optional) — Image hosting for venue photos and profile pictures, when configured',
        ],
    },
    {
        id: 'children',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        title: "Children's Privacy",
        content: `BookMyGame is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately and we will take steps to remove such information from our systems.`,
    },
    {
        id: 'contact',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        title: 'Contact Us',
        content: `If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal data, please do not hesitate to reach out:`,
        isContact: true,
    },
];

function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 text-white py-16">
                <div className="container-custom text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm border border-white/20">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-4">
                        We value your trust. Here's exactly how BookMyGame collects, uses, and protects your personal information.
                    </p>
                    <span className="inline-block bg-white/10 border border-white/20 text-sm text-gray-300 px-4 py-1.5 rounded-full backdrop-blur-sm">
                        Last Updated: April 2026
                    </span>
                </div>
            </div>

            {/* Table of Contents + Content */}
            <div className="container-custom py-12">
                <div className="grid lg:grid-cols-4 gap-8">

                    {/* Sticky Table of Contents */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">On This Page</h2>
                            <nav className="space-y-1">
                                {sections.map((section) => (
                                    <a
                                        key={section.id}
                                        href={`#${section.id}`}
                                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors group"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-primary-500 transition-colors flex-shrink-0" />
                                        {section.title}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-3 space-y-6">
                        {sections.map((section) => (
                            <div
                                key={section.id}
                                id={section.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 scroll-mt-24"
                            >
                                {/* Section Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                                </div>

                                {/* Intro text */}
                                {section.content && (
                                    <p className="text-gray-600 leading-relaxed mb-4 whitespace-pre-line">
                                        {section.content}
                                    </p>
                                )}

                                {/* Subsections */}
                                {section.subsections && (
                                    <div className="space-y-4">
                                        {section.subsections.map((sub) => (
                                            <div key={sub.title}>
                                                <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide text-primary-700">
                                                    {sub.title}
                                                </h3>
                                                <ul className="space-y-2">
                                                    {sub.items.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                                                            <svg className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Bullet List */}
                                {section.list && (
                                    <ul className="space-y-2.5 mt-1">
                                        {section.list.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                                                <svg className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {/* Footer note */}
                                {section.footer && (
                                    <p className="mt-4 text-sm text-gray-500 italic border-t border-gray-100 pt-4">
                                        {section.footer}
                                    </p>
                                )}

                                {/* Contact CTA */}
                                {section.isContact && (
                                    <div className="mt-4 bg-primary-50 border border-primary-100 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 mb-1">BookMyGame Support</p>
                                            <p className="text-sm text-gray-600">injamamulhaque767@gmail.com</p>
                                            <p className="text-sm text-gray-600">Rudra Mati Marg, Kathmandu 44800</p>
                                        </div>
                                        <Link
                                            to="/contact"
                                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors flex-shrink-0"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Contact Us
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Bottom note */}
                        <div className="bg-gray-800 text-white rounded-2xl p-6 text-center">
                            <p className="text-gray-300 text-sm">
                                By using BookMyGame, you acknowledge that you have read and understood this Privacy Policy and agree to the collection and use of your information as described herein. For the Terms & Conditions,{' '}
                                <Link to="/terms" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">
                                    click here
                                </Link>.
                            </p>
                        </div>
                    </main>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default PrivacyPolicyPage;
