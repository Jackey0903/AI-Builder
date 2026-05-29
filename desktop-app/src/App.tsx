import { Cable, CircleStop, Cpu, Library, ListMusic, Mic, Music2, Play, RadioTower, Sparkles, Waves, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioEngine, noteColor } from './audio/audioEngine';
import { generateMelody, melodyDuration } from './audio/melody';
import { enabledSoundPresets } from './content/soundLibrary';
import { PRESET_MELODIES } from './content/presetMelodies';
import { NOTES, noteByKey, noteByName } from './data/notes';
import { useSerialDevice } from './hooks/useSerialDevice';
import type { MelodyEvent, MelodyStyle, Note, SerialLine } from './types';

const MAX_MOTIF = 8;
const RECORD_MS = 4200;
const firstSoundPresetId = enabledSoundPresets[0]?.id ?? '';
const firstPresetMelodyId = PRESET_MELODIES[0]?.id ?? '';

const statusCopy: Record<MelodyStyle, string> = {
  bright: 'Bright toy march',
  soft: 'Soft lullaby',
  electro: 'Electro pulse'
};

function App() {
  const audioEngine = useMemo(() => new AudioEngine(), []);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingMelody, setIsPlayingMelody] = useState(false);
  const [sampleReady, setSampleReady] = useState(false);
  const [status, setStatus] = useState('Ready. Record a sound or play the fallback tone set.');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [motif, setMotif] = useState<Note[]>([]);
  const [style, setStyle] = useState<MelodyStyle>('bright');
  const [melody, setMelody] = useState<MelodyEvent[]>([]);
  const [selectedSoundPresetId, setSelectedSoundPresetId] = useState(firstSoundPresetId);
  const [selectedPresetMelodyId, setSelectedPresetMelodyId] = useState(firstPresetMelodyId);
  const [serialLog, setSerialLog] = useState<SerialLine[]>([
    { direction: 'system', message: 'desktop app started', at: Date.now() }
  ]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutsRef = useRef<number[]>([]);
  const hardwareSendRef = useRef<(message: string) => void>(() => undefined);

  const appendLog = useCallback((line: SerialLine) => {
    setSerialLog((current) => [line, ...current].slice(0, 12));
  }, []);

  const sendHardware = useCallback((message: string) => {
    hardwareSendRef.current(message);
  }, []);

  const triggerNote = useCallback(
    async (note: Note, options: { captureMotif?: boolean; durationMs?: number; velocity?: number } = {}) => {
      const { captureMotif = true, durationMs = 520, velocity = 1 } = options;
      setActiveNote(note);
      setStatus(`${noteByName.get(note)?.solfege ?? note} triggered`);
      await audioEngine.playNote(note, durationMs, velocity);
      sendHardware(`LED:NOTE:${note}`);

      if (captureMotif) {
        setMotif((current) => [...current.slice(-(MAX_MOTIF - 1)), note]);
      }

      window.setTimeout(() => {
        setActiveNote((current) => (current === note ? null : current));
      }, Math.min(durationMs, 540));
    },
    [audioEngine, sendHardware]
  );

  const playGeneratedMelody = useCallback(
    async (events: MelodyEvent[]) => {
      if (!events.length || isPlayingMelody) return;

      setIsPlayingMelody(true);
      setStatus(`Playing ${Math.round(melodyDuration(events) / 1000)}s melody`);
      sendHardware('LED:PLAY');

      let offset = 0;

      events.forEach((event) => {
        const timeoutId = window.setTimeout(() => {
          void triggerNote(event.note, {
            captureMotif: false,
            durationMs: event.durationMs,
            velocity: event.velocity
          });
        }, offset);

        timeoutsRef.current.push(timeoutId);
        offset += event.durationMs;
      });

      const doneTimeout = window.setTimeout(() => {
        setIsPlayingMelody(false);
        setActiveNote(null);
        setStatus('Melody finished. Press keys to build a new motif.');
        sendHardware('LED:OFF');
      }, offset + 80);

      timeoutsRef.current.push(doneTimeout);
    },
    [isPlayingMelody, sendHardware, triggerNote]
  );

  const handleGenerate = useCallback(() => {
    const events = generateMelody(motif, style);
    setMelody(events);
    setStatus(`Generated ${events.length} notes from ${motif.length || 4} motif notes`);
    sendHardware('LED:GENERATE');
    void audioEngine.playClick();
    window.setTimeout(() => void playGeneratedMelody(events), 420);
  }, [audioEngine, motif, playGeneratedMelody, sendHardware, style]);

  const loadSelectedSoundPreset = useCallback(async () => {
    const preset = enabledSoundPresets.find((item) => item.id === selectedSoundPresetId);
    if (!preset) {
      setStatus('No enabled sound preset yet. Add files in public/sounds and enable metadata.');
      return;
    }

    try {
      await audioEngine.loadSampleFromUrl(preset.file, {
        baseNote: preset.baseNote,
        trimStartMs: preset.trimStartMs,
        trimEndMs: preset.trimEndMs,
        gain: preset.gain
      });
      setSampleReady(true);
      setStatus(`Loaded preset: ${preset.name}`);
      sendHardware('LED:RAINBOW');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to load preset sound.');
    }
  }, [audioEngine, selectedSoundPresetId, sendHardware]);

  const playPresetMelody = useCallback(() => {
    const preset = PRESET_MELODIES.find((item) => item.id === selectedPresetMelodyId);
    if (!preset) return;

    setStyle(preset.style);
    setMelody(preset.events);
    setStatus(`Loaded preset melody: ${preset.name}`);
    void playGeneratedMelody(preset.events);
  }, [playGeneratedMelody, selectedPresetMelodyId]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('This browser cannot access a microphone.');
      return;
    }

    setIsRecording(true);
    setStatus('Recording 4 seconds from computer microphone...');
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
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });

        try {
          await audioEngine.setSample(blob);
          setSampleReady(true);
          setStatus(`Sample loaded: ${audioEngine.getSampleDuration().toFixed(2)}s trimmed sound`);
          sendHardware('LED:RAINBOW');
        } catch (error) {
          setStatus(error instanceof Error ? error.message : 'Failed to decode recording.');
        } finally {
          setIsRecording(false);
        }
      };

      recorder.start();
      window.setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, RECORD_MS);
    } catch (error) {
      setIsRecording(false);
      setStatus(error instanceof Error ? error.message : 'Microphone permission failed.');
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
    },
    []
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
          <h1>Sound Sprite Console</h1>
        </div>
        <div className="status-pill">
          <span className={serial.isConnected ? 'dot dot-ok' : 'dot'} />
          {serial.isConnected ? 'ESP32 connected' : 'Hardware optional'}
        </div>
      </section>

      <section className="workspace-grid">
        <aside className="tool-panel capture-panel">
          <div className="panel-heading">
            <Mic size={20} />
            <div>
              <h2>Capture</h2>
              <p>Computer mic becomes the source timbre.</p>
            </div>
          </div>

          <button className="primary-action" type="button" onClick={() => void startRecording()} disabled={isRecording}>
            {isRecording ? <CircleStop size={20} /> : <Mic size={20} />}
            {isRecording ? 'Recording...' : sampleReady ? 'Record Again' : 'Record Sound'}
          </button>

          <div className="content-loader">
            <div className="panel-heading compact">
              <Library size={18} />
              <div>
                <h2>Sound Library</h2>
                <p>{enabledSoundPresets.length ? 'Load a prepared team sample.' : 'Waiting for teammate audio files.'}</p>
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
                <option>No enabled presets</option>
              )}
            </select>
            <button type="button" className="small-action" onClick={() => void loadSelectedSoundPreset()} disabled={!enabledSoundPresets.length}>
              Load Preset
            </button>
          </div>

          <div className="meter" aria-label="sample status">
            {waveformBars.map((height, index) => (
              <span key={index} style={{ height: `${height}px` }} />
            ))}
          </div>

          <div className="mini-specs">
            <div>
              <strong>{sampleReady ? 'Sample ready' : 'Fallback tone'}</strong>
              <span>Source</span>
            </div>
            <div>
              <strong>7 notes</strong>
              <span>Scale</span>
            </div>
          </div>
        </aside>

        <section className="stage-panel" aria-label="instrument stage">
          <div className="stage-orbit" style={{ '--note-color': activeNote ? noteColor(activeNote) : '#20c7c7' } as React.CSSProperties}>
            <img className="sprite" src="/sound-sprite.svg" alt="Original sound sprite mascot" />
            <div className="note-badge">{activeNote ?? 'IDLE'}</div>
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
              <h2>Hardware</h2>
              <p>ESP32 buttons in, LED commands out.</p>
            </div>
          </div>

          <button
            className="secondary-action"
            type="button"
            onClick={() => (serial.isConnected ? void serial.disconnect() : void serial.connect())}
            disabled={!serial.isSupported}
          >
            <Cable size={19} />
            {serial.isConnected ? 'Disconnect' : 'Connect Hardware'}
          </button>

          <div className="hardware-map">
            <span>GPIO4-10</span>
            <strong>Notes</strong>
            <span>GPIO12</span>
            <strong>REC</strong>
            <span>GPIO13</span>
            <strong>GEN</strong>
            <span>GPIO11</span>
            <strong>LED</strong>
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
              <h2>Motif</h2>
              <p>{motif.length ? motif.join(' - ') : 'Play 2-8 notes to seed the generator.'}</p>
            </div>
          </div>
          <button className="icon-action" type="button" onClick={() => setMotif([])} aria-label="clear motif">
            Clear
          </button>
        </div>

        <div className="style-switcher" aria-label="melody style">
          {(['bright', 'soft', 'electro'] as MelodyStyle[]).map((item) => (
            <button key={item} className={style === item ? 'selected' : ''} type="button" onClick={() => setStyle(item)}>
              {statusCopy[item]}
            </button>
          ))}
        </div>

        <div className="preset-picker">
          <select value={selectedPresetMelodyId} onChange={(event) => setSelectedPresetMelodyId(event.target.value)}>
            {PRESET_MELODIES.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <button className="small-action" type="button" onClick={playPresetMelody} disabled={isPlayingMelody}>
            <ListMusic size={17} />
            Play Preset
          </button>
        </div>

        <button className="generate-action" type="button" onClick={handleGenerate} disabled={isPlayingMelody}>
          {isPlayingMelody ? <RadioTower size={20} /> : <Sparkles size={20} />}
          {isPlayingMelody ? 'Playing Melody' : 'Generate Melody'}
        </button>
      </section>

      <section className="bottom-status">
        <div>
          <Zap size={18} />
          <span>{status}</span>
        </div>
        <div>
          <Music2 size={18} />
          <span>{melody.length ? `${melody.length} notes / ${Math.round(melodyDuration(melody) / 1000)}s` : 'No melody generated yet'}</span>
        </div>
        <div>
          <Play size={18} />
          <span>Keyboard: 1-7 notes, R record, G generate</span>
        </div>
      </section>
    </main>
  );
}

export default App;
