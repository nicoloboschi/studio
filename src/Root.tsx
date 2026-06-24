import React from "react";
import { Composition } from "remotion";
import { MissionSandboxVideo, missionSandboxMeta } from "../hindsight/mission-sandbox/Video";
import { ReleaseNotesVideo, releaseNotesMeta } from "../hindsight/release-notes/Video";
import { TimeToSolveVideo, timeToSolveMeta } from "../agent-memory/time-to-solve/Video";
import { ContextWindowVideo, contextWindowMeta } from "../agent-memory/context-window/Video";
import { EtchVideo, etchMeta } from "../agent-memory/etch-a-sketch/Video";
import { LeakyBucketVideo, leakyBucketMeta } from "../agent-memory/leaky-bucket/Video";
import { SandcastleVideo, sandcastleMeta } from "../agent-memory/sandcastle/Video";
import { SnowballVideo, snowballMeta } from "../agent-memory/snowball/Video";
import { LocalSpeedVideo, localSpeedMeta } from "../llm-bench/local-speed/Video";
import { HeadToHeadVideo, headToHeadMeta, headToHeadSquareMeta } from "../llm-bench/head-to-head/Video";

const HOOKS = [
  { meta: etchMeta, component: EtchVideo },
  { meta: leakyBucketMeta, component: LeakyBucketVideo },
  { meta: sandcastleMeta, component: SandcastleVideo },
  { meta: snowballMeta, component: SnowballVideo },
];

/**
 * Register every video here as a <Composition>. Convention: composition id is
 * `<brand>-<video>` (e.g. `hindsight-mission-sandbox`). Each video folder exports its
 * component + a `*Meta` (id/dimensions/duration).
 */
export const Root: React.FC = () => (
  <>
    <Composition
      id={missionSandboxMeta.id}
      component={MissionSandboxVideo}
      durationInFrames={missionSandboxMeta.durationInFrames}
      fps={missionSandboxMeta.fps}
      width={missionSandboxMeta.width}
      height={missionSandboxMeta.height}
    />
    <Composition
      id={releaseNotesMeta.id}
      component={ReleaseNotesVideo}
      durationInFrames={releaseNotesMeta.durationInFrames}
      fps={releaseNotesMeta.fps}
      width={releaseNotesMeta.width}
      height={releaseNotesMeta.height}
    />
    <Composition
      id={timeToSolveMeta.id}
      component={TimeToSolveVideo}
      durationInFrames={timeToSolveMeta.durationInFrames}
      fps={timeToSolveMeta.fps}
      width={timeToSolveMeta.width}
      height={timeToSolveMeta.height}
    />
    <Composition
      id={contextWindowMeta.id}
      component={ContextWindowVideo}
      durationInFrames={contextWindowMeta.durationInFrames}
      fps={contextWindowMeta.fps}
      width={contextWindowMeta.width}
      height={contextWindowMeta.height}
    />
    {HOOKS.map(({ meta, component }) => (
      <Composition key={meta.id} id={meta.id} component={component} durationInFrames={meta.durationInFrames} fps={meta.fps} width={meta.width} height={meta.height} />
    ))}
    <Composition
      id={localSpeedMeta.id}
      component={LocalSpeedVideo}
      durationInFrames={localSpeedMeta.durationInFrames}
      fps={localSpeedMeta.fps}
      width={localSpeedMeta.width}
      height={localSpeedMeta.height}
    />
    <Composition
      id={headToHeadMeta.id}
      component={HeadToHeadVideo}
      durationInFrames={headToHeadMeta.durationInFrames}
      fps={headToHeadMeta.fps}
      width={headToHeadMeta.width}
      height={headToHeadMeta.height}
    />
    <Composition
      id={headToHeadSquareMeta.id}
      component={HeadToHeadVideo}
      durationInFrames={headToHeadSquareMeta.durationInFrames}
      fps={headToHeadSquareMeta.fps}
      width={headToHeadSquareMeta.width}
      height={headToHeadSquareMeta.height}
    />
  </>
);
