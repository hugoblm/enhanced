/* eslint-disable */
// Enhanced — UI Kit components
// All components are cosmetic recreations. Token usage follows colors_and_type.css.

const TOKENS = {
  bg: '#FFFFFF', muted: '#FAFAFA', surface: '#F5F5F5',
  border: '#E5E5E5', borderHover: '#D4D4D4',
  fg: '#0A0A0A', fgAlt: '#404040', fgMuted: '#737373', fgFaint: '#A3A3A3',
  primary: '#171717', primaryHover: '#404040',
  brand: '#2563EB', brandSubtle: '#EFF6FF', brandBorder: '#BFDBFE', brandDeep: '#1E3A8A', brandHover: '#1D4ED8',
  destructive: '#DC2626', destructiveSubtle: '#FEF2F2', destructiveBorder: '#FECACA', destructiveDeep: '#7F1D1D',
  success: '#16A34A',
  radius: 10, radiusSm: 6, radiusLg: 16,
  fontSans: "'Cantarell', 'Inter', system-ui, sans-serif",
  fontUI: "'Kedebideri', 'Cantarell', 'Inter', system-ui, sans-serif",
  fontHeading: "'Kedebideri', 'Cantarell', 'Inter', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, monospace",
};

// ----- icons (Lucide path data, 24x24) -----
const ICON = {
  mic: 'M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4ZM19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8',
  fileText: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  plus: 'M12 5v14M5 12h14',
  check: 'M20 6 9 17l-5-5',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  x: 'M18 6 6 18M6 6l12 12',
  more: 'M5 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM21 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
  sparkles: 'm12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5z',
  chevronDown: 'm6 9 6 6 6-6',
  chevronRight: 'm9 6 6 6-6 6',
  alertCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 8v4M12 16h.01',
  checkCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12l3 3 5-6',
  database: 'M21 5c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3ZM3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4 3 9 3s9-1.34 9-3',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z',
  bookmark: 'm19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z',
  pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
  play: 'M5 3l14 9-14 9z',
  command: 'M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3Z',
  settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6',
};

function Icon({ name, size = 16, color = 'currentColor', stroke = 1.5, style = {} }) {
  const d = ICON[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

// ----- buttons -----
function Button({ variant = 'primary', size = 'md', children, leftIcon, rightIcon, onClick, disabled, style = {} }) {
  const sizes = {
    sm: { h: 28, px: 12, fs: 13, gap: 6, radius: 8 },
    md: { h: 36, px: 16, fs: 14, gap: 8, radius: 10 },
    lg: { h: 44, px: 20, fs: 15, gap: 8, radius: 10 },
  }[size];
  const variants = {
    primary: { bg: TOKENS.primary, color: '#FFFFFF', border: 'none', hoverBg: TOKENS.primaryHover },
    secondary: { bg: TOKENS.surface, color: TOKENS.primary, border: `1px solid ${TOKENS.border}`, hoverBg: TOKENS.muted },
    outline: { bg: TOKENS.bg, color: TOKENS.primary, border: `1px solid ${TOKENS.border}`, hoverBg: TOKENS.muted },
    ghost: { bg: 'transparent', color: TOKENS.fgAlt, border: 'none', hoverBg: 'rgba(0,0,0,0.05)' },
    brand: { bg: TOKENS.brand, color: '#FFFFFF', border: 'none', hoverBg: TOKENS.brandHover },
    destructive: { bg: TOKENS.destructive, color: '#FFFFFF', border: 'none', hoverBg: '#B91C1C' },
  }[variant];
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: sizes.h,
        padding: `0 ${sizes.px}px`,
        background: hover && !disabled ? variants.hoverBg : variants.bg,
        color: variants.color,
        border: variants.border,
        borderRadius: sizes.radius,
        fontFamily: TOKENS.fontUI,
        fontWeight: 500,
        fontSize: sizes.fs,
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizes.gap,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        transition: 'background 120ms ease-out',
        ...style,
      }}
    >
      {leftIcon && <Icon name={leftIcon} size={sizes.fs} />}
      {children}
      {rightIcon && <Icon name={rightIcon} size={sizes.fs} />}
    </button>
  );
}

