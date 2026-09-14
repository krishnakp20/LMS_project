import { useState, useEffect } from 'react';
import { api, downloadCsv } from '../../utils/api.js';

const TRAINEE_CSV_TEMPLATE = 'EmployeeID,Name,Email,Mobile\nEMP1001,John Doe,john@example.com,9876543210\n';

function parseCsvTrainees(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const empIdx = header.findIndex(h => h.includes('emp') || h.includes('id'));
  const nameIdx = header.findIndex(h => h.includes('name'));
  const emailIdx = header.findIndex(h => h.includes('email') || h.includes('mail'));
  const mobileIdx = header.findIndex(h => h.includes('mobile') || h.includes('phone'));
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    return {
      employeeId: (empIdx >= 0 ? cols[empIdx] : cols[0]) || '',
      traineeName: (nameIdx >= 0 ? cols[nameIdx] : cols[1]) || '',
      email: (emailIdx >= 0 ? cols[emailIdx] : cols[2]) || '',
      mobile: (mobileIdx >= 0 ? cols[mobileIdx] : cols[3]) || '',
    };
  }).filter(t => t.employeeId);
}

// ============================================================
// ==================== COMMON COMPONENTS ====================
// ============================================================

function StatCard({ label, value, icon, color, sub, trend }) {
  return (
    <div style={{
      padding: '16px 20px',
      borderRadius: '14px',
      background: 'var(--card-solid)',
      border: '1px solid var(--line)',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      transition: 'all 0.2s',
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: '12px',
        background: color || 'rgba(99,102,241,0.1)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 20,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 24,
          fontWeight: 800,
          color: 'var(--ink)',
          letterSpacing: '-0.02em',
        }}>
          {value}
        </div>
        {sub && (
          <div style={{
            fontSize: 11,
            color: 'var(--muted)',
            marginTop: 2,
          }}>
            {sub}
          </div>
        )}
        {trend && (
          <div style={{
            fontSize: 11,
            color: trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : 'var(--muted)',
            marginTop: 2,
          }}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    Active: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', icon: '🟢' },
    Completed: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', icon: '✅' },
    Pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: '⏳' },
    Archived: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', icon: '📦' },
    'On Track': { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', icon: '✅' },
    'Needs Attention': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: '⚠️' },
    'At Risk': { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', icon: '🔴' },
    CRITICAL: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', icon: '🚨' },
    HIGH: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', icon: '🔴' },
    MEDIUM: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: '🟡' },
    LOW: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', icon: '🟢' },
  };
  const config = colors[status] || colors.Pending;
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 12px',
      borderRadius: '99px',
      background: config.bg,
      color: config.color,
      fontSize: 11,
      fontWeight: 600,
    }}>
      {config.icon} {status}
    </span>
  );
}

function RiskBadge({ status }) {
  const colors = {
    CRITICAL: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', icon: '🚨' },
    HIGH: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', icon: '🔴' },
    MEDIUM: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: '🟡' },
    LOW: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', icon: '🟢' },
  };
  const config = colors[status] || colors.LOW;
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 10px',
      borderRadius: '99px',
      background: config.bg,
      color: config.color,
      fontSize: 11,
      fontWeight: 600,
    }}>
      {config.icon} {status}
    </span>
  );
}

function ProgressBar({ value, label, color, height = 6 }) {
  const getColor = () => {
    if (color) return color;
    if (value >= 80) return '#22c55e';
    if (value >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1,
        height: height,
        borderRadius: 99,
        background: 'var(--line)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(Math.max(value, 0), 100)}%`,
          background: getColor(),
          borderRadius: 99,
          transition: 'width 0.6s ease',
        }} />
      </div>
      {label && (
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: getColor(),
          minWidth: 40,
          textAlign: 'right',
        }}>
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder, onSearch }) {
  return (
    <form 
      onSubmit={e => { e.preventDefault(); onSearch?.(); }}
      style={{
        display: 'flex',
        gap: 8,
        flex: 1,
        maxWidth: 400,
      }}
    >
      <input
        type="text"
        placeholder={placeholder || '🔍 Search...'}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: '8px 14px',
          borderRadius: '10px',
          border: '1px solid var(--line)',
          background: 'var(--card)',
          color: 'var(--ink)',
          fontSize: 13,
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#6366f1';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--line)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
    </form>
  );
}

// ============================================================
// ==================== MAIN COMPONENT ====================
// ============================================================

export default function BatchDetailPage({ batchNo, navigate, onBack }) {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [contentProgress, setContentProgress] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [addMsg, setAddMsg] = useState({ text: '', ok: true });
  const [csvDragging, setCsvDragging] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null);
  const [addLoading, setAddLoading] = useState(false);

  // Edit batch modal
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState('');
  const [classrooms, setClassrooms] = useState([]);

  // Search & enroll existing trainee
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(null);

  function addToast(text, ok = true) { 
    setAddMsg({ text, ok }); 
    setTimeout(() => setAddMsg({ text: '', ok: true }), 5000); 
  }

  function openEdit() {
    const b = data?.batch || {};
    setEditDraft({
      batchName: b.batchName || '',
      branch: b.branch || '',
      process: b.process || '',
      lob: b.lob || '',
      classroomId: b.classroomId || '',
      startDate: b.startDate ? b.startDate.slice(0, 10) : '',
      endDate: b.endDate ? b.endDate.slice(0, 10) : '',
      expectedTrainees: b.expectedTrainees ?? '',
      remarks: b.remarks || '',
    });
    setEditErr('');
    setEditOpen(true);
    if (classrooms.length === 0) {
      api.get('/admin/classrooms', 'admin').then(r => { if (r.ok) setClassrooms(r.data); });
    }
  }

  async function saveEdit() {
    if (!editDraft.batchName?.trim()) { setEditErr('Batch name is required.'); return; }
    setEditSaving(true); setEditErr('');
    const res = await api.put(`/admin/batches/${batchNo}`, editDraft, 'admin');
    setEditSaving(false);
    if (res.ok) { setEditOpen(false); reload(); }
    else setEditErr(res.message || 'Save failed.');
  }

  async function searchTrainees(q) {
    setSearchQ(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    const res = await api.get(`/admin/trainees/search?q=${encodeURIComponent(q)}&limit=10`, 'admin');
    setSearchLoading(false);
    if (res.ok) setSearchResults(res.data || []);
  }

  async function enrollExisting(trainee) {
    setEnrolling(trainee.employeeId);
    const res = await api.post(`/admin/batches/${batchNo}/trainees/bulk`, {
      trainees: [{ employeeId: trainee.employeeId, traineeName: trainee.traineeName, email: trainee.email || '', mobile: trainee.mobile || '' }],
    }, 'admin');
    setEnrolling(null);
    if (res.ok) {
      addToast(`✅ ${trainee.traineeName} enrolled successfully.`);
      setSearchQ('');
      setSearchResults([]);
      reload();
    } else {
      addToast(res.message || 'Enroll failed.', false);
    }
  }

  async function reload() {
    const [d, a] = await Promise.all([
      api.get(`/admin/batches/${batchNo}`, 'admin'),
      api.get(`/admin/batches/${batchNo}/analytics`, 'admin'),
    ]);
    if (d.ok) setData(d.data);
    if (a.ok) setAnalytics(a.data);
    setLoading(false);
  }

  useEffect(() => { reload(); }, [batchNo]);

  useEffect(() => {
    if (tab !== 'content' || contentProgress !== null) return;
    setContentLoading(true);
    api.get(`/admin/batches/${batchNo}/content-progress`, 'admin').then(r => {
      setContentLoading(false);
      if (r.ok) setContentProgress(r.data);
    });
  }, [tab, batchNo]);

  async function bulkAddFromCsv() {
    if (!csvPreview || csvPreview.length === 0) return;
    setAddLoading(true);
    const res = await api.post(`/admin/batches/${batchNo}/trainees/bulk`, { trainees: csvPreview }, 'admin');
    setAddLoading(false);
    if (res.ok) {
      addToast(`✅ Added ${res.data.success} trainee(s).${res.data.failed > 0 ? ` ${res.data.failed} failed.` : ''}`);
      setCsvPreview(null);
      reload();
    } else {
      addToast(res.message || 'Failed.', false);
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 400,
        gap: 16,
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid var(--line)',
          borderTopColor: '#6366f1',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading batch details...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: 'var(--muted)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>Batch not found</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>The batch you're looking for doesn't exist.</div>
        <button
          onClick={onBack}
          style={{
            marginTop: 16,
            padding: '10px 24px',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            background: 'var(--card-solid)',
            color: 'var(--ink)',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
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
          ← Back to Batches
        </button>
      </div>
    );
  }

  const { batch, trainees, summary } = data;
  const tabs = ['overview', 'trainees', 'analytics', 'coordinator', 'content'];
  
  const tabLabels = {
    overview: '📊 Overview',
    trainees: '👤 Trainees',
    analytics: '📈 Analytics',
    coordinator: '👨‍🏫 Coordinator',
    content: '📚 Content'
  };

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          padding: '8px 16px',
          borderRadius: '10px',
          border: '1px solid var(--line)',
          background: 'var(--card-solid)',
          color: 'var(--ink)',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          transition: 'all 0.2s',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 16,
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
        ← Back to Batches
      </button>

      {/* Header */}
      <div style={{
        background: 'var(--card-solid)',
        borderRadius: '16px',
        border: '1px solid var(--line)',
        padding: '20px 24px',
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <h2 style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--ink)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              {batch.batchName || batchNo}
            </h2>
            <StatusBadge status={batch.batchStatus} />
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 6,
            fontSize: 13,
            color: 'var(--muted)',
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>#{batchNo}</span>
            {batch.process && <span>⚙️ {batch.process}</span>}
            {batch.lob && <span>🏢 {batch.lob}</span>}
            {batch.branch && <span>📍 {batch.branch}</span>}
            {batch.coordinatorName && <span>👨‍🏫 {batch.coordinatorName}</span>}
          </div>
          {batch.remarks && (
            <div style={{
              marginTop: 8,
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'var(--card)',
              border: '1px solid var(--line)',
              fontSize: 12,
              color: 'var(--muted)',
            }}>
              📝 {batch.remarks}
            </div>
          )}
        </div>
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          <button
            className="btn small secondary"
            onClick={openEdit}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--card-solid)',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
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
              e.currentTarget.style.background = 'var(--card-solid)';
              e.currentTarget.style.borderColor = 'var(--line)';
            }}
          >
            ✎ Edit Batch
          </button>
          <button
            className="btn small secondary"
            onClick={reload}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--card-solid)',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
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
              e.currentTarget.style.background = 'var(--card-solid)';
              e.currentTarget.style.borderColor = 'var(--line)';
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14,
        marginBottom: 20,
      }}>
        <StatCard 
          label="Total Trainees" 
          value={summary.total || 0} 
          icon="👤" 
          color="rgba(99,102,241,0.1)" 
        />
        <StatCard 
          label="On Track" 
          value={summary.onTrack || 0} 
          icon="✅" 
          color="rgba(34,197,94,0.1)"
          sub={summary.total > 0 ? `${Math.round((summary.onTrack / summary.total) * 100)}% of total` : '0%'}
        />
        <StatCard 
          label="Needs Attention" 
          value={summary.needsAttention || 0} 
          icon="⚠️" 
          color="rgba(245,158,11,0.1)"
          sub={summary.total > 0 ? `${Math.round((summary.needsAttention / summary.total) * 100)}% of total` : '0%'}
        />
        <StatCard 
          label="At Risk" 
          value={summary.atRisk || 0} 
          icon="🔴" 
          color="rgba(239,68,68,0.1)"
          sub={summary.total > 0 ? `${Math.round((summary.atRisk / summary.total) * 100)}% of total` : '0%'}
        />
        <StatCard 
          label="MCQ Passed" 
          value={summary.mcqPassed || 0} 
          icon="📝" 
          color="rgba(99,102,241,0.1)"
          sub={summary.total > 0 ? `${Math.round((summary.mcqPassed / summary.total) * 100)}% passed` : '0%'}
        />
        <StatCard 
          label="Certified" 
          value={summary.certified || 0} 
          icon="🏆" 
          color="rgba(245,158,11,0.1)"
          sub={summary.total > 0 ? `${Math.round((summary.certified / summary.total) * 100)}% certified` : '0%'}
        />
      </div>

      {/* Toast Messages */}
      {addMsg.text && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: 16,
          background: addMsg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${addMsg.ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: 13,
            color: addMsg.ok ? '#22c55e' : '#ef4444',
          }}>
            {addMsg.ok ? '✅' : '❌'} {addMsg.text}
          </span>
          <button
            onClick={() => setAddMsg({ text: '', ok: true })}
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

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 20,
        background: 'var(--card-solid)',
        borderRadius: '12px',
        padding: 4,
        border: '1px solid var(--line)',
        overflowX: 'auto',
      }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: tab === t ? '#6366f1' : 'transparent',
              color: tab === t ? '#fff' : 'var(--muted)',
              fontWeight: tab === t ? 700 : 500,
              fontSize: 13,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tabLabels[t] || t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* ========== TAB: OVERVIEW ========== */}
      {/* ============================================================ */}
      {tab === 'overview' && (
        <div>
          {/* Readiness Overview */}
          <div style={{
            background: 'var(--card-solid)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            padding: '20px 24px',
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 16,
            }}>
              📊 Readiness Overview
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                ['Course Completion', summary.avgCourse || 0, '#6366f1'],
                ['Attendance', summary.avgAttendance || 0, '#22c55e'],
                ['MCQ Score', summary.avgMcq || 0, '#f59e0b'],
                ['Certified', summary.total > 0 ? Math.round((summary.certified / summary.total) * 100) : 0, '#8b5cf6'],
              ].map(([label, val, color]) => (
                <div key={label}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    marginBottom: 4,
                  }}>
                    <span style={{ color: 'var(--muted)' }}>{label}</span>
                    <span style={{
                      fontWeight: 700,
                      color: val >= 80 ? '#22c55e' : val >= 60 ? '#f59e0b' : '#ef4444',
                    }}>
                      {Math.round(val)}%
                    </span>
                  </div>
                  <ProgressBar value={val} color={color} height={8} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
            marginTop: 16,
          }}>
            <div style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'var(--card-solid)',
              border: '1px solid var(--line)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Classroom
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {batch.classroomName || 'Not assigned'}
              </div>
            </div>
            <div style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'var(--card-solid)',
              border: '1px solid var(--line)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Start Date
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {batch.startDate ? new Date(batch.startDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }) : 'Not set'}
              </div>
            </div>
            <div style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'var(--card-solid)',
              border: '1px solid var(--line)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                End Date
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {batch.endDate ? new Date(batch.endDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }) : 'Not set'}
              </div>
            </div>
            <div style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'var(--card-solid)',
              border: '1px solid var(--line)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Expected Trainees
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {batch.expectedTrainees || '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ========== TAB: TRAINEES ========== */}
      {/* ============================================================ */}
      {tab === 'trainees' && (
        <div>
          {/* Search & Enroll */}
          <div style={{
            background: 'var(--card-solid)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            padding: '20px 24px',
            marginBottom: 16,
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 12,
            }}>
              🔍 Search & Enroll Existing Trainee
            </div>
            <div style={{ position: 'relative' }}>
              <SearchBar
                value={searchQ}
                onChange={searchTrainees}
                placeholder="Search by name or Employee ID (min 2 chars)..."
              />
              {searchLoading && (
                <span style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 12,
                  color: 'var(--muted)',
                }}>
                  ⟳
                </span>
              )}
            </div>
            
            {searchResults.length > 0 && (
              <div style={{
                marginTop: 12,
                background: 'var(--card)',
                borderRadius: 10,
                border: '1px solid var(--line)',
                overflow: 'hidden',
              }}>
                {searchResults.map(t => {
                  const alreadyEnrolled = data?.trainees?.some(et => et.employeeId === t.employeeId);
                  return (
                    <div key={t.employeeId} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--line)',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                          {t.traineeName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          <span style={{ fontFamily: 'monospace' }}>{t.employeeId}</span>
                          {t.empIdType === 'TEMP' && (
                            <span style={{
                              marginLeft: 5,
                              background: '#d97706',
                              color: '#fff',
                              borderRadius: 4,
                              fontSize: 9,
                              fontWeight: 700,
                              padding: '1px 6px',
                            }}>
                              TEMP
                            </span>
                          )}
                          {t.email && ` · ${t.email}`}
                          {t.batchNo && ` · Batch: ${t.batchNo}`}
                        </div>
                      </div>
                      {alreadyEnrolled ? (
                        <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>✅ Enrolled</span>
                      ) : (
                        <button
                          onClick={() => enrollExisting(t)}
                          disabled={enrolling === t.employeeId}
                          style={{
                            padding: '4px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff',
                            cursor: enrolling === t.employeeId ? 'not-allowed' : 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            opacity: enrolling === t.employeeId ? 0.6 : 1,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (!enrolling) {
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {enrolling === t.employeeId ? '⏳' : '+ Enroll'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {searchQ.length >= 2 && !searchLoading && searchResults.length === 0 && (
              <div style={{
                fontSize: 12,
                color: 'var(--muted)',
                marginTop: 10,
                textAlign: 'center',
                padding: '12px 0',
              }}>
                No trainees found for "{searchQ}"
              </div>
            )}
          </div>

          {/* Bulk Upload via CSV */}
          <div style={{
            background: 'var(--card-solid)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            padding: '20px 24px',
            marginBottom: 16,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                📂 Bulk Upload via CSV
              </div>
              <button
                onClick={() => {
                  const blob = new Blob([TRAINEE_CSV_TEMPLATE], { type: 'text/csv' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = 'Trainee_Upload_Template.csv';
                  a.click();
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--card-solid)',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
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
                ⬇ Download Template
              </button>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setCsvDragging(true); }}
              onDragLeave={() => setCsvDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setCsvDragging(false);
                const file = e.dataTransfer.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => setCsvPreview(parseCsvTrainees(ev.target.result));
                reader.readAsText(file);
              }}
              onClick={() => document.getElementById(`bdp-csv-${batchNo}`).click()}
              style={{
                border: `2px dashed ${csvDragging ? '#6366f1' : 'var(--line)'}`,
                borderRadius: 12,
                padding: '30px 20px',
                textAlign: 'center',
                background: csvDragging ? 'rgba(99,102,241,0.06)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                id={`bdp-csv-${batchNo}`}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => setCsvPreview(parseCsvTrainees(ev.target.result));
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
              <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                Drop trainee CSV here or click to browse
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                Columns: EmployeeID, Name, Email, Mobile
              </div>
            </div>

            {csvPreview && csvPreview.length > 0 && (
              <div style={{
                marginTop: 12,
                background: 'var(--card)',
                borderRadius: 10,
                border: '1px solid var(--line)',
                padding: '12px 16px',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                    {csvPreview.length} trainees found
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={bulkAddFromCsv}
                      disabled={addLoading}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#fff',
                        cursor: addLoading ? 'not-allowed' : 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        opacity: addLoading ? 0.6 : 1,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!addLoading) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {addLoading ? '⏳ Adding...' : `+ Add ${csvPreview.length} Trainees`}
                    </button>
                    <button
                      onClick={() => setCsvPreview(null)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        background: 'var(--card-solid)',
                        color: 'var(--ink)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--card)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--card-solid)';
                      }}
                    >
                      Discard
                    </button>
                  </div>
                </div>
                <div style={{ maxHeight: 120, overflowY: 'auto', display: 'grid', gap: 3 }}>
                  {csvPreview.slice(0, 8).map((t, i) => (
                    <div key={i} style={{
                      fontSize: 11,
                      display: 'flex',
                      gap: 10,
                      padding: '3px 0',
                      borderBottom: i < Math.min(csvPreview.length, 8) - 1 ? '1px solid var(--line)' : 'none',
                    }}>
                      <b style={{ color: '#6366f1', minWidth: 80 }}>{t.employeeId}</b>
                      <span style={{ color: 'var(--ink)' }}>{t.traineeName}</span>
                      {t.email && <span style={{ color: 'var(--muted)' }}>{t.email}</span>}
                    </div>
                  ))}
                  {csvPreview.length > 8 && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', paddingTop: 4 }}>
                      ...and {csvPreview.length - 8} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Trainees List */}
          <div style={{
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
              gap: 8,
            }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                  👤 Enrolled Trainees
                </span>
                <span style={{
                  marginLeft: 8,
                  padding: '2px 10px',
                  borderRadius: '99px',
                  background: 'rgba(99,102,241,0.1)',
                  color: '#6366f1',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {trainees.length}
                </span>
              </div>
              <button
                onClick={() => downloadCsv(`/admin/trainees/export?batchNo=${encodeURIComponent(batchNo)}`, `trainees-${batchNo}.csv`)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--card-solid)',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
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
                ⬇ Export CSV
              </button>
            </div>

            <div style={{ overflowX: 'auto', padding: '0 4px 4px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}>
                <thead>
                  <tr style={{
                    background: 'var(--card)',
                    borderBottom: '2px solid var(--line)',
                  }}>
                    <th style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      Emp ID
                    </th>
                    <th style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      Name
                    </th>
                    <th style={{
                      padding: '10px 14px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      Course
                    </th>
                    <th style={{
                      padding: '10px 14px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      Attendance
                    </th>
                    <th style={{
                      padding: '10px 14px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      MCQ
                    </th>
                    <th style={{
                      padding: '10px 14px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      Risk
                    </th>
                    <th style={{
                      padding: '10px 14px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      Certified
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trainees.map(t => (
                    <tr
                      key={t.employeeId}
                      style={{
                        borderBottom: '1px solid var(--line)',
                        transition: 'background 0.15s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--card)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                      onClick={() => navigate('trainee-detail', {
                        empId: t.employeeId,
                        from: batch.batchName || batchNo,
                        fromId: 'batch-detail',
                        batchNo
                      })}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{t.employeeId}</span>
                        {t.empIdType === 'TEMP' && (
                          <span style={{
                            marginLeft: 6,
                            background: '#d97706',
                            color: '#fff',
                            borderRadius: 4,
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 6px',
                          }}>
                            TEMP
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--ink)' }}>
                        {t.traineeName}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          fontWeight: 700,
                          color: (t.courseCompletionPct || 0) >= 80 ? '#22c55e' : (t.courseCompletionPct || 0) >= 60 ? '#f59e0b' : '#ef4444',
                        }}>
                          {Math.round(t.courseCompletionPct)}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          fontWeight: 700,
                          color: (t.attendancePct || 0) >= 80 ? '#22c55e' : (t.attendancePct || 0) >= 60 ? '#f59e0b' : '#ef4444',
                        }}>
                          {Math.round(t.attendancePct)}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          fontWeight: 700,
                          color: (t.assessmentPassPct || 0) >= 80 ? '#22c55e' : (t.assessmentPassPct || 0) >= 60 ? '#f59e0b' : '#ef4444',
                        }}>
                          {Math.round(t.assessmentPassPct)}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <RiskBadge status={t.riskStatus} />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {t.certificationStatus === 'Certified' ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 10px',
                            borderRadius: '99px',
                            background: 'rgba(34,197,94,0.12)',
                            color: '#22c55e',
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                            🏆 Certified
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: 11 }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {trainees.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{
                        textAlign: 'center',
                        color: 'var(--muted)',
                        padding: '48px 20px',
                      }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                          No trainees enrolled yet
                        </div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>
                          Use the search or CSV upload above to add trainees.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ========== TAB: ANALYTICS ========== */}
      {/* ============================================================ */}
      {tab === 'analytics' && analytics && (
        <div>
          {/* Attendance Trend */}
          <div style={{
            background: 'var(--card-solid)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            padding: '20px 24px',
            marginBottom: 16,
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 16,
            }}>
              📈 Attendance Trend
            </div>
            {analytics.attendanceTrend.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 12 }}>No attendance data available.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {analytics.attendanceTrend.slice(-14).map(d => (
                  <div key={d.date}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      marginBottom: 3,
                    }}>
                      <span style={{ color: 'var(--muted)' }}>
                        {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                      <span style={{
                        fontWeight: 700,
                        color: d.pct >= 80 ? '#22c55e' : d.pct >= 60 ? '#f59e0b' : '#ef4444',
                      }}>
                        {d.pct}%
                      </span>
                    </div>
                    <ProgressBar value={d.pct} height={6} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MCQ Score Distribution */}
          <div style={{
            background: 'var(--card-solid)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            padding: '20px 24px',
            marginBottom: 16,
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 16,
            }}>
              📊 MCQ Score Distribution
            </div>
            {Object.entries(analytics.mcqDistribution).map(([band, count]) => (
              <div key={band}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginBottom: 3,
                }}>
                  <span style={{ color: 'var(--muted)' }}>{band}</span>
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{count}</span>
                </div>
                <ProgressBar
                  value={summary.total > 0 ? (count / summary.total) * 100 : 0}
                  height={6}
                  color="#6366f1"
                />
              </div>
            ))}
          </div>

          {/* Certification Forecast */}
          <div style={{
            background: 'var(--card-solid)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            padding: '20px 24px',
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 16,
            }}>
              🎯 Certification Forecast
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
            }}>
              {[
                { label: 'Will Certify', val: analytics.certForecast.willCert, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
                { label: 'Borderline', val: analytics.certForecast.borderline, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                { label: 'At Risk', val: analytics.certForecast.atRisk, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
              ].map(({ label, val, color, bg }) => (
                <div key={label} style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: bg,
                  border: `1px solid ${color}22`,
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: color,
                  }}>
                    {val}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    marginTop: 4,
                  }}>
                    {label}
                  </div>
                  <div style={{
                    marginTop: 8,
                    height: 4,
                    borderRadius: 99,
                    background: 'var(--line)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: summary.total > 0 ? `${(val / summary.total) * 100}%` : '0%',
                      background: color,
                      borderRadius: 99,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ========== TAB: COORDINATOR ========== */}
      {/* ============================================================ */}
      {tab === 'coordinator' && (
        <div style={{
          background: 'var(--card-solid)',
          borderRadius: '16px',
          border: '1px solid var(--line)',
          padding: '24px',
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--ink)',
            marginBottom: 16,
          }}>
            👨‍🏫 Coordinator Details
          </div>
          
          <div style={{
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'var(--card)',
            border: '1px solid var(--line)',
            marginBottom: 16,
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '8px 24px',
              fontSize: 13,
            }}>
              <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Name</span>
              <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                {batch.coordinatorName || 'Not assigned'}
              </span>
              <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Login ID</span>
              <span style={{ color: 'var(--ink)', fontFamily: 'monospace' }}>
                {batch.coordinatorLoginId || '—'}
              </span>
              <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Status</span>
              <span>
                {batch.coordinatorLoginId ? (
                  <StatusBadge status="Active" />
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>Not assigned</span>
                )}
              </span>
            </div>
          </div>

          {batch.coordinatorLoginId && (
            <button
              onClick={() => navigate('coord-detail', {
                loginId: batch.coordinatorLoginId,
                coordinatorName: batch.coordinatorName,
              })}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              👤 View Coordinator Profile →
            </button>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ========== TAB: CONTENT ========== */}
      {/* ============================================================ */}
      {tab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {contentLoading && (
            <div style={{
              background: 'var(--card-solid)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--muted)',
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '3px solid var(--line)',
                borderTopColor: '#6366f1',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }} />
              <span style={{ fontSize: 13 }}>Loading content progress…</span>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {!contentLoading && !contentProgress && (
            <div style={{
              background: 'var(--card-solid)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              padding: '24px',
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: 8,
              }}>
                📚 Content Progress
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                No classroom linked to this batch.{' '}
                {batch.classroomId ? 'The classroom may not have any content.' : 'Assign a classroom to see content progress.'}
              </p>
            </div>
          )}

          {!contentLoading && contentProgress && (
            <>
              {/* Content Completion */}
              <div style={{
                background: 'var(--card-solid)',
                borderRadius: '16px',
                border: '1px solid var(--line)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--line)',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                        📚 Content Completion
                      </span>
                      <span style={{
                        marginLeft: 8,
                        padding: '2px 10px',
                        borderRadius: '99px',
                        background: 'rgba(99,102,241,0.1)',
                        color: '#6366f1',
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {contentProgress.totalTrainees} trainees
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {batch.classroomName || batch.classroomId || 'Classroom'}
                    </span>
                  </div>
                </div>

                {contentProgress.modules.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--muted)',
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                      No content found in this classroom
                    </div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      Add content to the classroom to track progress.
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px 20px' }}>
                    {contentProgress.modules.map((mod, mi) => (
                      <div key={mod.moduleId} style={{ marginBottom: mi < contentProgress.modules.length - 1 ? 24 : 0 }}>
                        <div style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: 10,
                          padding: '6px 12px',
                          background: 'var(--card)',
                          borderRadius: 6,
                          border: '1px solid var(--line)',
                        }}>
                          Day {mod.dayNo} — {mod.moduleTitle}
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: 12.5,
                          }}>
                            <thead>
                              <tr style={{ borderBottom: '1.5px solid var(--line)' }}>
                                <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Content</th>
                                <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Type</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Est. Mins</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Opened</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Completed</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Not Started</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Completion</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Avg Progress</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mod.contents.map((c, ci) => (
                                <tr key={c.contentId} style={{
                                  borderBottom: ci < mod.contents.length - 1 ? '1px solid var(--line)' : 'none',
                                  background: ci % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.02)',
                                }}>
                                  <td style={{ padding: '8px 10px', color: 'var(--ink)', fontWeight: 500 }}>
                                    {c.contentTitle}
                                  </td>
                                  <td style={{ padding: '8px 10px', color: 'var(--muted)' }}>
                                    <ContentTypeBadge type={c.contentType} />
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--muted)' }}>
                                    {c.estimatedMins || '—'}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--ink)' }}>
                                    {c.openedCount}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>
                                    {c.completedCount}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center', color: c.notStartedCount > 0 ? '#ef4444' : 'var(--muted)' }}>
                                    {c.notStartedCount}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                    <ProgressBar value={c.completionRate} height={5} />
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                                    {c.avgCompletionPct}%
                                  </td>
                                </tr>
                              ))}
                              {mod.contents.length === 0 && (
                                <tr>
                                  <td colSpan="8" style={{
                                    padding: '12px 10px',
                                    textAlign: 'center',
                                    color: 'var(--muted)',
                                    fontSize: 12,
                                  }}>
                                    No content in this module.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MCQ Performance */}
              <div style={{
                background: 'var(--card-solid)',
                borderRadius: '16px',
                border: '1px solid var(--line)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--line)',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                    📝 MCQ Performance
                  </span>
                </div>

                {contentProgress.assessments.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '32px 20px',
                    color: 'var(--muted)',
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                      No assessments found
                    </div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      Add MCQ assessments to this classroom.
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 12.5,
                    }}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid var(--line)' }}>
                          <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Assessment</th>
                          <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Module</th>
                          <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Pass Mark</th>
                          <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Attempted</th>
                          <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Not Attempted</th>
                          <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Attempt Rate</th>
                          <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Pass Rate</th>
                          <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Avg Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contentProgress.assessments.map((a, ai) => (
                          <tr key={a.assessmentId} style={{
                            borderBottom: ai < contentProgress.assessments.length - 1 ? '1px solid var(--line)' : 'none',
                            background: ai % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.02)',
                          }}>
                            <td style={{ padding: '8px 10px', color: 'var(--ink)', fontWeight: 500 }}>
                              {a.assessmentName}
                            </td>
                            <td style={{ padding: '8px 10px', color: 'var(--muted)', fontSize: 12 }}>
                              {a.moduleTitle ? `Day ${a.dayNo ?? ''} — ${a.moduleTitle}` : '—'}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--muted)' }}>
                              {a.passingPct}%
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--ink)' }}>
                              {a.attemptedCount}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: a.notAttemptedCount > 0 ? '#ef4444' : 'var(--muted)' }}>
                              {a.notAttemptedCount}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <span style={{
                                fontWeight: 700,
                                color: a.attemptRate >= 80 ? '#22c55e' : a.attemptRate >= 50 ? '#f59e0b' : '#ef4444',
                              }}>
                                {a.attemptRate}%
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <ProgressBar value={a.passRate} height={5} />
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: a.attemptedCount === 0 ? 'var(--muted)' : a.avgBestScore >= a.passingPct ? '#22c55e' : '#ef4444' }}>
                              {a.attemptedCount > 0 ? `${a.avgBestScore}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ========== EDIT BATCH MODAL ========== */}
      {/* ============================================================ */}
      {editOpen && (
        <div
          onClick={e => e.target === e.currentTarget && setEditOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div style={{
            background: 'var(--card-solid)',
            borderRadius: '20px',
            maxWidth: 540,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <b style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                ✏️ Edit Batch — {batchNo}
              </b>
              <button
                onClick={() => setEditOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: 'var(--muted)',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    Batch Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    className="input"
                    value={editDraft.batchName}
                    onChange={e => setEditDraft(d => ({ ...d, batchName: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    Branch
                  </label>
                  <input
                    className="input"
                    value={editDraft.branch}
                    onChange={e => setEditDraft(d => ({ ...d, branch: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    Process
                  </label>
                  <input
                    className="input"
                    value={editDraft.process}
                    onChange={e => setEditDraft(d => ({ ...d, process: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    Classroom
                  </label>
                  <select
                    className="select"
                    value={editDraft.classroomId}
                    onChange={e => setEditDraft(d => ({ ...d, classroomId: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  >
                    <option value="">— No classroom —</option>
                    {classrooms.map(c => (
                      <option key={c.classroomId} value={c.classroomId}>{c.classroomName}</option>
                    ))}
                  </select>
                  {editDraft.classroomId && editDraft.classroomId !== (data?.batch?.classroomId || '') && (
                    <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>
                      ⚠ Changing classroom will update all enrolled trainees in this batch.
                    </div>
                  )}
                </div>
                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    Expected Trainees
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={editDraft.expectedTrainees}
                    onChange={e => setEditDraft(d => ({ ...d, expectedTrainees: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    Start Date
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={editDraft.startDate}
                    onChange={e => setEditDraft(d => ({ ...d, startDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    Remarks
                  </label>
                  <input
                    className="input"
                    value={editDraft.remarks}
                    onChange={e => setEditDraft(d => ({ ...d, remarks: e.target.value }))}
                    placeholder="Optional notes"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {editErr && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444',
                  fontSize: 13,
                }}>
                  ❌ {editErr}
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid var(--line)',
              }}>
                <button
                  onClick={() => setEditOpen(false)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card-solid)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--card)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--card-solid)';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editSaving}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: editSaving ? 'not-allowed' : 'pointer',
                    opacity: editSaving ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!editSaving) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {editSaving ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ==================== CONTENT TYPE BADGE ====================
// ============================================================

function ContentTypeBadge({ type }) {
  const types = {
    document: { icon: '📄', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    video: { icon: '🎬', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    pdf: { icon: '📕', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
    ppt: { icon: '📊', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    image: { icon: '🖼️', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    scorm: { icon: '🎯', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    link: { icon: '🔗', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  };
  const config = types[type] || types.document;
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 10px',
      borderRadius: '99px',
      background: config.bg,
      color: config.color,
      fontSize: 11,
      fontWeight: 600,
    }}>
      {config.icon} {type}
    </span>
  );
}