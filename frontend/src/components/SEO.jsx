import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

/**
 * Truncates and cleans SEO title tags at word boundaries, ensuring no unclosed brackets or trailing punctuation.
 */
export function formatSeoTitle(rawTitle, maxLen = 65) {
  if (!rawTitle) return "Aryusha - Quick Grocery Delivery | Fresh & Reliable";

  let clean = rawTitle.trim();
  const suffix = clean.includes("Aryusha") ? "" : " | Aryusha";
  const full = `${clean}${suffix}`;

  if (full.length <= maxLen) return full;

  const allowedLength = maxLen - suffix.length;
  if (allowedLength <= 10) return full.slice(0, maxLen);

  let truncated = clean.slice(0, allowedLength);

  // Cut back to word boundary if mid-word
  if (clean.length > allowedLength && /\w/.test(clean[allowedLength])) {
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 10) {
      truncated = truncated.slice(0, lastSpace);
    }
  }

  // Remove trailing punctuation or spaces
  truncated = truncated.replace(/[\s\-_,.:;(\[{]+$/, "");

  // Balance unclosed parenthesis
  const openParen = (truncated.match(/\(/g) || []).length;
  const closeParen = (truncated.match(/\)/g) || []).length;
  if (openParen > closeParen) {
    const lastOpen = truncated.lastIndexOf("(");
    if (lastOpen > 5) {
      truncated = truncated.slice(0, lastOpen).trim().replace(/[\s\-_,.:;]+$/, "");
    }
  }

  // Balance unclosed bracket
  const openBracket = (truncated.match(/\[/g) || []).length;
  const closeBracket = (truncated.match(/\]/g) || []).length;
  if (openBracket > closeBracket) {
    const lastOpen = truncated.lastIndexOf("[");
    if (lastOpen > 5) {
      truncated = truncated.slice(0, lastOpen).trim().replace(/[\s\-_,.:;]+$/, "");
    }
  }

  return `${truncated}${suffix}`;
}

export default function SEO({
  title = "Aryusha - Quick Grocery Delivery | Fresh & Reliable",
  description = "Order fresh groceries, dairy, bakery, and daily essentials online with Aryusha. Fast same day delivery at best prices.",
  canonicalUrl,
  ogType = "website",
  ogImage = "https://aryusha.in/aryushalogo.png",
  noindex = false,
  jsonLd = null,
}) {
  const location = useLocation();

  // Clean title at word boundaries
  const formattedTitle = formatSeoTitle(title);

  // Normalize canonical URL (ensure domain, strip query parameters, trailing slash normalization)
  const currentPath = location.pathname.endsWith("/") && location.pathname !== "/"
    ? location.pathname.slice(0, -1)
    : location.pathname;
    
  const fullCanonical = canonicalUrl || `https://aryusha.in${currentPath}`;
  const fullOgImage = ogImage.startsWith("http") ? ogImage : `https://aryusha.in${ogImage}`;

  const robotsDirective = noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{formattedTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsDirective} />
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph Tags */}
      <meta property="og:site_name" content="Aryusha" />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
