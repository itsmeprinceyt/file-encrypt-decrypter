import Image from 'next/image';
import Tick from '../../assets/tick.png';
import { DoneScreenProps } from "../../types/Donescreen.type";

export default function DoneScreen({
    message,
    setMode,
    setoutputPath,
    outputPath,
}: DoneScreenProps) {
    const handleShowInFolder = () => {
        if (outputPath) {
            window.electronAPI.showItemInFolder(outputPath);
        }
    };

    return (
        <main className="p-6 space-y-4 flex flex-col items-center justify-center gap-5">
            <div className="text-3xl font-bold bg-gradient-to-r from-lime-600 to-green-700 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <Image
                    src={Tick}
                    width={30}
                    height={30}
                    alt="tick"
                />
                {message}</div>
            <button
                onClick={handleShowInFolder}
                className="text-blue-100 font-extralight cursor-pointer bg-gradient-to-r from-blue-900 to-blue-950 border border-blue-500 shadow-md shadow-blue-950/50 px-3 py-2 rounded-md transition-all ease-in-out duration-500 hover:scale-105"
            >
                📂 Show in Folder
            </button>

            <button
                onClick={() => {
                    setoutputPath("");
                    setMode("home");
                }}
                className="text-sm text-gray-700 hover:scale-105 transition-all mt-2"
            >
                ← Back to Home
            </button>

        </main>
    );
}