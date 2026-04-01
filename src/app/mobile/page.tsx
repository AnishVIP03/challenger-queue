"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  Category,
} from "@/lib/types";

export default function MobilePage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<{
    queue_number: string;
    category: string;
    people_in_front: number;
  } | null>(null);
  const [showScreenshotReminder, setShowScreenshotReminder] = useState(false);

  // Check if ticket was saved in sessionStorage (persist across accidental refreshes)
  useEffect(() => {
    const saved = sessionStorage.getItem("mobile_ticket");
    if (saved) {
      try {
        setTicket(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const handleGetTicket = async () => {
    if (!selectedCategory) {
      toast.error("Please select a service type.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          email: "walk-in@challenger.sg",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error creating ticket");
        return;
      }

      const ticketData = {
        queue_number: data.queue_number,
        category: data.category,
        people_in_front: data.people_in_front,
      };

      setTicket(ticketData);
      // Save to sessionStorage so it persists on refresh
      sessionStorage.setItem("mobile_ticket", JSON.stringify(ticketData));

      // Show screenshot reminder
      setShowScreenshotReminder(true);
      toast.info("Take a screenshot of your queue number!", {
        duration: 6000,
      });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getNewTicket = () => {
    setTicket(null);
    setSelectedCategory(null);
    setShowScreenshotReminder(false);
    sessionStorage.removeItem("mobile_ticket");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex flex-col">
      {/* Header */}
      <header className="mx-3 mt-3 flex items-center justify-between rounded-full bg-gradient-to-r from-[#002c9f] to-[#0047d6] px-4 py-2.5 text-white shadow-lg shadow-blue-900/20">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#002c9f] font-extrabold text-base">
            C
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wide uppercase">
              Challenger Queue
            </div>
            <div className="text-[10px] opacity-90">Mobile Check-in</div>
          </div>
        </div>
        <div className="text-[10px] opacity-90">📱 Scan & Queue</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4">
        {!ticket ? (
          /* ─── Selection View ─── */
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-gray-900">
                Select your service
              </h1>
              <p className="mt-1 text-xs text-gray-500">
                Tap a service below, then get your queue number instantly.
              </p>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                    selectedCategory === cat
                      ? "border-[#002c9f] bg-blue-50 shadow-md ring-2 ring-blue-200"
                      : "border-gray-200 bg-gradient-to-br from-emerald-50 to-green-100"
                  }`}
                >
                  <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-sm font-bold text-gray-800 leading-tight">
                    {CATEGORY_LABELS[cat]}
                  </span>
                  {selectedCategory === cat && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#002c9f] text-white text-xs">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Get Ticket Button */}
            <button
              onClick={handleGetTicket}
              disabled={loading || !selectedCategory}
              className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition-all active:translate-y-px disabled:opacity-40 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🎫 Get My Queue Number
                </span>
              )}
            </button>

            <p className="mt-3 text-center text-[10px] text-gray-400">
              No email required. Your ticket appears on screen instantly.
            </p>
          </div>
        ) : (
          /* ─── Ticket View ─── */
          <div className="flex-1 flex flex-col">
            {/* Screenshot Reminder Banner */}
            {showScreenshotReminder && (
              <div className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📸</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800">
                      Take a screenshot now!
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700">
                      Save your queue number in case you accidentally close or
                      refresh this page. Watch the TV display for your number to
                      be called.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowScreenshotReminder(false)}
                    className="ml-auto text-amber-400 hover:text-amber-600 text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Ticket Card */}
            <div className="flex-1 flex flex-col rounded-3xl border border-dashed border-gray-200 bg-white shadow-xl p-6">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-[#002c9f]">
                <span>Digital Queue Ticket</span>
                <span>Challenger</span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center py-8">
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">
                  Your Number
                </div>
                <div className="text-7xl font-black text-gray-900">
                  {ticket.queue_number}
                </div>
                <div className="mt-3 text-base font-medium text-gray-600">
                  {ticket.category}
                </div>

                <div className="mt-6 w-full max-w-xs space-y-2">
                  <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-2.5">
                    <span className="text-xs text-gray-500">People ahead</span>
                    <span className="text-sm font-bold text-[#002c9f]">
                      {ticket.people_in_front}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-2.5">
                    <span className="text-xs text-gray-500">Status</span>
                    <span className="text-sm font-bold text-green-700">
                      Waiting
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3 text-center text-xs text-gray-500">
                🔔 Please watch the TV display and listen for the chime when
                your number is called.
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(229,57,53,0.2)]" />
                <div className="text-[10px] text-gray-300">
                  Mobile Check-in
                </div>
              </div>
            </div>

            {/* New Ticket Button */}
            <button
              onClick={getNewTicket}
              className="mt-4 w-full rounded-2xl border-2 border-gray-200 py-3 text-sm font-medium text-gray-500 transition-all hover:bg-gray-50 active:translate-y-px cursor-pointer"
            >
              Get Another Ticket
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
