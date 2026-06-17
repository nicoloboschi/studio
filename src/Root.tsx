import React from "react";
import { Composition } from "remotion";
import { MissionSandboxVideo, missionSandboxMeta } from "../hindsight/mission-sandbox/Video";

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
  </>
);
