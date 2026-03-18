"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";

// ─── Constants ────────────────────────────────────────────────────────────────
const WS_URL           = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";
const INACTIVE_TIMEOUT = 8000;

// ─── Status helpers ───────────────────────────────────────────────────────────
function deriveStatus(patient, now) {
  if (patient.status === "submitted") return "submitted";
  if (now - patient.lastSeen < INACTIVE_TIMEOUT) return "active";
  return "inactive";
}

const STATUS_META = {
  submitted: { label: "Submitted", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", avatar: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-100", pulse: false },
  active:    { label: "Filling in", dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-700 border-amber-200",     avatar: "bg-amber-100 text-amber-700",   ring: "ring-amber-100",   pulse: true  },
  inactive:  { label: "Inactive",   dot: "bg-slate-300",  badge: "bg-slate-50 text-slate-500 border-slate-200",     avatar: "bg-slate-100 text-slate-400",   ring: "ring-slate-100",   pulse: false },
};

const STEP_LABELS = ["Personal", "Contact", "Additional", "Review"];

// ─── WebSocket hook ───────────────────────────────────────────────────────────
function useStaffSocket(onMessage) {
  const reconnectDelay = useRef(1000);
  const cancelledRef   = useRef(false);
  const [wsStatus, setWsStatus] = useState("connecting");

  useEffect(() => {
    let ws;
    cancelledRef.current = false;

    function connect() {
      setWsStatus("connecting");
      ws = new WebSocket(WS_URL);
      ws.onopen = () => { setWsStatus("connected"); reconnectDelay.current = 1000; };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "heartbeat" || data.type === "submit") onMessage(data);
        } catch { console.warn("StaffPage: unparseable message", event.data); }
      };
      ws.onerror = () => setWsStatus("error");
      ws.onclose = () => {
        if (cancelledRef.current) return;
        setWsStatus("reconnecting");
        setTimeout(() => { if (!cancelledRef.current) connect(); reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000); }, reconnectDelay.current);
      };
    }

    connect();
    return () => { cancelledRef.current = true; ws?.close(); };
  }, [onMessage]);

  return wsStatus;
}

