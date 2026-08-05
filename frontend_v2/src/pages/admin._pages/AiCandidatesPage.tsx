import React, { useEffect, useState } from 'react';
import { Sparkles, Check, X, ShieldAlert, RefreshCw, MapPin, ArrowLeft, Info } from 'lucide-react';
import { Map, MapMarker, MarkerContent } from '@/components/ui/map';
import { API_BASE_URL } from '@/lib/apiConfig';
import { usePageTitle } from '@/lib/usePageTitle';

/**
 * BACKEND ENDPOINTS — ai.routes.js (authenticateToken, adminWare)
 * POST /api/ai/ingest                     -> { success, created, errors }
 * GET  /api/ai/candidates?status=pending  -> { success, candidates }
 * POST /api/ai/candidates/:id/confirm     -> { success, hazardId }
 * POST /api/ai/candidates/:id/reject      -> { success }
 */

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
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

const API = `${API_BASE_URL}/api/ai`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

type Phase = 'idle' | 'fetching-news' | 'classifying' | 'done';

export default function AiCandidatesPage() {
  usePageTitle('Live Risk Intelligence');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const showToast = (msg: string, type = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/candidates?status=pending`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setCandidates(data.candidates);
      } else {
        showToast(data.message || 'Failed to load candidates.', 'error');
      }
    } catch (e) {
      showToast('Could not connect to server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const triggerIngest = async () => {
    setIngesting(true);
    setPhase('fetching-news');
    const classifyingTimer = setTimeout(() => setPhase('classifying'), 1800);
    try {
      const res = await fetch(`${API}/ingest`, { method: 'POST', headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        const failures = data.errors?.length || 0;
        if (data.created.length > 0) {
          showToast(`${data.created.length} new candidate(s) classified and awaiting review.`, 'success');
        } else if (failures > 0) {
          showToast('Ingestion ran but every item failed classification — check the AI service is reachable.', 'error');
        } else {
          showToast('No new items found in the news source right now.', '');
        }
        loadCandidates();
      } else {
        showToast(data.message || 'Ingestion failed.', 'error');
      }
    } catch (e) {
      showToast('Could not connect to server.', 'error');
    } finally {
      clearTimeout(classifyingTimer);
      setIngesting(false);
      setPhase('done');
    }
  };

  const confirmCandidate = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`${API}/candidates/${id}/confirm`, { method: 'POST', headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Confirmed — now a live hazard influencing routing.', 'success');
        setCandidates((prev) => prev.filter((c) => c.candidate_id !== id));
      } else {
        showToast(data.message || 'Failed to confirm.', 'error');
      }
    } catch (e) {
      showToast('Could not connect to server.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const rejectCandidate = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`${API}/candidates/${id}/reject`, { method: 'POST', headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Rejected — this has no effect on routing.', '');
        setCandidates((prev) => prev.filter((c) => c.candidate_id !== id));
      } else {
        showToast(data.message || 'Failed to reject.', 'error');
      }
    } catch (e) {
      showToast('Could not connect to server.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] font-['Roboto',sans-serif] text-white overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('background-image.jpeg')`,
          filter: 'brightness(0.52) saturate(0.8)',
        }}
      />

      <div className="relative z-10 p-9 max-w-[1200px] mx-auto">
        <h1 className="font-['Oswald',sans-serif] text-[2.8rem] font-bold uppercase tracking-[2px] mb-1">
          Live Risk Intelligence
        </h1>
        <a
          href="/admin"
          className="inline-block mb-7 text-[#f0c040] text-[0.85rem] font-medium tracking-[1px] no-underline transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft className="inline-block w-4 h-4 mr-1 align-baseline" /> Go Back to Home
        </a>

        <div className="bg-black/45 border border-white/15 p-5 flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-full bg-[#f0c040]/15 text-[#f0c040] flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-['Oswald',sans-serif] text-[0.95rem] font-semibold uppercase tracking-[1px]">
                AI-suggested — requires review before it affects routing
              </h2>
              <p className="text-[0.78rem] text-white/50 mt-1 max-w-xl">
                These candidates were classified by an LLM from public news text. Nothing here reaches the live
                risk database, and no route is ever recalculated, until an admin explicitly confirms it below.
              </p>
            </div>
          </div>
          <button
            onClick={triggerIngest}
            disabled={ingesting}
            className="inline-flex items-center gap-1.5 p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 bg-white/18 text-white hover:bg-white/28 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {ingesting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                {phase === 'fetching-news' ? 'Fetching news…' : 'Classifying with AI…'}
              </>
            ) : (
              <>
                <RefreshCw size={14} /> Check for new risks
              </>
            )}
          </button>
        </div>

        <div className="bg-[#f0c040]/10 border border-[#f0c040]/30 p-4 flex items-start gap-2.5 mb-6">
          <Info size={16} className="text-[#f0c040] shrink-0 mt-0.5" />
          <p className="text-[0.78rem] text-white/70">
            <span className="font-bold text-[#f0c040]">Data privacy:</span> only the public news headline/summary
            text is sent to the classifier — no driver location, account, or personal data ever leaves this system
            as part of this feature.
          </p>
        </div>

        <p className="font-['Oswald',sans-serif] text-[0.78rem] font-bold uppercase tracking-[1px] text-white/50 mb-3">
          Pending review {candidates.length > 0 && `(${candidates.length})`}
        </p>

        {loading ? (
          <p className="text-[0.85rem] text-white/50">Loading…</p>
        ) : candidates.length === 0 ? (
          <div className="border border-white/15 bg-black/35 p-8 text-center text-[0.85rem] text-white/50">
            Nothing pending. Click "Check for new risks" to pull and classify recent news.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {candidates.map((c) => {
              const confidencePct = Math.round(Number(c.confidence) * 100);
              const hasLocation = c.suggested_lat !== null && c.suggested_lng !== null;
              const lat = hasLocation ? Number(c.suggested_lat) : null;
              const lng = hasLocation ? Number(c.suggested_lng) : null;

              return (
                <div key={c.candidate_id} className="border border-white/15 bg-black/35 overflow-hidden">
                  {hasLocation ? (
                    <div className="h-36">
                      <Map center={[lng as number, lat as number]} zoom={11}>
                        <MapMarker longitude={lng as number} latitude={lat as number}>
                          <MarkerContent>
                            <div className="bg-[#f0c040] p-2 rounded-full shadow-lg border border-white">
                              <MapPin size={14} className="text-black" />
                            </div>
                          </MarkerContent>
                        </MapMarker>
                      </Map>
                    </div>
                  ) : (
                    <div className="h-16 bg-black/60 flex items-center justify-center gap-2 text-[0.75rem] text-white/50">
                      <ShieldAlert size={14} /> No location resolved — cannot be confirmed
                    </div>
                  )}

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[0.68rem] font-bold uppercase tracking-wide bg-[#f0c040]/15 text-[#f0c040] px-2 py-1 rounded-full capitalize">
                        {c.classified_category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[0.68rem] font-bold text-white/50">{confidencePct}% confidence</span>
                    </div>

                    <p className="text-[0.88rem] font-semibold leading-snug">
                      {c.summary || c.raw_source_text.slice(0, 140)}
                    </p>
                    {c.suggested_location_text && (
                      <p className="text-[0.78rem] text-white/50">{c.suggested_location_text}</p>
                    )}
                    {c.source_url && (
                      <a
                        href={c.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[0.78rem] text-[#f0c040] hover:underline block truncate"
                      >
                        {c.source_url}
                      </a>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => confirmCandidate(c.candidate_id)}
                        disabled={busyId === c.candidate_id || !hasLocation}
                        title={!hasLocation ? 'No resolved location — reject instead' : undefined}
                        className="flex-1 h-9 bg-[#1a5fa8] text-white text-[0.72rem] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#2272c3] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Check size={14} /> Confirm
                      </button>
                      <button
                        onClick={() => rejectCandidate(c.candidate_id)}
                        disabled={busyId === c.candidate_id}
                        className="flex-1 h-9 border border-white/25 text-white/70 text-[0.72rem] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#cc2222]/40 hover:border-[#cc2222]/70 disabled:opacity-40"
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
          className={`fixed bottom-6 right-6 text-white p-[11px_20px] font-['Oswald'] text-[0.88rem] tracking-[1px] z-[999] transition-all duration-300 ${
            toast.type === 'success' ? 'bg-[#1a7a3a]' : toast.type === 'error' ? 'bg-[#cc2222]' : 'bg-black/80 border border-white/20'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
