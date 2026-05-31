import { NOTES, noteByName } from '../data/notes';
import type { Note, SoundSampleLayer } from '../types';

const MASTER_GAIN = 0.82;
const DOWNSHIFT_PENALTY_SEMITONES = 3;

export interface SampleOptions {
  id?: string;
  name?: string;
  baseNote?: Note;
  baseSemitoneOffset?: number;
  trimStartMs?: number;
  trimEndMs?: number;
  gain?: number;
  role?: SoundSampleLayer['role'];
}

interface LoadedSampleLayer {
  id: string;
  name: string;
  buffer: AudioBuffer;
  baseNote: Note;
  baseSemitoneOffset?: number;
  gain: number;
  role?: SoundSampleLayer['role'];
}

interface SelectedSampleLayer {
  sample: LoadedSampleLayer;
  baseSemitone: number;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private sampleLayers: LoadedSampleLayer[] = [];

  async ensureContext() {
    if (!this.context) {
      this.context = new AudioContext();
    }

    if (this.context.state === 'suspended') {
      await Promise.race([
        this.context.resume().catch(() => undefined),
        new Promise((resolve) => window.setTimeout(resolve, 250))
      ]);
    }

    return this.context;
  }

  hasSample() {
    return this.sampleLayers.length > 0;
  }

  async setSample(blob: Blob, options: SampleOptions = {}) {
    const context = await this.ensureContext();
    const arrayBuffer = await blob.arrayBuffer();
    const decoded = await this.decodeArrayBuffer(context, arrayBuffer);
    this.sampleLayers = [
      {
        id: options.id ?? 'recorded',
        name: options.name ?? 'Recorded Sample',
        buffer: this.cropBuffer(decoded, options.trimStartMs, options.trimEndMs),
        baseNote: options.baseNote ?? 'C',
        baseSemitoneOffset: options.baseSemitoneOffset,
        gain: options.gain ?? 1,
        role: options.role ?? 'single'
      }
    ];
  }

  async loadSampleFromUrl(url: string, options: SampleOptions = {}) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Could not load sample: ${url}`);
    }

    await this.setSample(await response.blob(), options);
  }

  async loadSampleSet(samples: SoundSampleLayer[]) {
    const context = await this.ensureContext();
    const loaded: LoadedSampleLayer[] = [];

    for (const sample of samples) {
      const response = await fetch(sample.file);
      if (!response.ok) {
        throw new Error(`Could not load sample: ${sample.file}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const decoded = await this.decodeArrayBuffer(context, arrayBuffer);

