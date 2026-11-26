import { ScreenMode } from "../../types/ScreenMode.type";

export default function HomeScreen({ setMode }: { setMode: (mode: ScreenMode) => void }) {
    return (
        <section className="w-full max-w-2xl">
            <p className="mb-8 text-center text-sm text-[#71807b]">Protect a file with a passphrase and a separate recovery key.</p>
            <div className="grid gap-4 sm:grid-cols-2">
                <button onClick={() => setMode("encrypt")} className="group rounded-2xl border border-[#e2e9e6] bg-white p-6 text-left transition hover:border-[#147d68] hover:shadow-[0_12px_32px_rgba(18,53,43,0.07)]">
                    <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f4f0] text-[#147d68]" aria-hidden="true">↑</span>
                    <span className="block text-base font-semibold">Encrypt a file</span>
                    <span className="mt-1 block text-sm leading-6 text-[#71807b]">Create a protected .prince file with two-factor recovery.</span>
                </button>
                <button onClick={() => setMode("decrypt")} className="group rounded-2xl border border-[#e2e9e6] bg-white p-6 text-left transition hover:border-[#147d68] hover:shadow-[0_12px_32px_rgba(18,53,43,0.07)]">
                    <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef1ef] text-[#53645e]" aria-hidden="true">↓</span>
                    <span className="block text-base font-semibold">Decrypt a file</span>
                    <span className="mt-1 block text-sm leading-6 text-[#71807b]">Restore a file using its passphrase and recovery key.</span>
                </button>
            </div>
            <p className="mt-6 text-center text-xs text-[#899590]">No accounts. No uploads. Encryption happens on your device.</p>
        </section>
    );
}