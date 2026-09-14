import { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/api.js';
import './talentAdmin.css';
import './evidenceGovernance.css';

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function date(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }) {
  const colors = {
    GAP: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', icon: '⚠️' },
    READY: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', icon: '✅' },
    PENDING: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: '⏳' },
    EXPIRED: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', icon: '⌛' },
  };
  const config = colors[status] || colors.PENDING;
  
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

function EvidenceTypeBadge({ type }) {
  const types = {
    content: { icon: '📄', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    assessment: { icon: '📝', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    verification: { icon: '🔍', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  };
  const config = types[type] || types.content;
  
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

function StatCard({ label, value, icon, color, sub }) {
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
      </div>
    </div>
  );
}

export default function EvidenceGovernanceTab() {
  const [view, setView] = useState('mapping');
  const [catalog, setCatalog] = useState({ skills: [], contents: [], assessments: [], contentMaps: [], assessmentMaps: [] });
  const [search, setSearch] = useState('');
  const [mapForm, setMapForm] = useState({ mapType: 'content', referenceId: '', skillId: '', targetLevel: 1, weight: 1 });
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [snapshot, setSnapshot] = useState(null);
  const [verifyForm, setVerifyForm] = useState({ skillId: '', currentLevel: 1, targetLevel: 1, confidenceScore: 100, expiresAt: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const references = mapForm.mapType === 'content' ? catalog.contents : catalog.assessments;
  const mappings = useMemo(() => {
    const rows = mapForm.mapType === 'content' ? catalog.contentMaps : catalog.assessmentMaps;
    const referenceIndex = new Map(references.map(item => [item.referenceId, item]));
    return rows.map(row => ({ ...row, reference: referenceIndex.get(row.referenceId) })).filter(row => row.reference);
  }, [catalog, mapForm.mapType, references]);

  async function loadCatalog(query = search) {
    setLoading(true);
    setError('');
    const result = await api.get(`/talent/admin/evidence/catalog?q=${encodeURIComponent(query.trim())}`, 'admin');
    setLoading(false);
    if (!result.ok) return setError(result.message || 'Could not load evidence catalog.');
    setCatalog(result.data || { skills: [], contents: [], assessments: [], contentMaps: [], assessmentMaps: [] });
  }

  useEffect(() => { loadCatalog(''); }, []);

  async function saveMapping(event) {
    event.preventDefault();
    setSaving('mapping');
    setError('');
    const result = await api.put(
      `/talent/admin/skills/${encodeURIComponent(mapForm.skillId)}/maps/${mapForm.mapType}`,
      { referenceId: mapForm.referenceId, targetLevel: num(mapForm.targetLevel, 1), weight: num(mapForm.weight, 1) },
      'admin',
    );
    setSaving('');
    if (!result.ok) return setError(result.message || 'Could not save evidence mapping.');
    setMessage('Evidence mapping saved. Future completions and assessment results will update the skill profile automatically.');
    await loadCatalog(search);
  }

  async function removeMapping(row) {
    setSaving(`remove:${row.id}`);
    const result = await api.delete(`/talent/admin/skills/${encodeURIComponent(row.skillId)}/maps/${mapForm.mapType}/${encodeURIComponent(row.referenceId)}`, 'admin');
    setSaving('');
    if (!result.ok) return setError(result.message || 'Could not remove mapping.');
    setMessage('Evidence mapping removed. Existing evidence remains auditable but new evidence will not be generated.');
    await loadCatalog(search);
  }

  async function searchEmployees(event) {
    event.preventDefault();
    if (employeeQuery.trim().length < 2) return setError('Enter at least two characters.');
    setSaving('search');
    setError('');
    const result = await api.get(`/talent/admin/employees/search?q=${encodeURIComponent(employeeQuery.trim())}`, 'admin');
    setSaving('');
    if (!result.ok) return setError(result.message || 'Could not search employees.');
    setEmployees(result.data || []);
  }

  async function openEmployee(employeeId) {
    setSelectedEmployee(employeeId);
    setSnapshot(null);
    setSaving('profile');
    setError('');
    const result = await api.get(`/talent/admin/employees/${encodeURIComponent(employeeId)}/talent`, 'admin');
    setSaving('');
    if (!result.ok) return setError(result.message || 'Could not load employee profile.');
    setSnapshot(result.data);
    const firstSkill = result.data?.profiles?.[0] || result.data?.requirements?.[0];
    setVerifyForm(form => ({
      ...form,
      skillId: firstSkill?.skillId || '',
      currentLevel: firstSkill?.currentLevel || 1,
      targetLevel: firstSkill?.targetLevel || firstSkill?.requiredLevel || 1,
    }));
  }

  async function verifySkill(event) {
    event.preventDefault();
    setSaving('verify');
    setError('');
    const result = await api.put(
      `/talent/admin/skills/profiles/${encodeURIComponent(selectedEmployee)}/${encodeURIComponent(verifyForm.skillId)}`,
      {
        currentLevel: num(verifyForm.currentLevel),
        targetLevel: num(verifyForm.targetLevel),
        confidenceScore: num(verifyForm.confidenceScore, 100),
        expiresAt: verifyForm.expiresAt || undefined,
        notes: verifyForm.notes,
      },
      'admin',
    );
    setSaving('');
    if (!result.ok) return setError(result.message || 'Could not verify skill.');
    setMessage('Skill verification saved with a permanent audit and evidence record.');
    setVerifyForm(form => ({ ...form, notes: '' }));
    await openEmployee(selectedEmployee);
  }

  const totalSkills = catalog.skills.length;
  const totalMappings = mappings.length;
  const totalContents = catalog.contents.length;
  const totalAssessments = catalog.assessments.length;

  return (
    <section className="evidence-shell" style={{
      padding: '24px 0',
      maxWidth: 1400,
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 4,
          }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>🔍</span>
            <h1 style={{
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--ink)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              Evidence Mapping & Verification
            </h1>
          </div>
          <p style={{
            fontSize: 14,
            color: 'var(--muted)',
            margin: '4px 0 0',
            maxWidth: 600,
          }}>
            Define which learning activity proves a skill, inspect the resulting evidence ledger, and record time-bound expert verification.
          </p>
        </div>
        <button
          onClick={() => loadCatalog(search)}
          disabled={loading}
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
          🔄 {loading ? 'Loading...' : 'Refresh'}
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

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 14,
        marginBottom: 24,
      }}>
        <StatCard label="Total Skills" value={totalSkills} icon="🎯" color="rgba(99,102,241,0.1)" />
        <StatCard label="Active Mappings" value={totalMappings} icon="🔗" color="rgba(34,197,94,0.1)" />
        <StatCard label="Content Items" value={totalContents} icon="📄" color="rgba(245,158,11,0.1)" />
        <StatCard label="Assessments" value={totalAssessments} icon="📝" color="rgba(239,68,68,0.1)" />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 20,
        background: 'var(--card-solid)',
        borderRadius: '12px',
        padding: 4,
        border: '1px solid var(--line)',
      }}>
        <button
          className={view === 'mapping' ? 'active' : ''}
          onClick={() => setView('mapping')}
          style={{
            flex: 1,
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: view === 'mapping' ? '#6366f1' : 'transparent',
            color: view === 'mapping' ? '#fff' : 'var(--muted)',
            fontWeight: view === 'mapping' ? 700 : 500,
            fontSize: 13,
            transition: 'all 0.15s',
          }}
        >
          🔗 Evidence Mapping
        </button>
        <button
          className={view === 'verification' ? 'active' : ''}
          onClick={() => setView('verification')}
          style={{
            flex: 1,
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: view === 'verification' ? '#6366f1' : 'transparent',
            color: view === 'verification' ? '#fff' : 'var(--muted)',
            fontWeight: view === 'verification' ? 700 : 500,
            fontSize: 13,
            transition: 'all 0.15s',
          }}
        >
          👤 Employee Verification
        </button>
      </div>

      {/* Evidence Mapping View */}
      {view === 'mapping' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 20,
          alignItems: 'start',
        }}>
          {/* Mapping List */}
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
              gap: 12,
            }}>
              <div>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: 0,
                }}>
                  Mapped Evidence
                </h3>
                <p style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  margin: '2px 0 0',
                }}>
                  Content completion and passed assessments generate immutable employee evidence.
                </p>
              </div>
              <span style={{
                padding: '4px 12px',
                borderRadius: '99px',
                background: 'rgba(99,102,241,0.1)',
                color: '#6366f1',
                fontSize: 12,
                fontWeight: 600,
              }}>
                {mappings.length} active maps
              </span>
            </div>

            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--line)',
            }}>
              <form
                onSubmit={event => { event.preventDefault(); loadCatalog(search); }}
                style={{
                  display: 'flex',
                  gap: 8,
                }}
              >
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="🔍 Search skill, content, assessment or classroom"
                  style={{
                    flex: 1,
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
                <button
                  type="submit"
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
                  Search
                </button>
              </form>
            </div>

            <div style={{
              overflowX: 'auto',
              padding: '0 4px 4px',
            }}>
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
                      Evidence Source
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
                      Skill
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
                      Target
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
                      Weight
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
                      Mapped
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
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map(row => (
                    <tr key={row.id} style={{
                      borderBottom: '1px solid var(--line)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--card)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}>
                      <td style={{
                        padding: '10px 14px',
                      }}>
                        <div style={{
                          fontWeight: 600,
                          color: 'var(--ink)',
                        }}>
                          {row.reference?.referenceTitle}
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                          fontFamily: 'monospace',
                          marginTop: 2,
                        }}>
                          {row.referenceId}
                          {row.reference?.classroomName && (
                            <span style={{ marginLeft: 8 }}>
                              · {row.reference.classroomName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        color: 'var(--ink)',
                      }}>
                        {row.skillName}
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        textAlign: 'center',
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '99px',
                          background: 'rgba(99,102,241,0.1)',
                          color: '#6366f1',
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          Level {row.targetLevel}
                        </span>
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        textAlign: 'center',
                        color: 'var(--ink)',
                      }}>
                        {row.weight}
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        textAlign: 'center',
                        fontSize: 12,
                        color: 'var(--muted)',
                      }}>
                        {date(row.updatedAt)}
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        textAlign: 'center',
                      }}>
                        <button
                          onClick={() => removeMapping(row)}
                          disabled={saving === `remove:${row.id}`}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(239,68,68,0.2)',
                            background: 'rgba(239,68,68,0.08)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 500,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                          }}
                        >
                          {saving === `remove:${row.id}` ? '⏳' : '🗑️ Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!mappings.length && (
                    <tr>
                      <td colSpan="6" style={{
                        textAlign: 'center',
                        color: 'var(--muted)',
                        padding: '48px 20px',
                      }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                          No active mappings in this view
                        </div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>
                          Use the form to connect learning evidence to a skill.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Map Form */}
          <form
            onSubmit={saveMapping}
            style={{
              background: 'var(--card-solid)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              padding: '20px',
              position: 'sticky',
              top: 20,
            }}
          >
            <div style={{
              marginBottom: 16,
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--ink)',
                margin: 0,
              }}>
                Map Evidence
              </h3>
              <p style={{
                fontSize: 13,
                color: 'var(--muted)',
                margin: '2px 0 0',
              }}>
                A learner earns the target level after satisfying this source.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gap: 14,
            }}>
              <div>
                <label style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--muted)',
                  display: 'block',
                  marginBottom: 4,
                }}>
                  Evidence Type
                </label>
                <select
                  value={mapForm.mapType}
                  onChange={event => setMapForm(form => ({ ...form, mapType: event.target.value, referenceId: '' }))}
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
                  <option value="content">📄 Content completion</option>
                  <option value="assessment">📝 Assessment result</option>
                </select>
              </div>

              <div>
                <label style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--muted)',
                  display: 'block',
                  marginBottom: 4,
                }}>
                  Learning Source <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  required
                  value={mapForm.referenceId}
                  onChange={event => setMapForm(form => ({ ...form, referenceId: event.target.value }))}
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
                  <option value="">Select source</option>
                  {references.map(item => (
                    <option key={item.referenceId} value={item.referenceId}>
                      {item.referenceTitle} {item.classroomName ? `· ${item.classroomName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--muted)',
                  display: 'block',
                  marginBottom: 4,
                }}>
                  Skill <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  required
                  value={mapForm.skillId}
                  onChange={event => setMapForm(form => ({ ...form, skillId: event.target.value }))}
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
                  <option value="">Select skill</option>
                  {catalog.skills.map(skill => (
                    <option key={skill.skillId} value={skill.skillId}>
                      {skill.skillName} · {skill.category}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}>
                <div>
                  <label style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--muted)',
                    display: 'block',
                    marginBottom: 4,
                  }}>
                    Target Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={mapForm.targetLevel}
                    onChange={event => setMapForm(form => ({ ...form, targetLevel: event.target.value }))}
                    style={{
                      width: '100%',
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
                </div>
                <div>
                  <label style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--muted)',
                    display: 'block',
                    marginBottom: 4,
                  }}>
                    Evidence Weight
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={mapForm.weight}
                    onChange={event => setMapForm(form => ({ ...form, weight: event.target.value }))}
                    style={{
                      width: '100%',
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
                </div>
              </div>

              <button
                className="btn"
                disabled={saving === 'mapping'}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginTop: 4,
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
                {saving === 'mapping' ? '⏳ Saving...' : '💾 Save Evidence Map'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employee Verification View */}
      {view === 'verification' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr 380px',
          gap: 20,
          alignItems: 'start',
        }}>
          {/* Employee Search */}
          <div style={{
            background: 'var(--card-solid)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            overflow: 'hidden',
            position: 'sticky',
            top: 20,
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--line)',
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--ink)',
                margin: 0,
              }}>
                👤 Find Employee
              </h3>
              <p style={{
                fontSize: 13,
                color: 'var(--muted)',
                margin: '2px 0 0',
              }}>
                Results are restricted to the administrator's data scope.
              </p>
            </div>

            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--line)',
            }}>
              <form
                onSubmit={searchEmployees}
                style={{
                  display: 'flex',
                  gap: 8,
                }}
              >
                <input
                  value={employeeQuery}
                  onChange={event => setEmployeeQuery(event.target.value)}
                  placeholder="Name, ID, email or mobile"
                  style={{
                    flex: 1,
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
                <button
                  type="submit"
                  disabled={saving === 'search'}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#6366f1',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    transition: 'all 0.2s',
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
                  {saving === 'search' ? '⏳' : '🔍'}
                </button>
              </form>
            </div>

            <div style={{
              maxHeight: 400,
              overflowY: 'auto',
              padding: '8px',
            }}>
              {employees.map(employee => (
                <button
                  key={employee.employeeId}
                  className={selectedEmployee === employee.employeeId ? 'active' : ''}
                  onClick={() => openEmployee(employee.employeeId)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid transparent',
                    background: selectedEmployee === employee.employeeId ? 'rgba(99,102,241,0.08)' : 'transparent',
                    borderColor: selectedEmployee === employee.employeeId ? 'rgba(99,102,241,0.2)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedEmployee !== employee.employeeId) {
                      e.currentTarget.style.background = 'var(--card)';
                      e.currentTarget.style.borderColor = 'var(--line)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedEmployee !== employee.employeeId) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <div>
                    <div style={{
                      fontWeight: 600,
                      color: 'var(--ink)',
                      fontSize: 13,
                    }}>
                      {employee.traineeName || employee.employeeId}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                    }}>
                      {employee.employeeId} · {employee.branch || '—'}
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'right',
                  }}>
                    <div style={{
                      fontWeight: 700,
                      color: num(employee.gapCount) > 0 ? '#ef4444' : '#22c55e',
                      fontSize: 16,
                    }}>
                      {num(employee.gapCount)}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: 'var(--muted)',
                    }}>
                      gaps
                    </div>
                  </div>
                </button>
              ))}
              {!employees.length && (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: 'var(--muted)',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                    Search for employees
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    Enter name, ID, email or mobile
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employee Profile */}
          <div style={{
            background: 'var(--card-solid)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            overflow: 'hidden',
          }}>
            {saving === 'profile' ? (
              <div style={{
                display: 'grid',
                placeItems: 'center',
                minHeight: 400,
                gap: 12,
              }}>
                <div className="spinner" style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '3px solid var(--line)',
                  borderTopColor: '#6366f1',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>Recalculating evidence…</p>
                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : !snapshot ? (
              <div style={{
                display: 'grid',
                placeItems: 'center',
                minHeight: 400,
                textAlign: 'center',
                padding: '20px',
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
                  Select an Employee
                </div>
                <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4, maxWidth: 320 }}>
                  The full competency profile, requirements, evidence, and learning paths will appear here.
                </div>
              </div>
            ) : (
              <div style={{
                padding: '16px 20px',
              }}>
                {/* Employee Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  <div>
                    <div style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      fontFamily: 'monospace',
                    }}>
                      {snapshot.trainee?.employeeId} · {snapshot.trainee?.branch}
                    </div>
                    <h3 style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: 'var(--ink)',
                      margin: '4px 0 2px',
                    }}>
                      {snapshot.trainee?.traineeName || snapshot.trainee?.employeeId}
                    </h3>
                    <p style={{
                      fontSize: 13,
                      color: 'var(--muted)',
                      margin: 0,
                    }}>
                      {snapshot.trainee?.process || '—'} / {snapshot.trainee?.lob || '—'} · {snapshot.trainee?.batchNo || 'No batch'}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 14px',
                    borderRadius: '99px',
                    background: num(snapshot.summary?.gapCount || 0) > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                    color: num(snapshot.summary?.gapCount || 0) > 0 ? '#ef4444' : '#22c55e',
                    fontSize: 13,
                    fontWeight: 700,
                  }}>
                    {snapshot.summary?.gapCount || 0} gaps
                  </span>
                </div>

                {/* KPIs */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: 10,
                  marginBottom: 16,
                }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Skills</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
                      {snapshot.summary?.totalSkills || 0}
                    </div>
                  </div>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Ready</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>
                      {snapshot.summary?.readyCount || 0}
                    </div>
                  </div>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Critical Gaps</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>
                      {snapshot.summary?.criticalGaps || 0}
                    </div>
                  </div>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Assigned Paths</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>
                      {snapshot.summary?.assignedPaths || 0}
                    </div>
                  </div>
                </div>

                {/* Skill Profiles */}
                <h4 style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: '0 0 10px',
                }}>
                  🎯 Skill Profiles
                </h4>
                <div style={{
                  display: 'grid',
                  gap: 6,
                  marginBottom: 16,
                }}>
                  {(snapshot.profiles || []).map(profile => (
                    <div key={profile.skillId} style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: profile.status === 'GAP' ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)',
                      border: `1px solid ${profile.status === 'GAP' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}>
                      <div>
                        <div style={{
                          fontWeight: 600,
                          color: 'var(--ink)',
                          fontSize: 13,
                        }}>
                          {profile.skillName}
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                        }}>
                          {profile.category} · {profile.source}
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'right',
                      }}>
                        <div style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: profile.status === 'GAP' ? '#ef4444' : '#22c55e',
                        }}>
                          {num(profile.currentLevel)} / {num(profile.targetLevel)}
                        </div>
                        <StatusBadge status={profile.status} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Evidence Ledger */}
                <h4 style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: '0 0 10px',
                }}>
                  📋 Recent Evidence
                </h4>
                <div style={{
                  display: 'grid',
                  gap: 6,
                }}>
                  {(snapshot.evidence || []).slice(0, 12).map(item => (
                    <div key={item.id} style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--card)',
                      border: '1px solid var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                      <EvidenceTypeBadge type={item.evidenceType} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 500,
                          color: 'var(--ink)',
                          fontSize: 13,
                        }}>
                          {item.skillName}
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                          fontFamily: 'monospace',
                        }}>
                          {item.referenceId} · {date(item.evidenceAt)}
                        </div>
                      </div>
                      <div style={{
                        fontWeight: 700,
                        color: '#6366f1',
                        fontSize: 14,
                      }}>
                        L{num(item.levelAwarded)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Verification Form */}
          {snapshot && (
            <form
              onSubmit={verifySkill}
              style={{
                background: 'var(--card-solid)',
                borderRadius: '16px',
                border: '1px solid var(--line)',
                padding: '20px',
                position: 'sticky',
                top: 20,
              }}
            >
              <div style={{
                marginBottom: 16,
              }}>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: 0,
                }}>
                  🔍 Expert Verification
                </h3>
                <p style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  margin: '2px 0 0',
                }}>
                  Manual verification overrides derived evidence until it expires.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gap: 14,
              }}>
                <div>
                  <label style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--muted)',
                    display: 'block',
                    marginBottom: 4,
                  }}>
                    Skill <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    required
                    value={verifyForm.skillId}
                    onChange={event => {
                      const profile = snapshot.profiles?.find(item => item.skillId === event.target.value);
                      setVerifyForm(form => ({
                        ...form,
                        skillId: event.target.value,
                        currentLevel: profile?.currentLevel || 1,
                        targetLevel: profile?.targetLevel || 1,
                      }));
                    }}
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
                    <option value="">Select skill</option>
                    {catalog.skills.map(skill => (
                      <option key={skill.skillId} value={skill.skillId}>
                        {skill.skillName}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}>
                  <div>
                    <label style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--muted)',
                      display: 'block',
                      marginBottom: 4,
                    }}>
                      Verified Level
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={verifyForm.currentLevel}
                      onChange={event => setVerifyForm(form => ({ ...form, currentLevel: event.target.value }))}
                      style={{
                        width: '100%',
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
                  </div>
                  <div>
                    <label style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--muted)',
                      display: 'block',
                      marginBottom: 4,
                    }}>
                      Target Level
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={verifyForm.targetLevel}
                      onChange={event => setVerifyForm(form => ({ ...form, targetLevel: event.target.value }))}
                      style={{
                        width: '100%',
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
                  </div>
                </div>

                <div>
                  <label style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--muted)',
                    display: 'block',
                    marginBottom: 4,
                  }}>
                    Confidence Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={verifyForm.confidenceScore}
                    onChange={event => setVerifyForm(form => ({ ...form, confidenceScore: event.target.value }))}
                    style={{
                      width: '100%',
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
                </div>

                <div>
                  <label style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--muted)',
                    display: 'block',
                    marginBottom: 4,
                  }}>
                    Verification Expiry
                  </label>
                  <input
                    type="date"
                    value={verifyForm.expiresAt}
                    onChange={event => setVerifyForm(form => ({ ...form, expiresAt: event.target.value }))}
                    style={{
                      width: '100%',
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
                </div>

                <div>
                  <label style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--muted)',
                    display: 'block',
                    marginBottom: 4,
                  }}>
                    Evidence Notes <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    required
                    rows="4"
                    value={verifyForm.notes}
                    onChange={event => setVerifyForm(form => ({ ...form, notes: event.target.value }))}
                    placeholder="Observed task, calibration, practical demonstration, reviewer context…"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: 13,
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                  />
                </div>

                <button
                  className="btn"
                  disabled={saving === 'verify'}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginTop: 4,
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
                  {saving === 'verify' ? '⏳ Saving...' : '📝 Record Verification'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}