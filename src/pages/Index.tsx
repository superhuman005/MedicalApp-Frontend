import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Video,
  CalendarCheck,
  FileText,
  ShieldCheck,
  Users,
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

const displayFont = { fontFamily: "'Fraunces', serif" };

// A fine line-art diamond lattice - the kind of repeating geometric unit
// common to Nigerian Ankara and Adire textile prints, drawn as hairline
// strokes rather than a solid filled pattern so it reads as a quiet motif,
// not a block of colour. Used once, behind the hero mockup.
const AnkaraLattice = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 240 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <pattern id="ankaraLattice" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M24 2 L46 24 L24 46 L2 24 Z" fill="none" stroke="currentColor" strokeWidth="0.75" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
      </pattern>
    </defs>
    <rect width="240" height="240" fill="url(#ankaraLattice)" />
  </svg>
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
      <header>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full border border-primary/30 flex items-center justify-center">
                <Video className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-lg tracking-tight" style={displayFont}>TeleMed</span>
            </div>
            <div className="flex items-center gap-6">
              {user ? (
                <Link to={dashboardPath}>
                  <Button variant="outline">Go to dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Log in
                  </Link>
                  <Link to="/signup">
                    <Button variant="outline">Get started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 pt-16 pb-24 md:pt-20 md:pb-32">
        <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-16 md:gap-12 items-center">
          <div>
            <p className="text-sm text-accent-foreground/70 mb-5" style={{ ...displayFont, fontStyle: "italic" }}>
              Healthcare, attended to
            </p>
            <h1
              className="text-[2.75rem] sm:text-5xl md:text-[3.4rem] leading-[1.1] tracking-tight mb-7 text-balance"
              style={displayFont}
            >
              See a doctor today, without leaving home
            </h1>
            <p className="text-lg text-muted-foreground max-w-sm mb-10 leading-relaxed">
              TeleMed connects you with licensed doctors in Nigeria for video and chat
              consultations, with your records and prescriptions kept in one place.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              {user ? (
                <Link to={dashboardPath}>
                  <Button size="lg">Go to your dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button size="lg">Start a consultation</Button>
                  </Link>
                  <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-border">
                    Already have an account?
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Illustrative panel: a stylised video-call card over a fine Ankara-inspired lattice */}
          <div className="relative rounded-[2rem] overflow-hidden bg-secondary/70 border border-border aspect-[4/5] md:aspect-[5/6]">
            <AnkaraLattice className="absolute inset-0 w-full h-full text-primary/15" />
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="w-full max-w-[250px] rounded-2xl bg-card shadow-xl border border-border/60 overflow-hidden">
                <div className="aspect-[4/3] bg-background relative flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full border border-primary/25 flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-primary" />
                  </div>
                  <div className="absolute bottom-3 right-3 w-11 h-8 rounded-md bg-card border border-border/70 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-accent/25" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 py-3.5">
                  <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center">
                    <Mic className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-destructive/90 flex items-center justify-center">
                    <PhoneOff className="w-3 h-3 text-destructive-foreground" />
                  </div>
                  <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center">
                    <MicOff className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - a genuine 3-step sequence, so numbering earns its place here */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-20 md:py-24 border-t border-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16">
          <h2 className="text-3xl md:text-[2.25rem] tracking-tight max-w-md" style={displayFont}>
            From symptom to prescription, in three steps
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-x-10 gap-y-14">
          {steps.map((step, i) => (
            <div key={step.title}>
              <div className="flex items-baseline gap-3 mb-5 pb-5 border-b border-border">
                <span className="text-2xl text-primary/70" style={displayFont}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <step.icon className="w-4 h-4 text-muted-foreground ml-auto" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg mb-2 tracking-tight" style={displayFont}>{step.title}</h3>
              <p className="text-muted-foreground text-[0.95rem] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why patients choose TeleMed - a quiet editorial list, one consistent icon treatment */}
      <section className="bg-secondary/40 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20 md:py-24">
          <h2 className="text-3xl md:text-[2.25rem] tracking-tight mb-16 max-w-md" style={displayFont}>
            Built around the visit, not just the video call
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-12">
            {reasons.map((reason) => (
              <div key={reason.title} className="flex gap-5">
                <reason.icon className="w-5 h-5 text-primary shrink-0 mt-1" strokeWidth={1.5} />
                <div>
                  <h3 className="mb-1.5 tracking-tight" style={displayFont}>{reason.title}</h3>
                  <p className="text-muted-foreground text-[0.95rem] leading-relaxed">{reason.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser - real, live plan data from the subscription system */}
      {plans.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 lg:px-8 py-20 md:py-24 border-t border-border">
          <h2 className="text-3xl md:text-[2.25rem] tracking-tight mb-16 max-w-md" style={displayFont}>
            Simple monthly plans, priced in naira
          </h2>
          <div className="grid sm:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-background p-8">
                {plan.isFeatured && (
                  <p className="text-xs tracking-wide text-accent-foreground/80 mb-3" style={{ ...displayFont, fontStyle: "italic" }}>
                    Most popular
                  </p>
                )}
                <h3 className="text-lg tracking-tight" style={displayFont}>{plan.name}</h3>
                <p className="mt-3 mb-6">
                  <span className="text-3xl tracking-tight" style={displayFont}>{nairaFormatter.format(plan.price)}</span>
                  <span className="text-muted-foreground text-sm"> / {plan.period}</span>
                </p>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-border">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-border">
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8 py-24 md:py-28">
          <h2 className="text-3xl md:text-[2.5rem] tracking-tight mb-5" style={displayFont}>
            Your next appointment is a few taps away
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
            Join the patients across Nigeria already managing their healthcare on TeleMed.
          </p>
          <Link to="/signup">
            <Button size="lg">Create your account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-foreground">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent" aria-hidden="true" />
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-full border border-sidebar-foreground/25 flex items-center justify-center">
                  <Video className="w-3.5 h-3.5 text-sidebar-foreground/80" />
                </div>
                <span className="tracking-tight" style={displayFont}>TeleMed</span>
              </div>
              <p className="text-sidebar-foreground/50 text-sm leading-relaxed max-w-[220px]">
                Healthcare you can reach from wherever you are in Nigeria.
              </p>
            </div>
            <div>
              <h3 className="text-sm text-sidebar-foreground/70 mb-4">Platform</h3>
              <ul className="space-y-2.5 text-sm text-sidebar-foreground/50">
                <li><Link to="/signup" className="hover:text-sidebar-foreground transition-colors">For patients</Link></li>
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm text-sidebar-foreground/70 mb-4">Support</h3>
              <ul className="space-y-2.5 text-sm text-sidebar-foreground/50">
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">Help centre</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">Contact us</a></li>
                <li><Link to="/privacy-policy" className="hover:text-sidebar-foreground transition-colors">Privacy policy</Link></li>
                <li><Link to="/terms" className="hover:text-sidebar-foreground transition-colors">Terms and conditions</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm text-sidebar-foreground/70 mb-4">Company</h3>
              <ul className="space-y-2.5 text-sm text-sidebar-foreground/50">
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-sidebar-border mt-12 pt-8 text-sm text-sidebar-foreground/40">
            <p>&copy; {new Date().getFullYear()} TeleMed. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
