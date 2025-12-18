import { useNavigate } from 'react-router-dom';

const sportsData = [
    {
        id: 1,
        name: 'Football',
        icon: '⚽',
        description: 'Football & Futsal Courts',
        venueCount: 250,
        color: 'from-green-400 to-green-600',
    },
    {
        id: 2,
        name: 'Basketball',
        icon: '🏀',
        description: 'Basketball Courts',
        venueCount: 150,
        color: 'from-orange-400 to-orange-600',
    },
    {
        id: 3,
        name: 'Cricket',
        icon: '🏏',
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
