import { useEffect, useState } from "react";
import { DecryptScreenProps } from "../../types/Decryptscreen.type";
import { toErrorMessage } from "../../lib/ipcError";

const LEGACY_REENCRYPT_NOTICE = "This file uses the older format. Consider decrypting it and encrypting it again with a passphrase and a Recovery Key.";

export default function DecryptScreen({
    inputPath, setInputPath, outputPath, setOutputPath, password, setPassword,
    setFolderPath, setMode, setMessage, setNotice,
}: DecryptScreenProps) {
    const [formatVersion, setFormatVersion] = useState<1 | 2 | null>(null);
    const [recoveryKey, setRecoveryKey] = useState("");
    const [recoveryKeyValid, setRecoveryKeyValid] = useState<boolean | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => window.electronAPI?.onProgress?.(({ processed, total }) => {
        setProgress(total > 0 ? Math.min(processed / total, 1) : 0);
    }), []);

    const isLegacy = formatVersion === 1;
    useEffect(() => {
        if (!recoveryKey) return;
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const valid = await window.electronAPI.validateRecoveryKey(recoveryKey);
                if (!cancelled) setRecoveryKeyValid(valid);
            } catch {
                if (!cancelled) setRecoveryKeyValid(false);
            }
        }, 250);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [recoveryKey]);

    const canDecrypt = Boolean(inputPath && outputPath && !busy && (isLegacy ? password : password && recoveryKey && recoveryKeyValid === true));
    const fieldClass = "w-full rounded-lg border border-[#dce5e1] bg-white px-3.5 py-2.5 text-sm text-[#172321] placeholder:text-[#899590]";
    const quietButton = "w-full rounded-lg border border-[#dce5e1] bg-white px-4 py-2.5 text-left text-sm font-medium text-[#263b35] transition hover:bg-[#f6f9f7]";

    const handleBrowse = async () => {
        setError("");
        const file = await window.electronAPI.selectFile("decrypt");
        if (!file) return;
        if (!file.toLowerCase().endsWith(".prince")) {
            setError("Choose a valid .prince encrypted file.");
            return;
        }
        try {
            const info = await window.electronAPI.inspectFile(file);
            setInputPath(file);
            setFormatVersion(info.version);
            setRecoveryKey("");
            setRecoveryKeyValid(null);
        } catch (err) {
            setError(toErrorMessage(err));
        }
    };

    const handleSaveAs = async () => {
        const selected = await window.electronAPI.saveFile(inputPath, "decrypt");
        if (selected) setOutputPath(selected);
    };

    const handleDecrypt = async () => {
        setError("");
        setBusy(true);
        setProgress(0);
        try {
            const result = isLegacy
                ? await window.electronAPI.decrypt({ inputPath, outputPath, password })
                : await window.electronAPI.decrypt({ inputPath, outputPath, passphrase: password, recoveryKey });
            setMessage("Your file is decrypted.");
            setNotice(result.legacy ? LEGACY_REENCRYPT_NOTICE : "");
            setInputPath("");
            setFolderPath(outputPath);
            setOutputPath("");
            setPassword("");
            setRecoveryKey("");
            setRecoveryKeyValid(null);
            setFormatVersion(null);
            setMode("done");
        } catch (err) {
            setProgress(0);
            setError(toErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-[#e2e9e6] bg-white p-6 shadow-[0_12px_40px_rgba(18,53,43,0.05)] sm:p-8">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">Decrypt a file</h2>
                <p className="mt-1 text-sm text-[#71807b]">Select a .prince file and enter its recovery details.</p>
            </div>
            <section className="space-y-2">
                <button onClick={handleBrowse} className={quietButton}>Choose .prince file</button>
                <p className="break-all text-xs text-[#71807b]">{inputPath || "No file selected"}</p>
                <button onClick={handleSaveAs} disabled={!inputPath} className={`${quietButton} disabled:cursor-not-allowed disabled:opacity-50`}>Choose save location</button>
                <p className="break-all text-xs text-[#71807b]">{outputPath || "Output location not selected"}</p>
            </section>
            {isLegacy && <p className="rounded-lg border border-[#eadfc9] bg-[#fbf7ef] px-3 py-2 text-xs leading-5 text-[#765b2b]">Older file format detected. Enter the original password used to encrypt this file.</p>}
            <section className="space-y-3">
                <label className="block text-xs font-medium text-[#53645e]" htmlFor="decrypt-passphrase">{isLegacy ? "Original password" : "Passphrase"}</label>
                <input id="decrypt-passphrase" type="password" autoComplete="current-password" placeholder={isLegacy ? "Enter original password" : "Enter passphrase"} className={fieldClass} value={password} onChange={e => setPassword(e.target.value)} />
                {!isLegacy && <>
                    <label className="block text-xs font-medium text-[#53645e]" htmlFor="decrypt-recovery-key">Recovery key</label>
                    <input id="decrypt-recovery-key" type="text" placeholder="XXXX-XXXX-…" spellCheck={false} autoComplete="off" className={`${fieldClass} font-mono text-xs`} value={recoveryKey} onChange={e => { setRecoveryKey(e.target.value); setRecoveryKeyValid(null); }} />
                    {recoveryKey.length > 0 && recoveryKeyValid === false && <p className="text-xs text-[#9b443b]">Recovery key checksum does not match.</p>}
                    {recoveryKey.length > 0 && recoveryKeyValid === true && <p className="text-xs text-[#147d68]">Recovery key verified.</p>}
                </>}
            </section>
            {error && <p role="alert" className="rounded-lg border border-[#f0d2ce] bg-[#fff7f5] px-3 py-2 text-sm text-[#9b443b]">{error}</p>}
            {busy && <div><div className="h-1.5 w-full overflow-hidden rounded-full bg-[#edf1ef]"><div className="h-full bg-[#147d68] transition-all" style={{ width: `${Math.round(progress * 100)}%` }} /></div><p className="mt-1 text-right text-xs text-[#71807b]">{Math.round(progress * 100)}%</p></div>}
            <button onClick={handleDecrypt} disabled={!canDecrypt} className="w-full rounded-lg bg-[#147d68] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f6655] disabled:cursor-not-allowed disabled:bg-[#edf1ef] disabled:text-[#899590]">{busy ? "Decrypting…" : "Decrypt file"}</button>
            <button onClick={() => setMode("home")} className="self-center text-sm text-[#71807b] transition hover:text-[#172321]">Cancel</button>
        </main>
    );
}
