// src/pages/Admin/OrgTab.jsx
import { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';

// ========== HRMS MAPPING COMPONENT ==========
function HrmsMapping({ onToast }) {
  const [status, setStatus] = useState(null);
  const [detected, setDetected] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState('');

  async function load() {
    setLoading(true);
    const [s, d, c] = await Promise.all([
      api.get('/admin/hrms/status', 'admin'),
      api.get('/admin/hrms/detect', 'admin'),
      api.get('/admin/hrms/config', 'admin'),
    ]);
    if (s.ok) setStatus(s.data);
    if (d.ok) setDetected(d.data || []);
    if (c.ok) setConfig(c.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function getEntityConfig(entity) {
    return config?.[entity] || { table: '', cols: {} };
  }

  function setEntityTable(entity, table) {
    const detectedTable = detected.find(d => d.table === table);
    const guess = detectedTable?.guess;
    const newConfig = { ...config };
    newConfig[entity] = { table, cols: guess?.cols || {} };
    setConfig(newConfig);
  }

  function setEntityCol(entity, target, source) {
    const newConfig = { ...config };
    if (!newConfig[entity]) newConfig[entity] = { table: '', cols: {} };
    newConfig[entity].cols = { ...newConfig[entity].cols, [target]: source };
    setConfig(newConfig);
  }

  async function saveConfig() {
    if (!config) return;
    const res = await api.put('/admin/hrms/config', { mapping: config }, 'admin');
    if (res.ok) onToast('HRMS mapping config saved.', true);
    else onToast(res.message || 'Failed to save config.', false);
  }

  async function doSync(entity) {
    const endpoint = { branch: 'branches', department: 'departments', designation: 'designations', processlob: 'processlob', employee: 'employees' }[entity];
    setSyncing(entity);
    const res = await api.post(`/admin/hrms/sync/${endpoint}`, {}, 'admin');
    setSyncing('');
    if (res.ok) onToast(`${entity}: ${res.message}`, true);
    else onToast(res.message || `Failed to sync ${entity}.`, false);
  }

  async function dryRunEmployees() {
    setSyncing('employee-dry');
    const res = await api.post('/admin/hrms/sync/employees?dryRun=1', { dryRun: true, limit: 50 }, 'admin');
    setSyncing('');
    if (res.ok) {
      const summary = res.summary || {};
      onToast(`Employee dry run: ${summary.wouldCreate || 0} would be created, ${summary.existing || 0} already exist, ${summary.skipped || 0} skipped.`, true);
    } else {
      onToast(res.message || 'Employee dry run failed.', false);
    }
  }

  const entities = [
    { key: 'branch', label: 'Branch', icon: '🌿', cols: [{ key: 'name', label: 'Name' }, { key: 'code', label: 'Code' }, { key: 'city', label: 'City' }, { key: 'state', label: 'State' }, { key: 'active', label: 'Active' }] },
    { key: 'department', label: 'Department', icon: '🏬', cols: [{ key: 'name', label: 'Name' }, { key: 'active', label: 'Active' }] },
    { key: 'designation', label: 'Designation', icon: '🎯', cols: [{ key: 'title', label: 'Title' }, { key: 'active', label: 'Active' }] },
    { key: 'processlob', label: 'Process & LOB', icon: '📊', cols: [{ key: 'process', label: 'Process' }, { key: 'lob', label: 'LOB' }, { key: 'active', label: 'Active' }] },
    { key: 'employee', label: 'Employee Provisioning', icon: '👥', cols: [
      { key: 'employeeId', label: 'Employee ID' }, { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' },
      { key: 'mobile', label: 'Mobile' }, { key: 'branch', label: 'Branch' }, { key: 'process', label: 'Process' },
      { key: 'lob', label: 'LOB' }, { key: 'designation', label: 'Designation' }, { key: 'department', label: 'Department' },
      { key: 'doj', label: 'DOJ' }, { key: 'active', label: 'Active' }
    ] },
  ];

  const statusIcon = status?.reachable ? '✅' : '❌';

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 12,
      border: '1px solid #e8edf4',
      padding: '20px 24px',
      marginTop: 20,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>🔄 HRMS Sync Configuration</h4>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Map external HRMS tables to system fields</p>
        </div>
        <button
          style={{ ...styles.btn, ...styles.btnSecondary, padding: '6px 16px', fontSize: 13 }}
          onClick={load}
          disabled={loading}
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        padding: '10px 16px',
        background: status?.reachable ? '#f0fdf4' : '#fef2f2',
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 14,
        border: `1px solid ${status?.reachable ? '#bbf7d0' : '#fecaca'}`,
      }}>
        <span style={{ fontSize: 18 }}>{statusIcon}</span>
        <span><b style={{ fontSize: 14 }}>mas_hrms</b>: <span style={{ fontSize: 14 }}>{status?.reachable ? `Connected (${status.tables} tables)` : status?.message || 'Checking...'}</span></span>
      </div>

      {status?.tablesList?.length > 0 && (
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>
          Available tables: {status.tablesList.join(', ')}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {entities.map(entity => {
          const ecfg = getEntityConfig(entity.key);
          const tableCols = detected.find(d => d.table === ecfg.table)?.columns || [];
          return (
            <div key={entity.key} style={{
              padding: '14px 16px',
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #f1f5f9',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                  {entity.icon} {entity.label}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {entity.key === 'employee' && (
                    <button
                      style={{ ...styles.btn, ...styles.btnSecondary, padding: '4px 12px', fontSize: 12 }}
                      disabled={syncing === 'employee-dry'}
                      onClick={dryRunEmployees}
                    >
                      {syncing === 'employee-dry' ? '⏳' : '🔍 Dry Run'}
                    </button>
                  )}
                  <button
                    style={{ ...styles.btn, ...styles.btnPrimary, padding: '4px 14px', fontSize: 12 }}
                    disabled={syncing === entity.key}
                    onClick={() => doSync(entity.key)}
                  >
                    {syncing === entity.key ? '⏳' : '🔄 Sync'}
                  </button>
                </div>
              </div>
              <select
                style={styles.input}
                value={ecfg.table}
                onChange={e => setEntityTable(entity.key, e.target.value)}
              >
                <option value="">(select table)</option>
                {(detected.length ? detected : (status?.tablesList || []).map(t => ({ table: t, columns: [] }))).map(d => (
                  <option key={d.table} value={d.table}>{d.table}</option>
                ))}
              </select>
              {ecfg.table && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 6, marginTop: 8 }}>
                  {entity.cols.map(col => (
                    <div key={col.key}>
                      <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 2 }}>
                        {col.label}
                      </label>
                      <select
                        style={{ ...styles.input, fontSize: 12 }}
                        value={ecfg.cols?.[col.key] || ''}
                        onChange={e => setEntityCol(entity.key, col.key, e.target.value)}
                      >
                        <option value="">{col.key}</option>
                        {tableCols.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button style={{ ...styles.btn, ...styles.btnPrimary, padding: '8px 24px', fontSize: 14 }} onClick={saveConfig}>
          💾 Save Mapping
        </button>
      </div>
    </div>
  );
}

// ========== MASTER TABLE COMPONENT ==========
function MasterTable({ title, icon, items, columns, onAdd, onEdit, onDelete }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 12,
      border: '1px solid #e8edf4',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{icon} {title}</span>
          <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>{items.length} entries</span>
        </div>
        <button
          style={{ ...styles.btn, ...styles.btnPrimary, padding: '6px 16px', fontSize: 13 }}
          onClick={onAdd}
        >
          ➕ Add
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: 14 }}>No entries yet</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#fafbfc' }}>
                {columns.map(c => (
                  <th key={c.key} style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: 12,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    {c.label}
                  </th>
                ))}
                <th style={{ padding: '10px 16px', width: 90, borderBottom: '1px solid #f1f5f9' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i === items.length - 1 ? 'none' : '1px solid #f8fafc' }}>
                  {columns.map(c => (
                    <td key={c.key} style={{ padding: '10px 16px', color: '#0f172a', fontSize: 14 }}>
                      {c.key === 'active' ? (
                        <span style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '2px 12px',
                          borderRadius: 12,
                          background: item.active ? '#ecfdf5' : '#fef2f2',
                          color: item.active ? '#16a34a' : '#dc2626',
                        }}>
                          {item.active ? 'Active' : 'Inactive'}
                        </span>
                      ) : (item[c.key] || '—')}
                    </td>
                  ))}
                  <td style={{ padding: '8px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        style={{ ...styles.btn, ...styles.btnSecondary, padding: '4px 10px', fontSize: 12 }}
                        onClick={() => onEdit(item)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        style={{ ...styles.btn, ...styles.btnDanger, padding: '4px 10px', fontSize: 12 }}
                        onClick={() => onDelete(item)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ========== FIELD MODAL ==========
function FieldModal({ title, fields, initial, onClose, onSave, loading }) {
  const [form, setForm] = useState(initial || {});

  return (
    <div style={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <b style={styles.modalTitle}>{title}</b>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={styles.modalBody}>
          <form onSubmit={e => { e.preventDefault(); onSave(form); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fields.map(f => (
              <div key={f.key}>
                <label style={styles.fieldLabel}>{f.label}{f.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                {f.type === 'checkbox' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.checked }))}
                      style={{ accentColor: '#6366f1', width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 14, color: '#0f172a' }}>{f.checkLabel || 'Active'}</span>
                  </label>
                ) : (
                  <input
                    style={styles.input}
                    placeholder={f.placeholder || ''}
                    value={form[f.key] || ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required={f.required}
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              style={{ ...styles.btn, ...styles.btnPrimary, padding: '10px', fontSize: 14, marginTop: 6 }}
              disabled={loading}
            >
              {loading ? '⏳ Saving...' : '💾 Save'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ========== CERTIFICATION RULES COMPONENT ==========
function CertRulesSection({ onToast }) {
  const [rules, setRules] = useState([]);
  const [processList, setProcessList] = useState([]);
  const [lobList, setLobList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    process: '', lob: '', courseCompletionMin: 80, mcqPassPctMin: 60,
    attendancePctMin: 70, mockCallRequired: false, mockCallPassPct: 60,
    internalCertRequired: false, internalCertPassPct: 60,
    externalCertRequired: false, externalCertPassPct: 60
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { loadRules(); loadProcessLob(); }, []);

  async function loadRules() {
    const res = await api.get('/admin/cert-rules', 'admin');
    if (res.ok) setRules(res.data);
  }

  async function loadProcessLob() {
    const res = await api.get('/admin/process-lob', 'admin');
    if (res.ok) {
      const uniqProcess = [...new Set(res.data.map(p => p.process))].sort();
      setProcessList(uniqProcess);
      setLobList(res.data);
    }
  }

  function lobsForProcess(proc) {
    return lobList.filter(p => p.process === proc).map(p => p.lob);
  }

  function openAdd() {
    setEditId(null);
    setForm({
      process: '', lob: '', courseCompletionMin: 80, mcqPassPctMin: 60,
      attendancePctMin: 70, mockCallRequired: false, mockCallPassPct: 60,
      internalCertRequired: false, internalCertPassPct: 60,
      externalCertRequired: false, externalCertPassPct: 60
    });
    setShowForm(true);
  }

  function openEdit(r) {
    setEditId(r.id);
    setForm({
      process: r.process, lob: r.lob, courseCompletionMin: r.courseCompletionMin,
      mcqPassPctMin: r.mcqPassPctMin, attendancePctMin: r.attendancePctMin,
      mockCallRequired: r.mockCallRequired, mockCallPassPct: r.mockCallPassPct,
      internalCertRequired: r.internalCertRequired, internalCertPassPct: r.internalCertPassPct,
      externalCertRequired: r.externalCertRequired, externalCertPassPct: r.externalCertPassPct,
    });
    setShowForm(true);
  }

  async function saveRule(e) {
    e.preventDefault();
    setSaving(true);
    let res;
    if (editId) {
      res = await api.put(`/admin/cert-rules/${editId}`, form, 'admin');
    } else {
      res = await api.post('/admin/cert-rules', form, 'admin');
    }
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setEditId(null);
      onToast('✅ Rule saved successfully.', true);
      loadRules();
    } else {
      onToast(res.message || 'Failed to save.', false);
    }
  }

  async function deleteRule(id) {
    const res = await api.delete(`/admin/cert-rules/${id}`, 'admin');
    setConfirmDelete(null);
    if (res.ok) {
      onToast('✅ Rule deleted.', true);
      loadRules();
    } else {
      onToast(res.message || 'Failed to delete.', false);
    }
  }

  function stepsRequired(r) {
    const steps = [];
    if (r.mockCallRequired) steps.push('Mock Call');
    if (r.internalCertRequired) steps.push('Internal Cert');
    if (r.externalCertRequired) steps.push('External Cert');
    return steps.length ? steps.join(', ') : '—';
  }

  const toggle = (k) => setForm(p => ({ ...p, [k]: !p[k] }));
  const num = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 12,
      border: '1px solid #e8edf4',
      padding: '20px 24px',
      marginTop: 20,
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
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>📋 Certification Rules</h4>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Per Process/LOB certification eligibility criteria</p>
        </div>
        <button style={{ ...styles.btn, ...styles.btnPrimary, padding: '6px 16px', fontSize: 13 }} onClick={openAdd}>
          ➕ Add Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: 14, background: '#f8fafc', borderRadius: 8 }}>
          No rules configured. Default: Course 80% | MCQ 60% | Attendance 70%
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#fafbfc' }}>
                <th style={styles.thSmall}>Process</th>
                <th style={styles.thSmall}>LOB</th>
                <th style={styles.thSmall}>Course</th>
                <th style={styles.thSmall}>MCQ</th>
                <th style={styles.thSmall}>Attendance</th>
                <th style={styles.thSmall}>Steps Required</th>
                <th style={{ ...styles.thSmall, width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={styles.tdSmall}><b>{r.process}</b></td>
                  <td style={styles.tdSmall}>{r.lob}</td>
                  <td style={styles.tdSmall}>{r.courseCompletionMin}%</td>
                  <td style={styles.tdSmall}>{r.mcqPassPctMin}%</td>
                  <td style={styles.tdSmall}>{r.attendancePctMin}%</td>
                  <td style={{ ...styles.tdSmall, fontSize: 13 }}>{stepsRequired(r)}</td>
                  <td style={styles.tdSmall}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        style={{ ...styles.btn, ...styles.btnSecondary, padding: '4px 10px', fontSize: 12 }}
                        onClick={() => openEdit(r)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        style={{ ...styles.btn, ...styles.btnDanger, padding: '4px 10px', fontSize: 12 }}
                        onClick={() => setConfirmDelete(r.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cert Rule Modal */}
      {showForm && (
        <div style={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ ...styles.modalBox, maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <b style={styles.modalTitle}>{editId ? '✏️ Edit Cert Rule' : '➕ Add Cert Rule'}</b>
              <button style={styles.modalClose} onClick={() => { setShowForm(false); setEditId(null); }}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <form onSubmit={saveRule}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={styles.fieldLabel}>Process *</label>
                    <select
                      style={styles.input}
                      value={form.process}
                      onChange={e => setForm(p => ({ ...p, process: e.target.value, lob: '' }))}
                    >
                      <option value="">Select Process</option>
                      {processList.map(pr => <option key={pr} value={pr}>{pr}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>LOB *</label>
                    <select
                      style={styles.input}
                      value={form.lob}
                      onChange={e => setForm(p => ({ ...p, lob: e.target.value }))}
                    >
                      <option value="">Select LOB</option>
                      {lobsForProcess(form.process).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Min Course %</label>
                    <input style={styles.input} type="number" max="100" value={form.courseCompletionMin} onChange={e => num('courseCompletionMin', e.target.value)} />
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Min MCQ Pass %</label>
                    <input style={styles.input} type="number" max="100" value={form.mcqPassPctMin} onChange={e => num('mcqPassPctMin', e.target.value)} />
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Min Attendance %</label>
                    <input style={styles.input} type="number" max="100" value={form.attendancePctMin} onChange={e => num('attendancePctMin', e.target.value)} />
                  </div>
                </div>

                {[
                  ['mockCallRequired', 'mockCallPassPct', 'Mock Call'],
                  ['internalCertRequired', 'internalCertPassPct', 'Internal Cert'],
                  ['externalCertRequired', 'externalCertPassPct', 'External Cert']
                ].map(([req, pctKey, label]) => (
                  <div key={req} style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      <input type="checkbox" checked={form[req]} onChange={() => toggle(req)} style={{ accentColor: '#6366f1', width: 18, height: 18 }} />
                      {label} Required
                    </label>
                    {form[req] && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>Pass %:</span>
                        <input style={{ ...styles.input, width: 80 }} type="number" max="100" value={form[pctKey]} onChange={e => num(pctKey, e.target.value)} />
                      </div>
                    )}
                  </div>
                ))}

                <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary, padding: '10px', fontSize: 14, marginTop: 14, width: '100%' }} disabled={saving}>
                  {saving ? '⏳ Saving...' : '💾 Save Rule'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div style={styles.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div style={{ ...styles.modalBox, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <b style={styles.modalTitle}>🗑️ Confirm Delete</b>
              <button style={styles.modalClose} onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <p style={{ fontSize: 14, color: '#0f172a' }}>Are you sure you want to delete this certification rule? This cannot be undone.</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                <button style={{ ...styles.btn, ...styles.btnDanger, flex: 1, padding: '8px' }} onClick={() => deleteRule(confirmDelete)}>
                  🗑️ Delete Rule
                </button>
                <button style={{ ...styles.btn, ...styles.btnSecondary, flex: 1, padding: '8px' }} onClick={() => setConfirmDelete(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function OrgTab() {
  const [activeTab, setActiveTab] = useState('masters');
  const [branches, setBranches] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });

  function toast(text, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 5000);
  }

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [b, d, dep] = await Promise.all([
      api.get('/admin/org/branches', 'admin'),
      api.get('/admin/org/designations', 'admin'),
      api.get('/admin/org/departments', 'admin'),
    ]);
    if (b.ok) setBranches(b.data);
    if (d.ok) setDesignations(d.data);
    if (dep.ok) setDepartments(dep.data);
  }

  async function handleSave(form) {
    if (!modal) return;
    const { type, item } = modal;
    const endpoint = {
      branch: '/admin/org/branches',
      designation: '/admin/org/designations',
      department: '/admin/org/departments',
    }[type];

    setSaving(true);
    let res;
    if (item?.id) {
      res = await api.put(`${endpoint}/${item.id}`, form, 'admin');
    } else {
      res = await api.post(endpoint, form, 'admin');
    }
    setSaving(false);
    if (res.ok) {
      toast(item?.id ? '✅ Updated.' : '✅ Created.');
      setModal(null);
      loadAll();
    } else {
      toast(res.message || '❌ Failed.', false);
    }
  }

  async function handleDelete(type, item) {
    const label = item.branchName || item.title || item.name;
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    const endpoint = {
      branch: '/admin/org/branches',
      designation: '/admin/org/designations',
      department: '/admin/org/departments',
    }[type];
    const res = await api.delete(`${endpoint}/${item.id}`, 'admin');
    if (res.ok) { toast('✅ Deleted.'); loadAll(); }
    else toast(res.message || '❌ Failed.', false);
  }

  const branchFields = [
    { key: 'branchName', label: 'Branch Name', required: true, placeholder: 'e.g. Bangalore' },
    { key: 'branchCode', label: 'Branch Code', placeholder: 'e.g. BLR' },
    { key: 'city', label: 'City', placeholder: 'e.g. Bangalore' },
    { key: 'state', label: 'State', placeholder: 'e.g. Karnataka' },
    { key: 'active', label: 'Status', type: 'checkbox', checkLabel: 'Active' },
  ];
  const designationFields = [
    { key: 'title', label: 'Designation Title', required: true, placeholder: 'e.g. Training Coordinator' },
    { key: 'department', label: 'Department', placeholder: 'e.g. Training & Development' },
    { key: 'active', label: 'Status', type: 'checkbox', checkLabel: 'Active' },
  ];
  const departmentFields = [
    { key: 'name', label: 'Department Name', required: true, placeholder: 'e.g. Training & Development' },
    { key: 'active', label: 'Status', type: 'checkbox', checkLabel: 'Active' },
  ];

  const getInitial = (type, item) => {
    if (!item) return { active: true };
    return { ...item };
  };

  const getFields = type => ({ branch: branchFields, designation: designationFields, department: departmentFields }[type]);
  const getTitle = (type, editing) => {
    const labels = { branch: 'Branch', designation: 'Designation', department: 'Department' };
    return `${editing ? '✏️ Edit' : '➕ Add'} ${labels[type]}`;
  };

  return (
    <div style={{
      padding: '8px 0 20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* ===== HEADER ===== */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#0f172a',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          🏢 Organization
        </h2>
        <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
          Manage organization structure, certification rules, and HRMS integration
        </p>
      </div>

      {/* ===== TOAST ===== */}
      {msg.text && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 8,
          marginBottom: 14,
          border: `1px solid ${msg.ok ? '#86efac' : '#fecaca'}`,
          background: msg.ok ? '#f0fdf4' : '#fef2f2',
          color: msg.ok ? '#16a34a' : '#dc2626',
          fontSize: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {msg.text}
          <button
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'inherit' }}
            onClick={() => setMsg({ text: '', ok: true })}
          >
            ✕
          </button>
        </div>
      )}

      {/* ===== TABS ===== */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 18,
        background: '#ffffff',
        borderRadius: 12,
        padding: 4,
        border: '1px solid #e8edf4',
      }}>
        <button
          style={{
            flex: 1,
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'masters' ? '#6366f1' : 'transparent',
            color: activeTab === 'masters' ? '#fff' : '#64748b',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setActiveTab('masters')}
        >
          🏛️ Masters
        </button>
        <button
          style={{
            flex: 1,
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'rules' ? '#6366f1' : 'transparent',
            color: activeTab === 'rules' ? '#fff' : '#64748b',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setActiveTab('rules')}
        >
          📋 Certification Rules
        </button>
      </div>

      {/* ===== MASTERS TAB ===== */}
      {activeTab === 'masters' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <MasterTable
              title="Branches"
              icon="🌿"
              items={branches}
              columns={[
                { key: 'branchName', label: 'Branch Name' },
                { key: 'branchCode', label: 'Code' },
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'active', label: 'Status' },
              ]}
              onAdd={() => setModal({ type: 'branch', item: null })}
              onEdit={item => setModal({ type: 'branch', item })}
              onDelete={item => handleDelete('branch', item)}
            />

            <MasterTable
              title="Designations"
              icon="🎯"
              items={designations}
              columns={[
                { key: 'title', label: 'Designation' },
                { key: 'department', label: 'Department' },
                { key: 'active', label: 'Status' },
              ]}
              onAdd={() => setModal({ type: 'designation', item: null })}
              onEdit={item => setModal({ type: 'designation', item })}
              onDelete={item => handleDelete('designation', item)}
            />

            <MasterTable
              title="Departments"
              icon="🏬"
              items={departments}
              columns={[
                { key: 'name', label: 'Department Name' },
                { key: 'active', label: 'Status' },
              ]}
              onAdd={() => setModal({ type: 'department', item: null })}
              onEdit={item => setModal({ type: 'department', item })}
              onDelete={item => handleDelete('department', item)}
            />
          </div>

          {/* HRMS Sync */}
          <HrmsMapping onToast={toast} />
        </div>
      )}

      {/* ===== CERTIFICATION RULES TAB ===== */}
      {activeTab === 'rules' && (
        <CertRulesSection onToast={toast} />
      )}

      {/* ===== MODAL ===== */}
      {modal && (
        <FieldModal
          title={getTitle(modal.type, !!modal.item?.id)}
          fields={getFields(modal.type)}
          initial={getInitial(modal.type, modal.item)}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={saving}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input:focus, select:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 2px rgba(99,102,241,0.08);
        }
        button:hover {
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}

// ========== STYLES ==========
const styles = {
  input: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #e8edf4',
    background: '#fafbfc',
    fontSize: 14,
    color: '#0f172a',
    outline: 'none',
    width: '100%',
    transition: 'all 0.15s',
    boxSizing: 'border-box',
  },
  btn: {
    padding: '6px 16px',
    borderRadius: 6,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  btnPrimary: {
    background: '#6366f1',
    color: '#fff',
  },
  btnSecondary: {
    background: '#f8fafc',
    color: '#475569',
    border: '1px solid #e8edf4',
  },
  btnDanger: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.4)',
    backdropFilter: 'blur(3px)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modalBox: {
    background: '#ffffff',
    borderRadius: 14,
    maxWidth: 480,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  modalHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid #f1f5f9',
    position: 'sticky',
    top: 0,
    background: '#fff',
    borderRadius: '14px 14px 0 0',
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
    background: '#f8fafc',
    fontSize: 16,
    cursor: 'pointer',
    color: '#64748b',
    display: 'grid',
    placeItems: 'center',
  },
  modalBody: {
    padding: '18px 22px 22px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
    marginBottom: 4,
  },
  thSmall: {
    padding: '8px 14px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    borderBottom: '1px solid #f1f5f9',
  },
  tdSmall: {
    padding: '8px 14px',
    color: '#0f172a',
    fontSize: 14,
  },
};