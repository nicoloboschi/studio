import React, { createContext, useContext } from "react";

/**
 * A brand's visual tokens. One `Design` object per brand (e.g. `hindsight/design.ts`),
 * the machine-readable counterpart of that brand's `DESIGN.md`. Shared components read it
 * via `useDesign()`, so every video wrapped in the brand's `<DesignProvider>` looks consistent.
 */
export type Design = {
  // surfaces
  bg: string;
  bg2: string;
  panel: string;
  panelBorder: string;
  // text
  text: string;
  dim: string;
  faint: string;
  // accents / semantics
  accent: string;
  accent2: string;
  good: string;
  amber: string;
  bad: string;
  // type
  mono: string;
  sans: string;
};

const DesignContext = createContext<Design | null>(null);

export const DesignProvider: React.FC<{ design: Design; children: React.ReactNode }> = ({ design, children }) => (
  <DesignContext.Provider value={design}>{children}</DesignContext.Provider>
);

export const useDesign = (): Design => {
  const d = useContext(DesignContext);
  if (!d) throw new Error("useDesign must be used inside a <DesignProvider> (wrap your video).");
  return d;
};
