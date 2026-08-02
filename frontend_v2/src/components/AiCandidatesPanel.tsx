import { useEffect, useState } from "react";
import { Sparkles, Check, X, ShieldAlert, RefreshCw, MapPin, Info } from "lucide-react";
import { Map, MapMarker, MarkerContent } from "@/components/ui/map";

const CONFIG = {
  API_BASE_URL: (window as unknown as { CONFIG?: { API_BASE_URL?: string } }).CONFIG?.API_BASE_URL || "https://mapper-backend-brkn.onrender.com",
};

interface Candidate {
  candidate_id: number;
  raw_source_text: string;
  source_url: string | null;
  classified_category: string;
  confidence: number | string;
  suggested_lat: number | string | null;
  suggested_lng: number | string | null;
  suggested_location_text: string | null;
  summary: string | null;
  status: "pending" | "confirmed" | "rejected";
  created_at: string;
}

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

type Phase = "idle" | "fetching-news" | "classifying" | "done";

export default function AiCandidatesPanel() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [minConfidence, setMinConfidence] = useState(0);

  const showToast = (msg: string, type = "") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/ai/candidates?status=pending`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setCandidates(data.candidates);
      } else {
        showToast(data.message || "Failed to load candidates.", "error");
      }
    } catch {
      showToast("Could not connect to server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCandidates(); }, []);

  const triggerIngest = async () => {
    setIngesting(true);
    setPhase("fetching-news");
    // The backend does fetch -> classify -> geocode as one call; we can't
    // observe its internal sub-steps, but this two-stage local timer keeps
    // the "AI is working" state honest without needing a websocket — after
    // a couple of seconds a single request this size is almost always past
    // the fetch stage and into classification.
    const classifyingTimer = setTimeout(() => setPhase("classifying"), 1800);
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/ai/ingest`, { method: "POST", headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        const failures = data.errors?.length || 0;
        if (data.created.length > 0) {
          showToast(`${data.created.length} new candidate(s) classified and awaiting review.`, "success");
        } else if (failures > 0) {
          showToast(`Ingestion ran but every item failed classification — check the AI service is reachable.`, "error");
        } else {
          showToast("No new items found in the news source right now.", "");
        }
        loadCandidates();
      } else {
        showToast(data.message || "Ingestion failed.", "error");
      }
    } catch {
      showToast("Could not connect to server.", "error");
    } finally {
      clearTimeout(classifyingTimer);
      setIngesting(false);
      setPhase("done");
    }
  };

  const confirmCandidate = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/ai/candidates/${id}/confirm`, { method: "POST", headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Confirmed — now a live hazard influencing routing.", "success");
        setCandidates((prev) => prev.filter((c) => c.candidate_id !== id));
      } else {
        showToast(data.message || "Failed to confirm.", "error");
      }
    } catch {
      showToast("Could not connect to server.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const rejectCandidate = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/ai/candidates/${id}/reject`, { method: "POST", headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Rejected — this has no effect on routing.", "");
        setCandidates((prev) => prev.filter((c) => c.candidate_id !== id));
      } else {
        showToast(data.message || "Failed to reject.", "error");
      }
    } catch {
      showToast("Could not connect to server.", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-brand-border rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue-soft text-brand-blue flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-bold text-sm">AI-suggested — requires review before it affects routing</h2>
            <p className="text-xs text-brand-muted mt-1 max-w-xl">
              These candidates were classified by an LLM from public news text. Nothing here reaches the live
              risk database, and no route is ever recalculated, until a human explicitly confirms it below.
            </p>
          </div>
        </div>
        <button
          onClick={triggerIngest}
          disabled={ingesting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-blue-dark disabled:opacity-60 shrink-0"
        >
          {ingesting ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              {phase === "fetching-news" ? "Fetching news…" : "Classifying with AI…"}
            </>
          ) : (
            <>
              <RefreshCw size={14} /> Check for new risks
            </>
          )}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5">
        <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <span className="font-bold">Data privacy:</span> only the public news headline/summary text is sent to the
          classifier — no driver location, account, or personal data ever leaves this system as part of this feature.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">
            Pending review {candidates.length > 0 && `(${candidates.length})`}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="min-confidence" className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
              Min. confidence: {minConfidence}%
            </label>
            <input
              id="min-confidence"
              type="range"
              min={0}
              max={100}
              step={5}
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-32 accent-brand-blue"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-brand-muted">Loading…</p>
        ) : candidates.filter((c) => Number(c.confidence) * 100 >= minConfidence).length === 0 ? (
          <div className="border border-brand-border rounded-2xl p-8 text-center text-sm text-brand-muted bg-white">
            {candidates.length === 0
              ? 'Nothing pending. Click "Check for new risks" to pull and classify recent news.'
              : "No candidates meet that confidence threshold."}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {candidates.filter((c) => Number(c.confidence) * 100 >= minConfidence).map((c) => {
              const confidencePct = Math.round(Number(c.confidence) * 100);
              const hasLocation = c.suggested_lat !== null && c.suggested_lng !== null;
              const lat = hasLocation ? Number(c.suggested_lat) : null;
              const lng = hasLocation ? Number(c.suggested_lng) : null;

              return (
                <div key={c.candidate_id} className="border border-brand-border rounded-2xl bg-white overflow-hidden">
                  {hasLocation ? (
                    <div className="h-36">
                      <Map center={[lng as number, lat as number]} zoom={11}>
                        <MapMarker longitude={lng as number} latitude={lat as number}>
                          <MarkerContent>
                            <div className="bg-brand-blue p-2 rounded-lg shadow-lg border border-white">
                              <MapPin size={14} className="text-white" />
                            </div>
                          </MarkerContent>
                        </MapMarker>
                      </Map>
                    </div>
                  ) : (
                    <div className="h-16 bg-brand-bg flex items-center justify-center gap-2 text-xs text-brand-muted">
                      <ShieldAlert size={14} /> No location resolved — cannot be confirmed
                    </div>
                  )}

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-brand-blue-soft text-brand-blue px-2 py-1 rounded-full capitalize">
                        {c.classified_category.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] font-bold text-brand-muted">{confidencePct}% confidence</span>
                    </div>

                    <p className="text-sm font-semibold leading-snug">{c.summary || c.raw_source_text.slice(0, 140)}</p>
                    {c.suggested_location_text && (
                      <p className="text-xs text-brand-muted">{c.suggested_location_text}</p>
                    )}
                    {c.source_url && (
                      <a href={c.source_url} target="_blank" rel="noreferrer" className="text-xs text-brand-blue hover:underline block truncate">
                        {c.source_url}
                      </a>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => confirmCandidate(c.candidate_id)}
                        disabled={busyId === c.candidate_id || !hasLocation}
                        title={!hasLocation ? "No resolved location — reject instead" : undefined}
                        className="flex-1 h-9 rounded-lg bg-brand-ink text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-brand-blue-dark disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Check size={14} /> Confirm
                      </button>
                      <button
                        onClick={() => rejectCandidate(c.candidate_id)}
                        disabled={busyId === c.candidate_id}
                        className="flex-1 h-9 rounded-lg border border-brand-border text-brand-muted text-xs font-bold flex items-center justify-center gap-1.5 hover:text-red-600 hover:border-red-200 disabled:opacity-40"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-xl z-[999] ${
            toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-brand-ink"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
