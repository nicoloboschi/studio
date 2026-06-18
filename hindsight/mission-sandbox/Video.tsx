import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DesignProvider, useDesign } from "../../src/lib/design";
import { Appear, Bg, TerminalWindow, Typed } from "../../src/lib/components";
import { hindsight } from "../design";
import data from "./data.json";

const D = data as unknown as {
  documents: { date: string; text: string }[];
  questions: { ask: string; v1: string; v1ok: boolean; v2: string; v2ok: boolean }[];
  baselineMission: string;
  refinedMission: string;
  feedback: string;
  scores: { v1: number; v2: number; total: number };
};

const FPS = 30;

// Real answers are third-person ("Maya …"); show them as the assistant speaking to its user ("You …").
const youify = (s: string) =>
  s
    .replace(/\bMaya is\b/g, "You're")
    .replace(/\bMaya's\b/g, "your")
    .replace(/\bMaya\b/g, "you")
    .replace(/\bher\b/g, "your")
    .replace(/^you\b/, "You")
    .replace(/(\. )you\b/g, "$1You");

const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 80, color }) => {
  const t = useDesign();
  return <div style={{ fontSize: size, fontWeight: 800, color: color ?? t.text, lineHeight: 1.12 }}>{children}</div>;
};

// ---- one chat exchange (user question + assistant answer with ✓/✗) ----
const Exchange: React.FC<{ ask: string; answer: string; ok: boolean; delay: number; compact?: boolean }> = ({
  ask,
  answer,
  ok,
  delay,
  compact,
}) => {
  const t = useDesign();
  const frame = useCurrentFrame();
  const q = spring({ frame: frame - delay, fps: FPS, config: { damping: 200 } });
  const a = spring({ frame: frame - delay - 10, fps: FPS, config: { damping: 200 } });
  const fs = compact ? 25 : 28;
  return (
    <div style={{ marginBottom: compact ? 16 : 22 }}>
      {/* user bubble (right) */}
      <div style={{ display: "flex", justifyContent: "flex-end", opacity: q, transform: `translateY(${(1 - q) * 10}px)` }}>
        <div style={{ background: t.bg2, border: `1px solid ${t.panelBorder}`, color: t.text, borderRadius: "14px 14px 4px 14px", padding: "10px 16px", fontSize: fs, maxWidth: "82%" }}>
          {ask}
        </div>
      </div>
      {/* assistant bubble (left) */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 8, opacity: a, transform: `translateY(${(1 - a) * 10}px)` }}>
        <div
          style={{
            background: t.panel,
            border: `1px solid ${ok ? t.good + "66" : t.bad + "55"}`,
            borderLeft: `4px solid ${ok ? t.good : t.bad}`,
            color: ok ? t.text : t.dim,
            borderRadius: "14px 14px 14px 4px",
            padding: "10px 16px",
            fontSize: fs,
            maxWidth: "88%",
            display: "flex",
            gap: 10,
            alignItems: "baseline",
          }}
        >
          <span style={{ color: ok ? t.good : t.bad, fontWeight: 800 }}>{ok ? "✓" : "✗"}</span>
          <span>{answer}</span>
        </div>
      </div>
    </div>
  );
};

// ---- the assistant chat panel: the eval, experienced as a conversation ----
const ChatPanel: React.FC<{ version: "v1" | "v2"; startDelay?: number }> = ({ version, startDelay = 0 }) => {
  const t = useDesign();
  return (
    <div style={{ background: "rgba(8,12,26,0.55)", border: `1px solid ${t.panelBorder}`, borderRadius: 16, padding: "22px 24px", height: 880, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: t.good }} />
        <span style={{ color: t.faint, fontFamily: t.mono, fontSize: 22 }}>your assistant</span>
      </div>
      {D.questions.map((qq, i) => (
        <Exchange
          key={i}
          ask={qq.ask}
          answer={version === "v1" ? (qq.v1ok ? youify(qq.v1) : qq.v1) : youify(qq.v2)}
          ok={version === "v1" ? qq.v1ok : qq.v2ok}
          delay={startDelay + i * 14}
          compact
        />
      ))}
    </div>
  );
};

const ScoreChip: React.FC<{ score: number; total: number; delay: number; label: string }> = ({ score, total, delay, label }) => {
  const t = useDesign();
  const frame = useCurrentFrame();
  const g = spring({ frame: frame - delay, fps: FPS, config: { damping: 200, mass: 1.1 } });
  const shown = Math.round(score * g);
  const color = score >= total ? t.good : score > 0 ? t.amber : t.bad;
  return (
    <div style={{ opacity: g, marginTop: 18, display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ color: t.dim, fontFamily: t.sans, fontSize: 26 }}>{label}</span>
      <span style={{ fontFamily: t.mono, fontSize: 40, fontWeight: 800, color, background: `${color}1a`, border: `1px solid ${color}66`, borderRadius: 12, padding: "4px 18px" }}>
        {shown}/{total}
      </span>
    </div>
  );
};

