import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DesignProvider, useDesign } from "../../src/lib/design";
import { Appear, Bg } from "../../src/lib/components";
import { agentMemory } from "../design";
import data from "./data.json";

type Msg = { text: string; key?: boolean };
const D = data as unknown as {
  messages: Msg[];
  capacity: number;
  memory: { label: string; value: string };
  question: string;
  answerWrong: string;
  answerRight: string;
};

const FPS = 30;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const ROW_H = 132;
const START = 18; // frame the first message enters
const STEP = 22; // frames between messages
const C = D.capacity;

// ---- the context window: a fixed-height panel; messages stream in, the oldest scroll out the top ----
const ContextWindow: React.FC<{ remembered: boolean }> = ({ remembered }) => {
  const t = useDesign();
  const frame = useCurrentFrame();
  // continuous count of messages entered; freeze once the last one is in so the window holds the
  // most-recent `capacity` messages (the oldest, incl. the key fact, have already scrolled out).
  const prog = Math.min((frame - START) / STEP, D.messages.length - 1);
  const entered = Math.max(0, Math.min(D.messages.length, Math.floor(prog + 1)));
  const fillPct = clamp01(entered / C);
  const full = entered >= C;
  return (
    <div style={{ width: 880, background: t.panel, border: `1px solid ${t.panelBorder}`, borderRadius: 26, padding: "26px 26px 30px", boxShadow: "0 30px 80px rgba(0,0,0,0.45)" }}>
      {/* header + capacity meter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span style={{ fontFamily: t.mono, fontSize: 26, color: t.faint, letterSpacing: 1 }}>context window</span>
        <span style={{ fontFamily: t.mono, fontSize: 26, fontWeight: 700, color: full ? t.amber : t.dim }}>{full ? "FULL" : `${Math.round(fillPct * 100)}%`}</span>
      </div>
      <div style={{ height: 12, borderRadius: 6, background: "#000", border: `1px solid ${t.panelBorder}`, overflow: "hidden", marginBottom: 22 }}>
        <div style={{ height: "100%", width: `${fillPct * 100}%`, background: full ? t.amber : `linear-gradient(90deg, ${t.accent}, ${t.accent2})` }} />
      </div>
      {/* viewport — clips messages entering at the bottom and leaving at the top */}
      <div style={{ position: "relative", height: C * ROW_H, overflow: "hidden" }}>
        {D.messages.map((m, i) => {
          const d = prog - i; // 0 = newest at bottom; grows as newer messages arrive
          if (d < -1 || d > C) return null;
          const enter = clamp01(d + 1); // fade in as it arrives
          const leave = clamp01(C - d); // fade out as it passes the top
          const opacity = Math.min(enter, leave);
          const leaving = d > C - 1;
          const isKey = m.key;
          const border = isKey ? (leaving ? t.bad : t.accent) : t.panelBorder;
          return (
            <div key={i} style={{ position: "absolute", left: 6, right: 6, bottom: d * ROW_H, opacity, transition: "none" }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    maxWidth: "86%",
                    background: t.bg2,
                    border: `1px solid ${border}`,
                    borderLeft: isKey ? `4px solid ${leaving ? t.bad : t.accent}` : `1px solid ${border}`,
                    borderRadius: "16px 16px 4px 16px",
                    padding: "16px 20px",
                    fontSize: 30,
                    color: leaving ? t.faint : t.text,
                    boxShadow: isKey && !leaving ? `0 0 24px ${t.accent}44` : "none",
                  }}
                >
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
        {/* top fade so messages dissolve as they're truncated */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(180deg, ${t.panel}, transparent)`, pointerEvents: "none" }} />
      </div>
    </div>
  );
};

// ---- the memory store that survives truncation (only in the "remembered" scene) ----
const MemoryPill: React.FC = () => {
  const t = useDesign();
  const frame = useCurrentFrame();
  const appear = spring({ frame: frame - (START + 6), fps: FPS, config: { damping: 200 } });
  return (
    <div style={{ width: 880, marginBottom: 18, opacity: appear, transform: `translateY(${(1 - appear) * -10}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: `${t.accent}14`, border: `1px solid ${t.accent}66`, borderRadius: 16, padding: "14px 20px" }}>
        <span style={{ fontFamily: t.mono, fontSize: 24, color: t.accent, letterSpacing: 1 }}>memory</span>
        <span style={{ fontFamily: t.mono, fontSize: 26, color: t.text, background: `${t.accent}22`, border: `1px solid ${t.accent}66`, borderRadius: 10, padding: "4px 14px" }}>
          {D.memory.label}: <span style={{ color: t.accent, fontWeight: 700 }}>{D.memory.value}</span>
        </span>
        <span style={{ marginLeft: "auto", fontSize: 24, color: t.good }}>✓ kept</span>
      </div>
    </div>
  );
};

// ---- the question + the agent's answer (right/wrong) ----
const QA: React.FC<{ delay: number; answer: string; ok: boolean }> = ({ delay, answer, ok }) => {
  const t = useDesign();
  const frame = useCurrentFrame();
  const q = spring({ frame: frame - delay, fps: FPS, config: { damping: 200 } });
  const a = spring({ frame: frame - delay - 14, fps: FPS, config: { damping: 200 } });
  return (
    <div style={{ width: 880, marginTop: 26 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", opacity: q, transform: `translateY(${(1 - q) * 10}px)` }}>
        <div style={{ background: t.bg2, border: `1px solid ${t.panelBorder}`, borderRadius: "16px 16px 4px 16px", padding: "14px 20px", fontSize: 30, color: t.text }}>{D.question}</div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 12, opacity: a, transform: `translateY(${(1 - a) * 10}px)` }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "baseline",
            background: t.panel,
            border: `1px solid ${ok ? t.good + "66" : t.bad + "66"}`,
            borderLeft: `4px solid ${ok ? t.good : t.bad}`,
            borderRadius: "16px 16px 16px 4px",
            padding: "14px 20px",
            fontSize: 30,
            color: ok ? t.text : t.dim,
            maxWidth: "92%",
          }}
        >
          <span style={{ color: ok ? t.good : t.bad, fontWeight: 800 }}>{ok ? "✓" : "✗"}</span>
          <span>{answer}</span>
        </div>
      </div>
    </div>
  );
};

const Caption: React.FC<{ delay: number; color?: string; children: React.ReactNode }> = ({ delay, color, children }) => {
  const t = useDesign();
  return (
    <Appear delay={delay}>
      <div style={{ position: "absolute", bottom: 90, left: 70, right: 70, textAlign: "center", fontSize: 36, fontWeight: 600, color: color ?? t.dim }}>{children}</div>
    </Appear>
  );
};

// ============ Scene 1 — fill the window, the first fact falls out, answer is wrong ============
const ForgetScene: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 90 }}>
        <Appear>
          <div style={{ fontSize: 50, fontWeight: 800, color: t.text, marginBottom: 26, textAlign: "center", width: 880 }}>
            A bigger window just delays the problem.
          </div>
        </Appear>
        <ContextWindow remembered={false} />
        <QA delay={236} answer={D.answerWrong} ok={false} />
      </AbsoluteFill>
      <Caption delay={250} color={t.bad}>Fill the window and the earliest facts scroll out.</Caption>
    </Bg>
  );
};

