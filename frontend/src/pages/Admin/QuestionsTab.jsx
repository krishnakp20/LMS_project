import { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';

const CSV_TEMPLATE = 'question,option_a,option_b,option_c,option_d,correct,marks,difficulty,explanation\nWhat does KYC stand for?,Know Your Customer,Keep Your Cash,Know Your Compliance,Key Year Check,A,1,Easy,KYC = Know Your Customer\n';

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  row.push(cell.trim());
  if (row.some(value => value !== '')) rows.push(row);
  return rows;
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

function StatusBadge({ status }) {
  const isLinked = status === 'linked';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 10px',
      borderRadius: '99px',
      background: isLinked ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
      color: isLinked ? '#22c55e' : '#f59e0b',
      fontSize: 11,
      fontWeight: 600,
    }}>
      {isLinked ? '✅' : '⚠️'} {isLinked ? 'Linked' : 'Not Linked'}
    </span>
  );
}

function DifficultyBadge({ difficulty }) {
  const colors = {
    Easy: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    Medium: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    Hard: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  };
  const config = colors[difficulty] || colors.Medium;
  
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '99px',
      background: config.bg,
      color: config.color,
      fontSize: 11,
      fontWeight: 600,
    }}>
      {difficulty}
    </span>
  );
}

export default function QuestionsTab() {
  const [assessments, setAssessments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [classroomModules, setClassroomModules] = useState([]);
  const [aForm, setAForm] = useState({ classroomId: '', dayNo: '', moduleId: '', assessmentName: '', passingPct: 60, attemptLimit: 3, timeLimitMins: 30, instructions: '' });
  const [bulkJson, setBulkJson] = useState('');
  const [bulkMode, setBulkMode] = useState('csv');
  const [csvFile, setCsvFile] = useState(null);
  const [csvDragging, setCsvDragging] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null);
  const [msg, setMsg] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [aSearch, setASearch] = useState({ name: '', classroomId: '' });

  useEffect(() => {
    api.get('/admin/assessments', 'admin').then(r => r.ok && setAssessments(r.data));
    api.get('/admin/classrooms', 'admin').then(r => r.ok && setClassrooms(r.data));
  }, []);

  useEffect(() => {
    if (aForm.classroomId) {
      api.get(`/admin/classrooms/${aForm.classroomId}/modules`, 'admin').then(r => {
        if (r.ok) setClassroomModules(r.data || []);
      });
    } else {
      setClassroomModules([]);
      setAForm(f => ({ ...f, moduleId: '' }));
    }
  }, [aForm.classroomId]);

  useEffect(() => {
    if (selected) api.get(`/admin/assessments/${selected.assessmentId}/questions`, 'admin').then(r => r.ok && setQuestions(r.data));
  }, [selected]);

  async function createAssessment(e) {
    e.preventDefault();
    const res = await api.post('/admin/assessments', aForm, 'admin');
    if (res.ok) { setShowCreate(false); setMsg('Assessment created.'); refreshAssessments(); }
    else setMsg(res.message || 'Failed.');
  }

  async function deleteAssessmentConfirmed(assessmentId) {
    const token = localStorage.getItem('lms_token_admin') || '';
    const BASE = (import.meta.env.VITE_API_URL || '') + '/api';
    const r = await fetch(`${BASE}/admin/assessments/${assessmentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ confirm: 'DELETE' }),
    }).then(x => x.json()).catch(() => ({ ok: false, message: 'Network error' }));
    if (r.ok) {
      setDeleteModal(null);
      setSelected(null);
      setQuestions([]);
      setMsg(r.message || 'Assessment deleted.');
      api.get('/admin/assessments', 'admin').then(res => res.ok && setAssessments(res.data));
    } else {
      setDeleteModal(prev => ({ ...prev, error: r.message }));
    }
  }

  async function uploadBulk() {
    try {
      const questions = JSON.parse(bulkJson);
      const res = await api.post(`/admin/assessments/${selected.assessmentId}/questions/upload`, { questions }, 'admin');
      if (res.ok) { setMsg(res.message); setBulkJson(''); setShowBulk(false); api.get(`/admin/assessments/${selected.assessmentId}/questions`, 'admin').then(r => r.ok && setQuestions(r.data)); refreshAssessments(); }
      else setMsg(res.message || 'Failed.');
    } catch {
      setMsg('Invalid JSON format.');
    }
  }

  function refreshAssessments() {
    api.get('/admin/assessments', 'admin').then(r => r.ok && setAssessments(r.data));
  }

  async function deleteQuestion(questionId) {
    if (!window.confirm('Deactivate this question?')) return;
    await api.delete(`/admin/questions/${questionId}`, 'admin');
    api.get(`/admin/assessments/${selected.assessmentId}/questions`, 'admin').then(r => r.ok && setQuestions(r.data));
    refreshAssessments();
  }

  async function saveEditedQuestion(form) {
    setSavingEdit(true);
    const res = await api.put(`/admin/questions/${editModal.questionId}`, form, 'admin');
    setSavingEdit(false);
    if (res.ok) {
      setEditModal(null);
      setMsg('Question updated.');
      api.get(`/admin/assessments/${selected.assessmentId}/questions`, 'admin').then(r => r.ok && setQuestions(r.data));
    } else {
      setMsg(res.message || 'Failed to update question.');
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'MCQ_Template.csv';
    a.click();
  }

  function handleCsvFile(file) {
    if (!file) return;
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const parsedRows = parseCsvRows(text);
      if (parsedRows.length < 2) return;
      const header = parsedRows[0].map(h => h.trim().replace(/"/g, ''));
      const rows = parsedRows.slice(1, 6).map(vals => {
        const row = {};
        header.forEach((h, i) => { row[h] = vals[i] || ''; });
        return row;
      });
      setCsvPreview({ header, rows, total: parsedRows.length - 1 });
    };
    reader.readAsText(file);
  }

  async function uploadCsv() {
    if (!csvFile || !selected) return;
    const text = await csvFile.text();
    const res = await api.post(`/admin/assessments/${selected.assessmentId}/questions/upload-csv`, { csv: text }, 'admin');
    if (res.ok) {
      setMsg(`Uploaded ${res.count} questions${res.errors?.length ? `, ${res.errors.length} errors` : ''}.`);
      setCsvFile(null); setCsvPreview(null); setShowBulk(false);
      api.get(`/admin/assessments/${selected.assessmentId}/questions`, 'admin').then(r => r.ok && setQuestions(r.data));
      refreshAssessments();
    } else setMsg(res.message || 'Upload failed.');
  }

  const totalAssessments = assessments.length;
  const totalQuestions = assessments.reduce((sum, a) => sum + (a._count?.questions || 0), 0);
  const linkedAssessments = assessments.filter(a => a.moduleId).length;

  return (
    <div style={{
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
            <span style={{ fontSize: 24, lineHeight: 1 }}>📝</span>
            <h1 style={{
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--ink)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              Questions & MCQ
            </h1>
          </div>
          <p style={{
            fontSize: 14,
            color: 'var(--muted)',
            margin: '4px 0 0',
            maxWidth: 600,
          }}>
            Create assessments, manage questions, and track learner performance.
          </p>
        </div>
        <button
          className="btn"
          onClick={() => setShowCreate(!showCreate)}
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
            display: 'flex',
            alignItems: 'center',
            gap: 6,
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
          ✨ New Assessment
        </button>
      </div>

      {/* Toast Messages */}
      {msg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: 16,
          background: msg.startsWith('Uploaded') || msg.startsWith('Assessment') || msg.startsWith('Question') 
            ? 'rgba(34,197,94,0.1)' 
            : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.startsWith('Uploaded') || msg.startsWith('Assessment') || msg.startsWith('Question') 
            ? 'rgba(34,197,94,0.2)' 
            : 'rgba(239,68,68,0.2)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: 13,
            color: msg.startsWith('Uploaded') || msg.startsWith('Assessment') || msg.startsWith('Question') 
              ? '#22c55e' 
              : '#ef4444',
          }}>
            {msg.startsWith('Uploaded') || msg.startsWith('Assessment') || msg.startsWith('Question') ? '✅' : '❌'} {msg}
          </span>
          <button
            onClick={() => setMsg('')}
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
        <StatCard label="Total Assessments" value={totalAssessments} icon="📋" color="rgba(99,102,241,0.1)" />
        <StatCard label="Total Questions" value={totalQuestions} icon="❓" color="rgba(245,158,11,0.1)" />
        <StatCard label="Linked to Modules" value={linkedAssessments} icon="🔗" color="rgba(34,197,94,0.1)" />
        <StatCard label="Unlinked" value={totalAssessments - linkedAssessments} icon="⚠️" color="rgba(239,68,68,0.1)" />
      </div>

      {/* Create Assessment Form */}
      {showCreate && (
        <form onSubmit={createAssessment} style={{
          background: 'var(--card-solid)',
          borderRadius: '16px',
          border: '1px solid var(--line)',
          padding: '24px',
          marginBottom: 20,
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--ink)',
            margin: '0 0 16px',
          }}>
            ✨ Create Assessment
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
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
                Assessment Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                className="input"
                required
                value={aForm.assessmentName}
                onChange={e => setAForm(f => ({ ...f, assessmentName: e.target.value }))}
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
                Classroom <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="input"
                required
                value={aForm.classroomId}
                onChange={e => setAForm(f => ({ ...f, classroomId: e.target.value, moduleId: '' }))}
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
                <option value="">-- Select Classroom --</option>
                {classrooms.map(c => (
                  <option key={c.classroomId} value={c.classroomId}>
                    {c.classroomName}
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
                Link to Module <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(shows in learner view)</span>
              </label>
              <select
                className="input"
                value={aForm.moduleId}
                onChange={e => setAForm(f => ({ ...f, moduleId: e.target.value }))}
                disabled={!aForm.classroomId}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  fontSize: 13,
                  outline: 'none',
                  opacity: !aForm.classroomId ? 0.6 : 1,
                }}
              >
                <option value="">-- No module link --</option>
                {classroomModules.map(m => (
                  <option key={m.moduleId} value={m.moduleId}>
                    Day {m.dayNo} · {m.moduleTitle}
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
                Passing % <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                required
                value={aForm.passingPct}
                onChange={e => setAForm(f => ({ ...f, passingPct: Number(e.target.value) }))}
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
                Attempt Limit
              </label>
              <input
                className="input"
                type="number"
                min="1"
                value={aForm.attemptLimit}
                onChange={e => setAForm(f => ({ ...f, attemptLimit: Number(e.target.value) }))}
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
                Time Limit (mins)
              </label>
              <input
                className="input"
                type="number"
                value={aForm.timeLimitMins}
                onChange={e => setAForm(f => ({ ...f, timeLimitMins: Number(e.target.value) }))}
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
          <div style={{
            display: 'flex',
            gap: 8,
            marginTop: 16,
          }}>
            <button
              type="submit"
              className="btn"
              style={{
                padding: '8px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Create Assessment
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowCreate(false)}
              style={{
                padding: '8px 24px',
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
          </div>
        </form>
      )}

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: 20,
        alignItems: 'start',
      }}>
        {/* Left Panel - Assessments List */}
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
            <div style={{
              fontWeight: 700,
              fontSize: 13,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              📋 Assessments
            </div>
          </div>

          {/* Search */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--line)',
          }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <input
                className="input"
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                placeholder="🔍 Search by name..."
                value={aSearch.name}
                onChange={e => setASearch(p => ({ ...p, name: e.target.value }))}
                onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
              />
              <select
                className="select"
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
                value={aSearch.classroomId}
                onChange={e => setASearch(p => ({ ...p, classroomId: e.target.value }))}
              >
                <option value="">All classrooms</option>
                {classrooms.map(c => (
                  <option key={c.classroomId} value={c.classroomId}>
                    {c.classroomName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assessment List */}
          <div style={{
            maxHeight: 500,
            overflowY: 'auto',
            padding: '8px',
          }}>
            {(() => {
              const filteredA = assessments.filter(a => {
                const q = aSearch.name.toLowerCase();
                const cid = aSearch.classroomId;
                return (!q || a.assessmentName.toLowerCase().includes(q)) &&
                       (!cid || a.classroomId === cid);
              });
              return filteredA.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: 'var(--muted)',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                    {assessments.length === 0 ? 'No assessments yet.' : 'No match found.'}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {assessments.length === 0 ? 'Create your first assessment.' : 'Try different filters.'}
                  </div>
                </div>
              ) : (
                filteredA.map(a => (
                  <div key={a.assessmentId} style={{ marginBottom: 4 }}>
                    <div
                      onClick={() => { setSelected(a); setShowBulk(false); setMsg(''); }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: selected?.assessmentId === a.assessmentId ? 'rgba(99,102,241,0.08)' : 'var(--card)',
                        border: `1px solid ${selected?.assessmentId === a.assessmentId ? 'rgba(99,102,241,0.3)' : 'var(--line)'}`,
                        fontSize: 13,
                        fontWeight: selected?.assessmentId === a.assessmentId ? 700 : 500,
                        color: selected?.assessmentId === a.assessmentId ? '#6366f1' : 'var(--ink)',
                        transition: 'all 0.15s',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (selected?.assessmentId !== a.assessmentId) {
                          e.currentTarget.style.background = 'var(--card)';
                          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selected?.assessmentId !== a.assessmentId) {
                          e.currentTarget.style.background = 'var(--card)';
                          e.currentTarget.style.borderColor = 'var(--line)';
                        }
                      }}
                    >
                      <div style={{ paddingRight: 24 }}>
                        {a.assessmentName}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 4,
                        flexWrap: 'wrap',
                      }}>
                        <StatusBadge status={a.moduleId ? 'linked' : 'unlinked'} />
                        <span style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                        }}>
                          {a._count?.questions || 0} questions
                        </span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteModal({ assessment: a, step: 1, error: '' }); }}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: 'none',
                          border: 'none',
                          color: 'rgba(239,68,68,0.4)',
                          cursor: 'pointer',
                          fontSize: 14,
                          padding: '2px 4px',
                          borderRadius: 4,
                          lineHeight: 1,
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239,68,68,0.4)'}
                        title="Delete assessment"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              );
            })()}
          </div>
        </div>

        {/* Right Panel - Questions */}
        <div>
          {!selected && (
            <div style={{
              display: 'grid',
              placeItems: 'center',
              minHeight: 400,
              textAlign: 'center',
              padding: '20px',
              background: 'var(--card-solid)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
                Select an Assessment
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
                Choose an assessment from the left panel to view questions.
              </div>
            </div>
          )}

          {selected && (
            <div style={{
              background: 'var(--card-solid)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              overflow: 'hidden',
            }}>
              {/* Assessment Header */}
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
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: 'var(--ink)',
                    }}>
                      {selected.assessmentName}
                    </span>
                    <StatusBadge status={selected.moduleId ? 'linked' : 'unlinked'} />
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: 'var(--muted)',
                    marginTop: 4,
                  }}>
                    {questions.length} questions · Passing: {selected.passingPct}% · {selected.attemptLimit} attempts
                    {selected.moduleId
                      ? <span style={{ color: '#22c55e', marginLeft: 8 }}>✓ Linked to module</span>
                      : <span style={{ color: '#f59e0b', marginLeft: 8 }}>⚠ Not linked — learners won't see this</span>
                    }
                  </div>
                </div>
                <button
                  className="btn"
                  onClick={() => { setShowBulk(!showBulk); setMsg(''); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {showBulk ? '⬆ Hide' : '📤 Bulk Upload'}
                </button>
              </div>

              {/* Link to Module Panel */}
              {!selected.moduleId && selected.classroomId && (
                <LinkToModulePanel 
                  assessmentId={selected.assessmentId} 
                  classroomId={selected.classroomId} 
                  onLinked={a => { 
                    setSelected(a); 
                    api.get('/admin/assessments', 'admin').then(r => r.ok && setAssessments(r.data)); 
                  }} 
                />
              )}

              {/* Bulk Upload */}
              {showBulk && (
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid var(--line)',
                  background: 'var(--card)',
                }}>
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 16,
                  }}>
                    <button
                      className={`itab${bulkMode === 'csv' ? ' active' : ''}`}
                      onClick={() => setBulkMode('csv')}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        border: bulkMode === 'csv' ? '2px solid #6366f1' : '1px solid var(--line)',
                        background: bulkMode === 'csv' ? 'rgba(99,102,241,0.1)' : 'transparent',
                        color: bulkMode === 'csv' ? '#6366f1' : 'var(--muted)',
                        fontWeight: bulkMode === 'csv' ? 600 : 400,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      📄 CSV Upload
                    </button>
                    <button
                      className={`itab${bulkMode === 'json' ? ' active' : ''}`}
                      onClick={() => setBulkMode('json')}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        border: bulkMode === 'json' ? '2px solid #6366f1' : '1px solid var(--line)',
                        background: bulkMode === 'json' ? 'rgba(99,102,241,0.1)' : 'transparent',
                        color: bulkMode === 'json' ? '#6366f1' : 'var(--muted)',
                        fontWeight: bulkMode === 'json' ? 600 : 400,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      📝 JSON Paste
                    </button>
                  </div>

                  {bulkMode === 'csv' && (
                    <div>
                      <button
                        className="btn-dark"
                        style={{
                          padding: '6px 16px',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                          background: 'var(--card-solid)',
                          color: 'var(--ink)',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 500,
                          transition: 'all 0.15s',
                          marginBottom: 14,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                          e.currentTarget.style.borderColor = '#6366f140';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--card-solid)';
                          e.currentTarget.style.borderColor = 'var(--line)';
                        }}
                        onClick={downloadTemplate}
                      >
                        ⬇ Download CSV Template
                      </button>
                      <div
                        onDragOver={e => { e.preventDefault(); setCsvDragging(true); }}
                        onDragLeave={() => setCsvDragging(false)}
                        onDrop={e => { e.preventDefault(); setCsvDragging(false); handleCsvFile(e.dataTransfer.files[0]); }}
                        style={{
                          border: `2px dashed ${csvDragging ? '#6366f1' : 'var(--line)'}`,
                          borderRadius: '12px',
                          padding: '32px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          background: csvDragging ? 'rgba(99,102,241,0.06)' : 'transparent',
                        }}
                        onClick={() => document.getElementById('csv-file-input').click()}
                      >
                        <input 
                          id="csv-file-input" 
                          type="file" 
                          accept=".csv" 
                          style={{ display: 'none' }} 
                          onChange={e => handleCsvFile(e.target.files[0])} 
                        />
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                          Drop CSV file here or click to browse
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                          Format: question, option_a, option_b, option_c, option_d, correct, marks, difficulty, explanation
                        </div>
                      </div>
                      {csvPreview && (
                        <div style={{ marginTop: 14 }}>
                          <div style={{
                            fontSize: 12,
                            color: 'var(--muted)',
                            marginBottom: 8,
                          }}>
                            Preview ({csvPreview.total} questions total, showing first {csvPreview.rows.length}):
                          </div>
                          <div style={{
                            overflowX: 'auto',
                            border: '1px solid var(--line)',
                            borderRadius: '8px',
                          }}>
                            <table style={{
                              width: '100%',
                              fontSize: 12,
                              borderCollapse: 'collapse',
                            }}>
                              <thead>
                                <tr style={{
                                  background: 'var(--card)',
                                  borderBottom: '1px solid var(--line)',
                                }}>
                                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Question</th>
                                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Option A</th>
                                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Option B</th>
                                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Correct</th>
                                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Marks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {csvPreview.rows.map((r, i) => (
                                  <tr key={i} style={{
                                    borderBottom: i < csvPreview.rows.length - 1 ? '1px solid var(--line)' : 'none',
                                  }}>
                                    <td style={{ padding: '6px 10px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {r.question}
                                    </td>
                                    <td style={{ padding: '6px 10px' }}>{r.option_a}</td>
                                    <td style={{ padding: '6px 10px' }}>{r.option_b}</td>
                                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.correct}</td>
                                    <td style={{ padding: '6px 10px' }}>{r.marks}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div style={{
                            marginTop: 12,
                            display: 'flex',
                            gap: 10,
                          }}>
                            <button
                              className="btn-dark primary"
                              onClick={uploadCsv}
                              style={{
                                padding: '8px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: '#fff',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              Upload {csvPreview.total} Questions
                            </button>
                            <button
                              className="btn-dark"
                              onClick={() => { setCsvFile(null); setCsvPreview(null); }}
                              style={{
                                padding: '8px 20px',
                                borderRadius: '8px',
                                border: '1px solid var(--line)',
                                background: 'var(--card-solid)',
                                color: 'var(--ink)',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 500,
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--card)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--card-solid)';
                              }}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {bulkMode === 'json' && (
                    <div>
                      <textarea
                        value={bulkJson}
                        onChange={e => setBulkJson(e.target.value)}
                        rows={10}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                          background: 'var(--card)',
                          color: 'var(--ink)',
                          fontSize: 12,
                          fontFamily: 'monospace',
                          outline: 'none',
                          resize: 'vertical',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                        placeholder={JSON.stringify([
                          {
                            questionText: 'What does KYC stand for?',
                            optionA: 'Know Your Customer',
                            optionB: 'Keep Your Cash',
                            optionC: 'Know Your Compliance',
                            optionD: 'Key Year Check',
                            correctOption: 'A',
                            marks: 1,
                            difficulty: 'Easy',
                            explanation: 'KYC = Know Your Customer.'
                          }
                        ], null, 2)}
                      />
                      <div style={{
                        marginTop: 8,
                        display: 'flex',
                        gap: 8,
                      }}>
                        <button
                          className="btn-dark primary"
                          onClick={uploadBulk}
                          style={{
                            padding: '8px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          Upload JSON
                        </button>
                        <button
                          className="btn-dark"
                          onClick={() => { setShowBulk(false); setBulkJson(''); }}
                          style={{
                            padding: '8px 20px',
                            borderRadius: '8px',
                            border: '1px solid var(--line)',
                            background: 'var(--card-solid)',
                            color: 'var(--ink)',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 500,
                            transition: 'all 0.15s',
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
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Questions Table */}
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
                        Question
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
                        Correct
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
                        Marks
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
                        Difficulty
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map(q => (
                      <tr key={q.questionId} style={{
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
                          maxWidth: 300,
                        }}>
                          <div style={{
                            fontWeight: 500,
                            color: 'var(--ink)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {q.questionText}
                          </div>
                          {q.explanation && (
                            <div style={{
                              fontSize: 11,
                              color: 'var(--muted)',
                              marginTop: 2,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              💡 {q.explanation}
                            </div>
                          )}
                        </td>
                        <td style={{
                          padding: '10px 14px',
                          textAlign: 'center',
                        }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: '99px',
                            background: 'rgba(34,197,94,0.12)',
                            color: '#22c55e',
                            fontSize: 12,
                            fontWeight: 700,
                          }}>
                            {q.correctOption}
                          </span>
                        </td>
                        <td style={{
                          padding: '10px 14px',
                          textAlign: 'center',
                          color: 'var(--ink)',
                        }}>
                          {q.marks}
                        </td>
                        <td style={{
                          padding: '10px 14px',
                          textAlign: 'center',
                        }}>
                          <DifficultyBadge difficulty={q.difficulty} />
                        </td>
                        <td style={{
                          padding: '10px 14px',
                          textAlign: 'center',
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: 4,
                            justifyContent: 'center',
                          }}>
                            <button
                              className="btn small secondary"
                              onClick={() => setEditModal(q)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--line)',
                                background: 'var(--card-solid)',
                                color: 'var(--ink)',
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 500,
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
                              ✏️ Edit
                            </button>
                            <button
                              className="btn small danger"
                              onClick={() => deleteQuestion(q.questionId)}
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
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {questions.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{
                          textAlign: 'center',
                          color: 'var(--muted)',
                          padding: '48px 20px',
                        }}>
                          <div style={{ fontSize: 48, marginBottom: 12 }}>❓</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                            No questions yet
                          </div>
                          <div style={{ fontSize: 13, marginTop: 4 }}>
                            Use Bulk Upload to add questions to this assessment.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Assessment Modal */}
      {deleteModal && (
        <DeleteAssessmentModal
          assessment={deleteModal.assessment}
          error={deleteModal.error}
          onCancel={() => setDeleteModal(null)}
          onConfirm={() => deleteAssessmentConfirmed(deleteModal.assessment.assessmentId)}
        />
      )}

      {/* Edit Question Modal */}
      {editModal && (
        <EditQuestionModal
          question={editModal}
          saving={savingEdit}
          onClose={() => setEditModal(null)}
          onSave={saveEditedQuestion}
        />
      )}
    </div>
  );
}

function EditQuestionModal({ question, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    questionText: question.questionText || '',
    optionA: question.optionA || '',
    optionB: question.optionB || '',
    optionC: question.optionC || '',
    optionD: question.optionD || '',
    correctOption: question.correctOption || 'A',
    marks: question.marks || 1,
    difficulty: question.difficulty || 'Easy',
    explanation: question.explanation || '',
  });

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
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
      <div
        className="modal-box"
        style={{
          background: 'var(--card-solid)',
          borderRadius: '20px',
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        }}
      >
        <div className="modal-head" style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <b style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--ink)',
          }}>
            ✏️ Edit Question
          </b>
          <button
            className="btn small secondary"
            onClick={onClose}
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
        <div className="modal-body" style={{ padding: '20px' }}>
          <form onSubmit={e => { e.preventDefault(); onSave(form); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--muted)',
                display: 'block',
                marginBottom: 4,
              }}>
                Question Text <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="input"
                rows={3}
                value={form.questionText}
                onChange={e => setForm(p => ({ ...p, questionText: e.target.value }))}
                required
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
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
              />
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
                  Option A <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  className="input"
                  value={form.optionA}
                  onChange={e => setForm(p => ({ ...p, optionA: e.target.value }))}
                  required
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
                  Option B <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  className="input"
                  value={form.optionB}
                  onChange={e => setForm(p => ({ ...p, optionB: e.target.value }))}
                  required
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
                  Option C
                </label>
                <input
                  className="input"
                  value={form.optionC}
                  onChange={e => setForm(p => ({ ...p, optionC: e.target.value }))}
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
                  Option D
                </label>
                <input
                  className="input"
                  value={form.optionD}
                  onChange={e => setForm(p => ({ ...p, optionD: e.target.value }))}
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

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
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
                  Correct <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="select"
                  value={form.correctOption}
                  onChange={e => setForm(p => ({ ...p, correctOption: e.target.value }))}
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
                  {['A', 'B', 'C', 'D'].map(o => (
                    <option key={o} value={o}>{o}</option>
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
                  Marks
                </label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.marks}
                  onChange={e => setForm(p => ({ ...p, marks: Number(e.target.value) }))}
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
                  Difficulty
                </label>
                <select
                  className="select"
                  value={form.difficulty}
                  onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
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
                  {['Easy', 'Medium', 'Hard'].map(d => (
                    <option key={d} value={d}>{d}</option>
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
                  Explanation
                </label>
                <input
                  className="input"
                  value={form.explanation}
                  onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
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

            <div style={{
              display: 'flex',
              gap: 8,
              marginTop: 4,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
            }}>
              <button
                className="btn"
                type="submit"
                disabled={saving}
                style={{
                  padding: '8px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
              <button
                className="btn secondary"
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 24px',
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function DeleteAssessmentModal({ assessment, error, onCancel, onConfirm }) {
  const [step, setStep] = useState(1);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  async function handle() {
    if (confirm !== 'DELETE') return;
    setBusy(true);
    await onConfirm();
    setBusy(false);
  }

  return (
    <div
      className="modal-overlay"
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
      <div
        className="modal-box"
        style={{
          background: 'var(--card-solid)',
          borderRadius: '20px',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        }}
      >
        <div className="modal-head" style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <b style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#ef4444',
          }}>
            🗑 Delete Assessment
          </b>
          <button
            className="btn small secondary"
            onClick={onCancel}
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
        <div className="modal-body" style={{ padding: '20px' }}>
          {step === 1 && (
            <div>
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                marginBottom: 18,
              }}>
                <div style={{
                  fontWeight: 700,
                  color: '#ef4444',
                  marginBottom: 6,
                }}>
                  ⚠ This action cannot be undone.
                </div>
                <div style={{
                  fontSize: 13,
                  color: 'var(--ink)',
                  lineHeight: 1.6,
                }}>
                  Deleting <b>{assessment.assessmentName}</b> will permanently remove:
                  <ul style={{
                    margin: '8px 0 0 16px',
                    padding: 0,
                    fontSize: 12,
                  }}>
                    <li>All {assessment._count?.questions || 0} questions</li>
                    <li>All learner attempt history and scores</li>
                    <li>The module link (learners won't see it anymore)</li>
                  </ul>
                </div>
              </div>
              <div style={{
                display: 'flex',
                gap: 10,
              }}>
                <button
                  className="btn secondary"
                  style={{ flex: 1 }}
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <button
                  style={{
                    flex: 1,
                    background: 'rgba(239,68,68,0.85)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.95)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.85)';
                  }}
                  onClick={() => setStep(2)}
                >
                  Proceed
                </button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <div style={{
                fontSize: 13,
                color: 'var(--ink)',
                marginBottom: 14,
              }}>
                Type <b>DELETE</b> to permanently delete <b>{assessment.assessmentName}</b>.
              </div>
              <div>
                <input
                  className="input"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value.toUpperCase())}
                  placeholder="DELETE"
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
              {error && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444',
                  fontSize: 13,
                  marginTop: 10,
                }}>
                  ❌ {error}
                </div>
              )}
              <div style={{
                display: 'flex',
                gap: 10,
                marginTop: 14,
              }}>
                <button
                  className="btn secondary"
                  style={{ flex: 1 }}
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <button
                  style={{
                    flex: 1,
                    background: confirm === 'DELETE' ? 'rgba(239,68,68,0.85)' : 'rgba(150,150,150,0.3)',
                    color: confirm === 'DELETE' ? '#fff' : 'var(--muted)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontWeight: 700,
                    cursor: confirm === 'DELETE' ? 'pointer' : 'not-allowed',
                    fontSize: 13,
                    transition: 'all 0.15s',
                  }}
                  onClick={handle}
                  disabled={busy || confirm !== 'DELETE'}
                >
                  {busy ? '⏳ Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkToModulePanel({ assessmentId, classroomId, onLinked }) {
  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState('');
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show && classroomId) {
      api.get(`/admin/classrooms/${classroomId}/modules`, 'admin').then(r => r.ok && setModules(r.data || []));
    }
  }, [show, classroomId]);

  async function link() {
    if (!moduleId) return;
    setSaving(true);
    const res = await api.put(`/admin/assessments/${assessmentId}`, { moduleId }, 'admin');
    setSaving(false);
    if (res.ok) onLinked(res.data);
  }

  if (!show) {
    return (
      <div style={{
        padding: '12px 16px',
        margin: '12px 16px',
        borderRadius: '10px',
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.2)',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <span style={{ color: '#f59e0b' }}>
          ⚠️ This assessment is not linked to any module — learners cannot see it.
        </span>
        <button
          className="btn small"
          onClick={() => setShow(true)}
          style={{
            padding: '4px 16px',
            borderRadius: '6px',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Link Now
        </button>
      </div>
    );
  }

  return (
    <div style={{
      margin: '12px 16px',
      padding: '14px 16px',
      borderRadius: '10px',
      background: 'var(--card)',
      border: '1px solid var(--line)',
    }}>
      <b style={{ fontSize: 13, color: 'var(--ink)' }}>🔗 Link to Module</b>
      <div style={{
        display: 'flex',
        gap: 10,
        marginTop: 10,
        alignItems: 'flex-end',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--muted)',
            marginBottom: 4,
          }}>
            Select Module
          </label>
          <select
            className="input"
            value={moduleId}
            onChange={e => setModuleId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--card-solid)',
              color: 'var(--ink)',
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="">-- Select module --</option>
            {modules.map(m => (
              <option key={m.moduleId} value={m.moduleId}>
                Day {m.dayNo} · {m.moduleTitle}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn small"
          onClick={link}
          disabled={!moduleId || saving}
          style={{
            padding: '8px 20px',
            borderRadius: '6px',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            cursor: !moduleId || saving ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            opacity: !moduleId || saving ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
        >
          {saving ? '⏳ Saving...' : 'Link'}
        </button>
        <button
          className="btn small secondary"
          onClick={() => setShow(false)}
          style={{
            padding: '8px 20px',
            borderRadius: '6px',
            border: '1px solid var(--line)',
            background: 'var(--card-solid)',
            color: 'var(--ink)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.15s',
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
      </div>
    </div>
  );
}