import React from 'react';

const Navigation = ({ user, onLogout, isDarkMode, onToggleDark }) => {
  const roleColors = {
    ADMIN: { bg: 'bg-rose-500/10', text: 'text-rose-600', darkText: 'dark:text-rose-400', dot: 'bg-rose-500' },
    TEACHER: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', darkText: 'dark:text-indigo-400', dot: 'bg-indigo-500' },
    STUDENT: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', darkText: 'dark:text-emerald-400', dot: 'bg-emerald-500' },
  };
  const rc = roleColors[user?.role] || roleColors.STUDENT;

  return (
    <header
      className="nav-root w-full"
      style={{
        background: 'rgb(var(--bg-card))',
        borderBottom: '1px solid rgb(var(--border))',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: 'var(--shadow-xs)'
      }}>
      <div className="w-full max-w-[1440px] mx-auto px-5 md:px-10 h-[68px] flex items-center justify-between gap-4">

        {/* ── Brand ── */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0"
            style={{ background: 'linear-gradient(135deg, rgb(67 56 202), rgb(99 102 241))' }}>
            <i className="fas fa-brain text-white text-base" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-black text-base tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
              AI Teaching <span className="hidden md:inline">Assistant</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: 'rgb(var(--primary))' }}>
              Assessment Suite
            </span>
          </div>
        </div>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2 md:gap-4">

          {/* User info chip */}
          <div
            className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl"
            style={{ background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))' }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0"
              style={{ background: 'linear-gradient(135deg, rgb(67 56 202), rgb(99 102 241))' }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col leading-none">
              <span className="font-bold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                {user?.name}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                {user?.role} · {user?.role === 'STUDENT' ? (user?.rollNumber || 'REF-N/A') : (user?.department?.split(' ')[0] || 'Global')}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6" style={{ background: 'rgb(var(--border))' }} />

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            title={isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'rgb(var(--bg-surface))',
              border: '1px solid rgb(var(--border))',
              color: 'rgb(var(--text-muted))'
            }}>
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-base`}
              style={{ color: isDarkMode ? '#f59e0b' : 'rgb(var(--primary))' }} />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Logout"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'rgb(var(--bg-surface))',
              border: '1px solid rgb(var(--border))',
              color: 'rgb(var(--text-muted))'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgb(254 226 226)';
              e.currentTarget.style.color = 'rgb(220 38 38)';
              e.currentTarget.style.borderColor = 'rgb(254 202 202)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgb(var(--bg-surface))';
              e.currentTarget.style.color = 'rgb(var(--text-muted))';
              e.currentTarget.style.borderColor = 'rgb(var(--border))';
            }}>
            <i className="fas fa-power-off text-base" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
