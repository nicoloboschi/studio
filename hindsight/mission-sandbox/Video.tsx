import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { DesignProvider, useDesign } from "../../src/lib/design";
import { Appear, Bg, Chip, CoverageMeter, FactCard, GoldenRow, SceneTitle, TerminalWindow, Typed } from "../../src/lib/components";
import { hindsight } from "../design";
import data from "./data.json";

const D = data as unknown as {
  documents: { id: string; date: string; text: string }[];
  golden: string[];
  baseline: { mission: string; facts: { text: string }[]; coverage: { covered: number[]; total: number } };
  refined: { mission: string; facts: { text: string }[]; coverage: { covered: number[]; total: number } };
};

// The extractor labels the speaker "the user"; the golden set names her "Maya".
// Normalize to "Maya" so the two sides of the screen read consistently.
const mayaize = (s: string) =>
  s
    .replace(/\bthe user's\b/gi, "Maya's")
    .replace(/\bthe user\b/gi, "Maya")
    .replace(/\bUser\b/g, "Maya")
    .replace(/\btheir\b/gi, "her")
    .replace(/\bthem\b/gi, "her")
    .replace(/\bthey\b/gi, "she");

const head = (s: string) => mayaize(s.split(" | ")[0]);
const baseFacts = D.baseline.facts.map((f) => head(f.text));
const refFacts = D.refined.facts.map((f) => head(f.text));
const baseCovered = new Set(D.baseline.coverage.covered);
const refCovered = new Set(D.refined.coverage.covered);

const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 76, color }) => {
  const t = useDesign();
  return <div style={{ fontSize: size, fontWeight: 800, color: color ?? t.text, lineHeight: 1.1 }}>{children}</div>;
};

const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useDesign();
  return <div style={{ fontSize: 36, color: t.dim, lineHeight: 1.4, maxWidth: 1300 }}>{children}</div>;
};

// ============ 1. Hook — the problem ============
const Hook: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 130px", gap: 26 }}>
        <Appear delay={2}>
          <Big size={96}>AI agents forget.</Big>
        </Appear>
        <Appear delay={26}>
          <Sub>Every new chat, your assistant starts from zero — unless it has long-term memory.</Sub>
        </Appear>
        <Appear delay={70}>
          <div style={{ marginTop: 20, fontSize: 38, color: t.text }}>
            <span style={{ color: t.accent }}>Hindsight</span> gives agents memory: it reads each conversation and
            <span style={{ color: t.accent2 }}> extracts durable facts</span> to remember.
          </div>
        </Appear>
      </AbsoluteFill>
    </Bg>
  );
};

// ============ 2. The catch — retain mission steers extraction ============
const Catch: React.FC = () => {
  const t = useDesign();
  const frame = useCurrentFrame();
  const rows = [
    { text: "Maya adopted a dog named Pixel", keep: false },
    { text: "Maya is a product designer at Lumen Labs", keep: true },
    { text: "Maya is planning a trip to Lisbon", keep: false },
  ];
  return (
    <Bg>
      <div style={{ padding: "70px 130px" }}>
        <SceneTitle kicker="the catch" title="What it remembers is steered by a “retain mission”" />
        <Appear delay={16}>
          <Sub>
            A <b style={{ color: t.text }}>retain mission</b> is just plain-English instructions telling the extractor
            what matters. Make it too narrow…
          </Sub>
        </Appear>
        <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 60 }}>
          <Appear delay={36}>
            <div style={{ background: t.panel, border: `1px solid ${t.panelBorder}`, borderRadius: 14, padding: "22px 24px", width: 520 }}>
              <div style={{ color: t.faint, fontFamily: t.mono, fontSize: 22, marginBottom: 8 }}>retain mission</div>
              <div style={{ fontSize: 28, color: t.text, lineHeight: 1.4 }}>“Only record the person’s job.”</div>
            </div>
          </Appear>
          <Appear delay={52}>
            <div style={{ fontSize: 60, color: t.faint }}>→</div>
          </Appear>
          <div style={{ flex: 1 }}>
            {rows.map((d, i) => {
              const fade = interpolate(frame, [70 + i * 12, 95 + i * 12], [1, d.keep ? 1 : 0.28], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <Appear key={i} delay={60 + i * 10}>
                  <div
                    style={{
                      opacity: fade,
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: t.panel,
                      border: `1px solid ${d.keep ? t.good + "66" : t.panelBorder}`,
                      borderLeft: `4px solid ${d.keep ? t.good : t.bad}`,
                      borderRadius: 10,
                      padding: "14px 18px",
                      marginBottom: 12,
                      fontSize: 27,
                    }}
                  >
                    <span style={{ color: d.keep ? t.good : t.bad, fontWeight: 800 }}>{d.keep ? "✓" : "✗"}</span>
                    <span style={{ color: d.keep ? t.text : t.dim }}>{d.text}</span>
                  </div>
                </Appear>
              );
            })}
          </div>
        </div>
        <Appear delay={104}>
          <div style={{ marginTop: 30, fontSize: 34, color: t.bad }}>
            …and your agent <b>silently forgets</b> things the user actually told it.
          </div>
        </Appear>
      </div>
    </Bg>
  );
};

