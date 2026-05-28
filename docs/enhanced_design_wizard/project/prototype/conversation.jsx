/* eslint-disable */
// Enhanced — conversation & ask_user cards
// Lives in the left pane of the wizard split-view.

const T = window.ENHANCED_TOKENS;

// ----- Streaming caret (visual only) -----
function StreamCaret({ color = '#2563EB' }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 14, background: color,
      marginLeft: 2, verticalAlign: 'middle', animation: 'caret 1s steps(2) infinite',
    }} />
  );
}

// ----- Enhanced "avatar" (sparkle in a circle) -----
function AIAvatar({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 9999,
      background: '#EFF6FF', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name="sparkles" size={Math.round(size * 0.55)} color="#2563EB" stroke={2} />
    </div>
  );
}

// ----- Convo bubbles -----
// AI message: regular Cantarell, no bubble — just neutral text
function AIMessage({ children, streaming = false, explain = null }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <AIAvatar size={28} />
      <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
        {explain && (
          <div style={{
            fontFamily: T.fontUI, fontSize: 10.5, letterSpacing: 1.4,
            textTransform: 'uppercase', color: '#A3A3A3', fontWeight: 500,
            marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#A3A3A3' }} />
            Pourquoi cette question · {explain}
          </div>
        )}
        <div style={{
          fontFamily: T.fontSans, fontSize: 15, lineHeight: '24px', color: '#262626',
        }}>
          {children}{streaming && <StreamCaret />}
        </div>
      </div>
    </div>
  );
}

// User input — typed message: regular weight, right-aligned, light surface
function UserMessage({ children, avatar = 'JM' }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexDirection: 'row-reverse' }}>
      <Avatar initials={avatar} size={28} />
      <div style={{
        maxWidth: '78%',
        background: '#F5F5F5', border: '1px solid #E5E5E5',
        borderRadius: 10, padding: '10px 14px',
        fontFamily: T.fontSans, fontSize: 14.5, lineHeight: '22px', color: '#171717',
      }}>{children}</div>
    </div>
  );
}

// Voice quote — italic Cantarell, the brand's signature
function VoiceQuote({ children, lead = "Tu as dit :" }) {
  return (
    <div style={{
      borderLeft: '2px solid #2563EB', paddingLeft: 14, marginTop: 4,
    }}>
      <div style={{
        fontFamily: T.fontUI, fontSize: 11, letterSpacing: 1.5, fontWeight: 500,
        textTransform: 'uppercase', color: '#1D4ED8', marginBottom: 4,
      }}>{lead}</div>
      <div style={{
        fontFamily: T.fontSans, fontStyle: 'italic', fontSize: 15, lineHeight: '24px',
        color: '#404040',
      }}>{children}</div>
    </div>
  );
}

