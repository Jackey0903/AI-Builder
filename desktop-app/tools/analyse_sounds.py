#!/usr/bin/env python3
"""
音色库素材分析工具
=================
对 public/sounds/ 下的 WAV 文件批量执行：
  1. 静音去头（VAD）
  2. 高精度音高检测（librosa YIN）
  3. 输出推荐的 baseSemitoneOffset / trimStartMs / trimEndMs
  4. 可选：将裁剪后的素材保存为 *_trimmed.wav

用法：
    python3 tools/analyse_sounds.py [WAV文件或目录] [--save-trimmed]

示例：
    python3 tools/analyse_sounds.py public/sounds/猴麦仔/猴麦仔采样.wav
    python3 tools/analyse_sounds.py public/sounds/ --save-trimmed
"""

import sys
import os
import argparse
import math
import glob

import numpy as np
import librosa
import soundfile as sf

# ── 参数 ──────────────────────────────────────────────────────────────────────
SILENCE_THRESHOLD_DB = -40   # 低于此分贝视为静音（去头用）
PADDING_MS = 30              # 去头后保留的过渡 padding（ms）
YIN_FMIN = 60                # 音高检测最低频率（Hz）
YIN_FMAX = 1400              # 音高检测最高频率（Hz）
CONFIDENCE_THRESHOLD = 0.5   # YIN 置信度阈值，低于此值标记为不可靠
ANALYSIS_SEGMENT_MS = 200    # 用于音高分析的中段长度（ms）

NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def freq_to_midi(freq: float) -> float:
    """频率 → MIDI 音符号（A4=440Hz=69）"""
    return 12 * math.log2(freq / 440) + 69


def midi_to_note_name(midi: float) -> str:
    note_idx = int(round(midi)) % 12
    octave   = int(round(midi)) // 12 - 1
    return f"{NOTE_NAMES[note_idx]}{octave}"


def midi_semitone_offset(midi: float) -> int:
    """MIDI → 引擎 baseSemitoneOffset（0~11，与 soundLibrary.ts 体系一致）"""
    return int(round(midi)) % 12


def detect_voice_start(y: np.ndarray, sr: int) -> int:
    """
    用帧级 RMS 检测发声起点，返回起点样本索引。
    类似 webrtcvad 的简化版，无需额外依赖。
    """
    frame_len   = int(sr * 0.010)  # 10ms 帧
    hop_len     = frame_len // 2
    threshold   = 10 ** (SILENCE_THRESHOLD_DB / 20)

    for i in range(0, len(y) - frame_len, hop_len):
        rms = np.sqrt(np.mean(y[i:i + frame_len] ** 2))
        if rms > threshold:
            padding = int(sr * PADDING_MS / 1000)
            return max(0, i - padding)
    return 0


def detect_voice_end(y: np.ndarray, sr: int) -> int:
    """检测有声结尾，返回终点样本索引（从后向前扫）"""
    frame_len = int(sr * 0.010)
    hop_len   = frame_len // 2
    threshold = 10 ** (SILENCE_THRESHOLD_DB / 20)

    for i in range(len(y) - frame_len, 0, -hop_len):
        rms = np.sqrt(np.mean(y[i:i + frame_len] ** 2))
        if rms > threshold:
            padding = int(sr * PADDING_MS / 1000)
            return min(len(y), i + frame_len + padding)
    return len(y)


