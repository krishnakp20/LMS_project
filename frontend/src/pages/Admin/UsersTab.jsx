// src/pages/Admin/UsersTab.jsx
import { useState, useEffect } from 'react';
import { api, downloadCsv, uploadFile } from '../../utils/api.js';
import { formatDate, pct, riskColor } from '../../utils/format.js';

// ========== CONSTANTS ==========
const ROLES = ['Coordinator', 'Manager', 'Trainer', 'Admin', 'Viewer'];
const PERMISSIONS = [
  { key: 'canCreateBatch', label: 'Create Batch', icon: '📚' },
  { key: 'canOnboardTrainee', label: 'Onboard Trainee', icon: '👤' },
  { key: 'canUploadLmsReport', label: 'Upload LMS Report', icon: '📊' },
  { key: 'canOverrideAttendance', label: 'Override Attendance', icon: '⏱️' },
  { key: 'canCloseBatch', label: 'Close Batch', icon: '🔒' },
  { key: 'canViewManagementDashboard', label: 'View Mgmt Dashboard', icon: '📈' },
];

const BLANK_USER = {
  traineeName: '', employeeId: '', lmsId: '', email: '', mobile: '',
  branch: '', process: '', lob: '', tempPassword: ''
};

const EMPTY_FORM = {
  loginId: '', pin: '', confirmPin: '', name: '',
  role: 'Coordinator', portalAccess: 'Coordinator',
  branch: '', process: '', lob: '', designation: '', department: '', employeeCode: '',
  email: '', mobile: '',
  canCreateBatch: true, canOnboardTrainee: true, canUploadLmsReport: false,
  canOverrideAttendance: false, canCloseBatch: false, canViewManagementDashboard: false,
};

const BULK_CSV_TEMPLATE = 'loginId,name,pin,role,branch,process,lob,designation,department,employeeCode,canCreateBatch,canOnboardTrainee,canUploadLmsReport,canOverrideAttendance,canCloseBatch,canViewManagementDashboard\nCOORD001,John Doe,1234,Coordinator,Bangalore,Collections,LOB1,Training Coordinator,Training,,true,true,false,false,false,false\n';

// ========== HELPER FUNCTIONS ==========
function parseBulkUsersCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
    const bool = v => v === 'true' || v === '1' || v === 'yes';
    return {
      loginId: obj.loginid || obj['login id'] || '',
      name: obj.name || '',
      pin: obj.pin || '',
      role: obj.role || 'Coordinator',
      portalAccess: obj.role || 'Coordinator',
      branch: obj.branch || null,
      process: obj.process || null,
      lob: obj.lob || null,
      designation: obj.designation || null,
      department: obj.department || null,
      employeeCode: obj.employeecode || obj['employee code'] || null,
      canCreateBatch: bool(obj.cancreatebatch),
      canOnboardTrainee: bool(obj.canonboardtrainee),
      canUploadLmsReport: bool(obj.canuploadlmsreport),
      canOverrideAttendance: bool(obj.canoverrideattendance),
      canCloseBatch: bool(obj.canclosebatch),
      canViewManagementDashboard: bool(obj.canviewmanagementdashboard),
    };
  }).filter(u => u.loginId && u.name && u.pin);
}

function parseBulkTraineesCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
    return {
      traineeName: obj['traineename'] || obj['name'] || '',
      employeeId: obj['employeeid'] || obj['empid'] || '',
      lmsId: obj['lmsid'] || '',
      email: obj['email'] || '',
      mobile: obj['mobile'] || '',
      branch: obj['branch'] || '',
      process: obj['process'] || '',
      lob: obj['lob'] || '',
    };
  }).filter(u => u.traineeName && (u.employeeId || u.lmsId));
}

