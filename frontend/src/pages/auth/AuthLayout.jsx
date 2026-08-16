import { useNavigate } from "react-router-dom";
import { ShieldCheck, Zap, Heart, Truck, Eye, EyeOff } from "lucide-react";

/* ─── Shared Form Input Field ────────────────────────────── */
export function InputField({ id, label, type, name, value, onChange, placeholder, icon: Icon, error, rightElement }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[11px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      <div className={`relative flex items-center bg-white rounded-2xl border transition-all duration-200 shadow-sm ${
        error 
          ? "border-red-400 bg-red-50/20 focus-within:ring-2 focus-within:ring-red-400/20" 
          : "border-purple-100 hover:border-purple-200 focus-within:border-[#0B2214] focus-within:ring-2 focus-within:ring-[#0B2214]/15"
      }`}>
        {Icon && (
          <span className="pl-4 text-[#0B2214] flex items-center justify-center pointer-events-none">
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full py-3.5 pl-3 pr-4 bg-transparent outline-none text-slate-900 font-semibold text-sm placeholder:text-slate-400 placeholder:font-normal"
        />
        {rightElement && (
          <span className="pr-4 flex items-center">
            {rightElement}
          </span>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-500 font-bold pl-1 mt-0.5">{error}</p>
      )}
    </div>
  );
}

/* ─── Password Toggle ────────────────────────────────────── */
export function PasswordToggle({ show, onToggle, label = "password" }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? `Hide ${label}` : `Show ${label}`}
      className="text-slate-400 hover:text-[#0B2214] transition-colors cursor-pointer"
    >
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}

/* ─── Divider ────────────────────────────────────────────── */
export function Divider() {
  return (
    <div className="relative my-5 sm:my-6">
      <div className="border-t border-purple-100" />
      <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
        OR
      </span>
    </div>
  );
}

/* ─── Google Button ──────────────────────────────────────── */
export function GoogleButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-slate-200 hover:border-purple-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-bold text-sm text-slate-800"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
        <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
        <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
        <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
      </svg>
      <span>Continue with Google</span>
    </button>
  );
}

/* ─── AuthLayout Main Component ─────────────────────────── */
export default function AuthLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAF9FF] md:bg-gradient-to-br md:from-[#F5F3FF] md:via-[#F8F7FF] md:to-[#EDE9FE] flex flex-col justify-between md:justify-center items-center font-sans">
      
      {/* ─── MOBILE NATIVE HEADER (< 768px) ─── */}
      <div className="w-full md:hidden bg-gradient-to-b from-[#0B2214]/10 via-[#F5F3FF]/60 to-white px-5 pt-8 pb-3 border-b border-purple-50/80 flex items-center justify-between">
        <img
          src="/aryushalogo.png"
          alt="Aryusha"
          onClick={() => navigate("/")}
          className="h-10 w-auto object-contain cursor-pointer active:scale-95 transition-transform"
        />
        <button
          onClick={() => navigate("/")}
          className="text-xs font-bold text-[#0B2214] bg-purple-100/60 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors"
        >
          Explore Store ➔
        </button>
      </div>

      {/* ─── MAIN CONTENT CONTAINER (Mobile Full Screen | Desktop 2-Column Card) ─── */}
      <div className="w-full flex-1 md:flex-initial md:max-w-4xl md:max-h-[92vh] md:rounded-[28px] md:overflow-hidden md:shadow-[0_20px_60px_rgba(107,33,217,0.14)] bg-white md:border md:border-purple-100/80 grid grid-cols-1 md:grid-cols-2 relative">
        
        {/* Left Column (Form Container) */}
        <div className="w-full min-h-[55vh] sm:min-h-[60vh] md:min-h-0 px-5 py-6 sm:p-7 lg:p-9 flex flex-col justify-between relative bg-white z-10 max-w-md mx-auto md:max-w-none">
          {/* Top Logo (Desktop Only) */}
          <div className="hidden md:block mb-5 lg:mb-6">
            <img
              src="/aryushalogo.png"
              alt="Aryusha"
              onClick={() => navigate("/")}
              className="h-10 lg:h-12 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
            />
          </div>

          {/* Children (Form Content) */}
          {children}
        </div>

        {/* Right Column (Hero Banner) - Desktop Only (≥ 768px) */}
        <div className="hidden md:flex relative bg-gradient-to-br from-[#0B2214] via-[#153e25] to-[#3B0764] flex-col justify-between p-6 lg:p-8 text-white overflow-hidden">
          {/* Grocery Hero Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/grocery-hero.png"
              alt="Fresh grocery delivery"
              className="w-full h-full object-cover object-center opacity-30 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B2214]/80 via-transparent to-[#3B0764]/90" />
          </div>

          {/* Top Banner Feature Badge */}
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white mb-4 shadow-lg shadow-black/10">
              <Truck size={24} className="text-white" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Same Day<br />Delivery
            </h2>
            <p className="text-white/85 text-xs font-medium mt-1.5 max-w-xs">
              Fresh vegetables, dairy, bakery &amp; more
            </p>
          </div>

          {/* Bottom Glassmorphism Trust Bar */}
          <div className="relative z-10 mt-6">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-white/60 grid grid-cols-3 gap-1 text-slate-800">
              
              {/* Badge 1: Trusted & Reliable */}
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-purple-100 flex items-center justify-center text-[#0B2214] flex-shrink-0">
                  <ShieldCheck size={16} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[10px] lg:text-[11px] font-black text-slate-900 leading-none">Trusted</p>
                  <p className="text-[8px] lg:text-[9px] text-slate-500 font-bold leading-tight mt-0.5">&amp; Reliable</p>
                </div>
              </div>

              {/* Badge 2: Fast & Efficient */}
              <div className="flex items-center gap-1.5 border-l border-slate-200/80 pl-1.5">
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-purple-100 flex items-center justify-center text-[#0B2214] flex-shrink-0">
                  <Zap size={16} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[10px] lg:text-[11px] font-black text-slate-900 leading-none">Fast</p>
                  <p className="text-[8px] lg:text-[9px] text-slate-500 font-bold leading-tight mt-0.5">&amp; Efficient</p>
                </div>
              </div>

              {/* Badge 3: Made for You */}
              <div className="flex items-center gap-1.5 border-l border-slate-200/80 pl-1.5">
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-purple-100 flex items-center justify-center text-[#0B2214] flex-shrink-0">
                  <Heart size={16} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[10px] lg:text-[11px] font-black text-slate-900 leading-none">Made for</p>
                  <p className="text-[8px] lg:text-[9px] text-slate-500 font-bold leading-tight mt-0.5">You</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ─── MOBILE FOOTER TRUST BAR (< 768px) ─── */}
      <div className="w-full md:hidden px-5 py-3.5 bg-white border-t border-purple-50 text-slate-500 text-[11px] font-bold">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#0B2214]" /> 100% Secure</span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5"><Zap size={14} className="text-[#0B2214]" /> Same Day Delivery</span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5"><Heart size={14} className="text-[#0B2214]" /> Easy Returns</span>
        </div>
      </div>

    </div>
  );
}
