"use client";

import type { Visitor } from "@/lib/types";

function escapeCsv(value: string): string {
  // Guard against formula injection in spreadsheet applications
  let safe = value;
  if (/^[=+\-@]/.test(safe)) {
    safe = `'${safe}`;
  }
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function CsvExportButton({ visitors, eventAddress }: { visitors: Visitor[]; eventAddress: string }) {
  function handleExport() {
    const headers = ["Name", "Email", "Phone", "Type", "Notes", "Signed In"];
    const rows = visitors.map((v) => [
      escapeCsv(v.full_name),
      escapeCsv(v.email),
      escapeCsv(v.phone),
      escapeCsv(v.visitor_type),
      escapeCsv(v.notes ?? ""),
      escapeCsv(new Date(v.signed_in_at).toLocaleString("en-US")),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `visitors-${eventAddress.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (visitors.length === 0) return null;

  return (
    <button
      onClick={handleExport}
      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
    >
      Export CSV
    </button>
  );
}
