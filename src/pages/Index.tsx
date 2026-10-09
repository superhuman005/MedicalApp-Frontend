import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Card, RefBadge as Badge, RefButton as Button, RefAvatar as Avatar, Sparkline, Stars } from "@/components/ui-ref";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathFor } from "@/lib/dashboardPath";
import { getPlans } from "@/services/subscriptions";
import type { Plan } from "@/types";

/**
 * Public marketing homepage, ported exactly (layout, spacing, copy
 * structure, exact colors/animations) from the reference design's
 * Landing.tsx, adapted to TeleMed's real brand, routes and live data:
 * the mock store's setMode() calls become real navigation to
 * /signup, /login and /doctor-signup, and the pricing section pulls
 * real plans from the subscriptions API instead of mock plan objects.
 */

// A handful of real doctor headshots from the reference design's own demo
// set, used purely as marketing illustration on this public page (hero
// mock, avatar strip, testimonials) - no patient data involved.
const SHOWCASE_DOCTORS = [
  { name: "Dr. Amara Osei", specialty: "Family Medicine", photo: "https://images.pexels.com/photos/30270934/pexels-photo-30270934.jpeg?auto=compress&cs=tinysrgb&dpr=2&fit=crop&w=240&h=240" },
  { name: "Dr. Idris Rahman", specialty: "Cardiology", photo: "https://images.pexels.com/photos/19601385/pexels-photo-19601385.jpeg?auto=compress&cs=tinysrgb&dpr=2&fit=crop&w=240&h=240" },
  { name: "Dr. Leila Haddad", specialty: "Dermatology", photo: "https://images.pexels.com/photos/37272329/pexels-photo-37272329.png?auto=compress&cs=tinysrgb&dpr=2&fit=crop&w=240&h=240" },
  { name: "Dr. Noor Siddiqui", specialty: "Pediatrics", photo: "https://images.pexels.com/photos/28332542/pexels-photo-28332542.jpeg?auto=compress&cs=tinysrgb&dpr=2&fit=crop&w=240&h=240" },
];

