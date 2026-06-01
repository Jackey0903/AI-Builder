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
CONFIDENCE_THRESHOLD = 0.5   # YIN 置信度阈值，低于此值启用 FFT fallback
FFT_FALLBACK_THRESHOLD = 0.3 # 低于此置信度连 FFT 结果也标注为不可靠
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


# ── FFT 谱峰检测 ──────────────────────────────────────────────────────────────

def fft_peak_pitch(y: np.ndarray, sr: int,
                   fmin: float = 60, fmax: float = 2000) -> tuple[float | None, float]:
    """
    基于 FFT 的谱峰检测，适用于打击音 / 铃声 / 短促音节。

    策略：
      1. 取信号的前 1/3（攻击段）做 FFT，能量最集中
      2. 用调和积谱（HPS，×3 次下采样乘积）增强基频，抑制泛音误识别
      3. 返回 (频率Hz, 伪置信度)；伪置信度 = 谱峰高度占总能量比

    对纯音置信度接近 1.0；对噪声/非谐波声通常 < 0.3。
    """
    # 只取前 1/3 的攻击段（不超过 100ms）
    attack_end = min(len(y), int(sr * 0.10), len(y) // 3 + 1)
    segment    = y[:attack_end] if attack_end > 64 else y

    # Hann 窗 FFT
    n_fft   = max(2048, 1 << (len(segment) - 1).bit_length())  # 向上取 2 的幂
    window  = np.hanning(len(segment))
    padded  = np.zeros(n_fft)
    padded[:len(segment)] = segment * window
    spectrum = np.abs(np.fft.rfft(padded)) ** 2   # 功率谱
    freqs    = np.fft.rfftfreq(n_fft, d=1.0 / sr)

    # 频率范围掩码
    mask = (freqs >= fmin) & (freqs <= fmax)
    if not np.any(mask):
        return None, 0.0

    spec_roi  = spectrum[mask]
    freqs_roi = freqs[mask]

    # 调和积谱（HPS）：谱 × 下采样2倍谱 × 下采样3倍谱
    hps = spec_roi.copy()
    for h in range(2, 4):
        # 将 spec_roi 下采样 h 倍后乘到 hps 上
        ds_len = len(spec_roi) // h
        if ds_len < 2:
            break
        ds = spec_roi[:ds_len * h:h]          # 步长为 h 的下采样
        hps[:ds_len] *= ds
        hps[ds_len:] = 0                       # 超出范围清零

    peak_idx  = int(np.argmax(hps))
    peak_freq = float(freqs_roi[peak_idx])

    # 伪置信度：谱峰功率 / 总功率（越集中越可信）
    total_power = float(np.sum(spec_roi)) + 1e-12
    peak_power  = float(spectrum[mask][peak_idx])
    confidence  = min(1.0, peak_power / total_power * 5)   # 缩放使分布合理

    return peak_freq, confidence


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

    method_used = "pYIN"

    # ── pYIN 置信度不足时，启用 FFT 谱峰 fallback ──
    if best_freq is None or best_conf < CONFIDENCE_THRESHOLD:
        print(f"  pYIN 置信度低（{best_conf:.2f}），尝试 FFT 谱峰检测…")
        # 对三类难检测音色分别调整 fmax
        fmax_fft = 2000 if trimmed_ms < 300 else YIN_FMAX   # 短音扩大搜索范围
        fft_freq, fft_conf = fft_peak_pitch(y_analysis, sr_yin, fmin=YIN_FMIN, fmax=fmax_fft)

        if fft_freq and fft_conf > FFT_FALLBACK_THRESHOLD:
            best_freq = fft_freq
            best_conf = fft_conf
            method_used = "FFT-HPS"
            print(f"  FFT 补充检测：{fft_freq:.1f}Hz  伪置信度={fft_conf:.2f}")
        else:
            print(f"  FFT 也无可靠结果（伪置信度={fft_conf:.2f}）")

    if best_freq is None or (best_conf < FFT_FALLBACK_THRESHOLD and method_used == "FFT-HPS"):
        print(f"  ⚠️  音高检测不可靠，建议手动核查（参考已知物理基频）")
        midi_exact    = None
        note_name     = "N/A"
        semitone_off  = None
    else:
        midi_exact    = freq_to_midi(best_freq)
        midi_rounded  = round(midi_exact)
        cents_off     = round((midi_exact - midi_rounded) * 100)
        note_name     = midi_to_note_name(midi_exact)
        semitone_off  = midi_semitone_offset(midi_exact)
        reliable      = "✓" if best_conf >= CONFIDENCE_THRESHOLD else "△（FFT估算，仅供参考）"
        print(f"  [{method_used}] 音高：{best_freq:.1f}Hz → {note_name}  "
              f"MIDI={midi_rounded}  cents偏差={cents_off:+d}  {reliable}")
        print(f"  推荐 baseSemitoneOffset = {semitone_off}  （置信度/伪置信度 {best_conf:.0%}）")

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
