import { useState, useRef, useEffect } from 'react';
import { formatDate } from '../../utils/format.js';
import { api, fetchAuthenticatedBlobUrl } from '../../utils/api.js';
import { ContentViewerModal } from './LearningTab.jsx'; 

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

export default function AssignedTab({ assignments: initialAssignments, onRefresh }) {
  const [assignments, setAssignments] = useState(initialAssignments || []);
  const [viewingContent, setViewingContent] = useState(null);
  const [loadingContentId, setLoadingContentId] = useState(null);
  const [debug, setDebug] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    async function fetchContents() {
      if (!initialAssignments || initialAssignments.length === 0) return;

      const hasContents = initialAssignments.some(a => (a.contents || []).length > 0);
      if (hasContents) {
        setAssignments(initialAssignments);
        setDebug('');
        return;
      }

      setDebug('Fetching content from server...');
      
      try {
        const res = await api.get('/trainee/assigned-modules', 'trainee');
        if (res.ok && res.data) {
          setAssignments(res.data);
          setDebug('Fetched from API successfully');
        } else {
          setAssignments(initialAssignments);
          setDebug('API returned no data: ' + (res.message || 'Unknown error'));
        }
      } catch (err) {
        setAssignments(initialAssignments);
        setDebug('Error: ' + err.message);
      }
    }
    
    fetchContents();
  }, [initialAssignments]);

  if (!assignments || assignments.length === 0) {
    return <div className="empty" style={{ marginTop: 16 }}>No direct module assignments right now. Mandatory updates will appear here.</div>;
  }

  async function handleOpenContent(content) {
    const contentId = content.repositoryContentId || content.contentId;
    setLoadingContentId(contentId);
    
    // 1. Backend ko bolo content open kare
    const openRes = await api.post(`/trainee/content/${contentId}/open`, {}, 'trainee');
    
    if (openRes.locked || openRes.ok === false) {
      alert(openRes.message || 'Complete the previous content first.');
      setLoadingContentId(null);
      return;
    }

    // 2. Backend se aaya hua URL use karo
    let mediaUrl = openRes.mediaUrl || content.directMediaUrl || content.localFilePath;
    
    if (mediaUrl && mediaUrl.startsWith('/')) {
      mediaUrl = `${API_ORIGIN}${mediaUrl}`;
    }

    let resolvedMedia = null;
    if (mediaUrl) {
      const ext = mediaUrl.split('?')[0].split('.').pop().toLowerCase();
      const isVid = ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext);
      const isPdf = ext === 'pdf';
      
      if (isVid) resolvedMedia = { type: 'html5', url: mediaUrl };
      else if (isPdf) resolvedMedia = { type: 'proxy', url: mediaUrl, requiresAuth: true };
      else resolvedMedia = { type: 'proxy', url: mediaUrl };
    }

    if (!resolvedMedia) {
      alert('Content URL not found. Contact admin.');
      setLoadingContentId(null);
      return;
    }

    // Agar auth required hai toh blob fetch karo
    if (resolvedMedia.requiresAuth) {
      const protectedResult = await fetchAuthenticatedBlobUrl(resolvedMedia.url, 'trainee');
      if (!protectedResult.ok) {
        alert(protectedResult.message || 'Unable to open protected learning content.');
        setLoadingContentId(null);
        return;
      }
      resolvedMedia = { ...resolvedMedia, url: protectedResult.url, requiresAuth: false, objectUrl: true };
    }

    console.log("🎬 Opening video with URL:", resolvedMedia.url);

    // 3. Player kholo
    setViewingContent({
      contentId: contentId,
      contentTitle: openRes.contentTitle || content.contentTitle || content.title,
      contentType: openRes.contentType || content.contentType || 'video',
      resolvedMedia,
      progress: content.progress || null,
      playerMode: openRes.playerMode || 'Auto'
    });
    setLoadingContentId(null);
  }

  function closeContent() {
    const objectUrl = viewingContent?.resolvedMedia?.objectUrl ? viewingContent.resolvedMedia.url : '';
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setViewingContent(null);
    if (onRefresh) onRefresh();
  }

  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
        Mandatory updates, refresher modules, process alerts, or branch/process assignments from LMS Admin will appear here.
      </p>

      {debug && (
        <div style={{ padding: 8, background: '#fff3cd', color: '#856404', borderRadius: 6, marginBottom: 10, fontSize: 12 }}>
          Debug: {debug}
        </div>
      )}

      {assignments.map(a => {
        const contentsToRender = a.contents || [];

        return (
          <div key={a.id} className="card" style={{ marginBottom: 10 }}>
            {contentsToRender.length === 0 && (
              <div style={{ padding: 10, background: '#fff3cd', color: '#856404', borderRadius: 8, marginBottom: 10, fontSize: 12 }}>
                <b>⚠️ Content missing</b><br/>
                Module ID: <code>{a.moduleId}</code><br/>
                API Response: {debug || 'Loading...'}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <b>{a.moduleName || a.title || 'Assigned Module'}</b>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  Assigned: {formatDate(a.createdAt)} {a.dueDate ? `| Due: ${formatDate(a.dueDate)}` : ''}
                </p>
              </div>
              <span className={`pill ${a.assignmentType === 'Mandatory' ? 'warn' : 'info'}`}>
                {a.assignmentType || 'Task'}
              </span>
            </div>

            {contentsToRender.length > 0 ? (
              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                {contentsToRender.map((content, index) => {
                  const contentId = content.repositoryContentId || content.contentId || index;
                  const isLoading = loadingContentId === contentId;
                  
                  return (
                    <div key={contentId} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div>
                        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                          <span className="content-type-badge">{content.contentType || 'video'}</span>
                          <b style={{ fontSize: 13 }}>{content.contentTitle || content.title || 'Untitled Content'}</b>
                        </div>
                      </div>
                      <button 
                        className="btn small accent" 
                        onClick={() => handleOpenContent(content)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Loading...' : '▶ Open'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}

      {viewingContent && (
        <ContentViewerModal 
          content={viewingContent} 
          onClose={closeContent} 
          videoRef={videoRef} 
          onPauseChange={() => {}} 
          renderContentUrl={(c) => c.resolvedMedia}
        />
      )}
    </div>
  );
}