// A tiny, dependency-free notification chime generated with the Web Audio
// API rather than a bundled audio file - there's nothing to fetch, nothing
// to fail a CORS/network check, and no asset to ship. Used by NotificationBell
// to get a patient's or doctor's attention when a real-time notification
// ("notification:new") arrives while they're not actively looking at the tab.
let audioCtx: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
};

// Two-note chime (soft "ding-dong"), short enough to not be annoying if a
// few notifications arrive close together.
export const playNotificationChime = () => {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      // Browsers block audio until a user gesture has happened on the page.
      // Best-effort: this resolves silently if it's still blocked.
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const notes: Array<[frequency: number, startOffset: number]> = [
      [880, 0],
      [1318.5, 0.14],
    ];

    notes.forEach(([frequency, startOffset]) => {
      const startAt = now + startOffset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.22, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.32);
    });
  } catch {
    // Audio is a nice-to-have - never let it break notification handling.
  }
};

// Browsers only allow audio to start after a user gesture on the page. Call
// this once on mount (NotificationBell does) to create/resume the
// AudioContext the first time the person clicks or presses a key anywhere -
// so it's already "running" by the time a notification needs to play a
// chime later, even if the tab is unfocused at that moment.
export const warmNotificationAudio = () => {
  if (typeof window === "undefined") return () => {};

  const resume = () => {
    const ctx = getContext();
    if (ctx?.state === "suspended") ctx.resume().catch(() => {});
  };

  window.addEventListener("pointerdown", resume, { once: true, passive: true });
  window.addEventListener("keydown", resume, { once: true });

  return () => {
    window.removeEventListener("pointerdown", resume);
    window.removeEventListener("keydown", resume);
  };
};

// True when the person is unlikely to notice an in-app update on their own:
// the tab is in the background, minimized, or the window isn't focused.
// NotificationBell uses this to decide whether the chime above should play -
// no point sounding an alert for someone already looking at the screen.
export const isUserInactive = (): boolean =>
  typeof document !== "undefined" && (document.hidden || !document.hasFocus());