// Reformulation block — italic body inside a brand wash card
function ReformulationCard({ children, lead = "Reformulation en First Use Case :" }) {
  return (
    <div style={{
      background: '#EFF6FF', border: '1px solid #BFDBFE',
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div style={{
        fontFamily: T.fontUI, fontSize: 11, letterSpacing: 1.5, fontWeight: 500,
        textTransform: 'uppercase', color: '#1D4ED8', marginBottom: 6,
      }}>{lead}</div>
      <div style={{
        fontFamily: T.fontSans, fontStyle: 'italic', fontSize: 15, lineHeight: '24px',
        color: '#1E3A8A',
      }}>{children}</div>
    </div>
  );
}

// ===================================================================
// ask_user cards — the LLM's only structured-question tool
// Variants:
//  - single (discret)
//  - multi (discret)
//  - scale (affirmé)
//  - confirmation (affirmé)
//  - freetext (discret)
// ===================================================================

// Shared lead — "this is an ask_user card" label
function AskUserLabel({ kind }) {
  const labels = {
    single: 'choix unique',
    multi: 'choix multiples',
    scale: 'échelle 1–5',
    confirmation: 'confirmation',
    freetext: 'texte libre',
  };
  return (
    <div style={{
      fontFamily: T.fontMono, fontSize: 10.5, color: '#A3A3A3',
      display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#2563EB' }} />
      ask_user · {labels[kind]}
    </div>
  );
}

// Single choice (DISCRET) — vertical list of ghost buttons
function AskSingle({ options, selected, onSelect, density = 'subtle' }) {
  const isAffirm = density === 'affirm';
  return (
    <div style={{ paddingLeft: 40 }}>
      <AskUserLabel kind="single" />
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        ...(isAffirm ? {
          background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 10, padding: 12,
        } : {}),
      }}>
        {options.map((opt, i) => {
          const active = selected === i;
          return (
            <button key={i} onClick={() => onSelect?.(i)} style={{
              textAlign: 'left', padding: '10px 14px',
              background: active ? '#171717' : '#FFFFFF',
              color: active ? '#FAFAFA' : '#262626',
              border: `1px solid ${active ? '#171717' : '#E5E5E5'}`,
              borderRadius: 10, cursor: 'pointer',
              fontFamily: T.fontUI, fontSize: 14, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'all 120ms ease-out',
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 9999, flexShrink: 0,
                border: `1.5px solid ${active ? '#FAFAFA' : '#D4D4D4'}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {active && <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#FAFAFA' }} />}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Multi choice (DISCRET) — checkboxes
function AskMulti({ options, selected = [], onToggle }) {
  return (
    <div style={{ paddingLeft: 40 }}>
      <AskUserLabel kind="multi" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map((opt, i) => {
          const active = selected.includes(i);
          return (
            <button key={i} onClick={() => onToggle?.(i)} style={{
              padding: '8px 12px',
              background: active ? '#171717' : '#FFFFFF',
              color: active ? '#FAFAFA' : '#262626',
              border: `1px solid ${active ? '#171717' : '#E5E5E5'}`,
              borderRadius: 8, cursor: 'pointer',
              fontFamily: T.fontUI, fontSize: 13, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'all 120ms ease-out',
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                border: `1.5px solid ${active ? '#FAFAFA' : '#D4D4D4'}`,
                background: active ? '#FAFAFA' : 'transparent',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {active && <Icon name="check" size={9} color="#171717" stroke={3} />}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Scale 1-5 (AFFIRMÉ) — the most visible ask_user card
function AskScale({ question, selected = null, onSelect, anchors = ['Très faible', 'Très élevée'] }) {
  return (
    <div style={{ paddingLeft: 40 }}>
      <AskUserLabel kind="scale" />
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 12,
        padding: '16px 18px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
      }}>
        <div style={{
          fontFamily: T.fontUI, fontSize: 14, fontWeight: 500, color: '#171717',
          marginBottom: 14,
        }}>{question}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 5].map(n => {
            const active = selected === n;
            return (
              <button key={n} onClick={() => onSelect?.(n)} style={{
                flex: 1, height: 44,
                background: active ? '#2563EB' : '#FFFFFF',
                color: active ? '#FFFFFF' : '#171717',
                border: `1px solid ${active ? '#2563EB' : '#E5E5E5'}`,
                borderRadius: 8, cursor: 'pointer',
                fontFamily: T.fontUI, fontWeight: 600, fontSize: 16,
                transition: 'all 120ms ease-out',
              }}>{n}</button>
            );
          })}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8,
          fontFamily: T.fontMono, fontSize: 11, color: '#A3A3A3',
        }}>
          <span>1 · {anchors[0]}</span>
          <span>5 · {anchors[1]}</span>
        </div>
      </div>
    </div>
  );
}

// Confirmation (AFFIRMÉ) — Oui / Reformule / Précise
function AskConfirm({ question, options, selected, onSelect }) {
  const tones = ['primary', 'outline', 'outline'];
  return (
    <div style={{ paddingLeft: 40 }}>
      <AskUserLabel kind="confirmation" />
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 12,
        padding: '16px 18px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
      }}>
        <div style={{
          fontFamily: T.fontUI, fontSize: 14, fontWeight: 500, color: '#171717',
          marginBottom: 14,
        }}>{question}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {options.map((opt, i) => {
            const active = selected === i;
            const variant = i === 0 ? (active ? 'primary' : 'outline') : 'outline';
            return (
              <Button key={i} variant={variant} size="md" onClick={() => onSelect?.(i)}
                leftIcon={i === 0 ? 'check' : i === 1 ? 'sparkles' : 'fileText'}>
                {opt}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Free text answer (replayable as a user message)
function AskFreetext({ placeholder, value, onChange, onSubmit }) {
  return (
    <div style={{ paddingLeft: 40 }}>
      <AskUserLabel kind="freetext" />
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 10,
        padding: 4, display: 'flex', alignItems: 'flex-end', gap: 4,
      }}>
        <textarea
          rows={2} placeholder={placeholder} value={value}
          onChange={e => onChange?.(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none', resize: 'none',
            padding: '10px 12px', fontFamily: T.fontSans, fontSize: 14, lineHeight: '20px',
            color: '#171717', background: 'transparent',
          }}
        />
        <button onClick={onSubmit} style={{
          height: 36, width: 36, borderRadius: 8, background: '#171717',
          color: '#FFFFFF', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          margin: 4,
        }}>
          <Icon name="arrowRight" size={16} color="#FFFFFF" stroke={2} />
        </button>
      </div>
    </div>
  );
}

// Conversation container with progressive reveal indicator
function ConversationStream({ children }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>{children}</div>
  );
}

// Small grouped data signal list — used in step 2 conversation
function DataSignalList({ items, copy }) {
  return (
    <div style={{ paddingLeft: 40, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((it, i) => {
        const tone = it.tag === 'evidence' ? { bg: '#DBEAFE', fg: '#1D4ED8', label: copy.tag_evidence } :
                     it.tag === 'assumption' ? { bg: '#FEF3C7', fg: '#92400E', label: copy.tag_assumption } :
                     { bg: '#F5F5F5', fg: '#525252', label: copy.tag_to_verify };
        return (
          <div key={i} style={{
            background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 10,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 500,
                padding: '2px 8px', borderRadius: 4,
                background: tone.bg, color: tone.fg,
              }}>[{tone.label}]</span>
              <span style={{
                fontFamily: T.fontMono, fontSize: 11, color: '#A3A3A3',
                whiteSpace: 'nowrap',
              }}>signal {i + 1} / {items.length}</span>
            </div>
            <div style={{ fontFamily: T.fontSans, fontSize: 14, color: '#171717', fontWeight: 500, marginBottom: 4 }}>
              {it.title}
            </div>
            <div style={{
              fontFamily: T.fontMono, fontSize: 12, color: '#525252', lineHeight: '18px',
            }}>{it.how}</div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  StreamCaret, AIAvatar, AIMessage, UserMessage, VoiceQuote, ReformulationCard,
  AskUserLabel, AskSingle, AskMulti, AskScale, AskConfirm, AskFreetext,
  ConversationStream, DataSignalList,
});