const Caption: React.FC<{ delay?: number; children: React.ReactNode; color?: string }> = ({ delay = 0, children, color }) => {
  const t = useDesign();
  return (
    <Appear delay={delay}>
      <div style={{ position: "absolute", bottom: 30, left: 80, right: 80, textAlign: "center", fontSize: 30, color: color ?? t.dim, fontWeight: 600 }}>
        {children}
      </div>
    </Appear>
  );
};

// ============ 1. Pain ============
const Pain: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 200px" }}>
        <Appear delay={2}>
          <Big size={70} color={t.text}>
            Your AI assistant should know you.
          </Big>
        </Appear>
        <Appear delay={20}>
          <div style={{ marginTop: 10, fontSize: 44, color: t.bad, fontWeight: 800 }}>This one doesn’t.</div>
        </Appear>
        <div style={{ marginTop: 52, width: 980 }}>
          <Exchange ask="Hey — do I have any pets?" answer="I don’t have that in my memory." ok={false} delay={48} />
        </div>
      </AbsoluteFill>
    </Bg>
  );
};

// ============ the source: Maya's notes ============
const Notes: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <div style={{ padding: "60px 120px" }}>
        <Appear>
          <div style={{ color: t.accent2, fontFamily: t.mono, fontSize: 26, letterSpacing: 2, textTransform: "uppercase" }}>the source</div>
          <Big size={52}>But Maya told her assistant all of this</Big>
        </Appear>
        <Appear delay={12}>
          <div style={{ fontSize: 30, color: t.dim, marginTop: 10 }}>
            Three notes over a few months — everything the agent had to remember.
          </div>
        </Appear>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 22 }}>
          {D.documents.map((d, i) => (
            <Appear key={i} delay={26 + i * 20}>
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start", background: t.panel, border: `1px solid ${t.panelBorder}`, borderRadius: 14, padding: "22px 26px" }}>
                <span style={{ fontFamily: t.mono, fontSize: 24, color: t.accent2, background: `${t.accent2}1a`, border: `1px solid ${t.accent2}55`, borderRadius: 8, padding: "5px 12px", whiteSpace: "nowrap" }}>
                  {d.date}
                </span>
                <div style={{ fontSize: 30, lineHeight: 1.42, color: t.text }}>“{d.text}”</div>
              </div>
            </Appear>
          ))}
        </div>
      </div>
    </Bg>
  );
};

// ============ split act: chat (left) + terminal (right) ============
const Split: React.FC<{ chat: React.ReactNode; terminal: React.ReactNode; caption?: React.ReactNode }> = ({ chat, terminal, caption }) => (
  <Bg>
    <div style={{ display: "flex", gap: 40, padding: "44px 70px 0" }}>
      <div style={{ flex: 1.05 }}>{chat}</div>
      <div style={{ flex: 1 }}>{terminal}</div>
    </div>
    {caption}
  </Bg>
);

const EvalV1: React.FC = () => {
  const t = useDesign();
  return (
    <Split
      chat={<ChatPanel version="v1" startDelay={70} />}
      terminal={
        <div>
          <TerminalWindow title="zsh — mission-sandbox">
            <div style={{ fontSize: 24, color: t.text }}>
              <span style={{ color: t.good }}>$ </span>
              <Typed text="mission-sandbox retain apply maya" delay={6} />
            </div>
            <Appear delay={40}>
              <div style={{ marginTop: 12, fontSize: 21, color: t.faint }}>ingesting 3 notes → bank maya-v1 …</div>
            </Appear>
            <Appear delay={56}>
              <div style={{ marginTop: 14, fontSize: 22, color: t.accent2 }}>▸ running your eval — 6 real questions</div>
            </Appear>
          </TerminalWindow>
          <ScoreChip score={D.scores.v1} total={D.scores.total} delay={230} label="eval score" />
        </div>
      }
      caption={<Caption delay={250} color={t.amber}>Same notes were ingested — but the agent only kept work facts.</Caption>}
    />
  );
};

const Why: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <div style={{ padding: "70px 130px" }}>
        <Appear>
          <div style={{ color: t.accent2, fontFamily: t.mono, fontSize: 26, letterSpacing: 2, textTransform: "uppercase" }}>why it forgot</div>
          <Big size={52}>What it remembers is set by the retain mission</Big>
        </Appear>
        <Appear delay={16}>
          <div style={{ fontSize: 32, color: t.dim, marginTop: 14, maxWidth: 1300 }}>
            Plain-English instructions for what to extract. Maya’s was too narrow:
          </div>
        </Appear>
        <Appear delay={30}>
          <div style={{ marginTop: 28, background: t.panel, border: `1px solid ${t.bad}55`, borderLeft: `4px solid ${t.bad}`, borderRadius: 12, padding: "22px 26px", fontSize: 30, color: t.text, maxWidth: 1400 }}>
            “{D.baselineMission}”
          </div>
        </Appear>
        <Appear delay={48}>
          <div style={{ marginTop: 28, fontSize: 32, color: t.bad }}>→ it never stored her home, her dog, her hobby, or her plans.</div>
        </Appear>
      </div>
    </Bg>
  );
};