      loaded.push({
        id: sample.id,
        name: sample.name,
        buffer: this.cropBuffer(decoded, sample.trimStartMs, sample.trimEndMs),
        baseNote: sample.baseNote,
        baseSemitoneOffset: sample.baseSemitoneOffset,
        gain: sample.gain ?? 1,
        role: sample.role
      });
    }

    this.sampleLayers = loaded;
  }

  getSampleDuration() {
    return Math.max(0, ...this.sampleLayers.map((sample) => sample.buffer.duration));
  }

  async playNote(note: Note, durationMs = 520, velocity = 1, scaleRoot: Note = 'C') {
    const context = await this.ensureContext();
    const definition = noteByName.get(note);

    if (!definition) return;

    const rootDefinition = noteByName.get(scaleRoot) ?? noteByName.get('C')!;
    const targetSemitone = definition.semitoneOffset + rootDefinition.semitoneOffset;

    if (!this.sampleLayers.length) {
      this.playFallbackTone(context, 261.63 * Math.pow(2, targetSemitone / 12), durationMs, velocity);
      return;
    }

    const selectedLayer = this.pickClosestSample(targetSemitone);
    const ratio = Math.pow(2, (targetSemitone - selectedLayer.baseSemitone) / 12);

    const source = context.createBufferSource();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    source.buffer = selectedLayer.sample.buffer;
    source.playbackRate.value = ratio;

    filter.type = 'lowpass';
    filter.frequency.value = 6800;
    filter.Q.value = 0.2;

    const now = context.currentTime;
    const attack = 0.012;
    const release = 0.12;
    const naturalDuration = selectedLayer.sample.buffer.duration / ratio;
    const sustainSeconds = Math.min(durationMs / 1000, Math.max(0.12, naturalDuration));

    gain.gain.setValueAtTime(0.0001, now);
    const targetGain = MASTER_GAIN * velocity * selectedLayer.sample.gain;
    gain.gain.exponentialRampToValueAtTime(targetGain, now + attack);
    gain.gain.setValueAtTime(targetGain, now + Math.max(attack, sustainSeconds - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + sustainSeconds);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(now);
    source.stop(now + sustainSeconds + 0.04);
  }

  /**
   * Legato 连奏模式：
   * - attack 极短（3ms），前后音符 80ms crossfade 无缝衔接
   * - 长节拍通过降低 playbackRate 放慢采样实现时长拉伸，同时用 detune 补偿音高：
   *     effectiveRate = playbackRate × 2^(detune/1200) = ratio（音高不变）
   *     playTime = buffer.duration / (ratio × stretchFactor) = sustainSeconds（时长正确）
   */
  async playNoteLegato(note: Note, durationMs = 520, velocity = 1, scaleRoot: Note = 'C') {
    const context = await this.ensureContext();
    const definition = noteByName.get(note);

    if (!definition) return;

    const rootDefinition = noteByName.get(scaleRoot) ?? noteByName.get('C')!;
    const targetSemitone = definition.semitoneOffset + rootDefinition.semitoneOffset;

    if (!this.sampleLayers.length) {
      this.playFallbackTone(context, 261.63 * Math.pow(2, targetSemitone / 12), durationMs, velocity);
      return;
    }

    const selectedLayer = this.pickClosestSample(targetSemitone);
    const ratio = Math.pow(2, (targetSemitone - selectedLayer.baseSemitone) / 12);

    const buf = selectedLayer.sample.buffer;
    const naturalDuration = buf.duration / ratio; // 按目标音高正常播放的时长

    const now = context.currentTime;
    const attack = 0.003;
    const crossfade = 0.080;
    const sustainSeconds = Math.max(durationMs / 1000, 0.05);

    // 降速拉伸：最多放慢 8 倍（stretchFactor ≥ 0.125）
    // 猴麦仔 149ms × 8 = ~1200ms，足以覆盖常见音符时长
    // playbackRate × stretchFactor → 降速；detune 补偿 → 音高不变
    const stretchFactor = naturalDuration < sustainSeconds
      ? Math.max(naturalDuration / sustainSeconds, 0.125)
      : 1;

    const source = context.createBufferSource();
    const gain   = context.createGain();
    const filter = context.createBiquadFilter();

    source.buffer = buf;
    source.playbackRate.value = ratio * stretchFactor;

    // detune 补偿：2^(detune/1200) = 1/stretchFactor → detune = -1200×log2(stretchFactor)
    source.detune.value = stretchFactor < 1
      ? -1200 * Math.log2(stretchFactor)
      : 0;

    filter.type = 'lowpass';
    filter.frequency.value = 6800;
    filter.Q.value = 0.2;

    const targetGain = MASTER_GAIN * velocity * selectedLayer.sample.gain;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(targetGain, now + attack);
    gain.gain.setValueAtTime(targetGain, now + Math.max(attack, sustainSeconds - crossfade));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + sustainSeconds);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(now);
    source.stop(now + sustainSeconds + 0.01);
  }

  async playClick() {
    const context = await this.ensureContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  private playFallbackTone(context: AudioContext, frequency: number, durationMs: number, velocity: number) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const durationSeconds = durationMs / 1000;

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.32 * velocity, now + 0.015);
    gain.gain.setValueAtTime(0.26 * velocity, now + Math.max(0.02, durationSeconds - 0.12));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + durationSeconds + 0.02);
  }

  private pickClosestSample(targetSemitone: number): SelectedSampleLayer {
    return this.sampleLayers.reduce<SelectedSampleLayer>((best, sample) => {
      const baseSemitone = this.bestPlayableBaseSemitone(sample, targetSemitone);
      const currentScore = this.pitchShiftScore(targetSemitone, baseSemitone);
      const bestScore = this.pitchShiftScore(targetSemitone, best.baseSemitone);
      return currentScore < bestScore ? { sample, baseSemitone } : best;
    }, {
      sample: this.sampleLayers[0],
      baseSemitone: this.bestPlayableBaseSemitone(this.sampleLayers[0], targetSemitone)
    });
  }

  private bestPlayableBaseSemitone(sample: LoadedSampleLayer, targetSemitone: number) {
    if (typeof sample.baseSemitoneOffset === 'number') {
      return sample.baseSemitoneOffset;
    }

    const baseDefinition = noteByName.get(sample.baseNote) ?? noteByName.get('C')!;
    const octave = Math.floor((targetSemitone - baseDefinition.semitoneOffset) / 12);
    const candidates = [octave - 1, octave, octave + 1, octave + 2].map(
      (octaveIndex) => baseDefinition.semitoneOffset + octaveIndex * 12
    );

    return candidates.reduce((best, baseSemitone) =>
      this.pitchShiftScore(targetSemitone, baseSemitone) < this.pitchShiftScore(targetSemitone, best) ? baseSemitone : best
    );
  }

  private pitchShiftScore(targetSemitone: number, baseSemitone: number) {
    const distance = Math.abs(targetSemitone - baseSemitone);
    return baseSemitone > targetSemitone ? distance + DOWNSHIFT_PENALTY_SEMITONES : distance;
  }

  private decodeArrayBuffer(context: AudioContext, arrayBuffer: ArrayBuffer) {
    return new Promise<AudioBuffer>((resolve, reject) => {
      context.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
    });
  }

  private trimBuffer(buffer: AudioBuffer, threshold: number) {
    const channel = buffer.getChannelData(0);
    let start = 0;
    let end = channel.length - 1;

    while (start < channel.length && Math.abs(channel[start]) < threshold) start += 1;
    while (end > start && Math.abs(channel[end]) < threshold) end -= 1;

    const padding = Math.floor(buffer.sampleRate * 0.04);
    start = Math.max(0, start - padding);
    end = Math.min(channel.length - 1, end + padding);

    if (end <= start || end - start < buffer.sampleRate * 0.08) {
      return buffer;
    }

    const context = this.context;
    const frameCount = end - start + 1;
    const trimmed = context!.createBuffer(buffer.numberOfChannels, frameCount, buffer.sampleRate);

    for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
      trimmed.copyToChannel(buffer.getChannelData(channelIndex).slice(start, end + 1), channelIndex);
    }

    return trimmed;
  }

  private cropBuffer(buffer: AudioBuffer, trimStartMs?: number, trimEndMs?: number) {
    const hasStartTrim = trimStartMs != null && trimStartMs > 0;
    const hasEndTrim   = trimEndMs   != null && trimEndMs   > 0;

    if (!hasStartTrim && !hasEndTrim) {
      return buffer;
    }

    const context = this.context!;
    const startFrame = hasStartTrim
      ? Math.max(0, Math.floor((trimStartMs! / 1000) * buffer.sampleRate))
      : 0;
    const requestedEndFrame = hasEndTrim
      ? Math.floor((trimEndMs! / 1000) * buffer.sampleRate)
      : buffer.length;
    const endFrame = Math.min(buffer.length, Math.max(startFrame + 1, requestedEndFrame));
    const frameCount = endFrame - startFrame;
    const cropped = context.createBuffer(buffer.numberOfChannels, frameCount, buffer.sampleRate);

    for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
      cropped.copyToChannel(buffer.getChannelData(channelIndex).slice(startFrame, endFrame), channelIndex);
    }

    return cropped;
  }
}

export function noteColor(note: Note) {
  return NOTES.find((definition) => definition.note === note)?.color ?? '#ffffff';
}
