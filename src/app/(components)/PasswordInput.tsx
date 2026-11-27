"use client";

import { useState } from "react";

type PasswordInputProps = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoComplete?: string;
    className?: string;
};

function EyeIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M9.9 4.24A10.9 10.9 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-3.1 4.2" />
            <path d="M6.6 6.6A17.6 17.6 0 0 0 2 12s3.5 8 10 8a10.9 10.9 0 0 0 4.4-.9" />
            <path d="m2 2 20 20" />
            <path d="M14.1 14.1a3 3 0 1 1-4.2-4.2" />
        </svg>
    );
}

export default function PasswordInput({
    id,
    value,
    onChange,
    placeholder,
    autoComplete,
    className = "",
}: PasswordInputProps) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <input
                id={id}
                type={visible ? "text" : "password"}
                autoComplete={autoComplete}
                placeholder={placeholder}
                className={className}
                style={{ paddingRight: "2.75rem" }}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <button
                type="button"
                onClick={() => setVisible((current) => !current)}
                aria-label={visible ? "Hide passphrase" : "Show passphrase"}
                aria-pressed={visible}
                title={visible ? "Hide passphrase" : "Show passphrase"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-[#71807b] transition hover:text-[#172321]"
            >
                {visible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
        </div>
    );
}