def analyse_file(wav_path: str, save_trimmed: bool = False) -> dict:
    print(f"\n{'='*60}")
    print(f"  分析：{os.path.basename(wav_path)}")
    print(f"{'='*60}")

    # 1. 加载（混为单声道，统一 22050Hz 用于 YIN）
    y_full, sr_orig = librosa.load(wav_path, sr=None, mono=True)
    duration_ms = len(y_full) / sr_orig * 1000
    print(f"  原始时长：{duration_ms:.0f}ms  采样率：{sr_orig}Hz")

    # 2. VAD 去头去尾
    start_sample = detect_voice_start(y_full, sr_orig)
    end_sample   = detect_voice_end(y_full, sr_orig)
    trim_start_ms = round(start_sample / sr_orig * 1000)
    trim_end_ms   = round(end_sample   / sr_orig * 1000)

    y_trimmed = y_full[start_sample:end_sample]
    trimmed_ms = len(y_trimmed) / sr_orig * 1000
    print(f"  去头去尾：trimStartMs={trim_start_ms}ms  trimEndMs={trim_end_ms}ms  → 有效 {trimmed_ms:.0f}ms")

    # 3. 音高检测（取中段最稳定的 ANALYSIS_SEGMENT_MS）
    y_analysis = librosa.resample(y_trimmed, orig_sr=sr_orig, target_sr=22050)
    sr_yin = 22050
    seg_samples = int(sr_yin * ANALYSIS_SEGMENT_MS / 1000)

    # 多帧采样投票，取置信度最高帧
    offsets = [0.10, 0.25, 0.40, 0.55, 0.70]
    best_freq   = None
    best_conf   = 0.0

    for ratio in offsets:
        start = int(len(y_analysis) * ratio)
        end   = min(len(y_analysis), start + seg_samples)
        if end - start < 512:
            continue
        segment = y_analysis[start:end]
        f0, voiced_flag, voiced_prob = librosa.pyin(
            segment,
            fmin=YIN_FMIN,
            fmax=YIN_FMAX,
            sr=sr_yin,
            frame_length=2048,
        )
        # 取置信度最高的有效帧
        valid_mask = voiced_flag & ~np.isnan(f0)
        if not np.any(valid_mask):
            continue
        probs = voiced_prob[valid_mask]
        freqs = f0[valid_mask]
        best_idx = np.argmax(probs)
        if probs[best_idx] > best_conf:
            best_conf = probs[best_idx]
            best_freq = freqs[best_idx]

    if best_freq is None or best_conf < CONFIDENCE_THRESHOLD:
        print(f"  ⚠️  音高检测不可靠（置信度={best_conf:.2f}），建议手动核查")
        midi_exact    = None
        note_name     = "N/A"
        semitone_off  = None
    else:
        midi_exact    = freq_to_midi(best_freq)
        midi_rounded  = round(midi_exact)
        cents_off     = round((midi_exact - midi_rounded) * 100)
        note_name     = midi_to_note_name(midi_exact)
        semitone_off  = midi_semitone_offset(midi_exact)
        print(f"  音高：{best_freq:.1f}Hz → {note_name}  MIDI={midi_rounded}  cents偏差={cents_off:+d}")
        print(f"  推荐 baseSemitoneOffset = {semitone_off}  （置信度 {best_conf:.0%}）")

    # 4. 可选保存裁剪后的文件
    if save_trimmed and len(y_trimmed) > 0:
        base, ext = os.path.splitext(wav_path)
        out_path = f"{base}_trimmed{ext}"
        sf.write(out_path, y_trimmed, sr_orig)
        print(f"  已保存裁剪版：{os.path.basename(out_path)}")

    result = {
        "file":               os.path.basename(wav_path),
        "duration_ms":        round(duration_ms),
        "trim_start_ms":      trim_start_ms,
        "trim_end_ms":        trim_end_ms,
        "trimmed_ms":         round(trimmed_ms),
        "frequency":          round(best_freq, 1) if best_freq else None,
        "note_name":          note_name,
        "midi_note":          round(midi_exact) if midi_exact else None,
        "baseSemitoneOffset": semitone_off,
        "confidence":         round(best_conf, 2),
    }
    return result


def collect_wav_files(path: str) -> list[str]:
    if os.path.isfile(path):
        return [path]
    results = []
    for root, _dirs, files in os.walk(path):
        for f in files:
            if f.lower().endswith(".wav"):
                results.append(os.path.join(root, f))
    # 排除伴奏、预设乐曲等非音色文件（只对文件名和直接父目录名判断，避免路径中的汉字误伤）
    skip_keywords = ["伴奏", "bgm", "BGM", "预设", "合奏", "_trimmed"]
    def should_skip(full_path: str) -> bool:
        fname  = os.path.basename(full_path)
        parent = os.path.basename(os.path.dirname(full_path))
        return any(k in fname or k in parent for k in skip_keywords)
    return sorted(f for f in results if not should_skip(f))


def print_summary(results: list[dict]):
    print(f"\n{'='*60}")
    print("  汇总（可直接对照 soundLibrary.ts 更新参数）")
    print(f"{'='*60}")
    print(f"  {'文件':<28} {'时长':>7} {'有效':>7} {'trimStart':>9} {'trimEnd':>8} {'音名':<6} {'semOffset':>9} {'置信度':>7}")
    print(f"  {'-'*85}")
    for r in results:
        conf_str = f"{r['confidence']:.0%}" if r['confidence'] else "N/A"
        sem_str  = str(r['baseSemitoneOffset']) if r['baseSemitoneOffset'] is not None else "N/A"
        print(f"  {r['file']:<28} {r['duration_ms']:>6}ms {r['trimmed_ms']:>6}ms "
              f"{r['trim_start_ms']:>8}ms {r['trim_end_ms']:>7}ms "
              f"{r['note_name']:<6} {sem_str:>9} {conf_str:>7}")


def main():
    parser = argparse.ArgumentParser(description="音色库素材批量分析")
    parser.add_argument("path", nargs="?",
                        default="public/sounds",
                        help="WAV 文件路径或目录（默认 public/sounds）")
    parser.add_argument("--save-trimmed", action="store_true",
                        help="将去头去尾后的文件保存为 *_trimmed.wav")
    args = parser.parse_args()

    # 路径解析：绝对路径直接用；相对路径依次尝试 cwd / 脚本实际所在的 desktop-app/
    # __file__ 可能是相对路径，用 sys.argv[0] 的绝对形式更可靠
    script_abs  = os.path.realpath(sys.argv[0])
    desktop_app = os.path.dirname(os.path.dirname(script_abs))  # tools/../ = desktop-app/

    if os.path.isabs(args.path):
        target = args.path
    else:
        candidates = [
            os.path.join(os.getcwd(), args.path),
            os.path.join(desktop_app, args.path),
        ]
        target = next((c for c in candidates if os.path.exists(c)), candidates[0])

    wav_files = collect_wav_files(target)
    if not wav_files:
        print(f"未找到 WAV 文件：{target}")
        sys.exit(1)

    print(f"共找到 {len(wav_files)} 个音色素材文件")

    results = []
    for wav in wav_files:
        try:
            r = analyse_file(wav, save_trimmed=args.save_trimmed)
            results.append(r)
        except Exception as exc:
            print(f"  ✗ 处理失败：{exc}")

    if results:
        print_summary(results)


if __name__ == "__main__":
    main()
