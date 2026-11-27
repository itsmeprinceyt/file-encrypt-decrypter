const splitPath = (value: string) => value.split(/[\\/]+/).filter(Boolean);

/** Last segment of a path, e.g. `C:\docs\notes.md` -> `notes.md`. */
export function fileName(value: string): string {
    if (!value) return "";
    const parts = splitPath(value);
    return parts[parts.length - 1] || value;
}

/** Name of the folder containing a file path, e.g. `C:\docs\notes.md` -> `docs`. */
export function folderName(value: string): string {
    if (!value) return "";
    const parts = splitPath(value.replace(/[\\/]+$/, ""));
    if (parts.length === 0) return value;
    return parts[parts.length - 2] || parts[parts.length - 1] || value;
}
