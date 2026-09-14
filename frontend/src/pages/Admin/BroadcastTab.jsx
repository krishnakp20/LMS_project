import { useState, useEffect, useRef } from 'react';
import { api, uploadFile } from '../../utils/api.js';

// ============================================================
// ==================== DRIVE SYNC HELPERS ====================
// ============================================================

function normalizeType(f) {
  if (f.contentType && f.contentType !== 'link') return f.contentType;
  const m = f.mimeType || '';
  if (m.includes('video')) return 'video';
  if (m.includes('pdf')) return 'pdf';
  if (m.includes('presentation') || m.includes('powerpoint')) return 'ppt';
  if (m.includes('document') || m.includes('word')) return 'doc';
  if (m.includes('spreadsheet') || m.includes('excel')) return 'doc';
  if (m.includes('folder')) return 'folder';
  return 'file';
}

const METHOD_LABEL = {
  service_account: 'Service Account',
  oauth: 'Your Google Account (OAuth)',
  api_key: 'API Key (public folders)',
};

// ============================================================
// ==================== BROADCAST HELPERS ====================
// ============================================================

const SCOPE_OPTIONS = [
  { value: 'company',    label: 'Entire Company',       desc: 'All active trainees' },
  { value: 'branch',     label: 'Branch(es)',           desc: 'One or more branches' },
  { value: 'process',    label: 'Process(es)',          desc: 'One or more processes' },
  { value: 'batch',      label: 'Batch(es)',            desc: 'One or more batches' },
  { value: 'individual', label: 'Individual',           desc: 'One trainee by Emp ID' },
  { value: 'specific',   label: 'Specific Employees',   desc: 'Search or paste a list' },
];

const EMPTY_MCQ = () => ({ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correct: 'A', marks: 1 });

