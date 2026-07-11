import React from "react";

export default function Loader({
  text = "Loading...",
  size = "md",
  fullScreen = false,
}) {
  const spinnerSize = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-4",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`
          ${spinnerSize[size]}
          rounded-full
          border-gray-300
          border-t-green-600
          animate-spin
        `}
      />

      <p className="text-gray-500 text-sm font-medium">
        {text}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}