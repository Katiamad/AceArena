export default function Topbar() {
    return (
        <div className="
            h-16
            bg-white/30
            backdrop-blur-md
            shadow-lg
            border-b border-white/20
            flex items-center justify-between
            px-6
        ">
            <h2 className="text-xl font-bold text-gray-800 tracking-wide drop-shadow-sm">
                🎾 AceArena — Ton club, ton jeu, ton rythme
            </h2>

            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700 font-medium">
                    Admin
                </span>

                <div className="
                    w-10 h-10
                    rounded-full
                    bg-gradient-to-br from-green-500 to-yellow-400
                    flex items-center justify-center
                    text-white font-bold
                    shadow-md
                ">
                    A
                </div>
            </div>
        </div>
    );
}
