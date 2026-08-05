import React from "react";
import { 
  Sparkles, 
  ShieldAlert, 
  Compass, 
  Cpu, 
  Globe2, 
  ArrowLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import spaceImage from "../assets/space_image.jpg";
import t from "../assets/tshiamo.jpg";


export default function AboutPage(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <main className="relative h-screen w-full overflow-y-auto overflow-x-hidden font-sans antialiased text-slate-100 bg-slate-950">
      
      {/* Background Layer matching Map Space theme EXACTLY */}
      <div 
        style={{ 
          backgroundImage: `url(${spaceImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
        className="absolute inset-0 z-0 opacity-25 mix-blend-lighten pointer-events-none"
      />
      
      {/* Deep Indigo Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-16 flex flex-col min-h-screen">
        
        {/* Floating Header Actions */}
        <div className="mb-16 flex items-center justify-between">
          <Button 
            onClick={() => navigate(-1)}
            variant="ghost" 
            className="text-slate-400 hover:text-indigo-300 gap-2 text-xs font-bold uppercase tracking-wider bg-slate-900/60 backdrop-blur-2xl px-4 py-2 rounded-xl shadow-2xl border-none"
          >
            <ArrowLeft size={14} /> Back to System
          </Button>
          
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-2xl px-3 py-1.5 rounded-xl shadow-2xl border-none">
            <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Core OS v1.0.4</span>
          </div>
        </div>

        {/* Magazine Front Matter */}
        <header className="mb-12 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-indigo-950/40 px-3 py-1 rounded-full text-indigo-300 text-[11px] font-black uppercase tracking-wider border-none">
            <Cpu size={12} /> Neural Network Navigation
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Intelligent Transit.<br/>Guaranteed Safety.
          </h1>
          <div className="h-[2px] w-16 bg-gradient-to-r from-indigo-500 to-purple-500 mt-6" />
        </header>

        
        <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden bg-slate-900/50 backdrop-blur-md shadow-2xl border-none mb-12">
          <img
            className="w-full h-full object-cover grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-700 ease-in-out"
            src={t}
            alt="Intelligent navigation mapping display interface"
          />
        </div>

        {/* Editorial Multi-Column Grid */}
        <section className="grid md:grid-cols-12 gap-8 items-start mb-16">
          
          {/* Main Investigative Body Essay */}
          <div className="md:col-span-8 space-y-6 text-sm md:text-base text-slate-300 leading-relaxed font-normal">
            <p>
              <span className="float-left text-5xl md:text-6xl font-black text-indigo-400 mr-3 mt-1 leading-none">W</span>
              elcome to the threshold of defensive commuting. This platform analyzes real-time geospatial pipelines, historic accident clusters, and live user crowdsourced threat parameters to render hazard-free, AI-optimized routing layers. Standard GPS pushes you through traffic; our architecture maps terrain and environment dynamically.
            </p>
            
            <p>
              Commuting forces drivers into an unpredictable matrix of regional infrastructure failures, dynamic blindspots, and persistent accident corridors. This engine systematically scans physical routes as live threat fields to filter out active variables, treating structural protection as the single core metric rather than flat temporal measurements.
            </p>

            <blockquote className="my-8 pl-6 border-l-4 border-indigo-500/50 text-base md:text-lg font-bold text-slate-100 italic">
              "Standard routing models rely almost exclusively on historical averages; true geospatial defense demands live, active threat mitigation."
            </blockquote>
          </div>

          {/* Editorial Technical Sidebar Tracker */}
          <aside className="md:col-span-4 space-y-6 bg-slate-900/40 p-6 rounded-2xl backdrop-blur-md border-none shadow-xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">System Directives</h4>
            
            <ul className="space-y-6">
              <li className="flex gap-3">
                <Compass size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-200">Dynamic Routing</h5>
                  <p className="text-[11px] text-slate-400 leading-normal">Allows seamless toggles between standard, detailed, and immersive 3D globe models.</p>
                </div>
              </li>

              <li className="flex gap-3">
                <ShieldAlert size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-200">Threat Mitigation</h5>
                  <p className="text-[11px] text-slate-400 leading-normal">Instantly broadcast hazardous signals or evaluate route segments for real-time risk barriers.</p>
                </div>
              </li>

              <li className="flex gap-3">
                <Globe2 size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-200">Geoapify Powered</h5>
                  <p className="text-[11px] text-slate-400 leading-normal">Hyper-precise autocomplete token lookups feed live positional nodes smoothly.</p>
                </div>
              </li>
            </ul>
          </aside>

        </section>

        {/* Bottom Callout Info Banner */}
        <footer className="mt-auto bg-gradient-to-r from-slate-900 to-indigo-950/60 p-6 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-none">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">Ready to initiate scan?</h4>
            <p className="text-[11px] text-slate-400 font-medium">Head back to the control panel to define coordinates.</p>
          </div>
          <Button 
            onClick={() => navigate("/map")}
            className="w-full sm:w-auto h-9 px-5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-900/40 active:scale-95 transition-all border-none cursor-pointer"
          >
            Launch Map Matrix
          </Button>
        </footer>

      </div>
    </main>
  );
}
