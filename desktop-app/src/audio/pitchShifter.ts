/**
 * 离线音高移调（Pitch Shift without time stretch）
 *
 * 使用 SoundTouchJS（基于 SoundTouch C++ 库的 JS 移植）实现 WSOLA 算法。
 * 与 AudioBufferSourceNode.playbackRate 的区别：
 *   - playbackRate：同时改变音高和速度（升调→变快/变短，降调→变慢/变长）
 *   - 本模块：只改变音高，时长保持不变，音色"形态"不失真
 *
 * 调用时机：加载/录制完样本后离线预计算，playback 时直接用预计算好的 buffer。
 */

// @ts-expect-error soundtouchjs 无类型声明
import { SoundTouch, SimpleFilter, WebAudioBufferSource } from 'soundtouchjs';

/** 每批次从 SimpleFilter 抽取的帧数（帧 = 立体声采样对数） */
const EXTRACT_CHUNK = 8192;

/**
 * 将 AudioBuffer 做纯音高移调（不改变时长），返回新的 AudioBuffer。
 *
 * @param buffer   原始 AudioBuffer（单声道或双声道）
 * @param semitones  移调半音数，正数升调，负数降调（±6 以内效果最佳）
 * @param context  AudioContext，用于创建输出 buffer
 */
export async function pitchShiftBuffer(
  buffer: AudioBuffer,
  semitones: number,
  context: AudioContext
): Promise<AudioBuffer> {
  // 0 半音直接返回原 buffer，省略处理
  if (Math.abs(semitones) < 0.001) return buffer;

  const pitchMultiplier = Math.pow(2, semitones / 12);

  const st = new SoundTouch() as {
    pitch: number;
    tempo: number;
    rate: number;
  };
  st.pitch = pitchMultiplier;
  st.tempo = 1;   // 保持原速（WSOLA 模式，只改音高）
  st.rate  = 1;

  const source = new WebAudioBufferSource(buffer);
  const filter = new SimpleFilter(source, st) as {
    extract: (target: Float32Array, numFrames: number) => number;
  };

  // 用动态数组收集输出（soundtouch 输出帧数约等于输入帧数）
  const outLeft: number[]  = [];
  const outRight: number[] = [];
  const chunk = new Float32Array(EXTRACT_CHUNK * 2); // 交织立体声

  let extracted: number;
  // 最多允许抽 ceil(buffer.length/EXTRACT_CHUNK) + 8 次，防止死循环
  const maxIter = Math.ceil(buffer.length / EXTRACT_CHUNK) + 8;
  let iter = 0;
  do {
    chunk.fill(0);
    extracted = filter.extract(chunk, EXTRACT_CHUNK);
    for (let i = 0; i < extracted; i++) {
      outLeft.push(chunk[i * 2]);
      outRight.push(chunk[i * 2 + 1]);
    }
    iter++;
  } while (extracted > 0 && iter < maxIter);

  const outLen = outLeft.length;
  if (outLen === 0) {
    // SoundTouch 未产生输出（buffer 太短或格式异常），回退到 OfflineAudioContext playbackRate 方式
    // 注意：此回退会改变时长，但至少保证音高正确（不会与其他键同音）
    console.warn(`[pitchShiftBuffer] SoundTouch produced 0 frames for shift=${semitones} (buffer=${buffer.duration.toFixed(3)}s, ${buffer.length} frames). Falling back to playbackRate.`);
    return pitchShiftByPlaybackRate(buffer, pitchMultiplier, context);
  }

  // 输出为单声道（取左声道；原本就是单声道采样）
  const outBuffer = context.createBuffer(1, outLen, buffer.sampleRate);
  outBuffer.copyToChannel(new Float32Array(outLeft), 0);

  return outBuffer;
}

/**
 * 回退方案：用 OfflineAudioContext + playbackRate 实现音高移调（会改变时长）。
 * 仅在 SoundTouch WSOLA 无法处理时使用（极短 buffer 等边界情况）。
 */
async function pitchShiftByPlaybackRate(
  buffer: AudioBuffer,
  pitchMultiplier: number,
  context: AudioContext
): Promise<AudioBuffer> {
  const outLength = Math.ceil(buffer.length / pitchMultiplier);
  const offlineCtx = new OfflineAudioContext(1, outLength, buffer.sampleRate);
  const src = offlineCtx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = pitchMultiplier;
  src.connect(offlineCtx.destination);
  src.start(0);
  return offlineCtx.startRendering();
}

/**
 * 为一个 AudioBuffer 预生成一组音高变体。
 *
 * 默认范围 -12..+12（25 步），覆盖 7 音阶中任意根音与任意 baseSemitoneOffset 的组合。
 * 例：恶魔叮 baseSemitoneOffset=9（A），根音 C 时 C 键 shift=-9，需要 -12 才能命中缓存。
 *
 * @param buffer   原始 buffer
 * @param semitoneRange  生成的半音范围，默认 [-12, -11, ..., +12]（25 个）
 * @param context  AudioContext
 * @param onProgress  进度回调 (done: number, total: number)
 * @returns  Map<semitones, AudioBuffer>，其中 0 即为原始 buffer
 */
export async function buildPitchVariants(
  buffer: AudioBuffer,
  context: AudioContext,
  semitoneRange: number[] = Array.from({ length: 25 }, (_, i) => i - 12),
  onProgress?: (done: number, total: number) => void
): Promise<Map<number, AudioBuffer>> {
  const result = new Map<number, AudioBuffer>();

  for (let i = 0; i < semitoneRange.length; i++) {
    const st = semitoneRange[i];
    result.set(st, await pitchShiftBuffer(buffer, st, context));
    onProgress?.(i + 1, semitoneRange.length);
    // 每步让出事件循环，防止 UI 卡死
    await yieldToMain();
  }

  return result;
}

/** 让出主线程一帧（避免长时间占用 JS 线程导致 UI 卡顿） */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
