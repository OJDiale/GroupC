import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MoveLeft, CornerDownLeft } from "lucide-react";
import spaceImage from "../assets/space_image.jpg";

export default function NotFoundPage(): React.JSX.Element {
    const navigate = useNavigate();
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

    // Track mouse movement to create a dynamic "flashlight / look-around" effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setCursorPos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div className="relative min-h-screen bg-[#020202] text-slate-400 font-sans flex items-center justify-center overflow-hidden p-6 select-none">
            
            {/* DYNAMIC BACKGROUND MASK (The Flashlight Effect) */}
            <div 
                className="absolute inset-0 pointer-events-none z-10 hidden md:block transition-opacity duration-300"
                style={{
                    background: `radial-gradient(circle 250px at ${cursorPos.x}px ${cursorPos.y}px, transparent 10%, rgba(5, 5, 5, 0.98) 100%)`
                }}
            />

            {/* STATIC LOW-LIGHT OVERLAY FOR MOBILE */}
            <div className="absolute inset-0 bg-black/80 md:hidden z-10 pointer-events-none" />

            {/* UNDERLYING HIGH-RISK ENVIRONMENT */}
            <div className="absolute inset-0 z-0 opacity-20 filter grayscale contrast-150">
                <img 
                    src={spaceImage} 
                    alt="Space Background" 
                    className="w-full h-full object-cover scale-110" 
                />
            </div>

            {/* GRID GRAPHIC PAPER BACKGROUND */}
            <div 
                className="absolute inset-0 opacity-[0.02] z-0 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* MINIMALIST STARK TYPOGRAPHY */}
            <div className="relative z-20 max-w-4xl w-full text-center space-y-8 sm:space-y-16">

                {/* Giant Experimental 404 Canvas */}
                <div className="relative inline-block">
                    <h1 className="text-7xl sm:text-9xl md:text-[16rem] lg:text-[22rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/40 to-transparent leading-none select-none opacity-90">
                        404
                    </h1>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent bottom-0 h-1/3 w-full" />
                </div>

                {/* Plain, Contextual Error Communication */}
                <div className="space-y-4 max-w-lg mx-auto -mt-4 sm:-mt-12 md:-mt-24">
                    <span className="text-blue-500 font-mono text-xs tracking-[0.25em] uppercase block">
                        [ Error Code: Route Unresolved ]
                    </span>
                    <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white">
                        Page Not Found.
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-light">
                        The requested URL does not point to an active segment of our road network maps or commuter system.
                    </p>
                </div>

                {/* Functional Minimalist Navigation */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                    >
                        <MoveLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                        Back to safety
                    </button>

                    <div className="hidden sm:block h-4 w-[1px] bg-white/10" />

                    <button 
                        onClick={() => navigate("/")}
                        className="group flex items-center gap-3 text-xs font-bold uppercase tracking-widest px-6 py-3 bg-white text-black rounded-full hover:bg-slate-200 transition-all shadow-xl shadow-white/5"
                    >
                        Recalibrate Paths
                        <CornerDownLeft size={12} className="opacity-60 transition-transform group-hover:scale-110" />
                    </button>
                </div>

            </div>

            {/* FLOATING SUBTLE BOUNDARY LABELS */}
            <div className="absolute top-8 left-8 font-mono text-[10px] text-slate-600 uppercase tracking-widest pointer-events-none hidden md:block">
                SYS_STATUS // DETACHED_NODES
            </div>
            <div className="absolute bottom-8 right-8 font-mono text-[10px] text-slate-600 uppercase tracking-widest pointer-events-none hidden md:block">
                REF_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </div>
        </div>
    );
}
