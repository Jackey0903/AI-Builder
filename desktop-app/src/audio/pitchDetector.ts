/**
 * YIN 音高检测算法（浏览器端 Web Audio API 版本）
 *
 * 原理：YIN 通过计算差分函数的累计归一化值来找到基频周期，
 * 比 FFT 方法更准确，不容易误检谐波。
 */

/** 音符频率表（C4 = 261.63Hz，仅考虑 C2-C7） */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export interface PitchResult {
  /** 检测到的频率（Hz），0 表示静音或无法确定 */
  frequency: number;
  /** MIDI 音符编号（69 = A4） */
  midiNote: number;
  /** 最近的音名（如 'C'、'D#'） */
  noteName: (typeof NOTE_NAMES)[number];
  /** 音名在 C4-B4 范围内归一化后的 Note 枚举值（用于引擎路由） */
  note: string;
  /** 距最近音名的音分偏差（-50 ~ +50） */
  cents: number;
  /** 置信度（0~1），越高越可靠 */
  confidence: number;
}

/**
 * 对一段 PCM 样本（-1~1 归一化 float32）运行 YIN 算法。
 *
 * @param samples  单声道 PCM 样本数组
 * @param sampleRate  采样率（Hz）
 * @param threshold  YIN 阈值（0.10~0.15 为常用值；越小越保守）
 */
export function detectPitch(
  samples: Float32Array,
  sampleRate: number,
  threshold = 0.12
): PitchResult | null {
  const minHz = 80;   // 人声/动物最低基频
  const maxHz = 1200; // 洛克精灵叫声通常不超过 1200Hz

  const minTau = Math.floor(sampleRate / maxHz);
  const maxTau = Math.min(Math.floor(sampleRate / minHz), Math.floor(samples.length / 2) - 1);

  if (maxTau <= minTau) return null;

  const windowSize = Math.min(2048, Math.floor(samples.length / 2) - maxTau);
  if (windowSize < 64) return null;

  // === Step 1: 差分函数 d(tau) ===
  const d = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      const diff = samples[j] - samples[j + tau];
      sum += diff * diff;
    }
    d[tau] = sum;
  }

  // === Step 2: 累计归一化差分函数 d'(tau) ===
  const cmndf = new Float32Array(maxTau + 1);
  cmndf[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    runningSum += d[tau];
    cmndf[tau] = runningSum > 0 ? (d[tau] * tau) / runningSum : 1;
  }

  // === Step 3: 找第一个低于阈值的谷值 ===
  let bestTau = -1;
  let bestVal = Infinity;

  for (let tau = minTau; tau < maxTau; tau++) {
    if (cmndf[tau] < threshold) {
      // 找本地最小值
      while (tau + 1 < maxTau && cmndf[tau + 1] < cmndf[tau]) {
        tau++;
      }
      bestTau = tau;
      bestVal = cmndf[tau];
      break;
    }
  }

  // 没找到阈值以下的谷，取全局最小
  if (bestTau < 0) {
    for (let tau = minTau; tau < maxTau; tau++) {
      if (cmndf[tau] < bestVal) {
        bestVal = cmndf[tau];
        bestTau = tau;
      }
    }
    // 全局最小也不够可信
    if (bestVal > 0.3) return null;
  }

  // === Step 4: 抛物线插值，提高精度 ===
  let refinedTau = bestTau;
  if (bestTau > 0 && bestTau < maxTau) {
    const s0 = cmndf[bestTau - 1];
    const s1 = cmndf[bestTau];
    const s2 = cmndf[bestTau + 1];
    const denom = s0 - 2 * s1 + s2;
    if (denom !== 0) {
      refinedTau = bestTau + 0.5 * (s0 - s2) / denom;
    }
  }

  const frequency = sampleRate / refinedTau;
  const confidence = Math.max(0, 1 - bestVal);

  return frequencyToResult(frequency, confidence);
}

/** 将频率映射为音符信息 */
function frequencyToResult(frequency: number, confidence: number): PitchResult {
  // MIDI note: A4=440Hz → MIDI 69
  const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69);
  const midiExact = 12 * Math.log2(frequency / 440) + 69;
  const cents = Math.round((midiExact - midiNote) * 100);

  const noteIndex = ((midiNote % 12) + 12) % 12;
  const noteName = NOTE_NAMES[noteIndex];

  // 映射到 C4-B4 区间的 note 名（去掉升降号，引擎只认 C/D/E/F/G/A/B）
  const diatonicMap: Record<string, string> = {
    'C': 'C', 'C#': 'C', 'D': 'D', 'D#': 'D',
    'E': 'E', 'F': 'F', 'F#': 'F',
    'G': 'G', 'G#': 'G', 'A': 'A', 'A#': 'A', 'B': 'B'
  };

  return {
    frequency,
    midiNote,
    noteName,
    note: diatonicMap[noteName] ?? 'C',
    cents,
    confidence
  };
}
