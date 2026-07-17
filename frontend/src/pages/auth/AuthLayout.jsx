import { useNavigate } from "react-router-dom";
import { Timer, Award, ShieldCheck, RefreshCcw, Eye, EyeOff } from "lucide-react";

/* ── Trust strip data ─────────────────────────────────────── */
const TRUST_ITEMS = [
  { icon: Timer,       label: "10 Mins",    sub: "Lightning Fast"  },
  { icon: Award,       label: "Best Quality", sub: "Handpicked"     },
  { icon: ShieldCheck, label: "Safe & Secure", sub: "100% Protected" },
  { icon: RefreshCcw,  label: "Easy Returns",  sub: "Hassle Free"    },
];

/* ── Logo ─────────────────────────────────────────────────── */
function Logo({ onClick }) {
  return (
    <div
      className="flex items-center gap-3 cursor-pointer"
      onClick={onClick}
      role="link"
      aria-label="Go to homepage"
    >
      {/* Icon */}
      <div className="w-12 h-12 bg-[#6B21D9] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-300/40 hover:scale-105 transition-transform duration-200">
        <span className="text-white text-xl font-black tracking-tighter">a</span>
      </div>
      {/* Wordmark */}
      <div>
        <p className="text-2xl font-black text-[#1F2937] tracking-tight leading-none">
          aryusha.com
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B21D9] mt-0.5">
          Quick. Easy. Reliable.
        </p>
      </div>
    </div>
  );
}

/* ── Trust strip (mobile-first, shown below card) ─────────── */
function TrustStrip() {
  return (
    <div className="bg-[#F5F3FF] border-t border-purple-100 px-4 py-5">
      {/* 4-icon row */}
      <div className="grid grid-cols-4 gap-2">
        {TRUST_ITEMS.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center text-center gap-1">
            <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <Icon size={16} className="text-[#6B21D9]" strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-bold text-[#1F2937] leading-tight">{label}</span>
            <span className="text-[9px] text-[#6B7280] leading-tight">{sub}</span>
          </div>
        ))}
      </div>

      {/* Security line */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        <ShieldCheck size={12} className="text-[#6B21D9]" strokeWidth={2} />
        <span className="text-[10px] text-[#6B7280] font-medium">
          Secured by industry-leading security
        </span>
      </div>
    </div>
  );
}

/**
 * AuthLayout — shared shell for Login & Signup.
 *
 * Mobile  : hero grocery photo + dark overlay (top ~35%) → white bottom-sheet card → trust strip
 * Desktop : centered two-column card (form left | grocery photo right)
 */
/* ─── Shared form sub-components ─────────────────────────────
   Exported so LoginPage & SignupPage can import without duplication.
──────────────────────────────────────────────────────────────── */

export function InputField({ id, label, type, name, value, onChange, placeholder, icon: Icon, error, rightElement }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9CA3AF] pointer-events-none">
          <Icon size={16} strokeWidth={2} />
        </span>
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-medium text-[#1F2937] placeholder-[#9CA3AF] bg-white outline-none transition-all duration-200
            focus:ring-2 focus:ring-[#6B21D9]/20 focus:border-[#6B21D9]
            ${error ? "border-red-400 bg-red-50/40" : "border-[#E5E7EB] hover:border-[#C4B5FD]"}`}
        />
        {rightElement && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3.5">
            {rightElement}
          </span>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}

export function PasswordToggle({ show, onToggle, label = "password" }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? `Hide ${label}` : `Show ${label}`}
      className="text-[#9CA3AF] hover:text-[#6B21D9] transition-colors cursor-pointer"
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

export function Divider() {
  return (
    <div className="relative my-5">
      <div className="border-t border-[#E5E7EB]" />
      <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-[#9CA3AF] text-xs font-bold uppercase tracking-widest">
        OR
      </span>
    </div>
  );
}

export function GoogleButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
        <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
        <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
        <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
      </svg>
      <span className="text-sm font-bold text-[#1F2937]">Continue with Google</span>
    </button>
  );
}

/* ─── AuthLayout ────────────────────────────────────────────── */

export default function AuthLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col font-sans">

      {/* ─── MOBILE LAYOUT (< 768px) ──────────────────────────────── */}
      <div className="md:hidden flex flex-col min-h-screen">

        {/* Hero image + overlay (top ~38%) */}
        <div className="relative h-[38vh] flex-shrink-0 overflow-hidden">
          <img
            src="/grocery-hero.png"
            alt="Fresh grocery delivery"
            className="w-full h-full object-cover object-center"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-transparent" />

          {/* Logo centered over image */}
          <div className="absolute top-0 left-0 right-0 flex justify-center pt-10">
            <Logo onClick={() => navigate("/")} />
          </div>
        </div>

        {/* White bottom-sheet card */}
        <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 overflow-y-auto shadow-[0_-4px_30px_rgba(107,33,217,0.12)]">
          <div className="px-6 pt-7 pb-8">
            {children}
          </div>
        </div>

        {/* Trust strip */}
        <TrustStrip />
      </div>

      {/* ─── DESKTOP LAYOUT (≥ 768px) ─────────────────────────────── */}
      <div className="hidden md:flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-5xl rounded-[24px] overflow-hidden shadow-[0_24px_60px_rgba(107,33,217,0.14)] bg-white grid grid-cols-2 min-h-[600px]">

          {/* Left — form column */}
          <div className="flex flex-col justify-center px-10 py-12">
            {/* Logo at top of form */}
            <div className="mb-8">
              <Logo onClick={() => navigate("/")} />
            </div>
            {children}
          </div>

          {/* Right — grocery photo */}
          <div className="relative overflow-hidden">
            <img
              src="/grocery-hero.png"
              alt="Fresh grocery delivery"
              className="w-full h-full object-cover object-center"
            />
            {/* Subtle purple tint overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#6B21D9]/30 to-transparent" />
            {/* Bottom caption */}
            <div className="absolute bottom-8 left-6 right-6">
              <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-5 py-4">
                <p className="text-white font-black text-lg leading-tight drop-shadow">
                  Groceries delivered in minutes 🛒
                </p>
                <p className="text-white/80 text-xs font-medium mt-1">
                  Fresh vegetables, dairy, bakery & more
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
