import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, BookOpen, Clock, ShieldAlert } from "lucide-react";
import SEO from "../../components/SEO";

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

  const getSanitizedContent = (htmlContent) => {
    if (!htmlContent) return "";
    // Convert non-breaking spaces (&nbsp; and \u00A0) into regular spaces so text wraps naturally at word boundaries
    return htmlContent.replace(/&nbsp;|\u00A0/g, " ");
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6 w-full min-w-0">
      <SEO 
        title={`${page.title} | Aryusha`}
        description={`Read official ${page.title} information and policies on Aryusha.`}
        canonicalUrl={`https://aryusha.in/customer/page/${slug}`}
      />
      <style>{`
        .cms-content {
          width: 100%;
          max-width: 100%;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
          word-break: normal !important;
        }
        .cms-content * {
          max-width: 100% !important;
          box-sizing: border-box !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
          word-break: normal !important;
        }
        .cms-content p {
          margin-bottom: 1rem;
          line-height: 1.7;
          color: #334155;
        }
        .cms-content h1 {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }
        .cms-content h2 {
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
          margin-top: 1.35rem;
          margin-bottom: 0.65rem;
          line-height: 1.35;
        }
        .cms-content h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #1e293b;
          margin-top: 1.15rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        .cms-content h4, .cms-content h5, .cms-content h6 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e293b;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        @media (min-width: 640px) {
          .cms-content h1 { font-size: 1.875rem; }
          .cms-content h2 { font-size: 1.5rem; }
          .cms-content h3 { font-size: 1.25rem; }
          .cms-content h4, .cms-content h5, .cms-content h6 { font-size: 1.1rem; }
        }
        .cms-content ul {
          list-style-type: disc !important;
          padding-left: 1.25rem !important;
          margin-bottom: 1rem !important;
        }
        .cms-content ol {
          list-style-type: decimal !important;
          padding-left: 1.25rem !important;
          margin-bottom: 1rem !important;
        }
        .cms-content li {
          margin-bottom: 0.35rem;
          line-height: 1.65;
          color: #334155;
        }
        .cms-content pre, .cms-content code {
          white-space: pre-wrap !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
          background-color: #f8fafc;
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          margin: 1rem 0;
          display: block;
          overflow-x: auto;
        }
        .cms-content blockquote {
          border-left: 4px solid #0B2214;
          padding-left: 1rem;
          margin: 1.25rem 0;
          font-style: italic;
          color: #475569;
          background-color: #f0fdf4;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .cms-content a {
          color: #0B2214;
          text-decoration: underline;
          font-weight: 600;
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }
        .cms-content table {
          width: 100% !important;
          border-collapse: collapse;
          margin: 1.5rem 0;
          display: block;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .cms-content td, .cms-content th {
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          font-size: 0.875rem;
        }
        .cms-content th {
          background-color: #f1f5f9;
          font-weight: 700;
        }
        .cms-content img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
      `}</style>

      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-black text-purple-700 hover:text-purple-900 mb-4 sm:mb-6 transition group cursor-pointer"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        Back
      </button>

      {/* Main Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-purple-100 p-4 sm:p-8 md:p-10 shadow-sm space-y-6 w-full min-w-0 overflow-hidden">
        <div className="border-b border-purple-100 pb-4 sm:pb-6 space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-purple-600 uppercase tracking-widest">
            <BookOpen size={14} />
            Information Page
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight break-words">
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
          className="cms-content w-full min-w-0 text-slate-600 font-medium text-sm sm:text-base break-words"
          dangerouslySetInnerHTML={{ __html: getSanitizedContent(page.content) }}
        />
      </div>
    </div>
  );
}
