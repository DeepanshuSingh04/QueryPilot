import React, { useEffect, useState } from 'react'
import './auth.css'

/* ------------------------------------------------------------------ */
/*  Palette (kept as hex so it works on Tailwind v3 and v4)            */
/*  night  #0F1E2E   ink #10202F    paper #E8EEF1   card #F8FAFA       */
/*  airmail red #E0472F   airmail blue #2B5BC0   agent teal #31B8C6    */
/* ------------------------------------------------------------------ */

const Mark = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <circle cx="16" cy="16" r="14.5" stroke="currentColor" strokeOpacity=".4" />
    <path d="M16 5.5 22.5 25 16 21 9.5 25Z" fill="currentColor" />
  </svg>
)

/* ---------- Left panel: static topographic lines (aeronautical chart feel) ---------- */
const Topography = () => {
  const rings = [60, 115, 170, 225, 280, 335, 390, 445, 500]
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <filter id="qp-topo" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.006" numOctaves="2" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="170" />
        </filter>
      </defs>
      <g filter="url(#qp-topo)" fill="none" stroke="#31b8c6" strokeOpacity=".15" strokeWidth="1.2">
        {rings.map((r) => (
          <circle key={`a${r}`} cx="82%" cy="90%" r={r} />
        ))}
        {rings.slice(0, 5).map((r) => (
          <circle key={`b${r}`} cx="6%" cy="6%" r={r} />
        ))}
      </g>
    </svg>
  )
}

