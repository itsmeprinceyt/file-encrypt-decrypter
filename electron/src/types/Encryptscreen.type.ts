import { ScreenMode } from "./ScreenMode.type";

export type EncryptScreenProps = {
    inputPath: string;
    setInputPath: (val: string) => void;
    outputPath: string;
    setOutputPath: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    confirmPassword: string;
    setConfirmPassword: (val: string) => void;
    setFolderPath: (val: string) => void;
    setMode: (mode: ScreenMode) => void;
    setMessage: (msg: string) => void;
};