import { NOTES, noteByName } from '../data/notes';
import { detectPitch } from './pitchDetector';
import { buildPitchVariants } from './pitchShifter';
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
  /** 录音后是否自动检测音高并去除头部静音，默认 true（仅对录音有效） */
  autoDetect?: boolean;
}

/** 自动分析结果（供调用方展示提示） */
export interface AutoDetectResult {
  /** 检测到的频率（Hz） */
  frequency: number;
  /** 最近音名（如 'A#'） */
  noteName: string;
  /** MIDI 音符号 */
  midiNote: number;
  /** 写入样本的绝对半音偏移 */
  baseSemitoneOffset: number;
  /** 置信度 0~1 */
  confidence: number;
  /** 去头后有效时长（秒） */
  trimmedDuration: number;
}

interface LoadedSampleLayer {
  id: string;
  name: string;
  buffer: AudioBuffer;
  baseNote: Note;
  baseSemitoneOffset?: number;
  gain: number;
  role?: SoundSampleLayer['role'];
  /** 所属 preset 分组 id，合奏时按组各选一层 */
  presetGroupId?: string;
}

interface SelectedSampleLayer {
  sample: LoadedSampleLayer;
  baseSemitone: number;
}

/** 进度回调：已完成步骤数、总步骤数 */
export type PitchBuildProgress = (done: number, total: number) => void;

export class AudioEngine {
  private context: AudioContext | null = null;
  private sampleLayers: LoadedSampleLayer[] = [];
  /** 合奏模式：每个 presetGroupId 各出一层同时发声 */
  ensembleMode = false;
  private backingSource: AudioBufferSourceNode | null = null;
  private backingGain: GainNode | null = null;
  /** 当前预览源（点击 chip 时短暂试听原音，新预览自动打断上一个） */
  private previewSource: AudioBufferSourceNode | null = null;
  /**
   * 预计算的音高变体缓存。
   * 外层 key = 层 id；内层 key = 相对半音偏移（baseSemitoneOffset 的增量，-6~+6）。
   * 播放时按 (目标半音 - 基准半音) 查表，命中则 playbackRate=1（零失真）。
   */
  private pitchCache = new Map<string, Map<number, AudioBuffer>>();

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

  async setSample(
    blob: Blob,
    options: SampleOptions = {},
    onProgress?: PitchBuildProgress
  ): Promise<AutoDetectResult | null> {
    const context = await this.ensureContext();
    const arrayBuffer = await blob.arrayBuffer();
    const decoded = await this.decodeArrayBuffer(context, arrayBuffer);

    const autoDetect = options.autoDetect !== false;

    // ── 自动去头：移除头部静音（阈值 0.015），保留约 40ms padding ──
    const trimmed = autoDetect
      ? this.trimBuffer(decoded, 0.015)
      : this.cropBuffer(decoded, options.trimStartMs, options.trimEndMs);

    // ── 自动音高检测 ──
    let detectResult: AutoDetectResult | null = null;
    let baseSemitoneOffset = options.baseSemitoneOffset;

    if (autoDetect && baseSemitoneOffset == null) {
      const sampleRate = trimmed.sampleRate;
      const channelData = trimmed.getChannelData(0);

      // 多帧投票：把有效音频分成若干段分别检测，取置信度最高的结果
      // 避免单帧碰到爆破音/噪声导致误判
      const totalSamples = channelData.length;
      const segmentSize = Math.min(8192, Math.floor(totalSamples / 3));
      const offsets = [0.10, 0.25, 0.40, 0.55].map((r) =>
        Math.min(Math.floor(totalSamples * r), totalSamples - segmentSize)
      );

      let bestPitch = null;
      let bestConfidence = 0;

      for (const offset of offsets) {
        if (offset < 0) continue;
        const window = channelData.slice(offset, offset + segmentSize);
        const pitch = detectPitch(window, sampleRate, 0.10);
        if (pitch && pitch.confidence > bestConfidence) {
          bestConfidence = pitch.confidence;
          bestPitch = pitch;
        }
      }

      if (bestPitch && bestConfidence > 0.35) {
        // 映射到 0~11 半音偏移（与音色库 baseSemitoneOffset 体系一致）
        // midiNote % 12：C=0, C#=1, D=2 … B=11
        const semitone = ((bestPitch.midiNote % 12) + 12) % 12;
        baseSemitoneOffset = semitone;
        detectResult = {
          frequency: bestPitch.frequency,
          noteName: bestPitch.noteName,
          midiNote: bestPitch.midiNote,
          baseSemitoneOffset: semitone,
          confidence: bestConfidence,
          trimmedDuration: trimmed.duration
        };
      }
    }

    const layerId = options.id ?? 'recorded';
    const newLayer: LoadedSampleLayer = {
      id: layerId,
      name: options.name ?? '录音样本',
      buffer: trimmed,
      baseNote: options.baseNote ?? 'C',
      baseSemitoneOffset,
      gain: options.gain ?? 1,
      role: options.role ?? 'single',
      presetGroupId: options.id  // id 即为 preset 分组键
    };
    // 合奏模式下追加；普通模式下覆写
    this.sampleLayers = this.ensembleMode
      ? [...this.sampleLayers, newLayer]
      : [newLayer];

    // 离线预计算 -6~+6 音高变体（进度通过 onProgress 回调上报）
    if (onProgress) {
      const variants = await buildPitchVariants(trimmed, context, undefined, onProgress);
      this.pitchCache.set(layerId, variants);
    }

    return detectResult;
  }

