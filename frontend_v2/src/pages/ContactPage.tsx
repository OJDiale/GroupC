import React, { useState } from "react";
import { 
  Sparkles, 
  Send, 
  Globe2, 
  Terminal, 
  ArrowLeft, 
  ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import spaceImage from "../assets/space_image.jpg";

export default function ContactPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate pipeline dispatch
    setTimeout(() => {
      setLoading(false);
      setFormSubmitted(true);
    }, 1200);
  };

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
      
      {/* Deep Indigo Ambient Glows EXACTLY */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-16 flex flex-col min-h-screen">
        
        {/* Floating Header Actions */}
        <div className="mb-16 flex items-center justify-between">
          <Button 
            onClick={() => navigate(-1)}
            variant="ghost" 
            className="text-slate-400 hover:text-blue-300 gap-2 text-xs font-bold uppercase tracking-wider bg-slate-900/60 backdrop-blur-2xl px-4 py-2 rounded-xl shadow-2xl border-none"
          >
            <ArrowLeft size={14} /> Escape Interface
          </Button>
          
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-2xl px-3 py-1.5 rounded-xl shadow-2xl border-none">
            <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">COMMS PROTOCOL v1.0.0</span>
          </div>
        </div>

        {/* Magazine Front Matter */}
        <header className="mb-12 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-950/40 px-3 py-1 rounded-full text-blue-300 text-[11px] font-black uppercase tracking-wider border-none">
            <Terminal size={12} /> Live Support Feed
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Signal the Core.<br/>Secure the Line.
          </h1>
          <div className="h-[2px] w-16 bg-gradient-to-r from-blue-500 to-purple-500 mt-6" />
        </header>

        {/* Editorial Multi-Column Comms Grid */}
        <section className="grid md:grid-cols-12 gap-8 items-start mb-16 flex-grow">
          
          {/* Left Column: Premium Interactive Terminal Form */}
          <div className="md:col-span-7 bg-slate-900/30 p-6 md:p-8 rounded-2xl backdrop-blur-md border-none shadow-2xl space-y-6">
            {!formSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Identity / Organization</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter name or agency"
                    className="w-full h-11 px-4 rounded-xl bg-slate-950/60 border-none text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Return Coordinates</label>
                  <input 
                    type="email" 
                    required
                    placeholder="name@domain.com"
                    className="w-full h-11 px-4 rounded-xl bg-slate-950/60 border-none text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Transmission Payload</label>
                  <textarea 
                    rows={5}
                    required
                    placeholder="Detail your system feedback or architectural inquiry..."
                    className="w-full p-4 rounded-xl bg-slate-950/60 border-none text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600 resize-none leading-relaxed"
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-900/20 active:scale-95 transition-all border-none cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? "Dispatching Signal..." : <>Broadcast Transmission <Send size={12} /></>}
                </Button>
              </form>
            ) : (
              <div className="py-12 flex flex-col items-center text-center space-y-4 animate-fadeIn">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">Transmission Logged</h4>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Your packet has bypassed risk validation checkpoints. System engineers will evaluate response variables shortly.
                  </p>
                </div>
                <Button 
                  onClick={() => setFormSubmitted(false)}
                  variant="ghost" 
                  className="text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 bg-transparent border-none"
                >
                  Open New Secure Session
                </Button>
              </div>
            )}
          </div>

          {/* Right Column: Editorial Comms Sidebar Tracker */}
          <aside className="md:col-span-5 space-y-6 bg-slate-900/40 p-6 rounded-2xl backdrop-blur-md border-none shadow-xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">Routing Gateways</h4>
            
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              For direct architectural peer oversight, pipeline contribution access keys, or urgent cryptographic route incident adjustments, tap into our main focal relays.
            </p>

            <div className="h-[1px] w-full bg-slate-900/60 my-2" />

            <ul className="space-y-6">
              <li className="flex gap-3">
                <Globe2 size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-200">Global Registry</h5>
                  <p className="text-xs text-slate-400 select-all font-mono selection:bg-blue-500/30">comms@saferoutemonitor.io</p>
                </div>
              </li>

              <li className="flex gap-3">
                <Terminal size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-200">Core Engine Hub</h5>
                  <p className="text-xs text-slate-400 font-mono">github.com/saferoute/monitor</p>
                </div>
              </li>
            </ul>
          </aside>

        </section>

        {/* Bottom Callout Info Banner */}
        <footer className="mt-auto bg-gradient-to-r from-slate-900 to-blue-950/60 p-6 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-none">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">Need immediate tracking metrics?</h4>
            <p className="text-[11px] text-slate-400 font-medium">Initialize the telemetry matrix grid directly via the core node link.</p>
          </div>
          <Button 
            onClick={() => navigate("/map")}
            className="w-full sm:w-auto h-9 px-5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-900/40 active:scale-95 transition-all border-none cursor-pointer"
          >
            Launch Map Matrix
          </Button>
        </footer>

      </div>
    </main>
  );
}
