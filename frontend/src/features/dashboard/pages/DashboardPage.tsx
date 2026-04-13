export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-neutral-100 p-10">

            <div className="backdrop-blur-md bg-black/40 min-h-screen p-10">

                <h1 className="text-4xl font-extrabold text-white mb-10 text-center drop-shadow-lg">
                    🎾 AceArena Dashboard
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

                    <div className="bg-white/20 backdrop-blur-xl shadow-xl rounded-2xl p-6 border border-white/30">
                        <p className="text-gray-200 text-sm">Total Equipements</p>
                        <p className="text-4xl font-bold text-yellow-300 mt-2">14</p>
                    </div>

                    <div className="bg-white/20 backdrop-blur-xl shadow-xl rounded-2xl p-6 border border-white/30">
                        <p className="text-gray-200 text-sm">Locations Actives</p>
                        <p className="text-4xl font-bold text-green-300 mt-2">5</p>
                    </div>

                    <div className="bg-white/20 backdrop-blur-xl shadow-xl rounded-2xl p-6 border border-white/30">
                        <p className="text-gray-200 text-sm">Matchs Aujourd’hui</p>
                        <p className="text-4xl font-bold text-blue-300 mt-2">3</p>
                    </div>

                </div>
            </div>
        </div>
    );
}
