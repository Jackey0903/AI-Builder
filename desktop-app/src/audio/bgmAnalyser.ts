/**
 * BGM 主旋律提取器
 *
 * 流程：
 * 1. 用 Web Audio API 解码 BGM 音频文件（任意格式）
 * 2. 每 20ms 一帧，用 YIN 检测当前帧音高
 * 3. 将连续相同/相近音符合并，过滤掉静音和过短片段
 * 4. 输出 MelodyEvent[] 乐谱，供 playGeneratedMelody 直接使用
 */

import { detectPitch } from './pitchDetector';
import type { MelodyEvent, Note } from '../types';

/** 每帧时长（ms），影响时间分辨率 */
const FRAME_MS = 20;

/** 静音阈值（RMS），低于此值视为静音帧 */
const SILENCE_THRESHOLD = 0.005;

/** 合并音符时，相邻帧音名相同视为同一音符（忽略升降号细节） */
const NOTE_MERGE_WINDOW_MS = 60;

/** 过短音符（< 此时长）会被合并到相邻音符 */
const MIN_NOTE_MS = 100;

/** 最长单音时长，超过则截断（精灵声音样本有限） */
const MAX_NOTE_MS = 900;

/** 进度回调，返回 0~1 */
export type ProgressCallback = (progress: number) => void;

export interface AnalysisResult {
  /** 量化后的乐谱 */
  events: MelodyEvent[];
  /** 检测到的大调调式根音 */
  detectedRoot: Note;
  /** 原始帧序列（调试用） */
  rawFrames: Array<{ timeMs: number; note: string; freq: number; rms: number }>;
}

/**
 * 分析 URL 指向的 BGM 音频文件并提取主旋律
 * （用于服务器上已有的预设 BGM 文件）
 */
export async function analyseBgmFromUrl(
  url: string,
  onProgress?: ProgressCallback
): Promise<AnalysisResult> {
  onProgress?.(0.02);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`无法加载 BGM 文件：${url}`);
  const blob = await response.blob();
  const file = new File([blob], url.split('/').pop() ?? 'bgm');
  return analyseBgm(file, onProgress);
}

/**
 * 分析 File 对象（用户上传的 BGM 音频）并提取主旋律
 */
export async function analyseBgm(
  file: File,
  onProgress?: ProgressCallback
): Promise<AnalysisResult> {
  onProgress?.(0.05);

  // 1. 解码音频
  const arrayBuffer = await file.arrayBuffer();
  const offlineCtx = new OfflineAudioContext(1, 1, 44100); // 临时获取 sampleRate
  // 用普通 AudioContext 解码（OfflineAudioContext 不一定支持所有格式）
  const tempCtx = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await new Promise<AudioBuffer>((resolve, reject) => {
      tempCtx.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
    });
  } finally {
    void tempCtx.close();
  }
  void offlineCtx;

  onProgress?.(0.15);

  const sampleRate = decoded.sampleRate;
  // 取左声道（或单声道）
  const channelData = decoded.getChannelData(0);
  const frameSamples = Math.floor(sampleRate * FRAME_MS / 1000);

  // 2. 逐帧分析
  const rawFrames: AnalysisResult['rawFrames'] = [];
  const totalFrames = Math.floor(channelData.length / frameSamples);

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    const start = frameIndex * frameSamples;
    // YIN 窗口需要足够长（约 2048 样本），但我们每帧只步进 frameSamples
    const windowEnd = Math.min(start + Math.max(frameSamples * 4, 2048), channelData.length);
    const window = channelData.slice(start, windowEnd);

    // RMS 计算（只算 frameSamples 长度，避免被后续静音拉低）
    let rmsSum = 0;
    const rmsWindow = channelData.slice(start, start + frameSamples);
    for (let i = 0; i < rmsWindow.length; i++) rmsSum += rmsWindow[i] * rmsWindow[i];
    const rms = Math.sqrt(rmsSum / rmsWindow.length);

    const timeMs = (start / sampleRate) * 1000;

    if (rms < SILENCE_THRESHOLD) {
      rawFrames.push({ timeMs, note: 'silence', freq: 0, rms });
    } else {
      const pitch = detectPitch(window, sampleRate);
      if (pitch && pitch.confidence > 0.45) {
        rawFrames.push({ timeMs, note: pitch.note, freq: pitch.frequency, rms });
      } else {
        rawFrames.push({ timeMs, note: 'uncertain', freq: 0, rms });
      }
    }

    // 每 5% 报告一次进度
    if (frameIndex % Math.max(1, Math.floor(totalFrames / 20)) === 0) {
      onProgress?.(0.15 + 0.65 * (frameIndex / totalFrames));
    }
  }

  onProgress?.(0.80);

  // 3. 量化：将帧序列合并为音符事件
  const events = quantiseFrames(rawFrames);

  // 4. 检测调式根音（出现频率最高的音符）
  const detectedRoot = detectRoot(events);

  onProgress?.(1.0);

  return { events, detectedRoot, rawFrames };
}

