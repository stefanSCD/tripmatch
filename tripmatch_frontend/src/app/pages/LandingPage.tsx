import { useNavigate } from 'react-router';
import {
  Compass, ArrowRight, Star, CheckCircle2, Sparkles, Globe, Shield,
  Zap, MessageSquare, TrendingUp, ChevronDown, Users,
  MapPin, Calendar, DollarSign, Building2, Plane, Heart
} from 'lucide-react';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1762177390615-829cd3ef7c7c?w=1920&h=1080&fit=crop';
const BALI_IMAGE = 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=400&h=300&fit=crop';
const GREECE_IMAGE = 'https://images.unsplash.com/photo-1758839603414-89d170c4eea0?w=400&h=300&fit=crop';
const JAPAN_IMAGE = 'https://images.unsplash.com/photo-1608339759414-36b34c722dd6?w=400&h=300&fit=crop';
const MALDIVES_IMAGE = 'https://images.unsplash.com/photo-1758717152007-6a2eb7299409?w=400&h=300&fit=crop';
const AVATAR_1 = 'https://images.unsplash.com/photo-1762331660187-4251d9eeed74?w=80&h=80&fit=crop&crop=face';
const AVATAR_2 = 'https://images.unsplash.com/photo-1749577298029-8df3bebac068?w=80&h=80&fit=crop&crop=face';
const AVATAR_3 = 'https://images.unsplash.com/photo-1691274149778-162107694838?w=80&h=80&fit=crop&crop=face';

const destinations = [
  { name: 'Bali, Indonesia', image: BALI_IMAGE, price: 'from $1,200', tag: 'Most Popular' },
  { name: 'Santorini, Greece', image: GREECE_IMAGE, price: 'from $2,400', tag: 'Trending' },
  { name: 'Tokyo, Japan', image: JAPAN_IMAGE, price: 'from $1,800', tag: 'Hidden Gem' },
  { name: 'Maldives', image: MALDIVES_IMAGE, price: 'from $3,200', tag: 'Luxury' },
];

const testimonials = [
  {
    avatar: AVATAR_1,
    name: 'Sarah Chen',
    location: 'Toronto, Canada',
    rating: 5,
    text: 'TravelMatch completely changed how I plan trips. I described my dream Santorini honeymoon and got 6 amazing offers in 24 hours. Saved us over $800!',
  },
  {
    avatar: AVATAR_2,
    name: 'Maria Rodriguez',
    location: 'Madrid, Spain',
    rating: 5,
    text: 'As a travel agency, this platform connects us with travelers who actually need our expertise. Our bookings are up 40% since joining.',
  },
  {
    avatar: AVATAR_3,
    name: 'Alex Johnson',
    location: 'San Francisco, USA',
    rating: 5,
    text: 'The AI itinerary builder is insane. I put in "adventure lover, $4k budget, 10 days" and got a perfect Bali plan. Then agencies competed to give me the best deal.',
  },
];

const howItWorks = [
  {
    step: '01',
    icon: MessageSquare,
    title: 'Describe Your Dream Trip',
    description: 'Tell us where you want to go, your travel style, budget, and preferences. Use AI to instantly generate a detailed itinerary.',
    color: 'from-sky-500 to-sky-600',
    bg: 'bg-sky-50',
  },
  {
    step: '02',
    icon: Building2,
    title: 'Agencies Send Personalized Offers',
    description: 'Verified travel agencies review your request and compete to craft the perfect package for you — all at the best price.',
    color: 'from-teal-500 to-teal-600',
    bg: 'bg-teal-50',
  },
  {
    step: '03',
    icon: Heart,
    title: 'Choose & Book Your Perfect Trip',
    description: 'Compare offers side by side. Accept the best one, chat with the agency, and book with confidence.',
    color: 'from-orange-400 to-orange-500',
    bg: 'bg-orange-50',
  },
];

