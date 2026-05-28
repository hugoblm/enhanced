/* eslint-disable */
// Enhanced — PRD document that builds in real time on the right pane

const PT = window.ENHANCED_TOKENS;

// ----- Inline tag pill: [Evidence] / [Assumption] / [To verify] -----
function PRDTag({ kind, copy }) {
  const tones = {
    evidence:   { bg: '#DBEAFE', fg: '#1D4ED8', label: copy.tag_evidence },
    assumption: { bg: '#FEF3C7', fg: '#92400E', label: copy.tag_assumption },
    toverify:   { bg: '#F5F5F5', fg: '#525252', label: copy.tag_to_verify },
  };
  const t = tones[kind] || tones.toverify;
  return (
    <span style={{
      fontFamily: PT.fontMono, fontSize: 11, fontWeight: 500,
      padding: '1px 7px', borderRadius: 4, marginRight: 4,
      background: t.bg, color: t.fg, whiteSpace: 'nowrap',
      display: 'inline-block', verticalAlign: 'baseline',
    }}>[{t.label}]</span>
  );
}

// ----- Block (Refine on hover) -----
function PRDBlock({
  label, children, streaming = false,
  refineOpen = false, onRefineOpen, onRefineClose, copy,
  variant = 'default',
}) {
  const [hover, setHover] = React.useState(false);
  const [refineText, setRefineText] = React.useState('');

  const bg = variant === 'brand' ? '#EFF6FF' :
             variant === 'destructive' ? '#FEF2F2' :
             variant === 'muted' ? '#FAFAFA' : '#FFFFFF';
  const border = variant === 'brand' ? '#BFDBFE' :
                 variant === 'destructive' ? '#FECACA' :
                 variant === 'muted' ? '#E5E5E5' : '#E5E5E5';
  const labelColor = variant === 'brand' ? '#1D4ED8' :
                     variant === 'destructive' ? '#B91C1C' : '#737373';

  return (
    <section
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: bg, border: `1px solid ${refineOpen || hover ? '#D4D4D4' : border}`,
        borderRadius: 10, padding: '18px 22px',
        transition: 'border-color 120ms ease-out',
      }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10, minHeight: 18,
      }}>
        <div style={{
          fontFamily: PT.fontUI, fontSize: 10.5, letterSpacing: 1.5,
          textTransform: 'uppercase', color: labelColor, fontWeight: 500,
        }}>{label}</div>
        {(hover || refineOpen) && !streaming && (
          <button onClick={onRefineOpen} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 8px', height: 22,
            background: refineOpen ? '#171717' : '#FFFFFF',
            color: refineOpen ? '#FFFFFF' : '#525252',
            border: `1px solid ${refineOpen ? '#171717' : '#E5E5E5'}`,
            borderRadius: 6, cursor: 'pointer',
            fontFamily: PT.fontUI, fontSize: 11, fontWeight: 500,
          }}>
            <Icon name="sparkles" size={11} stroke={2} />
            Refine
          </button>
        )}
      </div>
      <div style={{
        fontFamily: PT.fontSans, fontSize: 15, lineHeight: '24px',
        color: variant === 'brand' ? '#1E3A8A' :
               variant === 'destructive' ? '#7F1D1D' : '#262626',
      }}>
        {children}
        {streaming && <StreamCaret />}
      </div>

      {refineOpen && (
        <div style={{
          marginTop: 14, padding: 12,
          background: '#FFFFFF', border: '1px solid #171717',
          borderRadius: 8,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
            fontFamily: PT.fontUI, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase',
            color: '#525252', fontWeight: 500,
          }}>
            <Icon name="sparkles" size={11} color="#2563EB" stroke={2} />
            Affine ce block — édition par instruction
          </div>
          <textarea
            rows={2} placeholder={copy.refine_placeholder}
            value={refineText} onChange={e => setRefineText(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '8px 10px', border: '1px solid #E5E5E5', borderRadius: 6,
              fontFamily: PT.fontSans, fontSize: 13, lineHeight: '19px', color: '#171717',
              outline: 'none', resize: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {copy.refine_examples.map((ex, i) => (
              <button key={i} onClick={() => setRefineText(ex)} style={{
                padding: '4px 10px', borderRadius: 9999,
                background: '#F5F5F5', color: '#525252', border: 'none', cursor: 'pointer',
                fontFamily: PT.fontUI, fontSize: 11, fontWeight: 500,
              }}>{ex}</button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={onRefineClose} style={{
              padding: '4px 10px', height: 26, borderRadius: 6,
              background: 'transparent', color: '#737373', border: 'none', cursor: 'pointer',
              fontFamily: PT.fontUI, fontSize: 12, fontWeight: 500,
            }}>{copy.refine_cancel}</button>
            <button style={{
              padding: '4px 12px', height: 26, borderRadius: 6,
              background: '#171717', color: '#FFFFFF', border: 'none', cursor: 'pointer',
              fontFamily: PT.fontUI, fontSize: 12, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <Icon name="sparkles" size={11} stroke={2} />
              {copy.refine_submit}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ----- Risk gauge: large circular confidence indicator -----
function ConfidenceGauge({ score = 64, max = 100, size = 156, copy, lang }) {
  const r = (size - 16) / 2;
  const C = 2 * Math.PI * r;
  const ratio = score / max;
  const dash = C * ratio;
  const color = ratio >= 0.75 ? '#16A34A' : ratio >= 0.5 ? '#2563EB' : '#D97706';
  const label = ratio >= 0.75 ? (lang === 'fr' ? 'Solide' : 'Solid')
              : ratio >= 0.5 ? (lang === 'fr' ? 'Modérée' : 'Moderate')
              : (lang === 'fr' ? 'Faible' : 'Low');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F5F5F5" strokeWidth={10} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10}
            strokeLinecap="round" strokeDasharray={`${dash} ${C}`} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: PT.fontHeading, fontSize: 38, fontWeight: 600,
            letterSpacing: '-1.2px', color: '#0A0A0A', lineHeight: 1,
          }}>{score}</div>
          <div style={{
            fontFamily: PT.fontMono, fontSize: 11, color: '#A3A3A3', marginTop: 4,
          }}>/ {max}</div>
        </div>
      </div>
      <div>
        <div style={{
          fontFamily: PT.fontUI, fontSize: 10.5, letterSpacing: 1.5,
          textTransform: 'uppercase', color: '#737373', fontWeight: 500, marginBottom: 4,
        }}>{copy.section_confidence}</div>
        <div style={{
          fontFamily: PT.fontHeading, fontSize: 24, fontWeight: 600,
          letterSpacing: '-0.7px', color: '#0A0A0A',
        }}>{label}</div>
        <div style={{
          fontFamily: PT.fontSans, fontSize: 13, lineHeight: '20px',
          color: '#525252', marginTop: 6, maxWidth: 220,
        }}>
          {lang === 'fr'
            ? "Le score est calculé sur les 4 risques fondamentaux et la qualité de la preuve disponible."
            : "Score is computed across the 4 fundamental risks and the quality of evidence available."}
        </div>
      </div>
    </div>
  );
}

// ----- Risk row card -----
function RiskRow({ risk, lang }) {
  const dots = 5;
  const colorByScore = risk.score >= 4 ? '#16A34A' : risk.score >= 3 ? '#2563EB' : '#D97706';
  const tagText = risk.score >= 4 ? (lang === 'fr' ? 'risque faible' : 'low risk')
                 : risk.score >= 3 ? (lang === 'fr' ? 'risque modéré' : 'moderate risk')
                 : (lang === 'fr' ? 'risque élevé' : 'high risk');
  return (
    <div style={{
      padding: '14px 16px',
      background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{
          fontFamily: PT.fontUI, fontWeight: 600, fontSize: 14, color: '#0A0A0A',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          {risk.name}
          <span style={{
            fontFamily: PT.fontMono, fontSize: 10.5, color: colorByScore,
            padding: '1px 7px', borderRadius: 4, background: `${colorByScore}14`,
            whiteSpace: 'nowrap',
          }}>{tagText}</span>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: dots }).map((_, i) => (
            <span key={i} style={{
              width: 14, height: 6, borderRadius: 2,
              background: i < risk.score ? colorByScore : '#E5E5E5',
            }} />
          ))}
        </div>
      </div>
      <div style={{
        fontFamily: PT.fontSans, fontSize: 13, fontStyle: 'italic',
        lineHeight: '20px', color: '#737373', marginBottom: 6,
      }}>{risk.question}</div>
      <div style={{
        fontFamily: PT.fontSans, fontSize: 14, lineHeight: '21px', color: '#262626',
      }}>{risk.ai_take}</div>
    </div>
  );
}

// ----- PRD doc header -----
function PRDHeader({ title, subtitle, copy, lang, version = 1, words = 0, streaming = false }) {
  return (
    <header style={{ marginBottom: 8 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap',
      }}>
        <Badge tone="brand">{copy.draft_label} · v{version}</Badge>
        <span style={{ fontFamily: PT.fontMono, fontSize: 11.5, color: '#A3A3A3' }}>
          {copy.generated_from} · {copy.auto_save} {streaming ? '· en cours' : '· 4s'}
        </span>
        {streaming && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: PT.fontMono, fontSize: 11.5, color: '#1D4ED8', marginLeft: 'auto',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 9999, background: '#2563EB',
              animation: 'pulse 1.4s ease-out infinite',
            }} />
            {copy.streaming_marker}
          </span>
        )}
      </div>
      <h1 style={{
        fontFamily: PT.fontHeading, fontWeight: 600, fontSize: 28,
        letterSpacing: '-1px', lineHeight: '34px', color: '#0A0A0A',
        marginTop: 0, marginRight: 0, marginBottom: 14, marginLeft: 0,
        textWrap: 'balance', wordBreak: 'normal', overflowWrap: 'break-word',
      }}>{title}{streaming && <StreamCaret />}</h1>
      <p style={{
        fontFamily: PT.fontSans, fontSize: 15.5, lineHeight: '24px',
        color: '#404040', marginTop: 0, marginBottom: 0,
        textWrap: 'pretty',
      }}>{subtitle}</p>
    </header>
  );
}

// ----- Empty placeholder line for sections not yet generated -----
function PRDPending({ label }) {
  return (
    <div style={{
      border: '1px dashed #D4D4D4', borderRadius: 10,
      padding: '16px 22px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: 9999,
        border: '1.5px solid #D4D4D4', flexShrink: 0,
      }} />
      <div style={{
        fontFamily: PT.fontUI, fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase',
        color: '#A3A3A3', fontWeight: 500,
      }}>{label}</div>
      <span style={{
        marginLeft: 'auto', fontFamily: PT.fontMono, fontSize: 11, color: '#D4D4D4',
      }}>à venir</span>
    </div>
  );
}

// ----- Source citation inline line -----
function PRDSource({ source, label }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '2px 8px', background: '#F5F5F5', borderRadius: 4,
      fontFamily: PT.fontMono, fontSize: 11.5, color: '#525252',
      marginTop: 8,
    }}>
      <SourceChip source={source} />
      {label && <span>{label}</span>}
    </div>
  );
}

Object.assign(window, {
  PRDTag, PRDBlock, ConfidenceGauge, RiskRow, PRDHeader, PRDPending, PRDSource,
});