/* --------------------------------- Nav ------------------------------------ */
function Nav({ isAuthed, dashboardPath }: { isAuthed: boolean; dashboardPath: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "How it works", href: "#how" },
    { label: "Care", href: "#care" },
    { label: "Platform", href: "#platform" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solid ? "border-b border-[var(--c-line)] bg-[var(--c-canvas)]/85 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-18 max-w-[1240px] items-center gap-6 px-5 py-4">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex cursor-pointer items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--c-brand),var(--c-accent))] text-white shadow-[0_8px_20px_-10px_var(--c-brand)]">
            <Icon name="wave" className="h-5 w-5" strokeWidth={2.1} />
          </span>
          <span className="text-[16px] font-extrabold tracking-tight text-[var(--c-ink)]">TeleMed</span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-[var(--c-muted)] transition hover:bg-[var(--c-surface2)] hover:text-[var(--c-ink)]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAuthed ? (
            <Button onClick={() => navigate(dashboardPath)}>
              Go to dashboard <Icon name="right" className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate("/login")}>
                Sign in
              </Button>
              <Button onClick={() => navigate("/signup")}>
                Get started <Icon name="right" className="h-4 w-4" />
              </Button>
            </>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="cursor-pointer rounded-xl p-2.5 text-[var(--c-muted)] transition hover:bg-[var(--c-surface2)] lg:hidden"
            aria-label="Menu"
          >
            <Icon name={open ? "x" : "menu"} className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {open && (
        <div className="anim-rise border-t border-[var(--c-line)] bg-[var(--c-surface)] px-5 py-3 lg:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-[14px] font-semibold text-[var(--c-muted)] hover:bg-[var(--c-surface2)] hover:text-[var(--c-ink)]"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

/* --------------------------------- Hero ------------------------------------ */
function HeroMock() {
  const doc = SHOWCASE_DOCTORS[0];
  const [sec, setSec] = useState(312);
  useEffect(() => {
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  return (
    <div className="relative">
      <div className="absolute -top-10 -right-6 h-64 w-64 rounded-full bg-[var(--c-brand)]/25 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-[var(--c-accent)]/20 blur-3xl" />

      <div className="relative overflow-hidden rounded-3xl border border-[var(--c-line)] bg-[var(--c-surface)] p-2.5 shadow-[0_40px_80px_-40px_rgba(11,32,38,0.5)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#07141a]">
          <img
            src={doc.photo}
            alt="Doctor on a video consultation"
            className="absolute inset-0 h-full w-full scale-110 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />

          <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-3.5">
            <Badge className="border border-white/15 bg-black/45 text-white backdrop-blur" dot="#f43f5e">
              LIVE · {mm}:{ss}
            </Badge>
            <Badge className="border border-white/15 bg-black/45 text-white backdrop-blur">
              <Icon name="lock" className="h-3 w-3" /> Encrypted
            </Badge>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-3.5">
            <p className="mb-3 rounded-xl bg-black/60 px-3 py-2 text-[12.5px] font-medium text-white backdrop-blur">
              "Let's get your prescription sent to your pharmacy right away."
            </p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 backdrop-blur">
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-0.5 rounded-full bg-emerald-400"
                      style={{ height: 11, animation: `blink 0.${6 + i}s ease-in-out infinite` }}
                    />
                  ))}
                </span>
                <span className="text-[12px] font-semibold text-white">{doc.name}</span>
              </span>
              <div className="ml-auto flex gap-1.5">
                {["mic", "cam", "screen"].map((i) => (
                  <span
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur"
                  >
                    <Icon name={i} className="h-3.5 w-3.5" />
                  </span>
                ))}
                <span className="flex h-8 w-11 items-center justify-center rounded-full bg-[var(--c-danger)] text-white">
                  <Icon name="phoneoff" className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>

          <div className="absolute top-14 right-3.5 h-16 w-24 overflow-hidden rounded-xl border border-white/25 bg-[#12222a] shadow-lg">
            <div className="flex h-full w-full items-center justify-center">
              <Avatar name="You" size={34} />
            </div>
          </div>
        </div>
      </div>

      <Card className="absolute -bottom-7 -left-4 w-[205px] shadow-xl sm:-left-10">
        <div className="flex items-center justify-between">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--c-dangersoft)] text-[var(--c-danger)]">
            <Icon name="heart" className="h-4 w-4" />
          </span>
          <Badge className="bg-[var(--c-brandsoft)] text-[var(--c-brandink)]">
            <Icon name="down" className="h-3 w-3" strokeWidth={2.8} />3
          </Badge>
        </div>
        <p className="mt-2 text-[11.5px] font-semibold text-[var(--c-muted)]">Resting heart rate</p>
        <p className="text-[21px] leading-none font-extrabold text-[var(--c-ink)]">
          68 <span className="text-[11px] font-semibold text-[var(--c-muted)]">bpm</span>
        </p>
        <div className="mt-1.5 -mb-1">
          <Sparkline data={[74, 72, 71, 73, 70, 69, 68]} color="#e11d48" width={168} height={34} />
        </div>
      </Card>

      <Card className="absolute -top-6 -right-3 hidden w-[195px] shadow-xl sm:block">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--c-brandsoft)] text-[var(--c-brandink)]">
            <Icon name="pill" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-[var(--c-ink)]">Prescription sent</p>
            <p className="text-[11px] leading-snug text-[var(--c-muted)]">To your pharmacy · ready in 2 hrs</p>
          </div>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--c-line)]">
          <div className="h-full w-[72%] rounded-full bg-[var(--c-brand)]" />
        </div>
      </Card>
    </div>
  );
}

