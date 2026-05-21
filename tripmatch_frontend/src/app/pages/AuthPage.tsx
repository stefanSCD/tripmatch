import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Building2, CheckCircle2, Compass, Eye, EyeOff, Map, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useApp, type UserRole } from '../context/AppContext';

const BG_IMAGE = 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=1200&h=900&fit=crop';

export default function AuthPage({ mode }: { mode?: 'login' | 'register' }) {
  const navigate = useNavigate();
  const { login, register } = useApp();
  const [formMode, setFormMode] = useState<'login' | 'register'>(mode === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('traveler');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [agencyDescription, setAgencyDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      if (formMode === 'login') {
        await login({
          email,
          password,
        });
        toast.success('Login successful.');
        navigate('/app');
      } else {
        await register({
          email,
          password,
          role: selectedRole,
          firstName,
          lastName,
          phone,
          city,
          country,
          agencyName: selectedRole === 'agency' ? agencyName : undefined,
          agencyDescription: selectedRole === 'agency' ? agencyDescription : undefined,
        });
        toast.success('Account registered successfully.');
        setFormMode('login');
        navigate('/login');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    toast.info('Google sign in is not configured yet.');
  };

  const roleCards: Array<{ role: UserRole; label: string; icon: typeof Map; desc: string }> = [
    { role: 'traveler', label: 'Traveler', icon: Map, desc: 'Planning a trip' },
    { role: 'agency', label: 'Travel Agency', icon: Building2, desc: 'Selling packages' },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12 bg-white relative max-w-xl w-full">
        <button onClick={() => navigate('/')} className="absolute top-6 left-6 flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Back</span>
        </button>

        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.3px', color: '#0F172A' }}>TravelMatch</span>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }} className="mb-1.5">
          {formMode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={{ fontSize: '15px', color: '#6B7280' }} className="mb-7">
          {formMode === 'login'
            ? 'Sign in with your backend credentials.'
            : 'Register an account on the backend first.'}
        </p>

        {formMode === 'register' && (
          <div className="mb-5">
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              {roleCards.map(({ role, label, icon: Icon, desc }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedRole === role
                      ? 'border-sky-400 bg-sky-50'
                      : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${selectedRole === role ? 'text-sky-500' : 'text-gray-400'}`} />
                  <p style={{ fontSize: '13px', fontWeight: 700, color: selectedRole === role ? '#0369A1' : '#374151' }}>{label}</p>
                  <p style={{ fontSize: '11px', color: '#9CA3AF' }}>{desc}</p>
                  {selectedRole === role && (
                    <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-sky-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all mb-5"
          style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center mb-5">
          <div className="flex-1 h-px bg-gray-100" />
          <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }} className="px-4">or continue with email</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[56vh] overflow-auto pr-1">
          {formMode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    style={{ fontSize: '14px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    style={{ fontSize: '14px' }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0712345678"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    style={{ fontSize: '14px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Cluj"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    style={{ fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="RO"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  style={{ fontSize: '14px' }}
                />
              </div>

              {selectedRole === 'agency' && (
                <>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Agency Name</label>
                    <input
                      type="text"
                      value={agencyName}
                      onChange={e => setAgencyName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      style={{ fontSize: '14px' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Agency Description</label>
                    <textarea
                      value={agencyDescription}
                      onChange={e => setAgencyDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none"
                      style={{ fontSize: '14px' }}
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 focus:bg-white transition-all placeholder:text-gray-300"
              style={{ fontSize: '14px' }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="********"
                className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 focus:bg-white transition-all placeholder:text-gray-300"
                style={{ fontSize: '14px' }}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl text-white transition-all hover:opacity-90 disabled:opacity-60 mt-2"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '15px', fontWeight: 700, boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {formMode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              formMode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center' }} className="mt-6">
          {formMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              const nextMode = formMode === 'login' ? 'register' : 'login';
              setFormMode(nextMode);
              navigate(nextMode === 'login' ? '/login' : '/register');
            }}
            style={{ color: '#0EA5E9', fontWeight: 600 }}
            className="hover:underline"
          >
            {formMode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src={BG_IMAGE} alt="Travel" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(14,116,144,0.5))' }} />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <div className="rounded-3xl p-7 max-w-sm" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Trip Generator</span>
            </div>
            <p style={{ fontSize: '20px', fontWeight: 800, color: 'white', lineHeight: 1.35, letterSpacing: '-0.3px' }} className="mb-4">
              "Plan a 7-day Bali trip for 2, cultural focus, 3k budget"
            </p>
            <div className="space-y-2">
              {['Complete AI-generated itinerary in 10s', '6 agency offers in under 24 hours', 'Saved 450 dollars versus separate booking'].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
