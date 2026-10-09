import React, { useEffect, useState } from 'react'
import './auth.css'

/* ------------------------------------------------------------------ */
/*  Palette                                                            */
/*  void #0A0A0B   panel #101012   card #131316   line #262626         */
/*  ink #F2F0EA    ink-dim rgba(242,240,234,.55~.6)                    */
/*  clearance red #E2402F                                              */
/* ------------------------------------------------------------------ */

/* Original triangular-knot mark — three identical arms rotated 120°.
   Inspired by the woven-triangle style you shared, built from scratch
   (not a reproduction of anyone else's logo). */
const Mark = ({ className = '' }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
    <g stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
      <g transform="rotate(0 50 50)">
        <path d="M50 14 L73 60 L38 76" />
      </g>
      <g transform="rotate(120 50 50)">
        <path d="M50 14 L73 60 L38 76" strokeOpacity="0.72" />
      </g>
      <g transform="rotate(240 50 50)">
        <path d="M50 14 L73 60 L38 76" strokeOpacity="0.44" />
      </g>
    </g>
  </svg>
)

/* ---------- Left panel: liquid-noise field (DAQ-style dark marble) ---------- */
const LiquidField = () => (
  <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
    <defs>
      <filter id="qp-liquid" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="3" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="90" />
      </filter>
      <linearGradient id="qp-liquid-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e2402f" stopOpacity="0.16" />
        <stop offset="1" stopColor="#e2402f" stopOpacity="0" />
      </linearGradient>
    </defs>
    <g filter="url(#qp-liquid)" fill="none" stroke="#f2f0ea" strokeOpacity=".08" strokeWidth="1">
      {[40, 90, 140, 190, 240, 290, 340, 390].map((r) => (
        <circle key={`a${r}`} cx="78%" cy="18%" r={r} />
      ))}
      {[30, 80, 130, 180, 230].map((r) => (
        <circle key={`b${r}`} cx="14%" cy="88%" r={r} />
      ))}
    </g>
    <rect width="100%" height="55%" fill="url(#qp-liquid-fade)" />
    <rect width="100%" height="100%" className="qp-grain" />
  </svg>
)

/* ---------- Left panel: live agent trace, styled as a clearance terminal ---------- */
const RUNS = [
  {
    prompt: "Summarise this week's AI news and email it to my team",
    steps: [
      { tool: 'web_search', note: '14 sources' },
      { tool: 'read_pages', note: '6 kept' },
      { tool: 'write_summary', note: '218 words' },
      { tool: 'send_email', note: 'delivered', mail: true },
    ],
  },
  {
    prompt: 'Compare Zustand and Redux Toolkit for a mid-size app',
    steps: [
      { tool: 'web_search', note: '11 sources' },
      { tool: 'read_pages', note: '5 kept' },
      { tool: 'write_summary', note: 'table + verdict' },
    ],
  },
  {
    prompt: 'Find remote SDE internships and mail me the list',
    steps: [
      { tool: 'web_search', note: '23 listings' },
      { tool: 'filter_results', note: '9 match' },
      { tool: 'send_email', note: 'delivered', mail: true },
    ],
  },
]

