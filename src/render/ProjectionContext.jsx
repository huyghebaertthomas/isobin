import { createContext, useContext } from "react";

/**
 * The projection every drawing component uses to turn world points into SVG.
 * Supplied by the scene so no component reaches for a global camera.
 */
const ProjectionContext = createContext(null);

export function ProjectionProvider({ projection, children }) {
  return <ProjectionContext.Provider value={projection}>{children}</ProjectionContext.Provider>;
}

export function useProjection() {
  const projection = useContext(ProjectionContext);
  if (!projection) throw new Error("useProjection must be used inside a <ProjectionProvider>.");
  return projection;
}
