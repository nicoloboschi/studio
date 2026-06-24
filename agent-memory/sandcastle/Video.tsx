import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { DesignProvider, useDesign } from "../../src/lib/design";
import { Bg } from "../../src/lib/components";
import { agentMemory } from "../design";

const FPS = 30;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const BASE = 1300; // ground line
const SAND_CX = 350;
const STONE_CX = 730;

// a battlement castle built from rects, scaled vertically (for rebuild) about its base.
const Castle: React.FC<{ cx: number; fill: string; stroke: string; opacity: number; scaleY: number }> = ({ cx, fill, stroke, opacity, scaleY }) => {
  const rects: { x: number; y: number; w: number; h: number }[] = [];
  // towers
  rects.push({ x: cx - 130, y: BASE - 210, w: 48, h: 210 });
  rects.push({ x: cx + 82, y: BASE - 210, w: 48, h: 210 });
  // body
  rects.push({ x: cx - 100, y: BASE - 150, w: 200, h: 150 });
  // crenellations on body
  for (let i = 0; i < 5; i++) rects.push({ x: cx - 100 + i * 42, y: BASE - 174, w: 26, h: 26 });
  // crenellations on towers
  for (const tx of [cx - 130, cx + 82]) for (let i = 0; i < 2; i++) rects.push({ x: tx + i * 26, y: BASE - 234, w: 20, h: 26 });
  return (
    <g opacity={opacity} transform={`translate(0 ${BASE}) scale(1 ${scaleY}) translate(0 ${-BASE})`}>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={4} fill={fill} stroke={stroke} strokeWidth={3} />
      ))}
      {/* door */}
      <rect x={cx - 18} y={BASE - 64} width={36} height={64} rx={16} fill={stroke} opacity={0.6} />
    </g>
  );
};

const Scene: React.FC = () => {
  const t = useDesign();
  const f = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const ph = (f % D) / D;
  const waveX = -300 + ph * (1080 + 560); // sweeps left → right

  // sand reacts to the wave; rebuilds near the end of the loop
  const hp = clamp01((waveX - (SAND_CX - 60)) / 180);
  const rebuilding = ph > 0.85;
  const rb = clamp01((ph - 0.85) / 0.13);
  const sandOpacity = rebuilding ? rb : 1 - hp;
  const sandScaleY = rebuilding ? rb : 1;

  // sand particles burst as the wave crosses
  const pp = clamp01((waveX - (SAND_CX - 60)) / 240);
  const particles = Array.from({ length: 28 }).map((_, i) => {
    const ang = i * 2.399; // golden-angle spread
    const sx = Math.cos(ang) * (40 + (i % 6) * 26);
    const x = SAND_CX + sx * (0.4 + pp);
    const y = BASE - 110 - Math.sin(ang) * 40 + pp * pp * 360 + (i % 5) * 8;
    const op = pp > 0 && pp < 1 && !rebuilding ? (1 - pp) * 0.9 : 0;
    return { x, y, op, r: 5 + (i % 3) * 2 };
  });

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {/* ground */}
        <line x1={0} y1={BASE} x2={1080} y2={BASE} stroke={t.panelBorder} strokeWidth={3} />
        <ellipse cx={SAND_CX} cy={BASE} rx={180} ry={16} fill="#D9B27A" opacity={0.18} />

        {/* stone castle — unaffected */}
        <Castle cx={STONE_CX} fill="#8A8A95" stroke="#3A3A42" opacity={1} scaleY={1} />
        {/* sand castle — washed away, then rebuilt */}
        <Castle cx={SAND_CX} fill="#D9B27A" stroke="#9C7C4E" opacity={sandOpacity} scaleY={sandScaleY} />
        {/* sand particles */}
        {particles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#D9B27A" opacity={p.op} />
        ))}

        {/* the wave */}
        <g transform={`translate(${waveX} 0)`}>
          <rect x={-90} y={BASE - 340} width={180} height={340 + 80} fill={t.accent} opacity={0.32} />
          <path d={`M-90,${BASE - 340} q45,-40 90,0 q45,40 90,0`} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={6} />
          <ellipse cx={0} cy={BASE} rx={96} ry={20} fill="#fff" opacity={0.25} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const SandcastleVideo: React.FC = () => (
  <DesignProvider design={agentMemory}>
    <Bg>
      <Scene />
    </Bg>
  </DesignProvider>
);

export const sandcastleMeta = { id: "agent-memory-sandcastle", durationInFrames: 150, fps: FPS, width: 1080, height: 1920 };