// ============ 3. The tool — what mission-sandbox does ============
const Concept: React.FC = () => {
  const t = useDesign();
  const steps = [
    { n: "1", h: "Write the golden set", d: "the facts you’ve decided the agent must remember" },
    { n: "2", h: "Test a mission (dry run)", d: "real extraction on your notes — nothing is stored" },
    { n: "3", h: "Read the coverage", d: "how many golden facts the mission actually captured" },
  ];
  return (
    <Bg>
      <div style={{ padding: "70px 130px" }}>
        <SceneTitle kicker="the tool" title="mission-sandbox catches it before you ship" />
        <div style={{ display: "flex", gap: 30, marginTop: 60 }}>
          {steps.map((s, i) => (
            <Appear key={s.n} delay={16 + i * 18} style={{ flex: 1 }}>
              <div style={{ background: t.panel, border: `1px solid ${t.panelBorder}`, borderRadius: 16, padding: 30, height: 280 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: `${t.accent}22`,
                    border: `1px solid ${t.accent}66`,
                    color: t.accent,
                    fontSize: 36,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {s.n}
                </div>
                <div style={{ fontSize: 34, fontWeight: 700, marginTop: 22 }}>{s.h}</div>
                <div style={{ fontSize: 27, color: t.dim, marginTop: 12, lineHeight: 1.4 }}>{s.d}</div>
              </div>
            </Appear>
          ))}
        </div>
        <Appear delay={84}>
          <div style={{ marginTop: 46, fontSize: 32, color: t.accent2, textAlign: "center" }}>
            Tune the words of the mission — not the data — and watch coverage change.
          </div>
        </Appear>
      </div>
    </Bg>
  );
};

// ============ 4. The input — Maya's notes ============
const Docs: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <div style={{ padding: "60px 110px" }}>
        <SceneTitle kicker="our example" title="Meet Maya — she chats with her AI assistant" />
        <Appear delay={12}>
          <div style={{ fontSize: 30, color: t.dim, marginTop: 6 }}>
            Three notes over a few months. Her agent should remember the things that matter to her.
          </div>
        </Appear>
        <div style={{ marginTop: 38, display: "flex", flexDirection: "column", gap: 20 }}>
          {D.documents.map((d, i) => (
            <Appear key={d.id} delay={26 + i * 16}>
              <div style={{ background: t.panel, border: `1px solid ${t.panelBorder}`, borderRadius: 14, padding: "20px 26px", display: "flex", gap: 24, alignItems: "flex-start" }}>
                <Chip color={t.accent2}>{d.date}</Chip>
                <div style={{ fontSize: 29, lineHeight: 1.4, color: t.text }}>“{d.text}”</div>
              </div>
            </Appear>
          ))}
        </div>
      </div>
    </Bg>
  );
};

