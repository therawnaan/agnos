"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar pageType={null} />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">

        {/* Soft background blobs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-teal-50 blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-slate-100 blur-3xl opacity-50 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">

          {/* Badge */}
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Patient Intake System
          </span>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 leading-[1.05] tracking-tighter mb-5">
            Welcome to{" "}
            <span className="text-teal-600">Agnos</span>
          </h1>

          <p className="text-slate-500 text-lg leading-relaxed mb-12 max-w-lg">
            A streamlined patient registration and real-time staff monitoring system. Select your portal below to get started.
          </p>

          {/* Portal cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl">

            {/* Patient card */}
            <Link href="/patient" className="group relative flex flex-col items-start text-left bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-teal-300 transition-all duration-300 overflow-hidden">
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

              <div className="relative z-10 w-full">
                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center mb-4 group-hover:bg-teal-600 transition-colors duration-300">
                  <svg className="w-5 h-5 text-teal-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M5.5 5.5h13A2.5 2.5 0 0121 8v8a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16V8a2.5 2.5 0 012.5-2.5z" />
                  </svg>
                </div>

                <p className="text-[10px] font-bold tracking-widest uppercase text-teal-500 mb-1">For Patients</p>
                <h2 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-teal-700 transition-colors duration-200">Registration Form</h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  Fill in your personal details, contact information, and medical preferences before your appointment.
                </p>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 group-hover:gap-2.5 transition-all duration-200">
                  Open form
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Staff card */}
            <Link href="/staff" className="group relative flex flex-col items-start text-left bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-slate-400 transition-all duration-300 overflow-hidden">
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

              <div className="relative z-10 w-full">
                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-slate-800 transition-colors duration-300">
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                  </svg>
                </div>

                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">For Staff</p>
                <h2 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors duration-200">Staff Dashboard</h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  Monitor patient registrations in real time, track form progress, and view submitted records.
                </p>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 group-hover:gap-2.5 transition-all duration-200">
                  Open dashboard
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-5 px-4 text-center">
        <p className="text-xs text-slate-400">
          MediCheck · Patient data is strictly confidential and used for medical purposes only.
        </p>
      </footer>
    </div>
  );
}
