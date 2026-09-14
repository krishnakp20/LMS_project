import { useState, useEffect } from 'react';
import { api, uploadFile } from '../../utils/api.js';
import ClassroomWizard from './ClassroomWizard.jsx';
import EditClassroomModal from './curriculum/EditClassroomModal.jsx';
import ContentCard from './curriculum/ContentCard.jsx';
import DeleteClassroomModal from './curriculum/DeleteClassroomModal.jsx';
import TYPE_META from './curriculum/constants.js';

// ========== CLASSROOM CARD (Enhanced) ==========
function ClassroomCard({ cl, selected, onClick, onMenuAction }) {
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const hue = colors[cl.classroomName.charCodeAt(0) % colors.length];
  const initials = cl.classroomName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={onClick}
        style={{
          cursor: 'pointer',
          borderRadius: 14,
          border: `2px solid ${selected ? hue : 'rgba(203,213,225,0.4)'}`,
          background: selected ? `${hue}15` : '#ffffff',
          padding: '14px 16px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: selected 
            ? `0 4px 20px ${hue}25, inset 0 0 0 1px ${hue}30` 
            : '0 2px 8px rgba(0,0,0,0.04)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={() => setShowMenu(true)}
        onMouseLeave={() => setShowMenu(false)}
      >
        {selected && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: 3,
            background: `linear-gradient(90deg, ${hue}, ${hue}80)`,
          }} />
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: selected ? hue : 'rgba(99,102,241,0.08)',
            color: selected ? '#fff' : hue,
            display: 'grid', placeItems: 'center',
            fontWeight: 800, fontSize: 15, flexShrink: 0,
            transition: 'all 0.2s',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700, fontSize: 14,
              color: selected ? hue : '#0f172a',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {cl.classroomName}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
              {cl.process}{cl.lob ? ` · ${cl.lob}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 600,
                padding: '2px 10px', borderRadius: 99,
                background: selected ? `${hue}20` : 'rgba(241,245,249,0.8)',
                color: selected ? hue : '#475569',
              }}>
                {cl._count?.modules || 0} {cl._count?.modules === 1 ? 'Module' : 'Modules'}
              </span>
              {cl.driveFolderId ? (
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  padding: '2px 10px', borderRadius: 99,
                  background: 'rgba(34,197,94,0.12)',
                  color: '#22c55e',
                }}>
                  🟢 Drive Synced
                </span>
              ) : (
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  padding: '2px 10px', borderRadius: 99,
                  background: 'rgba(239,68,68,0.08)',
                  color: '#ef4444',
                }}>
                  🔴 Drive Not Synced
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Three-Dot Menu */}
      {selected && (
        <div 
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            opacity: showMenu ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              const wrapper = document.createElement('div');
              wrapper.style.position = 'fixed';
              wrapper.style.top = '0';
              wrapper.style.left = '0';
              wrapper.style.width = '100%';
              wrapper.style.height = '100%';
              wrapper.style.zIndex = '9999';
              wrapper.style.background = 'rgba(0,0,0,0.01)';
              
              const menu = document.createElement('div');
              menu.style.position = 'absolute';
              menu.style.top = '30px';
              menu.style.right = '0';
              menu.style.background = '#ffffff';
              menu.style.borderRadius = '12px';
              menu.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
              menu.style.border = '1px solid #f1f5f9';
              menu.style.padding = '6px';
              menu.style.minWidth = '200px';
              menu.style.zIndex = '10000';
              
              const items = [
                { icon: '✏️', label: 'Edit Classroom', action: 'edit' },
                { icon: '📋', label: 'Duplicate Classroom', action: 'duplicate' },
                { icon: '📦', label: 'Archive Classroom', action: 'archive' },
                { icon: '🗑️', label: 'Delete Classroom', action: 'delete', danger: true },
                { icon: '🔄', label: 'Sync with Drive', action: 'sync' },
              ];
              
              items.forEach(item => {
                const btn = document.createElement('button');
                btn.style.cssText = `
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  padding: 8px 14px;
                  width: 100%;
                  border: none;
                  background: transparent;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 13px;
                  font-weight: 500;
                  color: ${item.danger ? '#dc2626' : '#0f172a'};
                  transition: background 0.15s;
                `;
                btn.innerHTML = `${item.icon} ${item.label}`;
                btn.onmouseenter = () => btn.style.background = item.danger ? '#fef2f2' : '#f8fafc';
                btn.onmouseleave = () => btn.style.background = 'transparent';
                btn.onclick = () => {
                  document.body.removeChild(wrapper);
                  onMenuAction(item.action);
                };
                menu.appendChild(btn);
              });
              
              wrapper.appendChild(menu);
              document.body.appendChild(wrapper);
              wrapper.onclick = () => document.body.removeChild(wrapper);
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              fontSize: 16,
              color: '#64748b',
              display: 'grid',
              placeItems: 'center',
              transition: 'all 0.15s',
            }}
          >
            ⋮
          </button>
        </div>
      )}
    </div>
  );
}

// ========== MODULE CARD (Enhanced) ==========
function ModuleCard({ mod, selected, onSelect, onDelete }) {
  const dayColors = { 1: '#6366f1', 2: '#22c55e', 3: '#f59e0b', 4: '#ef4444', 5: '#8b5cf6' };
  const c = dayColors[(mod.dayNo % 5) || 5] || '#6366f1';

  return (
    <div
      onClick={onSelect}
      style={{
        cursor: 'pointer',
        borderRadius: 12,
        border: `1.5px solid ${selected ? c : 'rgba(203,213,225,0.3)'}`,
        background: selected ? `${c}12` : '#ffffff',
        padding: '12px 14px',
        transition: 'all 0.15s',
        boxShadow: selected ? `0 0 0 3px ${c}25` : '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: selected ? c : 'rgba(99,102,241,0.08)',
        color: selected ? '#fff' : c,
        display: 'grid', placeItems: 'center',
        fontWeight: 800, fontSize: 12, flexShrink: 0,
        transition: 'all 0.15s',
      }}>
        D{mod.dayNo}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600, fontSize: 13,
          color: selected ? c : '#0f172a',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {mod.moduleTitle}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
          {mod._count?.contents || 0} {mod._count?.contents === 1 ? 'item' : 'items'} · {mod._count?.faqs || 0} FAQs
        </div>
      </div>
      <button
        style={{
          flexShrink: 0,
          padding: '3px 8px',
          fontSize: 11,
          background: 'rgba(239,68,68,0.08)',
          color: '#ef4444',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 600,
          transition: 'background 0.15s',
        }}
        onClick={e => { e.stopPropagation(); onDelete(mod.moduleId); }}
      >
        ✕
      </button>
    </div>
  );
}

// ========== SKELETON LOADER ==========
function SkeletonLoader({ count = 3, height = 80 }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          style={{
            height: height,
            borderRadius: 12,
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      ))}
    </div>
  );
}

// ========== AI VIDEO ANALYSIS COMPONENT ==========
function AIVideoAnalysis({ moduleId, onClose }) {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState('summary');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please upload a video file');
        return;
      }
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (videoUrl.trim()) {
      analyzeVideo();
    }
  };

  const analyzeVideo = async () => {
    if (!videoFile && !videoUrl) {
      setError('Please upload a video or provide a URL');
      return;
    }

    setLoading(true);
    setProgress(10);
    setError('');

    try {
      let response;
      
      if (videoFile) {
        // Upload and analyze
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('moduleId', moduleId);
        formData.append('analysisType', analysisType);

        const token = localStorage.getItem('lms_token_admin') || '';
        const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${BASE}/admin/video/analyze`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 70) + 10;
            setProgress(pct);
          }
        };

        const promise = new Promise((resolve, reject) => {
          xhr.onload = () => {
            try {
              const data = JSON.parse(xhr.responseText);
              if (xhr.status === 200) {
                resolve(data);
              } else {
                reject(new Error(data.message || 'Analysis failed'));
              }
            } catch (e) {
              reject(new Error('Invalid response from server'));
            }
          };
          xhr.onerror = () => reject(new Error('Network error'));
        });

        xhr.send(formData);
        response = await promise;
      } else {
        // Analyze from URL
        const token = localStorage.getItem('lms_token_admin') || '';
        const BASE = (import.meta.env.VITE_API_URL || '') + '/api';
        
        const res = await fetch(`${BASE}/admin/video/analyze-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            url: videoUrl,
            moduleId,
            analysisType
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Analysis failed');
        response = data;
      }

      setProgress(100);
      setAnalysis(response.data || response);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to analyze video');
      setLoading(false);
      setProgress(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-head">
          <b>🤖 AI Video Analysis</b>
          <button className="btn small secondary" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {!analysis ? (
            <>
              {/* Upload Section */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button
                    onClick={() => setVideoFile(null)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 8,
                      border: videoFile ? '1px solid #d1d5db' : '2px solid #6366f1',
                      background: videoFile ? 'transparent' : '#6366f1',
                      color: videoFile ? '#64748b' : '#fff',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    📁 Upload File
                  </button>
                  <button
                    onClick={() => { setVideoFile(null); setVideoUrl(''); }}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 8,
                      border: !videoFile && videoUrl ? '2px solid #6366f1' : '1px solid #d1d5db',
                      background: !videoFile && videoUrl ? '#6366f1' : 'transparent',
                      color: !videoFile && videoUrl ? '#fff' : '#64748b',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    🔗 URL
                  </button>
                </div>

                {videoFile ? (
                  <div style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: 12,
                    padding: '20px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>🎬</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{videoFile.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                    <button
                      onClick={() => setVideoFile(null)}
                      style={{
                        marginTop: 8,
                        padding: '4px 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#f1f5f9',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUrlSubmit} style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="url"
                      placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #d1d5db',
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '10px 20px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#6366f1',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Analyze
                    </button>
                  </form>
                )}
              </div>

              {/* Video Preview */}
              {(videoFile || videoUrl) && (
                <div style={{ marginBottom: 16 }}>
                  <video
                    controls
                    style={{
                      width: '100%',
                      borderRadius: 10,
                      maxHeight: 300,
                      background: '#000',
                    }}
                    src={videoUrl}
                  />
                </div>
              )}

              {/* Analysis Type Selector */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Analysis Type
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    ['summary', '📝 Summary'],
                    ['keypoints', '🎯 Key Points'],
                    ['transcript', '📄 Transcript'],
                    ['sentiment', '😊 Sentiment'],
                    ['qa', '❓ Q&A'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setAnalysisType(value)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: analysisType === value ? '2px solid #6366f1' : '1px solid #d1d5db',
                        background: analysisType === value ? '#6366f115' : 'transparent',
                        color: analysisType === value ? '#6366f1' : '#64748b',
                        fontWeight: analysisType === value ? 600 : 400,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: 13,
                  marginBottom: 12,
                }}>
                  ❌ {error}
                </div>
              )}

              {videoFile && !loading && (
                <button
                  onClick={analyzeVideo}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                  }}
                >
                  🚀 Analyze Video
                </button>
              )}

              {loading && (
                <div style={{ marginTop: 12 }}>
                  <div style={{
                    height: 6,
                    borderRadius: 3,
                    background: '#f1f5f9',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
                    {progress < 30 ? 'Uploading video...' : 
                     progress < 60 ? 'Processing video...' : 
                     progress < 90 ? 'Analyzing with AI...' : 'Almost done...'}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Analysis Results */}
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <div>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Analysis Results</span>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Powered by AI</div>
                  </div>
                  <button
                    onClick={() => setAnalysis(null)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      background: 'transparent',
                      color: '#64748b',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    New Analysis
                  </button>
                </div>

                {/* Summary */}
                {analysis.summary && (
                  <div style={{
                    padding: 16,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366f115, #8b5cf615)',
                    border: '1px solid #6366f130',
                    marginBottom: 12,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                      📝 Summary
                    </div>
                    <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
                      {analysis.summary}
                    </div>
                  </div>
                )}

                {/* Key Points */}
                {analysis.keyPoints && analysis.keyPoints.length > 0 && (
                  <div style={{
                    padding: 16,
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginBottom: 12,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                      🎯 Key Points
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'none' }}>
                      {analysis.keyPoints.map((point, i) => (
                        <li key={i} style={{
                          fontSize: 13,
                          color: '#475569',
                          padding: '4px 0',
                          borderBottom: i < analysis.keyPoints.length - 1 ? '1px solid #e2e8f0' : 'none',
                          display: 'flex',
                          gap: 8,
                          alignItems: 'flex-start',
                        }}>
                          <span style={{ color: '#6366f1', fontWeight: 700 }}>•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Transcript */}
                {analysis.transcript && analysis.transcript.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <button
                      onClick={() => setShowTranscript(!showTranscript)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#0f172a',
                      }}
                    >
                      📄 Transcript
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        {showTranscript ? '▼' : '▶'}
                      </span>
                    </button>
                    {showTranscript && (
                      <div style={{
                        marginTop: 8,
                        padding: 12,
                        borderRadius: 8,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        maxHeight: 300,
                        overflowY: 'auto',
                      }}>
                        {analysis.transcript.map((entry, i) => (
                          <div key={i} style={{
                            display: 'flex',
                            gap: 12,
                            padding: '4px 0',
                            borderBottom: i < analysis.transcript.length - 1 ? '1px solid #f1f5f9' : 'none',
                            fontSize: 13,
                            color: '#334155',
                          }}>
                            <span style={{ color: '#94a3b8', fontWeight: 600, flexShrink: 0, width: 50 }}>
                              {formatTime(entry.timestamp)}
                            </span>
                            <span>{entry.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sentiment */}
                {analysis.sentiment && (
                  <div style={{
                    padding: 16,
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginBottom: 12,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                      😊 Sentiment Analysis
                    </div>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      {analysis.sentiment.map((item, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: 24,
                            color: item.score > 0.6 ? '#22c55e' : item.score > 0.3 ? '#f59e0b' : '#ef4444',
                          }}>
                            {item.emotion}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{item.label}</div>
                          <div style={{
                            width: 80,
                            height: 4,
                            borderRadius: 2,
                            background: '#f1f5f9',
                            marginTop: 4,
                          }}>
                            <div style={{
                              width: `${item.score * 100}%`,
                              height: '100%',
                              borderRadius: 2,
                              background: item.score > 0.6 ? '#22c55e' : item.score > 0.3 ? '#f59e0b' : '#ef4444',
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Q&A */}
                {analysis.qa && analysis.qa.length > 0 && (
                  <div style={{
                    padding: 16,
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                      ❓ Q&A from Video
                    </div>
                    {analysis.qa.map((item, i) => (
                      <div key={i} style={{
                        padding: '8px 0',
                        borderBottom: i < analysis.qa.length - 1 ? '1px solid #e2e8f0' : 'none',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                          Q: {item.question}
                        </div>
                        <div style={{ fontSize: 13, color: '#475569', marginTop: 4, paddingLeft: 16 }}>
                          A: {item.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!analysis.summary && !analysis.keyPoints && !analysis.transcript && !analysis.sentiment && !analysis.qa && (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    background: '#f8fafc',
                    borderRadius: 10,
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>🤖</div>
                    <div style={{ fontSize: 14, color: '#64748b' }}>No analysis data available</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try analyzing with a different method</div>
                  </div>
                )}
              </div>

              {/* Save to Module Button */}
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('lms_token_admin') || '';
                    const BASE = (import.meta.env.VITE_API_URL || '') + '/api';
                    await fetch(`${BASE}/admin/modules/${moduleId}/ai-analysis`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ analysis })
                    });
                    alert('✅ AI analysis saved to module!');
                    onClose();
                  } catch (err) {
                    alert('❌ Failed to save: ' + err.message);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                💾 Save Analysis to Module
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function CurriculumTab() {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedCl, setSelectedCl] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedMod, setSelectedMod] = useState(null);
  const [contents, setContents] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [showAddMod, setShowAddMod] = useState(false);
  const [showAddContent, setShowAddContent] = useState(false);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [deleteClModal, setDeleteClModal] = useState(null);
  const [clSearch, setClSearch] = useState({ name: '', process: '', branch: '' });

  const [modForm, setModForm] = useState({ dayNo: '', moduleTitle: '', moduleOrder: '', description: '' });
  const [contentForm, setContentForm] = useState({
    contentType: 'video', contentTitle: '', driveFileId: '', driveUrl: '',
    directMediaUrl: '', playerMode: 'Auto', contentOrder: '', estimatedMins: '',
    completionRulePct: 80, description: ''
  });
  const [contentFile, setContentFile] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', sortOrder: '' });
  const [faqAddMode, setFaqAddMode] = useState('single');
  const [faqBulkFiles, setFaqBulkFiles] = useState([]);
  const [faqBulkDragging, setFaqBulkDragging] = useState(false);
  const [faqBulkUploading, setFaqBulkUploading] = useState(false);
  const [contentAddMode, setContentAddMode] = useState('single');
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkDragging, setBulkDragging] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);

  useEffect(() => { loadClassrooms(); }, []);
  useEffect(() => {
    if (selectedCl) {
      setLoadingModules(true);
      loadModules(selectedCl.classroomId);
    }
  }, [selectedCl]);
  useEffect(() => {
    if (selectedMod) { loadContents(selectedMod.moduleId); loadFaqs(selectedMod.moduleId); }
  }, [selectedMod]);

  async function loadClassrooms() {
    setLoadingClassrooms(true);
    const res = await api.get('/admin/classrooms', 'admin');
    if (res.ok) setClassrooms(res.data);
    setLoadingClassrooms(false);
  }
  async function loadModules(cid) {
    const res = await api.get(`/admin/classrooms/${cid}/modules`, 'admin');
    if (res.ok) setModules(res.data);
    setLoadingModules(false);
  }
  async function loadContents(mid) {
    const res = await api.get(`/admin/modules/${mid}/contents`, 'admin');
    if (res.ok) setContents(res.data);
  }
  async function loadFaqs(mid) {
    const res = await api.get(`/admin/modules/${mid}/faqs`, 'admin');
    if (res.ok) setFaqs(res.data);
  }

  async function createModule(e) {
    e.preventDefault(); setLoading(true);
    const res = await api.post(`/admin/classrooms/${selectedCl.classroomId}/modules`, modForm, 'admin');
    setLoading(false);
    if (res.ok) {
      setShowAddMod(false);
      setModForm({ dayNo: '', moduleTitle: '', moduleOrder: '', description: '' });
      loadModules(selectedCl.classroomId);
    } else setMsg(res.message || 'Failed.');
  }

  async function createContent(e) {
    e.preventDefault(); setLoading(true);
    if (contentFile) {
      const fd = new FormData();
      fd.append('file', contentFile);
      Object.entries(contentForm).forEach(([k, v]) => v && fd.append(k, v));
      const res = await uploadFile(`/admin/modules/${selectedMod.moduleId}/contents`, fd, 'admin');
      setLoading(false);
      if (res.ok) {
        setShowAddContent(false);
        setContentFile(null);
        resetContentForm();
        loadContents(selectedMod.moduleId);
      } else setMsg(res.message || 'Upload failed.');
    } else {
      const res = await api.post(`/admin/modules/${selectedMod.moduleId}/contents`, contentForm, 'admin');
      setLoading(false);
      if (res.ok) {
        setShowAddContent(false);
        resetContentForm();
        loadContents(selectedMod.moduleId);
      } else setMsg(res.message || 'Failed.');
    }
  }

  async function createFaq(e) {
    e.preventDefault(); setLoading(true);
    const res = await api.post(`/admin/modules/${selectedMod.moduleId}/faqs`, faqForm, 'admin');
    setLoading(false);
    if (res.ok) {
      setShowAddFaq(false);
      setFaqForm({ question: '', answer: '', sortOrder: '' });
      loadFaqs(selectedMod.moduleId);
    } else setMsg(res.message || 'Failed.');
  }

  async function deleteModule(moduleId) {
    if (!window.confirm('Deactivate this module?')) return;
    await api.delete(`/admin/modules/${moduleId}`, 'admin');
    setSelectedMod(null);
    loadModules(selectedCl.classroomId);
  }

  async function deleteContent(contentId) {
    if (!window.confirm('Remove this content?')) return;
    await api.delete(`/admin/contents/${contentId}`, 'admin');
    loadContents(selectedMod.moduleId);
  }

  async function deleteClassroomConfirmed(classroomId, confirmName) {
    const token = localStorage.getItem('lms_token_admin') || '';
    const BASE = (import.meta.env.VITE_API_URL || '') + '/api';
    const r = await fetch(`${BASE}/admin/classrooms/${classroomId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ confirmName }),
    }).then(x => x.json()).catch(() => ({ ok: false, message: 'Network error' }));
    if (r.ok) {
      setDeleteClModal(null);
      setSelectedCl(null);
      setSelectedMod(null);
      setModules([]);
      setContents([]);
      setFaqs([]);
      setMsg('');
      loadClassrooms();
    } else {
      setDeleteClModal(prev => ({ ...prev, error: r.message }));
    }
  }

  function resetContentForm() {
    setContentForm({
      contentType: 'video', contentTitle: '', driveFileId: '', driveUrl: '',
      directMediaUrl: '', playerMode: 'Auto', contentOrder: '',
      estimatedMins: '', completionRulePct: 80, description: ''
    });
  }

  function guessMimeType(file) {
    const n = file.name.toLowerCase();
    if (n.endsWith('.mp4') || n.endsWith('.webm') || n.endsWith('.mov')) return 'video';
    if (n.endsWith('.pdf')) return 'pdf';
    if (n.endsWith('.ppt') || n.endsWith('.pptx')) return 'ppt';
    if (n.endsWith('.doc') || n.endsWith('.docx')) return 'doc';
    if (n.endsWith('.html') || n.endsWith('.htm')) return 'html';
    return 'doc';
  }

  function handleBulkDrop(e) {
    e.preventDefault();
    setBulkDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setBulkFiles(prev => [...prev, ...files.map(f => ({
      file: f, title: f.name.replace(/\.[^/.]+$/, ''),
      type: guessMimeType(f), estimatedMins: '', completionRulePct: 80
    }))]);
  }

  function handleBulkFileInput(e) {
    const files = Array.from(e.target.files);
    setBulkFiles(prev => [...prev, ...files.map(f => ({
      file: f, title: f.name.replace(/\.[^/.]+$/, ''),
      type: guessMimeType(f), estimatedMins: '', completionRulePct: 80
    }))]);
    e.target.value = '';
  }

  async function uploadBulkFiles() {
    if (!bulkFiles.length || !selectedMod) return;
    setBulkUploading(true);
    let uploaded = 0;
    for (let i = 0; i < bulkFiles.length; i++) {
      const item = bulkFiles[i];
      const fd = new FormData();
      fd.append('file', item.file);
      fd.append('contentTitle', item.title);
      fd.append('contentType', item.type);
      fd.append('estimatedMins', String(item.estimatedMins || ''));
      fd.append('completionRulePct', String(item.completionRulePct || 80));
      fd.append('contentOrder', String(i + 1 + contents.length));
      fd.append('playerMode', 'Auto');
      const res = await uploadFile(`/admin/modules/${selectedMod.moduleId}/contents`, fd, 'admin');
      if (res.ok) uploaded++;
    }
    setBulkUploading(false);
    setBulkFiles([]);
    setShowAddContent(false);
    setContentAddMode('single');
    setMsg(`Uploaded ${uploaded} of ${bulkFiles.length} files.`);
    loadContents(selectedMod.moduleId);
  }

  async function uploadBulkFaqs() {
    if (!faqBulkFiles.length || !selectedMod) return;
    setFaqBulkUploading(true);
    const fd = new FormData();
    faqBulkFiles.forEach(f => fd.append('files', f));
    const res = await uploadFile(`/admin/modules/${selectedMod.moduleId}/faqs/bulk-upload`, fd, 'admin');
    setFaqBulkUploading(false);
    if (res.ok) {
      setFaqBulkFiles([]);
      setShowAddFaq(false);
      setFaqAddMode('single');
      setMsg(res.message || `${res.data?.length || 0} FAQ document(s) uploaded.`);
      loadFaqs(selectedMod.moduleId);
    } else {
      setMsg(res.message || 'Upload failed.');
    }
  }

  function handleMenuAction(action) {
    if (action === 'edit') setEditingClassroom(selectedCl);
    else if (action === 'duplicate') {
      setMsg('Duplicate functionality coming soon!');
    } else if (action === 'archive') {
      setMsg('Archive functionality coming soon!');
    } else if (action === 'delete') {
      setDeleteClModal({ cl: selectedCl, confirmName: '', step: 1, error: '' });
    } else if (action === 'sync') {
      setMsg('Drive sync functionality coming soon!');
    }
  }

  const totalContent = modules.reduce((sum, m) => sum + (m._count?.contents || 0), 0);
  const filteredClassrooms = classrooms.filter(cl => {
    const q = clSearch.name.toLowerCase();
    const p = clSearch.process.toLowerCase();
    const b = clSearch.branch.toLowerCase();
    return (!q || cl.classroomName.toLowerCase().includes(q)) &&
           (!p || (cl.process || '').toLowerCase().includes(p)) &&
           (!b || (cl.branch || '').toLowerCase().includes(b));
  });

  return (
    <div style={{ marginTop: 12 }}>
      {msg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 10,
          marginBottom: 12,
          background: '#fef2f2',
          border: '1px solid #fecaca',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: '#dc2626' }}>{msg}</span>
          <button
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#dc2626' }}
            onClick={() => setMsg('')}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 280px 1fr',
        gap: 20,
        minHeight: 560,
        alignItems: 'start',
      }}>

        {/* ── CLASSROOMS COLUMN ── */}
        <div style={{
          minWidth: 0,
          maxHeight: 'calc(100vh - 280px)',
          overflowY: 'auto',
          overflowX: 'visible',
          paddingRight: 4,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
                📚 Classrooms
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                Showing {filteredClassrooms.length} of {classrooms.length}
              </div>
            </div>
            <button
              style={{
                padding: '6px 16px',
                background: '#6366f1',
                borderRadius: 10,
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onClick={() => setShowWizard(true)}
            >
              + New
            </button>
          </div>

          {/* Search */}
          <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            <input
              style={{
                fontSize: 12,
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid rgba(203,213,225,0.4)',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
              }}
              placeholder="🔍 Search by name..."
              value={clSearch.name}
              onChange={e => setClSearch(p => ({ ...p, name: e.target.value }))}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <input
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  borderRadius: 10,
                  border: '1px solid rgba(203,213,225,0.4)',
                  background: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                }}
                placeholder="Process..."
                value={clSearch.process}
                onChange={e => setClSearch(p => ({ ...p, process: e.target.value }))}
              />
              <input
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  borderRadius: 10,
                  border: '1px solid rgba(203,213,225,0.4)',
                  background: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                }}
                placeholder="Branch..."
                value={clSearch.branch}
                onChange={e => setClSearch(p => ({ ...p, branch: e.target.value }))}
              />
            </div>
          </div>

          {/* Classroom List */}
          {loadingClassrooms ? (
            <SkeletonLoader count={4} height={90} />
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {filteredClassrooms.map(cl => (
                <ClassroomCard
                  key={cl.classroomId}
                  cl={cl}
                  selected={selectedCl?.classroomId === cl.classroomId}
                  onClick={() => { setSelectedCl(cl); setSelectedMod(null); }}
                  onMenuAction={handleMenuAction}
                />
              ))}
              {filteredClassrooms.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 16px',
                  background: '#ffffff',
                  borderRadius: 14,
                  border: '1.5px dashed rgba(203,213,225,0.5)',
                }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🏫</div>
                  <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                    {classrooms.length === 0 ? 'No classrooms yet' : 'No match found'}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    {classrooms.length === 0 ? 'Create one to get started' : 'Try different filters'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── MODULES COLUMN ── */}
        <div style={{
          minWidth: 0,
          maxHeight: 'calc(100vh - 280px)',
          overflowY: 'auto',
          overflowX: 'visible',
          paddingRight: 4,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
                📦 Modules
              </div>
              {selectedCl && (
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {modules.length} modules · {totalContent} items
                </div>
              )}
            </div>
            {selectedCl && (
              <button
                style={{
                  padding: '6px 16px',
                  background: '#6366f1',
                  borderRadius: 10,
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onClick={() => setShowAddMod(true)}
              >
                + Add
              </button>
            )}
          </div>

          {!selectedCl ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 16px',
              background: '#ffffff',
              borderRadius: 14,
              border: '1.5px dashed rgba(203,213,225,0.5)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>👈</div>
              <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                Select a Classroom
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                Choose a classroom from the left panel
              </div>
            </div>
          ) : loadingModules ? (
            <SkeletonLoader count={3} height={70} />
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {modules.map(mod => (
                <ModuleCard
                  key={mod.moduleId}
                  mod={mod}
                  selected={selectedMod?.moduleId === mod.moduleId}
                  onSelect={() => setSelectedMod(mod)}
                  onDelete={deleteModule}
                />
              ))}
              {modules.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 12px',
                  background: '#ffffff',
                  borderRadius: 12,
                  border: '1.5px dashed rgba(203,213,225,0.5)',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📦</div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>No modules yet</div>
                  <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>Click + Add to create one</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── CONTENT + FAQ COLUMN ── */}
        <div style={{
          minWidth: 0,
          maxHeight: 'calc(100vh - 280px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: 4,
        }}>
          {!selectedMod ? (
            <div style={{
              display: 'grid',
              placeItems: 'center',
              minHeight: 340,
              background: '#ffffff',
              borderRadius: 16,
              border: '1.5px dashed rgba(203,213,225,0.5)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                  {selectedCl ? 'Select a module' : 'Select a classroom first'}
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>
                  {selectedCl ? 'Choose a module to manage its content' : 'Choose a classroom from the left'}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Module Header */}
              <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: 16,
                padding: '18px 20px',
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    Day {selectedMod.dayNo} · {selectedCl?.classroomName}
                  </div>
                  <div style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: '#fff',
                    marginTop: 4,
                  }}>
                    {selectedMod.moduleTitle}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
                    marginTop: 4,
                  }}>
                    {contents.length} content items · {faqs.length} FAQs
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    style={{
                      padding: '6px 14px',
                      background: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => setShowAddContent(true)}
                  >
                    + Content
                  </button>
                  <button
                    style={{
                      padding: '6px 14px',
                      background: 'rgba(255,255,255,0.12)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => setShowAddFaq(true)}
                  >
                    + FAQ
                  </button>
                  <button
                    style={{
                      padding: '6px 14px',
                      background: 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => setShowAIAnalysis(true)}
                  >
                    🤖 AI Analysis
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div style={{
                display: 'flex',
                gap: 4,
                marginBottom: 14,
                background: '#ffffff',
                borderRadius: 10,
                padding: 4,
                border: '1px solid rgba(203,213,225,0.3)',
              }}>
                {['content', 'faqs'].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    style={{
                      flex: 1,
                      padding: '7px 14px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === t ? '#6366f1' : 'transparent',
                      color: activeTab === t ? '#fff' : '#64748b',
                      fontWeight: activeTab === t ? 700 : 500,
                      fontSize: 13,
                      transition: 'all 0.15s',
                    }}
                  >
                    {t === 'content' ? `📹 Content (${contents.length})` : `❓ FAQs (${faqs.length})`}
                  </button>
                ))}
              </div>

              {/* Content List */}
              {activeTab === 'content' && (
                <div style={{ display: 'grid', gap: 10 }}>
                  {contents.map((c, ci) => (
                    <ContentCard
                      key={c.contentId}
                      c={c}
                      isFirst={ci === 0}
                      isLast={ci === contents.length - 1}
                      onMoveUp={ci > 0 ? async () => {
                        const prev = contents[ci - 1];
                        await Promise.all([
                          api.put(`/admin/contents/${c.contentId}`, { contentOrder: prev.contentOrder || ci }, 'admin'),
                          api.put(`/admin/contents/${prev.contentId}`, { contentOrder: c.contentOrder || ci + 1 }, 'admin'),
                        ]);
                        loadContents(selectedMod.moduleId);
                      } : null}
                      onMoveDown={ci < contents.length - 1 ? async () => {
                        const next = contents[ci + 1];
                        await Promise.all([
                          api.put(`/admin/contents/${c.contentId}`, { contentOrder: next.contentOrder || ci + 2 }, 'admin'),
                          api.put(`/admin/contents/${next.contentId}`, { contentOrder: c.contentOrder || ci + 1 }, 'admin'),
                        ]);
                        loadContents(selectedMod.moduleId);
                      } : null}
                      onToggleLock={async () => {
                        await api.put(`/admin/content/${c.contentId}/lock`, { locked: !c.locked }, 'admin');
                        loadContents(selectedMod.moduleId);
                      }}
                      onDelete={() => deleteContent(c.contentId)}
                      onSave={async (draft) => {
                        const res = await api.put(`/admin/contents/${c.contentId}`, {
                          estimatedMins: Number(draft.estimatedMins) || 0,
                          completionRulePct: Number(draft.completionRulePct) || 80,
                        }, 'admin');
                        if (!res.ok) throw new Error(res.message || 'Save failed.');
                        loadContents(selectedMod.moduleId);
                      }}
                    />
                  ))}
                  {contents.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      background: '#ffffff',
                      borderRadius: 12,
                      border: '1.5px dashed rgba(203,213,225,0.5)',
                    }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
                      <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>No content yet</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Add videos, PDFs, or sync from Drive</div>
                    </div>
                  )}
                </div>
              )}

              {/* FAQ List */}
              {activeTab === 'faqs' && (
                <div style={{ display: 'grid', gap: 10 }}>
                  {faqs.map(f => (
                    <div key={f.faqId} style={{
                      background: '#ffffff',
                      borderRadius: 12,
                      border: '1px solid rgba(203,213,225,0.3)',
                      padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 6,
                      }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: '#0f172a',
                          flex: 1,
                        }}>
                          {f.answer.startsWith('[') ? '📎 ' : 'Q: '}{f.question}
                        </div>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Remove FAQ?')) return;
                            await api.delete(`/admin/faqs/${f.faqId}`, 'admin');
                            loadFaqs(selectedMod.moduleId);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: 16,
                            padding: '0 4px',
                            flexShrink: 0,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      {f.answer.startsWith('[') ? (
                        (() => {
                          const match = f.answer.match(/\[([^\]]+)\] (.+)/);
                          return match ? (
                            <a
                              href={match[2]}
                              target="_blank"
                              rel="noopener"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 12,
                                color: '#6366f1',
                                textDecoration: 'none',
                                paddingLeft: 12,
                                borderLeft: '3px solid rgba(99,102,241,0.3)',
                              }}
                            >
                              {match[1] === 'PDF Document' ? '📄' : match[1].startsWith('PPT') ? '📊' : '📝'}
                              View {match[1]} ↗
                            </a>
                          ) : (
                            <div style={{
                              fontSize: 12.5,
                              color: '#64748b',
                              paddingLeft: 12,
                              borderLeft: '3px solid rgba(99,102,241,0.3)',
                            }}>
                              {f.answer}
                            </div>
                          );
                        })()
                      ) : (
                        <div style={{
                          fontSize: 12.5,
                          color: '#64748b',
                          lineHeight: 1.6,
                          paddingLeft: 12,
                          borderLeft: '3px solid rgba(99,102,241,0.3)',
                        }}>
                          {f.answer}
                        </div>
                      )}
                    </div>
                  ))}
                  {faqs.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      background: '#ffffff',
                      borderRadius: 12,
                      border: '1.5px dashed rgba(203,213,225,0.5)',
                    }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>❓</div>
                      <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>No FAQs yet</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Add questions and answers</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      {showWizard && (
        <ClassroomWizard
          onClose={() => setShowWizard(false)}
          onCreated={() => { loadClassrooms(); setShowWizard(false); }}
        />
      )}

      {editingClassroom && (
        <EditClassroomModal
          classroom={editingClassroom}
          onClose={() => setEditingClassroom(null)}
          onSaved={() => { loadClassrooms(); if (selectedCl) loadModules(selectedCl.classroomId); }}
        />
      )}

      {showAddMod && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 1000,
        }} onClick={e => e.target === e.currentTarget && setShowAddMod(false)}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 460,
            width: '90%',
            padding: '28px 32px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                Add Module — {selectedCl?.classroomName}
              </span>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
                onClick={() => setShowAddMod(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={createModule}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Day No *
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(203,213,225,0.4)',
                      background: '#f8fafc',
                      fontSize: 14,
                    }}
                    value={modForm.dayNo}
                    onChange={e => setModForm(p => ({ ...p, dayNo: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Module Order
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(203,213,225,0.4)',
                      background: '#f8fafc',
                      fontSize: 14,
                    }}
                    value={modForm.moduleOrder}
                    onChange={e => setModForm(p => ({ ...p, moduleOrder: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Module Title *
                </label>
                <input
                  className="input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(203,213,225,0.4)',
                    background: '#f8fafc',
                    fontSize: 14,
                  }}
                  value={modForm.moduleTitle}
                  onChange={e => setModForm(p => ({ ...p, moduleTitle: e.target.value }))}
                  required
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Description
                </label>
                <input
                  className="input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(203,213,225,0.4)',
                    background: '#f8fafc',
                    fontSize: 14,
                  }}
                  value={modForm.description}
                  onChange={e => setModForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 20,
                  width: '100%',
                  padding: '10px',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {loading ? '...' : 'Add Module'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Content Modal */}
      {showAddContent && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddContent(false)}>
          <div className="modal-box" style={{ maxWidth: 620 }}>
            <div className="modal-head">
              <b>Add Content — {selectedMod?.moduleTitle}</b>
              <button className="btn small secondary" onClick={() => { setShowAddContent(false); setBulkFiles([]); setContentAddMode('single'); }}>✕</button>
            </div>
            <div className="modal-body">
              {/* Mode tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--card)', borderRadius: 10, padding: 4 }}>
                {[['single', 'Single Upload'], ['bulk', 'Bulk Upload / Drag & Drop']].map(([k, label]) => (
                  <button key={k} onClick={() => setContentAddMode(k)} style={{
                    flex: 1, padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: contentAddMode === k ? 'var(--card-solid)' : 'transparent',
                    color: contentAddMode === k ? 'var(--ink)' : 'var(--muted)',
                    fontWeight: contentAddMode === k ? 700 : 500, fontSize: 12,
                    boxShadow: contentAddMode === k ? 'var(--shadow-sm)' : 'none', transition: 'all .12s',
                  }}>{label}</button>
                ))}
              </div>

              {/* BULK mode */}
              {contentAddMode === 'bulk' && (
                <div>
                  <div
                    onDragOver={e => { e.preventDefault(); setBulkDragging(true); }}
                    onDragLeave={() => setBulkDragging(false)}
                    onDrop={handleBulkDrop}
                    onClick={() => document.getElementById('bulk-file-input').click()}
                    style={{
                      border: `2px dashed ${bulkDragging ? '#1d4ed8' : '#d1d5db'}`,
                      borderRadius: 14, padding: '36px 24px', textAlign: 'center',
                      background: bulkDragging ? 'rgba(37,99,235,.12)' : 'rgba(255,255,255,.04)', cursor: 'pointer', marginBottom: 14,
                      transition: 'all .15s',
                    }}
                  >
                    <input id="bulk-file-input" type="file" multiple accept="video/*,.pdf,.ppt,.pptx,.doc,.docx,.html,.htm" style={{ display: 'none' }} onChange={handleBulkFileInput} />
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Drop files here or click to browse</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Videos, PDFs, PPTs, DOCs, HTML files — multiple at once</div>
                  </div>

                  {bulkFiles.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                        {bulkFiles.length} files queued
                      </div>
                      <div style={{ maxHeight: 260, overflowY: 'auto', display: 'grid', gap: 8, marginBottom: 14 }}>
                        {bulkFiles.map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: TYPE_META[item.type]?.bg || 'rgba(255,255,255,.1)', display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0 }}>
                              {TYPE_META[item.type]?.icon || '📄'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <input
                                value={item.title}
                                onChange={e => setBulkFiles(prev => prev.map((x, xi) => xi === i ? { ...x, title: e.target.value } : x))}
                                style={{ width: '100%', fontSize: 12, fontWeight: 600, background: 'var(--card-solid)', border: '1px solid var(--line)', borderRadius: 6, padding: '3px 8px', color: 'var(--ink)' }}
                              />
                              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{item.file.name} · {(item.file.size / 1024 / 1024).toFixed(1)}MB</div>
                            </div>
                            <select
                              value={item.type}
                              onChange={e => setBulkFiles(prev => prev.map((x, xi) => xi === i ? { ...x, type: e.target.value } : x))}
                              style={{ fontSize: 11, background: 'var(--card-solid)', border: '1px solid var(--line)', borderRadius: 6, padding: '3px 6px', color: 'var(--ink)', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', flexShrink: 0, width: 60 }}
                            >
                              {['video','pdf','ppt','doc','html','link'].map(t => <option key={t}>{t}</option>)}
                            </select>
                            <button onClick={() => setBulkFiles(prev => prev.filter((_, xi) => xi !== i))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: '0 4px', flexShrink: 0 }}>✕</button>
                          </div>
                        ))}
                      </div>
                      <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={uploadBulkFiles} disabled={bulkUploading}>
                        {bulkUploading ? `Uploading…` : `⬆ Upload ${bulkFiles.length} Files`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SINGLE mode */}
              {contentAddMode === 'single' && (
                <form onSubmit={createContent}>
                  <div className="col-2">
                    <div className="field">
                      <label>Type</label>
                      <select className="select" value={contentForm.contentType} onChange={e => setContentForm(p => ({ ...p, contentType: e.target.value }))}>
                        {['video', 'pdf', 'ppt', 'doc', 'link', 'html'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Player Mode</label>
                      <select className="select" value={contentForm.playerMode} onChange={e => setContentForm(p => ({ ...p, playerMode: e.target.value }))}>
                        {['Auto', 'HTML5', 'Drive Preview', 'Direct'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="field"><label>Order</label><input className="input" type="number" value={contentForm.contentOrder} onChange={e => setContentForm(p => ({ ...p, contentOrder: e.target.value }))} /></div>
                    <div className="field"><label>Est. Minutes</label><input className="input" type="number" value={contentForm.estimatedMins} onChange={e => setContentForm(p => ({ ...p, estimatedMins: e.target.value }))} /></div>
                    <div className="field"><label>Completion Rule %</label><input className="input" type="number" max="100" value={contentForm.completionRulePct} onChange={e => setContentForm(p => ({ ...p, completionRulePct: e.target.value }))} /></div>
                  </div>
                  <div className="field"><label>Content Title</label><input className="input" value={contentForm.contentTitle} onChange={e => setContentForm(p => ({ ...p, contentTitle: e.target.value }))} /></div>
                  <div className="card" style={{ marginTop: 10, marginBottom: 10, background: 'var(--card)' }}>
                    <b style={{ fontSize: 13 }}>Content Source — choose ONE</b>
                    <div className="field" style={{ marginTop: 10 }}>
                      <label>YouTube URL</label>
                      <input className="input" placeholder="https://www.youtube.com/watch?v=..." value={contentForm.youtubeUrl || ''} onChange={e => setContentForm(p => ({ ...p, youtubeUrl: e.target.value, directMediaUrl: e.target.value || p.directMediaUrl }))} />
                    </div>
                    <div className="field"><label>Google Drive File ID</label><input className="input" placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" value={contentForm.driveFileId} onChange={e => setContentForm(p => ({ ...p, driveFileId: e.target.value }))} /></div>
                    <div className="field"><label>Direct URL</label><input className="input" placeholder="https://example.com/video.mp4 or any link" value={contentForm.directMediaUrl} onChange={e => setContentForm(p => ({ ...p, directMediaUrl: e.target.value, youtubeUrl: '' }))} /></div>
                    <div className="field"><label>Upload Local File (PDF, Doc, Video, HTML)</label><input type="file" accept="video/*,.pdf,.ppt,.pptx,.doc,.docx,.html,.htm" onChange={e => setContentFile(e.target.files[0])} /></div>
                  </div>
                  <div className="field"><label>Description</label><textarea className="input" value={contentForm.description} onChange={e => setContentForm(p => ({ ...p, description: e.target.value }))} /></div>
                  <button className="btn" type="submit" disabled={loading} style={{ marginTop: 10 }}>{loading ? 'Uploading...' : 'Add Content'}</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add FAQ Modal ── */}
      {showAddFaq && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && (setShowAddFaq(false), setFaqBulkFiles([]), setFaqAddMode('single'))}>
          <div className="modal-box" style={{ maxWidth: 560 }}>
            <div className="modal-head">
              <b>Add FAQ — {selectedMod?.moduleTitle}</b>
              <button className="btn small secondary" onClick={() => { setShowAddFaq(false); setFaqBulkFiles([]); setFaqAddMode('single'); }}>✕</button>
            </div>
            <div className="modal-body">
              {/* Mode tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--card)', borderRadius: 10, padding: 4 }}>
                {[['single', 'Manual Entry'], ['bulk', 'Bulk File Upload (PDF/DOC/PPT)']].map(([k, label]) => (
                  <button key={k} onClick={() => setFaqAddMode(k)} style={{
                    flex: 1, padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: faqAddMode === k ? 'var(--card-solid)' : 'transparent',
                    color: faqAddMode === k ? 'var(--ink)' : 'var(--muted)',
                    fontWeight: faqAddMode === k ? 700 : 500, fontSize: 12,
                    boxShadow: faqAddMode === k ? 'var(--shadow-sm)' : 'none', transition: 'all .12s',
                  }}>{label}</button>
                ))}
              </div>

              {/* Single mode */}
              {faqAddMode === 'single' && (
                <form onSubmit={createFaq}>
                  <div className="field"><label>Question *</label><input className="input" value={faqForm.question} onChange={e => setFaqForm(p => ({ ...p, question: e.target.value }))} required /></div>
                  <div className="field"><label>Answer *</label><textarea className="input" rows={4} value={faqForm.answer} onChange={e => setFaqForm(p => ({ ...p, answer: e.target.value }))} required /></div>
                  <div className="field"><label>Sort Order</label><input className="input" type="number" value={faqForm.sortOrder} onChange={e => setFaqForm(p => ({ ...p, sortOrder: e.target.value }))} /></div>
                  <button className="btn" type="submit" disabled={loading} style={{ marginTop: 10 }}>{loading ? '...' : 'Add FAQ'}</button>
                </form>
              )}

              {/* Bulk mode */}
              {faqAddMode === 'bulk' && (
                <div>
                  <div
                    onDragOver={e => { e.preventDefault(); setFaqBulkDragging(true); }}
                    onDragLeave={() => setFaqBulkDragging(false)}
                    onDrop={e => { e.preventDefault(); setFaqBulkDragging(false); setFaqBulkFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
                    onClick={() => document.getElementById('faq-bulk-input').click()}
                    style={{
                      border: `2px dashed ${faqBulkDragging ? '#6366f1' : 'rgba(255,255,255,.15)'}`,
                      borderRadius: 14, padding: '36px 24px', textAlign: 'center',
                      background: faqBulkDragging ? 'rgba(99,102,241,.12)' : 'rgba(255,255,255,.04)',
                      cursor: 'pointer', marginBottom: 14, transition: 'all .15s',
                    }}
                  >
                    <input
                      id="faq-bulk-input"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      style={{ display: 'none' }}
                      onChange={e => { setFaqBulkFiles(prev => [...prev, ...Array.from(e.target.files)]); e.target.value = ''; }}
                    />
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Drop PDF, DOC, PPT files here</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Each file becomes an FAQ entry with the filename as the title and a download link as the answer</div>
                  </div>

                  {faqBulkFiles.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                        {faqBulkFiles.length} file{faqBulkFiles.length > 1 ? 's' : ''} queued
                      </div>
                      <div style={{ maxHeight: 240, overflowY: 'auto', display: 'grid', gap: 6, marginBottom: 14 }}>
                        {faqBulkFiles.map((f, i) => {
                          const ext = f.name.split('.').pop().toLowerCase();
                          const iconMap = { pdf: '📄', doc: '📝', docx: '📝', ppt: '📊', pptx: '📊' };
                          return (
                            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px' }}>
                              <span style={{ fontSize: 20, flexShrink: 0 }}>{iconMap[ext] || '📄'}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name.replace(/\.[^/.]+$/, '')}</div>
                                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{ext.toUpperCase()} · {(f.size / 1024).toFixed(0)} KB</div>
                              </div>
                              <button onClick={() => setFaqBulkFiles(prev => prev.filter((_, xi) => xi !== i))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: '0 4px', flexShrink: 0 }}>✕</button>
                            </div>
                          );
                        })}
                      </div>
                      <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={uploadBulkFaqs} disabled={faqBulkUploading}>
                        {faqBulkUploading ? 'Uploading...' : `⬆ Upload ${faqBulkFiles.length} File${faqBulkFiles.length > 1 ? 's' : ''} as FAQs`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── AI Video Analysis Modal ── */}
      {showAIAnalysis && selectedMod && (
        <AIVideoAnalysis
          moduleId={selectedMod.moduleId}
          onClose={() => setShowAIAnalysis(false)}
        />
      )}

      {/* ── Delete Classroom Modal ── */}
      {deleteClModal && (
        <DeleteClassroomModal
          classroom={deleteClModal.cl}
          onCancel={() => setDeleteClModal(null)}
          onConfirm={(name) => deleteClassroomConfirmed(deleteClModal.cl.classroomId, name)}
          error={deleteClModal.error}
        />
      )}

      {/* Shimmer Animation Styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}