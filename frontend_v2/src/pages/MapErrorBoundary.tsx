import { useRouteError } from "react-router";
import { AlertTriangle } from "lucide-react";
import Logo from "@/components/Logo";

/**
 * Catches any render-time crash inside the /map route tree (e.g. a
 * MapLibre GL race condition like the getLayer-on-undefined-style error
 * this was added for) and shows a recoverable screen instead of React
 * Router's default "Unexpected Application Error!" page. A full reload is
 * the safest recovery here since a MapLibre GL instance that crashed
 * mid-render can't be trusted to resume cleanly in place.
 */
export default function MapErrorBoundary() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error("Map route error:", error);

  return (
    <main className="h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 p-6">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="flex justify-center">
          <Logo size={32} showWordmark={false} ringClassName="text-slate-300" />
        </div>
        <div className="flex justify-center">
          <div className="size-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="text-red-400" size={26} />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold">The map hit a snag</h1>
          <p className="text-sm text-slate-400 mt-1">
            Something went wrong loading the map. This is usually temporary — reloading the page fixes it.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
        >
          Reload map
        </button>
        <a href="/" className="block text-sm text-slate-400 hover:text-slate-200 transition-colors">
          Or go back to the homepage
        </a>
      </div>
    </main>
  );
}
