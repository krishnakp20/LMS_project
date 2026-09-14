import { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/api.js';

const emptySession = {
  title: '', description: '', batchNo: '', branch: '', classroomId: '', moduleId: '',
  sessionType: 'ILT', deliveryMode: 'IN_PERSON', venueId: '', virtualJoinUrl: '',
  timezone: 'Asia/Kolkata', startAt: '', endAt: '', capacity: 25, minimumAttendees: 1,
  minimumAttendancePct: 80, waitlistEnabled: true, selfEnrollmentEnabled: true,
  repeatCount: 1, repeatEveryDays: 1, leadInstructorId: '',
};
const emptyVenue = { venueCode: '', venueName: '', branch: '', venueType: 'CLASSROOM', roomLocation: '', timezone: 'Asia/Kolkata', capacity: 25, virtualJoinUrl: '', accessibilityNotes: '', active: true };
const emptyInstructor = { userId: '', userType: 'coordinator', instructorName: '', email: '', branch: '', processName: '', lobName: '', maxDailyMinutes: 480, active: true };
const emptyPolicy = { branch: '', processName: '', lobName: '', defaultCapacity: 25, waitlistEnabled: true, autoPromoteWaitlist: true, selfEnrollmentEnabled: true, minimumAttendancePct: 80, checkinOpenBeforeMins: 30, checkinCloseAfterMins: 30, cancellationCutoffMins: 120, active: true };

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusClass(value) {
  const status = String(value || '').toUpperCase();
  if (['PUBLISHED', 'COMPLETED', 'CONFIRMED', 'ATTENDED', 'PRESENT'].includes(status)) return 'ok';
  if (['DRAFT', 'WAITLISTED', 'LATE', 'IN_PROGRESS'].includes(status)) return 'warn';
  if (['CANCELLED', 'NO_SHOW', 'ABSENT'].includes(status)) return 'bad';
  return 'info';
}

function statusIcon(value) {
  const status = String(value || '').toUpperCase();
  if (['PUBLISHED', 'COMPLETED', 'CONFIRMED', 'ATTENDED', 'PRESENT'].includes(status)) return '✅';
  if (['DRAFT', 'WAITLISTED', 'LATE', 'IN_PROGRESS'].includes(status)) return '⏳';
  if (['CANCELLED', 'NO_SHOW', 'ABSENT'].includes(status)) return '❌';
  return 'ℹ️';
}

function Field({ label, children, required = false }) {
  return (
    <label className="ilt-field" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--muted)',
        letterSpacing: '0.02em',
      }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </span>
      {children}
    </label>
  );
}

function StatusBadge({ status }) {
  const cls = statusClass(status);
  const icon = statusIcon(status);
  const colors = {
    ok: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'rgba(34,197,94,0.2)' },
    warn: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
    bad: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
    info: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', border: 'rgba(99,102,241,0.2)' },
  };
  const style = colors[cls] || colors.info;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 10px',
      borderRadius: '99px',
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>
      {icon} {status}
    </span>
  );
}

function StatCard({ label, value, sub, icon, trend }) {
  return (
    <div style={{
      padding: '16px 20px',
      borderRadius: '14px',
      background: 'var(--card-solid)',
      border: '1px solid var(--line)',
      transition: 'all 0.2s',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
      }}>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {label}
        </span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{
        fontSize: 28,
        fontWeight: 800,
        color: 'var(--ink)',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontSize: 12,
          color: 'var(--muted)',
          marginTop: 4,
        }}>
          {sub}
        </div>
      )}
      {trend && (
        <div style={{
          fontSize: 11,
          color: trend > 0 ? '#22c55e' : '#ef4444',
          marginTop: 4,
          fontWeight: 600,
        }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
        </div>
      )}
    </div>
  );
}

