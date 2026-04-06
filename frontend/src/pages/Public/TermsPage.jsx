import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const sections = [
    {
        id: 'acceptance',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        title: 'Acceptance of Terms',
        content: `By accessing or using the BookMyGame platform — including our website, mobile interface, and all associated services — you confirm that you are at least 13 years of age and agree to be legally bound by these Terms & Conditions.

If you do not agree with any part of these terms, you must discontinue use of the platform immediately. Your continued use of BookMyGame after any modifications to these Terms constitutes your acceptance of the updated version.`,
    },
    {
        id: 'platform',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        title: 'Platform Description',
        content: 'BookMyGame is an online marketplace that connects sports enthusiasts ("Users") with sports venue owners and managers ("Operators"). The platform enables:',
        list: [
            'Discovery and booking of sports venues including football pitches, basketball courts, cricket grounds, and more',
            'Registration for sports events and tournaments hosted at listed venues',
            'Purchase of sports gear and equipment from the integrated shop',
            'Access to training videos and instructional content',
            'Communication between users, operators, and the BookMyGame team',
        ],
        footer: 'BookMyGame acts as an intermediary marketplace only. We are not the venue provider and are not responsible for the quality, safety, or availability of any venue listed on the platform.',
    },
    {
        id: 'accounts',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        title: 'User Accounts',
        content: 'To access core features of BookMyGame you must register for an account. By creating an account, you agree to the following:',
        list: [
            'You will provide accurate, complete, and up-to-date information during registration',
            'You are responsible for keeping your login credentials confidential',
            'You are solely responsible for all activity that occurs under your account',
            'You will not create more than one personal account',
            'You will notify us immediately at injamamulhaque767@gmail.com if you suspect unauthorised access',
            'Accounts found to be fraudulent or in violation of these terms may be suspended or terminated without notice',
        ],
    },
    {
        id: 'bookings',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        title: 'Booking Rules',
        content: 'When you make a booking through BookMyGame, the following conditions apply:',
        list: [
            'Slot Locking — Selected time slots are temporarily locked for 5 minutes while you complete payment. If payment is not completed within this window, the slot is automatically released.',
            'Booking Confirmation — A booking is only confirmed upon successful completion of payment via Khalti. Pending bookings are not guaranteed.',
            'Operator Rights — Venue operators may cancel a confirmed booking in unforeseen circumstances (e.g. facility damage, force majeure). In such cases, a full refund will be processed.',
            'Accuracy — Users must ensure all booking details (date, time, number of players) are correct before confirming. Errors may not be correctable after payment.',
            'No-Show Policy — Failure to attend a confirmed booking without cancellation does not entitle you to a refund.',
        ],
    },
    {
        id: 'payments',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
        title: 'Payment Terms',
        content: 'All payments on BookMyGame are processed securely through Khalti, a licensed payment gateway in Nepal.',
        list: [
            'All prices are displayed and charged in Nepali Rupees (NPR)',
            'Payment is required in full at the time of booking — no partial payments are accepted',
            'BookMyGame does not store your Khalti credentials, wallet PIN, or any raw payment information',
            'A transaction record is created in your account upon successful payment for your reference',
            'Khalti\'s own Terms of Service govern the payment processing relationship between you and Khalti',
            'In the event of a Khalti service outage, we may be unable to process payments; users should retry once service is restored',
        ],
    },
    {
        id: 'cancellations',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
        ),
        title: 'Cancellations & Refunds',
        content: 'Our cancellation and refund policy is designed to be fair to both users and venue operators:',
        subsections: [
            {
                title: 'User-Initiated Cancellations',
                items: [
                    'Cancellations made more than 24 hours before the booking time are eligible for a full refund',
                    'Cancellations within 24 hours of the booking time are non-refundable',
                    'To cancel, visit "My Bookings" in your account dashboard',
                ],
            },
            {
                title: 'Operator-Initiated Cancellations',
                items: [
                    'If an operator cancels a confirmed booking, users receive a full refund automatically',
                    'Repeated operator cancellations may result in removal of the venue from the platform',
                ],
            },
            {
                title: 'Event Registrations',
                items: [
                    'Event registration fees are generally non-refundable once confirmed',
                    'Exceptions may apply if an event is cancelled by the organiser',
                ],
            },
        ],
    },
    {
        id: 'conduct',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
        ),
        title: 'User Conduct',
        content: 'You agree NOT to use BookMyGame to engage in any of the following prohibited activities:',
        list: [
            'Making fraudulent, duplicate, or false bookings',
            'Attempting to circumvent the payment system or use stolen payment credentials',
            'Harassing, threatening, or abusing venue operators, other users, or BookMyGame staff',
            'Posting false, misleading, or defamatory reviews',
            'Scraping, crawling, or data-mining the platform without written permission',
            'Attempting to gain unauthorised access to other user accounts or backend systems',
            'Using the platform for any illegal purpose under the laws of Nepal',
        ],
        footer: 'Violations may result in immediate account suspension and, where applicable, referral to relevant authorities.',
    },
    {
        id: 'operators',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        title: 'Venue Operators',
        content: 'If you register as a venue operator on BookMyGame, you additionally agree to:',
        list: [
            'Provide accurate and truthful information about your venue — including name, location, facilities, pricing, and operating hours',
            'Keep your venue listings up to date and promptly inform us of any changes',
            'Honour all confirmed bookings made through the platform in good faith',
            'Not discriminate against users based on gender, ethnicity, religion, or any other protected characteristic',
            'Respond to user reviews professionally and within a reasonable timeframe',
            'Not charge users any additional fees above the listed price on BookMyGame',
            'Understand that your venue listing is subject to admin approval and may be rejected or removed for non-compliance',
        ],
        footer: 'BookMyGame reserves the right to remove any venue listing that violates these obligations or receives sustained negative feedback.',
    },
    {
        id: 'reviews',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        ),
        title: 'Reviews & User Content',
        content: 'BookMyGame allows users to submit reviews and ratings for venues they have visited. By posting a review, you agree that:',
        list: [
            'You are the author of the content and it reflects your genuine experience',
            'You grant BookMyGame a non-exclusive, royalty-free licence to display your review on the platform',
            'Your review must not contain defamatory, abusive, or discriminatory language',
            'Only users who have a confirmed booking at a venue may submit a review for that venue',
            'Operators may reply to reviews but not edit or delete user reviews',
            'BookMyGame and venue operators may flag reviews for moderation if they violate these guidelines',
            'Flagged reviews may be removed at the discretion of the BookMyGame admin team',
        ],
    },
    {
        id: 'intellectual-property',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
        title: 'Intellectual Property',
        content: 'All content on the BookMyGame platform — including the design, layout, code, graphics, and branding — is the intellectual property of BookMyGame and is protected under applicable copyright and trademark laws.',
        list: [
            'You may not copy, reproduce, distribute, or create derivative works based on BookMyGame\'s design or content without written permission',
            'Content you submit (reviews, profile photos) remains your property but you grant us licence to use it on the platform',
            'The BookMyGame name and logo may not be used in any manner that could mislead others or damage our reputation',
        ],
    },
    {
        id: 'liability',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        title: 'Limitation of Liability',
        content: 'To the fullest extent permitted by law, BookMyGame shall not be liable for:',
        list: [
            'Any personal injury, accident, or loss that occurs at a venue booked through the platform',
            'Loss of data, business, or revenue resulting from use of the platform',
            'Disputes between users and venue operators regarding booking quality, cancellations, or conduct',
            'Any indirect, incidental, or consequential damages arising from your use of BookMyGame',
            'Downtime, technical errors, or unavailability of the platform',
        ],
        footer: 'Our total liability to you for any claim arising from your use of BookMyGame shall not exceed the total amount paid by you through the platform in the 30 days preceding the claim.',
    },
    {
        id: 'governing-law',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
        ),
        title: 'Governing Law',
        content: `These Terms & Conditions shall be governed by and construed in accordance with the laws of Nepal. Any disputes arising from or related to your use of BookMyGame shall be subject to the exclusive jurisdiction of the courts of Kathmandu, Nepal.

We encourage you to contact us first to resolve any disputes informally before pursuing legal action.`,
    },
    {
        id: 'changes',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        title: 'Changes to Terms',
        content: `BookMyGame reserves the right to modify these Terms & Conditions at any time. When we make significant changes, we will:`,
        list: [
            'Update the "Last Updated" date at the top of this page',
            'Send a notification to your registered email address',
            'Display a notice on the platform for a reasonable period',
        ],
        footer: 'Your continued use of the platform after changes take effect constitutes your acceptance of the revised Terms. If you do not agree, you must stop using BookMyGame.',
    },
    {
        id: 'contact',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        title: 'Contact Us',
        content: 'For any questions, concerns, or legal enquiries regarding these Terms & Conditions, please get in touch with us:',
        isContact: true,
    },
];

