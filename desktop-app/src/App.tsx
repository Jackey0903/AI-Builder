import {
  Cable,
  FileMusic,
  Loader,
  Plus,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AudioEngine, noteColor } from './audio/audioEngine';
import type { PitchBuildProgress } from './audio/audioEngine';
import { generateMelody, melodyDuration } from './audio/melody';
import { analyseBgm, analyseBgmFromUrl } from './audio/bgmAnalyser';
import { saveSample } from './audio/sampleStorage';
import { enabledSoundPresets } from './content/soundLibrary';
import { PRESET_MELODIES } from './content/presetMelodies';
import { NOTES, noteByKey, noteByName } from './data/notes';
import { useSerialDevice } from './hooks/useSerialDevice';
import type { MelodyEvent, MelodyStyle, Note, SerialLine } from './types';

/** Figma 设计稿麦克风图标：default 态为米色描边圆，active 态变红点闪烁 */
function RecMicIcon({ isRecording, isConverting }: { isRecording: boolean; isConverting: boolean }) {
  if (isConverting) {
    return (
      <svg className="rec-btn__mic-svg spin" width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="13" stroke="#DAC4A7" strokeWidth="3.5" strokeDasharray="4 4" />
      </svg>
    );
  }

  return (
    <svg className="rec-btn__mic-svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect
        x="12" y="4" width="12" height="18" rx="6"
        fill={isRecording ? '#ff4444' : '#D9D9D9'}
        stroke="#DAC4A7" strokeWidth="3.5"
        style={isRecording ? { animation: 'mic-blink 0.9s ease-in-out infinite' } : undefined}
      />
      <path d="M8 19 Q8 30 18 30 Q28 30 28 19" stroke="#DAC4A7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <line x1="18" y1="30" x2="18" y2="35" stroke="#DAC4A7" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="12" y1="35" x2="24" y2="35" stroke="#DAC4A7" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/** Figma 星星 SVG (4角星) */
function StarIcon({ size = 20, color = '#3284A3' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color}>
      <path d="M10 0 L12.5 7.5 L20 10 L12.5 12.5 L10 20 L7.5 12.5 L0 10 L7.5 7.5 Z" />
    </svg>
  );
}

/** Figma 金色四角星（生成旋律按钮 & 键盘底部用） */
function GoldStar({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="62%" stopColor="rgba(255, 225, 96, 1)" />
          <stop offset="100%" stopColor="rgba(255, 225, 96, 0)" />
        </linearGradient>
      </defs>
      <path d="M10 0 L12.5 7.5 L20 10 L12.5 12.5 L10 20 L7.5 12.5 L0 10 L7.5 7.5 Z" fill="url(#goldGrad)" />
    </svg>
  );
}

/** 自定义嘉宾（录音后保存到侧边栏的角色） */
interface CustomGuest {
  id: string;
  name: string;
  blob: Blob;
}

const MAX_MOTIF = 8;
const firstSoundPresetId = enabledSoundPresets[0]?.id ?? '';
const firstPresetMelodyId = PRESET_MELODIES[0]?.id ?? '';

/** 样机固定尺寸 */
const MOCKUP_W = 1440;
const MOCKUP_H = 990;

function App() {
  const audioEngine = useMemo(() => new AudioEngine(), []);
  const mockupRef = useRef<HTMLDivElement>(null);

  // ── 自动缩放样机以适配视口 ──
  useLayoutEffect(() => {
    const fit = () => {
      const el = mockupRef.current;
      if (!el) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(vw / MOCKUP_W, vh / MOCKUP_H, 1);
      el.style.transform = `scale(${scale})`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const [isRecording, setIsRecording] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isPlayingMelody, setIsPlayingMelody] = useState(false);
  const [isAnalysingBgm, setIsAnalysingBgm] = useState(false);
  const [bgmAnalysisProgress, setBgmAnalysisProgress] = useState(0);
  const [pitchBuild, setPitchBuild] = useState<[number, number] | null>(null);
  const [sampleReady, setSampleReady] = useState(false);
  const [status, setStatus] = useState('准备就绪');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [motif, setMotif] = useState<Note[]>([]);
  const [style, setStyle] = useState<MelodyStyle>('bright');
  const [melody, setMelody] = useState<MelodyEvent[]>([]);
  const [selectedSoundPresetIds, setSelectedSoundPresetIds] = useState<string[]>(
    firstSoundPresetId ? [firstSoundPresetId] : []
  );
  /** 'free' = 自由创作（本地算法），其他值 = 内置预设 id */
  const [selectedPresetMelodyId, setSelectedPresetMelodyId] = useState<string>('free');
  const [scaleRoot, setScaleRoot] = useState<Note>('C');
  const [showScalePicker, setShowScalePicker] = useState(false);
  const scalePickerRef = useRef<HTMLDivElement>(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const presetPickerRef = useRef<HTMLDivElement>(null);
  const [serialLog, setSerialLog] = useState<SerialLine[]>([
    { direction: 'system', message: 'desktop app started', at: Date.now() }
  ]);
  // ── 神秘嘉宾弹窗状态 ──
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestRecording, setGuestRecording] = useState(false);
  const [guestConverting, setGuestConverting] = useState(false);
  const [guestSampleBlob, setGuestSampleBlob] = useState<Blob | null>(null);
  const [guestSampleReady, setGuestSampleReady] = useState(false);
  const [guestStatus, setGuestStatus] = useState('');
  const [customGuests, setCustomGuests] = useState<CustomGuest[]>([]);
  const guestRecorderRef = useRef<MediaRecorder | null>(null);
  const guestChunksRef = useRef<Blob[]>([]);
  const guestAutoStopRef = useRef<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutsRef = useRef<number[]>([]);
  const recAutoStopRef = useRef<number | null>(null);
  const hardwareSendRef = useRef<(message: string) => void>(() => undefined);

  const appendLog = useCallback((line: SerialLine) => {
    setSerialLog((current) => [line, ...current].slice(0, 12));
  }, []);

  const sendHardware = useCallback((message: string) => {
    hardwareSendRef.current(message);
  }, []);

  const triggerNote = useCallback(
    async (note: Note, options: { captureMotif?: boolean; durationMs?: number; velocity?: number; root?: Note } = {}) => {
      const { captureMotif = true, durationMs = 520, velocity = 1, root = scaleRoot } = options;
      setActiveNote(note);
      setStatus(`${noteByName.get(note)?.solfege ?? note} 已触发`);
      await audioEngine.playNote(note, durationMs, velocity, root);
      sendHardware(`LED:NOTE:${note}`);
      if (captureMotif) {
        setMotif((current) => [...current.slice(-(MAX_MOTIF - 1)), note]);
      }
      window.setTimeout(() => {
        setActiveNote((current) => (current === note ? null : current));
      }, Math.min(durationMs, 540));
    },
    [audioEngine, scaleRoot, sendHardware]
  );

  const LEGATO_OVERLAP_MS = 80;

  const playGeneratedMelody = useCallback(
    async (
      events: MelodyEvent[],
      root: Note = scaleRoot,
      backing?: { file: string; gain?: number; startMs?: number; loop?: boolean }
    ) => {
      if (!events.length || isPlayingMelody) return;
      setIsPlayingMelody(true);
      setStatus(`正在演奏 ${Math.round(melodyDuration(events) / 1000)} 秒旋律`);
      sendHardware('LED:PLAY');
      if (backing?.file) {
        try {
          await audioEngine.playBackingTrack(backing.file, {
            gain: backing.gain, startMs: backing.startMs, loop: backing.loop
          });
        } catch {
          setStatus('伴奏加载失败');
        }
      } else {
        audioEngine.stopBackingTrack(120);
      }
      let offset = 0;
      events.forEach((event, index) => {
        const startAt = index === 0 ? offset : Math.max(0, offset - LEGATO_OVERLAP_MS);
        const timeoutId = window.setTimeout(() => {
          setActiveNote(event.note);
          window.setTimeout(() => {
            setActiveNote((current) => (current === event.note ? null : current));
          }, Math.min(event.durationMs, 540));
          void audioEngine.playNoteLegato(event.note, event.durationMs, event.velocity ?? 1, root);
        }, startAt);
        timeoutsRef.current.push(timeoutId);
        offset += event.durationMs;
      });
      const doneTimeout = window.setTimeout(() => {
        setIsPlayingMelody(false);
        setActiveNote(null);
        setStatus('旋律播放完毕');
        audioEngine.stopBackingTrack(420);
        sendHardware('LED:OFF');
      }, offset + 80);
      timeoutsRef.current.push(doneTimeout);
    },
    [audioEngine, isPlayingMelody, scaleRoot, sendHardware]
  );

  const toggleSoundPreset = useCallback((id: string) => {
    const isSelected = selectedSoundPresetIds.includes(id);
    if (isSelected) {
      audioEngine.removePresetLayers(id);
      const remaining = selectedSoundPresetIds.filter((x) => x !== id);
      audioEngine.ensembleMode = remaining.length > 1;
      setSelectedSoundPresetIds(remaining);
    } else {
      setSelectedSoundPresetIds((prev) => [...prev, id]);
    }
  }, [audioEngine, selectedSoundPresetIds]);

  const previewPresetSound = useCallback((presetId: string) => {
    const preset = enabledSoundPresets.find((p) => p.id === presetId);
    if (!preset) return;
    const url = preset.file ?? preset.samples?.[0]?.file;
    if (!url) return;
    void audioEngine.previewSound(url, 1500);
  }, [audioEngine]);

  const makePitchProgress = useCallback(
    (presetName: string): PitchBuildProgress =>
      (done, total) => {
        setPitchBuild([done, total]);
        setStatus(`生成音阶 ${done}/${total}（${presetName}）…`);
      },
    []
  );

  const loadSelectedSoundPreset = useCallback(async () => {
    const presets = enabledSoundPresets.filter((p) => selectedSoundPresetIds.includes(p.id));
    if (!presets.length) { setStatus('请先选择音色'); return; }
    const isEnsemble = presets.length > 1;
    audioEngine.clearSampleLayers();
    audioEngine.ensembleMode = isEnsemble;
    try {
      const names: string[] = [];
      for (const preset of presets) {
        setStatus(`正在加载：${preset.name}…`);
        setPitchBuild(null);
        const onProgress = makePitchProgress(preset.name);
        if (preset.samples?.length) {
          await audioEngine.loadSampleSet(preset.samples, preset.id, onProgress);
        } else if (preset.file && preset.baseNote) {
          await audioEngine.loadSampleFromUrl(preset.file, {
            id: preset.id, baseNote: preset.baseNote,
            baseSemitoneOffset: preset.baseSemitoneOffset,
            trimStartMs: preset.trimStartMs, trimEndMs: preset.trimEndMs, gain: preset.gain
          }, onProgress);
        }
        names.push(preset.name);
      }
      setPitchBuild(null);
      setSampleReady(true);
      setStatus(`音色已加载：${names.join(' + ')}`);
      sendHardware('LED:RAINBOW');
    } catch (error) {
      setPitchBuild(null);
      setStatus(error instanceof Error ? error.message : '音色加载失败');
    }
  }, [audioEngine, makePitchProgress, selectedSoundPresetIds, sendHardware]);

  // 自动加载第一个预设音色
  useEffect(() => {
    if (selectedSoundPresetIds.length > 0) {
      void loadSelectedSoundPreset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playPresetMelody = useCallback(async () => {
    const preset = PRESET_MELODIES.find((item) => item.id === selectedPresetMelodyId);
    if (!preset) return;
    setStyle(preset.style);
    const presetRoot = preset.root ?? scaleRoot;
    const presetBacking = preset.backingFile
      ? { file: preset.backingFile, gain: preset.backingGain, startMs: preset.backingStartMs, loop: preset.backingLoop }
      : undefined;
    if (preset.bgmUrl) {
      if (isAnalysingBgm || isPlayingMelody) return;
      setIsAnalysingBgm(true);
      setBgmAnalysisProgress(0);
      setStatus(`正在解析 BGM：${preset.name}…`);
      try {
        const result = await analyseBgmFromUrl(preset.bgmUrl, (p) => setBgmAnalysisProgress(Math.round(p * 100)));
        if (!result.events.length) {
          setMelody(preset.events);
          void playGeneratedMelody(preset.events, presetRoot, presetBacking);
          return;
        }
        setMelody(result.events);
        void playGeneratedMelody(result.events, result.detectedRoot, presetBacking);
      } catch {
        setMelody(preset.events);
        void playGeneratedMelody(preset.events, presetRoot, presetBacking);
      } finally {
        setIsAnalysingBgm(false);
        setBgmAnalysisProgress(0);
      }
      return;
    }
    setMelody(preset.events);
    setStatus(`预设旋律已加载：${preset.name}`);
    void playGeneratedMelody(preset.events, presetRoot, presetBacking);
  }, [isAnalysingBgm, isPlayingMelody, playGeneratedMelody, scaleRoot, selectedPresetMelodyId]);

  /** 自由创作：本地算法生成旋律并演奏 */
  const handleFreeGenerate = useCallback(() => {
    const events = generateMelody(motif, style);
    setMelody(events);
    setStatus(`已生成 ${events.length} 个音符`);
    sendHardware('LED:GENERATE');
    void audioEngine.playClick();
    window.setTimeout(() => void playGeneratedMelody(events), 420);
  }, [audioEngine, motif, playGeneratedMelody, sendHardware, style]);

  /**
   * 点击「生成旋律」的统一入口：
   * - 选中「自由创作」→ 本地算法（handleFreeGenerate）
   * - 选中内置预设 → 演奏该预设（playPresetMelody）
   */
  const handleGenerate = useCallback(() => {
    if (selectedPresetMelodyId === 'free') {
      handleFreeGenerate();
    } else {
      void playPresetMelody();
    }
  }, [handleFreeGenerate, playPresetMelody, selectedPresetMelodyId]);

  const handleBgmFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      event.target.value = '';
      if (isAnalysingBgm || isPlayingMelody) return;
      setIsAnalysingBgm(true);
      setBgmAnalysisProgress(0);
      setStatus(`正在分析 BGM：${file.name}…`);
      try {
        const result = await analyseBgm(file, (p) => setBgmAnalysisProgress(Math.round(p * 100)));
        if (!result.events.length) { setStatus('未能提取到旋律'); return; }
        setMelody(result.events);
        setScaleRoot(result.detectedRoot);
        setStatus(`提取到 ${result.events.length} 个音符`);
        void playGeneratedMelody(result.events, result.detectedRoot);
      } catch (err) {
        setStatus(err instanceof Error ? err.message : 'BGM 分析出错');
      } finally {
        setIsAnalysingBgm(false);
        setBgmAnalysisProgress(0);
      }
    },
    [isAnalysingBgm, isPlayingMelody, playGeneratedMelody]
  );

  const stopRecording = useCallback(() => {
    if (recAutoStopRef.current !== null) {
      window.clearTimeout(recAutoStopRef.current);
      recAutoStopRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    if (!navigator.mediaDevices?.getUserMedia) { setStatus('无法访问麦克风'); return; }
    setIsRecording(true);
    setStatus('正在录制…');
    sendHardware('LED:REC');
    chunksRef.current = [];
    try {
      await audioEngine.ensureContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        if (recAutoStopRef.current !== null) {
          window.clearTimeout(recAutoStopRef.current);
          recAutoStopRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setIsRecording(false);
        setIsConverting(true);
        setPitchBuild(null);
        setStatus('正在分析录音…');
        try {
          const onProgress = makePitchProgress('录音样本');
          const detected = await audioEngine.setSample(blob, {}, onProgress);
          setSampleReady(true);
          void saveSample(blob, detected).catch(() => undefined);
          setPitchBuild(null);
          setStatus(detected
            ? `样本已加载：${detected.noteName}（${Math.round(detected.frequency)} Hz）`
            : '样本已加载');
          sendHardware('LED:RAINBOW');
        } catch (error) {
          setPitchBuild(null);
          setStatus(error instanceof Error ? error.message : '录音解码失败');
        } finally {
          setIsConverting(false);
        }
      };
      recorder.start();
      recAutoStopRef.current = window.setTimeout(() => {
        recAutoStopRef.current = null;
        if (recorder.state !== 'inactive') recorder.stop();
      }, 30_000);
    } catch (error) {
      setIsRecording(false);
      setStatus(error instanceof Error ? error.message : '麦克风权限获取失败');
      sendHardware('LED:OFF');
    }
  }, [audioEngine, isRecording, makePitchProgress, sendHardware]);

  // ── 神秘嘉宾：弹窗内录音 ──
  const stopGuestRecording = useCallback(() => {
    if (guestAutoStopRef.current !== null) {
      window.clearTimeout(guestAutoStopRef.current);
      guestAutoStopRef.current = null;
    }
    const recorder = guestRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }, []);

  const startGuestRecording = useCallback(async () => {
    if (guestRecording) return;
    if (!navigator.mediaDevices?.getUserMedia) { setGuestStatus('无法访问麦克风'); return; }
    setGuestRecording(true);
    setGuestSampleReady(false);
    setGuestSampleBlob(null);
    setGuestStatus('正在录制…');
    guestChunksRef.current = [];
    try {
      await audioEngine.ensureContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      guestRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size) guestChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        if (guestAutoStopRef.current !== null) {
          window.clearTimeout(guestAutoStopRef.current);
          guestAutoStopRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(guestChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setGuestRecording(false);
        setGuestConverting(true);
        setGuestStatus('正在分析录音…');
        try {
          const onProgress = makePitchProgress('嘉宾录音');
          const detected = await audioEngine.setSample(blob, {}, onProgress);
          setGuestSampleBlob(blob);
          setGuestSampleReady(true);
          setPitchBuild(null);
          setGuestStatus(detected
            ? `录制完成：${detected.noteName}（${Math.round(detected.frequency)} Hz）`
            : '录制完成');
        } catch (error) {
          setPitchBuild(null);
          setGuestStatus(error instanceof Error ? error.message : '录音解码失败');
        } finally {
          setGuestConverting(false);
        }
      };
      recorder.start();
      guestAutoStopRef.current = window.setTimeout(() => {
        guestAutoStopRef.current = null;
        if (recorder.state !== 'inactive') recorder.stop();
      }, 30_000);
    } catch (error) {
      setGuestRecording(false);
      setGuestStatus(error instanceof Error ? error.message : '麦克风权限获取失败');
    }
  }, [audioEngine, guestRecording, makePitchProgress]);

  const saveGuest = useCallback(() => {
    if (!guestSampleBlob || !guestSampleReady) return;
    const finalName = guestName.trim() || `嘉宾${customGuests.length + 1}`;
    const guest: CustomGuest = {
      id: `guest-${Date.now()}`,
      name: finalName,
      blob: guestSampleBlob,
    };
    setCustomGuests((prev) => [...prev, guest]);
    // 持久化样本
    void saveSample(guestSampleBlob, null).catch(() => undefined);
    setSampleReady(true);
    setStatus(`已保存嘉宾「${finalName}」`);
    // 关闭弹窗 & 重置
    setShowGuestModal(false);
    setGuestName('');
    setGuestSampleBlob(null);
    setGuestSampleReady(false);
    setGuestStatus('');
  }, [guestSampleBlob, guestSampleReady, guestName, customGuests.length]);

  const openGuestModal = useCallback(() => {
    setShowGuestModal(true);
    setGuestName('');
    setGuestSampleBlob(null);
    setGuestSampleReady(false);
    setGuestStatus('');
    setGuestRecording(false);
    setGuestConverting(false);
  }, []);

  const closeGuestModal = useCallback(() => {
    // 如果正在录音先停
    stopGuestRecording();
    setShowGuestModal(false);
  }, [stopGuestRecording]);

  const handleSerialLine = useCallback(
    (line: string) => {
      if (line.startsWith('NOTE:')) {
        const note = line.split(':')[1] as Note;
        if (noteByName.has(note)) void triggerNote(note);
        return;
      }
      if (line === 'REC') { void startRecording(); return; }
      if (line === 'GENERATE') handleGenerate();
    },
    [handleGenerate, startRecording, triggerNote]
  );

  const serial = useSerialDevice({ onLine: handleSerialLine, onLog: appendLog });

  useEffect(() => {
    hardwareSendRef.current = (message: string) => { void serial.send(message); };
  }, [serial.send]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const definition = noteByKey.get(event.key);
      if (definition) { event.preventDefault(); void triggerNote(definition.note); }
      if (event.key.toLowerCase() === 'r') { event.preventDefault(); void startRecording(); }
      if (event.key.toLowerCase() === 'g') { event.preventDefault(); handleGenerate(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleGenerate, startRecording, triggerNote]);

  useEffect(
    () => () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];
      audioEngine.stopBackingTrack(0);
    },
    [audioEngine]
  );

  // 点击外部关闭弹出面板
  useEffect(() => {
    if (!showScalePicker && !showPresetPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (showScalePicker && scalePickerRef.current && !scalePickerRef.current.contains(e.target as Node)) {
        setShowScalePicker(false);
      }
      if (showPresetPicker && presetPickerRef.current && !presetPickerRef.current.contains(e.target as Node)) {
        setShowPresetPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showScalePicker, showPresetPicker]);

  // 当前激活的精灵 = selectedSoundPresetIds 第一个
  const activePresetId = selectedSoundPresetIds[0] ?? '';

  // 音色 id → 中央舞台大插图映射（/ui/*插图.png）
  const SPRITE_ILLUSTRATION: Record<string, string> = {
    'yuanhaoyu-voice-2': '/ui/圆号鱼插图.png',
    'yuanhaoyu':         '/ui/圆号鱼插图.png',
    'xiaoya':            '/ui/小夜插图.png',
    'lilayao':           '/ui/里拉鳐插图.png',
    'emoding':           '/ui/恶魔叮插图.png',
    'houmaizai':         '/ui/猴麦仔插图.png',
  };

  // 音色 id → 左侧侧边栏圆形小头像映射（/ui/精灵头像/*.png）
  const SPRITE_AVATAR: Record<string, string> = {
    'yuanhaoyu-voice-2': '/ui/精灵头像/NO.184_圆号鱼 1.png',
    'yuanhaoyu':         '/ui/精灵头像/NO.184_圆号鱼 1.png',
    'xiaoya':            '/ui/精灵头像/小夜.png',
    'lilayao':           '/ui/精灵头像/里拉鳐.png',
    'emoding':           '/ui/精灵头像/恶魔叮.png',
    'houmaizai':         '/ui/精灵头像/猴麦仔.png',
  };
  const stageIllustration = activePresetId
    ? (SPRITE_ILLUSTRATION[activePresetId] ?? '/sound-sprite.svg')
    : '/ui/等待ing.png';
  const activePresetName = enabledSoundPresets.find((p) => p.id === activePresetId)?.name
    ?? customGuests.find((g) => g.id === activePresetId)?.name
    ?? '精灵';

  return (
    <div className="screen-mockup" ref={mockupRef}>
    <main className="app-shell">
      {/* ── 标题条 ── */}
      <section className="top-strip">
        <h1>精灵合奏台</h1>
        <div className="title-stars">
          <StarIcon size={16} />
          <StarIcon size={20} />
          <StarIcon size={16} />
          <StarIcon size={12} />
        </div>
      </section>

      {/* ── 主体三栏 ── */}
      <section className="workspace-grid">

        {/* 左侧：精灵音色列表（背景图魔杖，横排：头像 + 名字竖列） */}
        <div className="sprite-sidebar">
          {enabledSoundPresets.map((preset) => {
            const avatarSrc = SPRITE_AVATAR[preset.id];
            return (
              <button
                key={preset.id}
                type="button"
                className={`sprite-slot ${selectedSoundPresetIds.includes(preset.id) ? 'is-active' : ''}`}
                onClick={() => {
                  toggleSoundPreset(preset.id);
                  previewPresetSound(preset.id);
                  window.setTimeout(() => void loadSelectedSoundPreset(), 100);
                }}
              >
                <div className="sprite-avatar">
                  {avatarSrc
                    ? <img className="sprite-avatar__img" src={avatarSrc} alt={preset.name} />
                    : <span className="sprite-avatar__letter">{preset.name.charAt(0)}</span>
                  }
                </div>
                <div className="sprite-info">
                  <span className="sprite-name">{preset.name}</span>
                  {selectedSoundPresetIds.includes(preset.id) && activePresetId === preset.id && (
                    <span className="sprite-sub">当前音色</span>
                  )}
                </div>
              </button>
            );
          })}

          {/* 已保存的自定义嘉宾 */}
          {customGuests.map((guest) => (
            <button
              key={guest.id}
              type="button"
              className={`sprite-slot ${selectedSoundPresetIds.includes(guest.id) ? 'is-active' : ''}`}
              onClick={async () => {
                try {
                  const onProgress = makePitchProgress(guest.name);
                  await audioEngine.setSample(guest.blob, {}, onProgress);
                  setPitchBuild(null);
                  setSampleReady(true);
                  setStatus(`已切换到嘉宾「${guest.name}」`);
                  setSelectedSoundPresetIds([guest.id]);
                } catch {
                  setStatus('音色加载失败');
                }
              }}
            >
              <div className="sprite-avatar sprite-avatar--guest">
                <span className="sprite-avatar__letter">{guest.name.charAt(0)}</span>
              </div>
              <div className="sprite-info">
                <span className="sprite-name">{guest.name}</span>
                {selectedSoundPresetIds.includes(guest.id) && (
                  <span className="sprite-sub">当前音色</span>
                )}
              </div>
            </button>
          ))}

          {/* 添加神秘嘉宾 slot — Figma node 11-1060 */}
          <button
            type="button"
            className="sprite-slot sprite-slot-add"
            onClick={openGuestModal}
          >
            <div className="sprite-avatar">
              <img className="sprite-avatar__img" src="/ui/精灵头像/神秘嘉宾.png" alt="神秘嘉宾" />
            </div>
            <div className="sprite-info">
              <span className="sprite-name">神秘嘉宾</span>
              <span className="sprite-sub">点击添加</span>
            </div>
          </button>
        </div>

        {/* 中央：舞台 + 键盘 */}
        <div className="stage-panel">
          <div className="stage-orbit" style={{ '--note-color': activeNote ? noteColor(activeNote) : '#20c7c7' } as React.CSSProperties}>
            <img className="sprite" src={stageIllustration} alt={activePresetName} />
          </div>

          <div className="keybed" aria-label="playable notes">
            {NOTES.map((definition) => (
              <button
                type="button"
                className={`note-key ${activeNote === definition.note ? 'is-active' : ''}`}
                key={definition.note}
                onClick={() => void triggerNote(definition.note)}
              >
                {/* 三态背景图 */}
                <img className="key-bg key-bg--default" src="/ui/音阶按钮-bg/Property 1=default.png" alt="" draggable={false} />
                <img className="key-bg key-bg--hover"   src="/ui/音阶按钮-bg/Property 1=hover.png"   alt="" draggable={false} />
                <img className="key-bg key-bg--click"   src="/ui/音阶按钮-bg/Property 1=click.png"   alt="" draggable={false} />
                {/* 文字叠层 */}
                <div className="key-text-overlay">
                  <span>{definition.solfege}</span>
                  <div className="key-divider" />
                  <strong>{definition.label}</strong>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：硬件面板 — Figma node 11-730/11-844 */}
        <div className="hardware-column">
          {/* 连接硬件按钮：左图标 + 右文字 + 底部蓝条 */}
          <button
            className={`hw-connect-btn${serial.isConnected ? ' is-connected' : ''}`}
            type="button"
            onClick={() => (serial.isConnected ? void serial.disconnect() : void serial.connect())}
            disabled={!serial.isSupported}
          >
            {/* 左侧白色圆形图标区 */}
            <div className="hw-icon">
              <div className="hw-icon__circle">
                <Cable size={22} />
              </div>
            </div>
            {/* 右侧文字（右对齐）*/}
            <div className="hw-label">
              <span className="hw-label-en">Connect Hardware</span>
              <span className="hw-label-cn">{serial.isConnected ? '已连接' : '连接硬件'}</span>
            </div>
            {/* 底部蓝色条 */}
            <div className="hw-bar" />
          </button>

          {/* GPIO 映射 */}
          <div className="hw-gpio-list">
            {(['Note', 'Rec', 'Gen', 'Led'] as const).map((label) => (
              <div className="hw-gpio-row" key={label}>
                <div className="hw-gpio-bar" />
                <span className="hw-gpio-label">{label}</span>
              </div>
            ))}
          </div>

          {/* 串口日志 */}
          <div className="serial-box">
            {serialLog.map((line) => (
              <p key={`${line.at}-${line.message}`}>
                <span>{line.direction.toUpperCase()}</span>
                {' '}{line.message}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── 底部控制条 ── */}
      <section className="composer-strip">
        {/* 音乐动机 */}
        <div className="motif-area">
          <img className="motif-book-icon" src="/ui/motif-icon.png" alt="" draggable="false" />
          <div className="motif-text">
            <h2>音乐动机</h2>
            <p>{motif.length ? motif.join('-') : '按键录入动机'}</p>
          </div>
        </div>

        {/* 调式调音 — Figma node 11-1911 弹出选项 */}
        <div className="scale-picker-wrapper" ref={scalePickerRef}>
          <button
            className="pill-btn"
            type="button"
            onClick={() => setShowScalePicker((v) => !v)}
          >
            调式调音：{scaleRoot}
            <span className="pill-arrow" style={{ transform: showScalePicker ? 'rotate(180deg)' : undefined, transition: 'transform 200ms ease' }}>▲</span>
          </button>
          {showScalePicker && (
            <div className="scale-picker-dropdown">
              {/* 选中项 — 顶部胶囊高亮 */}
              <div className="melody-picker-dropdown__selected">
                {NOTES.find((n) => n.note === scaleRoot)?.solfege ?? scaleRoot}（{scaleRoot}）
              </div>
              {NOTES.map((def) => (
                <button
                  key={def.note}
                  type="button"
                  className={`scale-picker-dropdown__item ${scaleRoot === def.note ? 'is-active' : ''}`}
                  onClick={() => { setScaleRoot(def.note); setShowScalePicker(false); }}
                >
                  {def.solfege}（{def.note}）
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 预设选择 — 自定义弹出面板 */}
        <div className="melody-picker-wrapper" ref={presetPickerRef}>
          <button
            className="pill-btn"
            type="button"
            onClick={() => setShowPresetPicker((v) => !v)}
          >
            {selectedPresetMelodyId === 'free'
              ? '✦ 自由创作'
              : PRESET_MELODIES.find((p) => p.id === selectedPresetMelodyId)?.name ?? '选择旋律'}
            <span className="pill-arrow" style={{ transform: showPresetPicker ? 'rotate(180deg)' : undefined, transition: 'transform 200ms ease' }}>▲</span>
          </button>
          {showPresetPicker && (
            <div className="melody-picker-dropdown">
              {/* 选中项 — 顶部胶囊高亮 */}
              <div className="melody-picker-dropdown__selected">
                {selectedPresetMelodyId === 'free'
                  ? '✦ 自由创作'
                  : PRESET_MELODIES.find((p) => p.id === selectedPresetMelodyId)?.name ?? ''}
              </div>
              {/* 选项列表 */}
              <button
                type="button"
                className={`melody-picker-dropdown__item ${selectedPresetMelodyId === 'free' ? 'is-active' : ''}`}
                onClick={() => { setSelectedPresetMelodyId('free'); setShowPresetPicker(false); }}
              >
                自由创作
              </button>
              {PRESET_MELODIES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`melody-picker-dropdown__item ${selectedPresetMelodyId === preset.id ? 'is-active' : ''}`}
                  onClick={() => { setSelectedPresetMelodyId(preset.id); setShowPresetPicker(false); }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BGM 解析 */}
        <label
          className={`bgm-upload-label ${isAnalysingBgm || isPlayingMelody ? 'disabled' : ''}`}
          title="上传 BGM 音频文件，自动提取主旋律"
        >
          {isAnalysingBgm ? (
            <><Loader size={17} className="spin" />{`分析中 ${bgmAnalysisProgress}%`}</>
          ) : (
            <><FileMusic size={17} />解析BGM旋律</>
          )}
          <input
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm"
            style={{ display: 'none' }}
            onChange={handleBgmFileUpload}
            disabled={isAnalysingBgm || isPlayingMelody}
          />
        </label>

        {/* 生成旋律按钮 —— 直接用三张图切换状态 */}
        <button
          className="generate-action"
          type="button"
          onClick={handleGenerate}
          disabled={isPlayingMelody || isAnalysingBgm}
          aria-label={
            isPlayingMelody || isAnalysingBgm
              ? '演奏中'
              : selectedPresetMelodyId === 'free'
                ? '生成旋律'
                : '演奏旋律'
          }
        >
          <img className="gen-img gen-img--default" src="/ui/生成旋律按钮/Property 1=生成-default.png" alt="" draggable="false" />
          <img className="gen-img gen-img--hover"   src="/ui/生成旋律按钮/Property 1=生成-hover.png"   alt="" draggable="false" />
          <img className="gen-img gen-img--click"   src="/ui/生成旋律按钮/Property 1=生成-click.png"   alt="" draggable="false" />
        </button>
      </section>

      {/* ── 神秘嘉宾弹窗 ── */}
      {showGuestModal && (
        <div className="guest-modal-overlay" onClick={closeGuestModal}>
          <div className="guest-modal" onClick={(e) => e.stopPropagation()}>
            {/* 装饰三角 */}
            <div className="guest-modal__deco-left" />
            <div className="guest-modal__deco-center" />
            <div className="guest-modal__deco-right" />

            <div className="guest-modal__inner">
              {/* 关闭 */}
              <button className="guest-modal__close" type="button" onClick={closeGuestModal}>
                <X size={18} />
              </button>

              {/* 标题 */}
              <h2 className="guest-modal__title">神秘嘉宾</h2>

              {/* 预览区域 */}
              <div className="guest-modal__preview">
                {guestRecording ? (
                  <div className="guest-modal__waveform">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} />
                    ))}
                  </div>
                ) : guestSampleReady ? (
                  <span className="guest-modal__preview-text">✓ 录制完成</span>
                ) : (
                  <span className="guest-modal__preview-text">录制预览</span>
                )}
              </div>

              {/* 昵称输入 */}
              <div className="guest-modal__input-row">
                <span className="guest-modal__nick-label">昵称</span>
                <input
                  className="guest-modal__input"
                  type="text"
                  placeholder="给嘉宾起个名字"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  maxLength={12}
                />
              </div>

              {/* 状态提示 */}
              {guestStatus && (
                <p className={`guest-modal__status ${guestSampleReady ? 'is-ready' : ''}`}>
                  {guestStatus}
                </p>
              )}

              {/* 录制按钮 */}
              <div className="guest-modal__rec-area">
                <button
                  className={`rec-btn ${guestRecording ? 'is-recording' : ''}`}
                  type="button"
                  onClick={guestRecording ? stopGuestRecording : () => void startGuestRecording()}
                  disabled={guestConverting}
                  style={{ width: 'auto', minWidth: 200 }}
                >
                  <div className="rec-btn__inner">
                    <RecMicIcon isRecording={guestRecording} isConverting={guestConverting} />
                    <span className="rec-btn__label">
                      {guestConverting ? '分析中…' : guestRecording ? '停止录制' : '点击录制'}
                    </span>
                  </div>
                </button>
              </div>

              {/* 保存按钮 */}
              <div className="guest-modal__actions">
                <button
                  className="guest-modal__save-btn"
                  type="button"
                  onClick={saveGuest}
                  disabled={!guestSampleReady}
                >
                  <GoldStar size={14} />
                  保存嘉宾
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
    </div>
  );
}

export default App;