// ─── Patient card ─────────────────────────────────────────────────────────────
function PatientCard({ patient, now }) {
  const [expanded, setExpanded] = useState(false);
  const status = deriveStatus(patient, now);
  const meta   = STATUS_META[status];

  const fullName       = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ") || "Unknown Patient";
  const initials       = [(patient.firstName?.[0] ?? ""), (patient.lastName?.[0] ?? "")].join("").toUpperCase() || "?";
  const age            = patient.dob ? Math.floor((Date.now() - new Date(patient.dob)) / (365.25 * 24 * 3600 * 1000)) : null;
  const displayGender   = patient.gender   === "Other" ? patient.genderOther   : patient.gender;
  const displayLanguage = patient.language === "Other" ? patient.languageOther : patient.language;
  const displayReligion = patient.religion === "Other" ? patient.religionOther : patient.religion;
  const displayAddress  = [patient.addressLine, patient.suburb, patient.state, patient.postcode, patient.country].filter(Boolean).join(", ");

  return (
    <div className={`group bg-white rounded-2xl border transition-all duration-300 ${expanded ? `shadow-md ring-2 ${meta.ring}` : "shadow-sm border-slate-100 hover:shadow-md hover:border-slate-200"}`}>
      <button onClick={() => setExpanded(v => !v)} className="w-full text-left px-5 py-4 flex items-center gap-4">
        <div className={`relative w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${meta.avatar}`}>
          {initials}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${meta.dot}`}>
            {meta.pulse && <span className={`absolute inset-0 rounded-full ${meta.dot} opacity-70 animate-ping`} />}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm">{fullName}</span>
            {age !== null && <span className="text-xs text-slate-400">Age {age}</span>}
            {displayGender && <span className="text-xs text-slate-400">· {displayGender}</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${meta.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />{meta.label}
            </span>
            {status === "active" && patient.step !== undefined && (
              <span className="text-[11px] text-slate-400">{STEP_LABELS[patient.step] ?? `Step ${patient.step + 1}`} · {patient.step + 1} of 4</span>
            )}
            {status === "submitted" && patient.createdAt && (
              <span className="text-[11px] text-slate-400">{new Date(patient.createdAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</span>
            )}
          </div>
        </div>

        <svg className={`w-4 h-4 text-slate-300 flex-shrink-0 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 pb-5 pt-1 border-t border-slate-100">
          {status === "active" && (
            <div className="mt-3 mb-4 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Patient is currently on the <span className="font-semibold mx-1">{STEP_LABELS[patient.step] ?? "form"}</span> step. Full details available after submission.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mt-3">
            <DetailSection title="Personal">
              <DetailRow label="Full Name"     value={fullName} />
              <DetailRow label="Date of Birth" value={patient.dob ? new Date(patient.dob).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : null} />
              <DetailRow label="Gender"        value={displayGender} />
            </DetailSection>
            <DetailSection title="Contact">
              <DetailRow label="Phone"   value={patient.phone} />
              <DetailRow label="Email"   value={patient.email} />
              <DetailRow label="Address" value={displayAddress || null} />
            </DetailSection>
            <DetailSection title="Additional">
              <DetailRow label="Language"    value={displayLanguage} />
              <DetailRow label="Nationality" value={patient.nationality} />
              <DetailRow label="Religion"    value={displayReligion} />
            </DetailSection>
            {patient.emergencyName && (
              <DetailSection title="Emergency Contact">
                <DetailRow label="Name"         value={patient.emergencyName} />
                <DetailRow label="Relationship" value={patient.emergencyRelationship} />
              </DetailSection>
            )}
          </div>
          {patient.createdAt && status === "submitted" && (
            <p className="mt-4 text-[11px] text-slate-400 border-t border-slate-100 pt-3">
              Submitted {new Date(patient.createdAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, children }) {
  return <div className="mb-4"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">{title}</p><div className="space-y-1.5">{children}</div></div>;
}
function DetailRow({ label, value }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-slate-400 w-28 flex-shrink-0 pt-px">{label}</span>
      <span className={`font-medium break-all ${value ? "text-slate-700" : "text-slate-300 italic"}`}>{value || "Not provided"}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const [patients, setPatients] = useState({});
  const [now, setNow]           = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(id);
  }, []);

  const handleMessage = useCallback((data) => {
    setPatients((prev) => ({
      ...prev,
      [data.id]: { ...prev[data.id], ...data, lastSeen: Date.now() },
    }));
  }, []);

  const wsStatus = useStaffSocket(handleMessage);

  const list   = Object.values(patients);
  const ORDER  = { active: 0, submitted: 1, inactive: 2 };
  const sorted = [...list].sort((a, b) => {
    const sa = deriveStatus(a, now), sb = deriveStatus(b, now);
    if (ORDER[sa] !== ORDER[sb]) return ORDER[sa] - ORDER[sb];
    return b.lastSeen - a.lastSeen;
  });

  const counts = {
    active:    list.filter(p => deriveStatus(p, now) === "active").length,
    submitted: list.filter(p => deriveStatus(p, now) === "submitted").length,
    inactive:  list.filter(p => deriveStatus(p, now) === "inactive").length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <Navbar pageType="staff" />

      <div className="flex-1 p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Patient Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">Real-time patient registration monitor.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${wsStatus === "connected" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : wsStatus === "error" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                ● {wsStatus === "connected" ? "Live" : wsStatus}
              </span>
              {counts.active    > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{counts.active} filling in</span>}
              {counts.submitted > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{counts.submitted} submitted</span>}
              {counts.inactive  > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">{counts.inactive} inactive</span>}
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">Waiting for patients…</p>
              <p className="text-slate-300 text-xs mt-1">Submissions and activity will appear here in real time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((p) => <PatientCard key={p.id} patient={p} now={now} />)}
            </div>
          )}

          <p className="text-center text-xs text-slate-300 mt-10">Patient data is confidential · Staff use only</p>
        </div>
      </div>
    </div>
  );
}
