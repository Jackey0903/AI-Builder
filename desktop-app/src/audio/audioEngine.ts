import { NOTES, noteByName } from '../data/notes';
import type { Note } from '../types';

const MASTER_GAIN = 0.82;

export interface SampleOptions {
  baseNote?: Note;
  trimStartMs?: number;
  trimEndMs?: number;
  gain?: number;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private baseSample: AudioBuffer | null = null;
  private baseNote: Note = 'C';
  private sampleGain = 1;

  async ensureContext() {
    if (!this.context) {
      this.context = new AudioContext();
    }

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    return this.context;
  }

  hasSample() {
    return Boolean(this.baseSample);
  }

  async setSample(blob: Blob, options: SampleOptions = {}) {
    const context = await this.ensureContext();
    const arrayBuffer = await blob.arrayBuffer();
    const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
    const autoTrimmed = this.trimBuffer(decoded, 0.015);
    this.baseSample = this.cropBuffer(autoTrimmed, options.trimStartMs, options.trimEndMs);
    this.baseNote = options.baseNote ?? 'C';
    this.sampleGain = options.gain ?? 1;
  }

  async loadSampleFromUrl(url: string, options: SampleOptions = {}) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Could not load sample: ${url}`);
    }

    await this.setSample(await response.blob(), options);
  }

  getSampleDuration() {
    return this.baseSample?.duration ?? 0;
  }

  async playNote(note: Note, durationMs = 520, velocity = 1) {
    const context = await this.ensureContext();
    const definition = noteByName.get(note);

    if (!definition) return;

    if (!this.baseSample) {
      this.playFallbackTone(context, definition.frequency, durationMs, velocity);
      return;
    }

    const source = context.createBufferSource();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const baseDefinition = noteByName.get(this.baseNote) ?? noteByName.get('C')!;
    const ratio = Math.pow(2, (definition.semitoneOffset - baseDefinition.semitoneOffset) / 12);

    source.buffer = this.baseSample;
    source.playbackRate.value = ratio;

    filter.type = 'lowpass';
    filter.frequency.value = 6800;
    filter.Q.value = 0.2;

    const now = context.currentTime;
    const attack = 0.012;
    const release = 0.12;
    const sustainSeconds = Math.min(durationMs / 1000, Math.max(0.12, this.baseSample.duration / ratio));

    gain.gain.setValueAtTime(0.0001, now);
    const targetGain = MASTER_GAIN * velocity * this.sampleGain;
    gain.gain.exponentialRampToValueAtTime(targetGain, now + attack);
    gain.gain.setValueAtTime(targetGain, now + Math.max(attack, sustainSeconds - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + sustainSeconds);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(now);
    source.stop(now + sustainSeconds + 0.04);
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
    if (!trimStartMs && !trimEndMs) {
      return buffer;
    }

    const context = this.context!;
    const startFrame = Math.max(0, Math.floor(((trimStartMs ?? 0) / 1000) * buffer.sampleRate));
    const requestedEndFrame =
      typeof trimEndMs === 'number' ? Math.floor((trimEndMs / 1000) * buffer.sampleRate) : buffer.length;
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
