import Image from "next/image"
import Logo from '../../assets/logo-png.png';

export default function Loader() {
    return (
        <div className="bg-gradient-to-r from-blue-900 to-blue-950 min-h-screen min-w-screen absolute flex flex-col items-center justify-center text-2xl font-extralight">
            <Image 
            src={Logo}
            width={400}
            height={400}
            alt="Logo"
            />
            <div className="text-blue-100 font-extralight cursor-default border border-l-0 border-r-0 border-blue-500 px-6 py-2 rounded-md hover:scale-105 transition-all ease-in-out duration-500">Let me load bruh ...</div>
        </div>
    )
}