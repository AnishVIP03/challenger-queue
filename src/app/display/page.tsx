"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DisplayData, Ticket } from "@/lib/types";
import Image from "next/image";

export default function DisplayPage() {
  const [displayData, setDisplayData] = useState<DisplayData | null>(null);
  const [clock, setClock] = useState("");
  const lastServingIds = useRef<number[]>([]);
  const [newIds, setNewIds] = useState<number[]>([]);
  const chimeRef = useRef<HTMLAudioElement | null>(null);

  const playChime = useCallback(() => {
    if (!chimeRef.current) return;
    chimeRef.current.volume = 0.8;
    chimeRef.current.currentTime = 0;
    chimeRef.current.play().catch(() => {});
  }, []);

  const updateClock = useCallback(() => {
    setClock(
      new Date().toLocaleString("en-SG", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    );
  }, []);

  const refreshDisplay = useCallback(async () => {
    try {
      const res = await fetch("/api/display");
      const data: DisplayData = await res.json();
      setDisplayData(data);

      const serving = data.serving || [];
      const currentIds = serving.map((t) => t.id);
      const freshIds = serving
        .filter((t) => !lastServingIds.current.includes(t.id))
        .map((t) => t.id);

      if (freshIds.length > 0) {
        setNewIds(freshIds);
        playChime();
        // Clear active animation after 4.5s
        setTimeout(() => setNewIds([]), 4500);
      }

      lastServingIds.current = currentIds;
    } catch (err) {
      console.error("Display refresh failed:", err);
    }
  }, [playChime]);

  useEffect(() => {
    updateClock();
    refreshDisplay();
    const clockInterval = setInterval(updateClock, 1000);
    const dataInterval = setInterval(refreshDisplay, 5000);
    return () => {
      clearInterval(clockInterval);
      clearInterval(dataInterval);
    };
  }, [updateClock, refreshDisplay]);

  // Unlock audio on first interaction
  useEffect(() => {
    const unlock = () => {
      if (chimeRef.current) chimeRef.current.muted = false;
    };
    document.body.addEventListener("click", unlock, { once: true });
    return () => document.body.removeEventListener("click", unlock);
  }, []);

  const activeMap: Record<number, Ticket> = {};
  (displayData?.serving || []).forEach((t) => {
    if (t.counter_no) activeMap[t.counter_no] = t;
  });

  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-gradient-to-b from-[#1a237e] via-[#020824] to-black text-white font-[Space_Grotesk,system-ui,sans-serif]">
      {/* Ambient overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_10%_0,rgba(120,144,255,0.18),transparent_60%),radial-gradient(circle_at_90%_0,rgba(255,82,82,0.12),transparent_60%)] mix-blend-screen" />

      {/* Audio */}
      <audio ref={chimeRef} preload="auto">
        <source src="/relax-message-tone.mp3" type="audio/mpeg" />
      </audio>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/5 px-5 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Image
            src="/challenger-icon.png"
            alt="Challenger logo"
            width={36}
            height={36}
            className="rounded-lg shadow-lg"
          />
          <div>
            <div className="text-sm font-bold tracking-wider uppercase">
              Challenger - Live Queue
            </div>
            <div className="text-[11px] opacity-75">
              Please proceed when your number is called on screen.
            </div>
          </div>
        </div>
        <div className="text-sm font-semibold tracking-wide opacity-90">
          {clock}
        </div>
      </header>

      {/* Main Counter Cards */}
      <main className="relative z-10 flex-1 flex flex-col px-5 py-4">
        <div className="flex-1 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((counterNo) => {
            const ticket = activeMap[counterNo];
            const isNew = ticket ? newIds.includes(ticket.id) : false;

            return (
              <div
                key={counterNo}
                className={`relative flex flex-col items-center justify-center rounded-3xl border text-center overflow-hidden transition-all duration-500 ${
                  ticket
                    ? isNew
                      ? "border-yellow-400 bg-gradient-to-b from-[#283593] via-[#101641] to-[#020824] shadow-[0_0_32px_rgba(255,235,59,0.75),0_16px_40px_rgba(0,0,0,0.9)] animate-pulse"
                      : "border-blue-200/20 bg-gradient-to-b from-[#283593] via-[#101641] to-[#020824] shadow-2xl"
                    : "border-white/5 bg-gradient-to-b from-[#1a1f3a] to-[#0a0e1e] opacity-35"
                }`}
              >
                {/* Card glow */}
                {ticket && (
                  <div className="pointer-events-none absolute inset-[-40%] bg-[radial-gradient(circle_at_10%_10%,rgba(120,144,255,0.2),transparent_55%),radial-gradient(circle_at_90%_90%,rgba(105,240,174,0.15),transparent_55%)]" />
                )}

                <div className="relative z-10">
                  <div className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300 mb-2 lg:text-lg">
                    Counter {counterNo}
                  </div>

                  {ticket ? (
                    <>
                      <div
                        className="text-7xl font-black leading-none text-cyan-50 lg:text-[148px]"
                        style={{
                          textShadow:
                            "0 0 24px rgba(105,240,174,0.95), 0 0 56px rgba(105,240,174,0.55)",
                        }}
                      >
                        {ticket.queue_number}
                      </div>
                      <div className="mt-3 text-base font-semibold opacity-90 lg:text-xl">
                        {ticket.category}
                      </div>
                      <div className="mt-3 text-2xl font-bold text-amber-200 opacity-95 lg:text-5xl">
                        ▶ Please proceed to Counter {counterNo} now
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl font-black text-white/30 lg:text-6xl">
                        - - -
                      </div>
                      <div className="mt-3 text-base font-bold text-white/40 opacity-70 lg:text-xl">
                        Standby
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 shrink-0 border-t border-white/5 px-5 py-2 text-right text-[10px] uppercase tracking-wider opacity-60">
        Queue display updates every few seconds &nbsp;&bull;&nbsp; Watch this
        screen for your number
      </footer>

      {/* Test Sound Button */}
      <button
        onClick={playChime}
        className="fixed bottom-2 left-3 z-20 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[11px] text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        🔊 Test chime
      </button>
    </div>
  );
}
