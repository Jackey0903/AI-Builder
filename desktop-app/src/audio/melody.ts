import { NOTES } from '../data/notes';
import type { MelodyEvent, MelodyStyle, Note } from '../types';

const styleSettings: Record<MelodyStyle, { durations: number[]; tempo: number; accent: number }> = {
  bright: { durations: [220, 220, 330, 440], tempo: 1, accent: 0.98 },
  soft: { durations: [360, 480, 600, 720], tempo: 1.08, accent: 0.72 },
  electro: { durations: [150, 150, 225, 300], tempo: 0.88, accent: 1 }
};

const noteOrder = NOTES.map((definition) => definition.note);

export function generateMelody(seed: Note[], style: MelodyStyle, targetMs = 18000): MelodyEvent[] {
  const motif = seed.length ? seed.slice(-8) : (['C', 'E', 'G', 'E'] as Note[]);
  const settings = styleSettings[style];
  const events: MelodyEvent[] = [];
  let elapsed = 0;
  let phrase = 0;

  while (elapsed < targetMs) {
    for (let i = 0; i < motif.length && elapsed < targetMs; i += 1) {
      const source = motif[i];
      const sourceIndex = noteOrder.indexOf(source);
      const phraseShift = phrase % 4 === 1 ? 2 : phrase % 4 === 2 ? -1 : phrase % 4 === 3 ? 4 : 0;
      const resolvedIndex = clampIndex(sourceIndex + phraseShift + (i % 3 === 2 ? 1 : 0));
      const duration = Math.round(settings.durations[(i + phrase) % settings.durations.length] * settings.tempo);
      const isCadence = i === motif.length - 1;

      events.push({
        note: isCadence && phrase % 2 === 1 ? 'C' : noteOrder[resolvedIndex],
        durationMs: duration,
        velocity: isCadence ? settings.accent : Math.max(0.62, settings.accent - i * 0.03)
      });

      elapsed += duration;
    }

    phrase += 1;
  }

  return events;
}

function clampIndex(index: number) {
  if (index < 0) return 0;
  if (index >= noteOrder.length) return noteOrder.length - 1;
  return index;
}

export function melodyDuration(events: MelodyEvent[]) {
  return events.reduce((sum, event) => sum + event.durationMs, 0);
}