// ========== MAIN COMPONENT ==========
export default function UsersTab() {
  // ── State ──
  const [users, setUsers] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [processList, setProcessList] = useState([]);
  const [activeTab, setActiveTab] = useState('portal');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState({ text: '', ok: true });

  // ── Portal User States ──
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkDragging, setBulkDragging] = useState(false);
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [roleChangePin, setRoleChangePin] = useState('');
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  // ── Trainee States ──
  const [traineeQuery, setTraineeQuery] = useState('');
  const [traineeSearched, setTraineeSearched] = useState(false);
  const [newUser, setNewUser] = useState(BLANK_USER);
  const [creating, setCreating] = useState(false);
  const [showTraineeBulk, setShowTraineeBulk] = useState(false);
  const [traineeBulkDragging, setTraineeBulkDragging] = useState(false);
  const [traineeBulkPreview, setTraineeBulkPreview] = useState(null);
  const [traineeBulkLoading, setTraineeBulkLoading] = useState(false);

  // ── Effects ──
  useEffect(() => {
    loadUsers();
    api.get('/admin/process-lob', 'admin').then(r => r.ok && setProcessList(r.data));
  }, []);

  // ── Toast ──
  function toast(text, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 6000);
  }

  // ── API Calls ──
  async function loadUsers() {
    const res = await api.get('/admin/portal-users', 'admin');
    if (res.ok) setUsers(res.data);
  }

  async function searchTrainees(e) {
    e?.preventDefault?.();
    setTraineeSearched(true);
    const res = await api.get(`/admin/trainees/search?q=${encodeURIComponent(traineeQuery)}`, 'admin');
    if (res.ok) setTrainees(res.data);
  }

  // ── Portal User CRUD ──
  function openCreate() {
    setForm(EMPTY_FORM);
    setShowCreate(true);
    setEditing(null);
  }

  function openEdit(u) {
    setForm({
      loginId: u.loginId, pin: '', confirmPin: '', name: u.name || '',
      role: u.role || 'Coordinator', portalAccess: u.portalAccess || 'Coordinator',
      branch: u.branch || '', process: u.process || '', lob: u.lob || '',
      designation: u.designation || '', department: u.department || '',
      employeeCode: u.employeeCode || '', email: u.email || '', mobile: u.mobile || '',
      canCreateBatch: u.canCreateBatch || false,
      canOnboardTrainee: u.canOnboardTrainee || false,
      canUploadLmsReport: u.canUploadLmsReport || false,
      canOverrideAttendance: u.canOverrideAttendance || false,
      canCloseBatch: u.canCloseBatch || false,
      canViewManagementDashboard: u.canViewManagementDashboard || false,
    });
    setEditing(u);
    setShowCreate(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editing && form.pin !== form.confirmPin) return toast('PINs do not match.', false);
    if (!editing && form.pin.length < 4) return toast('PIN must be at least 4 characters.', false);
    if (!form.loginId.trim() || !form.name.trim()) return toast('Login ID and Name are required.', false);

    setLoading(true);
    const payload = {
      loginId: form.loginId.trim(),
      name: form.name.trim(),
      role: form.role,
      portalAccess: form.portalAccess || form.role,
      branch: form.branch || null,
      process: form.process || null,
      lob: form.lob || null,
      designation: form.designation || null,
      department: form.department || null,
      employeeCode: form.employeeCode || null,
      email: form.email || null,
      mobile: form.mobile || null,
      canCreateBatch: form.canCreateBatch,
      canOnboardTrainee: form.canOnboardTrainee,
      canUploadLmsReport: form.canUploadLmsReport,
      canOverrideAttendance: form.canOverrideAttendance,
      canCloseBatch: form.canCloseBatch,
      canViewManagementDashboard: form.canViewManagementDashboard,
    };
    if (!editing) payload.pin = form.pin;

    let res;
    if (editing) {
      res = await api.put(`/admin/portal-users/${editing.id}`, payload, 'admin');
    } else {
      res = await api.post('/admin/portal-users', payload, 'admin');
    }
    setLoading(false);
    if (res.ok) {
      toast(editing ? `User ${form.loginId} updated.` : `User ${form.loginId} created.`);
      setShowCreate(false);
      setEditing(null);
      loadUsers();
    } else {
      toast(res.message || 'Failed.', false);
    }
  }

  async function deactivateUser(u) {
    if (!window.confirm(`Deactivate ${u.loginId}? They will lose portal access.`)) return;
    const res = await api.delete(`/admin/portal-users/${u.id}`, 'admin');
    if (res.ok) { toast('User deactivated.'); loadUsers(); }
    else toast(res.message || 'Failed.', false);
  }

  async function resetPassword(employeeId) {
    const res = await api.post(`/admin/trainees/${employeeId}/reset-password`, {}, 'admin');
    toast(res.ok ? `✓ ${res.message}` : res.message || 'Failed.', res.ok);
  }

  async function unlockAccount(employeeId) {
    const res = await api.post(`/admin/trainees/${employeeId}/unlock`, {}, 'admin');
    toast(res.ok ? `✓ ${employeeId} unlocked.` : 'Failed.', res.ok);
  }

  async function deleteAccount(employeeId) {
    if (!window.confirm(`Delete account for ${employeeId}? This will deactivate their LMS access.`)) return;
    const res = await api.delete(`/admin/trainees/${employeeId}`, 'admin');
    if (res.ok) { toast(`✓ ${employeeId} deleted.`); searchTrainees(); }
    else toast('Failed.', false);
  }

  // ── Trainee CRUD ──
  async function createIndependentUser(e) {
    e.preventDefault();
    setCreating(true);
    setMsg({ text: '', ok: true });
    const res = await api.post('/admin/lms-users', newUser, 'admin');
    setCreating(false);
    if (!res.ok) {
      toast(res.message || 'Unable to create LMS user.', false);
      return;
    }
    toast(`✓ ${res.message}. Temp password: ${res.data?.tempPassword || 'mobile last 4 / 1234'}`);
    setNewUser(BLANK_USER);
    setTraineeQuery(res.data?.employeeId || '');
    setTraineeSearched(false);
  }

  function setUserField(key, value) {
    setNewUser(prev => ({ ...prev, [key]: value }));
  }

  // ── Role Change ──
  function openRoleChange(u) {
    setRoleChangeTarget(u);
    setNewRole(u.role || 'Coordinator');
    setRoleChangePin('');
  }

  async function handleRoleChange(e) {
    e.preventDefault();
    if (!newRole) return;
    const crossTable = (roleChangeTarget.role === 'Admin') !== (newRole === 'Admin');
    if (crossTable && roleChangePin.length < 4) {
      return toast(`A new ${newRole === 'Admin' ? 'password' : 'PIN'} (min 4 chars) is required when changing to/from Admin.`, false);
    }
    setRoleChangeLoading(true);
    const res = await api.post(`/admin/portal-users/${roleChangeTarget.id}/change-role`, {
      newRole,
      newPin: crossTable ? roleChangePin : undefined,
    }, 'admin');
    setRoleChangeLoading(false);
    if (res.ok) {
      toast(res.message || `Role changed to ${newRole}.`);
      setRoleChangeTarget(null);
      loadUsers();
    } else {
      toast(res.message || 'Role change failed.', false);
    }
  }

  // ── PIN Reset ──
  async function submitPinReset(e) {
    e.preventDefault();
    const isAdmin = resetTarget?.role === 'Admin';
    if (!newPin || newPin.length < 4) return toast(`${isAdmin ? 'Password' : 'PIN'} must be at least 4 characters.`, false);
    const res = await api.post(`/admin/portal-users/${resetTarget.id}/reset-pin`, { pin: newPin }, 'admin');
    if (res.ok) {
      toast(`${isAdmin ? 'Password' : 'PIN'} reset successfully.`);
      setResetTarget(null);
      setNewPin('');
    } else toast(res.message || 'Failed.', false);
  }

  // ── Bulk Portal Users ──
  function handleBulkFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const rows = parseBulkUsersCsv(e.target.result);
      setBulkPreview(rows);
    };
    reader.readAsText(file);
  }

  async function submitBulkImport() {
    if (!bulkPreview?.length) return;
    setBulkLoading(true);
    const res = await api.post('/admin/portal-users/bulk', { users: bulkPreview }, 'admin');
    setBulkLoading(false);
    if (res.ok) {
      toast(`Created ${res.data?.success} users${res.data?.failed ? `, ${res.data.failed} failed` : ''}.`);
      setShowBulk(false);
      setBulkPreview(null);
      loadUsers();
    } else {
      toast(res.message || 'Bulk import failed.', false);
    }
  }

  // ── Bulk Trainees ──
  function handleTraineeBulkFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const rows = parseBulkTraineesCsv(e.target.result);
      setTraineeBulkPreview(rows);
    };
    reader.readAsText(file);
  }

  async function submitTraineeBulkImport() {
    if (!traineeBulkPreview?.length) return;
    setTraineeBulkLoading(true);
    let success = 0, failed = 0;
    for (const user of traineeBulkPreview) {
      const res = await api.post('/admin/lms-users', {
        traineeName: user.traineeName,
        employeeId: user.employeeId,
        lmsId: user.lmsId,
        email: user.email,
        mobile: user.mobile,
        branch: user.branch,
        process: user.process,
        lob: user.lob,
      }, 'admin');
      if (res.ok) success++;
      else failed++;
    }
    setTraineeBulkLoading(false);
    toast(`Created ${success} trainees${failed ? `, ${failed} failed` : ''}.`);
    setShowTraineeBulk(false);
    setTraineeBulkPreview(null);
    setTraineeSearched(false);
  }

  // ── Computed ──
  const uniqueProcesses = [...new Set(processList.map(p => p.process).filter(Boolean))];
  const lobsForProcess = processList.filter(p => p.process === form.process).map(p => p.lob);

  const filteredUsers = users.filter(u =>
    !search || u.loginId.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.branch || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.process || '').toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = r => r === 'Admin' ? '#ef4444' : r === 'Manager' ? '#f59e0b' : r === 'Trainer' ? '#8b5cf6' : '#3b82f6';

  // ── Render ──
  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.pageTitle}>👥 User Management</h2>
          <p style={styles.pageSubtitle}>Manage portal users and LMS trainees from one place</p>
        </div>
      </div>

      {/* Toast */}
      {msg.text && (
        <div style={{
          ...styles.toast,
          background: msg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          borderColor: msg.ok ? '#22c55e' : '#ef4444',
          color: msg.ok ? '#16a34a' : '#dc2626',
        }}>
          {msg.text}
          <button style={styles.toastClose} onClick={() => setMsg({ text: '', ok: true })}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'portal' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('portal')}
        >
          🖥️ Portal Users <span style={styles.tabBadge}>{users.length}</span>
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'trainee' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('trainee')}
        >
          🎓 Trainees <span style={styles.tabBadge}>{trainees.length || 0}</span>
        </button>
      </div>

      {/* ─── PORTAL USERS TAB ─── */}
      {activeTab === 'portal' && (
        <div>
          {/* Portal Users Toolbar */}
          <div style={styles.toolbar}>
            <div style={styles.toolbarLeft}>
              <input
                style={styles.searchInput}
                placeholder="🔍 Search by login, name, branch, process..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={styles.toolbarRight}>
              <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => { setShowBulk(true); setBulkPreview(null); }}>
                📤 Bulk CSV
              </button>
              <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={openCreate}>
                ➕ New User
              </button>
            </div>
          </div>

          {/* Portal Users Table */}
          <div style={styles.tableWrapper}>
            {filteredUsers.length === 0 && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>👤</span>
                <div style={styles.emptyTitle}>No portal users yet</div>
                <div style={styles.emptyDesc}>Click "New User" to add your first coordinator or trainer</div>
              </div>
            )}
            {filteredUsers.length > 0 && (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Login ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Branch</th>
                    <th style={styles.th}>Process / LOB</th>
                    <th style={styles.th}>Permissions</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.loginId}>{u.loginId}</span>
                      </td>
                      <td style={styles.td}>{u.name || '—'}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.roleBadge, background: `${roleColor(u.role)}22`, color: roleColor(u.role) }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={styles.td}>{u.branch || '—'}</td>
                      <td style={styles.td}>
                        {u.process || '—'}{u.lob ? ` / ${u.lob}` : ''}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.permissionsContainer}>
                          {u.canCreateBatch && <span style={styles.permissionBadge}>📚 Batches</span>}
                          {u.canOnboardTrainee && <span style={styles.permissionBadge}>👤 Onboard</span>}
                          {u.canViewManagementDashboard && <span style={styles.permissionBadge}>📈 Mgmt</span>}
                          {!u.canCreateBatch && !u.canOnboardTrainee && !u.canViewManagementDashboard && (
                            <span style={styles.permissionNone}>—</span>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          ...(u.active ? styles.statusActive : styles.statusInactive)
                        }}>
                          {u.active ? '● Active' : '○ Inactive'}
                        </span>
                        {u.locked && <span style={{ ...styles.statusBadge, ...styles.statusLocked }}>🔒 Locked</span>}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionGroup}>
                          <button style={{ ...styles.actionBtn, ...styles.actionEdit }} onClick={() => openEdit(u)}>✏️</button>
                          <button style={{ ...styles.actionBtn, ...styles.actionRole }} onClick={() => openRoleChange(u)}>🔄</button>
                          <button style={{ ...styles.actionBtn, ...styles.actionReset }} onClick={() => { setResetTarget(u); setNewPin(''); }}>
                            {u.role === 'Admin' ? '🔑' : '🔐'}
                          </button>
                          <button style={{ ...styles.actionBtn, ...styles.actionDelete }} onClick={() => deactivateUser(u)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── TRAINEES TAB ─── */}
      {activeTab === 'trainee' && (
        <div>
          {/* Create Trainee Card */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h4 style={styles.panelTitle}>🎓 Create Independent LMS User</h4>
                <p style={styles.panelDesc}>Create LMS login without batch dependency. Batch/classroom can be mapped later.</p>
              </div>
            </div>
            <form onSubmit={createIndependentUser} style={styles.formGrid}>
              <div style={styles.formRow3}>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>Name *</label>
                  <input
                    style={styles.fieldInput}
                    value={newUser.traineeName}
                    onChange={e => setUserField('traineeName', e.target.value)}
                    required
                    placeholder="Trainee / Employee name"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>Employee ID</label>
                  <input
                    style={styles.fieldInput}
                    value={newUser.employeeId}
                    onChange={e => setUserField('employeeId', e.target.value)}
                    placeholder="Leave blank for auto"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>LMS ID</label>
                  <input
                    style={styles.fieldInput}
                    value={newUser.lmsId}
                    onChange={e => setUserField('lmsId', e.target.value)}
                    placeholder="Auto if blank"
                  />
                </div>
              </div>
              <div style={styles.formRow4}>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>Email</label>
                  <input
                    style={styles.fieldInput}
                    type="email"
                    value={newUser.email}
                    onChange={e => setUserField('email', e.target.value)}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>Mobile</label>
                  <input
                    style={styles.fieldInput}
                    value={newUser.mobile}
                    onChange={e => setUserField('mobile', e.target.value)}
                    placeholder="Used for temp password"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>Branch</label>
                  <input
                    style={styles.fieldInput}
                    value={newUser.branch}
                    onChange={e => setUserField('branch', e.target.value)}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>Temp Password</label>
                  <input
                    style={styles.fieldInput}
                    value={newUser.tempPassword}
                    onChange={e => setUserField('tempPassword', e.target.value)}
                    placeholder="Default mobile last 4"
                  />
                </div>
              </div>
              <div style={styles.formRow2}>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>Process</label>
                  <input
                    style={styles.fieldInput}
                    value={newUser.process}
                    onChange={e => setUserField('process', e.target.value)}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>LOB</label>
                  <input
                    style={styles.fieldInput}
                    value={newUser.lob}
                    onChange={e => setUserField('lob', e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                style={{ ...styles.btn, ...styles.btnPrimary, width: 'auto', alignSelf: 'flex-end' }}
                disabled={creating}
              >
                {creating ? 'Creating...' : '➕ Create LMS User'}
              </button>
            </form>
          </div>

          {/* Trainee Search */}
          <div style={styles.toolbar}>
            <form onSubmit={searchTrainees} style={styles.toolbarLeft}>
              <input
                style={styles.searchInput}
                placeholder="🔍 Search by Employee ID, LMS ID, Name, Batch, Email..."
                value={traineeQuery}
                onChange={e => setTraineeQuery(e.target.value)}
              />
              <button style={{ ...styles.btn, ...styles.btnPrimary }} type="submit">Search</button>
            </form>
            <div style={styles.toolbarRight}>
              <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => downloadCsv('/admin/trainees/export', 'all-trainees.csv')}>
                📥 Export All
              </button>
              <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setShowTraineeBulk(true)}>
                📤 Bulk Upload
              </button>
              {trainees.length > 0 && (
                <button
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={() => {
                    const rows = [['Employee ID', 'LMS ID', 'Name', 'Email', 'Mobile', 'Batch', 'Branch', 'Process', 'Course%', 'MCQ%', 'Attendance%', 'Risk', 'Certification']];
                    trainees.forEach(t => rows.push([
                      t.employeeId, t.lmsId || '', t.traineeName || '', t.email || '',
                      t.mobile || '', t.batchNo || '', t.branch || '', t.process || '',
                      t.courseCompletionPct || 0, t.assessmentPassPct || 0, t.attendancePct || 0,
                      t.riskStatus || '', t.certificationStatus || ''
                    ]));
                    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                    a.download = 'search-results.csv';
                    a.click();
                  }}
                >
                  📥 Export Results
                </button>
              )}
            </div>
          </div>

          {/* Trainees Table */}
          <div style={styles.tableWrapper}>
            {traineeSearched && trainees.length === 0 && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>🔍</span>
                <div style={styles.emptyTitle}>No trainees found</div>
                <div style={styles.emptyDesc}>Try adjusting your search query</div>
              </div>
            )}
            {trainees.length > 0 && (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Employee / LMS ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Mobile</th>
                    <th style={styles.th}>Batch</th>
                    <th style={styles.th}>Branch / Process</th>
                    <th style={styles.th}>Course</th>
                    <th style={styles.th}>MCQ</th>
                    <th style={styles.th}>Risk</th>
                    <th style={styles.th}>Joined</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trainees.map(t => (
                    <tr key={t.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.empId}>{t.employeeId}</span>
                        {t.lmsId && <div style={styles.lmsId}>LMS: {t.lmsId}</div>}
                        {t.empIdType === 'TEMP' && <span style={styles.tempBadge}>TEMP</span>}
                      </td>
                      <td style={styles.td}>{t.traineeName || '—'}</td>
                      <td style={styles.td}>{t.email || '—'}</td>
                      <td style={styles.td}>{t.mobile || '—'}</td>
                      <td style={styles.td}>{t.batchNo || '—'}</td>
                      <td style={styles.td}>{t.branch || '—'} / {t.process || '—'}</td>
                      <td style={styles.td}>
                        <span style={styles.progressValue}>{pct(t.courseCompletionPct)}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.progressValue}>{pct(t.assessmentPassPct)}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.riskBadge, ...styles[riskColor(t.riskStatus)] }}>
                          {t.riskStatus || 'UNKNOWN'}
                        </span>
                      </td>
                      <td style={styles.td}>{formatDate(t.createdAt)}</td>
                      <td style={styles.td}>
                        <div style={styles.actionGroup}>
                          <button
                            style={{ ...styles.actionBtn, ...styles.actionEdit }}
                            onClick={() => resetPassword(t.employeeId)}
                            title="Reset Password"
                          >
                            🔑
                          </button>
                          <button
                            style={{ ...styles.actionBtn, ...styles.actionRole }}
                            onClick={() => unlockAccount(t.employeeId)}
                            title="Unlock Account"
                          >
                            🔓
                          </button>
                          <button
                            style={{ ...styles.actionBtn, ...styles.actionDelete }}
                            onClick={() => deleteAccount(t.employeeId)}
                            title="Delete Account"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}

      {/* Create/Edit Portal User Modal */}
      {showCreate && (
        <div style={styles.modalOverlay} onClick={e => e.target === e.currentTarget && (setShowCreate(false), setEditing(null))}>
          <div style={{ ...styles.modalBox, maxWidth: 640 }}>
            <div style={styles.modalHead}>
              <b style={styles.modalTitle}>{editing ? `✏️ Edit User — ${editing.loginId}` : '➕ New Portal User'}</b>
              <button style={styles.modalClose} onClick={() => { setShowCreate(false); setEditing(null); }}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <form onSubmit={handleSubmit}>
                {/* Identity */}
                <div style={styles.sectionLabel}>Identity</div>
                <div style={styles.formRow2}>
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Login ID *</label>
                    <input
                      style={styles.fieldInput}
                      placeholder="e.g. COORD001"
                      value={form.loginId}
                      onChange={e => setForm(p => ({ ...p, loginId: e.target.value }))}
                      disabled={!!editing}
                      required
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Full Name *</label>
                    <input
                      style={styles.fieldInput}
                      placeholder="e.g. John Doe"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div style={styles.formRow3}>
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Designation</label>
                    <input
                      style={styles.fieldInput}
                      placeholder="Training Coordinator"
                      value={form.designation}
                      onChange={e => setForm(p => ({ ...p, designation: e.target.value }))}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Department</label>
                    <input
                      style={styles.fieldInput}
                      placeholder="Training & Development"
                      value={form.department}
                      onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Employee Code</label>
                    <input
                      style={styles.fieldInput}
                      placeholder="EMP1001"
                      value={form.employeeCode}
                      onChange={e => setForm(p => ({ ...p, employeeCode: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Contact */}
                <div style={styles.sectionLabel}>Contact & Notifications</div>
                <div style={styles.formRow2}>
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Email</label>
                    <input
                      style={styles.fieldInput}
                      type="email"
                      placeholder="coord@company.com"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Mobile</label>
                    <input
                      style={styles.fieldInput}
                      type="tel"
                      placeholder="9876543210"
                      value={form.mobile}
                      onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                    />
                  </div>
                </div>

                {/* PIN */}
                {!editing && (
                  <>
                    <div style={styles.sectionLabel}>{form.role === 'Admin' ? 'Password' : 'PIN'}</div>
                    <div style={styles.formRow2}>
                      <div style={styles.field}>
                        <label style={styles.fieldLabel}>{form.role === 'Admin' ? 'Password *' : 'PIN *'}</label>
                        <input
                          style={styles.fieldInput}
                          type="password"
                          placeholder="Min 4 characters"
                          value={form.pin}
                          onChange={e => setForm(p => ({ ...p, pin: e.target.value }))}
                          required={!editing}
                        />
                      </div>
                      <div style={styles.field}>
                        <label style={styles.fieldLabel}>{form.role === 'Admin' ? 'Confirm Password *' : 'Confirm PIN *'}</label>
                        <input
                          style={styles.fieldInput}
                          type="password"
                          placeholder="Repeat"
                          value={form.confirmPin}
                          onChange={e => setForm(p => ({ ...p, confirmPin: e.target.value }))}
                          required={!editing}
                        />
                      </div>
                    </div>
                    {form.role === 'Admin' && (
                      <div style={styles.adminWarning}>
                        ⚠️ Admin users log into the <b>Admin portal</b> with Login ID + Password. They cannot log into the Coordinator portal.
                      </div>
                    )}
                  </>
                )}

                {/* Role & Scope */}
                <div style={styles.sectionLabel}>Role & Scope</div>
                <div style={styles.formRow2}>
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Role *</label>
                    <select
                      style={styles.fieldSelect}
                      value={form.role}
                      onChange={e => setForm(p => ({ ...p, role: e.target.value, portalAccess: e.target.value }))}
                    >
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Branch</label>
                    <input
                      style={styles.fieldInput}
                      placeholder="e.g. Bangalore"
                      value={form.branch}
                      onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}
                    />
                  </div>
                </div>
                <div style={styles.formRow2}>
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Process</label>
                    <select
                      style={styles.fieldSelect}
                      value={form.process}
                      onChange={e => setForm(p => ({ ...p, process: e.target.value, lob: '' }))}
                    >
                      <option value="">All / None</option>
                      {uniqueProcesses.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>LOB</label>
                    <select
                      style={styles.fieldSelect}
                      value={form.lob}
                      onChange={e => setForm(p => ({ ...p, lob: e.target.value }))}
                      disabled={!form.process}
                    >
                      <option value="">All / None</option>
                      {lobsForProcess.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {/* Permissions */}
                <div style={styles.sectionLabel}>Permissions</div>
                <div style={styles.permissionsGrid}>
                  {PERMISSIONS.map(({ key, label, icon }) => (
                    <label key={key} style={{ ...styles.permissionCheck, ...(form[key] ? styles.permissionChecked : {}) }}>
                      <input
                        type="checkbox"
                        checked={!!form[key]}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                        style={styles.permissionInput}
                      />
                      <span style={styles.permissionLabel}>{icon} {label}</span>
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  style={{ ...styles.btn, ...styles.btnPrimary, width: '100%', justifyContent: 'center', padding: '12px' }}
                  disabled={loading}
                >
                  {loading ? '...' : editing ? '💾 Save Changes' : '🚀 Create User'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Portal Users Modal */}
      {showBulk && (
        <div style={styles.modalOverlay} onClick={e => e.target === e.currentTarget && (setShowBulk(false), setBulkPreview(null))}>
          <div style={{ ...styles.modalBox, maxWidth: 680 }}>
            <div style={styles.modalHead}>
              <b style={styles.modalTitle}>📤 Bulk Create Portal Users</b>
              <button style={styles.modalClose} onClick={() => { setShowBulk(false); setBulkPreview(null); }}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {!bulkPreview ? (
                <>
                  <p style={styles.modalDesc}>
                    Upload a CSV with columns: loginId, name, pin, role, branch, process, lob, designation, department, employeeCode, canCreateBatch, canOnboardTrainee, canUploadLmsReport, canOverrideAttendance, canCloseBatch, canViewManagementDashboard
                  </p>
                  <div
                    onDragOver={e => { e.preventDefault(); setBulkDragging(true); }}
                    onDragLeave={() => setBulkDragging(false)}
                    onDrop={e => { e.preventDefault(); setBulkDragging(false); handleBulkFile(e.dataTransfer.files[0]); }}
                    style={{
                      ...styles.dropZone,
                      borderColor: bulkDragging ? '#6366f1' : 'rgba(203,213,225,0.4)',
                      background: bulkDragging ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
                    }}
                    onClick={() => document.getElementById('bulk-users-input').click()}
                  >
                    <div style={styles.dropIcon}>📤</div>
                    <div style={styles.dropTitle}>Drag & drop CSV or click to browse</div>
                    <div style={styles.dropDesc}>Supports .csv files</div>
                    <input id="bulk-users-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleBulkFile(e.target.files[0])} />
                  </div>
                  <a
                    href={`data:text/csv;charset=utf-8,${encodeURIComponent(BULK_CSV_TEMPLATE)}`}
                    download="portal-users-template.csv"
                    style={styles.downloadLink}
                  >
                    ⬇ Download CSV Template
                  </a>
                </>
              ) : (
                <>
                  <div style={styles.previewHeader}>Preview — {bulkPreview.length} users found</div>
                  <div style={{ ...styles.previewTable, maxHeight: 280 }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Login ID</th>
                          <th style={styles.th}>Name</th>
                          <th style={styles.th}>Role</th>
                          <th style={styles.th}>Branch</th>
                          <th style={styles.th}>Process</th>
                          <th style={styles.th}>Designation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkPreview.map((u, i) => (
                          <tr key={i} style={styles.tr}>
                            <td style={styles.td}>{u.loginId}</td>
                            <td style={styles.td}>{u.name}</td>
                            <td style={styles.td}>{u.role}</td>
                            <td style={styles.td}>{u.branch || '—'}</td>
                            <td style={styles.td}>{u.process || '—'}</td>
                            <td style={styles.td}>{u.designation || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={styles.modalActions}>
                    <button
                      style={{ ...styles.btn, ...styles.btnPrimary, flex: 1 }}
                      onClick={submitBulkImport}
                      disabled={bulkLoading}
                    >
                      {bulkLoading ? 'Creating...' : `✅ Create ${bulkPreview.length} Users`}
                    </button>
                    <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setBulkPreview(null)}>
                      📂 Re-upload
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Trainees Modal */}
      {showTraineeBulk && (
        <div style={styles.modalOverlay} onClick={e => e.target === e.currentTarget && (setShowTraineeBulk(false), setTraineeBulkPreview(null))}>
          <div style={{ ...styles.modalBox, maxWidth: 680 }}>
            <div style={styles.modalHead}>
              <b style={styles.modalTitle}>📤 Bulk Create Trainees</b>
              <button style={styles.modalClose} onClick={() => { setShowTraineeBulk(false); setTraineeBulkPreview(null); }}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {!traineeBulkPreview ? (
                <>
                  <p style={styles.modalDesc}>
                    Upload a CSV with columns: traineeName, employeeId, lmsId, email, mobile, branch, process, lob
                  </p>
                  <div
                    onDragOver={e => { e.preventDefault(); setTraineeBulkDragging(true); }}
                    onDragLeave={() => setTraineeBulkDragging(false)}
                    onDrop={e => { e.preventDefault(); setTraineeBulkDragging(false); handleTraineeBulkFile(e.dataTransfer.files[0]); }}
                    style={{
                      ...styles.dropZone,
                      borderColor: traineeBulkDragging ? '#6366f1' : 'rgba(203,213,225,0.4)',
                      background: traineeBulkDragging ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
                    }}
                    onClick={() => document.getElementById('bulk-trainees-input').click()}
                  >
                    <div style={styles.dropIcon}>🎓</div>
                    <div style={styles.dropTitle}>Drag & drop CSV or click to browse</div>
                    <div style={styles.dropDesc}>Supports .csv files</div>
                    <input id="bulk-trainees-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleTraineeBulkFile(e.target.files[0])} />
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.previewHeader}>Preview — {traineeBulkPreview.length} trainees found</div>
                  <div style={{ ...styles.previewTable, maxHeight: 280 }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Name</th>
                          <th style={styles.th}>Employee ID</th>
                          <th style={styles.th}>LMS ID</th>
                          <th style={styles.th}>Email</th>
                          <th style={styles.th}>Mobile</th>
                          <th style={styles.th}>Branch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {traineeBulkPreview.map((u, i) => (
                          <tr key={i} style={styles.tr}>
                            <td style={styles.td}>{u.traineeName}</td>
                            <td style={styles.td}>{u.employeeId || '—'}</td>
                            <td style={styles.td}>{u.lmsId || '—'}</td>
                            <td style={styles.td}>{u.email || '—'}</td>
                            <td style={styles.td}>{u.mobile || '—'}</td>
                            <td style={styles.td}>{u.branch || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={styles.modalActions}>
                    <button
                      style={{ ...styles.btn, ...styles.btnPrimary, flex: 1 }}
                      onClick={submitTraineeBulkImport}
                      disabled={traineeBulkLoading}
                    >
                      {traineeBulkLoading ? 'Creating...' : `✅ Create ${traineeBulkPreview.length} Trainees`}
                    </button>
                    <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setTraineeBulkPreview(null)}>
                      📂 Re-upload
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset PIN/Password Modal */}
      {resetTarget && (
        <div style={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setResetTarget(null)}>
          <div style={{ ...styles.modalBox, maxWidth: 380 }}>
            <div style={styles.modalHead}>
              <b style={styles.modalTitle}>
                {resetTarget.role === 'Admin' ? '🔑 Reset Password' : '🔐 Reset PIN'} — {resetTarget.loginId}
              </b>
              <button style={styles.modalClose} onClick={() => setResetTarget(null)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <form onSubmit={submitPinReset}>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>{resetTarget.role === 'Admin' ? 'New Password *' : 'New PIN *'}</label>
                  <input
                    style={styles.fieldInput}
                    type="password"
                    placeholder="Min 4 characters"
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary, width: '100%' }}>
                  ✅ Set New {resetTarget.role === 'Admin' ? 'Password' : 'PIN'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {roleChangeTarget && (
        <div style={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setRoleChangeTarget(null)}>
          <div style={{ ...styles.modalBox, maxWidth: 440 }}>
            <div style={styles.modalHead}>
              <b style={styles.modalTitle}>🔄 Change Role — {roleChangeTarget.loginId}</b>
              <button style={styles.modalClose} onClick={() => setRoleChangeTarget(null)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <form onSubmit={handleRoleChange}>
                <div style={styles.roleChangeInfo}>
                  <span style={{ color: '#64748b' }}>Current role: </span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{roleChangeTarget.role}</span>
                  <span style={{ margin: '0 8px', color: '#94a3b8' }}>→</span>
                  <span style={{ fontWeight: 700, color: '#6366f1' }}>{newRole}</span>
                </div>

                <div style={styles.field}>
                  <label style={styles.fieldLabel}>New Role *</label>
                  <select
                    style={styles.fieldSelect}
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    required
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {newRole !== roleChangeTarget.role && (roleChangeTarget.role === 'Admin') !== (newRole === 'Admin') && (
                  <div style={styles.crossTableWarning}>
                    <div style={styles.crossTableTitle}>
                      {newRole === 'Admin'
                        ? '⚠️ Promoting to Admin — this creates an Admin portal account.'
                        : '⚠️ Removing Admin access — this creates a Coordinator portal account.'}
                    </div>
                    <div style={styles.crossTableDesc}>
                      {newRole === 'Admin'
                        ? 'The user will log in via the Admin portal with a password. Their coordinator account will be deactivated.'
                        : 'The user will log in via the Coordinator portal with a PIN. Their admin account will be deactivated.'}
                    </div>
                    <div style={styles.field}>
                      <label style={styles.fieldLabel}>New {newRole === 'Admin' ? 'Password' : 'PIN'} for {newRole} access *</label>
                      <input
                        style={styles.fieldInput}
                        type="password"
                        placeholder={`Min 4 characters — ${newRole === 'Admin' ? 'Admin password' : 'Coordinator PIN'}`}
                        value={roleChangePin}
                        onChange={e => setRoleChangePin(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {newRole === roleChangeTarget.role && (
                  <div style={styles.noChangeNotice}>Select a different role to make a change.</div>
                )}

                <div style={styles.modalActions}>
                  <button
                    type="submit"
                    style={{ ...styles.btn, ...styles.btnPrimary, flex: 1 }}
                    disabled={roleChangeLoading || newRole === roleChangeTarget.role}
                  >
                    {roleChangeLoading ? 'Changing…' : `🔄 Change to ${newRole}`}
                  </button>
                  <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setRoleChangeTarget(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== STYLES ==========
const styles = {
  root: {
    padding: '8px 0 24px 0',
    fontFamily: '"Inter", -apple-system, sans-serif',
  },
  header: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748b',
    margin: '4px 0 0',
  },
  toast: {
    padding: '12px 16px',
    borderRadius: 12,
    marginBottom: 16,
    border: '1px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 500,
  },
  toastClose: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: 'inherit',
    padding: '0 4px',
  },
  tabsContainer: {
    display: 'flex',
    gap: 4,
    marginBottom: 24,
    background: '#ffffff',
    borderRadius: 14,
    padding: 4,
    border: '1px solid rgba(203,213,225,0.3)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  tab: {
    flex: 1,
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    fontSize: 14,
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabActive: {
    background: '#f8fafc',
    color: '#0f172a',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  tabBadge: {
    background: 'rgba(99,102,241,0.1)',
    color: '#6366f1',
    padding: '1px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  toolbarLeft: {
    display: 'flex',
    gap: 10,
    flex: 1,
    minWidth: 200,
  },
  toolbarRight: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  searchInput: {
    padding: '8px 14px',
    borderRadius: 10,
    border: '1px solid rgba(203,213,225,0.4)',
    background: '#ffffff',
    fontSize: 13,
    color: '#0f172a',
    outline: 'none',
    flex: 1,
    minWidth: 160,
    transition: 'border-color 0.2s',
  },
  panel: {
    background: '#ffffff',
    borderRadius: 16,
    padding: '20px 24px 24px',
    border: '1px solid rgba(203,213,225,0.3)',
    marginBottom: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  panelHeader: {
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  panelDesc: {
    fontSize: 13,
    color: '#64748b',
    margin: '4px 0 0',
  },
  btn: {
    padding: '8px 18px',
    borderRadius: 10,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
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
  tableWrapper: {
    overflowX: 'auto',
    background: '#ffffff',
    borderRadius: 16,
    border: '1px solid rgba(203,213,225,0.3)',
    padding: '4px 0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  th: {
    textAlign: 'left',
    padding: '10px 14px',
    color: '#64748b',
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    borderBottom: '1px solid rgba(203,213,225,0.2)',
  },
  td: {
    padding: '10px 14px',
    borderBottom: '1px solid rgba(203,213,225,0.08)',
    color: '#0f172a',
    fontSize: 13,
  },
  tr: {
    transition: 'background 0.15s',
    cursor: 'default',
  },
  loginId: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 600,
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 10px',
    borderRadius: 20,
    display: 'inline-block',
  },
  permissionsContainer: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
  },
  permissionBadge: {
    fontSize: 9,
    fontWeight: 700,
    padding: '1px 8px',
    borderRadius: 12,
    background: 'rgba(99,102,241,0.08)',
    color: '#6366f1',
  },
  permissionNone: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 10px',
    borderRadius: 20,
    display: 'inline-block',
    marginRight: 4,
  },
  statusActive: {
    background: 'rgba(34,197,94,0.1)',
    color: '#22c55e',
  },
  statusInactive: {
    background: 'rgba(148,163,184,0.08)',
    color: '#94a3b8',
  },
  statusLocked: {
    background: 'rgba(239,68,68,0.08)',
    color: '#ef4444',
  },
  actionGroup: {
    display: 'flex',
    gap: 4,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    transition: 'all 0.15s',
    display: 'grid',
    placeItems: 'center',
    background: 'transparent',
    color: '#64748b',
  },
  actionEdit: { hover: { background: 'rgba(99,102,241,0.08)', color: '#6366f1' } },
  actionRole: { hover: { background: 'rgba(245,158,11,0.08)', color: '#f59e0b' } },
  actionReset: { hover: { background: 'rgba(34,197,94,0.08)', color: '#22c55e' } },
  actionDelete: { hover: { background: 'rgba(239,68,68,0.08)', color: '#ef4444' } },
  empId: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 600,
  },
  lmsId: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#94a3b8',
  },
  tempBadge: {
    marginTop: 2,
    display: 'inline-block',
    background: '#f59e0b',
    color: '#fff',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 700,
    padding: '1px 6px',
  },
  progressValue: {
    fontWeight: 600,
  },
  riskBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 10px',
    borderRadius: 20,
    display: 'inline-block',
  },
  CRITICAL: { background: 'rgba(239,68,68,0.12)', color: '#dc2626' },
  HIGH: { background: 'rgba(245,158,11,0.12)', color: '#d97706' },
  MEDIUM: { background: 'rgba(59,130,246,0.12)', color: '#2563eb' },
  HEALTHY: { background: 'rgba(34,197,94,0.12)', color: '#16a34a' },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: 48,
    display: 'block',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94a3b8',
  },
  formGrid: {
    display: 'grid',
    gap: 12,
  },
  formRow2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  formRow3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
  },
  formRow4: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: 12,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
  },
  fieldInput: {
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid rgba(203,213,225,0.4)',
    background: '#f8fafc',
    fontSize: 13,
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  fieldSelect: {
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid rgba(203,213,225,0.4)',
    background: '#f8fafc',
    fontSize: 13,
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sectionLabel: {
    fontWeight: 700,
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    margin: '16px 0 10px',
  },
  permissionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 16,
  },
  permissionCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid rgba(203,213,225,0.3)',
    background: '#f8fafc',
    transition: 'all 0.15s',
  },
  permissionChecked: {
    background: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  permissionInput: {
    accentColor: '#22c55e',
    width: 16,
    height: 16,
  },
  permissionLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: '#0f172a',
  },
  adminWarning: {
    fontSize: 12,
    color: '#d97706',
    background: 'rgba(217,119,6,0.08)',
    border: '1px solid rgba(217,119,6,0.2)',
    borderRadius: 8,
    padding: '8px 12px',
    marginTop: 8,
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
    borderRadius: 20,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
  },
  modalHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(203,213,225,0.2)',
    position: 'sticky',
    top: 0,
    background: '#ffffff',
    zIndex: 10,
    borderRadius: '20px 20px 0 0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#0f172a',
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(241,245,249,0.8)',
    fontSize: 18,
    cursor: 'pointer',
    color: '#64748b',
    transition: 'background 0.2s',
    display: 'grid',
    placeItems: 'center',
  },
  modalBody: {
    padding: '20px 24px 24px',
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  dropZone: {
    border: '2px dashed rgba(203,213,225,0.4)',
    borderRadius: 14,
    padding: '36px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginBottom: 14,
  },
  dropIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  dropTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#0f172a',
  },
  dropDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  downloadLink: {
    fontSize: 12,
    color: '#6366f1',
    textDecoration: 'none',
  },
  previewHeader: {
    fontWeight: 700,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 10,
  },
  previewTable: {
    overflowY: 'auto',
    marginBottom: 14,
  },
  modalActions: {
    display: 'flex',
    gap: 10,
  },
  roleChangeInfo: {
    background: '#f8fafc',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 16,
  },
  crossTableWarning: {
    background: 'rgba(234,179,8,0.06)',
    border: '1px solid rgba(234,179,8,0.2)',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 13,
    marginTop: 12,
  },
  crossTableTitle: {
    fontWeight: 700,
    color: '#92400e',
    marginBottom: 6,
  },
  crossTableDesc: {
    color: '#78350f',
    fontSize: 12,
    lineHeight: 1.5,
  },
  noChangeNotice: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    padding: '12px 0',
  },
};

// Add hover styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .action-btn:hover {
    transform: scale(1.1);
  }
  .btn-primary:hover {
    background: #4f46e5 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99,102,241,0.3);
  }
  .btn-secondary:hover {
    background: #f1f5f9 !important;
  }
  .search-input:focus {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
  .field-input:focus, .field-select:focus {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
  }
  .modal-close:hover {
    background: rgba(239,68,68,0.08);
    color: #ef4444;
  }
  .drop-zone:hover {
    border-color: #6366f1 !important;
    background: rgba(99,102,241,0.03) !important;
  }
  .tr:hover {
    background: rgba(99,102,241,0.02);
  }
  .permission-check:hover {
    border-color: #6366f1 !important;
  }
  .tab:hover {
    background: rgba(99,102,241,0.04);
  }
`;
document.head.appendChild(styleSheet);