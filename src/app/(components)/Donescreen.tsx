import { useState } from "react";
import { DoneScreenProps } from "../../types/Donescreen.type";

export default function DoneScreen({ message, notice, setMode, setoutputPath, outputPath }: DoneScreenProps) {
    const [error, setError] = useState("");

    const handleShowInFolder = async () => {
        if (!outputPath) return;
        setError("");
        try {
            const result = await window.electronAPI.showItemInFolder(outputPath);
            if (!result.ok) setError(result.error || "Could not open that folder.");
        } catch {
            setError("Could not open that folder.");
        }
    };

    return (
        <main className="flex w-full max-w-lg flex-col items-center gap-5 rounded-2xl border border-[#e2e9e6] bg-white p-8 text-center shadow-[0_12px_40px_rgba(18,53,43,0.05)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f4f0] text-xl text-[#147d68]" aria-hidden="true">✓</span>
            <h2 className="text-lg font-semibold">{message}</h2>
            {notice && <p className="rounded-lg border border-[#eadfc9] bg-[#fbf7ef] px-3 py-2 text-sm leading-5 text-[#765b2b]">{notice}</p>}
            <button onClick={handleShowInFolder} className="w-full rounded-lg bg-[#147d68] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f6655]">Show in folder</button>
            {error && <p role="alert" className="w-full rounded-lg border border-[#f0d2ce] bg-[#fff7f5] px-3 py-2 text-sm text-[#9b443b]">{error}</p>}
            <button onClick={() => { setoutputPath(""); setMode("home"); }} className="text-sm text-[#71807b] transition hover:text-[#172321]">Return home</button>
        </main>
    );
}
