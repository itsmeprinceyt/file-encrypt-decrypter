import { ScreenMode } from "./ScreenMode.type";

export type DecryptScreenProps = {
    inputPath: string;
    setInputPath: (val: string) => void;
    outputPath: string;
    setOutputPath: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    setFolderPath: (val: string) => void;
    setMode: (mode: ScreenMode) => void;
    setMessage: (msg: string) => void;
};