function toggleItem(arr, val) {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

// ============================================================
// ==================== COMMON COMPONENTS ====================
// ============================================================

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

function ContentTypeBadge({ type }) {
  const types = {
    document: { icon: '📄', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    video: { icon: '🎬', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    pdf: { icon: '📕', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
    ppt: { icon: '📊', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    image: { icon: '🖼️', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    scorm: { icon: '🎯', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    link: { icon: '🔗', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    doc: { icon: '📝', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    file: { icon: '📎', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    folder: { icon: '📁', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  };
  const config = types[type] || types.file;
  
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

// ============================================================
// ==================== MAIN COMPONENT ====================
// ============================================================

export default function BroadcastTab() {
  // ---- SCOPE STATE ----
  const [classrooms, setClassrooms] = useState([]);
  const [modules, setModules] = useState([]);
  const [contents, setContents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [branches, setBranches] = useState([]);
  const [processes, setProcesses] = useState([]);

  // ---- FORM STATE ----
  const [form, setForm] = useState({
    broadcastTitle: '',
    scope: 'company',
    scopeValue: '',
    scopeValues: [],
    classroomId: '',
    moduleId: '',
    moduleName: '',
    selectedContentIds: [],
    assignmentType: 'Mandatory',
    message: '',
    dueDate: '',
  });

  // ---- EMPLOYEE SELECTION ----
  const [empSearch, setEmpSearch] = useState('');
  const [empSearchResults, setEmpSearchResults] = useState([]);
  const [empSearchLoading, setEmpSearchLoading] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [validateLoading, setValidateLoading] = useState(false);
  const [pasteResult, setPasteResult] = useState(null);

  // ---- UPLOAD STATE ----
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadMode, setUploadMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // ---- MCQ STATE ----
  const [mcqEnabled, setMcqEnabled] = useState(false);
  const [mcqName, setMcqName] = useState('');
  const [mcqPassPct, setMcqPassPct] = useState(60);
  const [mcqAttempts, setMcqAttempts] = useState(3);
  const [mcqTimeMins, setMcqTimeMins] = useState(30);
  const [questions, setQuestions] = useState([EMPTY_MCQ()]);

  // ---- DRIVE SYNC STATE ----
  const [driveFolderId, setDriveFolderId] = useState('');
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveSyncMethod, setDriveSyncMethod] = useState(null);
  const [tokenStatus, setTokenStatus] = useState(null);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveMsg, setDriveMsg] = useState({ text: '', ok: true });
  const [addingDriveFile, setAddingDriveFile] = useState(null);
  const [addDriveForm, setAddDriveForm] = useState({ 
    contentTitle: '', 
    contentType: 'video', 
    estimatedMins: '', 
    completionRulePct: 80 
  });
  const [showDrivePanel, setShowDrivePanel] = useState(false);

  // ---- SHARED STATE ----
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // ============================================================
  // ==================== INITIAL LOADS ====================
  // ============================================================

  useEffect(() => {
    api.get('/admin/classrooms', 'admin').then(r => r.ok && setClassrooms(r.data));
    api.get('/admin/batches', 'admin').then(r => r.ok && setBatches(r.data));
    api.get('/admin/broadcast-targets', 'admin').then(r => {
      if (r.ok) { setBranches(r.data.branches || []); setProcesses(r.data.processes || []); }
    });
    refreshDriveStatus();
  }, []);

  useEffect(() => {
    if (!form.classroomId) { setModules([]); setContents([]); setF('moduleId', ''); setF('moduleName', ''); return; }
    api.get(`/admin/classrooms/${form.classroomId}/modules`, 'admin').then(r => r.ok && setModules(r.data));
  }, [form.classroomId]);

  useEffect(() => {
    if (!form.moduleId) { setContents([]); setF('selectedContentIds', []); return; }
    api.get(`/admin/modules/${form.moduleId}/contents`, 'admin').then(r => r.ok && setContents(r.data));
  }, [form.moduleId]);

  // Employee search with debounce
  useEffect(() => {
    if (empSearch.trim().length < 2) { setEmpSearchResults([]); return; }
    const t = setTimeout(async () => {
      setEmpSearchLoading(true);
      const res = await api.get(`/admin/trainees/search?q=${encodeURIComponent(empSearch)}&limit=10`, 'admin');
      setEmpSearchLoading(false);
      if (res.ok) setEmpSearchResults(res.data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [empSearch]);

  // ============================================================
  // ==================== DRIVE SYNC FUNCTIONS ====================
  // ============================================================

  async function refreshDriveStatus() {
    const r = await api.get('/drive/token-status', 'admin');
    if (r.ok) setTokenStatus(r);
    return r;
  }

  function driveToast(text, ok = true) { 
    setDriveMsg({ text, ok }); 
    setTimeout(() => setDriveMsg({ text: '', ok: true }), 6000); 
  }

  async function connectOAuth() {
    const res = await api.get('/drive/auth-url', 'admin');
    if (res.ok && res.url) {
      const popup = window.open(res.url, 'google-oauth', 'width=520,height=660');
      const poll = setInterval(() => {
        if (popup?.closed) {
          clearInterval(poll);
          setTimeout(refreshDriveStatus, 1000);
        }
      }, 800);
    } else {
      driveToast(res.message || 'OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env', false);
    }
  }

  async function disconnectDrive() {
    await api.post('/drive/disconnect', {}, 'admin');
    refreshDriveStatus();
    driveToast('Disconnected Google account.');
  }

  async function testDriveConnection() {
    const status = await refreshDriveStatus();
    if (!status.ok) return driveToast(status.message || 'Could not check Drive connection.', false);
    if (status.method === 'service_account') return driveToast(`Drive connection ready via Service Account${status.serviceAccountEmail ? `: ${status.serviceAccountEmail}` : ''}.`);
    if (status.method === 'oauth') return driveToast('Drive connection ready via your Google account.');
    if (status.method === 'api_key') return driveToast('Drive can browse public folders via API key. Use OAuth or share folders with the service account for private folders.');
    return driveToast('Drive is not connected yet. Add OAuth credentials or a service account in backend/.env.', false);
  }

  function extractFolderId(raw) {
    const m = raw.trim().match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return m ? m[1] : raw.trim();
  }

  async function browseDriveFolder() {
    if (!driveFolderId.trim()) return driveToast('Enter a Drive Folder ID.', false);
    const cleanId = extractFolderId(driveFolderId);
    setDriveFolderId(cleanId);
    setDriveLoading(true);
    const res = await api.get(`/drive/folder/${cleanId}`, 'admin');
    setDriveLoading(false);
    if (res.ok) {
      setDriveFiles(res.data);
      setDriveSyncMethod(res.method);
      driveToast(`Found ${res.data.length} files.`);
    } else driveToast(res.message || 'Failed to list folder.', false);
  }

  async function syncDriveToClassroom() {
    if (!form.classroomId) return driveToast('Select a classroom first.', false);
    if (!driveFolderId.trim()) return driveToast('Enter a Drive Folder ID.', false);
    const cleanId = extractFolderId(driveFolderId);
    setDriveFolderId(cleanId);
    setDriveLoading(true);
    const res = await api.post(`/admin/classrooms/${form.classroomId}/sync-drive`, { folderId: cleanId }, 'admin');
    setDriveLoading(false);
    if (res.ok) {
      driveToast(`✓ Synced ${res.data.synced} files from Drive.`);
      setDriveFiles(res.data.files || []);
      setDriveSyncMethod(res.data.method);
    } else driveToast(res.message || 'Sync failed.', false);
  }

  function addDriveFileToModule(file) {
    setAddingDriveFile(file);
    const displayTitle = file.displayTitle || file.name.replace(/^[\d.]+[_\s-]+/, '').replace(/\.[^/.]+$/, '').trim();
    setAddDriveForm({
      contentTitle: displayTitle,
      contentType: file.contentType || 'video',
      estimatedMins: '',
      completionRulePct: 80,
    });
  }

  async function confirmAddDriveContent(e) {
    e.preventDefault();
    if (!form.moduleId) return driveToast('Select a module to add this content to.', false);
    const res = await api.post(`/admin/modules/${form.moduleId}/contents`, {
      contentTitle: addDriveForm.contentTitle,
      contentType: addDriveForm.contentType,
      driveFileId: addingDriveFile.id,
      driveUrl: `https://drive.google.com/file/d/${addingDriveFile.id}/preview`,
      playerMode: 'Drive Preview',
      estimatedMins: addDriveForm.estimatedMins || 0,
      completionRulePct: addDriveForm.completionRulePct || 80,
    }, 'admin');
    if (res.ok) {
      driveToast(`✓ "${addDriveForm.contentTitle}" added to module.`);
      setAddingDriveFile(null);
      // Refresh contents
      api.get(`/admin/modules/${form.moduleId}/contents`, 'admin').then(r => r.ok && setContents(r.data));
    } else driveToast(res.message || 'Failed to add content.', false);
  }

  const isOAuthConnected = tokenStatus?.oauthConnected;
  const isServiceAccount = tokenStatus?.method === 'service_account';
  const hasAnyDriveAccess = tokenStatus?.hasToken;
  const serviceAccountEmail = tokenStatus?.serviceAccountEmail;

  // ============================================================
  // ==================== BROADCAST FUNCTIONS ====================
  // ============================================================

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function changeScope(scopeVal) {
    setForm(f => ({ ...f, scope: scopeVal, scopeValue: '', scopeValues: [] }));
    setSelectedEmployees([]); setPasteText(''); setPasteResult(null);
  }

  function toggleContent(contentId) {
    setF('selectedContentIds', form.selectedContentIds.includes(contentId)
      ? form.selectedContentIds.filter(id => id !== contentId)
      : [...form.selectedContentIds, contentId]);
  }

  function addEmployee(trainee) {
    if (!selectedEmployees.find(e => e.employeeId === trainee.employeeId)) {
      setSelectedEmployees(s => [...s, trainee]);
    }
    setEmpSearch(''); setEmpSearchResults([]);
  }

  function removeEmployee(empId) {
    setSelectedEmployees(s => s.filter(e => e.employeeId !== empId));
  }

  async function validatePaste() {
    const ids = pasteText.split(/[\n,;]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!ids.length) return;
    setValidateLoading(true);
    const res = await api.post('/admin/validate-employee-ids', { employeeIds: ids }, 'admin');
    setValidateLoading(false);
    if (res.ok) {
      setPasteResult(res);
      const newOnes = res.found.filter(f => !selectedEmployees.find(e => e.employeeId === f.employeeId));
      setSelectedEmployees(s => [...s, ...newOnes]);
    }
  }

  function addQuestion() { setQuestions(qs => [...qs, EMPTY_MCQ()]); }
  function removeQuestion(i) { setQuestions(qs => qs.filter((_, idx) => idx !== i)); }
  function setQ(i, k, v) { setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [k]: v } : q)); }

  async function handleUpload() {
    if (!uploadFile || !uploadTitle.trim()) return setMsg({ type: 'bad', text: 'File and title are required.' });
    if (!form.moduleId) return setMsg({ type: 'bad', text: 'Select a module before uploading.' });
    setUploading(true);
    const fd = new FormData();
    fd.append('file', uploadFile);
    fd.append('contentTitle', uploadTitle.trim());
    fd.append('contentOrder', String(contents.length + 1));
    const token = localStorage.getItem('lms_token_admin') || '';
    const res = await fetch(`/api/admin/modules/${form.moduleId}/contents`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
    }).then(r => r.json()).catch(() => ({ ok: false, message: 'Upload failed' }));
    setUploading(false);
    if (!res.ok) return setMsg({ type: 'bad', text: res.message || 'Upload failed.' });
    api.get(`/admin/modules/${form.moduleId}/contents`, 'admin').then(r => r.ok && setContents(r.data));
    setUploadFile(null); setUploadTitle(''); setUploadMode(false);
    setMsg({ type: 'ok', text: `"${uploadTitle}" uploaded and added to the module.` });
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.moduleId) return setMsg({ type: 'bad', text: 'Select a module.' });

    const isMultiScope = ['batch', 'process', 'branch'].includes(form.scope);
    const isBulk = form.scope === 'specific' || isMultiScope;

    if (form.scope !== 'company') {
      if (form.scope === 'individual' && !form.scopeValue.trim()) return setMsg({ type: 'bad', text: 'Enter an Employee ID.' });
      if (isMultiScope && form.scopeValues.length === 0) return setMsg({ type: 'bad', text: `Select at least one ${form.scope}.` });
      if (form.scope === 'specific' && selectedEmployees.length === 0) return setMsg({ type: 'bad', text: 'Add at least one employee.' });
    }

    setLoading(true); setMsg(null);

    const basePayload = {
      broadcastTitle: form.broadcastTitle.trim() || null,
      moduleId: form.moduleId,
      moduleName: form.moduleName,
      assignmentType: form.assignmentType,
      message: form.message || null,
      dueDate: form.dueDate || null,
      contentIds: form.selectedContentIds.length > 0 ? form.selectedContentIds : null,
    };

    let res;
    if (isBulk) {
      const bulkPayload = { ...basePayload };
      if (form.scope === 'specific') {
        bulkPayload.employeeIds = selectedEmployees.map(e => e.employeeId);
      } else {
        bulkPayload.scopeType = form.scope;
        bulkPayload.scopeValues = form.scopeValues;
      }
      res = await api.post('/admin/broadcast-module-bulk', bulkPayload, 'admin');
    } else {
      res = await api.post('/admin/broadcast-module', {
        ...basePayload,
        scope: form.scope,
        scopeValue: form.scope === 'company' ? 'ALL' : form.scopeValue.trim(),
      }, 'admin');
    }

    if (res.ok && mcqEnabled && mcqName.trim()) {
      const validQs = questions.filter(q => q.question.trim() && q.optionA.trim() && q.optionB.trim());
      if (validQs.length > 0) {
        const aRes = await api.post('/admin/assessments', {
          classroomId: form.classroomId, moduleId: form.moduleId,
          assessmentName: mcqName.trim(), passingPct: mcqPassPct,
          attemptLimit: mcqAttempts, timeLimitMins: mcqTimeMins,
          instructions: `Broadcast MCQ for: ${form.broadcastTitle || form.moduleName}`,
        }, 'admin');
        if (aRes.ok && aRes.data?.assessmentId) {
          await api.post(`/admin/assessments/${aRes.data.assessmentId}/questions/upload`, {
            questions: validQs.map(q => ({
              question: q.question, option_a: q.optionA, option_b: q.optionB,
              option_c: q.optionC || '', option_d: q.optionD || '',
              correct: q.correct, marks: q.marks || 1, difficulty: 'Medium', explanation: '',
            })),
          }, 'admin');
        }
      }
    }

    setLoading(false);
    if (res.ok) {
      const scopeLabel = SCOPE_OPTIONS.find(s => s.value === form.scope)?.label;
      let successText = res.message || `Module "${form.moduleName}" assigned to ${scopeLabel}.`;
      if (mcqEnabled && mcqName.trim()) successText += ' + MCQ created.';
      setMsg({ type: 'ok', text: successText });
      setForm(f => ({ ...f, broadcastTitle: '', scopeValue: '', scopeValues: [], message: '', dueDate: '', selectedContentIds: [] }));
      setSelectedEmployees([]); setPasteText(''); setPasteResult(null);
      setQuestions([EMPTY_MCQ()]); setMcqEnabled(false); setMcqName('');
    } else {
      setMsg({ type: 'bad', text: res.message || 'Broadcast failed.' });
    }
  }

  const isMultiScope = ['batch', 'process', 'branch'].includes(form.scope);
  const stepBase = form.scope === 'company' ? 0 : 1;

  // ============================================================
  // ==================== RENDER ====================
  // ============================================================

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 4,
        }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>📢</span>
          <h2 style={{
            fontSize: 20,
            fontWeight: 900,
            color: 'var(--ink)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Broadcast / Refresher Assignment
          </h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Assign a module to any audience — select multiple batches, processes, or branches, or pick specific employees by search or paste.
          Assignments appear immediately in the trainee's <b>Assigned</b> tab.
        </p>
      </div>

      {/* Toast Messages */}
      {msg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: 16,
          background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: 13,
            color: msg.type === 'ok' ? '#22c55e' : '#ef4444',
          }}>
            {msg.type === 'ok' ? '✅' : '❌'} {msg.text}
          </span>
          <button
            onClick={() => setMsg(null)}
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

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        
        {/* ============================================================ */}
        {/* ========== LEFT PANEL - BROADCAST FORM ========== */}
        {/* ============================================================ */}
        <div style={{ 
          background: 'var(--card-solid)', 
          borderRadius: 16, 
          border: '1.5px solid var(--line)', 
          padding: '24px 26px', 
          boxShadow: 'var(--shadow-sm)' 
        }}>
          <form onSubmit={submit}>

            {/* Broadcast Title */}
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Broadcast Title <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <input 
                className="input" 
                placeholder="e.g. Week 3 Refresher — Banking" 
                value={form.broadcastTitle}
                onChange={e => setF('broadcastTitle', e.target.value)} 
                maxLength={120} 
              />
            </div>

            {/* Step 1: Scope */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ 
                fontSize: 12, 
                fontWeight: 700, 
                color: 'var(--muted)', 
                textTransform: 'uppercase', 
                letterSpacing: .5, 
                marginBottom: 10 
              }}>
                Step 1 — Target Audience
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 8 
              }}>
                {SCOPE_OPTIONS.map(opt => (
                  <div 
                    key={opt.value} 
                    onClick={() => changeScope(opt.value)} 
                    style={{
                      border: `2px solid ${form.scope === opt.value ? 'var(--brand)' : 'var(--line)'}`,
                      borderRadius: 10, 
                      padding: '10px 12px', 
                      cursor: 'pointer',
                      background: form.scope === opt.value ? 'rgba(29,78,216,.08)' : 'var(--card)',
                      transition: 'border-color .15s',
                    }}
                  >
                    <div style={{ 
                      fontSize: 12, 
                      fontWeight: 700, 
                      color: form.scope === opt.value ? 'var(--brand)' : 'var(--ink)' 
                    }}>
                      {opt.label}
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      color: 'var(--muted)', 
                      marginTop: 3, 
                      lineHeight: 1.4 
                    }}>
                      {opt.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Scope selector */}
            {form.scope !== 'company' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 700, 
                  color: 'var(--muted)', 
                  textTransform: 'uppercase', 
                  letterSpacing: .5, 
                  marginBottom: 10 
                }}>
                  Step 2 — Pick Target
                </div>

                {/* Individual */}
                {form.scope === 'individual' && (
                  <div className="field" style={{ margin: 0 }}>
                    <label>Employee ID</label>
                    <input 
                      className="input" 
                      placeholder="e.g. EMP1001" 
                      value={form.scopeValue}
                      onChange={e => setF('scopeValue', e.target.value)} 
                      required 
                    />
                  </div>
                )}

                {/* Multi-select: Batch / Process / Branch */}
                {isMultiScope && (
                  <div>
                    <div style={{ 
                      fontSize: 12, 
                      color: 'var(--muted)', 
                      marginBottom: 8 
                    }}>
                      Click to select multiple. <b style={{ color: 'var(--brand)' }}>{form.scopeValues.length} selected.</b>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 6, 
                      maxHeight: 200, 
                      overflowY: 'auto', 
                      padding: 2 
                    }}>
                      {(form.scope === 'batch' ? batches.map(b => ({ value: b.batchNo, label: `${b.batchNo}${b.batchName ? ' — ' + b.batchName : ''}` }))
                        : form.scope === 'process' ? processes.map(p => ({ value: p, label: p }))
                        : branches.map(b => ({ value: b, label: b }))
                      ).map(opt => {
                        const sel = form.scopeValues.includes(opt.value);
                        return (
                          <div 
                            key={opt.value} 
                            onClick={() => setF('scopeValues', toggleItem(form.scopeValues, opt.value))}
                            style={{
                              padding: '6px 12px', 
                              borderRadius: 20, 
                              fontSize: 12, 
                              cursor: 'pointer', 
                              userSelect: 'none',
                              border: `1.5px solid ${sel ? 'var(--brand)' : 'var(--line)'}`,
                              background: sel ? 'rgba(29,78,216,.1)' : 'var(--card)',
                              color: sel ? 'var(--brand)' : 'var(--ink)', 
                              fontWeight: sel ? 700 : 400,
                            }}
                          >
                            {sel ? '✓ ' : ''}{opt.label}
                          </div>
                        );
                      })}
                    </div>
                    {form.scopeValues.length > 0 && (
                      <button 
                        type="button" 
                        style={{ 
                          fontSize: 11, 
                          color: 'var(--muted)', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          marginTop: 6, 
                          padding: 0 
                        }}
                        onClick={() => setF('scopeValues', [])}
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}

                {/* Specific Employees */}
                {form.scope === 'specific' && (
                  <div>
                    {/* Search panel */}
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                      <input 
                        className="input" 
                        placeholder="Search by name or Employee ID…"
                        value={empSearch} 
                        onChange={e => setEmpSearch(e.target.value)} 
                      />
                      {empSearchLoading && (
                        <span style={{ 
                          position: 'absolute', 
                          right: 10, 
                          top: '50%', 
                          transform: 'translateY(-50%)', 
                          fontSize: 12, 
                          color: 'var(--muted)' 
                        }}>
                          ⟳
                        </span>
                      )}
                      {empSearchResults.length > 0 && (
                        <div style={{
                          position: 'absolute', 
                          top: '100%', 
                          left: 0, 
                          right: 0, 
                          zIndex: 20,
                          background: 'var(--card-solid)', 
                          border: '1.5px solid var(--line)', 
                          borderRadius: 10,
                          boxShadow: 'var(--shadow-sm)', 
                          maxHeight: 220, 
                          overflowY: 'auto', 
                          marginTop: 4,
                        }}>
                          {empSearchResults.map(t => {
                            const already = selectedEmployees.some(e => e.employeeId === t.employeeId);
                            return (
                              <div 
                                key={t.employeeId} 
                                style={{
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 10, 
                                  padding: '9px 14px',
                                  borderBottom: '1px solid var(--line)', 
                                  cursor: already ? 'default' : 'pointer',
                                  opacity: already ? .5 : 1,
                                }} 
                                onClick={() => !already && addEmployee(t)}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700 }}>{t.traineeName || t.employeeId}</div>
                                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.employeeId} · {t.batchNo} · {t.process}</div>
                                </div>
                                {already
                                  ? <span style={{ fontSize: 11, color: 'var(--ok)', fontWeight: 700 }}>✓ Added</span>
                                  : <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 700 }}>+ Add</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Paste panel toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <button 
                        type="button" 
                        className="btn small secondary" 
                        style={{ fontSize: 11 }}
                        onClick={() => setPasteMode(v => !v)}
                      >
                        {pasteMode ? 'Hide Paste Panel' : '📋 Paste Employee IDs'}
                      </button>
                      {selectedEmployees.length > 0 && (
                        <button 
                          type="button" 
                          style={{ 
                            fontSize: 11, 
                            color: 'var(--danger)', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer' 
                          }}
                          onClick={() => { setSelectedEmployees([]); setPasteResult(null); }}
                        >
                          Clear all ({selectedEmployees.length})
                        </button>
                      )}
                    </div>

                    {pasteMode && (
                      <div style={{ 
                        background: 'var(--card)', 
                        borderRadius: 10, 
                        border: '1px solid var(--line)', 
                        padding: 12, 
                        marginBottom: 10 
                      }}>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                          Paste employee IDs — one per line, or comma/semicolon separated
                        </div>
                        <textarea 
                          className="input" 
                          rows={4} 
                          style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
                          placeholder={'EMP001\nEMP002\nEMP003'} 
                          value={pasteText}
                          onChange={e => { setPasteText(e.target.value); setPasteResult(null); }} 
                        />
                        <button 
                          type="button" 
                          className="btn small" 
                          style={{ marginTop: 8 }}
                          onClick={validatePaste} 
                          disabled={validateLoading || !pasteText.trim()}
                        >
                          {validateLoading ? 'Validating…' : 'Validate & Add'}
                        </button>
                        {pasteResult && (
                          <div style={{ marginTop: 8, fontSize: 12 }}>
                            <span style={{ color: 'var(--ok)', fontWeight: 700 }}>✓ {pasteResult.found.length} found & added</span>
                            {pasteResult.notFound.length > 0 && (
                              <span style={{ color: 'var(--danger)', marginLeft: 12, fontWeight: 700 }}>
                                ✗ {pasteResult.notFound.length} not found: {pasteResult.notFound.slice(0, 5).join(', ')}{pasteResult.notFound.length > 5 ? '…' : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selected employees chips */}
                    {selectedEmployees.length > 0 && (
                      <div style={{ 
                        background: 'var(--card)', 
                        borderRadius: 10, 
                        border: '1px solid var(--line)', 
                        padding: '10px 12px' 
                      }}>
                        <div style={{ 
                          fontSize: 11, 
                          fontWeight: 700, 
                          color: 'var(--muted)', 
                          marginBottom: 8 
                        }}>
                          SELECTED — {selectedEmployees.length} employee(s)
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {selectedEmployees.map(e => (
                            <div 
                              key={e.employeeId} 
                              style={{
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 5, 
                                padding: '4px 10px',
                                background: 'rgba(29,78,216,.08)', 
                                borderRadius: 20,
                                border: '1px solid rgba(29,78,216,.2)', 
                                fontSize: 12,
                              }}
                            >
                              <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{e.employeeId}</span>
                              {e.traineeName && <span style={{ color: 'var(--muted)' }}>{e.traineeName}</span>}
                              <button 
                                type="button" 
                                onClick={() => removeEmployee(e.employeeId)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: 'pointer', 
                                  color: 'var(--muted)', 
                                  padding: 0, 
                                  fontSize: 13, 
                                  lineHeight: 1 
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Module */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ 
                fontSize: 12, 
                fontWeight: 700, 
                color: 'var(--muted)', 
                textTransform: 'uppercase', 
                letterSpacing: .5, 
                marginBottom: 10 
              }}>
                Step {2 + stepBase} — Select Module
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>Classroom</label>
                  <select 
                    className="select" 
                    value={form.classroomId} 
                    onChange={e => setF('classroomId', e.target.value)} 
                    required
                  >
                    <option value="">Select classroom…</option>
                    {classrooms.map(c => <option key={c.classroomId} value={c.classroomId}>{c.classroomName}</option>)}
                  </select>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Module</label>
                  <select 
                    className="select" 
                    value={form.moduleId} 
                    disabled={!form.classroomId}
                    onChange={e => { 
                      const m = modules.find(m => m.moduleId === e.target.value); 
                      setF('moduleId', e.target.value); 
                      setF('moduleName', m?.moduleTitle || ''); 
                    }} 
                    required
                  >
                    <option value="">{form.classroomId ? 'Select module…' : 'Select classroom first'}</option>
                    {modules.map(m => <option key={m.moduleId} value={m.moduleId}>Day {m.dayNo} — {m.moduleTitle}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Content picker */}
            {form.moduleId && contents.length > 0 && (
              <div style={{ 
                marginBottom: 20, 
                background: 'var(--card)', 
                borderRadius: 10, 
                border: '1px solid var(--line)', 
                padding: '14px 16px' 
              }}>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 700, 
                  color: 'var(--muted)', 
                  textTransform: 'uppercase', 
                  letterSpacing: .4, 
                  marginBottom: 10 
                }}>
                  Content from Module <span style={{ fontWeight: 400 }}>(optional — leave blank for all)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {contents.map(c => (
                    <label key={c.contentId} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10, 
                      cursor: 'pointer', 
                      fontSize: 13 
                    }}>
                      <input 
                        type="checkbox" 
                        checked={form.selectedContentIds.includes(c.contentId)}
                        onChange={() => toggleContent(c.contentId)}
                        style={{ width: 15, height: 15, accentColor: 'var(--brand)' }} 
                      />
                      <span style={{ flex: 1 }}>{c.contentTitle}</span>
                      <span style={{ 
                        fontSize: 11, 
                        color: 'var(--muted)', 
                        background: 'var(--card-solid)', 
                        borderRadius: 4, 
                        padding: '2px 6px' 
                      }}>
                        {c.contentType}
                      </span>
                    </label>
                  ))}
                </div>
                {form.selectedContentIds.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 8 }}>
                    {form.selectedContentIds.length} of {contents.length} selected
                  </div>
                )}
              </div>
            )}

            {/* Direct upload */}
            {form.moduleId && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 700, 
                    color: 'var(--muted)', 
                    textTransform: 'uppercase', 
                    letterSpacing: .4 
                  }}>
                    Upload New Content
                  </div>
                  <button 
                    type="button" 
                    className="btn small secondary" 
                    style={{ fontSize: 11 }}
                    onClick={() => setUploadMode(v => !v)}
                  >
                    {uploadMode ? 'Cancel' : '+ Upload File'}
                  </button>
                </div>
                {uploadMode && (
                  <div style={{ 
                    background: 'var(--card)', 
                    borderRadius: 10, 
                    border: '1px dashed var(--line)', 
                    padding: 16 
                  }}>
                    <div className="field" style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12 }}>Content Title</label>
                      <input 
                        className="input" 
                        placeholder="e.g. Refresher Deck Week 3" 
                        value={uploadTitle} 
                        onChange={e => setUploadTitle(e.target.value)} 
                      />
                    </div>
                    <div 
                      onClick={() => fileRef.current?.click()} 
                      style={{
                        border: '2px dashed var(--line)', 
                        borderRadius: 8, 
                        padding: '20px 16px',
                        textAlign: 'center', 
                        cursor: 'pointer', 
                        fontSize: 13, 
                        color: 'var(--muted)',
                        background: uploadFile ? 'rgba(22,163,74,.06)' : 'var(--card)',
                      }}
                    >
                      {uploadFile 
                        ? <span style={{ color: 'var(--ok)', fontWeight: 700 }}>📎 {uploadFile.name}</span>
                        : <span>Click to select file (PDF, video, PPT, DOC, image)</span>}
                    </div>
                    <input 
                      ref={fileRef} 
                      type="file" 
                      accept="video/*,.pdf,.pptx,.ppt,.docx,.doc,.xlsx,.jpg,.jpeg,.png,.gif"
                      style={{ display: 'none' }} 
                      onChange={e => setUploadFile(e.target.files[0] || null)} 
                    />
                    <button 
                      type="button" 
                      className="btn small" 
                      style={{ marginTop: 10 }}
                      onClick={handleUpload} 
                      disabled={uploading || !uploadFile}
                    >
                      {uploading ? 'Uploading…' : '⬆ Upload'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* ========== DRIVE SYNC INTEGRATION ========== */}
            {/* ============================================================ */}
            {form.moduleId && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 10, 
                  marginBottom: 10 
                }}>
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 700, 
                    color: 'var(--muted)', 
                    textTransform: 'uppercase', 
                    letterSpacing: .4 
                  }}>
                    Google Drive Sync
                  </div>
                  <button 
                    type="button" 
                    className="btn small secondary" 
                    style={{ fontSize: 11 }}
                    onClick={() => setShowDrivePanel(v => !v)}
                  >
                    {showDrivePanel ? 'Hide' : '☁️ Open Drive'}
                  </button>
                  <span style={{ 
                    fontSize: 10, 
                    color: hasAnyDriveAccess ? 'var(--ok)' : 'var(--warn)',
                    fontWeight: 600,
                  }}>
                    {hasAnyDriveAccess ? '✅ Connected' : '⚠ Not connected'}
                  </span>
                </div>

                {showDrivePanel && (
                  <div style={{ 
                    background: 'var(--card)', 
                    borderRadius: 12, 
                    border: '1px solid var(--line)', 
                    padding: 16,
                  }}>
                    {/* Drive Connection Status */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 12,
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: hasAnyDriveAccess ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)',
                      border: `1px solid ${hasAnyDriveAccess ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                          {isServiceAccount && '🔐 Service Account'}
                          {isOAuthConnected && '👤 Your Google Account'}
                          {!hasAnyDriveAccess && '⚠ Not Connected'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {isServiceAccount && serviceAccountEmail}
                          {isOAuthConnected && 'Connected — can access any folder you can view'}
                          {!hasAnyDriveAccess && 'Connect your Google account to sync any folder'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isOAuthConnected ? (
                          <button 
                            type="button" 
                            className="btn small secondary" 
                            style={{ fontSize: 10 }}
                            onClick={disconnectDrive}
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            className="btn small" 
                            style={{ fontSize: 10 }}
                            onClick={connectOAuth}
                          >
                            Connect Google Account
                          </button>
                        )}
                        <button 
                          type="button" 
                          className="btn small secondary" 
                          style={{ fontSize: 10 }}
                          onClick={testDriveConnection}
                        >
                          Test
                        </button>
                      </div>
                    </div>

                    {/* Service Account Email (if applicable) */}
                    {isServiceAccount && serviceAccountEmail && (
                      <div style={{
                        marginBottom: 12,
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        fontSize: 11,
                      }}>
                        <b>Share folders with:</b>
                        <code style={{
                          display: 'block',
                          marginTop: 4,
                          fontSize: 12,
                          color: '#60a5fa',
                          background: 'rgba(29,78,216,.15)',
                          borderRadius: 6,
                          padding: '6px 10px',
                          wordBreak: 'break-all',
                        }}>
                          {serviceAccountEmail}
                        </code>
                      </div>
                    )}

                    {/* Drive Folder Input */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <input
                        className="input"
                        placeholder="Drive Folder ID or URL"
                        value={driveFolderId}
                        onChange={e => setDriveFolderId(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button 
                        type="button" 
                        className="btn small secondary" 
                        onClick={browseDriveFolder} 
                        disabled={driveLoading || !driveFolderId.trim()}
                      >
                        {driveLoading ? '…' : '🔍 Browse'}
                      </button>
                      <button 
                        type="button" 
                        className="btn small" 
                        onClick={syncDriveToClassroom} 
                        disabled={driveLoading || !form.classroomId || !driveFolderId.trim()}
                      >
                        {driveLoading ? 'Syncing…' : '⟳ Sync'}
                      </button>
                    </div>

                    {/* Drive Messages */}
                    {driveMsg.text && (
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        marginBottom: 10,
                        background: driveMsg.ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${driveMsg.ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        fontSize: 12,
                        color: driveMsg.ok ? '#22c55e' : '#ef4444',
                      }}>
                        {driveMsg.ok ? '✅' : '❌'} {driveMsg.text}
                      </div>
                    )}

                    {/* Drive Files */}
                    {driveFiles.length > 0 && (
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: 8,
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                            📁 {driveFiles.length} files found
                          </span>
                          {driveSyncMethod && (
                            <span style={{ 
                              fontSize: 10, 
                              color: 'var(--muted)', 
                              background: 'var(--card-solid)',
                              padding: '2px 8px',
                              borderRadius: 4,
                            }}>
                              via {METHOD_LABEL[driveSyncMethod] || driveSyncMethod}
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          maxHeight: 200, 
                          overflowY: 'auto',
                          border: '1px solid var(--line)',
                          borderRadius: 8,
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
                                <th style={{ padding: '6px 10px', textAlign: 'left' }}>Name</th>
                                <th style={{ padding: '6px 10px', textAlign: 'left' }}>Type</th>
                                <th style={{ padding: '6px 10px', textAlign: 'center' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {driveFiles.map(f => (
                                <tr key={f.id} style={{ borderBottom: '1px solid var(--line)' }}>
                                  <td style={{ padding: '6px 10px' }}>
                                    <div style={{ fontWeight: 500 }}>{f.displayTitle || f.name.replace(/\.[^/.]+$/, '')}</div>
                                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{f.name}</div>
                                  </td>
                                  <td style={{ padding: '6px 10px' }}>
                                    <ContentTypeBadge type={normalizeType(f)} />
                                  </td>
                                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                      <a 
                                        href={f.viewUrl || `https://drive.google.com/file/d/${f.id}/view`} 
                                        target="_blank" 
                                        rel="noopener" 
                                        style={{
                                          padding: '2px 8px',
                                          borderRadius: 4,
                                          fontSize: 10,
                                          background: 'var(--card-solid)',
                                          border: '1px solid var(--line)',
                                          color: 'var(--ink)',
                                          textDecoration: 'none',
                                        }}
                                      >
                                        View ↗
                                      </a>
                                      <button 
                                        type="button"
                                        onClick={() => addDriveFileToModule(f)}
                                        style={{
                                          padding: '2px 8px',
                                          borderRadius: 4,
                                          fontSize: 10,
                                          border: 'none',
                                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                          color: '#fff',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        + Add
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Assignment details */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ 
                fontSize: 12, 
                fontWeight: 700, 
                color: 'var(--muted)', 
                textTransform: 'uppercase', 
                letterSpacing: .5, 
                marginBottom: 10 
              }}>
                Step {3 + stepBase} — Assignment Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>Assignment Type</label>
                  <select 
                    className="select" 
                    value={form.assignmentType} 
                    onChange={e => setF('assignmentType', e.target.value)}
                  >
                    <option value="Mandatory">Mandatory</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Due Date (optional)</label>
                  <input 
                    className="input" 
                    type="date" 
                    value={form.dueDate} 
                    onChange={e => setF('dueDate', e.target.value)} 
                  />
                </div>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Message to trainees (optional)</label>
                <input 
                  className="input" 
                  placeholder="e.g. Please complete before certification" 
                  value={form.message}
                  onChange={e => setF('message', e.target.value)} 
                />
              </div>
            </div>

            {/* Optional MCQ */}
            <div style={{ 
              marginBottom: 24, 
              border: `2px solid ${mcqEnabled ? 'var(--brand)' : 'var(--line)'}`, 
              borderRadius: 12, 
              overflow: 'hidden' 
            }}>
              <div 
                onClick={() => setMcqEnabled(v => !v)} 
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  padding: '12px 16px', 
                  cursor: 'pointer',
                  background: mcqEnabled ? 'rgba(29,78,216,.06)' : 'var(--card)',
                }}
              >
                <div style={{
                  width: 22, 
                  height: 22, 
                  borderRadius: 6,
                  border: `2px solid ${mcqEnabled ? 'var(--brand)' : 'var(--line)'}`,
                  background: mcqEnabled ? 'var(--brand)' : 'transparent',
                  display: 'grid', 
                  placeItems: 'center', 
                  flexShrink: 0,
                }}>
                  {mcqEnabled && <span style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Attach MCQ Assessment (optional)</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    Create a new MCQ for this broadcast using the same format as existing assessments.
                  </div>
                </div>
              </div>

              {mcqEnabled && (
                <div style={{ padding: '16px 18px', borderTop: '1px solid var(--line)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div className="field" style={{ margin: 0 }}>
                      <label style={{ fontSize: 11 }}>Assessment Name</label>
                      <input 
                        className="input" 
                        placeholder="e.g. Week 3 MCQ" 
                        value={mcqName} 
                        onChange={e => setMcqName(e.target.value)} 
                      />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label style={{ fontSize: 11 }}>Pass %</label>
                      <input 
                        className="input" 
                        type="number" 
                        min={1} 
                        max={100} 
                        value={mcqPassPct} 
                        onChange={e => setMcqPassPct(Number(e.target.value))} 
                      />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label style={{ fontSize: 11 }}>Attempts</label>
                      <input 
                        className="input" 
                        type="number" 
                        min={1} 
                        max={10} 
                        value={mcqAttempts} 
                        onChange={e => setMcqAttempts(Number(e.target.value))} 
                      />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label style={{ fontSize: 11 }}>Time (mins)</label>
                      <input 
                        className="input" 
                        type="number" 
                        min={1} 
                        value={mcqTimeMins} 
                        onChange={e => setMcqTimeMins(Number(e.target.value))} 
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 10 }}>Questions</div>
                  {questions.map((q, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        background: 'var(--card)', 
                        borderRadius: 10, 
                        border: '1px solid var(--line)', 
                        padding: '12px 14px', 
                        marginBottom: 10 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>Q{i + 1}</span>
                        {questions.length > 1 && (
                          <button 
                            type="button" 
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              color: 'var(--danger)', 
                              fontSize: 13 
                            }}
                            onClick={() => removeQuestion(i)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <input 
                        className="input" 
                        style={{ marginBottom: 8 }} 
                        placeholder="Question text"
                        value={q.question} 
                        onChange={e => setQ(i, 'question', e.target.value)} 
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <div key={opt} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', width: 14 }}>{opt}</span>
                            <input 
                              className="input" 
                              placeholder={`Option ${opt}${opt === 'C' || opt === 'D' ? ' (optional)' : ''}`}
                              value={q[`option${opt}`]} 
                              onChange={e => setQ(i, `option${opt}`, e.target.value)} 
                              style={{ flex: 1 }} 
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Correct:</label>
                          <select 
                            className="select" 
                            style={{ width: 70 }} 
                            value={q.correct} 
                            onChange={e => setQ(i, 'correct', e.target.value)}
                          >
                            {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Marks:</label>
                          <input 
                            className="input" 
                            type="number" 
                            style={{ width: 60 }} 
                            min={1} 
                            value={q.marks}
                            onChange={e => setQ(i, 'marks', Number(e.target.value))} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn small secondary" onClick={addQuestion}>+ Add Question</button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn" 
              style={{ width: '100%', justifyContent: 'center' }} 
              disabled={loading}
            >
              {loading ? 'Broadcasting…' : `📢 Broadcast to ${SCOPE_OPTIONS.find(s => s.value === form.scope)?.label}`}
            </button>
          </form>
        </div>

        {/* ============================================================ */}
        {/* ========== RIGHT PANEL - SIDEBAR ========== */}
        {/* ============================================================ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Scope Guide */}
          <div style={{ 
            background: 'var(--card-solid)', 
            borderRadius: 14, 
            border: '1.5px solid var(--line)', 
            padding: '18px 20px', 
            boxShadow: 'var(--shadow-sm)' 
          }}>
            <div style={{ 
              fontSize: 12, 
              fontWeight: 700, 
              color: 'var(--muted)', 
              textTransform: 'uppercase', 
              letterSpacing: .5, 
              marginBottom: 12 
            }}>
              Scope Guide
            </div>
            {[
              ['📢', 'Entire Company', 'Every active trainee'],
              ['🌿', 'Branch(es)', 'Select one or multiple branches'],
              ['⚙️', 'Process(es)', 'Select one or multiple processes'],
              ['🏢', 'Batch(es)', 'Select one or multiple batches'],
              ['👤', 'Individual', 'One trainee by Emp ID'],
              ['🎯', 'Specific Employees', 'Search + add, or paste a list of IDs'],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* What trainees see */}
          <div style={{ 
            background: 'rgba(29,78,216,.06)', 
            borderRadius: 12, 
            border: '1px solid rgba(29,78,216,.15)', 
            padding: '14px 16px' 
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', marginBottom: 6 }}>
              What trainees see
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
              Assigned modules appear immediately in the <b style={{ color: 'var(--ink)' }}>Assigned</b> tab on next page load.
              Multi-scope broadcasts create one individual record per matched trainee.
            </p>
          </div>

          {/* Drive Quick Status */}
          <div style={{ 
            background: hasAnyDriveAccess ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)',
            borderRadius: 12, 
            border: `1px solid ${hasAnyDriveAccess ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
            padding: '14px 16px' 
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
              ☁️ Drive Status
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {isOAuthConnected && '✅ Connected via OAuth'}
              {isServiceAccount && `✅ Service Account: ${serviceAccountEmail?.slice(0, 20)}…`}
              {!hasAnyDriveAccess && '⚠ Not connected — click "Open Drive" above'}
            </div>
            {hasAnyDriveAccess && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {driveFiles.length > 0 ? `${driveFiles.length} files loaded` : 'Browse a folder to see files'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ========== ADD DRIVE FILE MODAL ========== */}
      {/* ============================================================ */}
      {addingDriveFile && (
        <div 
          className="modal-overlay" 
          onClick={e => e.target === e.currentTarget && setAddingDriveFile(null)}
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
          <div className="modal-box" style={{ 
            background: 'var(--card-solid)',
            borderRadius: '20px',
            maxWidth: 460,
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
                📎 Add Drive File to Module
              </b>
              <button 
                className="btn small secondary" 
                onClick={() => setAddingDriveFile(null)}
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
                background: 'var(--card)',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
                border: '1px solid var(--line)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                  {addingDriveFile.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
                  ID: {addingDriveFile.id}
                </div>
              </div>
              <form onSubmit={confirmAddDriveContent}>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label>Content Title *</label>
                  <input 
                    className="input" 
                    value={addDriveForm.contentTitle} 
                    onChange={e => setAddDriveForm(p => ({ ...p, contentTitle: e.target.value }))} 
                    required 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Content Type</label>
                    <select 
                      className="select" 
                      value={addDriveForm.contentType} 
                      onChange={e => setAddDriveForm(p => ({ ...p, contentType: e.target.value }))}
                    >
                      {['video', 'pdf', 'ppt', 'doc', 'link'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Est. Minutes</label>
                    <input 
                      className="input" 
                      type="number" 
                      min="0" 
                      value={addDriveForm.estimatedMins} 
                      onChange={e => setAddDriveForm(p => ({ ...p, estimatedMins: e.target.value }))} 
                    />
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 16 }}>
                  <label>Completion Rule %</label>
                  <input 
                    className="input" 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={addDriveForm.completionRulePct} 
                    onChange={e => setAddDriveForm(p => ({ ...p, completionRulePct: e.target.value }))} 
                  />
                </div>
                <button 
                  className="btn" 
                  type="submit" 
                  style={{ width: '100%' }}
                >
                  ➕ Add to Module
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}