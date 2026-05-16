"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface StatusData {
  ticketTailor: {
    configured: boolean;
    eventId: string | null;
    ticketTypeId: string | null;
  };
  emailOctopus: {
    configured: boolean;
    listId: string | null;
  };
  app: {
    baseUrl: string;
    eventName: string;
    eventDate: string;
    eventLocation: string;
    ticketPriceCents: number;
  };
}

interface TestResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

function StatusBadge({
  configured,
  label,
}: {
  configured: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        configured
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          : "bg-red-500/20 text-red-300 border border-red-500/30"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${configured ? "bg-emerald-400" : "bg-red-400"}`}
      />
      {label}
    </span>
  );
}

function IntegrationCard({
  title,
  icon,
  configured,
  details,
  onTest,
  testLabel,
  testResult,
  testing,
}: {
  title: string;
  icon: string;
  configured: boolean;
  details: { label: string; value: string | null }[];
  onTest: () => void;
  testLabel: string;
  testResult: TestResult | null;
  testing: boolean;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            <StatusBadge
              configured={configured}
              label={configured ? "Configured" : "Not configured"}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-5">
        {details.map((d) => (
          <div key={d.label} className="flex items-center justify-between">
            <span className="text-white/50 text-sm">{d.label}</span>
            <span
              className={`text-sm font-mono ${d.value ? "text-white/80" : "text-red-400/70"}`}
            >
              {d.value || "Not set"}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onTest}
        disabled={testing || !configured}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
          configured
            ? "bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            : "bg-white/5 text-white/30 cursor-not-allowed"
        }`}
      >
        {testing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Testing...
          </span>
        ) : (
          testLabel
        )}
      </button>

      {testResult && (
        <div
          className={`mt-4 p-4 rounded-xl text-sm ${
            testResult.success
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              : "bg-red-500/10 border border-red-500/20 text-red-300"
          }`}
        >
          {testResult.success ? (
            <div>
              <p className="font-semibold mb-2">✓ Connection successful</p>
              <pre className="text-xs opacity-75 overflow-auto whitespace-pre-wrap">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              <p className="font-semibold mb-1">✗ Connection failed</p>
              <p className="text-xs opacity-80">{testResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ttResult, setTtResult] = useState<TestResult | null>(null);
  const [eoResult, setEoResult] = useState<TestResult | null>(null);
  const [ttTesting, setTtTesting] = useState(false);
  const [eoTesting, setEoTesting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/status");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error("Failed to fetch status:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const testTicketTailor = async () => {
    setTtTesting(true);
    setTtResult(null);
    try {
      const res = await fetch("/api/admin/test-ticket-tailor", {
        method: "POST",
      });
      const data = await res.json();
      setTtResult(data);
    } catch (e) {
      setTtResult({
        success: false,
        error: e instanceof Error ? e.message : "Network error",
      });
    } finally {
      setTtTesting(false);
    }
  };

  const testEmailOctopus = async () => {
    setEoTesting(true);
    setEoResult(null);
    try {
      const res = await fetch("/api/admin/test-email-octopus", {
        method: "POST",
      });
      const data = await res.json();
      setEoResult(data);
    } catch (e) {
      setEoResult({
        success: false,
        error: e instanceof Error ? e.message : "Network error",
      });
    } finally {
      setEoTesting(false);
    }
  };

  const allConfigured =
    status?.ticketTailor.configured &&
    status?.emailOctopus.configured;

  return (
    <div className="min-h-screen bg-[#0d0d1a]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">Admin Dashboard</h1>
              <p className="text-white/40 text-xs mt-0.5">Integration Status</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-white/50 hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to app
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Overall status banner */}
        {!loading && (
          <div
            className={`rounded-2xl p-5 mb-8 border ${
              allConfigured
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-amber-500/10 border-amber-500/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{allConfigured ? "🟢" : "🟡"}</span>
              <div>
                <p
                  className={`font-semibold ${allConfigured ? "text-emerald-300" : "text-amber-300"}`}
                >
                  {allConfigured
                    ? "All integrations configured — ready to sell tickets!"
                    : "Some integrations need API keys — fill in .env.local to complete setup"}
                </p>
                <p className="text-white/40 text-sm mt-0.5">
                  Restart the dev server after editing .env.local
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-white/50">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading status...
            </div>
          </div>
        ) : (
          <>
            {/* Integration cards */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <IntegrationCard
                title="Ticket Tailor"
                icon="🎟️"
                configured={status?.ticketTailor.configured ?? false}
                details={[
                  { label: "Event ID", value: status?.ticketTailor.eventId || null },
                  {
                    label: "Ticket Type ID",
                    value: status?.ticketTailor.ticketTypeId || null,
                  },
                ]}
                onTest={testTicketTailor}
                testLabel="Test Connection"
                testResult={ttResult}
                testing={ttTesting}
              />

              <IntegrationCard
                title="EmailOctopus"
                icon="🐙"
                configured={status?.emailOctopus.configured ?? false}
                details={[
                  { label: "List ID", value: status?.emailOctopus.listId || null },
                ]}
                onTest={testEmailOctopus}
                testLabel="Test Connection"
                testResult={eoResult}
                testing={eoTesting}
              />
            </div>

            {/* App config */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🎂</span>
                  <h3 className="text-white font-semibold text-lg">Event Config</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Event name", value: status?.app.eventName },
                    { label: "Date", value: status?.app.eventDate },
                    { label: "Location", value: status?.app.eventLocation },
                    {
                      label: "Ticket price",
                      value: status?.app.ticketPriceCents
                        ? `$${(status.app.ticketPriceCents / 100).toFixed(2)}`
                        : null,
                    },
                    { label: "Base URL", value: status?.app.baseUrl },
                  ].map((d) => (
                    <div key={d.label} className="flex items-center justify-between">
                      <span className="text-white/50 text-sm">{d.label}</span>
                      <span className="text-sm text-white/80 text-right max-w-[200px] truncate">
                        {d.value || "Not set"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Setup guide */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <span>📋</span> Setup Checklist
              </h3>
              <div className="space-y-3">
                {[
                  {
                    done: status?.ticketTailor.configured ?? false,
                    label: "Add Ticket Tailor API key, Event ID, and Ticket Type ID",
                    detail: "Box office → Manage → API. Event ID from event URL. Ticket Type ID from your event's ticket types.",
                  },
                  {
                    done: status?.emailOctopus.configured ?? false,
                    label: "Add EmailOctopus API key and List ID",
                    detail: "Dashboard → API → Create key. List ID from Lists → your list → Settings.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.done
                          ? "bg-emerald-500 text-white"
                          : "border-2 border-white/20"
                      }`}
                    >
                      {item.done && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${item.done ? "text-white/50 line-through" : "text-white"}`}>
                        {item.label}
                      </p>
                      <p className="text-white/30 text-xs mt-0.5">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