function IconButton({ icon, size = 32, onClick, style = {}, tone = 'ghost' }) {
  const [hover, setHover] = React.useState(false);
  const styles = {
    ghost: { bg: hover ? 'rgba(0,0,0,0.05)' : 'transparent', color: TOKENS.fgAlt, border: 'none' },
    outline: { bg: hover ? TOKENS.muted : TOKENS.bg, color: TOKENS.primary, border: `1px solid ${TOKENS.border}` },
  }[tone];
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size,
        background: styles.bg, color: styles.color, border: styles.border,
        borderRadius: 8, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 120ms ease-out',
        ...style,
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </button>
  );
}

// ----- form -----
function Input({ value, onChange, placeholder, leftIcon, style = {}, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ position: 'relative', ...style }}>
      {leftIcon && (
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: TOKENS.fgMuted, pointerEvents: 'none' }}>
          <Icon name={leftIcon} size={14} />
        </div>
      )}
      <input
        value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          height: 36, width: '100%',
          padding: `0 12px 0 ${leftIcon ? 34 : 12}px`,
          background: TOKENS.bg, color: TOKENS.fg,
          border: `1px solid ${focus ? TOKENS.brand : TOKENS.border}`,
          borderRadius: TOKENS.radius,
          fontFamily: TOKENS.fontSans, fontSize: 14,
          outline: 'none',
          boxShadow: focus ? `0 0 0 2px rgba(37,99,235,0.18)` : 'none',
          transition: 'border-color 120ms, box-shadow 120ms',
        }}
        {...rest}
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, style = {} }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        width: '100%',
        padding: '12px 14px',
        background: TOKENS.bg, color: TOKENS.fg,
        border: `1px solid ${focus ? TOKENS.brand : TOKENS.border}`,
        borderRadius: TOKENS.radius,
        fontFamily: TOKENS.fontSans, fontSize: 14, lineHeight: '20px',
        outline: 'none', resize: 'none',
        boxShadow: focus ? `0 0 0 2px rgba(37,99,235,0.18)` : 'none',
        ...style,
      }}
    />
  );
}

// ----- badges / pills -----
function Badge({ children, tone = 'default', style = {} }) {
  const tones = {
    default: { bg: TOKENS.primary, color: '#FAFAFA', border: 'none' },
    secondary: { bg: TOKENS.surface, color: TOKENS.primary, border: 'none' },
    outline: { bg: TOKENS.bg, color: TOKENS.fgAlt, border: `1px solid ${TOKENS.border}` },
    brand: { bg: '#DBEAFE', color: '#1E40AF', border: 'none' },
    destructive: { bg: TOKENS.destructiveSubtle, color: TOKENS.destructive, border: `1px solid ${TOKENS.destructiveBorder}` },
    success: { bg: '#DCFCE7', color: '#166534', border: 'none' },
  }[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: TOKENS.radiusSm,
      background: tones.bg, color: tones.color, border: tones.border,
      fontFamily: TOKENS.fontUI, fontWeight: 500, fontSize: 12,
      whiteSpace: 'nowrap',
      ...style,
    }}>{children}</span>
  );
}

function StatusPill({ status, children }) {
  const colors = {
    review: TOKENS.brand,
    validated: TOKENS.success,
    draft: TOKENS.fgFaint,
    blocked: TOKENS.destructive,
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 9999,
      background: TOKENS.bg, border: `1px solid ${TOKENS.border}`, color: TOKENS.fg,
      fontFamily: TOKENS.fontUI, fontWeight: 500, fontSize: 12,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[status] }} />
      {children}
    </span>
  );
}