export default function OperationsCalendarView({ role }) {
  const prefix = `/ilt/${role}`;
  const [dashboard, setDashboard] = useState({ sessions: [], summary: {} });
  const [catalog, setCatalog] = useState({ venues: [], instructors: [], policies: [], classrooms: [], modules: [], batches: [], skills: [] });
  const [view, setView] = useState('calendar');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [checkinCode, setCheckinCode] = useState(null);
  const [sessionForm, setSessionForm] = useState(emptySession);
  const [venueForm, setVenueForm] = useState(emptyVenue);
  const [instructorForm, setInstructorForm] = useState(emptyInstructor);
  const [policyForm, setPolicyForm] = useState(emptyPolicy);
  const [filter, setFilter] = useState('');

  async function load() {
    setLoading(true); setError('');
    const [dashboardResult, catalogResult] = await Promise.all([
      api.get(`${prefix}/dashboard`, role),
      api.get(`${prefix}/catalog`, role),
    ]);
    setLoading(false);
    if (!dashboardResult.ok) return setError(dashboardResult.message || 'Could not load the live-training dashboard.');
    setDashboard(dashboardResult.data || { sessions: [], summary: {} });
    if (catalogResult.ok) setCatalog(catalogResult.data || {});
  }

  useEffect(() => { load(); }, [role]);

  async function openSession(sessionId) {
    setBusy(`detail-${sessionId}`); setError('');
    const result = await api.get(`${prefix}/sessions/${encodeURIComponent(sessionId)}`, role);
    setBusy('');
    if (!result.ok) return setError(result.message || 'Could not load session details.');
    setSelected(result.data);
  }

  async function createSession(event) {
    event.preventDefault();
    setBusy('create'); setError(''); setMessage('');
    const body = {
      ...sessionForm,
      instructorAssignments: sessionForm.leadInstructorId ? [{ instructorId: sessionForm.leadInstructorId, instructorRole: 'LEAD' }] : [],
    };
    const result = await api.post(`${prefix}/sessions`, body, role);
    setBusy('');
    if (!result.ok) return setError(result.message || 'Could not create the session.');
    setMessage(result.message || 'Draft session created.');
    setSessionForm(emptySession);
    setView('calendar');
    await load();
  }

  async function lifecycle(action, sessionId, body = {}) {
    setBusy(`${action}-${sessionId}`); setError(''); setMessage('');
    const result = await api.post(`${prefix}/sessions/${encodeURIComponent(sessionId)}/${action}`, body, role);
    setBusy('');
    if (!result.ok) return setError(result.message || `Could not ${action} the session.`);
    setMessage(result.message || `Session ${action} completed.`);
    if (action === 'check-in-code') setCheckinCode({ ...result.data, sessionId });
    await load();
    if (selected?.session?.sessionId === sessionId) await openSession(sessionId);
  }

  async function bulkEnroll(session) {
    if (!session.batchNo) return setError('Select a batch-specific session before bulk enrolment.');
    await lifecycle('enroll', session.sessionId, { batchNo: session.batchNo });
  }

  async function cancelSession(session) {
    const reason = window.prompt('Provide the session cancellation reason:', 'Operational schedule change');
    if (reason === null) return;
    await lifecycle('cancel', session.sessionId, { reason });
  }

  async function saveAttendance(employeeId, attendanceStatus) {
    const sessionId = selected?.session?.sessionId;
    if (!sessionId) return;
    setBusy(`attendance-${employeeId}`); setError(''); setMessage('');
    const result = await api.put(`${prefix}/sessions/${encodeURIComponent(sessionId)}/attendance/${encodeURIComponent(employeeId)}`, { attendanceStatus, source: 'INSTRUCTOR' }, role);
    setBusy('');
    if (!result.ok) return setError(result.message || 'Could not save attendance.');
    setMessage(`Attendance saved for ${employeeId}.`);
    await openSession(sessionId);
  }

  async function saveVenue(event) {
    event.preventDefault(); setBusy('venue'); setError(''); setMessage('');
    const result = await api.post('/ilt/admin/venues', venueForm, 'admin');
    setBusy('');
    if (!result.ok) return setError(result.message || 'Could not create venue.');
    setMessage('Venue created.'); setVenueForm(emptyVenue); await load();
  }

  async function saveInstructor(event) {
    event.preventDefault(); setBusy('instructor'); setError(''); setMessage('');
    const result = await api.post('/ilt/admin/instructors', instructorForm, 'admin');
    setBusy('');
    if (!result.ok) return setError(result.message || 'Could not save instructor.');
    setMessage('Instructor profile saved.'); setInstructorForm(emptyInstructor); await load();
  }

  async function savePolicy(event) {
    event.preventDefault(); setBusy('policy'); setError(''); setMessage('');
    const result = await api.put('/ilt/admin/policies', policyForm, 'admin');
    setBusy('');
    if (!result.ok) return setError(result.message || 'Could not save policy.');
    setMessage('Live-training policy saved.'); setPolicyForm(emptyPolicy); await load();
  }

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return dashboard.sessions || [];
    return (dashboard.sessions || []).filter(item => [item.title, item.sessionCode, item.batchNo, item.venueName, item.branch, item.processName].some(value => String(value || '').toLowerCase().includes(query)));
  }, [dashboard.sessions, filter]);
  const modules = useMemo(() => (catalog.modules || []).filter(item => !sessionForm.classroomId || item.classroomId === sessionForm.classroomId), [catalog.modules, sessionForm.classroomId]);
  const selectedAttendance = useMemo(() => new Map((selected?.attendance || []).map(item => [item.employeeId, item])), [selected]);

  if (loading) return (
    <div style={{
      display: 'grid',
      placeItems: 'center',
      minHeight: '60vh',
      gap: 16,
    }}>
      <div className="spinner" style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '4px solid var(--line)',
        borderTopColor: '#6366f1',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading live-training operations…</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return (
    <section className="ilt-view" style={{
      padding: '24px 0',
      maxWidth: 1400,
      margin: '0 auto',
    }}>
      {/* Hero Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 28,
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <span style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#6366f1',
            background: 'rgba(99,102,241,0.1)',
            padding: '4px 14px',
            borderRadius: '99px',
            marginBottom: 8,
          }}>
            {role === 'admin' ? '🏛️ Branch & Company Governance' : '📋 Owned-Batch Operations'}
          </span>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--ink)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            {role === 'admin' ? 'Instructor-led Training Governance' : 'Batch Training Calendar'}
          </h1>
          <p style={{
            fontSize: 14,
            color: 'var(--muted)',
            marginTop: 4,
            maxWidth: 600,
          }}>
            Create conflict-free sessions, protect capacity, promote waitlists automatically and finalize attendance into auditable LMS evidence.
          </p>
        </div>
        <button
          className="btn small secondary"
          onClick={load}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            background: 'var(--card-solid)',
            color: 'var(--ink)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
            e.currentTarget.style.borderColor = '#6366f140';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--card-solid)';
            e.currentTarget.style.borderColor = 'var(--line)';
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Toast Messages */}
      {message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: 16,
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: '#22c55e' }}>✅ {message}</span>
          <button
            onClick={() => setMessage('')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              color: '#94a3b8',
            }}
          >
            ✕
          </button>
        </div>
      )}
      {error && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: 16,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: '#ef4444' }}>❌ {error}</span>
          <button
            onClick={() => setError('')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              color: '#94a3b8',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14,
        marginBottom: 24,
      }}>
        <StatCard
          label="Total Sessions"
          value={dashboard.summary?.total || 0}
          sub={`${dashboard.summary?.draft || 0} drafts`}
          icon="📚"
        />
        <StatCard
          label="Published"
          value={dashboard.summary?.published || 0}
          sub="Open and scheduled"
          icon="✅"
        />
        <StatCard
          label="Waitlisted"
          value={dashboard.summary?.waitlisted || 0}
          sub="Pending seat promotion"
          icon="⏳"
        />
        <StatCard
          label="Utilization"
          value={`${Number(dashboard.summary?.averageUtilization || 0).toFixed(0)}%`}
          sub={`${dashboard.summary?.noShows || 0} no-shows`}
          icon="📊"
        />
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 24,
        background: 'var(--card-solid)',
        borderRadius: '12px',
        padding: 4,
        border: '1px solid var(--line)',
        flexWrap: 'wrap',
      }}>
        <button
          className={view === 'calendar' ? 'active' : ''}
          onClick={() => setView('calendar')}
          style={{
            flex: 1,
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: view === 'calendar' ? '#6366f1' : 'transparent',
            color: view === 'calendar' ? '#fff' : 'var(--muted)',
            fontWeight: view === 'calendar' ? 700 : 500,
            fontSize: 13,
            transition: 'all 0.15s',
            minWidth: 120,
          }}
        >
          📅 Calendar
        </button>
        <button
          className={view === 'create' ? 'active' : ''}
          onClick={() => setView('create')}
          style={{
            flex: 1,
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: view === 'create' ? '#6366f1' : 'transparent',
            color: view === 'create' ? '#fff' : 'var(--muted)',
            fontWeight: view === 'create' ? 700 : 500,
            fontSize: 13,
            transition: 'all 0.15s',
            minWidth: 120,
          }}
        >
          ✨ Create Session
        </button>
        {role === 'admin' && (
          <button
            className={view === 'governance' ? 'active' : ''}
            onClick={() => setView('governance')}
            style={{
              flex: 1,
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: view === 'governance' ? '#6366f1' : 'transparent',
              color: view === 'governance' ? '#fff' : 'var(--muted)',
              fontWeight: view === 'governance' ? 700 : 500,
              fontSize: 13,
              transition: 'all 0.15s',
              minWidth: 120,
            }}
          >
            ⚙️ Venues & Policy
          </button>
        )}
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 20,
          alignItems: 'start',
        }}>
          {/* Session Register */}
          <section style={{
            background: 'var(--card-solid)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <div>
                <h2 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: 0,
                }}>
                  Session Register
                </h2>
                <p style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  margin: '2px 0 0',
                }}>
                  Draft, published, running and completed sessions in your scope
                </p>
              </div>
              <input
                className="input ilt-search"
                value={filter}
                onChange={event => setFilter(event.target.value)}
                placeholder="🔍 Search session, batch or venue"
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  fontSize: 13,
                  outline: 'none',
                  minWidth: 220,
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
              />
            </div>

            <div style={{
              maxHeight: 600,
              overflowY: 'auto',
              padding: '8px',
            }}>
              {filtered.map(session => (
                <article
                  key={session.sessionId}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    marginBottom: 6,
                    background: selected?.session?.sessionId === session.sessionId ? 'rgba(99,102,241,0.06)' : 'transparent',
                    border: selected?.session?.sessionId === session.sessionId ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (selected?.session?.sessionId !== session.sessionId) {
                      e.currentTarget.style.background = 'var(--card)';
                      e.currentTarget.style.borderColor = 'var(--line)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selected?.session?.sessionId !== session.sessionId) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4,
                      }}>
                        <StatusBadge status={session.status} />
                        <span style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                          fontWeight: 500,
                        }}>
                          {session.sessionCode}
                        </span>
                      </div>
                      <h3 style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        margin: '4px 0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {session.title}
                      </h3>
                      <p style={{
                        fontSize: 12,
                        color: 'var(--muted)',
                        margin: 0,
                      }}>
                        📅 {formatDate(session.startAt)}
                      </p>
                      <div style={{
                        display: 'flex',
                        gap: 12,
                        marginTop: 6,
                        flexWrap: 'wrap',
                      }}>
                        <span style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                          background: 'var(--card)',
                          padding: '2px 10px',
                          borderRadius: '99px',
                        }}>
                          {session.deliveryMode}
                        </span>
                        {session.batchNo && (
                          <span style={{
                            fontSize: 11,
                            color: 'var(--muted)',
                            background: 'var(--card)',
                            padding: '2px 10px',
                            borderRadius: '99px',
                          }}>
                            📦 {session.batchNo}
                          </span>
                        )}
                        <span style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                          background: 'var(--card)',
                          padding: '2px 10px',
                          borderRadius: '99px',
                        }}>
                          👥 {session.confirmedCount}/{session.capacity}
                        </span>
                        {session.waitlistCount > 0 && (
                          <span style={{
                            fontSize: 11,
                            color: '#f59e0b',
                            background: 'rgba(245,158,11,0.1)',
                            padding: '2px 10px',
                            borderRadius: '99px',
                          }}>
                            ⏳ {session.waitlistCount} waiting
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: 6,
                      flexWrap: 'wrap',
                      flexShrink: 0,
                    }}>
                      <button
                        className="btn xs secondary"
                        onClick={() => openSession(session.sessionId)}
                        disabled={busy === `detail-${session.sessionId}`}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--line)',
                          background: 'var(--card-solid)',
                          color: 'var(--ink)',
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 600,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                          e.currentTarget.style.borderColor = '#6366f140';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--card-solid)';
                          e.currentTarget.style.borderColor = 'var(--line)';
                        }}
                      >
                        📖 Open
                      </button>
                      {session.status === 'DRAFT' && (
                        <button
                          className="btn xs"
                          onClick={() => lifecycle('publish', session.sessionId)}
                          disabled={busy}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#6366f1',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#4f46e5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#6366f1';
                          }}
                        >
                          📤 Publish
                        </button>
                      )}
                      {session.status === 'PUBLISHED' && session.batchNo && (
                        <button
                          className="btn xs secondary"
                          onClick={() => bulkEnroll(session)}
                          disabled={busy}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            background: 'var(--card-solid)',
                            color: 'var(--ink)',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(34,197,94,0.1)';
                            e.currentTarget.style.borderColor = '#22c55e40';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--card-solid)';
                            e.currentTarget.style.borderColor = 'var(--line)';
                          }}
                        >
                          👥 Enrol
                        </button>
                      )}
                      {session.status === 'PUBLISHED' && (
                        <button
                          className="btn xs secondary"
                          onClick={() => lifecycle('check-in-code', session.sessionId)}
                          disabled={busy}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            background: 'var(--card-solid)',
                            color: 'var(--ink)',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                            e.currentTarget.style.borderColor = '#6366f140';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--card-solid)';
                            e.currentTarget.style.borderColor = 'var(--line)';
                          }}
                        >
                          🔑 Code
                        </button>
                      )}
                      {session.status === 'PUBLISHED' && (
                        <button
                          className="btn xs danger"
                          onClick={() => cancelSession(session)}
                          disabled={busy}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(239,68,68,0.2)',
                            background: 'rgba(239,68,68,0.08)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                          }}
                        >
                          ❌ Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
              {!filtered.length && (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                  <b style={{ fontSize: 15, color: 'var(--ink)', display: 'block' }}>
                    No matching sessions
                  </b>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
                    Create the first draft or change the search filter.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Detail Panel */}
          <aside style={{
            background: 'var(--card-solid)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            overflow: 'hidden',
            position: 'sticky',
            top: 20,
          }}>
            {selected ? (
              <div>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}>
                  <div>
                    <StatusBadge status={selected.session.status} />
                    <h2 style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: 'var(--ink)',
                      margin: '8px 0 2px',
                    }}>
                      {selected.session.title}
                    </h2>
                    <p style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      margin: 0,
                    }}>
                      {selected.session.sessionCode} · {formatDate(selected.session.startAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 20,
                      cursor: 'pointer',
                      color: 'var(--muted)',
                      padding: '0 4px',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ padding: '16px 20px' }}>
                  {/* Meta info */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    marginBottom: 16,
                  }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, display: 'block' }}>
                        Venue
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--ink)' }}>
                        {selected.session.venueName || 'Virtual / TBD'}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, display: 'block' }}>
                        Capacity
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--ink)' }}>
                        {selected.enrollments.filter(item => ['CONFIRMED', 'ATTENDED'].includes(item.status)).length}/{selected.session.capacity}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, display: 'block' }}>
                        Waitlist
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--ink)' }}>
                        {selected.enrollments.filter(item => item.status === 'WAITLISTED').length}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, display: 'block' }}>
                        Attendance Rule
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--ink)' }}>
                        {Number(selected.session.minimumAttendancePct || 0).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Instructors */}
                  <h3 style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    margin: '0 0 8px',
                  }}>
                    👨‍🏫 Instructors
                  </h3>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginBottom: 16,
                  }}>
                    {selected.instructors.map(item => (
                      <span key={item.id} style={{
                        fontSize: 12,
                        color: 'var(--ink)',
                        background: 'var(--card)',
                        padding: '4px 12px',
                        borderRadius: '99px',
                        border: '1px solid var(--line)',
                      }}>
                        {item.instructorName} · {item.instructorRole}
                      </span>
                    ))}
                    {!selected.instructors.length && (
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        No instructor assigned
                      </span>
                    )}
                  </div>

                  {/* Attendance List */}
                  <h3 style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    margin: '0 0 8px',
                  }}>
                    👥 Learners & Attendance
                  </h3>
                  <div style={{
                    maxHeight: 300,
                    overflowY: 'auto',
                    marginBottom: 12,
                  }}>
                    {selected.enrollments.filter(item => item.status !== 'CANCELLED').map(item => {
                      const attendance = selectedAttendance.get(item.employeeId);
                      return (
                        <article key={item.enrollmentId} style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          marginBottom: 4,
                          background: 'var(--card)',
                          border: '1px solid var(--line)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <b style={{ fontSize: 13, color: 'var(--ink)', display: 'block' }}>
                              {item.traineeName || item.employeeId}
                            </b>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                              {item.employeeId} · {item.status}
                              {item.waitlistPosition ? ` #${item.waitlistPosition}` : ''}
                            </span>
                            {attendance && (
                              <small style={{
                                display: 'block',
                                fontSize: 10,
                                color: attendance.attendanceStatus === 'PRESENT' ? '#22c55e' : '#ef4444',
                              }}>
                                {attendance.attendanceStatus} · {Number(attendance.attendancePct || 0).toFixed(0)}%
                              </small>
                            )}
                          </div>
                          {selected.session.status !== 'COMPLETED' && item.status !== 'WAITLISTED' && (
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <button
                                className="btn xs ok"
                                disabled={busy === `attendance-${item.employeeId}`}
                                onClick={() => saveAttendance(item.employeeId, 'PRESENT')}
                                style={{
                                  padding: '2px 10px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  background: 'rgba(34,197,94,0.15)',
                                  color: '#22c55e',
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(34,197,94,0.25)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(34,197,94,0.15)';
                                }}
                              >
                                ✅ Present
                              </button>
                              <button
                                className="btn xs danger"
                                disabled={busy === `attendance-${item.employeeId}`}
                                onClick={() => saveAttendance(item.employeeId, 'ABSENT')}
                                style={{
                                  padding: '2px 10px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  background: 'rgba(239,68,68,0.12)',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(239,68,68,0.22)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                                }}
                              >
                                ❌ Absent
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  {selected.session.status === 'PUBLISHED' && (
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      paddingTop: 12,
                      borderTop: '1px solid var(--line)',
                    }}>
                      <button
                        className="btn secondary"
                        onClick={() => lifecycle('check-in-code', selected.session.sessionId)}
                        disabled={busy}
                        style={{
                          flex: 1,
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                          background: 'var(--card-solid)',
                          color: 'var(--ink)',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                          e.currentTarget.style.borderColor = '#6366f140';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--card-solid)';
                          e.currentTarget.style.borderColor = 'var(--line)';
                        }}
                      >
                        🔑 Generate Check-in Code
                      </button>
                      <button
                        className="btn"
                        onClick={() => lifecycle('finalize', selected.session.sessionId)}
                        disabled={busy}
                        style={{
                          flex: 1,
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#6366f1',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#4f46e5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#6366f1';
                        }}
                      >
                        📊 Finalize Attendance
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '48px 20px',
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                <b style={{ fontSize: 15, color: 'var(--ink)', display: 'block' }}>
                  Open a Session
                </b>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
                  Review instructors, enrolments, attendance and lifecycle actions here.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Create Session View */}
      {view === 'create' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: 20,
          alignItems: 'start',
        }}>
          <form
            className="ilt-panel ilt-form-card"
            onSubmit={createSession}
            style={{
              background: 'var(--card-solid)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              padding: '24px',
            }}
          >
            <div style={{
              marginBottom: 20,
            }}>
              <h2 style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--ink)',
                margin: 0,
              }}>
                ✨ Create Live Session
              </h2>
              <p style={{
                fontSize: 13,
                color: 'var(--muted)',
                margin: '4px 0 0',
              }}>
                Sessions remain draft until conflict and lead-instructor gates pass.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
            }}>
              <Field label="Session Title" required>
                <input
                  className="input"
                  required
                  value={sessionForm.title}
                  onChange={event => setSessionForm(form => ({ ...form, title: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
              <Field label="Batch" required={role === 'coordinator'}>
                <select
                  className="select"
                  required={role === 'coordinator'}
                  value={sessionForm.batchNo}
                  onChange={event => {
                    const batch = (catalog.batches || []).find(item => item.batchNo === event.target.value);
                    setSessionForm(form => ({
                      ...form,
                      batchNo: event.target.value,
                      branch: batch?.branch || form.branch,
                      classroomId: form.classroomId
                    }));
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                  }}
                >
                  <option value="">Open / no batch</option>
                  {(catalog.batches || []).map(item => (
                    <option key={item.batchNo} value={item.batchNo}>
                      {item.batchName} · {item.batchNo}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {role === 'admin' && (
              <Field label="Branch">
                <input
                  className="input"
                  value={sessionForm.branch}
                  onChange={event => setSessionForm(form => ({ ...form, branch: event.target.value }))}
                  placeholder="Derived from batch when selected"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
            )}

            <Field label="Description">
              <textarea
                className="input"
                value={sessionForm.description}
                onChange={event => setSessionForm(form => ({ ...form, description: event.target.value }))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  fontSize: 13,
                  outline: 'none',
                  width: '100%',
                  minHeight: 60,
                  resize: 'vertical',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
              />
            </Field>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
            }}>
              <Field label="Classroom">
                <select
                  className="select"
                  value={sessionForm.classroomId}
                  onChange={event => setSessionForm(form => ({ ...form, classroomId: event.target.value, moduleId: '' }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                  }}
                >
                  <option value="">No classroom link</option>
                  {(catalog.classrooms || []).map(item => (
                    <option key={item.classroomId} value={item.classroomId}>
                      {item.classroomName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Module">
                <select
                  className="select"
                  value={sessionForm.moduleId}
                  onChange={event => setSessionForm(form => ({ ...form, moduleId: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                  }}
                >
                  <option value="">No module link</option>
                  {modules.map(item => (
                    <option key={item.moduleId} value={item.moduleId}>
                      Day {item.dayNo} · {item.moduleTitle}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
            }}>
              <Field label="Session Type">
                <select
                  className="select"
                  value={sessionForm.sessionType}
                  onChange={event => setSessionForm(form => ({ ...form, sessionType: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                  }}
                >
                  {['ILT', 'VILT', 'WORKSHOP', 'PRACTICE', 'CALIBRATION', 'COACHING'].map(item => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Delivery Mode">
                <select
                  className="select"
                  value={sessionForm.deliveryMode}
                  onChange={event => setSessionForm(form => ({ ...form, deliveryMode: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                  }}
                >
                  {['IN_PERSON', 'VIRTUAL', 'HYBRID'].map(item => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
            }}>
              <Field label="Venue">
                <select
                  className="select"
                  value={sessionForm.venueId}
                  onChange={event => {
                    const venue = (catalog.venues || []).find(item => item.venueId === event.target.value);
                    setSessionForm(form => ({
                      ...form,
                      venueId: event.target.value,
                      capacity: venue ? Math.min(Number(form.capacity), Number(venue.capacity)) : form.capacity
                    }));
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                  }}
                >
                  <option value="">No physical venue</option>
                  {(catalog.venues || []).map(item => (
                    <option key={item.venueId} value={item.venueId}>
                      {item.venueName} · {item.capacity} seats
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Lead Instructor" required>
                <select
                  className="select"
                  required
                  value={sessionForm.leadInstructorId}
                  onChange={event => setSessionForm(form => ({ ...form, leadInstructorId: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                  }}
                >
                  <option value="">Select instructor</option>
                  {(catalog.instructors || []).map(item => (
                    <option key={item.instructorId} value={item.instructorId}>
                      {item.instructorName}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {['VIRTUAL', 'HYBRID'].includes(sessionForm.deliveryMode) && (
              <Field label="Virtual Join URL">
                <input
                  className="input"
                  type="url"
                  value={sessionForm.virtualJoinUrl}
                  onChange={event => setSessionForm(form => ({ ...form, virtualJoinUrl: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
            }}>
              <Field label="Starts" required>
                <input
                  className="input"
                  type="datetime-local"
                  required
                  value={sessionForm.startAt}
                  onChange={event => setSessionForm(form => ({ ...form, startAt: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
              <Field label="Ends" required>
                <input
                  className="input"
                  type="datetime-local"
                  required
                  value={sessionForm.endAt}
                  onChange={event => setSessionForm(form => ({ ...form, endAt: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 14,
            }}>
              <Field label="Capacity">
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="10000"
                  value={sessionForm.capacity}
                  onChange={event => setSessionForm(form => ({ ...form, capacity: Number(event.target.value) }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
              <Field label="Attendance %">
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  value={sessionForm.minimumAttendancePct}
                  onChange={event => setSessionForm(form => ({ ...form, minimumAttendancePct: Number(event.target.value) }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
              <Field label="Occurrences">
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="60"
                  value={sessionForm.repeatCount}
                  onChange={event => setSessionForm(form => ({ ...form, repeatCount: Number(event.target.value) }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
            </div>

            <div style={{
              display: 'flex',
              gap: 16,
              margin: '12px 0',
              flexWrap: 'wrap',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'var(--ink)',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={sessionForm.waitlistEnabled}
                  onChange={event => setSessionForm(form => ({ ...form, waitlistEnabled: event.target.checked }))}
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: '#6366f1',
                  }}
                />
                Enable waitlist
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'var(--ink)',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={sessionForm.selfEnrollmentEnabled}
                  onChange={event => setSessionForm(form => ({ ...form, selfEnrollmentEnabled: event.target.checked }))}
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: '#6366f1',
                  }}
                />
                Allow self-enrolment
              </label>
            </div>

            <button
              className="btn"
              disabled={busy === 'create'}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {busy === 'create' ? '⏳ Creating…' : '🚀 Create Draft Session'}
            </button>
          </form>

          <aside style={{
            background: 'var(--card-solid)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            padding: '20px',
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              ⚡ Publication Gates
            </span>
            <h3 style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--ink)',
              margin: '8px 0 12px',
            }}>
              What the LMS Checks
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              <li style={{
                padding: '8px 0',
                borderBottom: '1px solid var(--line)',
                fontSize: 13,
                color: 'var(--muted)',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}>
                <span style={{ color: '#6366f1' }}>✓</span>
                A confirmed lead instructor is assigned.
              </li>
              <li style={{
                padding: '8px 0',
                borderBottom: '1px solid var(--line)',
                fontSize: 13,
                color: 'var(--muted)',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}>
                <span style={{ color: '#6366f1' }}>✓</span>
                The venue has enough capacity.
              </li>
              <li style={{
                padding: '8px 0',
                borderBottom: '1px solid var(--line)',
                fontSize: 13,
                color: 'var(--muted)',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}>
                <span style={{ color: '#6366f1' }}>✓</span>
                The venue, batch and instructors have no overlapping published session.
              </li>
              <li style={{
                padding: '8px 0',
                fontSize: 13,
                color: 'var(--muted)',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}>
                <span style={{ color: '#6366f1' }}>✓</span>
                Registration, attendance and waitlist rules remain server-controlled.
              </li>
            </ul>
          </aside>
        </div>
      )}

      {/* Governance View */}
      {view === 'governance' && role === 'admin' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 20,
        }}>
          {/* Venue Form */}
          <form
            className="ilt-panel ilt-form-card"
            onSubmit={saveVenue}
            style={{
              background: 'var(--card-solid)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              padding: '20px',
            }}
          >
            <h2 style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--ink)',
              margin: '0 0 16px',
            }}>
              🏢 Create Venue
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}>
              <Field label="Venue Code" required>
                <input
                  className="input"
                  required
                  value={venueForm.venueCode}
                  onChange={event => setVenueForm(form => ({ ...form, venueCode: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
              <Field label="Venue Name" required>
                <input
                  className="input"
                  required
                  value={venueForm.venueName}
                  onChange={event => setVenueForm(form => ({ ...form, venueName: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}>
              <Field label="Branch">
                <input
                  className="input"
                  value={venueForm.branch}
                  onChange={event => setVenueForm(form => ({ ...form, branch: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
              <Field label="Capacity">
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={venueForm.capacity}
                  onChange={event => setVenueForm(form => ({ ...form, capacity: Number(event.target.value) }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
            </div>
            <Field label="Location">
              <input
                className="input"
                value={venueForm.roomLocation}
                onChange={event => setVenueForm(form => ({ ...form, roomLocation: event.target.value }))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  fontSize: 13,
                  outline: 'none',
                  width: '100%',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
              />
            </Field>
            <button
              className="btn"
              disabled={busy === 'venue'}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: 12,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = '#4f46e5';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#6366f1';
              }}
            >
              {busy === 'venue' ? '⏳ Saving…' : '💾 Save Venue'}
            </button>
          </form>

          {/* Instructor Form */}
          <form
            className="ilt-panel ilt-form-card"
            onSubmit={saveInstructor}
            style={{
              background: 'var(--card-solid)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              padding: '20px',
            }}
          >
            <h2 style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--ink)',
              margin: '0 0 16px',
            }}>
              👨‍🏫 Instructor Profile
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}>
              <Field label="User ID" required>
                <input
                  className="input"
                  required
                  value={instructorForm.userId}
                  onChange={event => setInstructorForm(form => ({ ...form, userId: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
              <Field label="Instructor Name" required>
                <input
                  className="input"
                  required
                  value={instructorForm.instructorName}
                  onChange={event => setInstructorForm(form => ({ ...form, instructorName: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}>
              <Field label="Email">
                <input
                  className="input"
                  type="email"
                  value={instructorForm.email}
                  onChange={event => setInstructorForm(form => ({ ...form, email: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
              <Field label="Branch">
                <input
                  className="input"
                  value={instructorForm.branch}
                  onChange={event => setInstructorForm(form => ({ ...form, branch: event.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
            </div>
            <button
              className="btn"
              disabled={busy === 'instructor'}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: 12,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = '#4f46e5';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#6366f1';
              }}
            >
              {busy === 'instructor' ? '⏳ Saving…' : '💾 Save Instructor'}
            </button>
          </form>

          {/* Policy Form */}
          <form
            className="ilt-panel ilt-form-card"
            onSubmit={savePolicy}
            style={{
              background: 'var(--card-solid)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              padding: '20px',
            }}
          >
            <h2 style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--ink)',
              margin: '0 0 16px',
            }}>
              📋 Capacity & Attendance Policy
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}>
              <Field label="Branch">
                <input
                  className="input"
                  value={policyForm.branch}
                  onChange={event => setPolicyForm(form => ({ ...form, branch: event.target.value }))}
                  placeholder="Blank = company default"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
              <Field label="Default Capacity">
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={policyForm.defaultCapacity}
                  onChange={event => setPolicyForm(form => ({ ...form, defaultCapacity: Number(event.target.value) }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
            }}>
              <Field label="Attendance %">
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  value={policyForm.minimumAttendancePct}
                  onChange={event => setPolicyForm(form => ({ ...form, minimumAttendancePct: Number(event.target.value) }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
              <Field label="Check-in before (mins)">
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={policyForm.checkinOpenBeforeMins}
                  onChange={event => setPolicyForm(form => ({ ...form, checkinOpenBeforeMins: Number(event.target.value) }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
              <Field label="Cancel cutoff (mins)">
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={policyForm.cancellationCutoffMins}
                  onChange={event => setPolicyForm(form => ({ ...form, cancellationCutoffMins: Number(event.target.value) }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
              </Field>
            </div>
            <div style={{
              display: 'flex',
              gap: 16,
              margin: '12px 0',
              flexWrap: 'wrap',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'var(--ink)',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={policyForm.autoPromoteWaitlist}
                  onChange={event => setPolicyForm(form => ({ ...form, autoPromoteWaitlist: event.target.checked }))}
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: '#6366f1',
                  }}
                />
                Auto-promote waitlist
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'var(--ink)',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={policyForm.selfEnrollmentEnabled}
                  onChange={event => setPolicyForm(form => ({ ...form, selfEnrollmentEnabled: event.target.checked }))}
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: '#6366f1',
                  }}
                />
                Self-enrolment
              </label>
            </div>
            <button
              className="btn"
              disabled={busy === 'policy'}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: 12,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = '#4f46e5';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#6366f1';
              }}
            >
              {busy === 'policy' ? '⏳ Saving…' : '💾 Save Policy'}
            </button>
          </form>
        </div>
      )}

      {/* Check-in Code Modal */}
      {checkinCode && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 1000,
        }} onClick={e => e.target === e.currentTarget && setCheckinCode(null)}>
          <div style={{
            background: 'var(--card-solid)',
            borderRadius: '24px',
            maxWidth: 460,
            width: '90%',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Instructor Check-in Code
            </span>
            <h2 style={{
              fontSize: 48,
              fontWeight: 900,
              color: 'var(--ink)',
              margin: '12px 0',
              letterSpacing: '0.1em',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {checkinCode.code}
            </h2>
            <p style={{
              fontSize: 13,
              color: 'var(--muted)',
              margin: '0 0 20px',
              lineHeight: 1.6,
            }}>
              Valid from {formatDate(checkinCode.openAt)} until {formatDate(checkinCode.closeAt)}.<br />
              Display it only to confirmed attendees.
            </p>
            <button
              onClick={() => setCheckinCode(null)}
              style={{
                padding: '10px 32px',
                borderRadius: '10px',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4f46e5';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#6366f1';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}