import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Video,
  CalendarCheck,
  FileText,
  ShieldCheck,
  Users,
  Wallet,
  ClipboardList,
  Stethoscope,
  Pill,
  Mic,
  MicOff,
  PhoneOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathFor } from "@/lib/dashboardPath";
import { getPlans } from "@/services/subscriptions";
import type { Plan } from "@/types";

// A kite/diamond lattice - the kind of repeating geometric unit common to
// Nigerian Ankara and Adire textile prints - built as one inline SVG pattern
// rather than a photo. Used once, deliberately, behind the hero mockup.
const AnkaraLattice = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <pattern id="ankaraLattice" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="none" />
        <path d="M20 2 L38 20 L20 38 L2 20 Z" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
        <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.6" />
        <path d="M0 20 L20 0 M20 40 L40 20" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      </pattern>
    </defs>
    <rect width="200" height="200" fill="url(#ankaraLattice)" />
  </svg>
);

// A single woven "trim" stripe - three bands at a slight pitch, the way a
// strip of aso-oke or Ankara binding edges a garment. Used once, at the top
// of the footer, instead of repeating the lattice everywhere.
const WovenTrim = () => (
  <div className="h-2.5 w-full flex" aria-hidden="true">
    <div className="flex-1 bg-accent" />
    <div className="flex-1 bg-destructive" />
    <div className="flex-1 bg-secondary" />
    <div className="flex-1 bg-accent" />
    <div className="flex-1 bg-destructive" />
    <div className="flex-1 bg-secondary" />
  </div>
);

const steps = [
  {
    title: "Tell us what's going on",
    description:
      "Sign up and fill a short health questionnaire before your visit, so the doctor already knows your symptoms and history when they join.",
    icon: ClipboardList,
  },
  {
    title: "See a licensed doctor",
    description:
      "Meet by secure video or chat with a doctor who has been reviewed and approved by our medical team - no waiting rooms, no travel.",
    icon: Video,
  },
  {
    title: "Get your prescription",
    description:
      "Your prescription is reviewed by our pharmacy team and delivered straight to your account, alongside your consultation record.",
    icon: Pill,
  },
];

const reasons = [
  {
    title: "Doctors are vetted, not just listed",
    description: "Every doctor on TeleMed is reviewed and approved by our admin team before they can see a single patient.",
    icon: ShieldCheck,
  },
  {
    title: "One record for your whole family",
    description: "Add family members to your account and manage their appointments, prescriptions and records alongside your own.",
    icon: Users,
  },
  {
    title: "Appointments that fit your day",
    description: "Book a video or chat consultation for whenever suits you, and track its status from request to completion.",
    icon: CalendarCheck,
  },
  {
    title: "Your history, kept in one place",
    description: "Medical records, past prescriptions and doctor recommendations stay attached to your account, visit after visit.",
    icon: FileText,
  },
];

