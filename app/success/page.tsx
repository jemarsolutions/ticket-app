"use client";

import { useEffect, useRef, Suspense } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#a855f7", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#f472b6"];
    const pieces: {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      dy: number;
      dx: number;
    }[] = [];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        w: Math.random() * 10 + 4,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        dy: Math.random() * 3 + 1.5,
        dx: (Math.random() - 0.5) * 1.5,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allGone = true;
      pieces.forEach((p) => {
        if (p.y < canvas.height + 20) {
          allGone = false;
          ctx.save();
          ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
          p.y += p.dy;
          p.x += p.dx;
          p.rotation += p.rotationSpeed;
        }
      });
      if (!allGone) raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 50 }}
    />
  );
}

function SuccessContent() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #0d0d1a 0%, #0d2a1a 40%, #0d0d1a 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <Confetti />

      <div className="relative z-10 w-full max-w-md">
        <div
          className="rounded-3xl p-8 text-center"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {/* Success icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-emerald-400 font-semibold text-sm uppercase tracking-wider mb-2">
              Registration Complete
            </p>
            <h1 className="text-3xl font-black text-white mb-2">
              You&apos;re going to the party! 🎉
            </h1>
            <p className="text-white/50 text-sm">
              Your tickets have been confirmed and updates will be sent to your email!
            </p>
          </div>

          {/* Integration confirmations */}
          <div className="space-y-2.5 mb-6">
            <div
              className="flex items-center gap-3 p-3.5 rounded-xl text-left"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-300 font-semibold text-sm">Ticket issued via Ticket Tailor</p>
                <p className="text-white/40 text-xs">Check your email for your ticket</p>
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-3.5 rounded-xl text-left"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-300 font-semibold text-sm">Added to guest mailing list</p>
                <p className="text-white/40 text-xs">
                  You'll receive event updates
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:opacity-80"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 40%, #0d1a2e 100%)" }}
        >
          <div className="flex items-center gap-3 text-white/50">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