function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-gray-900 via-primary-900 to-gray-800 text-white py-16">
                <div className="container-custom text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm border border-white/20">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                        Terms & Conditions
                    </h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-4">
                        Please read these terms carefully before using BookMyGame. They govern your access to and use of our platform.
                    </p>
                    <span className="inline-block bg-white/10 border border-white/20 text-sm text-gray-300 px-4 py-1.5 rounded-full backdrop-blur-sm">
                        Last Updated: April 2026
                    </span>
                </div>
            </div>

            {/* Content */}
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
                                    <div className="space-y-5">
                                        {section.subsections.map((sub) => (
                                            <div key={sub.title} className="bg-gray-50 rounded-xl p-4">
                                                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide text-primary-700">
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
                                            <p className="font-semibold text-gray-900 mb-1">BookMyGame Legal & Support</p>
                                            <p className="text-sm text-gray-600">injamamulhaque767@gmail.com</p>
                                            <p className="text-sm text-gray-600">Rudra Mati Marg, Kathmandu 44800, Nepal</p>
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

                        {/* Bottom acknowledgement */}
                        <div className="bg-gray-800 text-white rounded-2xl p-6 text-center">
                            <p className="text-gray-300 text-sm">
                                By using BookMyGame, you acknowledge that you have read, understood, and agreed to these Terms & Conditions. For our full Privacy Policy,{' '}
                                <Link to="/privacy" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">
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

export default TermsPage;