// ============ Scene 2 — same window, but memory keeps the fact; answer is right ============
const RememberScene: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 90 }}>
        <Appear>
          <div style={{ fontSize: 50, fontWeight: 800, color: t.text, marginBottom: 26, textAlign: "center", width: 880 }}>
            Memory keeps what matters — outside the window.
          </div>
        </Appear>
        <MemoryPill />
        <ContextWindow remembered />
        <QA delay={210} answer={D.answerRight} ok={true} />
      </AbsoluteFill>
      <Caption delay={228} color={t.good}>The note still scrolls out — but memory already kept it.</Caption>
    </Bg>
  );
};

// ============ Outro ============
const Outro: React.FC = () => {
  const t = useDesign();
  const grad = { background: `linear-gradient(100deg, ${t.accent}, ${t.accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" } as React.CSSProperties;
  return (
    <Bg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 80px", textAlign: "center" }}>
        <Appear delay={2}>
          <div style={{ fontSize: 64, fontWeight: 800, color: t.text, lineHeight: 1.12 }}>
            A bigger context window
          </div>
        </Appear>
        <Appear delay={12}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.12, ...grad }}>isn't memory.</div>
        </Appear>
        <Appear delay={28}>
          <div style={{ marginTop: 44, fontSize: 34, color: t.dim, fontWeight: 600, maxWidth: 820 }}>
            Context is finite. Memory curates what matters and keeps it.
          </div>
        </Appear>
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center", fontFamily: t.mono, fontSize: 26, color: t.faint, letterSpacing: 3 }}>agent memory</div>
    </Bg>
  );
};

const Scenes: React.FC = () => (
  <AbsoluteFill style={{ background: agentMemory.bg }}>
    <Sequence durationInFrames={300}><ForgetScene /></Sequence>
    <Sequence from={300} durationInFrames={285}><RememberScene /></Sequence>
    <Sequence from={585} durationInFrames={105}><Outro /></Sequence>
  </AbsoluteFill>
);

export const ContextWindowVideo: React.FC = () => (
  <DesignProvider design={agentMemory}>
    <Scenes />
  </DesignProvider>
);

export const contextWindowMeta = { id: "agent-memory-context-window", durationInFrames: 690, fps: FPS, width: 1080, height: 1920 };
