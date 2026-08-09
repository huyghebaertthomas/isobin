import { useProjection } from "../../render/ProjectionContext.jsx";

/**
 * The outline of a piece, as a set of world-space polylines.
 *
 * Fills and outlines are always drawn as two passes rather than as stroked
 * polygons, because the faces of a box share their creases: stroking each face
 * whole would lay two lines along every crease.
 */
export function Edges({ edges, material }) {
  const { points } = useProjection();

  return (
    <g fill="none" {...material.line}>
      {edges.map((edge, index) => (
        <polyline key={index} points={points(edge)} />
      ))}
    </g>
  );
}
