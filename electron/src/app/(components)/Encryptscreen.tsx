import { EncryptScreenProps } from "../../types/Encryptscreen.type";

export default function EncryptScreen({
    inputPath,
    setInputPath,
    outputPath,
    setOutputPath,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    setFolderPath,
    setMode,
    setMessage,
}: EncryptScreenProps) {
    const handleBrowse = async () => {
        const file = await window.electronAPI.selectFile();
        if (file) setInputPath(file);
    };

    const handleSaveAs = async () => {
        const path = await window.electronAPI.saveFile(inputPath, "encrypt");
        if (path) setOutputPath(path);
    };

    const handleEncrypt = async () => {
        try {
            await window.electronAPI.encrypt(inputPath, outputPath, password, confirmPassword);
            setMessage("Encryption successful!");
            setInputPath("");
            setFolderPath(outputPath);
            setOutputPath("");
            setPassword("");
            setConfirmPassword("");
            setMode("done");
        } catch (err: any) {
            const rawMessage = err.message || "Encryption failed.";
            const cleanedMessage = rawMessage.replace(/^Error invoking remote method 'encrypt': Error: /, '');
            alert(cleanedMessage);
        }
    };

    const getPasswordStrengthColor = () => {
        if (password.length >= 16) return "bg-lime-500";
        if (password.length >= 8) return "bg-yellow-400";
        if (password.length > 0) return "bg-red-500";
        return "bg-gray-300";
    };

    return (
        <main className="p-6 flex flex-col items-center justify-center gap-5 w-full max-w-md">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-4">
                Encrypt File
            </h2>

            <button
                onClick={handleBrowse}
                className="w-full text-blue-100 font-extralight cursor-pointer bg-gradient-to-r from-blue-900 to-blue-950 border border-blue-500 shadow-md shadow-blue-950/50 px-3 py-2 rounded-md transition-all ease-in-out duration-500"
            >
                Browse File
            </button>
            <p className="text-sm text-gray-300 break-all text-center">{inputPath || "No file selected"}</p>

            <button
                onClick={handleSaveAs}
                className="w-full text-blue-100 font-extralight cursor-pointer bg-gradient-to-r from-blue-900 to-blue-950 border border-blue-500 shadow-md shadow-blue-950/50 px-3 py-2 rounded-md transition-all ease-in-out duration-500"
            >
                Save To
            </button>
            <p className="text-sm text-gray-300 break-all text-center">{outputPath || "No output path selected"}</p>

            <input
                type="password"
                placeholder="Password"
                className="w-full text-lime-950 font-extralight cursor-pointer bg-gradient-to-r from-lime-100 to-lime-200 border border-lime-500 shadow-md shadow-lime-950/50 px-3 py-2 rounded-md transition-all ease-in-out duration-500 focus:outline-none focus:ring-2 focus:ring-lime-600"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />

            <input
                type="password"
                placeholder="Confirm Password"
                className="w-full text-lime-950 font-extralight cursor-pointer bg-gradient-to-r from-lime-100 to-lime-200 border border-lime-500 shadow-md shadow-lime-950/50 px-3 py-2 rounded-md transition-all ease-in-out duration-500 focus:outline-none focus:ring-2 focus:ring-lime-600"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
            />

            <div className="w-full h-6 bg-white shadow-md rounded-full overflow-hidden relative">
                <p className="absolute top-1 left-2 text-xs text-white">Weak</p>
                <p className="absolute top-1 right-2 text-xs text-white">Strong</p>
                <div
                    className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{
                        width: `${Math.min((password.length / 20) * 100, 100)}%`,
                    }}
                ></div>
            </div>

            <button
                onClick={handleEncrypt}
                disabled={!inputPath || !outputPath || password.length < 4}
                className={`w-full text-lime-100 font-extralight px-3 py-2 rounded-md transition-all
                    ease-in-out duration-500 focus:outline-none focus:ring-2 focus:ring-lime-600
                    ${!inputPath || !outputPath || password.length < 4
                        ? "bg-gray-400 border-gray-300 shadow-none cursor-not-allowed"
                        : "cursor-pointer bg-gradient-to-r from-lime-500 to-lime-600 border border-lime-500 shadow-md shadow-lime-950/50"
                    }`}
            >
                🔐 Encrypt
            </button>

            <button
                onClick={() => setMode("home")}
                className="text-sm text-gray-700 hover:scale-105 transition-all mt-2"
            >
                ← Back to Home
            </button>
        </main>
    );

}