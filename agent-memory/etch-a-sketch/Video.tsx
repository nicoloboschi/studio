import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { DesignProvider, useDesign } from "../../src/lib/design";
import { Bg } from "../../src/lib/components";
import { agentMemory } from "../design";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const FPS = 30;

// An Etch A Sketch draws a (rectilinear) "map of your project", then shakes & wipes blank — and
// redraws the exact same thing. Forgetting between sessions. Animation only, no text.
const Device: React.FC = () => {
  const t = useDesign();
  const f = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const ph = (f % D) / D;
  const draw = ph < 0.58 ? clamp01(ph / 0.58) : 1; // pen draws the route
  const erased = ph < 0.7 ? 0 : ph < 0.8 ? clamp01((ph - 0.7) / 0.1) : ph < 0.92 ? 1 : 0; // shake-wipe, hold blank
  const lineOpacity = 1 - erased;
  const shaking = ph > 0.7 && ph < 0.8;
  const shake = shaking ? Math.sin(f * 1.7) * 7 : 0;
  const knob = draw * 240;

  const W = 760, H = 560;
  const knobY = H - 56;
  return (
    <div style={{ transform: `translateX(${shake}px)`, width: W, height: H, borderRadius: 40, background: `linear-gradient(180deg, ${t.bad}, ${t.bad}cc)`, boxShadow: "0 40px 90px rgba(0,0,0,0.5)", padding: 36, position: "relative" }}>
      {/* screen */}
      <div style={{ position: "relative", width: W - 72, height: H - 150, borderRadius: 16, background: "#0C0C12", border: `2px solid rgba(0,0,0,0.35)`, overflow: "hidden", boxShadow: "inset 0 8px 30px rgba(0,0,0,0.6)" }}>
        <svg width={W - 72} height={H - 150} viewBox="0 0 688 410">
          <path
            d="M70,330 L70,120 L210,120 L210,260 L350,260 L350,90 L500,90 L500,330 L620,330 L620,160"
            fill="none"
            stroke={t.text}
            strokeWidth={11}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
            opacity={lineOpacity}
          />
        </svg>
        {/* wipe sweep */}
        {erased > 0 && erased < 1 && (
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${(erased * 130) - 30}%`, width: "30%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)" }} />
        )}
      </div>
      {/* knobs */}
      {[36, W - 36 - 72].map((x, i) => (
        <div key={i} style={{ position: "absolute", left: x, top: knobY, width: 72, height: 72, borderRadius: "50%", background: "#EDEDF2", boxShadow: "inset 0 -4px 10px rgba(0,0,0,0.25)" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 30, height: 5, background: "#9A9AA6", borderRadius: 3, transform: `translate(-50%,-50%) rotate(${i ? -knob : knob}deg)` }} />
        </div>
      ))}
    </div>
  );
};

export const EtchVideo: React.FC = () => (
  <DesignProvider design={agentMemory}>
    <Bg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Device />
      </AbsoluteFill>
    </Bg>
  </DesignProvider>
);

export const etchMeta = { id: "agent-memory-etch-a-sketch", durationInFrames: 150, fps: FPS, width: 1080, height: 1920 };
