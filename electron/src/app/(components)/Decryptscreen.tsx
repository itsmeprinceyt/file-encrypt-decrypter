import { DecryptScreenProps } from "../../types/Decryptscreen.type";

export default function DecryptScreen({
    inputPath,
    setInputPath,
    outputPath,
    setOutputPath,
    password,
    setPassword,
    setFolderPath,
    setMode,
    setMessage,
}: DecryptScreenProps) {
    const handleBrowse = async () => {
        const file = await window.electronAPI.selectFile();
        if (!file) return;

        if (!file.endsWith(".prince")) {
            alert("Invalid file type. Please select a valid '.prince' encrypted file.");
            return;
        }

        setInputPath(file);
    };

    const handleSaveAs = async () => {
        const path = await window.electronAPI.saveFile(inputPath, "decrypt");
        if (path) setOutputPath(path);
    };

    const handleDecrypt = async () => {
        try {
            await window.electronAPI.decrypt(inputPath, outputPath, password);
            setMessage("Decryption successful!");
            setInputPath("");
            setFolderPath(outputPath);
            setOutputPath("");
            setPassword("");
            setMode("done");
        } catch (err: any) {
            const rawMessage = err.message || "Decryption failed.";
            const cleanedMessage = rawMessage.replace(/^.*Error: /, '');
            alert(cleanedMessage);
        }
    };

    return (
        <main className="p-6 flex flex-col items-center justify-center gap-5 w-full max-w-md">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-4">
                Decrypt File
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
                className="w-full text-red-950 font-extralight cursor-pointer bg-gradient-to-r from-red-100 to-red-200 border border-red-500 shadow-md shadow-red-950/50 px-3 py-2 rounded-md transition-all ease-in-out duration-500 focus:outline-none focus:ring-2 focus:ring-red-600"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />

            <button
                onClick={handleDecrypt}
                disabled={!inputPath || !outputPath || !password}
                className={`w-full font-extralight px-3 py-2 rounded-md transition-all ease-in-out duration-500 focus:outline-none focus:ring-2 focus:ring-red-600
        ${!inputPath || !outputPath || !password
                        ? "text-gray-300 bg-gray-400 border-gray-300 cursor-not-allowed"
                        : "text-red-100 cursor-pointer bg-gradient-to-r from-red-500 to-red-600 border border-red-500 shadow-md shadow-red-950/50"
                    }`}
            >
                🔓 Decrypt
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