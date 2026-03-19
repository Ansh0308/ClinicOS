import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Users, Zap, Shield, Star, CheckCircle, Smartphone } from 'lucide-react'

const HomePage = () => {
  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────
const HeroSection = () => {
  const navigate = useNavigate() // ← must be inside the component

  return (
    <section className="hero-glow min-h-[90vh] flex items-center pt-8 pb-20" id="hero">
      <div className="section-container w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-crimson-100 text-crimson-600 text-xs font-body font-bold uppercase tracking-wider px-4 py-2 rounded-pill mb-6">
              <span className="w-2 h-2 bg-crimson-500 rounded-full animate-pulse" />
              Now in Beta — Join 50+ Clinics
            </div>

            <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl text-text-primary leading-tight mb-6">
              Finally,{' '}
              <span className="text-crimson-500">Smart</span>
              <br />
              Clinics.
            </h1>

            <p className="font-body text-lg md:text-xl text-text-body max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
              The clinic management platform that replaces paper tokens, manual queues,
              and missed appointments with{' '}
              <strong className="text-text-secondary">intelligent automation</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary text-sm py-3.5 px-8"
              >
                Get Started
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-4 mt-8 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {['bg-crimson-400', 'bg-accent-teal', 'bg-accent-yellow', 'bg-accent-lavender'].map((bg, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 ${bg} rounded-full border-2 border-cream-50 flex items-center justify-center text-xs text-white font-bold`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={14} className="fill-accent-yellow text-accent-yellow" />
                  ))}
                </div>
                <p className="font-body text-xs text-text-muted mt-0.5">Loved by 200+ doctors</p>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md">
            <DashboardPreviewCard />
          </div>

        </div>
      </div>
    </section>
  )
}

// ── Dashboard Preview Card ────────────────────────────────────────────────────
const DashboardPreviewCard = () => {
  const queue = [
    { num: 'T-23', name: 'Ansh Raythatha',   status: 'Now',     wait: '—',      color: 'bg-crimson-500 text-white' },
    { num: 'T-24', name: 'Om Makadiya',       status: 'Next',    wait: '5 min',  color: 'bg-accent-yellow text-crimson-900' },
    { num: 'T-25', name: 'Hetansh Shah',      status: 'Waiting', wait: '18 min', color: 'bg-cream-200 text-text-body' },
    { num: 'T-26', name: 'Viraj Vaghasiya',   status: 'Waiting', wait: '31 min', color: 'bg-cream-200 text-text-body' },
  ]

  return (
    <div className="card shadow-hero p-0 overflow-hidden">
      <div className="nav-gradient px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-xs text-white/70 uppercase tracking-wider">Live Queue</p>
            <p className="font-display font-bold text-white text-lg">Dr Salubhai Clinic</p>
          </div>
          <div className="text-right">
            <p className="font-body text-xs text-white/70">Avg Wait</p>
            <p className="font-display font-bold text-accent-yellow text-lg">24 min</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {queue.map((t) => (
          <div
            key={t.num}
            className="flex items-center gap-3 p-3 rounded-2xl bg-cream-50 border border-cream-200 hover:border-cream-300 transition-colors"
          >
            <span className={`font-display font-bold text-sm px-3 py-1 rounded-pill ${t.color}`}>
              {t.num}
            </span>
            <div className="flex-1">
              <p className="font-body font-semibold text-sm text-text-primary">{t.name}</p>
              <p className="font-body text-xs text-text-muted">{t.status}</p>
            </div>
            {t.wait !== '—' && (
              <span className="font-body text-xs text-text-muted bg-cream-200 px-2 py-1 rounded-pill">
                {t.wait}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <button className="w-full btn-primary justify-center py-3 text-xs">
          Call Next Patient
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { number: '< 20s', label: 'Patient check-in',   icon: Zap,        color: 'bg-accent-yellow' },
  { number: '40%',   label: 'Wait time reduction', icon: Clock,      color: 'bg-accent-teal'   },
  { number: '100%',  label: 'Auto notifications',  icon: Smartphone, color: 'bg-crimson-100'   },
  { number: '5s',    label: 'Full history access',  icon: Users,      color: 'bg-accent-sky'    },
]

function StatsSection() {
  return (
    <section className="bg-white py-16" id="stats">
      <div className="section-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {STATS.map(({ number, label, icon: Icon, color }) => (
            <div key={label} className="card text-center hover:-translate-y-1 transition-transform duration-300">
              <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                <Icon size={22} className="text-crimson-700" />
              </div>
              <p className="font-display font-bold text-3xl text-text-primary mb-1">{number}</p>
              <p className="font-body text-sm text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Zap,        title: 'Smart Queue Management',    description: 'Real-time token board with ETA predictions. Staff issue tokens in one tap. Patients see live status on their phone.',        color: 'text-crimson-500',    bg: 'bg-crimson-100'        },
  { icon: Users,      title: 'Complete Patient Profiles', description: 'Every visit, prescription, complaint and bill — searchable in under 5 seconds. No more hunting through paper files.',     color: 'text-accent-teal',    bg: 'bg-accent-teal/10'     },
  { icon: Smartphone, title: 'Automated Communication',   description: 'WhatsApp, SMS, and Email sent automatically. Token issued, queue reminders, bill receipts — zero manual effort.',         color: 'text-accent-lavender',bg: 'bg-accent-lavender/10' },
  { icon: Clock,      title: 'Billing & Receipts',        description: 'Create bills in seconds. Payment recorded, PDF receipt auto-sent to patient\'s WhatsApp. Full audit history.',            color: 'text-accent-peach',   bg: 'bg-accent-peach/10'    },
  { icon: Star,       title: 'Live Analytics Dashboard',  description: 'Revenue, patient throughput, wait times — all live. Clinic owners see the full picture without asking staff.',            color: 'text-accent-yellow',  bg: 'bg-accent-yellow/10'   },
  { icon: Shield,     title: 'Privacy & Compliance',      description: 'DPDP-compliant patient consent. Role-based access so staff only see what they need. Audit log on every action.',          color: 'text-accent-sky',     bg: 'bg-accent-sky/10'      },
]

function FeaturesSection() {
  return (
    <section className="bg-cream-100 py-20" id="features">
      <div className="section-container">
        <div className="text-center mb-14">
          <p className="font-body text-xs font-bold uppercase tracking-widest text-crimson-500 mb-3">
            Everything you need
          </p>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-text-primary mb-4">
            Built for how clinics<br />actually work
          </h2>
          <p className="font-body text-lg text-text-body max-w-2xl mx-auto">
            Every feature was designed around real workflows — from front desk to billing room.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
            <div key={title} className="card hover:-translate-y-1 transition-transform duration-300 group">
              <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-4`}>
                <Icon size={22} className={color} />
              </div>
              <h3 className="font-display font-bold text-xl text-text-primary mb-2">{title}</h3>
              <p className="font-body text-sm text-text-body leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How It Works ──────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  { step: '01', title: 'Patient Arrives',  desc: 'Receptionist looks up patient by phone number — returns in under 2 seconds for returning patients.' },
  { step: '02', title: 'Token Issued',     desc: 'One click issues a token. WhatsApp sent instantly with queue position and estimated wait time.' },
  { step: '03', title: 'Doctor Consults',  desc: 'Doctor sees full patient history, records diagnosis, creates prescription — all in one screen.' },
  { step: '04', title: 'Bill & Receipt',   desc: 'Bill created, payment marked, PDF receipt auto-sent to patient. Visit record saved permanently.' },
]

function HowItWorksSection() {
  return (
    <section className="bg-white py-20" id="how-it-works">
      <div className="section-container">
        <div className="text-center mb-14">
          <p className="font-body text-xs font-bold uppercase tracking-widest text-crimson-500 mb-3">
            Simple workflow
          </p>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-text-primary mb-4">
            From arrival to receipt<br />in minutes
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
            <div key={step} className="relative">
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%-12px)] w-full h-0.5 bg-cream-300 z-0" />
              )}
              <div className="card relative z-10">
                <div className="w-14 h-14 nav-gradient rounded-2xl flex items-center justify-center mb-4">
                  <span className="font-display font-bold text-white text-lg">{step}</span>
                </div>
                <h3 className="font-display font-bold text-xl text-text-primary mb-2">{title}</h3>
                <p className="font-body text-sm text-text-body leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 bg-cream-50 border border-cream-300 rounded-3xl p-8">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              'No hardware required — works on any browser',
              'Set up your clinic in under 30 minutes',
              'WhatsApp Business API included',
              'Unlimited patients per subscription',
              'Role-based access: Staff, Doctor, Admin',
              'Daily backups, 99.5% uptime SLA',
            ].map(item => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle size={18} className="text-accent-teal mt-0.5 flex-shrink-0" />
                <span className="font-body text-sm text-text-body">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────────────
function CtaSection() {
  const navigate = useNavigate() // ← must be inside the component

  return (
    <section className="py-20" id="pricing">
      <div className="section-container">
        <div className="nav-gradient rounded-3xl p-12 text-center shadow-hero">
          <p className="font-body text-xs font-bold uppercase tracking-widest text-white/60 mb-4">
            Get started today
          </p>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
            Ready to transform<br />your clinic?
          </h2>
          <p className="font-body text-lg text-white/80 max-w-xl mx-auto mb-8">
            Join 50+ clinics already using ClinicOS. 30-day free trial, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="btn-cta px-10 py-4 text-sm"
            >
              Way to Smart Clinic
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomePage