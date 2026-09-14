// src/pages/Admin/ComplianceTab.jsx
import { useState, useEffect } from 'react';
import { api, downloadCsv } from '../../utils/api.js';

const CHART_COLORS = {
  blue: '#6366f1',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
  purple: '#8b5cf6',
  teal: '#06b6d4',
  pink: '#ec4899',
  gray: '#94a3b8',
};

// ========== STAT CARD ==========
function StatCard({ label, value, icon, color, sub }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 14,
      border: '1px solid rgba(203,213,225,0.3)',
      padding: '16px 18px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: color || CHART_COLORS.blue,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: color || '#0f172a', letterSpacing: '-0.5px' }}>
            {value == null ? '—' : value.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
            {label}
          </div>
          {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}15`,
          display: 'grid',
          placeItems: 'center',
          fontSize: 18,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ========== EXPORT CARD ==========
function ExportCard({ icon, title, desc, cols, btnColor, disabled, onExport, loading }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid rgba(203,213,225,0.3)',
        padding: '16px 18px',
        boxShadow: isHovered ? '0 8px 30px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.02)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${btnColor || CHART_COLORS.blue}15`,
          display: 'grid',
          placeItems: 'center',
          fontSize: 18,
          flexShrink: 0,
          color: btnColor || CHART_COLORS.blue,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{title}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1, lineHeight: 1.4 }}>{desc}</div>
        </div>
      </div>

      {cols && (
        <div style={{
          fontSize: 9,
          color: '#94a3b8',
          background: '#f8fafc',
          borderRadius: 6,
          padding: '4px 8px',
          lineHeight: 1.5,
          fontFamily: 'monospace',
          maxHeight: 36,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>📋</span> {cols}
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        paddingTop: 6,
        borderTop: '1px solid rgba(203,213,225,0.15)',
      }}>
        <button
          style={{
            padding: '5px 16px',
            borderRadius: 8,
            border: 'none',
            background: disabled ? '#e2e8f0' : (btnColor || CHART_COLORS.blue),
            color: disabled ? '#94a3b8' : '#fff',
            fontSize: 11,
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          onClick={onExport}
          disabled={disabled || loading}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid #fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              Exporting…
            </span>
          ) : (
            '⬇ Export CSV'
          )}
        </button>
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function ComplianceTab() {
  // ── State ──
  const [branches, setBranches] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [form, setForm] = useState({ dateFrom: '', dateTo: '', branch: '', process: '' });
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState({});
  const [error, setError] = useState('');

  // ── Audit Log States ──
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    module: '',
    userIdentity: '',
    userRole: '',
    status: ''
  });
  const [auditLoading, setAuditLoading] = useState(false);

  // ── Effects ──
  useEffect(() => {
    api.get('/admin/broadcast-targets', 'admin').then(r => {
      if (r.ok) {
        setBranches(r.data.branches || []);
        setProcesses(r.data.processes || []);
      }
    });
    loadAuditLogs(1);
  }, []);

  // ── Form Helpers ──
  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function hasDateRange() { return form.dateFrom && form.dateTo; }

  function validate() {
    if (!form.dateFrom || !form.dateTo) return '📅 Date From and Date To are required.';
    if (form.dateTo < form.dateFrom) return '📅 Date To must be on or after Date From.';
    return '';
  }

  // ── Compliance Exports ──
  async function loadPreview() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setPreviewLoading(true);
    setPreview(null);
    const params = new URLSearchParams({ dateFrom: form.dateFrom, dateTo: form.dateTo });
    if (form.branch) params.set('branch', form.branch);
    if (form.process) params.set('process', form.process);
    const r = await api.get(`/admin/compliance/preview?${params}`, 'admin');
    setPreviewLoading(false);
    if (r.ok) setPreview(r.data);
    else setError(r.message || 'Preview failed.');
  }

  async function doExport(key, path) {
    if (key !== 'trainees') {
      const err = validate();
      if (err) { setError(err); return; }
    }
    setError('');
    setExportLoading(s => ({ ...s, [key]: true }));
    const params = new URLSearchParams();
    if (key !== 'trainees') {
      if (form.dateFrom) params.set('dateFrom', form.dateFrom);
      if (form.dateTo) params.set('dateTo', form.dateTo);
    }
    if (form.branch) params.set('branch', form.branch);
    if (form.process) params.set('process', form.process);
    const d = new Date().toISOString().slice(0, 10);
    try {
      await downloadCsv(`/admin/compliance/${path}?${params}`, `compliance-${key}-${d}.csv`, 'admin');
    } catch {
      setError('Export failed. Please try again.');
    }
    setExportLoading(s => ({ ...s, [key]: false }));
  }

  // ── Audit Logs ──
  async function loadAuditLogs(p = page) {
    setAuditLoading(true);
    const params = new URLSearchParams();
    if (filters.action) params.set('action', filters.action);
    if (filters.module) params.set('module', filters.module);
    if (filters.userIdentity) params.set('userIdentity', filters.userIdentity);
    if (filters.userRole) params.set('userRole', filters.userRole);
    if (filters.status) params.set('status', filters.status);
    params.set('page', p);
    params.set('limit', '30');
    const res = await api.get(`/admin/audit-logs?${params.toString()}`, 'admin');
    if (res.ok) {
      setLogs(res.data);
      setTotal(res.total);
      setPage(res.page);
    }
    setAuditLoading(false);
  }

  async function openAuditDetail(id) {
    const res = await api.get(`/admin/audit-logs/${id}`, 'admin');
    if (res.ok) setDetail(res.data);
  }

  const totalPages = Math.ceil(total / 30);

  // ── Exports Config ──
  const dateRangeOk = hasDateRange() && form.dateTo >= form.dateFrom;

  const exports = [
    {
      key: 'trainees',
      icon: '👥',
      title: 'Full Trainee Register',
      btnColor: CHART_COLORS.blue,
      desc: 'All trainees — active, inactive, deleted. No date filter. Snapshot.',
      cols: 'Employee ID, ID Type, Name, Email, Mobile, Batch No, Branch, Process, LOB, Batch Start/End, Coordinator, Onboarding Date, Status, Cert Status, OJT Ready, Handover to Ops, Course %, MCQ %, Attendance %, Risk, Last Updated',
      path: 'export/trainees',
    },
    {
      key: 'attendance-login',
      icon: '📅',
      title: 'Attendance & Login',
      btnColor: CHART_COLORS.teal,
      desc: 'Daily attendance records and login session events in date range.',
      cols: 'Employee ID, Name, Batch No, Branch, Process, Record Type, Date, Attendance Status, Source, Course Activity, MCQ Activity, Login Action, Login Status, IP Address, Created At',
      path: 'export/attendance-login',
    },
    {
      key: 'learning',
      icon: '📚',
      title: 'Learning Activity',
      btnColor: CHART_COLORS.purple,
      desc: 'Content progress and assessment attempts within the date range.',
      cols: 'Employee ID, Name, Batch No, Branch, Process, Record Type, Module ID, Title, Status, Completion %, Score %, Pass/Fail, First Opened, Last Opened, Completed At, Time Spent (mins), Attempt No, Started At, Submitted At',
      path: 'export/learning',
    },
    {
      key: 'risk-escalation',
      icon: '⚠️',
      title: 'Risk & Escalation Trail',
      btnColor: CHART_COLORS.red,
      desc: 'Risk flags, pending alerts, and trainee queries raised within date range.',
      cols: 'Employee ID, Name, Batch No, Branch, Process, Record Type, Category/Type, Description/Query, Status, Priority/Severity, Raised/Created At, Actioned At, Resolved/Closed At, Actioned By, Remarks/Answer',
      path: 'export/risk-escalation',
    },
    {
      key: 'certification',
      icon: '🏆',
      title: 'Certification Chain',
      btnColor: CHART_COLORS.green,
      desc: 'Certification evidence conducted in date range, plus latest assessment snapshot.',
      cols: 'Employee ID, Name, Batch No, Branch, Process, Record Type, Evidence Type/Assessment ID, Score %, Result, Conducted/Completed At, Assessor/Conducted By, Total Attempts, Last Attempt At, Cert Status, Remarks',
      path: 'export/certification',
    },
  ];

  return (
    <div style={{
      padding: '8px 0 32px 0',
      fontFamily: '"Inter", -apple-system, sans-serif',
      maxWidth: 1440,
      margin: '0 auto',
    }}>
      {/* ===== HEADER ===== */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#0f172a',
            margin: 0,
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            📊 Compliance & Audit
          </h2>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#22c55e',
            background: 'rgba(34,197,94,0.1)',
            padding: '2px 12px',
            borderRadius: 20,
          }}>
            🔒 Auditor-Grade
          </span>
        </div>
        <p style={{
          fontSize: 14,
          color: '#64748b',
          marginTop: 4,
        }}>
          Complete audit trail with compliance-grade exports. All data includes full timestamp and user attribution.
        </p>
      </div>

      {/* ===== TOAST ===== */}
      {error && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 10,
          marginBottom: 16,
          border: '1px solid #fecaca',
          background: '#fef2f2',
          color: '#dc2626',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
          fontWeight: 500,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>❌ {error}</span>
          <button
            style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#dc2626' }}
            onClick={() => setError('')}
          >
            ✕
          </button>
        </div>
      )}

      {/* ===== SECTION 1: FILTERS & PREVIEW ===== */}
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid rgba(203,213,225,0.3)',
        padding: '18px 22px',
        marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>🔍 Compliance Filters</span>
          {(form.branch || form.process) && (
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#6366f1',
              background: 'rgba(99,102,241,0.08)',
              padding: '2px 10px',
              borderRadius: 20,
            }}>
              Active filters
            </span>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
          gap: 10,
          alignItems: 'end',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
              Date From <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              style={styles.input}
              value={form.dateFrom}
              onChange={e => setField('dateFrom', e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
              Date To <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              style={styles.input}
              value={form.dateTo}
              onChange={e => setField('dateTo', e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Branch</label>
            <select
              style={styles.select}
              value={form.branch}
              onChange={e => setField('branch', e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Process</label>
            <select
              style={styles.select}
              value={form.process}
              onChange={e => setField('process', e.target.value)}
            >
              <option value="">All Processes</option>
              {processes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button
            style={{
              ...styles.btn,
              ...styles.btnPrimary,
              height: 38,
              padding: '0 20px',
            }}
            onClick={loadPreview}
            disabled={previewLoading || !hasDateRange()}
          >
            {previewLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={styles.spinner} /> Loading…
              </span>
            ) : (
              '🔍 Preview'
            )}
          </button>
        </div>

        {!hasDateRange() && (
          <div style={{
            marginTop: 10,
            padding: '6px 12px',
            background: '#fef3c7',
            borderRadius: 8,
            fontSize: 12,
            color: '#92400e',
          }}>
            ⚠️ Please select a date range to enable preview and exports
          </div>
        )}
      </div>

      {/* ===== PREVIEW STATS ===== */}
      {preview && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}>
          <StatCard label="Trainees" value={preview.trainees} icon="👥" color={CHART_COLORS.blue} />
          <StatCard label="Attendance & Login" value={preview.attendanceAndLogin} icon="📅" color={CHART_COLORS.teal} />
          <StatCard label="Learning Activity" value={preview.learningActivity} icon="📚" color={CHART_COLORS.purple} />
          <StatCard label="Risk & Escalation" value={preview.riskAndEscalation} icon="⚠️" color={CHART_COLORS.red} />
          <StatCard label="Certification Chain" value={preview.certificationChain} icon="🏆" color={CHART_COLORS.green} />
        </div>
      )}

      {/* ===== SECTION 2: EXPORTS ===== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          📥 Compliance Exports — {exports.length} Available
        </div>
        {dateRangeOk && (
          <span style={{
            fontSize: 10,
            color: '#22c55e',
            background: 'rgba(34,197,94,0.08)',
            padding: '2px 12px',
            borderRadius: 20,
          }}>
            ✅ Date range valid
          </span>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        {exports.map(exp => (
          <ExportCard
            key={exp.key}
            icon={exp.icon}
            title={exp.title}
            desc={exp.desc}
            cols={exp.cols}
            btnColor={exp.btnColor}
            disabled={exp.key !== 'trainees' && !dateRangeOk}
            loading={!!exportLoading[exp.key]}
            onExport={() => doExport(exp.key, exp.path)}
          />
        ))}
      </div>

      {!dateRangeOk && (
        <div style={{
          marginBottom: 24,
          padding: '10px 16px',
          background: '#f8fafc',
          borderRadius: 10,
          border: '1px solid rgba(203,213,225,0.3)',
          fontSize: 12,
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>💡</span>
          Set a valid date range to enable compliance exports (except Full Trainee Register).
        </div>
      )}

      {/* ===== SECTION 3: AUDIT LOG VIEWER ===== */}
      <div style={{
        marginTop: 8,
        paddingTop: 20,
        borderTop: '2px solid rgba(203,213,225,0.2)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div>
            <h3 style={{
              fontSize: 17,
              fontWeight: 700,
              color: '#0f172a',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              📋 Audit Log Viewer
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#94a3b8',
                background: '#f8fafc',
                padding: '1px 10px',
                borderRadius: 20,
              }}>
                {total} records
              </span>
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Complete audit trail with before/after values and user attribution
            </p>
          </div>
          <button
            style={{ ...styles.btn, ...styles.btnSecondary, padding: '6px 14px', fontSize: 12 }}
            onClick={() => {
              setFilters({ action: '', module: '', userIdentity: '', userRole: '', status: '' });
              setTimeout(() => loadAuditLogs(1), 0);
            }}
          >
            ✕ Clear Filters
          </button>
        </div>

        {/* Audit Filters */}
        <div style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid rgba(203,213,225,0.3)',
          padding: '14px 18px',
          marginBottom: 14,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 8,
            alignItems: 'end',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>Action</label>
              <input
                style={styles.smallInput}
                placeholder="CREATE, UPDATE..."
                value={filters.action}
                onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && loadAuditLogs(1)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>Module</label>
              <input
                style={styles.smallInput}
                placeholder="batches, users..."
                value={filters.module}
                onChange={e => setFilters(f => ({ ...f, module: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && loadAuditLogs(1)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>User</label>
              <input
                style={styles.smallInput}
                placeholder="User identity"
                value={filters.userIdentity}
                onChange={e => setFilters(f => ({ ...f, userIdentity: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && loadAuditLogs(1)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>Role</label>
              <select
                style={styles.smallSelect}
                value={filters.userRole}
                onChange={e => setFilters(f => ({ ...f, userRole: e.target.value }))}
              >
                <option value="">All</option>
                <option value="Admin">Admin</option>
                <option value="Coordinator">Coordinator</option>
                <option value="Manager">Manager</option>
                <option value="Trainer">Trainer</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>Status</label>
              <select
                style={styles.smallSelect}
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              >
                <option value="">All</option>
                <option value="Success">✅ Success</option>
                <option value="Failed">❌ Failed</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'end', paddingBottom: 2 }}>
              <button
                style={{ ...styles.btn, ...styles.btnPrimary, padding: '6px 14px', fontSize: 12 }}
                onClick={() => loadAuditLogs(1)}
              >
                🔍 Search
              </button>
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid rgba(203,213,225,0.3)',
          overflow: 'hidden',
        }}>
          {auditLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <span style={styles.spinner} />
              <div style={{ marginTop: 10, fontSize: 13 }}>Loading audit logs...</div>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center' }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>🔍</span>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>No audit logs found</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Try adjusting your search filters</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Action</th>
                    <th style={styles.th}>Module</th>
                    <th style={styles.th}>Ref ID</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontSize: 11, whiteSpace: 'nowrap', color: '#64748b' }}>
                        {new Date(l.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{l.userIdentity}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '1px 8px',
                          borderRadius: 12,
                          background: l.userRole === 'Admin' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                          color: l.userRole === 'Admin' ? '#dc2626' : '#6366f1',
                        }}>
                          {l.userRole}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: 11,
                          color: '#0f172a',
                          background: '#f8fafc',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontFamily: 'monospace',
                        }}>
                          {l.action}
                        </span>
                      </td>
                      <td style={styles.td}>{l.module || '—'}</td>
                      <td style={{ ...styles.td, fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>
                        {l.referenceId || '—'}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          ...(l.status === 'Success' ? styles.statusSuccess : styles.statusFailed)
                        }}>
                          {l.status === 'Success' ? '✅' : '❌'} {l.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.viewBtn}
                          onClick={() => openAuditDetail(l.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {logs.length > 0 && (
            <div style={{
              padding: '10px 18px',
              borderTop: '1px solid rgba(203,213,225,0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                Showing {((page - 1) * 30) + 1} - {Math.min(page * 30, total)} of {total}
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  style={{
                    ...styles.btn,
                    ...styles.btnSecondary,
                    padding: '4px 12px',
                    fontSize: 11,
                    opacity: page <= 1 ? 0.4 : 1,
                  }}
                  disabled={page <= 1}
                  onClick={() => loadAuditLogs(page - 1)}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                  {page} / {totalPages || 1}
                </span>
                <button
                  style={{
                    ...styles.btn,
                    ...styles.btnSecondary,
                    padding: '4px 12px',
                    fontSize: 11,
                    opacity: page >= totalPages ? 0.4 : 1,
                  }}
                  disabled={page >= totalPages}
                  onClick={() => loadAuditLogs(page + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== AUDIT DETAIL MODAL ===== */}
      {detail && (
        <div style={styles.modalOverlay} onClick={() => setDetail(null)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <b style={styles.modalTitle}>📋 Audit Log Detail</b>
              <button style={styles.modalClose} onClick={() => setDetail(null)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>ID</span>
                  <span style={styles.detailValue}>{detail.id}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>User</span>
                  <span style={styles.detailValue}>
                    {detail.userIdentity}
                    <span style={{ color: '#94a3b8', marginLeft: 6 }}>({detail.userRole})</span>
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Action</span>
                  <span style={{
                    ...styles.detailValue,
                    fontFamily: 'monospace',
                    background: '#f8fafc',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    {detail.action}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Module</span>
                  <span style={styles.detailValue}>{detail.module || '—'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Reference</span>
                  <span style={{ ...styles.detailValue, fontFamily: 'monospace' }}>
                    {detail.referenceId || '—'}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Status</span>
                  <span style={{
                    ...styles.detailValue,
                    ...(detail.status === 'Success' ? styles.statusSuccess : styles.statusFailed),
                    padding: '2px 12px',
                    borderRadius: 12,
                    display: 'inline-block',
                  }}>
                    {detail.status === 'Success' ? '✅' : '❌'} {detail.status}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Source</span>
                  <span style={styles.detailValue}>{detail.source || '—'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Time</span>
                  <span style={styles.detailValue}>
                    {new Date(detail.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {detail.oldValue && (
                <div style={styles.detailSection}>
                  <div style={styles.detailSectionTitle}>📄 Old Value</div>
                  <pre style={styles.detailPre}>
                    {(() => {
                      try { return JSON.stringify(JSON.parse(detail.oldValue), null, 2); }
                      catch { return detail.oldValue; }
                    })()}
                  </pre>
                </div>
              )}

              {detail.newValue && (
                <div style={styles.detailSection}>
                  <div style={styles.detailSectionTitle}>📄 New Value</div>
                  <pre style={styles.detailPre}>
                    {(() => {
                      try { return JSON.stringify(JSON.parse(detail.newValue), null, 2); }
                      catch { return detail.newValue; }
                    })()}
                  </pre>
                </div>
              )}

              {detail.errorDetails && (
                <div style={styles.detailSection}>
                  <div style={{ ...styles.detailSectionTitle, color: '#dc2626' }}>❌ Error Details</div>
                  <pre style={{ ...styles.detailPre, background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}>
                    {detail.errorDetails}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== GLOBAL STYLES ===== */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .tr:hover {
          background: rgba(99,102,241,0.02);
        }
        .modal-close:hover {
          background: rgba(239,68,68,0.08);
          color: #ef4444;
        }
        .btn-primary:hover {
          background: #4f46e5 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        }
        .btn-secondary:hover {
          background: #f1f5f9 !important;
        }
        input:focus, select:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
        }
        .view-btn:hover {
          background: #6366f1 !important;
          color: #fff !important;
          border-color: #6366f1 !important;
        }
      `}</style>
    </div>
  );
}

// ========== STYLES ==========
const styles = {
  input: {
    padding: '7px 11px',
    borderRadius: 8,
    border: '1px solid rgba(203,213,225,0.4)',
    background: '#f8fafc',
    fontSize: 13,
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.2s',
    height: 36,
    width: '100%',
  },
  select: {
    padding: '7px 11px',
    borderRadius: 8,
    border: '1px solid rgba(203,213,225,0.4)',
    background: '#f8fafc',
    fontSize: 13,
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.2s',
    height: 36,
    width: '100%',
    cursor: 'pointer',
  },
  smallInput: {
    padding: '5px 10px',
    borderRadius: 6,
    border: '1px solid rgba(203,213,225,0.3)',
    background: '#f8fafc',
    fontSize: 12,
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.2s',
    height: 32,
    width: '100%',
  },
  smallSelect: {
    padding: '5px 10px',
    borderRadius: 6,
    border: '1px solid rgba(203,213,225,0.3)',
    background: '#f8fafc',
    fontSize: 12,
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.2s',
    height: 32,
    width: '100%',
    cursor: 'pointer',
  },
  btn: {
    borderRadius: 8,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  btnPrimary: {
    background: '#6366f1',
    color: '#fff',
  },
  btnSecondary: {
    background: 'rgba(241,245,249,0.8)',
    color: '#475569',
    border: '1px solid rgba(203,213,225,0.4)',
  },
  spinner: {
    display: 'inline-block',
    width: 14,
    height: 14,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    color: '#64748b',
    fontWeight: 600,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    borderBottom: '1px solid rgba(203,213,225,0.2)',
    background: '#fafbfc',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid rgba(203,213,225,0.06)',
    color: '#0f172a',
    fontSize: 12,
  },
  tr: {
    transition: 'background 0.15s',
    cursor: 'default',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '1px 8px',
    borderRadius: 16,
    display: 'inline-block',
  },
  statusSuccess: {
    background: 'rgba(34,197,94,0.1)',
    color: '#22c55e',
  },
  statusFailed: {
    background: 'rgba(239,68,68,0.1)',
    color: '#ef4444',
  },
  viewBtn: {
    padding: '2px 12px',
    borderRadius: 6,
    border: '1px solid rgba(203,213,225,0.3)',
    background: 'transparent',
    fontSize: 11,
    fontWeight: 600,
    color: '#6366f1',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modalBox: {
    background: '#ffffff',
    borderRadius: 18,
    maxWidth: 700,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
  },
  modalHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 22px',
    borderBottom: '1px solid rgba(203,213,225,0.2)',
    position: 'sticky',
    top: 0,
    background: '#ffffff',
    zIndex: 10,
    borderRadius: '18px 18px 0 0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(241,245,249,0.8)',
    fontSize: 16,
    cursor: 'pointer',
    color: '#64748b',
    transition: 'background 0.2s',
    display: 'grid',
    placeItems: 'center',
  },
  modalBody: {
    padding: '18px 22px 22px',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: 14,
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: 500,
  },
  detailSection: {
    marginTop: 14,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#475569',
    marginBottom: 4,
  },
  detailPre: {
    background: '#f8fafc',
    padding: '10px 12px',
    borderRadius: 8,
    fontSize: 11,
    fontFamily: 'monospace',
    maxHeight: 160,
    overflow: 'auto',
    border: '1px solid rgba(203,213,225,0.2)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    margin: 0,
  },
};