"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";

// ─── Constants ────────────────────────────────────────────────────────────────
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";
const HEARTBEAT_INTERVAL = 4000;

const STEPS = ["Personal", "Contact", "Additional", "Review"];
const GENDERS       = ["Male", "Female", "Non-binary", "Prefer not to say", "Other"];
const LANGUAGES     = ["English", "Mandarin", "Arabic", "Spanish", "French", "Hindi", "Portuguese", "Other"];
const RELIGIONS     = ["Christianity", "Islam", "Hinduism", "Buddhism", "Judaism", "Sikhism", "No religion", "Prefer not to say", "Other"];
const RELATIONSHIPS = ["Spouse", "Parent", "Child", "Sibling", "Friend", "Guardian", "Other"];

const initialForm = {
  firstName: "", middleName: "", lastName: "",
  dob: "", gender: "", genderOther: "",
  phone: "", email: "",
  addressLine: "", suburb: "", state: "", postcode: "", country: "",
  language: "", languageOther: "",
  nationality: "",
  emergencyName: "", emergencyRelationship: "",
  religion: "", religionOther: "",
};

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(form, step) {
  const errors = {};
  if (step === 0) {
    if (!form.firstName.trim()) errors.firstName = "First name is required.";
    else if (!/^[A-Za-z\s'-]{2,}$/.test(form.firstName.trim())) errors.firstName = "Enter a valid first name.";
    if (!form.lastName.trim()) errors.lastName = "Last name is required.";
    else if (!/^[A-Za-z\s'-]{2,}$/.test(form.lastName.trim())) errors.lastName = "Enter a valid last name.";
    if (!form.dob) errors.dob = "Date of birth is required.";
    else {
      const d = new Date(form.dob), now = new Date();
      if (d >= now) errors.dob = "Date of birth must be in the past.";
      else if (now.getFullYear() - d.getFullYear() > 130) errors.dob = "Enter a valid date of birth.";
    }
    if (!form.gender) errors.gender = "Please select a gender.";
    if (form.gender === "Other" && !form.genderOther.trim()) errors.genderOther = "Please specify.";
  }
  if (step === 1) {
    if (!form.phone.trim()) errors.phone = "Phone number is required.";
    else if (!/^[\d\s+\-()\\.]{7,15}$/.test(form.phone.trim())) errors.phone = "Enter a valid phone number.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
    if (!form.addressLine.trim()) errors.addressLine = "Street address is required.";
    if (!form.suburb.trim()) errors.suburb = "Suburb / City is required.";
    if (!form.country.trim()) errors.country = "Country is required.";
  }
  if (step === 2) {
    if (!form.language) errors.language = "Please select a preferred language.";
    if (form.language === "Other" && !form.languageOther.trim()) errors.languageOther = "Please specify.";
    if (!form.nationality.trim()) errors.nationality = "Nationality is required.";
  }
  return errors;
}

// ─── WebSocket hook ───────────────────────────────────────────────────────────
function usePatientSocket() {
  const wsRef            = useRef(null);
  const sessionId        = useRef(crypto.randomUUID());
  const heartbeatTimer   = useRef(null);
  const reconnectDelay   = useRef(1000);
  const cancelledRef     = useRef(false);
  const pendingPayload   = useRef(null);

  const connect = useCallback(() => {
    if (cancelledRef.current) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => {
      reconnectDelay.current = 1000;
      if (pendingPayload.current) { ws.send(pendingPayload.current); pendingPayload.current = null; }
    };
    ws.onclose = () => {
      if (cancelledRef.current) return;
      setTimeout(connect, reconnectDelay.current);
      reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
    };
    ws.onerror  = () => ws.close();
    ws.onmessage = () => {};
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    connect();
    return () => { cancelledRef.current = true; clearInterval(heartbeatTimer.current); wsRef.current?.close(); };
  }, [connect]);

  const safeSend = useCallback((payload) => {
    const raw = JSON.stringify(payload);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(raw);
    else pendingPayload.current = raw;
  }, []);

  const startHeartbeat = useCallback((step, firstName, lastName) => {
    clearInterval(heartbeatTimer.current);
    const ping = () => safeSend({ type: "heartbeat", id: sessionId.current, status: "active", step, firstName, lastName, createdAt: new Date().toISOString() });
    ping();
    heartbeatTimer.current = setInterval(ping, HEARTBEAT_INTERVAL);
  }, [safeSend]);

  const stopHeartbeat = useCallback(() => clearInterval(heartbeatTimer.current), []);

  const submitForm = useCallback((form) => {
    stopHeartbeat();
    safeSend({ type: "submit", id: sessionId.current, status: "submitted", ...form, createdAt: new Date().toISOString() });
  }, [safeSend, stopHeartbeat]);

  return { startHeartbeat, stopHeartbeat, submitForm };
}

// ─── UI primitives ────────────────────────────────────────────────────────────
function Field({ label, error, optional, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold tracking-widest uppercase text-slate-500">
        {label}{optional && <span className="ml-1 font-normal normal-case tracking-normal text-slate-400">(optional)</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-500 mt-0.5">{error}</p>}
    </div>
  );
}
const inputCls  = (e) => `w-full px-4 py-3 rounded-xl border text-sm text-slate-800 bg-white outline-none transition-all duration-200 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 placeholder:text-slate-300 ${e ? "border-rose-400 bg-rose-50" : "border-slate-200 hover:border-slate-300"}`;
const selectCls = (e) => `w-full px-4 py-3 rounded-xl border text-sm text-slate-800 bg-white outline-none appearance-none transition-all duration-200 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 ${e ? "border-rose-400 bg-rose-50" : "border-slate-200 hover:border-slate-300"}`;

function ChevronDown() {
  return <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg></div>;
}
function SectionTitle({ icon, title }) {
  return <div className="flex items-center gap-2 mb-2"><span className="text-lg">{icon}</span><h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2></div>;
}
function ReviewSection({ title, children }) {
  return <div className="p-4"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">{title}</p><div className="space-y-2">{children}</div></div>;
}
function ReviewRow({ label, value }) {
  return <div className="flex gap-3 text-sm"><span className="text-slate-400 w-36 flex-shrink-0">{label}</span><span className="text-slate-700 font-medium break-all">{value || "—"}</span></div>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PatientPage() {
  const [form, setForm]           = useState(initialForm);
  const [step, setStep]           = useState(0);
  const [errors, setErrors]       = useState({});
  const [submitted, setSubmitted] = useState(false);

  const { startHeartbeat, stopHeartbeat, submitForm } = usePatientSocket();

  useEffect(() => {
    if (submitted) return;
    startHeartbeat(step, form.firstName, form.lastName);
    return () => stopHeartbeat();
  }, [step, form.firstName, form.lastName, submitted, startHeartbeat, stopHeartbeat]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const next = () => {
    const errs = validate(form, step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setStep((s) => s + 1);
  };
  const back = () => { setErrors({}); setStep((s) => s - 1); };

  const handleSubmit = () => {
    const errs = validate(form, step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    submitForm(form);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-teal-50">
        <Navbar pageType="patient" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Form Submitted</h2>
            <p className="text-slate-500 text-sm mb-8">Thank you, <span className="font-semibold text-slate-700">{form.firstName}</span>. Your information has been received. A staff member will be with you shortly.</p>
            <button onClick={() => { setForm(initialForm); setStep(0); setSubmitted(false); }} className="text-sm text-teal-600 hover:text-teal-700 underline underline-offset-2">Submit another response</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-teal-50/40">
      <Navbar pageType="patient" />

      <div className="flex-1 flex flex-col items-center justify-start py-10 px-4">
        {/* Header */}
        <div className="w-full max-w-2xl mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight tracking-tight">Registration Form</h1>
          <p className="text-slate-500 text-sm mt-1">Please fill in your details accurately. Fields marked optional can be skipped.</p>
        </div>

        {/* Step indicator */}
        <div className="w-full max-w-2xl mb-8">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${i < step ? "bg-teal-600 text-white" : i === step ? "bg-teal-600 text-white ring-4 ring-teal-100" : "bg-slate-100 text-slate-400"}`}>
                    {i < step ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg> : i + 1}
                  </div>
                  <span className={`text-[10px] font-semibold tracking-widest uppercase hidden sm:block ${i === step ? "text-teal-600" : "text-slate-400"}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${i < step ? "bg-teal-500" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg shadow-slate-100 border border-slate-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />

          <div className="p-6 sm:p-10">
            {step === 0 && (
              <div className="space-y-6">
                <SectionTitle icon="👤" title="Personal Information" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="First Name" error={errors.firstName}><input value={form.firstName} onChange={set("firstName")} placeholder="Jane" className={inputCls(errors.firstName)} /></Field>
                  <Field label="Middle Name" optional><input value={form.middleName} onChange={set("middleName")} placeholder="Marie" className={inputCls(false)} /></Field>
                  <Field label="Last Name" error={errors.lastName}><input value={form.lastName} onChange={set("lastName")} placeholder="Doe" className={inputCls(errors.lastName)} /></Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Date of Birth" error={errors.dob}><input type="date" value={form.dob} onChange={set("dob")} max={new Date().toISOString().split("T")[0]} className={inputCls(errors.dob)} /></Field>
                  <Field label="Gender" error={errors.gender}><div className="relative"><select value={form.gender} onChange={set("gender")} className={selectCls(errors.gender)}><option value="">Select gender</option>{GENDERS.map(g => <option key={g}>{g}</option>)}</select><ChevronDown /></div></Field>
                </div>
                {form.gender === "Other" && <Field label="Please Specify" error={errors.genderOther}><input value={form.genderOther} onChange={set("genderOther")} placeholder="Enter gender identity" className={inputCls(errors.genderOther)} /></Field>}
              </div>
            )}
            {step === 1 && (
              <div className="space-y-6">
                <SectionTitle icon="📞" title="Contact Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Phone Number" error={errors.phone}><input type="tel" value={form.phone} onChange={set("phone")} placeholder="+61 400 000 000" className={inputCls(errors.phone)} /></Field>
                  <Field label="Email Address" error={errors.email}><input type="email" value={form.email} onChange={set("email")} placeholder="jane@example.com" className={inputCls(errors.email)} /></Field>
                </div>
                <Field label="Street Address" error={errors.addressLine}><input value={form.addressLine} onChange={set("addressLine")} placeholder="123 Example Street" className={inputCls(errors.addressLine)} /></Field>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="col-span-2"><Field label="Suburb / City" error={errors.suburb}><input value={form.suburb} onChange={set("suburb")} placeholder="Sydney" className={inputCls(errors.suburb)} /></Field></div>
                  <Field label="State" optional><input value={form.state} onChange={set("state")} placeholder="NSW" className={inputCls(false)} /></Field>
                  <Field label="Postcode" optional><input value={form.postcode} onChange={set("postcode")} placeholder="2000" className={inputCls(false)} /></Field>
                </div>
                <Field label="Country" error={errors.country}><input value={form.country} onChange={set("country")} placeholder="Australia" className={inputCls(errors.country)} /></Field>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-6">
                <SectionTitle icon="🌐" title="Additional Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Preferred Language" error={errors.language}><div className="relative"><select value={form.language} onChange={set("language")} className={selectCls(errors.language)}><option value="">Select language</option>{LANGUAGES.map(l => <option key={l}>{l}</option>)}</select><ChevronDown /></div></Field>
                  <Field label="Nationality" error={errors.nationality}><input value={form.nationality} onChange={set("nationality")} placeholder="Australian" className={inputCls(errors.nationality)} /></Field>
                </div>
                {form.language === "Other" && <Field label="Specify Language" error={errors.languageOther}><input value={form.languageOther} onChange={set("languageOther")} placeholder="Your language" className={inputCls(errors.languageOther)} /></Field>}
                <Field label="Religion" optional><div className="relative"><select value={form.religion} onChange={set("religion")} className={selectCls(false)}><option value="">Select religion</option>{RELIGIONS.map(r => <option key={r}>{r}</option>)}</select><ChevronDown /></div></Field>
                {form.religion === "Other" && <Field label="Specify Religion" optional><input value={form.religionOther} onChange={set("religionOther")} placeholder="Your religion" className={inputCls(false)} /></Field>}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-4">Emergency Contact <span className="font-normal normal-case tracking-normal text-slate-300">(optional)</span></p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Contact Name" optional><input value={form.emergencyName} onChange={set("emergencyName")} placeholder="John Doe" className={inputCls(false)} /></Field>
                    <Field label="Relationship" optional><div className="relative"><select value={form.emergencyRelationship} onChange={set("emergencyRelationship")} className={selectCls(false)}><option value="">Select relationship</option>{RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}</select><ChevronDown /></div></Field>
                  </div>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-6">
                <SectionTitle icon="✅" title="Review & Submit" />
                <p className="text-sm text-slate-500">Please confirm your details before submitting.</p>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 overflow-hidden text-sm">
                  <ReviewSection title="Personal">
                    <ReviewRow label="Full Name" value={[form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ")} />
                    <ReviewRow label="Date of Birth" value={form.dob ? new Date(form.dob).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : ""} />
                    <ReviewRow label="Gender" value={form.gender === "Other" ? form.genderOther : form.gender} />
                  </ReviewSection>
                  <ReviewSection title="Contact">
                    <ReviewRow label="Phone" value={form.phone} />
                    <ReviewRow label="Email" value={form.email} />
                    <ReviewRow label="Address" value={[form.addressLine, form.suburb, form.state, form.postcode, form.country].filter(Boolean).join(", ")} />
                  </ReviewSection>
                  <ReviewSection title="Additional">
                    <ReviewRow label="Language" value={form.language === "Other" ? form.languageOther : form.language} />
                    <ReviewRow label="Nationality" value={form.nationality} />
                    <ReviewRow label="Religion" value={form.religion === "Other" ? form.religionOther : form.religion} />
                    <ReviewRow label="Emergency Contact" value={form.emergencyName ? `${form.emergencyName}${form.emergencyRelationship ? ` (${form.emergencyRelationship})` : ""}` : ""} />
                  </ReviewSection>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 sm:px-10 pb-8 flex items-center justify-between gap-4">
            {step > 0
              ? <button onClick={back} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>Back</button>
              : <div />}
            {step < STEPS.length - 1
              ? <button onClick={next} className="ml-auto flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm active:scale-95">Continue<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></button>
              : <button onClick={handleSubmit} className="ml-auto flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm active:scale-95">Submit Form<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg></button>}
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-400 text-center max-w-sm">Your information is kept strictly confidential and used solely for medical purposes.</p>
      </div>
    </div>
  );
}
