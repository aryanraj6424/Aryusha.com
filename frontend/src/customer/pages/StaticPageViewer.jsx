import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, BookOpen, Clock, ShieldAlert } from "lucide-react";

export default function StaticPageViewer() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/footer/pages/${slug}`);
        if (res.data.success) {
          setPage(res.data.page);
        } else {
          setError("Failed to load page");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Page not found");
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-10 bg-slate-200 rounded w-1/2"></div>
          <div className="space-y-2 pt-6">
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-500 border border-red-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
          <p className="text-sm text-slate-505 font-medium leading-relaxed">{error || "Page not found"}</p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 w-full overflow-hidden">
      <style>{`
        .cms-content p, 
        .cms-content span, 
        .cms-content div,
        .cms-content pre,
        .cms-content li,
        .cms-content ul,
        .cms-content ol,
        .cms-content h1,
        .cms-content h2,
        .cms-content h3,
        .cms-content h4,
        .cms-content h5,
        .cms-content h6,
        .cms-content table,
        .cms-content td,
        .cms-content th {
          white-space: normal !important;
          word-break: normal !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
          max-width: 100% !important;
        }
        .cms-content table {
          width: 100% !important;
          border-collapse: collapse;
          margin: 1.5rem 0;
          overflow-x: auto;
          display: block;
        }
        .cms-content td, .cms-content th {
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
        }
        .cms-content img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 0.5rem;
        }
      `}</style>

      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-black text-purple-700 hover:text-purple-900 mb-6 transition group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        Back
      </button>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-purple-50 p-6 sm:p-10 shadow-sm space-y-6 w-full overflow-hidden">
        <div className="border-b border-purple-50 pb-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-purple-600 uppercase tracking-widest">
            <BookOpen size={14} />
            Information Page
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
            {page.title}
          </h1>
          {page.updatedAt && (
            <p className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
              <Clock size={12} />
              Last updated on: {new Date(page.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>

        {/* Content Viewer */}
        <div
          className="cms-content max-w-none text-slate-600 font-medium leading-relaxed text-sm sm:text-base space-y-4 overflow-hidden"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </div>
  );
}
