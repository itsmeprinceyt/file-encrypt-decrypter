import { ScreenMode } from "./ScreenMode.type";

export type DoneScreenProps = {
    message: string;
    setMode: (mode: ScreenMode) => void;
    setoutputPath: (value: string) => void;
    outputPath: string;
};