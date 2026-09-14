import { useEffect, useMemo, useState } from 'react';
import { api, uploadFile } from '../../utils/api.js';

// ============================================================
// ==================== COMMON HELPERS ====================
// ============================================================

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function date(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

function StatusBadge({ status }) {
  const isLinked = status === 'linked';
  const isReady = status === 'READY';
  const isGap = status === 'GAP';
  
  if (isLinked) {
    return (
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
        ✅ Linked
      </span>
    );
  }
  if (status === 'unlinked') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: '99px',
        background: 'rgba(245,158,11,0.12)',
        color: '#f59e0b',
        fontSize: 11,
        fontWeight: 600,
      }}>
        ⚠️ Not Linked
      </span>
    );
  }
  
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

function SourceBadge({ source }) {
  const sources = {
    local: { icon: '💻', color: '#6366f1' },
    url: { icon: '🔗', color: '#22c55e' },
    drive: { icon: '☁️', color: '#f59e0b' },
  };
  const config = sources[source] || sources.local;
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 10px',
      borderRadius: '99px',
      background: 'var(--card)',
      border: '1px solid var(--line)',
      fontSize: 11,
      color: config.color,
      fontWeight: 500,
    }}>
      {config.icon} {source}
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

function ScopeBadge({ scopeType, scopeValue }) {
  const types = {
    All: { icon: '🌍', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    Process: { icon: '⚙️', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    LOB: { icon: '🏢', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    Branch: { icon: '📍', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    Designation: { icon: '👤', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  };
  const config = types[scopeType] || types.All;
  
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
      {config.icon} {scopeType}{scopeValue && scopeValue !== 'All' ? `: ${scopeValue}` : ''}
    </span>
  );
}

function AssignmentTypeBadge({ type }) {
  const isMandatory = type === 'Mandatory';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 10px',
      borderRadius: '99px',
      background: isMandatory ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
      color: isMandatory ? '#ef4444' : '#6366f1',
      fontSize: 11,
      fontWeight: 600,
    }}>
      {isMandatory ? '🔴' : '🔵'} {type}
    </span>
  );
}

// ============================================================
// ==================== CSV PARSER ====================
// ============================================================

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

// ============================================================
// ==================== INDEPENDENT MODULES HELPERS ====================
// ============================================================

const emptyModule = { moduleName: '', category: '', process: '', lob: '', description: '', estimatedMins: 0 };
const emptyRule = { moduleId: '', ruleName: '', scopeType: 'All', scopeValue: '', assignmentType: 'Mandatory', message: '', dueDays: 0 };

// ============================================================
// ==================== CONTENT REPOSITORY HELPERS ====================
// ============================================================

const emptyRepoForm = {
  title: '', contentType: 'document', category: '', subCategory: '', process: '', lob: '', tags: '', sourceType: 'local',
  directMediaUrl: '', localFilePath: '', driveFileId: '', driveUrl: '', playerMode: 'Auto', estimatedMins: 0, completionRulePct: 80, description: '',
};
const emptyUpload = { title: '', contentType: '', category: '', subCategory: '', process: '', lob: '', tags: '', description: '', estimatedMins: 0, completionRulePct: 80, file: null };

// ============================================================
// ==================== QUESTIONS HELPERS ====================
// ============================================================

const CSV_TEMPLATE = 'question,option_a,option_b,option_c,option_d,correct,marks,difficulty,explanation\nWhat does KYC stand for?,Know Your Customer,Keep Your Cash,Know Your Compliance,Key Year Check,A,1,Easy,KYC = Know Your Customer\n';

// ============================================================
// ==================== MAIN COMPONENT ====================
// ============================================================

export default function AdminDashboard() {
  // ---- MAIN TAB STATE ----
  const [mainTab, setMainTab] = useState('repository'); // 'repository' | 'questions' | 'modules' | 'evidence'

  // ---- SHARED STATE ----
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ============================================================
  // ==================== CONTENT REPOSITORY STATE ====================
  // ============================================================
  
  const [repoQuery, setRepoQuery] = useState('');
  const [repoItems, setRepoItems] = useState([]);
  const [repoForm, setRepoForm] = useState(emptyRepoForm);
  const [uploadForm, setUploadForm] = useState(emptyUpload);
  const [editRepoItem, setEditRepoItem] = useState(null);
  const [repoTab, setRepoTab] = useState('upload');

  async function loadRepo() {
    setLoading(true); setMsg('');
    const res = await api.get(`/admin/content-repository?q=${encodeURIComponent(repoQuery)}`, 'admin');
    setLoading(false);
    if (res.ok) setRepoItems(res.data || []);
    else setMsg(res.message || 'Unable to load content repository.');
  }

  async function saveRepoLink(e) {
    e.preventDefault(); setSaving(true); setMsg('');
    const res = await api.post('/admin/content-repository', repoForm, 'admin');
    setSaving(false);
    if (!res.ok) return setMsg(res.message || 'Unable to save repository content.');
    setMsg(`✓ ${res.message || 'Repository content saved.'}`); setRepoForm(emptyRepoForm); loadRepo();
  }

  async function uploadRepoFile(e) {
    e.preventDefault();
    if (!uploadForm.file) return setMsg('Please choose a local file.');
    setSaving(true); setMsg('');
    const fd = new FormData();
    Object.entries(uploadForm).forEach(([k, v]) => { if (k !== 'file' && v !== undefined && v !== null) fd.append(k, v); });
    fd.append('file', uploadForm.file);
    const res = await uploadFile('/admin/content-repository/upload', fd, 'admin');
    setSaving(false);
    if (!res.ok) return setMsg(res.message || 'Unable to upload file.');
    setMsg(`✓ ${res.message || 'Repository file uploaded.'}`); setUploadForm(emptyUpload); loadRepo();
  }

  async function archiveRepoItem(repositoryContentId) {
    if (!window.confirm('Archive this repository item? Classroom content will not be disturbed.')) return;
    const res = await api.delete(`/admin/content-repository/${repositoryContentId}`, 'admin');
    setMsg(res.ok ? '✓ Repository item archived.' : (res.message || 'Unable to archive.')); loadRepo();
  }

  function openEditRepo(item) {
    setEditRepoItem({
      repositoryContentId: item.repository_content_id,
      title: item.title || '',
      contentType: item.content_type || 'document',
      category: item.category || '',
      subCategory: item.sub_category || '',
      process: item.process || '',
      lob: item.lob || '',
      tags: item.tags || '',
      sourceType: item.source_type || 'local',
      directMediaUrl: item.direct_media_url || '',
      localFilePath: item.local_file_path || '',
      driveFileId: item.drive_file_id || '',
      driveUrl: item.drive_url || '',
      playerMode: item.player_mode || 'Auto',
      estimatedMins: item.estimated_mins ?? 0,
      completionRulePct: item.completion_rule_pct ?? 80,
      description: item.description || '',
    });
  }

  async function saveEditRepo(e) {
    e.preventDefault(); setSaving(true); setMsg('');
    const res = await api.put(`/admin/content-repository/${editRepoItem.repositoryContentId}`, editRepoItem, 'admin');
    setSaving(false);
    if (!res.ok) return setMsg(res.message || 'Unable to update repository content.');
    setMsg('✓ Repository content updated.'); setEditRepoItem(null); loadRepo();
  }

  function setRepoField(key, value) { setRepoForm(prev => ({ ...prev, [key]: value })); }
  function setUploadField(key, value) { setUploadForm(prev => ({ ...prev, [key]: value })); }
  function setEditRepoField(key, value) { setEditRepoItem(prev => ({ ...prev, [key]: value })); }

  const repoTotalItems = repoItems.length;
  const repoUniqueTypes = [...new Set(repoItems.map(item => item.content_type))].length;
  const repoUniqueCategories = [...new Set(repoItems.map(item => item.category).filter(Boolean))].length;

  // ============================================================
  // ==================== QUESTIONS & MCQ STATE ====================
  // ============================================================

  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [classroomModules, setClassroomModules] = useState([]);
  const [aForm, setAForm] = useState({ classroomId: '', dayNo: '', moduleId: '', assessmentName: '', passingPct: 60, attemptLimit: 3, timeLimitMins: 30, instructions: '' });
  const [bulkJson, setBulkJson] = useState('');
  const [bulkMode, setBulkMode] = useState('csv');
  const [csvFile, setCsvFile] = useState(null);
  const [csvDragging, setCsvDragging] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editQuestionModal, setEditQuestionModal] = useState(null);
  const [savingEditQuestion, setSavingEditQuestion] = useState(false);
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
    if (selectedAssessment) api.get(`/admin/assessments/${selectedAssessment.assessmentId}/questions`, 'admin').then(r => r.ok && setQuestions(r.data));
  }, [selectedAssessment]);

  async function createAssessment(e) {
    e.preventDefault();
    const res = await api.post('/admin/assessments', aForm, 'admin');
    if (res.ok) { setShowCreateAssessment(false); setMsg('Assessment created.'); refreshAssessments(); }
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
      setSelectedAssessment(null);
      setQuestions([]);
      setMsg(r.message || 'Assessment deleted.');
      refreshAssessments();
    } else {
      setDeleteModal(prev => ({ ...prev, error: r.message }));
    }
  }

  async function uploadBulkQuestions() {
    try {
      const qs = JSON.parse(bulkJson);
      const res = await api.post(`/admin/assessments/${selectedAssessment.assessmentId}/questions/upload`, { questions: qs }, 'admin');
      if (res.ok) { setMsg(res.message); setBulkJson(''); setShowBulkUpload(false); loadQuestions(); refreshAssessments(); }
      else setMsg(res.message || 'Failed.');
    } catch {
      setMsg('Invalid JSON format.');
    }
  }

  function refreshAssessments() {
    api.get('/admin/assessments', 'admin').then(r => r.ok && setAssessments(r.data));
  }

  function loadQuestions() {
    api.get(`/admin/assessments/${selectedAssessment.assessmentId}/questions`, 'admin').then(r => r.ok && setQuestions(r.data));
  }

  async function deleteQuestion(questionId) {
    if (!window.confirm('Deactivate this question?')) return;
    await api.delete(`/admin/questions/${questionId}`, 'admin');
    loadQuestions();
    refreshAssessments();
  }

  async function saveEditedQuestion(form) {
    setSavingEditQuestion(true);
    const res = await api.put(`/admin/questions/${editQuestionModal.questionId}`, form, 'admin');
    setSavingEditQuestion(false);
    if (res.ok) {
      setEditQuestionModal(null);
      setMsg('Question updated.');
      loadQuestions();
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

  async function uploadCsvQuestions() {
    if (!csvFile || !selectedAssessment) return;
    const text = await csvFile.text();
    const res = await api.post(`/admin/assessments/${selectedAssessment.assessmentId}/questions/upload-csv`, { csv: text }, 'admin');
    if (res.ok) {
      setMsg(`Uploaded ${res.count} questions${res.errors?.length ? `, ${res.errors.length} errors` : ''}.`);
      setCsvFile(null); setCsvPreview(null); setShowBulkUpload(false);
      loadQuestions();
      refreshAssessments();
    } else setMsg(res.message || 'Upload failed.');
  }

  const totalAssessments = assessments.length;
  const totalQuestions = assessments.reduce((sum, a) => sum + (a._count?.questions || 0), 0);
  const linkedAssessments = assessments.filter(a => a.moduleId).length;

  // ============================================================
  // ==================== INDEPENDENT MODULES STATE ====================
  // ============================================================

  const [modules, setModules] = useState([]);
  const [rules, setRules] = useState([]);
  const [moduleForm, setModuleForm] = useState(emptyModule);
  const [editModule, setEditModule] = useState(null);
  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [expanded, setExpanded] = useState({});
  const [assignContent, setAssignContent] = useState({ moduleId: '', show: false, query: '', results: [] });
  const [moduleTab, setModuleTab] = useState('modules'); // 'modules' | 'create' | 'rules'

  async function loadModules() {
    setLoading(true);
    const [moduleRes, ruleRes, repoRes] = await Promise.all([
      api.get('/admin/independent-modules', 'admin'),
      api.get('/admin/independent-modules/auto-assign-rules', 'admin'),
      api.get('/admin/content-repository', 'admin'),
    ]);
    setLoading(false);
    if (moduleRes.ok) setModules(moduleRes.data || []);
    if (ruleRes.ok) setRules(ruleRes.data || []);
    if (repoRes.ok) setRepoItems(repoRes.data || []);
    if (!moduleRes.ok || !ruleRes.ok) setMsg('Unable to load independent module data.');
  }

  async function createModule(e) {
    e.preventDefault(); setSaving(true); setMsg('');
    const res = await api.post('/admin/independent-modules', moduleForm, 'admin');
    setSaving(false);
    if (!res.ok) return setMsg(res.message || 'Unable to create module.');
    setMsg('✓ Independent module created.'); setModuleForm(emptyModule); loadModules();
  }

  async function saveModuleEdit(e) {
    e.preventDefault(); setSaving(true); setMsg('');
    const res = await api.put(`/admin/independent-modules/${editModule.moduleId}`, editModule, 'admin');
    setSaving(false);
    if (!res.ok) return setMsg(res.message || 'Unable to update module.');
    setMsg('✓ Module updated.'); setEditModule(null); loadModules();
  }

  async function archiveModule(moduleId) {
    if (!window.confirm('Archive this independent module? This cannot be undone.')) return;
    const res = await api.delete(`/admin/independent-modules/${moduleId}`, 'admin');
    setMsg(res.ok ? '✓ Module archived.' : (res.message || 'Unable to archive.')); loadModules();
  }

  async function removeContentFromModule(moduleId, repoContentId) {
    if (!window.confirm('Remove this content from the module?')) return;
    const res = await api.delete(`/admin/independent-modules/${moduleId}/contents/${repoContentId}`, 'admin');
    setMsg(res.ok ? '✓ Content removed.' : (res.message || 'Unable to remove.')); loadModules();
  }

  async function createAutoRule(e) {
    e.preventDefault(); setSaving(true); setMsg('');
    const res = await api.post(`/admin/independent-modules/${ruleForm.moduleId}/auto-assign-rule`, ruleForm, 'admin');
    setSaving(false);
    if (!res.ok) return setMsg(res.message || 'Unable to create rule.');
    setMsg('✓ Auto-assign rule created.'); setRuleForm(emptyRule); loadModules();
  }

  async function deleteRule(ruleId) {
    if (!window.confirm('Disable this auto-assign rule?')) return;
    const res = await api.delete(`/admin/independent-modules/auto-assign-rules/${ruleId}`, 'admin');
    setMsg(res.ok ? '✓ Rule disabled.' : (res.message || 'Unable to disable.')); loadModules();
  }

  function toggleExpand(mId) {
    setExpanded(prev => ({ ...prev, [mId]: !prev[mId] }));
  }

  async function searchContentForAssign() {
    const res = await api.get(`/admin/content-repository?q=${encodeURIComponent(assignContent.query)}`, 'admin');
    if (res.ok) setAssignContent(prev => ({ ...prev, results: res.data || [] }));
  }

  async function addContentToModule(repoContentId) {
    const moduleId = assignContent.moduleId;
    const module = modules.find(m => m.module_id === moduleId);
    if (!module) return;
    const contents = (module.contents || []).map(c => ({ repositoryContentId: c.repository_content_id, sortOrder: c.sortOrder, required: c.required }));
    if (contents.some(c => c.repositoryContentId === repoContentId)) {
      return setMsg('Content already in module.');
    }
    contents.push({ repositoryContentId: repoContentId, sortOrder: contents.length + 1, required: true });
    await api.put(`/admin/independent-modules/${moduleId}`, { contents }, 'admin');
    setAssignContent({ moduleId: '', show: false, query: '', results: [] });
    setMsg('✓ Content added to module.'); loadModules();
  }

  function openAssignContent(mId) {
    setAssignContent({ moduleId: mId, show: true, query: '', results: [] });
  }

  const totalModules = modules.length;
  const totalRules = rules.length;
  const totalModuleContents = modules.reduce((sum, m) => sum + (m.contents || []).length, 0);

  // ============================================================
  // ==================== EVIDENCE GOVERNANCE STATE ====================
  // ============================================================

  const [catalog, setCatalog] = useState({ skills: [], contents: [], assessments: [], contentMaps: [], assessmentMaps: [] });
  const [search, setSearch] = useState('');
  const [mapForm, setMapForm] = useState({ mapType: 'content', referenceId: '', skillId: '', targetLevel: 1, weight: 1 });
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [snapshot, setSnapshot] = useState(null);
  const [verifyForm, setVerifyForm] = useState({ skillId: '', currentLevel: 1, targetLevel: 1, confidenceScore: 100, expiresAt: '', notes: '' });
  const [evidenceTab, setEvidenceTab] = useState('mapping'); // 'mapping' | 'verification'

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

  async function saveEvidenceMapping(event) {
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
    setMsg('Evidence mapping saved. Future completions and assessment results will update the skill profile automatically.');
    await loadCatalog(search);
  }

  async function removeEvidenceMapping(row) {
    setSaving(`remove:${row.id}`);
    const result = await api.delete(`/talent/admin/skills/${encodeURIComponent(row.skillId)}/maps/${mapForm.mapType}/${encodeURIComponent(row.referenceId)}`, 'admin');
    setSaving('');
    if (!result.ok) return setError(result.message || 'Could not remove mapping.');
    setMsg('Evidence mapping removed. Existing evidence remains auditable but new evidence will not be generated.');
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
    setMsg('Skill verification saved with a permanent audit and evidence record.');
    setVerifyForm(form => ({ ...form, notes: '' }));
    await openEmployee(selectedEmployee);
  }

  // ============================================================
  // ==================== INITIAL LOAD ====================
  // ============================================================

  useEffect(() => {
    loadRepo();
    loadModules();
    loadCatalog('');
  }, []);

  // ============================================================
  // ==================== RENDER ====================
  // ============================================================

  return (
    <div style={{
      padding: '24px 0',
      maxWidth: 1400,
      margin: '0 auto',
    }}>
      {/* ========== HEADER ========== */}
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
            <span style={{ fontSize: 24, lineHeight: 1 }}>🏢</span>
            <h1 style={{
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--ink)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              Admin Dashboard
            </h1>
          </div>
          <p style={{
            fontSize: 14,
            color: 'var(--muted)',
            margin: '4px 0 0',
            maxWidth: 600,
          }}>
            Manage content, assessments, independent modules, and evidence mapping.
          </p>
        </div>
        <button
          onClick={() => { loadRepo(); loadModules(); loadCatalog(search); }}
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
          🔄 {loading ? 'Loading...' : 'Refresh All'}
        </button>
      </div>

      {/* ========== TOAST MESSAGES ========== */}
      {msg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: 16,
          background: msg.startsWith('✓') || msg.startsWith('Uploaded') || msg.startsWith('Assessment') || msg.startsWith('Question') || msg.startsWith('Evidence')
            ? 'rgba(34,197,94,0.1)'
            : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.startsWith('✓') || msg.startsWith('Uploaded') || msg.startsWith('Assessment') || msg.startsWith('Question') || msg.startsWith('Evidence')
            ? 'rgba(34,197,94,0.2)'
            : 'rgba(239,68,68,0.2)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: 13,
            color: msg.startsWith('✓') || msg.startsWith('Uploaded') || msg.startsWith('Assessment') || msg.startsWith('Question') || msg.startsWith('Evidence')
              ? '#22c55e'
              : '#ef4444',
          }}>
            {msg.startsWith('✓') || msg.startsWith('Uploaded') || msg.startsWith('Assessment') || msg.startsWith('Question') || msg.startsWith('Evidence') ? '✅' : '❌'} {msg}
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

      {/* ========== MAIN TABS ========== */}
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
        <button
          onClick={() => setMainTab('repository')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: mainTab === 'repository' ? '#6366f1' : 'transparent',
            color: mainTab === 'repository' ? '#fff' : 'var(--muted)',
            fontWeight: mainTab === 'repository' ? 700 : 500,
            fontSize: 13,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          📚 Content Repository
        </button>
        <button
          onClick={() => setMainTab('questions')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: mainTab === 'questions' ? '#6366f1' : 'transparent',
            color: mainTab === 'questions' ? '#fff' : 'var(--muted)',
            fontWeight: mainTab === 'questions' ? 700 : 500,
            fontSize: 13,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          📝 Questions & MCQ
        </button>
        <button
          onClick={() => setMainTab('modules')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: mainTab === 'modules' ? '#6366f1' : 'transparent',
            color: mainTab === 'modules' ? '#fff' : 'var(--muted)',
            fontWeight: mainTab === 'modules' ? 700 : 500,
            fontSize: 13,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          📦 Independent Modules
        </button>
        <button
          onClick={() => setMainTab('evidence')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: mainTab === 'evidence' ? '#6366f1' : 'transparent',
            color: mainTab === 'evidence' ? '#fff' : 'var(--muted)',
            fontWeight: mainTab === 'evidence' ? 700 : 500,
            fontSize: 13,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          🔍 Evidence Mapping
        </button>
      </div>

      {/* ============================================================== */}
      {/* ========== TAB: CONTENT REPOSITORY ========== */}
      {/* ============================================================== */}
      {mainTab === 'repository' && (
        <div>
          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14,
            marginBottom: 24,
          }}>
            <StatCard label="Total Items" value={repoTotalItems} icon="📚" color="rgba(99,102,241,0.1)" />
            <StatCard label="Content Types" value={repoUniqueTypes} icon="🏷️" color="rgba(245,158,11,0.1)" />
            <StatCard label="Categories" value={repoUniqueCategories} icon="📂" color="rgba(34,197,94,0.1)" />
            <StatCard label="Search" value={repoQuery ? `"${repoQuery}"` : 'All'} icon="🔍" color="rgba(6,182,212,0.1)" />
          </div>

          {/* Sub Tabs */}
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
              onClick={() => setRepoTab('upload')}
              style={{
                flex: 1,
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: repoTab === 'upload' ? '#6366f1' : 'transparent',
                color: repoTab === 'upload' ? '#fff' : 'var(--muted)',
                fontWeight: repoTab === 'upload' ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s',
              }}
            >
              📤 Upload File
            </button>
            <button
              onClick={() => setRepoTab('link')}
              style={{
                flex: 1,
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: repoTab === 'link' ? '#6366f1' : 'transparent',
                color: repoTab === 'link' ? '#fff' : 'var(--muted)',
                fontWeight: repoTab === 'link' ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s',
              }}
            >
              🔗 Add Link / Path
            </button>
          </div>

          {/* Upload File Form */}
          {repoTab === 'upload' && (
            <div style={{
              background: 'var(--card-solid)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              padding: '24px',
              marginBottom: 24,
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--ink)',
                margin: '0 0 16px',
              }}>
                📤 Upload Local File
              </h3>
              <form onSubmit={uploadRepoFile} style={{ display: 'grid', gap: 14 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
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
                      Title
                    </label>
                    <input
                      placeholder="Title (optional)"
                      value={uploadForm.title}
                      onChange={e => setUploadField('title', e.target.value)}
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
                      Content Type
                    </label>
                    <select
                      value={uploadForm.contentType}
                      onChange={e => setUploadField('contentType', e.target.value)}
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
                      <option value="">Auto Detect</option>
                      <option>document</option>
                      <option>video</option>
                      <option>pdf</option>
                      <option>ppt</option>
                      <option>image</option>
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
                      File
                    </label>
                    <input
                      type="file"
                      onChange={e => setUploadField('file', e.target.files?.[0] || null)}
                      style={{
                        width: '100%',
                        padding: '6px',
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

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: 12,
                }}>
                  <input
                    placeholder="Category"
                    value={uploadForm.category}
                    onChange={e => setUploadField('category', e.target.value)}
                    style={{
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
                  <input
                    placeholder="Sub Category"
                    value={uploadForm.subCategory}
                    onChange={e => setUploadField('subCategory', e.target.value)}
                    style={{
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
                  <input
                    placeholder="Process"
                    value={uploadForm.process}
                    onChange={e => setUploadField('process', e.target.value)}
                    style={{
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
                  <input
                    placeholder="LOB"
                    value={uploadForm.lob}
                    onChange={e => setUploadField('lob', e.target.value)}
                    style={{
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

                <textarea
                  rows="2"
                  placeholder="Description"
                  value={uploadForm.description}
                  onChange={e => setUploadField('description', e.target.value)}
                  style={{
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

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}>
                  <button
                    disabled={saving}
                    style={{
                      padding: '10px 32px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
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
                    {saving ? '⏳ Uploading...' : '🚀 Upload to Repository'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Link Form */}
          {repoTab === 'link' && (
            <div style={{
              background: 'var(--card-solid)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              padding: '24px',
              marginBottom: 24,
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--ink)',
                margin: '0 0 16px',
              }}>
                🔗 Add Repository Link / Path
              </h3>
              <form onSubmit={saveRepoLink} style={{ display: 'grid', gap: 14 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
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
                      Title <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      value={repoForm.title}
                      onChange={e => setRepoField('title', e.target.value)}
                      required
                      placeholder="Example: Finnable Salary Eligibility SOP"
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
                      Type
                    </label>
                    <select
                      value={repoForm.contentType}
                      onChange={e => setRepoField('contentType', e.target.value)}
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
                      <option>document</option>
                      <option>video</option>
                      <option>pdf</option>
                      <option>ppt</option>
                      <option>image</option>
                      <option>scorm</option>
                      <option>link</option>
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
                      Source
                    </label>
                    <select
                      value={repoForm.sourceType}
                      onChange={e => setRepoField('sourceType', e.target.value)}
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
                      <option>local</option>
                      <option>url</option>
                      <option>drive</option>
                    </select>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: 12,
                }}>
                  <input
                    placeholder="Category"
                    value={repoForm.category}
                    onChange={e => setRepoField('category', e.target.value)}
                    style={{
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
                  <input
                    placeholder="Sub Category"
                    value={repoForm.subCategory}
                    onChange={e => setRepoField('subCategory', e.target.value)}
                    style={{
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
                  <input
                    placeholder="Process"
                    value={repoForm.process}
                    onChange={e => setRepoField('process', e.target.value)}
                    style={{
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
                  <input
                    placeholder="LOB"
                    value={repoForm.lob}
                    onChange={e => setRepoField('lob', e.target.value)}
                    style={{
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

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}>
                  <input
                    placeholder="Direct URL / Local Public URL"
                    value={repoForm.directMediaUrl}
                    onChange={e => setRepoField('directMediaUrl', e.target.value)}
                    style={{
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
                  <input
                    placeholder="Local File Path"
                    value={repoForm.localFilePath}
                    onChange={e => setRepoField('localFilePath', e.target.value)}
                    style={{
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

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 2fr',
                  gap: 12,
                }}>
                  <input
                    placeholder="Estimated Mins"
                    type="number"
                    value={repoForm.estimatedMins}
                    onChange={e => setRepoField('estimatedMins', e.target.value)}
                    style={{
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
                  <input
                    placeholder="Completion %"
                    type="number"
                    value={repoForm.completionRulePct}
                    onChange={e => setRepoField('completionRulePct', e.target.value)}
                    style={{
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
                  <input
                    placeholder="Tags"
                    value={repoForm.tags}
                    onChange={e => setRepoField('tags', e.target.value)}
                    style={{
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

                <textarea
                  rows="2"
                  placeholder="Description"
                  value={repoForm.description}
                  onChange={e => setRepoField('description', e.target.value)}
                  style={{
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

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}>
                  <button
                    disabled={saving}
                    style={{
                      padding: '10px 32px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
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
                    {saving ? '⏳ Saving...' : '💾 Save to Repository'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Repository Items Table */}
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
                  📋 Repository Items
                </h3>
                <p style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  margin: '2px 0 0',
                }}>
                  {repoItems.length} items in the repository
                </p>
              </div>
              <form
                onSubmit={e => { e.preventDefault(); loadRepo(); }}
                style={{
                  display: 'flex',
                  gap: 8,
                }}
              >
                <input
                  value={repoQuery}
                  onChange={e => setRepoQuery(e.target.value)}
                  placeholder="🔍 Search title/category/process/tags"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    outline: 'none',
                    width: 260,
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                />
                <button
                  type="submit"
                  disabled={loading}
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
                      whiteSpace: 'nowrap',
                    }}>
                      ID
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
                      Title
                    </th>
                    <th style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}>
                      Type
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
                      Category
                    </th>
                    <th style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}>
                      Process / LOB
                    </th>
                    <th style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}>
                      Source
                    </th>
                    <th style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}>
                      Updated
                    </th>
                    <th style={{
                      padding: '10px 14px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {repoItems.map(item => (
                    <tr key={item.repository_content_id} style={{
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
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: 'var(--muted)',
                      }}>
                        {item.repository_content_id}
                      </td>
                      <td style={{
                        padding: '10px 14px',
                      }}>
                        <div style={{
                          fontWeight: 600,
                          color: 'var(--ink)',
                        }}>
                          {item.title}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: 'var(--muted)',
                          marginTop: 2,
                          maxWidth: 200,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {item.description || item.tags || '—'}
                        </div>
                      </td>
                      <td style={{
                        padding: '10px 14px',
                      }}>
                        <ContentTypeBadge type={item.content_type} />
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        fontSize: 13,
                        color: 'var(--ink)',
                      }}>
                        {item.category || '—'}
                        {item.sub_category && (
                          <div style={{
                            fontSize: 11,
                            color: 'var(--muted)',
                          }}>
                            / {item.sub_category}
                          </div>
                        )}
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        fontSize: 13,
                        color: 'var(--ink)',
                      }}>
                        {item.process || '—'}
                        <div style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                        }}>
                          {item.lob || '—'}
                        </div>
                      </td>
                      <td style={{
                        padding: '10px 14px',
                      }}>
                        <SourceBadge source={item.source_type} />
                      </td>
                      <td style={{
                        padding: '10px 14px',
                        fontSize: 12,
                        color: 'var(--muted)',
                      }}>
                        {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'}
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
                            onClick={() => openEditRepo(item)}
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
                            onClick={() => archiveRepoItem(item.repository_content_id)}
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
                            🗑️ Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!repoItems.length && (
                    <tr>
                      <td colSpan="8" style={{
                        textAlign: 'center',
                        color: 'var(--muted)',
                        padding: '48px 20px',
                      }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                          No repository content found
                        </div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>
                          Upload a file or add a link to get started
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Repo Modal */}
          {editRepoItem && (
            <div
              onClick={() => setEditRepoItem(null)}
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
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'var(--card-solid)',
                  borderRadius: '20px',
                  maxWidth: 640,
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
                }}
              >
                <div style={{
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
                    ✏️ Edit Repository Content
                  </b>
                  <button
                    onClick={() => setEditRepoItem(null)}
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
                <form onSubmit={saveEditRepo} style={{
                  padding: '20px',
                  display: 'grid',
                  gap: 14,
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr',
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
                        Title <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        value={editRepoItem.title}
                        onChange={e => setEditRepoField('title', e.target.value)}
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
                        Type
                      </label>
                      <select
                        value={editRepoItem.contentType}
                        onChange={e => setEditRepoField('contentType', e.target.value)}
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
                        <option>document</option>
                        <option>video</option>
                        <option>pdf</option>
                        <option>ppt</option>
                        <option>image</option>
                        <option>scorm</option>
                        <option>link</option>
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
                        Source
                      </label>
                      <select
                        value={editRepoItem.sourceType}
                        onChange={e => setEditRepoField('sourceType', e.target.value)}
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
                        <option>local</option>
                        <option>url</option>
                        <option>drive</option>
                      </select>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    gap: 12,
                  }}>
                    <input
                      placeholder="Category"
                      value={editRepoItem.category}
                      onChange={e => setEditRepoField('category', e.target.value)}
                      style={{
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
                    <input
                      placeholder="Sub Category"
                      value={editRepoItem.subCategory}
                      onChange={e => setEditRepoField('subCategory', e.target.value)}
                      style={{
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
                    <input
                      placeholder="Process"
                      value={editRepoItem.process}
                      onChange={e => setEditRepoField('process', e.target.value)}
                      style={{
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
                    <input
                      placeholder="LOB"
                      value={editRepoItem.lob}
                      onChange={e => setEditRepoField('lob', e.target.value)}
                      style={{
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

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}>
                    <input
                      placeholder="Direct URL / Local Public URL"
                      value={editRepoItem.directMediaUrl}
                      onChange={e => setEditRepoField('directMediaUrl', e.target.value)}
                      style={{
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
                    <input
                      placeholder="Drive File ID"
                      value={editRepoItem.driveFileId}
                      onChange={e => setEditRepoField('driveFileId', e.target.value)}
                      style={{
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

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 12,
                  }}>
                    <input
                      placeholder="Drive URL"
                      value={editRepoItem.driveUrl}
                      onChange={e => setEditRepoField('driveUrl', e.target.value)}
                      style={{
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
                    <input
                      placeholder="Est. Mins"
                      type="number"
                      value={editRepoItem.estimatedMins}
                      onChange={e => setEditRepoField('estimatedMins', e.target.value)}
                      style={{
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
                    <input
                      placeholder="Completion %"
                      type="number"
                      value={editRepoItem.completionRulePct}
                      onChange={e => setEditRepoField('completionRulePct', e.target.value)}
                      style={{
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

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: 12,
                  }}>
                    <input
                      placeholder="Tags"
                      value={editRepoItem.tags}
                      onChange={e => setEditRepoField('tags', e.target.value)}
                      style={{
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
                    <select
                      value={editRepoItem.playerMode}
                      onChange={e => setEditRepoField('playerMode', e.target.value)}
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
                      <option>Auto</option>
                      <option>Manual</option>
                    </select>
                  </div>

                  <textarea
                    rows="2"
                    placeholder="Description"
                    value={editRepoItem.description}
                    onChange={e => setEditRepoField('description', e.target.value)}
                    style={{
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

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 8,
                    paddingTop: 8,
                    borderTop: '1px solid var(--line)',
                  }}>
                    <button
                      type="button"
                      onClick={() => setEditRepoItem(null)}
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
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {saving ? '⏳ Saving...' : '💾 Update'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ========== TAB: QUESTIONS & MCQ ========== */}
      {/* ============================================================== */}
      {mainTab === 'questions' && (
        <div>
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

          {/* Create Assessment Button */}
          <button
            onClick={() => setShowCreateAssessment(!showCreateAssessment)}
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
              gap: 6,
              marginBottom: 20,
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

          {/* Create Assessment Form */}
          {showCreateAssessment && (
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
                  onClick={() => setShowCreateAssessment(false)}
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
                          onClick={() => { setSelectedAssessment(a); setShowBulkUpload(false); setMsg(''); }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            background: selectedAssessment?.assessmentId === a.assessmentId ? 'rgba(99,102,241,0.08)' : 'var(--card)',
                            border: `1px solid ${selectedAssessment?.assessmentId === a.assessmentId ? 'rgba(99,102,241,0.3)' : 'var(--line)'}`,
                            fontSize: 13,
                            fontWeight: selectedAssessment?.assessmentId === a.assessmentId ? 700 : 500,
                            color: selectedAssessment?.assessmentId === a.assessmentId ? '#6366f1' : 'var(--ink)',
                            transition: 'all 0.15s',
                            position: 'relative',
                          }}
                          onMouseEnter={(e) => {
                            if (selectedAssessment?.assessmentId !== a.assessmentId) {
                              e.currentTarget.style.background = 'var(--card)';
                              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedAssessment?.assessmentId !== a.assessmentId) {
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
              {!selectedAssessment && (
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

              {selectedAssessment && (
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
                          {selectedAssessment.assessmentName}
                        </span>
                        <StatusBadge status={selectedAssessment.moduleId ? 'linked' : 'unlinked'} />
                      </div>
                      <div style={{
                        fontSize: 13,
                        color: 'var(--muted)',
                        marginTop: 4,
                      }}>
                        {questions.length} questions · Passing: {selectedAssessment.passingPct}% · {selectedAssessment.attemptLimit} attempts
                        {selectedAssessment.moduleId
                          ? <span style={{ color: '#22c55e', marginLeft: 8 }}>✓ Linked to module</span>
                          : <span style={{ color: '#f59e0b', marginLeft: 8 }}>⚠ Not linked — learners won't see this</span>
                        }
                      </div>
                    </div>
                    <button
                      onClick={() => { setShowBulkUpload(!showBulkUpload); setMsg(''); }}
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
                      {showBulkUpload ? '⬆ Hide' : '📤 Bulk Upload'}
                    </button>
                  </div>

                  {/* Link to Module Panel */}
                  {!selectedAssessment.moduleId && selectedAssessment.classroomId && (
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
                        onClick={() => {
                          const moduleId = prompt('Enter module ID to link this assessment:');
                          if (moduleId) {
                            api.put(`/admin/assessments/${selectedAssessment.assessmentId}`, { moduleId }, 'admin')
                              .then(res => {
                                if (res.ok) {
                                  setMsg('Assessment linked to module.');
                                  setSelectedAssessment(res.data);
                                  refreshAssessments();
                                }
                              });
                          }
                        }}
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
                  )}

                  {/* Bulk Upload */}
                  {showBulkUpload && (
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
                                  onClick={uploadCsvQuestions}
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
                              onClick={uploadBulkQuestions}
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
                              onClick={() => { setShowBulkUpload(false); setBulkJson(''); }}
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
                                  onClick={() => setEditQuestionModal(q)}
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
            <div
              onClick={e => e.target === e.currentTarget && setDeleteModal(null)}
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
                maxWidth: 420,
                width: '100%',
                boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
              }}>
                <div style={{
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
                    onClick={() => setDeleteModal(null)}
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
                  {deleteModal.step === 1 && (
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
                          Deleting <b>{deleteModal.assessment.assessmentName}</b> will permanently remove:
                          <ul style={{
                            margin: '8px 0 0 16px',
                            padding: 0,
                            fontSize: 12,
                          }}>
                            <li>All {deleteModal.assessment._count?.questions || 0} questions</li>
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
                          // style={{ flex: 1 }}
                          onClick={() => setDeleteModal(null)}
                          style={{
                            flex: 1,
                            padding: '9px 16px',
                            borderRadius: '8px',
                            border: '1px solid var(--line)',
                            background: 'var(--card-solid)',
                            color: 'var(--ink)',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            transition: 'all 0.2s',
                          }}
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
                          onClick={() => setDeleteModal(prev => ({ ...prev, step: 2 }))}
                        >
                          Proceed
                        </button>
                      </div>
                    </div>
                  )}
                  {deleteModal.step === 2 && (
                    <div>
                      <div style={{
                        fontSize: 13,
                        color: 'var(--ink)',
                        marginBottom: 14,
                      }}>
                        Type <b>DELETE</b> to permanently delete <b>{deleteModal.assessment.assessmentName}</b>.
                      </div>
                      <div>
                        <input
                          value={deleteModal.confirm || ''}
                          onChange={e => setDeleteModal(prev => ({ ...prev, confirm: e.target.value.toUpperCase() }))}
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
                      {deleteModal.error && (
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: '#ef4444',
                          fontSize: 13,
                          marginTop: 10,
                        }}>
                          ❌ {deleteModal.error}
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        gap: 10,
                        marginTop: 14,
                      }}>
                        <button
                          // style={{ flex: 1 }}
                          onClick={() => setDeleteModal(null)}
                          style={{
                            flex: 1,
                            padding: '9px 16px',
                            borderRadius: '8px',
                            border: '1px solid var(--line)',
                            background: 'var(--card-solid)',
                            color: 'var(--ink)',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            transition: 'all 0.2s',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          style={{
                            flex: 1,
                            background: deleteModal.confirm === 'DELETE' ? 'rgba(239,68,68,0.85)' : 'rgba(150,150,150,0.3)',
                            color: deleteModal.confirm === 'DELETE' ? '#fff' : 'var(--muted)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '9px 16px',
                            fontWeight: 700,
                            cursor: deleteModal.confirm === 'DELETE' ? 'pointer' : 'not-allowed',
                            fontSize: 13,
                            transition: 'all 0.15s',
                          }}
                          onClick={() => deleteAssessmentConfirmed(deleteModal.assessment.assessmentId)}
                          disabled={deleteModal.confirm !== 'DELETE'}
                        >
                          Delete Permanently
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Edit Question Modal */}
          {editQuestionModal && (
            <div
              onClick={e => e.target === e.currentTarget && setEditQuestionModal(null)}
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
                maxWidth: 600,
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
                  <b style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--ink)',
                  }}>
                    ✏️ Edit Question
                  </b>
                  <button
                    onClick={() => setEditQuestionModal(null)}
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
                  <EditQuestionForm
                    question={editQuestionModal}
                    saving={savingEditQuestion}
                    onClose={() => setEditQuestionModal(null)}
                    onSave={saveEditedQuestion}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ========== TAB: INDEPENDENT MODULES ========== */}
      {/* ============================================================== */}
      {mainTab === 'modules' && (
        <div>
          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14,
            marginBottom: 24,
          }}>
            <StatCard label="Total Modules" value={totalModules} icon="📦" color="rgba(99,102,241,0.1)" />
            <StatCard label="Total Rules" value={totalRules} icon="⚖️" color="rgba(245,158,11,0.1)" />
            <StatCard label="Total Contents" value={totalModuleContents} icon="📄" color="rgba(34,197,94,0.1)" />
            <StatCard label="Modules with Content" value={modules.filter(m => (m.contents || []).length > 0).length} icon="✅" color="rgba(6,182,212,0.1)" />
          </div>

          {/* Sub Tabs */}
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
              onClick={() => setModuleTab('modules')}
              style={{
                flex: 1,
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: moduleTab === 'modules' ? '#6366f1' : 'transparent',
                color: moduleTab === 'modules' ? '#fff' : 'var(--muted)',
                fontWeight: moduleTab === 'modules' ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s',
              }}
            >
              📋 Library
            </button>
            <button
              onClick={() => setModuleTab('create')}
              style={{
                flex: 1,
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: moduleTab === 'create' ? '#6366f1' : 'transparent',
                color: moduleTab === 'create' ? '#fff' : 'var(--muted)',
                fontWeight: moduleTab === 'create' ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s',
              }}
            >
              ✨ Create Module
            </button>
            <button
              onClick={() => setModuleTab('rules')}
              style={{
                flex: 1,
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: moduleTab === 'rules' ? '#6366f1' : 'transparent',
                color: moduleTab === 'rules' ? '#fff' : 'var(--muted)',
                fontWeight: moduleTab === 'rules' ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s',
              }}
            >
              ⚖️ Auto Rules
            </button>
          </div>

          {/* Create Module Form */}
          {moduleTab === 'create' && (
            <div style={{
              background: 'var(--card-solid)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              padding: '24px',
              marginBottom: 24,
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--ink)',
                margin: '0 0 16px',
              }}>
                ✨ Create Independent Module
              </h3>
              <form onSubmit={createModule} style={{ display: 'grid', gap: 14 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
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
                      Module Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      value={moduleForm.moduleName}
                      onChange={e => setModuleForm(p => ({ ...p, moduleName: e.target.value }))}
                      required
                      placeholder="e.g. Compliance Training"
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
                      Category
                    </label>
                    <input
                      value={moduleForm.category}
                      onChange={e => setModuleForm(p => ({ ...p, category: e.target.value }))}
                      placeholder="Category"
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
                      Est. Minutes
                    </label>
                    <input
                      type="number"
                      value={moduleForm.estimatedMins}
                      onChange={e => setModuleForm(p => ({ ...p, estimatedMins: e.target.value }))}
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
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}>
                  <input
                    placeholder="Process"
                    value={moduleForm.process}
                    onChange={e => setModuleForm(p => ({ ...p, process: e.target.value }))}
                    style={{
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
                  <input
                    placeholder="LOB"
                    value={moduleForm.lob}
                    onChange={e => setModuleForm(p => ({ ...p, lob: e.target.value }))}
                    style={{
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

                <textarea
                  rows="2"
                  placeholder="Description"
                  value={moduleForm.description}
                  onChange={e => setModuleForm(p => ({ ...p, description: e.target.value }))}
                  style={{
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

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}>
                  <button
                    disabled={saving}
                    style={{
                      padding: '10px 32px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
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
                    {saving ? '⏳ Creating...' : '🚀 Create Module'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Module Library */}
          {moduleTab === 'modules' && (
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
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: 0,
                }}>
                  📋 Independent Module Library
                </h3>
                <p style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  margin: '2px 0 0',
                }}>
                  {modules.length} modules in the library
                </p>
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
                        width: 30,
                      }} />
                      <th style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: 'var(--muted)',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}>
                        Module
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
                        Process / LOB
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
                        Contents
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
                    {modules.map(m => (
                      <>
                        <tr key={m.module_id} style={{
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
                            textAlign: 'center',
                          }}>
                            <span
                              onClick={() => toggleExpand(m.module_id)}
                              style={{
                                cursor: 'pointer',
                                fontSize: 14,
                                color: 'var(--muted)',
                                transition: 'transform 0.2s',
                                display: 'inline-block',
                                transform: expanded[m.module_id] ? 'rotate(90deg)' : 'rotate(0)',
                              }}
                            >
                              ▶
                            </span>
                          </td>
                          <td style={{
                            padding: '10px 14px',
                          }}>
                            <div style={{
                              fontWeight: 600,
                              color: 'var(--ink)',
                            }}>
                              {m.module_name}
                            </div>
                            <div style={{
                              fontSize: 12,
                              color: 'var(--muted)',
                              marginTop: 2,
                            }}>
                              {m.description || m.category || '—'}
                            </div>
                          </td>
                          <td style={{
                            padding: '10px 14px',
                            fontSize: 13,
                            color: 'var(--ink)',
                          }}>
                            {m.process || '—'}
                            <div style={{
                              fontSize: 11,
                              color: 'var(--muted)',
                            }}>
                              {m.lob || '—'}
                            </div>
                          </td>
                          <td style={{
                            padding: '10px 14px',
                            textAlign: 'center',
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 10px',
                              borderRadius: '99px',
                              background: 'rgba(99,102,241,0.1)',
                              color: '#6366f1',
                              fontSize: 12,
                              fontWeight: 600,
                            }}>
                              📄 {(m.contents || []).length}
                            </span>
                            <div style={{
                              fontSize: 11,
                              color: 'var(--muted)',
                              marginTop: 2,
                            }}>
                              {m.estimated_mins || 0} min
                            </div>
                          </td>
                          <td style={{
                            padding: '10px 14px',
                            textAlign: 'center',
                          }}>
                            <div style={{
                              display: 'flex',
                              gap: 4,
                              justifyContent: 'center',
                              flexWrap: 'wrap',
                            }}>
                              <button
                                onClick={() => openAssignContent(m.module_id)}
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(99,102,241,0.2)',
                                  background: 'rgba(99,102,241,0.08)',
                                  color: '#6366f1',
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 500,
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                                }}
                              >
                                + Content
                              </button>
                              <button
                                onClick={() => setEditModule({
                                  moduleId: m.module_id,
                                  moduleName: m.module_name || '',
                                  category: m.category || '',
                                  process: m.process || '',
                                  lob: m.lob || '',
                                  description: m.description || '',
                                  estimatedMins: m.estimated_mins || 0,
                                })}
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
                                onClick={() => archiveModule(m.module_id)}
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
                        {expanded[m.module_id] && (
                          <tr key={`${m.module_id}-contents`}>
                            <td colSpan="5" style={{
                              padding: '0 0 0 44px',
                              background: 'var(--card)',
                            }}>
                              <div style={{
                                padding: '8px 16px 16px',
                              }}>
                                <table style={{
                                  width: '100%',
                                  fontSize: 13,
                                  borderCollapse: 'collapse',
                                }}>
                                  <thead>
                                    <tr style={{
                                      borderBottom: '1px solid var(--line)',
                                    }}>
                                      <th style={{
                                        padding: '6px 12px',
                                        textAlign: 'left',
                                        fontWeight: 600,
                                        color: 'var(--muted)',
                                        fontSize: 11,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                      }}>
                                        Content
                                      </th>
                                      <th style={{
                                        padding: '6px 12px',
                                        textAlign: 'left',
                                        fontWeight: 600,
                                        color: 'var(--muted)',
                                        fontSize: 11,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                      }}>
                                        Type
                                      </th>
                                      <th style={{
                                        padding: '6px 12px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        color: 'var(--muted)',
                                        fontSize: 11,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                      }}>
                                        Sort
                                      </th>
                                      <th style={{
                                        padding: '6px 12px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        color: 'var(--muted)',
                                        fontSize: 11,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                      }}>
                                        Required
                                      </th>
                                      <th style={{
                                        padding: '6px 12px',
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
                                    {(m.contents || []).map(c => (
                                      <tr key={`${m.module_id}-${c.repository_content_id}`} style={{
                                        borderBottom: '1px solid var(--line)',
                                      }}>
                                        <td style={{
                                          padding: '6px 12px',
                                          fontWeight: 500,
                                          color: 'var(--ink)',
                                        }}>
                                          {c.title}
                                        </td>
                                        <td style={{
                                          padding: '6px 12px',
                                        }}>
                                          <ContentTypeBadge type={c.content_type} />
                                        </td>
                                        <td style={{
                                          padding: '6px 12px',
                                          textAlign: 'center',
                                          color: 'var(--muted)',
                                        }}>
                                          {c.sortOrder}
                                        </td>
                                        <td style={{
                                          padding: '6px 12px',
                                          textAlign: 'center',
                                          color: c.required ? '#22c55e' : 'var(--muted)',
                                        }}>
                                          {c.required ? '✅' : '—'}
                                        </td>
                                        <td style={{
                                          padding: '6px 12px',
                                          textAlign: 'center',
                                        }}>
                                          <button
                                            onClick={() => removeContentFromModule(m.module_id, c.repository_content_id)}
                                            style={{
                                              padding: '2px 10px',
                                              borderRadius: '4px',
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
                                            Remove
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                    {(!m.contents || !m.contents.length) && (
                                      <tr>
                                        <td colSpan="5" style={{
                                          textAlign: 'center',
                                          color: 'var(--muted)',
                                          padding: '16px',
                                        }}>
                                          No content assigned. Click "+ Content" to add.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {!modules.length && (
                      <tr>
                        <td colSpan="5" style={{
                          textAlign: 'center',
                          color: 'var(--muted)',
                          padding: '48px 20px',
                        }}>
                          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                            No independent modules created yet
                          </div>
                          <div style={{ fontSize: 13, marginTop: 4 }}>
                            Create your first module to get started
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Auto Assignment Rules */}
          {moduleTab === 'rules' && (
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
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: 0,
                }}>
                  ⚖️ Auto Assignment Rules
                </h3>
                <p style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  margin: '2px 0 0',
                }}>
                  {rules.length} rules configured
                </p>
              </div>

              <div style={{
                padding: '20px',
              }}>
                <form onSubmit={createAutoRule} style={{
                  display: 'grid',
                  gap: 12,
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  marginBottom: 20,
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr',
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
                        Module <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        value={ruleForm.moduleId}
                        onChange={e => setRuleForm(p => ({ ...p, moduleId: e.target.value }))}
                        required
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
                        <option value="">Select Module *</option>
                        {modules.map(m => (
                          <option key={m.module_id} value={m.module_id}>
                            {m.module_name}
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
                        Rule Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        placeholder="Rule Name"
                        value={ruleForm.ruleName}
                        onChange={e => setRuleForm(p => ({ ...p, ruleName: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                          background: 'var(--card-solid)',
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
                        Scope Type
                      </label>
                      <select
                        value={ruleForm.scopeType}
                        onChange={e => setRuleForm(p => ({ ...p, scopeType: e.target.value, scopeValue: '' }))}
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
                        <option value="All">🌍 All Users</option>
                        <option value="Process">⚙️ Process</option>
                        <option value="LOB">🏢 LOB</option>
                        <option value="Branch">📍 Branch</option>
                        <option value="Designation">👤 Designation</option>
                      </select>
                    </div>
                    {ruleForm.scopeType !== 'All' ? (
                      <div>
                        <label style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--muted)',
                          display: 'block',
                          marginBottom: 4,
                        }}>
                          Scope Value <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          placeholder="Scope Value *"
                          value={ruleForm.scopeValue}
                          onChange={e => setRuleForm(p => ({ ...p, scopeValue: e.target.value }))}
                          required
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--line)',
                            background: 'var(--card-solid)',
                            color: 'var(--ink)',
                            fontSize: 13,
                            outline: 'none',
                            transition: 'border-color 0.2s',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                        />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                          background: 'var(--card-solid)',
                          color: 'var(--muted)',
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          minHeight: 38,
                        }}>
                          <span style={{ color: '#94a3b8' }}>All users</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1.5fr 1fr',
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
                        Assignment Type
                      </label>
                      <select
                        value={ruleForm.assignmentType}
                        onChange={e => setRuleForm(p => ({ ...p, assignmentType: e.target.value }))}
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
                        <option>Mandatory</option>
                        <option>Optional</option>
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
                        Due Days
                      </label>
                      <input
                        type="number"
                        placeholder="Due Days"
                        value={ruleForm.dueDays}
                        onChange={e => setRuleForm(p => ({ ...p, dueDays: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                          background: 'var(--card-solid)',
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
                        Message
                      </label>
                      <input
                        placeholder="Message"
                        value={ruleForm.message}
                        onChange={e => setRuleForm(p => ({ ...p, message: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                          background: 'var(--card-solid)',
                          color: 'var(--ink)',
                          fontSize: 13,
                          outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                      />
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                    }}>
                      <button
                        disabled={saving || !ruleForm.moduleId}
                        style={{
                          width: '100%',
                          padding: '8px 16px',
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
                        {saving ? '⏳ Creating...' : '➕ Add Rule'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Rules Table */}
                <div style={{
                  overflowX: 'auto',
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
                          Rule
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
                          Module
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
                          Scope
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
                          Type
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
                          Due
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
                      {rules.map(r => (
                        <tr key={r.rule_id} style={{
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
                              {r.rule_name}
                            </div>
                            <div style={{
                              fontFamily: 'monospace',
                              fontSize: 11,
                              color: 'var(--muted)',
                              marginTop: 2,
                            }}>
                              {r.rule_id}
                            </div>
                            {r.message && (
                              <div style={{
                                fontSize: 11,
                                color: 'var(--muted)',
                                marginTop: 2,
                                fontStyle: 'italic',
                              }}>
                                {r.message}
                              </div>
                            )}
                          </td>
                          <td style={{
                            padding: '10px 14px',
                            color: 'var(--ink)',
                          }}>
                            {r.module_name || r.module_id}
                          </td>
                          <td style={{
                            padding: '10px 14px',
                          }}>
                            <ScopeBadge scopeType={r.scope_type} scopeValue={r.scope_value} />
                          </td>
                          <td style={{
                            padding: '10px 14px',
                          }}>
                            <AssignmentTypeBadge type={r.assignment_type} />
                          </td>
                          <td style={{
                            padding: '10px 14px',
                            textAlign: 'center',
                            color: 'var(--ink)',
                          }}>
                            {r.due_days || 0} day(s)
                          </td>
                          <td style={{
                            padding: '10px 14px',
                            textAlign: 'center',
                          }}>
                            <button
                              onClick={() => deleteRule(r.rule_id)}
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
                              🚫 Disable
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!rules.length && (
                        <tr>
                          <td colSpan="6" style={{
                            textAlign: 'center',
                            color: 'var(--muted)',
                            padding: '48px 20px',
                          }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                              No auto assignment rules configured
                            </div>
                            <div style={{ fontSize: 13, marginTop: 4 }}>
                              Create a rule above to automatically assign modules to users
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

          {/* Edit Module Modal */}
          {editModule && (
            <div
              onClick={() => setEditModule(null)}
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
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'var(--card-solid)',
                  borderRadius: '20px',
                  maxWidth: 500,
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
                }}
              >
                <div style={{
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
                    ✏️ Edit Independent Module
                  </b>
                  <button
                    onClick={() => setEditModule(null)}
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
                <form onSubmit={saveModuleEdit} style={{
                  padding: '20px',
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
                      Module Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      value={editModule.moduleName}
                      onChange={e => setEditModule(p => ({ ...p, moduleName: e.target.value }))}
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
                        Category
                      </label>
                      <input
                        value={editModule.category}
                        onChange={e => setEditModule(p => ({ ...p, category: e.target.value }))}
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
                        Est. Minutes
                      </label>
                      <input
                        type="number"
                        value={editModule.estimatedMins}
                        onChange={e => setEditModule(p => ({ ...p, estimatedMins: e.target.value }))}
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
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}>
                    <input
                      placeholder="Process"
                      value={editModule.process}
                      onChange={e => setEditModule(p => ({ ...p, process: e.target.value }))}
                      style={{
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
                    <input
                      placeholder="LOB"
                      value={editModule.lob}
                      onChange={e => setEditModule(p => ({ ...p, lob: e.target.value }))}
                      style={{
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
                  <textarea
                    rows="2"
                    placeholder="Description"
                    value={editModule.description}
                    onChange={e => setEditModule(p => ({ ...p, description: e.target.value }))}
                    style={{
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
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 8,
                    paddingTop: 8,
                    borderTop: '1px solid var(--line)',
                  }}>
                    <button
                      type="button"
                      onClick={() => setEditModule(null)}
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
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {saving ? '⏳ Saving...' : '💾 Update Module'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Assign Content Modal */}
          {assignContent.show && (
            <div
              onClick={() => setAssignContent({ moduleId: '', show: false, query: '', results: [] })}
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
                onClick={e => e.stopPropagation()}
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
                <div style={{
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
                    📄 Add Content to Module
                  </b>
                  <button
                    onClick={() => setAssignContent({ moduleId: '', show: false, query: '', results: [] })}
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
                <div style={{
                  padding: '20px',
                  display: 'grid',
                  gap: 12,
                }}>
                  <div style={{
                    display: 'flex',
                    gap: 8,
                  }}>
                    <input
                      value={assignContent.query}
                      onChange={e => setAssignContent(p => ({ ...p, query: e.target.value }))}
                      placeholder="🔍 Search content repository..."
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
                      onClick={searchContentForAssign}
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
                  </div>
                  <div style={{
                    maxHeight: 320,
                    overflowY: 'auto',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                  }}>
                    <table style={{
                      width: '100%',
                      fontSize: 13,
                      borderCollapse: 'collapse',
                    }}>
                      <thead>
                        <tr style={{
                          background: 'var(--card)',
                          borderBottom: '1px solid var(--line)',
                        }}>
                          <th style={{
                            padding: '8px 12px',
                            textAlign: 'left',
                            fontWeight: 600,
                            color: 'var(--muted)',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}>
                            Title
                          </th>
                          <th style={{
                            padding: '8px 12px',
                            textAlign: 'left',
                            fontWeight: 600,
                            color: 'var(--muted)',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}>
                            Type
                          </th>
                          <th style={{
                            padding: '8px 12px',
                            textAlign: 'left',
                            fontWeight: 600,
                            color: 'var(--muted)',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}>
                            Category
                          </th>
                          <th style={{
                            padding: '8px 12px',
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
                        {(assignContent.results.length ? assignContent.results : repoItems).map(item => (
                          <tr key={item.repository_content_id} style={{
                            borderBottom: '1px solid var(--line)',
                          }}>
                            <td style={{
                              padding: '8px 12px',
                              fontWeight: 500,
                              color: 'var(--ink)',
                            }}>
                              {item.title}
                            </td>
                            <td style={{
                              padding: '8px 12px',
                            }}>
                              <ContentTypeBadge type={item.content_type} />
                            </td>
                            <td style={{
                              padding: '8px 12px',
                              color: 'var(--muted)',
                            }}>
                              {item.category || '—'}
                            </td>
                            <td style={{
                              padding: '8px 12px',
                              textAlign: 'center',
                            }}>
                              <button
                                onClick={() => addContentToModule(item.repository_content_id)}
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  fontSize: 11,
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
                                ➕ Add
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!repoItems.length && !assignContent.results.length && (
                          <tr>
                            <td colSpan="4" style={{
                              textAlign: 'center',
                              color: 'var(--muted)',
                              padding: '24px',
                            }}>
                              No content available. Add items in Content Repository first.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ========== TAB: EVIDENCE MAPPING ========== */}
      {/* ============================================================== */}
      {mainTab === 'evidence' && (
        <div>
          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14,
            marginBottom: 24,
          }}>
            <StatCard label="Total Skills" value={catalog.skills.length} icon="🎯" color="rgba(99,102,241,0.1)" />
            <StatCard label="Active Mappings" value={mappings.length} icon="🔗" color="rgba(34,197,94,0.1)" />
            <StatCard label="Content Items" value={catalog.contents.length} icon="📄" color="rgba(245,158,11,0.1)" />
            <StatCard label="Assessments" value={catalog.assessments.length} icon="📝" color="rgba(239,68,68,0.1)" />
          </div>

          {/* Sub Tabs */}
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
              onClick={() => setEvidenceTab('mapping')}
              style={{
                flex: 1,
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: evidenceTab === 'mapping' ? '#6366f1' : 'transparent',
                color: evidenceTab === 'mapping' ? '#fff' : 'var(--muted)',
                fontWeight: evidenceTab === 'mapping' ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s',
              }}
            >
              🔗 Evidence Mapping
            </button>
            <button
              onClick={() => setEvidenceTab('verification')}
              style={{
                flex: 1,
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: evidenceTab === 'verification' ? '#6366f1' : 'transparent',
                color: evidenceTab === 'verification' ? '#fff' : 'var(--muted)',
                fontWeight: evidenceTab === 'verification' ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s',
              }}
            >
              👤 Employee Verification
            </button>
          </div>

          {/* Evidence Mapping View */}
          {evidenceTab === 'mapping' && (
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
                              onClick={() => removeEvidenceMapping(row)}
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
                onSubmit={saveEvidenceMapping}
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
          {evidenceTab === 'verification' && (
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
                    <div style={{
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
        </div>
      )}
    </div>
  );
}

// ============================================================
// ==================== EDIT QUESTION FORM COMPONENT ====================
// ============================================================

function EditQuestionForm({ question, saving, onClose, onSave }) {
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
  );
}