const features = [
  { icon: Sparkles, title: 'AI Itinerary Builder', description: 'Generate complete day-by-day trip plans in seconds with our AI engine.', color: 'text-sky-500' },
  { icon: Globe, title: 'Global Marketplace', description: '500+ verified agencies from 80+ countries competing for your business.', color: 'text-teal-500' },
  { icon: Shield, title: 'Verified Agencies', description: 'Every agency is vetted and rated by real travelers. Zero scams, guaranteed.', color: 'text-orange-500' },
  { icon: Zap, title: 'Fast Offers', description: 'Receive competing offers within hours, not days. Compare and choose easily.', color: 'text-purple-500' },
  { icon: TrendingUp, title: 'Best Price Guarantee', description: 'Agencies compete for your trip, so you always get the best market price.', color: 'text-sky-500' },
  { icon: MessageSquare, title: 'Direct Communication', description: 'Chat directly with agencies to customize every detail of your trip.', color: 'text-teal-500' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20" style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.06)' }}>
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.3px', color: '#0F172A' }}>TravelMatch</span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors" style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-600 hover:to-sky-700 transition-all shadow-sm shadow-sky-200"
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Travel" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.75) 0%, rgba(14,116,144,0.55) 50%, rgba(2,6,23,0.6) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(14,165,233,0.15) 0%, transparent 60%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 pt-24 pb-16 w-full">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>AI-Powered Travel Planning</span>
              <span className="px-2 py-0.5 rounded-full" style={{ background: '#F97316', fontSize: '10px', fontWeight: 700, color: 'white' }}>NEW</span>
            </div>

            <h1 className="mb-6" style={{ fontSize: 'clamp(38px, 6vw, 68px)', fontWeight: 800, lineHeight: 1.1, color: 'white', letterSpacing: '-1.5px' }}>
              Your Dream Vacation,{' '}
              <span style={{ background: 'linear-gradient(135deg, #38BDF8, #2DD4BF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Crafted by Experts
              </span>
            </h1>

            <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, maxWidth: '560px' }} className="mb-8">
              Describe your perfect trip. Get personalized offers from verified travel agencies worldwide. Compare, choose, and book — all in one place.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <button
                onClick={() => navigate('/app/trips/create')}
                className="flex items-center gap-2.5 px-7 py-4 rounded-2xl text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '16px', fontWeight: 700, boxShadow: '0 8px 30px rgba(14,165,233,0.4)' }}
              >
                <Sparkles className="w-5 h-5" />
                Start Planning with AI
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex items-center gap-2.5 px-7 py-4 rounded-2xl transition-all hover:bg-white hover:text-gray-900"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)', fontSize: '16px', fontWeight: 600, color: 'white' }}
              >
                Join Free — It's Easy
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-5">
              {[
                { label: '50K+ Trips Planned', icon: Globe },
                { label: '500+ Agencies', icon: Building2 },
                { label: '4.9★ Rating', icon: Star },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <Icon className="w-3 h-3 text-sky-300" />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating UI card */}
          <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2" style={{ width: '320px' }}>
            <div className="rounded-3xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Live Offers Coming In</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Live</span>
                </span>
              </div>
              {[
                { agency: 'Wanderlust Travel', dest: 'Bali Package', price: '$2,850', time: '2 min ago', rating: '4.9' },
                { agency: 'Elite Voyages', dest: 'Santorini Luxury', price: '$4,200', time: '15 min ago', rating: '4.7' },
                { agency: 'Asia Pacific Tours', dest: 'Tokyo Explorer', price: '$3,100', time: '1 hr ago', rating: '4.8' },
              ].map((offer, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)' }}>
                    <Plane className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{offer.agency}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{offer.dest}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8' }}>{offer.price}</p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{offer.time}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/register')}
                className="w-full py-3 rounded-xl text-white text-center transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '13px', fontWeight: 700 }}
              >
                Get Your Offers →
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <ChevronDown className="w-5 h-5 text-white/60" />
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gradient-to-r from-sky-600 to-teal-600 py-8">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { number: '50,000+', label: 'Trips Planned' },
              { number: '500+', label: 'Verified Agencies' },
              { number: '$2.4M+', label: 'Saved by Travelers' },
              { number: '98%', label: 'Satisfaction Rate' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{stat.number}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }} className="mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 border border-sky-100 mb-5">
              <Zap className="w-3.5 h-3.5 text-sky-500" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0EA5E9' }}>Simple 3-Step Process</span>
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.8px', lineHeight: 1.2 }} className="mb-4">
              How TravelMatch Works
            </h2>
            <p style={{ fontSize: '18px', color: '#6B7280', maxWidth: '520px' }} className="mx-auto">
              From dream to destination in three simple steps. No more endless research.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, idx) => (
              <div key={idx} className="relative">
                {idx < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-transparent z-0" style={{ width: 'calc(100% - 80px)', left: 'calc(50% + 40px)' }} />
                )}
                <div className="relative bg-white rounded-3xl p-8 border border-gray-100 hover:border-sky-200 transition-all hover:shadow-xl hover:shadow-sky-50 group">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute top-6 right-6 opacity-10" style={{ fontSize: '48px', fontWeight: 900, color: '#0EA5E9', lineHeight: 1 }}>{step.step}</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>{step.title}</h3>
                  <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.7 }}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
                Popular Destinations
              </h2>
              <p style={{ fontSize: '16px', color: '#6B7280' }} className="mt-2">Real requests from travelers right now</p>
            </div>
            <button onClick={() => navigate('/app/marketplace')} className="hidden md:flex items-center gap-2 text-sky-500 hover:text-sky-600 transition-colors" style={{ fontSize: '14px', fontWeight: 600 }}>
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {destinations.map((dest, idx) => (
              <div key={idx} className="group relative rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" style={{ aspectRatio: '3/4' }}>
                <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }} />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', fontSize: '11px', fontWeight: 700, color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                    {dest.tag}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p style={{ fontWeight: 700, fontSize: '17px', color: 'white' }}>{dest.name}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{dest.price}</p>
                  <button
                    onClick={() => navigate('/register')}
                    className="mt-3 w-full py-2.5 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(14,165,233,0.9)', fontSize: '13px', fontWeight: 600, backdropFilter: 'blur(4px)' }}
                  >
                    Explore →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-16">
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.8px' }} className="mb-4">
              Everything You Need to Travel Smarter
            </h2>
            <p style={{ fontSize: '18px', color: '#6B7280', maxWidth: '500px' }} className="mx-auto">
              A complete platform built for modern travelers who demand the best.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="p-7 rounded-3xl border border-gray-100 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-50 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 group-hover:bg-sky-50 flex items-center justify-center mb-5 transition-colors">
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>{feature.title}</h3>
                <p style={{ fontSize: '14.5px', color: '#6B7280', lineHeight: 1.65 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-sky-50 via-white to-teal-50">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.8px' }}>
              Loved by Travelers Worldwide
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.7 }} className="mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover" />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{t.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{t.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #0C4A6E 50%, #134E4A 100%)' }} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #0EA5E9 0%, transparent 50%), radial-gradient(circle at 70% 50%, #0D9488 0%, transparent 50%)' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)' }}>
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#38BDF8' }}>Join 50,000+ Happy Travelers</span>
          </div>
          <h2 style={{ fontSize: 'clamp(30px, 5vw, 56px)', fontWeight: 800, color: 'white', letterSpacing: '-1px', lineHeight: 1.15 }} className="mb-5">
            Ready to Plan Your{' '}
            <span style={{ background: 'linear-gradient(135deg, #38BDF8, #2DD4BF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dream Trip?
            </span>
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.65 }} className="mb-10 max-w-2xl mx-auto">
            Start for free. Describe your perfect vacation and let verified travel agencies compete to create your ideal itinerary.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white hover:scale-105 transition-all"
              style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '16px', fontWeight: 700, boxShadow: '0 8px 30px rgba(14,165,233,0.35)' }}
            >
              <Sparkles className="w-5 h-5" />
              Start Planning Free
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.25)', fontSize: '16px', fontWeight: 600, color: 'white' }}
            >
              Sign In
            </button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8">
            {['No credit card required', 'Free forever plan', '100% secure'].map(item => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-14">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center">
                  <Compass className="w-3.5 h-3.5 text-white" />
                </div>
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'white' }}>TravelMatch</span>
              </div>
              <p style={{ fontSize: '13.5px', color: '#6B7280', lineHeight: 1.65 }}>
                The world's first AI-powered travel marketplace connecting travelers with verified agencies.
              </p>
            </div>
            {[
              { title: 'Product', links: ['How it works', 'Marketplace', 'AI Planner', 'Pricing'] },
              { title: 'For Agencies', links: ['Join as Agency', 'Agency Dashboard', 'Success Stories', 'Support'] },
              { title: 'Company', links: ['About Us', 'Blog', 'Careers', 'Contact'] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontWeight: 700, fontSize: '13px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}><a href="#" style={{ fontSize: '13.5px', color: '#6B7280' }} className="hover:text-gray-300 transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p style={{ fontSize: '13px', color: '#4B5563' }}>© 2026 TravelMatch. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(link => (
                <a key={link} href="#" style={{ fontSize: '13px', color: '#4B5563' }} className="hover:text-gray-300 transition-colors">{link}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
