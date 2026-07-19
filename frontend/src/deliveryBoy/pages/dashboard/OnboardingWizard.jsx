import { useState, useEffect } from "react";
import axios from "axios";
import { Check, ShieldCheck, Upload, Play, AlertCircle, FileText, CheckCircle2, RefreshCw, X } from "lucide-react";

export default function OnboardingWizard({ rider, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Form States
  const [otp, setOtp] = useState("");
  const [vehicle, setVehicle] = useState("own_bike");
  const [shift, setShift] = useState("Morning");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [bank, setBank] = useState({ accountNumber: "", ifscCode: "", accountHolderName: "", passbookImage: "" });
  const [docs, setDocs] = useState({ aadhaar: "", pan: "", driving_license: "", vehicle_rc: "", insurance: "", photo: "", selfie: "" });
  const [signingName, setSigningName] = useState("");
  const [agreementChecked, setAgreementChecked] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("deliveryBoyToken");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/delivery-boy/onboarding-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOnboardingData(res.data);
        setEmail(res.data.email || "");
        setCity(res.data.city || "");
        setAddress(res.data.preferredWorkingLocation?.address || "");
        setShift(res.data.preferredShift !== "None" ? res.data.preferredShift : "Morning");
        setVehicle(res.data.vehicleTypeSelection !== "none" ? res.data.vehicleTypeSelection : "own_bike");
        if (res.data.bankDetails) setBank(res.data.bankDetails);
        
        // Map existing docs
        const mappedDocs = { ...docs };
        (res.data.documents || []).forEach(d => {
          mappedDocs[d.docType] = d.fileUrl;
        });
        setDocs(mappedDocs);

        // Compute step based on status
        const statusSteps = {
          signup_pending: 1,
          kyc_pending: 3, // Selection & upload grouped
          kyc_verified: 4,
          training_pending: 4,
          training_completed: 5, // Store assigned
          agreement_pending: 5,
          active: 6
        };
        setCurrentStep(statusSteps[res.data.onboardingStatus] || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/delivery-boy/auth/verify-otp`, {
        phone: rider.phone,
        otp
      });
      if (res.data.success) {
        setMessage({ type: "success", text: "Phone verified! Let's fill out your profile." });
        fetchStatus();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Invalid OTP code." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadFile = async (e, field, isBank = false) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "riders_kyc");

      const token = localStorage.getItem("deliveryBoyToken");
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/upload`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.success) {
        if (isBank) {
          setBank({ ...bank, [field]: res.data.url });
        } else {
          setDocs({ ...docs, [field]: res.data.url });
        }
        setMessage({ type: "success", text: "File uploaded successfully!" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to upload file." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveKyc = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = localStorage.getItem("deliveryBoyToken");
      
      // Save vehicle type first
      await axios.put(
        `${import.meta.env.VITE_API_URL}/delivery-boy/vehicle`,
        { vehicleTypeSelection: vehicle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Submit Kyc Details
      const docPayload = Object.keys(docs)
        .filter(key => docs[key])
        .map(key => ({
          docType: key,
          fileUrl: docs[key],
          fileType: docs[key].endsWith(".pdf") ? "pdf" : "image"
        }));

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/delivery-boy/kyc`,
        {
          email,
          city,
          preferredShift: shift,
          preferredWorkingLocation: { address, latitude: 28.61, longitude: 77.20 },
          bankDetails: bank,
          documents: docPayload
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMessage({ type: "success", text: "KYC documents submitted for review!" });
        fetchStatus();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save profile." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTrainingModule = async (moduleName) => {
    try {
      const token = localStorage.getItem("deliveryBoyToken");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/delivery-boy/training`,
        { moduleName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        fetchStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignAgreement = async (e) => {
    e.preventDefault();
    if (!agreementChecked || !signingName) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem("deliveryBoyToken");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/delivery-boy/sign-agreement`,
        { typedName: signingName, signed: agreementChecked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        onComplete(); // refresh parent profile context
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Verification failed." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-slate-400 font-bold">
        <RefreshCw className="animate-spin mr-2" size={16} /> Loading onboarding steps...
      </div>
    );
  }

  const stepLabels = ["Phone Verified", "Vehicle Class", "KYC Verification", "Training Modules", "E-Sign Contract"];

  return (
    <div className="space-y-6 pt-2">
      
      {/* Step Stepper Header */}
      <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-2xl">
        {stepLabels.map((lbl, i) => (
          <div key={lbl} className="flex flex-col items-center flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
              currentStep > i + 1 
                ? "bg-emerald-500 text-white" 
                : currentStep === i + 1 
                ? "bg-[#6d28d9] text-white" 
                : "bg-slate-200 text-slate-550"
            }`}>
              {currentStep > i + 1 ? "✓" : i + 1}
            </div>
            <span className="text-[8px] font-black text-slate-400 mt-1 uppercase text-center hidden md:inline">{lbl}</span>
          </div>
        ))}
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs font-bold border flex justify-between items-center ${
          message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-red-50 text-red-800 border-red-100"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="hover:opacity-75"><X size={12} /></button>
        </div>
      )}

      {/* Step 1: Sign up Phone Verification */}
      {currentStep === 1 && (
        <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="text-center space-y-1.5">
            <ShieldCheck size={36} className="text-[#6d28d9] mx-auto" />
            <h2 className="font-extrabold text-slate-800 text-sm">Verify Phone Number</h2>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              We have printed a registration validation OTP to the console logs. Enter the OTP below to authenticate.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              placeholder="Enter 4-Digit OTP Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center tracking-widest border border-slate-200 p-3 rounded-2xl text-md font-bold focus:border-[#6d28d9] outline-none"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl font-black bg-[#6d28d9] hover:bg-[#5b21b6] text-white transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              Verify OTP Code
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Vehicle selection, KYC Uploads & bank info */}
      {currentStep === 3 && (
        <form onSubmit={handleSaveKyc} className="space-y-4">
          
          {/* Vehicle type */}
          <div className="bg-white border border-slate-105 rounded-3xl p-5 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2">Step 2.1: Vehicle Selection</h3>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Do you own a vehicle?</label>
              <select
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-semibold outline-none focus:border-[#6d28d9] bg-white"
              >
                <option value="own_bike">Yes, I ride my own Motorbike</option>
                <option value="scooter">Yes, Scooter</option>
                <option value="e_rickshaw">E-Rickshaw</option>
                <option value="electric_vehicle">Electric Vehicle</option>
                <option value="bicycle">No, I deliver on a Bicycle (Short-Distance Zones)</option>
              </select>
            </div>
          </div>

          {/* Profile particulars */}
          <div className="bg-white border border-slate-105 rounded-3xl p-5 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2">Step 2.2: Profile Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-650 bg-slate-50/50"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-650 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Home Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-650 bg-slate-50/50"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Preferred Shift</label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-semibold outline-none focus:border-[#6d28d9] bg-white"
                >
                  <option value="Morning">Morning Shift (6 AM - 2 PM)</option>
                  <option value="Afternoon">Afternoon Shift (2 PM - 10 PM)</option>
                  <option value="Evening">Evening Shift (6 PM - Midnight)</option>
                  <option value="Night">Night Shift (10 PM - 6 AM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* KYC Documents upload list */}
          <div className="bg-white border border-slate-105 rounded-3xl p-5 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2">Step 2.3: Documents KYC</h3>
            
            <div className="space-y-3">
              {[
                { key: "aadhaar", label: "Aadhaar Card Copy", req: true },
                { key: "pan", label: "PAN Card Copy", req: true },
                { key: "driving_license", label: "Driving License", req: vehicle !== "bicycle" },
                { key: "vehicle_rc", label: "Vehicle RC", req: vehicle !== "bicycle" },
                { key: "insurance", label: "Vehicle Insurance", req: vehicle !== "bicycle" },
                { key: "photo", label: "Passport Photo", req: true },
                { key: "selfie", label: "Selfie Image", req: true }
              ].map(item => {
                if (!item.req) return null;
                const isUploaded = !!docs[item.key];
                return (
                  <div key={item.key} className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-150">
                    <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    <div className="flex items-center gap-2">
                      {isUploaded ? (
                        <span className="text-[10px] text-green-700 font-extrabold bg-green-50 px-2 py-0.5 rounded border border-green-150 uppercase">Uploaded</span>
                      ) : (
                        <label className="px-3 py-1 bg-[#6d28d9] hover:bg-[#5b21b6] text-white font-bold text-[10px] rounded-lg shadow cursor-pointer transition flex items-center gap-1 uppercase">
                          <Upload size={10} /> Upload <input type="file" onChange={(e) => handleUploadFile(e, item.key)} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bank particulars */}
          <div className="bg-white border border-slate-105 rounded-3xl p-5 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-2">Step 2.4: Payout Bank Account</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-black block">Account Holder Name</label>
                <input
                  type="text"
                  value={bank.accountHolderName}
                  onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-[#6d28d9] bg-slate-50/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-black block">Account Number</label>
                  <input
                    type="text"
                    value={bank.accountNumber}
                    onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-[#6d28d9] bg-slate-50/50"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-black block">IFSC Code</label>
                  <input
                    type="text"
                    value={bank.ifscCode}
                    onChange={(e) => setBank({ ...bank, ifscCode: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-[#6d28d9] bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-150">
                <span className="text-xs font-bold text-slate-700">Cheque / Passbook Image</span>
                {bank.passbookImage ? (
                  <span className="text-[10px] text-green-700 font-extrabold bg-green-50 px-2 py-0.5 rounded border border-green-150 uppercase">Uploaded</span>
                ) : (
                  <label className="px-3 py-1 bg-[#6d28d9] hover:bg-[#5b21b6] text-white font-bold text-[10px] rounded-lg shadow cursor-pointer transition flex items-center gap-1 uppercase">
                    <Upload size={10} /> Upload <input type="file" onChange={(e) => handleUploadFile(e, "passbookImage", true)} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {onboardingData.onboardingStatus === "kyc_pending" && (
            <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-2xl flex items-start gap-2.5 text-xs font-bold leading-relaxed">
              <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                Documents submitted. Pending verification review by Aryusha Admin. You will receive a notification as soon as each document is reviewed.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl font-black bg-[#6d28d9] hover:bg-[#5b21b6] text-white transition shadow-md disabled:opacity-50 cursor-pointer text-sm uppercase tracking-wider"
          >
            {submitting ? "Uploading Documents..." : "Submit Profile & Documents"}
          </button>
        </form>
      )}

      {/* Step 4: Training playlist trackers */}
      {currentStep === 4 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="font-extrabold text-slate-800 text-sm">Step 3: Training Modules</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
              Watch all training videos to understand QuickKart procedures before store assignment.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Using the delivery app",
              "Order pickup process",
              "COD handling",
              "Safety guidelines",
              "Delivery timing expectations"
            ].map((moduleName) => {
              const isCompleted = (onboardingData.trainingChecklist || []).some(t => t.moduleName === moduleName && t.completed);
              return (
                <div key={moduleName} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-700">{moduleName}</h4>
                    <span className="text-[9px] font-semibold text-slate-450 block">Video Length: 2 mins</span>
                  </div>
                  {isCompleted ? (
                    <span className="text-[10px] text-green-700 font-extrabold bg-green-50 px-2.5 py-1 rounded border border-green-150 flex items-center gap-1 uppercase">
                      ✓ Done
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCompleteTrainingModule(moduleName)}
                      className="px-3 py-1.5 bg-[#6d28d9] hover:bg-[#5b21b6] text-white font-bold text-[10px] rounded-lg shadow transition flex items-center gap-1 cursor-pointer uppercase"
                    >
                      <Play size={10} className="fill-white" /> Watch Video
                    </button>
                  )}
                </div>
              );
            })}

            {/* In person checklist module */}
            <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-700">Customer interaction (In-Person Interview)</h4>
                <span className="text-[9px] font-semibold text-slate-450 block">Trainer signoff evaluation</span>
              </div>
              {((onboardingData.trainingChecklist || []).some(t => t.moduleName === "Customer interaction" && t.completed)) ? (
                <span className="text-[10px] text-green-700 font-extrabold bg-green-50 px-2.5 py-1 rounded border border-green-150 flex items-center gap-1 uppercase">
                  ✓ Passed
                </span>
              ) : (
                <span className="text-[10px] text-amber-600 font-extrabold bg-amber-50 px-2.5 py-1 rounded border border-amber-150 uppercase">
                  Pending Trainer Signoff
                </span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Step 5: E-Agreement E-Sign */}
      {currentStep === 5 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="font-extrabold text-slate-800 text-sm">Step 4: Sign Delivery Agreement</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              You have been assigned to dark store: <strong className="text-green-800">{onboardingData.assignedStore?.shopName}</strong>
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 h-64 overflow-y-auto text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50 space-y-3">
            <h4 className="font-black text-slate-800 text-xs border-b border-slate-200 pb-1 uppercase">Rider Service Contract</h4>
            <p>1. <strong>Delivery Rates & Wallet Payouts:</strong> Aryusha.com credits payouts on a per-order basis (standard delivery rates plus incentives). All wallet balances will be settled in your linked bank account.</p>
            <p>2. <strong>Delivery Performance & Latency:</strong> Standard deliveries must be completed within 45 minutes of pickup coordinates receipt. Consistent delay margins may review account access privileges.</p>
            <p>3. <strong>Cash on Delivery (COD) Rules:</strong> Any cash amounts collected from customers must be brought back to the assigned dark store cashier on or before shift closure.</p>
            <p>4. <strong>Code of Conduct:</strong> Respect customer privacy. Maintain safety protocols while transit.</p>
          </div>

          <form onSubmit={handleSignAgreement} className="space-y-4">
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="agreement"
                checked={agreementChecked}
                onChange={(e) => setAgreementChecked(e.target.checked)}
                className="mt-0.5 cursor-pointer w-4 h-4 text-[#6d28d9] focus:ring-[#6d28d9] border-slate-300 rounded"
              />
              <label htmlFor="agreement" className="text-xs text-slate-650 font-semibold leading-relaxed cursor-pointer select-none">
                I agree to Aryusha's partner terms, delivery payouts rules, and COD policies.
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Type Full Name (Digital Signature)</label>
              <input
                type="text"
                placeholder="Digital signature name matches legal name"
                value={signingName}
                onChange={(e) => setSigningName(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-[#6d28d9]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !agreementChecked || !signingName}
              className="w-full py-3 rounded-2xl font-black bg-[#6d28d9] hover:bg-[#5b21b6] text-white transition shadow-md disabled:opacity-50 cursor-pointer text-sm uppercase tracking-wider"
            >
              Sign & Unlock Account
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