// ----- avatars -----
function Avatar({ initials, size = 32, bg, ring }) {
  const palette = ['#171717', '#404040', '#525252', '#737373'];
  const color = bg || palette[(initials.charCodeAt(0) || 0) % 4];
  return (
    <div style={{
      width: size, height: size, borderRadius: 9999,
      background: color, color: '#FAFAFA',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.4), fontWeight: 500, fontFamily: TOKENS.fontUI,
      border: ring ? `2px solid ${ring}` : 'none',
    }}>{initials}</div>
  );
}

function AvatarStack({ people, max = 4 }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div style={{ display: 'inline-flex' }}>
      {shown.map((p, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar initials={p} size={28} ring="#FFFFFF" />
        </div>
      ))}
      {extra > 0 && (
        <div style={{ marginLeft: -8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 9999, background: TOKENS.surface,
            color: TOKENS.fgAlt, border: `2px solid ${TOKENS.bg}`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 500, fontFamily: TOKENS.fontUI,
          }}>+{extra}</div>
        </div>
      )}
    </div>
  );
}

// ----- source chip -----
function SourceChip({ source }) {
  const icons = { mixpanel: 'database', notion: 'fileText', linear: 'inbox', web: 'globe', support: 'inbox' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 9999,
      background: TOKENS.bg, border: `1px solid ${TOKENS.border}`,
      fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.fgAlt,
    }}>
      <Icon name={icons[source] || 'link'} size={11} color={TOKENS.fgMuted} stroke={1.75} />
      {source}
    </span>
  );
}

// ----- evidence callout -----
function EvidenceCallout({ kind = 'found', label, sources, children }) {
  const styles = {
    found: { bg: TOKENS.brandSubtle, border: TOKENS.brandBorder, accent: TOKENS.brand, deep: TOKENS.brandDeep, labelColor: '#1D4ED8', icon: 'sparkles' },
    missing: { bg: TOKENS.destructiveSubtle, border: TOKENS.destructiveBorder, accent: TOKENS.destructive, deep: TOKENS.destructiveDeep, labelColor: '#B91C1C', icon: 'alertCircle' },
    question: { bg: TOKENS.muted, border: TOKENS.border, accent: TOKENS.fgAlt, deep: TOKENS.fg, labelColor: TOKENS.fgMuted, icon: 'alertCircle' },
  }[kind];
  return (
    <div style={{
      background: styles.bg, border: `1px solid ${styles.border}`,
      borderRadius: TOKENS.radius, padding: '14px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon name={styles.icon} size={14} color={styles.accent} stroke={2} />
        <div style={{
          fontFamily: TOKENS.fontUI, fontSize: 11, letterSpacing: 1.5,
          textTransform: 'uppercase', color: styles.labelColor, fontWeight: 500,
        }}>{label}</div>
      </div>
      <div style={{ fontSize: 14, lineHeight: '21px', color: styles.deep }}>{children}</div>
      {sources && sources.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {sources.map(s => <SourceChip key={s} source={s} />)}
        </div>
      )}
    </div>
  );
}

// ----- PRD section block (the signature doc unit) -----
function PRDSection({ label, confidence, children }) {
  return (
    <section style={{
      border: `1px solid ${TOKENS.border}`,
      borderRadius: TOKENS.radius,
      background: TOKENS.bg,
      padding: '22px 26px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          fontFamily: TOKENS.fontUI, fontSize: 11, letterSpacing: 1.5,
          textTransform: 'uppercase', color: TOKENS.fgMuted, fontWeight: 500,
        }}>{label}</div>
        {confidence && (
          <span style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.fgFaint }}>
            confidence: {confidence}
          </span>
        )}
      </div>
      <div style={{ fontSize: 16, lineHeight: '25px', color: '#262626' }}>{children}</div>
    </section>
  );
}

