// src/pages/Admin/CommConfigTab.jsx
import { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';

// ========== TOGGLE COMPONENT ==========
function Toggle({ checked, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => onChange(!checked)}>
      <div style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? '#22c55e' : '#d1d5db',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
        cursor: 'pointer',
      }}>
        <div style={{
          position: 'absolute',
          top: 2,
          left: checked ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </div>
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: checked ? '#22c55e' : '#94a3b8',
      }}>
        {checked ? '✅ Enabled' : '⛔ Disabled'}
        {label && ` — ${label}`}
      </span>
    </div>
  );
}

// ========== SECTION COMPONENT ==========
function Section({ title, icon, children }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 10,
      border: '1px solid #e8edf4',
      padding: '16px 20px 20px',
      marginBottom: 14,
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ========== FIELD COMPONENT ==========
function Field({ label, children, hint, required }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 600,
        color: '#475569',
        marginBottom: 3,
      }}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

// ========== TIME INPUT ==========
function TimeInput({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <input
        type="time"
        style={{
          padding: '3px 6px',
          borderRadius: 4,
          border: '1px solid #e8edf4',
          background: '#fafbfc',
          fontSize: 11,
          color: '#0f172a',
          outline: 'none',
          width: 100,
        }}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <span style={{ fontSize: 10, color: '#94a3b8' }}>IST</span>
    </label>
  );
}

// ========== NUMBER INPUT ==========
function NumberInput({ label, value, onChange, min = 1, max = 30, suffix = '' }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <input
        type="number"
        style={{
          padding: '3px 6px',
          borderRadius: 4,
          border: '1px solid #e8edf4',
          background: '#fafbfc',
          fontSize: 11,
          color: '#0f172a',
          outline: 'none',
          width: 55,
        }}
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(Number(e.target.value))}
      />
      {suffix && <span style={{ fontSize: 10, color: '#94a3b8' }}>{suffix}</span>}
    </label>
  );
}

