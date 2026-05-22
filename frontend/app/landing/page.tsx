import Link from "next/link";
import EngineDiagram from "@/components/landing/EngineDiagram";

const FEATURES = [
  {
    tag: "Distributed",
    title: "Run checks from anywhere",
    body: "Celery workers fan out probes across regions. Add a new vantage point with one env var.",
  },
  {
    tag: "Resilient",
    title: "Flap-protected alerts",
    body: "Configurable consecutive-failure thresholds suppress noisy transitions before paging on-call.",
  },
  {
    tag: "Observable",
    title: "Prometheus-native",
    body: "Latency P95, success rate, validation failures — all exposed as first-class metrics.",
  },
  {
    tag: "Extensible",
    title: "Pluggable validators",
    body: "Status-code, JSON-schema, regex, header — compose validators per monitor with no code.",
  },
];

const METRICS = [
  { label: "Avg P95 latency", value: "184ms", sub: "across 12 regions" },
  { label: "Checks / minute", value: "48.2k", sub: "live across all tenants" },
  { label: "SLO compliance", value: "99.97%", sub: "rolling 30d window" },
];

export default function LandingPage() {
  return (
    <>
      <Nav />

      <main className="relative mx-auto max-w-7xl px-6 pt-10 pb-24 sm:px-8">
        {/* ── Bento grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4 lg:gap-5">
          {/* Hero */}
          <section className="bento-card col-span-12 p-8 sm:p-12 lg:col-span-7 lg:row-span-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <span className="size-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
              v2.0 — Phase 2 shipped
            </div>

            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              The monitoring engine
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
                that doesn&rsquo;t flap.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Watchtower runs synthetic checks against your APIs, validates
              responses, and pages on-call only when something is{" "}
              <span className="font-mono text-slate-200">actually</span> wrong.
              Built on Celery, Redis, Postgres, and Prometheus.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="cta-glow inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all"
              >
                Open dashboard
                <ArrowIcon />
              </Link>
              <a
                href="#engine"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-600/40 bg-slate-900/40 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500/70 hover:bg-slate-900/70"
              >
                <PlayIcon /> See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-slate-700/40 pt-6 text-xs text-slate-500">
              <span className="font-mono uppercase tracking-[0.16em]">
                Stack
              </span>
              {["FastAPI", "Celery", "Redis", "Postgres", "Prometheus", "Grafana"].map((s) => (
                <span key={s} className="font-mono text-slate-300">
                  {s}
                </span>
              ))}
            </div>
          </section>

          {/* 3D Engine diagram */}
          <section
            id="engine"
            className="bento-card col-span-12 flex flex-col p-6 lg:col-span-5 lg:row-span-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">
                  Architecture
                </p>
                <h3 className="mt-1 text-lg font-semibold">The engine</h3>
              </div>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                ● live
              </span>
            </div>

            <div className="relative flex flex-1 items-center justify-center py-4">
              <EngineDiagram />
            </div>

            <p className="mt-2 text-center text-xs text-slate-500">
              A scheduler orbits 5 validators around a central dispatch core.
            </p>
          </section>

          {/* Metrics card */}
          <section className="bento-card col-span-12 overflow-hidden p-6 sm:col-span-8 lg:col-span-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300/80">
                  Live fleet
                </p>
                <h3 className="mt-1 text-lg font-semibold">
                  Real-time SLA telemetry
                </h3>
              </div>
              <div className="font-mono text-[11px] text-slate-500">
                last 24h
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-4">
              {METRICS.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-slate-700/40 bg-slate-950/40 p-4"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    {m.label}
                  </div>
                  <div className="mt-2 font-mono text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {m.value}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">{m.sub}</div>
                </div>
              ))}
            </div>

            <Sparkline />
          </section>

          {/* Tagline mini-card */}
          <section className="bento-card col-span-12 flex flex-col justify-between p-6 sm:col-span-4 lg:col-span-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">
                Why teams pick it
              </p>
              <h3 className="mt-2 text-2xl font-semibold leading-tight">
                Less noise.
                <br />
                <span className="text-slate-400">More signal.</span>
              </h3>
              <p className="mt-3 text-sm text-slate-400">
                Most monitoring tools page you on a single failed probe.
                Watchtower waits for{" "}
                <span className="font-mono text-cyan-300">N consecutive</span>{" "}
                failures before transitioning state — same threshold the SRE
                playbook actually recommends.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3 font-mono text-[11px] text-slate-500">
              <span className="rounded-md border border-slate-700 px-2 py-1">FLAP_THRESHOLD=3</span>
              <span className="rounded-md border border-slate-700 px-2 py-1">RETRIES=5</span>
            </div>
          </section>

          {/* Feature cards */}
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              className={`bento-card col-span-12 p-6 sm:col-span-6 lg:col-span-3 ${
                i === 0 ? "lg:col-start-1" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <FeatureIcon i={i} />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  {f.tag}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {f.body}
              </p>
            </article>
          ))}

          {/* Code preview */}
          <section className="bento-card col-span-12 p-6 lg:col-span-7">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-rose-400/70" />
              <span className="size-2.5 rounded-full bg-amber-400/70" />
              <span className="size-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 font-mono text-[11px] text-slate-500">
                POST /v1/monitors
              </span>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-700/40 bg-slate-950/70 p-4 font-mono text-[12.5px] leading-relaxed text-slate-300">
{`{
  "name":      "checkout-api",
  "url":       "https://api.acme.io/health",
  "method":    "GET",
  "interval":  "30s",
  "validators": [
    { "type": "status",  "expect": 200 },
    { "type": "json",    "path": "$.db.healthy", "equals": true },
    { "type": "latency", "p95_lt_ms": 250 }
  ],
  "alerts": {
    "webhook_url":     "https://hooks.slack.com/...",
    "flap_threshold":  3
  }
}`}
            </pre>
          </section>

          {/* Final CTA */}
          <section className="bento-card col-span-12 flex flex-col items-start gap-5 p-8 sm:flex-row sm:items-center sm:justify-between lg:col-span-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">
                Self-hosted
              </p>
              <h3 className="mt-1 text-2xl font-semibold leading-tight">
                Stand it up in
                <br />
                <span className="font-mono text-cyan-300">docker compose up</span>
              </h3>
            </div>
            <Link
              href="/"
              className="cta-glow inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
            >
              Launch dashboard
              <ArrowIcon />
            </Link>
          </section>
        </div>

        <footer className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-slate-800/60 pt-8 text-xs text-slate-500 sm:flex-row">
          <div className="font-mono">© 2026 Watchtower · MIT</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-slate-300">Docs</a>
            <a href="https://github.com" className="hover:text-slate-300">GitHub</a>
            <a href="/" className="hover:text-slate-300">Dashboard</a>
          </div>
        </footer>
      </main>
    </>
  );
}

/* ── components ────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <header className="relative mx-auto flex max-w-7xl items-center gap-4 px-6 py-5 sm:px-8">
      <div className="flex items-center gap-2.5">
        <div className="grid size-8 place-items-center rounded-lg border border-indigo-400/40 bg-gradient-to-br from-indigo-500/20 to-cyan-400/15 text-indigo-300 shadow-[0_0_18px_rgba(99,102,241,0.25)]">
          <TowerIcon />
        </div>
        <div className="font-semibold tracking-tight">Watchtower</div>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:inline">
          /v2
        </span>
      </div>
      <nav className="ml-auto hidden items-center gap-7 text-sm text-slate-400 md:flex">
        <a href="#engine" className="hover:text-slate-100">Engine</a>
        <a href="#" className="hover:text-slate-100">Pricing</a>
        <a href="#" className="hover:text-slate-100">Docs</a>
      </nav>
      <Link
        href="/"
        className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-600/40 bg-slate-900/50 px-3.5 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500/70 hover:bg-slate-900 md:ml-4"
      >
        Dashboard <ArrowIcon />
      </Link>
    </header>
  );
}

function Sparkline() {
  return (
    <svg
      viewBox="0 0 600 80"
      className="mt-5 h-16 w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,55 L40,48 L80,52 L120,40 L160,44 L200,30 L240,38 L280,22 L320,28 L360,18 L400,26 L440,14 L480,22 L520,12 L560,18 L600,8"
        fill="none"
        stroke="#22D3EE"
        strokeWidth="2"
        className="spark-line"
      />
      <path
        d="M0,55 L40,48 L80,52 L120,40 L160,44 L200,30 L240,38 L280,22 L320,28 L360,18 L400,26 L440,14 L480,22 L520,12 L560,18 L600,8 L600,80 L0,80 Z"
        fill="url(#spark-grad)"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function TowerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2 L12 22 M5 7 L19 7 M3 12 L21 12 M6 17 L18 17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function FeatureIcon({ i }: { i: number }) {
  const colors = [
    "from-cyan-400/30 to-cyan-400/0 text-cyan-300 border-cyan-400/30",
    "from-rose-400/30 to-rose-400/0 text-rose-300 border-rose-400/30",
    "from-violet-400/30 to-violet-400/0 text-violet-300 border-violet-400/30",
    "from-emerald-400/30 to-emerald-400/0 text-emerald-300 border-emerald-400/30",
  ];
  return (
    <span
      className={`grid size-9 place-items-center rounded-lg border bg-gradient-to-br ${colors[i % colors.length]}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        {i === 0 && (
          <path d="M3 12 L9 6 L15 12 L21 6 M3 18 L9 12 L15 18 L21 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {i === 1 && (
          <path d="M12 3 L4 7 V12 C4 17 8 20 12 21 C16 20 20 17 20 12 V7 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        )}
        {i === 2 && (
          <path d="M3 17 L9 11 L13 15 L21 7 M15 7 H21 V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {i === 3 && (
          <path d="M9 4 H5 V8 M15 4 H19 V8 M9 20 H5 V16 M15 20 H19 V16 M8 12 H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </span>
  );
}
