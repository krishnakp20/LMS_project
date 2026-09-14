// src/pages/Admin/SystemHealthTab.jsx
import { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';

// ========== PROCESS LOB COMPONENT ==========
function ProcessLobSection({ onToast }) {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ process: '', lob: '', active: true, notes: '' });
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const r = await api.get('/admin/process-lob', 'admin');
    setLoading(false);
    if (r.ok) setList(r.data);
  }

  const processes = [...new Set(list.map(l => l.process))].sort();
  const selectedLobs = selected ? list.filter(l => l.process === selected) : [];

  async function save() {
    if (!form.process) return setMsg('Process name required');
    setLoading(true);
    const r = editId
      ? await api.put(`/admin/process-lob/${editId}`, form, 'admin')
      : await api.post('/admin/process-lob', form, 'admin');
    setLoading(false);
    if (r.ok) {
      setShowModal(false);
      setForm({ process: '', lob: '', active: true, notes: '' });
      setEditId(null);
      await load();
      setMsg('');
      onToast('✅ Process/LOB saved successfully.', true);
    } else {
      setMsg(r.message || 'Failed');
      onToast(r.message || 'Failed to save.', false);
    }
  }

  async function deactivate(id) {
    if (!window.confirm('Deactivate this entry?')) return;
    const r = await api.delete(`/admin/process-lob/${id}`, 'admin');
    if (r.ok) {
      await load();
      onToast('✅ Entry deactivated.', true);
    }
  }

  function openEdit(item) {
    setForm({ process: item.process, lob: item.lob || '', active: item.active, notes: item.notes || '' });
    setEditId(item.id);
    setShowModal(true);
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>⚙️ Process & LOB</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Manage processes and their associated LOBs</p>
        </div>
        <button
          style={{ ...styles.btn, ...styles.btnPrimary, padding: '6px 16px', fontSize: 13 }}
          onClick={() => { setForm({ process: selected || '', lob: '', active: true, notes: '' }); setEditId(null); setShowModal(true); }}
        >
          ➕ Add
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
          ⏳ Loading...
        </div>
      )}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          {/* Left - Processes */}
          <div style={{
            background: '#ffffff',
            borderRadius: 10,
            border: '1px solid #e8edf4',
            padding: '14px 16px',
            maxHeight: 400,
            overflowY: 'auto',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              Processes
            </div>
            {processes.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No processes yet.</p>
            )}
            {processes.map(p => {
              const lobCount = list.filter(l => l.process === p).length;
              const activeCount = list.filter(l => l.process === p && l.active).length;
              const isSelected = selected === p;
              return (
                <div
                  key={p}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    marginBottom: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    border: `1.5px solid ${isSelected ? '#6366f1' : 'transparent'}`,
                    background: isSelected ? 'rgba(99,102,241,0.08)' : '#f8fafc',
                  }}
                  onClick={() => setSelected(p)}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? '#6366f1' : '#0f172a' }}>{p}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{lobCount} LOB{lobCount !== 1 ? 's' : ''} · {activeCount} active</div>
                </div>
              );
            })}
          </div>

          {/* Right - LOBs */}
          <div style={{
            background: '#ffffff',
            borderRadius: 10,
            border: '1px solid #e8edf4',
            padding: '14px 16px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                {selected ? `LOBs under "${selected}"` : 'Select a process'}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{selectedLobs.length} entries</span>
            </div>

            {!selected && (
              <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
                Click a process on the left to view its LOBs.
              </p>
            )}
            {selected && selectedLobs.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
                No LOBs for this process.
              </p>
            )}
            {selectedLobs.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>LOB</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Notes</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLobs.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, fontSize: 13 }}>{item.lob || '(no LOB)'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 10px',
                            borderRadius: 10,
                            background: item.active ? '#ecfdf5' : '#fef2f2',
                            color: item.active ? '#16a34a' : '#dc2626',
                          }}>
                            {item.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 12 }}>{item.notes || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              style={{ ...styles.btn, ...styles.btnSecondary, padding: '3px 10px', fontSize: 11 }}
                              onClick={() => openEdit(item)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              style={{ ...styles.btn, ...styles.btnDanger, padding: '3px 10px', fontSize: 11 }}
                              onClick={() => deactivate(item.id)}
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
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={{ ...styles.modalBox, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <b style={styles.modalTitle}>{editId ? '✏️ Edit Entry' : '➕ Add Process / LOB'}</b>
              <button style={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {msg && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  marginBottom: 12,
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  fontSize: 13,
                }}>{msg}</div>
              )}
              {[
                ['Process Name', 'process'],
                ['LOB Name', 'lob'],
                ['Notes', 'notes']
              ].map(([label, key]) => (
                <div key={key} style={{ marginBottom: 10 }}>
                  <label style={styles.fieldLabel}>{label}</label>
                  <input
                    style={styles.input}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                margin: '10px 0 16px',
                fontSize: 13,
                color: '#0f172a',
              }}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  style={{ accentColor: '#6366f1', width: 18, height: 18 }}
                />
                Active
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ ...styles.btn, ...styles.btnPrimary, flex: 1, padding: '8px' }} onClick={save}>💾 Save</button>
                <button style={{ ...styles.btn, ...styles.btnSecondary, padding: '8px 16px' }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== SYSTEM HEALTH COMPONENT ==========
function SystemHealthSection({ onToast }) {
  const [diagnostics, setDiagnostics] = useState(null);
  const [diagMsg, setDiagMsg] = useState('');
  const [diagLoading, setDiagLoading] = useState(false);
  const [batchNo, setBatchNo] = useState('');
  const [recon, setRecon] = useState(null);
  const [reconMsg, setReconMsg] = useState('');
  const [reconLoading, setReconLoading] = useState(false);

  function BoolPill({ value }) {
    return (
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 10px',
        borderRadius: 10,
        background: value ? '#ecfdf5' : '#fef2f2',
        color: value ? '#16a34a' : '#dc2626',
      }}>
        {value ? '✅ OK' : '❌ Missing'}
      </span>
    );
  }

  function StatusPill({ ok }) {
    return (
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 10px',
        borderRadius: 10,
        background: ok ? '#ecfdf5' : '#fef2f2',
        color: ok ? '#16a34a' : '#dc2626',
      }}>
        {ok ? '✅ Healthy' : '❌ Issue'}
      </span>
    );
  }

  async function loadDiagnostics() {
    setDiagLoading(true);
    setDiagMsg('');
    const res = await api.get('/admin/diagnostics', 'admin');
    setDiagLoading(false);
    if (!res.ok) {
      setDiagMsg(res.message || 'Unable to load diagnostics.');
      return;
    }
    setDiagnostics(res.data);
  }

  async function runReconciliation() {
    setReconLoading(true);
    setReconMsg('');
    const body = batchNo.trim() ? { batchNo: batchNo.trim() } : {};
    const res = await api.post('/admin/reconcile/batch-counters', body, 'admin');
    setReconLoading(false);
    if (!res.ok) {
      setReconMsg(res.message || 'Unable to reconcile batch counters.');
      return;
    }
    setRecon(res);
    onToast('✅ Batch reconciliation completed.', true);
  }

  const env = diagnostics?.environment || {};
  const storage = diagnostics?.storage || {};
  const tables = diagnostics?.tables || {};
  const tableRows = Object.entries(tables);

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>🩺 System Health</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Check LMS deployment health and repair batch counters</p>
        </div>
        <button
          style={{ ...styles.btn, ...styles.btnPrimary, padding: '6px 16px', fontSize: 13 }}
          onClick={loadDiagnostics}
          disabled={diagLoading}
        >
          {diagLoading ? '⏳ Checking...' : '🔄 Run Health Check'}
        </button>
      </div>

      {diagMsg && (
        <div style={{
          padding: '8px 12px',
          borderRadius: 6,
          marginBottom: 12,
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca',
          fontSize: 13,
        }}>{diagMsg}</div>
      )}

      {diagnostics && (
        <>
          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 14,
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: 10,
              border: '1px solid #e8edf4',
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Overall</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}><StatusPill ok={diagnostics.ok} /></div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{diagnostics.durationMs || 0} ms</div>
            </div>
            <div style={{
              background: '#ffffff',
              borderRadius: 10,
              border: '1px solid #e8edf4',
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Database</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}><StatusPill ok={diagnostics.database?.ok} /></div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Connectivity check</div>
            </div>
            <div style={{
              background: '#ffffff',
              borderRadius: 10,
              border: '1px solid #e8edf4',
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Uploads</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}><StatusPill ok={storage.uploadsWritable} /></div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Writable storage</div>
            </div>
            <div style={{
              background: '#ffffff',
              borderRadius: 10,
              border: '1px solid #e8edf4',
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Frontend Build</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}><BoolPill value={storage.frontendDistExists} /></div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>dist folder</div>
            </div>
          </div>

          {/* Environment Flags */}
          <div style={{
            background: '#ffffff',
            borderRadius: 10,
            border: '1px solid #e8edf4',
            padding: '14px 16px',
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>🔧 Environment Flags</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 8,
            }}>
              {[
                ['Database URL', env.databaseUrlConfigured],
                ['Session Secret', env.sessionSecretConfigured],
                ['Frontend URL', env.frontendUrlConfigured],
                ['API URL', env.apiUrlConfigured],
                ['Drive Service Account', env.driveServiceAccountConfigured],
                ['Drive OAuth', env.driveOAuthConfigured],
                ['SMTP / Summary Email', env.smtpConfigured],
                ['Serve Frontend', env.serveFrontend],
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: '#f8fafc',
                  borderRadius: 6,
                  fontSize: 12,
                }}>
                  <span style={{ color: '#475569' }}>{label}</span>
                  <BoolPill value={!!value} />
                </div>
              ))}
            </div>
          </div>

          {/* Table Counts */}
          <div style={{
            background: '#ffffff',
            borderRadius: 10,
            border: '1px solid #e8edf4',
            padding: '14px 16px',
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>📊 Key Table Counts</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Table / Model</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Rows</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(([model, info]) => (
                    <tr key={model} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 500 }}>{model}</td>
                      <td style={{ padding: '6px 10px' }}><StatusPill ok={info.ok} /></td>
                      <td style={{ padding: '6px 10px' }}>{info.count ?? '—'}</td>
                      <td style={{ padding: '6px 10px', color: '#94a3b8', fontSize: 12 }}>{info.message || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Batch Reconciliation */}
      <div style={{
        background: '#ffffff',
        borderRadius: 10,
        border: '1px solid #e8edf4',
        padding: '14px 16px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>🔄 Batch Counter Reconciliation</div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
              Repairs total trainees, OJT ready, certified, and OPS handover counts using trainee records.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={{ ...styles.input, width: 180 }}
              placeholder="Optional Batch No"
              value={batchNo}
              onChange={e => setBatchNo(e.target.value)}
            />
            <button
              style={{ ...styles.btn, ...styles.btnPrimary, padding: '6px 16px', fontSize: 13 }}
              onClick={runReconciliation}
              disabled={reconLoading}
            >
              {reconLoading ? '⏳ Running...' : '🔄 Run Reconcile'}
            </button>
          </div>
        </div>

        {reconMsg && (
          <div style={{
            padding: '8px 12px',
            borderRadius: 6,
            marginTop: 10,
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            fontSize: 13,
          }}>{reconMsg}</div>
        )}

        {recon && (
          <div style={{ marginTop: 12 }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: '#ecfdf5',
              color: '#16a34a',
              border: '1px solid #bbf7d0',
              fontSize: 13,
            }}>
              ✅ Checked {recon.summary?.totalBatches || 0} batch(es); corrected {recon.summary?.changedCount || 0}.
            </div>
            <div style={{ overflowX: 'auto', marginTop: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Batch</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Total</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Certified</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Handover</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>OJT Ready</th>
                  </tr>
                </thead>
                <tbody>
                  {(recon.results || []).slice(0, 50).map(row => (
                    <tr key={row.batchNo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 10px' }}>
                        <b>{row.batchNo}</b>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.batchName}</div>
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 10px',
                          borderRadius: 10,
                          background: row.changed ? '#fef3c7' : '#ecfdf5',
                          color: row.changed ? '#d97706' : '#16a34a',
                        }}>
                          {row.changed ? '🔄 Corrected' : '✅ No Change'}
                        </span>
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <span style={{ textDecoration: row.changed ? 'line-through' : 'none', color: '#94a3b8' }}>
                          {row.before.totalTrainees}
                        </span>
                        {row.changed && <span style={{ fontWeight: 600 }}> → {row.after.totalTrainees}</span>}
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <span style={{ textDecoration: row.changed ? 'line-through' : 'none', color: '#94a3b8' }}>
                          {row.before.certified}
                        </span>
                        {row.changed && <span style={{ fontWeight: 600 }}> → {row.after.certified}</span>}
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <span style={{ textDecoration: row.changed ? 'line-through' : 'none', color: '#94a3b8' }}>
                          {row.before.handoverToOps}
                        </span>
                        {row.changed && <span style={{ fontWeight: 600 }}> → {row.after.handoverToOps}</span>}
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <span style={{ textDecoration: row.changed ? 'line-through' : 'none', color: '#94a3b8' }}>
                          {row.before.ojtReady}
                        </span>
                        {row.changed && <span style={{ fontWeight: 600 }}> → {row.after.ojtReady}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function SystemHealthTab() {
  const [activeTab, setActiveTab] = useState('health');
  const [msg, setMsg] = useState({ text: '', ok: true });

  function toast(text, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 5000);
  }

  return (
    <div style={{
      padding: '8px 0 20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* ===== HEADER ===== */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#0f172a',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          🛠️ System Management
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
          System health monitoring, batch reconciliation, and process/LOB management
        </p>
      </div>

      {/* ===== TOAST ===== */}
      {msg.text && (
        <div style={{
          padding: '8px 14px',
          borderRadius: 6,
          marginBottom: 12,
          border: `1px solid ${msg.ok ? '#86efac' : '#fecaca'}`,
          background: msg.ok ? '#f0fdf4' : '#fef2f2',
          color: msg.ok ? '#16a34a' : '#dc2626',
          fontSize: 13,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {msg.text}
          <button
            style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: 'inherit' }}
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
        marginBottom: 16,
        background: '#ffffff',
        borderRadius: 10,
        padding: 3,
        border: '1px solid #e8edf4',
      }}>
        <button
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'health' ? '#6366f1' : 'transparent',
            color: activeTab === 'health' ? '#fff' : '#64748b',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setActiveTab('health')}
        >
          🩺 System Health
        </button>
        <button
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'process' ? '#6366f1' : 'transparent',
            color: activeTab === 'process' ? '#fff' : '#64748b',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setActiveTab('process')}
        >
          ⚙️ Process & LOB
        </button>
      </div>

      {/* ===== CONTENT ===== */}
      {activeTab === 'health' && <SystemHealthSection onToast={toast} />}
      {activeTab === 'process' && <ProcessLobSection onToast={toast} />}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input:focus, select:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 2px rgba(99,102,241,0.08);
        }
        .tab-btn:hover {
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}

// ========== STYLES ==========
const styles = {
  input: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #e8edf4',
    background: '#fafbfc',
    fontSize: 13,
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.15s',
    boxSizing: 'border-box',
    width: '100%',
  },
  btn: {
    padding: '6px 14px',
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
    borderRadius: 12,
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
    padding: '12px 18px',
    borderBottom: '1px solid #f1f5f9',
    position: 'sticky',
    top: 0,
    background: '#fff',
    borderRadius: '12px 12px 0 0',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
  },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: 'none',
    background: '#f8fafc',
    fontSize: 14,
    cursor: 'pointer',
    color: '#64748b',
    display: 'grid',
    placeItems: 'center',
  },
  modalBody: {
    padding: '16px 18px 18px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
    marginBottom: 4,
  },
};