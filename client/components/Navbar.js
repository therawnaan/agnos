"use client";
import Link from "next/link";

// pageType: null (home) | "patient" | "staff"
export default function Navbar({ pageType = null }) {
  const PAGE_META = {
    patient: {
      label: "Patient Intake",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M5.5 5.5h13A2.5 2.5 0 0121 8v8a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16V8a2.5 2.5 0 012.5-2.5z" />
        </svg>
      ),
      pill: "bg-teal-50 text-teal-700 border-teal-200",
    },
    staff: {
      label: "Staff Portal",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
        </svg>
      ),
      pill: "bg-slate-100 text-slate-600 border-slate-200",
    },
  };

  const meta = pageType ? PAGE_META[pageType] : null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-4">

        {/* Left — logo / home link */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
        >
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-teal-700 transition-colors duration-200">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span className="font-bold text-slate-800 text-sm tracking-tight group-hover:text-teal-700 transition-colors duration-200">
            MediCheck
          </span>
        </Link>

        {/* Centre — current page indicator (only on sub-pages) */}
        {meta && (
          <div className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${meta.pill}`}>
            {meta.icon}
            {meta.label}
          </div>
        )}

        {/* Right — back to home */}
        {pageType && (
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
        )}
      </div>

      {/* Mobile page label */}
      {meta && (
        <div className={`sm:hidden flex items-center gap-1.5 text-xs font-semibold px-4 pb-2 ${meta.pill.split(" ").filter(c => c.startsWith("text-")).join(" ")}`}>
          {meta.icon}
          {meta.label}
        </div>
      )}
    </nav>
  );
}
