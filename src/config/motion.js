/** Animation timings, in milliseconds. */
export const motion = {
  /** the slide a bin performs when it opens or closes */
  slide: {
    duration: 640,
    easing: "cubic-bezier(.22,1,.32,1)",
  },

  /** the idle animation that opens random bins on its own */
  ambient: {
    enabled: true,
    /** stand down when the OS asks for reduced motion */
    respectReducedMotion: true,
    /** how often to consider opening something */
    interval: 1150,
    /** probability that a tick opens `burstSize` bins instead of one */
    burstChance: 0.32,
    burstSize: 2,
    /** how long an ambiently-opened bin stays out */
    hold: { min: 2400, max: 5200 },
  },
};
