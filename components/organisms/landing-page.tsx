import {
  Radio, BookOpen, BarChart3, Shield, Clock, Bell,
  ChevronRight, Cpu, TrendingUp, GraduationCap,
  Building2, ArrowRight, Zap, Activity, Database,
} from "lucide-react";
import { Navbar } from "@/components/molecules/navbar";
import { DashboardMockup } from "@/components/molecules/dashboard-mockup";
import { RFIDAnimation } from "@/components/atoms/rfid-animation";
import { Counter } from "@/components/atoms/counter";
import { FeatureCard } from "@/components/atoms/feature-card";
import { StepCard } from "@/components/atoms/step-card";
import { TestimonialCard } from "@/components/atoms/testimonial-card";
import type { Feature, Step, Stat } from "@/lib/types/homepage";

const features: Feature[] = [
  { icon: Radio, title: "RFID Auto-Detection", desc: "Plug-and-play RFID readers automatically detect student cards and log attendance in real time.", accent: "blue" },
  { icon: Clock, title: "Real-Time Tracking", desc: "Live dashboard updates the moment a student taps their card — zero delay, zero manual entry.", accent: "cyan" },
  { icon: BarChart3, title: "Advanced Analytics", desc: "Visualise attendance trends per module, lecture, student cohort, or department with rich charts.", accent: "violet" },
  { icon: Bell, title: "Smart Alerts", desc: "Automated notifications to lecturers and students when attendance drops below the threshold.", accent: "amber" },
  { icon: Shield, title: "Secure & Compliant", desc: "Role-based access for admins, lecturers, and students with full audit trails and GDPR compliance.", accent: "emerald" },
  { icon: Database, title: "Centralised Records", desc: "Single source of truth for all attendance data, integrated with your university's student system.", accent: "rose" },
];

const steps: Step[] = [
  { num: 1, icon: Cpu, title: "RFID Device Installed", desc: "A compact AMS reader is mounted at the lecture room entrance, connected to the university network." },
  { num: 2, icon: Radio, title: "Student Taps Card", desc: "The student brings their university ID card near the reader. The RFID chip is scanned in milliseconds." },
  { num: 3, icon: Activity, title: "Attendance Recorded", desc: "The system instantly validates the student, marks them present for the scheduled lecture, and timestamps the record." },
  { num: 4, icon: TrendingUp, title: "Reports Generated", desc: "Lecturers and administrators access live dashboards and export detailed attendance reports at any time." },
];

const stats: Stat[] = [
  { value: 50000, suffix: "+", label: "Students Tracked" },
  { value: 99, suffix: ".9%", label: "Uptime Reliability" },
  { value: 120, suffix: "+", label: "Universities" },
  { value: 3, suffix: "M+", label: "Lectures Recorded" },
];

const testimonials = [
  {
    quote: "Reduced our administrative workload by 80%. Attendance data is now available the moment a lecture ends.",
    name: "Dr. Lakshmi Jayawardena",
    role: "Faculty of Computing, University of Moratuwa",
  },
  {
    quote: "Students love that they just tap and go. No more waiting for a paper register to pass around the room.",
    name: "Prof. Suresh Bandara",
    role: "Department Head, NSBM Green University",
  },
  {
    quote: "The analytics suite is phenomenal. We can identify at-risk students weeks before exams — this changes outcomes.",
    name: "Ms. Dilini Rathnayake",
    role: "Academic Registrar, SLIIT",
  },
];

const universities = ["University of Colombo", "NSBM", "SLIIT", "IIT"];

export function LandingPage() {
  return (
    <div
      className="min-h-screen bg-[#050d1f] text-white overflow-x-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .heading-font { font-family: 'Space Grotesk', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .hero-glow { background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.25) 0%, transparent 70%); }
        .grid-bg {
          background-image: linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        .float { animation: float 4s ease-in-out infinite; }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fade-up-1 { animation: fadeSlideUp 0.7s 0.1s ease both; }
        .fade-up-2 { animation: fadeSlideUp 0.7s 0.25s ease both; }
        .fade-up-3 { animation: fadeSlideUp 0.7s 0.4s ease both; }
        .fade-up-4 { animation: fadeSlideUp 0.7s 0.55s ease both; }
        .badge-glow { box-shadow: 0 0 20px rgba(59,130,246,0.3); }
      `}</style>

      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 grid-bg">
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-cyan-600/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="fade-up-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-6 badge-glow mono">
              <Zap size={12} />
              Smart RFID Attendance for Universities
            </div>
            <h1 className="fade-up-2 heading-font text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
              Attendance,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Automated.</span>
              <br />
              Insights,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">Instant.</span>
            </h1>
            <p className="fade-up-3 text-slate-400 text-lg leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
              AMS replaces paper registers and manual roll calls with seamless RFID scanning — giving universities real-time attendance data, powerful analytics, and zero administrative overhead.
            </p>
            <div className="fade-up-4 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] group">
                Request a Demo
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-200">
                <BookOpen size={16} />
                Documentation
              </button>
            </div>
            <div className="fade-up-4 flex flex-wrap items-center gap-6 mt-12 justify-center lg:justify-start">
              {universities.map((u) => (
                <div key={u} className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <GraduationCap size={12} />
                  {u}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0 float">
            <RFIDAnimation />
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section id="stats" className="border-y border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="heading-font text-4xl font-bold text-white mb-1">
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div className="text-slate-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="mono text-xs text-blue-400 tracking-widest uppercase mb-3">What We Offer</div>
          <h2 className="heading-font text-4xl lg:text-5xl font-bold mb-4">Everything your university needs</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base">
            From device integration to reporting, AMS covers the full attendance lifecycle with no friction.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-28 bg-slate-900/30 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="mono text-xs text-blue-400 tracking-widest uppercase mb-3">The Process</div>
            <h2 className="heading-font text-4xl lg:text-5xl font-bold mb-4">
              Four steps to zero<br />manual effort
            </h2>
            <p className="text-slate-400 mb-12 leading-relaxed">
              AMS is designed to be invisible to students and powerful for administrators. Once set up, the system runs itself.
            </p>
            <div>
              {steps.map((s) => (
                <StepCard key={s.title} {...s} />
              ))}
            </div>
          </div>
          <DashboardMockup />
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-28 max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="mono text-xs text-blue-400 tracking-widest uppercase mb-3">Trusted By</div>
          <h2 className="heading-font text-4xl font-bold mb-4">Universities love AMS</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-br from-blue-950/50 via-slate-900 to-slate-900 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-6">
            <Radio size={26} className="text-blue-400" />
          </div>
          <h2 className="heading-font text-4xl lg:text-5xl font-bold mb-4">Ready to modernise attendance?</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Join over 120 universities already using AMS. Setup takes less than a day — and your first term&apos;s data will change how you support students.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] group">
              Book a Free Demo
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200">
              <Building2 size={16} />
              Enterprise Enquiry
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center">
              <Radio size={12} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">AMS<span className="text-blue-400">.</span></span>
            <span className="text-slate-600 text-xs ml-1">Attendance Management System</span>
          </div>
          <div className="flex gap-6 text-slate-500 text-xs">
            {["Privacy", "Terms", "Support", "Contact"].map((l) => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <div className="text-slate-600 text-xs mono">© 2025 AMS. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
