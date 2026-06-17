import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useDesign } from "./design";

/** Full-screen brand background (radial wash). Wrap each scene in this. */
export const Bg: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useDesign();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 700px at 70% -10%, ${t.bg2}, ${t.bg})`,
        color: t.text,
        fontFamily: t.sans,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Fade + rise in, starting at `delay` frames (relative to the enclosing Sequence). */
export const Appear: React.FC<{
  delay?: number;
  children: React.ReactNode;
  y?: number;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, y = 24, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return <div style={{ opacity: s, transform: `translateY(${(1 - s) * y}px)`, ...style }}>{children}</div>;
};

/** Monospace terminal typing effect — reveals `text` char-by-char from `delay`. */
export const Typed: React.FC<{ text: string; delay?: number; cps?: number; style?: React.CSSProperties }> = ({
  text,
  delay = 0,
  cps = 38,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.max(0, Math.floor(((frame - delay) / fps) * cps));
  const shown = text.slice(0, n);
  const done = n >= text.length;
  return (
    <span style={style}>
      {shown}
      {!done && frame > delay ? <span style={{ opacity: frame % 16 < 8 ? 1 : 0 }}>▋</span> : null}
    </span>
  );
};

const Dot: React.FC<{ c: string }> = ({ c }) => <div style={{ width: 15, height: 15, borderRadius: "50%", background: c }} />;

export const TerminalWindow: React.FC<{ title: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  title,
  children,
  style,
}) => {
  const t = useDesign();
  return (
    <div
      style={{
        background: "#0A0F22",
        border: `1px solid ${t.panelBorder}`,
        borderRadius: 14,
        boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        overflow: "hidden",
        fontFamily: t.mono,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 18px",
          background: "#070B19",
          borderBottom: `1px solid ${t.panelBorder}`,
        }}
      >
        <Dot c="#FF5F57" />
        <Dot c="#FEBC2E" />
        <Dot c="#28C840" />
        <span style={{ color: t.faint, fontSize: 22, marginLeft: 10 }}>{title}</span>
      </div>
      <div style={{ padding: "26px 30px" }}>{children}</div>
    </div>
  );
};

/** Animated 0..1 progress meter; color shifts amber → cyan → green with value. */
export const CoverageMeter: React.FC<{ covered: number; total: number; delay?: number; label?: string }> = ({
  covered,
  total,
  delay = 0,
  label,
}) => {
  const t = useDesign();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 1.2 } });
  const pct = (covered / total) * grow;
  const shownCovered = Math.round(covered * grow);
  const color = pct >= 0.95 ? t.good : pct >= 0.6 ? t.accent2 : t.amber;
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ color: t.dim, fontSize: 28, fontFamily: t.sans }}>{label ?? "coverage"}</span>
        <span style={{ color, fontSize: 38, fontWeight: 700, fontFamily: t.mono }}>
          {shownCovered}/{total} · {Math.round(pct * 100)}%
        </span>
      </div>
      <div style={{ height: 26, borderRadius: 13, background: "#0A0F22", border: `1px solid ${t.panelBorder}`, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct * 100}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 24px ${color}99`,
            borderRadius: 13,
          }}
        />
      </div>
    </div>
  );
};

/** Checklist row that flips ○ → ✓ at `flipAt` when `covered`. */
export const GoldenRow: React.FC<{ text: string; covered: boolean; index: number; flipAt: number }> = ({
  text,
  covered,
  index,
  flipAt,
}) => {
  const t = useDesign();
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [index * 4, index * 4 + 12], [0, 1], { extrapolateRight: "clamp" });
  const isOn = covered && frame >= flipAt;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: appear, marginBottom: 12 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 800,
          background: isOn ? `${t.good}22` : "#161d36",
          color: isOn ? t.good : t.faint,
          border: `1px solid ${isOn ? t.good : t.panelBorder}`,
        }}
      >
        {isOn ? "✓" : "○"}
      </div>
      <span style={{ fontSize: 27, fontFamily: t.sans, color: isOn ? t.text : t.dim }}>{text}</span>
    </div>
  );
};

/** A fact card that slides in from the left, staggered by `index`. */
export const FactCard: React.FC<{ text: string; index: number; appearStart: number }> = ({ text, index, appearStart }) => {
  const t = useDesign();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - appearStart - index * 6, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        opacity: s,
        transform: `translateX(${(1 - s) * -30}px)`,
        background: t.panel,
        border: `1px solid ${t.panelBorder}`,
        borderLeft: `4px solid ${t.accent2}`,
        borderRadius: 10,
        padding: "14px 18px",
        marginBottom: 12,
        fontFamily: t.sans,
        fontSize: 25,
        color: t.text,
      }}
    >
      {text}
    </div>
  );
};

export const Chip: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color }) => {
  const t = useDesign();
  const c = color ?? t.accent;
  return (
    <span
      style={{
        fontFamily: t.mono,
        fontSize: 24,
        color: c,
        background: `${c}1a`,
        border: `1px solid ${c}55`,
        borderRadius: 8,
        padding: "5px 12px",
      }}
    >
      {children}
    </span>
  );
};

/** Standard scene heading: small mono kicker + large title. */
export const SceneTitle: React.FC<{ kicker: string; title: string }> = ({ kicker, title }) => {
  const t = useDesign();
  return (
    <Appear>
      <div style={{ color: t.accent2, fontFamily: t.mono, fontSize: 26, letterSpacing: 2, textTransform: "uppercase" }}>
        {kicker}
      </div>
      <div style={{ fontSize: 50, fontWeight: 700, marginTop: 8 }}>{title}</div>
    </Appear>
  );
};
