import mapImage from "../assets/map_image1.png"
import React, { useState } from "react"
import { ChevronsLeft, ChevronsRight, MapPin, ShieldCheck, Zap, Compass } from 'lucide-react';
import { newsItems } from "../lib/utils";
import { type NewsItem } from "../lib/types"
import { useNavigate } from "react-router";
import RouteDiamondMockup from "../components/RouteDiamondMockup";

export default function HomePage(): React.JSX.Element {
    const [currentIndex, setCurrentIndex] = useState<number>(0)
    const navigate = useNavigate()

    const nextItem = () => setCurrentIndex(prev => (prev < newsItems.length - 1 ? prev + 1 : 0))
    const prevItem = () => setCurrentIndex(prev => (prev <= 0 ? newsItems.length - 1 : prev - 1))

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
                            Give yourself ease of mind and travel safely and efficiently by making use of our
                            hazard-aware rerouting algorithm.
                        </p>
                        <div className="pt-2">
                            <button
                                onClick={() => navigate("/map")}
                                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-brand-ink text-white text-sm font-bold rounded-full transition-all hover:bg-brand-blue-dark hover:scale-[1.02]"
                            >
                                <Compass size={16} className="transition-transform group-hover:rotate-45" />
                                Map Explorer
                            </button>
                        </div>
                    </div>

                    <RouteDiamondMockup
                        className="w-72 h-72 md:w-96 md:h-96 mx-auto"
                        phoneClassName="w-44 md:w-56"
                    />
                </div>
            </section>

            {/* TRENDING SECTION */}
            <section className="py-20 px-6 max-w-7xl mx-auto w-full space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-border pb-6">
                    <div>
                        <span className="text-brand-blue text-xs font-bold uppercase tracking-[0.2em]">Real-time Intelligence</span>
                        <h2 className="text-2xl md:text-3xl font-bold mt-2">Trending across the Republic</h2>
                    </div>
                    <p className="text-sm text-brand-muted max-w-xs">Live updates from verified sources and community reports.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Featured News: Large Bento Box */}
                    <div className="lg:col-span-8 relative group h-[420px] rounded-3xl overflow-hidden border border-brand-border bg-white shadow-sm">
                        {newsItems.map((item: NewsItem, index: number) => (
                            <div
                                key={item.id}
                                className={`absolute inset-0 transition-all duration-1000 ${index === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"}`}
                                style={{ backgroundImage: `url(${item.src})`, backgroundSize: "cover", backgroundPosition: "center" }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-10">
                                    <span className="bg-brand-blue text-[10px] font-bold px-3 py-1 rounded-full text-white uppercase mb-4 inline-block w-fit">Flash Report</span>
                                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-200 line-clamp-2 max-w-xl">{item.description}</p>
                                </div>
                            </div>
                        ))}

                        <div className="absolute bottom-10 right-10 flex gap-3 z-20">
                            <button onClick={prevItem} className="p-3 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white transition-all">
                                <ChevronsLeft size={20} />
                            </button>
                            <button onClick={nextItem} className="p-3 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white transition-all">
                                <ChevronsRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Small Bento Box: Features */}
                    <div className="lg:col-span-4 grid grid-rows-2 gap-6">
                        <div className="bg-white p-8 rounded-3xl border border-brand-border shadow-sm flex flex-col justify-center space-y-3 hover:border-brand-blue/40 transition-colors">
                            <ShieldCheck className="text-brand-blue" size={30} />
                            <h4 className="text-lg font-bold">Safety Analysis</h4>
                            <p className="text-xs leading-relaxed text-brand-muted">High-risk zone detection using localized incident history.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl border border-brand-border shadow-sm flex flex-col justify-center space-y-3 hover:border-brand-blue/40 transition-colors">
                            <MapPin className="text-brand-blue" size={30} />
                            <h4 className="text-lg font-bold">Smart Routing</h4>
                            <p className="text-xs leading-relaxed text-brand-muted">Path optimization that avoids hazards nearest to your current location.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ACTION SECTION */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto bg-brand-ink rounded-[3rem] p-12 relative overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-white leading-tight">Join the community protecting <br /><span className="text-brand-blue">South African commuters.</span></h2>
                            <p className="text-sm text-slate-400 max-w-md leading-relaxed">Create an account to personalize your alerts and contribute to the real-time road safety network.</p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <button onClick={() => navigate("/login/signin")} className="px-6 py-2.5 bg-white text-brand-ink text-xs font-bold rounded-full hover:bg-slate-200 transition-colors flex items-center gap-2">
                                    <Zap size={14} /> Create Account
                                </button>
                                <button onClick={() => navigate("/login")} className="px-6 py-2.5 bg-transparent border border-white/20 text-white text-xs font-bold rounded-full hover:bg-white/5 transition-colors">Sign In</button>
                            </div>
                        </div>

                        <div
                            className="relative group cursor-pointer"
                            onClick={() => navigate("/map")}
                        >
                            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-video">
                                <img
                                    src={mapImage}
                                    alt="Map Preview"
                                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-white text-brand-ink px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Enter Map</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
