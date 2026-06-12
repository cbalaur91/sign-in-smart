"use client";

export function DownloadPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 print:hidden"
      style={{ backgroundColor: "#1d2433" }}
    >
      Download PDF
    </button>
  );
}
