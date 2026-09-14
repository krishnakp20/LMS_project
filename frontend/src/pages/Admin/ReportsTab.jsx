import { useState, useEffect } from 'react';
import { api, downloadCsv } from '../../utils/api.js';
import {
  Chart as ChartJS,
  ArcElement, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const CHART_COLORS = {
  blue: '#6366f1',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
  purple: '#8b5cf6',
  gray: '#94a3b8',
  teal: '#06b6d4',
};

// ========== STAT CARD ==========
function StatCard({ label, value, sub, icon, color = '#6366f1', trend, trendLabel }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 16,
      border: '1px solid rgba(203,213,225,0.3)',
      padding: '18px 20px',
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
        background: `linear-gradient(90deg, ${color}, ${color}80)`,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 4, letterSpacing: '-0.5px' }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${color}15`,
          display: 'grid',
          placeItems: 'center',
          fontSize: 20,
        }}>
          {icon}
        </div>
      </div>
      {trend && (
        <div style={{
          marginTop: 10,
          fontSize: 11,
          fontWeight: 600,
          color: trend > 0 ? '#22c55e' : '#ef4444',
          background: trend > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          padding: '2px 10px',
          borderRadius: 20,
          display: 'inline-block',
        }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel || ''}
        </div>
      )}
    </div>
  );
}

// ========== EXPORT CARD ==========
function ExportCard({ icon, title, desc, cols, count, btnColor, onExport, loading }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid rgba(203,213,225,0.3)',
        padding: '18px 20px',
        boxShadow: isHovered ? '0 8px 30px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.02)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${btnColor || CHART_COLORS.blue}15`,
          display: 'grid',
          placeItems: 'center',
          fontSize: 20,
          flexShrink: 0,
          color: btnColor || CHART_COLORS.blue,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
        </div>
      </div>

      {cols && (
        <div style={{
          fontSize: 10,
          color: '#94a3b8',
          background: '#f8fafc',
          borderRadius: 8,
          padding: '6px 10px',
          lineHeight: 1.6,
          fontFamily: 'monospace',
        }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>📋</span> {cols}
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 10,
        borderTop: '1px solid rgba(203,213,225,0.2)',
      }}>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>
          {count != null ? `📄 ${count} records` : 'CSV'}
        </span>
        <button
          style={{
            padding: '6px 18px',
            borderRadius: 8,
            border: 'none',
            background: btnColor || CHART_COLORS.blue,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          onClick={onExport}
          disabled={loading}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-block',
                width: 14,
                height: 14,
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

// ========== FILTER BAR ==========
function FilterBar({ batches, classrooms, selectedBatch, setSelectedBatch, selectedClassroom, setSelectedClassroom, onClear }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 16,
      border: '1px solid rgba(203,213,225,0.3)',
      padding: '18px 22px',
      marginBottom: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>🔍 Filter Reports</span>
        {(selectedBatch || selectedClassroom) && (
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
        gridTemplateColumns: '1fr 1fr auto',
        gap: 12,
        alignItems: 'end',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Batch</label>
          <select
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid rgba(203,213,225,0.4)',
              background: '#f8fafc',
              fontSize: 13,
              color: '#0f172a',
              outline: 'none',
              transition: 'border-color 0.2s',
              cursor: 'pointer',
            }}
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b.batchNo} value={b.batchNo}>
                {b.batchNo}{b.batchName ? ` — ${b.batchName}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Classroom</label>
          <select
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid rgba(203,213,225,0.4)',
              background: '#f8fafc',
              fontSize: 13,
              color: '#0f172a',
              outline: 'none',
              transition: 'border-color 0.2s',
              cursor: 'pointer',
            }}
            value={selectedClassroom}
            onChange={e => setSelectedClassroom(e.target.value)}
          >
            <option value="">All Classrooms</option>
            {classrooms.map(c => (
              <option key={c.classroomId} value={c.classroomId}>
                {c.classroomName}
              </option>
            ))}
          </select>
        </div>
        {(selectedBatch || selectedClassroom) && (
          <button
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid rgba(203,213,225,0.4)',
              background: '#f8fafc',
              fontSize: 13,
              fontWeight: 600,
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            onClick={onClear}
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function ReportsTab() {
  const [batches, setBatches] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [summary, setSummary] = useState(null);
  const [riskStats, setRiskStats] = useState(null);
  const [batchStats, setBatchStats] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [exportLoading, setExportLoading] = useState({});
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api.get('/admin/batches', 'admin').then(r => r.ok && setBatches(r.data));
    api.get('/admin/classrooms', 'admin').then(r => r.ok && setClassrooms(r.data));
  }, []);

  useEffect(() => { loadSummary(); }, [selectedBatch, selectedClassroom]);

  async function loadSummary() {
    setLoadingChart(true);
    const params = new URLSearchParams();
    if (selectedBatch) params.set('batchNo', selectedBatch);
    if (selectedClassroom) params.set('classroomId', selectedClassroom);

    const [traineeRes, riskRes, batchRes] = await Promise.all([
      api.get(`/admin/trainees/search?${params}&limit=2000`, 'admin'),
      api.get('/admin/risk/ALL', 'admin').catch(() => ({ ok: false })),
      api.get('/admin/batches', 'admin'),
    ]);

    if (traineeRes.ok) {
      const data = traineeRes.data || [];
      const total = data.length;
      const certified = data.filter(t => t.certificationStatus === 'Certified').length;
      const atRisk = data.filter(t => ['CRITICAL', 'HIGH'].includes(t.riskStatus)).length;
      const watch = data.filter(t => t.riskStatus === 'WATCH').length;
      const avgCourse = total ? Math.round(data.reduce((s, t) => s + (t.courseCompletionPct || 0), 0) / total) : 0;
      const avgMcq = total ? Math.round(data.reduce((s, t) => s + (t.assessmentPassPct || 0), 0) / total) : 0;
      const avgAtt = total ? Math.round(data.reduce((s, t) => s + (t.attendancePct || 0), 0) / total) : 0;
      setSummary({ total, certified, atRisk, watch, avgCourse, avgMcq, avgAtt });
      setRiskStats({ atRisk, watch, ok: total - atRisk - watch });
    }

    if (batchRes.ok && batchRes.data.length > 0) {
      const top = batchRes.data.slice(0, 8);
      setBatchStats(top);
    }
    setLoadingChart(false);
  }

  async function doExport(key, url, filename) {
    setExportLoading(s => ({ ...s, [key]: true }));
    setMsg(null);
    try {
      await downloadCsv(url, filename, 'admin');
    } catch {
      setMsg({ type: 'bad', text: 'Download failed. Check your connection.' });
    }
    setExportLoading(s => ({ ...s, [key]: false }));
  }

  const p = new URLSearchParams();
  if (selectedBatch) p.set('batchNo', selectedBatch);
  if (selectedClassroom) p.set('classroomId', selectedClassroom);
  const d = new Date().toISOString().slice(0, 10);
  const bl = selectedBatch || 'all';

  const exports = [
    {
      key: 'trainee-progress',
      icon: '👥',
      title: 'All Trainees Report',
      btnColor: CHART_COLORS.blue,
      desc: 'All trainees with KPI metrics and certification status.',
      cols: 'Employee ID, Name, Email, Mobile, Batch, Branch, Process, LOB, Course %, MCQ %, Attendance %, Risk, Cert Status',
      url: `/admin/trainees/export?${p}`,
      filename: `trainees-all-${bl}-${d}.csv`,
    },
    {
      key: 'trainees-active',
      icon: '✅',
      title: 'Active Trainees',
      btnColor: CHART_COLORS.green,
      desc: 'Currently active trainees with full profile and KPI data.',
      cols: 'Employee ID, Name, Email, Mobile, Batch, Branch, Process, LOB, Course %, MCQ %, Attendance %, Risk, Cert Status',
      url: `/admin/trainees/export?status=Active&${p}`,
      filename: `trainees-active-${bl}-${d}.csv`,
    },
    {
      key: 'trainees-inactive',
      icon: '🔴',
      title: 'Inactive Trainees',
      btnColor: CHART_COLORS.red,
      desc: 'Inactive/deactivated trainees for records and compliance.',
      cols: 'Employee ID, Name, Email, Mobile, Batch, Branch, Process, LOB, Course %, MCQ %, Attendance %, Risk, Cert Status',
      url: `/admin/trainees/export?status=Inactive&${p}`,
      filename: `trainees-inactive-${bl}-${d}.csv`,
    },
    {
      key: 'batch-summary',
      icon: '🏢',
      title: 'Batch Summary',
      btnColor: CHART_COLORS.green,
      desc: 'One row per batch with KPI averages, risk count, certified count.',
      cols: 'Batch No, Name, Branch, Process, Coordinator, Status, Total Trainees, Avg Course %, Avg MCQ %, Avg Attendance %, At-Risk, Certified',
      url: `/admin/reports/batch-summary`,
      filename: `batch-summary-${d}.csv`,
    },
    {
      key: 'at-risk',
      icon: '⚠️',
      title: 'At-Risk Trainees',
      btnColor: CHART_COLORS.red,
      desc: 'CRITICAL, HIGH, and WATCH risk trainees with risk details.',
      cols: 'Employee ID, Name, Batch, Branch, Process, Risk Level, Risk Reason, Course %, MCQ %, Attendance %, Cert Status',
      url: `/admin/reports/at-risk?${p}`,
      filename: `at-risk-${bl}-${d}.csv`,
    },
    {
      key: 'module-completion',
      icon: '📚',
      title: 'Module Completion Detail',
      btnColor: CHART_COLORS.purple,
      desc: 'Per-content progress rows with completion status and time spent.',
      cols: 'Employee ID, Name, Batch, Module, Content Title, Status, Completion %, First Opened, Completed At, Time Spent',
      url: `/admin/reports/module-completion?${p}`,
      filename: `module-completion-${bl}-${d}.csv`,
    },
    {
      key: 'assessment-results',
      icon: '📝',
      title: 'Assessment Results',
      btnColor: CHART_COLORS.amber,
      desc: 'Every MCQ attempt with score, time taken, and pass/fail status.',
      cols: 'Employee ID, Name, Batch, Module, Assessment, Score %, Correct, Wrong, Blank, Started At, Time Taken, Pass/Fail',
      url: `/admin/reports/assessment-results?${p}`,
      filename: `assessment-results-${bl}-${d}.csv`,
    },
    {
      key: 'attendance-log',
      icon: '📅',
      title: 'Attendance Log',
      btnColor: CHART_COLORS.teal,
      desc: 'Daily attendance inferences per trainee with activity source.',
      cols: 'Employee ID, Name, Batch, Date, Status, Source, Course Activity, MCQ Activity',
      url: `/admin/reports/attendance-log?${p}`,
      filename: `attendance-log-${bl}-${d}.csv`,
    },
    {
      key: 'cert-evidence',
      icon: '🏆',
      title: 'Certification Evidence',
      btnColor: '#059669',
      desc: 'Mock calls, internal and external certification records.',
      cols: 'Employee ID, Name, Batch, Evidence Type, Score/Result, Conducted At, Assessor, Remarks',
      url: `/admin/reports/certification-evidence?${p}`,
      filename: `cert-evidence-${bl}-${d}.csv`,
    },
    {
      key: 'broadcast-assignments',
      icon: '📢',
      title: 'Broadcast Assignments',
      btnColor: CHART_COLORS.purple,
      desc: 'All module assignments via broadcast with scope and timestamps.',
      cols: 'Broadcast Title, Module Name, Scope Type, Scope Value, Assigned By, Assigned At, Due Date',
      url: `/admin/reports/broadcast-assignments`,
      filename: `broadcast-assignments-${d}.csv`,
    },
    {
      key: 'qa-activity',
      icon: '💬',
      title: 'Q&A Activity Log',
      btnColor: '#0284c7',
      desc: 'All queries raised by trainees with resolution time and TAT.',
      cols: 'Query ID, Employee ID, Batch, Module, Query Text, Status, Priority, Raised At, Answered At, TAT (hours)',
      url: `/admin/reports/qa-activity?${p}`,
      filename: `qa-activity-${bl}-${d}.csv`,
    },
  ];

  // Chart data
  const riskDonutData = riskStats ? {
    labels: ['Critical/High', 'Watch', 'On Track'],
    datasets: [{
      data: [riskStats.atRisk, riskStats.watch, riskStats.ok],
      backgroundColor: [CHART_COLORS.red, CHART_COLORS.amber, CHART_COLORS.green],
      borderWidth: 0,
    }],
  } : null;

  const certFunnelData = summary ? {
    labels: ['Total', 'Certified', 'At Risk'],
    datasets: [{
      label: 'Trainees',
      data: [summary.total, summary.certified, summary.atRisk],
      backgroundColor: [CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.red],
      borderRadius: 6,
    }],
  } : null;

  const batchBarData = batchStats.length > 0 ? {
    labels: batchStats.map(b => b.batchNo),
    datasets: [
      {
        label: 'Course %',
        data: batchStats.map(b => Math.round(b.avgCourseCompletion || 0)),
        backgroundColor: `${CHART_COLORS.blue}CC`,
        borderRadius: 4,
      },
      {
        label: 'MCQ %',
        data: batchStats.map(b => Math.round(b.avgMcqPass || 0)),
        backgroundColor: `${CHART_COLORS.amber}CC`,
        borderRadius: 4,
      },
      {
        label: 'Attendance %',
        data: batchStats.map(b => Math.round(b.avgAttendance || 0)),
        backgroundColor: `${CHART_COLORS.purple}CC`,
        borderRadius: 4,
      },
    ],
  } : null;

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#0f172a',
          font: { size: 11, weight: '500' },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
    },
  };

  const barOpts = {
    ...chartOpts,
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 10 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#64748b', font: { size: 10 } },
        max: 100,
        grid: { color: 'rgba(203,213,225,0.2)' },
      },
    },
  };

  return (
    <div style={{ padding: '8px 0 32px 0', fontFamily: '"Inter", -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontSize: 24,
          fontWeight: 800,
          color: '#0f172a',
          margin: 0,
          letterSpacing: '-0.5px',
        }}>
          📊 Reports & Exports
        </h2>
        <p style={{
          fontSize: 14,
          color: '#64748b',
          marginTop: 4,
        }}>
          Compliance-grade exports with complete audit trail. Use filters to scope by batch or classroom.
        </p>
      </div>

      {/* Toast */}
      {msg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 12,
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
          {msg.text}
          <button
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#dc2626' }}
            onClick={() => setMsg(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        batches={batches}
        classrooms={classrooms}
        selectedBatch={selectedBatch}
        setSelectedBatch={setSelectedBatch}
        selectedClassroom={selectedClassroom}
        setSelectedClassroom={setSelectedClassroom}
        onClear={() => { setSelectedBatch(''); setSelectedClassroom(''); }}
      />

      {/* KPI Summary */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}>
          <StatCard
            label="Total Trainees"
            value={summary.total}
            icon="👥"
            color={CHART_COLORS.blue}
          />
          <StatCard
            label="Certified"
            value={summary.certified}
            sub={`${summary.total ? Math.round(summary.certified / summary.total * 100) : 0}% of total`}
            icon="🏆"
            color={CHART_COLORS.green}
            trend={summary.total ? Math.round(summary.certified / summary.total * 100) - 50 : 0}
            trendLabel="vs target"
          />
          <StatCard
            label="At Risk"
            value={summary.atRisk}
            sub="CRITICAL / HIGH"
            icon="⚠️"
            color={CHART_COLORS.red}
          />
          <StatCard
            label="Avg Course"
            value={`${summary.avgCourse}%`}
            icon="📚"
            color={CHART_COLORS.blue}
          />
          <StatCard
            label="Avg MCQ"
            value={`${summary.avgMcq}%`}
            icon="📝"
            color={CHART_COLORS.amber}
          />
          <StatCard
            label="Avg Attendance"
            value={`${summary.avgAtt}%`}
            icon="📅"
            color={CHART_COLORS.purple}
          />
        </div>
      )}

      {/* Charts Row */}
      {!loadingChart && summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr 1fr',
          gap: 16,
          marginBottom: 28,
        }}>
          {/* Risk Donut */}
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid rgba(203,213,225,0.3)',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 12,
            }}>
              ⚠️ Risk Distribution
            </div>
            <div style={{ height: 160 }}>
              {riskDonutData && <Doughnut data={riskDonutData} options={{ ...chartOpts, cutout: '65%' }} />}
            </div>
          </div>

          {/* Cert Funnel */}
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid rgba(203,213,225,0.3)',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 12,
            }}>
              🏆 Certification Funnel
            </div>
            <div style={{ height: 160 }}>
              {certFunnelData && <Bar data={certFunnelData} options={barOpts} />}
            </div>
          </div>

          {/* Batch Comparison */}
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid rgba(203,213,225,0.3)',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 12,
            }}>
              📊 Batch KPI Comparison
            </div>
            <div style={{ height: 160 }}>
              {batchBarData ? (
                <Bar data={batchBarData} options={barOpts} />
              ) : (
                <div style={{
                  height: '100%',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#94a3b8',
                  fontSize: 12,
                }}>
                  No batch data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Section Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          📥 Export Reports — {exports.length} Available
        </div>
        <span style={{
          fontSize: 11,
          color: '#94a3b8',
          background: '#f8fafc',
          padding: '4px 12px',
          borderRadius: 20,
        }}>
          {selectedBatch ? `Batch: ${selectedBatch}` : selectedClassroom ? `Classroom: ${classrooms.find(c => c.classroomId === selectedClassroom)?.classroomName || selectedClassroom}` : 'All data'}
        </span>
      </div>

      {/* Export Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 14,
      }}>
        {exports.map(exp => (
          <ExportCard
            key={exp.key}
            icon={exp.icon}
            title={exp.title}
            desc={exp.desc}
            cols={exp.cols}
            btnColor={exp.btnColor}
            loading={!!exportLoading[exp.key]}
            onExport={() => doExport(exp.key, exp.url, exp.filename)}
          />
        ))}
      </div>

      {/* Footer Note */}
      <div style={{
        marginTop: 20,
        padding: '14px 18px',
        background: '#f8fafc',
        borderRadius: 12,
        border: '1px solid rgba(203,213,225,0.3)',
        fontSize: 12,
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <div>
          <span style={{ fontWeight: 600, color: '#64748b' }}>Note:</span>
          Trainee Progress, At-Risk, Module Completion, Assessment Results, Attendance Log, and Q&A Activity exports respect the Batch/Classroom filters.
          Batch Summary and Broadcast Assignments export all records.
        </div>
      </div>

      {/* Global animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
        }
        .export-card:hover .export-btn {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}