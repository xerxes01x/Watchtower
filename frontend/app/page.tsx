"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const POLL_INTERVAL_MS = 5_000;

/* ── Inline SVG icons (Lucide-style) — no emojis as UI ──────────────────── */
const RadarIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" />
    <path d="M4 6h.01" />
    <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" />
    <path d="M16.24 7.76A6 6 0 1 0 17.31 14" />
    <path d="M12 18h.01" />
    <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" />
    <circle cx="12" cy="12" r="2" />
    <path d="m13.41 10.59 5.66-5.66" />
  </svg>
);
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden>
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
       strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);
const AlertCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);
const SpinnerIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
       strokeWidth="2.5" strokeLinecap="round" aria-hidden
       style={{ animation: "spin 0.9s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

type Monitor = {
  id: string;
  name: string;
  url: string;
  method: string;
  current_state: string;
  last_run_at: string | null;
  last_latency_ms: number | null;
  latency_ms_threshold: number | null;
  schedule_seconds: number | null;
  expected_status: number;
  webhook_url: string | null;
};

type Toast = { id: number; message: string; ok: boolean };

const EMPTY_FORM = {
  name: "",
  url: "",
  method: "GET",
  expected_status: "200",
  schedule_seconds: "",
  webhook_url: "",
};

export default function Dashboard() {
  const { data: session, status: authStatus } = useSession();

  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const toastId = useRef(0);

  const addToast = (message: string, ok: boolean) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message, ok }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const authHeaders = useCallback((): HeadersInit => {
    const token = session?.apiToken;
    return token
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json" };
  }, [session?.apiToken]);

  const fetchMonitors = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API}/monitors`, { headers: authHeaders() });
      if (res.status === 429) {
        addToast("You are doing that too fast. Please wait a moment.", false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMonitors(data.monitors ?? []);
      setFetchError(null);
    } catch (e) {
      setFetchError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [session, authHeaders]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetchMonitors();
    const t = setInterval(fetchMonitors, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [authStatus, fetchMonitors]);

  const runNow = async (id: string, name: string) => {
    setRunning((s) => new Set(s).add(id));
    try {
      const res = await fetch(`${API}/monitors/${id}/run`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reason: "manual" }),
      });
      if (res.status === 429) {
        addToast("You are doing that too fast. Please wait a moment.", false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      addToast(`Check triggered for "${name}"`, true);
      setTimeout(fetchMonitors, 1500);
    } catch (e) {
      addToast(`Failed to trigger "${name}": ${(e as Error).message}`, false);
    } finally {
      setRunning((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  const deleteMonitor = async (id: string, name: string) => {
    if (!confirm(`Delete monitor "${name}"? This cannot be undone.`)) return;
    setDeleting((s) => new Set(s).add(id));
    try {
      const res = await fetch(`${API}/monitors/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.status === 429) {
        addToast("You are doing that too fast. Please wait a moment.", false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      addToast(`Deleted "${name}"`, true);
      setMonitors((ms) => ms.filter((m) => m.id !== id));
    } catch (e) {
      addToast(`Failed to delete "${name}": ${(e as Error).message}`, false);
    } finally {
      setDeleting((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  const createMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        url: form.url,
        method: form.method,
        expected_status: parseInt(form.expected_status, 10),
      };
      if (form.schedule_seconds) body.schedule_seconds = parseInt(form.schedule_seconds, 10);
      if (form.webhook_url) body.webhook_url = form.webhook_url;

      const res = await fetch(`${API}/monitors`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.status === 429) {
        addToast("You are doing that too fast. Please wait a moment.", false);
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
      }
      addToast(`Monitor "${form.name}" created`, true);
      setShowModal(false);
      setForm(EMPTY_FORM);
      await fetchMonitors();
    } catch (e) {
      addToast(`Create failed: ${(e as Error).message}`, false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Auth states ────────────────────────────────────────────────────────────

  if (authStatus === "loading") {
    return <div className="auth-screen"><p className="loading">Loading…</p></div>;
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <span className="auth-logo"><RadarIcon /></span>
          <h1>Watchtower</h1>
          <p className="auth-subtitle">API Monitor Dashboard</p>
          <button className="btn btn-github" onClick={() => signIn("github")}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Sign in with GitHub
          </button>
        </div>
      </div>
    );
  }

  // ── Authenticated dashboard ────────────────────────────────────────────────

  const total = monitors.length;
  const upCount = monitors.filter((m) => m.current_state === "UP").length;
  const downCount = monitors.filter((m) => m.current_state === "DOWN").length;
  const sc = (state: string) => (state === "UP" ? "up" : state === "DOWN" ? "down" : "unknown");

  return (
    <>
      <header>
        <span className="brand-mark"><RadarIcon /></span>
        <h1>Watchtower</h1>
        <span className="subtitle">Observability Dashboard</span>
        <span className="refresh-info mono">auto-refresh · 5s</span>
        <button className="btn-new" onClick={() => setShowModal(true)}>
          <PlusIcon /> New Monitor
        </button>
        <div className="user-info">
          {session?.user?.image && (
            <img src={session.user.image} alt="" className="user-avatar" />
          )}
          <span className="user-name">{session?.user?.name ?? session?.user?.email}</span>
          <button className="btn-signout" onClick={() => signOut()}>Sign out</button>
        </div>
      </header>

      <main>
        {!loading && !fetchError && (
          <div className="summary-bar">
            <div className="summary-stat">
              <span className="summary-label">Total Monitors</span>
              <span className="summary-val">{total}</span>
            </div>
            <div className="summary-stat summary-stat--up">
              <span className="summary-label">Operational</span>
              <span className="summary-val summary-up">{upCount}</span>
            </div>
            <div className="summary-stat summary-stat--down">
              <span className="summary-label">Incidents</span>
              <span className="summary-val summary-down">{downCount}</span>
            </div>
          </div>
        )}

        {loading && <p className="loading">Loading monitors…</p>}
        {fetchError && (
          <p className="error-msg">
            Could not reach API at <strong>{API}</strong>: {fetchError}
          </p>
        )}
        {!loading && !fetchError && monitors.length === 0 && (
          <p className="empty">
            No monitors yet.{" "}
            <button className="link-btn" onClick={() => setShowModal(true)}>
              Create your first monitor
            </button>
          </p>
        )}

        <div className="grid">
          {monitors.map((m) => {
            const state = sc(m.current_state);
            const isRunning = running.has(m.id);
            const isDeleting = deleting.has(m.id);
            const lastRun = m.last_run_at
              ? new Date(m.last_run_at).toLocaleString()
              : "never";
            const latency = m.last_latency_ms != null
              ? `${Math.round(m.last_latency_ms)}ms`
              : null;

            const isLive = m.schedule_seconds != null;
            return (
              <div key={m.id} className={`card card-${state}${isLive ? " is-live" : ""}`}>
                <div className="card-header">
                  <span className={`dot dot-${state}`} />
                  <span className="card-name" title={m.name}>{m.name}</span>
                  {isLive && <span className="live-tag">Live</span>}
                  <span className={`badge badge-${state}`}>{m.current_state}</span>
                  <button
                    className="btn-delete"
                    title="Delete monitor"
                    disabled={isDeleting}
                    onClick={() => deleteMonitor(m.id, m.name)}
                    aria-label="Delete monitor"
                  >
                    {isDeleting ? <SpinnerIcon /> : <TrashIcon />}
                  </button>
                </div>

                <div className="card-url" title={m.url}>
                  <span className="method-tag">{m.method}</span>
                  <span className="card-url-text">{m.url}</span>
                </div>

                <div className="card-meta">
                  <span>Last run: <span className="mono">{lastRun}</span></span>
                  {m.schedule_seconds != null && (
                    <span>Every <span className="mono">{m.schedule_seconds}s</span></span>
                  )}
                </div>

                {latency && (
                  <div className={`card-latency card-latency-${state}`}>
                    <span>Latency</span>
                    <span className="latency-value">{latency}</span>
                    {m.latency_ms_threshold != null && (
                      <span className="sla-label">SLA {m.latency_ms_threshold}ms</span>
                    )}
                  </div>
                )}

                <button
                  className={`btn${isRunning ? " btn-running" : ""}`}
                  disabled={isRunning}
                  onClick={() => runNow(m.id, m.name)}
                >
                  {isRunning ? <><SpinnerIcon /> Running…</> : <><PlayIcon /> Run Check</>}
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Monitor</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={createMonitor} className="modal-form">
              <label>
                Name <span className="required">*</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="My API Health"
                />
              </label>
              <label>
                URL <span className="required">*</span>
                <input
                  required
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://api.example.com/health"
                />
              </label>
              <div className="form-row">
                <label>
                  Method
                  <select
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>HEAD</option>
                  </select>
                </label>
                <label>
                  Expected Status
                  <input
                    type="number"
                    value={form.expected_status}
                    onChange={(e) => setForm({ ...form, expected_status: e.target.value })}
                    min={100}
                    max={599}
                  />
                </label>
              </div>
              <label>
                Schedule (seconds)
                <input
                  type="number"
                  value={form.schedule_seconds}
                  onChange={(e) => setForm({ ...form, schedule_seconds: e.target.value })}
                  placeholder="60 (leave blank for manual only)"
                  min={5}
                />
              </label>
              <label>
                Webhook URL
                <input
                  type="url"
                  value={form.webhook_url}
                  onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
                  placeholder="https://hooks.example.com/alert (optional)"
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-submit" disabled={submitting}>
                  {submitting ? <><SpinnerIcon /> Creating…</> : "Create Monitor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.ok ? "toast--ok" : "toast--err"}`}>
            {t.ok ? <CheckCircleIcon /> : <AlertCircleIcon />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
