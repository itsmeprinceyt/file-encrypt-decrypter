"use client";

import { useState } from "react";

export default function Home() {
  const [mode, setMode] = useState<"home" | "encrypt" | "decrypt" | "done">("home");
  const [inputPath, setInputPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleBrowse = async () => {
    const file = await window.electronAPI.selectFile();
    if (file) setInputPath(file);
  };

  const handleSaveAs = async () => {
    const path = await window.electronAPI.saveFile(inputPath, mode);
    if (path) setOutputPath(path);
  };


  const handleEncrypt = async () => {
    try {
      await window.electronAPI.encrypt(inputPath, outputPath, password, confirmPassword);
      setMessage("✅ Encrypted successfully!");
      setInputPath("");
      setOutputPath("");
      setMode("done");
    } catch (err: any) {
      alert(err.message || "Encryption failed.");
    }
  };

  const handleDecrypt = async () => {
    try {
      await window.electronAPI.decrypt(inputPath, outputPath, password);
      setMessage("✅ Decrypted successfully!");
      setInputPath("");
      setOutputPath("");
      setMode("done");
    } catch {
      alert("Decryption failed.");
    }
  };

  if (mode === "home") {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-xl font-bold">🛡️ Prince's Encryptor</h1>
        <button onClick={() => setMode("encrypt")} className="btn">Encrypt</button>
        <button onClick={() => setMode("decrypt")} className="btn">Decrypt</button>
      </main>
    );
  }

  if (mode === "encrypt" || mode === "decrypt") {
    return (
      <main className="p-6 space-y-4">
        <h2 className="text-lg font-bold">{mode === "encrypt" ? "Encrypt File" : "Decrypt File"}</h2>
        <button onClick={handleBrowse} className="btn">Browse File</button>
        <p>{inputPath}</p>
        <button onClick={handleSaveAs} className="btn">Save As</button>
        <p>{outputPath}</p>
        <input type="password" placeholder="Password" className="input" value={password} onChange={e => setPassword(e.target.value)} />
        {mode === "encrypt" && (
          <input type="password" placeholder="Confirm Password" className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        )}
        <button
          onClick={mode === "encrypt" ? handleEncrypt : handleDecrypt}
          className="btn bg-green-600 text-white"
        >
          {mode === "encrypt" ? "Encrypt" : "Decrypt"}
        </button>
        <button onClick={() => setMode("home")} className="btn text-sm text-gray-500">← Back</button>
      </main>
    );
  }

  if (mode === "done") {
    return (
      <main className="p-6 space-y-4">
        <p className="text-green-500 font-medium">{message}</p>
        <button onClick={() => setMode("home")} className="btn">Back to Home</button>
      </main>
    );
  }

  return null;
}
