import React, { useState } from 'react';
import authService from '../services/authService';

const Landing = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const departments = [
    'Computer Science', 'Information Technology', 'Artificial Intelligence',
    'Data Science', 'Electronics & Communication', 'Electrical & Electronics',
    'Mechanical Engineering', 'Civil Engineering', 'Automobile Engineering',
    'Aerospace Engineering', 'Biotechnology', 'Chemical Engineering'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await authService.login(email, password);
      } else {
        data = await authService.register({ name, email, password, role, department, year });
      }
      onLogin(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(prev => !prev);
    setError('');
  };

  const features = [
    { icon: 'fa-brain', title: 'AI-Powered Assessment', desc: 'Auto-generate intelligent questions from uploaded course materials using advanced LLMs.' },
    { icon: 'fa-chart-line', title: 'Real-Time Analytics', desc: 'Track student performance with detailed insights, GPA calculations, and progress charts.' },
    { icon: 'fa-robot', title: 'Groq AI Evaluation', desc: 'Instant, consistent grading of descriptive answers powered by Groq AI, saving hours of work.' },
    { icon: 'fa-users-cog', title: 'Multi-Role Platform', desc: 'Seamless experience for Admins, Faculty, and Students — all in one unified portal.' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }} className="min-h-screen w-full flex flex-col bg-white">

      {/* ── Main Split Layout ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-screen">

        {/* ── LEFT PANEL – Brand & Features ── */}
        <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12 xl:p-16"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 65%, #6366f1 100%)' }}>

          {/* Decorative circles */}
          <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)' }} />
          <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
          <div className="absolute top-1/2 right-16 w-40 h-40 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #c7d2fe, transparent)' }} />

          {/* Top logo */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <i className="fas fa-brain text-white text-2xl" />
            </div>
            <div>
              <p className="text-white font-black text-xl tracking-tight leading-none">AI Teaching Assistant</p>
              <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mt-0.5">Formative Assessment Suite</p>
            </div>
          </div>

          {/* Headline */}
          <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 w-fit"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-xs font-black uppercase tracking-widest">Powered by Groq AI</span>
            </div>

            <h1 className="text-white font-black leading-tight mb-6"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', lineHeight: 1.15 }}>
              Transform How <br />
              <span style={{ background: 'linear-gradient(90deg, #a5b4fc, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Education is Assessed
              </span>
            </h1>
            <p className="text-indigo-200 text-lg font-medium leading-relaxed mb-10" style={{ maxWidth: '460px' }}>
              An intelligent platform where faculty create AI-powered assessments, students learn interactively,
              and admins manage everything — effortlessly.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-1 gap-4" style={{ maxWidth: '480px' }}>
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(165,180,252,0.2)' }}>
                    <i className={`fas ${f.icon} text-indigo-300 text-base`} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm mb-0.5">{f.title}</p>
                    <p className="text-indigo-300 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="relative z-10 flex items-center gap-8 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { val: '500+', label: 'Students Enrolled' },
              { val: '50+', label: 'AI Assessments' },
              { val: '99%', label: 'Accuracy Rate' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-white font-black text-2xl">{s.val}</p>
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL – Auth Form ── */}
        <div className="flex-1 lg:w-[45%] flex flex-col min-h-screen bg-gray-50">

          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 px-6 pt-8 pb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4338ca, #6366f1)' }}>
              <i className="fas fa-brain text-white" />
            </div>
            <div>
              <p className="font-black text-gray-900 text-base tracking-tight leading-none">AI Teaching Assistant</p>
              <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest">Assessment Suite</p>
            </div>
          </div>

          {/* Form area */}
          <div className="flex-1 flex items-center justify-center px-6 py-10">
            <div className="w-full" style={{ maxWidth: '420px' }}>

              {/* Welcome heading */}
              <div className="mb-8">
                <h2 className="font-black mb-2" style={{ fontSize: '1.875rem', lineHeight: 1.2, color: 'rgb(0 57 170)' }}>
                  {isLogin ? 'Welcome back! 👋' : 'Create your account'}
                </h2>
                <p className="text-gray-500 font-medium" style={{ fontSize: '1rem' }}>
                  {isLogin
                    ? 'Sign in to your academic portal and continue your journey.'
                    : 'Join thousands of students & faculty on the platform.'}
                </p>
              </div>

              {/* Tab switcher */}
              <div className="flex bg-white rounded-2xl p-1.5 mb-8 shadow-sm"
                style={{ border: '2px solid #e5e7eb' }}>
                <button type="button" onClick={() => { setIsLogin(true); setError(''); }}
                  className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2"
                  style={isLogin
                    ? { background: 'linear-gradient(135deg,#4338ca,#6366f1)', color: 'white', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }
                    : { color: '#9ca3af', background: 'transparent' }}>
                  <i className="fas fa-sign-in-alt" /> Login
                </button>
                <button type="button" onClick={() => { setIsLogin(false); setError(''); }}
                  className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2"
                  style={!isLogin
                    ? { background: 'linear-gradient(135deg,#4338ca,#6366f1)', color: 'white', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }
                    : { color: '#9ca3af', background: 'transparent' }}>
                  <i className="fas fa-user-plus" /> Sign Up
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 flex items-start gap-3 px-4 py-4 rounded-xl text-sm font-semibold"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                  <i className="fas fa-exclamation-circle mt-0.5 text-base" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Name - signup only */}
                {!isLogin && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-2" style={{ fontSize: '0.875rem' }}>Full Name</label>
                    <div className="relative">
                      <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" style={{ fontSize: '0.875rem' }} />
                      <input type="text" required placeholder="e.g. Priya Sharma"
                        className="w-full outline-none transition-all font-medium"
                        style={{
                          paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem',
                          background: 'white', border: '2px solid #e5e7eb', borderRadius: '0.875rem',
                          fontSize: '0.9375rem', color: '#111827'
                        }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        value={name} onChange={e => setName(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block font-bold text-gray-700 mb-2" style={{ fontSize: '0.875rem' }}>Email Address</label>
                  <div className="relative">
                    <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" style={{ fontSize: '0.875rem' }} />
                    <input type="email" required placeholder="student@college.edu"
                      className="w-full outline-none transition-all font-medium"
                      style={{
                        paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem',
                        background: 'white', border: '2px solid #e5e7eb', borderRadius: '0.875rem',
                        fontSize: '0.9375rem', color: '#111827'
                      }}
                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                      value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block font-bold text-gray-700 mb-2" style={{ fontSize: '0.875rem' }}>Password</label>
                  <div className="relative">
                    <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" style={{ fontSize: '0.875rem' }} />
                    <input type={showPassword ? 'text' : 'password'} required placeholder="Enter your password"
                      className="w-full outline-none transition-all font-medium"
                      style={{
                        paddingLeft: '2.75rem', paddingRight: '3rem', paddingTop: '0.875rem', paddingBottom: '0.875rem',
                        background: 'white', border: '2px solid #e5e7eb', borderRadius: '0.875rem',
                        fontSize: '0.9375rem', color: '#111827'
                      }}
                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                      value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors">
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: '0.875rem' }} />
                    </button>
                  </div>
                </div>

                {/* Role & Department - signup only */}
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 mb-2" style={{ fontSize: '0.875rem' }}>I Am A</label>
                      <div className="relative">
                        <i className="fas fa-id-badge absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" style={{ fontSize: '0.875rem' }} />
                        <select className="w-full outline-none appearance-none font-semibold cursor-pointer"
                          style={{
                            paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem',
                            background: 'white', border: '2px solid #e5e7eb', borderRadius: '0.875rem',
                            fontSize: '0.875rem', color: '#111827'
                          }}
                          onFocus={e => e.target.style.borderColor = '#6366f1'}
                          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                          value={role} onChange={e => setRole(e.target.value)}>
                          <option value="STUDENT">Student</option>
                          <option value="TEACHER">Faculty</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-2" style={{ fontSize: '0.875rem' }}>Department</label>
                      <div className="relative">
                        <i className="fas fa-building absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" style={{ fontSize: '0.875rem' }} />
                        <select className="w-full outline-none appearance-none font-semibold cursor-pointer"
                          style={{
                            paddingLeft: '2.75rem', paddingRight: '0.75rem', paddingTop: '0.875rem', paddingBottom: '0.875rem',
                            background: 'white', border: '2px solid #e5e7eb', borderRadius: '0.875rem',
                            fontSize: '0.875rem', color: '#111827'
                          }}
                          onFocus={e => e.target.style.borderColor = '#6366f1'}
                          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                          value={department} onChange={e => setDepartment(e.target.value)}>
                          {departments.map((dept, i) => (
                            <option key={i} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Year - signup only for students */}
                {!isLogin && role === 'STUDENT' && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-2" style={{ fontSize: '0.875rem' }}>Admission Year</label>
                    <div className="relative">
                      <i className="fas fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" style={{ fontSize: '0.875rem' }} />
                      <select className="w-full outline-none appearance-none font-semibold cursor-pointer"
                        style={{
                          paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem',
                          background: 'white', border: '2px solid #e5e7eb', borderRadius: '0.875rem',
                          fontSize: '0.875rem', color: '#111827'
                        }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        value={year} onChange={e => setYear(Number(e.target.value))}>
                        {[...Array(5)].map((_, i) => {
                          const y = new Date().getFullYear() - i;
                          return <option key={y} value={y}>{y}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full py-4 font-black text-base uppercase tracking-wider rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 mt-2"
                  style={{
                    background: loading ? '#a5b4fc' : 'linear-gradient(135deg,#4338ca,#6366f1)',
                    color: 'white',
                    boxShadow: loading ? 'none' : '0 8px 25px rgba(99,102,241,0.4)',
                    transform: loading ? 'scale(0.98)' : 'scale(1)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    border: 'none'
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'linear-gradient(135deg,#3730a3,#4f46e5)'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'linear-gradient(135deg,#4338ca,#6366f1)'; }}>
                  {loading
                    ? <><i className="fas fa-circle-notch fa-spin" /> Verifying...</>
                    : isLogin
                      ? <><i className="fas fa-sign-in-alt" /> Sign In to Portal</>
                      : <><i className="fas fa-user-plus" /> Create My Account</>
                  }
                </button>
              </form>

              {/* Switch mode */}
              <div className="mt-6 pt-6 text-center" style={{ borderTop: '2px solid #f3f4f6' }}>
                <p className="text-gray-500 mb-4" style={{ fontSize: '0.9375rem' }}>
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                </p>
                <button type="button" onClick={switchMode}
                  className="w-full py-3.5 font-black text-sm uppercase tracking-wider rounded-2xl transition-all duration-300 flex items-center justify-center gap-3"
                  style={{
                    background: 'white', color: '#4338ca',
                    border: '2px solid #6366f1', borderRadius: '0.875rem'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
                  <i className={`fas ${isLogin ? 'fa-user-plus' : 'fa-arrow-left'}`} />
                  {isLogin ? 'Sign Up for Free' : '← Back to Login'}
                </button>
              </div>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <footer className="px-6 py-6" style={{ borderTop: '1px solid #f3f4f6', background: 'white' }}>
            <div className="max-w-md mx-auto">
              {/* Links row */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-4">
                {['Privacy Policy', 'Terms of Use', 'Support', 'Contact Us'].map((link, i) => (
                  <a key={i} href="#"
                    className="font-semibold transition-colors"
                    style={{ color: '#6b7280', fontSize: '0.8125rem', textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.color = '#4338ca'}
                    onMouseLeave={e => e.target.style.color = '#6b7280'}>
                    {link}
                  </a>
                ))}
              </div>

              {/* Divider with logo */}
              <div className="flex items-center gap-3 justify-center mb-3">
                <div className="h-px flex-1" style={{ background: '#f3f4f6' }} />
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#4338ca,#6366f1)' }}>
                  <i className="fas fa-brain text-white" style={{ fontSize: '0.75rem' }} />
                </div>
                <div className="h-px flex-1" style={{ background: '#f3f4f6' }} />
              </div>

              {/* Copyright and info */}
              <p className="text-center font-semibold" style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>
                © 2026 AI Teaching Assistant — Formative Assessment Suite
              </p>
              <p className="text-center mt-1" style={{ color: '#d1d5db', fontSize: '0.75rem' }}>
                Built with Groq AI • Pinecone Vector DB • React + Node.js
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Landing;