/* ---------- Left panel: live agent trace (this is the one animated moment) ---------- */
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
  const [run, setRun] = useState(0) // which RUNS[] entry is playing
  const [typed, setTyped] = useState(0) // how many prompt characters are visible
  const [done, setDone] = useState(-1) // index of the last finished step (-1 = none)

  useEffect(() => {
    const { prompt, steps } = RUNS[run]
    let t

    if (typed < prompt.length) {
      // 1) type the prompt, one character at a time
      t = setTimeout(() => setTyped((n) => n + 1), 30)
    } else if (done < steps.length - 1) {
      // 2) finish the steps one by one
      t = setTimeout(() => setDone((n) => n + 1), done === -1 ? 800 : 1000)
    } else {
      // 3) everything done -> pause, then start the next run
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
    <div className="mt-10 border border-[#26405a] bg-[#0a1622]">
      <div className="flex items-center justify-between border-b border-[#26405a] px-4 py-2.5 text-[13px] text-[#E8EEF1]/60">
        <span>Agent activity</span>
        <span className="flex items-center gap-2 text-[#31b8c6]">
          <span className="qp-live" />
          Live
        </span>
      </div>

      <div className="qp-mono min-h-[224px] px-4 py-4 text-[12.5px] leading-6 text-[#E8EEF1]">
        <p>
          <span className="mr-2 text-[#31b8c6]">&gt;</span>
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
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#31b8c6]">
                      <path d="M2 6.5 5 9.5 10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
                    </svg>
                  ) : (
                    <span className="qp-spinner h-3 w-3 text-[#31b8c6]" />
                  )}
                </span>
                <span className={s.mail ? 'text-[#ff7a5f]' : 'text-[#31b8c6]'}>{s.tool}</span>
                <span className="ml-auto text-[#E8EEF1]/45">{finished ? s.note : 'running'}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/* ---------- Right panel: stamp + postmark ---------- */
const Stamp = () => (
  <svg
    viewBox="0 0 76 92"
    className="absolute right-4 top-4 h-[74px] w-[61px] rotate-3 sm:right-5 sm:top-5 sm:h-[92px] sm:w-[76px]"
    aria-hidden="true"
  >
    <rect width="76" height="92" fill="#2B5BC0" />
    <rect x="8.5" y="8.5" width="59" height="75" fill="none" stroke="#F8FAFA" strokeOpacity=".5" />
    <g transform="translate(14 14) scale(1.5)" fill="none">
      <circle cx="16" cy="16" r="14.5" stroke="#F8FAFA" strokeOpacity=".5" />
      <path d="M16 5.5 22.5 25 16 21 9.5 25Z" fill="#F8FAFA" />
    </g>
    <text x="38" y="73" textAnchor="middle" fontSize="8" letterSpacing="1.6" fill="#F8FAFA" className="qp-display">
      AIR MAIL
    </text>
    {/* perforated edge: dots in the card colour punched along the border */}
    <rect width="76" height="92" fill="none" stroke="#F8FAFA" strokeWidth="6" strokeDasharray="0 9" strokeLinecap="round" />
  </svg>
)

const Postmark = () => {
  const now = new Date()
  const day = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()
  return (
    <svg
      viewBox="0 0 120 120"
      className="qp-postmark absolute right-2 top-[44px] hidden h-[104px] w-[104px] sm:block"
      aria-hidden="true"
    >
      <defs>
        <path id="qp-postmark-ring" d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0" />
      </defs>
      <g fill="none" stroke="#10202F" strokeOpacity=".5" strokeWidth="1.6">
        <circle cx="60" cy="60" r="56" />
        <circle cx="60" cy="60" r="32" />
      </g>
      <text fontSize="10" fontWeight="700" letterSpacing="4" fill="#10202F" fillOpacity=".55" className="qp-display">
        <textPath href="#qp-postmark-ring">QUERYPILOT • DISPATCHED •</textPath>
      </text>
      <text x="60" y="58" textAnchor="middle" fontSize="11" fontWeight="700" fill="#10202F" fillOpacity=".6" className="qp-display">
        {day}
      </text>
      <text x="60" y="72" textAnchor="middle" fontSize="10" fontWeight="600" fill="#10202F" fillOpacity=".5" className="qp-display">
        {now.getFullYear()}
      </text>
    </svg>
  )
}

/* ---------- Shared form pieces ---------- */

// A "ruled line" field, like filling in a postal form: label on the left, line under the input
export const Field = ({ id, label, type = 'text', value, onChange, placeholder, autoComplete, trailing, children }) => (
  <div>
    <div className="group grid grid-cols-[84px_1fr] items-end gap-3 border-b-2 border-[#10202F]/25 transition-colors focus-within:border-[#2B5BC0] focus-within:shadow-[0_2px_0_0_#2B5BC0]">
      <label
        htmlFor={id}
        className="pb-3 text-[13px] font-semibold text-[#10202F]/70 transition-colors group-focus-within:text-[#2B5BC0]"
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
          className="qp-input w-full bg-transparent py-3 pr-14 text-[16px] text-[#10202F] outline-none placeholder:text-[#10202F]/35"
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
    className="flex w-full items-center justify-center gap-3 bg-[#10202F] px-6 py-4 text-[15px] font-bold text-[#F8FAFA] transition-colors hover:bg-[#E0472F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2B5BC0] disabled:cursor-wait disabled:opacity-80 disabled:hover:bg-[#10202F]"
  >
    {loading && <span className="qp-spinner h-4 w-4" />}
    {loading ? loadingLabel : label}
  </button>
)

/* ---------- The page shell ---------- */
export const AuthLayout = ({ title, subtitle, footer, children }) => (
  <main className="qp-auth min-h-screen bg-[#E8EEF1] text-[#10202F] lg:grid lg:grid-cols-[1.1fr_1fr]">
    {/* Left: what QueryPilot does, shown live */}
    <aside className="relative hidden overflow-hidden bg-[#0F1E2E] p-12 text-[#E8EEF1] lg:flex lg:flex-col lg:justify-between xl:p-16">
      <Topography />

      <div className="relative z-10 flex items-center gap-3">
        <Mark className="h-9 w-9 text-[#31b8c6]" />
        <span className="qp-display text-[24px]">QueryPilot</span>
      </div>

      <div className="relative z-10 max-w-[560px]">
        <h2 className="qp-display text-[44px] leading-[1.06] xl:text-[54px]">
          Ask it once. It researches, writes, and hits send.
        </h2>
        <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-[#E8EEF1]/70">
          QueryPilot searches the web, reads what it finds, and emails the answer to whoever you name.
        </p>
        <AgentTrace />
      </div>

      <p className="relative z-10 text-[14px] text-[#E8EEF1]/55">Web search and email today. More tools are on the way.</p>
    </aside>

    {/* Right: the form, on an airmail envelope */}
    <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:min-h-0">
      <div className="w-full max-w-[470px]">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <Mark className="h-8 w-8 text-[#2B5BC0]" />
          <span className="qp-display text-[22px]">QueryPilot</span>
        </div>

        <div className="qp-envelope">
          <div className="relative bg-[#F8FAFA] px-7 pb-8 pt-10 sm:px-10">
            <Stamp />
            <Postmark />

            <div className="pr-20 sm:pr-28">
              <h1 className="qp-display text-[30px] leading-[1.05] sm:text-[38px]">{title}</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-[#10202F]/70">{subtitle}</p>
            </div>

            <div className="mt-10">{children}</div>

            <p className="mt-8 border-t-2 border-dashed border-[#10202F]/20 pt-5 text-[14px] text-[#10202F]/70">
              {footer}
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>
)