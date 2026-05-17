"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Attendee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  message: string;
  status: string;
  createdAt: string;
}

function AttendeesList() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/attendees");
      if (!res.ok) {
        throw new Error("Failed to fetch friends list");
      }
      const data = await res.json();
      setAttendees(data.attendees || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error fetching friends list");
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadCsv = () => {
    const headers = ["Name", "Email", "Message", "Status", "Date Added"];
    const csvContent = [
      headers.join(","),
      ...attendees.map(a => {
        const name = `${a.firstName} ${a.lastName}`.trim().replace(/"/g, '""');
        const message = (a.message || "").replace(/"/g, '""');
        return `"${name}","${a.email}","${message}","${a.status}","${a.createdAt}"`;
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "gaddies-party-guests.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchAttendees();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAttendees();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchAttendees]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-white font-bold text-2xl flex items-center gap-3">
            <span>🎈</span> Gaddie&apos;s Party Guests
            {!loading && attendees.length > 0 && (
              <span className="bg-white/10 text-white/80 text-sm py-1 px-2.5 rounded-lg border border-white/10">
                {attendees.length} RSVPs
              </span>
            )}
          </h3>
          <p className="text-white/50 text-sm mt-1">See who is coming to celebrate!</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadCsv}
            disabled={loading || attendees.length === 0}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white/80 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </button>
          <button
          onClick={fetchAttendees}
          disabled={loading}
          className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-xl text-sm font-semibold text-violet-300 transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh List
        </button>
        </div>
      </div>

      {loading && attendees.length === 0 ? (
        <div className="py-16 text-center text-white/40 text-sm flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
          Checking the guest list...
        </div>
      ) : error ? (
        <div className="py-6 px-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-sm flex items-center gap-3">
          <span className="text-xl">⚠️</span> {error}
        </div>
      ) : attendees.length === 0 ? (
        <div className="py-16 text-center text-white/40 text-sm bg-white/[0.02] rounded-2xl border border-white/5">
          <span className="text-3xl block mb-3">🎁</span>
          No friends have RSVP&apos;d yet. They will show up here soon!
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5">
                <tr className="text-white/60">
                  <th className="font-semibold py-4 px-6">Guest Name</th>
                  <th className="font-semibold py-4 px-6">Email Address</th>
                  <th className="font-semibold py-4 px-6">Message</th>
                  <th className="font-semibold py-4 px-6">Status</th>
                  <th className="font-semibold py-4 px-6">RSVP Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attendees.map((attendee) => (
                  <tr key={attendee.id} className="hover:bg-white/[0.04] transition-colors text-white/80">
                    <td className="py-4 px-6 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                        {(attendee.firstName?.[0] || attendee.email[0]).toUpperCase()}
                      </div>
                      {attendee.firstName || attendee.lastName
                        ? `${attendee.firstName} ${attendee.lastName}`.trim()
                        : "—"}
                    </td>
                    <td className="py-4 px-6">{attendee.email}</td>
                    <td className="py-4 px-6 text-white/60 text-xs max-w-[200px] truncate" title={attendee.message || "No message"}>
                      {attendee.message ? `"${attendee.message}"` : "—"}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        attendee.status === "SUBSCRIBED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-white/10 text-white/50 border border-white/10"
                      }`}>
                        {attendee.status === "SUBSCRIBED" ? "Going 🎂" : attendee.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-white/40">
                      {new Date(attendee.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit"
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === "0629") {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d1a]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              <span className="text-xl">🎂</span>
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-none tracking-tight">Gaddie&apos;s 5th Birthday</h1>
              <p className="text-violet-300/80 text-xs mt-1 font-medium">Party Dashboard</p>
            </div>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Invite
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {!isAuthenticated ? (
          <div className="max-w-sm mx-auto mt-20 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-xl text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-white font-bold text-xl mb-2">Admin Access</h2>
            <p className="text-white/50 text-sm mb-6">Enter the PIN to view the guest list.</p>
            <form onSubmit={handlePinSubmit}>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter PIN (1234)"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-center text-white text-lg tracking-widest focus:outline-none focus:border-violet-500/50 mb-4"
                autoFocus
              />
              {pinError && <p className="text-red-400 text-xs mb-4">Incorrect PIN. Try again.</p>}
              <button type="submit" className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors shadow-[0_4px_15px_rgba(139,92,246,0.3)]">
                Unlock Dashboard
              </button>
            </form>
          </div>
        ) : (
          <AttendeesList />
        )}
      </div>
    </div>
  );
}

