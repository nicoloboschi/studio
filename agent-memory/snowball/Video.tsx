import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DesignProvider, useDesign } from "../../src/lib/design";
import { Bg } from "../../src/lib/components";
import { agentMemory } from "../design";

const FPS = 30;
const PERIOD = 75; // two rolls per 150-frame loop → seamless

const APEX = { x: 540, y: 720 };
const LEFT = { x: 150, y: 1300 };
const RIGHT = { x: 930, y: 1300 };
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// Same start, opposite outcome: the left snowball melts to nothing rolling down; the right one grows.
// "Memory compounds." Animation only, no text.
const Ball: React.FC<{ side: "left" | "right"; ph: number }> = ({ side, ph }) => {
  const t = useDesign();
  const e = Math.pow(ph, 1.15);
  const end = side === "left" ? LEFT : RIGHT;
  const r = side === "left" ? lerp(46, 3, ph) : lerp(16, 96, e);
  const cx = lerp(APEX.x, end.x, e);
  const cy = lerp(APEX.y, end.y, e) - r * 0.7; // sit on the slope
  const spin = (side === "left" ? -1 : 1) * ph * 540;
  const fade = side === "left" ? Math.min(1, r / 6) : 1; // left fades as it vanishes
  const c = side === "left" ? "#E6E8EF" : t.accent;
  return (
    <g opacity={fade}>
      {side === "right" && <circle cx={cx} cy={cy} r={r + 8} fill={t.accent} opacity={0.18} />}
      <g transform={`rotate(${spin} ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill={side === "left" ? c : "#F4F2F8"} stroke={side === "right" ? t.accent : "#cfd2dd"} strokeWidth={side === "right" ? 4 : 2} />
        {/* irregular speckles to read the spin (not a face) */}
        {[[0.5, -0.15, 0.09], [-0.3, 0.45, 0.07], [0.12, 0.52, 0.06], [-0.5, -0.1, 0.05], [0.32, 0.18, 0.05]].map((s, i) => (
          <circle key={i} cx={cx + r * s[0]} cy={cy + r * s[1]} r={Math.max(1.5, r * s[2])} fill={side === "right" ? t.accent : "#b9bcca"} opacity={0.45} />
        ))}
      </g>
    </g>
  );
};

const Scene: React.FC = () => {
  const t = useDesign();
  const f = useCurrentFrame();
  const ph = (f % PERIOD) / PERIOD;
  // left leaves a melt puddle that grows toward the base
  const puddleW = 10 + ph * 80;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {/* mountain */}
        <polygon points={`${LEFT.x},${LEFT.y} ${APEX.x},${APEX.y} ${RIGHT.x},${RIGHT.y}`} fill={t.panel} stroke={t.panelBorder} strokeWidth={3} />
        {/* snow cap */}
        <polygon points={`${APEX.x - 70},${APEX.y + 90} ${APEX.x},${APEX.y} ${APEX.x + 70},${APEX.y + 90}`} fill="#E6E8EF" opacity={0.5} />
        <line x1={80} y1={1300} x2={1000} y2={1300} stroke={t.panelBorder} strokeWidth={3} />

        {/* left: melt puddle */}
        <ellipse cx={LEFT.x} cy={1300} rx={puddleW} ry={12} fill="#E6E8EF" opacity={0.35} />

        <Ball side="left" ph={ph} />
        <Ball side="right" ph={ph} />
      </svg>
    </AbsoluteFill>
  );
};

export const SnowballVideo: React.FC = () => (
  <DesignProvider design={agentMemory}>
    <Bg>
      <Scene />
    </Bg>
  </DesignProvider>
);

export const snowballMeta = { id: "agent-memory-snowball", durationInFrames: 150, fps: FPS, width: 1080, height: 1920 };