// ========== NOTIFICATION ROW ==========
function NotifRow({ label, hint, checked, onToggle, children }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '10px 0',
      borderBottom: '1px solid #f1f5f9',
    }}>
      <div style={{ paddingTop: 1 }}>
        <div
          onClick={() => onToggle(!checked)}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: checked ? '#22c55e' : '#d1d5db',
            position: 'relative',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{label}</div>
        {hint && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1, lineHeight: 1.4 }}>{hint}</div>}
        {checked && children && <div style={{ marginTop: 8 }}>{children}</div>}
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function CommConfigTab() {
  const [activeTab, setActiveTab] = useState('communication');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [testMsg, setTestMsg] = useState({});
  const [testLoading, setTestLoading] = useState({});
  const [serverState, setServerState] = useState({});
  const [testEmail, setTestEmail] = useState('');
  const [testMobile, setTestMobile] = useState('');

  // Communication State
  const [form, setForm] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    emailFrom: '',
    smtpEnabled: false,
    msg91AuthKey: '',
    msg91SenderId: 'MCNLMS',
    msg91TemplateId: '',
    smsEnabled: false,
    msg91WhatsappToken: '',
    msg91WhatsappIntegratedNumber: '',
    whatsappEnabled: false,
  });

  // Notification State
  const [notif, setNotif] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [commRes, notifRes] = await Promise.all([
      api.get('/admin/comm-config', 'admin'),
      api.get('/admin/notif-config', 'admin'),
    ]);

    if (commRes.ok) {
      const d = commRes.data;
      setServerState(d);
      setForm({
        smtpHost: d.smtpHost || 'smtp.gmail.com',
        smtpPort: d.smtpPort || 587,
        smtpUser: d.smtpUser || '',
        smtpPass: '',
        emailFrom: d.emailFrom || '',
        smtpEnabled: d.smtpEnabled || false,
        msg91AuthKey: '',
        msg91SenderId: d.msg91SenderId || 'MCNLMS',
        msg91TemplateId: d.msg91TemplateId || '',
        smsEnabled: d.smsEnabled || false,
        msg91WhatsappToken: '',
        msg91WhatsappIntegratedNumber: d.msg91WhatsappIntegratedNumber || '',
        whatsappEnabled: d.whatsappEnabled || false,
      });
    }

    if (notifRes.ok) {
      setNotif(notifRes.data);
    }

    setLoading(false);
  }

  function setComm(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setNotifField(k, v) { setNotif(c => ({ ...c, [k]: v })); }

  async function saveAll(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const commRes = await api.post('/admin/comm-config', form, 'admin');
    const notifRes = await api.post('/admin/notif-config', notif, 'admin');

    setSaving(false);

    if (commRes.ok && notifRes.ok) {
      setMsg({ type: 'ok', text: '✅ All settings saved successfully.' });
      loadAll();
    } else {
      const errors = [];
      if (!commRes.ok) errors.push(commRes.message || 'Communication save failed');
      if (!notifRes.ok) errors.push(notifRes.message || 'Notification save failed');
      setMsg({ type: 'bad', text: '❌ ' + errors.join('; ') });
    }
  }

  async function runTest(key, url, body) {
    setTestLoading(s => ({ ...s, [key]: true }));
    setTestMsg(s => ({ ...s, [key]: null }));
    const res = await api.post(url, body, 'admin');
    setTestLoading(s => ({ ...s, [key]: false }));
    setTestMsg(s => ({ ...s, [key]: res.ok ? { type: 'ok', text: res.message } : { type: 'bad', text: res.message } }));
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{
          width: 30,
          height: 30,
          border: '3px solid #e8edf4',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 10px',
        }} />
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading configuration...</div>
      </div>
    );
  }

  if (!notif) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Could not load configuration.</div>;
  }

  return (
    <div style={{
      width: '100%',
      padding: '8px 24px 20px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '100%',
      boxSizing: 'border-box',
    }}>

      {/* ===== HEADER ===== */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            📱 Communication & Notifications
          </h2>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#6366f1',
            background: '#f0f4ff',
            padding: '2px 10px',
            borderRadius: 12,
          }}>
            {activeTab === 'communication' ? '📨 SMTP · SMS · WhatsApp' : '🔔 Events · Reminders · Digests'}
          </span>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
          Configure email, SMS, WhatsApp providers and manage notification triggers
        </p>
      </div>

      {/* ===== TOAST ===== */}
      {msg && (
        <div style={{
          padding: '8px 14px',
          borderRadius: 6,
          marginBottom: 12,
          border: `1px solid ${msg.type === 'ok' ? '#86efac' : '#fecaca'}`,
          background: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2',
          color: msg.type === 'ok' ? '#16a34a' : '#dc2626',
          fontSize: 13,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '100%',
        }}>
          {msg.text}
          <button
            style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: 'inherit' }}
            onClick={() => setMsg(null)}
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
        maxWidth: '100%',
      }}>
        <button
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'communication' ? '#6366f1' : 'transparent',
            color: activeTab === 'communication' ? '#fff' : '#64748b',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setActiveTab('communication')}
        >
          📨 Communication Providers
        </button>
        <button
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'notifications' ? '#6366f1' : 'transparent',
            color: activeTab === 'notifications' ? '#fff' : '#64748b',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notification Triggers
        </button>
      </div>

      <form onSubmit={saveAll} style={{ width: '100%' }}>

        {/* ===== COMMUNICATION TAB ===== */}
        {activeTab === 'communication' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Left Column - Email */}
            <div>
              <Section title="Email (SMTP)" icon="✉️">
                <div style={{ marginBottom: 10 }}>
                  <Toggle checked={form.smtpEnabled} onChange={v => setComm('smtpEnabled', v)} label="Email sending" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8 }}>
                  <Field label="SMTP Host" required>
                    <input
                      style={styles.input}
                      value={form.smtpHost}
                      onChange={e => setComm('smtpHost', e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </Field>
                  <Field label="Port" required>
                    <input
                      style={styles.input}
                      type="number"
                      value={form.smtpPort}
                      onChange={e => setComm('smtpPort', e.target.value)}
                      placeholder="587"
                    />
                  </Field>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Field label="SMTP Username / Email" required>
                    <input
                      style={styles.input}
                      value={form.smtpUser}
                      onChange={e => setComm('smtpUser', e.target.value)}
                      placeholder="yourapp@gmail.com"
                    />
                  </Field>
                  <Field label={serverState.smtpPassSet ? 'SMTP Password (leave blank to keep)' : 'SMTP Password'}>
                    <input
                      style={styles.input}
                      type="password"
                      value={form.smtpPass}
                      onChange={e => setComm('smtpPass', e.target.value)}
                      placeholder={serverState.smtpPassSet ? '●●●●●●●● (saved)' : 'App password'}
                    />
                  </Field>
                </div>

                <Field label="From Address" hint="e.g. MCN LMS <noreply@teammas.in>">
                  <input
                    style={styles.input}
                    value={form.emailFrom}
                    onChange={e => setComm('emailFrom', e.target.value)}
                    placeholder="MCN LMS <noreply@teammas.in>"
                  />
                </Field>

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Field label="Send Test Email To">
                      <input
                        style={styles.input}
                        type="email"
                        value={testEmail}
                        onChange={e => setTestEmail(e.target.value)}
                        placeholder="test@example.com"
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    style={{ ...styles.btn, ...styles.btnSecondary, marginBottom: 10, whiteSpace: 'nowrap' }}
                    onClick={() => runTest('email', '/admin/comm-config/test-email', { testEmail })}
                    disabled={testLoading.email || !testEmail}
                  >
                    {testLoading.email ? '⏳...' : '📤 Test'}
                  </button>
                </div>
                {testMsg.email && <TestResult msg={testMsg.email} />}
              </Section>
            </div>

            {/* Right Column - SMS & WhatsApp */}
            <div>

              {/* SMS */}
              <Section title="SMS — MSG91" icon="📱">
                <div style={{ marginBottom: 10 }}>
                  <Toggle checked={form.smsEnabled} onChange={v => setComm('smsEnabled', v)} label="SMS sending" />
                </div>

                <Field
                  label={serverState.msg91AuthKeySet ? 'MSG91 Auth Key (leave blank to keep)' : 'MSG91 Auth Key'}
                  hint="From MSG91 dashboard → Credentials → Auth Key"
                  required
                >
                  <input
                    style={styles.input}
                    type="password"
                    value={form.msg91AuthKey}
                    onChange={e => setComm('msg91AuthKey', e.target.value)}
                    placeholder={serverState.msg91AuthKeySet ? '●●●●●●●● (saved)' : 'Paste MSG91 auth key'}
                  />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Field label="Sender ID" hint="6-char DLT registered">
                    <input
                      style={styles.input}
                      value={form.msg91SenderId}
                      onChange={e => setComm('msg91SenderId', e.target.value.toUpperCase())}
                      placeholder="MCNLMS"
                      maxLength={6}
                    />
                  </Field>
                  <Field label="Default Template ID" hint="DLT approved">
                    <input
                      style={styles.input}
                      value={form.msg91TemplateId}
                      onChange={e => setComm('msg91TemplateId', e.target.value)}
                      placeholder="1207xxxxxxxxxxxxxxxx"
                    />
                  </Field>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Field label="Send Test SMS To">
                      <input
                        style={styles.input}
                        type="tel"
                        value={testMobile}
                        onChange={e => setTestMobile(e.target.value)}
                        placeholder="9876543210"
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    style={{ ...styles.btn, ...styles.btnSecondary, marginBottom: 10, whiteSpace: 'nowrap' }}
                    onClick={() => runTest('sms', '/admin/comm-config/test-sms', { testMobile })}
                    disabled={testLoading.sms || !testMobile}
                  >
                    {testLoading.sms ? '⏳...' : '📤 Test SMS'}
                  </button>
                </div>
                {testMsg.sms && <TestResult msg={testMsg.sms} />}
              </Section>

              {/* WhatsApp */}
              <Section title="WhatsApp — MSG91" icon="💬">
                <div style={{ marginBottom: 10 }}>
                  <Toggle checked={form.whatsappEnabled} onChange={v => setComm('whatsappEnabled', v)} label="WhatsApp sending" />
                </div>

                <Field
                  label={serverState.msg91WhatsappTokenSet ? 'MSG91 WhatsApp Auth Key (leave blank to keep)' : 'MSG91 WhatsApp Auth Key'}
                  hint="From MSG91 dashboard → WhatsApp → API Credentials"
                  required
                >
                  <input
                    style={styles.input}
                    type="password"
                    value={form.msg91WhatsappToken}
                    onChange={e => setComm('msg91WhatsappToken', e.target.value)}
                    placeholder={serverState.msg91WhatsappTokenSet ? '●●●●●●●● (saved)' : 'Paste WhatsApp auth key'}
                  />
                </Field>

                <Field label="Integrated Number" hint="WhatsApp business number. e.g. 919876543210" required>
                  <input
                    style={styles.input}
                    value={form.msg91WhatsappIntegratedNumber}
                    onChange={e => setComm('msg91WhatsappIntegratedNumber', e.target.value)}
                    placeholder="919876543210"
                  />
                </Field>

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Field label="Send Test WhatsApp To">
                      <input
                        style={styles.input}
                        type="tel"
                        value={testMobile}
                        onChange={e => setTestMobile(e.target.value)}
                        placeholder="9876543210"
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    style={{ ...styles.btn, ...styles.btnSecondary, marginBottom: 10, whiteSpace: 'nowrap' }}
                    onClick={() => runTest('whatsapp', '/admin/comm-config/test-whatsapp', { testMobile })}
                    disabled={testLoading.whatsapp || !testMobile}
                  >
                    {testLoading.whatsapp ? '⏳...' : '📤 Test WA'}
                  </button>
                </div>
                {testMsg.whatsapp && <TestResult msg={testMsg.whatsapp} />}
              </Section>

            </div>
          </div>
        )}

        {/* ===== NOTIFICATIONS TAB ===== */}
        {activeTab === 'notifications' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Left Column - Trainee Events & Reminders */}
            <div>

              {/* Trainee Events */}
              <Section title="Trainee Event Notifications" icon="📩">
                <NotifRow
                  label="New trainee onboarded"
                  hint="Send login credentials to trainee when account is created"
                  checked={notif.notifyOnboard}
                  onToggle={v => setNotifField('notifyOnboard', v)}
                />
                <NotifRow
                  label="Password reset by admin"
                  hint="Notify trainee of new temporary password"
                  checked={notif.notifyPasswordReset}
                  onToggle={v => setNotifField('notifyPasswordReset', v)}
                />
                <NotifRow
                  label="Trainee certified"
                  hint="Congratulations when coordinator marks trainee as certified"
                  checked={notif.notifyCertification}
                  onToggle={v => setNotifField('notifyCertification', v)}
                />
                <NotifRow
                  label="Enrolled in batch"
                  hint="Notify trainee when enrolled in a new batch"
                  checked={notif.notifyBatchAssignment}
                  onToggle={v => setNotifField('notifyBatchAssignment', v)}
                />
                <NotifRow
                  label="Module assigned / broadcast"
                  hint="Notify trainees when a module is broadcast-assigned"
                  checked={notif.notifyModuleAssigned}
                  onToggle={v => setNotifField('notifyModuleAssigned', v)}
                />
              </Section>

              {/* Scheduled Reminders */}
              <Section title="Scheduled Reminders" icon="⏰">
                <NotifRow
                  label="Deadline reminder"
                  hint="Remind trainees of assigned modules due soon"
                  checked={notif.deadlineReminderEnabled}
                  onToggle={v => setNotifField('deadlineReminderEnabled', v)}
                >
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <TimeInput label="Send at" value={notif.deadlineReminderTime} onChange={v => setNotifField('deadlineReminderTime', v)} />
                    <NumberInput label="Days before due" value={notif.deadlineReminderDays} onChange={v => setNotifField('deadlineReminderDays', v)} suffix="day(s)" />
                  </div>
                </NotifRow>

                <NotifRow
                  label="Completion reminder"
                  hint="Nudge trainees with no activity and below 100% completion"
                  checked={notif.completionReminderEnabled}
                  onToggle={v => setNotifField('completionReminderEnabled', v)}
                >
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <TimeInput label="Send at" value={notif.completionReminderTime} onChange={v => setNotifField('completionReminderTime', v)} />
                    <NumberInput label="Inactive for" value={notif.completionReminderDays} onChange={v => setNotifField('completionReminderDays', v)} suffix="day(s)" />
                  </div>
                </NotifRow>
              </Section>

            </div>

            {/* Right Column - Coordinator Digests */}
            <div>

              <Section title="Coordinator & Admin Digests" icon="📊">
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: -4, marginBottom: 8 }}>
                  Sent to coordinators (requires email field set on coordinator accounts)
                </p>

                <NotifRow
                  label="Daily coverage digest"
                  hint="Coordinator gets daily summary of active batches"
                  checked={notif.dailyCoverageEnabled}
                  onToggle={v => setNotifField('dailyCoverageEnabled', v)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <TimeInput label="Send at" value={notif.dailyCoverageTime} onChange={v => setNotifField('dailyCoverageTime', v)} />
                    <Field label="Additional recipients (comma-separated)">
                      <input
                        style={styles.input}
                        placeholder="manager@teammas.in, director@teammas.in"
                        value={notif.dailyCoverageRecipients || ''}
                        onChange={e => setNotifField('dailyCoverageRecipients', e.target.value)}
                      />
                    </Field>
                  </div>
                </NotifRow>

                <NotifRow
                  label="At-risk trainee alert"
                  hint="Coordinator receives list of at-risk trainees in their batches"
                  checked={notif.coordinatorAlertEnabled}
                  onToggle={v => setNotifField('coordinatorAlertEnabled', v)}
                >
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TimeInput label="Send at" value={notif.coordinatorAlertTime} onChange={v => setNotifField('coordinatorAlertTime', v)} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      <span style={{ color: '#64748b' }}>Min risk</span>
                      <select
                        style={styles.smallSelect}
                        value={notif.coordinatorAlertMinRisk}
                        onChange={e => setNotifField('coordinatorAlertMinRisk', e.target.value)}
                      >
                        <option value="CRITICAL">CRITICAL only</option>
                        <option value="HIGH">HIGH + CRITICAL</option>
                        <option value="WATCH">WATCH + HIGH + CRITICAL</option>
                      </select>
                    </label>
                  </div>
                </NotifRow>

                <NotifRow
                  label="Pending activities digest"
                  hint="Coordinator receives list of overdue pending activities"
                  checked={notif.pendingActivityAlertEnabled}
                  onToggle={v => setNotifField('pendingActivityAlertEnabled', v)}
                >
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <TimeInput label="Send at" value={notif.pendingActivityAlertTime} onChange={v => setNotifField('pendingActivityAlertTime', v)} />
                    <NumberInput label="Overdue by" value={notif.pendingActivityAlertDays} onChange={v => setNotifField('pendingActivityAlertDays', v)} suffix="day(s)" />
                  </div>
                </NotifRow>

                <div style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  background: '#f8fafc',
                  borderRadius: 6,
                  fontSize: 10,
                  color: '#94a3b8',
                  lineHeight: 1.5,
                  border: '1px solid #f1f5f9',
                }}>
                  💡 Scheduled jobs fire daily at configured IST time. Email must be enabled in <b>Communication</b> tab.
                </div>
              </Section>

            </div>
          </div>
        )}

        {/* ===== SAVE BUTTON ===== */}
        <div style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <button
            type="submit"
            style={{
              ...styles.btn,
              ...styles.btnPrimary,
              padding: '8px 28px',
              fontSize: 13,
              fontWeight: 600,
            }}
            disabled={saving}
          >
            {saving ? '⏳ Saving...' : '💾 Save All Settings'}
          </button>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            Changes apply immediately for new events
          </span>
        </div>

      </form>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input:focus, select:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 2px rgba(99,102,241,0.08);
        }
        .notif-row:last-child {
          border-bottom: none;
        }
        .tab-btn:hover {
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}

// ========== TEST RESULT COMPONENT ==========
function TestResult({ msg }) {
  return (
    <div style={{
      padding: '4px 10px',
      borderRadius: 4,
      fontSize: 11,
      marginTop: 4,
      background: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2',
      color: msg.type === 'ok' ? '#16a34a' : '#dc2626',
      border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecaca'}`,
    }}>
      {msg.text}
    </div>
  );
}

// ========== STYLES ==========
const styles = {
  input: {
    padding: '5px 8px',
    borderRadius: 4,
    border: '1px solid #e8edf4',
    background: '#fafbfc',
    fontSize: 12,
    color: '#0f172a',
    outline: 'none',
    width: '100%',
    transition: 'all 0.15s',
    boxSizing: 'border-box',
  },
  smallSelect: {
    padding: '3px 6px',
    borderRadius: 4,
    border: '1px solid #e8edf4',
    background: '#fafbfc',
    fontSize: 11,
    color: '#0f172a',
    outline: 'none',
    width: 120,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btn: {
    padding: '5px 14px',
    borderRadius: 4,
    border: 'none',
    fontSize: 12,
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
};