const Index = () => {
  const { user } = useAuth();
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

  const nairaFormatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Video className="w-4.5 h-4.5 text-primary-foreground" />
              </div>
              <span className="text-lg font-display font-semibold">TeleMed</span>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <Link to={dashboardPath}>
                  <Button>Go to dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">Log in</Button>
                  </Link>
                  <Link to="/signup">
                    <Button>Get started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-8 items-center">
          <div>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl leading-[1.05] font-semibold mb-6"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              See a doctor today, without leaving home
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mb-8">
              TeleMed connects you with licensed doctors in Nigeria for video and chat
              consultations, with your records and prescriptions kept in one place.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {user ? (
                <Link to={dashboardPath}>
                  <Button size="lg">Go to your dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button size="lg">Start a consultation</Button>
                  </Link>
                  <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                    Already have an account? Log in
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Illustrative panel: a stylised video-call card over an Ankara-inspired lattice */}
          <div className="relative rounded-2xl overflow-hidden bg-primary aspect-[4/5] md:aspect-square">
            <AnkaraLattice className="absolute inset-0 w-full h-full text-primary-foreground/25" />
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="w-full max-w-[260px] rounded-xl bg-card shadow-lg border border-border/50 overflow-hidden">
                <div className="aspect-[4/3] bg-secondary relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                    <Stethoscope className="w-7 h-7 text-primary" />
                  </div>
                  <div className="absolute bottom-2 right-2 w-12 h-9 rounded-md bg-card border border-border flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-accent/30" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Mic className="w-3.5 h-3.5 text-foreground" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
                    <PhoneOff className="w-3.5 h-3.5 text-destructive-foreground" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <MicOff className="w-3.5 h-3.5 text-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - a genuine 3-step sequence, so numbering earns its place here */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-16 md:py-20 border-t border-border">
        <h2 className="text-2xl md:text-3xl font-display font-semibold mb-12 max-w-md">
          From symptom to prescription, in three steps
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <div key={step.title}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-semibold text-primary">{String(i + 1).padStart(2, "0")}</span>
                <div className="h-px flex-1 bg-border" />
                <step.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why patients choose TeleMed - an editorial list, not a uniform card grid */}
      <section className="bg-secondary/60 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 md:py-20">
          <h2 className="text-2xl md:text-3xl font-display font-semibold mb-12 max-w-md">
            Built around the visit, not just the video call
          </h2>
          <div className="divide-y divide-border">
            {reasons.map((reason, i) => {
              const accentClass = ["bg-primary text-primary-foreground", "bg-accent text-accent-foreground", "bg-destructive text-destructive-foreground"][i % 3];
              return (
                <div key={reason.title} className="py-6 flex flex-col sm:flex-row gap-5 sm:items-start">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${accentClass}`}>
                    <reason.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-1.5">{reason.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">{reason.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing teaser - real, live plan data from the subscription system */}
      {plans.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 lg:px-8 py-16 md:py-20 border-t border-border">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-semibold max-w-md">
              Simple monthly plans, priced in naira
            </h2>
            <Wallet className="w-6 h-6 text-accent hidden sm:block" />
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-lg border p-6 ${plan.isFeatured ? "border-accent" : "border-border"}`}
              >
                {plan.isFeatured && (
                  <span className="text-xs font-semibold text-accent-foreground bg-accent inline-block px-2 py-0.5 rounded-full mb-3">
                    Most popular
                  </span>
                )}
                <h3 className="font-display font-semibold text-lg">{plan.name}</h3>
                <p className="mt-2 mb-4">
                  <span className="text-2xl font-semibold">{nairaFormatter.format(plan.price)}</span>
                  <span className="text-muted-foreground text-sm"> / {plan.period}</span>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8 py-20">
          <h2 className="text-3xl md:text-4xl font-display font-semibold mb-4">
            Your next appointment is a few taps away
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Join the patients across Nigeria already managing their healthcare on TeleMed.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary">
              Create your account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-foreground">
        <WovenTrim />
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-sidebar-primary rounded-md flex items-center justify-center">
                  <Video className="w-4.5 h-4.5 text-sidebar-primary-foreground" />
                </div>
                <span className="font-display font-semibold">TeleMed</span>
              </div>
              <p className="text-sidebar-foreground/60 text-sm">
                Healthcare you can reach from wherever you are in Nigeria.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-sm">Platform</h3>
              <ul className="space-y-2 text-sm text-sidebar-foreground/60">
                <li><Link to="/signup" className="hover:text-sidebar-foreground">For patients</Link></li>
                <li><a href="#" className="hover:text-sidebar-foreground">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-sm">Support</h3>
              <ul className="space-y-2 text-sm text-sidebar-foreground/60">
                <li><a href="#" className="hover:text-sidebar-foreground">Help centre</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground">Contact us</a></li>
                <li><Link to="/privacy-policy" className="hover:text-sidebar-foreground">Privacy policy</Link></li>
                <li><Link to="/terms" className="hover:text-sidebar-foreground">Terms and conditions</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-sm">Company</h3>
              <ul className="space-y-2 text-sm text-sidebar-foreground/60">
                <li><a href="#" className="hover:text-sidebar-foreground">About</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-sidebar-border mt-8 pt-8 text-center text-sm text-sidebar-foreground/50">
            <p>&copy; {new Date().getFullYear()} TeleMed. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