/**
 * 将原始帧序列量化成 MelodyEvent[]
 */
function quantiseFrames(
  frames: AnalysisResult['rawFrames']
): MelodyEvent[] {
  if (!frames.length) return [];

  // Step A：合并连续相同音符帧（允许 ±1 帧的跳变容错）
  const segments: Array<{ note: string; startMs: number; endMs: number; maxRms: number }> = [];

  let currentNote = frames[0].note;
  let segStart = frames[0].timeMs;
  let segMaxRms = frames[0].rms;
  let uncertainCount = 0;

  for (let i = 1; i < frames.length; i++) {
    const frame = frames[i];

    if (frame.note === 'silence' || frame.note === 'uncertain') {
      uncertainCount++;
      // 超过 3 帧（60ms）的静音/不确定才真正断音
      if (uncertainCount > 3) {
        if (currentNote !== 'silence' && currentNote !== 'uncertain') {
          segments.push({ note: currentNote, startMs: segStart, endMs: frame.timeMs, maxRms: segMaxRms });
        }
        currentNote = frame.note;
        segStart = frame.timeMs;
        segMaxRms = frame.rms;
        uncertainCount = 0;
      }
      continue;
    }

    uncertainCount = 0;

    if (frame.note !== currentNote) {
      // 检查是否应该合并（当前段太短，可能是检测误差）
      const segDur = frame.timeMs - segStart;
      if (segDur < NOTE_MERGE_WINDOW_MS && segments.length > 0) {
        // 合并到上一段
        segments[segments.length - 1].endMs = frame.timeMs;
        currentNote = frame.note;
        segMaxRms = Math.max(segMaxRms, frame.rms);
        continue;
      }

      if (currentNote !== 'silence' && currentNote !== 'uncertain') {
        segments.push({ note: currentNote, startMs: segStart, endMs: frame.timeMs, maxRms: segMaxRms });
      }

      currentNote = frame.note;
      segStart = frame.timeMs;
      segMaxRms = frame.rms;
    } else {
      segMaxRms = Math.max(segMaxRms, frame.rms);
    }
  }

  // 结尾段
  const lastFrame = frames[frames.length - 1];
  if (currentNote !== 'silence' && currentNote !== 'uncertain') {
    segments.push({ note: currentNote, startMs: segStart, endMs: lastFrame.timeMs + FRAME_MS, maxRms: segMaxRms });
  }

  // Step B：过滤太短的音符，截断太长的音符
  const validNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const events: MelodyEvent[] = [];

  for (const seg of segments) {
    if (!validNotes.includes(seg.note)) continue;

    const duration = seg.endMs - seg.startMs;
    if (duration < MIN_NOTE_MS) continue;

    // 截断过长音符，分成多个
    let remaining = duration;
    while (remaining > 0) {
      const noteDur = Math.min(remaining, MAX_NOTE_MS);
      if (noteDur < MIN_NOTE_MS) break;

      // velocity 映射到 0.6~1.0
      const velocity = Math.min(1.0, 0.6 + seg.maxRms * 3);

      events.push({
        note: seg.note as Note,
        durationMs: Math.round(noteDur / 10) * 10, // 圆整到 10ms
        velocity: Math.round(velocity * 100) / 100
      });
      remaining -= noteDur;
    }
  }

  return events;
}

/**
 * 从乐谱事件中推断最可能的调式根音
 * 简单策略：出现次数最多的音符
 */
function detectRoot(events: MelodyEvent[]): Note {
  const counts: Partial<Record<Note, number>> = {};
  for (const event of events) {
    counts[event.note] = (counts[event.note] ?? 0) + 1;
  }

  let maxNote: Note = 'C';
  let maxCount = 0;
  for (const [note, count] of Object.entries(counts) as [Note, number][]) {
    if (count > maxCount) {
      maxCount = count;
      maxNote = note;
    }
  }

  return maxNote;
}
