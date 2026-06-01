import {
  Cable,
  FileMusic,
  Loader,
  Plus,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const MAX_MOTIF = 8;
const firstSoundPresetId = enabledSoundPresets[0]?.id ?? '';
const firstPresetMelodyId = PRESET_MELODIES[0]?.id ?? '';

function App() {
  const audioEngine = useMemo(() => new AudioEngine(), []);
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
  const [selectedPresetMelodyId, setSelectedPresetMelodyId] = useState(firstPresetMelodyId);
  const [scaleRoot, setScaleRoot] = useState<Note>('C');
  const [serialLog, setSerialLog] = useState<SerialLine[]>([
    { direction: 'system', message: 'desktop app started', at: Date.now() }
  ]);
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

  const handleGenerate = useCallback(() => {
    const events = generateMelody(motif, style);
    setMelody(events);
    setStatus(`已生成 ${events.length} 个音符`);
    sendHardware('LED:GENERATE');
    void audioEngine.playClick();
    window.setTimeout(() => void playGeneratedMelody(events), 420);
  }, [audioEngine, motif, playGeneratedMelody, sendHardware, style]);

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

  // 当前激活的精灵 = selectedSoundPresetIds 第一个
  const activePresetId = selectedSoundPresetIds[0] ?? '';

  return (
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

        {/* 左侧：精灵音色列表 */}
        <div className="sprite-sidebar">
          {enabledSoundPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`sprite-slot ${selectedSoundPresetIds.includes(preset.id) ? 'is-active' : ''}`}
              onClick={() => {
                toggleSoundPreset(preset.id);
                previewPresetSound(preset.id);
                // 自动加载选中的音色
                window.setTimeout(() => void loadSelectedSoundPreset(), 100);
              }}
            >
              <div className="sprite-avatar">
                {preset.name.charAt(0)}
              </div>
              <span className="sprite-name">{preset.name}</span>
              {selectedSoundPresetIds.includes(preset.id) && activePresetId === preset.id && (
                <span className="sprite-sub">当前音色</span>
              )}
            </button>
          ))}

          {/* 录制自定义音色 slot */}
          <button
            type="button"
            className="sprite-slot sprite-slot-add"
            onClick={isRecording ? stopRecording : () => void startRecording()}
          >
            <div className="sprite-avatar">
              {isRecording ? '●' : isConverting ? <Loader size={20} className="spin" /> : <Plus size={20} />}
            </div>
            <span className="sprite-name">神秘嘉宾</span>
            <span className="sprite-sub">
              {isRecording ? '停止录制' : isConverting ? '转化中…' : '点击录制声音'}
            </span>
          </button>
        </div>

        {/* 中央：舞台 + 键盘 */}
        <div className="stage-panel">
          <div className="stage-orbit" style={{ '--note-color': activeNote ? noteColor(activeNote) : '#20c7c7' } as React.CSSProperties}>
            <img className="sprite" src="/sound-sprite.svg" alt="精灵吉祥物" />
          </div>

          <div className="keybed" aria-label="playable notes">
            {NOTES.map((definition) => (
              <button
                type="button"
                className={`note-key ${activeNote === definition.note ? 'is-active' : ''}`}
                key={definition.note}
                style={{ '--key-color': definition.color } as React.CSSProperties}
                onClick={() => void triggerNote(definition.note)}
              >
                <span>{definition.solfege}</span>
                <div className="key-divider" />
                <strong>{definition.label}</strong>
                <em>{definition.key}</em>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：硬件面板 */}
        <div className="hardware-column">
          {/* 连接硬件按钮 */}
          <button
            className="hw-connect-btn"
            type="button"
            onClick={() => (serial.isConnected ? void serial.disconnect() : void serial.connect())}
            disabled={!serial.isSupported}
          >
            <div className="hw-bar" />
            <div className="hw-icon">
              <Cable size={28} />
            </div>
            <div className="hw-label">
              <span className="hw-label-en">Connect Hardware</span>
              <span className="hw-label-cn">{serial.isConnected ? '已连接' : '连接硬件'}</span>
            </div>
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
          <div className="motif-text">
            <h2>音乐动机</h2>
            <p>{motif.length ? motif.join('-') : '按键录入动机'}</p>
          </div>
        </div>

        {/* 调式调音 */}
        <button className="pill-btn" type="button" onClick={() => {
          const idx = NOTES.findIndex((n) => n.note === scaleRoot);
          const next = NOTES[(idx + 1) % NOTES.length];
          setScaleRoot(next.note);
        }}>
          调式调音：{scaleRoot}
          <span className="pill-arrow">▲</span>
        </button>

        {/* 预设选择 */}
        <div className="preset-select-area">
          <div className="preset-select-wrapper">
            <select value={selectedPresetMelodyId} onChange={(e) => setSelectedPresetMelodyId(e.target.value)}>
              {PRESET_MELODIES.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.name}</option>
              ))}
            </select>
            <span className="pill-arrow" style={{ padding: '0 8px' }}>▲</span>
          </div>
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

        {/* 生成旋律 */}
        <button className="generate-action" type="button" onClick={handleGenerate} disabled={isPlayingMelody}>
          <GoldStar size={16} />
          {isPlayingMelody ? '演奏中…' : '生成旋律'}
          <GoldStar size={12} />
        </button>
      </section>
    </main>
  );
}

export default App;
