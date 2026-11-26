const IPC_ERROR_PREFIX = /^Error invoking remote method '[^']+': (?:Error: )?/;

export function toErrorMessage(error: unknown): string {
    const raw =
        error instanceof Error
            ? error.message
            : typeof error === "string"
                ? error
                : "";
    const cleaned = raw.replace(IPC_ERROR_PREFIX, "").trim();
    return cleaned || "Something went wrong. Please try again.";
}