// ============ check scene (reused for test #1 and #2) ============
const CheckScene: React.FC<{
  kicker: string;
  title: string;
  missionLabel: string;
  mission: string;
  facts: string[];
  covered: Set<number>;
  cmd: string;
  meterDelay: number;
  flipAt: number;
  caption: string;
  captionColor: string;
  maxFacts?: number;
}> = ({ kicker, title, missionLabel, mission, facts, covered, cmd, meterDelay, flipAt, caption, captionColor, maxFacts = 8 }) => {
  const t = useDesign();
  const shown = facts.slice(0, maxFacts);
  const extra = facts.length - shown.length;
  return (
    <Bg>
      <div style={{ padding: "48px 80px" }}>
        <SceneTitle kicker={kicker} title={title} />
        <div style={{ display: "flex", gap: 36, marginTop: 28 }}>
          <div style={{ flex: 1.15 }}>
            <div style={{ fontSize: 24, color: t.dim, marginBottom: 10 }}>① the mission → what the agent extracts from Maya’s notes</div>
            <TerminalWindow title="zsh — mission-sandbox">
              <div style={{ fontSize: 25, color: t.text }}>
                <span style={{ color: t.good }}>$ </span>
                <Typed text={cmd} delay={6} />
              </div>
              <Appear delay={42}>
                <div style={{ marginTop: 16, fontSize: 20, color: t.faint }}>
                  {missionLabel} <span style={{ color: t.dim }}>(plain-English instructions)</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 22, color: t.dim, fontFamily: t.sans, lineHeight: 1.4, borderLeft: `3px solid ${t.panelBorder}`, paddingLeft: 14 }}>
                  {mission}
                </div>
              </Appear>
              <Appear delay={62}>
                <div style={{ marginTop: 16, fontSize: 21, color: t.accent2 }}>▸ dry-run extract — real LLM, nothing stored</div>
              </Appear>
              <div style={{ marginTop: 14 }}>
                {shown.map((f, i) => (
                  <FactCard key={i} text={f} index={i} appearStart={76} />
                ))}
                {extra > 0 ? (
                  <Appear delay={76 + shown.length * 6 + 6}>
                    <div style={{ fontSize: 22, color: t.faint, fontFamily: t.mono }}>+{extra} more facts</div>
                  </Appear>
                ) : null}
              </div>
            </TerminalWindow>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 24, color: t.dim, marginBottom: 10 }}>② the golden set → what Maya’s agent <i>should</i> remember</div>
            <Appear delay={meterDelay - 12}>
              <div style={{ background: t.panel, border: `1px solid ${t.panelBorder}`, borderRadius: 14, padding: 24 }}>
                <CoverageMeter covered={covered.size} total={D.golden.length} delay={meterDelay} label="coverage — golden facts captured" />
              </div>
            </Appear>
            <div style={{ marginTop: 20 }}>
              {D.golden.map((g, i) => (
                <GoldenRow key={i} text={g} covered={covered.has(i)} index={i} flipAt={flipAt} />
              ))}
            </div>
          </div>
        </div>
        <Appear delay={100}>
          <div style={{ marginTop: 14, fontSize: 30, color: captionColor, textAlign: "center", fontWeight: 600 }}>{caption}</div>
        </Appear>
      </div>
    </Bg>
  );
};

// ============ 6. The fix — refine the mission ============
const Refine: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <div style={{ padding: "64px 110px" }}>
        <SceneTitle kicker="the fix" title="Don’t touch the data — fix the mission" />
        <Appear delay={12}>
          <div style={{ fontSize: 30, color: t.dim, marginTop: 6 }}>
            Tell mission-sandbox what was missing. It rewrites the mission for you.
          </div>
        </Appear>
        <div style={{ marginTop: 30 }}>
          <TerminalWindow title="zsh — mission-sandbox">
            <div style={{ fontSize: 24, color: t.text, lineHeight: 1.5 }}>
              <span style={{ color: t.good }}>$ </span>
              <Typed
                text={'mission-sandbox retain mission demo \\\n    --feedback "also capture preferences, plans, pets, and the reason behind decisions"'}
                delay={6}
                cps={44}
              />
            </div>
          </TerminalWindow>
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 28 }}>
          <Appear delay={74} style={{ flex: 1 }}>
            <div style={{ background: t.panel, border: `1px solid ${t.panelBorder}`, borderRadius: 14, padding: 22 }}>
              <div style={{ color: t.bad, fontFamily: t.mono, fontSize: 21, marginBottom: 10 }}>— mission before</div>
              <div style={{ fontSize: 23, color: t.dim, lineHeight: 1.45 }}>{D.baseline.mission}</div>
            </div>
          </Appear>
          <Appear delay={96} style={{ flex: 1.3 }}>
            <div style={{ background: `${t.good}10`, border: `1px solid ${t.good}55`, borderRadius: 14, padding: 22 }}>
              <div style={{ color: t.good, fontFamily: t.mono, fontSize: 21, marginBottom: 10 }}>+ mission after</div>
              <div style={{ fontSize: 23, color: t.text, lineHeight: 1.45 }}>{D.refined.mission}</div>
            </div>
          </Appear>
        </div>
      </div>
    </Bg>
  );
};