// ----- toolbar -----
function Toolbar({ title, status, onShare }) {
  return (
    <div style={{
      height: 56, background: TOKENS.bg, borderBottom: `1px solid ${TOKENS.border}`,
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <Icon name="fileText" size={16} color={TOKENS.fgMuted} />
        <div style={{
          fontFamily: TOKENS.fontUI, fontSize: 14, fontWeight: 500, color: TOKENS.fg,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{title}</div>
        {status && <StatusPill status={status === 'In review' ? 'review' : status === 'Validated' ? 'validated' : 'draft'}>{status}</StatusPill>}
        <span style={{ fontFamily: TOKENS.fontMono, fontSize: 12, color: TOKENS.fgFaint }}>
          412 words · saved 2 min ago
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{
          height: 32, padding: '0 10px', borderRadius: 8,
          background: TOKENS.bg, border: `1px solid ${TOKENS.border}`,
          fontFamily: TOKENS.fontUI, fontSize: 13, fontWeight: 500, color: TOKENS.fgAlt,
          display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        }}>
          <Icon name="search" size={13} />
          <span>Search</span>
          <span style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.fgFaint, marginLeft: 24 }}>⌘K</span>
        </button>
        <AvatarStack people={['JM', 'AL', 'TR']} />
        <Button variant="outline" size="sm" leftIcon="share" onClick={onShare}>Share</Button>
        <Button variant="primary" size="sm">Publish</Button>
      </div>
    </div>
  );
}

// ----- sidebar -----
function Sidebar({ activeDraft, onSelect, onNewDraft }) {
  const sections = [
    {
      title: 'Drafts',
      items: [
        { id: 'd1', title: 'Saved searches v1', updated: '2 min ago', status: 'review' },
        { id: 'd2', title: 'Onboarding redesign', updated: '1 h ago', status: 'review' },
        { id: 'd3', title: 'Team plan pricing', updated: 'Yesterday', status: 'draft' },
        { id: 'd4', title: 'Mobile push retention', updated: '2 days ago', status: 'validated' },
      ],
    },
    {
      title: 'Archived',
      items: [
        { id: 'a1', title: 'In-app comments v0', updated: 'Mar 14', status: 'draft' },
      ],
    },
  ];

  return (
    <aside style={{
      width: 240, background: TOKENS.muted, borderRight: `1px solid ${TOKENS.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="../../assets/mark.svg" width="22" height="22" alt="" />
        <div style={{ fontFamily: TOKENS.fontHeading, fontWeight: 600, fontSize: 14, color: TOKENS.fg, letterSpacing: '-0.2px' }}>
          Acme · Product
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Icon name="chevronDown" size={14} color={TOKENS.fgMuted} />
        </div>
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        <button onClick={onNewDraft} style={{
          width: '100%', height: 36, padding: '0 12px',
          background: TOKENS.primary, color: '#FAFAFA', border: 'none',
          borderRadius: 10, cursor: 'pointer',
          fontFamily: TOKENS.fontUI, fontWeight: 500, fontSize: 14,
          display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start',
        }}>
          <Icon name="mic" size={14} stroke={1.75} />
          <span>New voice draft</span>
          <span style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: '#A3A3A3', marginLeft: 'auto' }}>⌘N</span>
        </button>
      </div>

      <nav style={{ padding: '0 8px', flex: 1, overflow: 'auto' }}>
        {[
          { icon: 'inbox', label: 'Inbox', count: 3 },
          { icon: 'bookmark', label: 'Pinned' },
          { icon: 'database', label: 'Sources' },
        ].map((it) => (
          <div key={it.label} style={{
            padding: '6px 10px', borderRadius: 6, fontSize: 13, color: TOKENS.fgAlt,
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          }}>
            <Icon name={it.icon} size={14} color={TOKENS.fgMuted} />
            <span>{it.label}</span>
            {it.count && (
              <span style={{ marginLeft: 'auto', fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.fgFaint }}>{it.count}</span>
            )}
          </div>
        ))}

        {sections.map(sec => (
          <div key={sec.title} style={{ marginTop: 16 }}>
            <div style={{
              padding: '6px 10px', fontSize: 11, letterSpacing: 1.2,
              textTransform: 'uppercase', color: TOKENS.fgMuted, fontWeight: 500, fontFamily: TOKENS.fontUI,
            }}>{sec.title}</div>
            {sec.items.map(it => {
              const active = it.id === activeDraft;
              return (
                <button key={it.id} onClick={() => onSelect?.(it.id)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 10px', borderRadius: 6,
                  background: active ? TOKENS.bg : 'transparent',
                  border: 'none', cursor: 'pointer',
                  boxShadow: active ? '0 1px 2px 0 rgba(0,0,0,0.05)' : 'none',
                }}>
                  <div style={{
                    fontFamily: TOKENS.fontUI, fontSize: 13,
                    color: active ? TOKENS.fg : TOKENS.fgAlt, fontWeight: active ? 600 : 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{it.title}</div>
                  <div style={{
                    fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.fgFaint, marginTop: 2,
                  }}>{it.updated}</div>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: 12, borderTop: `1px solid ${TOKENS.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar initials="JM" size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: TOKENS.fg, fontWeight: 500, fontFamily: TOKENS.fontUI }}>Juliette M.</div>
          <div style={{ fontSize: 11, color: TOKENS.fgMuted }}>juliette@acme.co</div>
        </div>
        <IconButton icon="settings" size={28} />
      </div>
    </aside>
  );
}

// ----- composer (voice input) -----
function Composer({ onGenerate }) {
  const [recording, setRecording] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div style={{
      maxWidth: 720, margin: '0 auto', padding: '48px 32px',
      display: 'flex', flexDirection: 'column', gap: 32,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: TOKENS.fontHeading, fontWeight: 600, fontSize: 30, letterSpacing: '-1px', color: TOKENS.fg }}>
          Start with what you actually want.
        </div>
        <div style={{ fontSize: 15, lineHeight: '24px', color: TOKENS.fgAlt, marginTop: 10, maxWidth: 480, marginInline: 'auto' }}>
          Speak your idea out loud. Enhanced drafts the PRD and challenges every assumption against your team's data.
        </div>
      </div>

      <div style={{
        border: `1px solid ${recording ? TOKENS.brand : TOKENS.border}`,
        borderRadius: TOKENS.radiusLg, background: TOKENS.bg,
        padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
        boxShadow: recording ? '0 0 0 4px rgba(37,99,235,0.10)' : '0 1px 2px 0 rgba(0,0,0,0.05)',
        transition: 'border-color 160ms, box-shadow 160ms',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setRecording(r => !r)}
            style={{
              width: 56, height: 56, borderRadius: 9999,
              background: recording ? TOKENS.destructive : TOKENS.brand,
              color: '#FFFFFF', border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: recording ? '0 0 0 0 rgba(220,38,38,0.5)' : 'none',
              animation: recording ? 'pulse 1.4s ease-out infinite' : 'none',
            }}
          >
            <Icon name={recording ? 'pause' : 'mic'} size={22} stroke={2} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500, fontFamily: TOKENS.fontUI, color: TOKENS.fg }}>
              {recording ? 'Listening…' : 'Tap to record your idea'}
            </div>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 13, color: TOKENS.fgMuted, marginTop: 2 }}>
              {recording ? `${mm}:${ss} · streaming to local model` : 'Max 5 minutes · transcribed locally'}
            </div>
          </div>
          {recording && (
            <Button variant="primary" rightIcon="arrowRight" onClick={onGenerate}>Stop & draft</Button>
          )}
        </div>

        {recording && (
          <div style={{ background: TOKENS.muted, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: TOKENS.fgMuted, fontWeight: 500, fontFamily: TOKENS.fontUI, marginBottom: 6 }}>
              Transcript
            </div>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 13, lineHeight: '20px', color: TOKENS.fgAlt }}>
              I want to add a saved-searches feature so power users stop losing their filters when they come back the next day…
              <span style={{ display: 'inline-block', width: 7, height: 14, background: TOKENS.brand, marginLeft: 2, transform: 'translateY(2px)', animation: 'caret 1s steps(2) infinite' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: TOKENS.border }} />
          <div style={{ fontSize: 12, color: TOKENS.fgMuted }}>or</div>
          <div style={{ flex: 1, height: 1, background: TOKENS.border }} />
        </div>

        <Textarea rows={3} placeholder="Paste a Slack thread, a meeting transcript, or just type your idea here…" />
      </div>

      <div>
        <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: TOKENS.fgMuted, fontWeight: 500, fontFamily: TOKENS.fontUI, marginBottom: 12 }}>
          Continue a recent voice note
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { t: '2 days ago · 3:14', txt: 'Onboarding feels too long — the first-run wizard is asking for stuff we already have…' },
            { t: '4 days ago · 1:42', txt: 'Idea for tiered plans, especially how team admins manage seats…' },
          ].map((r, i) => (
            <div key={i} style={{
              padding: '12px 16px', border: `1px solid ${TOKENS.border}`, borderRadius: 10,
              background: TOKENS.bg, display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer',
            }}>
              <Icon name="play" size={14} color={TOKENS.fgMuted} stroke={2} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: TOKENS.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.txt}
                </div>
                <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.fgFaint, marginTop: 2 }}>{r.t}</div>
              </div>
              <Icon name="arrowRight" size={14} color={TOKENS.fgMuted} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----- inspector (right rail) -----
