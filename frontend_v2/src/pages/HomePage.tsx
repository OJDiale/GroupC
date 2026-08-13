import React from "react"
import { ShieldCheck, MapPin, Compass, Route, ShieldAlert, Globe2 } from 'lucide-react';
import { useNavigate } from "react-router";
import AuthHeroGraphic from "../components/auth/AuthHeroGraphic";
import { usePageTitle } from "@/lib/usePageTitle";

const FEATURES = [
    {
        icon: ShieldCheck,
        title: "Safety Analysis",
        description: "High-risk zone detection using localized incident history.",
    },
    {
        icon: MapPin,
        title: "Smart Routing",
        description: "Path optimization that avoids hazards nearest to your current location.",
    },
    {
        icon: Route,
        title: "Dynamic Routing",
        description: "Allows seamless toggles between standard, detailed, and immersive 3D globe models.",
    },
    {
        icon: ShieldAlert,
        title: "Threat Mitigation",
        description: "Instantly broadcast hazardous signals or evaluate route segments for real-time risk barriers.",
    },
    {
        icon: Globe2,
        title: "Geoapify Powered",
        description: "Hyper-precise autocomplete token lookups feed live positional nodes smoothly.",
    },
];

export default function HomePage(): React.JSX.Element {
    usePageTitle("Home");
    const navigate = useNavigate()

    return (
        <div className="flex flex-col w-full bg-brand-bg text-brand-ink font-sans">

            {/* HERO SECTION */}
            <section className="relative w-full px-6 md:px-12 pt-16 pb-20 overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6 text-center lg:text-left">
                        <span className="text-brand-blue text-sm font-bold uppercase tracking-wide">Welcome to Mapper</span>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
                            Safe Routing.<br />Stress-free travel.
                        </h1>
                        <p className="text-brand-muted text-base md:text-lg max-w-md mx-auto lg:mx-0">
                            Give yourself ease of mind and experience safe and efficient by making use of our
                            rerouting algorithm.
                        </p>
                        <div className="pt-2">
                            <button
                                onClick={() => navigate("/map")}
                                className="group inline-flex items-center gap-2 px-7 py-3.5 border-4 border-[#15175b] bg-gradient-to-r from-auth-navy to-auth-teal text-white text-sm font-bold rounded-full transition-all hover:bg-none hover:bg-white hover:text-[#15175b] hover:scale-[1.02]"
                            >
                                <Compass size={16} className="transition-transform group-hover:rotate-45" />
                                Map Explorer
                            </button>
                        </div>
                    </div>

                    <AuthHeroGraphic
                        className="w-72 h-72 md:w-96 md:h-96 mx-auto"
                        phoneClassName="w-44 md:w-56"
                    />
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section className="py-20 px-6 max-w-7xl mx-auto w-full">
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                    {FEATURES.map((feature) => (
                        <div
                            key={feature.title}
                            className="group flex items-center justify-center gap-0 hover:justify-start hover:gap-4 w-20 h-20 sm:w-24 sm:h-24 hover:w-72 sm:hover:w-80 hover:px-6 bg-white rounded-2xl border border-brand-border shadow-sm cursor-pointer overflow-hidden transition-all duration-500 ease-in-out hover:border-brand-blue/40"
                        >
                            <feature.icon className="text-brand-blue shrink-0" size={24} />
                            <div className="max-w-0 max-h-0 opacity-0 group-hover:max-w-xs group-hover:max-h-40 group-hover:opacity-100 overflow-hidden transition-all duration-500 ease-in-out">
                                <h4 className="text-lg font-bold whitespace-nowrap">{feature.title}</h4>
                                <p className="text-xs leading-relaxed text-brand-muted mt-1 whitespace-normal">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
