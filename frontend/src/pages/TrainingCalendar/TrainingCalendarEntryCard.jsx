const COPY = {
  trainee: {
    eyebrow: 'Instructor-led learning',
    title: 'Live Training Calendar',
    description: 'Discover eligible sessions, reserve a seat, monitor your waitlist position, securely check in and review verified attendance.',
    action: 'Open my calendar',
    icon: '📅',
    color: '#6366f1',
    bgGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    features: ['Calendar', 'Capacity', 'Waitlist', 'Attendance', 'Evidence']
  },
  coordinator: {
    eyebrow: 'Owned-batch operations',
    title: 'Batch Training Calendar',
    description: 'Create conflict-free sessions, manage batch enrolment, display secure check-in codes and finalize attendance evidence.',
    action: 'Open batch calendar',
    icon: '📋',
    color: '#22c55e',
    bgGradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    features: ['Sessions', 'Enrolment', 'Check-in Codes', 'Attendance']
  },
  admin: {
    eyebrow: 'Training governance',
    title: 'Instructor-led Training',
    description: 'Manage venues, instructors, capacity policies, waitlists, attendance controls and branch or company session reporting.',
    action: 'Open training governance',
    icon: '⚙️',
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    features: ['Venues', 'Instructors', 'Capacity', 'Waitlists', 'Reporting']
  },
};

export default function TrainingCalendarEntryCard({ role = 'trainee', className = '' }) {
  const copy = COPY[role] || COPY.trainee;
  
  const getFeatureIcon = (feature) => {
    const icons = {
      'Calendar': '📅',
      'Capacity': '📊',
      'Waitlist': '⏳',
      'Attendance': '✅',
      'Evidence': '📎',
      'Sessions': '🎯',
      'Enrolment': '📝',
      'Check-in Codes': '🔑',
      'Venues': '🏢',
      'Instructors': '👨‍🏫',
      'Reporting': '📈'
    };
    return icons[feature] || '•';
  };

  return (
    <section 
      className={`panel ${className}`} 
      style={{ 
        overflow: 'hidden', 
        position: 'relative',
        background: 'var(--card-solid)',
        borderRadius: '20px',
        padding: '28px 32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        border: '1px solid var(--line)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)';
      }}
    >
      {/* Decorative gradient circles */}
      <div style={{ 
        position: 'absolute', 
        width: 250, 
        height: 250, 
        borderRadius: '50%', 
        background: copy.bgGradient,
        opacity: 0.08,
        right: -80, 
        top: -120 
      }} />
      <div style={{ 
        position: 'absolute', 
        width: 150, 
        height: 150, 
        borderRadius: '50%', 
        background: copy.bgGradient,
        opacity: 0.05,
        left: -60, 
        bottom: -80 
      }} />
      
      {/* Main content */}
      <div style={{ 
        position: 'relative', 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0,1fr) auto', 
        gap: 24, 
        alignItems: 'center' 
      }}>
        <div>
          {/* Role badge with icon */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10,
            marginBottom: 10
          }}>
            <span style={{ 
              fontSize: 24,
              lineHeight: 1
            }}>
              {copy.icon}
            </span>
            <span style={{ 
              display: 'inline-block', 
              fontSize: 11, 
              fontWeight: 700, 
              letterSpacing: '.06em', 
              textTransform: 'uppercase', 
              color: copy.color,
              background: `${copy.color}15`,
              padding: '4px 12px',
              borderRadius: '99px',
              border: `1px solid ${copy.color}30`,
            }}>
              {copy.eyebrow}
            </span>
          </div>

          {/* Title */}
          <h2 style={{ 
            margin: 0, 
            fontSize: 26, 
            fontWeight: 800,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            {copy.title}
          </h2>

          {/* Description */}
          <p style={{ 
            margin: '8px 0 0', 
            color: 'var(--muted)', 
            maxWidth: 680,
            fontSize: 14,
            lineHeight: 1.6,
            letterSpacing: '0.01em'
          }}>
            {copy.description}
          </p>

          {/* Feature pills */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 8, 
            marginTop: 16 
          }}>
            {copy.features.map(item => (
              <span 
                key={item} 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 12px',
                  borderRadius: '99px',
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  color: 'var(--muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = copy.color + '15';
                  e.currentTarget.style.borderColor = copy.color + '40';
                  e.currentTarget.style.color = copy.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--card)';
                  e.currentTarget.style.borderColor = 'var(--line)';
                  e.currentTarget.style.color = 'var(--muted)';
                }}
              >
                <span style={{ fontSize: 12 }}>{getFeatureIcon(item)}</span>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Action button */}
        <a 
          className="btn" 
          href={`/training-calendar?role=${role}`}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            background: copy.bgGradient,
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
            boxShadow: `0 4px 16px ${copy.color}40`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = `0 8px 24px ${copy.color}50`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = `0 4px 16px ${copy.color}40`;
          }}
        >
          <span>{copy.action}</span>
          <span style={{ 
            display: 'inline-block',
            transition: 'transform 0.3s',
          }}>
            →
          </span>
        </a>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .panel {
            padding: 20px !important;
          }
          .panel > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .panel h2 {
            font-size: 22px !important;
          }
          .panel a.btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .panel p {
            font-size: 13px !important;
          }
        }
        @media (max-width: 480px) {
          .panel {
            padding: 16px !important;
          }
          .panel h2 {
            font-size: 20px !important;
          }
          .panel .features {
            gap: 6px !important;
          }
          .panel .features span {
            font-size: 10px !important;
            padding: 3px 10px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .panel,
          .panel a.btn,
          .panel .features span {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}