const Fix: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <div style={{ padding: "60px 110px" }}>
        <Appear>
          <div style={{ color: t.accent2, fontFamily: t.mono, fontSize: 26, letterSpacing: 2, textTransform: "uppercase" }}>the fix</div>
          <Big size={52}>Change the mission — not the data</Big>
        </Appear>
        <div style={{ marginTop: 34 }}>
          <TerminalWindow title="zsh — mission-sandbox">
            <div style={{ fontSize: 23, color: t.text, lineHeight: 1.5 }}>
              <span style={{ color: t.good }}>$ </span>
              <Typed text={`mission-sandbox retain mission maya \\\n    --feedback "${D.feedback}"`} delay={6} cps={46} />
            </div>
            <Appear delay={92}>
              <div style={{ marginTop: 14, fontSize: 21, color: t.good }}>✓ mission updated</div>
            </Appear>
            <Appear delay={104}>
              <div style={{ marginTop: 14, fontSize: 23, color: t.text }}>
                <span style={{ color: t.good }}>$ </span>
                <Typed text="mission-sandbox retain apply maya" delay={108} />
              </div>
            </Appear>
            <Appear delay={150}>
              <div style={{ marginTop: 10, fontSize: 21, color: t.faint }}>re-ingesting the same 3 notes → bank maya-v2 …</div>
            </Appear>
          </TerminalWindow>
        </div>
        <Appear delay={160}>
          <div style={{ marginTop: 22, fontSize: 30, color: t.dim, textAlign: "center" }}>
            Same notes. You just told it <span style={{ color: t.text }}>what else to remember</span>.
          </div>
        </Appear>
      </div>
    </Bg>
  );
};

const EvalV2: React.FC = () => {
  const t = useDesign();
  return (
    <Split
      chat={<ChatPanel version="v2" startDelay={60} />}
      terminal={
        <div>
          <TerminalWindow title="zsh — mission-sandbox">
            <div style={{ fontSize: 24, color: t.text }}>
              <span style={{ color: t.good }}>$ </span>
              <Typed text="mission-sandbox retain apply maya" delay={6} />
            </div>
            <Appear delay={38}>
              <div style={{ marginTop: 12, fontSize: 21, color: t.faint }}>bank maya-v2 ready</div>
            </Appear>
            <Appear delay={50}>
              <div style={{ marginTop: 14, fontSize: 22, color: t.accent2 }}>▸ running the same eval again…</div>
            </Appear>
          </TerminalWindow>
          <ScoreChip score={D.scores.v2} total={D.scores.total} delay={230} label="eval score" />
        </div>
      }
      caption={<Caption delay={250} color={t.good}>Same questions — now answered.</Caption>}
    />
  );
};

const Outro: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Appear delay={2}>
          <div style={{ display: "flex", alignItems: "center", gap: 30, fontFamily: t.mono, fontSize: 120, fontWeight: 800 }}>
            <span style={{ color: t.bad }}>
              {D.scores.v1}/{D.scores.total}
            </span>
            <span style={{ color: t.dim, fontSize: 64 }}>→</span>
            <span style={{ color: t.good }}>
              {D.scores.v2}/{D.scores.total}
            </span>
          </div>
        </Appear>
        <Appear delay={20}>
          <div style={{ fontSize: 36, color: t.text, marginTop: 22, textAlign: "center", maxWidth: 1300 }}>
            You didn’t touch the data or the model — you tuned <span style={{ color: t.accent }}>what gets remembered</span>, and your eval proved it.
          </div>
        </Appear>
        <Appear delay={40}>
          <div style={{ fontSize: 30, color: t.faint, marginTop: 40 }}>
            <span style={{ color: t.accent }}>mission-sandbox</span> · Hindsight agent memory
          </div>
        </Appear>
      </AbsoluteFill>
    </Bg>
  );
};

const Scenes: React.FC = () => (
  <AbsoluteFill style={{ background: hindsight.bg }}>
    <Sequence durationInFrames={170}><Pain /></Sequence>
    <Sequence from={170} durationInFrames={240}><Notes /></Sequence>
    <Sequence from={410} durationInFrames={400}><EvalV1 /></Sequence>
    <Sequence from={810} durationInFrames={230}><Why /></Sequence>
    <Sequence from={1040} durationInFrames={300}><Fix /></Sequence>
    <Sequence from={1340} durationInFrames={380}><EvalV2 /></Sequence>
    <Sequence from={1720} durationInFrames={170}><Outro /></Sequence>
  </AbsoluteFill>
);

export const MissionSandboxVideo: React.FC = () => (
  <DesignProvider design={hindsight}>
    <Scenes />
  </DesignProvider>
);

export const missionSandboxMeta = { id: "hindsight-mission-sandbox", durationInFrames: 1890, fps: FPS, width: 1920, height: 1080 };
