"use client";
import Image from 'next/image';
import Logo from '../../assets/logo-png.png';

export default function Side() {
    const openExternal = () => {
        window.electronAPI?.openExternal("https://github.com/itsmeprinceyt");
    };

    return (
        <div className="text-center flex flex-col justify-center items-center gap-5">
            <Image
                src={Logo}
                width={500}
                height={500}
                alt="Logo"
                priority
            />
            <p className="font-bold text-4xl text-shadow-2xs text-shadow-blue-100 text-blue-100 antialiased">
                File Encrypter/Decrypter
            </p>
            <p
                onClick={openExternal}
                className="text-xs text-blue-100 font-extralight cursor-default border border-l-0 border-r-0 border-blue-500 px-6 py-2 rounded-md hover:scale-105 transition-all ease-in-out duration-500"
            >
                Made by @itsmeprinceyt
            </p>
        </div>
    );
}
