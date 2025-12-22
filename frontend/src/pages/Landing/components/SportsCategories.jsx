import { useNavigate } from 'react-router-dom';

const sportsData = [
    {
        id: 1,
        name: 'Football',
        icon: <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 13v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>,
        description: 'Football & Futsal Courts',
        venueCount: 250,
        color: 'from-green-400 to-green-600',
    },
    {
        id: 2,
        name: 'Basketball',
        icon: <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM5.23 7.75C6.1 8.62 6.7 9.74 6.91 11H4.07c.15-1.18.57-2.27 1.16-3.25zM4.07 13h2.84c-.21 1.26-.81 2.38-1.68 3.25-.59-.98-1.01-2.07-1.16-3.25zm1.64 4.68c.87-.87 1.47-1.99 1.68-3.25h2.84c-.15 1.18-.57 2.27-1.16 3.25-.59.98-1.36 1.74-2.36 2.09-.37-.58-.69-1.32-.99-2.09h-.01zm6.29.25c-.21-1.26-.81-2.38-1.68-3.25-.59.98-1.01 2.07-1.16 3.25h2.84zm.93-2H11c.21-1.26.81-2.38 1.68-3.25.59.98 1.01 2.07 1.16 3.25h.09zm1.07-4c-.15 1.18-.57 2.27-1.16 3.25-.87-.87-1.47-1.99-1.68-3.25h2.84zm4.93 1h-2.84c.21-1.26.81-2.38 1.68-3.25.59.98 1.01 2.07 1.16 3.25z" /></svg>,
        description: 'Basketball Courts',
        venueCount: 150,
        color: 'from-orange-400 to-orange-600',
    },
    {
        id: 3,
        name: 'Cricket',
        icon: <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M15.04 4.15l-.01.01c-.39-.39-1.03-.39-1.42 0l-1.18 1.18 3.18 3.18 1.18-1.18c.39-.39.39-1.03 0-1.42l-1.75-1.77zm-6.94 6.94l-4.07 6.35c-.26.41-.08.95.37 1.13l1.13.45.45 1.13c.18.45.72.63 1.13.37l6.35-4.07-5.36-5.36z" /></svg>,
        description: 'Cricket Grounds & Nets',
        venueCount: 100,
        color: 'from-blue-400 to-blue-600',
    },
];

function SportsCategories() {
    const navigate = useNavigate();

    const handleSportClick = (sportName) => {
        navigate(`/venues?sport=${sportName.toLowerCase()}`);
    };

    return (
        <section className="py-16 md:py-24 bg-gray-50">
            <div className="container-custom">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-4">
                        Popular Sports Categories
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Choose your favorite sport and discover amazing venues near you
                    </p>
                </div>

                {/* Sports Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {sportsData.map((sport) => (
                        <button
                            key={sport.id}
                            onClick={() => handleSportClick(sport.name)}
                            className="group card hover:-translate-y-2 cursor-pointer text-left"
                        >
                            {/* Icon Container */}
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${sport.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                <span className="text-4xl">{sport.icon}</span>
                            </div>

                            {/* Content */}
                            <h3 className="font-heading font-bold text-2xl text-gray-900 mb-2">
                                {sport.name}
                            </h3>
                            <p className="text-gray-600 mb-4">{sport.description}</p>

                            {/* Venue Count */}
                            <div className="flex items-center text-primary-600 font-medium">
                                <span>{sport.venueCount}+ Venues</span>
                                <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default SportsCategories;