// ============ 8. Outro ============
const Outro: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Appear delay={2}>
          <div style={{ fontSize: 34, color: t.dim }}>same notes · same golden set · just a better mission</div>
        </Appear>
        <Appear delay={16}>
          <div style={{ display: "flex", alignItems: "center", gap: 30, fontFamily: t.mono, fontSize: 110, fontWeight: 800, marginTop: 16 }}>
            <span style={{ color: t.bad }}>3/8</span>
            <span style={{ color: t.dim, fontSize: 64 }}>→</span>
            <span style={{ color: t.good }}>8/8</span>
          </div>
        </Appear>
        <Appear delay={34}>
          <div style={{ fontSize: 30, color: t.dim, marginTop: 26, fontFamily: t.mono }}>real LLM extraction · no re-ingest · nothing stored</div>
        </Appear>
        <Appear delay={50}>
          <div style={{ fontSize: 32, color: t.faint, marginTop: 40 }}>
            <span style={{ color: t.accent }}>mission-sandbox</span> · Hindsight agent memory
          </div>
        </Appear>
      </AbsoluteFill>
    </Bg>
  );
};

const Scenes: React.FC = () => (
  <AbsoluteFill style={{ background: hindsight.bg }}>
    <Sequence durationInFrames={150}>
      <Hook />
    </Sequence>
    <Sequence from={150} durationInFrames={210}>
      <Catch />
    </Sequence>
    <Sequence from={360} durationInFrames={210}>
      <Concept />
    </Sequence>
    <Sequence from={570} durationInFrames={240}>
      <Docs />
    </Sequence>
    <Sequence from={810} durationInFrames={420}>
      <CheckScene
        kicker="test #1 · a narrow mission"
        title="What does this mission capture?"
        missionLabel="retain mission"
        mission={D.baseline.mission}
        facts={baseFacts}
        covered={baseCovered}
        cmd="mission-sandbox retain check demo"
        meterDelay={130}
        flipAt={9999}
        caption="It kept her job — but forgot her dog, her move, her plans, her tastes. Coverage: 3/8."
        captionColor={hindsight.amber}
      />
    </Sequence>
    <Sequence from={1230} durationInFrames={300}>
      <Refine />
    </Sequence>
    <Sequence from={1530} durationInFrames={450}>
      <CheckScene
        kicker="test #2 · refined mission"
        title="Same notes. Same golden set. Better mission."
        missionLabel="retain mission (refined)"
        mission={D.refined.mission}
        facts={refFacts}
        covered={refCovered}
        cmd="mission-sandbox retain check demo"
        meterDelay={160}
        flipAt={160}
        caption="Now the agent remembers Maya — pets, plans, preferences and the “why”. Coverage: 8/8."
        captionColor={hindsight.good}
      />
    </Sequence>
    <Sequence from={1980} durationInFrames={240}>
      <Outro />
    </Sequence>
  </AbsoluteFill>
);

/** Wrap the whole video in the hindsight design so all shared components are on-brand. */
export const MissionSandboxVideo: React.FC = () => (
  <DesignProvider design={hindsight}>
    <Scenes />
  </DesignProvider>
);

export const missionSandboxMeta = { id: "hindsight-mission-sandbox", durationInFrames: 2220, fps: 30, width: 1920, height: 1080 };
