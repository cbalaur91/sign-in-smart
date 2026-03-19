"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Visitor } from "@/lib/types";

const typeColors: Record<string, string> = {
  buyer: "bg-blue-500/10 text-blue-500",
  neighbor: "bg-purple-500/10 text-purple-500",
  investor: "bg-green-500/10 text-green-500",
  other: "bg-muted text-muted-foreground",
};

const visitorTypes = ["all", "buyer", "neighbor", "investor", "other"] as const;

export function VisitorTable({
  eventId,
  initialVisitors,
}: {
  eventId: string;
  initialVisitors: Visitor[];
}) {
  const [visitors, setVisitors] = useState<Visitor[]>(initialVisitors);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`event-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "visitors",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setVisitors((prev) => [payload.new as Visitor, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const filtered = visitors.filter((v) => {
    if (typeFilter !== "all" && v.visitor_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        v.full_name.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (visitors.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No visitors yet. Share the QR code to start capturing leads.
      </p>
    );
  }

  return (
    <div>
      {/* Search & Filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {visitorTypes.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No visitors match your search.
        </p>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-3 sm:hidden">
            {filtered.map((visitor) => (
              <div
                key={visitor.id}
                className={`rounded-lg border border-border/50 p-3 ${visitor.notes ? "cursor-pointer active:bg-muted/30" : ""}`}
                onClick={() => {
                  if (visitor.notes) {
                    setExpandedId(expandedId === visitor.id ? null : visitor.id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-sm">
                    {visitor.full_name}
                    {visitor.notes && (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" title="Has notes" />
                    )}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[visitor.visitor_type] ?? typeColors.other}`}
                  >
                    {visitor.visitor_type}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground truncate">{visitor.email}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{visitor.phone}</span>
                  <span>
                    {new Date(visitor.signed_in_at).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {expandedId === visitor.id && visitor.notes && (
                  <div className="mt-2 rounded-md border border-border bg-muted/20 px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground">Notes</p>
                    <p className="mt-1 text-sm">{visitor.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Name</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Email</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Phone</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Type</th>
                  <th className="pb-3 font-medium text-muted-foreground">Signed In</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((visitor) => (
                  <tr
                    key={visitor.id}
                    className={`border-b border-border/50 ${visitor.notes ? "cursor-pointer hover:bg-muted/30" : ""}`}
                    onClick={() => {
                      if (visitor.notes) {
                        setExpandedId(expandedId === visitor.id ? null : visitor.id);
                      }
                    }}
                  >
                    <td className="py-3 pr-4 font-medium">
                      <span className="flex items-center gap-1.5">
                        {visitor.full_name}
                        {visitor.notes && (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" title="Has notes" />
                        )}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {visitor.email}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {visitor.phone}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[visitor.visitor_type] ?? typeColors.other}`}
                      >
                        {visitor.visitor_type}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(visitor.signed_in_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Expanded notes panel (desktop) */}
            {expandedId && (() => {
              const v = filtered.find((x) => x.id === expandedId);
              if (!v?.notes) return null;
              return (
                <div className="mt-2 rounded-md border border-border bg-muted/20 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Notes from {v.full_name}
                  </p>
                  <p className="mt-1 text-sm">{v.notes}</p>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {filtered.length !== visitors.length && (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing {filtered.length} of {visitors.length} visitors
        </p>
      )}
    </div>
  );
}
