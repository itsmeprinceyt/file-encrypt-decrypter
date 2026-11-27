import { useEffect, useState } from "react";
import { EncryptScreenProps } from "../../types/Encryptscreen.type";
import { MIN_PASSPHRASE_LENGTH } from "../../constants";
import { toErrorMessage } from "../../lib/ipcError";
import { fileName, folderName } from "../../lib/fileName";
import PasswordInput from "./PasswordInput";

export default function EncryptScreen({
    inputPath, setInputPath, outputPath, setOutputPath, password, setPassword,
    confirmPassword, setConfirmPassword, setFolderPath, setMode, setMessage,
}: EncryptScreenProps) {
    const [recoveryKey, setRecoveryKey] = useState("");
    const [recoveryKeyAccepted, setRecoveryKeyAccepted] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => window.electronAPI?.onProgress?.(({ processed, total }) => {
        setProgress(total > 0 ? Math.min(processed / total, 1) : 0);
    }), []);

    const passphraseReady = password.length >= MIN_PASSPHRASE_LENGTH;
    const passphrasesMatch = confirmPassword.length > 0 && password === confirmPassword;
    const canEncrypt = Boolean(inputPath && outputPath && passphraseReady && passphrasesMatch && recoveryKey && recoveryKeyAccepted) && !busy;

    const handleBrowse = async () => {
        setError("");
        const file = await window.electronAPI.selectFile("encrypt");
        if (file) setInputPath(file);
    };

    const handleSaveAs = async () => {
        const selected = await window.electronAPI.saveFile(inputPath, "encrypt");
        if (selected) setOutputPath(selected);
    };

    const handleGenerateRecoveryKey = async () => {
        setError("");
        setFeedback("");
        try {
            setRecoveryKey(await window.electronAPI.generateRecoveryKey());
            setRecoveryKeyAccepted(false);
        } catch (err) {
            setError(toErrorMessage(err));
        }
    };

    const handleEncrypt = async () => {
        setError("");
        setFeedback("");
        setBusy(true);
        setProgress(0);
        try {
            await window.electronAPI.encrypt({ inputPath, outputPath, passphrase: password, confirmPassphrase: confirmPassword, recoveryKey });
            setMessage("Your file is encrypted.");
            setInputPath("");
            setFolderPath(outputPath);
            setOutputPath("");
            setPassword("");
            setConfirmPassword("");
            setRecoveryKey("");
            setRecoveryKeyAccepted(false);
            setMode("done");
        } catch (err) {
            setProgress(0);
            setError(toErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const fieldClass = "w-full rounded-lg border border-[#dce5e1] bg-white px-3.5 py-2.5 text-sm text-[#172321] placeholder:text-[#899590]";
    const quietButton = "w-full rounded-lg border border-[#dce5e1] bg-white px-4 py-2.5 text-left text-sm font-medium text-[#263b35] transition hover:bg-[#f6f9f7]";
    const chosenFileName = fileName(inputPath);
    const chosenFolderName = folderName(outputPath);

    return (
        <main className="flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-[#e2e9e6] bg-white p-6 shadow-[0_12px_40px_rgba(18,53,43,0.05)] sm:p-8">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">Encrypt a file</h2>
                <p className="mt-1 text-sm text-[#71807b]">Choose a file and set both recovery factors.</p>
            </div>

            <section className="space-y-2">
                <button onClick={handleBrowse} className={quietButton} title={inputPath || undefined}>
                    <span className="block truncate">{chosenFileName || "Choose file"}</span>
                </button>
                <p className="break-all text-xs text-[#71807b]">{inputPath || "No file selected"}</p>
                <button onClick={handleSaveAs} disabled={!inputPath} className={`${quietButton} disabled:cursor-not-allowed disabled:opacity-50`} title={outputPath || undefined}>
                    <span className="block truncate">{chosenFolderName || "Choose save location"}</span>
                </button>
                <p className="break-all text-xs text-[#71807b]">{outputPath || "Output location not selected"}</p>
            </section>

            <section className="space-y-3">
                <label className="block text-xs font-medium text-[#53645e]" htmlFor="encrypt-passphrase">Passphrase</label>
                <PasswordInput id="encrypt-passphrase" autoComplete="new-password" placeholder="At least 12 characters" className={fieldClass} value={password} onChange={setPassword} />
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#edf1ef]">
                    <div className={`h-full transition-all duration-300 ${password.length >= 24 ? "bg-[#147d68]" : password.length >= 16 ? "bg-[#299780]" : password.length >= MIN_PASSPHRASE_LENGTH ? "bg-[#c58a2b]" : password.length ? "bg-[#c65a50]" : "bg-transparent"}`} style={{ width: `${Math.min(password.length / 24 * 100, 100)}%` }} />
                </div>
                <label className="block text-xs font-medium text-[#53645e]" htmlFor="confirm-passphrase">Confirm passphrase</label>
                <PasswordInput id="confirm-passphrase" autoComplete="new-password" placeholder="Enter it again" className={fieldClass} value={confirmPassword} onChange={setConfirmPassword} />
                {password.length > 0 && password.length < MIN_PASSPHRASE_LENGTH && <p className="text-xs text-[#9b443b]">Use at least {MIN_PASSPHRASE_LENGTH} characters.</p>}
                {confirmPassword.length > 0 && password !== confirmPassword && <p className="text-xs text-[#9b443b]">Passphrases do not match.</p>}
            </section>

            <section className="rounded-xl border border-[#e2e9e6] bg-[#f8faf9] p-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-medium">Recovery key</h3>
                        <p className="mt-1 text-xs leading-5 text-[#71807b]">Keep it separate from the encrypted file. You’ll need it to decrypt.</p>
                    </div>
                    <button onClick={handleGenerateRecoveryKey} className="shrink-0 rounded-lg bg-[#147d68] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#0f6655]">Generate</button>
                </div>
                {recoveryKey && (
                    <div className="mt-4 space-y-3">
                        <p className="break-all rounded-lg border border-[#e2e9e6] bg-white p-3 font-mono text-xs leading-5 text-[#172321] select-all">{recoveryKey}</p>
                        <div className="flex items-start gap-2 text-xs leading-5 text-[#765b2b]">
                            <span aria-hidden="true">!</span>
                            <p>Anyone with this key and your passphrase can read the file. Losing the key means the file cannot be recovered.</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={async () => { try { await window.electronAPI.copyRecoveryKey(recoveryKey); setFeedback("Copied. Clipboard clears after 60 seconds."); setError(""); } catch (err) { setError(toErrorMessage(err)); } }} className="flex-1 rounded-lg border border-[#dce5e1] bg-white px-3 py-2 text-sm hover:bg-[#f6f9f7]">Copy key</button>
                            <button onClick={async () => { try { const savedPath = await window.electronAPI.saveRecoveryKey(recoveryKey, inputPath); if (savedPath) setFeedback("Recovery key saved to a .key file."); setError(""); } catch (err) { setError(toErrorMessage(err)); } }} className="flex-1 rounded-lg border border-[#dce5e1] bg-white px-3 py-2 text-sm hover:bg-[#f6f9f7]">Save .key file</button>
                        </div>
                        <label className="flex cursor-pointer items-start gap-2 text-sm text-[#384a44]">
                            <input type="checkbox" checked={recoveryKeyAccepted} onChange={e => setRecoveryKeyAccepted(e.target.checked)} className="mt-0.5 accent-[#147d68]" />
                            I have saved my recovery key
                        </label>
                    </div>
                )}
            </section>

            {feedback && <p className="text-xs text-[#147d68]">{feedback}</p>}
            {error && <p role="alert" className="rounded-lg border border-[#f0d2ce] bg-[#fff7f5] px-3 py-2 text-sm text-[#9b443b]">{error}</p>}
            {busy && <div><div className="h-1.5 w-full overflow-hidden rounded-full bg-[#edf1ef]"><div className="h-full bg-[#147d68] transition-all" style={{ width: `${Math.round(progress * 100)}%` }} /></div><p className="mt-1 text-right text-xs text-[#71807b]">{Math.round(progress * 100)}%</p></div>}
            <button onClick={handleEncrypt} disabled={!canEncrypt} className="w-full rounded-lg bg-[#147d68] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f6655] disabled:cursor-not-allowed disabled:bg-[#edf1ef] disabled:text-[#899590]">{busy ? "Encrypting…" : "Encrypt file"}</button>
            <button onClick={() => setMode("home")} className="self-center text-sm text-[#71807b] transition hover:text-[#172321]">Cancel</button>
        </main>
    );
}