function Inspector({ onClose }) {
  return (
    <aside style={{
      width: 340, background: TOKENS.muted, borderLeft: `1px solid ${TOKENS.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ height: 56, borderBottom: `1px solid ${TOKENS.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8 }}>
        <Icon name="database" size={14} color={TOKENS.fgMuted} />
        <div style={{ fontSize: 13, fontWeight: 500, fontFamily: TOKENS.fontUI, color: TOKENS.fg, flex: 1 }}>Evidence & sources</div>
        <IconButton icon="x" size={28} onClick={onClose} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: TOKENS.fgMuted, fontWeight: 500, fontFamily: TOKENS.fontUI, marginBottom: 8 }}>
            Connected sources · 5
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <SourceChip source="mixpanel" />
            <SourceChip source="notion" />
            <SourceChip source="linear" />
            <SourceChip source="support" />
            <SourceChip source="web" />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: TOKENS.fgMuted, fontWeight: 500, fontFamily: TOKENS.fontUI, marginBottom: 8 }}>
            Cited in this draft
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { src: 'mixpanel', title: 'session_filter_views > 1', note: '4.2x avg · 90d · tier_pro' },
              { src: 'support', title: '0 tickets matching "lost filter"', note: '90d · all tiers' },
              { src: 'linear', title: 'ENG-2104 — filter persistence', note: 'Won\'t do · 2024' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: 12, background: TOKENS.bg, border: `1px solid ${TOKENS.border}`,
                borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SourceChip source={s.src} />
                </div>
                <div style={{ fontFamily: TOKENS.fontMono, fontSize: 12, color: TOKENS.fg, marginTop: 4 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: TOKENS.fgMuted }}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: TOKENS.fgMuted, fontWeight: 500, fontFamily: TOKENS.fontUI, marginBottom: 8 }}>
            Team activity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { who: 'AL', name: 'Alex L.', what: 'commented on "What you\'d need to prove"', when: '12 min ago' },
              { who: 'TR', name: 'Théo R.', what: 'added a Mixpanel query', when: '24 min ago' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <Avatar initials={a.who} size={24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: TOKENS.fgAlt, lineHeight: '18px' }}>
                    <strong style={{ color: TOKENS.fg, fontWeight: 500, fontFamily: TOKENS.fontUI }}>{a.name}</strong> {a.what}
                  </div>
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: TOKENS.fgFaint, marginTop: 2 }}>{a.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

// Export everything
Object.assign(window, {
  Icon, Button, IconButton, Input, Textarea, Badge, StatusPill,
  Avatar, AvatarStack, SourceChip, EvidenceCallout, PRDSection,
  Toolbar, Sidebar, Composer, Inspector, ENHANCED_TOKENS: TOKENS,
});
