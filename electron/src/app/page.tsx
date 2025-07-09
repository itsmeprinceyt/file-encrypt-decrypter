"use client";

import { useEffect, useState } from "react";
import HomeScreen from "./(components)/Homescreen";
import EncryptScreen from "./(components)/Encryptscreen";
import DecryptScreen from "./(components)/Decryptscreen";
import DoneScreen from "./(components)/Donescreen";
import Side from "./(components)/Side";
import { ScreenMode } from "../types/ScreenMode.type";

export default function Home() {
  const [mode, setMode] = useState<ScreenMode>("home");
  const [inputPath, setInputPath] = useState<string>("");
  const [outputPath, setOutputPath] = useState<string>("");
  const [folderPath, setFolderPath] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    window.electronAPI?.onShortcutNavigate?.((_event: any, newMode: ScreenMode) => {
      setMode(newMode);
    });
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
    folderPath,
    setFolderPath,
    setMode,
    setMessage,
  };

  const renderScreen = () => {
    switch (mode) {
      case "home":
        return <HomeScreen setMode={setMode} />;
      case "encrypt":
        return <EncryptScreen {...commonProps} />;
      case "decrypt":
        return <DecryptScreen {...commonProps} />;
      case "done":
        return <DoneScreen message={message} setMode={setMode} setoutputPath={setFolderPath} outputPath={folderPath} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen">
      <div className="w-full md:w-1/2 border-r p-4 min-h-screen flex items-center justify-center bg-gradient-to-t from-blue-900 to-blue-950">
        <Side />
      </div>
      <div className="w-full md:w-1/2 p-4 min-h-screen flex items-center justify-center">
        {renderScreen()}
      </div>
    </div>
  );
}