import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DesignProvider, useDesign } from "../../src/lib/design";
import { Bg } from "../../src/lib/components";
import { agentMemory } from "../design";

const FPS = 30;
const P = 30; // drip/leak period (divides 150 → seamless loop)

// Left bucket is riddled with holes — it drains as fast as it fills. Right bucket is sealed and holds.
// "The context window is RAM, not storage." Animation only, no text.
const Scene: React.FC = () => {
  const t = useDesign();
  const f = useCurrentFrame();

  const bucketPath = (cx: number) => `M${cx - 150},200 L${cx + 150},200 L${cx + 112},560 L${cx - 112},560 Z`;
  const leftCx = 300, rightCx = 700;
  const leftLevel = 0.12 + 0.045 * Math.sin((f / (P * 1.5)) * Math.PI * 2);
  const rightLevel = 0.8;
  const waterTop = (level: number) => 560 - level * 350;

  // a falling droplet: phase 0..1 over P frames, given a start/end and index offset
  const drop = (key: string, x: number, y0: number, y1: number, off: number, color: string, r = 7) => {
    const ph = (((f + off) % P) / P);
    const y = y0 + (y1 - y0) * ph;
    const op = ph < 0.1 ? ph / 0.1 : ph > 0.85 ? (1 - ph) / 0.15 : 1;
    return <ellipse key={key} cx={x} cy={y} rx={r} ry={r * 1.5} fill={color} opacity={op} />;
  };

  const puddleW = 70 + 30 * Math.abs(Math.sin((f / P) * Math.PI));
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <svg width={1000} height={780} viewBox="0 0 1000 780">
        <defs>
          <clipPath id="clipL"><path d={bucketPath(leftCx)} /></clipPath>
          <clipPath id="clipR"><path d={bucketPath(rightCx)} /></clipPath>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={t.accent} />
            <stop offset="1" stopColor={t.accent2} />
          </linearGradient>
        </defs>

        {/* drips falling in (both buckets) */}
        {drop("dL1", leftCx, 90, 200, 0, t.accent2)}
        {drop("dL2", leftCx, 90, 200, 15, t.accent2)}
        {drop("dR1", rightCx, 90, 200, 7, t.accent2)}
        {drop("dR2", rightCx, 90, 200, 22, t.accent2)}

        {/* ===== LEFT: leaky ===== */}
        <rect x={leftCx - 160} y={waterTop(leftLevel)} width={320} height={560} fill="url(#water)" clipPath="url(#clipL)" />
        <path d={bucketPath(leftCx)} fill="none" stroke={t.faint} strokeWidth={5} />
        {/* holes */}
        {[{ x: leftCx - 120, y: 340 }, { x: leftCx + 110, y: 410 }, { x: leftCx - 70, y: 500 }].map((h, i) => (
          <circle key={i} cx={h.x} cy={h.y} r={11} fill="#000" stroke={t.bad} strokeWidth={2} />
        ))}
        {/* leak streams out of the holes */}
        {drop("kL1", leftCx - 134, 348, 600, 0, t.accent, 5)}
        {drop("kL2", leftCx + 124, 418, 600, 10, t.accent, 5)}
        {drop("kL3", leftCx - 84, 508, 600, 20, t.accent, 5)}
        {/* puddle */}
        <ellipse cx={leftCx} cy={600} rx={puddleW} ry={14} fill={t.accent} opacity={0.5} />

        {/* ===== RIGHT: sealed, holds ===== */}
        <rect x={rightCx - 160} y={waterTop(rightLevel)} width={320} height={560} fill="url(#water)" clipPath="url(#clipR)" />
        <path d={bucketPath(rightCx)} fill="none" stroke={t.accent} strokeWidth={5} />
        {/* glowing sealed seam */}
        <line x1={rightCx} y1={waterTop(rightLevel)} x2={rightCx} y2={560} stroke="#fff" strokeOpacity={0.18} strokeWidth={3} />
        <ellipse cx={rightCx} cy={waterTop(rightLevel)} rx={112} ry={10} fill="#fff" opacity={0.18} />
      </svg>
    </AbsoluteFill>
  );
};

export const LeakyBucketVideo: React.FC = () => (
  <DesignProvider design={agentMemory}>
    <Bg>
      <Scene />
    </Bg>
  </DesignProvider>
);

export const leakyBucketMeta = { id: "agent-memory-leaky-bucket", durationInFrames: 150, fps: FPS, width: 1080, height: 1920 };
