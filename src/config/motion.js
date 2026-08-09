/**
 * Animation timings, in milliseconds.
 *
 * Only the slide, because only the slide happens: a bin moves when it is
 * clicked or when the handle is told to move it, and never on its own. If you
 * want bins drifting open by themselves — an idle attract loop, a walkthrough,
 * a replay of yesterday's picks — that is a timer of yours calling `open` and
 * `close`, which is a dozen lines and yours to time.
 */
export const motion = {
  /** the slide a bin performs when it opens or closes */
  slide: {
    duration: 640,
    easing: "cubic-bezier(.22,1,.32,1)",
  },
};
