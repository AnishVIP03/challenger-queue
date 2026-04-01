"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  Category,
} from "@/lib/types";

export default function KioskPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<{
    queue_number: string;
    category: string;
    people_in_front: number;
    email: string;
    email_sent: boolean;
    email_message: string;
  } | null>(null);
  const [mobileUrl, setMobileUrl] = useState("");

  // Build mobile URL on client side
  useEffect(() => {
    setMobileUrl(`${window.location.origin}/mobile`);
  }, []);

  // Auto-reset after ticket is shown
  useEffect(() => {
    if (!ticket) return;
    const timer = setTimeout(() => {
      setTicket(null);
      setSelectedCategory(null);
      setEmail("");
    }, 15000);
    return () => clearTimeout(timer);
  }, [ticket]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedCategory || !email.trim()) {
        toast.error("Please select a service and enter your email.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: selectedCategory,
            email: email.trim(),
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Error creating ticket");
          return;
        }

        setTicket(data);

        if (!data.email_sent) {
          toast.warning(data.email_message || "Email could not be sent.");
        } else {
          toast.success("Ticket created! Check your email.");
        }
      } catch {
        toast.error("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, email]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="mx-4 mt-4 flex items-center justify-between rounded-full bg-gradient-to-r from-[#002c9f] to-[#0047d6] px-5 py-3 text-white shadow-lg shadow-blue-900/20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#002c9f] font-extrabold text-lg">
            C
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide uppercase">
              Challenger Queue
            </div>
            <div className="text-xs opacity-90">Service Kiosk</div>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="font-bold text-sm">Challenger</div>
          <div className="opacity-90">
            Get your queue number & shop worry-free
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex gap-5 p-5 max-lg:flex-col">
        {/* Left Panel — Service Selection */}
        <section className="flex-[2] rounded-2xl bg-white/90 p-6 shadow-lg backdrop-blur-sm">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-900">
              What can we help you with today?
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Select a service type and enter your email. We&apos;ll send your
              queue number if email is available today.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Service Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-6">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`group relative flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${
                    selectedCategory === cat
                      ? "border-[#002c9f] bg-blue-50 shadow-md shadow-blue-200/50 ring-2 ring-blue-200"
                      : "border-gray-200 bg-gradient-to-br from-emerald-50 to-green-100 hover:border-blue-300"
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

              {/* QR Code Card — inline in grid, next to Others */}
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-white p-3 text-center">
                {mobileUrl ? (
                  <QRCodeSVG
                    value={mobileUrl}
                    size={72}
                    bgColor="#ffffff"
                    fgColor="#002c9f"
                    level="M"
                  />
                ) : (
                  <div className="h-[72px] w-[72px] bg-gray-100 rounded animate-pulse" />
                )}
                <span className="text-[10px] font-semibold text-[#002c9f] leading-tight">
                  📱 Scan to queue<br />from your phone
                </span>
              </div>
            </div>

            {/* Email Input */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email for queue updates{" "}
                <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-full border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-[#002c9f] focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="submit"
                disabled={loading || !selectedCategory}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl active:translate-y-px disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Generating ticket...</span>
                  </>
                ) : (
                  <>
                    <span>🎫</span>
                    <span>Get My Queue Number</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500">
                We&apos;ll email your queue number if available. You can also
                take a photo of this screen.
              </p>
            </div>
          </form>
        </section>

        {/* Right Panel — Ticket Display */}
        <aside className="flex-[1.3] rounded-2xl bg-gradient-to-b from-blue-50 via-white to-gray-50 p-6 shadow-lg">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-dashed border-gray-200 bg-white/90 p-5">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-[#002c9f]">
                <span>Digital Queue Ticket</span>
                <span>Challenger</span>
              </div>

              {!ticket ? (
                <p className="mt-4 text-sm text-gray-500">
                  Your ticket will appear here after you check in at the kiosk.
                </p>
              ) : (
                <div className="mt-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
                    {ticket.queue_number}
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-600">
                    Service: {ticket.category}
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-gray-500">
                    <p>People ahead: {ticket.people_in_front}</p>
                    <p className="text-xs">{ticket.email_message}</p>
                  </div>
                  <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
                    Please watch the TV display for your number to be called.
                    A chime will sound when it&apos;s your turn.
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(229,57,53,0.2),0_0_0_8px_rgba(229,57,53,0.1)]" />
              {ticket && (
                <div className="text-xs text-gray-400 text-right break-all max-w-[60%]">
                  {ticket.email}
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
