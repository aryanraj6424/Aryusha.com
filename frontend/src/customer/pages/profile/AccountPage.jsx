import { useState, useEffect } from "react";
import { User, Phone, Mail, Save, Loader2 } from "lucide-react";
import { useToast } from "../../../components/Toast";
import { updateProfile } from "../../../services/authApi";

/* ─── Field component matching the project's rounded card style ─── */
function Field({ label, id, icon: Icon, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={16} />
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({ fullName: "", phoneNumber: "", email: "" });
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /* Load current user from localStorage on mount */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    try {
      const user = JSON.parse(stored);
      setFormData({
        fullName:    user.fullName || user.name || "",
        phoneNumber: user.phoneNumber || "",
        email:       user.email || "",
      });
      setIsGoogleUser(user.provider === "google" || !!user.googleId);
    } catch {
      /* ignore parse errors */
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = "Full name is required.";
    }
    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber.trim())) {
      errs.phoneNumber = "Enter a valid 10-digit phone number.";
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      setLoading(true);
      const { user: updatedUser } = await updateProfile({
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
      });

      /* Persist updated user back into localStorage */
      const stored = localStorage.getItem("user");
      if (stored) {
        const existing = JSON.parse(stored);
        localStorage.setItem("user", JSON.stringify({ ...existing, ...updatedUser }));
        window.dispatchEvent(new Event("auth-updated"));
      }

      showToast({ type: "success", message: "Profile updated successfully!" });
    } catch (error) {
      showToast({
        type: "error",
        message: error?.response?.data?.message || error?.message || "Failed to update profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full border rounded-xl py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white";

  return (
    <div className="max-w-2xl mx-auto py-5 px-0 sm:px-5">
      <h2 className="text-2xl font-bold mb-5">My Account</h2>

      <div className="bg-white rounded-2xl shadow p-6 space-y-5">
        {/* Full Name */}
        <Field label="Full Name" id="account-name" icon={User}>
          <input
            id="account-name"
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            className={`${inputBase} ${errors.fullName ? "border-red-400 bg-red-50" : "border-gray-200"}`}
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
        </Field>

        {/* Phone Number */}
        <Field label="Phone Number" id="account-phone" icon={Phone}>
          <input
            id="account-phone"
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="10-digit phone number"
            maxLength={10}
            className={`${inputBase} ${errors.phoneNumber ? "border-red-400 bg-red-50" : "border-gray-200"}`}
          />
          {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
        </Field>

        {/* Email — read-only for Google accounts */}
        <Field label={`Email ${isGoogleUser ? "(Google account — read only)" : ""}`} id="account-email" icon={Mail}>
          <input
            id="account-email"
            type="email"
            name="email"
            value={formData.email}
            readOnly
            placeholder="Email address"
            className={`${inputBase} border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed`}
          />
          {isGoogleUser && (
            <p className="text-xs text-gray-400 mt-1">
              Email is managed by Google and cannot be changed here.
            </p>
          )}
        </Field>

        {/* Save button */}
        <button
          id="account-save-btn"
          onClick={handleSave}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[#6B21D9] hover:bg-[#5B18C2] active:scale-[0.98] text-white font-bold px-8 py-3 rounded-xl shadow-md shadow-purple-200 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Saving...</>
          ) : (
            <><Save size={16} /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
}