"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function StaffLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
        toast.error(data.error || "Login failed.");
        return;
      }

      toast.success("Login successful!");
      router.push("/staff");
    } catch {
      setError("Network error. Please try again.");
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Header Bar */}
        <header className="mb-5 flex items-center justify-between rounded-full bg-gradient-to-r from-[#002c9f] to-[#0047d6] px-5 py-2.5 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#002c9f] font-extrabold text-lg">
              C
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide uppercase">
                Challenger Queue
              </div>
              <div className="text-[10px] opacity-90">
                Staff access - restricted
              </div>
            </div>
          </div>
          <div className="text-right text-[10px]">
            <div>Internal use only</div>
          </div>
        </header>

        {/* Login Card */}
        <main className="rounded-2xl border border-gray-100 bg-white/97 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-gray-900">Staff Login</h1>
            <p className="mt-1 text-sm text-gray-500">
              Enter the staff PIN provided by the manager to access the
              dashboard.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs text-blue-700">
              🔒 Protected Area
            </span>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in shake-x duration-300">
              <span className="text-sm">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Staff PIN
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff PIN"
                  required
                  autoComplete="off"
                  className="w-full rounded-full border border-gray-300 px-4 py-2.5 pr-12 text-sm outline-none transition-all focus:border-[#002c9f] focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-gray-400">
                For Challenger staff use only. Do not share this PIN with
                customers.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all active:translate-y-px disabled:opacity-50 cursor-pointer"
              >
                <span>🔑</span>
                <span>{loading ? "Logging in..." : "Login to Dashboard"}</span>
              </button>
              <div className="text-[10px] text-gray-500">
                Customer side?{" "}
                <a
                  href="/kiosk"
                  className="font-semibold text-[#002c9f] hover:underline"
                >
                  Go to Kiosk
                </a>
              </div>
            </div>
          </form>

          <p className="mt-5 text-center text-[10px] text-gray-400">
            Session-based access - you will stay logged in until the browser is
            closed.
          </p>
        </main>
      </div>
    </div>
  );
}
