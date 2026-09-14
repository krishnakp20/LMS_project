import { useMemo, useState } from 'react';
import { Navigate, useSearchParams } from '../../utils/browserRouter.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import LearnerCalendarView from './LearnerCalendarView.jsx';
import OperationsCalendarView from './OperationsCalendarView.jsx';
import './trainingCalendar.css';

const ROLE_CONFIG = {
  trainee: { 
    label: 'My Live Learning', 
    token: 'lms_token_trainee', 
    portal: '/lms',
    icon: '🎓',
    color: '#6366f1',
    bg: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
  },
  coordinator: { 
    label: 'Batch Calendar', 
    token: 'lms_token_coordinator', 
    portal: '/coordinator',
    icon: '📋',
    color: '#22c55e',
    bg: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
  },
  admin: { 
    label: 'Training Governance', 
    token: 'lms_token_admin', 
    portal: '/admin',
    icon: '⚙️',
    color: '#f59e0b',
    bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
};

export default function TrainingCalendarPage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [params, setParams] = useSearchParams();
  const available = useMemo(
    () => Object.entries(ROLE_CONFIG).filter(([, config]) => localStorage.getItem(config.token)).map(([role]) => role),
    [],
  );
  const requested = params.get('role');
  const [role, setRole] = useState(available.includes(requested) ? requested : available[0] || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!available.length) {
    return (
      <main className="ilt-login-shell" style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: theme === 'dark' ? '#0f172a' : '#f8fafc',
        padding: '20px',
      }}>
        <section style={{
          maxWidth: 480,
          width: '100%',
          padding: '40px 32px',
          background: theme === 'dark' ? '#1e293b' : '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          textAlign: 'center',
          border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 20px',
            color: '#fff',
            fontSize: 32,
          }}>
            📅
          </div>
          <span style={{
            display: 'inline-block',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#6366f1',
            background: 'rgba(99,102,241,0.1)',
            padding: '4px 16px',
            borderRadius: '99px',
            marginBottom: 12,
          }}>
            DialDesk LMS
          </span>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}>
            Live Training Calendar
          </h1>
          <p style={{
            fontSize: 14,
            color: theme === 'dark' ? '#94a3b8' : '#64748b',
            lineHeight: 1.6,
            marginBottom: 24,
          }}>
            Sign in through your LMS portal first. This calendar reuses your existing secure role session.
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {[
              { href: '/lms', label: 'Learner Login', icon: '🎓', color: '#6366f1' },
              { href: '/coordinator', label: 'Coordinator Login', icon: '📋', color: '#22c55e' },
              { href: '/admin', label: 'Administrator Login', icon: '⚙️', color: '#f59e0b' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                  color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                  transition: 'all 0.2s',
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = link.color + '15';
                  e.currentTarget.style.borderColor = link.color + '40';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc';
                  e.currentTarget.style.borderColor = theme === 'dark' ? '#334155' : '#e2e8f0';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <span style={{ fontSize: 20 }}>{link.icon}</span>
                {link.label}
                <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>→</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (!ROLE_CONFIG[role]) return <Navigate to="/" replace />;

  function changeRole(nextRole) {
    setRole(nextRole);
    setParams({ role: nextRole }, { replace: true });
    setIsMobileMenuOpen(false);
  }

  const currentConfig = ROLE_CONFIG[role];

  return (
    <main className="ilt-shell" style={{
      minHeight: '100vh',
      background: theme === 'dark' ? '#0f172a' : '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header className="ilt-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        background: theme === 'dark' ? '#1e293b' : '#ffffff',
        borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        {/* Brand */}
        <div className="ilt-brand" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 900,
            fontSize: 14,
            letterSpacing: '-0.02em',
            flexShrink: 0,
          }}>
            DL
          </div>
          <section>
            <b style={{
              fontSize: 18,
              fontWeight: 800,
              color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
              display: 'block',
              letterSpacing: '-0.02em',
            }}>
              DialDesk Training Calendar
            </b>
            <span style={{
              fontSize: 11,
              color: theme === 'dark' ? '#94a3b8' : '#64748b',
              display: 'block',
              marginTop: 2,
            }}>
              Instructor-led learning · Capacity · Attendance · Evidence
            </span>
          </section>
        </div>

        {/* Navigation */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}>
          {/* Role Selector - Desktop */}
          {available.length > 1 && (
            <div style={{ position: 'relative' }}>
              <select
                value={role}
                onChange={event => changeRole(event.target.value)}
                style={{
                  padding: '8px 36px 8px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                  background: theme === 'dark' ? '#0f172a' : '#ffffff',
                  color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  minWidth: 160,
                }}
              >
                {available.map(item => (
                  <option key={item} value={item}>
                    {ROLE_CONFIG[item].icon} {ROLE_CONFIG[item].label}
                  </option>
                ))}
              </select>
              <span style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#94a3b8',
              }}>
                ▼
              </span>
            </div>
          )}

          {/* Role Display - Mobile */}
          <div style={{
            display: 'none',
            '@media (max-width: 640px)': {
              display: 'flex',
            },
          }}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                background: theme === 'dark' ? '#0f172a' : '#ffffff',
                color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {currentConfig.icon} {currentConfig.label}
              <span style={{ fontSize: 10 }}>▼</span>
            </button>
            {isMobileMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                background: theme === 'dark' ? '#1e293b' : '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                padding: 6,
                minWidth: 200,
                zIndex: 200,
              }}>
                {available.map(item => (
                  <button
                    key={item}
                    onClick={() => changeRole(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 14px',
                      width: '100%',
                      border: 'none',
                      background: role === item ? 'rgba(99,102,241,0.1)' : 'transparent',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                      fontSize: 13,
                      fontWeight: role === item ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (role !== item) {
                        e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (role !== item) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span>{ROLE_CONFIG[item].icon}</span>
                    {ROLE_CONFIG[item].label}
                    {role === item && <span style={{ marginLeft: 'auto', color: '#6366f1' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Portal Link */}
          <a
            href={ROLE_CONFIG[role].portal}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
              color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
              e.currentTarget.style.borderColor = '#6366f140';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc';
              e.currentTarget.style.borderColor = theme === 'dark' ? '#334155' : '#e2e8f0';
            }}
          >
            <span>🏠</span> Portal
          </a>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title="Toggle appearance"
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
              color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
              cursor: 'pointer',
              fontSize: 16,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
              e.currentTarget.style.borderColor = '#6366f140';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc';
              e.currentTarget.style.borderColor = theme === 'dark' ? '#334155' : '#e2e8f0';
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
      </header>

      {/* Content */}
      <div className="ilt-content" style={{
        flex: 1,
        padding: '24px 32px',
        maxWidth: 1400,
        width: '100%',
        margin: '0 auto',
        overflow: 'auto',
      }}>
        {role === 'trainee' && <LearnerCalendarView />}
        {role === 'coordinator' && <OperationsCalendarView role="coordinator" />}
        {role === 'admin' && <OperationsCalendarView role="admin" />}
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .ilt-header {
            padding: 12px 16px !important;
          }
          .ilt-brand b {
            font-size: 16px !important;
          }
          .ilt-brand span {
            font-size: 10px !important;
          }
          .ilt-content {
            padding: 16px !important;
          }
          nav {
            gap: 6px !important;
          }
          nav > a,
          nav > button,
          nav > div > select {
            font-size: 12px !important;
            padding: 6px 12px !important;
          }
          nav > div > select {
            min-width: 120px !important;
            padding: 6px 30px 6px 10px !important;
          }
        }
        @media (max-width: 480px) {
          .ilt-brand {
            gap: 10px !important;
          }
          .ilt-brand > div {
            width: 36px !important;
            height: 36px !important;
            font-size: 12px !important;
          }
          .ilt-brand b {
            font-size: 14px !important;
          }
          .ilt-content {
            padding: 12px !important;
          }
          nav > a span {
            display: none !important;
          }
          nav > div > select {
            min-width: 100px !important;
          }
        }
      `}</style>
    </main>
  );
}