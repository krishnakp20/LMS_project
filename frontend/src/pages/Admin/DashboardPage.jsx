import { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';

export default function DashboardPage({ navigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredKpi, setHoveredKpi] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard', 'admin').then(r => {
      if (r.ok) setData(r.data);
      setLoading(false);
    });
  }, []);

  // ========== LOADING SKELETON ==========
  if (loading) {
    return (
      <div style={styles.root}>
        <div style={styles.header}>
          <div>
            <div style={{ ...styles.skeleton, width: 200, height: 36, marginBottom: 8 }}></div>
            <div style={{ ...styles.skeleton, width: 300, height: 16 }}></div>
          </div>
          <div style={{ ...styles.skeleton, width: 120, height: 40, borderRadius: 10 }}></div>
        </div>
        <div style={styles.kpiStrip}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ ...styles.skeleton, height: 90, borderRadius: 16 }}></div>
          ))}
        </div>
        <div style={styles.mainGrid}>
          <div style={{ ...styles.skeleton, height: 400, borderRadius: 18 }}></div>
          <div style={{ ...styles.skeleton, height: 400, borderRadius: 18 }}></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>🔌</div>
        <h2 style={styles.errorTitle}>Connection Error</h2>
        <p style={styles.errorDesc}>Unable to fetch dashboard data. Please check your network.</p>
        <button style={styles.retryBtn} onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  const riskConfig = {
    CRITICAL: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    HIGH: { label: 'High Risk', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    MEDIUM: { label: 'Medium', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    HEALTHY: { label: 'On Track', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  };

  const kpiData = [
    { key: 'trainees', label: 'Active Trainees', value: data.trainees, icon: '👥', color: '#6366f1', trend: '+12%', pct: 72 },
    { key: 'batches', label: 'Active Batches', value: data.batches, icon: '📚', color: '#8b5cf6', trend: '+5%', pct: 55 },
    { key: 'classrooms', label: 'Classrooms', value: data.classrooms, icon: '🏛️', color: '#06b6d4', trend: '+8%', pct: 87 },
    { key: 'openQueries', label: 'Open Queries', value: data.openQueries, icon: '💬', color: '#f59e0b', trend: '-3%', pct: 40 },
    {
      key: 'atRiskCount',
      label: 'At Risk',
      value: data.atRiskCount,
      icon: '⚠️',
      color: '#ef4444',
      trend: data.atRiskCount > 10 ? '↑ Critical' : '↓ Managed',
      pct: data.trainees > 0 ? Math.round((data.atRiskCount / data.trainees) * 100) : 0
    },
  ];

  return (
    <div style={styles.root}>
      {/* BACKGROUND ORBS */}
      <div style={styles.bgOrb1}></div>
      <div style={styles.bgOrb2}></div>
      <div style={styles.bgOrb3}></div>

      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <span style={styles.logo}>📊</span>
          <span style={styles.logoText}>Dial<span style={{ color: '#6366f1' }}>Desk</span></span>
          <span style={styles.envBadge}>Production</span>
        </div>
        <div style={styles.topBarRight}>
          <button style={styles.iconBtn}>🔔</button>
          <button style={styles.iconBtn}>⚙️</button>
          <div style={styles.avatar}>A</div>
        </div>
      </div>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Dashboard</h1>
          <p style={styles.pageSubtitle}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.exportBtn}>📥 Export</button>
          <button style={styles.refreshBtn} onClick={() => window.location.reload()}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div style={styles.kpiStrip}>
        {kpiData.map((kpi, idx) => {
          const isHovered = hoveredKpi === idx;
          return (
            <div
              key={kpi.key}
              style={{
                ...styles.kpiCard,
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: isHovered
                  ? '0 12px 40px rgba(99,102,241,0.15)'
                  : '0 2px 12px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={() => setHoveredKpi(idx)}
              onMouseLeave={() => setHoveredKpi(null)}
            >
              <div style={{ ...styles.kpiIcon, background: kpi.color + '20', color: kpi.color }}>
                {kpi.icon}
              </div>
              <div style={styles.kpiContent}>
                <div style={styles.kpiTop}>
                  <span style={{ ...styles.kpiNumber, color: kpi.color }}>{kpi.value.toLocaleString()}</span>
                  <span style={{
                    ...styles.kpiTrend,
                    color: kpi.trend.includes('+') ? '#22c55e' : kpi.trend.includes('↓') ? '#22c55e' : '#ef4444'
                  }}>
                    {kpi.trend}
                  </span>
                </div>
                <div style={styles.kpiLabel}>{kpi.label}</div>
                <div style={styles.kpiBar}>
                  <div style={{
                    ...styles.kpiBarFill,
                    width: `${Math.min(kpi.pct, 100)}%`,
                    background: kpi.color
                  }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN GRID - FIXED ALIGNMENT */}
      <div style={styles.mainGrid}>
        {/* LEFT COLUMN */}
        <div style={styles.leftCol}>
          {/* Active Batches */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <span style={styles.panelTitle}>📚 Active Batches</span>
                <span style={styles.panelSubtitle}>Top performing cohorts</span>
              </div>
              <span style={styles.panelBadge}>{data.activeBatches?.length || 0}</span>
            </div>
            <div style={styles.panelBody}>
              {(data.activeBatches || []).slice(0, 4).map((b) => {
                const pct = b.totalTrainees > 0 ? Math.round((b.certified / b.totalTrainees) * 100) : 0;
                const daysLeft = b.endDate
                  ? Math.max(0, Math.ceil((new Date(b.endDate) - new Date()) / 86400000))
                  : null;
                const statusLabel = pct >= 80 ? 'On Track' : pct >= 50 ? 'Attention' : 'Critical';
                const statusColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <div
                    key={b.batchNo}
                    style={styles.batchCard}
                    onClick={() => navigate('batch-detail', { batchNo: b.batchNo })}
                  >
                    <div style={styles.batchRow}>
                      <span style={styles.batchName}>{b.batchName || b.batchNo}</span>
                      <span style={{ ...styles.batchStatus, background: statusColor }}>{statusLabel}</span>
                    </div>
                    <div style={styles.batchMeta}>
                      👤 {b.coordinatorName || 'No coordinator'}
                      {daysLeft !== null && ` · ⏱️ ${daysLeft}d left`}
                    </div>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${pct}%`, background: statusColor }}></div>
                    </div>
                    <div style={styles.batchStats}>
                      <span>{b.totalTrainees || 0} trainees</span>
                      <span>{pct}% certified</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button style={styles.viewAllBtn} onClick={() => navigate('batches')}>
              View All Batches →
            </button>
          </div>

          {/* At-Risk Trainees Table */}
          {(data.atRiskTrainees || []).length > 0 && (
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <div>
                  <span style={styles.panelTitle}>🚨 At-Risk Trainees</span>
                  <span style={styles.panelSubtitle}>Immediate attention required</span>
                </div>
                <span style={{ ...styles.panelBadge, background: '#ef4444', color: '#fff' }}>
                  {data.atRiskTrainees.length}
                </span>
              </div>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Employee</th>
                      <th style={styles.th}>Batch</th>
                      <th style={styles.th}>Attendance</th>
                      <th style={styles.th}>Course</th>
                      <th style={styles.th}>Risk</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.atRiskTrainees.slice(0, 5).map((t) => (
                      <tr
                        key={t.employeeId}
                        style={styles.tr}
                        onClick={() =>
                          navigate('trainee-detail', {
                            empId: t.employeeId,
                            from: 'Dashboard',
                            fromId: 'dashboard',
                          })
                        }
                      >
                        <td style={styles.td}>
                          <div style={styles.traineeCell}>
                            <div style={styles.traineeAvatar}>
                              {t.traineeName?.charAt(0) || 'T'}
                            </div>
                            <div>
                              <div style={styles.traineeName}>{t.traineeName}</div>
                              <div style={styles.traineeId}>
                                {t.employeeId}
                                {t.empIdType === 'TEMP' && <span style={styles.tempBadge}>TEMP</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>{t.batchNo}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.progressValue,
                            color: t.attendancePct < 60 ? '#ef4444' : '#f59e0b'
                          }}>
                            {Math.round(t.attendancePct)}%
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.progressValue,
                            color: t.courseCompletionPct < 50 ? '#ef4444' : '#f59e0b'
                          }}>
                            {Math.round(t.courseCompletionPct)}%
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.pill,
                            ...(t.riskStatus === 'CRITICAL' ? styles.pillCritical : styles.pillHigh)
                          }}>
                            {t.riskStatus}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button
                            style={{
                              ...styles.actionBtn,
                              ...(t.riskStatus === 'CRITICAL' ? styles.actionBtnDanger : styles.actionBtnWarning)
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t.riskStatus === 'CRITICAL' ? 'Notify' : 'Follow Up'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.atRiskTrainees.length > 5 && (
                  <button style={styles.viewAllBtn} onClick={() => navigate('risk-detail')}>
                    View All {data.atRiskTrainees.length} Trainees →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - FIXED ALIGNMENT */}
        <div style={styles.rightCol}>
          {/* Quick Stats */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelTitle}>📈 Quick Stats</span>
            </div>
            <div style={styles.quickStats}>
              <div style={styles.quickStat}>
                <span style={styles.quickStatValue}>{data.batches}</span>
                <span style={styles.quickStatLabel}>Total Batches</span>
              </div>
              <div style={styles.quickStat}>
                <span style={styles.quickStatValue}>{data.trainees}</span>
                <span style={styles.quickStatLabel}>Total Trainees</span>
              </div>
              <div style={styles.quickStat}>
                <span style={styles.quickStatValue}>{data.coordinators?.length || 0}</span>
                <span style={styles.quickStatLabel}>Coordinators</span>
              </div>
              <div style={styles.quickStat}>
                <span style={styles.quickStatValue}>{data.classrooms}</span>
                <span style={styles.quickStatLabel}>Classrooms</span>
              </div>
            </div>
          </div>

          {/* Risk Snapshot */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelTitle}>⚠️ Risk Distribution</span>
            </div>
            <div style={styles.riskGrid}>
              {['CRITICAL', 'HIGH', 'MEDIUM', 'HEALTHY'].map((lvl) => {
                const cfg = riskConfig[lvl];
                const count = data.riskSnapshot?.[lvl] || 0;
                return (
                  <div
                    key={lvl}
                    style={{
                      ...styles.riskTile,
                      background: cfg.bg,
                      borderColor: cfg.color,
                    }}
                    onClick={() => navigate('risk-detail', { level: lvl })}
                  >
                    <div style={{ ...styles.riskNumber, color: cfg.color }}>{count}</div>
                    <div style={{ ...styles.riskLabel, color: cfg.color }}>{cfg.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coordinator Activity */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelTitle}>👥 Active Coordinators</span>
              <span style={styles.panelBadge}>{data.coordinators?.length || 0}</span>
            </div>
            <div style={styles.panelBody}>
              {(data.coordinators || []).slice(0, 4).map((c) => (
                <div
                  key={c.coordinatorLoginId}
                  style={styles.coordCard}
                  onClick={() =>
                    navigate('coord-detail', {
                      loginId: c.coordinatorLoginId,
                      coordinatorName: c.coordinatorName,
                    })
                  }
                >
                  <div style={styles.coordRow}>
                    <div>
                      <span style={styles.coordName}>{c.coordinatorName || c.coordinatorLoginId}</span>
                      <span style={styles.coordBatch}>{c.batchNo} · {c.batchName}</span>
                    </div>
                    <span style={styles.coordActive}>● Active</span>
                  </div>
                </div>
              ))}
              {(!data.coordinators || data.coordinators.length === 0) && (
                <div style={styles.emptyState}>No active coordinators</div>
              )}
            </div>
          </div>

          {/* Live Feed */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelTitle}>🔴 Live Activity</span>
              <span style={styles.liveDot}></span>
            </div>
            <div style={styles.feedList}>
              <div style={styles.feedItem}>
                <div style={{ ...styles.feedDot, background: '#22c55e' }}></div>
                <div style={styles.feedContent}>
                  <span style={styles.feedText}>System initialized</span>
                  <span style={styles.feedTime}>Just now</span>
                </div>
              </div>
              {(data.atRiskTrainees || []).slice(0, 3).map((t) => (
                <div key={t.employeeId} style={styles.feedItem}>
                  <div style={{
                    ...styles.feedDot,
                    background: t.riskStatus === 'CRITICAL' ? '#ef4444' : '#f59e0b'
                  }}></div>
                  <div style={styles.feedContent}>
                    <span style={styles.feedText}>
                      <strong>{t.traineeName}</strong> — {t.riskStatus} risk detected
                    </span>
                    <span style={styles.feedTime}>{t.batchNo} · {Math.round(t.attendancePct)}% attendance</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <span>© 2026 DialDesk — All rights reserved</span>
        <span style={styles.footerLinks}>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </span>
      </div>
    </div>
  );
}

// ========== STYLES ==========
const styles = {
  root: {
    padding: '20px 28px 40px 28px',
    maxWidth: '1440px',
    margin: '0 auto',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    minHeight: '100vh',
    background: '#f8fafc',
    position: 'relative',
  },

  bgOrb1: {
    position: 'fixed',
    top: '-400px',
    right: '-300px',
    width: '800px',
    height: '800px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  bgOrb2: {
    position: 'fixed',
    bottom: '-300px',
    left: '-200px',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  bgOrb3: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '1000px',
    height: '1000px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.03) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0 16px 0',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
    marginBottom: '24px',
    position: 'relative',
    zIndex: 1,
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: '-0.3px',
  },
  envBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 10px',
    borderRadius: '20px',
    background: '#dbeafe',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  iconBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
    position: 'relative',
    zIndex: 1,
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
  },
  exportBtn: {
    padding: '8px 18px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  refreshBtn: {
    padding: '8px 18px',
    background: '#6366f1',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  skeleton: {
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '8px',
  },

  kpiStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
    position: 'relative',
    zIndex: 1,
  },
  kpiCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '18px 20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'default',
  },
  kpiIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },
  kpiContent: {
    flex: 1,
    minWidth: 0,
  },
  kpiTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiNumber: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    lineHeight: 1.2,
  },
  kpiTrend: {
    fontSize: '11px',
    fontWeight: '600',
  },
  kpiLabel: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
    marginTop: '1px',
  },
  kpiBar: {
    marginTop: '8px',
    height: '4px',
    background: '#f1f5f9',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  kpiBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.8s ease',
  },

  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '20px',
    position: 'relative',
    zIndex: 1,
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  panel: {
    background: '#ffffff',
    borderRadius: '18px',
    padding: '20px 22px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    flexShrink: 0,
  },
  panelBody: {
    flex: 1,
  },
  panelTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
    display: 'block',
  },
  panelSubtitle: {
    fontSize: '12px',
    color: '#94a3b8',
    display: 'block',
    marginTop: '2px',
    fontWeight: '400',
  },
  panelBadge: {
    background: '#f1f5f9',
    padding: '2px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    flexShrink: 0,
  },

  batchCard: {
    padding: '14px 16px',
    background: '#f8fafc',
    borderRadius: '12px',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid transparent',
  },
  batchRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
  },
  batchStatus: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#ffffff',
    padding: '2px 10px',
    borderRadius: '20px',
  },
  batchMeta: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px',
  },
  batchStats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '6px',
  },
  progressBar: {
    marginTop: '8px',
    height: '4px',
    background: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },

  viewAllBtn: {
    width: '100%',
    marginTop: '12px',
    padding: '10px',
    background: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6366f1',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flexShrink: 0,
  },

  quickStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  quickStat: {
    textAlign: 'center',
    padding: '14px',
    background: '#f8fafc',
    borderRadius: '12px',
  },
  quickStatValue: {
    display: 'block',
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
  },
  quickStatLabel: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
  },

  riskGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  riskTile: {
    padding: '14px 12px',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    border: '2px solid',
    transition: 'transform 0.2s',
  },
  riskNumber: {
    fontSize: '26px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
  },
  riskLabel: {
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '2px',
  },

  coordCard: {
    padding: '12px 0',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'padding 0.2s',
  },
  coordRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    display: 'block',
  },
  coordBatch: {
    fontSize: '12px',
    color: '#94a3b8',
    display: 'block',
  },
  coordActive: {
    fontSize: '12px',
    color: '#22c55e',
    fontWeight: '500',
  },

  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    color: '#64748b',
    fontWeight: '600',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  td: {
    padding: '8px 10px',
    borderBottom: '1px solid #f1f5f9',
    color: '#0f172a',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background 0.15s',
  },

  traineeCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  traineeAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    flexShrink: 0,
  },
  traineeName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
  },
  traineeId: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  tempBadge: {
    marginLeft: '6px',
    background: '#f59e0b',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '8px',
    fontWeight: '700',
    padding: '1px 6px',
  },
  progressValue: {
    fontWeight: '600',
    fontSize: '13px',
  },

  pill: {
    padding: '2px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#fff',
    display: 'inline-block',
  },
  pillCritical: { background: '#ef4444' },
  pillHigh: { background: '#f59e0b' },

  actionBtn: {
    padding: '4px 14px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  actionBtnDanger: { background: '#ef4444' },
  actionBtnWarning: { background: '#f59e0b' },

  feedList: {
    maxHeight: '200px',
    overflowY: 'auto',
  },
  feedItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  feedDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: '5px',
  },
  feedContent: {
    flex: 1,
    minWidth: 0,
  },
  feedText: {
    fontSize: '13px',
    color: '#0f172a',
    display: 'block',
  },
  feedTime: {
    fontSize: '11px',
    color: '#94a3b8',
    display: 'block',
    marginTop: '1px',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    background: '#22c55e',
    borderRadius: '50%',
    display: 'inline-block',
  },

  emptyState: {
    padding: '20px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '13px',
  },

  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    textAlign: 'center',
    padding: '40px',
  },
  errorIcon: { fontSize: '48px', marginBottom: '16px' },
  errorTitle: { fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 },
  errorDesc: { color: '#64748b', marginTop: '8px' },
  retryBtn: {
    marginTop: '20px',
    padding: '10px 32px',
    background: '#6366f1',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  footer: {
    marginTop: '32px',
    paddingTop: '20px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    position: 'relative',
    zIndex: 1,
  },
  footerLinks: {
    display: 'flex',
    gap: '20px',
    cursor: 'default',
  },
};