import { NavLink } from "react-router-dom";

export default function Sidebar() {
    return (
        <div className="w-64 h-screen bg-gradient-to-b from-green-600 to-yellow-500 text-white p-6 shadow-xl flex flex-col">

            <h1 className="text-2xl font-extrabold mb-10 tracking-wide drop-shadow-lg">
                🎾 AceArena
            </h1>

            <nav className="flex flex-col gap-3">
                <NavItem to="/" label="Dashboard" />
                <NavItem to="/equipments" label="Equipements" />
                <NavItem to="/rentals" label="Locations" />
                <NavItem to="/match" label="Matchs" />
                <NavItem to="/bookings" label="Réservations" />
            </nav>
        </div>
    );
}

function NavItem({ to, label }: { to: string; label: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `
                px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${isActive
                    ? "bg-white/30 text-white shadow-inner backdrop-blur-md"
                    : "hover:bg-white/20 hover:backdrop-blur-sm"}
                `
            }
        >
            {label}
        </NavLink>
    );
}
