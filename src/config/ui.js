/**
 * Every string the interface shows. Captions that depend on the built scene are
 * functions so they stay correct when the layout changes.
 */
export const ui = {
  title: "Bin wall",
  caption: ({ binCount }) => `${binCount} bins · tap to open`,
  sceneLabel: ({ organizerCount }) =>
    `Isometric wireframe of ${organizerCount} component storage organizers`,

  panel: {
    title: "Controls",
    open: "Controls",
    close: "Hide",
    reset: "Reset",
    resetSection: "Reset this section",
    copy: "Copy config",
    copied: "Copied",
    copyHint: "Copy the changes as an override object for <BinWall config={…} />",
    styles: "Style",
    surfaces: "Surfaces",
  },
};
