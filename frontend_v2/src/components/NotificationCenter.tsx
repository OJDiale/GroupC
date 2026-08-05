import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";

const CONFIG = {
  API_BASE_URL,
};

interface Notification {
  notificationId: number;
  hazardId: number | null;
  message: string;
  isRead: 0 | 1;
  createdAt: string;
}

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const POLL_MS = 60000;

interface NotificationCenterProps {
  /** MapPage uses a dark floating-toolbar theme; everywhere else is the
   * light brand theme. Defaults to light. */
  dark?: boolean;
  /** Which edge of the trigger button the popup panel anchors to and
   * expands away from. "right" (default) pins the panel's right edge to
   * the trigger, extending leftward — the original behavior. "left" pins
   * the panel's left edge instead, extending rightward — needed when the
   * bell sits at the bottom of a left-edge sidebar, where extending
   * leftward would run off-screen. */
  panelSide?: "left" | "right";
}

/**
 * Bell-icon notification centre (Phase 6 proposal gap: persistent alerts).
 * Notification-only — this data never feeds SafeMaster's routing score
 * (see driver_notifications migration comment for why). Polls its own
 * endpoint; only renders once logged in.
 */
export default function NotificationCenter({ dark = false, panelSide = "right" }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const load = async () => {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/notifications`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch {
      // silent — notifications are non-critical, don't disrupt the page
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markRead = async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.notificationId === id ? { ...n, isRead: 1 } : n)));
    try {
      await fetch(`${CONFIG.API_BASE_URL}/api/notifications/${id}/read`, { method: "PATCH", headers: getAuthHeaders() });
    } catch {
      // optimistic update already applied; a failed PATCH just means it
      // reappears as unread next poll, which is an acceptable fallback
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
    try {
      await fetch(`${CONFIG.API_BASE_URL}/api/notifications/read-all`, { method: "PATCH", headers: getAuthHeaders() });
    } catch {
      // see markRead
    }
  };

  if (!isLoggedIn) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const buttonClass = dark
    ? "relative p-2 text-slate-300 hover:text-blue-300 transition-colors"
    : "relative p-2 text-brand-muted hover:text-brand-ink transition-colors";
  const sideClass = panelSide === "left" ? "left-0" : "right-0";
  const panelClass = dark
    ? `absolute ${sideClass} mt-2 w-80 max-w-[90vw] bg-slate-900/95 backdrop-blur-2xl border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden z-[1000]`
    : `absolute ${sideClass} mt-2 w-80 max-w-[90vw] bg-white border border-brand-border rounded-2xl shadow-xl overflow-hidden z-[1000]`;
  const headerClass = dark
    ? "flex items-center justify-between px-4 py-3 border-b border-blue-500/20"
    : "flex items-center justify-between px-4 py-3 border-b border-brand-border";
  const titleClass = dark ? "text-sm font-bold text-slate-100" : "text-sm font-bold";
  const listClass = dark
    ? "max-h-96 overflow-y-auto divide-y divide-blue-500/10"
    : "max-h-96 overflow-y-auto divide-y divide-brand-border";
  const emptyClass = dark ? "p-6 text-sm text-slate-400 text-center" : "p-6 text-sm text-brand-muted text-center";
  const messageClass = dark ? "text-sm text-slate-200" : "text-sm text-brand-ink";
  const timeClass = dark ? "text-[11px] text-slate-500 mt-0.5" : "text-[11px] text-brand-muted mt-0.5";
  const markReadBtnClass = dark
    ? "shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
    : "shrink-0 p-1.5 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-bg";

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={buttonClass}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={panelClass}>
          <div className={headerClass}>
            <span className={titleClass}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-blue-400 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className={listClass}>
            {notifications.length === 0 ? (
              <p className={emptyClass}>No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  className={`p-3 flex items-start gap-2 ${n.isRead ? "" : dark ? "bg-blue-500/10" : "bg-brand-blue-soft/40"}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={messageClass}>{n.message}</p>
                    <p className={timeClass}>{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n.notificationId)}
                      title="Mark read"
                      className={markReadBtnClass}
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
