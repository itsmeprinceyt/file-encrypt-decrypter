"use client";

import { useEffect, useState } from "react";
import HomeScreen from "./(components)/Homescreen";
import EncryptScreen from "./(components)/Encryptscreen";
import DecryptScreen from "./(components)/Decryptscreen";
import DoneScreen from "./(components)/Donescreen";
import { ScreenMode } from "../types/ScreenMode.type";

export default function Home() {
  const [mode, setMode] = useState<ScreenMode>("home");
  const [inputPath, setInputPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  const changeMode = (next: ScreenMode) => {
    if (next === "encrypt" || next === "decrypt") setNotice("");
    setMode(next);
  };

  useEffect(() => {
    return window.electronAPI?.onShortcutNavigate?.((_event, next) => changeMode(next));
  }, []);

  const commonProps = {
    inputPath,
    setInputPath,
    outputPath,
    setOutputPath,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    setFolderPath,
    setMode: changeMode,
    setMessage,
    setNotice,
  };

  const titles: Record<ScreenMode, string> = {
    home: "Your files, kept private.",
    encrypt: "Encrypt a file",
    decrypt: "Decrypt a file",
    done: "All done",
  };

  return (
    <div className="min-h-screen bg-[#f5f8f6] px-6 py-7 text-[#172321] sm:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col">
        <main className="flex flex-1 flex-col items-center justify-center py-12">
          {mode === "home" && <p className="mb-7 max-w-md text-center text-3xl font-semibold tracking-tight sm:text-4xl">{titles.home}</p>}
          {mode !== "home" && <p className="mb-7 text-center text-2xl font-semibold tracking-tight">{titles[mode]}</p>}
          {mode === "home" && <HomeScreen setMode={changeMode} />}
          {mode === "encrypt" && <EncryptScreen {...commonProps} />}
          {mode === "decrypt" && <DecryptScreen {...commonProps} />}
          {mode === "done" && <DoneScreen message={message} notice={notice} setMode={changeMode} setoutputPath={setFolderPath} outputPath={folderPath} />}
        </main>

      </div>
    </div>
  );
}
