import { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import BatchCreationWizard from './BatchCreationWizard.jsx';

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
  const colors = {
    Active: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', icon: '🟢' },
    Completed: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', icon: '✅' },
    Pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: '⏳' },
    Archived: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', icon: '📦' },
    'On Track': { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', icon: '✅' },
    'Needs Attention': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: '⚠️' },
    'At Risk': { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', icon: '🔴' },
  };
  const config = colors[status] || colors.Pending;
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 12px',
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

function RiskBadge({ status }) {
  const colors = {
    CRITICAL: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', icon: '🚨' },
    HIGH: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', icon: '🔴' },
    MEDIUM: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: '🟡' },
    LOW: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', icon: '🟢' },
  };
  const config = colors[status] || colors.LOW;
  
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

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      flex: 1,
      maxWidth: 400,
    }}>
      <input
        type="text"
        placeholder={placeholder || '🔍 Search...'}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: '8px 14px',
          borderRadius: '10px',
          border: '1px solid var(--line)',
          background: 'var(--card)',
          color: 'var(--ink)',
          fontSize: 13,
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#6366f1';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--line)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

// ============================================================
// ==================== MAIN COMPONENT ====================
// ============================================================

export default function BatchesPage({ navigate }) {
  // ---- BATCH STATE ----
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [sortField, setSortField] = useState('batchNo');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'branch'

  // ---- BRANCH STATE ----
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchDetail, setBranchDetail] = useState(null);
  const [branchDetailTab, setBranchDetailTab] = useState('users');
  const [branchLoading, setBranchLoading] = useState(false);

  // ============================================================
  // ==================== LOAD FUNCTIONS ====================
  // ============================================================

  function toast(text, ok = true) { 
    setMsg({ text, ok }); 
    setTimeout(() => setMsg({ text: '', ok: true }), 5000); 
  }

  async function loadBatches() {
    setLoading(true);
    const res = await api.get('/admin/batches', 'admin');
    setLoading(false);
    if (res.ok) {
      setBatches(res.data);
      setFilteredBatches(res.data);
    } else {
      toast(res.message || 'Failed to load batches.', false);
    }
  }

  async function loadBranches() {
    const res = await api.get('/admin/branches', 'admin');
    if (res.ok) setBranches(res.data);
  }

  async function loadBranchDetail(branchName) {
    setSelectedBranch(branchName);
    setBranchDetail(null);
    const res = await api.get(`/admin/branches/${encodeURIComponent(branchName)}`, 'admin');
    if (res.ok) setBranchDetail(res.data);
  }

  useEffect(() => {
    loadBatches();
    loadBranches();
  }, []);

  // ============================================================
  // ==================== FILTERS & SORT ====================
  // ============================================================

  useEffect(() => {
    let result = [...batches];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(b => 
        b.batchNo?.toLowerCase().includes(term) ||
        b.batchName?.toLowerCase().includes(term) ||
        b.coordinatorName?.toLowerCase().includes(term) ||
        b.branch?.toLowerCase().includes(term) ||
        b.process?.toLowerCase().includes(term)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(b => b.batchStatus === statusFilter);
    }
    
    // Filter by branch
    if (branchFilter !== 'all') {
      result = result.filter(b => b.branch === branchFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredBatches(result);
  }, [batches, searchTerm, statusFilter, branchFilter, sortField, sortDirection]);

  // ============================================================
  // ==================== BATCH FUNCTIONS ====================
  // ============================================================

  async function doDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    const res = await api.delete(`/admin/batches/${encodeURIComponent(confirmDelete.batchNo)}`, 'admin');
    setDeleting(false);
    setConfirmDelete(null);
    if (res.ok) { 
      toast(`✅ Batch ${confirmDelete.batchNo} deleted successfully.`); 
      loadBatches(); 
    } else toast(res.message || 'Delete failed.', false);
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function getStatusOptions() {
    const statuses = ['all', ...new Set(batches.map(b => b.batchStatus))];
    return statuses;
  }

  function getBranchOptions() {
    const branchNames = ['all', ...new Set(batches.map(b => b.branch).filter(Boolean))];
    return branchNames;
  }

  // ============================================================
  // ==================== STATS ====================
  // ============================================================

  const totalBatches = batches.length;
  const activeBatches = batches.filter(b => b.batchStatus === 'Active').length;
  const completedBatches = batches.filter(b => b.batchStatus === 'Completed').length;
  const totalTrainees = batches.reduce((sum, b) => sum + (b.traineeCount || 0), 0);
  const totalBranches = branches.length;

  // ============================================================
  // ==================== RENDER ====================
  // ============================================================

  if (loading) {
    return (
      <div style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 400,
        gap: 16,
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid var(--line)',
          borderTopColor: '#6366f1',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      {/* ========== HEADER ========== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 4,
          }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>🏢</span>
            <h2 style={{
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--ink)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              Batches & Branches
            </h2>
            <span style={{
              padding: '2px 10px',
              borderRadius: '99px',
              background: 'rgba(99,102,241,0.1)',
              color: '#6366f1',
              fontSize: 12,
              fontWeight: 600,
            }}>
              {totalBatches}
            </span>
          </div>
          <p style={{
            fontSize: 13,
            color: 'var(--muted)',
            margin: '4px 0 0',
          }}>
            Manage training batches, track progress, and monitor branch-wise performance.
          </p>
        </div>
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'branch' : 'list')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              background: viewMode === 'branch' ? 'rgba(99,102,241,0.1)' : 'var(--card-solid)',
              color: viewMode === 'branch' ? '#6366f1' : 'var(--ink)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
              e.currentTarget.style.borderColor = '#6366f140';
            }}
            onMouseLeave={(e) => {
              if (viewMode !== 'branch') {
                e.currentTarget.style.background = 'var(--card-solid)';
                e.currentTarget.style.borderColor = 'var(--line)';
              }
            }}
          >
            {viewMode === 'list' ? '🏢 Branch View' : '📋 List View'}
          </button>
          <button
            onClick={() => setShowWizard(true)}
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
              gap: 8,
              whiteSpace: 'nowrap',
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
            <span style={{ fontSize: 18 }}>✨</span> New Batch
          </button>
        </div>
      </div>

      {/* ========== TOAST ========== */}
      {msg.text && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: 16,
          background: msg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: 13,
            color: msg.ok ? '#22c55e' : '#ef4444',
          }}>
            {msg.ok ? '✅' : '❌'} {msg.text}
          </span>
          <button
            onClick={() => setMsg({ text: '', ok: true })}
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

      {/* ========== STATS ========== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 14,
        marginBottom: 24,
      }}>
        <StatCard label="Total Batches" value={totalBatches} icon="📚" color="rgba(99,102,241,0.1)" />
        <StatCard 
          label="Active" 
          value={activeBatches} 
          icon="🟢" 
          color="rgba(34,197,94,0.1)" 
          sub={totalBatches > 0 ? `${Math.round((activeBatches / totalBatches) * 100)}% of total` : '0%'}
        />
        <StatCard 
          label="Completed" 
          value={completedBatches} 
          icon="✅" 
          color="rgba(99,102,241,0.1)"
          sub={totalBatches > 0 ? `${Math.round((completedBatches / totalBatches) * 100)}% of total` : '0%'}
        />
        <StatCard label="Total Trainees" value={totalTrainees} icon="👤" color="rgba(245,158,11,0.1)" />
        <StatCard label="Total Branches" value={totalBranches} icon="🏢" color="rgba(6,182,212,0.1)" />
      </div>

      {/* ========== WIZARD ========== */}
      {showWizard && (
        <BatchCreationWizard 
          onClose={() => setShowWizard(false)} 
          onCreated={() => { loadBatches(); loadBranches(); setShowWizard(false); }} 
        />
      )}

      {/* ========== FILTERS ========== */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
        alignItems: 'center',
      }}>
        <SearchBar 
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="🔍 Search by name, ID, branch, process..."
        />
        
        <div style={{
          display: 'flex',
          gap: 4,
          padding: '4px',
          borderRadius: '10px',
          background: 'var(--card-solid)',
          border: '1px solid var(--line)',
          flexWrap: 'wrap',
        }}>
          {getStatusOptions().map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: statusFilter === status ? 600 : 500,
                background: statusFilter === status ? '#6366f1' : 'transparent',
                color: statusFilter === status ? '#fff' : 'var(--muted)',
                transition: 'all 0.15s',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}
            >
              {status === 'all' ? '📋 All' : status}
            </button>
          ))}
        </div>

        <select
          value={branchFilter}
          onChange={e => setBranchFilter(e.target.value)}
          style={{
            padding: '6px 14px',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            background: 'var(--card)',
            color: 'var(--ink)',
            fontSize: 12,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {getBranchOptions().map(branch => (
            <option key={branch} value={branch}>
              {branch === 'all' ? '🏢 All Branches' : `🏢 ${branch}`}
            </option>
          ))}
        </select>

        <button
          onClick={() => { loadBatches(); loadBranches(); }}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid var(--line)',
            background: 'var(--card-solid)',
            color: 'var(--ink)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
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
          🔄 Refresh
        </button>
      </div>

      {/* ============================================================ */}
      {/* ========== VIEW: LIST VIEW ========== */}
      {/* ============================================================ */}
      {viewMode === 'list' && (
        <div style={{
          background: 'var(--card-solid)',
          borderRadius: '16px',
          border: '1px solid var(--line)',
          overflow: 'hidden',
        }}>
          {filteredBatches.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--muted)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
                {searchTerm || statusFilter !== 'all' || branchFilter !== 'all' ? 'No matches found' : 'No batches created yet'}
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {searchTerm || statusFilter !== 'all' || branchFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Create your first batch to get started'
                }
              </div>
              {!searchTerm && statusFilter === 'all' && branchFilter === 'all' && (
                <button
                  onClick={() => setShowWizard(true)}
                  style={{
                    marginTop: 16,
                    padding: '10px 24px',
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
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  ✨ Create Batch
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', padding: '0 4px 4px' }}>
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
                      <th 
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: 'var(--muted)',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          cursor: 'pointer',
                          userSelect: 'none',
                          whiteSpace: 'nowrap',
                        }}
                        onClick={() => handleSort('batchNo')}
                      >
                        Batch {sortField === 'batchNo' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: 'var(--muted)',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          cursor: 'pointer',
                          userSelect: 'none',
                          whiteSpace: 'nowrap',
                        }}
                        onClick={() => handleSort('batchName')}
                      >
                        Name {sortField === 'batchName' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: 'var(--muted)',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Branch
                      </th>
                      <th 
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: 'var(--muted)',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          whiteSpace: 'nowrap',
                        }}
                        onClick={() => handleSort('batchStatus')}
                      >
                        Status {sortField === 'batchStatus' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: 'var(--muted)',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          whiteSpace: 'nowrap',
                        }}
                        onClick={() => handleSort('coordinatorName')}
                      >
                        Coordinator {sortField === 'coordinatorName' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: 'var(--muted)',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          whiteSpace: 'nowrap',
                        }}
                        onClick={() => handleSort('traineeCount')}
                      >
                        👤 Trainees {sortField === 'traineeCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: 'var(--muted)',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ⚠️ Risk
                      </th>
                      <th 
                        style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: 'var(--muted)',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map((b, index) => (
                      <tr 
                        key={b.batchNo} 
                        style={{
                          borderBottom: index < filteredBatches.length - 1 ? '1px solid var(--line)' : 'none',
                          transition: 'background 0.15s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--card)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                        onClick={() => navigate('batch-detail', { batchNo: b.batchNo })}
                      >
                        <td style={{
                          padding: '12px 16px',
                          fontWeight: 700,
                          color: '#6366f1',
                          fontSize: 13,
                          fontFamily: 'monospace',
                        }}>
                          {b.batchNo}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontWeight: 600,
                          color: 'var(--ink)',
                        }}>
                          {b.batchName || '—'}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontSize: 12,
                          color: 'var(--muted)',
                        }}>
                          {b.branch || '—'}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                        }}>
                          <StatusBadge status={b.batchStatus} />
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          color: 'var(--ink)',
                        }}>
                          {b.coordinatorName || '—'}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: 'var(--ink)',
                        }}>
                          {b.traineeCount || 0}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                        }}>
                          {b.atRiskCount > 0 ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: '99px',
                              background: 'rgba(239,68,68,0.12)',
                              color: '#ef4444',
                              fontSize: 12,
                              fontWeight: 700,
                            }}>
                              {b.atRiskCount}
                            </span>
                          ) : (
                            <span style={{
                              fontSize: 12,
                              color: 'var(--muted)',
                            }}>
                              —
                            </span>
                          )}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                        }}>
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setConfirmDelete(b); 
                            }}
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
                            title="Delete batch and all its data"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Footer */}
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--line)',
                fontSize: 12,
                color: 'var(--muted)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <span>
                  Showing {filteredBatches.length} of {batches.length} batches
                </span>
                <span>
                  {searchTerm && `Filtered by: "${searchTerm}"`}
                  {statusFilter !== 'all' && (searchTerm ? ' · ' : '')}
                  {statusFilter !== 'all' && `Status: ${statusFilter}`}
                  {branchFilter !== 'all' && ((searchTerm || statusFilter !== 'all') ? ' · ' : '')}
                  {branchFilter !== 'all' && `Branch: ${branchFilter}`}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ========== VIEW: BRANCH VIEW ========== */}
      {/* ============================================================ */}
      {viewMode === 'branch' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: 16,
        }}>
          {/* Branch List */}
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: 12,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: .5,
              marginBottom: 10,
            }}>
              {branches.length} Branch{branches.length !== 1 ? 'es' : ''}
            </div>
            
            {branches.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '32px 16px',
                background: 'var(--card)',
                borderRadius: 14,
                border: '1.5px dashed var(--line)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>No branches found</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  Branches appear here once batches or coordinators are assigned to them.
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gap: 8 }}>
              {branches.map(b => (
                <div
                  key={b.branch}
                  onClick={() => loadBranchDetail(b.branch)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1.5px solid',
                    borderColor: selectedBranch === b.branch ? '#6366f1' : 'var(--line)',
                    background: selectedBranch === b.branch ? 'rgba(99,102,241,0.12)' : 'var(--card-solid)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedBranch !== b.branch) {
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedBranch !== b.branch) {
                      e.currentTarget.style.borderColor = 'var(--line)';
                    }
                  }}
                >
                  <div style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: selectedBranch === b.branch ? '#6366f1' : 'var(--ink)',
                  }}>
                    🏢 {b.branch}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    marginTop: 4,
                  }}>
                    {b.processes.length > 0 ? b.processes.join(', ') : 'No processes'}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 8,
                    flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 99,
                      background: 'rgba(34,197,94,0.18)',
                      color: '#22c55e',
                    }}>
                      {b.activeBatches} active batch{b.activeBatches !== 1 ? 'es' : ''}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 99,
                      background: 'rgba(99,102,241,0.18)',
                      color: '#6366f1',
                    }}>
                      {b.users.length} user{b.users.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Branch Detail */}
          <div>
            {!selectedBranch && (
              <div style={{
                display: 'grid',
                placeItems: 'center',
                minHeight: 320,
                background: 'var(--card)',
                borderRadius: 16,
                border: '1.5px dashed var(--line)',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>←</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>
                    Select a branch to view details
                  </div>
                </div>
              </div>
            )}

            {selectedBranch && !branchDetail && (
              <div style={{
                display: 'grid',
                placeItems: 'center',
                minHeight: 200,
              }}>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
              </div>
            )}

            {selectedBranch && branchDetail && (
              <div>
                {/* Branch Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  borderRadius: 14,
                  padding: '18px 22px',
                  marginBottom: 16,
                }}>
                  <div style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,.7)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: .5,
                  }}>
                    Branch
                  </div>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: '#fff',
                    marginTop: 4,
                  }}>
                    🏢 {branchDetail.branch}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    marginTop: 10,
                    flexWrap: 'wrap',
                  }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>
                      {branchDetail.batches.length} batches total
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>·</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>
                      {branchDetail.users.length} portal users
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>·</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>
                      {branchDetail.trainees.length} active trainees
                    </span>
                  </div>
                </div>

                {/* Branch Tabs */}
                <div style={{
                  display: 'flex',
                  gap: 4,
                  marginBottom: 16,
                  background: 'var(--card)',
                  borderRadius: 10,
                  padding: 4,
                }}>
                  {[
                    ['users', `Users (${branchDetail.users.length})`],
                    ['batches', `Batches (${branchDetail.batches.length})`],
                    ['trainees', `Trainees (${branchDetail.trainees.length})`],
                  ].map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setBranchDetailTab(k)}
                      style={{
                        flex: 1,
                        padding: '7px 12px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: branchDetailTab === k ? 'var(--card-solid)' : 'transparent',
                        color: branchDetailTab === k ? 'var(--ink)' : 'var(--muted)',
                        fontWeight: branchDetailTab === k ? 700 : 500,
                        fontSize: 12,
                        boxShadow: branchDetailTab === k ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.12s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Branch Users Tab */}
                {branchDetailTab === 'users' && (
                  <div style={{
                    background: 'var(--card-solid)',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    overflow: 'hidden',
                  }}>
                    {branchDetail.users.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '32px',
                        color: 'var(--muted)',
                        fontSize: 13,
                      }}>
                        No portal users assigned to this branch.
                      </div>
                    ) : (
                      <div style={{ padding: '12px' }}>
                        {branchDetail.users.map(u => (
                          <div key={u.loginId} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--line)',
                          }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: 'rgba(99,102,241,0.2)',
                              color: '#6366f1',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 900,
                              fontSize: 13,
                              flexShrink: 0,
                            }}>
                              {(u.name || u.loginId).slice(0, 2).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
                                {u.name || u.loginId}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                {u.loginId} · {u.role}
                                {u.process ? ` · ${u.process}` : ''}
                              </div>
                            </div>
                            <span style={{
                              display: 'inline-flex',
                              padding: '2px 10px',
                              borderRadius: '99px',
                              background: 'rgba(99,102,241,0.1)',
                              color: '#6366f1',
                              fontSize: 10,
                              fontWeight: 600,
                            }}>
                              {u.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Branch Batches Tab */}
                {branchDetailTab === 'batches' && (
                  <div style={{
                    background: 'var(--card-solid)',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    overflow: 'hidden',
                  }}>
                    {branchDetail.batches.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '32px',
                        color: 'var(--muted)',
                        fontSize: 13,
                      }}>
                        No batches for this branch.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', padding: '0 4px 4px' }}>
                        <table style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: 12.5,
                        }}>
                          <thead>
                            <tr style={{
                              background: 'var(--card)',
                              borderBottom: '1.5px solid var(--line)',
                            }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>
                                Batch No
                              </th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>
                                Process / LOB
                              </th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>
                                Coordinator
                              </th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>
                                Trainees
                              </th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>
                                Start Date
                              </th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {branchDetail.batches.map(b => (
                              <tr key={b.batchNo} style={{
                                borderBottom: '1px solid var(--line)',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--card)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                              onClick={() => navigate('batch-detail', { batchNo: b.batchNo })}
                              >
                                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', fontSize: 12 }}>
                                  {b.batchNo}
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: 12 }}>
                                  {b.process}{b.lob ? ` / ${b.lob}` : ''}
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: 12 }}>
                                  {b.coordinatorName || '—'}
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>
                                  {b.totalTrainees || 0}
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: 12 }}>
                                  {b.startDate ? new Date(b.startDate).toLocaleDateString('en-IN') : '—'}
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                  <StatusBadge status={b.batchStatus} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Branch Trainees Tab */}
                {branchDetailTab === 'trainees' && (
                  <div style={{
                    background: 'var(--card-solid)',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    overflow: 'hidden',
                  }}>
                    {branchDetail.trainees.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '32px',
                        color: 'var(--muted)',
                        fontSize: 13,
                      }}>
                        No active trainees in this branch.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', padding: '0 4px 4px' }}>
                        <table style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: 12.5,
                        }}>
                          <thead>
                            <tr style={{
                              background: 'var(--card)',
                              borderBottom: '1.5px solid var(--line)',
                            }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>
                                Employee ID
                              </th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>
                                Name
                              </th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>
                                Batch
                              </th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>
                                Process
                              </th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>
                                Course %
                              </th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>
                                Risk
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {branchDetail.trainees.map(t => (
                              <tr key={t.employeeId} style={{
                                borderBottom: '1px solid var(--line)',
                              }}>
                                <td style={{ padding: '8px 12px' }}>
                                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>
                                    {t.employeeId}
                                  </span>
                                  {t.empIdType === 'TEMP' && (
                                    <span style={{
                                      marginLeft: 6,
                                      background: '#d97706',
                                      color: '#fff',
                                      borderRadius: 4,
                                      fontSize: 9,
                                      fontWeight: 700,
                                      padding: '1px 6px',
                                    }}>
                                      TEMP
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600 }}>
                                  {t.traineeName}
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: 12 }}>
                                  {t.batchNo || '—'}
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: 12 }}>
                                  {t.process || '—'}
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12 }}>
                                  <span style={{
                                    fontWeight: 700,
                                    color: (t.courseCompletionPct || 0) >= 80 ? '#22c55e' : (t.courseCompletionPct || 0) >= 60 ? '#f59e0b' : '#ef4444',
                                  }}>
                                    {Math.round(t.courseCompletionPct || 0)}%
                                  </span>
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                  <RiskBadge status={t.riskStatus} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      {/* ============================================================ */}
      {confirmDelete && (
        <div 
          onClick={e => e.target === e.currentTarget && !deleting && setConfirmDelete(null)}
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
              <b style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>⚠️</span> Delete Batch
              </b>
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px' }}>
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
                  fontSize: 14,
                  marginBottom: 6,
                }}>
                  ⚠ This action cannot be undone.
                </div>
                <p style={{
                  fontSize: 13,
                  color: 'var(--ink)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  Deleting batch <b style={{ color: '#ef4444' }}>{confirmDelete.batchNo}</b> will permanently remove:
                </p>
                <ul style={{
                  margin: '8px 0 0 16px',
                  padding: 0,
                  fontSize: 12,
                  color: 'var(--muted)',
                  lineHeight: 1.8,
                }}>
                  <li>All {confirmDelete.traineeCount || 0} trainees in this batch</li>
                  <li>All attendance records</li>
                  <li>All onboarding logs</li>
                  <li>All classroom assignments</li>
                </ul>
              </div>
              
              <p style={{
                fontSize: 13,
                color: 'var(--muted)',
                marginBottom: 16,
              }}>
                Type <b style={{ color: '#ef4444' }}>DELETE</b> to confirm:
              </p>
              
              <input
                type="text"
                placeholder="Type DELETE to confirm"
                value={confirmDelete.confirmText || ''}
                onChange={e => setConfirmDelete(prev => ({ ...prev, confirmText: e.target.value.toUpperCase() }))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${confirmDelete.confirmText === 'DELETE' ? 'rgba(239,68,68,0.3)' : 'var(--line)'}`,
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  fontSize: 13,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'monospace',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = confirmDelete.confirmText === 'DELETE' ? 'rgba(239,68,68,0.3)' : 'var(--line)';
                }}
                disabled={deleting}
              />
              
              <div style={{
                display: 'flex',
                gap: 10,
                marginTop: 18,
                justifyContent: 'flex-end',
              }}>
                <button
                  onClick={() => setConfirmDelete(null)}
                  disabled={deleting}
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
                    opacity: deleting ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) e.currentTarget.style.background = 'var(--card)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--card-solid)';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={doDelete}
                  disabled={deleting || confirmDelete.confirmText !== 'DELETE'}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: (deleting || confirmDelete.confirmText !== 'DELETE') 
                      ? 'rgba(150,150,150,0.3)' 
                      : 'rgba(239,68,68,0.85)',
                    color: (deleting || confirmDelete.confirmText !== 'DELETE') 
                      ? 'var(--muted)' 
                      : '#fff',
                    cursor: (deleting || confirmDelete.confirmText !== 'DELETE') 
                      ? 'not-allowed' 
                      : 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting && confirmDelete.confirmText === 'DELETE') {
                      e.currentTarget.style.background = 'rgba(220,38,38,0.95)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!deleting && confirmDelete.confirmText === 'DELETE') {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.85)';
                    }
                  }}
                >
                  {deleting ? '⏳ Deleting...' : '🗑️ Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}