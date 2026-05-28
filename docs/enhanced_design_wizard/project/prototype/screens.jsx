/* eslint-disable */
// Enhanced — full clickable prototype
// Landing → Wizard (4 steps, split-view) → Final draft

const S = window.ENHANCED_TOKENS;

// ============================================================
// LANDING — minimaliste, le produit EST la landing
// ============================================================
function Landing({ onLaunch, lang, onLangChange, copy }) {
  const c = copy.landing;
  const [text, setText] = React.useState('');
  const [focus, setFocus] = React.useState(false);

  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar — tiny */}
      <header style={{
        height: 64, padding: '0 32px',
        display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
      }}>
        <a href="#" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
        }}>
          <img src="assets/mark.svg" width="24" height="24" alt="" />
          <span style={{
            fontFamily: S.fontHeading, fontWeight: 600, fontSize: 16,
            letterSpacing: '-0.4px', color: '#0A0A0A',
          }}>enhanced.pm</span>
        </a>
        <div style={{ flex: 1 }} />
        <a href="#" style={{
          fontFamily: S.fontUI, fontSize: 13, fontWeight: 500, color: '#525252',
          textDecoration: 'none',
        }}>Drafts publics</a>
        <a href="#" style={{
          fontFamily: S.fontUI, fontSize: 13, fontWeight: 500, color: '#525252',
          textDecoration: 'none',
        }}>Manifeste</a>
        <LangToggle lang={lang} onChange={onLangChange} />
        <Button variant="outline" size="sm">{lang === 'fr' ? 'Se connecter' : 'Sign in'}</Button>
      </header>

      {/* Main canvas */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 32px 80px',
      }}>
        <div style={{ maxWidth: 740, margin: '0 auto', width: '100%' }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
            padding: '4px 10px 4px 6px',
            border: '1px solid #E5E5E5', borderRadius: 9999,
            fontFamily: S.fontUI, fontSize: 12, color: '#525252', fontWeight: 500,
          }}>
            <span style={{
              padding: '2px 8px', background: '#0A0A0A', color: '#FAFAFA',
              borderRadius: 9999, fontSize: 10.5, letterSpacing: 0.5,
            }}>V1</span>
            {lang === 'fr'
              ? "Pour les équipes qui buildent 10x plus vite — mais pas 10x mieux."
              : "For teams that ship 10x faster — but not 10x better."}
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: S.fontHeading, fontWeight: 600, fontSize: 56,
            letterSpacing: '-2px', lineHeight: '60px', color: '#0A0A0A',
            margin: '0 0 28px', whiteSpace: 'pre-line', textWrap: 'balance',
          }}>{c.title}</h1>

          {/* Composer — the product IS the landing */}
          <div style={{
            border: `1px solid ${focus ? '#0A0A0A' : '#D4D4D4'}`,
            borderRadius: 16, background: '#FFFFFF',
            transition: 'border-color 160ms',
            boxShadow: focus ? '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.06)' : 'none',
          }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              placeholder={c.placeholder}
              rows={6}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '20px 22px 12px', border: 'none', outline: 'none', resize: 'none',
                background: 'transparent',
                fontFamily: S.fontSans, fontSize: 18, lineHeight: '28px', color: '#0A0A0A',
              }}
            />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px 14px',
              borderTop: '1px solid #F5F5F5',
            }}>
              <button style={{
                height: 36, padding: '0 12px', borderRadius: 9999,
                background: '#FFFFFF', border: '1px solid #E5E5E5', color: '#525252',
                fontFamily: S.fontUI, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <Icon name="mic" size={14} stroke={1.75} />
                {c.cta_caret}
              </button>
              <span style={{
                fontFamily: S.fontMono, fontSize: 11.5, color: '#A3A3A3',
              }}>{c.hint}</span>
              <div style={{ flex: 1 }} />
              <Button variant="primary" size="lg" rightIcon="arrowRight" onClick={onLaunch}>
                {c.cta}
              </Button>
            </div>
          </div>

          {/* Two-column small print: what it is / what it isn't */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 56,
            paddingTop: 32, borderTop: '1px solid #E5E5E5',
          }}>
            <div>
              <div style={{
                fontFamily: S.fontUI, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
                color: '#525252', fontWeight: 500, marginBottom: 8,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <Icon name="check" size={12} color="#16A34A" stroke={2.5} />
                {c.what_it_is}
              </div>
              <p style={{
                fontFamily: S.fontSans, fontSize: 14, lineHeight: '21px', color: '#525252', margin: 0,
              }}>{c.what_it_is_body}</p>
            </div>
            <div>
              <div style={{
                fontFamily: S.fontUI, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
                color: '#525252', fontWeight: 500, marginBottom: 8,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <Icon name="x" size={12} color="#DC2626" stroke={2.5} />
                {c.what_it_isnt}
              </div>
              <p style={{
                fontFamily: S.fontSans, fontSize: 14, lineHeight: '21px', color: '#525252', margin: 0,
              }}>{c.what_it_isnt_body}</p>
            </div>
          </div>

          {/* Public drafts strip */}
          <div style={{ marginTop: 40 }}>
            <div style={{
              fontFamily: S.fontUI, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
              color: '#A3A3A3', fontWeight: 500, marginBottom: 12,
            }}>{c.examples_label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { title: 'Recherches sauvegardées pour les power users', meta: 'Acme · 12 risques scorés · 412 mots' },
                { title: 'Onboarding remanié pour B2C self-serve', meta: 'Numa · 3 hypothèses identifiées comme spéculatives' },
                { title: 'Notifications push tier_pro', meta: 'Pilot · score de confiance 38 / 100 — recommandé Test first' },
              ].map((it, i) => (
                <a key={i} href="#" style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  border: '1px solid #E5E5E5', borderRadius: 10, textDecoration: 'none',
                  background: '#FFFFFF',
                }}>
                  <Icon name="fileText" size={14} color="#A3A3A3" />
                  <span style={{
                    fontFamily: S.fontSans, fontSize: 14, color: '#0A0A0A', fontWeight: 400,
                  }}>{it.title}</span>
                  <span style={{
                    fontFamily: S.fontMono, fontSize: 11, color: '#A3A3A3', marginLeft: 'auto',
                  }}>{it.meta}</span>
                  <Icon name="arrowRight" size={12} color="#A3A3A3" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer style={{
        padding: '24px 32px', borderTop: '1px solid #F5F5F5',
        fontFamily: S.fontMono, fontSize: 11, color: '#A3A3A3', textAlign: 'center',
      }}>{c.footer}</footer>
    </div>
  );
}

// ============================================================
// LANG TOGGLE (FR / EN segmented)
// ============================================================
function LangToggle({ lang, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', padding: 3, background: '#F5F5F5', borderRadius: 8,
    }}>
      {['fr', 'en'].map(L => (
        <button key={L} onClick={() => onChange(L)} style={{
          padding: '4px 10px', borderRadius: 6,
          background: lang === L ? '#FFFFFF' : 'transparent',
          color: lang === L ? '#0A0A0A' : '#737373',
          border: 'none', cursor: 'pointer',
          fontFamily: S.fontMono, fontSize: 11, fontWeight: 500,
          letterSpacing: 0.5, textTransform: 'uppercase',
          boxShadow: lang === L ? '0 1px 2px 0 rgba(0,0,0,0.05)' : 'none',
        }}>{L}</button>
      ))}
    </div>
  );
}

// ============================================================
// WIZARD TOPBAR — stepper + actions
// ============================================================
function WizardTopbar({ step, onStepChange, onExit, lang, onLangChange, copy, totalSteps = 4 }) {
  const c = copy.wizard;
  return (
    <div style={{
      height: 60, borderBottom: '1px solid #E5E5E5', background: '#FFFFFF',
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 18, flexShrink: 0,
    }}>
      <button onClick={onExit} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'transparent', border: 'none', cursor: 'pointer',
        padding: '6px 8px', borderRadius: 6,
      }}>
        <img src="assets/mark.svg" width="22" height="22" alt="" />
        <span style={{
          fontFamily: S.fontHeading, fontWeight: 600, fontSize: 14,
          letterSpacing: '-0.3px', color: '#0A0A0A',
        }}>enhanced.pm</span>
      </button>

      <div style={{ width: 1, height: 28, background: '#E5E5E5', margin: '0 4px' }} />

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {c.step_labels.map((label, i) => {
          const active = step === i;
          const done = step > i;
          return (
            <React.Fragment key={i}>
              <button onClick={() => onStepChange(i)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 6,
                background: active ? '#F5F5F5' : 'transparent',
                border: 'none', cursor: 'pointer',
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 9999,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? '#0A0A0A' : done ? '#2563EB' : '#FFFFFF',
                  color: (active || done) ? '#FFFFFF' : '#A3A3A3',
                  border: active ? 'none' : done ? 'none' : '1.5px solid #D4D4D4',
                  fontFamily: S.fontMono, fontSize: 10.5, fontWeight: 600,
                }}>
                  {done ? <Icon name="check" size={11} stroke={3} /> : i + 1}
                </span>
                <span style={{
                  fontFamily: S.fontUI, fontSize: 13, fontWeight: 500,
                  color: active ? '#0A0A0A' : done ? '#525252' : '#A3A3A3',
                  whiteSpace: 'nowrap',
                }}>{label}</span>
              </button>
              {i < totalSteps - 1 && (
                <div style={{
                  width: 24, height: 1, background: done ? '#2563EB' : '#E5E5E5', margin: '0 2px',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      <span style={{ fontFamily: S.fontMono, fontSize: 11.5, color: '#A3A3A3', whiteSpace: 'nowrap' }}>
        {c.autosaved}
      </span>
      <LangToggle lang={lang} onChange={onLangChange} />
      <Button variant="outline" size="sm" leftIcon="share">{lang === 'fr' ? 'Partager' : 'Share'}</Button>
    </div>
  );
}

// ============================================================
// WIZARD SHELL — split-view container
// ============================================================
function WizardSplit({ left, right, ratio = '45/55' }) {
  const [leftPct, rightPct] = ratio.split('/').map(Number);
  return (
    <div style={{
      flex: 1, display: 'grid',
      gridTemplateColumns: `${leftPct}fr ${rightPct}fr`,
      overflow: 'hidden', background: '#FAFAFA',
    }}>
      {/* LEFT — conversation */}
      <div style={{
        background: '#FFFFFF', borderRight: '1px solid #E5E5E5',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>{left}</div>

      {/* RIGHT — PRD doc */}
      <div style={{
        background: '#FAFAFA',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>{right}</div>
    </div>
  );
}

// ============================================================
// CONVERSATION PANE
// ============================================================
function ConvoPane({ children, step, totalSteps = 4, copy, onPrev, onNext, lastStep = false }) {
  const c = copy.wizard;
  return (
    <>
      {/* Pane header */}
      <div style={{
        padding: '18px 28px 14px', borderBottom: '1px solid #F5F5F5',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <span style={{
          fontFamily: S.fontMono, fontSize: 11, color: '#A3A3A3', whiteSpace: 'nowrap',
        }}>{c.progress} {step + 1} / {totalSteps}</span>
        <div style={{
          fontFamily: S.fontUI, fontSize: 13, fontWeight: 600, color: '#0A0A0A',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{c.step_labels[step]}</div>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', background: '#EFF6FF', borderRadius: 4,
          fontFamily: S.fontMono, fontSize: 11, color: '#1D4ED8', whiteSpace: 'nowrap',
        }}>
          <Icon name="sparkles" size={10} stroke={2} />
          conversation guidée
        </div>
      </div>

      {/* Scrollable convo body */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '24px 28px',
      }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <ConversationStream>{children}</ConversationStream>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{
        padding: '14px 28px', borderTop: '1px solid #F5F5F5', background: '#FFFFFF',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Button variant="ghost" size="md" leftIcon="arrowRight"
          style={{ transform: 'scaleX(-1)' }} onClick={onPrev} disabled={step === 0}>
          <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>{c.back}</span>
        </Button>
        <div style={{ flex: 1 }} />
        <span style={{
          fontFamily: S.fontMono, fontSize: 11, color: '#A3A3A3',
        }}>{c.autosaved}</span>
        <Button variant="primary" size="md" rightIcon="arrowRight" onClick={onNext}>
          {lastStep ? c.finish : c.next}
        </Button>
      </div>
    </>
  );
}

// ============================================================
// PRD PANE (right)
// ============================================================
function PRDPane({ children, copy, lang, words = 0, version = 1 }) {
  return (
    <>
      {/* Pane header */}
      <div style={{
        padding: '18px 32px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#FAFAFA',
        borderBottom: '1px solid #E5E5E5', flexShrink: 0,
      }}>
        <Icon name="fileText" size={14} color="#737373" />
        <div style={{
          fontFamily: S.fontUI, fontSize: 13, fontWeight: 600, color: '#0A0A0A',
          whiteSpace: 'nowrap',
        }}>{lang === 'fr' ? 'Draft PRD · en construction' : 'PRD draft · being built'}</div>
        <div style={{ flex: 1 }} />
        <span style={{
          fontFamily: S.fontMono, fontSize: 11, color: '#A3A3A3', whiteSpace: 'nowrap',
        }}>{words} {lang === 'fr' ? 'mots' : 'words'} · v{version}</span>
        <IconButton icon="more" size={28} />
      </div>

      <div style={{
        flex: 1, overflow: 'auto', padding: '32px 0 64px',
      }}>
        <article style={{
          maxWidth: 640, margin: '0 auto', padding: '0 32px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>{children}</article>
      </div>
    </>
  );
}

// ============================================================
// STEP 1 — Cadrage du problème
// ============================================================
function Step1({ copy, lang, refineKey, setRefineKey }) {
  const c = copy.step1;
  const prdC = copy.prd;
  const [confirmSel, setConfirmSel] = React.useState(0);
  const [okrSel, setOkrSel] = React.useState(1);

  return (
    <WizardSplit
      left={
        <ConvoPaneWrapper step={0} copy={copy}>
          <AIMessage>{c.ai_intro}</AIMessage>
          <VoiceQuote lead={c.ai_voicequote_lead}>{c.voicequote}</VoiceQuote>
          <ReformulationCard lead={c.ai_reformulation_lead}>{c.reformulation}</ReformulationCard>
          <AIMessage>{c.ai_confirm_q}</AIMessage>
          <AskConfirm
            question={c.ai_confirm_q}
            options={c.confirm_options}
            selected={confirmSel}
            onSelect={setConfirmSel}
          />
          <AIMessage explain={lang === 'fr' ? 'rattacher à une priorité' : 'tie to a priority'}>
            {c.ai_after_confirm}
          </AIMessage>
          <AskSingle
            options={c.okr_options}
            selected={okrSel}
            onSelect={setOkrSel}
          />
        </ConvoPaneWrapper>
      }
      right={
        <PRDPane copy={copy} lang={lang} words={84} version={1}>
          <PRDHeader
            title={prdC.title}
            subtitle={prdC.subtitle}
            copy={prdC} lang={lang}
            words={84} version={1}
          />
          <PRDBlock
            label={prdC.section_problem}
            copy={prdC}
            refineOpen={refineKey === 'problem'}
            onRefineOpen={() => setRefineKey('problem')}
            onRefineClose={() => setRefineKey(null)}
          >
            <em style={{ fontStyle: 'italic', color: '#404040' }}>
              {c.reformulation}
            </em>
          </PRDBlock>
          <PRDBlock
            label={prdC.section_assumed}
            copy={prdC}
            refineOpen={refineKey === 'assumed'}
            onRefineOpen={() => setRefineKey('assumed')}
            onRefineClose={() => setRefineKey(null)}
          >
            <PRDTag kind="assumption" copy={prdC} />
            {lang === 'fr'
              ? "Que les power users perdent effectivement leurs filtres entre deux sessions. "
              : "That power users actually lose their filters between sessions. "}
            <PRDTag kind="assumption" copy={prdC} />
            {lang === 'fr'
              ? "Que cette perte représente une friction prioritaire pour la cible — pas un irritant secondaire."
              : "That this loss represents a top-priority friction for the target — not a side annoyance."}
          </PRDBlock>
          <PRDPending label={prdC.section_data} />
          <PRDPending label={prdC.section_risks} />
          <PRDPending label={prdC.section_next} />
        </PRDPane>
      }
    />
  );
}

// ============================================================
// STEP 2 — Validation par la data
// ============================================================
function Step2({ copy, lang, refineKey, setRefineKey }) {
  const c = copy.step2;
  const prdC = copy.prd;
  const [tools, setTools] = React.useState([1]);

  return (
    <WizardSplit
      left={
        <ConvoPaneWrapper step={1} copy={copy}>
          <AIMessage>{c.ai_intro}</AIMessage>
          <AIMessage>{c.ai_data_intro}</AIMessage>
          <DataSignalList items={c.data_signals} copy={prdC} />
          <AIMessage>{c.ai_followup}</AIMessage>
          <AskMulti
            options={c.tools_options}
            selected={tools}
            onToggle={i => setTools(tools.includes(i) ? tools.filter(x => x !== i) : [...tools, i])}
          />
          <AIMessage>{c.ai_after_tools}</AIMessage>
          <UserMessage>{c.user_answer}</UserMessage>
          <AIMessage explain={lang === 'fr' ? "j'ai tagué chaque assertion selon son niveau de preuve" : 'I tagged each claim by proof level'}>
            {c.ai_after_answer}
          </AIMessage>
        </ConvoPaneWrapper>
      }
      right={
        <PRDPane copy={copy} lang={lang} words={186} version={2}>
          <PRDHeader
            title={prdC.title}
            subtitle={prdC.subtitle}
            copy={prdC} lang={lang}
            words={186} version={2}
          />
          <PRDBlock label={prdC.section_problem} copy={prdC}
            refineOpen={refineKey === 'problem'} onRefineOpen={() => setRefineKey('problem')} onRefineClose={() => setRefineKey(null)}>
            <em style={{ fontStyle: 'italic', color: '#404040' }}>
              {copy.step1.reformulation}
            </em>
          </PRDBlock>

          {/* Data context — grows now */}
          <PRDBlock label={prdC.section_data} copy={prdC}
            refineOpen={refineKey === 'data'} onRefineOpen={() => setRefineKey('data')} onRefineClose={() => setRefineKey(null)}>
            <p style={{ margin: '0 0 12px' }}>
              <PRDTag kind="evidence" copy={prdC} />
              {lang === 'fr'
                ? "Power users (tier_pro) ouvrent la vue filtrée Insights "
                : "Power users (tier_pro) open the filtered Insights view "}
              <strong>4.2x {lang === 'fr' ? 'par session' : 'per session'}</strong>
              {lang === 'fr' ? " en moyenne sur 90 jours." : " on average over a 90-day window."}
              <PRDSource source="mixpanel" label="session_filter_views · 90d · tier_pro" />
            </p>
            <p style={{ margin: '0 0 12px' }}>
              <PRDTag kind="toverify" copy={prdC} />
              {lang === 'fr'
                ? "Taux de re-saisie de la même combinaison de filtres en < 90 s. À mesurer avant build via une property "
                : "Same-combination re-entry rate within < 90s. To measure pre-build via a "}
              <code style={{ fontFamily: S.fontMono, fontSize: 13, padding: '1px 5px', background: '#F5F5F5', borderRadius: 3 }}>filter_combination_hash</code>
              {lang === 'fr' ? " côté event." : " event property."}
            </p>
            <p style={{ margin: 0 }}>
              <PRDTag kind="evidence" copy={prdC} />
              {lang === 'fr'
                ? "Contradiction faible : "
                : "Weak contradiction: "}
              <strong>{lang === 'fr' ? "0 ticket support" : "0 support tickets"}</strong>
              {lang === 'fr'
                ? " mentionnant « filtre perdu », « filtre reset » ou termes proches sur 1 847 tickets / 90 j. Soit les users s'y sont habitués, soit ce n'est pas la friction supposée."
                : " mention 'lost filter', 'filter reset' or related terms across 1,847 tickets / 90d. Either users have learned to live with it, or it's not the friction you think."}
              <PRDSource source="support" label="zendesk · 90d · all tiers" />
            </p>
          </PRDBlock>

          <PRDBlock label={prdC.section_assumed} copy={prdC} variant="muted"
            refineOpen={refineKey === 'assumed'} onRefineOpen={() => setRefineKey('assumed')} onRefineClose={() => setRefineKey(null)}>
            <PRDTag kind="assumption" copy={prdC} />
            {lang === 'fr'
              ? "Que la perte de filtres est une friction prioritaire — pas un irritant secondaire que les users contournent."
              : "That filter loss is a top-priority friction — not a side annoyance users route around."}
          </PRDBlock>
          <PRDPending label={prdC.section_risks} />
          <PRDPending label={prdC.section_recommendation} />
        </PRDPane>
      }
    />
  );
}

// ============================================================
// STEP 3 — Challenge des risques
// ============================================================
function Step3({ copy, lang, refineKey, setRefineKey }) {
  const c = copy.step3;
  const prdC = copy.prd;
  const [scaleSel, setScaleSel] = React.useState(3);
  const [recoSel, setRecoSel] = React.useState(1);

  return (
    <WizardSplit
      left={
        <ConvoPaneWrapper step={2} copy={copy}>
          <AIMessage>{c.ai_intro}</AIMessage>

          {/* For each risk, AI take + scale ask */}
          {c.risks.slice(0, 1).map(risk => (
            <React.Fragment key={risk.key}>
              <AIMessage explain={risk.name + ' · ' + (lang === 'fr' ? 'estime ta conviction' : 'rate your conviction')}>
                <strong>{risk.name} — {risk.question}</strong><br />
                {risk.ai_take}
              </AIMessage>
              <AskScale
                question={lang === 'fr' ? "Ta conviction sur ce risque ?" : "Your conviction on this risk?"}
                selected={scaleSel}
                onSelect={setScaleSel}
                anchors={lang === 'fr' ? ['Très inquiet', 'Très confiant'] : ['Very worried', 'Very confident']}
              />
            </React.Fragment>
          ))}

          <AIMessage>{c.ai_push_back_hint}</AIMessage>

          {/* Skip to overall reco */}
          <AIMessage>{c.ai_overall}</AIMessage>
          <AIMessage>{c.ai_recommendation_lead}</AIMessage>
          <ReformulationCard lead={lang === 'fr' ? 'Recommandation' : 'Recommendation'}>
            {c.recommendation}
          </ReformulationCard>
          <AskConfirm
            question={lang === 'fr' ? "Tu veux suivre cette reco ?" : "Going with this recommendation?"}
            options={c.reco_options}
            selected={recoSel}
            onSelect={setRecoSel}
          />
        </ConvoPaneWrapper>
      }
      right={
        <PRDPane copy={copy} lang={lang} words={348} version={3}>
          <PRDHeader
            title={prdC.title}
            subtitle={prdC.subtitle}
            copy={prdC} lang={lang}
            words={348} version={3}
          />

          {/* Confidence gauge — the visual pivot */}
          <PRDBlock label={prdC.section_confidence} copy={prdC} variant="muted"
            refineOpen={refineKey === 'confidence'} onRefineOpen={() => setRefineKey('confidence')} onRefineClose={() => setRefineKey(null)}>
            <ConfidenceGauge score={64} max={100} copy={prdC} lang={lang} />
          </PRDBlock>

          {/* 4-risk breakdown */}
          <PRDBlock label={prdC.section_risks} copy={prdC}
            refineOpen={refineKey === 'risks'} onRefineOpen={() => setRefineKey('risks')} onRefineClose={() => setRefineKey(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.risks.map(r => <RiskRow key={r.key} risk={r} lang={lang} />)}
            </div>
          </PRDBlock>

          {/* Recommendation */}
          <PRDBlock label={prdC.section_recommendation} copy={prdC} variant="brand"
            refineOpen={refineKey === 'reco'} onRefineOpen={() => setRefineKey('reco')} onRefineClose={() => setRefineKey(null)}>
            <div style={{
              fontFamily: S.fontHeading, fontWeight: 600, fontSize: 18,
              letterSpacing: '-0.3px', color: '#1E3A8A', marginBottom: 8,
            }}>
              {lang === 'fr' ? 'Tester d\'abord — avant de builder.' : 'Test first — before building.'}
            </div>
            {c.recommendation}
          </PRDBlock>

          <PRDPending label={prdC.section_kill} />
          <PRDPending label={prdC.section_next} />
        </PRDPane>
      }
    />
  );
}

// ============================================================
// STEP 4 — Draft finalisé
// ============================================================
function Step4({ copy, lang, refineKey, setRefineKey }) {
  const c = copy.step4;
  const c3 = copy.step3;
  const prdC = copy.prd;
  const [reviewSel, setReviewSel] = React.useState(null);

  return (
    <WizardSplit
      left={
        <ConvoPaneWrapper step={3} copy={copy} lastStep>
          <AIMessage>{c.ai_intro}</AIMessage>
          <AIMessage>{c.ai_review_q}</AIMessage>
          <AskConfirm
            question={c.ai_review_q}
            options={c.review_options}
            selected={reviewSel}
            onSelect={setReviewSel}
          />
          <AIMessage explain={lang === 'fr' ? 'partage & export' : 'share & export'}>{c.ai_share_help}</AIMessage>
          {reviewSel === 0 && (
            <div style={{ paddingLeft: 40, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                padding: 14, background: '#EFF6FF', border: '1px solid #BFDBFE',
                borderRadius: 10,
              }}>
                <div style={{
                  fontFamily: S.fontUI, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
                  color: '#1D4ED8', fontWeight: 500, marginBottom: 8,
                }}>
                  {lang === 'fr' ? 'Lien public généré' : 'Public link generated'}
                </div>
                <div style={{
                  fontFamily: S.fontMono, fontSize: 13, color: '#1E3A8A',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Icon name="link" size={13} color="#1D4ED8" stroke={1.75} />
                  enhanced.pm/p/saved-searches-power-users
                  <IconButton icon="link" size={24} />
                </div>
              </div>
              <Button variant="outline" size="md" leftIcon="share">
                {lang === 'fr' ? 'Télécharger le PDF' : 'Download PDF'}
              </Button>
            </div>
          )}
        </ConvoPaneWrapper>
      }
      right={
        <PRDPane copy={copy} lang={lang} words={524} version={4}>
          <PRDHeader
            title={prdC.title}
            subtitle={prdC.subtitle}
            copy={prdC} lang={lang}
            words={524} version={4}
          />

          <PRDBlock label={prdC.section_problem} copy={prdC}
            refineOpen={refineKey === 'problem'} onRefineOpen={() => setRefineKey('problem')} onRefineClose={() => setRefineKey(null)}>
            <em style={{ fontStyle: 'italic', color: '#404040' }}>{copy.step1.reformulation}</em>
          </PRDBlock>

          <PRDBlock label={prdC.section_data} copy={prdC}
            refineOpen={refineKey === 'data'} onRefineOpen={() => setRefineKey('data')} onRefineClose={() => setRefineKey(null)}>
            <p style={{ margin: '0 0 10px' }}>
              <PRDTag kind="evidence" copy={prdC} />
              {lang === 'fr' ? "Power users " : "Power users "}<strong>4.2x/{lang === 'fr' ? 'session' : 'session'}</strong>{lang === 'fr' ? " sur la vue filtrée — 90j, segment tier_pro." : " on the filtered view — 90d, tier_pro segment."}
            </p>
            <p style={{ margin: '0 0 10px' }}>
              <PRDTag kind="toverify" copy={prdC} />
              {lang === 'fr' ? "Taux de re-saisie de la même combinaison < 90s — à instrumenter." : "Same-combination re-entry rate < 90s — to instrument."}
            </p>
            <p style={{ margin: 0 }}>
              <PRDTag kind="evidence" copy={prdC} />
              {lang === 'fr' ? "0 ticket support " : "0 support tickets "}{lang === 'fr' ? "mentionnant « filtre perdu » sur 1 847 tickets / 90j." : "mention 'lost filter' across 1,847 / 90d."}
            </p>
          </PRDBlock>

          <PRDBlock label={prdC.section_confidence} copy={prdC} variant="muted">
            <ConfidenceGauge score={64} max={100} copy={prdC} lang={lang} />
          </PRDBlock>

          <PRDBlock label={prdC.section_risks} copy={prdC}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c3.risks.map(r => <RiskRow key={r.key} risk={r} lang={lang} />)}
            </div>
          </PRDBlock>

          <PRDBlock label={prdC.section_recommendation} copy={prdC} variant="brand"
            refineOpen={refineKey === 'reco'} onRefineOpen={() => setRefineKey('reco')} onRefineClose={() => setRefineKey(null)}>
            <div style={{
              fontFamily: S.fontHeading, fontWeight: 600, fontSize: 18,
              letterSpacing: '-0.3px', color: '#1E3A8A', marginBottom: 8,
            }}>
              {lang === 'fr' ? 'Tester d\'abord — avant de builder.' : 'Test first — before building.'}
            </div>
            {c3.recommendation}
          </PRDBlock>

          <PRDBlock label={prdC.section_success} copy={prdC}
            refineOpen={refineKey === 'success'} onRefineOpen={() => setRefineKey('success')} onRefineClose={() => setRefineKey(null)}>
            <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>{lang === 'fr' ? "Adoption : ≥ 40 % des tier_pro ouvrent un saved view dans les 14 jours après ship." : "Adoption: ≥ 40% of tier_pro open a saved view within 14 days of ship."}</li>
              <li>{lang === 'fr' ? "Engagement : usage moyen ≥ 2x/semaine pendant 4 semaines consécutives." : "Engagement: avg usage ≥ 2x/week over 4 consecutive weeks."}</li>
              <li>{lang === 'fr' ? "Conviction qualitative : ≥ 3 utilisateurs interviewés citent la feature comme top-3 friction résolue." : "Qualitative: ≥ 3 interviewees cite the feature as a top-3 friction resolved."}</li>
            </ul>
          </PRDBlock>

          <PRDBlock label={prdC.section_kill} copy={prdC} variant="destructive"
            refineOpen={refineKey === 'kill'} onRefineOpen={() => setRefineKey('kill')} onRefineClose={() => setRefineKey(null)}>
            <p style={{ margin: '0 0 8px' }}>
              {lang === 'fr'
                ? "On abandonne si, à 30 jours post-ship :"
                : "We kill it if, 30 days post-ship:"}
            </p>
            <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>{lang === 'fr' ? "< 15 % des tier_pro ont créé au moins un saved view." : "< 15% of tier_pro have created at least one saved view."}</li>
              <li>{lang === 'fr' ? "OU < 1 verbatim positif en review interview (n=8)." : "OR < 1 positive verbatim in review interviews (n=8)."}</li>
              <li>{lang === 'fr' ? "Date de revue : 15 mai 2026." : "Review date: May 15, 2026."}</li>
            </ul>
          </PRDBlock>

          <PRDBlock label={prdC.section_next} copy={prdC}
            refineOpen={refineKey === 'next'} onRefineOpen={() => setRefineKey('next')} onRefineClose={() => setRefineKey(null)}>
            <ol style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>{lang === 'fr' ? "Briefer Théo sur l'historique ENG-2104 — comprendre pourquoi Won't do en 2024." : "Brief Théo on ENG-2104 history — understand why Won't do in 2024."}</li>
              <li>{lang === 'fr' ? "Ship auto-remember last filter derrière un flag tier_pro (2j eng)." : "Ship auto-remember last filter behind a tier_pro flag (2d eng)."}</li>
              <li>{lang === 'fr' ? "Mesurer 2 semaines : retention sur la vue filtrée, verbatims." : "Measure for 2 weeks: filtered-view retention, verbatims."}</li>
              <li>{lang === 'fr' ? "Décision Go / No-Go basée sur les kill criteria ci-dessus." : "Go / No-Go decision based on the kill criteria above."}</li>
            </ol>
          </PRDBlock>

          {/* Final action row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16,
            borderTop: '1px solid #E5E5E5', marginTop: 8,
          }}>
            <span style={{ fontFamily: S.fontMono, fontSize: 11, color: '#A3A3A3' }}>
              524 {lang === 'fr' ? 'mots · 7 sections · 12 assertions taggées' : 'words · 7 sections · 12 tagged claims'}
            </span>
            <div style={{ flex: 1 }} />
            <Button variant="outline" size="sm" leftIcon="share">
              {lang === 'fr' ? 'Partager publiquement' : 'Share publicly'}
            </Button>
            <Button variant="primary" size="sm" leftIcon="fileText">
              {lang === 'fr' ? 'Exporter en PDF' : 'Export PDF'}
            </Button>
          </div>
        </PRDPane>
      }
    />
  );
}

// Small wrapper to pass step automatically — convoluted to avoid prop drilling
function ConvoPaneWrapper({ children, step, copy, lastStep }) {
  // Pull goto/lang/etc from context
  const ctx = React.useContext(WizardCtx);
  return (
    <ConvoPane
      step={step} copy={copy}
      onPrev={() => ctx.setStep(Math.max(0, step - 1))}
      onNext={() => ctx.setStep(Math.min(3, step + 1))}
      lastStep={lastStep}
    >{children}</ConvoPane>
  );
}

const WizardCtx = React.createContext({});

// ============================================================
// ROOT
// ============================================================
function App() {
  const [route, setRoute] = React.useState('landing');
  const [step, setStep] = React.useState(0);
  const [lang, setLang] = React.useState('fr');
  const [refineKey, setRefineKey] = React.useState(null);

  const copy = window.ENHANCED_COPY[lang];

  if (route === 'landing') {
    return <Landing onLaunch={() => setRoute('wizard')} lang={lang} onLangChange={setLang} copy={copy} />;
  }

  // Wizard route
  return (
    <WizardCtx.Provider value={{ setStep, step, lang, setRefineKey }}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
        <WizardTopbar
          step={step} onStepChange={setStep}
          onExit={() => setRoute('landing')}
          lang={lang} onLangChange={setLang}
          copy={copy}
        />
        {step === 0 && <Step1 copy={copy} lang={lang} refineKey={refineKey} setRefineKey={setRefineKey} />}
        {step === 1 && <Step2 copy={copy} lang={lang} refineKey={refineKey} setRefineKey={setRefineKey} />}
        {step === 2 && <Step3 copy={copy} lang={lang} refineKey={refineKey} setRefineKey={setRefineKey} />}
        {step === 3 && <Step4 copy={copy} lang={lang} refineKey={refineKey} setRefineKey={setRefineKey} />}
      </div>
    </WizardCtx.Provider>
  );
}

Object.assign(window, { App, Landing, WizardTopbar });
