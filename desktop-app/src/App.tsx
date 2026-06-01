import {
  Cable,
  CircleStop,
  Cpu,
  FileMusic,
  Library,
  ListMusic,
  Loader,
  Mic,
  Music2,
  Play,
  RadioTower,
  SlidersHorizontal,
  Sparkles,
  Waves,
  Zap
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioEngine, noteColor } from './audio/audioEngine';
import { generateMelody, melodyDuration } from './audio/melody';
import { analyseBgm, analyseBgmFromUrl } from './audio/bgmAnalyser';
import { saveSample } from './audio/sampleStorage';
import { enabledSoundPresets } from './content/soundLibrary';
import { PRESET_MELODIES } from './content/presetMelodies';
import { NOTES, noteByKey, noteByName } from './data/notes';
import { useSerialDevice } from './hooks/useSerialDevice';
import type { MelodyEvent, MelodyStyle, Note, SerialLine } from './types';

const MAX_MOTIF = 8;
const RECORD_MS = 4200;
const firstSoundPresetId = enabledSoundPresets[0]?.id ?? '';
const firstPresetMelodyId = PRESET_MELODIES[0]?.id ?? '';

function App() {
  const audioEngine = useMemo(() => new AudioEngine(), []);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingMelody, setIsPlayingMelody] = useState(false);
  const [isAnalysingBgm, setIsAnalysingBgm] = useState(false);
  const [bgmAnalysisProgress, setBgmAnalysisProgress] = useState(0);
  const [sampleReady, setSampleReady] = useState(false);
  const [status, setStatus] = useState('准备就绪。录制声音或使用备用音色演奏。');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [motif, setMotif] = useState<Note[]>([]);
  const [style, setStyle] = useState<MelodyStyle>('bright');
  const [melody, setMelody] = useState<MelodyEvent[]>([]);
  const [selectedSoundPresetId, setSelectedSoundPresetId] = useState(firstSoundPresetId);
  const [selectedPresetMelodyId, setSelectedPresetMelodyId] = useState(firstPresetMelodyId);
  const [scaleRoot, setScaleRoot] = useState<Note>('C');
  const [serialLog, setSerialLog] = useState<SerialLine[]>([
    { direction: 'system', message: '桌面应用已启动', at: Date.now() }
  ]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutsRef = useRef<number[]>([]);
  const recAutoStopRef = useRef<number | null>(null); // 录音自动停止的 timeout id
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
      setStatus(`${noteByName.get(note)?.solfege ?? note} 已触发，调式根音 ${root}`);
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

  // legato 连奏：每个音符提前 LEGATO_OVERLAP_MS 启动，与上一个音的 crossfade 衔接
  const LEGATO_OVERLAP_MS = 80;

  const playGeneratedMelody = useCallback(
    async (
      events: MelodyEvent[],
      root: Note = scaleRoot,
      backing?: { file: string; gain?: number; startMs?: number; loop?: boolean }
    ) => {
      if (!events.length || isPlayingMelody) return;

      setIsPlayingMelody(true);
      setStatus(`正在演奏 ${Math.round(melodyDuration(events) / 1000)} 秒旋律，调式根音 ${root}`);
      sendHardware('LED:PLAY');

      if (backing?.file) {
        try {
          await audioEngine.playBackingTrack(backing.file, {
            gain: backing.gain,
            startMs: backing.startMs,
            loop: backing.loop
          });
        } catch (error) {
          setStatus(error instanceof Error ? error.message : '伴奏加载失败。');
        }
      } else {
        audioEngine.stopBackingTrack(120);
      }

      let offset = 0;

      events.forEach((event, index) => {
        // 第一个音不提前；后续音符提前 LEGATO_OVERLAP_MS 启动，实现无缝衔接
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
        setStatus('旋律播放完毕。按键盘按键录入新的动机。');
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
    setStatus(`已从 ${motif.length || 4} 个动机音符生成 ${events.length} 个音符`);
    sendHardware('LED:GENERATE');
    void audioEngine.playClick();
    window.setTimeout(() => void playGeneratedMelody(events), 420);
  }, [audioEngine, motif, playGeneratedMelody, sendHardware, style]);

  const loadSelectedSoundPreset = useCallback(async () => {
    const preset = enabledSoundPresets.find((item) => item.id === selectedSoundPresetId);
    if (!preset) {
      setStatus('暂无可用音色预设。请在 public/sounds 目录添加音频文件并启用元数据。');
      return;
    }

    try {
      setStatus(`正在加载音色：${preset.name}`);
      if (preset.samples?.length) {
        await audioEngine.loadSampleSet(preset.samples);
      } else if (preset.file && preset.baseNote) {
        await audioEngine.loadSampleFromUrl(preset.file, {
          baseNote: preset.baseNote,
          baseSemitoneOffset: preset.baseSemitoneOffset,
          trimStartMs: preset.trimStartMs,
          trimEndMs: preset.trimEndMs,
          gain: preset.gain
        });
      } else {
        throw new Error(`音色预设缺少可播放样本：${preset.name}`);
      }

      setSampleReady(true);
      setStatus(`音色已加载：${preset.name}${preset.samples?.length ? `（${preset.samples.length} 层）` : ''}`);
      sendHardware('LED:RAINBOW');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '音色加载失败。');
    }
  }, [audioEngine, selectedSoundPresetId, sendHardware]);

  const playPresetMelody = useCallback(async () => {
    const preset = PRESET_MELODIES.find((item) => item.id === selectedPresetMelodyId);
    if (!preset) return;

    setStyle(preset.style);
    // 注意：不再用 setScaleRoot(preset.root)，预设调号只作为局部参数传入
    // 避免播完 F 调预设后全局 Key Root 被偷改，导致手动弹键都跑调
    const presetRoot = preset.root ?? scaleRoot;
    const presetBacking = preset.backingFile
      ? {
          file: preset.backingFile,
          gain: preset.backingGain,
          startMs: preset.backingStartMs,
          loop: preset.backingLoop
        }
      : undefined;

    // 有 bgmUrl：实时解析 BGM 提取旋律
    if (preset.bgmUrl) {
      if (isAnalysingBgm || isPlayingMelody) return;
      setIsAnalysingBgm(true);
      setBgmAnalysisProgress(0);
      setStatus(`正在解析 BGM：${preset.name}…`);
      try {
        const result = await analyseBgmFromUrl(
          preset.bgmUrl,
          (p) => setBgmAnalysisProgress(Math.round(p * 100))
        );
        if (!result.events.length) {
          setStatus('未能从 BGM 提取到有效旋律，将使用备用手写乐谱。');
          setMelody(preset.events);
          void playGeneratedMelody(preset.events, presetRoot, presetBacking);
          return;
        }
        setMelody(result.events);
        setStatus(`BGM 解析完成：${result.events.length} 个音符，调式根音 ${result.detectedRoot}`);
        void playGeneratedMelody(result.events, result.detectedRoot, presetBacking);
      } catch (err) {
        setStatus(err instanceof Error ? `BGM 解析失败：${err.message}` : 'BGM 解析出错，使用备用乐谱。');
        setMelody(preset.events);
        void playGeneratedMelody(preset.events, presetRoot, presetBacking);
      } finally {
        setIsAnalysingBgm(false);
        setBgmAnalysisProgress(0);
      }
      return;
    }

    // 无 bgmUrl：直接用手写乐谱
    setMelody(preset.events);
    setStatus(`预设旋律已加载：${preset.name}`);
    void playGeneratedMelody(preset.events, presetRoot, presetBacking);
  }, [isAnalysingBgm, isPlayingMelody, playGeneratedMelody, scaleRoot, selectedPresetMelodyId]);

  /** 处理用户上传 BGM 文件，自动提取主旋律并演奏 */
  const handleBgmFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // 重置 input，允许再次选择同一文件
      event.target.value = '';

      if (isAnalysingBgm || isPlayingMelody) return;

      setIsAnalysingBgm(true);
      setBgmAnalysisProgress(0);
      setStatus(`正在分析 BGM：${file.name}…`);

      try {
        const result = await analyseBgm(file, (p) => setBgmAnalysisProgress(Math.round(p * 100)));

        if (!result.events.length) {
          setStatus('未能从 BGM 中提取到有效旋律，请尝试旋律更清晰的音频。');
          return;
        }

        setMelody(result.events);
        setScaleRoot(result.detectedRoot);
        setStatus(
          `BGM 解析完成：提取到 ${result.events.length} 个音符，推测调式根音 ${result.detectedRoot}，正在演奏…`
        );

        void playGeneratedMelody(result.events, result.detectedRoot);
      } catch (err) {
        setStatus(err instanceof Error ? `BGM 分析失败：${err.message}` : 'BGM 分析出错，请检查文件格式。');
      } finally {
        setIsAnalysingBgm(false);
        setBgmAnalysisProgress(0);
      }
    },
    [isAnalysingBgm, isPlayingMelody, playGeneratedMelody]
  );

  /** 手动停止录音（用户点按钮或超时自动调用） */
  const stopRecording = useCallback(() => {
    if (recAutoStopRef.current !== null) {
      window.clearTimeout(recAutoStopRef.current);
      recAutoStopRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('当前浏览器无法访问麦克风。');
      return;
    }

    setIsRecording(true);
    setStatus('正在录制，说完请点「停止录制」…（最长 30 秒）');
    sendHardware('LED:REC');
    chunksRef.current = [];

    try {
      await audioEngine.ensureContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        // 清理自动停止 timer（若还未触发）
        if (recAutoStopRef.current !== null) {
          window.clearTimeout(recAutoStopRef.current);
          recAutoStopRef.current = null;
        }
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });

        try {
          const detected = await audioEngine.setSample(blob);
          setSampleReady(true);

          // 持久化到 IndexedDB，刷新后可恢复
          void saveSample(blob, detected).catch(() => undefined);

          if (detected) {
            const confPct = Math.round(detected.confidence * 100);
            setStatus(
              `样本已加载：${detected.trimmedDuration.toFixed(2)} 秒 · ` +
              `检测音高 ${detected.noteName}（${Math.round(detected.frequency)} Hz）· ` +
              `置信度 ${confPct}%`
            );
          } else {
            setStatus(`样本已加载：${audioEngine.getSampleDuration().toFixed(2)} 秒有效音频（音高未检出，按 C 处理）`);
          }

          sendHardware('LED:RAINBOW');
        } catch (error) {
          setStatus(error instanceof Error ? error.message : '录音解码失败。');
        } finally {
          setIsRecording(false);
        }
      };

      recorder.start();
      // 最长 30 秒自动停止兜底，用户说完可随时手动停
      recAutoStopRef.current = window.setTimeout(() => {
        recAutoStopRef.current = null;
        if (recorder.state !== 'inactive') recorder.stop();
      }, 30_000);
    } catch (error) {
      setIsRecording(false);
      setStatus(error instanceof Error ? error.message : '麦克风权限获取失败。');
      sendHardware('LED:OFF');
    }
  }, [audioEngine, isRecording, sendHardware]);

  const handleSerialLine = useCallback(
    (line: string) => {
      if (line.startsWith('NOTE:')) {
        const note = line.split(':')[1] as Note;
        if (noteByName.has(note)) void triggerNote(note);
        return;
      }

      if (line === 'REC') {
        void startRecording();
        return;
      }

      if (line === 'GENERATE') {
        handleGenerate();
      }
    },
    [handleGenerate, startRecording, triggerNote]
  );

  const serial = useSerialDevice({ onLine: handleSerialLine, onLog: appendLog });

  useEffect(() => {
    hardwareSendRef.current = (message: string) => {
      void serial.send(message);
    };
  }, [serial.send]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const definition = noteByKey.get(event.key);
      if (definition) {
        event.preventDefault();
        void triggerNote(definition.note);
      }

      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        void startRecording();
      }

      if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        handleGenerate();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleGenerate, startRecording, triggerNote]);

  useEffect(
    () => () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current = [];
      audioEngine.stopBackingTrack(0);
    },
    [audioEngine]
  );

  const waveformBars = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => {
        const seed = Math.sin(index * 1.7) + Math.cos(index * 0.43);
        const boost = sampleReady ? 22 : 7;
        return 18 + Math.abs(seed) * boost + (activeNote ? (index % 4) * 5 : 0);
      }),
    [activeNote, sampleReady]
  );

  return (
    <main className="app-shell">
      <section className="top-strip">
        <div>
          <p className="eyebrow">AI Builder MVP</p>
          <h1>精灵合奏台</h1>
        </div>
        <div className="status-pill">
          <span className={serial.isConnected ? 'dot dot-ok' : 'dot'} />
          {serial.isConnected ? 'ESP32 已连接' : '硬件可选'}
        </div>
      </section>

      <section className="workspace-grid">
        <aside className="tool-panel capture-panel">
          <div className="panel-heading">
            <Mic size={20} />
            <div>
              <h2>声音录制</h2>
              <p>用麦克风录制音色素材。</p>
            </div>
          </div>

          {isRecording ? (
            <button className="primary-action is-recording" type="button" onClick={stopRecording}>
              <CircleStop size={20} />
              停止录制
            </button>
          ) : (
            <button className="primary-action" type="button" onClick={() => void startRecording()}>
              <Mic size={20} />
              {sampleReady ? '重新录制' : '录制声音'}
            </button>
          )}

          <div className="content-loader">
            <div className="panel-heading compact">
              <Library size={18} />
              <div>
                <h2>音色库</h2>
                <p>{enabledSoundPresets.length ? '加载团队预制音色。' : '等待队友提供音频文件。'}</p>
              </div>
            </div>
            <select
              value={selectedSoundPresetId}
              onChange={(event) => setSelectedSoundPresetId(event.target.value)}
              disabled={!enabledSoundPresets.length}
            >
              {enabledSoundPresets.length ? (
                enabledSoundPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))
              ) : (
                <option>暂无可用预设</option>
              )}
            </select>
            <button type="button" className="small-action" onClick={loadSelectedSoundPreset} disabled={!enabledSoundPresets.length}>
              加载音色
            </button>
          </div>

          <div className="meter" aria-label="sample status">
            {waveformBars.map((height, index) => (
              <span key={index} style={{ height: `${height}px` }} />
            ))}
          </div>

          <div className="mini-specs">
            <div>
              <strong>{sampleReady ? '样本已就绪' : '备用音色'}</strong>
              <span>来源</span>
            </div>
            <div>
              <strong>7 个音符</strong>
              <span>音阶</span>
            </div>
          </div>
        </aside>

        <section className="stage-panel" aria-label="instrument stage">
          <div className="stage-orbit" style={{ '--note-color': activeNote ? noteColor(activeNote) : '#20c7c7' } as React.CSSProperties}>
            <img className="sprite" src="/sound-sprite.svg" alt="精灵吉祥物" />
            <div className="note-badge">{activeNote ?? '待机'}</div>
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
                <strong>{definition.label}</strong>
                <em>{definition.key}</em>
              </button>
            ))}
          </div>
        </section>

        <aside className="tool-panel hardware-panel">
          <div className="panel-heading">
            <Cpu size={20} />
            <div>
              <h2>硬件控制</h2>
              <p>ESP32 按钮输入，LED 指令输出。</p>
            </div>
          </div>

          <button
            className="secondary-action"
            type="button"
            onClick={() => (serial.isConnected ? void serial.disconnect() : void serial.connect())}
            disabled={!serial.isSupported}
          >
            <Cable size={19} />
            {serial.isConnected ? '断开连接' : '连接硬件'}
          </button>

          <div className="hardware-map">
            <span>GPIO4-10</span>
            <strong>音符</strong>
            <span>GPIO12</span>
            <strong>录音</strong>
            <span>GPIO13</span>
            <strong>生成</strong>
            <span>GPIO11</span>
            <strong>灯光</strong>
          </div>

          <div className="serial-box">
            {serialLog.map((line) => (
              <p key={`${line.at}-${line.message}`}>
                <span>{line.direction}</span>
                {line.message}
              </p>
            ))}
          </div>
        </aside>
      </section>

      <section className="composer-strip">
        <div className="motif-readout">
          <div className="panel-heading compact">
            <Waves size={20} />
            <div>
              <h2>音乐动机</h2>
              <p>{motif.length ? motif.join(' - ') : '按 2~8 个音符作为生成器的种子。'}</p>
            </div>
          </div>
        </div>

        <label className="tuning-picker">
          <span>
            <SlidersHorizontal size={16} />
            调式根音
          </span>
          <select value={scaleRoot} onChange={(event) => setScaleRoot(event.target.value as Note)}>
            {NOTES.map((definition) => (
              <option key={definition.note} value={definition.note}>
                {definition.label}
              </option>
            ))}
          </select>
        </label>

        <div className="preset-picker">
          <select value={selectedPresetMelodyId} onChange={(event) => setSelectedPresetMelodyId(event.target.value)}>
            {PRESET_MELODIES.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <button className="small-action" type="button" onClick={() => void playPresetMelody()} disabled={isPlayingMelody || isAnalysingBgm}>
            {isAnalysingBgm && PRESET_MELODIES.find(p => p.id === selectedPresetMelodyId)?.bgmUrl ? (
              <><Loader size={17} className="spin" />{`解析中 ${bgmAnalysisProgress}%`}</>
            ) : (
              <><ListMusic size={17} />播放预设</>
            )}
          </button>
        </div>

        <div className="bgm-analyser">
          <label
            className={`small-action bgm-upload-label ${isAnalysingBgm || isPlayingMelody ? 'disabled' : ''}`}
            title="上传 BGM 音频文件，自动提取主旋律并用精灵声音演奏"
          >
            {isAnalysingBgm ? (
              <>
                <Loader size={17} className="spin" />
                {`分析中 ${bgmAnalysisProgress}%`}
              </>
            ) : (
              <>
                <FileMusic size={17} />
                解析 BGM 旋律
              </>
            )}
            <input
              type="file"
              accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm"
              style={{ display: 'none' }}
              onChange={handleBgmFileUpload}
              disabled={isAnalysingBgm || isPlayingMelody}
            />
          </label>
          {isAnalysingBgm && (
            <div className="bgm-progress-bar">
              <div className="bgm-progress-fill" style={{ width: `${bgmAnalysisProgress}%` }} />
            </div>
          )}
        </div>

        <button className="generate-action" type="button" onClick={handleGenerate} disabled={isPlayingMelody}>
          {isPlayingMelody ? <RadioTower size={20} /> : <Sparkles size={20} />}
          {isPlayingMelody ? '演奏中…' : '生成旋律'}
        </button>
      </section>

      <section className="bottom-status">
        <div>
          <Zap size={18} />
          <span>{status}</span>
        </div>
        <div>
          <Music2 size={18} />
          <span>
            {melody.length
              ? `${melody.length} 个音符 / ${Math.round(melodyDuration(melody) / 1000)} 秒 / 根音 ${scaleRoot}`
              : `尚未生成旋律 / 根音 ${scaleRoot}`}
          </span>
        </div>
        <div>
          <Play size={18} />
          <span>键盘快捷键：1-7 弹音符，R 录音，G 生成旋律</span>
        </div>
      </section>
    </main>
  );
}

export default App;
