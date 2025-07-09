import { ScreenMode } from "../../types/ScreenMode.type";

export default function HomeScreen({ setMode }: { setMode: (mode: ScreenMode) => void }) {
    return (
        <main className="p-6 space-y-4 flex flex-col items-center justify-center gap-5">
            <p className="text-4xl font-bold  bg-gradient-to-r from-blue-900 to-blue-950 bg-clip-text text-transparent">
                Get Started
            </p>

            <button onClick={() => setMode("encrypt")} className="text-lime-100 bg-gradient-to-r from-lime-500 to-lime-600 border border-lime-500 shadow-lg shadow-lime-800/50 px-3 py-2 rounded-md hover:scale-105 transition-all ease-in-out duration-500 w-[150px]">Encrypt</button>
            <button onClick={() => setMode("decrypt")} className="text-red-100 bg-gradient-to-r from-red-500 to-red-600 border border-red-500 shadow-lg shadow-red-800/50 px-3 py-2 rounded-md hover:scale-105 transition-all ease-in-out duration-500 w-[150px]">Decrypt</button>
        </main>
    );
}