function Hero({ isAuthed, dashboardPath }: { isAuthed: boolean; dashboardPath: string }) {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_75%_-5%,color-mix(in_srgb,var(--c-brand)_14%,transparent),transparent)]" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-16 px-5 lg:grid-cols-[1.05fr_1fr]">
        <div className="anim-rise">
          <Badge className="border border-[var(--c-line)] bg-[var(--c-surface)] text-[var(--c-muted)]" dot="#10b981">
            Doctors online right now
          </Badge>
          <h1 className="mt-5 text-[40px] leading-[1.03] font-extrabold tracking-[-0.03em] text-[var(--c-ink)] sm:text-[56px]">
            Healthcare that
            <span className="relative mx-2 inline-block">
              <span className="relative z-10 bg-[linear-gradient(90deg,var(--c-brand),var(--c-accent))] bg-clip-text text-transparent">
                waits for you
              </span>
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 220 12" fill="none">
                <path
                  d="M3 8.5C50 3 130 2.5 217 7"
                  stroke="var(--c-brand)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.35"
                />
              </svg>
            </span>
            — not the other way round.
          </h1>
          <p className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-[var(--c-muted)]">
            TeleMed connects you with licensed doctors in Nigeria for video and chat consultations, with your
            records and prescriptions kept in one place.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {isAuthed ? (
              <Button size="lg" onClick={() => navigate(dashboardPath)}>
                Go to your dashboard <Icon name="right" className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="lg" onClick={() => navigate("/signup")}>
                Start a consultation <Icon name="right" className="h-4 w-4" />
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={() => document.getElementById("platform")?.scrollIntoView({ behavior: "smooth" })}>
              <Icon name="video" className="h-4 w-4" /> Explore the product
            </Button>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {SHOWCASE_DOCTORS.map((d) => (
                  <Avatar key={d.name} src={d.photo} name={d.name} size={34} className="ring-2 ring-[var(--c-canvas)]" />
                ))}
              </div>
              <div>
                <Stars value={4.9} />
                <p className="text-[11.5px] text-[var(--c-muted)]">from patients across Nigeria</p>
              </div>
            </div>
            <div className="h-9 w-px bg-[var(--c-line)]" />
            {[
              { icon: "shield", label: "Doctors verified" },
              { icon: "clock", label: "Same-day visits" },
            ].map((t) => (
              <span key={t.label} className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--c-muted)]">
                <Icon name={t.icon} className="h-4 w-4 text-[var(--c-brandink)]" /> {t.label}
              </span>
            ))}
          </div>
        </div>

        <div className="anim-rise lg:pl-6" style={{ animationDelay: "120ms" }}>
          <HeroMock />
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Stats ----------------------------------- */
function StatsBar() {
  const stats = [
    { v: "< 15 min", l: "Typical wait to see a doctor" },
    { v: "Vetted", l: "Every doctor admin-approved" },
    { v: "₦", l: "Priced for Nigeria" },
    { v: "24/7", l: "Request care any time" },
  ];
  return (
    <section className="border-y border-[var(--c-line)] bg-[var(--c-surface)]">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-px px-5 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.l} className={cn("px-2 py-9 text-center", i > 0 && "lg:border-l lg:border-[var(--c-line)]")}>
            <p className="text-[30px] leading-none font-extrabold tracking-tight text-[var(--c-ink)]">{s.v}</p>
            <p className="mt-2 text-[12.5px] font-medium text-[var(--c-muted)]">{s.l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ How it works -------------------------------- */
function How() {
  const steps = [
    { n: "01", icon: "sparkle", title: "Tell us what's wrong", body: "Sign up and fill a short health questionnaire so the doctor already knows your symptoms and history when they join." },
    { n: "02", icon: "video", title: "Meet your doctor", body: "Join an encrypted video or chat consultation with a doctor who's been reviewed and approved by our medical team." },
    { n: "03", icon: "pill", title: "Get a real plan", body: "Your prescription is reviewed by our pharmacy team and lands in your account, alongside your consultation record." },
  ];
  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-[1240px] px-5">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="bg-[var(--c-brandsoft)] text-[var(--c-brandink)]">How it works</Badge>
          <h2 className="mt-4 text-[34px] leading-tight font-extrabold tracking-[-0.025em] text-[var(--c-ink)] sm:text-[40px]">
            From symptom to prescription in one sitting
          </h2>
          <p className="mt-4 text-[15.5px] text-[var(--c-muted)]">
            No waiting rooms, no travel — just the part of healthcare that actually helps.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {i < 2 && <span className="absolute top-12 -right-3 hidden h-px w-6 bg-[var(--c-line)] md:block" />}
              <Card className="h-full transition hover:-translate-y-1 hover:border-[var(--c-brand)]/40 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--c-brand),var(--c-accent))] text-white shadow-[0_10px_24px_-12px_var(--c-brand)]">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-[26px] font-extrabold text-[var(--c-line)]">{s.n}</span>
                </div>
                <h3 className="mt-5 text-[17px] font-bold tracking-tight text-[var(--c-ink)]">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--c-muted)]">{s.body}</p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Features ----------------------------------- */
function Features() {
  const items = [
    { icon: "video", title: "Video or chat visits", body: "Pick the format that fits your day. Chat visits get a reply from your doctor without a scheduled call.", c: "var(--c-brand)" },
    { icon: "pill", title: "Prescriptions built in", body: "Scripts are reviewed by our pharmacy team and attached to your account as soon as your visit ends.", c: "#f59e0b" },
    { icon: "shield", title: "Doctors are vetted", body: "Every doctor is reviewed and approved by our admin team before they can see a single patient.", c: "var(--c-accent)" },
    { icon: "user", title: "One record, whole family", body: "Add family members to your account and manage their appointments and records alongside your own.", c: "#e11d48" },
    { icon: "calendar", title: "Appointments that fit", body: "Book a video or chat consultation for whenever suits you, and track its status end to end.", c: "#2563eb" },
    { icon: "folder", title: "History kept in one place", body: "Medical records, past prescriptions and doctor notes stay attached to your account, visit after visit.", c: "#14b8a6" },
  ];
  return (
    <section id="care" className="border-y border-[var(--c-line)] bg-[var(--c-surface)] py-24">
      <div className="mx-auto max-w-[1240px] px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <Badge className="bg-[var(--c-accentsoft)] text-[var(--c-accent)]">Everything included</Badge>
            <h2 className="mt-4 text-[34px] leading-tight font-extrabold tracking-[-0.025em] text-[var(--c-ink)] sm:text-[40px]">
              A complete clinic, in your pocket
            </h2>
          </div>
          <p className="max-w-sm text-[14.5px] text-[var(--c-muted)]">
            Built around the visit, not just the video call — your symptoms, your prescription, and your record, all
            in one place.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-[var(--c-line)] bg-[var(--c-surface2)] p-6 transition hover:-translate-y-1 hover:border-[var(--c-brand)]/40 hover:bg-[var(--c-surface)] hover:shadow-lg"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: `color-mix(in srgb, ${f.c} 14%, transparent)`, color: f.c }}
              >
                <Icon name={f.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-[16px] font-bold tracking-tight text-[var(--c-ink)]">{f.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--c-muted)]">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Platform demo --------------------------------- */
function Platform() {
  const navigate = useNavigate();
  const apps: { icon: string; title: string; body: string; color: string; points: string[]; href: string }[] = [
    {
      icon: "user",
      title: "Patient app",
      body: "Book visits, join the video room, manage family members and prescriptions, and read your records.",
      color: "#0d9488",
      points: ["Video & chat consultations", "AI symptom assistant", "Records, prescriptions & plans"],
      href: "/signup",
    },
    {
      icon: "stethoscope",
      title: "Doctor workspace",
      body: "Run your panel: live consultation requests, patient roster, prescriptions and earnings.",
      color: "#5b5bd6",
      points: ["Real-time consultation queue", "Patient records & prescribing", "Earnings & analytics"],
      href: "/doctor-signup",
    },
    {
      icon: "settings",
      title: "Admin console",
      body: "Operate the platform: doctor approvals, user management, plans and payments.",
      color: "#0ea5e9",
      points: ["Doctor credentialing", "Plan & payment management", "Platform-wide oversight"],
      href: "/login",
    },
  ];

  return (
    <section id="platform" className="py-24">
      <div className="mx-auto max-w-[1240px] px-5">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="bg-[var(--c-brandsoft)] text-[var(--c-brandink)]">One platform, three surfaces</Badge>
          <h2 className="mt-4 text-[34px] leading-tight font-extrabold tracking-[-0.025em] text-[var(--c-ink)] sm:text-[40px]">
            Built for patients, doctors and operators
          </h2>
          <p className="mt-4 text-[15.5px] text-[var(--c-muted)]">
            Every workspace is purpose-built for who's using it.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {apps.map((a) => (
            <div
              key={a.title}
              className="group relative overflow-hidden rounded-3xl border border-[var(--c-line)] bg-[var(--c-surface)] p-7 transition hover:-translate-y-1.5 hover:shadow-2xl"
            >
              <span
                className="absolute -top-20 -right-16 h-44 w-44 rounded-full opacity-0 blur-3xl transition group-hover:opacity-100"
                style={{ background: a.color }}
              />
              <div className="relative">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${a.color}, color-mix(in srgb, ${a.color} 55%, #0b2026))` }}
                >
                  <Icon name={a.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-[19px] font-extrabold tracking-tight text-[var(--c-ink)]">{a.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--c-muted)]">{a.body}</p>
                <ul className="mt-5 space-y-2">
                  {a.points.map((p) => (
                    <li key={p} className="flex items-center gap-2.5 text-[13px] text-[var(--c-ink)]">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                        style={{ background: `color-mix(in srgb, ${a.color} 15%, transparent)`, color: a.color }}
                      >
                        <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full justify-center" variant="outline" onClick={() => navigate(a.href)}>
                  Open {a.title.split(" ")[0].toLowerCase()} view <Icon name="right" className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Pricing ------------------------------------ */
function Pricing({ plans }: { plans: Plan[] }) {
  const navigate = useNavigate();
  const nairaFormatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });

  if (plans.length === 0) return null;

  return (
    <section id="pricing" className="border-y border-[var(--c-line)] bg-[var(--c-surface)] py-24">
      <div className="mx-auto max-w-[1240px] px-5">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="bg-[var(--c-brandsoft)] text-[var(--c-brandink)]">Pricing</Badge>
          <h2 className="mt-4 text-[34px] leading-tight font-extrabold tracking-[-0.025em] text-[var(--c-ink)] sm:text-[40px]">
            Simple monthly plans, priced in naira
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-3xl border p-7 transition hover:-translate-y-1",
                p.isFeatured
                  ? "border-transparent bg-[linear-gradient(150deg,#0b3b3a,#0d5a52_55%,#14706a)] text-white shadow-2xl"
                  : "border-[var(--c-line)] bg-[var(--c-surface2)] hover:border-[var(--c-brand)]/40",
              )}
            >
              {p.isFeatured && (
                <span className="absolute top-6 right-6 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                  Most popular
                </span>
              )}
              <p className={cn("text-[13px] font-bold tracking-wide uppercase", p.isFeatured ? "text-white/70" : "text-[var(--c-muted)]")}>
                {p.name}
              </p>
              <p className="mt-4 flex items-baseline gap-1">
                <span className={cn("text-[36px] leading-none font-extrabold tracking-tight", p.isFeatured ? "text-white" : "text-[var(--c-ink)]")}>
                  {nairaFormatter.format(p.price)}
                </span>
                <span className={cn("text-[13px] font-semibold", p.isFeatured ? "text-white/60" : "text-[var(--c-muted)]")}>/{p.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.slice(0, 5).map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13.5px]">
                    <Icon
                      name="checkcircle"
                      className={cn("mt-0.5 h-4 w-4 shrink-0", p.isFeatured ? "text-emerald-300" : "text-[var(--c-brand)]")}
                    />
                    <span className={p.isFeatured ? "text-white/90" : "text-[var(--c-ink)]"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={cn("mt-7 w-full justify-center", p.isFeatured && "bg-white text-[#0b3b3a] shadow-none hover:bg-white/90")}
                variant={p.isFeatured ? "primary" : "outline"}
                onClick={() => navigate("/signup")}
              >
                Choose {p.name}
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-[var(--c-muted)]">
          Cancel anytime · prescriptions and pharmacy fulfilment included where noted
        </p>
      </div>
    </section>
  );
}

/* ------------------------------ Testimonials ----------------------------------- */
function Testimonials() {
  const quotes = [
    {
      q: "I filled in my symptoms, was matched with a doctor within minutes, and had my prescription waiting at my pharmacy the same day.",
      n: "Chiamaka N.",
      r: "Lagos",
      photo: "https://images.pexels.com/photos/7752791/pexels-photo-7752791.jpeg?auto=compress&cs=tinysrgb&dpr=2&fit=crop&w=120&h=120",
    },
    {
      q: "Having my whole family's records and appointments in one account has made keeping track of everyone's care so much easier.",
      n: "Tunde A.",
      r: "Abuja",
      photo: "https://images.pexels.com/photos/9271168/pexels-photo-9271168.jpeg?auto=compress&cs=tinysrgb&dpr=2&fit=crop&w=120&h=120",
    },
    {
      q: "As a doctor, the consultation queue and patient records in one workspace make it easy to give patients real attention.",
      n: "Dr. Leila H.",
      r: "Dermatology",
      photo: "https://images.pexels.com/photos/37272329/pexels-photo-37272329.png?auto=compress&cs=tinysrgb&dpr=2&fit=crop&w=120&h=120",
    },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-5">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="bg-[var(--c-accentsoft)] text-[var(--c-accent)]">Loved by both sides of the screen</Badge>
          <h2 className="mt-4 text-[34px] leading-tight font-extrabold tracking-[-0.025em] text-[var(--c-ink)] sm:text-[40px]">
            Trusted across Nigeria
          </h2>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {quotes.map((t) => (
            <Card key={t.n} className="flex flex-col transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Icon key={i} name="star" filled strokeWidth={0} className="h-4 w-4 text-amber-400" />
                ))}
              </div>
              <p className="mt-4 flex-1 text-[14.5px] leading-relaxed text-[var(--c-ink)]">"{t.q}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-[var(--c-line)] pt-4">
                <Avatar src={t.photo} name={t.n} size={38} />
                <div>
                  <p className="text-[13px] font-bold text-[var(--c-ink)]">{t.n}</p>
                  <p className="text-[11.5px] text-[var(--c-muted)]">{t.r}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------- FAQ ---------------------------------------- */
function Faq() {
  const [open, setOpen] = useState(0);
  const faqs = [
    { q: "Who can see a doctor on TeleMed?", a: "Anyone in Nigeria can create a patient account. After signing up, you can request care immediately or book an appointment with a doctor of your choice." },
    { q: "Are TeleMed doctors verified?", a: "Yes. Every doctor is reviewed and approved by our admin team — including their credentials — before they're allowed to see a single patient." },
    { q: "Can TeleMed doctors prescribe medication?", a: "Yes. Prescriptions written during your visit are reviewed by our pharmacy team and attached to your account, alongside your consultation record." },
    { q: "How fast can I be seen?", a: "Request care any time and you'll be matched with an available doctor, or book a specific time slot with any doctor on the platform in advance." },
    { q: "Who can see my health data?", a: "Only the doctors involved in your care and the family members you add to your account. Your records, prescriptions and consultation history stay attached to your account." },
    { q: "Does it work for my whole family?", a: "Yes. Add family members to your account and manage their appointments, prescriptions and records alongside your own, from a single login." },
  ];
  return (
    <section id="faq" className="border-y border-[var(--c-line)] bg-[var(--c-surface)] py-24">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Badge className="bg-[var(--c-brandsoft)] text-[var(--c-brandink)]">FAQ</Badge>
          <h2 className="mt-4 text-[34px] leading-tight font-extrabold tracking-[-0.025em] text-[var(--c-ink)]">
            Questions, answered
          </h2>
          <p className="mt-4 text-[14.5px] text-[var(--c-muted)]">
            Still unsure? Create an account and send us a message any time.
          </p>
          <Link to="/signup">
            <Button variant="outline" className="mt-6">
              <Icon name="chat" className="h-4 w-4" /> Get started
            </Button>
          </Link>
        </div>

        <div className="space-y-2.5">
          {faqs.map((f, i) => (
            <div
              key={f.q}
              className={cn(
                "overflow-hidden rounded-2xl border transition",
                open === i ? "border-[var(--c-brand)]/40 bg-[var(--c-surface2)]" : "border-[var(--c-line)] bg-[var(--c-surface2)]/60",
              )}
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left"
              >
                <span className="flex-1 text-[14.5px] font-bold text-[var(--c-ink)]">{f.q}</span>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition",
                    open === i ? "rotate-45 bg-[var(--c-brand)] text-white" : "bg-[var(--c-surface)] text-[var(--c-muted)]",
                  )}
                >
                  <Icon name="plus" className="h-4 w-4" strokeWidth={2.4} />
                </span>
              </button>
              {open === i && (
                <p className="anim-rise px-5 pb-5 text-[13.5px] leading-relaxed text-[var(--c-muted)]">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------- CTA ----------------------------------------- */
function Cta({ isAuthed, dashboardPath }: { isAuthed: boolean; dashboardPath: string }) {
  const navigate = useNavigate();
  return (
    <section className="px-5 py-24">
      <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[32px] bg-[linear-gradient(130deg,#0b3b3a_0%,#0d5a52_48%,#15607a_100%)] px-8 py-16 text-center text-white sm:px-16">
        <div className="grain absolute inset-0 opacity-50" />
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[var(--c-brand)]/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[var(--c-accent)]/25 blur-3xl" />
        <div className="relative">
          <Badge className="border border-white/15 bg-white/10 text-white/90" dot="#4ade80">
            Doctors available right now
          </Badge>
          <h2 className="mx-auto mt-6 max-w-2xl text-[34px] leading-tight font-extrabold tracking-[-0.025em] sm:text-[44px]">
            Your next appointment is a few taps away
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15.5px] text-white/70">
            Join the patients across Nigeria already managing their healthcare on TeleMed.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {isAuthed ? (
              <Button size="lg" className="bg-white text-[#0b3b3a] shadow-none hover:bg-white/90" onClick={() => navigate(dashboardPath)}>
                Go to your dashboard <Icon name="right" className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="lg" className="bg-white text-[#0b3b3a] shadow-none hover:bg-white/90" onClick={() => navigate("/signup")}>
                Create your account <Icon name="right" className="h-4 w-4" />
              </Button>
            )}
            <Button size="lg" variant="ghost" className="border border-white/25 text-white hover:bg-white/10 hover:text-white" onClick={() => navigate("/doctor-signup")}>
              <Icon name="stethoscope" className="h-4 w-4" /> I'm a doctor
            </Button>
          </div>
          <p className="mt-6 text-[12.5px] text-white/50">
            Free to sign up · cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Footer ---------------------------------------- */
function Footer() {
  const cols: { title: string; links: { label: string; to?: string; href?: string }[] }[] = [
    { title: "Care", links: [{ label: "Request care", to: "/signup" }, { label: "Book an appointment", to: "/signup" }] },
    { title: "Platform", links: [{ label: "Patient app", to: "/signup" }, { label: "Doctor workspace", to: "/doctor-signup" }, { label: "Admin console", to: "/login" }] },
    { title: "Company", links: [{ label: "Privacy policy", to: "/privacy-policy" }, { label: "Terms and conditions", to: "/terms" }] },
  ];
  return (
    <footer className="border-t border-[var(--c-line)] bg-[var(--c-surface)]">
      <div className="mx-auto max-w-[1240px] px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--c-brand),var(--c-accent))] text-white">
                <Icon name="wave" className="h-5 w-5" strokeWidth={2.1} />
              </span>
              <span className="text-[16px] font-extrabold tracking-tight text-[var(--c-ink)]">TeleMed</span>
            </div>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-[var(--c-muted)]">
              Healthcare you can reach from wherever you are in Nigeria.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.title}>
                <p className="text-[12px] font-bold tracking-wide text-[var(--c-ink)] uppercase">{c.title}</p>
                <ul className="mt-3 space-y-2">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      {l.to ? (
                        <Link to={l.to} className="text-[13px] text-[var(--c-muted)] transition hover:text-[var(--c-ink)]">
                          {l.label}
                        </Link>
                      ) : (
                        <a href={l.href} className="text-[13px] text-[var(--c-muted)] transition hover:text-[var(--c-ink)]">
                          {l.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--c-line)] pt-7">
          <p className="text-[12.5px] text-[var(--c-muted)]">© {new Date().getFullYear()} TeleMed. All rights reserved.</p>
          <p className="max-w-lg text-[11.5px] leading-snug text-[var(--c-muted)]">
            TeleMed is a telemedicine platform. If you are experiencing a medical emergency, call your local
            emergency number immediately.
          </p>
        </div>
      </div>
    </footer>
  );
}

const Index = () => {
  const { user } = useAuth();
  const isAuthed = !!user;
  const dashboardPath = user ? dashboardPathFor(user.role) : "/patient-dashboard";

  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    getPlans()
      .then((data) => setPlans(data.filter((p) => p.price > 0).sort((a, b) => a.price - b.price).slice(0, 3)))
      .catch(() => {
        // Pricing teaser is a nice-to-have on a public page - if it can't
        // load, the rest of the homepage still works fine without it.
      });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--c-canvas)] text-[var(--c-ink)]">
      <Nav isAuthed={isAuthed} dashboardPath={dashboardPath} />
      <Hero isAuthed={isAuthed} dashboardPath={dashboardPath} />
      <StatsBar />
      <How />
      <Features />
      <Platform />
      <Pricing plans={plans} />
      <Testimonials />
      <Faq />
      <Cta isAuthed={isAuthed} dashboardPath={dashboardPath} />
      <Footer />
    </div>
  );
};

export default Index;
