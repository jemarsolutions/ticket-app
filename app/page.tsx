"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Suspense } from "react";

const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .optional()
    .or(z.literal("")),
  numberOfTickets: z
    .number()
    .min(1, "At least 1 ticket required")
    .max(10, "Maximum 10 tickets"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

const EVENT_NAME = process.env.NEXT_PUBLIC_EVENT_NAME || "Birthday Party";
const EVENT_DATE = process.env.NEXT_PUBLIC_EVENT_DATE || "Saturday, June 28, 2025";
const EVENT_LOCATION = process.env.NEXT_PUBLIC_EVENT_LOCATION || "123 Celebration Ave";
const TICKET_PRICE_LABEL = process.env.NEXT_PUBLIC_TICKET_PRICE_LABEL || "$10.00";

// ── Animated particle canvas ──────────────────────────────────────────────────
function ParticleCanvas() {
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

    const colors = ["#a855f7", "#ec4899", "#8b5cf6", "#f472b6", "#c084fc"];
    const particles: {
      x: number;
      y: number;
      r: number;
      dx: number;
      dy: number;
      color: string;
      opacity: number;
    }[] = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
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
      style={{ zIndex: 0 }}
    />
  );
}

// ── Main form content ──────────────────────────────────────────────────────────
function HomeContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [cancelled, setCancelled] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      setCancelled(true);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { numberOfTickets: 1 },
  });

  const watchTickets = watch("numberOfTickets");
  useEffect(() => {
    if (!isNaN(watchTickets)) setTicketCount(watchTickets);
  }, [watchTickets]);

  const onSubmit = async (data: RegistrationForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const result = await response.json();
      if (result.redirectUrl) {
        router.push(result.redirectUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  const totalPrice = (
    ticketCount * parseFloat(TICKET_PRICE_LABEL.replace(/[^0-9.]/g, ""))
  ).toFixed(2);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{
        background: "linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 40%, #0d1a2e 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <ParticleCanvas />

      <div className="relative z-10 w-full max-w-lg">
        {/* Hero header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 rounded-full px-4 py-1.5 text-violet-300 text-sm font-medium mb-4">
            <span>🎉</span>
            <span>Limited tickets available</span>
          </div>
          <h1
            className="text-5xl font-black text-white mb-3 leading-tight"
            style={{
              background: "linear-gradient(135deg, #fff 30%, #c084fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {EVENT_NAME}
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-white/60 text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {EVENT_DATE}
            </span>
            <span className="hidden sm:block text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {EVENT_LOCATION}
            </span>
          </div>
        </div>

        {/* Cancelled notice */}
        {cancelled && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-amber-300 font-semibold text-sm">Payment cancelled</p>
              <p className="text-amber-300/60 text-xs mt-0.5">No charge was made. You can try again below.</p>
            </div>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-xl">❌</span>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Name */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="name">
                Full Name <span className="text-violet-400">*</span>
              </label>
              <input
                {...register("name")}
                id="name"
                type="text"
                placeholder="Jane Smith"
                autoComplete="name"
                className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/30 text-sm outline-none transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: errors.name
                    ? "1px solid rgba(239,68,68,0.6)"
                    : "1px solid rgba(255,255,255,0.12)",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(167,139,250,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(167,139,250,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.border = errors.name
                    ? "1px solid rgba(239,68,68,0.6)"
                    : "1px solid rgba(255,255,255,0.12)";
                  e.target.style.boxShadow = "none";
                }}
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="email">
                Email Address <span className="text-violet-400">*</span>
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                placeholder="jane@example.com"
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/30 text-sm outline-none transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: errors.email
                    ? "1px solid rgba(239,68,68,0.6)"
                    : "1px solid rgba(255,255,255,0.12)",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(167,139,250,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(167,139,250,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.border = errors.email
                    ? "1px solid rgba(239,68,68,0.6)"
                    : "1px solid rgba(255,255,255,0.12)";
                  e.target.style.boxShadow = "none";
                }}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="phone">
                Phone Number
                <span className="text-white/30 font-normal ml-1">(optional)</span>
              </label>
              <input
                {...register("phone")}
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                autoComplete="tel"
                className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/30 text-sm outline-none transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: errors.phone
                    ? "1px solid rgba(239,68,68,0.6)"
                    : "1px solid rgba(255,255,255,0.12)",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(167,139,250,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(167,139,250,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.border = errors.phone
                    ? "1px solid rgba(239,68,68,0.6)"
                    : "1px solid rgba(255,255,255,0.12)";
                  e.target.style.boxShadow = "none";
                }}
              />
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Ticket count */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="numberOfTickets">
                Number of Tickets <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <input
                  {...register("numberOfTickets", { valueAsNumber: true })}
                  id="numberOfTickets"
                  type="number"
                  min="1"
                  max="10"
                  className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/30 text-sm outline-none transition-all duration-200 appearance-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: errors.numberOfTickets
                      ? "1px solid rgba(239,68,68,0.6)"
                      : "1px solid rgba(255,255,255,0.12)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid rgba(167,139,250,0.6)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(167,139,250,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = errors.numberOfTickets
                      ? "1px solid rgba(239,68,68,0.6)"
                      : "1px solid rgba(255,255,255,0.12)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
              {errors.numberOfTickets && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.numberOfTickets.message}
                </p>
              )}
            </div>

            {/* Price summary */}
            <div
              className="rounded-2xl px-5 py-4 flex items-center justify-between"
              style={{
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.2)",
              }}
            >
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <span>🎟️</span>
                <span>
                  {ticketCount} ticket{ticketCount > 1 ? "s" : ""} × {TICKET_PRICE_LABEL}
                </span>
              </div>
              <div className="text-white font-bold text-lg">${totalPrice}</div>
            </div>

            {/* Submit */}
            <button
              id="submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-200 relative overflow-hidden"
              style={{
                background: isSubmitting
                  ? "rgba(139,92,246,0.5)"
                  : "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
                boxShadow: isSubmitting
                  ? "none"
                  : "0 4px 20px rgba(168,85,247,0.4)",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Preparing checkout...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Get My Tickets →
                </span>
              )}
            </button>
          </form>

          {/* Trust signals */}
          <div className="mt-6 flex items-center justify-center gap-6 text-white/30 text-xs">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure payment
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Powered by Ticket Tailor

            </span>
          </div>
        </div>

        {/* Admin link */}
        <div className="text-center mt-6">
          <a
            href="/admin"
            className="text-white/20 hover:text-white/50 text-xs transition-colors"
          >
            ⚙️ Admin
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
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
      <HomeContent />
    </Suspense>
  );
}