  async loadSampleFromUrl(
    url: string,
    options: SampleOptions = {},
    onProgress?: PitchBuildProgress
  ) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Could not load sample: ${url}`);
    }

    await this.setSample(await response.blob(), options, onProgress);
  }

  async loadSampleSet(
    samples: SoundSampleLayer[],
    presetGroupId?: string,
    onProgress?: PitchBuildProgress
  ) {
    const context = await this.ensureContext();
    const loaded: LoadedSampleLayer[] = [];

    for (const sample of samples) {
      const response = await fetch(sample.file);
      if (!response.ok) {
        throw new Error(`Could not load sample: ${sample.file}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const decoded = await this.decodeArrayBuffer(context, arrayBuffer);
      const cropped = this.cropBuffer(decoded, sample.trimStartMs, sample.trimEndMs);

      loaded.push({
        id: sample.id,
        name: sample.name,
        buffer: cropped,
        baseNote: sample.baseNote,
        baseSemitoneOffset: sample.baseSemitoneOffset,
        gain: sample.gain ?? 1,
        role: sample.role,
        presetGroupId
      });

      // 预计算该层的音高变体
      if (onProgress) {
        const variants = await buildPitchVariants(cropped, context, undefined, onProgress);
        this.pitchCache.set(sample.id, variants);
      }
    }

    this.sampleLayers = [...this.sampleLayers, ...loaded];
  }

  /** 合奏加载：先清空（含预计算缓存），再逐个 preset 追加，并开启合奏模式 */
  clearSampleLayers() {
    this.sampleLayers = [];
    this.pitchCache.clear();
  }

  /**
   * 试听预览：直接播放原始文件（不经音高移调），最长 maxDurationMs 毫秒。
   * 若上一个预览仍在播放，自动打断再开新的。
   */
  async previewSound(url: string, maxDurationMs = 1500) {
    const context = await this.ensureContext();

    // 打断上一个预览
    if (this.previewSource) {
      try { this.previewSource.stop(); } catch { /* 已自然结束 */ }
      this.previewSource = null;
    }

    const response = await fetch(url);
    if (!response.ok) return;

    const decoded = await this.decodeArrayBuffer(context, await response.arrayBuffer());
    const source = context.createBufferSource();
    const gain = context.createGain();

    source.buffer = decoded;

    const now = context.currentTime;
    const duration = Math.min(decoded.duration, maxDurationMs / 1000);
    const fadeIn  = 0.015;
    const fadeOut = Math.min(0.12, duration * 0.2);
    const peakGain = 0.72;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + fadeIn);
    gain.gain.setValueAtTime(peakGain, now + Math.max(fadeIn, duration - fadeOut));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(gain);
    gain.connect(context.destination);
    source.start(now);
    source.stop(now + duration + 0.02);

    this.previewSource = source;
    source.onended = () => {
      if (this.previewSource === source) this.previewSource = null;
    };
  }

  getSampleDuration() {
    return Math.max(0, ...this.sampleLayers.map((sample) => sample.buffer.duration));
  }

  async playBackingTrack(
    url: string,
    options: { gain?: number; startMs?: number; loop?: boolean } = {}
  ) {
    const context = await this.ensureContext();
    this.stopBackingTrack(0);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Could not load backing track: ${url}`);
    }

    const decoded = await this.decodeArrayBuffer(context, await response.arrayBuffer());
    const source = context.createBufferSource();
    const gainNode = context.createGain();
    const now = context.currentTime;
    const startSeconds = ((options.startMs ?? 0) / 1000) % Math.max(decoded.duration, 0.001);

    source.buffer = decoded;
    source.loop = options.loop ?? true;
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, options.gain ?? 0.16), now + 0.18);

    source.connect(gainNode);
    gainNode.connect(context.destination);
    source.start(now, startSeconds);

    this.backingSource = source;
    this.backingGain = gainNode;
  }

  stopBackingTrack(fadeMs = 360) {
    if (!this.context || !this.backingSource || !this.backingGain) return;

    const source = this.backingSource;
    const gain = this.backingGain;
    const now = this.context.currentTime;
    const fadeSeconds = Math.max(0, fadeMs / 1000);

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds);

    try {
      source.stop(now + fadeSeconds + 0.02);
    } catch {
      // Source may already be stopped by the browser if the buffer ended.
    }

    this.backingSource = null;
    this.backingGain = null;
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

    const layers = this.ensembleMode
      ? this.pickEnsembleLayers(targetSemitone)
      : [this.pickClosestSample(targetSemitone)];

    const attack        = 0.012;
    const release       = 0.12;
    const ensembleScale = 1 / Math.sqrt(Math.max(1, layers.length));

    for (const selectedLayer of layers) {
      const ratio = Math.pow(2, (targetSemitone - selectedLayer.baseSemitone) / 12);
      const naturalDuration = selectedLayer.sample.buffer.duration / ratio;
      const sustainSeconds = Math.min(durationMs / 1000, Math.max(0.12, naturalDuration));
      this.playLayerNote(context, selectedLayer, ratio, sustainSeconds, velocity, attack, release, 1, ensembleScale);
    }
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

    const layers = this.ensembleMode
      ? this.pickEnsembleLayers(targetSemitone)
      : [this.pickClosestSample(targetSemitone)];

    const attack        = 0.003;
    const crossfade     = 0.080;
    const sustainSeconds  = Math.max(durationMs / 1000, 0.05);
    const ensembleScale = 1 / Math.sqrt(Math.max(1, layers.length));

    for (const selectedLayer of layers) {
      const ratio = Math.pow(2, (targetSemitone - selectedLayer.baseSemitone) / 12);
      const naturalDuration = selectedLayer.sample.buffer.duration / ratio;
      const stretchFactor = naturalDuration < sustainSeconds
        ? Math.max(naturalDuration / sustainSeconds, 0.125)
        : 1;
      this.playLayerNote(context, selectedLayer, ratio, sustainSeconds, velocity, attack, crossfade, stretchFactor, ensembleScale);
    }
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

  /**
   * 合奏模式：按 presetGroupId 分组，每组各选最近音高的一层返回。
   * 若某层没有 presetGroupId，视为独立的一组（id 用自身 id）。
   */
  private pickEnsembleLayers(targetSemitone: number): SelectedSampleLayer[] {
    const groups = new Map<string, LoadedSampleLayer[]>();
    for (const layer of this.sampleLayers) {
      const key = layer.presetGroupId ?? layer.id;
      const group = groups.get(key) ?? [];
      group.push(layer);
      groups.set(key, group);
    }

    const result: SelectedSampleLayer[] = [];
    for (const layers of groups.values()) {
      const best = layers.reduce<SelectedSampleLayer>((acc, sample) => {
        const baseSemitone = this.bestPlayableBaseSemitone(sample, targetSemitone);
        const score = this.pitchShiftScore(targetSemitone, baseSemitone);
        const bestScore = this.pitchShiftScore(targetSemitone, acc.baseSemitone);
        return score < bestScore ? { sample, baseSemitone } : acc;
      }, {
        sample: layers[0],
        baseSemitone: this.bestPlayableBaseSemitone(layers[0], targetSemitone)
      });
      result.push(best);
    }
    return result;
  }

  /** 合奏模式下播放单个音节（所有 preset 组同时发声） */
  private playLayerNote(
    context: AudioContext,
    layer: SelectedSampleLayer,
    ratio: number,
    sustainSeconds: number,
    velocity: number,
    attack: number,
    release: number,
    stretchFactor = 1,
    /** 合奏等功率归一化系数：1/√(层数)，单层时传 1 */
    ensembleScale = 1
  ) {
    const source = context.createBufferSource();
    const gain   = context.createGain();
    const filter = context.createBiquadFilter();

    // ── 预计算缓存命中：找最近整数半音变体，残余差距用 playbackRate 微调 ──
    // 这样整数部分音质完美，非整数残余（最多 ±0.5 半音）几乎不可感知
    const semitoneShift = Math.log2(ratio) * 12; // ratio → 半音数（含小数）
    const roundedShift  = Math.round(semitoneShift);
    const residualRatio = ratio / Math.pow(2, roundedShift / 12); // 残余 ratio（≈1.0）

    const cached = this.pitchCache.get(layer.sample.id)?.get(roundedShift);
    if (cached) {
      // 命中：用预移调 buffer，playbackRate 仅做微残余补偿（几乎 =1）
      source.buffer = cached;
      source.playbackRate.value = residualRatio * stretchFactor;
      if (stretchFactor < 1) {
        source.detune.value = -1200 * Math.log2(stretchFactor);
      }
    } else {
      // 未命中（未预计算或超出 ±6 范围）：回退到原始 playbackRate 方式
      source.buffer = layer.sample.buffer;
      source.playbackRate.value = ratio * stretchFactor;
      if (stretchFactor < 1) {
        source.detune.value = -1200 * Math.log2(stretchFactor);
      }
    }

    filter.type = 'lowpass';
    filter.frequency.value = 6800;
    filter.Q.value = 0.2;

    const now = context.currentTime;
    // 等功率混合：N 层时每层乘以 1/√N，防止多层叠加超载
    const targetGain = MASTER_GAIN * velocity * layer.sample.gain * ensembleScale;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(targetGain, now + attack);
    gain.gain.setValueAtTime(targetGain, now + Math.max(attack, sustainSeconds - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + sustainSeconds);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(now);
    source.stop(now + sustainSeconds + 0.04);
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