const AgentTrace = () => {
  const [run, setRun] = useState(0)
  const [typed, setTyped] = useState(0)
  const [done, setDone] = useState(-1)

  useEffect(() => {
    const { prompt, steps } = RUNS[run]
    let t

    if (typed < prompt.length) {
      t = setTimeout(() => setTyped((n) => n + 1), 30)
    } else if (done < steps.length - 1) {
      t = setTimeout(() => setDone((n) => n + 1), done === -1 ? 800 : 1000)
    } else {
      t = setTimeout(() => {
        setRun((r) => (r + 1) % RUNS.length)
        setTyped(0)
        setDone(-1)
      }, 2800)
    }

    return () => clearTimeout(t)
  }, [typed, done, run])

  const { prompt, steps } = RUNS[run]
  const promptDone = typed >= prompt.length

  return (
    <div className="mt-10 border border-[#262626] bg-[#0d0d0f]">
      <div className="flex items-center justify-between border-b border-[#262626] px-4 py-2.5">
        <span className="qp-mono text-[11px] tracking-[0.15em] text-[#f2f0ea]/45">AGENT_ACTIVITY.LOG</span>
        <span className="qp-mono flex items-center gap-2 text-[11px] tracking-[0.1em] text-[#e2402f]">
          <span className="qp-live" />
          LIVE
        </span>
      </div>

      <div className="qp-mono min-h-[224px] px-4 py-4 text-[12.5px] leading-6 text-[#f2f0ea]">
        <p>
          <span className="mr-2 text-[#e2402f]">&gt;</span>
          {prompt.slice(0, typed)}
          {!promptDone && <span className="qp-caret" />}
        </p>

        <ul className="mt-4 space-y-2.5">
          {steps.map((s, i) => {
            if (!promptDone || i > done + 1) return null
            const finished = i <= done
            return (
              <li key={`${run}-${i}`} className="flex items-center gap-3">
                <span className="flex h-4 w-4 items-center justify-center">
                  {finished ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#e2402f]">
                      <path d="M2 6.5 5 9.5 10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
                    </svg>
                  ) : (
                    <span className="qp-spinner h-3 w-3 text-[#e2402f]" />
                  )}
                </span>
                <span className={s.mail ? 'text-[#f2f0ea]' : 'text-[#f2f0ea]/80'}>{s.tool}</span>
                <span className="ml-auto text-[#f2f0ea]/40">{finished ? s.note : 'running'}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/* ---------- Right panel: clearance tag + terminal id block ---------- */
const ClearanceTag = () => (
  <div className="qp-tag qp-mono inline-flex items-center gap-2 border border-[#e2402f]/40 px-3 py-1.5 text-[10px] tracking-[0.15em] text-[#e2402f]">
    <span className="h-1.5 w-1.5 rounded-full bg-[#e2402f]" />
    RESTRICTED ACCESS
  </div>
)

const TerminalId = () => {
  const now = new Date()
  const day = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
  return (
    <div className="qp-mono absolute right-6 top-6 hidden text-right text-[10px] leading-[1.7] tracking-[0.1em] text-[#f2f0ea]/35 sm:right-9 sm:top-9 sm:block">
      <p>QUERYPILOT / SYS.ACCESS</p>
      <p>{day}</p>
    </div>
  )
}

/* ---------- Shared form pieces ---------- */

export const Field = ({ id, label, type = 'text', value, onChange, placeholder, autoComplete, trailing, children }) => (
  <div>
    <div className="group grid grid-cols-[84px_1fr] items-end gap-3 border-b border-[#262626] transition-colors focus-within:border-[#e2402f]">
      <label
        htmlFor={id}
        className="qp-mono pb-3 text-[10px] uppercase tracking-[0.1em] text-[#f2f0ea]/45 transition-colors group-focus-within:text-[#e2402f]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="qp-input w-full bg-transparent py-3 pr-14 text-[14px] text-[#f2f0ea] outline-none placeholder:text-[#f2f0ea]/25"
        />
        {trailing}
      </div>
    </div>
    {children}
  </div>
)

export const SubmitButton = ({ loading, label, loadingLabel }) => (
  <button
    type="submit"
    disabled={loading}
    className="qp-mono group flex w-full items-center justify-between gap-3 border-b border-[#f2f0ea]/25 pb-4 text-left text-[13px] font-semibold uppercase tracking-[0.14em] text-[#f2f0ea] transition-colors hover:border-[#e2402f] hover:text-[#e2402f] focus-visible:outline-none focus-visible:border-[#e2402f] focus-visible:text-[#e2402f] disabled:cursor-wait disabled:opacity-60"
  >
    <span className="flex items-center gap-3">
      {loading && <span className="qp-spinner h-3.5 w-3.5" />}
      {loading ? loadingLabel : label}
    </span>
    <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
  </button>
)

/* ---------- The page shell ---------- */
export const AuthLayout = ({ title, subtitle, footer, children }) => (
  <main className="qp-auth min-h-screen bg-[#0a0a0b] text-[#f2f0ea] lg:grid lg:grid-cols-[1.1fr_1fr]">
    {/* Left: what QueryPilot does, shown live */}
    <aside className="relative hidden overflow-hidden bg-[#0a0a0b] p-12 text-[#f2f0ea] lg:flex lg:flex-col lg:justify-between xl:p-16">
      <LiquidField />

      <div className="relative z-10 flex items-center gap-3">
        <Mark className="h-9 w-9 text-[#e2402f]" />
        <span className="qp-display text-[22px]">QueryPilot</span>
      </div>

      <div className="relative z-10 max-w-[640px]">
        <h2 className="qp-display text-[clamp(34px,3.6vw,52px)] leading-[1.05] xl:text-[52px]">
          Ask once.<br />It does the rest.
        </h2>
        <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-[#f2f0ea]/60">
          QueryPilot searches the web, reads what it finds, and emails the answer to whoever you name.
        </p>
        <div className="max-w-[560px]"><AgentTrace /></div>
      </div>

      <p className="qp-mono relative z-10 text-[11px] uppercase tracking-[0.1em] text-[#f2f0ea]/35">
        Web search + email tools active — more clearance levels on the way
      </p>
    </aside>

    {/* Right: the authorization form — bare text on the void, no card */}
    <section className="relative flex min-h-screen items-center justify-center px-6 py-14 sm:px-12 lg:min-h-0 lg:justify-start lg:px-16 xl:px-20">
      <TerminalId />
      <div className="w-full max-w-[440px]">
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <Mark className="h-8 w-8 text-[#e2402f]" />
          <span className="qp-display text-[20px]">QueryPilot</span>
        </div>

        <ClearanceTag />

        <div className="mt-7">
          <h1 className="qp-display text-[26px] leading-[1.08] sm:text-[32px]">
            {title}
            <span className="text-[#e2402f]">.</span>
          </h1>
          <p className="qp-mono mt-4 text-[11px] uppercase leading-relaxed tracking-[0.12em] text-[#f2f0ea]/45">
            {subtitle}
          </p>
        </div>

        <div className="mt-12">{children}</div>

        <p className="qp-mono mt-10 text-[11.5px] text-[#f2f0ea]/55">{footer}</p>
      </div>
    </section>
  </main>
)

export { Mark }