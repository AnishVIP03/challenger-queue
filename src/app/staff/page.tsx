"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { DisplayData } from "@/lib/types";

export default function StaffPage() {
  const [counterNo, setCounterNo] = useState<number>(1);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentTicketId, setCurrentTicketId] = useState<number | null>(null);
  const [currentTicket, setCurrentTicket] = useState<{
    queue_number: string;
    category: string;
    counter_no: number;
    email: string;
  } | null>(null);
  const [displayData, setDisplayData] = useState<DisplayData | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    'No active ticket. Click "Call Next" to serve the next customer.'
  );
  const counterRef = useRef(counterNo);
  counterRef.current = counterNo;

  const refreshOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/display");
      if (!res.ok) return;
      const data: DisplayData = await res.json();
      setDisplayData(data);

      // Sync current counter state from shared DB
      const selectedCounter = counterRef.current;
      const myServing = (data.serving || []).find(
        (t) => t.counter_no === selectedCounter
      );

      if (myServing) {
        setCurrentTicketId(myServing.id);
        setCurrentTicket({
          queue_number: myServing.queue_number,
          category: myServing.category,
          counter_no: myServing.counter_no ?? selectedCounter,
          email: "",
        });
      } else if (currentTicketId !== null) {
        // Ticket was completed/skipped by another source
        setCurrentTicketId(null);
        setCurrentTicket(null);
      }
    } catch (err) {
      console.error("Failed to refresh:", err);
    }
  }, [currentTicketId]);

  useEffect(() => {
    refreshOverview();
    const interval = setInterval(refreshOverview, 4000);
    return () => clearInterval(interval);
  }, [refreshOverview]);

  // Re-sync when counter changes
  useEffect(() => {
    setCurrentTicketId(null);
    setCurrentTicket(null);
    setStatusMessage('Counter changed. Click "Call Next" to serve.');
    refreshOverview();
  }, [counterNo, refreshOverview]);

  // Persist counter selection
  useEffect(() => {
    const saved = localStorage.getItem("staff_counter");
    if (saved) setCounterNo(parseInt(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("staff_counter", String(counterNo));
  }, [counterNo]);

  const callNext = async () => {
    if (currentTicketId) {
      toast.warning("Already serving. Mark Done or Skip first.");
      return;
    }

    try {
      const res = await fetch("/api/staff/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counter_no: counterNo,
          category: categoryFilter,
        }),
      });
      const data = await res.json();

      if (data.message === "no waiting tickets") {
        setStatusMessage("No waiting tickets for this filter.");
        toast.info("No waiting tickets.");
        await refreshOverview();
        return;
      }

      if (!res.ok) {
        if (res.status === 409 && data.active_ticket) {
          const t = data.active_ticket;
          setCurrentTicketId(t.id);
          setCurrentTicket({
            queue_number: t.queue_number,
            category: t.category,
            counter_no: t.counter_no || counterNo,
            email: t.email || "",
          });
          toast.warning("Counter is already serving a customer.");
        } else {
          toast.error(data.message || data.error || "Error");
        }
        await refreshOverview();
        return;
      }

      setCurrentTicketId(data.id);
      setCurrentTicket({
        queue_number: data.queue_number,
        category: data.category,
        counter_no: data.counter_no,
        email: data.email || "",
      });
      setStatusMessage("");
      toast.success(`Called ${data.queue_number}`);
      await refreshOverview();
    } catch {
      toast.error("Network error.");
    }
  };

  const markDone = async () => {
    if (!currentTicketId) return;
    try {
      const res = await fetch("/api/staff/done", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: currentTicketId,
          counter_no: counterNo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || data.error || "Error");
        return;
      }
      setCurrentTicketId(null);
      setCurrentTicket(null);
      setStatusMessage("Ticket completed. Call next when ready.");
      toast.success("Ticket marked done.");
      await refreshOverview();
    } catch {
      toast.error("Network error.");
    }
  };

  const markSkip = async () => {
    if (!currentTicketId) return;
    try {
      const res = await fetch("/api/staff/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: currentTicketId,
          counter_no: counterNo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || data.error || "Error");
        return;
      }
      setCurrentTicketId(null);
      setCurrentTicket(null);
      setStatusMessage("Ticket skipped. Call next when ready.");
      toast.info("Ticket skipped.");
      await refreshOverview();
    } catch {
      toast.error("Network error.");
    }
  };

  const recallTicket = async (ticketId: number) => {
    try {
      const res = await fetch("/api/staff/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || data.error || "Error");
        return;
      }
      toast.success("Ticket recalled to waiting queue.");
      await refreshOverview();
    } catch {
      toast.error("Network error.");
    }
  };

  const hasActive = !!currentTicketId;
  const categories = [
    "All",
    "VEW",
    "Singsaver",
    "Setup",
    "Screen Protector",
    "Others",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 flex flex-col">
      {/* Header */}
      <header className="mx-4 mt-4 flex items-center justify-between rounded-full bg-gradient-to-r from-[#002c9f] to-[#0047d6] px-5 py-2.5 text-white shadow-lg shadow-blue-900/20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#002c9f] font-extrabold text-lg">
            C
          </div>
          <div>
            <div className="text-sm font-semibold">
              Challenger Queue - Staff
            </div>
            <div className="text-xs opacity-90">
              Manage walk-in customers effortlessly
            </div>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="rounded-full bg-white/15 px-3 py-1 text-[11px]">
            Live queue sync across all counters
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[2.2fr_1.5fr] gap-4 p-4">
        {/* Left: Controls */}
        <section className="rounded-2xl bg-white/95 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Current Ticket
              </h2>
              <p className="text-xs text-gray-500">
                Call next customer & update status for your counter.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1.5 text-xs text-[#002c9f]">
              Counter:
              <select
                value={counterNo}
                onChange={(e) => setCounterNo(parseInt(e.target.value))}
                className="bg-transparent font-semibold outline-none cursor-pointer"
              >
                <option value={1}>1 (Main)</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-[#002c9f] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Ticket Display */}
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-5 min-h-[120px] flex flex-col justify-center">
            {currentTicket ? (
              <div className="animate-in fade-in duration-300">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#002c9f]">
                  Now serving
                </div>
                <div className="mt-1 text-4xl font-extrabold text-gray-900">
                  {currentTicket.queue_number}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                  <span>Service: {currentTicket.category}</span>
                  <span>Counter: {currentTicket.counter_no}</span>
                </div>
                {currentTicket.email && (
                  <div className="mt-1 text-xs text-gray-400 break-all">
                    Email: {currentTicket.email}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{statusMessage}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={callNext}
              disabled={hasActive}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all active:translate-y-px disabled:opacity-40 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
            >
              📣 Call Next
            </button>
            <button
              onClick={markDone}
              disabled={!hasActive}
              className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-[#002c9f] transition-all hover:bg-blue-100 active:translate-y-px disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              ✅ Mark Done
            </button>
            <button
              onClick={markSkip}
              disabled={!hasActive}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 active:translate-y-px disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              ⏭ Skip
            </button>
          </div>

          <p className="mt-3 text-[10px] text-gray-400">
            Customers are notified via TV display & chime when their number is called.
          </p>
        </section>

        {/* Right: Queue Snapshot */}
        <aside className="rounded-2xl bg-white/95 p-5 shadow-lg backdrop-blur-sm space-y-4 overflow-auto">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Queue Snapshot</h2>
            <p className="text-xs text-gray-500">
              Serving, waiting, skipped & history.
            </p>
          </div>

          {/* Waiting */}
          <div>
            <h3 className="text-xs font-semibold text-gray-600 mb-2">
              Up Next (by time)
            </h3>
            <div className="max-h-[160px] overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-1.5">
              {displayData?.next?.length ? (
                displayData.next.map((t, i) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${
                      i % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                    }`}
                  >
                    <span className="font-semibold">{t.queue_number}</span>
                    <span className="text-gray-500">{t.category}</span>
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-700 text-[10px]">
                      Waiting
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-[11px] text-gray-400">
                  No one waiting.
                </p>
              )}
            </div>
          </div>

          {/* Skipped */}
          <div>
            <h3 className="text-xs font-semibold text-gray-600 mb-2">
              Skipped Tickets
            </h3>
            <div className="max-h-[160px] overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-1.5">
              {displayData?.skipped?.length ? (
                displayData.skipped.map((t, i) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${
                      i % 2 === 0 ? "bg-white" : "bg-red-50/30"
                    }`}
                  >
                    <span className="font-semibold">{t.queue_number}</span>
                    <span className="text-gray-500">{t.category}</span>
                    <button
                      onClick={() => recallTicket(t.id)}
                      className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-red-600 text-[10px] hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      🔁 Recall
                    </button>
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-[11px] text-gray-400">
                  No skipped tickets.
                </p>
              )}
            </div>
          </div>

          {/* History */}
          <div>
            <h3 className="text-xs font-semibold text-gray-600 mb-2">
              Recently Called (Today)
            </h3>
            <div className="max-h-[160px] overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-1.5">
              {displayData?.history?.length ? (
                displayData.history.map((t, i) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <span className="font-semibold">{t.queue_number}</span>
                    <span className="text-gray-500">
                      {t.category} (C{t.counter_no || "-"})
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        t.status === "serving"
                          ? "bg-green-50 border border-green-200 text-green-700"
                          : t.status === "done"
                          ? "bg-blue-50 border border-blue-200 text-blue-700"
                          : "bg-red-50 border border-red-200 text-red-700"
                      }`}
                    >
                      {t.status === "serving"
                        ? "Serving"
                        : t.status === "done"
                        ? "Done"
                        : "Skipped"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-[11px] text-gray-400">
                  No tickets called yet.
                </p>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-green-600" />{" "}
              Serving
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Next
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Skipped
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Done
            </span>
          </div>
        </aside>
      </main>
    </div>
  );
}
