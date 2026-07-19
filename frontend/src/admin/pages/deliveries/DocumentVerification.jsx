import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { CheckCircle, AlertTriangle, User, RefreshCw, X, ShieldAlert, ArrowLeft } from "lucide-react";

export default function DocumentVerification() {
  const [searchParams] = useSearchParams();
  const [riders, setRiders] = useState([]);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [riderData, setRiderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [message, setMessage] = useState(null);

  // Fetch all riders in onboarding stage for dropdown selection
  const fetchRidersList = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/delivery-boys/onboarding?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRiders(res.data.riders || []);
      }
    } catch (err) {
      console.error("Failed to load riders list:", err);
    }
  };

  // Fetch specific rider onboarding details
  const fetchRiderDetail = async (riderId) => {
    if (!riderId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/delivery-boys/${riderId}/onboarding`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRiderData(res.data.rider);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRidersList();
    const queryRiderId = searchParams.get("rider");
    if (queryRiderId) {
      setSelectedRiderId(queryRiderId);
      fetchRiderDetail(queryRiderId);
    }
  }, [searchParams]);

  const handleRiderChange = (e) => {
    const id = e.target.value;
    setSelectedRiderId(id);
    setRiderData(null);
    fetchRiderDetail(id);
  };

  const handleVerifyDoc = async (docType, status) => {
    try {
      const reason = rejectionReasons[docType] || "";
      if (status === "rejected" && !reason.trim()) {
        alert("Please enter a rejection reason.");
        return;
      }

      const token = localStorage.getItem("adminToken");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/delivery-boys/${selectedRiderId}/verify-document`,
        { docType, verificationStatus: status, rejectionReason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMessage({ type: "success", text: `${docType.replace(/_/g, " ").toUpperCase()} marked as ${status}!` });
        // Clear rejection text
        setRejectionReasons({ ...rejectionReasons, [docType]: "" });
        fetchRiderDetail(selectedRiderId);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update document status." });
    }
  };

  // Helper to check if file is PDF
  const isPdf = (url) => {
    return url && (url.toLowerCase().endsWith(".pdf") || url.toLowerCase().includes("/raw/upload/"));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">KYC Document Verification</h1>
          <p className="text-sm text-slate-500 mt-1">Review identity credentials, vehicle papers, and bank details of delivery boy candidates.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-bold border ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
            : "bg-red-50 text-red-800 border-red-100"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="hover:opacity-70"><X size={14} /></button>
        </div>
      )}

      {/* Selector Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-550 uppercase tracking-wider">Select Rider Application:</label>
          <select
            value={selectedRiderId}
            onChange={handleRiderChange}
            className="flex-1 md:w-80 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-green-650"
          >
            <option value="">-- Choose Rider --</option>
            {riders.map((r) => (
              <option key={r._id} value={r._id}>
                {r.fullName} ({r.phone}) - {r.onboardingStatus.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        
        {riderData && (
          <div className="flex gap-2">
            <span className="text-xs bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl font-bold text-slate-700">
              Vehicle Class: <strong className="text-green-800 uppercase">{riderData.vehicleTypeSelection || "Not Selected"}</strong>
            </span>
            <span className="text-xs bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl font-bold text-slate-700">
              Preferred Shift: <strong className="text-slate-800">{riderData.preferredShift || "None"}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Main Reviewer Layout */}
      {loading ? (
        <div className="text-center py-12 text-sm text-slate-400 font-bold">Loading rider documentation checklist...</div>
      ) : !riderData ? (
        <div className="text-center py-12 border border-dashed border-slate-200 bg-white rounded-3xl">
          <p className="text-sm text-slate-450 font-bold">Select a rider from the dropdown menu to inspect uploaded documents.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Details header */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-slate-850">Applicant: {riderData.fullName}</h2>
              <p className="text-xs text-slate-500 font-semibold">Phone: {riderData.phone} | Email: {riderData.email || "No Email Provided"}</p>
              <p className="text-xs text-slate-500 font-semibold">City: {riderData.city || "Not set"} | Preferred Location: {riderData.preferredWorkingLocation?.address || "Not specified"}</p>
            </div>
            
            <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Onboarding Checklist Status</span>
              <span className="text-sm font-black text-[#1a5d1a] uppercase bg-green-50 px-3 py-1 rounded-lg border border-green-100 inline-block text-center">
                {riderData.onboardingStatus.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* KYC Documents Checklist */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">KYC Document Review</h3>
            {(riderData.documents || []).length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs font-bold text-slate-400">
                No KYC documents uploaded yet.
              </div>
            ) : (
              <div className="space-y-6">
                {riderData.documents.map((doc) => (
                  <div key={doc._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    
                    {/* Document Display Panel */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                          {doc.docType.replace(/_/g, " ")}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          doc.verificationStatus === "verified"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                            : doc.verificationStatus === "rejected"
                            ? "bg-red-50 text-red-700 border border-red-150"
                            : "bg-amber-50 text-amber-700 border border-amber-150"
                        }`}>
                          {doc.verificationStatus}
                        </span>
                      </div>

                      {/* File Render Box */}
                      <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center min-h-[260px] max-h-[350px] relative">
                        {isPdf(doc.fileUrl) ? (
                          <div className="p-4 text-center space-y-4">
                            <span className="text-xs font-bold text-slate-600 block">PDF Document Uploaded</span>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition"
                            >
                              Open PDF in New Tab
                            </a>
                            <iframe 
                              src={doc.fileUrl} 
                              className="hidden md:block w-full h-[220px] rounded-lg mt-2 border border-slate-200" 
                              title={doc.docType}
                            />
                          </div>
                        ) : (
                          <img
                            src={doc.fileUrl}
                            alt={doc.docType}
                            className="max-w-full max-h-[340px] object-contain cursor-zoom-in"
                            onClick={() => window.open(doc.fileUrl, "_blank")}
                          />
                        )}
                      </div>
                    </div>

                    {/* Admin Verification Forms */}
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">Document Actions</h4>
                        <p className="text-xs text-slate-400 font-semibold">Inspect document layout details above before making decisions.</p>
                      </div>

                      {doc.verificationStatus === "rejected" && doc.rejectionReason && (
                        <div className="bg-red-50 border border-red-100 text-red-800 p-3 rounded-xl text-xs font-semibold">
                          <strong>Rejection Reason:</strong> "{doc.rejectionReason}"
                        </div>
                      )}

                      {doc.verificationStatus === "verified" ? (
                        <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2.5">
                          <CheckCircle className="text-emerald-600 flex-shrink-0" size={16} />
                          <span>This document is verified and approved. No further actions needed.</span>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-2">
                          <textarea
                            placeholder="If rejecting, enter rejection reason here..."
                            value={rejectionReasons[doc.docType] || ""}
                            onChange={(e) => setRejectionReasons({ ...rejectionReasons, [doc.docType]: e.target.value })}
                            className="w-full border border-slate-200 p-3 rounded-xl text-xs outline-none focus:border-green-650"
                            rows="2"
                          />
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVerifyDoc(doc.docType, "verified")}
                              className="flex-1 py-2 text-center text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyDoc(doc.docType, "rejected")}
                              className="flex-1 py-2 text-center text-xs font-black bg-red-650 hover:bg-red-700 text-white rounded-xl shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Reject Document
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bank Account Details Card */}
          {riderData.bankDetails && riderData.bankDetails.accountNumber && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2">Rider Payout Bank Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Account Holder</span>
                  <span className="text-xs font-black text-slate-800">{riderData.bankDetails.accountHolderName}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Account Number</span>
                  <span className="text-xs font-black text-slate-800">{riderData.bankDetails.accountNumber}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">IFSC Code</span>
                  <span className="text-xs font-black text-slate-800">{riderData.bankDetails.ifscCode}</span>
                </div>
              </div>
              {riderData.bankDetails.passbookImage && (
                <div className="mt-4 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Uploaded Passbook / Cheque Scan</span>
                  <div className="max-w-md border border-slate-100 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                    <img 
                      src={riderData.bankDetails.passbookImage} 
                      alt="Bank passbook" 
                      className="max-h-[200px] object-contain cursor-zoom-in"
                      onClick={() => window.open(riderData.bankDetails.passbookImage, "_blank")}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
